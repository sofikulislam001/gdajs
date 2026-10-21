import type { Metadata } from "next";
import FbPostCard from "@/components/FbPostCard";
import SetupNotice from "@/components/SetupNotice";
import { isConfigured, serverClient } from "@/lib/supabase";
import { FB_PAGE_URL } from "@/lib/brand";
import type { FbPost } from "@/lib/types";

export const revalidate = 30;
export const metadata: Metadata = { title: "ফেসবুক পোস্ট" };

export default async function PostsPage() {
  if (!isConfigured) return <SetupNotice />;
  const { data } = await serverClient()
    .from("fb_posts")
    .select("*")
    .eq("published", true)
    .order("posted_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })
    .limit(60);
  const posts = (data as FbPost[] | null) ?? [];
  const feed = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(FB_PAGE_URL)}&tabs=timeline&width=500&height=760&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-1 text-3xl">ফেসবুক পোস্ট</h1>
        <p className="mb-5 text-muted">আমাদের ফেসবুক পেজের গুরুত্বপূর্ণ পোস্ট। কার্ডে ক্লিক করলে পুরো পোস্ট দেখা যাবে।</p>
        {posts.length === 0 ? (
          <p className="text-muted">এখনো কোনো পোস্ট যোগ হয়নি।</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((p) => <FbPostCard key={p.id} post={p} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-2xl">ফেসবুক পেজের লাইভ ফিড</h2>
        <div className="card flex justify-center overflow-hidden p-2">
          <iframe
            src={feed}
            title="ফেসবুক পেজের ফিড"
            width="500"
            height="760"
            className="max-w-full border-0"
            loading="lazy"
            allow="encrypted-media"
          />
        </div>
        <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">ফেসবুক পেজে যান</a>
      </section>
    </div>
  );
}
