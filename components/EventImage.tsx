import CategoryArt from "./CategoryArt";
import type { Category } from "@/lib/categories";

/** ছবি থাকলে ছবি, না থাকলে কাজ-ভিত্তিক ইলাস্ট্রেশন */
export default function EventImage({
  src,
  category,
  alt,
  className = "",
}: {
  src: string | null | undefined;
  category: string | null | undefined;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[16/9] w-full overflow-hidden bg-sky-soft ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <CategoryArt kind={(category as Category) || "other"} />
      )}
    </div>
  );
}
