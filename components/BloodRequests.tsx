"use client";

import { useCallback, useEffect, useState } from "react";
import { BLOOD_GROUPS, en, errorMessage, fmtDate, isValidPhone, normalizePhone } from "@/lib/bn";
import { useLang } from "@/lib/lang";
import { browserClient } from "@/lib/supabase";
import type { BloodRequest } from "@/lib/types";

export default function BloodRequests() {
  const { tr } = useLang();
  const [rows, setRows] = useState<BloodRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await browserClient()
      .from("blood_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20);
    setRows((data as BloodRequest[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const t = (k: string) => String(f.get(k) ?? "").trim() || null;
    const phone = normalizePhone(String(f.get("phone") ?? ""));
    if (!isValidPhone(phone)) return setMsg(tr("সঠিক মোবাইল নম্বর দিন (যেমন 01711223344)", "Enter a valid mobile number (e.g. 01711223344)"));
    setBusy(true);
    const { error } = await browserClient().from("blood_requests").insert({
      blood_group: String(f.get("blood_group")),
      patient_name: t("patient_name"),
      area: String(f.get("area") ?? "").trim(),
      hospital: t("hospital"),
      phone,
      needed_on: t("needed_on") ? en(String(f.get("needed_on"))) : null,
      note: t("note"),
    });
    setBusy(false);
    if (error) return setMsg(errorMessage(error));
    setOpen(false);
    setMsg(tr("অনুরোধ জমা হয়েছে। মিল থাকা প্রস্তুত দাতাদের নোটিফিকেশন পাঠানো হয়েছে।", "Request posted. Matching available donors have been notified."));
    await load();
  }

  return (
    <section className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-3xl bg-gradient-to-br from-[#8f1d2c] to-[#c0392b] p-4 text-white shadow-lg">
        <div className="min-w-0">
          <p className="text-lg font-bold">{tr("জরুরি রক্ত দরকার?", "Need blood urgently?")}</p>
          <p className="text-sm text-white/85">{tr("অনুরোধ দিলে একই গ্রুপের দাতারা নোটিফিকেশন পাবেন।", "Post a request and donors of the same group get notified.")}</p>
        </div>
        <button onClick={() => { setOpen(!open); setMsg(""); }} className="btn shrink-0 bg-white font-bold text-blood">{open ? tr("বন্ধ", "Close") : tr("অনুরোধ দিন", "Request")}</button>
      </div>
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      {open && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bg">{tr("রক্তের গ্রুপ *", "Blood group *")}</label>
              <select id="bg" name="blood_group" required className="input">{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
            </div>
            <div><label className="label" htmlFor="ar">{tr("এলাকা *", "Area *")}</label><input id="ar" name="area" required placeholder={tr("যেমন: সিদ্ধিরগঞ্জ", "e.g. Siddhirganj")} className="input" /></div>
            <div><label className="label" htmlFor="pn">{tr("রোগীর নাম", "Patient name")}</label><input id="pn" name="patient_name" className="input" /></div>
            <div><label className="label" htmlFor="ho">{tr("হাসপাতাল", "Hospital")}</label><input id="ho" name="hospital" className="input" /></div>
            <div><label className="label" htmlFor="ph">{tr("যোগাযোগের নম্বর *", "Contact number *")}</label><input id="ph" name="phone" required inputMode="tel" placeholder="01XXXXXXXXX" className="input" /></div>
            <div><label className="label" htmlFor="nd">{tr("কবে লাগবে", "Needed on")}</label><input id="nd" name="needed_on" type="date" className="input" /></div>
          </div>
          <div><label className="label" htmlFor="nt">{tr("অতিরিক্ত তথ্য", "Extra details")}</label><input id="nt" name="note" className="input" /></div>
          <button disabled={busy} className="btn btn-primary w-full py-3 text-lg">{busy ? tr("জমা হচ্ছে…", "Submitting…") : tr("অনুরোধ জমা দিন", "Submit request")}</button>
          <p className="text-xs text-muted">{tr("সতর্কতা: নম্বর সবাই দেখতে পাবে। একই নম্বর থেকে দিনে সর্বোচ্চ ৩টি অনুরোধ দেওয়া যায়।", "Note: the number is visible to everyone. Max 3 requests per number per day.")}</p>
        </form>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="pt-1 text-lg font-bold">{tr("চলমান জরুরি অনুরোধ", "Open urgent requests")}</p>
          {rows.map((r) => (
            <div key={r.id} className="card space-y-3 border-blood/30">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blood text-xl font-extrabold text-white">{r.blood_group}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">{r.area}</p>
                  {r.hospital && <p className="text-sm leading-snug">🏥 {r.hospital}</p>}
                  <p className="text-sm text-muted">{[r.patient_name ? `${tr("রোগী", "Patient")}: ${r.patient_name}` : null, r.needed_on ? `${tr("প্রয়োজন", "Needed")}: ${fmtDate(r.needed_on)}` : null].filter(Boolean).join(" • ")}</p>
                </div>
              </div>
              {r.note && <p className="rounded-2xl bg-paper px-3 py-2 text-sm">{r.note}</p>}
              <a href={`tel:${r.phone}`} className="btn btn-primary w-full">📞 {tr("কল করুন", "Call")}</a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
