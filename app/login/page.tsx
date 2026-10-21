"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DeveloperCard from "@/components/DeveloperCard";
import Logo from "@/components/Logo";
import SetupNotice from "@/components/SetupNotice";
import { loginIdToEmail } from "@/lib/auth";
import { browserClient, isConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!isConfigured) return <SetupNotice />;

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    const email = loginIdToEmail(id);
    if (!email) return setError("সঠিক মোবাইল নম্বর লিখুন (যেমন ০১৭XXXXXXXX)");
    setBusy(true);
    const sb = browserClient();
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    if (err) {
      setBusy(false);
      return setError("মোবাইল নম্বর বা পাসওয়ার্ড ঠিক নয়");
    }
    const { data: isAdmin } = await sb.rpc("is_admin");
    router.push(isAdmin === true ? "/admin" : "/profile");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        <div className="mx-auto mb-3 w-fit"><Logo size={72} /></div>
        <h1 className="text-2xl">সদস্য লগইন</h1>
        <p className="mt-1 text-muted">আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিন</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4 text-left">
          <div>
            <label className="label" htmlFor="id">মোবাইল নম্বর</label>
            <input id="id" value={id} onChange={(e) => setId(e.target.value)} inputMode="tel" autoComplete="username" placeholder="০১৭XXXXXXXX" className="input text-lg" required />
          </div>
          <div>
            <label className="label" htmlFor="pw">পাসওয়ার্ড</label>
            <div className="relative">
              <input id="pw" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="input pr-20 text-lg" required />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm font-semibold text-brand hover:bg-brand-soft">
                {show ? "লুকান" : "দেখুন"}
              </button>
            </div>
          </div>
          {error && <p className="rounded-xl bg-blood/10 px-4 py-2 text-blood">{error}</p>}
          <button disabled={busy} className="btn btn-primary w-full py-3 text-lg">{busy ? "অপেক্ষা করুন…" : "লগইন করুন"}</button>
        </form>

        <p className="mt-5 text-muted">
          নতুন সদস্য? <Link href="/join" className="font-semibold text-brand hover:underline">অ্যাকাউন্ট খুলুন</Link>
        </p>
        <p className="mt-2 text-sm text-muted">পাসওয়ার্ড ভুলে গেলে সংগঠনের অ্যাডমিনকে জানান, তিনি নতুন পাসওয়ার্ড দিয়ে দেবেন।</p>
      </div>
      <DeveloperCard />
    </div>
  );
}
