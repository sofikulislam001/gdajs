# গোদনাইল আলোকিত যুব শক্তি — ওয়েব অ্যাপ

আর্তমানবতার সেবায় নিয়োজিত স্বেচ্ছাসেবী অরাজনৈতিক যুব সংগঠনের ওয়েবসাইট ও ম্যানেজমেন্ট সিস্টেম। লাইভ: https://gdajs.vercel.app

## কী কী আছে
- **পাবলিক:** হোম, কার্যক্রম/নোটিশ, ফেসবুক পোস্ট প্রিভিউ, রক্তদাতা তালিকা (ছবিসহ), স্বচ্ছ হিসাব, আমাদের সম্পর্কে, হেল্পলাইন
- **সদস্য:** মোবাইল নম্বর + পাসওয়ার্ডে অ্যাকাউন্ট (`/join`), লগইন (`/login`), নিজের প্রোফাইল, ছবি আপলোড, বকেয়া দেখা (`/profile`)
- **অ্যাডমিন (`/admin`):** নতুন আবেদন অনুমোদন, সদস্যের পূর্ণ তথ্য দেখা/সম্পাদনা, পাসওয়ার্ড রিসেট, মাসিক চাঁদা আদায়, হোয়াটসঅ্যাপ রিমাইন্ডার, খরচ ও অনুদান, কার্যক্রম ও ফেসবুক পোস্ট (সম্পাদনাসহ), সাইট সেটিংস (ফোন, বিকাশ নির্দেশনা ইত্যাদি)

## সেটআপ
1. [Supabase](https://supabase.com) প্রজেক্টে `supabase/schema.sql` Run করুন।
2. `supabase/functions/member-api` Edge Function ডিপ্লয় করুন (verify_jwt বন্ধ; নিবন্ধন ও পাসওয়ার্ড রিসেট এটি দিয়ে হয়)।
3. অ্যাডমিন ইউজার বানিয়ে:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'আপনার-ইমেইল';
   ```
4. `.env.example` দেখে `.env.local` বা Vercel Environment Variables বসান (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`)।
5. `npm install && npm run dev`

ফোন নম্বর, বিকাশ নির্দেশনা, সাধারণ চাঁদা — এগুলো কোডে নয়, অ্যাডমিন → সেটিংসে বদলান।

## ছবি বদলানো
`public/brand/logo.jpg` (লোগো), `public/photos/cover.jpg` (কভার) — একই নামে ফাইল বদলালেই হবে।

## Vercel
GitHub repo ইমপোর্ট করুন, Environment Variables দিন; `main`-এ push করলেই অটো ডিপ্লয়।
