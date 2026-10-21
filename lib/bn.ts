import { getLang } from "./langState";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export const ORG_NAME = "গোদনাইল আলোকিত যুব শক্তি";
export const ORG_SLOGAN = "আর্তমানবতার সেবায় নিয়োজিত স্বেচ্ছাসেবী অরাজনৈতিক যুব সংগঠন";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/** ইংরেজি সংখ্যা → বাংলা সংখ্যা */
export function bn(value: number | string): string {
  if (getLang() === "en") return String(value);
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** বাংলা সংখ্যা → ইংরেজি সংখ্যা (ফর্মে ইনপুটের জন্য) */
export function en(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function taka(n: number | null | undefined): string {
  return `${bn((n ?? 0).toLocaleString("en-IN"))} ৳`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return new Intl.DateTimeFormat(getLang() === "en" ? "en-GB" : "bn-BD", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function fmtMonth(iso: string): string {
  const d = new Date(`${iso.slice(0, 7)}-01T00:00:00`);
  return new Intl.DateTimeFormat(getLang() === "en" ? "en-GB" : "bn-BD", { month: "long", year: "numeric" }).format(d);
}

/** "2026-10" ফরম্যাটে চলতি মাস */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-10" → "2026-10-01" (ডাটাবেসের জন্য) */
export function monthStart(key: string): string {
  return `${key}-01`;
}

/** বাংলাদেশি মোবাইল নম্বর ঠিক করা: ০১৭১১-২২৩৩৪৪ → 01711223344 */
export function normalizePhone(raw: string): string {
  let p = en(raw).replace(/[^\d+]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  else if (p.startsWith("88") && p.length === 13) p = p.slice(2);
  return p;
}

export function isValidPhone(p: string): boolean {
  return /^01[3-9]\d{8}$/.test(p);
}

/** হোয়াটসঅ্যাপে সরাসরি মেসেজ পাঠানোর লিংক */
export function waLink(phone: string, message: string): string {
  const p = normalizePhone(phone);
  const intl = p.startsWith("0") ? `88${p}` : p;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "কিছু একটা সমস্যা হয়েছে";
}
