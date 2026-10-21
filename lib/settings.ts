import { serverClient, isConfigured } from "./supabase";

export type SiteSettings = {
  contact_phone: string;
  payment_note: string;
  fb_page_url: string;
  default_fee: string;
  dev_name: string;
  dev_profession: string;
  dev_facebook: string;
  dev_github: string;
  dev_whatsapp: string;
  dev_portfolio: string;
};

export const SETTING_DEFAULTS: SiteSettings = {
  contact_phone: "",
  payment_note: "",
  fb_page_url: "https://www.facebook.com/gajs",
  default_fee: "100",
  dev_name: "MD SOFIKUL ISLAM",
  dev_profession: "Web Developer",
  dev_facebook: "",
  dev_github: "https://github.com/sofikulislam001",
  dev_whatsapp: "",
  dev_portfolio: "",
};

/** সার্ভার কম্পোনেন্টে সেটিংস পড়া (না পেলে ডিফল্ট) */
export async function getSettings(): Promise<SiteSettings> {
  const out = { ...SETTING_DEFAULTS };
  if (!isConfigured) return out;
  try {
    const { data } = await serverClient().from("site_settings").select("key,value");
    for (const r of (data as { key: string; value: string }[]) ?? []) {
      if (r.key in out && r.value) (out as Record<string, string>)[r.key] = r.value;
    }
  } catch {
    /* ডিফল্ট ব্যবহার */
  }
  return out;
}
