"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { browserClient, isConfigured } from "@/lib/supabase";

const tabs = [
  { href: "/admin", label: "ড্যাশবোর্ড" },
  { href: "/admin/members", label: "সদস্য" },
  { href: "/admin/chada", label: "মাসিক চাঁদা" },
  { href: "/admin/khoroch", label: "খরচ ও অনুদান" },
  { href: "/admin/events", label: "কার্যক্রম/নোটিশ" },
  { href: "/admin/posts", label: "ফেসবুক পোস্ট" },
];

type State = "loading" | "out" | "not-admin" | "ok";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();

  async function check() {
    const sb = browserClient();
    const { data } = await sb.auth.getSession();
    if (!data.session) return setState("out");
    const { data: ok } = await sb.rpc("is_admin");
    setState(ok === true ? "ok" : "not-admin");
  }

  useEffect(() => {
    if (!isConfigured) return;
    void check();
  }, []);

  if (!isConfigured) return <SetupNotice />;

  async function login(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await browserClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError("ইমেইল বা পাসওয়ার্ড ঠিক নয়");
    setPassword("");
    await check();
  }

  async function logout() {
    await browserClient().auth.signOut();
    setState("out");
  }

  if (state === "loading") return <p className="text-muted">লোড হচ্ছে…</p>;

  if (state === "out") {
    return (
      <form onSubmit={login} className="card mx-auto max-w-sm space-y-4">
        <h1 className="text-2xl">অ্যাডমিন লগইন</h1>
        <div>
          <label className="label" htmlFor="email">ইমেইল</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">পাসওয়ার্ড</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="current-password" />
        </div>
        {error && <p className="text-blood">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "…" : "লগইন"}</button>
      </form>
    );
  }

  if (state === "not-admin") {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-display text-xl font-bold">এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই</p>
        <p className="mt-2 text-muted">সংগঠনের প্রধান অ্যাডমিনকে বলুন আপনাকে অ্যাডমিন তালিকায় যুক্ত করতে।</p>
        <button onClick={logout} className="btn btn-ghost mt-4">লগআউট</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className={`rounded-lg px-3 py-1.5 font-medium ${active ? "bg-brand text-white" : "text-muted hover:bg-brand-soft"}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="btn btn-ghost btn-sm">লগআউট</button>
      </div>
      {children}
    </div>
  );
}
