import type { Metadata } from "next";
import Link from "next/link";
import { FacebookIcon } from "@/components/Icons";
import { FB_PAGE_URL } from "@/lib/brand";
import { ORG_NAME, ORG_SLOGAN } from "@/lib/bn";

export const metadata: Metadata = { title: "আমাদের সম্পর্কে" };

const values = [
  { title: "অরাজনৈতিক", text: "আমরা কোনো রাজনৈতিক দল বা মতের সাথে যুক্ত নই। মানুষের পাশে দাঁড়ানোই আমাদের একমাত্র পরিচয়।" },
  { title: "স্বেচ্ছাসেবী", text: "সদস্যরা নিজের সময় ও সামর্থ্য থেকে স্বেচ্ছায় কাজ করেন। কেউ বেতন বা সুবিধা নেন না।" },
  { title: "স্বচ্ছতা", text: "চাঁদা ও অনুদানের প্রতিটি টাকার আয়-ব্যয় এই সাইটে সবার জন্য খোলা।" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card text-center">
        <h1 className="text-3xl">{ORG_NAME}</h1>
        <p className="mt-2 text-lg text-muted">{ORG_SLOGAN}</p>
      </div>

      {values.map((v) => (
        <div key={v.title} className="card border-l-4 border-l-accent">
          <h2 className="text-xl text-brand-dark">{v.title}</h2>
          <p className="mt-1 text-muted">{v.text}</p>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <Link href="/join" className="btn btn-primary">সদস্য হতে আবেদন করুন</Link>
        <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          <FacebookIcon size={22} /> ফেসবুক পেজ
        </a>
      </div>
    </div>
  );
}
