"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import MembershipCard, { memberNo } from "@/components/MembershipCard";
import SetupNotice from "@/components/SetupNotice";
import { ListSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";
import { BLOOD_GROUPS, bn, currentMonthKey, errorMessage, fmtDate, fmtMonth, monthStart, taka } from "@/lib/bn";
import { COVER_SRC } from "@/lib/brand";
import { dueFor } from "@/lib/dues";
import { useLang } from "@/lib/lang";
import { browserClient, isConfigured } from "@/lib/supabase";
import type { Member, Payment } from "@/lib/types";

type Tab = "info" | "chada" | "card" | "security";

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
  const [pw, setPw] = useState("");
  const [payNote, setPayNote] = useState("");
  const [tab, setTab] = useState<Tab>(() => {
    const t = params.get("tab");
    return t === "chada" || t === "card" || t === "security" ? t : "info";
  });

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p] = await Promise.all([
      sb.from("members").select("*").maybeSingle(),
      sb.from("payments").select("*").order("month", { ascending: false }),
    ]);
    setMember((m.data as Member | null) ?? null);
    setPayments((p.data as Payment[]) ?? []);
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
    ["info", tr("তথ্য", "Details")],
    ["chada", tr("চাঁদা", "Dues")],
    ["card", tr("রসিদ", "Receipt")],
    ["security", tr("নিরাপত্তা", "Security")],
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
        <div className="relative h-28 sm:h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COVER_SRC ?? "/photos/cover.jpg"} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12324f]/70 to-transparent" />
        </div>
        <div className="relative z-10 -mt-14 flex flex-col items-center gap-1.5 px-4 pb-6 text-center">
          <div>
            <ImageUpload avatar name={m.name} value={m.photo_url ?? ""} onChange={setPhoto} folder={`avatars/${user.id}`} maxSide={640} />
          </div>
          <h1 className="text-2xl">{m.name}</h1>
          <p className="text-sm text-muted">{memberNo(m)} • {bn(m.phone)}</p>
          <span className={`badge ${statusBadge.c}`}>{statusBadge.t}</span>
          {m.status === "pending" && <p className="max-w-md text-sm text-muted">{tr("আপনার আবেদন যাচাইয়ের অপেক্ষায় আছে। অনুমোদন হলে এখানে চাঁদার হিসাব ও রসিদ পাবেন।", "Your application is being reviewed. Once approved you will see dues and your receipt here.")}</p>}
        </div>
      </section>

      <div className="sticky top-[4.25rem] z-20 -mx-1 bg-paper/95 px-1 py-1 backdrop-blur">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-line">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setMsg(""); }} className={`rounded-xl py-2.5 text-sm font-semibold transition ${tab === k ? "bg-brand text-white shadow" : "text-muted hover:bg-brand-soft"}`}>{l}</button>
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
              <Item wide label={tr("রক্তদাতা তালিকায়", "In donor list")} value={m.show_in_blood_list ? tr("হ্যাঁ, দেখানো হবে", "Yes, visible") : tr("না, লুকানো", "No, hidden")} />
            </div>
          </div>
          {m.about && (
            <div>
              <p className="mb-2 text-sm font-bold text-brand-dark">{tr("আমার সম্পর্কে", "About me")}</p>
              <p className="whitespace-pre-line rounded-2xl bg-paper px-4 py-3">{m.about}</p>
            </div>
          )}
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
