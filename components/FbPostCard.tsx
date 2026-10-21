"use client";

import { useEffect, useState } from "react";
import { FacebookIcon, NavIcon } from "./Icons";
import Logo from "./Logo";
import type { FbPost } from "@/lib/types";

/** পেজ/পোস্টের এমন লিংক, যা ফেসবুকের এমবেড প্লাগইন সাধারণত দেখাতে পারে */
function embedUrl(url: string) {
  if (!/(\/posts\/|\/photos\/|\/videos\/|\/reel\/|story\.php|permalink\.php|fbid=)/.test(url)) return null;
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
}

function Thumb({ post, big = false }: { post: FbPost; big?: boolean }) {
  if (post.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.image_url} alt={post.title ?? "ফেসবুক পোস্ট"} loading="lazy" className={`w-full object-cover ${big ? "max-h-80 rounded-2xl" : "aspect-[16/9]"}`} />;
  }
  return (
    <div className={`grid w-full place-items-center bg-gradient-to-br from-[#1877f2] to-[#5a9fd0] text-white ${big ? "aspect-[16/9] rounded-2xl" : "aspect-[16/9]"}`}>
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <Logo size={big ? 64 : 48} />
        <span className="text-sm font-semibold text-white/95">ফেসবুক পেজের পোস্ট</span>
      </div>
    </div>
  );
}

export default function FbPostCard({ post }: { post: FbPost }) {
  const [open, setOpen] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const embed = embedUrl(post.url);

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

  return (
    <>
      <button
        onClick={() => {
          setShowEmbed(false);
          setOpen(true);
        }}
        className="block w-full overflow-hidden rounded-3xl border border-line bg-white text-left shadow-[0_4px_16px_rgba(40,80,120,0.08)] transition active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:shadow-[0_10px_28px_rgba(40,80,120,0.15)]"
      >
        <div className="relative">
          <Thumb post={post} />
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 py-1 pl-1 pr-3 text-xs font-bold text-[#1877f2] shadow">
            <FacebookIcon size={20} /> Facebook
          </span>
        </div>
        <div className="p-4">
          {post.title && <h3 className="text-lg leading-snug">{post.title}</h3>}
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
            <div className="space-y-3 overflow-y-auto p-4">
              <Thumb post={post} big />
              {post.title && <h2 className="text-xl">{post.title}</h2>}
              {post.preview && <p className="whitespace-pre-line">{post.preview}</p>}

              <a href={post.url} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#1877f2] py-3 text-lg text-white hover:brightness-110">
                <FacebookIcon size={24} /> ফেসবুকে পুরো পোস্ট দেখুন
              </a>

              {embed && !showEmbed && (
                <button onClick={() => setShowEmbed(true)} className="btn btn-ghost w-full">এখানেই মূল পোস্ট দেখান</button>
              )}
              {embed && showEmbed && (
                <iframe src={embed} title="ফেসবুক পোস্ট" width="500" height="560" className="mx-auto block max-w-full rounded-2xl border-0" allow="encrypted-media" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
