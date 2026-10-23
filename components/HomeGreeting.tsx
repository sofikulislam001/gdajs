"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { bn, currentMonthKey } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import { useLang } from "@/lib/lang";
import { browserClient, isConfigured } from "@/lib/supabase";
import type { Member, Payment } from "@/lib/types";

function greeting(tr: (b: string, e: string) => string): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dhaka" }).format(new Date()));
  if (h < 5) return tr("শুভ রাত্রি", "Good night");
  if (h < 12) return tr("শুভ সকাল", "Good morning");
  if (h < 16) return tr("শুভ দুপুর", "Good afternoon");
  if (h < 19) return tr("শুভ বিকাল", "Good evening");
  return tr("শুভ সন্ধ্যা", "Good evening");
}

/** হোমের উপরে ব্যক্তিগত স্বাগত-কার্ড: লগইন থাকলে নাম ও চাঁদার অবস্থা, না থাকলে যোগদানের আমন্ত্রণ */
export default function HomeGreeting() {
  const { tr } = useLang();
  const { user, ready } = useAuth();
  const [m, setM] = useState<Member | null>(null);
  const [pay, setPay] = useState<Payment[]>([]);

  useEffect(() => {
    if (!isConfigured || !user) return;
    const sb = browserClient();
    void Promise.all([sb.from("members").select("*").maybeSingle(), sb.from("payments").select("*")]).then(([a, b]) => {
      setM((a.data as Member | null) ?? null);
      setPay((b.data as Payment[]) ?? []);
    });
  }, [user]);

  if (!isConfigured || !ready) return <div className="h-[84px]" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(30,70,110,0.18)] ring-1 ring-line">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-2xl" aria-hidden>🤝</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">{tr("আমাদের পরিবারে যোগ দিন", "Join our family")}</p>
          <p className="truncate text-sm text-muted">{tr("সদস্য হয়ে মানুষের পাশে দাঁড়ান", "Become a member and stand with people")}</p>
        </div>
        <Link href="/login" className="btn btn-primary btn-sm shrink-0">{tr("লগইন", "Login")}</Link>
      </div>
    );
  }

  if (!m) {
    return (
      <Link href="/profile" className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(30,70,110,0.18)] ring-1 ring-line">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-2xl" aria-hidden>👋</span>
        <p className="font-bold">{tr("স্বাগতম! প্রোফাইল দেখুন", "Welcome! Open your profile")}</p>
      </Link>
    );
  }

  const due = m.status === "active" ? dueFor(m, pay, currentMonthKey()) : null;
  return (
    <Link href="/profile" className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(30,70,110,0.18)] ring-1 ring-line transition active:scale-[0.99]">
      {m.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand-soft" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-xl font-bold text-white">{m.name.trim().charAt(0)}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{greeting(tr)} 👋</p>
        <p className="truncate font-bold leading-tight">{m.name}</p>
        <p className="text-xs text-muted">
          {m.status === "pending"
            ? tr("অনুমোদনের অপেক্ষায়", "Awaiting approval")
            : due && due.due === 0
              ? tr("✅ চাঁদা পরিশোধিত", "✅ Dues paid")
              : due && `⏳ ${bn(due.due)} ${tr("মাসের চাঁদা বাকি", "month(s) due")}`}
        </p>
      </div>
      <span className="text-xl text-brand" aria-hidden>›</span>
    </Link>
  );
}
