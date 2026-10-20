export default function ShareButtons({ url, text }: { url: string; text: string }) {
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return (
    <div className="flex flex-wrap gap-2">
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
        হোয়াটসঅ্যাপে শেয়ার
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
        ফেসবুকে শেয়ার
      </a>
    </div>
  );
}
