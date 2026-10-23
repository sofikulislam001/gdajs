"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

/** লগইন অনুযায়ী হোম বদলায়: অতিথি → জনসাধারণের হোম, লগইন → সদস্যের ড্যাশবোর্ড */
export default function HomeSwitch({ visitor, member }: { visitor: ReactNode; member: ReactNode }) {
  const { user, ready } = useAuth();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? "";
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) return setHint(true);
      }
    } catch {
      /* সংরক্ষণ অনুপলব্ধ */
    }
  }, []);

  if (user) return <>{member}</>;
  if (!ready && hint) return <div className="container-x space-y-4 py-6" aria-busy><div className="h-52 animate-pulse rounded-3xl bg-brand-soft" /><div className="h-28 animate-pulse rounded-3xl bg-brand-soft" /><div className="h-28 animate-pulse rounded-3xl bg-brand-soft" /></div>;
  return <>{visitor}</>;
}
