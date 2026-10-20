export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#0f5c4d" />
      <g stroke="#f2a516" strokeWidth="2.6" strokeLinecap="round">
        <path d="M24 9v5" />
        <path d="M11.5 14.5l3.4 3.4" />
        <path d="M36.5 14.5l-3.4 3.4" />
        <path d="M7 26h5" />
        <path d="M41 26h-5" />
      </g>
      <path d="M13 34a11 11 0 0 1 22 0z" fill="#f2a516" />
      <path d="M9 37.5h30" stroke="#fbf8f1" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
