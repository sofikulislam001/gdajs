"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { browserClient, isConfigured } from "./supabase";
import { isValidPhone, normalizePhone } from "./bn";

/** মোবাইল নম্বর দিলে ভেতরে একটি ইমেইল-রূপ বানানো হয় (সদস্যদের ইমেইল লাগে না) */
export function emailForPhone(phone: string): string {
  return `${phone}@members.gdajs.app`;
}

/** লগইনের ঘরে মোবাইল নম্বর বা ইমেইল যেটাই লিখুক */
export function loginIdToEmail(id: string): string | null {
  const t = id.trim();
  if (!t) return null;
  if (t.includes("@")) return t.toLowerCase();
  const p = normalizePhone(t);
  return isValidPhone(p) ? emailForPhone(p) : null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setReady(true);
      return;
    }
    const sb = browserClient();
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, ready };
}

const API_ERRORS: Record<string, string> = {
  name_required: "নাম লিখুন",
  phone_invalid: "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX)",
  password_short: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
  phone_exists: "এই মোবাইল নম্বর দিয়ে আগেই নিবন্ধন করা আছে। লগইন করুন।",
  blood_invalid: "রক্তের গ্রুপ ঠিক নয়",
  dob_invalid: "জন্মতারিখ ঠিক নয়",
  date_invalid: "তারিখ ঠিক নয়",
  busy: "এখন অনেক আবেদন জমা আছে, একটু পরে চেষ্টা করুন",
  create_failed: "অ্যাকাউন্ট খোলা যায়নি, একটু পরে আবার চেষ্টা করুন",
  save_failed: "তথ্য সংরক্ষণ করা যায়নি, আবার চেষ্টা করুন",
  unauthorized: "আবার লগইন করুন",
  forbidden: "এই কাজের অনুমতি নেই",
  not_found: "সদস্য পাওয়া যায়নি",
};

/** সদস্য নিবন্ধন ও অ্যাডমিনের পাসওয়ার্ড-সেট — Supabase Edge Function */
export async function callMemberApi(body: Record<string, unknown>): Promise<{ ok: true; created?: boolean } | { ok: false; message: string }> {
  const sb = browserClient();
  const { data } = await sb.auth.getSession();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/member-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; created?: boolean; error?: string };
    if (res.ok && json.ok) return { ok: true, created: json.created };
    return { ok: false, message: API_ERRORS[json.error ?? ""] ?? "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন" };
  } catch {
    return { ok: false, message: "ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না" };
  }
}
