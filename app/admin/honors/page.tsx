"use client";

import { useCallback, useEffect, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { currentMonthKey, errorMessage, fmtMonth, monthStart } from "@/lib/bn";
import { browserClient } from "@/lib/supabase";
import type { Member } from "@/lib/types";

type Honor = { id: string; member_id: string; title: string; month: string | null; note: string | null };

export default function HonorsAdmin() {
  const [rows, setRows] = useState<Honor[] | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [h, m] = await Promise.all([sb.from("honors").select("*").order("month", { ascending: false }), sb.from("members").select("*").eq("status", "active").order("name")]);
    if (h.error) setMsg(errorMessage(h.error));
    setRows((h.data as Honor[]) ?? []);
    setMembers((m.data as Member[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const month = String(f.get("month") ?? "");
    const { error } = await browserClient().from("honors").insert({
      member_id: String(f.get("member")),
      title: String(f.get("title") ?? "").trim() || "এ মাসের সেরা সদস্য",
      month: month ? monthStart(month) : null,
      note: String(f.get("note") ?? "").trim() || null,
    });
    if (error) return setMsg(errorMessage(error));
    form.reset();
    setMsg("সম্মাননা যুক্ত হয়েছে ✅");
    await load();
  }

  async function del(id: string) {
    if (!window.confirm("এই সম্মাননা মুছবেন?")) return;
    const { error } = await browserClient().from("honors").delete().eq("id", id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  if (!rows) return <ListSkeleton />;
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl">সম্মাননা</h1>
        <p className="text-muted">&ldquo;এ মাসের সেরা সদস্য&rdquo; বা অন্য কোনো সম্মাননা দিন। &ldquo;সম্মাননা&rdquo; পাতায় দেখাবে। নিয়মিত চাঁদাদাতাদের তালিকা নিজে থেকেই তৈরি হয়।</p>
      </div>
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}
      <form onSubmit={add} className="card space-y-3">
        <select name="member" required className="input" defaultValue="">
          <option value="" disabled>সদস্য বেছে নিন</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input name="title" placeholder="সম্মাননার নাম (ফাঁকা থাকলে: এ মাসের সেরা সদস্য)" className="input" />
        <input name="month" type="month" defaultValue={currentMonthKey()} className="input" />
        <input name="note" placeholder="কেন (ঐচ্ছিক)" className="input" />
        <button className="btn btn-primary w-full">সম্মাননা দিন</button>
      </form>
      <div className="card divide-y divide-line p-0">
        {rows.length === 0 && <p className="p-4 text-muted">এখনো কোনো সম্মাননা নেই</p>}
        {rows.map((h) => (
          <div key={h.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{name(h.member_id)}</p><p className="text-xs text-muted">{h.title}{h.month ? ` • ${fmtMonth(h.month)}` : ""}</p></div>
            <button onClick={() => del(h.id)} className="btn btn-danger btn-sm">মুছুন</button>
          </div>
        ))}
      </div>
    </div>
  );
}
