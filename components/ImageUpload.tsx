"use client";

import { useRef, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { errorMessage } from "@/lib/bn";
import Avatar from "./Avatar";

/** ফোনের বড় ছবি ছোট করে JPEG বানায় */
async function shrink(file: File, maxSide: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("ছবি প্রসেস করা যায়নি"))), "image/jpeg", 0.82),
  );
}

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** আপলোডের ফোল্ডার; সদস্যের ছবির জন্য "avatars/<নিজের id>" */
  folder?: string;
  maxSide?: number;
  /** গোল প্রোফাইল ছবির ধরন */
  avatar?: boolean;
  name?: string;
};

export default function ImageUpload({ value, onChange, folder, maxSide = 1600, avatar = false, name }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const blob = await shrink(file, maxSide);
      const dir = folder ?? String(new Date().getFullYear());
      const path = `${dir}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
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
    <div className={avatar ? "relative z-10 flex flex-col items-center gap-2.5" : "space-y-2"}>
      {avatar ? (
        <Avatar src={value} name={name} size={104} className="!border-4 shadow-lg ring-1 ring-line" />
      ) : (
        value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="নির্বাচিত ছবি" className="aspect-[16/9] w-full rounded-2xl border border-line object-cover" />
        )
      )}
      <div className={avatar ? "text-center" : ""}>
        <div className={`flex flex-wrap gap-2 ${avatar ? "justify-center" : ""}`}>
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn btn-ghost btn-sm">
            {busy ? "আপলোড হচ্ছে…" : value ? "ছবি বদলান" : "ছবি আপলোড করুন"}
          </button>
          {value && !busy && <button type="button" onClick={() => onChange("")} className="btn btn-danger btn-sm">ছবি সরান</button>}
        </div>
        {error && <p className="mt-1 text-sm text-blood">{error}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
