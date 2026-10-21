"use client";

import { ListSkeleton } from "@/components/Skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { callMemberApi } from "@/lib/auth";
import { browserClient } from "@/lib/supabase";
import { BLOOD_GROUPS, bn, currentMonthKey, en, errorMessage, fmtDate, fmtMonth, monthStart, taka, waLink } from "@/lib/bn";
import { dueFor, monthsExpected } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

const statusLabel = { pending: "নতুন আবেদন", active: "সক্রিয় সদস্য", inactive: "নিষ্ক্রিয়" } as const;
const statusColor = { pending: "bg-accent-soft text-[#8a5a00]", active: "bg-brand-soft text-brand-dark", inactive: "bg-line text-muted" } as const;

function monthKeys(joinedOn: string, upTo: string): string[] {
  const n = monthsExpected(joinedOn, upTo);
  const [ty, tm] = upTo.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(ty, tm - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [m, setM] = useState<Member | null | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [a, b] = await Promise.all([
      sb.from("members").select("*").eq("id", id).maybeSingle(),
      sb.from("payments").select("*").eq("member_id", id).order("month", { ascending: false }),
    ]);
    setM((a.data as Member | null) ?? null);
    setPayments((b.data as Payment[]) ?? []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (m === undefined) return <ListSkeleton />;
  if (m === null) {
    return (
      <div className="card">
        <p>সদস্য পাওয়া যায়নি।</p>
        <Link href="/admin/members" className="btn btn-primary mt-3">সদস্য তালিকায় ফিরুন</Link>
      </div>
    );
  }
  const member = m;

  const key = currentMonthKey();
  const due = dueFor(member, payments, key);
  const paidMap = new Map(payments.map((p) => [p.month.slice(0, 7), p]));

  async function setStatus(status: Member["status"], extra: Partial<Member> = {}) {
    const { error } = await browserClient().from("members").update({ status, ...extra }).eq("id", member.id);
    setMsg(error ? errorMessage(error) : "সংরক্ষিত হয়েছে");
    await load();
  }

  async function approve() {
    const input = window.prompt(`${member.name}-এর মাসিক চাঁদা কত টাকা?`, String(member.monthly_fee));
    if (input === null) return;
    const fee = Number(en(input));
    if (!Number.isFinite(fee) || fee < 0) return setMsg("চাঁদার পরিমাণ সঠিক নয়");
    await setStatus("active", { monthly_fee: fee, joined_on: new Date().toISOString().slice(0, 10) });
  }

  async function save(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const t = (k: string) => String(f.get(k) ?? "").trim() || null;
    setSaving(true);
    const { error } = await browserClient()
      .from("members")
      .update({
        name: String(f.get("name") ?? "").trim() || member.name,
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
        monthly_fee: Number(en(String(f.get("monthly_fee") ?? ""))) || member.monthly_fee,
        joined_on: t("joined_on") ?? member.joined_on,
      })
      .eq("id", member.id);
    setSaving(false);
    setMsg(error ? errorMessage(error) : "সংরক্ষিত হয়েছে");
    await load();
  }

  async function markPaid(k: string) {
    const { error } = await browserClient().from("payments").insert({ member_id: member.id, month: monthStart(k), amount: member.monthly_fee, method: "ক্যাশ" });
    if (error) return setMsg(errorMessage(error));
    setMsg("");
    await load();
  }

  async function unpay(p: Payment) {
    if (!window.confirm("এই মাসের পেমেন্ট রেকর্ড বাতিল করবেন?")) return;
    const { error } = await browserClient().from("payments").delete().eq("id", p.id);
    if (error) return setMsg(errorMessage(error));
    await load();
  }

  async function setPassword(ev: React.FormEvent) {
    ev.preventDefault();
    if (pw.length < 6) return setMsg("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    const res = await callMemberApi({ action: "set_password", member_id: member.id, password: pw });
    if (!res.ok) return setMsg(res.message);
    setMsg(res.created ? "লগইন চালু হয়েছে। সদস্যকে মোবাইল নম্বর ও এই পাসওয়ার্ড জানিয়ে দিন।" : "নতুন পাসওয়ার্ড সেট হয়েছে। সদস্যকে জানিয়ে দিন।");
    setPw("");
    await load();
  }

  async function remove() {
    if (!window.confirm(`${member.name}-কে সম্পূর্ণ মুছে ফেলবেন? তার সব চাঁদার রেকর্ড ও লগইনও মুছে যাবে। এটা ফেরানো যাবে না।`)) return;
    if (member.user_id) {
      const res = await callMemberApi({ action: "delete_account", member_id: member.id });
      if (!res.ok) return setMsg(res.message);
    } else {
      const { error } = await browserClient().from("members").delete().eq("id", member.id);
      if (error) return setMsg(errorMessage(error));
    }
    router.push("/admin/members");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/members" className="text-sm font-semibold text-brand hover:underline">← সদস্য তালিকা</Link>

      <section className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar src={member.photo_url} name={member.name} size={96} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl">{member.name}</h1>
          <p className="text-muted">{bn(member.phone)}{member.blood_group ? ` • রক্ত ${member.blood_group}` : ""}</p>
          <p className="text-sm text-muted">আবেদন/যোগদান: {fmtDate(member.joined_on)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`badge ${statusColor[member.status]}`}>{statusLabel[member.status]}</span>
            <span className={`badge ${member.user_id ? "bg-sky-soft text-brand-dark" : "bg-line text-muted"}`}>{member.user_id ? "লগইন আছে" : "লগইন নেই"}</span>
            {member.is_demo && <span className="badge bg-accent-soft text-[#8a5a00]">ডেমো</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col">
          <a href={`tel:${member.phone}`} className="btn btn-primary btn-sm">কল করুন</a>
          <a href={waLink(member.phone, `আসসালামু আলাইকুম ${member.name}, গোদনাইল আলোকিত যুব শক্তি থেকে বলছি।`)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">হোয়াটসঅ্যাপ</a>
        </div>
      </section>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      <section className="card space-y-3">
        <h2 className="text-lg">সদস্যপদ</h2>
        <div className="flex flex-wrap gap-2">
          {member.status !== "active" && <button onClick={member.status === "pending" ? approve : () => setStatus("active")} className="btn btn-primary">{member.status === "pending" ? "আবেদন অনুমোদন করুন" : "সক্রিয় করুন"}</button>}
          {member.status === "active" && <button onClick={() => setStatus("inactive")} className="btn btn-ghost">নিষ্ক্রিয় করুন</button>}
          {member.status === "pending" && <button onClick={() => setStatus("inactive")} className="btn btn-ghost">আবেদন বাতিল</button>}
        </div>
      </section>

      <form onSubmit={save} key={member.id + String(member.photo_url) + member.status} className="card space-y-4">
        <h2 className="text-lg">সম্পূর্ণ তথ্য (সম্পাদনা করা যাবে)</h2>
        <div><label className="label" htmlFor="name">নাম</label><input id="name" name="name" defaultValue={member.name} required className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="father_name">পিতার নাম</label><input id="father_name" name="father_name" defaultValue={member.father_name ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="dob">জন্মতারিখ</label><input id="dob" name="dob" type="date" defaultValue={member.dob ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="education">শিক্ষাগত যোগ্যতা</label><input id="education" name="education" defaultValue={member.education ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="profession">পেশা</label><input id="profession" name="profession" defaultValue={member.profession ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="email">ইমেইল</label><input id="email" name="email" type="email" defaultValue={member.email ?? ""} className="input" /></div>
          <div>
            <label className="label" htmlFor="blood_group">রক্তের গ্রুপ</label>
            <select id="blood_group" name="blood_group" defaultValue={member.blood_group ?? ""} className="input">
              <option value="">জানা নেই</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="last_blood_donation">শেষ রক্তদান</label><input id="last_blood_donation" name="last_blood_donation" type="date" defaultValue={member.last_blood_donation ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="joined_on">যোগদানের তারিখ</label><input id="joined_on" name="joined_on" type="date" defaultValue={member.joined_on} className="input" /></div>
          <div><label className="label" htmlFor="monthly_fee">মাসিক চাঁদা (৳)</label><input id="monthly_fee" name="monthly_fee" inputMode="numeric" defaultValue={member.monthly_fee} className="input" /></div>
        </div>
        <div><label className="label" htmlFor="address">ঠিকানা</label><input id="address" name="address" defaultValue={member.address ?? ""} className="input" /></div>
        <div><label className="label" htmlFor="about">সদস্যের নিজের কথা</label><textarea id="about" name="about" rows={2} defaultValue={member.about ?? ""} className="input" /></div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="show_in_blood_list" defaultChecked={member.show_in_blood_list} className="h-5 w-5 accent-[#3f86bd]" />
          রক্তদাতা তালিকায় দেখানো হবে
        </label>
        <button disabled={saving} className="btn btn-primary w-full py-3">{saving ? "সংরক্ষণ হচ্ছে…" : "তথ্য সংরক্ষণ করুন"}</button>
      </form>

      {member.status === "active" && (
        <section className="card space-y-4">
          <h2 className="text-lg">চাঁদার হিসাব</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-brand-soft p-3"><p className="text-xl font-bold text-brand">{bn(due.paid)}</p><p className="text-xs text-muted">মাস পরিশোধ</p></div>
            <div className="rounded-2xl bg-accent-soft p-3"><p className="text-xl font-bold">{bn(due.due)}</p><p className="text-xs text-muted">মাস বাকি</p></div>
            <div className="rounded-2xl bg-blood/10 p-3"><p className="text-lg font-bold text-blood">{taka(due.amount)}</p><p className="text-xs text-muted">মোট বকেয়া</p></div>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line">
            {monthKeys(member.joined_on, key).map((k) => {
              const p = paidMap.get(k);
              return (
                <div key={k} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 font-medium">{fmtMonth(monthStart(k))}</span>
                  {p ? (
                    <>
                      <span className="text-sm text-brand">✓ {taka(p.amount)} ({p.method})</span>
                      <button onClick={() => unpay(p)} className="btn btn-ghost btn-sm">বাতিল</button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-blood">বাকি {taka(member.monthly_fee)}</span>
                      <button onClick={() => markPaid(k)} className="btn btn-primary btn-sm">পেয়েছি</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <form onSubmit={setPassword} className="card space-y-3">
        <h2 className="text-lg">{member.user_id ? "পাসওয়ার্ড রিসেট" : "লগইন চালু করুন"}</h2>
        <p className="text-sm text-muted">
          {member.user_id
            ? "সদস্য পাসওয়ার্ড ভুলে গেলে এখানে নতুন পাসওয়ার্ড দিন, তারপর তাকে জানিয়ে দিন।"
            : "এই সদস্যের এখনো লগইন নেই। একটা পাসওয়ার্ড দিলে সে মোবাইল নম্বর ও সেই পাসওয়ার্ড দিয়ে নিজের প্রোফাইলে ঢুকতে পারবে।"}
        </p>
        <div className="flex gap-2">
          <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" className="input" />
          <button className="btn btn-primary shrink-0">সেট করুন</button>
        </div>
      </form>

      <button onClick={remove} className="btn btn-danger w-full">এই সদস্যকে সম্পূর্ণ মুছে ফেলুন</button>
    </div>
  );
}
