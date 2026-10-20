import type { Category } from "@/lib/categories";

/** ছবি না থাকলে কাজের ধরন অনুযায়ী আঁকা ইলাস্ট্রেশন দেখানো হয়। আসল ছবি আপলোড করলে সেটাই দেখাবে। */
export default function CategoryArt({ kind }: { kind: Category | "cover" }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label="ইলাস্ট্রেশন">
      {scene(kind)}
    </svg>
  );
}

function scene(kind: Category | "cover") {
  switch (kind) {
    case "blood":
      return (
        <>
          <rect width="320" height="180" fill="#ffe9e6" />
          <circle cx="262" cy="36" r="62" fill="#ffd3cd" />
          <path d="M160 18C160 18 117 78 117 109a43 43 0 0 0 86 0C203 78 160 18 160 18z" fill="#d63a30" />
          <path d="M139 105a23 23 0 0 0 17 21" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".55" />
          <path d="M70 126c0-10 7-17 17-17s17 7 17 17c0 14-17 27-17 27s-17-13-17-27z" fill="#f4a623" />
          <rect x="226" y="94" width="50" height="66" rx="13" fill="#fff" />
          <rect x="234" y="114" width="34" height="38" rx="9" fill="#d63a30" />
          <rect x="244" y="80" width="14" height="18" rx="4" fill="#fff" />
        </>
      );
    case "relief":
      return (
        <>
          <rect width="320" height="180" fill="#e6f4ea" />
          <circle cx="58" cy="44" r="27" fill="#ffe08a" />
          <rect y="152" width="320" height="28" fill="#bfe3c9" />
          <rect x="78" y="84" width="96" height="72" rx="6" fill="#d9a066" />
          <rect x="78" y="84" width="96" height="16" fill="#c28a52" />
          <rect x="119" y="84" width="14" height="72" fill="#f1dcc0" />
          <path d="M126 140s-15-9-15-19a7.500 7.500 0 0 1 15-4.500 7.500 7.500 0 0 1 15 4.500c0 10-15 19-15 19z" fill="#d63a30" />
          <rect x="166" y="112" width="84" height="44" rx="6" fill="#e6b57a" />
          <rect x="199" y="112" width="12" height="44" fill="#f1dcc0" />
          <path d="M262 156c0-26 9-44 22-44s22 18 22 44z" fill="#3f86bd" />
          <circle cx="284" cy="98" r="11" fill="#f4a623" />
        </>
      );
    case "education":
      return (
        <>
          <rect width="320" height="180" fill="#fff4d6" />
          <circle cx="40" cy="150" r="60" fill="#ffe7a8" />
          <path d="M58 138V74c32-8 64-4 102 10v64c-38-14-70-18-102-10z" fill="#fff" stroke="#3f86bd" strokeWidth="5" strokeLinejoin="round" />
          <path d="M262 138V74c-32-8-64-4-102 10v64c38-14 70-18 102-10z" fill="#fff" stroke="#3f86bd" strokeWidth="5" strokeLinejoin="round" />
          <g fill="#a9cbe8">
            <rect x="76" y="92" width="62" height="5" rx="2.500" />
            <rect x="76" y="106" width="52" height="5" rx="2.500" />
            <rect x="182" y="92" width="62" height="5" rx="2.500" />
            <rect x="182" y="106" width="52" height="5" rx="2.500" />
          </g>
          <path d="M160 18l56 22-56 22-56-22z" fill="#2c6a9b" />
          <path d="M130 54v18c0 9 60 9 60 0V54l-30 12z" fill="#3f86bd" />
          <path d="M216 40v26" stroke="#f4a623" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "youth":
      return (
        <>
          <rect width="320" height="180" fill="#e3f3e0" />
          <circle cx="258" cy="40" r="26" fill="#ffe08a" />
          <rect y="140" width="320" height="40" fill="#9fd19a" />
          <rect x="148" y="84" width="14" height="62" rx="6" fill="#8b5a2b" />
          <circle cx="155" cy="62" r="38" fill="#2f9e6e" />
          <circle cx="130" cy="82" r="24" fill="#3bb27d" />
          <circle cx="182" cy="82" r="24" fill="#3bb27d" />
          <path d="M250 152v-28" stroke="#8b5a2b" strokeWidth="5" strokeLinecap="round" />
          <path d="M250 130c-16 0-20-14-20-14s16-2 20 8zM250 126c14 0 20-14 20-14s-16-2-20 8z" fill="#2f9e6e" />
          <circle cx="66" cy="112" r="11" fill="#f4a623" />
          <path d="M48 152c0-14 8-24 18-24s18 10 18 24z" fill="#3f86bd" />
          <circle cx="94" cy="120" r="9" fill="#d63a30" />
          <path d="M80 154c0-11 6-19 14-19s14 8 14 19z" fill="#7fb2d9" />
        </>
      );
    case "health":
      return (
        <>
          <rect width="320" height="180" fill="#e4f1fb" />
          <circle cx="262" cy="36" r="52" fill="#cfe5f6" />
          <rect x="96" y="40" width="128" height="104" rx="10" fill="#fff" />
          <path d="M96 62V50a10 10 0 0 1 10-10h108a10 10 0 0 1 10 10v12z" fill="#3f86bd" />
          <rect x="152" y="76" width="16" height="48" rx="3" fill="#d63a30" />
          <rect x="136" y="92" width="48" height="16" rx="3" fill="#d63a30" />
          <path d="M10 162h84l12-24 16 40 14-30h174" stroke="#2f9e6e" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    default:
      return (
        <>
          <rect width="320" height="180" fill="#dcecf8" />
          <circle cx="160" cy="116" r="46" fill="#f4a623" />
          <g stroke="#f4a623" strokeWidth="6" strokeLinecap="round">
            <path d="M160 40v-16M104 62L92 50M216 62l12-12M84 110H66M236 110h18" />
          </g>
          <path d="M0 150c60-30 120-20 160-6s120 24 160-4v40H0z" fill="#3f86bd" />
          <path d="M0 166c80-20 140-10 200 0s90 8 120-6v20H0z" fill="#2c6a9b" />
          <circle cx="116" cy="136" r="7" fill="#fff" />
          <path d="M104 160c0-10 5-17 12-17s12 7 12 17z" fill="#fff" />
          <circle cx="160" cy="132" r="7" fill="#fff" />
          <path d="M148 158c0-10 5-17 12-17s12 7 12 17z" fill="#fff" />
          <circle cx="204" cy="136" r="7" fill="#fff" />
          <path d="M192 160c0-10 5-17 12-17s12 7 12 17z" fill="#fff" />
        </>
      );
  }
}
