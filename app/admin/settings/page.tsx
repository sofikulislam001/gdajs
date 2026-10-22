"use client";

import { useEffect, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { browserClient } from "@/lib/supabase";
import { errorMessage } from "@/lib/bn";
import { SETTING_DEFAULTS, type SiteSettings } from "@/lib/settings";

const FIELDS: { key: keyof SiteSettings; label: string; hint: string; placeholder: string; multiline?: boolean }[] = [
  { key: "contact_phone", label: "সংগঠনের যোগাযোগ নম্বর", hint: "হেল্পলাইন পাতায় সবার জন্য দেখাবে।", placeholder: "01XXXXXXXXX" },
  { key: "payment_note", label: "চাঁদা পাঠানোর নির্দেশনা", hint: "সদস্যের প্রোফাইলে বকেয়ার নিচে দেখাবে। যেমন: বিকাশ/নগদ নম্বর।", placeholder: "বিকাশ (পার্সোনাল): 01XXXXXXXXX — পাঠানোর পর অ্যাডমিনকে জানান", multiline: true },
  { key: "default_fee", label: "সাধারণ মাসিক চাঁদা (টাকা)", hint: "নতুন সদস্য অনুমোদনের সময় এই অঙ্ক প্রথমে দেখাবে।", placeholder: "100" },
  { key: "fb_page_url", label: "ফেসবুক পেজের লিংক", hint: "সাইটের মেনু ও বোতামে ব্যবহার হবে।", placeholder: "https://www.facebook.com/gajs" },
];

const DEV_FIELDS: { key: keyof SiteSettings; label: string; placeholder: string }[] = [
  { key: "dev_name", label: "নাম", placeholder: "MD SOFIKUL ISLAM" },
  { key: "dev_profession", label: "পেশা / পরিচয়", placeholder: "Web Developer" },
  { key: "dev_portfolio", label: "পোর্টফোলিও সাইটের লিংক", placeholder: "https://..." },
  { key: "dev_facebook", label: "ফেসবুক প্রোফাইল লিংক", placeholder: "https://www.facebook.com/..." },
  { key: "dev_github", label: "GitHub লিংক", placeholder: "https://github.com/..." },
  { key: "dev_whatsapp", label: "হোয়াটসঅ্যাপ নম্বর", placeholder: "01XXXXXXXXX" },
  { key: "dev_about", label: "নিজের সম্পর্কে ২-৩ লাইন (ডেভেলপার পাতায় দেখাবে)", placeholder: "যেমন: ওয়েব ও অ্যাপ ডেভেলপার..." },
];

export default function SettingsAdmin() {
  const [vals, setVals] = useState<SiteSettings | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    browserClient()
      .from("site_settings")
      .select("key,value")
      .then(({ data }) => {
        const v = { ...SETTING_DEFAULTS };
        for (const r of (data as { key: string; value: string }[]) ?? []) if (r.key in v) (v as Record<string, string>)[r.key] = r.value;
        setVals(v);
      });
  }, []);

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!vals) return;
    setBusy(true);
    const rows = Object.entries(vals).map(([key, value]) => ({ key, value: String(value).trim(), updated_at: new Date().toISOString() }));
    const { error } = await browserClient().from("site_settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    setMsg(error ? errorMessage(error) : "সেটিংস সংরক্ষিত হয়েছে। সাইটে ১ মিনিটের মধ্যে দেখাবে।");
  }

  if (!vals) return <ListSkeleton n={3} />;

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl">সাইট সেটিংস</h1>
        <p className="text-muted">সাইটের গুরুত্বপূর্ণ তথ্য এখান থেকেই বদলান। কোনো কোড বা ফাইল ছোঁয়ার দরকার নেই।</p>
      </div>
      {FIELDS.map((f) => (
        <div key={f.key} className="card">
          <label className="text-lg font-bold" htmlFor={f.key}>{f.label}</label>
          <p className="mb-2 text-sm text-muted">{f.hint}</p>
          {f.multiline ? (
            <textarea id={f.key} rows={3} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} placeholder={f.placeholder} className="input" />
          ) : (
            <input id={f.key} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} placeholder={f.placeholder} className="input" />
          )}
        </div>
      ))}
      <div className="card space-y-3">
        <div>
          <h2 className="text-lg font-bold">ডেভেলপারের তথ্য</h2>
          <p className="text-sm text-muted">লগইন পাতায় &ldquo;ডেভেলপার&rdquo; কার্ডে দেখাবে। ফাঁকা ঘরের বোতাম দেখাবে না।</p>
        </div>
        {DEV_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={f.key}>{f.label}</label>
            <input id={f.key} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} placeholder={f.placeholder} className="input" />
          </div>
        ))}
      </div>
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}
      <button disabled={busy} className="btn btn-primary w-full py-3 text-lg">{busy ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}</button>
    </form>
  );
}
