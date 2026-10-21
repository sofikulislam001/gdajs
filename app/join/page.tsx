"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { callMemberApi, emailForPhone } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";
import { BLOOD_GROUPS, isValidPhone, normalizePhone } from "@/lib/bn";

export default function JoinPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  if (!isConfigured) return <SetupNotice />;

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError("");
    const f = new FormData(ev.currentTarget);
    const phone = normalizePhone(String(f.get("phone") ?? ""));
    if (!isValidPhone(phone)) return setError("সঠিক মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX)");
    const password = String(f.get("password") ?? "");
    if (password.length < 6) return setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");

    setBusy(true);
    const res = await callMemberApi({
      action: "register",
      website: String(f.get("website") ?? ""),
      name: String(f.get("name") ?? ""),
      phone,
      password,
      father_name: String(f.get("father_name") ?? ""),
      dob: String(f.get("dob") ?? ""),
      address: String(f.get("address") ?? ""),
      profession: String(f.get("profession") ?? ""),
      education: String(f.get("education") ?? ""),
      email: String(f.get("email") ?? ""),
      blood_group: String(f.get("blood_group") ?? ""),
      last_blood_donation: String(f.get("last_blood_donation") ?? ""),
      show_in_blood_list: f.get("show_in_blood_list") === "on",
    });
    if (!res.ok) {
      setBusy(false);
      return setError(res.message);
    }
    // অ্যাকাউন্ট খোলা হয়ে গেছে, সাথে সাথে লগইন করে প্রোফাইলে নিয়ে যাই
    const { error: err } = await browserClient().auth.signInWithPassword({ email: emailForPhone(phone), password });
    setBusy(false);
    router.push(err ? "/login" : "/profile?new=1");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-3xl">সদস্য হোন</h1>
      <p className="mb-5 text-muted">
        ফর্মটি পূরণ করলেই আপনার নিজের অ্যাকাউন্ট ও প্রোফাইল খুলে যাবে। সংগঠনের দায়িত্বশীল যাচাই করে সদস্যপদ অনুমোদন করবেন। আগে থেকেই অ্যাকাউন্ট থাকলে{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">লগইন করুন</Link>।
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        <section className="card space-y-4">
          <h2 className="text-lg text-brand-dark">১. লগইনের তথ্য</h2>
          <div>
            <label className="label" htmlFor="name">আপনার নাম *</label>
            <input id="name" name="name" required className="input text-lg" autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="phone">মোবাইল নম্বর * <span className="font-normal">(এটাই আপনার লগইন আইডি)</span></label>
            <input id="phone" name="phone" required inputMode="tel" placeholder="০১৭XXXXXXXX" className="input text-lg" autoComplete="tel" />
          </div>
          <div>
            <label className="label" htmlFor="password">পাসওয়ার্ড * <span className="font-normal">(কমপক্ষে ৬ অক্ষর)</span></label>
            <div className="relative">
              <input id="password" name="password" type={show ? "text" : "password"} required minLength={6} className="input pr-20 text-lg" autoComplete="new-password" />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm font-semibold text-brand hover:bg-brand-soft">
                {show ? "লুকান" : "দেখুন"}
              </button>
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg text-brand-dark">২. ব্যক্তিগত তথ্য</h2>
          <div>
            <label className="label" htmlFor="father_name">পিতার নাম</label>
            <input id="father_name" name="father_name" className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="dob">জন্মতারিখ</label>
              <input id="dob" name="dob" type="date" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="education">শিক্ষাগত যোগ্যতা</label>
              <input id="education" name="education" placeholder="যেমন: এইচএসসি, স্নাতক" className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="profession">পেশা</label>
            <input id="profession" name="profession" placeholder="যেমন: ছাত্র, ব্যবসায়ী, চাকরিজীবী" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="address">ঠিকানা</label>
            <input id="address" name="address" placeholder="গ্রাম/মহল্লা, ওয়ার্ড" className="input" autoComplete="street-address" />
          </div>
          <div>
            <label className="label" htmlFor="email">ইমেইল (থাকলে)</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg text-brand-dark">৩. রক্তদান</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="blood_group">রক্তের গ্রুপ</label>
              <select id="blood_group" name="blood_group" className="input" defaultValue="">
                <option value="">জানি না / বলতে চাই না</option>
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="last_blood_donation">শেষ রক্তদানের তারিখ</label>
              <input id="last_blood_donation" name="last_blood_donation" type="date" className="input" />
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl bg-brand-soft p-3 text-sm">
            <input type="checkbox" name="show_in_blood_list" defaultChecked className="mt-1 h-5 w-5 accent-[#3f86bd]" />
            <span>জরুরি প্রয়োজনে আমার নাম ও ফোন নম্বর রক্তদাতা তালিকায় দেখানো যেতে পারে (রক্তের গ্রুপ দিলে প্রযোজ্য)।</span>
          </label>
        </section>

        {error && <p className="rounded-2xl bg-blood/10 px-4 py-3 text-blood">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full py-3 text-lg">{busy ? "অপেক্ষা করুন…" : "অ্যাকাউন্ট খুলুন ও আবেদন করুন"}</button>
        <p className="text-center text-sm text-muted">প্রোফাইল ছবি লগইনের পর প্রোফাইল পেজ থেকে দিতে পারবেন।</p>
      </form>
    </div>
  );
}
