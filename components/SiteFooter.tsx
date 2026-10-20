import Link from "next/link";
import { ORG_NAME, ORG_SLOGAN } from "@/lib/bn";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-brand-dark text-white/90">
      <div className="container-x flex flex-col gap-3 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold">{ORG_NAME}</p>
          <p className="max-w-md text-sm text-white/70">{ORG_SLOGAN}</p>
        </div>
        <div className="flex gap-4 text-sm text-white/70">
          <Link href="/join" className="hover:text-white">সদস্য আবেদন</Link>
          <Link href="/admin" className="hover:text-white">অ্যাডমিন</Link>
        </div>
      </div>
    </footer>
  );
}
