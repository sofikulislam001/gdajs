import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import EventCard from "@/components/EventCard";
import FbPostCard from "@/components/FbPostCard";
import MenuCard from "@/components/MenuCard";
import Slider, { type Slide } from "@/components/Slider";
import {
  BloodIcon, EventIcon, HelplineIcon, NoticeIcon, PeopleIcon, PostIcon, ReceiptIcon, WalletIcon,
} from "@/components/Icons";
import { isConfigured, serverClient } from "@/lib/supabase";
import { ORG_NAME, ORG_SLOGAN, bn } from "@/lib/bn";
import { categoryLabel } from "@/lib/categories";
import type { EventRow, FbPost, PublicStats } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load() {
  if (!isConfigured) return null;
  const sb = serverClient();
  const [stats, events, posts] = await Promise.all([
    sb.rpc("get_public_stats"),
    sb.from("events").select("*").eq("published", true).order("event_date", { ascending: false }).limit(6),
    sb.from("fb_posts").select("*").eq("published", true).order("posted_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(3),
  ]);
  return {
    stats: (stats.data as PublicStats | null) ?? null,
    events: (events.data as EventRow[] | null) ?? [],
    posts: (posts.data as FbPost[] | null) ?? [],
  };
}

export default async function Home() {
  const data = await load();
  const s = data?.stats;
  const today = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date());

  const slides: Slide[] = [
    { key: "cover", cover: true, title: ORG_NAME, sub: ORG_SLOGAN },
    ...(data?.events ?? []).slice(0, 5).map((e) => ({
      key: e.id,
      href: `/events/${e.id}`,
      title: e.title,
      sub: e.kind === "notice" ? "নোটিশ" : categoryLabel(e.category),
      image: e.image_url,
      category: e.category,
    })),
  ];

  return (
    <div>
      <section className="rounded-b-[2.5rem] bg-[#6aa8d8] pb-7 text-white shadow-[0_8px_24px_rgba(40,100,160,0.18)]">
        <p className="pb-3 text-center text-2xl font-bold">{today}</p>
        <Slider slides={slides} />
      </section>

      <div className="container-x space-y-10 py-8">
        {!isConfigured && <SetupNotice />}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <MenuCard href="/blood" label="রক্তদাতা"><BloodIcon size={64} /></MenuCard>
          <MenuCard href="/events" label="কার্যক্রম"><EventIcon size={64} /></MenuCard>
          <MenuCard href="/posts" label="ফেসবুক পোস্ট"><PostIcon size={64} /></MenuCard>
          <MenuCard href="/events?kind=notice" label="নোটিশ"><NoticeIcon size={64} /></MenuCard>
          <MenuCard href="/hishab" label="স্বচ্ছ হিসাব"><WalletIcon size={64} /></MenuCard>
          <MenuCard href="/dues" label="আমার বকেয়া"><ReceiptIcon size={64} /></MenuCard>
          <MenuCard href="/join" label="সদস্য হোন"><PeopleIcon size={64} /></MenuCard>
          <MenuCard href="/helpline" label="হেল্পলাইন"><HelplineIcon size={64} /></MenuCard>
        </section>

        {s && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "সক্রিয় সদস্য", value: bn(s.members) },
              { label: "রক্তদাতা", value: bn(s.donors) },
              { label: "কার্যক্রম", value: bn(s.events) },
              { label: "সেবায় ব্যয় (৳)", value: bn(Number(s.expense).toLocaleString("en-IN")) },
            ].map((x) => (
              <div key={x.label} className="rounded-3xl bg-white p-4 text-center shadow-[0_4px_16px_rgba(40,80,120,0.07)]">
                <p className="text-3xl font-bold text-brand">{x.value}</p>
                <p className="text-sm text-muted">{x.label}</p>
              </div>
            ))}
          </section>
        )}

        {data && data.posts.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-2xl">ফেসবুক থেকে</h2>
              <Link href="/posts" className="text-sm font-semibold text-brand hover:underline">সব দেখুন →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {data.posts.map((p) => <FbPostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {data && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-2xl">আমাদের কার্যক্রম</h2>
              <Link href="/events" className="text-sm font-semibold text-brand hover:underline">সব দেখুন →</Link>
            </div>
            {data.events.length === 0 ? (
              <p className="text-muted">এখনো কোনো পোস্ট নেই।</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {data.events.slice(0, 3).map((e) => <EventCard key={e.id} e={e} />)}
              </div>
            )}
          </section>
        )}

        <section className="flex flex-col items-start gap-3 rounded-3xl bg-gradient-to-r from-sky to-[#6aa8d8] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl">আপনিও আমাদের একজন হোন</h2>
            <p className="text-white/90">নিয়মিত মাসিক চাঁদা ও স্বচ্ছ হিসাবের মাধ্যমে আমরা একসাথে মানুষের পাশে দাঁড়াই।</p>
          </div>
          <Link href="/join" className="btn btn-accent shrink-0">আবেদন করুন</Link>
        </section>
      </div>
    </div>
  );
}
