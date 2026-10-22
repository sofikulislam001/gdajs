"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { currentSubscription, enablePush, ensureSubscribed, isStandalone, pushSupported } from "@/lib/push";
import { isConfigured } from "@/lib/supabase";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const INSTALL_KEY = "gajs_install_dismiss";
const PUSH_KEY = "gajs_push_dismiss";
const DAY = 86400000;

function recentlyDismissed(key: string, days: number): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "never") return true;
    return !!v && Date.now() - Number(v) < days * DAY;
  } catch {
    return false;
  }
}
function remember(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* ignore */
  }
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 pb-5 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm animate-[page-in_0.25s_ease-out] overflow-hidden rounded-3xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/** প্রথম ভিজিটে অ্যাপ ইনস্টলের আমন্ত্রণ + ইনস্টল করা অ্যাপে নোটিফিকেশনের অনুমতি চাওয়া */
export default function AppPrompts() {
  const { tr } = useLang();
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState<"install" | "push" | null>(null);
  const [ios, setIos] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  // ইনস্টল ইভেন্ট ধরে রাখা (সেটিংসের বোতামও এটি ব্যবহার করে)
  useEffect(() => {
    const ua = navigator.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua));
    setMobile(/android|iphone|ipad|ipod|mobile/i.test(ua));
    const w = window as Window & { __bip?: BIPEvent };
    const h = (e: Event) => {
      e.preventDefault();
      w.__bip = e as BIPEvent;
      setBip(e as BIPEvent);
      window.dispatchEvent(new Event("bip-ready"));
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  // কোন ডায়ালগ দেখানো হবে
  useEffect(() => {
    if (!isConfigured || !ready) return;
    let t: number | undefined;
    if (isStandalone()) {
      if (user) {
        void ensureSubscribed(user.id);
        if (pushSupported() && Notification.permission === "default" && !recentlyDismissed(PUSH_KEY, 1)) {
          void currentSubscription().then((s) => {
            if (!s) t = window.setTimeout(() => setShow("push"), 1500);
          });
        }
      }
    } else if (!pathname.startsWith("/admin") && !recentlyDismissed(INSTALL_KEY, 3)) {
      t = window.setTimeout(() => setShow("install"), 2500);
    }
    return () => window.clearTimeout(t);
  }, [ready, user, pathname]);

  // অ্যাপ ইনস্টল হয়ে গেলে ডায়ালগ বন্ধ
  useEffect(() => {
    const done = () => setShow(null);
    window.addEventListener("appinstalled", done);
    return () => window.removeEventListener("appinstalled", done);
  }, []);

  if (!show) return null;
  // ইনস্টল ডায়ালগ: ডেস্কটপে ইনস্টল-সাপোর্ট না থাকলে দেখাব না
  if (show === "install" && !bip && !ios && !mobile) return null;

  async function installNow() {
    if (!bip) return;
    await bip.prompt();
    const r = await bip.userChoice.catch(() => ({ outcome: "dismissed" }));
    (window as Window & { __bip?: BIPEvent }).__bip = undefined;
    setBip(null);
    if (r.outcome !== "accepted") remember(INSTALL_KEY, String(Date.now()));
    setShow(null);
  }

  function later(key: string) {
    remember(key, String(Date.now()));
    setShow(null);
  }

  async function allowPush() {
    if (!user) return;
    setBusy(true);
    const r = await enablePush(user.id);
    setBusy(false);
    if (r === "ok") {
      setShow(null);
    } else if (r === "denied") {
      remember(PUSH_KEY, String(Date.now()));
      setNote(tr("নোটিফিকেশন বন্ধ করা আছে। ফোনের সেটিংস → অ্যাপস → এই অ্যাপ → নোটিফিকেশন থেকে চালু করুন।", "Notifications are blocked. Enable them in phone Settings → Apps → this app → Notifications."));
    } else {
      setNote(tr("চালু করা যায়নি। পরে সেটিংস থেকে আবার চেষ্টা করুন।", "Could not enable. Try again later from Settings."));
    }
  }

  if (show === "push") {
    return (
      <Sheet onClose={() => later(PUSH_KEY)}>
        <div className="bg-gradient-to-br from-[#12324f] via-[#1f5a8a] to-[#3f86bd] px-5 pb-5 pt-6 text-center text-white">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 text-3xl" aria-hidden>🔔</div>
          <h2 className="mt-3 text-xl">{tr("নোটিফিকেশন চালু করুন", "Turn on notifications")}</h2>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-muted">{tr("সংগঠনের নোটিশ, চাঁদার রিমাইন্ডার ও জরুরি রক্তের খবর সরাসরি ফোনের স্ক্রিনে পাবেন। কিছু মিস হবে না।", "Get organisation notices, dues reminders and urgent blood alerts right on your phone screen.")}</p>
          {note && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">{note}</p>}
          <button disabled={busy} onClick={allowPush} className="btn btn-primary w-full py-3 text-lg">{busy ? "…" : tr("অনুমতি দিন", "Allow")}</button>
          <button onClick={() => later(PUSH_KEY)} className="btn btn-ghost w-full">{tr("এখন নয়", "Not now")}</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={() => later(INSTALL_KEY)}>
      <div className="bg-gradient-to-br from-[#12324f] via-[#1f5a8a] to-[#3f86bd] px-5 pb-5 pt-6 text-center text-white">
        <span className="mx-auto block w-fit rounded-2xl bg-white p-1"><Logo size={56} /></span>
        <h2 className="mt-3 text-xl">{tr("আমাদের অ্যাপ ইনস্টল করুন", "Install our app")}</h2>
        <p className="text-sm text-white/80">{tr("গোদনাইল আলোকিত যুব শক্তি", "Godnail Alokito Jubo Shakti")}</p>
      </div>
      <div className="space-y-3 p-5">
        <ul className="space-y-1.5 text-[15px]">
          <li>⚡ {tr("হোম স্ক্রিন থেকে এক চাপে খুলুন", "Open in one tap from your home screen")}</li>
          <li>🔔 {tr("নোটিশ ও জরুরি রক্তের খবর ফোনে পান", "Get notices and blood alerts on your phone")}</li>
          <li>💳 {tr("চাঁদা জমা ও রসিদ দ্রুত", "Pay dues and get receipts quickly")}</li>
        </ul>
        {bip ? (
          <button onClick={installNow} className="btn btn-primary w-full py-3 text-lg">{tr("ইনস্টল করুন", "Install")}</button>
        ) : ios ? (
          <p className="rounded-2xl bg-paper p-3 text-sm">{tr("Safari-তে নিচের শেয়ার (⬆️) বোতাম চাপুন, তারপর “Add to Home Screen” বেছে নিন।", "In Safari tap the Share (⬆️) button, then choose “Add to Home Screen”.")}</p>
        ) : (
          <p className="rounded-2xl bg-paper p-3 text-sm">{tr("ব্রাউজারের মেনু (⋮) খুলে “Install app” বা “Add to Home screen” বেছে নিন।", "Open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.")}</p>
        )}
        <button onClick={() => later(INSTALL_KEY)} className="btn btn-ghost w-full">{bip ? tr("পরে", "Later") : tr("বুঝেছি", "Got it")}</button>
        <button onClick={() => { remember(INSTALL_KEY, "never"); setShow(null); }} className="block w-full text-center text-sm text-muted underline">{tr("আর দেখাবেন না", "Don't show again")}</button>
      </div>
    </Sheet>
  );
}
