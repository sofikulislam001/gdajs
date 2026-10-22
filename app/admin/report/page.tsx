"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { ORG_NAME, bn, currentMonthKey, fmtDate, fmtMonth, monthStart, taka } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import { browserClient } from "@/lib/supabase";
import type { Donation, Expense, Member, Payment } from "@/lib/types";

function nextMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ReportAdmin() {
  const [month, setMonth] = useState(currentMonthKey());
  const [members, setMembers] = useState<Member[]>([]);
  const [allPay, setAllPay] = useState<Payment[]>([]);
  const [exp, setExp] = useState<Expense[]>([]);
  const [don, setDon] = useState<Donation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = browserClient();
    const from = monthStart(month);
    const to = nextMonth(month);
    setReady(false);
    Promise.all([
      sb.from("members").select("*").eq("status", "active").order("name"),
      sb.from("payments").select("*"),
      sb.from("expenses").select("*").gte("spent_on", from).lt("spent_on", to).order("spent_on"),
      sb.from("donations").select("*").gte("received_on", from).lt("received_on", to).order("received_on"),
    ]).then(([m, p, e, d]) => {
      setMembers((m.data as Member[]) ?? []);
      setAllPay((p.data as Payment[]) ?? []);
      setExp((e.data as Expense[]) ?? []);
      setDon((d.data as Donation[]) ?? []);
      setReady(true);
    });
  }, [month]);

  const monthPay = allPay.filter((p) => p.month.slice(0, 7) === month);
  const chada = monthPay.reduce((s, p) => s + p.amount, 0);
  const donTotal = don.reduce((s, d) => s + d.amount, 0);
  const expTotal = exp.reduce((s, e) => s + e.amount, 0);
  const income = chada + donTotal;
  const dueRows = members
    .filter((m) => m.joined_on.slice(0, 7) <= month)
    .map((m) => ({ m, d: dueFor(m, allPay, month) }))
    .filter((x) => x.d.due > 0);
  const dueTotal = dueRows.reduce((s, x) => s + x.d.amount, 0);
  const label = fmtMonth(monthStart(month));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl">মাসিক রিপোর্ট</h1>
          <p className="text-muted">মাস বেছে নিয়ে প্রিন্ট করুন বা &ldquo;PDF হিসেবে সেভ&rdquo; করুন।</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="input" />
          <button onClick={() => window.print()} disabled={!ready} className="btn btn-primary shrink-0 whitespace-nowrap">প্রিন্ট / PDF</button>
        </div>
      </div>

      <article className="card space-y-5 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <Logo size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight">{ORG_NAME}</p>
            <p className="text-sm text-muted">মাসিক আয়-ব্যয় ও চাঁদার রিপোর্ট — {label}</p>
          </div>
        </div>
        {!ready ? (
          <p className="text-muted">লোড হচ্ছে…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-2xl bg-brand-soft p-3"><p className="text-lg font-bold text-brand">{taka(income)}</p><p className="text-xs text-muted">মোট আয়</p></div>
              <div className="rounded-2xl bg-blood/10 p-3"><p className="text-lg font-bold text-blood">{taka(expTotal)}</p><p className="text-xs text-muted">মোট ব্যয়</p></div>
              <div className="rounded-2xl bg-paper p-3 ring-1 ring-line"><p className="text-lg font-bold">{taka(income - expTotal)}</p><p className="text-xs text-muted">উদ্বৃত্ত</p></div>
              <div className="rounded-2xl bg-accent-soft p-3"><p className="text-lg font-bold">{taka(dueTotal)}</p><p className="text-xs text-muted">মোট বকেয়া</p></div>
            </div>

            <section>
              <h2 className="mb-2 text-lg">আয়</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  <tr><td className="py-2">সদস্যদের মাসিক চাঁদা ({bn(monthPay.length)} জন)</td><td className="py-2 text-right font-semibold">{taka(chada)}</td></tr>
                  {don.map((d) => <tr key={d.id}><td className="py-2">অনুদান — {d.donor_name}{d.purpose ? ` (${d.purpose})` : ""} <span className="text-xs text-muted">{fmtDate(d.received_on)}</span></td><td className="py-2 text-right font-semibold">{taka(d.amount)}</td></tr>)}
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="mb-2 text-lg">ব্যয়</h2>
              {exp.length === 0 ? <p className="text-sm text-muted">এ মাসে কোনো খরচ নেই।</p> : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {exp.map((x) => <tr key={x.id}><td className="py-2">{x.title} <span className="text-xs text-muted">{fmtDate(x.spent_on)}</span></td><td className="py-2 text-right font-semibold">{taka(x.amount)}</td></tr>)}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-lg">চাঁদা বকেয়া ({bn(dueRows.length)} জন)</h2>
              {dueRows.length === 0 ? <p className="text-sm text-muted">কারও বকেয়া নেই 🎉</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-line text-left text-muted"><th className="py-1.5 font-medium">সদস্য</th><th className="py-1.5 font-medium">মাস</th><th className="py-1.5 text-right font-medium">টাকা</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {dueRows.map(({ m, d }) => <tr key={m.id}><td className="py-1.5">{m.name}</td><td className="py-1.5">{bn(d.due)}</td><td className="py-1.5 text-right font-semibold">{taka(d.amount)}</td></tr>)}
                  </tbody>
                </table>
              )}
            </section>
            <p className="border-t border-line pt-3 text-center text-xs text-muted">প্রস্তুতের তারিখ: {fmtDate(new Date().toISOString().slice(0, 10))}</p>
          </>
        )}
      </article>
    </div>
  );
}
