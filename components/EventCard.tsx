import Link from "next/link";
import EventImage from "./EventImage";
import type { EventRow } from "@/lib/types";
import { fmtDate } from "@/lib/bn";
import { categoryLabel } from "@/lib/categories";

export default function EventCard({ e }: { e: EventRow }) {
  const isNotice = e.kind === "notice";
  return (
    <Link
      href={`/events/${e.id}`}
      className="group block overflow-hidden rounded-3xl border border-line bg-white shadow-[0_4px_16px_rgba(40,80,120,0.08)] transition active:scale-[0.99] md:hover:-translate-y-0.5"
    >
      <div className="relative">
        <EventImage src={e.image_url} category={e.category} alt={e.title} />
        <span className={`badge absolute left-3 top-3 shadow ${isNotice ? "bg-accent text-ink" : "bg-white/95 text-brand-dark"}`}>
          {isNotice ? "নোটিশ" : categoryLabel(e.category)}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted">{fmtDate(e.event_date)}{e.location ? ` • ${e.location}` : ""}</p>
        <h3 className="mt-0.5 text-lg leading-snug text-ink">{e.title}</h3>
        {e.description && <p className="mt-1.5 line-clamp-2 text-muted">{e.description}</p>}
      </div>
    </Link>
  );
}
