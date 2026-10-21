"use client";

import { ListSkeleton } from "@/components/Skeleton";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AIcon } from "@/components/AdminIcons";
import Avatar from "@/components/Avatar";
import { browserClient } from "@/lib/supabase";
import { BLOOD_GROUPS, bn, currentMonthKey, en, errorMessage, fmtDate, isValidPhone, normalizePhone, taka, waLink } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

type Filter = "pending" | "active" | "inactive";
const filterLabel: Record<Filter, string> = { pending: "নতুন আবেদন", active: "সক্রিয়", inactive: "নিষ্ক্রিয়" };
const badge: Record<Filter, string> = { pending: "bg-accent-soft text-[#8a5a00]", active: "bg-brand-soft text-brand-dark", inactive: "bg-line text-muted" };

function MembersInner() {
  const params = useSearchParams();
  const initial = (["pending", "active", "inactive"].includes(params.get("f") ?? "") ? params.get("f") : "active") as Filter;
  const [members, setMembers] = useState<Member[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<Filter>(initial);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [bulk, setBulk] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState<"name" | "new" | "due">("name");
  const [bloodF, setBloodF] = useState("");
  const [view, setView] = useState<"table" | "cards">("table");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, p] = await Promise.all([sb.from("members").select("*").order("created_at", { ascending: false }), sb.from("payments").select("*")]);
    if (m.error) setMsg(errorMessage(m.error));
    setMembers((m.data as Member[]) ?? []);
    setPayments((p.data as Payment[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, inactive: 0 };
    members?.forEach((m) => c[m.status]++);
    return c;
  }, [members]);

  const shown = useMemo(() => {
    const needle = en(q.trim().toLowerCase());
    const key = currentMonthKey();
    const list = (members ?? []).filter(
      (m) =>
        m.status === filter &&
        (!bloodF || m.blood_group === bloodF) &&
        (!needle || m.name.toLowerCase().includes(needle) || m.phone.includes(needle) || (m.address ?? "").toLowerCase().includes(needle)),
    );
    const dueAmt = (m: Member) => dueFor(m, payments, key).amount;
    list.sort((a, b) => (sort === "new" ? b.created_at.localeCompare(a.created_at) : sort === "due" ? dueAmt(b) - dueAmt(a) : a.name.localeCompare(b.name, "bn")));
    return list;
  }, [members, filter, q, sort, bloodF, payments]);

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["নাম", "মোবাইল", "পিতার নাম", "জন্মতারিখ", "ঠিকানা", "পেশা", "শিক্ষা", "ইমেইল", "রক্তের গ্রুপ", "শেষ রক্তদান", "মাসিক চাঁদা", "স্ট্যাটাস", "যোগদান"];
    const rows = shown.map((m) => [m.name, m.phone, m.father_name, m.dob, m.address, m.profession, m.education, m.email, m.blood_group, m.last_blood_donation, m.monthly_fee, m.status, m.joined_on]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function approve(m: Member) {
    const input = window.prompt(`${m.name}-এর মাসিক চাঁদা কত টাকা?`, String(m.monthly_fee));
    if (input === null) return;
    const fee = Number(en(input));
    if (!Number.isFinite(fee) || fee < 0) return setMsg("চাঁদার পরিমাণ সঠিক নয়");
    const { error } = await browserClient().from("members").update({ status: "active", monthly_fee: fee, joined_on: new Date().toISOString().slice(0, 10) }).eq("id", m.id);
    setMsg(error ? errorMessage(error) : `${m.name} এখন সক্রিয় সদস্য`);
    await load();
  }

  async function addOne(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const phone = normalizePhone(String(f.get("phone") ?? ""));
    if (!isValidPhone(phone)) return setMsg("সঠিক মোবাইল নম্বর দিন");
    const { error } = await browserClient().from("members").insert({
      name: String(f.get("name") ?? "").trim(),
      phone,
      address: String(f.get("address") ?? "").trim() || null,
      blood_group: String(f.get("blood_group") ?? "") || null,
      monthly_fee: Number(en(String(f.get("fee") ?? "100"))) || 100,
      status: "active",
    });
    if (error) return setMsg(error.code === "23505" ? "এই নম্বর আগেই আছে" : errorMessage(error));
    form.reset();
    setMsg("সদস্য যোগ হয়েছে। এখন তার পাতায় গিয়ে বাকি তথ্য ও লগইন পাসওয়ার্ড দিতে পারেন।");
    await load();
  }

  async function importBulk() {
    const rows: Record<string, unknown>[] = [];
    const bad: string[] = [];
    for (const line of bulk.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const [name, rawPhone, fee, group] = line.split(/[,،\t]/).map((s) => s.trim());
      const phone = normalizePhone(rawPhone ?? "");
      if (!name || !isValidPhone(phone)) {
        bad.push(line);
        continue;
      }
      rows.push({
        name,
        phone,
        monthly_fee: Number(en(fee ?? "")) || 100,
        blood_group: (BLOOD_GROUPS as readonly string[]).includes((group ?? "").toUpperCase()) ? group.toUpperCase() : null,
        status: "active",
      });
    }
    if (rows.length === 0) return setMsg("কোনো সঠিক লাইন পাওয়া যায়নি");
    const { error } = await browserClient().from("members").upsert(rows, { onConflict: "phone", ignoreDuplicates: true });
    if (error) return setMsg(errorMessage(error));
    setMsg(`${bn(rows.length)} জন যোগ হয়েছে${bad.length ? `। ${bn(bad.length)}টি লাইনে ভুল ছিল: ${bad.join(" | ")}` : ""}`);
    setBulk("");
    await load();
  }

  if (!members) return <ListSkeleton />;
  const key = currentMonthKey();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">সদস্য ব্যবস্থাপনা</h1>
          <p className="text-muted">মোট {bn(members.length)} জন • সক্রিয় {bn(counts.active)} • আবেদন {bn(counts.pending)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn btn-ghost"><AIcon name="download" size={18} /> Excel/CSV</button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary"><AIcon name="plus" size={18} /> নতুন সদস্য</button>
        </div>
      </div>

      <div className="card space-y-3 p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {(Object.keys(filterLabel) as Filter[]).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${filter === k ? "bg-brand text-white" : "bg-paper text-ink hover:bg-brand-soft"}`}>
              {filterLabel[k]} <span className={`ml-1 rounded-full px-2 text-xs ${filter === k ? "bg-white/25" : "bg-white"}`}>{bn(counts[k])}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <AIcon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, নম্বর বা ঠিকানা খুঁজুন" className="input pl-10" />
          </div>
          <select value={bloodF} onChange={(e) => setBloodF(e.target.value)} className="input sm:w-36" aria-label="রক্তের গ্রুপ">
            <option value="">সব গ্রুপ</option>
            {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input sm:w-44" aria-label="সাজান">
            <option value="name">নাম অনুযায়ী</option>
            <option value="new">নতুন আগে</option>
            <option value="due">বকেয়া বেশি আগে</option>
          </select>
          <div className="hidden gap-1 rounded-2xl bg-paper p-1 md:flex">
            <button onClick={() => setView("table")} aria-label="টেবিল" className={`rounded-xl px-3 py-1.5 ${view === "table" ? "bg-white shadow" : ""}`}><AIcon name="list" size={18} /></button>
            <button onClick={() => setView("cards")} aria-label="কার্ড" className={`rounded-xl px-3 py-1.5 ${view === "cards" ? "bg-white shadow" : ""}`}><AIcon name="grid" size={18} /></button>
          </div>
        </div>
      </div>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      {shown.length === 0 ? (
        <p className="card text-center text-muted">এই তালিকায় কেউ নেই।</p>
      ) : (
        <>
          {view === "table" && (
            <div className="card hidden overflow-hidden p-0 md:block">
              <table className="w-full text-left">
                <thead className="bg-paper text-sm text-muted">
                  <tr>
                    <th className="th">সদস্য</th>
                    <th className="th">যোগাযোগ</th>
                    <th className="th">রক্ত</th>
                    <th className="th">{filter === "pending" ? "আবেদনের তারিখ" : "বকেয়া"}</th>
                    <th className="th text-right">কাজ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((m) => {
                    const due = dueFor(m, payments, key);
                    return (
                      <tr key={m.id} className="hover:bg-brand-soft/40">
                        <td className="td">
                          <Link href={`/admin/members/${m.id}`} className="flex items-center gap-3">
                            <Avatar src={m.photo_url} name={m.name} size={42} />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{m.name}</span>
                              <span className="block truncate text-xs text-muted">{m.address ?? "ঠিকানা নেই"}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="td text-sm">{bn(m.phone)}{m.user_id && <span className="ml-2 badge bg-sky-soft text-brand-dark">লগইন</span>}</td>
                        <td className="td">{m.blood_group ? <span className="badge bg-blood/10 text-blood">{m.blood_group}</span> : <span className="text-muted">—</span>}</td>
                        <td className="td text-sm">
                          {filter === "pending" ? fmtDate(m.created_at.slice(0, 10)) : m.status === "active" ? (due.due > 0 ? <span className="font-semibold text-blood">{taka(due.amount)} ({bn(due.due)} মাস)</span> : <span className="text-brand">নেই</span>) : "—"}
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-1.5">
                            {m.status === "pending" && <button onClick={() => approve(m)} className="btn btn-primary btn-sm">অনুমোদন</button>}
                            <a href={`tel:${m.phone}`} className="btn btn-ghost btn-sm" aria-label="কল"><AIcon name="phone" size={16} /></a>
                            <a href={waLink(m.phone, `আসসালামু আলাইকুম ${m.name}`)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" aria-label="হোয়াটসঅ্যাপ"><AIcon name="chat" size={16} /></a>
                            <Link href={`/admin/members/${m.id}`} className="btn btn-ghost btn-sm">সব তথ্য</Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${view === "table" ? "md:hidden" : ""}`}>
            {shown.map((m) => {
              const due = dueFor(m, payments, key);
              return (
                <div key={m.id} className="card flex flex-col gap-3">
                  <Link href={`/admin/members/${m.id}`} className="flex items-center gap-3">
                    <Avatar src={m.photo_url} name={m.name} size={56} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold leading-tight">{m.name}</p>
                      <p className="text-sm text-muted">{bn(m.phone)}{m.blood_group ? ` • ${m.blood_group}` : ""}</p>
                      <p className="truncate text-sm text-muted">{m.address ?? "ঠিকানা নেই"}</p>
                    </div>
                    <span className={`badge ${badge[m.status]}`}>{filterLabel[m.status]}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    {m.status === "active" && (
                      <span className={`text-sm font-semibold ${due.due > 0 ? "text-blood" : "text-brand"}`}>
                        {due.due > 0 ? `বকেয়া ${taka(due.amount)} (${bn(due.due)} মাস)` : "বকেয়া নেই"}
                      </span>
                    )}
                    {m.status === "pending" && <button onClick={() => approve(m)} className="btn btn-primary btn-sm">অনুমোদন করুন</button>}
                    <span className="ml-auto flex gap-1.5">
                      <a href={`tel:${m.phone}`} className="btn btn-ghost btn-sm">কল</a>
                      <Link href={`/admin/members/${m.id}`} className="btn btn-ghost btn-sm">সব তথ্য</Link>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <section className={`card ${showAdd ? "" : "hidden"}`}>
        <div className="flex w-full items-center justify-between text-left">
          <span className="text-lg font-bold">নতুন সদস্য যোগ করুন (অ্যাডমিন নিজে)</span>
          <button onClick={() => setShowAdd(false)} className="text-brand">বন্ধ করুন</button>
        </div>
        {showAdd && (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <form onSubmit={addOne} className="space-y-3">
              <h3 className="font-semibold">একজন সদস্য</h3>
              <input name="name" required placeholder="নাম" className="input" />
              <input name="phone" required inputMode="tel" placeholder="মোবাইল নম্বর" className="input" />
              <input name="address" placeholder="ঠিকানা (ঐচ্ছিক)" className="input" />
              <div className="grid grid-cols-2 gap-3">
                <select name="blood_group" className="input" defaultValue=""><option value="">রক্তের গ্রুপ</option>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
                <input name="fee" inputMode="numeric" placeholder="মাসিক চাঁদা (১০০)" className="input" />
              </div>
              <button className="btn btn-primary">যোগ করুন</button>
            </form>
            <div className="space-y-3">
              <h3 className="font-semibold">একসাথে অনেকজন</h3>
              <p className="text-sm text-muted">প্রতি লাইনে একজন: <code>নাম, মোবাইল, চাঁদা, রক্তের গ্রুপ</code> (শেষের দুটি ঐচ্ছিক)। খাতা বা Excel থেকে কপি-পেস্ট করা যাবে।</p>
              <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} className="input font-mono text-sm" placeholder={"রহিম উদ্দিন, 01711223344, 100, B+\nকরিম, 01911223344"} />
              <button onClick={importBulk} className="btn btn-primary">ইমপোর্ট করুন</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function MembersAdmin() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <MembersInner />
    </Suspense>
  );
}
