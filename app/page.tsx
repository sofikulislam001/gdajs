import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import EventCard from "@/components/EventCard";
import { isConfigured, serverClient } from "@/lib/supabase";
import { ORG_NAME, ORG_SLOGAN, bn } from "@/lib/bn";
import type { EventRow, PublicStats } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load() {
  if (!isConfigured) return null;
  const sb = serverClient();
  const [stats, events] = await Promise.all([
    sb.rpc("get_public_stats"),
    sb.from("events").select("*").eq("published", true).order("event_date", { ascending: false }).limit(4),
  ]);
  return { stats: (stats.data as PublicStats | null) ?? null, events: (events.data as EventRow[] | null) ?? [] };
}

const pillars = [
  { title: "রক্তদান ও জরুরি সহায়তা", text: "যেকোনো সময় রক্তের প্রয়োজনে এলাকার রক্তদাতাদের সাথে দ্রুত যোগাযোগের ব্যবস্থা।" },
  { title: "অসহায় মানুষের পাশে", text: "দুস্থ ও আর্ত মানুষের জন্য সহায়তা, যার প্রতিটি টাকার হিসাব সবার জন্য খোলা।" },
  { title: "আলোকিত যুব সমাজ", text: "অরাজনৈতিক, স্বেচ্ছাসেবী তরুণদের এক প্ল্যাটফর্মে এনে ভালো কাজের অভ্যাস গড়ে তোলা।" },
];

export default async function Home() {
  const data = await load();
  const s = data?.stats;

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-brand px-6 py-12 text-white sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-accent/25 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-accent/15 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-sm">স্বেচ্ছাসেবী • অরাজনৈতিক • মানবিক</p>
          <h1 className="text-3xl sm:text-5xl">{ORG_NAME}</h1>
          <p className="mt-4 text-lg text-white/85">{ORG_SLOGAN}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/join" className="btn btn-accent">সদস্য হতে আবেদন করুন</Link>
            <Link href="/blood" className="btn border border-white/30 text-white hover:bg-white/10">রক্তদাতা খুঁজুন</Link>
          </div>
        </div>
      </section>

      {!isConfigured && <SetupNotice />}

      {s && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "সক্রিয় সদস্য", value: bn(s.members) },
            { label: "রক্তদাতা", value: bn(s.donors) },
            { label: "কার্যক্রম", value: bn(s.events) },
            { label: "সেবায় ব্যয় (৳)", value: bn(Number(s.expense).toLocaleString("en-IN")) },
          ].map((x) => (
            <div key={x.label} className="card text-center">
              <p className="font-display text-3xl font-bold text-brand">{x.value}</p>
              <p className="text-sm text-muted">{x.label}</p>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-5 text-2xl">আমরা কী করি</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="card border-t-4 border-t-accent">
              <h3 className="text-lg text-brand-dark">{p.title}</h3>
              <p className="mt-2 text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {data && (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl">সাম্প্রতিক কার্যক্রম ও নোটিশ</h2>
            <Link href="/events" className="text-sm font-semibold text-brand hover:underline">সব দেখুন →</Link>
          </div>
          {data.events.length === 0 ? (
            <p className="text-muted">এখনো কোনো পোস্ট নেই।</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.events.map((e) => <EventCard key={e.id} e={e} />)}
            </div>
          )}
        </section>
      )}

      <section className="card flex flex-col items-start gap-3 bg-accent-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl">আপনিও আমাদের একজন হোন</h2>
          <p className="text-muted">নিয়মিত মাসিক চাঁদা ও স্বচ্ছ হিসাবের মাধ্যমে আমরা একসাথে মানুষের পাশে দাঁড়াই।</p>
        </div>
        <Link href="/join" className="btn btn-primary shrink-0">আবেদন করুন</Link>
      </section>
    </div>
  );
}
