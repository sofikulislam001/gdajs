"use client";

import { useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { errorMessage } from "@/lib/bn";

const MAX_SIDE = 1600;

/** ফোনের বড় ছবি ছোট করে (সর্বোচ্চ ১৬০০px, JPEG) আপলোডের জন্য প্রস্তুত করে */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("ছবি প্রসেস করা যায়নি"))), "image/jpeg", 0.82),
  );
}

export default function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const blob = await shrink(file);
      const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const sb = browserClient();
      const { error: err } = await sb.storage.from("media").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (err) throw err;
      onChange(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="নির্বাচিত ছবি" className="aspect-[16/9] w-full rounded-2xl border border-line object-cover" />
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn btn-ghost btn-sm">
          {busy ? "আপলোড হচ্ছে…" : value ? "ছবি বদলান" : "ছবি আপলোড করুন"}
        </button>
        {value && <button type="button" onClick={() => onChange("")} className="btn btn-danger btn-sm">ছবি সরান</button>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="text-sm text-blood">{error}</p>}
    </div>
  );
}
