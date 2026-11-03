-- ============================================================
-- FIX — Hapus policy lama lalu buat ulang yang benar
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Hapus policy lama yang mungkin sudah ada ──────────────
drop policy if exists "profiles_select"  on public.profiles;
drop policy if exists "profiles_update"  on public.profiles;
drop policy if exists "profiles_insert"  on public.profiles;

drop policy if exists "posts_select"     on public.posts;
drop policy if exists "posts_insert"     on public.posts;
drop policy if exists "posts_update"     on public.posts;
drop policy if exists "posts_delete"     on public.posts;

drop policy if exists "comments_select"  on public.comments;
drop policy if exists "comments_insert"  on public.comments;
drop policy if exists "comments_delete"  on public.comments;

-- Policy lama dari migration pertama (nama berbeda)
drop policy if exists "Profil bisa dibaca siapa saja"          on public.profiles;
drop policy if exists "Hanya pemilik yang bisa update profil"  on public.profiles;
drop policy if exists "Postingan bisa dibaca siapa saja"       on public.posts;
drop policy if exists "Hanya pemilik yang bisa insert postingan" on public.posts;
drop policy if exists "Hanya pemilik yang bisa update postingan" on public.posts;
drop policy if exists "Hanya pemilik yang bisa hapus postingan"  on public.posts;
drop policy if exists "Komentar bisa dibaca siapa saja"        on public.comments;
drop policy if exists "User login bisa tambah komentar"        on public.comments;
drop policy if exists "Hanya pemilik yang bisa hapus komentar" on public.comments;

-- ── Buat ulang tabel jika belum ada ───────────────────────
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  username      text        unique not null,
  display_name  text        not null default '',
  bio           text        not null default '',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.posts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  type            text        not null check (type in ('video', 'image')),
  file_url        text        not null,
  thumbnail_url   text,
  caption         text        not null default '',
  file_name       text        not null default '',
  file_size       bigint      not null default 0,
  likes_count     integer     not null default 0,
  comments_count  integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)  on delete cascade,
  text       text        not null,
  created_at timestamptz not null default now()
);

-- ── Pastikan RLS aktif ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts     enable row level security;
alter table public.comments  enable row level security;

-- ── Index ─────────────────────────────────────────────────
create index if not exists posts_created_at_idx  on public.posts    (created_at desc);
create index if not exists posts_user_id_idx     on public.posts    (user_id);
create index if not exists comments_post_id_idx  on public.comments (post_id, created_at);

-- ── Policy profiles ───────────────────────────────────────
create policy "profiles_select"
  on public.profiles for select using (true);

create policy "profiles_update"
  on public.profiles for update using (auth.uid() = id);

-- ── Policy posts ──────────────────────────────────────────
-- Semua user yang sudah login bisa baca semua postingan
create policy "posts_select"
  on public.posts for select using (auth.uid() is not null);

create policy "posts_insert"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "posts_update"
  on public.posts for update using (auth.uid() = user_id);

create policy "posts_delete"
  on public.posts for delete using (auth.uid() = user_id);

-- ── Policy comments ───────────────────────────────────────
create policy "comments_select"
  on public.comments for select using (auth.uid() is not null);

create policy "comments_insert"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "comments_delete"
  on public.comments for delete using (auth.uid() = user_id);

-- ── Trigger buat profil otomatis saat sign up ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  email_name text;
begin
  email_name := split_part(new.email, '@', 1);
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    regexp_replace(lower(email_name), '[^a-z0-9_]', '_', 'g'),
    email_name
  )
  on conflict (username) do update
    set username = excluded.username || '_' || floor(random() * 9000 + 1000)::text;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Backfill profil untuk user yang sudah terlanjur login ─
insert into public.profiles (id, username, display_name)
select
  u.id,
  regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]', '_', 'g'),
  split_part(u.email, '@', 1)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (username) do update
  set username = excluded.username || '_' || floor(random() * 9000 + 1000)::text;
