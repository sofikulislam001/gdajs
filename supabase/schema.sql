-- গোদনাইল আলোকিত যুব শক্তি — database schema
-- Supabase Dashboard > SQL Editor-এ পুরোটা পেস্ট করে একবার Run করুন।

create extension if not exists pgcrypto;

-- ───────────── অ্যাডমিন ─────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security; -- কোনো policy নেই = সরাসরি কেউ পড়তে পারে না

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ───────────── সদস্য ─────────────
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  address text,
  profession text,
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  last_blood_donation date,
  show_in_blood_list boolean not null default true,
  monthly_fee integer not null default 100 check (monthly_fee >= 0),
  status text not null default 'pending' check (status in ('pending','active','inactive')),
  joined_on date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.members enable row level security;

drop policy if exists "admin full access members" on public.members;
create policy "admin full access members" on public.members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can apply" on public.members;
create policy "anyone can apply" on public.members
  for insert to anon, authenticated with check (status = 'pending');

-- ───────────── মাসিক চাঁদা ─────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date), -- মাসের ১ তারিখ
  amount integer not null check (amount > 0),
  paid_on date not null default current_date,
  method text not null default 'নগদ',
  note text,
  created_at timestamptz not null default now(),
  unique (member_id, month)
);
alter table public.payments enable row level security;

drop policy if exists "admin full access payments" on public.payments;
create policy "admin full access payments" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── অনুদান (সদস্য নন এমন মানুষের কাছ থেকে) ─────────────
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  amount integer not null check (amount > 0),
  received_on date not null default current_date,
  purpose text,
  created_at timestamptz not null default now()
);
alter table public.donations enable row level security;

drop policy if exists "admin full access donations" on public.donations;
create policy "admin full access donations" on public.donations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── খরচ (সবাই দেখতে পারবে — স্বচ্ছতা) ─────────────
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount integer not null check (amount > 0),
  spent_on date not null default current_date,
  category text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;

drop policy if exists "public read expenses" on public.expenses;
create policy "public read expenses" on public.expenses
  for select to anon, authenticated using (true);

drop policy if exists "admin write expenses" on public.expenses;
create policy "admin write expenses" on public.expenses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── কার্যক্রম ও নোটিশ ─────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'event' check (kind in ('event','notice')),
  category text not null default 'other' check (category in ('blood','relief','education','youth','health','other')),
  title text not null,
  description text,
  event_date date not null default current_date,
  location text,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;

drop policy if exists "public read published events" on public.events;
create policy "public read published events" on public.events
  for select to anon, authenticated using (published = true or public.is_admin());

drop policy if exists "admin write events" on public.events;
create policy "admin write events" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── সবার জন্য খোলা ফাংশন (সদস্যের ব্যক্তিগত তথ্য ফাঁস না করে) ─────────────

-- হোমপেজের সংখ্যা
create or replace function public.get_public_stats()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'members',  (select count(*) from public.members where status = 'active'),
    'donors',   (select count(*) from public.members where status = 'active' and blood_group is not null and show_in_blood_list),
    'events',   (select count(*) from public.events where kind = 'event' and published),
    'income',   coalesce((select sum(amount) from public.payments), 0) + coalesce((select sum(amount) from public.donations), 0),
    'expense',  coalesce((select sum(amount) from public.expenses), 0)
  );
$$;

-- রক্তদাতা তালিকা (শুধু যারা নিজে রাজি হয়েছেন)
create or replace function public.get_blood_donors(p_group text default null)
returns table (name text, blood_group text, address text, phone text, last_blood_donation date, available boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.name, m.blood_group, m.address, m.phone, m.last_blood_donation,
         (m.last_blood_donation is null or m.last_blood_donation <= current_date - 120) as available
  from public.members m
  where m.status = 'active'
    and m.show_in_blood_list
    and m.blood_group is not null
    and (p_group is null or p_group = '' or m.blood_group = p_group)
  order by available desc, m.name;
$$;

-- মাসওয়ারি আয় (চাঁদা + অনুদান)
create or replace function public.get_monthly_income()
returns table (month date, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select m as month, sum(a)::bigint as total from (
    select month as m, amount as a from public.payments
    union all
    select date_trunc('month', received_on)::date as m, amount as a from public.donations
  ) t
  group by m
  order by m desc
  limit 24;
$$;

-- নিজের বকেয়া দেখা (মোবাইল নম্বর দিয়ে)
create or replace function public.check_dues(p_phone text)
returns table (name text, monthly_fee integer, joined_on date, months_expected integer, months_paid integer, months_due integer, due_amount integer, last_paid_month date)
language sql
stable
security definer
set search_path = ''
as $$
  with m as (
    select * from public.members where phone = p_phone and status = 'active' limit 1
  ),
  span as (
    select m.*,
      ((extract(year from age(date_trunc('month', current_date), date_trunc('month', m.joined_on)))::int * 12)
       + extract(month from age(date_trunc('month', current_date), date_trunc('month', m.joined_on)))::int + 1) as expected
    from m
  ),
  paid as (
    select count(*)::int as c, max(p.month) as last_m
    from public.payments p join m on p.member_id = m.id
    where p.month >= date_trunc('month', m.joined_on)::date
  )
  select span.name, span.monthly_fee, span.joined_on, span.expected,
         paid.c,
         greatest(span.expected - paid.c, 0),
         greatest(span.expected - paid.c, 0) * span.monthly_fee,
         paid.last_m
  from span, paid;
$$;

revoke execute on function public.get_public_stats() from public;
revoke execute on function public.get_blood_donors(text) from public;
revoke execute on function public.get_monthly_income() from public;
revoke execute on function public.check_dues(text) from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.get_public_stats() to anon, authenticated;
grant execute on function public.get_blood_donors(text) to anon, authenticated;
grant execute on function public.get_monthly_income() to anon, authenticated;
grant execute on function public.check_dues(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ───────────── ফেসবুক পোস্ট কার্ড ─────────────
create table if not exists public.fb_posts (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  preview text,
  image_url text,
  posted_on date not null default current_date,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.fb_posts enable row level security;

drop policy if exists "public read fb posts" on public.fb_posts;
create policy "public read fb posts" on public.fb_posts
  for select to anon, authenticated using (published = true or public.is_admin());

drop policy if exists "admin write fb posts" on public.fb_posts;
create policy "admin write fb posts" on public.fb_posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── ছবি রাখার জায়গা (Storage) ─────────────
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ───────────── প্রথম অ্যাডমিন বানানো ─────────────
-- ১) Supabase > Authentication > Users থেকে একটি ইউজার (ইমেইল + পাসওয়ার্ড) তৈরি করুন।
-- ২) নিচের লাইনে ইমেইল বদলে আলাদা করে Run করুন:
--    insert into public.admins (user_id) select id from auth.users where email = 'আপনার-ইমেইল@example.com';
