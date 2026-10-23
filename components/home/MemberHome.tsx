"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BloodRequests from "@/components/BloodRequests";
import { useAuth } from "@/lib/auth";
import { bn, currentMonthKey, fmtDate, taka } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import { useLang } from "@/lib/lang";
import { browserClient, isConfigured } from "@/lib/supabase";
import type { EventRow, Member, Payment, PublicStats } from "@/lib/types";
import { memberNo } from "@/components/MembershipCard";

type N = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

function daysSince(iso: string): number {
  return Math.floor((new Date().getTime() - new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()) / 86400000);
}

function greet(tr: (b: string, e: string) => string): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date()));
  if (h < 5) return tr("শুভ রাত্রি", "Good night");
  if (h < 12) return tr("শুভ সকাল", "Good morning");
  if (h < 16) return tr("শুভ দুপুর", "Good afternoon");
  if (h < 19) return tr("শুভ বিকাল", "Good evening");
  return tr("শুভ সন্ধ্যা", "Good evening");
}

function Ring({ pct, children }: { pct: number; children: React.ReactNode }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e3edf6" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#g)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3f86bd" /><stop offset="1" stopColor="#f4a623" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** লগইন করা ব্যবহারকারীর ড্যাশবোর্ড: সদস্য কার্ড, চাঁদা, রক্তদান, নোটিফিকেশন, নোটিশ */
export default function MemberHome({ events, stats }: { events: EventRow[]; stats: PublicStats | null }) {
  const { tr } = useLang();
  const { user } = useAuth();
  const [m, setM] = useState<Member | null | undefined>(undefined);
  const [pay, setPay] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<N[]>([]);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!isConfigured || !user) return;
    const sb = browserClient();
    void Promise.all([
      sb.from("members").select("*").maybeSingle(),
      sb.from("payments").select("*"),
      sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
      sb.rpc("is_admin"),
    ]).then(([a, b, c, d]) => {
      setM((a.data as Member | null) ?? null);
      setPay((b.data as Payment[]) ?? []);
      setNotes((c.data as N[]) ?? []);
      setAdmin(d.data === true);
    });
  }, [user]);

  if (m === undefined) {
    return <div className="container-x space-y-4 py-6" aria-busy><div className="h-56 animate-pulse rounded-3xl bg-brand-soft" /><div className="h-32 animate-pulse rounded-3xl bg-brand-soft" /><div className="h-32 animate-pulse rounded-3xl bg-brand-soft" /></div>;
  }

  const key = currentMonthKey();
  const active = m?.status === "active";
  const due = m && active ? dueFor(m, pay, key) : null;
  const unread = notes.filter((n) => !n.read);
  const gap = m?.last_blood_donation ? 90 - daysSince(m.last_blood_donation) : 0;
  const canDonate = !!m?.blood_group && gap <= 0;
  const today = new Date().toISOString().slice(0, 10);
  const notices = events.filter((e) => e.kind === "notice").slice(0, 3);
  const upcoming = events.filter((e) => e.kind !== "notice" && e.event_date >= today).slice(-3).reverse();
  const yearPct = due ? Math.round((due.paid / Math.max(due.expected, 1)) * 100) : 0;

  return (
    <div>
      {/* গাঢ় হিরো + ডিজিটাল সদস্য কার্ড */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#12324f] via-[#1d4f7c] to-[#3a7fb5] pb-24 pt-5 text-white">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-accent/20 blur-2xl" />
        <div className="container-x relative">
          <p className="text-sm text-white/80">{greet(tr)} 👋</p>
          <h1 className="mb-4 truncate text-2xl">{m ? m.name : tr("স্বাগতম", "Welcome")}</h1>

          {m ? (
            <Link href="/profile" className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-white/25 to-white/5 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/30 backdrop-blur transition active:scale-[0.99]">
              <span className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/30 blur-xl" />
              <div className="relative flex items-center gap-4">
                {m.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/70" />
                ) : (
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl font-bold">{m.name.trim().charAt(0)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase text-white/70">{tr("সদস্য কার্ড", "Member card")}</p>
                  <p className="truncate text-lg font-bold leading-tight">{memberNo(m)}</p>
                  <p className="text-sm text-white/85">{bn(m.phone)}</p>
                </div>
                {m.blood_group && <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blood text-base font-extrabold shadow">{m.blood_group}</span>}
              </div>
              <div className="relative mt-3 flex items-center justify-between border-t border-white/20 pt-2.5 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-bold ${active ? "bg-[#7ee2a8]/90 text-[#0b3b24]" : "bg-accent text-ink"}`}>
                  {active ? tr("● সক্রিয় সদস্য", "● Active member") : m.status === "pending" ? tr("● অনুমোদনের অপেক্ষায়", "● Awaiting approval") : tr("● নিষ্ক্রিয়", "● Inactive")}
                </span>
                <span className="text-white/75">{tr("যোগদান", "Joined")} {fmtDate(m.joined_on)}</span>
              </div>
            </Link>
          ) : (
            <div className="rounded-3xl bg-white/15 p-4 ring-1 ring-white/30 backdrop-blur">
              <p className="font-semibold">{admin ? tr("আপনি অ্যাডমিন হিসেবে লগইন করেছেন।", "You are logged in as an admin.") : tr("এই অ্যাকাউন্টে সদস্য প্রোফাইল যুক্ত নেই।", "No member profile is linked to this account.")}</p>
            </div>
          )}
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-[#f3f7fb]" aria-hidden>
          <path fill="currentColor" d="M0 60V28C240 -4 480 -4 720 22s480 30 720 -2V60z" />
        </svg>
      </section>

      <div className="container-x relative -mt-14 space-y-7 pb-10">
        {/* দ্রুত কাজ */}
        <section className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-3 shadow-[0_14px_36px_rgba(20,60,100,0.18)] ring-1 ring-line">
          {([
            ["💳", tr("চাঁদা দিন", "Pay dues"), "/profile?tab=chada", 0],
            ["🧾", tr("রসিদ", "Receipt"), "/profile?tab=card", 0],
            ["🔔", tr("নোটিফিকেশন", "Alerts"), "/notifications", unread.length],
            ["🩸", tr("রক্ত", "Blood"), "/blood", 0],
          ] as [string, string, string, number][]).map(([ic, l, h, n]) => (
            <Link key={l} href={h} className="relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 transition active:scale-95 hover:bg-brand-soft">
              <span className="text-2xl" aria-hidden>{ic}</span>
              <span className="w-full truncate text-center text-xs font-semibold">{l}</span>
              {n > 0 && <span className="absolute right-2 top-1 grid min-w-[18px] place-items-center rounded-full bg-blood px-1 text-[10px] font-bold text-white">{bn(n)}</span>}
            </Link>
          ))}
        </section>

        {m?.status === "pending" && (
          <section className="rounded-3xl border border-accent/50 bg-accent-soft p-4">
            <p className="font-bold">⏳ {tr("আপনার আবেদন যাচাই চলছে", "Your application is under review")}</p>
            <p className="text-sm text-muted">{tr("অনুমোদন হলেই নোটিফিকেশন পাবেন এবং চাঁদা ও রসিদের সুবিধা চালু হবে।", "You will be notified once approved, and dues and receipts will unlock.")}</p>
          </section>
        )}

        {admin && (
          <Link href="/admin" className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#1d4f7c] to-[#3a7fb5] p-4 text-white shadow-lg transition active:scale-[0.99]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 text-2xl">🛠️</span>
            <div className="flex-1"><p className="font-bold">{tr("অ্যাডমিন প্যানেল", "Admin panel")}</p><p className="text-sm text-white/80">{tr("সদস্য, চাঁদা, নোটিশ ও রিপোর্ট পরিচালনা", "Manage members, dues, notices and reports")}</p></div>
            <span aria-hidden>→</span>
          </Link>
        )}

        {/* চাঁদা */}
        {due && m && (
          <section className="card">
            <div className="flex items-center gap-4">
              <Ring pct={yearPct}>
                <div><p className="text-xl font-extrabold leading-none text-brand-dark">{bn(due.paid)}</p><p className="text-[10px] text-muted">/{bn(due.expected)} {tr("মাস", "mo")}</p></div>
              </Ring>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{tr("আমার চাঁদা", "My dues")}</p>
                {due.due === 0 ? (
                  <><p className="text-lg font-bold text-brand">🎉 {tr("সব পরিশোধিত!", "All paid up!")}</p><p className="text-sm text-muted">{tr("সংগঠনের পাশে থাকার জন্য ধন্যবাদ।", "Thank you for standing with us.")}</p></>
                ) : (
                  <><p className="text-lg font-bold text-blood">{taka(due.amount)} {tr("বকেয়া", "due")}</p><p className="text-sm text-muted">{bn(due.due)} {tr("মাসের চাঁদা বাকি", "month(s) pending")}</p></>
                )}
              </div>
            </div>
            {due.due > 0 && <Link href="/profile?tab=chada" className="btn btn-accent mt-4 w-full py-3 text-base">{tr("এখনই চাঁদা জমা দিন", "Pay now")}</Link>}
          </section>
        )}

        {/* রক্তদান */}
        {m && (
          <section className={`card flex items-center gap-4 ${canDonate ? "border-brand/30" : ""}`}>
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${canDonate ? "bg-[#d9f2e6]" : "bg-blood/10"}`} aria-hidden>🩸</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{!m.blood_group ? tr("রক্তের গ্রুপ যোগ করুন", "Add your blood group") : canDonate ? tr("আপনি এখন রক্ত দিতে পারবেন", "You can donate now") : tr(`আরও ${bn(gap)} দিন পর রক্ত দিতে পারবেন`, `You can donate in ${gap} days`)}</p>
              <p className="text-sm text-muted">{!m.blood_group ? tr("জরুরি সময়ে কেউ যেন আপনাকে খুঁজে পায়।", "So people can reach you in emergencies.") : tr("দাতা তালিকায় তথ্য হালনাগাদ রাখুন।", "Keep your donor details up to date.")}</p>
            </div>
            <Link href="/profile" className="btn btn-ghost btn-sm shrink-0">{tr("হালনাগাদ", "Update")}</Link>
          </section>
        )}

        {/* জরুরি অনুরোধ — সদস্যরা সাড়া দিতে পারেন */}
        <BloodRequests />

        {/* নোটিফিকেশন */}
        {unread.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between"><h2 className="text-xl">🔔 {tr("নতুন বার্তা", "New messages")}</h2><Link href="/notifications" className="text-sm font-semibold text-brand">{tr("সব দেখুন", "See all")} →</Link></div>
            <div className="space-y-2">
              {unread.slice(0, 3).map((n) => (
                <Link key={n.id} href={n.link || "/notifications"} className="card block p-4 transition active:scale-[0.99]">
                  <p className="font-semibold leading-snug">{n.title}</p>
                  {n.body && <p className="line-clamp-1 text-sm text-muted">{n.body}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* নোটিশ */}
        {notices.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between"><h2 className="text-xl">📢 {tr("নোটিশ বোর্ড", "Notice board")}</h2><Link href="/events?kind=notice" className="text-sm font-semibold text-brand">{tr("সব দেখুন", "See all")} →</Link></div>
            <div className="divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-line">
              {notices.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-brand-soft">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-lg">📌</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{e.title}</span><span className="text-xs text-muted">{fmtDate(e.event_date)}</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* আসন্ন কর্মসূচি */}
        {upcoming.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between"><h2 className="text-xl">📅 {tr("আসন্ন কর্মসূচি", "Upcoming events")}</h2><Link href="/events" className="text-sm font-semibold text-brand">{tr("সব দেখুন", "See all")} →</Link></div>
            <div className="space-y-2">
              {upcoming.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="card flex items-center gap-3 p-3 transition active:scale-[0.99]">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-center leading-tight"><span><b className="block text-lg text-brand-dark">{bn(Number(e.event_date.slice(8, 10)))}</b><span className="text-[10px] text-muted">{new Intl.DateTimeFormat("bn-BD", { month: "short" }).format(new Date(`${e.event_date}T00:00:00`))}</span></span></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{e.title}</span>{e.location && <span className="text-xs text-muted">📍 {e.location}</span>}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* সদস্যদের শর্টকাট */}
        <section>
          <h2 className="mb-3 text-xl">{tr("সব সুবিধা", "Everything")}</h2>
          <div className="grid grid-cols-4 gap-2">
            {([
              ["📊", tr("স্বচ্ছ হিসাব", "Accounts"), "/hishab"],
              ["🏆", tr("সম্মাননা", "Honors"), "/honors"],
              ["🖼️", tr("গ্যালারি", "Gallery"), "/gallery"],
              ["📘", tr("ফেসবুক", "Posts"), "/posts"],
              ["📅", tr("কার্যক্রম", "Activities"), "/events"],
              ["📞", tr("হেল্পলাইন", "Helpline"), "/helpline"],
              ["ℹ️", tr("আমাদের কথা", "About"), "/about"],
              ["⚙️", tr("সেটিংস", "Settings"), "/settings"],
            ] as [string, string, string][]).map(([ic, l, h]) => (
              <Link key={h} href={h} className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl bg-white px-1 py-3 shadow-sm ring-1 ring-line transition active:scale-95">
                <span className="text-2xl" aria-hidden>{ic}</span>
                <span className="w-full truncate text-center text-xs font-semibold">{l}</span>
              </Link>
            ))}
          </div>
        </section>

        {stats && (
          <p className="text-center text-sm text-muted">
            {tr(`আমরা এখন ${bn(stats.members)} জন সদস্য, ${bn(stats.donors)} জন রক্তদাতা — একসাথে মানুষের পাশে।`, `${stats.members} members and ${stats.donors} blood donors — together for people.`)}
          </p>
        )}
      </div>
    </div>
  );
}
