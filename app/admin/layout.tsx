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
  { href: "/admin/requests", label: "চাঁদা যাচাই", icon: "check" },
  { href: "/admin/notice", label: "নোটিশ ও রিমাইন্ডার", icon: "chat" },
  { href: "/admin/gallery", label: "ফটো গ্যালারি", icon: "grid" },
  { href: "/admin/honors", label: "সম্মাননা", icon: "alert" },
  { href: "/admin/report", label: "মাসিক রিপোর্ট", icon: "list" },
  { href: "/admin/settings", label: "সেটিংস ও অ্যাডমিন", icon: "settings" },
];

type Role = "super" | "treasurer" | "editor";
/** কোন রোল কোন পাতা দেখতে পারে (super সব দেখে) */
const ACCESS: Record<string, Role[]> = {
  "/admin": ["super", "treasurer", "editor"],
  "/admin/members": ["super", "treasurer"],
  "/admin/chada": ["super", "treasurer"],
  "/admin/requests": ["super", "treasurer"],
  "/admin/khoroch": ["super", "treasurer"],
  "/admin/report": ["super", "treasurer"],
  "/admin/events": ["super", "editor"],
  "/admin/posts": ["super", "editor"],
  "/admin/gallery": ["super", "editor"],
  "/admin/honors": ["super", "editor"],
  "/admin/notice": ["super", "editor"],
  "/admin/settings": ["super"],
};

type State = "loading" | "out" | "not-admin" | "ok";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const [pending, setPending] = useState(0);
  const [reqCount, setReqCount] = useState(0);
  const [role, setRole] = useState<Role>("super");
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  async function check() {
    const sb = browserClient();
    const { data } = await sb.auth.getSession();
    if (!data.session) return setState("out");
    const { data: ok } = await sb.rpc("is_admin");
    setState(ok === true ? "ok" : "not-admin");
    if (ok === true) {
      const { data: r } = await sb.rpc("admin_role");
      const rr: Role = r === "treasurer" || r === "editor" ? r : "super";
      setRole(rr);
      if (rr !== "editor") {
        const { count: rc } = await sb.from("payment_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
        setReqCount(rc ?? 0);
      }
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

  const current = tabs.find((t) => (t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href)));
  const groups: { title: string; hrefs: string[] }[] = [
    { title: "ওভারভিউ", hrefs: ["/admin"] },
    { title: "ব্যবস্থাপনা", hrefs: ["/admin/members", "/admin/chada", "/admin/requests", "/admin/khoroch", "/admin/report"] },
    { title: "কনটেন্ট", hrefs: ["/admin/events", "/admin/posts", "/admin/gallery", "/admin/honors", "/admin/notice"] },
    { title: "সিস্টেম", hrefs: ["/admin/settings"] },
  ]
    .map((g) => ({ ...g, hrefs: g.hrefs.filter((h) => ACCESS[h]?.includes(role)) }))
    .filter((g) => g.hrefs.length > 0);
  const allowed = ACCESS[tabs.find((t) => (t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href)))?.href ?? "/admin"]?.includes(role) ?? true;

  return (
    <div className="min-h-screen bg-paper">
      {/* উপরের বার */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#12324f] to-[#1f5a8a] text-white shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3">
          <button onClick={() => setMenu(true)} aria-label="মেনু খুলুন" className="rounded-xl p-2 hover:bg-white/15">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold leading-tight">{current?.label ?? "অ্যাডমিন"}</p>
            <p className="hidden text-xs text-white/70 sm:block">গোদনাইল আলোকিত যুব শক্তি • অ্যাডমিন প্যানেল</p>
          </div>
          {pending > 0 && (
            <Link href="/admin/members" className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-bold text-ink">
              {pending} <span className="hidden sm:inline">নতুন আবেদন</span>
            </Link>
          )}
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-white/15 sm:flex"><AIcon name="external" size={16} /> সাইট</Link>
          <span className="rounded-full bg-white p-0.5"><Logo size={32} /></span>
        </div>
      </header>

      {/* ড্রয়ার মেনু */}
      <div className={`fixed inset-0 z-40 ${menu ? "" : "pointer-events-none"}`} aria-hidden={!menu}>
        <div onClick={() => setMenu(false)} className={`absolute inset-0 bg-black/50 transition-opacity ${menu ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col overflow-y-auto bg-gradient-to-b from-[#12324f] via-[#1b4a73] to-[#245f8f] text-white shadow-2xl transition-transform duration-300 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center gap-3 px-4 pb-3 pt-5">
            <span className="rounded-full bg-white p-0.5"><Logo size={44} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight">অ্যাডমিন প্যানেল</p>
              <p className="text-xs text-white/70">ম্যানেজমেন্ট সিস্টেম</p>
            </div>
            <button onClick={() => setMenu(false)} aria-label="বন্ধ করুন" className="rounded-xl p-2 hover:bg-white/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <nav className="flex-1 space-y-4 px-3 py-2">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase text-white/50">{g.title}</p>
                <div className="space-y-0.5">
                  {g.hrefs.map((h) => {
                    const t = tabs.find((x) => x.href === h)!;
                    const active = h === "/admin" ? pathname === "/admin" : pathname.startsWith(h);
                    return (
                      <Link key={h} href={h} className={`flex items-center gap-3 rounded-2xl px-3 py-3 font-semibold transition ${active ? "bg-white text-[#12324f] shadow" : "text-white/90 hover:bg-white/10"}`}>
                        <AIcon name={t.icon} />
                        <span className="flex-1">{t.label}</span>
                        {h === "/admin/requests" && reqCount > 0 && <span className="rounded-full bg-blood px-2 py-0.5 text-xs font-bold text-white">{reqCount}</span>}
                        {h === "/admin/members" && pending > 0 && <span className="rounded-full bg-blood px-2 py-0.5 text-xs font-bold text-white">{pending}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="space-y-0.5 border-t border-white/15 px-3 py-3">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-3 py-3 font-semibold text-white/85 hover:bg-white/10"><AIcon name="external" /> সাইট দেখুন</Link>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 font-semibold text-[#ffb4b4] hover:bg-white/10"><AIcon name="logout" /> লগআউট</button>
          </div>
        </aside>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 pb-12">
        {allowed ? children : (
          <div className="card mx-auto max-w-md text-center">
            <p className="text-xl font-bold">এই পাতায় আপনার অনুমতি নেই</p>
            <p className="mt-2 text-muted">আপনার ভূমিকা: {role === "treasurer" ? "কোষাধ্যক্ষ (হিসাব)" : "সম্পাদক (কনটেন্ট)"}। প্রধান অ্যাডমিনকে বলুন।</p>
            <Link href="/admin" className="btn btn-primary mt-4">ড্যাশবোর্ডে যান</Link>
          </div>
        )}
      </main>
    </div>
  );
}
