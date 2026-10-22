"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import { ListSkeleton } from "@/components/Skeleton";
import { BLOOD_GROUPS, bn, errorMessage, fmtDate, waLink } from "@/lib/bn";
import { browserClient } from "@/lib/supabase";
import type { BloodRequest, Member } from "@/lib/types";

const DAY = 86400000;
function daysSince(d: string | null): number | null {
  return d ? Math.floor((Date.now() - new Date(`${d}T00:00:00`).getTime()) / DAY) : null;
}

export default function BloodAdmin() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [reqs, setReqs] = useState<BloodRequest[]>([]);
  const [tab, setTab] = useState<"donors" | "requests">("donors");
  const [group, setGroup] = useState("");
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, r] = await Promise.all([
      sb.from("members").select("*").eq("status", "active").not("blood_group", "is", null).order("name"),
      sb.from("blood_requests").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (m.error) setMsg(errorMessage(m.error));
    setMembers((m.data as Member[]) ?? []);
    setReqs((r.data as BloodRequest[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const donors = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (members ?? [])
      .filter((m) => (!group || m.blood_group === group) && (!ready || (daysSince(m.last_blood_donation) ?? 999) >= 90) && (!n || m.name.toLowerCase().includes(n) || m.phone.includes(n)));
  }, [members, group, ready, q]);

  async function donated(m: Member) {
    if (!window.confirm(`${m.name} আজ রক্ত দিয়েছেন বলে লিখবেন? পরের ৯০ দিন "প্রস্তুত" দেখাবে না।`)) return;
    const { error } = await browserClient().rpc("admin_mark_donated", { p_member: m.id });
    setMsg(error ? errorMessage(error) : "রক্তদানের তারিখ হালনাগাদ হয়েছে ✅");
    await load();
  }

  async function setStatus(r: BloodRequest, status: "open" | "fulfilled") {
    const { error } = await browserClient().from("blood_requests").update({ status }).eq("id", r.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  async function del(r: BloodRequest) {
    if (!window.confirm("এই অনুরোধ মুছবেন?")) return;
    const { error } = await browserClient().from("blood_requests").delete().eq("id", r.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  if (!members) return <ListSkeleton />;
  const open = reqs.filter((r) => r.status === "open");
  const counts = BLOOD_GROUPS.map((g) => [g, members.filter((m) => m.blood_group === g).length] as const);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">রক্তদাতা ব্যবস্থাপনা</h1>
        <p className="text-muted">সদস্যদের রক্তদাতা তালিকা ও জরুরি রক্তের অনুরোধ এক জায়গায়।</p>
      </div>
      {msg && <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm">{msg}</p>}

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {counts.map(([g, c]) => (
          <button key={g} onClick={() => { setGroup(group === g ? "" : g); setTab("donors"); }} className={`rounded-2xl border p-2 text-center transition ${group === g ? "border-blood bg-blood text-white" : "border-line bg-white"}`}>
            <p className="text-lg font-extrabold leading-none">{g}</p>
            <p className="mt-1 text-xs opacity-80">{bn(c)} জন</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("donors")} className={`btn btn-sm ${tab === "donors" ? "btn-primary" : "btn-ghost"}`}>দাতা ({bn(donors.length)})</button>
        <button onClick={() => setTab("requests")} className={`btn btn-sm ${tab === "requests" ? "btn-primary" : "btn-ghost"}`}>জরুরি অনুরোধ ({bn(open.length)})</button>
      </div>

      {tab === "donors" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা নম্বর খুঁজুন" className="input w-full sm:w-64" />
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} className="h-5 w-5 accent-[#3f86bd]" /> শুধু রক্তদানে প্রস্তুত</label>
            {group && <button onClick={() => setGroup("")} className="btn btn-ghost btn-sm">ফিল্টার {group} ✕</button>}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {donors.length === 0 && <p className="card text-center text-muted lg:col-span-2">কোনো দাতা পাওয়া যায়নি</p>}
            {donors.map((m) => {
              const d = daysSince(m.last_blood_donation);
              const ok = d === null || d >= 90;
              return (
                <div key={m.id} className="card space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.photo_url} name={m.name} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{m.name}</p>
                      <p className="truncate text-xs text-muted">{bn(m.phone)}{m.address ? ` • ${m.address}` : ""}</p>
                    </div>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blood text-lg font-extrabold text-white">{m.blood_group}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={`badge ${ok ? "bg-brand-soft text-brand-dark" : "bg-accent-soft text-[#8a5a00]"}`}>{ok ? "প্রস্তুত" : `আরও ${bn(90 - (d ?? 0))} দিন পর`}</span>
                    <span className="text-muted">{m.last_blood_donation ? `শেষ দান: ${fmtDate(m.last_blood_donation)}` : "কখনো দেননি / জানা নেই"}</span>
                    <span className={`badge ${m.show_in_blood_list ? "bg-brand-soft text-brand-dark" : "bg-line text-muted"}`}>{m.show_in_blood_list ? "তালিকায় দৃশ্যমান" : "তালিকায় লুকানো"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <a href={`tel:${m.phone}`} className="btn btn-primary btn-sm">কল</a>
                    <a target="_blank" rel="noopener noreferrer" href={waLink(m.phone, `আসসালামু আলাইকুম ${m.name}, গোদনাইল আলোকিত যুব শক্তির পক্ষ থেকে জানাচ্ছি, জরুরি ${m.blood_group} রক্তের প্রয়োজন। আপনি কি সাহায্য করতে পারবেন?`)} className="btn btn-ghost btn-sm">হোয়াটসঅ্যাপ</a>
                    <button onClick={() => donated(m)} className="btn btn-accent btn-sm">আজ রক্ত দিয়েছেন</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "requests" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {reqs.length === 0 && <p className="card text-center text-muted lg:col-span-2">কোনো অনুরোধ নেই</p>}
          {reqs.map((r) => (
            <div key={r.id} className={`card space-y-3 ${r.status === "fulfilled" ? "opacity-70" : "border-blood/30"}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blood text-lg font-extrabold text-white">{r.blood_group}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{r.area}{r.hospital ? ` • ${r.hospital}` : ""}</p>
                  <p className="text-xs text-muted">{[r.patient_name, bn(r.phone), fmtDate(r.created_at)].filter(Boolean).join(" • ")}</p>
                </div>
                <span className={`badge ${r.status === "open" ? "bg-blood/10 text-blood" : "bg-brand-soft text-brand-dark"}`}>{r.status === "open" ? "চলমান" : "সম্পন্ন"}</span>
              </div>
              {(r.needed_on || r.note) && <p className="rounded-2xl bg-paper p-3 text-sm">{r.needed_on ? `প্রয়োজন: ${fmtDate(r.needed_on)}. ` : ""}{r.note}</p>}
              <div className="flex flex-wrap gap-1.5">
                <a href={`tel:${r.phone}`} className="btn btn-primary btn-sm">কল</a>
                {r.status === "open" ? <button onClick={() => setStatus(r, "fulfilled")} className="btn btn-accent btn-sm">রক্ত পাওয়া গেছে</button> : <button onClick={() => setStatus(r, "open")} className="btn btn-ghost btn-sm">আবার চালু করুন</button>}
                <button onClick={() => { setGroup(r.blood_group); setReady(true); setTab("donors"); }} className="btn btn-ghost btn-sm">মিল থাকা দাতা দেখুন</button>
                <button onClick={() => del(r)} className="btn btn-danger btn-sm">মুছুন</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
