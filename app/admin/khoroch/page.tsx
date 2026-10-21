"use client";

import { ListSkeleton } from "@/components/Skeleton";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { en, errorMessage, fmtDate, taka } from "@/lib/bn";
import type { Donation, Expense } from "@/lib/types";

export default function KhorochAdmin() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const sb = browserClient();
    const [e, d] = await Promise.all([
      sb.from("expenses").select("*").order("spent_on", { ascending: false }).limit(100),
      sb.from("donations").select("*").order("received_on", { ascending: false }).limit(100),
    ]);
    if (e.error || d.error) setMsg(errorMessage(e.error ?? d.error));
    setExpenses((e.data as Expense[]) ?? []);
    setDonations((d.data as Donation[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addExpense(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const amount = Number(en(String(f.get("amount") ?? "")));
    if (!(amount > 0)) return setMsg("পরিমাণ সঠিক নয়");
    const { error } = await browserClient().from("expenses").insert({
      title: String(f.get("title") ?? "").trim(),
      amount,
      spent_on: String(f.get("date") ?? "") || undefined,
      category: String(f.get("category") ?? "").trim() || null,
    });
    if (error) return setMsg(errorMessage(error));
    form.reset();
    setMsg("");
    await load();
  }

  async function addDonation(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const amount = Number(en(String(f.get("amount") ?? "")));
    if (!(amount > 0)) return setMsg("পরিমাণ সঠিক নয়");
    const { error } = await browserClient().from("donations").insert({
      donor_name: String(f.get("donor") ?? "").trim(),
      amount,
      received_on: String(f.get("date") ?? "") || undefined,
      purpose: String(f.get("purpose") ?? "").trim() || null,
    });
    if (error) return setMsg(errorMessage(error));
    form.reset();
    setMsg("");
    await load();
  }

  async function del(table: "expenses" | "donations", id: string) {
    if (!window.confirm("এই এন্ট্রি মুছবেন?")) return;
    const { error } = await browserClient().from(table).delete().eq("id", id);
    if (error) return setMsg(errorMessage(error));
    await load();
  }

  if (!expenses) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl">খরচ ও অনুদান</h1>
        <p className="text-muted">এখানে যা যোগ করবেন তা &ldquo;স্বচ্ছ হিসাব&rdquo; পাতায় সবাই দেখতে পাবে।</p>
      </div>
      {msg && <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm">{msg}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <form onSubmit={addExpense} className="card space-y-3">
            <h2 className="text-lg">খরচ যোগ করুন <span className="text-sm font-normal text-muted">(সবার জন্য প্রকাশিত হবে)</span></h2>
            <input name="title" required placeholder="কী কাজে খরচ (যেমন: রক্তদান ক্যাম্পের প্রচার)" className="input" />
            <div className="grid grid-cols-2 gap-3">
              <input name="amount" required inputMode="numeric" placeholder="টাকা" className="input" />
              <input name="date" type="date" className="input" />
            </div>
            <input name="category" placeholder="ধরন (ঐচ্ছিক)" className="input" />
            <button className="btn btn-primary">খরচ সংরক্ষণ</button>
          </form>
          <div className="card divide-y divide-line p-0">
            {expenses.length === 0 && <p className="p-4 text-muted">কোনো খরচ নেই</p>}
            {expenses.map((x) => (
              <div key={x.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{x.title}</p><p className="text-xs text-muted">{fmtDate(x.spent_on)}</p></div>
                <p className="font-semibold text-blood">{taka(x.amount)}</p>
                <button onClick={() => del("expenses", x.id)} className="btn btn-danger btn-sm">মুছুন</button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <form onSubmit={addDonation} className="card space-y-3">
            <h2 className="text-lg">অনুদান যোগ করুন <span className="text-sm font-normal text-muted">(সদস্য নন এমন কারও কাছ থেকে)</span></h2>
            <input name="donor" required placeholder="দাতার নাম" className="input" />
            <div className="grid grid-cols-2 gap-3">
              <input name="amount" required inputMode="numeric" placeholder="টাকা" className="input" />
              <input name="date" type="date" className="input" />
            </div>
            <input name="purpose" placeholder="কোন উদ্দেশ্যে (ঐচ্ছিক)" className="input" />
            <button className="btn btn-primary">অনুদান সংরক্ষণ</button>
          </form>
          <div className="card divide-y divide-line p-0">
            {donations.length === 0 && <p className="p-4 text-muted">কোনো অনুদান নেই</p>}
            {donations.map((x) => (
              <div key={x.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{x.donor_name}</p><p className="text-xs text-muted">{fmtDate(x.received_on)}{x.purpose ? ` • ${x.purpose}` : ""}</p></div>
                <p className="font-semibold text-brand">{taka(x.amount)}</p>
                <button onClick={() => del("donations", x.id)} className="btn btn-danger btn-sm">মুছুন</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
