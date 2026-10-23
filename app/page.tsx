import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import EventCard from "@/components/EventCard";
import FbPostCard from "@/components/FbPostCard";
import MenuCard from "@/components/MenuCard";
import HomeGreeting from "@/components/HomeGreeting";
import Logo from "@/components/Logo";
import Slider, { type Slide } from "@/components/Slider";
import { COVER_SRC, ORG_ESTD, ORG_PLACE } from "@/lib/brand";
import {
  BloodIcon, EventIcon, HelplineIcon, NoticeIcon, PeopleIcon, PostIcon, ReceiptIcon, WalletIcon,
} from "@/components/Icons";
import { T } from "@/lib/lang";
import { isConfigured, serverClient } from "@/lib/supabase";
import { ORG_NAME, ORG_SLOGAN, bn } from "@/lib/bn";
import { categoryLabel } from "@/lib/categories";
import type { EventRow, FbPost, PublicStats } from "@/lib/types";

export const revalidate = 30;

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

  const slides: Slide[] = (data?.events ?? []).slice(0, 5).map((e) => ({
    key: e.id,
    href: `/events/${e.id}`,
    title: e.title,
    sub: e.kind === "notice" ? "নোটিশ" : categoryLabel(e.category),
    image: e.image_url,
    category: e.category,
  }));

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#5a9fd0] via-[#4a92c8] to-[#3a7fb5] pb-24 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -left-16 top-40 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-accent/20 blur-2xl" />
        <div className="container-x relative grid items-center gap-6 pt-5 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pt-10 md:pb-4">
          <div className="md:order-1">
            <div className="flex items-center gap-3">
              <Logo size={56} />
              <div className="min-w-0">
                <p className="text-sm text-white/85">{today}</p>
                <h1 className="text-2xl leading-tight drop-shadow sm:text-3xl md:text-4xl"><T bn={ORG_NAME} en="Godnail Alokito Jubo Shakti" /></h1>
              </div>
            </div>
            <p className="mt-3 max-w-xl text-white/95 md:text-lg"><T bn={ORG_SLOGAN} en="A volunteer, non-political youth organisation devoted to serving humanity" /></p>
            <div className="mt-5 hidden flex-wrap gap-2 md:flex">
              <Link href="/join" className="btn btn-accent px-6 text-lg"><T bn="সদস্য হোন" en="Become a member" /></Link>
              <Link href="/blood" className="btn bg-white text-blood hover:bg-white/90"><T bn="রক্ত খুঁজুন" en="Find blood" /></Link>
              <Link href="/about" className="btn border border-white/60 text-white hover:bg-white/15"><T bn="আমাদের কথা" en="About us" /></Link>
            </div>
            <p className="mt-4 hidden text-sm text-white/90 md:block"><T bn="স্থাপিত" en="Established" /> {ORG_ESTD} • {ORG_PLACE}</p>
          </div>
          <div className="relative md:order-2">
            <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-white/40 to-accent/40 blur-md" />
            <div className="relative overflow-hidden rounded-3xl border-4 border-white shadow-[0_18px_44px_rgba(10,40,80,0.4)] md:rotate-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={COVER_SRC ?? ""} alt={`${ORG_NAME} — পথচলার ৫ বছর`} className="aspect-[1080/578] w-full object-cover" />
            </div>
            <span className="absolute -bottom-3 right-3 rounded-full bg-accent px-3.5 py-1 text-xs font-bold text-ink shadow-lg"><T bn="স্থাপিত" en="Est." /> {ORG_ESTD}</span>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-[#f3f7fb]" aria-hidden>
          <path fill="currentColor" d="M0 60V28C240 -4 480 -4 720 22s480 30 720 -2V60z" />
        </svg>
      </section>

      <div className="container-x relative -mt-14 space-y-9 pb-10">
        <HomeGreeting />
        {!isConfigured && <SetupNotice />}

        <section className="grid grid-cols-4 gap-x-2 gap-y-5 rounded-3xl bg-white/70 p-4 shadow-[0_4px_20px_rgba(40,80,120,0.06)] ring-1 ring-line backdrop-blur">
          <MenuCard tone="red" href="/blood" label={<T bn="রক্তদাতা" en="Blood" />}><BloodIcon size={64} /></MenuCard>
          <MenuCard tone="blue" href="/events" label={<T bn="কার্যক্রম" en="Activities" />}><EventIcon size={64} /></MenuCard>
          <MenuCard tone="violet" href="/posts" label={<T bn="ফেসবুক পোস্ট" en="Posts" />}><PostIcon size={64} /></MenuCard>
          <MenuCard tone="gold" href="/events?kind=notice" label={<T bn="নোটিশ" en="Notices" />}><NoticeIcon size={64} /></MenuCard>
          <MenuCard tone="green" href="/hishab" label={<T bn="স্বচ্ছ হিসাব" en="Accounts" />}><WalletIcon size={64} /></MenuCard>
          <MenuCard tone="blue" href="/profile" label={<T bn="আমার প্রোফাইল" en="Profile" />}><ReceiptIcon size={64} /></MenuCard>
          <MenuCard tone="gold" href="/join" label={<T bn="সদস্য হোন" en="Join us" />}><PeopleIcon size={64} /></MenuCard>
          <MenuCard tone="red" href="/helpline" label={<T bn="হেল্পলাইন" en="Helpline" />}><HelplineIcon size={64} /></MenuCard>
        </section>

        <Link href="/blood" className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#c92f26] to-[#ef5b4f] p-5 text-white shadow-[0_12px_28px_rgba(214,58,48,0.35)] transition active:scale-[0.99]">
          <span className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl backdrop-blur" aria-hidden>🩸</span>
          <div className="relative min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight"><T bn="জরুরি রক্ত দরকার?" en="Need blood urgently?" /></p>
            <p className="text-sm text-white/90"><T bn="গ্রুপ বেছে সরাসরি দাতাকে কল করুন বা অনুরোধ পাঠান" en="Pick a group and call a donor, or post a request" /></p>
          </div>
          <span className="relative text-2xl transition group-hover:translate-x-1" aria-hidden>→</span>
        </Link>

        {s && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: "👥", tone: "from-[#e3effa] to-white", label: <T bn="সক্রিয় সদস্য" en="Active members" />, value: bn(s.members) },
              { icon: "🩸", tone: "from-[#ffe9e6] to-white", label: <T bn="রক্তদাতা" en="Blood donors" />, value: bn(s.donors) },
              { icon: "📅", tone: "from-[#fdf1d6] to-white", label: <T bn="কার্যক্রম" en="Activities" />, value: bn(s.events) },
              { icon: "💝", tone: "from-[#dcf3e8] to-white", label: <T bn="সেবায় ব্যয় (৳)" en="Spent on service (৳)" />, value: bn(Number(s.expense).toLocaleString("en-IN")) },
            ].map((x, i) => (
              <div key={i} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${x.tone} p-4 shadow-[0_6px_20px_rgba(40,80,120,0.08)] ring-1 ring-line`}>
                <span className="absolute right-3 top-2 text-2xl opacity-80" aria-hidden>{x.icon}</span>
                <p className="mt-4 text-3xl font-bold text-brand-dark">{x.value}</p>
                <p className="text-sm text-muted">{x.label}</p>
              </div>
            ))}
          </section>
        )}

        {data && data.posts.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="flex items-center gap-2 text-2xl before:h-6 before:w-1.5 before:rounded-full before:bg-accent before:content-['']"><T bn="ফেসবুক থেকে" en="From Facebook" /></h2>
              <Link href="/posts" className="text-sm font-semibold text-brand hover:underline"><T bn="সব দেখুন" en="See all" /> →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {data.posts.map((p) => <FbPostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {slides.length > 0 && (
          <section className="-mx-4">
            <h2 className="mb-3 flex items-center gap-2 px-4 text-2xl before:h-6 before:w-1.5 before:rounded-full before:bg-accent before:content-['']"><T bn="সাম্প্রতিক কার্যক্রম" en="Recent activities" /></h2>
            <Slider slides={slides} />
          </section>
        )}

        {data && (
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="flex items-center gap-2 text-2xl before:h-6 before:w-1.5 before:rounded-full before:bg-accent before:content-['']"><T bn="আমাদের কার্যক্রম" en="Our activities" /></h2>
              <Link href="/events" className="text-sm font-semibold text-brand hover:underline"><T bn="সব দেখুন" en="See all" /> →</Link>
            </div>
            {data.events.length === 0 ? (
              <p className="text-muted"><T bn="এখনো কোনো পোস্ট নেই।" en="No posts yet." /></p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {data.events.slice(0, 3).map((e) => <EventCard key={e.id} e={e} />)}
              </div>
            )}
          </section>
        )}

        <section className="relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#3a7fb5] to-[#5a9fd0] p-6 text-white shadow-[0_14px_32px_rgba(44,106,155,0.3)] sm:flex-row sm:items-center sm:justify-between"><span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" /><span className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-accent/25 blur-xl" />
          <div className="relative">
            <h2 className="text-xl"><T bn="আপনিও আমাদের একজন হোন" en="Join us too" /></h2>
            <p className="text-white/90"><T bn="নিয়মিত মাসিক চাঁদা ও স্বচ্ছ হিসাবের মাধ্যমে আমরা একসাথে মানুষের পাশে দাঁড়াই।" en="With regular monthly contributions and transparent accounts, we stand beside people together." /></p>
          </div>
          <Link href="/join" className="btn btn-accent relative shrink-0"><T bn="আবেদন করুন" en="Apply now" /></Link>
        </section>
      </div>
    </div>
  );
}
