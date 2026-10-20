"use client";

import { useState } from "react";
import SetupNotice from "@/components/SetupNotice";
import { browserClient, isConfigured } from "@/lib/supabase";
import { BLOOD_GROUPS, isValidPhone, normalizePhone } from "@/lib/bn";

export default function JoinPage() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!isConfigured) return <SetupNotice />;

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError("");
    const f = new FormData(ev.currentTarget);
    const phone = normalizePhone(String(f.get("phone") ?? ""));
    if (!isValidPhone(phone)) {
      setError("সঠিক মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX)");
      return;
    }
    const blood = String(f.get("blood_group") ?? "");
    const last = String(f.get("last_blood_donation") ?? "");
    setBusy(true);
    const { error: err } = await browserClient().from("members").insert({
      name: String(f.get("name") ?? "").trim(),
      phone,
      address: String(f.get("address") ?? "").trim() || null,
      profession: String(f.get("profession") ?? "").trim() || null,
      blood_group: blood || null,
      last_blood_donation: last || null,
      show_in_blood_list: f.get("show_in_blood_list") === "on",
      status: "pending",
    });
    setBusy(false);
    if (err) {
      setError(err.code === "23505" ? "এই মোবাইল নম্বর দিয়ে আগেই আবেদন করা হয়েছে।" : "আবেদন জমা হয়নি, একটু পরে আবার চেষ্টা করুন।");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <p className="font-display text-2xl font-bold text-brand">আবেদন জমা হয়েছে</p>
        <p className="mt-2 text-muted">আমাদের একজন দায়িত্বশীল আপনার সাথে যোগাযোগ করে সদস্যপদ নিশ্চিত করবেন। ধন্যবাদ!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-3xl">সদস্য আবেদন</h1>
      <p className="mb-6 text-muted">নিচের ফর্মটি পূরণ করুন। আপনার ফোন নম্বর শুধু সংগঠনের দায়িত্বশীলরা দেখতে পাবেন।</p>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="name">নাম *</label>
          <input id="name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">মোবাইল নম্বর *</label>
          <input id="phone" name="phone" required inputMode="tel" placeholder="০১৭XXXXXXXX" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="address">ঠিকানা / এলাকা</label>
          <input id="address" name="address" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="profession">পেশা / পড়াশোনা</label>
          <input id="profession" name="profession" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="blood_group">রক্তের গ্রুপ</label>
            <select id="blood_group" name="blood_group" className="input" defaultValue="">
              <option value="">জানি না / বলতে চাই না</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="last_blood_donation">শেষ রক্তদান</label>
            <input id="last_blood_donation" name="last_blood_donation" type="date" className="input" />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-brand-soft p-3 text-sm">
          <input type="checkbox" name="show_in_blood_list" defaultChecked className="mt-1 h-4 w-4 accent-[#0f5c4d]" />
          <span>জরুরি প্রয়োজনে আমার নাম ও ফোন নম্বর রক্তদাতা তালিকায় দেখানো যেতে পারে (রক্তের গ্রুপ দিলে প্রযোজ্য)।</span>
        </label>
        {error && <p className="text-blood">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "জমা হচ্ছে…" : "আবেদন জমা দিন"}</button>
      </form>
    </div>
  );
}
