"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import {
  AdminIcon, BloodIcon, EventIcon, FacebookIcon, HelplineIcon, InfoIcon, NavIcon,
  NoticeIcon, PeopleIcon, SettingsIcon, PostIcon, ReceiptIcon, ShareIcon, WalletIcon,
} from "./Icons";
import { useAuth } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";
import { FB_PAGE_URL } from "@/lib/brand";
import { ORG_NAME, ORG_SLOGAN } from "@/lib/bn";
import { useLang } from "@/lib/lang";

const drawerItems = [
  { href: "/about", bn: "আমাদের সম্পর্কে", en: "About us", icon: InfoIcon },
  { href: "/events", bn: "কার্যক্রম", en: "Activities", icon: EventIcon },
  { href: "/events?kind=notice", bn: "নোটিশ", en: "Notices", icon: NoticeIcon },
  { href: "/posts", bn: "ফেসবুক পোস্ট", en: "Facebook posts", icon: PostIcon },
  { href: "/blood", bn: "রক্তদাতা", en: "Blood donors", icon: BloodIcon },
  { href: "/hishab", bn: "স্বচ্ছ হিসাব", en: "Transparent accounts", icon: WalletIcon },
  { href: "/profile", bn: "আমার প্রোফাইল ও বকেয়া", en: "My profile & dues", icon: ReceiptIcon },
  { href: "/join", bn: "সদস্য হোন", en: "Become a member", icon: PeopleIcon },
  { href: "/helpline", bn: "হেল্পলাইন", en: "Helpline", icon: HelplineIcon },
];

const deskNav = [
  { href: "/", bn: "হোম", en: "Home" },
  { href: "/events", bn: "কার্যক্রম", en: "Activities" },
  { href: "/posts", bn: "ফেসবুক পোস্ট", en: "Facebook" },
  { href: "/blood", bn: "রক্তদাতা", en: "Blood donors" },
  { href: "/hishab", bn: "স্বচ্ছ হিসাব", en: "Accounts" },
  { href: "/profile", bn: "আমার প্রোফাইল", en: "My profile" },
  { href: "/join", bn: "সদস্য হোন", en: "Join" },
  { href: "/settings", bn: "সেটিংস", en: "Settings" },
];

