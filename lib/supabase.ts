import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

let browser: SupabaseClient | undefined;

/** ব্রাউজারে (client component) ব্যবহারের জন্য — লগইন সেশন ধরে রাখে */
export function browserClient(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase env missing");
  if (!browser) browser = createClient(url, key);
  return browser;
}

/** সার্ভারে (server component) পাবলিক ডেটা পড়ার জন্য */
export function serverClient(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
