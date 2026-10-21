import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventImage from "@/components/EventImage";
import ShareButtons from "@/components/ShareButtons";
import SetupNotice from "@/components/SetupNotice";
import { isConfigured, serverClient } from "@/lib/supabase";
import { siteOrigin } from "@/lib/origin";
import { fmtDate } from "@/lib/bn";
import { categoryLabel } from "@/lib/categories";
import type { EventRow } from "@/lib/types";

export const revalidate = 30;

type Props = { params: Promise<{ id: string }> };

async function getEvent(id: string): Promise<EventRow | null> {
  if (!isConfigured) return null;
  const { data } = await serverClient().from("events").select("*").eq("id", id).eq("published", true).maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) return { title: "পোস্ট পাওয়া যায়নি" };
  const description = (e.description ?? "").slice(0, 160);
  return {
    title: e.title,
    description,
    openGraph: { title: e.title, description, images: e.image_url ? [e.image_url] : undefined },
  };
}

export default async function EventPage({ params }: Props) {
  if (!isConfigured) return <SetupNotice />;
  const { id } = await params;
  const e = await getEvent(id);
  if (!e) notFound();
  const url = `${await siteOrigin()}/events/${e.id}`;
  const isNotice = e.kind === "notice";

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/events" className="text-sm font-semibold text-brand hover:underline">← সব কার্যক্রম</Link>
      <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_4px_16px_rgba(40,80,120,0.08)]">
        <EventImage src={e.image_url} category={e.category} alt={e.title} />
        <div className="p-5">
          <div className="flex items-center gap-2">
            <span className={`badge ${isNotice ? "bg-accent text-ink" : "bg-brand-soft text-brand-dark"}`}>
              {isNotice ? "নোটিশ" : categoryLabel(e.category)}
            </span>
            <span className="text-sm text-muted">{fmtDate(e.event_date)}</span>
          </div>
          <h1 className="mt-2 text-3xl">{e.title}</h1>
          {e.location && <p className="mt-1 text-muted">স্থান: {e.location}</p>}
          {e.description && <p className="mt-4 whitespace-pre-line text-lg">{e.description}</p>}
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-sm font-semibold text-muted">অন্যদের জানান</p>
            <ShareButtons url={url} text={e.title} />
          </div>
        </div>
      </div>
    </article>
  );
}
