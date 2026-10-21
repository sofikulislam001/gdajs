"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AIcon, type AdminIconName } from "@/components/AdminIcons";
import DeveloperCard from "@/components/DeveloperCard";
import Logo from "@/components/Logo";
import SetupNotice from "@/components/SetupNotice";
import { loginIdToEmail } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";

const tabs: { href: string; label: string; icon: AdminIconName }[] = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: "dashboard" },
  { href: "/admin/members", label: "সদস্য", icon: "users" },
  { href: "/admin/chada", label: "চাঁদা আদায়", icon: "coins" },
  { href: "/admin/khoroch", label: "খরচ ও অনুদান", icon: "receipt" },
  { href: "/admin/events", label: "কার্যক্রম", icon: "calendar" },
  { href: "/admin/posts", label: "ফেসবুক পোস্ট", icon: "facebook" },
  { href: "/admin/settings", label: "সেটিংস", icon: "settings" },
];

type State = "loading" | "out" | "not-admin" | "ok";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const [pending, setPending] = useState(0);

  async function check() {
    const sb = browserClient();
    const { data } = await sb.auth.getSession();
    if (!data.session) return setState("out");
    const { data: ok } = await sb.rpc("is_admin");
    setState(ok === true ? "ok" : "not-admin");
    if (ok === true) {
      const { count } = await sb.from("members").select("id", { count: "exact", head: true }).eq("status", "pending");
      setPending(count ?? 0);
    }
  }

  useEffect(() => {
    if (!isConfigured) return;
    void check();
  }, []);

  if (!isConfigured) return <SetupNotice />;

  async function login(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const email = loginIdToEmail(id);
    if (!email) return setError("ইমেইল বা মোবাইল নম্বর ঠিক নয়");
    setBusy(true);
    const { error: err } = await browserClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError("ইমেইল/মোবাইল বা পাসওয়ার্ড ঠিক নয়");
    setPassword("");
    await check();
  }

  async function logout() {
    await browserClient().auth.signOut();
    setState("out");
  }

  if (state === "loading") return <div className="container-x py-10 text-muted">লোড হচ্ছে…</div>;

  if (state === "out") {
    return (
      <div className="mx-auto my-8 max-w-sm">
      <form onSubmit={login} className="card space-y-4">
        <h1 className="text-2xl">অ্যাডমিন লগইন</h1>
        <div>
          <label className="label" htmlFor="id">ইমেইল</label>
          <input id="id" required value={id} onChange={(e) => setId(e.target.value)} className="input text-lg" autoComplete="username" />
        </div>
        <div>
          <label className="label" htmlFor="password">পাসওয়ার্ড</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input text-lg" autoComplete="current-password" />
        </div>
        {error && <p className="rounded-xl bg-blood/10 px-4 py-2 text-blood">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full py-3 text-lg">{busy ? "…" : "লগইন"}</button>
      </form>
      <DeveloperCard />
      </div>
    );
  }

  if (state === "not-admin") {
    return (
      <div className="card container-x mx-auto my-8 max-w-md text-center">
        <p className="font-display text-xl font-bold">এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই</p>
        <p className="mt-2 text-muted">সংগঠনের প্রধান অ্যাডমিনকে বলুন আপনাকে অ্যাডমিন তালিকায় যুক্ত করতে।</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/profile" className="btn btn-primary">আমার প্রোফাইল</Link>
          <button onClick={logout} className="btn btn-ghost">লগআউট</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_1fr] lg:gap-6">
      {/* ডেস্কটপ সাইডবার */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 overflow-hidden rounded-3xl bg-gradient-to-b from-[#12324f] via-[#1b4a73] to-[#245f8f] p-3 text-white shadow-[0_12px_32px_rgba(18,50,79,0.35)]">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <span className="rounded-full bg-white p-0.5"><Logo size={40} /></span>
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">অ্যাডমিন প্যানেল</p>
              <p className="text-xs text-white/70">ম্যানেজমেন্ট সিস্টেম</p>
            </div>
          </div>
          <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-white/50">মেনু</p>
          <nav className="space-y-0.5">
            {tabs.map((t) => {
              const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition ${active ? "bg-white text-[#12324f] shadow" : "text-white/85 hover:bg-white/10"}`}>
                  {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r bg-accent" />}
                  <AIcon name={t.icon} />
                  <span className="flex-1">{t.label}</span>
                  {t.href === "/admin/members" && pending > 0 && (
                    <span className="rounded-full bg-blood px-2 py-0.5 text-xs font-bold text-white">{pending}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 space-y-0.5 border-t border-white/15 pt-3">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold text-white/80 hover:bg-white/10"><AIcon name="external" /> সাইট দেখুন</Link>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold text-[#ffb4b4] hover:bg-white/10"><AIcon name="logout" /> লগআউট</button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* মোবাইল ট্যাব */}
        <div className="sticky top-[4.25rem] z-20 -mx-4 mb-5 bg-paper/95 px-4 py-2 backdrop-blur lg:hidden">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            {tabs.map((t) => {
              const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
              return (
                <Link key={t.href} href={t.href} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"}`}>
                  <AIcon name={t.icon} size={16} />
                  {t.label}
                  {t.href === "/admin/members" && pending > 0 && <span className="rounded-full bg-blood px-1.5 text-xs text-white">{pending}</span>}
                </Link>
              );
            })}
            <button onClick={logout} className="shrink-0 rounded-full border border-blood/30 bg-white px-4 py-2 text-sm font-semibold text-blood">লগআউট</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
