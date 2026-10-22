import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import SetupNotice from "@/components/SetupNotice";
import { T } from "@/lib/lang";
import { bn, fmtMonth } from "@/lib/bn";
import { isConfigured, serverClient } from "@/lib/supabase";

export const revalidate = 60;
export const metadata: Metadata = { title: "সম্মাননা" };

type Honor = { title: string; month: string | null; note: string | null; name: string; photo_url: string | null };
type Payer = { name: string; photo_url: string | null; paid_months: number };

export default async function HonorsPage() {
  if (!isConfigured) return <SetupNotice />;
  const sb = serverClient();
  const [h, p] = await Promise.all([sb.rpc("get_honors"), sb.rpc("get_regular_payers")]);
  const honors = (h.data as Honor[] | null) ?? [];
  const payers = (p.data as Payer[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-3xl"><T bn="সম্মাননা" en="Honors" /></h1>
        <p className="text-muted"><T bn="যাঁরা সংগঠনকে এগিয়ে নিচ্ছেন, তাঁদের প্রতি কৃতজ্ঞতা।" en="Gratitude to the people who keep us moving." /></p>
      </div>

      <section>
        <h2 className="mb-3 text-xl"><T bn="🏅 সেরা সদস্য" en="🏅 Members of the month" /></h2>
        {honors.length === 0 ? (
          <p className="text-muted"><T bn="এখনো কোনো সম্মাননা দেওয়া হয়নি।" en="No honors awarded yet." /></p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {honors.map((x, i) => (
              <div key={i} className="card flex flex-col items-center gap-2 bg-gradient-to-b from-accent-soft/60 to-white text-center">
                <Avatar src={x.photo_url} name={x.name} size={80} />
                <p className="text-lg font-bold">{x.name}</p>
                <span className="badge bg-accent-soft text-[#8a5a00]">{x.title}</span>
                {x.month && <p className="text-xs text-muted">{fmtMonth(x.month)}</p>}
                {x.note && <p className="text-sm text-muted">{x.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-xl"><T bn="✅ নিয়মিত চাঁদাদাতা" en="✅ Regular contributors" /></h2>
        <p className="mb-3 text-sm text-muted"><T bn="যাঁদের কোনো মাসের চাঁদা বাকি নেই।" en="Members with no dues outstanding." /></p>
        {payers.length === 0 ? (
          <p className="text-muted"><T bn="এখনো তালিকা তৈরি হয়নি।" en="The list is not available yet." /></p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {payers.map((x, i) => (
              <div key={i} className="card flex flex-col items-center gap-1.5 p-3 text-center">
                <Avatar src={x.photo_url} name={x.name} size={56} />
                <p className="font-semibold leading-tight">{x.name}</p>
                <p className="text-xs text-brand"><T bn={`${bn(x.paid_months)} মাস নিয়মিত`} en={`${x.paid_months} months on time`} /></p>
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="text-center text-xs text-muted"><T bn="নাম গোপন রাখতে চাইলে প্রোফাইল থেকে সেটিং বদলানো যায়।" en="Members can hide their name from their profile settings." /></p>
    </div>
  );
}
