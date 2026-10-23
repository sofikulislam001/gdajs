"use client";

import { ListSkeleton } from "@/components/Skeleton";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import BloodRequests from "@/components/BloodRequests";
import SetupNotice from "@/components/SetupNotice";
import { browserClient, isConfigured } from "@/lib/supabase";
import { BLOOD_GROUPS, errorMessage, fmtDate } from "@/lib/bn";

type Donor = {
  name: string;
  blood_group: string;
  address: string | null;
  phone: string;
  last_blood_donation: string | null;
  available: boolean;
  photo_url: string | null;
};

export default function BloodPage() {
  const [group, setGroup] = useState("");
  const [donors, setDonors] = useState<Donor[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    setDonors(null);
    browserClient()
      .rpc("get_donors_v2", { p_group: group || null })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(errorMessage(error));
        else setDonors((data as Donor[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [group]);

  if (!isConfigured) return <SetupNotice />;

  return (
    <div>
      <BloodRequests />
      <h1 className="mb-1 mt-2 text-3xl">রক্তদাতা তালিকা</h1>
      <p className="mb-5 text-muted">
        রক্তের প্রয়োজনে গ্রুপ বেছে নিন। শেষ রক্তদানের ৩ মাস (৯০ দিন) পার হলে দাতাকে &ldquo;প্রস্তুত&rdquo; দেখানো হয়।
      </p>

      <div className="-mx-4 mb-6 flex max-w-[100vw] gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setGroup("")} className={`btn btn-sm shrink-0 ${group === "" ? "btn-primary" : "btn-ghost"}`}>সব গ্রুপ</button>
        {BLOOD_GROUPS.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={`btn btn-sm shrink-0 ${group === g ? "btn-primary" : "btn-ghost"}`}>{g}</button>
        ))}
      </div>

      {error && <p className="mb-4 text-blood">{error}</p>}
      {donors === null && !error && <ListSkeleton />}
      {donors?.length === 0 && <p className="text-muted">এই গ্রুপের কোনো দাতা এখনো তালিকায় নেই।</p>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        {donors?.map((d) => (
          <div key={d.phone} className="card flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <Avatar src={d.photo_url} name={d.name} size={60} />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-blood px-1.5 py-0.5 text-xs font-bold text-white shadow">{d.blood_group}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{d.name}</p>
              {d.address && <p className="truncate text-sm text-muted">{d.address}</p>}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {d.available ? (
                  <span className="badge bg-brand-soft text-brand-dark">প্রস্তুত</span>
                ) : (
                  <span className="badge bg-accent-soft text-[#8a5a00]">সম্প্রতি রক্ত দিয়েছেন</span>
                )}
                {d.last_blood_donation && <span className="text-muted">শেষ: {fmtDate(d.last_blood_donation)}</span>}
              </p>
            </div>
            <a href={`tel:${d.phone}`} className="btn btn-primary btn-sm shrink-0">কল</a>
          </div>
        ))}
      </div>
    </div>
  );
}
