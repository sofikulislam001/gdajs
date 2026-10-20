"use client";

import { useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { browserClient, isConfigured } from "@/lib/supabase";
import { bn, errorMessage, fmtMonth, isValidPhone, normalizePhone, taka } from "@/lib/bn";

type Dues = {
  name: string;
  monthly_fee: number;
  joined_on: string;
  months_expected: number;
  months_paid: number;
  months_due: number;
  due_amount: number;
  last_paid_month: string | null;
};

const PAY_NOTE = process.env.NEXT_PUBLIC_PAYMENT_NOTE;

export default function DuesPage() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Dues | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  if (!isConfigured) return <SetupNotice />;

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setResult(null);
    setNotFound(false);
    const p = normalizePhone(phone);
    if (!isValidPhone(p)) {
      setError("সঠিক মোবাইল নম্বর দিন");
      return;
    }
    setBusy(true);
    const { data, error: err } = await browserClient().rpc("check_dues", { p_phone: p });
    setBusy(false);
    if (err) return setError(errorMessage(err));
    const row = (data as Dues[] | null)?.[0];
    if (!row) return setNotFound(true);
    setResult(row);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-3xl">আমার বকেয়া</h1>
      <p className="mb-6 text-muted">সংগঠনে দেওয়া মোবাইল নম্বর লিখে নিজের চাঁদার অবস্থা দেখুন।</p>

      <form onSubmit={onSubmit} className="card flex gap-2">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="০১৭XXXXXXXX" className="input" aria-label="মোবাইল নম্বর" />
        <button disabled={busy} className="btn btn-primary shrink-0">{busy ? "…" : "দেখুন"}</button>
      </form>

      {error && <p className="mt-4 text-blood">{error}</p>}
      {notFound && <p className="mt-4 text-muted">এই নম্বরে কোনো সক্রিয় সদস্য পাওয়া যায়নি। সদস্য হয়ে থাকলে দায়িত্বশীলের সাথে যোগাযোগ করুন।</p>}

      {result && (
        <div className="card mt-5">
          <p className="font-display text-xl font-bold">{result.name}</p>
          <p className="text-sm text-muted">মাসিক চাঁদা: {taka(result.monthly_fee)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-brand-soft p-3"><p className="font-display text-2xl font-bold text-brand">{bn(result.months_paid)}</p><p className="text-xs text-muted">মাস পরিশোধ</p></div>
            <div className="rounded-xl bg-accent-soft p-3"><p className="font-display text-2xl font-bold">{bn(result.months_due)}</p><p className="text-xs text-muted">মাস বাকি</p></div>
            <div className="rounded-xl bg-blood/10 p-3"><p className="font-display text-2xl font-bold text-blood">{taka(result.due_amount)}</p><p className="text-xs text-muted">মোট বকেয়া</p></div>
          </div>
          {result.last_paid_month && <p className="mt-3 text-sm text-muted">সর্বশেষ পরিশোধ: {fmtMonth(result.last_paid_month)}</p>}
          {result.months_due === 0 && <p className="mt-3 font-semibold text-brand">আপনার কোনো বকেয়া নেই। সংগঠনের পাশে থাকার জন্য ধন্যবাদ!</p>}
          {result.months_due > 0 && PAY_NOTE && <p className="mt-4 rounded-xl bg-paper p-3 text-sm">{PAY_NOTE}</p>}
        </div>
      )}
    </div>
  );
}
