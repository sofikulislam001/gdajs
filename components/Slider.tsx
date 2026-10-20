"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import CategoryArt from "./CategoryArt";
import EventImage from "./EventImage";
import { COVER_SRC } from "@/lib/brand";

export type Slide = {
  key: string;
  href?: string;
  title: string;
  sub?: string;
  image?: string | null;
  category?: string;
  cover?: boolean;
};

export default function Slider({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      if (paused.current) return;
      i = (i + 1) % slides.length;
      const child = el.children[i] as HTMLElement | undefined;
      if (child) el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: "smooth" });
    }, 4500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <div
      ref={ref}
      onPointerDown={() => (paused.current = true)}
      onPointerUp={() => window.setTimeout(() => (paused.current = false), 6000)}
      className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:justify-center"
    >
      {slides.map((s) => {
        const inner = (
          <>
            {s.cover ? (
              <div className="absolute inset-0">
                <CategoryArt kind="cover" />
                {COVER_SRC && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={COVER_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
              </div>
            ) : (
              <EventImage src={s.image} category={s.category} alt={s.title} className="absolute inset-0 !aspect-auto h-full" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-3 pt-10 text-left text-white">
              <p className="line-clamp-2 text-lg font-bold leading-snug drop-shadow">{s.title}</p>
              {s.sub && <p className="text-sm text-white/85">{s.sub}</p>}
            </div>
          </>
        );
        const cls =
          "relative aspect-[16/9] w-[88%] shrink-0 snap-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-[0_6px_20px_rgba(20,60,100,0.25)] sm:w-[480px]";
        return s.href ? (
          <Link key={s.key} href={s.href} className={cls}>{inner}</Link>
        ) : (
          <div key={s.key} className={cls}>{inner}</div>
        );
      })}
    </div>
  );
}
