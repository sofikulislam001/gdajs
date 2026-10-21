import type { Metadata } from "next";
import SetupNotice from "@/components/SetupNotice";
import { isConfigured, serverClient } from "@/lib/supabase";
import { fmtDate, fmtMonth, taka } from "@/lib/bn";
import type { Expense, PublicStats } from "@/lib/types";

export const revalidate = 30;
export const metadata: Metadata = { title: "স্বচ্ছ হিসাব" };

export default async function HishabPage() {
  if (!isConfigured) return <SetupNotice />;
  const sb = serverClient();
  const [stats, monthly, expenses] = await Promise.all([
    sb.rpc("get_public_stats"),
    sb.rpc("get_monthly_income"),
    sb.from("expenses").select("*").order("spent_on", { ascending: false }).limit(50),
  ]);
  const s = stats.data as PublicStats | null;
  const months = (monthly.data as { month: string; total: number }[] | null) ?? [];
  const list = (expenses.data as Expense[] | null) ?? [];
  const balance = s ? Number(s.income) - Number(s.expense) : 0;

  return (
    <div>
      <h1 className="mb-1 text-3xl">স্বচ্ছ হিসাব</h1>
      <p className="mb-6 text-muted">সদস্যদের চাঁদা ও অনুদান কোথায় কীভাবে খরচ হচ্ছে, সব এখানে সবার জন্য খোলা।</p>

      {s && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="card"><p className="text-sm text-muted">মোট আয়</p><p className="font-display text-2xl font-bold text-brand">{taka(Number(s.income))}</p></div>
          <div className="card"><p className="text-sm text-muted">মোট খরচ</p><p className="font-display text-2xl font-bold text-blood">{taka(Number(s.expense))}</p></div>
          <div className="card"><p className="text-sm text-muted">বর্তমান জমা</p><p className="font-display text-2xl font-bold">{taka(balance)}</p></div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl">মাসওয়ারি আয়</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <tbody className="divide-y divide-line">
                {months.length === 0 && <tr><td className="td text-muted">এখনো কোনো হিসাব নেই</td></tr>}
                {months.map((m) => (
                  <tr key={m.month}>
                    <td className="td">{fmtMonth(m.month)}</td>
                    <td className="td text-right font-semibold">{taka(Number(m.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl">সাম্প্রতিক খরচ</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <tbody className="divide-y divide-line">
                {list.length === 0 && <tr><td className="td text-muted">এখনো কোনো খরচ নেই</td></tr>}
                {list.map((x) => (
                  <tr key={x.id}>
                    <td className="td">
                      <p className="font-medium">{x.title}</p>
                      <p className="text-sm text-muted">{fmtDate(x.spent_on)}{x.category ? ` • ${x.category}` : ""}</p>
                    </td>
                    <td className="td text-right font-semibold text-blood">{taka(x.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
