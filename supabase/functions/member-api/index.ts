import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const phoneOk = (p: string) => /^01[3-9]\d{8}$/.test(p);
const emailFor = (phone: string) => `${phone}@members.gdajs.app`;
const clean = (v: unknown, max = 200) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s === "" ? null : s;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // নতুন সদস্য নিবন্ধন (ফোন + পাসওয়ার্ড)
  if (body.action === "register") {
    if (body.website) return json({ ok: true }); // বট ফাঁদ
    const name = clean(body.name, 100);
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");
    if (!name) return json({ error: "name_required" }, 400);
    if (!phoneOk(phone)) return json({ error: "phone_invalid" }, 400);
    if (password.length < 6 || password.length > 72) return json({ error: "password_short" }, 400);

    const blood = clean(body.blood_group, 4);
    if (blood && !BLOOD.includes(blood)) return json({ error: "blood_invalid" }, 400);
    const dob = clean(body.dob, 10);
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return json({ error: "dob_invalid" }, 400);
    const last = clean(body.last_blood_donation, 10);
    if (last && !/^\d{4}-\d{2}-\d{2}$/.test(last)) return json({ error: "date_invalid" }, 400);

    const { count: pending } = await admin.from("members").select("id", { count: "exact", head: true }).eq("status", "pending");
    if ((pending ?? 0) >= 300) return json({ error: "busy" }, 429);

    const { data: existing } = await admin.from("members").select("id,user_id").eq("phone", phone).maybeSingle();
    if (existing) return json({ error: "phone_exists" }, 409);

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: emailFor(phone),
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });
    if (cErr || !created?.user) {
      const msg = String(cErr?.message ?? "");
      return json({ error: /already|registered|exists/i.test(msg) ? "phone_exists" : "create_failed" }, 409);
    }

    const { error: iErr } = await admin.from("members").insert({
      user_id: created.user.id,
      name,
      phone,
      father_name: clean(body.father_name, 100),
      dob,
      address: clean(body.address, 200),
      profession: clean(body.profession, 100),
      education: clean(body.education, 100),
      email: clean(body.email, 120),
      blood_group: blood,
      last_blood_donation: last,
      show_in_blood_list: body.show_in_blood_list !== false,
      status: "pending",
    });
    if (iErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: "save_failed" }, 500);
    }
    return json({ ok: true });
  }

  // শুধু অ্যাডমিনের কাজ
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: isAdmin } = await admin.from("admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
  if (!isAdmin) return json({ error: "forbidden" }, 403);

  // সদস্যের পাসওয়ার্ড সেট/রিসেট; অ্যাকাউন্ট না থাকলে খুলে দেয়
  if (body.action === "set_password") {
    const memberId = String(body.member_id ?? "");
    const password = String(body.password ?? "");
    if (password.length < 6 || password.length > 72) return json({ error: "password_short" }, 400);
    const { data: m } = await admin.from("members").select("id,phone,name,user_id").eq("id", memberId).maybeSingle();
    if (!m) return json({ error: "not_found" }, 404);

    if (m.user_id) {
      const { error } = await admin.auth.admin.updateUserById(m.user_id, { password });
      if (error) return json({ error: "update_failed" }, 500);
      return json({ ok: true, created: false });
    }
    const { data: created, error } = await admin.auth.admin.createUser({
      email: emailFor(m.phone),
      password,
      email_confirm: true,
      user_metadata: { name: m.name, phone: m.phone },
    });
    if (error || !created?.user) return json({ error: "create_failed" }, 500);
    await admin.from("members").update({ user_id: created.user.id }).eq("id", m.id);
    return json({ ok: true, created: true });
  }

  // সদস্য মুছলে তার লগইনও মুছে দেয়
  if (body.action === "delete_account") {
    const memberId = String(body.member_id ?? "");
    const { data: m } = await admin.from("members").select("id,user_id").eq("id", memberId).maybeSingle();
    if (!m) return json({ error: "not_found" }, 404);
    await admin.from("members").delete().eq("id", m.id);
    if (m.user_id) await admin.auth.admin.deleteUser(m.user_id);
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
});
