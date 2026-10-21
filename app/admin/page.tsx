"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AIcon, type AdminIconName } from "@/components/AdminIcons";
import Avatar from "@/components/Avatar";
import { ListSkeleton } from "@/components/Skeleton";
import { browserClient } from "@/lib/supabase";
import { bn, currentMonthKey, errorMessage, fmtDate, fmtMonth, monthStart, taka, waLink } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Expense, Member, Payment } from "@/lib/types";

function lastMonths(n: number): string[] {
  const [y, m] = currentMonthKey().split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function Kpi({ icon, label, value, sub, tone }: { icon: AdminIconName; label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}><AIcon name={icon} size={22} /></span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p, e, d2, d3, d4] = await Promise.all([
      sb.from("members").select("*"),
      sb.from("payments").select("*"),
      sb.from("expenses").select("*"),
      sb.from("donations").select("id", { count: "exact", head: true }).eq("is_demo", true),
      sb.from("events").select("id", { count: "exact", head: true }).eq("is_demo", true),
      sb.from("fb_posts").select("id", { count: "exact", head: true }).eq("is_demo", true),
    ]);
    const ms = (m.data as Member[]) ?? [];
    const ex = (e.data as Expense[]) ?? [];
    setMembers(ms);
    setPayments((p.data as Payment[]) ?? []);
    setExpenses(ex);
    setDemoCount(ms.filter((x) => x.is_demo).length + ex.filter((x) => (x as Expense & { is_demo?: boolean }).is_demo).length + (d2.count ?? 0) + (d3.count ?? 0) + (d4.count ?? 0));
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

  async function approve(m: Member) {
    const input = window.prompt(`${m.name}-এর মাসিক চাঁদা কত টাকা?`, String(m.monthly_fee));
    if (input === null) return;
    const fee = Number(input.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))));
    if (!Number.isFinite(fee) || fee < 0) return setMsg("চাঁদার পরিমাণ সঠিক নয়");
    const { error } = await browserClient().from("members").update({ status: "active", monthly_fee: fee, joined_on: new Date().toISOString().slice(0, 10) }).eq("id", m.id);
    setMsg(error ? errorMessage(error) : `${m.name} এখন সক্রিয় সদস্য`);
    await load();
  }

  const key = currentMonthKey();
  const data = useMemo(() => {
    const ms = members ?? [];
    const active = ms.filter((m) => m.status === "active");
    const pending = ms.filter((m) => m.status === "pending");
    const months = lastMonths(6).map((k) => {
      const collected = payments.filter((p) => p.month.slice(0, 7) === k).reduce((s, p) => s + p.amount, 0);
      const target = active.filter((m) => m.joined_on.slice(0, 7) <= k).reduce((s, m) => s + m.monthly_fee, 0);
      return { k, collected, target };
    });
    const thisMonth = months[months.length - 1];
    const dues = active
      .map((m) => ({ m, d: dueFor(m, payments, key) }))
      .filter((x) => x.d.due > 0)
      .sort((a, b) => b.d.amount - a.d.amount);
    const totalDue = dues.reduce((s, x) => s + x.d.amount, 0);
    const paidIds = new Set(payments.filter((p) => p.month.slice(0, 7) === key).map((p) => p.member_id));
    const unpaid = active.filter((m) => !paidIds.has(m.id)).length;
    const byId = new Map(ms.map((m) => [m.id, m]));
    const recent = [...payments].sort((a, b) => (b.paid_on ?? "").localeCompare(a.paid_on ?? "")).slice(0, 6).map((p) => ({ p, m: byId.get(p.member_id) }));
    const totalExpense = expenses.reduce((s, x) => s + x.amount, 0);
    return { active, pending, months, thisMonth, dues, totalDue, unpaid, recent, totalExpense };
  }, [members, payments, expenses, key]);

  if (!members) return <ListSkeleton />;
  const maxBar = Math.max(1, ...data.months.map((x) => Math.max(x.collected, x.target)));
  const pct = data.thisMonth.target ? Math.round((data.thisMonth.collected / data.thisMonth.target) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">স্বাগতম, অ্যাডমিন</h1>
          <p className="text-muted">{fmtMonth(monthStart(key))}-এর সারসংক্ষেপ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/chada" className="btn btn-primary"><AIcon name="coins" size={18} /> চাঁদা আদায়</Link>
          <Link href="/admin/members" className="btn btn-ghost"><AIcon name="users" size={18} /> সদস্য</Link>
        </div>
      </div>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      {data.pending.length > 0 && (
        <section className="card border-accent bg-accent-soft/60 p-0">
          <div className="flex items-center justify-between gap-2 px-5 pt-4">
            <h2 className="flex items-center gap-2 text-lg"><AIcon name="alert" className="text-[#8a5a00]" /> {bn(data.pending.length)}টি নতুন আবেদন অপেক্ষায়</h2>
            <Link href="/admin/members?f=pending" className="text-sm font-semibold text-brand hover:underline">সব দেখুন →</Link>
          </div>
          <div className="divide-y divide-accent/30 px-2 pb-2 pt-2">
            {data.pending.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar src={m.photo_url} name={m.name} size={44} />
                <Link href={`/admin/members/${m.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="truncate text-sm text-muted">{bn(m.phone)} • {m.address ?? "ঠিকানা নেই"}</p>
                </Link>
                <button onClick={() => approve(m)} className="btn btn-primary btn-sm">অনুমোদন</button>
                <Link href={`/admin/members/${m.id}`} className="btn btn-ghost btn-sm hidden sm:inline-flex">সব তথ্য</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon="users" label="সক্রিয় সদস্য" value={bn(data.active.length)} sub={`${bn(data.pending.length)} জন আবেদনে`} tone="bg-brand-soft text-brand-dark" />
        <Kpi icon="coins" label="এই মাসে আদায়" value={taka(data.thisMonth.collected)} sub={`লক্ষ্য ${taka(data.thisMonth.target)} • ${bn(pct)}%`} tone="bg-[#e1f4ea] text-[#26865c]" />
        <Kpi icon="alert" label="মোট বকেয়া" value={taka(data.totalDue)} sub={`${bn(data.dues.length)} জনের কাছে`} tone="bg-blood/10 text-blood" />
        <Kpi icon="receipt" label="মোট খরচ" value={taka(data.totalExpense)} sub="সেবামূলক কাজে" tone="bg-accent-soft text-[#8a5a00]" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">গত ৬ মাসের চাঁদা</h2>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> আদায়</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-line" /> লক্ষ্য</span>
            </div>
          </div>
          <div className="flex h-44 items-end gap-3" role="img" aria-label="মাসভিত্তিক চাঁদার বার চার্ট">
            {data.months.map((x) => (
              <div key={x.k} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-muted">{x.collected ? taka(x.collected) : ""}</span>
                <div className="relative flex w-full flex-1 items-end justify-center rounded-xl bg-paper">
                  <div className="absolute bottom-0 w-full rounded-xl bg-line" style={{ height: `${(x.target / maxBar) * 100}%` }} />
                  <div className="relative w-3/5 rounded-t-xl bg-brand transition-all" style={{ height: `${(x.collected / maxBar) * 100}%` }} />
                </div>
                <span className="text-xs text-muted">{fmtMonth(monthStart(x.k)).split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-3 text-lg">সাম্প্রতিক চাঁদা</h2>
          {data.recent.length === 0 ? (
            <p className="text-muted">এখনো কোনো চাঁদা জমা হয়নি।</p>
          ) : (
            <div className="divide-y divide-line">
              {data.recent.map(({ p, m }) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <Avatar src={m?.photo_url} name={m?.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m?.name ?? "সদস্য"}</p>
                    <p className="text-xs text-muted">{fmtMonth(p.month)} • {fmtDate(p.paid_on)} • {p.method}</p>
                  </div>
                  <span className="font-semibold text-brand">{taka(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card p-0">
        <div className="flex items-center justify-between gap-2 px-5 pt-4">
          <h2 className="text-lg">সবচেয়ে বেশি বকেয়া</h2>
          <Link href="/admin/chada" className="text-sm font-semibold text-brand hover:underline">চাঁদা পাতায় যান →</Link>
        </div>
        {data.dues.length === 0 ? (
          <p className="px-5 py-4 text-muted">কারও বকেয়া নেই। চমৎকার!</p>
        ) : (
          <div className="divide-y divide-line px-2 py-2">
            {data.dues.slice(0, 6).map(({ m, d }) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar src={m.photo_url} name={m.name} size={40} />
                <Link href={`/admin/members/${m.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-sm text-muted">{bn(d.due)} মাস বাকি</p>
                </Link>
                <span className="font-bold text-blood">{taka(d.amount)}</span>
                <a
                  href={waLink(m.phone, `আসসালামু আলাইকুম ${m.name}, গোদনাইল আলোকিত যুব শক্তির পক্ষ থেকে জানাচ্ছি, আপনার ${bn(d.due)} মাসের চাঁদা ${taka(d.amount)} বকেয়া আছে। সুবিধামতো পরিশোধ করার অনুরোধ রইল। ধন্যবাদ।`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  aria-label={`${m.name}-কে হোয়াটসঅ্যাপে রিমাইন্ডার`}
                >
                  <AIcon name="chat" size={16} /> রিমাইন্ডার
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { href: "/admin/events", icon: "calendar", label: "নতুন কার্যক্রম" },
          { href: "/admin/posts", icon: "facebook", label: "ফেসবুক পোস্ট" },
          { href: "/admin/khoroch", icon: "receipt", label: "খরচ/অনুদান" },
          { href: "/admin/settings", icon: "settings", label: "সেটিংস" },
        ] as { href: string; icon: AdminIconName; label: string }[]).map((a) => (
          <Link key={a.href} href={a.href} className="card flex items-center gap-3 p-4 transition hover:bg-brand-soft active:scale-[0.98]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-dark"><AIcon name={a.icon} /></span>
            <span className="font-semibold">{a.label}</span>
          </Link>
        ))}
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
