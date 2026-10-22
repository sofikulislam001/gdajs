"use client";

import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { bn, currentMonthKey, errorMessage, fmtMonth, monthStart, taka, waLink } from "@/lib/bn";
import { dueFor } from "@/lib/dues";
import type { Member, Payment } from "@/lib/types";

export default function NoticeAdmin() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pushUsers, setPushUsers] = useState<number | null>(null);
  const key = currentMonthKey();

  useEffect(() => {
    const sb = browserClient();
    Promise.all([sb.from("members").select("*").eq("status", "active").order("name"), sb.from("payments").select("*")]).then(([m, p]) => {
      setMembers((m.data as Member[]) ?? []);
      setPayments((p.data as Payment[]) ?? []);
    });
  }, []);

  useEffect(() => {
    browserClient().rpc("admin_push_count").then(({ data }) => setPushUsers(typeof data === "number" ? data : null), () => {});
  }, []);

  async function send(ev: React.FormEvent) {
    ev.preventDefault();
    if (!window.confirm("এই নোটিশ সব সক্রিয় সদস্যের নোটিফিকেশনে পাঠাবেন?")) return;
    setBusy("send");
    const { data, error } = await browserClient().rpc("admin_broadcast", { p_title: title, p_body: body, p_link: link.trim() || null });
    setBusy("");
    if (error) return setMsg(errorMessage(error));
    setMsg(`${bn(Number(data ?? 0))} জন সদস্যের নোটিফিকেশনে নোটিশ পাঠানো হয়েছে ✅`);
    setTitle("");
    setBody("");
    setLink("");
  }

  async function remind() {
    if (!window.confirm("যাদের চাঁদা বাকি তাদের সবাইকে এখনই রিমাইন্ডার পাঠাবেন?")) return;
    setBusy("rem");
    const { data, error } = await browserClient().rpc("admin_send_due_reminders");
    setBusy("");
    setMsg(error ? errorMessage(error) : `${bn(Number(data ?? 0))} জন বকেয়াদার সদস্যকে রিমাইন্ডার পাঠানো হয়েছে ✅`);
  }

  const dues = members
    .map((m) => ({ m, d: dueFor(m, payments, key) }))
    .filter((x) => x.d.due > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl">নোটিশ ও রিমাইন্ডার</h1>
        <p className="text-muted">সব সদস্যকে একসাথে নোটিফিকেশন পাঠান এবং বকেয়া সদস্যদের মনে করিয়ে দিন।</p>
      </div>
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      <form onSubmit={send} className="card space-y-3">
        <h2 className="text-lg">সবাইকে নোটিশ পাঠান</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="শিরোনাম (যেমন: শুক্রবার সভা)" className="input" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={600} placeholder="বিস্তারিত লিখুন" className="input" />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="লিংক (ঐচ্ছিক, যেমন /events)" className="input" />
        <button disabled={busy === "send"} className="btn btn-primary w-full py-3">{busy === "send" ? "পাঠানো হচ্ছে…" : "সব সক্রিয় সদস্যকে পাঠান"}</button>
        <p className="text-xs text-muted">সদস্যরা অ্যাপের ঘণ্টা (🔔) আইকনে এটি দেখবেন। যাঁরা সেটিংসে &ldquo;ফোনে পুশ নোটিফিকেশন&rdquo; চালু করেছেন, তাঁদের ফোনের স্ক্রিনেও আসবে।{pushUsers !== null && <> এখন পুশ চালু আছে <b>{bn(pushUsers)} জন</b> সদস্যের।</>}</p>
      </form>

      <div className="card space-y-3">
        <h2 className="text-lg">চাঁদার রিমাইন্ডার</h2>
        <p className="text-sm text-muted">প্রতি মাসের ৫ তারিখ সকাল ৯টায় বকেয়া সদস্যদের কাছে অ্যাপের নোটিফিকেশনে রিমাইন্ডার নিজে থেকেই যায়। চাইলে এখনই পাঠাতে পারেন।</p>
        <button disabled={busy === "rem"} onClick={remind} className="btn btn-accent w-full py-3">{busy === "rem" ? "পাঠানো হচ্ছে…" : `এখনই রিমাইন্ডার পাঠান (${bn(dues.length)} জন)`}</button>
      </div>

      <div className="card space-y-3 p-0">
        <div className="p-4 pb-0">
          <h2 className="text-lg">হোয়াটসঅ্যাপে মনে করিয়ে দিন</h2>
          <p className="text-sm text-muted">{fmtMonth(monthStart(key))} পর্যন্ত বকেয়া। বোতাম চাপলে হোয়াটসঅ্যাপে মেসেজ তৈরি হবে, আপনি শুধু Send চাপবেন।</p>
        </div>
        <div className="divide-y divide-line">
          {dues.length === 0 && <p className="p-4 text-muted">কারও বকেয়া নেই 🎉</p>}
          {dues.map(({ m, d }) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{m.name}</p><p className="text-xs text-muted">{bn(m.phone)} • {bn(d.due)} মাস</p></div>
              <p className="font-semibold text-blood">{taka(d.amount)}</p>
              <a target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" href={waLink(m.phone, `আসসালামু আলাইকুম ${m.name}, গোদনাইল আলোকিত যুব শক্তির ${bn(d.due)} মাসের চাঁদা ${taka(d.amount)} বাকি আছে। সুবিধামতো পরিশোধ করার অনুরোধ রইল। ধন্যবাদ।`)}>পাঠান</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
