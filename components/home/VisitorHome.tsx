import Link from "next/link";
import BloodRequests from "@/components/BloodRequests";
import EventCard from "@/components/EventCard";
import FbPostCard from "@/components/FbPostCard";
import Logo from "@/components/Logo";
import Slider, { type Slide } from "@/components/Slider";
import { COVER_SRC, ORG_ESTD, ORG_PLACE } from "@/lib/brand";
import { BLOOD_GROUPS, ORG_NAME, ORG_SLOGAN, bn } from "@/lib/bn";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { T } from "@/lib/lang";
import type { EventRow, FbPost, GalleryPhoto, PublicStats } from "@/lib/types";

const EMOJI: Record<string, string> = { blood: "🩸", relief: "🤲", education: "📚", youth: "🌱", health: "💊", other: "✨" };
const TONE: Record<string, string> = {
  blood: "from-[#ffe4e1] to-white", relief: "from-[#fdeec6] to-white", education: "from-[#dcecfa] to-white",
  youth: "from-[#d9f2e6] to-white", health: "from-[#e8e2fa] to-white", other: "from-[#eef2f6] to-white",
};

function Head({ bnT, en, href }: { bnT: string; en: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="flex items-center gap-2 text-2xl before:h-6 before:w-1.5 before:rounded-full before:bg-accent before:content-['']"><T bn={bnT} en={en} /></h2>
      {href && <Link href={href} className="text-sm font-semibold text-brand hover:underline"><T bn="সব দেখুন" en="See all" /> →</Link>}
    </div>
  );
}

export type HomeData = {
  stats: PublicStats | null;
  events: EventRow[];
  posts: FbPost[];
  photos: GalleryPhoto[];
  contact: string;
};

