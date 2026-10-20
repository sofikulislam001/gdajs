import type { Metadata } from "next";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import SetupNotice from "@/components/SetupNotice";
import { isConfigured, serverClient } from "@/lib/supabase";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "কার্যক্রম ও নোটিশ" };

type Props = { searchParams: Promise<{ kind?: string }> };

export default async function EventsPage({ searchParams }: Props) {
  if (!isConfigured) return <SetupNotice />;
  const { kind } = await searchParams;
  const active = kind === "notice" ? "notice" : kind === "event" ? "event" : "all";

  let q = serverClient().from("events").select("*").eq("published", true).order("event_date", { ascending: false });
  if (active !== "all") q = q.eq("kind", active);
  const { data } = await q;
  const events = (data as EventRow[] | null) ?? [];

  const tabs = [
    { key: "all", label: "সব", href: "/events" },
    { key: "event", label: "কার্যক্রম", href: "/events?kind=event" },
    { key: "notice", label: "নোটিশ", href: "/events?kind=notice" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-3xl">কার্যক্রম ও নোটিশ</h1>
      <p className="mb-5 text-muted">আমাদের সব কাজ ও গুরুত্বপূর্ণ ঘোষণা এক জায়গায়।</p>
      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} className={`btn btn-sm ${active === t.key ? "btn-primary" : "btn-ghost"}`}>{t.label}</Link>
        ))}
      </div>
      {events.length === 0 ? (
        <p className="text-muted">এখনো কোনো পোস্ট নেই।</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {events.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}
