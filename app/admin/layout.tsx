"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { loginIdToEmail } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";

const tabs = [
  { href: "/admin", label: "হোম" },
  { href: "/admin/members", label: "সদস্য" },
  { href: "/admin/chada", label: "চাঁদা" },
  { href: "/admin/khoroch", label: "খরচ/অনুদান" },
  { href: "/admin/events", label: "কার্যক্রম" },
  { href: "/admin/posts", label: "ফেসবুক পোস্ট" },
];

type State = "loading" | "out" | "not-admin" | "ok";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [id, setId] = useState("");
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
      <form onSubmit={login} className="card container-x mx-auto my-8 max-w-sm space-y-4">
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
    <div className="container-x py-5">
      <div className="mb-6 rounded-3xl border border-line bg-white p-2 shadow-[0_4px_16px_rgba(40,80,120,0.07)]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={`whitespace-nowrap rounded-2xl px-4 py-2 font-semibold transition ${active ? "bg-brand text-white" : "text-muted hover:bg-brand-soft"}`}>
                {t.label}
              </Link>
            );
          })}
          <button onClick={logout} className="ml-auto whitespace-nowrap rounded-2xl px-4 py-2 font-semibold text-blood hover:bg-blood/10">লগআউট</button>
        </div>
      </div>
      {children}
    </div>
  );
}
