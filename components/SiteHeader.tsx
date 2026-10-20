import Link from "next/link";
import Logo from "./Logo";
import { ORG_NAME } from "@/lib/bn";

const links = [
  { href: "/", label: "হোম" },
  { href: "/events", label: "কার্যক্রম" },
  { href: "/blood", label: "রক্তদাতা" },
  { href: "/hishab", label: "স্বচ্ছ হিসাব" },
  { href: "/dues", label: "আমার বকেয়া" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-x flex items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-display text-lg font-bold leading-tight text-brand-dark sm:text-xl">{ORG_NAME}</span>
        </Link>
        <Link href="/join" className="btn btn-accent btn-sm hidden sm:inline-flex">
          সদস্য হোন
        </Link>
      </div>
      <nav className="container-x flex gap-1 overflow-x-auto pb-2 text-[15px]">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-muted hover:bg-brand-soft hover:text-brand-dark">
            {l.label}
          </Link>
        ))}
        <Link href="/join" className="whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold text-brand sm:hidden">
          সদস্য হোন
        </Link>
      </nav>
    </header>
  );
}
