import Link from "next/link";

export default function MenuCard({ href, label, children }: { href: string; label: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-line bg-white px-3 py-5 text-center shadow-[0_4px_16px_rgba(40,80,120,0.08)] transition active:scale-[0.97] md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_22px_rgba(40,80,120,0.14)]"
    >
      {children}
      <span className="text-lg font-semibold leading-tight text-ink">{label}</span>
    </Link>
  );
}
