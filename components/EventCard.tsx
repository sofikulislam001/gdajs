import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { fmtDate } from "@/lib/bn";

export default function EventCard({ e }: { e: EventRow }) {
  return (
    <Link href={`/events/${e.id}`} className="card block transition hover:-translate-y-0.5 hover:border-brand/40">
      <div className="mb-2 flex items-center gap-2">
        <span className={`badge ${e.kind === "notice" ? "bg-accent-soft text-[#8a5a00]" : "bg-brand-soft text-brand-dark"}`}>
          {e.kind === "notice" ? "নোটিশ" : "কার্যক্রম"}
        </span>
        <span className="text-sm text-muted">{fmtDate(e.event_date)}</span>
      </div>
      <h3 className="text-lg text-ink">{e.title}</h3>
      {e.location && <p className="text-sm text-muted">স্থান: {e.location}</p>}
      {e.description && <p className="mt-2 line-clamp-2 text-muted">{e.description}</p>}
    </Link>
  );
}
