"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import { browserClient } from "@/lib/supabase";
import { BLOOD_GROUPS, bn, currentMonthKey, en, errorMessage, isValidPhone, normalizePhone, taka } from "@/lib/bn";
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
    return (members ?? [])
      .filter((m) => m.status === filter && (!needle || m.name.toLowerCase().includes(needle) || m.phone.includes(needle) || (m.address ?? "").toLowerCase().includes(needle)))
      .sort((a, b) => (filter === "pending" ? 0 : a.name.localeCompare(b.name, "bn")));
  }, [members, filter, q]);

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

  if (!members) return <p className="text-muted">লোড হচ্ছে…</p>;
  const key = currentMonthKey();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(filterLabel) as Filter[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter === k ? "btn-primary" : "btn-ghost"}`}>
            {filterLabel[k]} ({bn(counts[k])})
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, নম্বর বা ঠিকানা খুঁজুন" className="input ml-auto w-full sm:max-w-64" />
      </div>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      {shown.length === 0 ? (
        <p className="card text-muted">এখানে কেউ নেই।</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
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
                    {m.user_id && <span className="badge bg-sky-soft text-brand-dark">লগইন আছে</span>}
                    <a href={`tel:${m.phone}`} className="btn btn-ghost btn-sm">কল</a>
                    <Link href={`/admin/members/${m.id}`} className="btn btn-ghost btn-sm">সব তথ্য</Link>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="card">
        <button onClick={() => setShowAdd((v) => !v)} className="flex w-full items-center justify-between text-left">
          <span className="text-lg font-bold">নতুন সদস্য যোগ করুন (অ্যাডমিন নিজে)</span>
          <span className="text-brand">{showAdd ? "বন্ধ" : "খুলুন"}</span>
        </button>
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
    <Suspense fallback={<p className="text-muted">লোড হচ্ছে…</p>}>
      <MembersInner />
    </Suspense>
  );
}
