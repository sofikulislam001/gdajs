import SetupNotice from "@/components/SetupNotice";
import HomeSwitch from "@/components/home/HomeSwitch";
import MemberHome from "@/components/home/MemberHome";
import VisitorHome from "@/components/home/VisitorHome";
import { getSettings } from "@/lib/settings";
import { isConfigured, serverClient } from "@/lib/supabase";
import type { EventRow, FbPost, GalleryPhoto, PublicStats } from "@/lib/types";

export const revalidate = 30;

async function load() {
  if (!isConfigured) return null;
  const sb = serverClient();
  const [stats, events, posts, photos, settings] = await Promise.all([
    sb.rpc("get_public_stats"),
    sb.from("events").select("*").eq("published", true).order("event_date", { ascending: false }).limit(12),
    sb.from("fb_posts").select("*").eq("published", true).order("posted_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(3),
    sb.from("gallery_photos").select("*").eq("published", true).order("created_at", { ascending: false }).limit(6),
    getSettings(),
  ]);
  return {
    stats: (stats.data as PublicStats | null) ?? null,
    events: (events.data as EventRow[] | null) ?? [],
    posts: (posts.data as FbPost[] | null) ?? [],
    photos: (photos.data as GalleryPhoto[] | null) ?? [],
    contact: settings.contact_phone,
  };
}

export default async function Home() {
  const data = await load();
  const d = data ?? { stats: null, events: [], posts: [], photos: [], contact: "" };
  return (
    <>
      {!isConfigured && <div className="container-x pt-6"><SetupNotice /></div>}
      <HomeSwitch visitor={<VisitorHome data={d} />} member={<MemberHome events={d.events} stats={d.stats} />} />
    </>
  );
}
