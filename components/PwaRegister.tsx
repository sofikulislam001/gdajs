"use client";

import { useEffect } from "react";
import { browserClient, isConfigured } from "@/lib/supabase";

const VID_KEY = "gajs_vid";

function visitorId(): string {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return crypto.randomUUID();
  }
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** সার্ভিস ওয়ার্কার, অ্যাপ-মোডের আচরণ এবং নামহীন ভিজিটর গণনা */
export default function PwaRegister() {
  useEffect(() => {
    const standalone = isStandalone();

    // ইনস্টল করা অ্যাপে জুম বন্ধ: অ্যাপের মতো স্থির স্ক্রিন
    if (standalone) {
      document.documentElement.classList.add("is-app");
      const m = document.querySelector('meta[name="viewport"]');
      m?.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    }

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (!isConfigured) return;
    const vid = visitorId();
    let installed = false;
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      void browserClient().rpc("track_visit", { p_vid: vid, p_app: standalone, p_installed: installed || standalone }).then(() => {}, () => {});
    };
    const onInstalled = () => {
      installed = true;
      ping();
    };
    ping();
    const t = window.setInterval(ping, 60000);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
