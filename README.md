# গোদনাইল আলোকিত যুব শক্তি — ওয়েব অ্যাপ

আর্তমানবতার সেবায় নিয়োজিত স্বেচ্ছাসেবী অরাজনৈতিক যুব সংগঠনের ওয়েবসাইট ও ম্যানেজমেন্ট সিস্টেম।

## কী কী আছে
- **পাবলিক:** হোম, কার্যক্রম/নোটিশ (ফেসবুক-হোয়াটসঅ্যাপে শেয়ার), রক্তদাতা তালিকা, স্বচ্ছ হিসাব, সদস্য আবেদন, "আমার বকেয়া" (মোবাইল নম্বর দিয়ে)
- **অ্যাডমিন (`/admin`):** সদস্য অনুমোদন ও ইমপোর্ট, মাসিক চাঁদা আদায়, হোয়াটসঅ্যাপ রিমাইন্ডার, বকেয়া তালিকা কপি, খরচ ও অনুদান, পোস্ট প্রকাশ

## সেটআপ
1. [Supabase](https://supabase.com)-এ নতুন প্রজেক্ট খুলুন → SQL Editor-এ `supabase/schema.sql` পুরোটা Run করুন।
2. Authentication > Users থেকে একটি ইউজার বানান, তারপর SQL Editor-এ:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'আপনার-ইমেইল';
   ```
3. `.env.example` দেখে `.env.local` (লোকালে) বা Vercel > Settings > Environment Variables-এ মান বসান।
4. `npm install && npm run dev`

## Vercel-এ হোস্ট
Vercel-এ এই GitHub repo ইমপোর্ট করুন, উপরের Environment Variables দিন, Deploy চাপুন।
