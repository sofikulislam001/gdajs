"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang";

const SECTIONS: { bn: [string, string]; en: [string, string] }[] = [
  {
    bn: ["১. আমরা কী তথ্য সংগ্রহ করি", "সদস্য আবেদনের সময় আপনার নাম, মোবাইল নম্বর, পিতার নাম, জন্মতারিখ, ঠিকানা, পেশা, শিক্ষাগত যোগ্যতা, ইমেইল (ঐচ্ছিক), রক্তের গ্রুপ, শেষ রক্তদানের তারিখ ও প্রোফাইল ছবি সংগ্রহ করা হয়। এছাড়া মাসিক চাঁদার হিসাব সংরক্ষিত থাকে।"],
    en: ["1. What information we collect", "When you apply for membership we collect your name, mobile number, father's name, date of birth, address, profession, education, email (optional), blood group, last blood donation date and profile photo. Monthly subscription records are also kept."],
  },
  {
    bn: ["২. তথ্য কীভাবে ব্যবহার হয়", "সদস্যপদ পরিচালনা, মাসিক চাঁদার হিসাব রাখা, জরুরি যোগাযোগ, রক্তদাতা খুঁজে দেওয়া এবং সংগঠনের কার্যক্রম জানানোর জন্য আপনার তথ্য ব্যবহার করা হয়। বাণিজ্যিক বিজ্ঞাপন বা বিক্রির জন্য কখনো ব্যবহার করা হয় না।"],
    en: ["2. How your information is used", "Your information is used to manage membership, keep subscription records, make urgent contact, help find blood donors and share organisation activities. It is never used for advertising or sold."],
  },
  {
    bn: ["৩. কে কী দেখতে পারে", "আপনার পূর্ণাঙ্গ তথ্য শুধু আপনি নিজে এবং সংগঠনের অ্যাডমিনরা দেখতে পারেন। রক্তদাতা তালিকায় আপনার নাম ও ফোন নম্বর কেবল তখনই দেখানো হয় যদি আপনি প্রোফাইলে অনুমতি দিয়ে রাখেন; যেকোনো সময় এই অনুমতি বন্ধ করা যায়। স্বচ্ছ হিসাব পাতায় সাধারণ দর্শক কেবল মোট আয়-ব্যয়ের তথ্য দেখেন। “সম্মাননা” পাতায় সেরা সদস্য ও নিয়মিত চাঁদাদাতা হিসেবে আপনার নাম ও ছবি দেখানো হতে পারে; প্রোফাইল সম্পাদনায় গিয়ে এটি বন্ধ করা যায়। জরুরি রক্তের অনুরোধে অনুরোধকারীর দেওয়া ফোন নম্বর সবাই দেখতে পায়।"],
    en: ["3. Who can see what", "Your full details are visible only to you and the organisation's admins. Your name and phone appear in the blood-donor list only if you allow it in your profile, and you can turn this off at any time. Visitors to the transparent-accounts page only see overall income and expense figures. Your name and photo may appear on the Honors page as a top or regular member; you can turn this off in your profile edit screen. The phone number given in an urgent blood request is visible to everyone."],
  },
  {
    bn: ["৪. তথ্য সংরক্ষণ ও নিরাপত্তা", "আপনি পুশ নোটিফিকেশন চালু করলে আপনার ডিভাইসের একটি নোটিফিকেশন ঠিকানা সংরক্ষিত হয়, শুধু আপনাকে নোটিফিকেশন পাঠাতে; সেটিংস থেকে যেকোনো সময় বন্ধ করা যায়। সাইট ও অ্যাপ কতজন ব্যবহার করছেন তা জানতে ডিভাইস ভিত্তিক একটি নামহীন র‍্যান্ডম আইডি গণনা করা হয়; এতে আপনার নাম বা অন্য ব্যক্তিগত তথ্য থাকে না। আপনার তথ্য নিরাপদ ক্লাউড ডাটাবেসে সংরক্ষিত থাকে এবং প্রবেশাধিকার কঠোরভাবে নিয়ন্ত্রিত। পাসওয়ার্ড এনক্রিপ্টেড অবস্থায় থাকে, কেউ তা দেখতে পারে না। নিজের পাসওয়ার্ড গোপন রাখুন এবং কারও সাথে শেয়ার করবেন না।"],
    en: ["4. Storage and security", "If you turn on push notifications, a device notification address is stored only to send you notifications; you can turn it off in Settings at any time. To count how many people use the site and app, an anonymous random per-device ID is counted; it holds no name or personal data. Your data is stored in a secure cloud database with strictly controlled access. Passwords are stored encrypted and nobody can read them. Please keep your password private and do not share it."],
  },
  {
    bn: ["৫. তৃতীয় পক্ষের সাথে শেয়ার", "আইনি বাধ্যবাধকতা ছাড়া আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষকে দেওয়া হয় না। ফেসবুক লিংক ক্লিক করলে আপনি ফেসবুকের নিজস্ব নীতির আওতায় যান।"],
    en: ["5. Sharing with third parties", "Your personal data is not given to any third party except where required by law. Clicking a Facebook link takes you to Facebook, which has its own policy."],
  },
  {
    bn: ["৬. আপনার অধিকার", "আপনি যেকোনো সময় প্রোফাইল থেকে নিজের তথ্য দেখতে ও সংশোধন করতে পারেন। তথ্য মুছে ফেলতে বা সদস্যপদ বাতিল করতে চাইলে সংগঠনের অ্যাডমিনের সাথে যোগাযোগ করুন।"],
    en: ["6. Your rights", "You can view and correct your details from your profile at any time. To delete your data or cancel membership, contact the organisation's admin."],
  },
  {
    bn: ["৭. পরিবর্তন", "প্রয়োজনে এই নীতিমালা হালনাগাদ করা হতে পারে। গুরুত্বপূর্ণ পরিবর্তন হলে সাইটে জানানো হবে।"],
    en: ["7. Changes", "This policy may be updated when needed. Important changes will be announced on the site."],
  },
];

export default function PrivacyPage() {
  const { lang, tr } = useLang();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/settings" className="text-sm font-semibold text-brand hover:underline">← {tr("সেটিংস", "Settings")}</Link>
      <div>
        <h1 className="text-2xl">{tr("প্রাইভেসি পলিসি", "Privacy policy")}</h1>
        <p className="text-muted">{tr("গোদনাইল আলোকিত যুব শক্তি • সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬", "Godnail Alokito Jubo Shakti • Last updated: October 2026")}</p>
      </div>
      {SECTIONS.map((s) => {
        const [h, b] = lang === "en" ? s.en : s.bn;
        return (
          <section key={h} className="card">
            <h2 className="text-lg">{h}</h2>
            <p className="mt-1 text-muted">{b}</p>
          </section>
        );
      })}
    </div>
  );
}
