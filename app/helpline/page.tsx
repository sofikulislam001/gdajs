import type { Metadata } from "next";
import { HelplineIcon } from "@/components/Icons";
import { bn } from "@/lib/bn";

export const metadata: Metadata = { title: "হেল্পলাইন" };

const lines = [
  { number: "999", name: "জাতীয় জরুরি সেবা", note: "পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স" },
  { number: "16263", name: "স্বাস্থ্য বাতায়ন", note: "স্বাস্থ্য বিষয়ক পরামর্শ" },
  { number: "109", name: "নারী ও শিশু সহায়তা", note: "নির্যাতন প্রতিরোধে জাতীয় হেল্পলাইন" },
  { number: "333", name: "সরকারি তথ্য ও সেবা", note: "যেকোনো সরকারি সেবা সংক্রান্ত তথ্য" },
];

export default function HelplinePage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-3xl">হেল্পলাইন</h1>
      <p className="mb-6 text-muted">জরুরি প্রয়োজনে সরাসরি কল করুন।</p>
      <div className="space-y-3">
        {contact && (
          <a href={`tel:${contact}`} className="card flex items-center gap-4 border-brand/40 bg-sky-soft">
            <HelplineIcon size={48} />
            <div className="flex-1">
              <p className="font-bold">আমাদের সংগঠন</p>
              <p className="text-sm text-muted">রক্ত ও জরুরি সহায়তার জন্য যোগাযোগ</p>
            </div>
            <span className="text-xl font-bold text-brand">{bn(contact)}</span>
          </a>
        )}
        {lines.map((l) => (
          <a key={l.number} href={`tel:${l.number}`} className="card flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-xl font-bold text-brand-dark">{bn(l.number)}</div>
            <div className="flex-1">
              <p className="font-bold">{l.name}</p>
              <p className="text-sm text-muted">{l.note}</p>
            </div>
            <span className="btn btn-primary btn-sm">কল</span>
          </a>
        ))}
      </div>
    </div>
  );
}
