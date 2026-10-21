/** প্রোফাইল ছবি; না থাকলে নামের প্রথম অক্ষর */
export default function Avatar({ src, name, size = 48, className = "" }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  const initial = (name ?? "").trim().charAt(0) || "?";
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? "প্রোফাইল ছবি"} style={style} className={`shrink-0 rounded-full border-2 border-white bg-sky-soft object-cover shadow ${className}`} />;
  }
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-sky to-brand font-bold text-white shadow ${className}`}>
      {initial}
    </span>
  );
}
