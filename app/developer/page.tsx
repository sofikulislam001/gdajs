"use client";

import Link from "next/link";
import { devLinks, useDev } from "@/components/DeveloperCard";
import Logo from "@/components/Logo";
import { useLang } from "@/lib/lang";

export default function DeveloperPage() {
  const s = useDev();
  const { tr } = useLang();
  const links = devLinks(s);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f2b45] via-[#1b4a73] to-[#3f86bd] p-6 text-white shadow-[0_18px_44px_rgba(18,50,79,0.35)] sm:p-9">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent/20" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/developer.jpg" alt={s.dev_name} width={132} height={132} className="h-32 w-32 shrink-0 rounded-3xl border-4 border-white/90 object-cover shadow-2xl sm:h-36 sm:w-36" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-white/70">{tr("ডেভেলপার", "Developer")}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{s.dev_name}</h1>
            <p className="mt-1 text-lg font-medium text-accent">{s.dev_profession}</p>
            {s.dev_about && <p className="mt-3 max-w-xl whitespace-pre-line text-white/90">{s.dev_about}</p>}
          </div>
        </div>
      </section>

      {links.length > 0 && (
        <section className="card">
          <h2 className="text-lg">{tr("যোগাযোগ ও লিংক", "Contact & links")}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between rounded-2xl px-4 py-3.5 font-semibold transition hover:brightness-110 active:scale-[0.99] ${l.cls}`}>
                <span className="flex items-center gap-2.5">{l.icon}{l.label}</span>
                <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="card flex items-center gap-4">
        <Logo size={56} />
        <div className="min-w-0">
          <p className="font-bold">{tr("এই অ্যাপটি যার জন্য তৈরি", "This app is built for")}</p>
          <p className="text-muted">{tr("গোদনাইল আলোকিত যুব শক্তি — আর্তমানবতার সেবায় নিয়োজিত স্বেচ্ছাসেবী অরাজনৈতিক যুব সংগঠন", "Godnail Alokito Jubo Shakti — a volunteer, non-political youth organisation devoted to serving humanity")}</p>
        </div>
      </section>

      <p className="text-center"><Link href="/settings" className="text-sm font-semibold text-brand hover:underline">← {tr("সেটিংসে ফিরুন", "Back to settings")}</Link></p>
    </div>
  );
}
