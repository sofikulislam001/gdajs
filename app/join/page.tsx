"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { callMemberApi, emailForPhone } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";
import { BLOOD_GROUPS, bn, isValidPhone, normalizePhone } from "@/lib/bn";

type Form = {
  name: string; phone: string; password: string;
  father_name: string; dob: string; education: string; profession: string; address: string; email: string;
  blood_group: string; last_blood_donation: string; show_in_blood_list: boolean;
  website: string;
};

const EMPTY: Form = {
  name: "", phone: "", password: "", father_name: "", dob: "", education: "", profession: "", address: "", email: "",
  blood_group: "", last_blood_donation: "", show_in_blood_list: true, website: "",
};

const STEPS = ["অ্যাকাউন্ট", "পরিচিতি", "রক্তদান"];

function strength(p: string): { label: string; pct: number; color: string } {
  let sc = 0;
  if (p.length >= 6) sc++;
  if (p.length >= 8) sc++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) sc++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) sc++;
  const map = [
    { label: "", pct: 0, color: "bg-line" },
    { label: "দুর্বল", pct: 25, color: "bg-blood" },
    { label: "মোটামুটি", pct: 50, color: "bg-accent" },
    { label: "ভালো", pct: 75, color: "bg-brand" },
    { label: "শক্তিশালী", pct: 100, color: "bg-[#2f9e6e]" },
  ];
  return map[p ? Math.max(sc, 1) : 0];
}

