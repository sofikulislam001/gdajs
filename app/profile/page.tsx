"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import MembershipCard, { memberNo } from "@/components/MembershipCard";
import PayForm from "@/components/PayForm";
import PushToggle from "@/components/PushToggle";
import SetupNotice from "@/components/SetupNotice";
import { ListSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";
import { BLOOD_GROUPS, bn, currentMonthKey, errorMessage, fmtDate, fmtMonth, monthStart, taka } from "@/lib/bn";
import { COVER_SRC } from "@/lib/brand";
import { dueFor } from "@/lib/dues";
import { useLang } from "@/lib/lang";
import { browserClient, isConfigured } from "@/lib/supabase";
import type { EventRow, Member, Payment } from "@/lib/types";

type Tab = "info" | "chada" | "activity" | "card" | "security";

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function daysSince(iso: string): number {
  return Math.floor((new Date().getTime() - new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()) / 86400000);
}

function Ring({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#e3edf6" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#3f86bd" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#12324f">{pct}</text>
    </svg>
  );
}

function Stat({ icon, value, label, tone }: { icon: string; value: string; label: string; tone: string }) {
  return (
    <div className={`min-w-0 rounded-2xl p-3 text-center ${tone}`}>
      <p className="text-lg leading-none" aria-hidden>{icon}</p>
      <p className="mt-1.5 truncate text-lg font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Item({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={`rounded-2xl bg-paper px-4 py-3 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-0.5 break-words font-semibold">{value || "—"}</p>
    </div>
  );
}

function ProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { tr } = useLang();
  const { user, ready } = useAuth();
  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [attended, setAttended] = useState<EventRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [pw, setPw] = useState("");
  const [payNote, setPayNote] = useState("");
  const [tab, setTab] = useState<Tab>(() => {
    const t = params.get("tab");
    if (t === "dues") return "chada";
    return t === "chada" || t === "activity" || t === "card" || t === "security" ? t : "info";
  });

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p] = await Promise.all([
      sb.from("members").select("*").maybeSingle(),
      sb.from("payments").select("*").order("month", { ascending: false }),
    ]);
    setMember((m.data as Member | null) ?? null);
    setPayments((p.data as Payment[]) ?? []);
    const a = await sb.from("event_attendance").select("event_id");
    const ids = ((a.data as { event_id: string }[] | null) ?? []).map((x) => x.event_id);
    if (ids.length) {
      const ev = await sb.from("events").select("*").in("id", ids).order("event_date", { ascending: false });
      setAttended((ev.data as EventRow[]) ?? []);
    } else setAttended([]);
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    browserClient().from("site_settings").select("value").eq("key", "payment_note").maybeSingle().then(({ data }) => setPayNote((data?.value as string) ?? ""));
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  if (!isConfigured) return <SetupNotice />;
  if (!ready) return <ListSkeleton />;

  if (!user) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <h1 className="text-2xl">{tr("আমার প্রোফাইল", "My profile")}</h1>
        <p className="mt-2 text-muted">{tr("নিজের তথ্য, ছবি ও চাঁদার হিসাব দেখতে লগইন করুন।", "Login to see your details, photo and dues.")}</p>
        <div className="mt-5 flex flex-col gap-3">
          <Link href="/login" className="btn btn-primary py-3 text-lg">{tr("লগইন করুন", "Login")}</Link>
          <Link href="/join" className="btn btn-ghost py-3 text-lg">{tr("নতুন অ্যাকাউন্ট খুলুন", "Create a new account")}</Link>
        </div>
      </div>
    );
  }

  async function logout() {
    await browserClient().auth.signOut();
    router.push("/");
  }

  if (member === undefined) return <ListSkeleton />;

  if (member === null) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-lg font-bold">{tr("এই অ্যাকাউন্টের সাথে কোনো সদস্য প্রোফাইল যুক্ত নেই", "No member profile is linked to this account")}</p>
        <p className="mt-2 text-muted">{tr("আপনি অ্যাডমিন হলে অ্যাডমিন প্যানেলে যান।", "If you are an admin, go to the admin panel.")}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/admin" className="btn btn-primary">{tr("অ্যাডমিন প্যানেল", "Admin panel")}</Link>
          <button onClick={logout} className="btn btn-ghost">{tr("লগআউট", "Logout")}</button>
        </div>
      </div>
    );
  }

  const m = member;
  const key = currentMonthKey();
  const due = dueFor(m, payments, key);
  const paidSet = new Set(payments.map((p) => p.month.slice(0, 7)));
  const joinKey = m.joined_on.slice(0, 7);
  const days = Math.max(0, daysSince(m.joined_on));
  const tenure = days >= 365 ? `${bn(Math.floor(days / 365))} ${tr("বছর", "yr")}` : days >= 30 ? `${bn(Math.floor(days / 30))} ${tr("মাস", "mo")}` : `${bn(days)} ${tr("দিন", "d")}`;
  const gap = m.last_blood_donation ? 90 - daysSince(m.last_blood_donation) : 0;
  const canDonate = !!m.blood_group && gap <= 0;
  const checks: [string, boolean][] = [
    [tr("ছবি", "Photo"), !!m.photo_url],
    [tr("পিতার নাম", "Father's name"), !!m.father_name],
    [tr("জন্মতারিখ", "Date of birth"), !!m.dob],
    [tr("ঠিকানা", "Address"), !!m.address],
    [tr("পেশা", "Profession"), !!m.profession],
    [tr("শিক্ষা", "Education"), !!m.education],
    [tr("ইমেইল", "Email"), !!m.email],
    [tr("রক্তের গ্রুপ", "Blood group"), !!m.blood_group],
    [tr("আমার সম্পর্কে", "About me"), !!m.about],
  ];
  const pct = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);
  const missing = checks.filter(([, ok]) => !ok).map(([l]) => l);
  const year = String(new Date().getFullYear());
  const monthsThisYear = Number(key.slice(5, 7));
  const startMonth = joinKey.startsWith(year) ? Number(joinKey.slice(5, 7)) : 1;
  const expected = Math.max(1, monthsThisYear - startMonth + 1);
  const paidThisYear = payments.filter((p) => p.month.startsWith(year)).length;
  const yearPct = Math.min(100, Math.round((paidThisYear / expected) * 100));
  const totalPaid = payments.reduce((a, p) => a + p.amount, 0);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(memberNo(m));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }
  async function shareProfile() {
    const text = `${m.name} — ${memberNo(m)}\n${tr("গোদনাইল আলোকিত যুব শক্তি", "Godnail Alokito Jubo Shakti")}`;
    try {
      if (navigator.share) await navigator.share({ title: m.name, text, url: location.origin });
      else await copyId();
    } catch {}
  }

  async function setPhoto(url: string) {
    const { error } = await browserClient().from("members").update({ photo_url: url || null }).eq("id", m.id);
    if (error) return setMsg(errorMessage(error));
    setMsg(url ? tr("ছবি সংরক্ষিত হয়েছে", "Photo saved") : tr("ছবি সরানো হয়েছে", "Photo removed"));
    await load();
  }

  async function save(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const t = (k: string) => String(f.get(k) ?? "").trim() || null;
    setSaving(true);
    const { error } = await browserClient()
      .from("members")
      .update({
        name: String(f.get("name") ?? "").trim() || m.name,
        father_name: t("father_name"),
        dob: t("dob"),
        address: t("address"),
        profession: t("profession"),
        education: t("education"),
        email: t("email"),
        blood_group: t("blood_group"),
        last_blood_donation: t("last_blood_donation"),
        show_in_blood_list: f.get("show_in_blood_list") === "on",
        hide_public: f.get("hide_public") === "on",
        about: t("about"),
      })
      .eq("id", m.id);
    setSaving(false);
    setMsg(error ? errorMessage(error) : tr("তথ্য সংরক্ষিত হয়েছে", "Details saved"));
    if (!error) setEditing(false);
    await load();
  }

  async function changePassword(ev: React.FormEvent) {
    ev.preventDefault();
    if (pw.length < 6) return setMsg(tr("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "Password must be at least 6 characters"));
    const { error } = await browserClient().auth.updateUser({ password: pw });
    setMsg(error ? errorMessage(error) : tr("পাসওয়ার্ড বদলানো হয়েছে", "Password changed"));
    if (!error) setPw("");
  }

  const statusBadge =
    m.status === "active" ? { t: tr("সক্রিয় সদস্য", "Active member"), c: "bg-brand-soft text-brand-dark" }
    : m.status === "pending" ? { t: tr("অনুমোদনের অপেক্ষায়", "Awaiting approval"), c: "bg-accent-soft text-[#8a5a00]" }
    : { t: tr("নিষ্ক্রিয়", "Inactive"), c: "bg-line text-muted" };

  const tabs: [Tab, string][] = [
    ["info", `👤 ${tr("তথ্য", "Details")}`],
    ["chada", `💳 ${tr("চাঁদা", "Dues")}`],
    ["activity", `📅 ${tr("কার্যক্রম", "Activity")}`],
    ["card", `🧾 ${tr("রসিদ", "Receipt")}`],
    ["security", `🔒 ${tr("নিরাপত্তা", "Security")}`],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {params.get("new") && (
        <div className="card border-brand/40 bg-brand-soft">
          <p className="font-bold text-brand-dark">{tr("অ্যাকাউন্ট খোলা হয়েছে, ধন্যবাদ!", "Account created, thank you!")}</p>
          <p className="text-muted">{tr("সংগঠনের দায়িত্বশীল আপনার তথ্য দেখে সদস্যপদ অনুমোদন করবেন। অনুমোদন হলে নোটিফিকেশন পাবেন এবং রসিদ ডাউনলোড করতে পারবেন।", "An organiser will review your details and approve your membership. You will get a notification and can then download your receipt.")}</p>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_6px_24px_rgba(40,80,120,0.1)]">
        <div className="relative aspect-[1080/578] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COVER_SRC ?? "/photos/cover.jpg"} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-1.5 px-4 pb-5 pt-4 text-center">
          <div>
            <ImageUpload avatar name={m.name} value={m.photo_url ?? ""} onChange={setPhoto} folder={`avatars/${user.id}`} maxSide={640} />
          </div>
          <h1 className="text-2xl">{m.name}</h1>
          <button onClick={copyId} className="rounded-full px-3 py-1 text-sm text-muted transition hover:bg-paper active:scale-95" title={tr("আইডি কপি করুন", "Copy ID")}>{memberNo(m)} • {bn(m.phone)} <span aria-hidden>{copied ? "✓" : "⧉"}</span></button>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5 text-xs">
            <span className={`badge ${statusBadge.c}`}>{statusBadge.t}</span>
            {m.blood_group && <span className="badge bg-blood/10 font-bold text-blood">🩸 {m.blood_group}</span>}
            {m.profession && <span className="badge bg-paper text-muted">{m.profession}</span>}
            <span className="badge bg-paper text-muted">{tr("যোগদান", "Joined")} {fmtDate(m.joined_on)}</span>
          </div>
          {m.status === "pending" && <p className="max-w-md text-sm text-muted">{tr("আপনার আবেদন যাচাইয়ের অপেক্ষায় আছে। অনুমোদন হলে এখানে চাঁদার হিসাব ও রসিদ পাবেন।", "Your application is being reviewed. Once approved you will see dues and your receipt here.")}</p>}
        </div>
        {m.status === "active" && (
          <div className="grid grid-cols-3 gap-2 border-t border-line bg-paper/60 p-3">
            <Stat icon="🗓️" value={tenure} label={tr("সংগঠনে", "With us")} tone="bg-white" />
            <Stat icon={due.due === 0 ? "✅" : "⏳"} value={due.due === 0 ? tr("পরিশোধিত", "Paid up") : `${bn(due.due)} ${tr("মাস বাকি", "mo due")}`} label={tr("চাঁদা", "Dues")} tone={due.due === 0 ? "bg-brand-soft" : "bg-accent-soft"} />
            <Stat icon="🩸" value={!m.blood_group ? tr("অজানা", "Unknown") : canDonate ? tr("প্রস্তুত", "Ready") : `${bn(gap)} ${tr("দিন", "d")}`} label={tr("রক্তদান", "Donation")} tone={canDonate ? "bg-brand-soft" : "bg-white"} />
          </div>
        )}
      </section>

      {pct < 100 && (
        <section className="card flex items-center gap-4">
          <Ring pct={pct} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{tr("প্রোফাইল", "Profile")} {bn(pct)}% {tr("সম্পূর্ণ", "complete")}</p>
            <p className="truncate text-sm text-muted">{tr("বাকি:", "Missing:")} {missing.slice(0, 3).join(", ")}{missing.length > 3 ? ` +${bn(missing.length - 3)}` : ""}</p>
          </div>
          <button onClick={() => { setTab("info"); setEditing(true); setMsg(""); }} className="btn btn-primary btn-sm shrink-0">{tr("পূরণ করুন", "Complete")}</button>
        </section>
      )}

      {m.status === "active" && (
        <section className="grid grid-cols-4 gap-2">
          {([
            ["💳", tr("চাঁদা দিন", "Pay dues"), () => { setTab("chada"); setMsg(""); }],
            ["🧾", tr("রসিদ", "Receipt"), () => { setTab("card"); setMsg(""); }],
            ["📤", tr("শেয়ার", "Share"), shareProfile],
            ["⚙️", tr("সেটিংস", "Settings"), () => router.push("/settings")],
          ] as [string, string, () => void][]).map(([ic, l, fn]) => (
            <button key={l} onClick={fn} className="flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-white px-1 py-3 shadow-sm ring-1 ring-line transition active:scale-95">
              <span className="text-xl" aria-hidden>{ic}</span>
              <span className="w-full truncate text-xs font-semibold">{l}</span>
            </button>
          ))}
        </section>
      )}

      <div className="sticky top-[4.25rem] z-20 -mx-1 bg-paper/95 px-1 py-1 backdrop-blur">
        <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-line">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setMsg(""); }} className={`min-w-0 truncate rounded-xl px-1 py-2.5 text-[12px] font-semibold transition ${tab === k ? "bg-brand text-white shadow" : "text-muted hover:bg-brand-soft"}`}>{l}</button>
          ))}
        </div>
      </div>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 text-center font-medium">{msg}</p>}

      {tab === "info" && !editing && (
        <section className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">{tr("আমার তথ্য", "My details")}</h2>
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm">{tr("সম্পাদনা", "Edit")}</button>
          </div>
          <button onClick={() => setShowInfo((v) => !v)} aria-expanded={showInfo} className="flex w-full items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3.5 text-left transition active:scale-[0.99]">
            <span className="text-xl" aria-hidden>👤</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-brand-dark">{tr("ব্যক্তিগত তথ্য", "Personal information")}</span>
              <span className="block text-xs text-muted">{showInfo ? tr("লুকাতে চাপ দিন", "Tap to hide") : tr("সব তথ্য দেখতে চাপ দিন", "Tap to see all details")}</span>
            </span>
            <span className={`text-lg text-brand transition-transform ${showInfo ? "rotate-180" : ""}`} aria-hidden>▾</span>
          </button>
          {showInfo && <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-bold text-brand-dark">{tr("ব্যক্তিগত", "Personal")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Item label={tr("নাম", "Name")} value={m.name} />
              <Item label={tr("পিতার নাম", "Father's name")} value={m.father_name} />
              <Item label={tr("জন্মতারিখ", "Date of birth")} value={m.dob ? fmtDate(m.dob) : null} />
              <Item label={tr("শিক্ষাগত যোগ্যতা", "Education")} value={m.education} />
              <Item label={tr("পেশা", "Profession")} value={m.profession} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-brand-dark">{tr("যোগাযোগ", "Contact")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Item label={tr("মোবাইল", "Mobile")} value={bn(m.phone)} />
              <Item label={tr("ইমেইল", "Email")} value={m.email} />
              <Item wide label={tr("ঠিকানা", "Address")} value={m.address} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-brand-dark">{tr("রক্তদান", "Blood donation")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Item label={tr("রক্তের গ্রুপ", "Blood group")} value={m.blood_group} />
              <Item label={tr("শেষ রক্তদান", "Last donation")} value={m.last_blood_donation ? fmtDate(m.last_blood_donation) : null} />
              {m.blood_group && <Item wide label={tr("পরবর্তী রক্তদান", "Next donation")} value={canDonate ? tr("এখন রক্ত দিতে পারবেন", "Eligible now") : tr(`আরও ${bn(gap)} দিন পর`, `In ${gap} days`)} />}
              <Item wide label={tr("রক্তদাতা তালিকায়", "In donor list")} value={m.show_in_blood_list ? tr("হ্যাঁ, দেখানো হবে", "Yes, visible") : tr("না, লুকানো", "No, hidden")} />
            </div>
          </div>
          {m.about && (
            <div>
              <p className="mb-2 text-sm font-bold text-brand-dark">{tr("আমার সম্পর্কে", "About me")}</p>
              <p className="whitespace-pre-line rounded-2xl bg-paper px-4 py-3">{m.about}</p>
            </div>
          )}
          </div>}
        </section>
      )}

      {tab === "info" && editing && (
        <form onSubmit={save} className="card space-y-4">
          <h2 className="text-xl">{tr("তথ্য সম্পাদনা", "Edit details")}</h2>
          <div>
            <label className="label" htmlFor="name">{tr("নাম", "Name")}</label>
            <input id="name" name="name" defaultValue={m.name} required className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="father_name">{tr("পিতার নাম", "Father's name")}</label><input id="father_name" name="father_name" defaultValue={m.father_name ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="dob">{tr("জন্মতারিখ", "Date of birth")}</label><input id="dob" name="dob" type="date" defaultValue={m.dob ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="education">{tr("শিক্ষাগত যোগ্যতা", "Education")}</label><input id="education" name="education" defaultValue={m.education ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="profession">{tr("পেশা", "Profession")}</label><input id="profession" name="profession" defaultValue={m.profession ?? ""} className="input" /></div>
          </div>
          <div><label className="label" htmlFor="address">{tr("ঠিকানা", "Address")}</label><input id="address" name="address" defaultValue={m.address ?? ""} className="input" /></div>
          <div><label className="label" htmlFor="email">{tr("ইমেইল", "Email")}</label><input id="email" name="email" type="email" defaultValue={m.email ?? ""} className="input" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="blood_group">{tr("রক্তের গ্রুপ", "Blood group")}</label>
              <select id="blood_group" name="blood_group" defaultValue={m.blood_group ?? ""} className="input">
                <option value="">{tr("জানি না / বলতে চাই না", "Unknown / prefer not to say")}</option>
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="last_blood_donation">{tr("শেষ রক্তদান", "Last donation")}</label><input id="last_blood_donation" name="last_blood_donation" type="date" defaultValue={m.last_blood_donation ?? ""} className="input" /></div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl bg-brand-soft p-3 text-sm">
            <input type="checkbox" name="show_in_blood_list" defaultChecked={m.show_in_blood_list} className="mt-1 h-5 w-5 accent-[#3f86bd]" />
            <span>{tr("জরুরি প্রয়োজনে রক্তদাতা তালিকায় আমার নাম ও ফোন নম্বর দেখানো যেতে পারে।", "My name and phone may be shown in the blood-donor list for emergencies.")}</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl bg-paper p-3 text-sm">
            <input type="checkbox" name="hide_public" defaultChecked={!!m.hide_public} className="mt-1 h-5 w-5 accent-[#3f86bd]" />
            <span>{tr("“সেরা সদস্য” ও নিয়মিত চাঁদাদাতার সম্মাননা তালিকায় আমার নাম দেখাবেন না।", "Do not show my name in the honors and regular-payers lists.")}</span>
          </label>
          <div><label className="label" htmlFor="about">{tr("আমার সম্পর্কে (ঐচ্ছিক)", "About me (optional)")}</label><textarea id="about" name="about" rows={3} defaultValue={m.about ?? ""} className="input" /></div>
          <div className="flex gap-2">
            <button disabled={saving} className="btn btn-primary flex-1 py-3 text-lg">{saving ? tr("সংরক্ষণ হচ্ছে…", "Saving…") : tr("সংরক্ষণ করুন", "Save")}</button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost">{tr("বাতিল", "Cancel")}</button>
          </div>
        </form>
      )}

      {tab === "chada" &&
        (m.status !== "active" ? (
          <p className="card text-center text-muted">{tr("সদস্যপদ অনুমোদনের পর চাঁদার হিসাব দেখা যাবে।", "Dues will appear after your membership is approved.")}</p>
        ) : (
          <section className="card space-y-4">
            <h2 className="text-xl">{tr("আমার চাঁদার হিসাব", "My dues")}</h2>
            <p className="text-muted">{tr("মাসিক চাঁদা", "Monthly fee")}: <b className="text-ink">{taka(m.monthly_fee)}</b> • {tr("যোগদান", "Joined")}: {fmtDate(m.joined_on)}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-brand-soft p-3"><p className="text-2xl font-bold text-brand">{bn(due.paid)}</p><p className="text-xs text-muted">{tr("মাস পরিশোধ", "Months paid")}</p></div>
              <div className="rounded-2xl bg-accent-soft p-3"><p className="text-2xl font-bold">{bn(due.due)}</p><p className="text-xs text-muted">{tr("মাস বাকি", "Months due")}</p></div>
              <div className="rounded-2xl bg-blood/10 p-3"><p className="text-xl font-bold text-blood">{taka(due.amount)}</p><p className="text-xs text-muted">{tr("মোট বকেয়া", "Total due")}</p></div>
            </div>
            {due.due === 0 ? (
              <p className="font-semibold text-brand">{tr("আপনার কোনো বকেয়া নেই। সংগঠনের পাশে থাকার জন্য ধন্যবাদ!", "You have no dues. Thank you for standing with us!")}</p>
            ) : (
              payNote && <p className="rounded-2xl bg-paper p-3 text-sm">{payNote}</p>
            )}
            <div className="rounded-2xl bg-paper p-3">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold">{bn(year)} {tr("সালের নিয়মিততা", "consistency")}</span>
                <span className="font-bold text-brand-dark">{bn(paidThisYear)}/{bn(expected)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gradient-to-r from-brand to-[#6aa8d8] transition-all" style={{ width: `${yearPct}%` }} /></div>
              <p className="mt-1.5 text-xs text-muted">{tr("মোট পরিশোধ", "Total paid")}: <b className="text-ink">{taka(totalPaid)}</b></p>
            </div>
            <PayForm m={m} payments={payments} />
            <div>
              <p className="label">{tr("গত ১২ মাস", "Last 12 months")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {lastMonths(12).filter((k) => k >= joinKey).map((k) => {
                  const paid = paidSet.has(k);
                  return (
                    <div key={k} className={`rounded-xl px-2 py-1.5 text-center text-sm font-medium ${paid ? "bg-brand-soft text-brand-dark" : "bg-blood/10 text-blood"}`}>
                      {fmtMonth(monthStart(k))}
                      <span className="block text-xs">{paid ? tr("✓ পরিশোধ", "✓ Paid") : tr("বাকি", "Due")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

      {tab === "activity" && (
        <section className="card space-y-4">
          <h2 className="text-xl">{tr("আমার কার্যক্রম", "My activity")}</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-brand-soft p-3"><p className="text-2xl font-bold text-brand">{bn(attended.length)}</p><p className="text-xs text-muted">{tr("অনুষ্ঠানে অংশ", "Events joined")}</p></div>
            <div className="rounded-2xl bg-accent-soft p-3"><p className="text-2xl font-bold">{bn(payments.length)}</p><p className="text-xs text-muted">{tr("চাঁদা দিয়েছেন", "Payments made")}</p></div>
            <div className="rounded-2xl bg-blood/10 p-3"><p className="text-2xl font-bold text-blood">{m.last_blood_donation ? "✓" : "—"}</p><p className="text-xs text-muted">{tr("রক্তদান", "Blood donor")}</p></div>
          </div>
          {attended.length === 0 ? (
            <p className="rounded-2xl bg-paper p-4 text-center text-sm text-muted">{tr("এখনো কোনো অনুষ্ঠানে উপস্থিতি নথিভুক্ত হয়নি। সংগঠনের কর্মসূচিতে অংশ নিলে এখানে জমা হবে।", "No attendance recorded yet. Events you join will appear here.")}</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-brand-soft pl-4">
              {attended.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-brand ring-4 ring-white" />
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-xs text-muted">{fmtDate(e.event_date)}{e.location ? ` • ${e.location}` : ""}</p>
                </li>
              ))}
            </ol>
          )}
          <Link href="/events" className="btn btn-ghost w-full">{tr("সব কার্যক্রম দেখুন", "See all activities")}</Link>
        </section>
      )}

      {tab === "card" &&
        (m.status !== "active" ? (
          <p className="card text-center text-muted">{tr("সদস্যপদ অনুমোদনের পর এখানে আপনার সদস্যপদ রসিদ পাবেন, যা ডাউনলোড করা যাবে।", "After approval your membership receipt will appear here and can be downloaded.")}</p>
        ) : (
          <div className="mx-auto max-w-md"><MembershipCard m={m} /></div>
        ))}

      {tab === "security" && (
        <>
          <form onSubmit={changePassword} className="card space-y-3">
            <h2 className="text-xl">{tr("পাসওয়ার্ড বদলান", "Change password")}</h2>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={tr("নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)", "New password (at least 6 characters)")} autoComplete="new-password" className="input" />
            <button className="btn btn-primary">{tr("পাসওয়ার্ড বদলান", "Change password")}</button>
          </form>
          <PushToggle />
          <div className="card space-y-2">
            <Link href="/settings" className="btn btn-ghost w-full">{tr("ভাষা ও অন্যান্য সেটিংস", "Language & other settings")}</Link>
            <button onClick={logout} className="btn btn-danger w-full">{tr("লগআউট", "Logout")}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ProfileInner />
    </Suspense>
  );
}
