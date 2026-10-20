import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButtons from "@/components/ShareButtons";
import SetupNotice from "@/components/SetupNotice";
import { isConfigured, serverClient } from "@/lib/supabase";
import { siteOrigin } from "@/lib/origin";
import { fmtDate } from "@/lib/bn";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/events" className="text-sm font-semibold text-brand hover:underline">← সব কার্যক্রম</Link>
      <div className="mt-4 flex items-center gap-2">
        <span className={`badge ${e.kind === "notice" ? "bg-accent-soft text-[#8a5a00]" : "bg-brand-soft text-brand-dark"}`}>
          {e.kind === "notice" ? "নোটিশ" : "কার্যক্রম"}
        </span>
        <span className="text-sm text-muted">{fmtDate(e.event_date)}</span>
      </div>
      <h1 className="mt-2 text-3xl">{e.title}</h1>
      {e.location && <p className="mt-1 text-muted">স্থান: {e.location}</p>}
      {e.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.image_url} alt={e.title} className="mt-5 w-full rounded-2xl border border-line object-cover" />
      )}
      {e.description && <p className="mt-5 whitespace-pre-line text-lg">{e.description}</p>}
      <div className="mt-8 border-t border-line pt-5">
        <p className="mb-2 text-sm font-semibold text-muted">অন্যদের জানান</p>
        <ShareButtons url={url} text={e.title} />
      </div>
    </article>
  );
}