function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-sm font-medium text-blood">{error}</p>}
    </div>
  );
}

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [errs, setErrs] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  if (!isConfigured) return <SetupNotice />;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  function validate(s: number): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (s === 0) {
      if (!f.name.trim()) e.name = "আপনার নাম লিখুন";
      if (!isValidPhone(normalizePhone(f.phone))) e.phone = "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX)";
      if (f.password.length < 6) e.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে";
    }
    if (s === 1 && f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = "ইমেইল ঠিক নয়";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validate(step)) setStep((s) => s + 1);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (step < 2) return next();
    setError("");
    const phone = normalizePhone(f.phone);
    setBusy(true);
    const res = await callMemberApi({ action: "register", ...f, phone });
    if (!res.ok) {
      setBusy(false);
      // নম্বর/পাসওয়ার্ডের ভুলে প্রথম ধাপে ফিরিয়ে নিই
      if (/মোবাইল|লগইন/.test(res.message)) setStep(0);
      return setError(res.message);
    }
    const { error: err } = await browserClient().auth.signInWithPassword({ email: emailForPhone(phone), password: f.password });
    setBusy(false);
    router.push(err ? "/login" : "/profile?new=1");
  }

  const st = strength(f.password);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-3xl">সদস্য হোন</h1>
      <p className="mb-5 text-muted">
        ৩টি সহজ ধাপে আপনার অ্যাকাউন্ট খুলুন। আগে থেকেই অ্যাকাউন্ট থাকলে{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">লগইন করুন</Link>।
      </p>

      {/* ধাপ নির্দেশক */}
      <ol className="mb-5 flex items-center gap-2" aria-label="ধাপ">
        {STEPS.map((t, i) => (
          <li key={t} className="flex flex-1 items-center gap-2">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${i < step ? "bg-[#2f9e6e] text-white" : i === step ? "bg-brand text-white" : "bg-line text-muted"}`}>
              {i < step ? "✓" : bn(i + 1)}
            </span>
            <span className={`hidden text-sm font-semibold sm:block ${i === step ? "text-ink" : "text-muted"}`}>{t}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? "bg-[#2f9e6e]" : "bg-line"}`} />}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} className="card space-y-5" noValidate>
        <input value={f.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        {step === 0 && (
          <>
            <div>
              <h2 className="text-xl text-brand-dark">আপনার অ্যাকাউন্ট</h2>
              <p className="text-sm text-muted">মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে আপনি পরে লগইন করবেন।</p>
            </div>
            <Field label="আপনার নাম *" htmlFor="name" error={errs.name}>
              <input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} className="input text-lg" autoComplete="name" />
            </Field>
            <Field label="মোবাইল নম্বর *" htmlFor="phone" error={errs.phone} hint="এটাই আপনার লগইন আইডি">
              <input id="phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" placeholder="০১৭XXXXXXXX" className="input text-lg" autoComplete="tel" />
            </Field>
            <Field label="পাসওয়ার্ড *" htmlFor="password" error={errs.password} hint="কমপক্ষে ৬ অক্ষর। অক্ষর ও সংখ্যা মিলিয়ে দিন।">
              <div className="relative">
                <input id="password" value={f.password} onChange={(e) => set("password", e.target.value)} type={show ? "text" : "password"} className="input pr-20 text-lg" autoComplete="new-password" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm font-semibold text-brand hover:bg-brand-soft">
                  {show ? "লুকান" : "দেখুন"}
                </button>
              </div>
              {f.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full transition-all ${st.color}`} style={{ width: `${st.pct}%` }} /></div>
                  <span className="text-xs font-semibold text-muted">{st.label}</span>
                </div>
              )}
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-xl text-brand-dark">আপনার পরিচিতি</h2>
              <p className="text-sm text-muted">সবগুলো ঘর ঐচ্ছিক, তবে যত বেশি দেবেন যাচাই তত সহজ হবে।</p>
            </div>
            <Field label="পিতার নাম" htmlFor="father_name">
              <input id="father_name" value={f.father_name} onChange={(e) => set("father_name", e.target.value)} className="input" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="জন্মতারিখ" htmlFor="dob"><input id="dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} className="input" /></Field>
              <Field label="শিক্ষাগত যোগ্যতা" htmlFor="education"><input id="education" value={f.education} onChange={(e) => set("education", e.target.value)} placeholder="যেমন: এইচএসসি" className="input" /></Field>
            </div>
            <Field label="পেশা" htmlFor="profession"><input id="profession" value={f.profession} onChange={(e) => set("profession", e.target.value)} placeholder="ছাত্র, ব্যবসায়ী, চাকরিজীবী…" className="input" /></Field>
            <Field label="ঠিকানা" htmlFor="address"><input id="address" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="গ্রাম/মহল্লা, ওয়ার্ড" className="input" autoComplete="street-address" /></Field>
            <Field label="ইমেইল (থাকলে)" htmlFor="email" error={errs.email}><input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className="input" autoComplete="email" /></Field>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-xl text-brand-dark">রক্তদান</h2>
              <p className="text-sm text-muted">আপনার রক্তের গ্রুপ জানা থাকলে জরুরি সময়ে কারও জীবন বাঁচাতে পারে।</p>
            </div>
            <div>
              <p className="label">রক্তের গ্রুপ</p>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((g) => (
                  <button type="button" key={g} onClick={() => set("blood_group", f.blood_group === g ? "" : g)} className={`rounded-2xl border py-3 text-lg font-bold transition ${f.blood_group === g ? "border-blood bg-blood text-white" : "border-line bg-white text-blood hover:bg-blood/10"}`}>
                    {g}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => set("blood_group", "")} className={`mt-2 text-sm ${f.blood_group ? "text-brand underline" : "text-muted"}`}>জানি না / বলতে চাই না</button>
            </div>
            {f.blood_group && (
              <>
                <Field label="শেষ রক্তদানের তারিখ" htmlFor="last" hint="দেননি বা মনে নেই? ফাঁকা রাখুন।">
                  <input id="last" type="date" value={f.last_blood_donation} onChange={(e) => set("last_blood_donation", e.target.value)} className="input" />
                </Field>
                <label className="flex items-start gap-3 rounded-2xl bg-brand-soft p-3 text-sm">
                  <input type="checkbox" checked={f.show_in_blood_list} onChange={(e) => set("show_in_blood_list", e.target.checked)} className="mt-1 h-5 w-5 accent-[#3f86bd]" />
                  <span>জরুরি প্রয়োজনে আমার নাম ও ফোন নম্বর রক্তদাতা তালিকায় দেখানো যেতে পারে।</span>
                </label>
              </>
            )}
            <div className="rounded-2xl bg-paper p-4 text-sm">
              <p className="mb-1 font-semibold">আপনার আবেদনের সারসংক্ষেপ</p>
              <p>{f.name} • {bn(normalizePhone(f.phone))}{f.blood_group ? ` • ${f.blood_group}` : ""}</p>
              <p className="mt-1 text-muted">জমা দিলে সাথে সাথে আপনার প্রোফাইল খুলে যাবে। সংগঠনের দায়িত্বশীল যাচাই করে সদস্যপদ অনুমোদন করবেন।</p>
            </div>
          </>
        )}

        {error && <p className="rounded-2xl bg-blood/10 px-4 py-3 text-blood" role="alert">{error}</p>}

        <div className="flex gap-3">
          {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-ghost px-6 py-3">← পেছনে</button>}
          <button disabled={busy} className="btn btn-primary flex-1 py-3 text-lg">
            {busy ? "অপেক্ষা করুন…" : step < 2 ? "পরের ধাপ →" : "আবেদন জমা দিন"}
          </button>
        </div>
        <p className="text-center text-sm text-muted">ধাপ {bn(step + 1)} / {bn(3)} • প্রোফাইল ছবি লগইনের পর দিতে পারবেন</p>
      </form>
    </div>
  );
}
