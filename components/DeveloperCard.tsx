"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient, isConfigured } from "@/lib/supabase";
import { waLink } from "@/lib/bn";
import { SETTING_DEFAULTS, type SiteSettings } from "@/lib/settings";

const Fb = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z" /></svg>);
const Gh = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.300.1-2.700 0 0 .8-.3 2.800 1a9.600 9.600 0 0 1 5 0c1.900-1.300 2.800-1 2.800-1 .5 1.400.2 2.400.1 2.700.6.700 1 1.600 1 2.700 0 3.900-2.400 4.700-4.600 5 .4.300.7.900.7 1.800v2.700c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg>);
const Wa = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm5.200 14.200c-.2.600-1.300 1.200-1.800 1.200-.5.100-1 .2-3.300-.7-2.800-1.100-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800 0-1.300.7-2 .9-2.300.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .500l-.3.400-.4.400c-.1.200-.3.300-.1.600.2.300.8 1.300 1.700 2.100 1.200 1 2.100 1.300 2.400 1.500.3.100.5.100.6-.1l.8-1c.2-.2.400-.2.600-.1l1.900.9c.3.100.5.200.5.300.1.200.1.800-.1 1.400z" /></svg>);
const Globe = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.500 2.600 3.800 5.600 3.800 9S14.500 18.400 12 21c-2.500-2.600-3.800-5.600-3.800-9S9.500 5.600 12 3z" /></svg>);

export function useDev() {
  const [s, setS] = useState<SiteSettings>(SETTING_DEFAULTS);

  useEffect(() => {
    if (!isConfigured) return;
    browserClient()
      .from("site_settings")
      .select("key,value")
      .like("key", "dev_%")
      .then(({ data }) => {
        const v = { ...SETTING_DEFAULTS } as Record<string, string>;
        for (const r of (data as { key: string; value: string }[]) ?? []) if (r.key in v && r.value) v[r.key] = r.value;
        setS(v as unknown as SiteSettings);
      });
  }, []);

  return s;
}

export function devLinks(s: SiteSettings) {
  return [
    s.dev_portfolio && { href: s.dev_portfolio, label: "Portfolio", icon: <Globe />, cls: "bg-ink text-white" },
    s.dev_facebook && { href: s.dev_facebook, label: "Facebook", icon: <Fb />, cls: "bg-[#1877f2] text-white" },
    s.dev_github && { href: s.dev_github, label: "GitHub", icon: <Gh />, cls: "bg-[#24292f] text-white" },
    s.dev_whatsapp && { href: waLink(s.dev_whatsapp, "আসসালামু আলাইকুম"), label: "WhatsApp", icon: <Wa />, cls: "bg-[#25d366] text-white" },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; cls: string }[];
}

export default function DeveloperCard() {
  const s = useDev();
  const links = devLinks(s);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_4px_16px_rgba(40,80,120,0.07)]" aria-label="ডেভেলপারের পরিচিতি">
      <div className="bg-gradient-to-r from-[#1f4f7a] to-brand px-4 py-1.5 text-center text-xs font-semibold text-white/90">DESIGNED &amp; DEVELOPED BY</div>
      <div className="flex items-center gap-4 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/developer.jpg" alt={s.dev_name} width={72} height={72} className="h-[72px] w-[72px] shrink-0 rounded-2xl border-2 border-white object-cover shadow-md ring-2 ring-brand/30" />
        <div className="min-w-0 text-left">
          <p className="truncate text-lg font-bold leading-tight">{s.dev_name}</p>
          <p className="text-sm font-medium text-brand-dark">{s.dev_profession}</p>
          <Link href="/developer" className="text-xs font-semibold text-brand hover:underline">বিস্তারিত দেখুন →</Link>
        </div>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition hover:brightness-110 active:scale-95 ${l.cls}`}>
              {l.icon}
              {l.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
