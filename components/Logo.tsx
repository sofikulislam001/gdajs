import { LOGO_SRC } from "@/lib/brand";

export default function Logo({ size = 40 }: { size?: number }) {
  if (LOGO_SRC) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={LOGO_SRC} width={size} height={size} alt="সংগঠনের লোগো" className="rounded-xl bg-white object-contain" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#ffffff" />
      <g stroke="#f4a623" strokeWidth="2.600" strokeLinecap="round">
        <path d="M24 8v5" />
        <path d="M11.500 13.500l3.400 3.400" />
        <path d="M36.500 13.500l-3.400 3.400" />
        <path d="M6 25h5" />
        <path d="M42 25h-5" />
      </g>
      <path d="M13 34a11 11 0 0 1 22 0z" fill="#f4a623" />
      <path d="M9 37.500h30" stroke="#3f86bd" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
