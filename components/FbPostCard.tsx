"use client";

import { useEffect, useState } from "react";
import EventImage from "./EventImage";
import { FacebookIcon, NavIcon } from "./Icons";
import type { FbPost } from "@/lib/types";

/** ফেসবুকের নির্দিষ্ট পোস্টের লিংক কি না (পেজের হোম লিংক হলে এমবেড হবে না) */
function isPostUrl(url: string) {
  return /(\/posts\/|\/photos\/|\/videos\/|\/reel\/|story\.php|permalink\.php|\/share\/[pvr]\/|fbid=)/.test(url);
}

export default function FbPostCard({ post }: { post: FbPost }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const embed = isPostUrl(post.url)
    ? `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(post.url)}&show_text=true&width=500`
    : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-3xl border border-line bg-white text-left shadow-[0_4px_16px_rgba(40,80,120,0.08)] transition active:scale-[0.99] md:hover:-translate-y-0.5"
      >
        <div className="relative">
          <EventImage src={post.image_url} category="other" alt={post.title ?? "ফেসবুক পোস্ট"} />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 p-1 shadow"><FacebookIcon size={22} /></span>
        </div>
        <div className="p-4">
          {post.title && <h3 className="mt-0.5 text-lg leading-snug">{post.title}</h3>}
          {post.preview && <p className="mt-1.5 line-clamp-3 text-muted">{post.preview}</p>}
          <p className="mt-3 text-sm font-semibold text-brand">পুরো পোস্ট দেখুন →</p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="flex items-center gap-2 font-semibold"><FacebookIcon size={24} /> ফেসবুক পোস্ট</span>
              <button onClick={() => setOpen(false)} aria-label="বন্ধ করুন" className="rounded-xl p-2 hover:bg-sky-soft"><NavIcon name="close" /></button>
            </div>
            <div className="overflow-y-auto p-4">
              {post.title && <h2 className="text-xl">{post.title}</h2>}
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image_url} alt="" className="mb-3 w-full rounded-2xl" />
              )}
              {post.preview && <p className="mb-4 whitespace-pre-line">{post.preview}</p>}
              {embed && (
                <iframe
                  src={embed}
                  title="ফেসবুক পোস্ট"
                  width="500"
                  height="560"
                  className="mx-auto block max-w-full rounded-2xl border-0"
                  loading="lazy"
                  allow="encrypted-media"
                />
              )}
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4 w-full">
                ফেসবুকে খুলুন
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
