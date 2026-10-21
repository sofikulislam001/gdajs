"use client";

import { ListSkeleton } from "@/components/Skeleton";
import { useCallback, useEffect, useMemo, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { bn, currentMonthKey, errorMessage, fmtMonth, monthStart, taka, waLink } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

const METHODS = ["ক্যাশ", "বিকাশ", "নগদ", "ব্যাংক"];

export default function ChadaAdmin() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [month, setMonth] = useState(currentMonthKey());
  const [method, setMethod] = useState("ক্যাশ");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"unpaid" | "paid">("unpaid");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p] = await Promise.all([
      sb.from("members").select("*").eq("status", "active").order("name"),
      sb.from("payments").select("*"),
    ]);
    if (m.error || p.error) setMsg(errorMessage(m.error ?? p.error));
    setMembers((m.data as Member[]) ?? []);
    setPayments((p.data as Payment[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const monthPayments = useMemo(() => {
    const map = new Map<string, Payment>();
    payments.filter((p) => p.month === monthStart(month)).forEach((p) => map.set(p.member_id, p));
    return map;
  }, [payments, month]);

  const label = month ? fmtMonth(monthStart(month)) : "";
  const rows = useMemo(
    () =>
      (members ?? [])
        // নির্বাচিত মাসের আগে যোগ দেননি এমন সদস্যকে বাদ দিই
        .filter((m) => m.joined_on.slice(0, 7) <= month)
        .map((m) => ({ m, paid: monthPayments.get(m.id), due: dueFor(m, payments, month) })),
    [members, month, monthPayments, payments],
  );

  const unpaid = rows.filter((r) => !r.paid);
  const paid = rows.filter((r) => r.paid);
  const collected = paid.reduce((s, r) => s + (r.paid?.amount ?? 0), 0);
  const expected = rows.reduce((s, r) => s + r.m.monthly_fee, 0);

  async function markPaid(m: Member) {
    const { error } = await browserClient()
      .from("payments")
      .insert({ member_id: m.id, month: monthStart(month), amount: m.monthly_fee, method });
    if (error) return setMsg(errorMessage(error));
    setMsg("");
    await load();
  }

  async function undo(p: Payment) {
    if (!window.confirm("এই পেমেন্টের রেকর্ড বাতিল করবেন?")) return;
    const { error } = await browserClient().from("payments").delete().eq("id", p.id);
    if (error) return setMsg(errorMessage(error));
    await load();
  }

  function reminderText(m: Member, dueMonths: number, amount: number) {
    const extra = dueMonths > 1 ? ` (মোট ${bn(dueMonths)} মাসে ${taka(amount)} বাকি)` : "";
    return `আসসালামু আলাইকুম ${m.name}, গোদনাইল আলোকিত যুব শক্তির ${label} মাসের চাঁদা ${taka(m.monthly_fee)} এখনো পাওয়া যায়নি${extra}। সুবিধামতো পরিশোধ করার অনুরোধ রইল। ধন্যবাদ।`;
  }

  async function copyList() {
    const lines = unpaid.map((r, i) => `${bn(i + 1)}. ${r.m.name} — ${taka(r.due.amount)} (${bn(r.due.due)} মাস)`);
    const text = `${label} পর্যন্ত চাঁদা বকেয়া তালিকা:\n${lines.join("\n")}\n\nমোট: ${taka(unpaid.reduce((s, r) => s + r.due.amount, 0))}`;
    try {
      await navigator.clipboard.writeText(text);
      setMsg("তালিকা কপি হয়েছে, এখন গ্রুপে পেস্ট করুন");
    } catch {
      setMsg("কপি করা যায়নি");
    }
  }

  if (!members) return <ListSkeleton />;
  const list = tab === "unpaid" ? unpaid : paid;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label" htmlFor="month">মাস</label>
          <input id="month" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="method">পেমেন্ট মাধ্যম</label>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="input">
            {METHODS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted">{label}-এ আদায়</p>
          <p className="font-display text-2xl font-bold text-brand">{taka(collected)} <span className="text-base font-normal text-muted">/ {taka(expected)}</span></p>
        </div>
      </div>

      {msg && <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm">{msg}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setTab("unpaid")} className={`btn btn-sm ${tab === "unpaid" ? "btn-primary" : "btn-ghost"}`}>বাকি ({bn(unpaid.length)})</button>
        <button onClick={() => setTab("paid")} className={`btn btn-sm ${tab === "paid" ? "btn-primary" : "btn-ghost"}`}>পরিশোধ ({bn(paid.length)})</button>
        {tab === "unpaid" && unpaid.length > 0 && <button onClick={copyList} className="btn btn-accent btn-sm ml-auto">বকেয়া তালিকা কপি (গ্রুপে দেওয়ার জন্য)</button>}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-line bg-paper">
            <tr><th className="th">সদস্য</th><th className="th">এই মাসের চাঁদা</th><th className="th">মোট বকেয়া</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.length === 0 && <tr><td className="td text-muted" colSpan={4}>{tab === "unpaid" ? "সবাই পরিশোধ করেছেন 🎉" : "এখনো কেউ পরিশোধ করেননি"}</td></tr>}
            {list.map(({ m, paid: p, due }) => (
              <tr key={m.id}>
                <td className="td"><p className="font-medium">{m.name}</p><p className="text-xs text-muted">{bn(m.phone)}</p></td>
                <td className="td whitespace-nowrap">{taka(m.monthly_fee)}{p && <span className="ml-2 text-xs text-muted">{p.method}</span>}</td>
                <td className="td whitespace-nowrap">{due.due > 0 ? <span className="font-semibold text-blood">{taka(due.amount)} <span className="text-xs font-normal">({bn(due.due)} মাস)</span></span> : <span className="text-brand">নেই</span>}</td>
                <td className="td">
                  <div className="flex justify-end gap-1.5">
                    {!p && <button onClick={() => markPaid(m)} className="btn btn-primary btn-sm">পেয়েছি</button>}
                    {!p && <a href={waLink(m.phone, reminderText(m, due.due, due.amount))} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">রিমাইন্ডার</a>}
                    {p && <button onClick={() => undo(p)} className="btn btn-ghost btn-sm">বাতিল</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">&ldquo;রিমাইন্ডার&rdquo; চাপলে হোয়াটসঅ্যাপে সদস্যের নামে লেখা মেসেজ তৈরি হয়ে খুলবে, আপনি শুধু Send চাপবেন।</p>
    </div>
  );
}
