"use client";

import { useRef, useState } from "react";
import Logo from "./Logo";
import { memberNo } from "./MembershipCard";
import { ORG_NAME, fmtDate, fmtMonth, taka } from "@/lib/bn";
import { useLang } from "@/lib/lang";
import type { Member } from "@/lib/types";

export type ReceiptData = {
  id: string;
  months: string[];
  amount: number;
  method: string;
  trx_id?: string | null;
  paid_on: string;
};

export function methodLabel(m: string, tr: (b: string, e: string) => string): string {
  return m === "bkash" ? tr("বিকাশ", "bKash") : m === "nagad" ? tr("নগদ", "Nagad") : m === "rocket" ? tr("রকেট", "Rocket") : m === "cash" || m === "ক্যাশ" ? tr("নগদ টাকা (হাতে)", "Cash") : m;
}

export default function PaymentReceipt({ m, r, onClose }: { m: Member; r: ReceiptData; onClose: () => void }) {
  const { tr } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const no = `PR-${r.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    setErr("");
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${no}.png`;
      a.click();
    } catch {
      setErr(tr("ডাউনলোড করা যায়নি। স্ক্রিনশট নিন।", "Could not download. Please take a screenshot."));
    }
    setBusy(false);
  }

  const rows: [string, string][] = [
    [tr("রসিদ নম্বর", "Receipt No."), no],
    [tr("সদস্য", "Member"), `${m.name} (${memberNo(m)})`],
    [tr("মাস", "Months"), r.months.map((x) => fmtMonth(x)).join(", ")],
    [tr("পদ্ধতি", "Method"), methodLabel(r.method, tr)],
    ...(r.trx_id ? [[tr("ট্রানজ্যাকশন আইডি", "Transaction ID"), r.trx_id] as [string, string]] : []),
    [tr("তারিখ", "Date"), fmtDate(r.paid_on)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose}>
      <div className="max-h-[94vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-paper p-3" onClick={(e) => e.stopPropagation()}>
        <div ref={ref} className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="relative bg-gradient-to-br from-[#12324f] via-[#1f5a8a] to-[#3f86bd] px-5 py-5 text-white">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-3">
              <span className="rounded-full bg-white p-0.5"><Logo size={42} /></span>
              <div className="min-w-0">
                <p className="text-xs text-white/70">{tr("চাঁদা প্রাপ্তি রসিদ", "Payment receipt")}</p>
                <p className="font-bold leading-tight">{tr(ORG_NAME, "Godnail Alokito Jubo Shakti")}</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-sm text-muted">{tr("গৃহীত অর্থ", "Amount received")}</p>
            <p className="text-4xl font-extrabold text-brand">{taka(r.amount)}</p>
            <span className="mt-1 inline-block rounded-full bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand-dark">✓ {tr("পরিশোধিত", "Paid")}</span>
          </div>
          <dl className="divide-y divide-line px-5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="break-words text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 border-t border-line bg-paper px-5 py-3 text-center text-xs text-muted">
            {tr("সংগঠনের পাশে থাকার জন্য ধন্যবাদ। এটি কম্পিউটার-জেনারেটেড রসিদ।", "Thank you for supporting us. This is a computer-generated receipt.")}
          </p>
        </div>
        {err && <p className="rounded-xl bg-blood/10 px-3 py-2 text-sm text-blood">{err}</p>}
        <div className="flex gap-2">
          <button onClick={download} disabled={busy} className="btn btn-primary flex-1 py-3">{busy ? tr("তৈরি হচ্ছে…", "Preparing…") : tr("ডাউনলোড (ছবি)", "Download (image)")}</button>
          <button onClick={onClose} className="btn btn-ghost">{tr("বন্ধ", "Close")}</button>
        </div>
      </div>
    </div>
  );
}
