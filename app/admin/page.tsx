"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { bn, currentMonthKey, fmtMonth, monthStart, taka } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const sb = browserClient();
    Promise.all([sb.from("members").select("*"), sb.from("payments").select("*")]).then(([m, p]) => {
      setMembers((m.data as Member[]) ?? []);
      setPayments((p.data as Payment[]) ?? []);
    });
  }, []);

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

  const tiles = [
    { label: "সক্রিয় সদস্য", value: bn(active.length) },
    { label: `${fmtMonth(monthStart(key))}-এ আদায়`, value: `${taka(collected)} / ${taka(expected)}` },
    { label: "এই মাসে চাঁদা বাকি", value: `${bn(unpaidCount)} জন` },
    { label: "মোট বকেয়া (সব মাস)", value: taka(totalDue) },
  ];

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Link href="/admin/members" className="card flex items-center justify-between border-accent bg-accent-soft">
          <span className="font-semibold">{bn(pending.length)} জনের সদস্য আবেদন অনুমোদনের অপেক্ষায়</span>
          <span className="btn btn-accent btn-sm">দেখুন</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="font-display text-xl font-bold text-brand-dark">{t.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/chada" className="btn btn-primary">চাঁদা আদায় ও রিমাইন্ডার</Link>
        <Link href="/admin/events" className="btn btn-ghost">নতুন কার্যক্রম/নোটিশ দিন</Link>
        <Link href="/admin/khoroch" className="btn btn-ghost">খরচ যোগ করুন</Link>
      </div>
    </div>
  );
}
