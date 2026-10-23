import Link from "next/link";

const TONES: Record<string, string> = {
  red: "from-[#ffe4e1] to-[#fff3f1]",
  blue: "from-[#dcecfa] to-[#f0f7fd]",
  gold: "from-[#fdeec6] to-[#fff8e6]",
  green: "from-[#d9f2e6] to-[#f0faf5]",
  violet: "from-[#e8e2fa] to-[#f5f2fd]",
};

export default function MenuCard({ href, label, tone = "blue", children }: { href: string; label: React.ReactNode; tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex min-w-0 flex-col items-center gap-2 text-center transition active:scale-95">
      <span className={`grid h-[68px] w-[68px] place-items-center rounded-[22px] bg-gradient-to-br ${TONES[tone]} shadow-[0_6px_16px_rgba(40,80,120,0.10)] ring-1 ring-white transition group-hover:-translate-y-0.5 sm:h-20 sm:w-20`}>
        <span className="scale-[0.62] sm:scale-75">{children}</span>
      </span>
      <span className="w-full text-[13px] font-semibold leading-tight text-ink sm:text-sm">{label}</span>
    </Link>
  );
}
