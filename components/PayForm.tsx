"use client";

import { useCallback, useEffect, useState } from "react";
import PaymentReceipt, { methodLabel, type ReceiptData } from "./PaymentReceipt";
import { bn, en, errorMessage, fmtDate, fmtMonth, monthStart, taka } from "@/lib/bn";
import { useLang } from "@/lib/lang";
import { browserClient } from "@/lib/supabase";
import type { Member, Payment, PaymentRequest } from "@/lib/types";

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

type Method = "bkash" | "nagad" | "rocket" | "cash";

export default function PayForm({ m, payments }: { m: Member; payments: Payment[] }) {
  const { tr } = useLang();
  const [reqs, setReqs] = useState<PaymentRequest[]>([]);
  const [nums, setNums] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<string[]>([]);
  const [method, setMethod] = useState<Method>("bkash");
  const [trx, setTrx] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const load = useCallback(async () => {
    const sb = browserClient();
    const [r, s] = await Promise.all([
      sb.from("payment_requests").select("*").eq("member_id", m.id).order("created_at", { ascending: false }).limit(20),
      sb.from("site_settings").select("key,value").in("key", ["bkash_number", "nagad_number", "rocket_number"]),
    ]);
    setReqs((r.data as PaymentRequest[]) ?? []);
    const o: Record<string, string> = {};
    for (const x of (s.data as { key: string; value: string }[]) ?? []) o[x.key] = x.value;
    setNums(o);
  }, [m.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const joinKey = m.joined_on.slice(0, 7);
  const paid = new Set(payments.map((p) => p.month.slice(0, 7)));
  const pending = new Set(reqs.filter((r) => r.status === "pending").flatMap((r) => r.months.map((x) => x.slice(0, 7))));
  const dueKeys = lastMonths(24).filter((k) => k >= joinKey && !paid.has(k)).reverse();
  const free = dueKeys.filter((k) => !pending.has(k));
  const amount = sel.length * m.monthly_fee;
  const number = nums[`${method}_number`] ?? "";

  function toggle(k: string) {
    setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setMsg("");
    const t = en(trx).trim();
    if (sel.length === 0) return setMsg(tr("কমপক্ষে একটি মাস বেছে নিন", "Select at least one month"));
    if (method !== "cash" && t.length < 6) return setMsg(tr("ট্রানজ্যাকশন আইডি (TrxID) লিখুন", "Enter the transaction ID (TrxID)"));
    setBusy(true);
    const { error } = await browserClient().from("payment_requests").insert({
      member_id: m.id,
      months: [...sel].sort().map(monthStart),
      amount,
      method,
      trx_id: method === "cash" ? null : t.toUpperCase(),
      note: note.trim() || null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      const dup = error.code === "23505";
      return setMsg(dup ? tr("এই ট্রানজ্যাকশন আইডি আগেই জমা দেওয়া হয়েছে", "This transaction ID was already submitted") : errorMessage(error));
    }
    setSel([]);
    setTrx("");
    setNote("");
    setOpen(false);
    setMsg(tr("অনুরোধ জমা হয়েছে। অ্যাডমিন যাচাই করলে নোটিফিকেশন পাবেন।", "Request submitted. You will be notified once an admin verifies it."));
    await load();
  }

  const statusChip = (s: PaymentRequest["status"]) =>
    s === "approved" ? { t: tr("গৃহীত", "Approved"), c: "bg-brand-soft text-brand-dark" }
    : s === "rejected" ? { t: tr("বাতিল", "Rejected"), c: "bg-blood/10 text-blood" }
    : { t: tr("যাচাই চলছে", "Under review"), c: "bg-accent-soft text-[#8a5a00]" };

  return (
    <div className="space-y-4">
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 text-center font-medium">{msg}</p>}

      {free.length > 0 && !open && (
        <button onClick={() => setOpen(true)} className="btn btn-accent w-full py-3 text-lg">{tr("অনলাইনে চাঁদা জমা দিন", "Pay dues online")}</button>
      )}
      {free.length === 0 && pending.size > 0 && (
        <p className="rounded-2xl bg-accent-soft p-3 text-center text-sm">{tr("আপনার জমা দেওয়া চাঁদা যাচাইয়ের অপেক্ষায় আছে।", "Your submitted payment is awaiting verification.")}</p>
      )}

      {open && (
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-paper p-4">
          <div>
            <p className="label">{tr("১. কোন কোন মাসের চাঁদা?", "1. Which months?")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {free.map((k) => (
                <button type="button" key={k} onClick={() => toggle(k)} className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${sel.includes(k) ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                  {fmtMonth(monthStart(k))}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">{tr("২. পরিশোধের মাধ্যম", "2. Payment method")}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(["bkash", "nagad", "rocket", "cash"] as Method[]).map((x) => (
                <button type="button" key={x} onClick={() => setMethod(x)} className={`rounded-xl border px-1 py-2 text-sm font-semibold ${method === x ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                  {x === "cash" ? tr("হাতে", "Cash") : methodLabel(x, tr)}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-line">
            <p className="text-sm text-muted">{tr("মোট জমা দিতে হবে", "Total to pay")}</p>
            <p className="text-3xl font-extrabold text-brand">{taka(amount)}</p>
            {method !== "cash" && (
              number ? (
                <p className="mt-2 text-sm">{tr("এই নম্বরে Send Money করুন", "Send money to")}: <b className="select-all text-lg">{bn(number)}</b></p>
              ) : (
                <p className="mt-2 text-sm text-muted">{tr("সংগঠনের নম্বর জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।", "Contact an admin for the organisation's number.")}</p>
              )
            )}
          </div>
          {method !== "cash" ? (
            <div>
              <label className="label" htmlFor="trx">{tr("৩. ট্রানজ্যাকশন আইডি (TrxID)", "3. Transaction ID (TrxID)")}</label>
              <input id="trx" value={trx} onChange={(e) => setTrx(e.target.value)} placeholder="8N7A6D5E4F" autoCapitalize="characters" className="input uppercase" />
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-3 text-sm ring-1 ring-line">{tr("টাকা সংগঠনের দায়িত্বশীলের হাতে দিয়ে এই অনুরোধ জমা দিন; তিনি যাচাই করে নেবেন।", "Hand the money to an organiser and submit this request; they will verify it.")}</p>
          )}
          <div>
            <label className="label" htmlFor="pnote">{tr("মন্তব্য (ঐচ্ছিক)", "Note (optional)")}</label>
            <input id="pnote" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
          </div>
          <div className="flex gap-2">
            <button disabled={busy} className="btn btn-primary flex-1 py-3 text-lg">{busy ? tr("জমা হচ্ছে…", "Submitting…") : tr("জমা দিন", "Submit")}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">{tr("বাতিল", "Cancel")}</button>
          </div>
        </form>
      )}

      {reqs.length > 0 && (
        <div>
          <p className="label">{tr("আমার জমা দেওয়া অনুরোধ", "My submitted requests")}</p>
          <ul className="space-y-2">
            {reqs.map((r) => {
              const c = statusChip(r.status);
              return (
                <li key={r.id} className="rounded-2xl bg-paper p-3">
                  <div className="flex items-center justify-between gap-2">
                    <b>{taka(r.amount)}</b>
                    <span className={`badge ${c.c}`}>{c.t}</span>
                  </div>
                  <p className="text-sm text-muted">{r.months.map((x) => fmtMonth(x)).join(", ")} • {methodLabel(r.method, tr)} • {fmtDate(r.created_at)}</p>
                  {r.status === "rejected" && r.admin_note && <p className="mt-1 text-sm text-blood">{r.admin_note}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <p className="label">{tr("পরিশোধের ইতিহাস ও রসিদ", "Payment history & receipts")}</p>
          <ul className="space-y-2">
            {payments.slice(0, 24).map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{fmtMonth(p.month)} • {taka(p.amount)}</p>
                  <p className="text-xs text-muted">{fmtDate(p.paid_on)} • {methodLabel(p.method, tr)}</p>
                </div>
                <button onClick={() => setReceipt({ id: p.id, months: [p.month], amount: p.amount, method: p.method, trx_id: p.note?.startsWith("TrxID: ") ? p.note.slice(7) : null, paid_on: p.paid_on })} className="btn btn-ghost btn-sm">{tr("রসিদ", "Receipt")}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {receipt && <PaymentReceipt m={m} r={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
