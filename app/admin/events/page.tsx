"use client";

import { useCallback, useEffect, useState } from "react";
import EventImage from "@/components/EventImage";
import EventTools from "@/components/EventTools";
import ImageUpload from "@/components/ImageUpload";
import { ListSkeleton } from "@/components/Skeleton";
import { browserClient } from "@/lib/supabase";
import { errorMessage, fmtDate } from "@/lib/bn";
import { CATEGORIES } from "@/lib/categories";
import type { EventRow } from "@/lib/types";

function EventForm({ ev, onDone, onCancel }: { ev?: EventRow; onDone: (msg: string) => void; onCancel?: () => void }) {
  const [image, setImage] = useState(ev?.image_url ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const row = {
      kind: String(f.get("kind")),
      category: String(f.get("category") ?? "other"),
      title: String(f.get("title") ?? "").trim(),
      description: String(f.get("description") ?? "").trim() || null,
      event_date: String(f.get("date") ?? "") || undefined,
      location: String(f.get("location") ?? "").trim() || null,
      image_url: image || null,
    };
    setBusy(true);
    const sb = browserClient();
    const { error } = ev ? await sb.from("events").update(row).eq("id", ev.id) : await sb.from("events").insert({ ...row, published: true });
    setBusy(false);
    if (error) return setErr(errorMessage(error));
    if (!ev) {
      form.reset();
      setImage("");
    }
    setErr("");
    onDone(ev ? "সংরক্ষিত হয়েছে" : "প্রকাশিত হয়েছে");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">ধরন</label>
          <select name="kind" className="input" defaultValue={ev?.kind ?? "event"}>
            <option value="event">কার্যক্রম</option>
            <option value="notice">নোটিশ</option>
          </select>
        </div>
        <div>
          <label className="label">কাজের বিষয়</label>
          <select name="category" className="input" defaultValue={ev?.category ?? "other"}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">শিরোনাম</label>
        <input name="title" required defaultValue={ev?.title} placeholder="যেমন: শীতবস্ত্র বিতরণ" className="input" />
      </div>
      <div>
        <label className="label">ছবি</label>
        <ImageUpload value={image} onChange={setImage} />
      </div>
      <div>
        <label className="label">বিস্তারিত</label>
        <textarea name="description" rows={4} defaultValue={ev?.description ?? ""} placeholder="কী হয়েছে বা কী হবে লিখুন" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">তারিখ</label>
          <input name="date" type="date" defaultValue={ev?.event_date} className="input" />
        </div>
        <div>
          <label className="label">স্থান</label>
          <input name="location" defaultValue={ev?.location ?? ""} placeholder="ঐচ্ছিক" className="input" />
        </div>
      </div>
      {err && <p className="rounded-xl bg-blood/10 px-3 py-2 text-sm text-blood">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="btn btn-primary flex-1">{busy ? "অপেক্ষা করুন…" : ev ? "সংরক্ষণ করুন" : "প্রকাশ করুন"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost">বাতিল</button>}
      </div>
    </form>
  );
}

export default function EventsAdmin() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [tools, setTools] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("events").select("*").order("event_date", { ascending: false });
    if (error) setMsg(errorMessage(error));
    setEvents((data as EventRow[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(e: EventRow) {
    const { error } = await browserClient().from("events").update({ published: !e.published }).eq("id", e.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  async function del(e: EventRow) {
    if (!window.confirm(`"${e.title}" মুছে ফেলবেন?`)) return;
    const { error } = await browserClient().from("events").delete().eq("id", e.id);
    if (error) setMsg(errorMessage(error));
    await load();
  }

  if (!events) return <ListSkeleton />;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl">কার্যক্রম ও নোটিশ</h1>
        <p className="text-muted">সংগঠনের কাজের ছবিসহ পোস্ট বা সদস্যদের জন্য নোটিশ এখান থেকে দিন।</p>
      </div>
      {msg && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 font-medium">{msg}</p>}

      <div className="card">
        <h2 className="mb-3 text-lg">নতুন পোস্ট</h2>
        <EventForm onDone={(m) => { setMsg(m); void load(); }} />
      </div>

      <div className="space-y-3">
        {events.map((e) => {
          const url = `${origin}/events/${e.id}`;
          return (
            <div key={e.id} className="card overflow-hidden p-0">
              <div className="flex gap-3 p-3">
                <div className="w-28 shrink-0 overflow-hidden rounded-2xl"><EventImage src={e.image_url} category={e.category} alt={e.title} /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted">{e.kind === "notice" ? "নোটিশ" : "কার্যক্রম"} • {fmtDate(e.event_date)}{!e.published && " • লুকানো"}</p>
                  <p className="text-lg font-bold leading-snug">{e.title}</p>
                </div>
              </div>
              {editing === e.id ? (
                <div className="border-t border-line p-4">
                  <EventForm ev={e} onCancel={() => setEditing(null)} onDone={(m) => { setMsg(m); setEditing(null); void load(); }} />
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
                  <button onClick={() => setEditing(e.id)} className="btn btn-primary btn-sm">সম্পাদনা</button>
                  <a href={`/events/${e.id}`} target="_blank" className="btn btn-ghost btn-sm">দেখুন</a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${e.title}\n${url}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">হোয়াটসঅ্যাপ</a>
                  {e.kind === "event" && <button onClick={() => setTools(tools === e.id ? null : e.id)} className="btn btn-accent btn-sm">উপস্থিতি ও তহবিল</button>}
                  <button onClick={() => togglePublish(e)} className="btn btn-ghost btn-sm">{e.published ? "লুকান" : "প্রকাশ করুন"}</button>
                  <button onClick={() => del(e)} className="btn btn-danger btn-sm">মুছুন</button>
                </div>
              )}
              {tools === e.id && <EventTools eventId={e.id} title={e.title} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
