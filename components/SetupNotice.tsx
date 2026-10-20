export default function SetupNotice() {
  return (
    <div className="card border-accent bg-accent-soft">
      <p className="font-display text-lg font-bold">ডাটাবেস এখনো যুক্ত হয়নি</p>
      <p className="mt-1 text-muted">
        Vercel-এ <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_URL</code> ও{" "}
        <code className="rounded bg-white px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> সেট করার পর এই পেজে তথ্য দেখা যাবে।
      </p>
    </div>
  );
}
