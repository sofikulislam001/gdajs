"use client";

import { browserClient } from "./supabase";

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const reg = (await navigator.serviceWorker.getRegistration("/sw.js")) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  return reg;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

/** সাবস্ক্রিপশন তৈরি করে ডাটাবেসে রাখে। অনুমতি আগে দেওয়া না থাকলে চায়। */
export async function enablePush(userId: string): Promise<"ok" | "denied" | "error"> {
  try {
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") return perm === "denied" ? "denied" : "error";
    const sb = browserClient();
    const { data: key } = await sb.rpc("get_push_public_key");
    if (!key) return "error";
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(String(key)) });
    const j = sub.toJSON();
    const { error } = await sb.from("push_subscriptions").upsert(
      { user_id: userId, endpoint: sub.endpoint, p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" },
      { onConflict: "endpoint" },
    );
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

/** অনুমতি আগেই দেওয়া থাকলে (যেমন অ্যাপ নতুন করে ইনস্টলের পর) চুপচাপ আবার নিবন্ধন */
export async function ensureSubscribed(userId: string): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  await enablePush(userId);
}
