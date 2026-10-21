"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { bn, currentMonthKey, errorMessage, fmtMonth, monthStart, taka } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p, d1, d2, d3, d4] = await Promise.all([
      sb.from("members").select("*"),
      sb.from("payments").select("*"),
      sb.from("expenses").select("id", { count: "exact", head: true }).eq("is_demo", true),
      sb.from("donations").select("id", { count: "exact", head: true }).eq("is_demo", true),
      sb.from("events").select("id", { count: "exact", head: true }).eq("is_demo", true),
      sb.from("fb_posts").select("id", { count: "exact", head: true }).eq("is_demo", true),
    ]);
    const ms = (m.data as Member[]) ?? [];
    setMembers(ms);
    setPayments((p.data as Payment[]) ?? []);
    setDemoCount(ms.filter((x) => x.is_demo).length + (d1.count ?? 0) + (d2.count ?? 0) + (d3.count ?? 0) + (d4.count ?? 0));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function clearDemo() {
    if (!window.confirm("সব ডেমো সদস্য, চাঁদা, খরচ, অনুদান ও ডেমো পোস্ট মুছে ফেলবেন? আপনার নিজের যোগ করা তথ্য মুছবে না।")) return;
    const sb = browserClient();
    for (const t of ["members", "expenses", "donations", "events", "fb_posts"] as const) {
      const { error } = await sb.from(t).delete().eq("is_demo", true);
      if (error) return setMsg(errorMessage(error));
    }
    setMsg("ডেমো তথ্য মুছে ফেলা হয়েছে");
    await load();
  }

  if (!members) return <p className="text-muted">লোড হচ্ছে…</p>;

  const key = currentMonthKey();
  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");
  const thisMonth = payments.filter((p) => p.month === monthStart(key));
  const expected = active.reduce((s, m) => s + m.monthly_fee, 0);
  const collected = thisMonth.reduce((s, p) => s + p.amount, 0);
  const totalDue = active.reduce((s, m) => s + dueFor(m, payments, key).amount, 0);
  const paidIds = new Set(thisMonth.map((p) => p.member_id));
  const unpaidCount = active.filter((m) => !paidIds.has(m.id)).length;

  const actions = [
    { href: "/admin/members?f=pending", title: "নতুন আবেদন", sub: pending.length ? `${bn(pending.length)} জন অপেক্ষায়` : "কেউ নেই", hot: pending.length > 0 },
    { href: "/admin/chada", title: "চাঁদা আদায়", sub: `${bn(unpaidCount)} জন বাকি` },
    { href: "/admin/members", title: "সব সদস্য", sub: `${bn(active.length)} জন সক্রিয়` },
    { href: "/admin/events", title: "নতুন কার্যক্রম/নোটিশ", sub: "ছবিসহ পোস্ট করুন" },
    { href: "/admin/khoroch", title: "খরচ/অনুদান", sub: "হিসাব যোগ করুন" },
    { href: "/admin/posts", title: "ফেসবুক পোস্ট", sub: "লিংক যোগ করুন" },
  ];

  return (
    <div className="space-y-6">
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className={`rounded-3xl border p-4 shadow-[0_4px_16px_rgba(40,80,120,0.07)] transition active:scale-[0.98] ${a.hot ? "border-accent bg-accent-soft" : "border-line bg-white hover:bg-brand-soft"}`}>
            <p className="text-lg font-bold">{a.title}</p>
            <p className="text-sm text-muted">{a.sub}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-xl">{fmtMonth(monthStart(key))}-এর অবস্থা</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "সক্রিয় সদস্য", value: bn(active.length) },
            { label: "এই মাসে আদায়", value: `${taka(collected)}`, sub: `লক্ষ্য ${taka(expected)}` },
            { label: "এই মাসে বাকি", value: `${bn(unpaidCount)} জন` },
            { label: "মোট বকেয়া", value: taka(totalDue), sub: "সব মাস মিলিয়ে" },
          ].map((t) => (
            <div key={t.label} className="card">
              <p className="text-sm text-muted">{t.label}</p>
              <p className="text-xl font-bold text-brand-dark">{t.value}</p>
              {t.sub && <p className="text-xs text-muted">{t.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {demoCount > 0 && (
        <section className="card border-accent bg-accent-soft">
          <p className="font-bold">সাইটে এখনো ডেমো (নমুনা) তথ্য আছে</p>
          <p className="text-sm text-muted">নমুনা সদস্য, চাঁদা, খরচ ও পোস্ট ({bn(demoCount)}টি) এখনো আছে। আসল তথ্য তোলার আগে এগুলো মুছে ফেলুন, নইলে সাইটে ভুল হিসাব দেখাবে।</p>
          <button onClick={clearDemo} className="btn btn-danger mt-3">ডেমো তথ্য মুছে ফেলুন</button>
        </section>
      )}
    </div>
  );
}
