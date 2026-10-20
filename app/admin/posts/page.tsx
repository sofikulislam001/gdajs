"use client";

import { useCallback, useEffect, useState } from "react";
import EventImage from "@/components/EventImage";
import ImageUpload from "@/components/ImageUpload";
import { browserClient } from "@/lib/supabase";
import { errorMessage, fmtDate } from "@/lib/bn";
import type { FbPost } from "@/lib/types";

export default function PostsAdmin() {
  const [posts, setPosts] = useState<FbPost[] | null>(null);
  const [msg, setMsg] = useState("");
  const [image, setImage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("fb_posts").select("*").order("posted_on", { ascending: false });
    if (error) setMsg(errorMessage(error));
    setPosts((data as FbPost[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const url = String(f.get("url") ?? "").trim();
    if (!/^https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.com|fb\.watch)\//i.test(url)) {
      return setMsg("ফেসবুক পোস্টের লিংক দিন (facebook.com/...)");
    }
    const { error } = await browserClient().from("fb_posts").insert({
      url,
      title: String(f.get("title") ?? "").trim() || null,
      preview: String(f.get("preview") ?? "").trim() || null,
      image_url: image || null,
      posted_on: String(f.get("date") ?? "") || undefined,
      published: true,
    });
    if (error) return setMsg(errorMessage(error));
    form.reset();
    setImage("");
    setMsg("যোগ হয়েছে");
    await load();
  }

  async function togglePublish(p: FbPost) {
    const { error } = await browserClient().from("fb_posts").update({ published: !p.published }).eq("id", p.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  async function del(p: FbPost) {
    if (!window.confirm("এই পোস্ট কার্ডটি মুছে ফেলবেন? (ফেসবুকের মূল পোস্ট মুছবে না)")) return;
    const { error } = await browserClient().from("fb_posts").delete().eq("id", p.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  if (!posts) return <p className="text-muted">লোড হচ্ছে…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={add} className="card h-fit space-y-3 lg:col-span-2">
        <h2 className="text-lg">ফেসবুক পোস্ট যোগ করুন</h2>
        <p className="text-sm text-muted">ফেসবুকে পোস্ট করার পর সেই পোস্টের লিংক কপি করে এখানে দিন। সাথে ছোট একটা লেখা ও ছবি দিলে সাইটে সুন্দর কার্ড হয়ে দেখাবে, ক্লিক করলে পুরো পোস্ট খুলবে।</p>
        <input name="url" required placeholder="ফেসবুক পোস্টের লিংক (https://www.facebook.com/…)" className="input" />
        <input name="title" placeholder="শিরোনাম" className="input" />
        <textarea name="preview" rows={4} placeholder="পোস্টের সারসংক্ষেপ / প্রথম কয়েক লাইন" className="input" />
        <input name="date" type="date" className="input" />
        <div>
          <p className="label">কার্ডের ছবি</p>
          <ImageUpload value={image} onChange={setImage} />
        </div>
        <button className="btn btn-primary w-full">যোগ করুন</button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </form>

      <div className="space-y-3 lg:col-span-3">
        {posts.length === 0 && <p className="text-muted">এখনো কোনো পোস্ট নেই</p>}
        {posts.map((p) => (
          <div key={p.id} className="card overflow-hidden p-0">
            <div className="flex gap-3 p-3">
              <div className="w-28 shrink-0 overflow-hidden rounded-2xl"><EventImage src={p.image_url} category="other" alt={p.title ?? ""} /></div>
              <div className="min-w-0">
                <p className="text-xs text-muted">{fmtDate(p.posted_on)}{!p.published && " • লুকানো"}</p>
                <p className="text-lg font-bold leading-snug">{p.title || "(শিরোনাম নেই)"}</p>
                <p className="truncate text-xs text-muted">{p.url}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">ফেসবুকে খুলুন</a>
              <button onClick={() => togglePublish(p)} className="btn btn-ghost btn-sm">{p.published ? "লুকান" : "প্রকাশ করুন"}</button>
              <button onClick={() => del(p)} className="btn btn-danger btn-sm">মুছুন</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
