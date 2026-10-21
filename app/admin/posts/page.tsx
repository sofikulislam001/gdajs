"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { ListSkeleton } from "@/components/Skeleton";
import { browserClient } from "@/lib/supabase";
import { errorMessage } from "@/lib/bn";
import type { FbPost } from "@/lib/types";

const FB_RE = /^https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.com|fb\.watch)\//i;

function PostForm({ post, onDone, onCancel }: { post?: FbPost; onDone: (msg: string) => void; onCancel?: () => void }) {
  const [image, setImage] = useState(post?.image_url ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const url = String(f.get("url") ?? "").trim();
    if (!FB_RE.test(url)) return setErr("ফেসবুক পোস্টের লিংক দিন (facebook.com/...)");
    const row = {
      url,
      title: String(f.get("title") ?? "").trim() || null,
      preview: String(f.get("preview") ?? "").trim() || null,
      image_url: image || null,
    };
    setBusy(true);
    const sb = browserClient();
    const { error } = post ? await sb.from("fb_posts").update(row).eq("id", post.id) : await sb.from("fb_posts").insert({ ...row, published: true });
    setBusy(false);
    if (error) return setErr(errorMessage(error));
    if (!post) {
      form.reset();
      setImage("");
    }
    setErr("");
    onDone(post ? "সংরক্ষিত হয়েছে" : "পোস্ট যোগ হয়েছে");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">১. ফেসবুক পোস্টের লিংক</label>
        <input name="url" required defaultValue={post?.url} placeholder="https://www.facebook.com/..." className="input" />
      </div>
      <div>
        <label className="label">২. ছবি (পোস্টের ছবি বা স্ক্রিনশট)</label>
        <ImageUpload value={image} onChange={setImage} />
      </div>
      <div>
        <label className="label">৩. শিরোনাম</label>
        <input name="title" defaultValue={post?.title ?? ""} placeholder="যেমন: শীতবস্ত্র বিতরণ কর্মসূচি" className="input" />
      </div>
      <div>
        <label className="label">৪. পোস্টের লেখা (ছোট করে)</label>
        <textarea name="preview" rows={4} defaultValue={post?.preview ?? ""} placeholder="পোস্টের প্রথম কয়েক লাইন কপি করে দিন" className="input" />
      </div>
      {err && <p className="rounded-xl bg-blood/10 px-3 py-2 text-sm text-blood">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="btn btn-primary flex-1">{busy ? "সংরক্ষণ হচ্ছে…" : post ? "সংরক্ষণ করুন" : "পোস্ট যোগ করুন"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost">বাতিল</button>}
      </div>
    </form>
  );
}

export default function PostsAdmin() {
  const [posts, setPosts] = useState<FbPost[] | null>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("fb_posts").select("*").order("created_at", { ascending: false });
    if (error) setMsg(errorMessage(error));
    setPosts((data as FbPost[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(p: FbPost) {
    const { error } = await browserClient().from("fb_posts").update({ published: !p.published }).eq("id", p.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  async function del(p: FbPost) {
    if (!window.confirm("এই কার্ডটি মুছে ফেলবেন? (ফেসবুকের মূল পোস্ট মুছবে না)")) return;
    const { error } = await browserClient().from("fb_posts").delete().eq("id", p.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  if (!posts) return <ListSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl">ফেসবুক পোস্ট</h1>
        <p className="text-muted">ফেসবুকে পোস্ট করার পর এখানে লিংক, ছবি ও ছোট লেখা দিন। সাইটে সুন্দর কার্ড হবে, ক্লিক করলে পুরো পোস্ট খুলবে।</p>
      </div>

      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      <div className="card">
        <h2 className="mb-3 text-lg">নতুন পোস্ট যোগ করুন</h2>
        <PostForm onDone={(m) => { setMsg(m); void load(); }} />
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="card overflow-hidden p-0">
            <div className="flex gap-3 p-3">
              <div className="aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-2xl bg-sky-soft">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted">ছবি নেই</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-snug">{p.title || "(শিরোনাম নেই)"}</p>
                {!p.image_url && <p className="text-sm text-[#8a5a00]">ছবি ও লেখা যোগ করলে প্রিভিউ সুন্দর দেখাবে</p>}
                {!p.published && <p className="text-xs text-muted">লুকানো আছে</p>}
              </div>
            </div>
            {editing === p.id ? (
              <div className="border-t border-line p-4">
                <PostForm post={p} onCancel={() => setEditing(null)} onDone={(m) => { setMsg(m); setEditing(null); void load(); }} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
                <button onClick={() => setEditing(p.id)} className="btn btn-primary btn-sm">ছবি/লেখা সম্পাদনা</button>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">ফেসবুকে খুলুন</a>
                <button onClick={() => togglePublish(p)} className="btn btn-ghost btn-sm">{p.published ? "লুকান" : "প্রকাশ করুন"}</button>
                <button onClick={() => del(p)} className="btn btn-danger btn-sm">মুছুন</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