const tabs = [
  { href: "/", bn: "হোম", en: "Home", icon: "home" as const },
  { href: "/events", bn: "কার্যক্রম", en: "Activities", icon: "event" as const },
  { href: "/hishab", bn: "হিসাব", en: "Accounts", icon: "wallet" as const },
  { href: "/profile", bn: "প্রোফাইল", en: "Profile", icon: "user" as const },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { tr } = useLang();
  const [unread, setUnread] = useState(0);
  const [me, setMe] = useState<{ name: string; photo: string | null } | null>(null);
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user || !isConfigured) {
      setMe(null);
      return;
    }
    browserClient()
      .from("members")
      .select("name,photo_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMe(data ? { name: data.name as string, photo: (data.photo_url as string | null) ?? null } : null));
  }, [user, pathname]);

  useEffect(() => {
    if (!user || !isConfigured) {
      setUnread(0);
      return;
    }
    browserClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user, pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function share() {
    const data = { title: ORG_NAME, text: ORG_SLOGAN, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        alert(tr("লিংক কপি হয়েছে", "Link copied"));
      }
    } catch {
      /* ব্যবহারকারী বাতিল করেছেন */
    }
  }

  if (isAdmin) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── উপরের অ্যাপ বার ── */}
      <header className="sticky top-0 z-30 bg-gradient-to-b from-sky to-[#6aa8d8] text-white">
        <div className="container-x flex h-16 items-center justify-between gap-2">
          <button onClick={() => setOpen(true)} aria-label={tr("মেনু খুলুন", "Open menu")} className="-ml-2 rounded-xl p-2 hover:bg-white/15">
            <NavIcon name="menu" size={28} />
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="hidden sm:block"><Logo size={34} /></span>
            <span className="truncate text-center text-lg font-bold sm:text-xl">{tr(ORG_NAME, "Godnail Alokito Jubo Shakti")}</span>
          </Link>
          <div className="-mr-2 flex items-center gap-1">
            <Link href={user ? "/notifications" : "/events?kind=notice"} aria-label={tr("নোটিফিকেশন", "Notifications")} className="relative rounded-xl p-2 hover:bg-white/15">
              <NavIcon name="bell" size={26} />
              {unread > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-blood px-1 text-[11px] font-bold leading-[18px] text-white">{unread > 9 ? "9+" : unread}</span>}
            </Link>
            {user ? (
              <Link href="/profile" aria-label={tr("আমার প্রোফাইল", "My profile")} className="rounded-full">
                <Avatar src={me?.photo} name={me?.name ?? tr("আমি", "Me")} size={36} />
              </Link>
            ) : (
              <Link href="/login" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-brand-dark shadow hover:bg-white/90">{tr("লগইন", "Login")}</Link>
            )}
          </div>
        </div>
        <nav className="container-x hidden gap-1 pb-2 md:flex">
          {deskNav.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-xl px-3 py-1.5 font-medium hover:bg-white/15 ${pathname === l.href ? "bg-white/20" : ""}`}>
              {tr(l.bn, l.en)}
            </Link>
          ))}
        </nav>
      </header>

      {/* ── সাইড মেনু ── */}
      <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/45 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="relative bg-gradient-to-b from-sky to-[#6aa8d8] px-6 pb-8 pt-10 text-center text-white">
            <button onClick={() => setOpen(false)} aria-label={tr("বন্ধ করুন", "Close")} className="absolute right-3 top-3 rounded-xl p-2 hover:bg-white/15">
              <NavIcon name="close" />
            </button>
            <div className="mx-auto mb-3 w-fit"><Logo size={64} /></div>
            <p className="text-xl font-bold leading-snug">{tr(ORG_NAME, "Godnail Alokito Jubo Shakti")}</p>
            <p className="mt-1 text-sm text-white/90">{tr(ORG_SLOGAN, "A volunteer, non-political youth organisation devoted to serving humanity")}</p>
          </div>
          <nav className="flex-1 py-2">
            {drawerItems.map((it) => (
              <Link key={it.href} href={it.href} className="flex items-center gap-4 px-6 py-3 text-lg font-medium hover:bg-sky-soft">
                <it.icon size={30} />
                {tr(it.bn, it.en)}
              </Link>
            ))}
            <Link href="/notifications" className="flex items-center gap-4 px-6 py-3 text-lg font-medium hover:bg-sky-soft">
              <NavIcon name="bell" size={26} />
              {tr("নোটিফিকেশন", "Notifications")}
              {unread > 0 && <span className="rounded-full bg-blood px-2 text-sm font-bold text-white">{unread}</span>}
            </Link>
            <Link href="/settings" className="flex items-center gap-4 px-6 py-3 text-lg font-medium hover:bg-sky-soft">
              <SettingsIcon size={26} />
              {tr("সেটিংস", "Settings")}
            </Link>
            <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-6 py-3 text-lg font-medium hover:bg-sky-soft">
              <FacebookIcon size={30} />
              {tr("ফেসবুক পেজ", "Facebook page")}
            </a>
            <button onClick={share} className="flex w-full items-center gap-4 px-6 py-3 text-left text-lg font-medium hover:bg-sky-soft">
              <ShareIcon size={30} />
              {tr("শেয়ার করুন", "Share")}
            </button>
            {user ? (
              <button
                onClick={async () => {
                  await browserClient().auth.signOut();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-4 px-6 py-3 text-left text-lg font-medium text-blood hover:bg-sky-soft"
              >
                <NavIcon name="close" size={26} />
                {tr("লগআউট", "Logout")}
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-4 px-6 py-3 text-lg font-semibold text-brand-dark hover:bg-sky-soft">
                <NavIcon name="user" size={26} />
                {tr("লগইন করুন", "Login")}
              </Link>
            )}
            <Link href="/admin" className="flex items-center gap-4 px-6 py-3 text-lg font-medium text-muted hover:bg-sky-soft">
              <AdminIcon size={30} />
              {tr("অ্যাডমিন", "Admin")}
            </Link>
          </nav>
        </aside>
      </div>

      {/* ── মূল অংশ ── */}
      <main className={`flex-1 ${isHome ? "" : isAdmin ? "mx-auto w-full max-w-7xl px-4 py-5" : "container-x py-6"} ${isAdmin ? "pb-10" : "pb-28 md:pb-10"}`}>{children}</main>

      <footer className="hidden border-t border-line bg-white py-6 text-center text-sm text-muted md:block">
        <p className="font-semibold text-ink">{tr(ORG_NAME, "Godnail Alokito Jubo Shakti")}</p>
        <p>{tr(ORG_SLOGAN, "A volunteer, non-political youth organisation devoted to serving humanity")}</p>
        <p className="mt-1"><Link href="/privacy" className="hover:underline">{tr("প্রাইভেসি পলিসি", "Privacy policy")}</Link> • <Link href="/settings" className="hover:underline">{tr("সেটিংস", "Settings")}</Link></p>
      </footer>

      {/* ── নিচের নেভিগেশন (মোবাইল) ── */}
      {!isAdmin && (
        <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden">
          <div className="relative rounded-t-[1.75rem] bg-gradient-to-b from-sky to-[#6aa8d8] pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-6px_20px_rgba(40,80,120,0.2)]">
            <div className="grid grid-cols-5 items-end px-2 pt-2">
              {tabs.slice(0, 2).map((t) => (
                <Tab key={t.href} href={t.href} label={tr(t.bn, t.en)} icon={t.icon} active={pathname === t.href} />
              ))}
              <div aria-hidden />
              {tabs.slice(2).map((t) => (
                <Tab key={t.href} href={t.href} label={tr(t.bn, t.en)} icon={t.icon} active={pathname === t.href} />
              ))}
            </div>
            <Link
              href="/blood"
              aria-label={tr("রক্তদাতা খুঁজুন", "Find blood donors")}
              className="absolute -top-7 left-1/2 grid h-[4.25rem] w-[4.25rem] -translate-x-1/2 place-items-center rounded-full border-[5px] border-paper bg-white shadow-lg"
            >
              <BloodIcon size={34} />
            </Link>
            <p className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 text-xs font-semibold">{tr("রক্ত", "Blood")}</p>
          </div>
        </nav>
      )}
    </div>
  );
}

function Tab({ href, label, icon, active }: { href: string; label: string; icon: "home" | "event" | "wallet" | "user"; active: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-0.5 pb-2 text-xs font-semibold ${active ? "text-white" : "text-white/75"}`}>
      <span className={`rounded-full px-4 py-1 ${active ? "bg-white/25" : ""}`}><NavIcon name={icon} size={24} /></span>
      {label}
    </Link>
  );
}
