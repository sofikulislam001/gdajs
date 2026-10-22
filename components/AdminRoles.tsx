"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/bn";
import { browserClient } from "@/lib/supabase";

type A = { user_id: string; email: string; role: "super" | "treasurer" | "editor" };
const LABEL = { super: "প্রধান অ্যাডমিন (সব)", treasurer: "কোষাধ্যক্ষ (শুধু হিসাব)", editor: "সম্পাদক (শুধু কনটেন্ট)" } as const;

export default function AdminRoles() {
  const [rows, setRows] = useState<A[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<A["role"]>("treasurer");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await browserClient().rpc("admin_list_admins");
    if (error) setMsg(errorMessage(error));
    setRows((data as A[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(ev: React.FormEvent) {
    ev.preventDefault();
    const { error } = await browserClient().rpc("admin_set_admin", { p_email: email, p_role: role });
    setMsg(error ? errorMessage(error) : "অ্যাডমিন যুক্ত/হালনাগাদ হয়েছে ✅");
    if (!error) setEmail("");
    await load();
  }

  async function change(u: string, e: string, r: A["role"]) {
    const { error } = await browserClient().rpc("admin_set_admin", { p_email: e, p_role: r });
    if (error) setMsg(errorMessage(error));
    void u;
    await load();
  }

  async function remove(u: string) {
    if (!window.confirm("এই অ্যাডমিনকে সরাবেন?")) return;
    const { error } = await browserClient().rpc("admin_remove_admin", { p_user: u });
    if (error) setMsg(errorMessage(error));
    await load();
  }

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="text-lg font-bold">অ্যাডমিন ও ভূমিকা</h2>
        <p className="text-sm text-muted">কোষাধ্যক্ষ শুধু চাঁদা ও খরচ দেখেন, সম্পাদক শুধু কার্যক্রম/গ্যালারি/নোটিশ। যাকে যুক্ত করবেন তার আগে সাইটে অ্যাকাউন্ট থাকতে হবে।</p>
      </div>
      {msg && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm">{msg}</p>}
      <div className="divide-y divide-line rounded-2xl border border-line">
        {(rows ?? []).map((a) => (
          <div key={a.user_id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{a.email}</p>
            <select value={a.role} onChange={(e) => change(a.user_id, a.email, e.target.value as A["role"])} className="input w-auto py-1.5 text-sm">
              {(Object.keys(LABEL) as A["role"][]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
            </select>
            <button type="button" onClick={() => remove(a.user_id)} className="btn btn-danger btn-sm">সরান</button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ইমেইল" className="input min-w-0 flex-1" />
        <select value={role} onChange={(e) => setRole(e.target.value as A["role"])} className="input w-auto">
          {(Object.keys(LABEL) as A["role"][]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
        </select>
        <button className="btn btn-primary">যুক্ত করুন</button>
      </form>
    </div>
  );
}
