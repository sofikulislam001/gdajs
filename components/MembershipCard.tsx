"use client";

import { useRef, useState } from "react";
import Logo from "./Logo";
import { ORG_NAME, bn, fmtDate, taka } from "@/lib/bn";
import { useLang } from "@/lib/lang";
import type { Member } from "@/lib/types";

export function memberNo(m: Pick<Member, "id" | "joined_on">): string {
  return `GAJS-${m.joined_on.slice(0, 4)}-${m.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
}

export default function MembershipCard({ m }: { m: Member }) {
  const { tr } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    setErr("");
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `membership-${memberNo(m)}.png`;
      a.click();
    } catch {
      setErr(tr("ডাউনলোড করা যায়নি। আবার চেষ্টা করুন বা স্ক্রিনশট নিন।", "Could not download. Try again or take a screenshot."));
    }
    setBusy(false);
  }

  const rows: [string, string][] = [
    [tr("সদস্য নম্বর", "Member No."), memberNo(m)],
    [tr("মোবাইল", "Mobile"), bn(m.phone)],
    [tr("রক্তের গ্রুপ", "Blood group"), m.blood_group || "—"],
    [tr("যোগদানের তারিখ", "Joined on"), fmtDate(m.joined_on)],
    [tr("মাসিক চাঁদা", "Monthly fee"), taka(m.monthly_fee)],
  ];

  return (
    <div className="space-y-3">
      <div ref={ref} className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_10px_30px_rgba(40,80,120,0.15)]">
        <div className="relative bg-gradient-to-br from-[#12324f] via-[#1f5a8a] to-[#3f86bd] px-5 pb-12 pt-5 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <span className="rounded-full bg-white p-0.5"><Logo size={44} /></span>
            <div className="min-w-0">
              <p className="text-xs uppercase text-white/70">{tr("সদস্যপদ রসিদ", "Membership receipt")}</p>
              <p className="font-bold leading-tight">{tr(ORG_NAME, "Godnail Alokito Jubo Shakti")}</p>
            </div>
          </div>
        </div>
        <div className="relative -mt-9 flex items-start gap-3 px-5">
          {m.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photo_url} alt="" crossOrigin="anonymous" className="relative h-20 w-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow" />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-white bg-brand text-3xl font-bold text-white shadow">{m.name.slice(0, 1)}</div>
          )}
          <div className="min-w-0 flex-1 pt-12">
            <p className="truncate text-xl font-bold leading-tight">{m.name}</p>
            <span className="mt-0.5 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-dark">
              {m.status === "active" ? tr("সক্রিয় সদস্য", "Active member") : m.status === "pending" ? tr("অপেক্ষমাণ", "Pending") : tr("নিষ্ক্রিয়", "Inactive")}
            </span>
          </div>
        </div>
        <dl className="mt-4 divide-y divide-line px-5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-muted">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 border-t border-line bg-paper px-5 py-3 text-center text-xs text-muted">
          {tr("আর্তমানবতার সেবায় নিয়োজিত স্বেচ্ছাসেবী অরাজনৈতিক যুব সংগঠন", "Volunteer, non-political youth organisation serving humanity")}
        </p>
      </div>
      {err && <p className="rounded-xl bg-blood/10 px-3 py-2 text-sm text-blood">{err}</p>}
      <button onClick={download} disabled={busy} className="btn btn-primary w-full py-3 text-lg">
        {busy ? tr("তৈরি হচ্ছে…", "Preparing…") : tr("রসিদ ডাউনলোড করুন (ছবি)", "Download receipt (image)")}
      </button>
    </div>
  );
}
