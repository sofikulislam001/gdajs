"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { BLOOD_GROUPS, bn, en, errorMessage, fmtDate, isValidPhone, normalizePhone, taka, waLink } from "@/lib/bn";
import type { Member } from "@/lib/types";

type Filter = "pending" | "active" | "inactive";
const filterLabel: Record<Filter, string> = { pending: "আবেদন", active: "সক্রিয়", inactive: "নিষ্ক্রিয়" };

export default function MembersAdmin() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("members").select("*").order("name");
    if (error) setMsg(errorMessage(error));
    setMembers((data as Member[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, inactive: 0 };
    members?.forEach((m) => c[m.status]++);
    return c;
  }, [members]);

  const shown = useMemo(() => {
    const needle = en(q.trim().toLowerCase());
    return (members ?? []).filter(
      (m) => m.status === filter && (!needle || m.name.toLowerCase().includes(needle) || m.phone.includes(needle)),
    );
  }, [members, filter, q]);

  async function update(id: string, patch: Partial<Member>) {
    const { error } = await browserClient().from("members").update(patch).eq("id", id);
    if (error) setMsg(errorMessage(error));
    else setMsg("");
    await load();
  }

  async function approve(m: Member) {
    const input = window.prompt(`${m.name}-এর মাসিক চাঁদা কত টাকা?`, String(m.monthly_fee));
    if (input === null) return;
    const fee = Number(en(input));
    if (!Number.isFinite(fee) || fee < 0) return setMsg("চাঁদার পরিমাণ সঠিক নয়");
    await update(m.id, { status: "active", monthly_fee: fee, joined_on: new Date().toISOString().slice(0, 10) });
  }

  async function editFee(m: Member) {
    const input = window.prompt(`${m.name}-এর নতুন মাসিক চাঁদা`, String(m.monthly_fee));
    if (input === null) return;
    const fee = Number(en(input));
    if (!Number.isFinite(fee) || fee < 0) return setMsg("চাঁদার পরিমাণ সঠিক নয়");
    await update(m.id, { monthly_fee: fee });
  }

  async function remove(m: Member) {
    if (!window.confirm(`${m.name}-কে মুছে ফেলবেন? তার সব চাঁদার রেকর্ডও মুছে যাবে।`)) return;
    const { error } = await browserClient().from("members").delete().eq("id", m.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  async function addOne(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const phone = normalizePhone(String(f.get("phone") ?? ""));
    if (!isValidPhone(phone)) return setMsg("সঠিক মোবাইল নম্বর দিন");
    const { error } = await browserClient().from("members").insert({
      name: String(f.get("name") ?? "").trim(),
      phone,
      address: String(f.get("address") ?? "").trim() || null,
      blood_group: String(f.get("blood_group") ?? "") || null,
      monthly_fee: Number(en(String(f.get("fee") ?? "100"))) || 100,
      status: "active",
    });
    if (error) return setMsg(error.code === "23505" ? "এই নম্বর আগেই আছে" : errorMessage(error));
    form.reset();
    setMsg("সদস্য যোগ হয়েছে");
    await load();
  }

  async function importBulk() {
    const rows: Record<string, unknown>[] = [];
    const bad: string[] = [];
    for (const line of bulk.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const [name, rawPhone, fee, group] = line.split(/[,،\t]/).map((s) => s.trim());
      const phone = normalizePhone(rawPhone ?? "");
      if (!name || !isValidPhone(phone)) {
        bad.push(line);
        continue;
      }
      rows.push({
        name,
        phone,
        monthly_fee: Number(en(fee ?? "")) || 100,
        blood_group: (BLOOD_GROUPS as readonly string[]).includes((group ?? "").toUpperCase()) ? group.toUpperCase() : null,
        status: "active",
      });
    }
    if (rows.length === 0) return setMsg("কোনো সঠিক লাইন পাওয়া যায়নি");
    const { error } = await browserClient().from("members").upsert(rows, { onConflict: "phone", ignoreDuplicates: true });
    if (error) return setMsg(errorMessage(error));
    setMsg(`${bn(rows.length)} জন যোগ হয়েছে${bad.length ? `। ${bn(bad.length)}টি লাইনে ভুল ছিল: ${bad.join(" | ")}` : ""}`);
    setBulk("");
    await load();
  }

  if (!members) return <p className="text-muted">লোড হচ্ছে…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(filterLabel) as Filter[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter === k ? "btn-primary" : "btn-ghost"}`}>
            {filterLabel[k]} ({bn(counts[k])})
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা নম্বর খুঁজুন" className="input ml-auto max-w-56" />
      </div>

      {msg && <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm">{msg}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-line bg-paper">
            <tr><th className="th">নাম</th><th className="th">মোবাইল</th><th className="th">রক্ত</th><th className="th">চাঁদা</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.length === 0 && <tr><td className="td text-muted" colSpan={5}>কেউ নেই</td></tr>}
            {shown.map((m) => (
              <tr key={m.id}>
                <td className="td">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted">{[m.address, m.profession].filter(Boolean).join(" • ")}{m.status === "active" ? ` • যোগদান ${fmtDate(m.joined_on)}` : ""}</p>
                </td>
                <td className="td whitespace-nowrap">
                  <a href={`tel:${m.phone}`} className="text-brand hover:underline">{bn(m.phone)}</a>
                </td>
                <td className="td">{m.blood_group ?? "—"}</td>
                <td className="td whitespace-nowrap">{taka(m.monthly_fee)}</td>
                <td className="td">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {m.status === "pending" && <button onClick={() => approve(m)} className="btn btn-primary btn-sm">অনুমোদন</button>}
                    {m.status === "active" && <button onClick={() => editFee(m)} className="btn btn-ghost btn-sm">চাঁদা</button>}
                    {m.status === "active" && <button onClick={() => update(m.id, { status: "inactive" })} className="btn btn-ghost btn-sm">নিষ্ক্রিয়</button>}
                    {m.status === "inactive" && <button onClick={() => update(m.id, { status: "active" })} className="btn btn-ghost btn-sm">সক্রিয়</button>}
                    <a href={waLink(m.phone, `আসসালামু আলাইকুম ${m.name}, গোদনাইল আলোকিত যুব শক্তি থেকে বলছি।`)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">হোয়াটসঅ্যাপ</a>
                    <button onClick={() => remove(m)} className="btn btn-danger btn-sm">মুছুন</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={addOne} className="card space-y-3">
          <h2 className="text-lg">নতুন সদস্য যোগ করুন</h2>
          <input name="name" required placeholder="নাম" className="input" />
          <input name="phone" required inputMode="tel" placeholder="মোবাইল নম্বর" className="input" />
          <input name="address" placeholder="ঠিকানা (ঐচ্ছিক)" className="input" />
          <div className="grid grid-cols-2 gap-3">
            <select name="blood_group" className="input" defaultValue=""><option value="">রক্তের গ্রুপ</option>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
            <input name="fee" inputMode="numeric" placeholder="মাসিক চাঁদা (১০০)" className="input" />
          </div>
          <button className="btn btn-primary">যোগ করুন</button>
        </form>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">একসাথে অনেক সদস্য যোগ</h2>
            <button onClick={() => setShowBulk((v) => !v)} className="btn btn-ghost btn-sm">{showBulk ? "বন্ধ" : "খুলুন"}</button>
          </div>
          {showBulk && (
            <>
              <p className="text-sm text-muted">প্রতি লাইনে একজন: <code>নাম, মোবাইল, চাঁদা, রক্তের গ্রুপ</code> (শেষের দুটি ঐচ্ছিক)। Excel/খাতা থেকে কপি-পেস্ট করা যাবে।</p>
              <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={7} className="input font-mono text-sm" placeholder={"রহিম উদ্দিন, 01711223344, 100, B+\nকরিম, 01911223344"} />
              <button onClick={importBulk} className="btn btn-primary">ইমপোর্ট করুন</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
