import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { FacebookIcon } from "@/components/Icons";
import { COVER_SRC, FB_PAGE_URL, ORG_ESTD, ORG_PLACE } from "@/lib/brand";
import { ORG_NAME, ORG_SLOGAN } from "@/lib/bn";

export const metadata: Metadata = { title: "আমাদের সম্পর্কে" };

const values = [
  { title: "অরাজনৈতিক", text: "আমরা কোনো রাজনৈতিক দল বা মতের সাথে যুক্ত নই। মানুষের পাশে দাঁড়ানোই আমাদের একমাত্র পরিচয়।" },
  { title: "স্বেচ্ছাসেবী", text: "সদস্যরা নিজের সময় ও সামর্থ্য থেকে স্বেচ্ছায় কাজ করেন। কেউ বেতন বা সুবিধা নেন না।" },
  { title: "স্বচ্ছতা", text: "চাঁদা ও অনুদানের প্রতিটি টাকার আয়-ব্যয় এই সাইটে সবার জন্য খোলা।" },
];

const gallery = [
  { src: "/photos/eid-upohar.jpg", caption: "ঈদ উপহার বিতরণ" },
  { src: "/photos/winter-relief.jpg", caption: "শীতবস্ত্র বিতরণ" },
  { src: "/photos/monthly-meeting.jpg", caption: "মাসিক সভা" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="card overflow-hidden p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COVER_SRC ?? ""} alt={ORG_NAME} className="aspect-[1080/578] w-full object-cover" />
        <div className="flex items-center gap-4 p-5">
          <Logo size={64} />
          <div>
            <h1 className="text-2xl leading-tight">{ORG_NAME}</h1>
            <p className="text-muted">{ORG_SLOGAN}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3"><p className="text-2xl font-bold text-brand">{ORG_ESTD}</p><p className="text-sm text-muted">প্রতিষ্ঠা</p></div>
        <div className="card p-3"><p className="text-2xl font-bold text-brand">৫+ বছর</p><p className="text-sm text-muted">সেবার পথচলা</p></div>
        <div className="card p-3"><p className="text-2xl font-bold text-brand">৪০+</p><p className="text-sm text-muted">সদস্য</p></div>
      </section>

      <section className="card">
        <h2 className="text-xl text-brand-dark">আমাদের গল্প</h2>
        <p className="mt-2 text-muted">
          {ORG_ESTD} সালে {ORG_PLACE} এলাকার একদল তরুণ মিলে আর্তমানবতার সেবার লক্ষ্যে এই সংগঠন গড়ে তোলে। ঈদ উপহার, শীতবস্ত্র বিতরণ, রক্তদানসহ নানা কাজে আমরা অসহায় মানুষের পাশে দাঁড়াই এবং প্রতি মাসে সভায় বসে কাজের পরিকল্পনা করি।
        </p>
      </section>

      <section className="space-y-3">
        {values.map((v) => (
          <div key={v.title} className="card border-l-4 border-l-accent">
            <h2 className="text-xl text-brand-dark">{v.title}</h2>
            <p className="mt-1 text-muted">{v.text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-2xl">আমাদের কাজের ছবি</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {gallery.map((g) => (
            <figure key={g.src} className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_4px_16px_rgba(40,80,120,0.07)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="px-3 py-2 text-center font-semibold">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/join" className="btn btn-primary">সদস্য হতে আবেদন করুন</Link>
        <a href={FB_PAGE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          <FacebookIcon size={22} /> ফেসবুক পেজ
        </a>
      </div>
    </div>
  );
}
