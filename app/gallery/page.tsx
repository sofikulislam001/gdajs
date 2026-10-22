import type { Metadata } from "next";
import GalleryGrid from "@/components/GalleryGrid";
import SetupNotice from "@/components/SetupNotice";
import { T } from "@/lib/lang";
import { isConfigured, serverClient } from "@/lib/supabase";
import type { GalleryPhoto } from "@/lib/types";

export const revalidate = 30;
export const metadata: Metadata = { title: "ফটো গ্যালারি" };

export default async function GalleryPage() {
  if (!isConfigured) return <SetupNotice />;
  const { data } = await serverClient().from("gallery_photos").select("*").eq("published", true).order("created_at", { ascending: false }).limit(300);
  return (
    <div>
      <h1 className="mb-1 text-3xl"><T bn="ফটো গ্যালারি" en="Photo gallery" /></h1>
      <p className="mb-5 text-muted"><T bn="আমাদের কাজের মুহূর্তগুলো, অ্যালবাম অনুযায়ী।" en="Moments from our work, by album." /></p>
      <GalleryGrid photos={(data as GalleryPhoto[] | null) ?? []} />
    </div>
  );
}
