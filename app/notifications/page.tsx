"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";
import { bn, fmtDate } from "@/lib/bn";
import { useLang } from "@/lib/lang";
import { browserClient } from "@/lib/supabase";

type N = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

export default function NotificationsPage() {
  const { user, ready } = useAuth();
  const { tr } = useLang();
  const [items, setItems] = useState<N[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await browserClient().from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    setItems((data as N[]) ?? []);
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function open(n: N) {
    if (!n.read) await browserClient().from("notifications").update({ read: true }).eq("id", n.id);
  }

  async function markAll() {
    await browserClient().from("notifications").update({ read: true }).eq("read", false);
    await load();
  }

  if (!ready) return <ListSkeleton />;
  if (!user)
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="text-muted">{tr("নোটিফিকেশন দেখতে লগইন করুন।", "Login to see your notifications.")}</p>
        <Link href="/login" className="btn btn-primary mt-4">{tr("লগইন করুন", "Login")}</Link>
      </div>
    );
  if (!items) return <ListSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl">{tr("নোটিফিকেশন", "Notifications")}</h1>
        {items.some((n) => !n.read) && <button onClick={markAll} className="text-sm font-semibold text-brand hover:underline">{tr("সব পড়া হয়েছে", "Mark all read")}</button>}
      </div>
      {items.length === 0 ? (
        <div className="card text-center text-muted">{tr("এখনো কোনো নোটিফিকেশন নেই।", "No notifications yet.")}</div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const body = (
              <div className={`flex gap-3 rounded-3xl border p-4 shadow-[0_4px_16px_rgba(40,80,120,0.06)] ${n.read ? "border-line bg-white" : "border-brand/40 bg-brand-soft"}`}>
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-line" : "bg-brand"}`} />
                <div className="min-w-0">
                  <p className="font-bold">{n.title}</p>
                  {n.body && <p className="text-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{fmtDate(n.created_at)} {bn(new Date(n.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))}</p>
                </div>
              </div>
            );
            return n.link ? <Link key={n.id} href={n.link} onClick={() => open(n)} className="block">{body}</Link> : <button key={n.id} onClick={() => open(n)} className="block w-full text-left">{body}</button>;
          })}
        </div>
      )}
    </div>
  );
}
