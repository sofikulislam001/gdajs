"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { currentSubscription, enablePush, pushSupported } from "@/lib/push";
import { browserClient, isConfigured } from "@/lib/supabase";

type St = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

/** ফোনে পুশ নোটিফিকেশন চালু/বন্ধ করার সুইচ (সেটিংস পাতায়) */
export default function PushToggle() {
  const { tr } = useLang();
  const { user, ready } = useAuth();
  const [st, setSt] = useState<St>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const check = useCallback(async () => {
    if (!pushSupported()) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      return setSt(ios ? "ios-install" : "unsupported");
    }
    if (Notification.permission === "denied") return setSt("denied");
    const sub = await currentSubscription();
    setSt(sub && Notification.permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  async function enable() {
    setMsg("");
    setBusy(true);
    const r = await enablePush(user!.id);
    setBusy(false);
    if (r === "ok") {
      setSt("on");
      setMsg(tr("চালু হয়েছে। এখন থেকে নোটিফিকেশন ফোনে আসবে।", "Enabled. Notifications will now reach this device."));
    } else if (r === "denied") setSt("denied");
    else setMsg(tr("চালু করা যায়নি। ইনস্টল করা অ্যাপ বা আপডেটেড ব্রাউজার থেকে আবার চেষ্টা করুন।", "Could not enable. Try again from the installed app or an up-to-date browser."));
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await browserClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSt("off");
      setMsg("");
    } finally {
      setBusy(false);
    }
  }

  if (!isConfigured) return null;

  return (
    <div className="space-y-2 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{tr("ফোনে পুশ নোটিফিকেশন", "Push notifications")}</p>
          <p className="text-sm text-muted">{tr("নোটিশ, চাঁদার রিমাইন্ডার ও জরুরি রক্তের খবর ফোনের স্ক্রিনে পান।", "Get notices, dues reminders and urgent blood alerts on your phone.")}</p>
        </div>
        {st === "on" && <button disabled={busy} onClick={disable} className="btn btn-ghost btn-sm shrink-0">{tr("বন্ধ করুন", "Turn off")}</button>}
        {st === "off" && ready && user && <button disabled={busy} onClick={enable} className="btn btn-primary btn-sm shrink-0">{busy ? "…" : tr("চালু করুন", "Turn on")}</button>}
      </div>
      {ready && !user && <p className="text-sm text-muted">{tr("চালু করতে আগে লগইন করুন।", "Login first to turn this on.")}</p>}
      {st === "on" && <p className="text-sm font-semibold text-brand">✓ {tr("এই ডিভাইসে চালু আছে", "Active on this device")}</p>}
      {st === "denied" && <p className="text-sm text-blood">{tr("ব্রাউজার/ফোনের সেটিংসে এই সাইটের নোটিফিকেশন অনুমতি বন্ধ আছে। সেখান থেকে “Allow” করুন।", "Notifications are blocked for this site in your browser/phone settings. Allow them there.")}</p>}
      {st === "unsupported" && <p className="text-sm text-muted">{tr("এই ব্রাউজারে পুশ নোটিফিকেশন চলে না। Chrome ব্যবহার করুন।", "This browser does not support push notifications. Try Chrome.")}</p>}
      {st === "ios-install" && <p className="text-sm text-muted">{tr("আইফোনে আগে Safari-র শেয়ার বোতাম থেকে “Add to Home Screen” দিয়ে অ্যাপটি ইনস্টল করুন, তারপর অ্যাপ খুলে এখানে চালু করুন (iOS ১৬.৪+)।", "On iPhone, first install the app via Safari Share → “Add to Home Screen”, then open it and enable here (iOS 16.4+).")}</p>}
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
