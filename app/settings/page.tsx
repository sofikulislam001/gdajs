"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FB_PAGE_URL } from "@/lib/brand";
import { getTextSize, setTextSize, useLang } from "@/lib/lang";
import { useAuth } from "@/lib/auth";
import { browserClient } from "@/lib/supabase";

function Row({ href, title, sub, onClick, external, danger }: { href?: string; title: string; sub?: string; onClick?: () => void; external?: boolean; danger?: boolean }) {
  const cls = `flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-brand-soft ${danger ? "text-blood" : ""}`;
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {sub && <span className="block text-sm text-muted">{sub}</span>}
      </span>
      <span aria-hidden className="text-muted">›</span>
    </>
  );
  if (href) return external ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-bold uppercase text-muted">{title}</h2>
      <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-[0_4px_16px_rgba(40,80,120,0.06)]">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { lang, setLang, tr } = useLang();
  const { user } = useAuth();
  const [size, setSize] = useState<"normal" | "large" | "xlarge">("normal");

  useEffect(() => setSize(getTextSize()), []);

  async function share() {
    const data = { title: tr("গোদনাইল আলোকিত যুব শক্তি", "Godnail Alokito Jubo Shakti"), url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        alert(tr("লিংক কপি হয়েছে", "Link copied"));
      }
    } catch {
      /* বাতিল */
    }
  }

  const seg = (active: boolean) => `flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${active ? "bg-brand text-white shadow" : "text-muted hover:bg-brand-soft"}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl">{tr("সেটিংস", "Settings")}</h1>
        <p className="text-muted">{tr("অ্যাপের ভাষা, লেখার আকার ও অন্যান্য তথ্য", "App language, text size and other information")}</p>
      </div>

      <Group title={tr("ভাষা ও চেহারা", "Language & display")}>
        <div className="space-y-2 p-4">
          <p className="font-semibold">{tr("ভাষা", "Language")}</p>
          <div className="flex gap-1 rounded-2xl bg-paper p-1">
            <button onClick={() => setLang("bn")} className={seg(lang === "bn")}>বাংলা</button>
            <button onClick={() => setLang("en")} className={seg(lang === "en")}>English</button>
          </div>
        </div>
        <div className="space-y-2 p-4">
          <p className="font-semibold">{tr("লেখার আকার", "Text size")}</p>
          <div className="flex gap-1 rounded-2xl bg-paper p-1">
            {([["normal", tr("সাধারণ", "Normal")], ["large", tr("বড়", "Large")], ["xlarge", tr("আরও বড়", "Extra large")]] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setSize(k); setTextSize(k); }} className={seg(size === k)}>{l}</button>
            ))}
          </div>
        </div>
      </Group>

      <Group title={tr("অ্যাকাউন্ট", "Account")}>
        {user ? (
          <>
            <Row href="/profile" title={tr("আমার প্রোফাইল", "My profile")} sub={tr("তথ্য, চাঁদার হিসাব, পাসওয়ার্ড", "Details, dues, password")} />
            <Row href="/notifications" title={tr("নোটিফিকেশন", "Notifications")} />
            <Row
              danger
              title={tr("লগআউট", "Logout")}
              onClick={async () => {
                await browserClient().auth.signOut();
                router.push("/");
              }}
            />
          </>
        ) : (
          <>
            <Row href="/login" title={tr("লগইন করুন", "Login")} />
            <Row href="/join" title={tr("নতুন সদস্য হোন", "Become a member")} />
          </>
        )}
      </Group>

      <Group title={tr("তথ্য ও নীতিমালা", "Information & policies")}>
        <Row href="/privacy" title={tr("প্রাইভেসি পলিসি", "Privacy policy")} sub={tr("আপনার তথ্য কীভাবে ব্যবহার ও সুরক্ষিত হয়", "How your data is used and protected")} />
        <Row href="/about" title={tr("আমাদের সম্পর্কে", "About us")} />
        <Row href="/helpline" title={tr("হেল্পলাইন", "Helpline")} />
        <Row href="/developer" title={tr("ডেভেলপার", "Developer")} sub={tr("অ্যাপ যিনি বানিয়েছেন", "Who built this app")} />
        <Row href={FB_PAGE_URL} external title={tr("ফেসবুক পেজ", "Facebook page")} />
        <Row onClick={share} title={tr("অ্যাপ শেয়ার করুন", "Share this app")} />
      </Group>

      <p className="text-center text-sm text-muted">{tr("গোদনাইল আলোকিত যুব শক্তি • সংস্করণ ২.০", "Godnail Alokito Jubo Shakti • Version 2.0")}</p>
    </div>
  );
}