/** জনসাধারণ/অতিথির জন্য হোম: গল্প, জরুরি রক্ত, কার্যক্রম, ছবি ও যোগদান */
export default function VisitorHome({ data }: { data: HomeData }) {
  const { stats: s, events, posts, photos, contact } = data;
  const slides: Slide[] = events.slice(0, 5).map((e) => ({
    key: e.id, href: `/events/${e.id}`, title: e.title,
    sub: e.kind === "notice" ? "নোটিশ" : categoryLabel(e.category), image: e.image_url, category: e.category,
  }));

  return (
    <div>
      {/* ভোরের আলো: গাঢ় নীল থেকে দিগন্তে সোনালি */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1d4f7c] via-[#3a7fb5] to-[#8fc0e6] pb-28 text-white">
        <div className="pointer-events-none absolute -bottom-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-t from-[#ffd27a] to-[#f4a623]/0 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[#ffc24d]/70" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="container-x relative pt-6 md:pt-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-3 w-fit rounded-2xl bg-white/15 p-1.5 shadow-lg backdrop-blur"><Logo size={60} /></div>
            <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"><T bn="স্থাপিত" en="Est." /> {ORG_ESTD} • {ORG_PLACE}</p>
            <h1 className="text-3xl leading-tight drop-shadow sm:text-4xl md:text-5xl"><T bn={ORG_NAME} en="Godnail Alokito Jubo Shakti" /></h1>
            <p className="mx-auto mt-3 max-w-xl text-white/90 md:text-lg"><T bn={ORG_SLOGAN} en="A volunteer, non-political youth organisation devoted to serving humanity" /></p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/blood" className="btn bg-white py-3.5 text-base font-bold text-blood shadow-xl sm:text-lg">🩸 <T bn="রক্ত দরকার" en="Need blood" /></Link>
              <Link href="/join" className="btn btn-accent py-3.5 text-base font-bold sm:text-lg">🤝 <T bn="সদস্য হোন" en="Join us" /></Link>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-[#f3f7fb]" aria-hidden>
          <path fill="currentColor" d="M0 60V28C240 -4 480 -4 720 22s480 30 720 -2V60z" />
        </svg>
      </section>

      <div className="container-x relative -mt-20 space-y-10 pb-10">
        {/* রক্তের গ্রুপ খোঁজা */}
        <section className="rounded-3xl bg-white p-5 shadow-[0_14px_36px_rgba(20,60,100,0.2)] ring-1 ring-line">
          <p className="text-lg font-bold"><T bn="কোন গ্রুপের রক্ত দরকার?" en="Which blood group do you need?" /></p>
          <p className="mb-3 text-sm text-muted"><T bn="গ্রুপে চাপ দিন, প্রস্তুত দাতাদের তালিকা দেখুন ও সরাসরি কল করুন।" en="Tap a group to see ready donors and call them directly." /></p>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((g) => (
              <Link key={g} href={`/blood?group=${encodeURIComponent(g)}`} className="grid h-14 place-items-center rounded-2xl bg-gradient-to-b from-[#ffeceb] to-[#ffdad6] text-lg font-extrabold text-blood ring-1 ring-blood/15 transition active:scale-95">{g}</Link>
            ))}
          </div>
        </section>

        <BloodRequests />

        {/* প্রভাব */}
        {s && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d4f7c] to-[#3a7fb5] p-5 text-white shadow-[0_14px_32px_rgba(29,79,124,0.35)]">
            <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <p className="relative mb-4 text-sm font-semibold text-white/85"><T bn="আমাদের পথচলা এক নজরে" en="Our journey at a glance" /></p>
            <div className="relative grid grid-cols-2 gap-y-5 sm:grid-cols-4">
              {[
                { v: bn(s.members), l: <T key="a" bn="সক্রিয় সদস্য" en="Active members" /> },
                { v: bn(s.donors), l: <T key="b" bn="রক্তদাতা" en="Blood donors" /> },
                { v: bn(s.events), l: <T key="c" bn="কার্যক্রম" en="Activities" /> },
                { v: `${bn(Number(s.expense).toLocaleString("en-IN"))}৳`, l: <T key="d" bn="সেবায় ব্যয়" en="Spent on service" /> },
              ].map((x, i) => (
                <div key={i} className="text-center"><p className="text-3xl font-extrabold">{x.v}</p><p className="text-sm text-white/80">{x.l}</p></div>
              ))}
            </div>
          </section>
        )}

        {/* আমরা কী করি */}
        <section>
          <Head bnT="আমরা যা করি" en="What we do" />
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {CATEGORIES.filter((c) => c.key !== "other").map((c) => (
              <Link key={c.key} href="/events" className={`flex w-36 shrink-0 snap-start flex-col items-start gap-3 rounded-3xl bg-gradient-to-br ${TONE[c.key]} p-4 shadow-[0_6px_18px_rgba(40,80,120,0.08)] ring-1 ring-line transition active:scale-95`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{EMOJI[c.key]}</span>
                <span className="font-bold leading-tight">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {slides.length > 0 && (
          <section className="-mx-4">
            <h2 className="mb-3 flex items-center gap-2 px-4 text-2xl before:h-6 before:w-1.5 before:rounded-full before:bg-accent before:content-['']"><T bn="সাম্প্রতিক কার্যক্রম" en="Recent activities" /></h2>
            <Slider slides={slides} />
          </section>
        )}

        {events.length > 0 && (
          <section>
            <Head bnT="আমাদের কার্যক্রম" en="Our activities" href="/events" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {events.slice(0, 3).map((e) => <EventCard key={e.id} e={e} />)}
            </div>
          </section>
        )}

        {/* ছবির মোজাইক */}
        {photos.length >= 3 && (
          <section>
            <Head bnT="স্মৃতির ফ্রেমে" en="In pictures" href="/gallery" />
            <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-3xl">
              {photos.slice(0, 6).map((p, i) => (
                <Link key={p.id} href="/gallery" className={`relative block overflow-hidden bg-brand-soft ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt={p.caption ?? p.album} loading="lazy" className={`w-full object-cover aspect-square h-full`} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <Head bnT="ফেসবুক থেকে" en="From Facebook" href="/posts" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{posts.map((p) => <FbPostCard key={p.id} post={p} />)}</div>
          </section>
        )}

        {/* কীভাবে পাশে থাকবেন */}
        <section>
          <Head bnT="আপনিও পাশে থাকুন" en="Stand with us" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { ic: "🤝", t: "সদস্য হোন", e: "Become a member", d: "মাসিক চাঁদা ও স্বচ্ছ হিসাবের মাধ্যমে সংগঠনের অংশ হোন।", ed: "Be part of us with a small monthly fee and open accounts.", h: "/join" },
              { ic: "🩸", t: "রক্তদাতা হিসেবে নাম লেখান", e: "Register as a donor", d: "জরুরি সময়ে আপনার রক্ত একটি প্রাণ বাঁচাতে পারে।", ed: "Your blood can save a life in an emergency.", h: "/join" },
              { ic: "📊", t: "আমাদের হিসাব দেখুন", e: "See our accounts", d: "প্রতিটি টাকার আয়-ব্যয় সবার জন্য উন্মুক্ত।", ed: "Every taka of income and spending is open to all.", h: "/hishab" },
            ].map((x) => (
              <Link key={x.t} href={x.h} className="card flex gap-3 transition active:scale-[0.99] md:hover:-translate-y-0.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl">{x.ic}</span>
                <div><p className="font-bold leading-tight"><T bn={x.t} en={x.e} /></p><p className="mt-1 text-sm text-muted"><T bn={x.d} en={x.ed} /></p></div>
              </Link>
            ))}
          </div>
        </section>

        {/* যোগাযোগ */}
        <section className="grid gap-3 sm:grid-cols-2">
          {contact && (
            <a href={`tel:${contact}`} className="card flex items-center gap-3 border-brand/30 bg-sky-soft">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl">📞</span>
              <div><p className="text-sm text-muted"><T bn="সংগঠনের হেল্পলাইন" en="Organisation helpline" /></p><p className="text-xl font-bold text-brand">{bn(contact)}</p></div>
            </a>
          )}
          <Link href="/login" className="card flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-2xl">🔑</span>
            <div><p className="font-bold"><T bn="আপনি কি সদস্য?" en="Already a member?" /></p><p className="text-sm text-muted"><T bn="লগইন করে নিজের ড্যাশবোর্ড দেখুন" en="Login to see your dashboard" /></p></div>
          </Link>
        </section>

        {COVER_SRC && (
          <section className="overflow-hidden rounded-3xl ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={COVER_SRC} alt={`${ORG_NAME}`} className="aspect-[1080/578] w-full object-cover" />
          </section>
        )}
      </div>
    </div>
  );
}
