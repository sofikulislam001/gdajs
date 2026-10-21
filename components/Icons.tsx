type P = { size?: number; className?: string };

function Svg({ size = 64, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const BloodIcon = (p: P) => (
  <Svg {...p}>
    <path d="M32 5C32 5 13 28 13 41a19 19 0 0 0 38 0C51 28 32 5 32 5z" fill="#d63a30" />
    <path d="M23 40a9 9 0 0 0 7 9" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity=".6" />
  </Svg>
);

export const PeopleIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 50c0-8 5-13 12-13 3 0 5 1 7 2-3 3-5 7-5 11z" fill="#a9cbe8" />
    <path d="M62 50c0-8-5-13-12-13-3 0-5 1-7 2 3 3 5 7 5 11z" fill="#a9cbe8" />
    <circle cx="14" cy="27" r="6" fill="#7fb2d9" />
    <circle cx="50" cy="27" r="6" fill="#7fb2d9" />
    <circle cx="32" cy="20" r="9" fill="#f4a623" />
    <path d="M14 56c0-11 8-18 18-18s18 7 18 18z" fill="#3f86bd" />
  </Svg>
);

export const EventIcon = (p: P) => (
  <Svg {...p}>
    <rect x="8" y="12" width="48" height="44" rx="8" fill="#fff" stroke="#3f86bd" strokeWidth="3" />
    <path d="M8 22a8 8 0 0 1 8-10h32a8 8 0 0 1 8 10v4H8z" fill="#3f86bd" />
    <rect x="18" y="6" width="5" height="12" rx="2.5" fill="#2c6a9b" />
    <rect x="41" y="6" width="5" height="12" rx="2.5" fill="#2c6a9b" />
    <path d="M32 51s-11-6.5-11-14a6 6 0 0 1 11-3.2A6 6 0 0 1 43 37c0 7.500-11 14-11 14z" fill="#d63a30" />
  </Svg>
);

export const PostIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 9h40a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H30L18 56V45h-6a6 6 0 0 1-6-6V15a6 6 0 0 1 6-6z" fill="#3f86bd" />
    <rect x="15" y="19" width="34" height="4.500" rx="2.200" fill="#fff" />
    <rect x="15" y="28" width="24" height="4.500" rx="2.200" fill="#fff" opacity=".8" />
  </Svg>
);

export const NoticeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 25h13l25-13v38L22 37H9z" fill="#f4a623" />
    <path d="M22 37l4 15h8l-4-14z" fill="#e08e0b" />
    <path d="M53 23c4.500 3.500 4.500 14.500 0 18" stroke="#d63a30" strokeWidth="3.600" strokeLinecap="round" fill="none" />
  </Svg>
);

export const WalletIcon = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="15" width="52" height="40" rx="9" fill="#2f9e6e" />
    <path d="M6 24a9 9 0 0 1 9-9h34a9 9 0 0 1 9 9v2H6z" fill="#26865c" />
    <rect x="37" y="32" width="21" height="13" rx="6.500" fill="#fff" />
    <circle cx="44.500" cy="38.500" r="3" fill="#2f9e6e" />
  </Svg>
);

export const ReceiptIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 6h36v52l-6-4-6 4-6-4-6 4-6-4-6 4z" fill="#fff" stroke="#3f86bd" strokeWidth="3" strokeLinejoin="round" />
    <rect x="22" y="17" width="20" height="4.500" rx="2.200" fill="#3f86bd" />
    <rect x="22" y="27" width="20" height="4.500" rx="2.200" fill="#a9cbe8" />
    <rect x="22" y="37" width="12" height="4.500" rx="2.200" fill="#a9cbe8" />
  </Svg>
);

export const HelplineIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 36v-4a20 20 0 0 1 40 0v4" stroke="#2c6a9b" strokeWidth="5" fill="none" strokeLinecap="round" />
    <rect x="6" y="34" width="12" height="18" rx="6" fill="#f4a623" />
    <rect x="46" y="34" width="12" height="18" rx="6" fill="#f4a623" />
    <path d="M52 52c0 6-6 8-14 8" stroke="#2c6a9b" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="36" cy="60" r="3.500" fill="#d63a30" />
  </Svg>
);

export const InfoIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="32" cy="32" r="26" fill="#3f86bd" />
    <circle cx="32" cy="20" r="3.800" fill="#fff" />
    <rect x="28.500" y="28" width="7" height="20" rx="3.500" fill="#fff" />
  </Svg>
);

export const ShareIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="15" cy="32" r="8" fill="#3f86bd" />
    <circle cx="48" cy="14" r="8" fill="#f4a623" />
    <circle cx="48" cy="50" r="8" fill="#d63a30" />
    <path d="M21 28l21-11M21 36l21 11" stroke="#2c6a9b" strokeWidth="3.500" strokeLinecap="round" />
  </Svg>
);

export const AdminIcon = (p: P) => (
  <Svg {...p}>
    <path d="M32 5l22 8v16c0 14-9 25-22 30C19 54 10 43 10 29V13z" fill="#3f86bd" />
    <path d="M22 32l7 7 13-14" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const FacebookIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="32" cy="32" r="27" fill="#1877f2" />
    <path d="M35 52V34h6l1-7h-7v-4c0-2 1-3.500 3.500-3.500H42V13c-1-.2-3-.4-5-.4-5.500 0-8.500 3.200-8.500 9V27H22v7h6.500v18z" fill="#fff" />
  </Svg>
);

/** নিচের নেভিগেশনের সরল লাইন-আইকন */
export function NavIcon({ name, size = 24 }: { name: "home" | "event" | "wallet" | "user" | "menu" | "bell" | "close"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>;
    case "event":
      return <svg {...common}><rect x="3.500" y="5" width="17" height="16" rx="3" /><path d="M3.500 10h17M8 3v4M16 3v4" /></svg>;
    case "wallet":
      return <svg {...common}><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M16 13h5M6 6l9-3v3" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.500 3.500-7 8-7s8 2.500 8 7" /></svg>;
    case "menu":
      return <svg {...common} strokeWidth={2.200}><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
    case "bell":
      return <svg {...common}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
    case "close":
      return <svg {...common} strokeWidth={2.200}><path d="M5 5l14 14M19 5L5 19" /></svg>;
  }
}

export const SettingsIcon = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3f86bd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
