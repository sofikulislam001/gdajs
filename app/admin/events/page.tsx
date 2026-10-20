"use client";

import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { errorMessage, fmtDate } from "@/lib/bn";
import type { EventRow } from "@/lib/types";

export default function EventsAdmin() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("events").select("*").order("event_date", { ascending: false });
    if (error) setMsg(errorMessage(error));
    setEvents((data as EventRow[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const { error } = await browserClient().from("events").insert({
      kind: String(f.get("kind")),
      title: String(f.get("title") ?? "").trim(),
      description: String(f.get("description") ?? "").trim() || null,
      event_date: String(f.get("date") ?? "") || undefined,
      location: String(f.get("location") ?? "").trim() || null,
      image_url: String(f.get("image_url") ?? "").trim() || null,
      published: true,
    });
    if (error) return setMsg(errorMessage(error));
    form.reset();
    setMsg("প্রকাশিত হয়েছে");
    await load();
  }

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

  if (!events) return <p className="text-muted">লোড হচ্ছে…</p>;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={add} className="card h-fit space-y-3 lg:col-span-2">
        <h2 className="text-lg">নতুন পোস্ট</h2>
        <select name="kind" className="input" defaultValue="event">
          <option value="event">কার্যক্রম (যা করা হয়েছে/হবে)</option>
          <option value="notice">নোটিশ (ঘোষণা)</option>
        </select>
        <input name="title" required placeholder="শিরোনাম" className="input" />
        <textarea name="description" rows={5} placeholder="বিস্তারিত" className="input" />
        <div className="grid grid-cols-2 gap-3">
          <input name="date" type="date" className="input" />
          <input name="location" placeholder="স্থান" className="input" />
        </div>
        <input name="image_url" type="url" placeholder="ছবির লিংক (ঐচ্ছিক)" className="input" />
        <button className="btn btn-primary w-full">প্রকাশ করুন</button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </form>

      <div className="space-y-3 lg:col-span-3">
        {events.length === 0 && <p className="text-muted">এখনো কোনো পোস্ট নেই</p>}
        {events.map((e) => {
          const url = `${origin}/events/${e.id}`;
          return (
            <div key={e.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">{e.kind === "notice" ? "নোটিশ" : "কার্যক্রম"} • {fmtDate(e.event_date)}{!e.published && " • লুকানো"}</p>
                  <p className="font-display text-lg font-bold">{e.title}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <a href={`/events/${e.id}`} target="_blank" className="btn btn-ghost btn-sm">দেখুন</a>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${e.title}\n${url}`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">হোয়াটসঅ্যাপে শেয়ার</a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">ফেসবুকে শেয়ার</a>
                <button onClick={() => togglePublish(e)} className="btn btn-ghost btn-sm">{e.published ? "লুকান" : "প্রকাশ করুন"}</button>
                <button onClick={() => del(e)} className="btn btn-danger btn-sm">মুছুন</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
