"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { bn, errorMessage, taka } from "@/lib/bn";
import { browserClient } from "@/lib/supabase";
import type { Member } from "@/lib/types";

export default function EventTools({ eventId, title }: { eventId: string; title: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [income, setIncome] = useState(0);
  const [spent, setSpent] = useState(0);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [m, a, d, x] = await Promise.all([
      sb.from("members").select("*").eq("status", "active").order("name"),
      sb.from("event_attendance").select("member_id").eq("event_id", eventId),
      sb.from("donations").select("amount").eq("event_id", eventId),
      sb.from("expenses").select("amount").eq("event_id", eventId),
    ]);
    setMembers((m.data as Member[]) ?? []);
    setPresent(new Set(((a.data as { member_id: string }[]) ?? []).map((r) => r.member_id)));
    setIncome(((d.data as { amount: number }[]) ?? []).reduce((s, r) => s + r.amount, 0));
    setSpent(((x.data as { amount: number }[]) ?? []).reduce((s, r) => s + r.amount, 0));
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(id: string) {
    const sb = browserClient();
    const on = present.has(id);
    const next = new Set(present);
    if (on) next.delete(id);
    else next.add(id);
    setPresent(next);
    const { error } = on
      ? await sb.from("event_attendance").delete().eq("event_id", eventId).eq("member_id", id)
      : await sb.from("event_attendance").insert({ event_id: eventId, member_id: id });
    if (error) {
      setMsg(errorMessage(error));
      await load();
    }
  }

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return members.filter((m) => !n || m.name.toLowerCase().includes(n) || m.phone.includes(n));
  }, [members, q]);

  return (
    <div className="space-y-4 border-t border-line bg-paper p-4">
      <p className="font-bold">{title} — তহবিল</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-brand-soft p-3"><p className="text-lg font-bold text-brand">{taka(income)}</p><p className="text-xs text-muted">অনুদান</p></div>
        <div className="rounded-2xl bg-blood/10 p-3"><p className="text-lg font-bold text-blood">{taka(spent)}</p><p className="text-xs text-muted">খরচ</p></div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-line"><p className="text-lg font-bold">{taka(income - spent)}</p><p className="text-xs text-muted">অবশিষ্ট</p></div>
      </div>
      <p className="text-xs text-muted">অনুদান বা খরচ এই কার্যক্রমের নামে যোগ করতে &ldquo;খরচ ও অনুদান&rdquo; পাতায় কার্যক্রম বেছে নিন।</p>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-bold">উপস্থিতি ({bn(present.size)} জন)</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম খুঁজুন" className="input w-40" />
        </div>
        {msg && <p className="mb-2 text-sm text-blood">{msg}</p>}
        <div className="grid max-h-72 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {list.map((m) => (
            <button key={m.id} type="button" onClick={() => toggle(m.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${present.has(m.id) ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-xs ${present.has(m.id) ? "bg-white text-brand" : "bg-paper"}`}>{present.has(m.id) ? "✓" : ""}</span>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-muted">কোনো সদস্য পাওয়া যায়নি</p>}
        </div>
      </div>
    </div>
  );
}
