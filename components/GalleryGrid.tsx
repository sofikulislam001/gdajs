"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang";
import type { GalleryPhoto } from "@/lib/types";

export default function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const { tr } = useLang();
  const albums = Array.from(new Set(photos.map((p) => p.album)));
  const [album, setAlbum] = useState("");
  const [idx, setIdx] = useState<number | null>(null);
  const list = album ? photos.filter((p) => p.album === album) : photos;
  const cur = idx !== null ? list[idx] : null;

  if (photos.length === 0) return <p className="text-muted">{tr("এখনো কোনো ছবি যোগ হয়নি।", "No photos have been added yet.")}</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setAlbum("")} className={`btn btn-sm ${album === "" ? "btn-primary" : "btn-ghost"}`}>{tr("সব ছবি", "All photos")}</button>
        {albums.map((a) => (
          <button key={a} onClick={() => setAlbum(a)} className={`btn btn-sm ${album === a ? "btn-primary" : "btn-ghost"}`}>{a}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((p, i) => (
          <button key={p.id} onClick={() => setIdx(i)} className="group relative aspect-square overflow-hidden rounded-2xl bg-paper shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.caption ?? p.album} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            {p.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-left text-xs font-medium text-white">{p.caption}</span>}
          </button>
        ))}
      </div>
      {cur && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-3" onClick={() => setIdx(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cur.image_url} alt={cur.caption ?? ""} className="max-h-[82vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <p className="mt-3 text-center text-white">{cur.caption ?? cur.album}</p>
          <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button disabled={idx === 0} onClick={() => setIdx((idx ?? 0) - 1)} className="btn bg-white/15 text-white disabled:opacity-30">←</button>
            <button onClick={() => setIdx(null)} className="btn bg-white text-ink">{tr("বন্ধ", "Close")}</button>
            <button disabled={idx === list.length - 1} onClick={() => setIdx((idx ?? 0) + 1)} className="btn bg-white/15 text-white disabled:opacity-30">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
