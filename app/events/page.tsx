import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import SetupNotice from "@/components/SetupNotice";
import { isConfigured, serverClient } from "@/lib/supabase";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "কার্যক্রম ও নোটিশ" };

export default async function EventsPage() {
  if (!isConfigured) return <SetupNotice />;
  const { data } = await serverClient()
    .from("events")
    .select("*")
    .eq("published", true)
    .order("event_date", { ascending: false });
  const events = (data as EventRow[] | null) ?? [];

  return (
    <div>
      <h1 className="mb-1 text-3xl">কার্যক্রম ও নোটিশ</h1>
      <p className="mb-6 text-muted">আমাদের সব কাজ ও গুরুত্বপূর্ণ ঘোষণা এক জায়গায়।</p>
      {events.length === 0 ? (
        <p className="text-muted">এখনো কোনো পোস্ট নেই।</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}
