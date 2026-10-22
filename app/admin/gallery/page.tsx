"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { ListSkeleton } from "@/components/Skeleton";
import { errorMessage } from "@/lib/bn";
import { browserClient } from "@/lib/supabase";
import type { GalleryPhoto } from "@/lib/types";

export default function GalleryAdmin() {
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);
  const [album, setAlbum] = useState("সাধারণ");
  const [caption, setCaption] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("gallery_photos").select("*").order("created_at", { ascending: false });
    if (error) setMsg(errorMessage(error));
    setPhotos((data as GalleryPhoto[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(url: string) {
    if (!url) return;
    const { error } = await browserClient().from("gallery_photos").insert({ album: album.trim() || "সাধারণ", caption: caption.trim() || null, image_url: url, published: true });
    if (error) return setMsg(errorMessage(error));
    setMsg("ছবি যুক্ত হয়েছে ✅ (একই অ্যালবামে আরও ছবি দিতে পারেন)");
    setCaption("");
    await load();
  }

  async function toggle(p: GalleryPhoto) {
    const { error } = await browserClient().from("gallery_photos").update({ published: !p.published }).eq("id", p.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  async function del(p: GalleryPhoto) {
    if (!window.confirm("এই ছবি মুছবেন?")) return;
    const { error } = await browserClient().from("gallery_photos").delete().eq("id", p.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  if (!photos) return <ListSkeleton />;
  const albums = Array.from(new Set(photos.map((p) => p.album)));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl">ফটো গ্যালারি</h1>
        <p className="text-muted">অ্যালবামের নাম লিখে ছবি আপলোড করুন (যেমন: শীতবস্ত্র বিতরণ ২০২৬)। সাইটের &ldquo;গ্যালারি&rdquo; পাতায় দেখাবে।</p>
      </div>
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}
      <div className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="album">অ্যালবামের নাম</label>
            <input id="album" list="albums" value={album} onChange={(e) => setAlbum(e.target.value)} className="input" />
            <datalist id="albums">{albums.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div>
            <label className="label" htmlFor="cap">ক্যাপশন (ঐচ্ছিক)</label>
            <input id="cap" value={caption} onChange={(e) => setCaption(e.target.value)} className="input" />
          </div>
        </div>
        <ImageUpload value="" onChange={add} folder="gallery" maxSide={1600} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="card overflow-hidden p-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt="" className={`aspect-square w-full object-cover ${p.published ? "" : "opacity-40"}`} />
            <div className="space-y-1.5 p-2">
              <p className="truncate text-xs font-semibold">{p.album}{p.caption ? ` • ${p.caption}` : ""}</p>
              <div className="flex gap-1">
                <button onClick={() => toggle(p)} className="btn btn-ghost btn-sm flex-1">{p.published ? "লুকান" : "দেখান"}</button>
                <button onClick={() => del(p)} className="btn btn-danger btn-sm">মুছুন</button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="text-muted">এখনো কোনো ছবি নেই</p>}
      </div>
    </div>
  );
}
