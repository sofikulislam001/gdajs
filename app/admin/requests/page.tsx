"use client";

import Avatar from "@/components/Avatar";
import { ListSkeleton } from "@/components/Skeleton";
import { methodLabel } from "@/components/PaymentReceipt";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { bn, errorMessage, fmtDate, fmtMonth, taka } from "@/lib/bn";
import type { Member, PaymentRequest } from "@/lib/types";

const tr = (b: string) => b;

export default function RequestsAdmin() {
  const [rows, setRows] = useState<(PaymentRequest & { member?: Member })[] | null>(null);
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [r, m] = await Promise.all([
      sb.from("payment_requests").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("members").select("*"),
    ]);
    if (r.error) setMsg(errorMessage(r.error));
    const map = new Map(((m.data as Member[]) ?? []).map((x) => [x.id, x]));
    setRows(((r.data as PaymentRequest[]) ?? []).map((x) => ({ ...x, member: map.get(x.member_id) })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    setBusy(id);
    const { error } = await browserClient().rpc("approve_payment_request", { p_id: id });
    setBusy("");
    setMsg(error ? errorMessage(error) : "চাঁদা হিসাবে যুক্ত হয়েছে এবং সদস্যকে নোটিফিকেশন গেছে ✅");
    await load();
  }

  async function reject(id: string) {
    const note = window.prompt("বাতিলের কারণ (সদস্য দেখতে পাবেন):", "ট্রানজ্যাকশন আইডি মেলেনি");
    if (note === null) return;
    setBusy(id);
    const { error } = await browserClient().rpc("reject_payment_request", { p_id: id, p_note: note });
    setBusy("");
    setMsg(error ? errorMessage(error) : "অনুরোধ বাতিল করা হয়েছে");
    await load();
  }

  if (!rows) return <ListSkeleton />;
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");
  const list = tab === "pending" ? pending : done;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">চাঁদা যাচাই</h1>
        <p className="text-muted">সদস্যরা অনলাইনে যে চাঁদা জমা দিয়েছেন। বিকাশ/নগদে টাকা এসেছে কিনা মিলিয়ে &ldquo;গ্রহণ করুন&rdquo; চাপুন।</p>
      </div>
      {msg && <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm">{msg}</p>}
      <div className="flex gap-2">
        <button onClick={() => setTab("pending")} className={`btn btn-sm ${tab === "pending" ? "btn-primary" : "btn-ghost"}`}>যাচাই বাকি ({bn(pending.length)})</button>
        <button onClick={() => setTab("done")} className={`btn btn-sm ${tab === "done" ? "btn-primary" : "btn-ghost"}`}>নিষ্পন্ন ({bn(done.length)})</button>
      </div>
      {list.length === 0 && <p className="card text-center text-muted">{tab === "pending" ? "কোনো অনুরোধ বাকি নেই 🎉" : "এখনো কিছু নেই"}</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((r) => (
          <div key={r.id} className="card space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={r.member?.photo_url} name={r.member?.name ?? "?"} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{r.member?.name ?? "অজানা সদস্য"}</p>
                <p className="text-xs text-muted">{r.member ? bn(r.member.phone) : ""} • {fmtDate(r.created_at)}</p>
              </div>
              <p className="text-xl font-extrabold text-brand">{taka(r.amount)}</p>
            </div>
            <div className="rounded-2xl bg-paper p-3 text-sm">
              <p><b>মাস:</b> {r.months.map((x) => fmtMonth(x)).join(", ")}</p>
              <p><b>মাধ্যম:</b> {methodLabel(r.method, tr)}</p>
              {r.trx_id && <p><b>TrxID:</b> <span className="select-all font-mono font-bold">{r.trx_id}</span></p>}
              {r.note && <p><b>মন্তব্য:</b> {r.note}</p>}
              {r.status === "rejected" && r.admin_note && <p className="text-blood"><b>বাতিলের কারণ:</b> {r.admin_note}</p>}
            </div>
            {r.status === "pending" ? (
              <div className="flex gap-2">
                <button disabled={busy === r.id} onClick={() => approve(r.id)} className="btn btn-primary flex-1">গ্রহণ করুন</button>
                <button disabled={busy === r.id} onClick={() => reject(r.id)} className="btn btn-ghost">বাতিল</button>
              </div>
            ) : (
              <span className={`badge ${r.status === "approved" ? "bg-brand-soft text-brand-dark" : "bg-blood/10 text-blood"}`}>{r.status === "approved" ? "গৃহীত" : "বাতিল"}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
