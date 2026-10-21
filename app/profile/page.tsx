"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import SetupNotice from "@/components/SetupNotice";
import { useAuth } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";
import { BLOOD_GROUPS, bn, currentMonthKey, errorMessage, fmtDate, fmtMonth, monthStart, taka } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

const PAY_NOTE = process.env.NEXT_PUBLIC_PAYMENT_NOTE;

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function ProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, ready } = useAuth();
  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p] = await Promise.all([
      sb.from("members").select("*").maybeSingle(),
      sb.from("payments").select("*").order("month", { ascending: false }),
    ]);
    setMember((m.data as Member | null) ?? null);
    setPayments((p.data as Payment[]) ?? []);
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  if (!isConfigured) return <SetupNotice />;
  if (!ready) return <p className="text-muted">লোড হচ্ছে…</p>;

  if (!user) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <h1 className="text-2xl">আমার প্রোফাইল</h1>
        <p className="mt-2 text-muted">নিজের তথ্য, ছবি ও চাঁদার হিসাব দেখতে লগইন করুন।</p>
        <div className="mt-5 flex flex-col gap-3">
          <Link href="/login" className="btn btn-primary py-3 text-lg">লগইন করুন</Link>
          <Link href="/join" className="btn btn-ghost py-3 text-lg">নতুন অ্যাকাউন্ট খুলুন</Link>
        </div>
      </div>
    );
  }

  if (member === undefined) return <p className="text-muted">লোড হচ্ছে…</p>;

  if (member === null) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-bold">এই অ্যাকাউন্টের সাথে কোনো সদস্য প্রোফাইল যুক্ত নেই</p>
        <p className="mt-2 text-muted">আপনি অ্যাডমিন হলে অ্যাডমিন প্যানেলে যান।</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/admin" className="btn btn-primary">অ্যাডমিন প্যানেল</Link>
          <button onClick={logout} className="btn btn-ghost">লগআউট</button>
        </div>
      </div>
    );
  }

  const m = member;
  const key = currentMonthKey();
  const due = dueFor(m, payments, key);
  const paidSet = new Set(payments.map((p) => p.month.slice(0, 7)));
  const joinKey = m.joined_on.slice(0, 7);

  async function logout() {
    await browserClient().auth.signOut();
    router.push("/");
  }

  async function setPhoto(url: string) {
    const { error } = await browserClient().from("members").update({ photo_url: url || null }).eq("id", m.id);
    if (error) return setMsg(errorMessage(error));
    setMsg(url ? "ছবি সংরক্ষিত হয়েছে" : "ছবি সরানো হয়েছে");
    await load();
  }

  async function save(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const t = (k: string) => String(f.get(k) ?? "").trim() || null;
    setSaving(true);
    const { error } = await browserClient()
      .from("members")
      .update({
        name: String(f.get("name") ?? "").trim() || m.name,
        father_name: t("father_name"),
        dob: t("dob"),
        address: t("address"),
        profession: t("profession"),
        education: t("education"),
        email: t("email"),
        blood_group: t("blood_group"),
        last_blood_donation: t("last_blood_donation"),
        show_in_blood_list: f.get("show_in_blood_list") === "on",
        about: t("about"),
      })
      .eq("id", m.id);
    setSaving(false);
    setMsg(error ? errorMessage(error) : "তথ্য সংরক্ষিত হয়েছে");
    await load();
  }

  async function changePassword(ev: React.FormEvent) {
    ev.preventDefault();
    if (pw.length < 6) return setMsg("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    const { error } = await browserClient().auth.updateUser({ password: pw });
    setMsg(error ? errorMessage(error) : "পাসওয়ার্ড বদলানো হয়েছে");
    if (!error) setPw("");
  }

  const statusBadge =
    m.status === "active" ? { t: "সক্রিয় সদস্য", c: "bg-brand-soft text-brand-dark" }
    : m.status === "pending" ? { t: "অনুমোদনের অপেক্ষায়", c: "bg-accent-soft text-[#8a5a00]" }
    : { t: "নিষ্ক্রিয়", c: "bg-line text-muted" };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {params.get("new") && (
        <div className="card border-brand/40 bg-brand-soft">
          <p className="font-bold text-brand-dark">অ্যাকাউন্ট খোলা হয়েছে, ধন্যবাদ!</p>
          <p className="text-muted">সংগঠনের দায়িত্বশীল আপনার তথ্য দেখে সদস্যপদ অনুমোদন করবেন। এর মধ্যে নিচে প্রোফাইল ছবি দিয়ে রাখতে পারেন।</p>
        </div>
      )}

      <section className="card flex flex-col items-center gap-3 text-center">
        <ImageUpload avatar name={m.name} value={m.photo_url ?? ""} onChange={setPhoto} folder={`avatars/${user.id}`} maxSide={640} />
        <div>
          <h1 className="text-2xl">{m.name}</h1>
          <p className="text-muted">{bn(m.phone)}</p>
          <span className={`badge mt-1 ${statusBadge.c}`}>{statusBadge.t}</span>
        </div>
        {m.status === "pending" && <p className="text-sm text-muted">আপনার আবেদন যাচাইয়ের অপেক্ষায় আছে। অনুমোদন হলে এখানে চাঁদার হিসাব দেখা যাবে।</p>}
      </section>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 text-center font-medium">{msg}</p>}

      {m.status === "active" && (
        <section className="card space-y-4">
          <h2 className="text-xl">আমার চাঁদার হিসাব</h2>
          <p className="text-muted">মাসিক চাঁদা: <b className="text-ink">{taka(m.monthly_fee)}</b> • যোগদান: {fmtDate(m.joined_on)}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-brand-soft p-3"><p className="text-2xl font-bold text-brand">{bn(due.paid)}</p><p className="text-xs text-muted">মাস পরিশোধ</p></div>
            <div className="rounded-2xl bg-accent-soft p-3"><p className="text-2xl font-bold">{bn(due.due)}</p><p className="text-xs text-muted">মাস বাকি</p></div>
            <div className="rounded-2xl bg-blood/10 p-3"><p className="text-xl font-bold text-blood">{taka(due.amount)}</p><p className="text-xs text-muted">মোট বকেয়া</p></div>
          </div>
          {due.due === 0 ? (
            <p className="font-semibold text-brand">আপনার কোনো বকেয়া নেই। সংগঠনের পাশে থাকার জন্য ধন্যবাদ!</p>
          ) : (
            PAY_NOTE && <p className="rounded-2xl bg-paper p-3 text-sm">{PAY_NOTE}</p>
          )}
          <div>
            <p className="label">গত ১২ মাস</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {lastMonths(12).filter((k) => k >= joinKey).map((k) => {
                const paid = paidSet.has(k);
                return (
                  <div key={k} className={`rounded-xl px-2 py-1.5 text-center text-sm font-medium ${paid ? "bg-brand-soft text-brand-dark" : "bg-blood/10 text-blood"}`}>
                    {fmtMonth(monthStart(k))}
                    <span className="block text-xs">{paid ? "✓ পরিশোধ" : "বাকি"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <form onSubmit={save} className="card space-y-4">
        <h2 className="text-xl">আমার তথ্য</h2>
        <div>
          <label className="label" htmlFor="name">নাম</label>
          <input id="name" name="name" defaultValue={m.name} required className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="father_name">পিতার নাম</label><input id="father_name" name="father_name" defaultValue={m.father_name ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="dob">জন্মতারিখ</label><input id="dob" name="dob" type="date" defaultValue={m.dob ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="education">শিক্ষাগত যোগ্যতা</label><input id="education" name="education" defaultValue={m.education ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="profession">পেশা</label><input id="profession" name="profession" defaultValue={m.profession ?? ""} className="input" /></div>
        </div>
        <div><label className="label" htmlFor="address">ঠিকানা</label><input id="address" name="address" defaultValue={m.address ?? ""} className="input" /></div>
        <div><label className="label" htmlFor="email">ইমেইল</label><input id="email" name="email" type="email" defaultValue={m.email ?? ""} className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="blood_group">রক্তের গ্রুপ</label>
            <select id="blood_group" name="blood_group" defaultValue={m.blood_group ?? ""} className="input">
              <option value="">জানি না / বলতে চাই না</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="last_blood_donation">শেষ রক্তদান</label><input id="last_blood_donation" name="last_blood_donation" type="date" defaultValue={m.last_blood_donation ?? ""} className="input" /></div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl bg-brand-soft p-3 text-sm">
          <input type="checkbox" name="show_in_blood_list" defaultChecked={m.show_in_blood_list} className="mt-1 h-5 w-5 accent-[#3f86bd]" />
          <span>জরুরি প্রয়োজনে রক্তদাতা তালিকায় আমার নাম ও ফোন নম্বর দেখানো যেতে পারে।</span>
        </label>
        <div><label className="label" htmlFor="about">আমার সম্পর্কে (ঐচ্ছিক)</label><textarea id="about" name="about" rows={3} defaultValue={m.about ?? ""} className="input" /></div>
        <button disabled={saving} className="btn btn-primary w-full py-3 text-lg">{saving ? "সংরক্ষণ হচ্ছে…" : "তথ্য সংরক্ষণ করুন"}</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-3">
        <h2 className="text-xl">পাসওয়ার্ড বদলান</h2>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" autoComplete="new-password" className="input" />
        <button className="btn btn-ghost">পাসওয়ার্ড বদলান</button>
      </form>

      <button onClick={logout} className="btn btn-danger w-full py-3">লগআউট</button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="text-muted">লোড হচ্ছে…</p>}>
      <ProfileInner />
    </Suspense>
  );
}
