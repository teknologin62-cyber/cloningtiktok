-- ============================================================
-- MIGRASI AWAL — Tabel posts dan profiles
-- Salin & jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Tabel profil pengguna ──────────────────────────────
-- Dibuat otomatis saat user sign up lewat trigger di bawah.
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  username      text        unique not null,
  display_name  text        not null default '',
  bio           text        not null default '',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

-- Semua orang bisa baca profil (feed publik)
create policy "Profil bisa dibaca siapa saja"
  on public.profiles for select using (true);

-- Hanya pemilik yang bisa update profil sendiri
create policy "Hanya pemilik yang bisa update profil"
  on public.profiles for update using (auth.uid() = id);

-- ── 2. Trigger — buat profil otomatis saat sign up ──────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  email_name text;
begin
  -- Ambil bagian sebelum @ dari email
  email_name := split_part(new.email, '@', 1);
  -- Buat username unik dengan menambah suffix angka jika perlu
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

-- ── 3. Tabel postingan ────────────────────────────────────
create table if not exists public.posts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  type            text        not null check (type in ('video', 'image')),
  file_url        text        not null,          -- URL publik dari Supabase Storage
  thumbnail_url   text,                          -- URL thumbnail (gambar kecil)
  caption         text        not null default '',
  file_name       text        not null default '',
  file_size       bigint      not null default 0,
  likes_count     integer     not null default 0,
  comments_count  integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index untuk urutan terbaru
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx    on public.posts (user_id);

-- Row Level Security
alter table public.posts enable row level security;

-- Semua orang (yang login) bisa baca semua postingan
create policy "Postingan bisa dibaca siapa saja"
  on public.posts for select using (auth.role() = 'authenticated');

-- Hanya pemilik yang bisa insert postingan sendiri
create policy "Hanya pemilik yang bisa insert postingan"
  on public.posts for insert with check (auth.uid() = user_id);

-- Hanya pemilik yang bisa update postingan sendiri
create policy "Hanya pemilik yang bisa update postingan"
  on public.posts for update using (auth.uid() = user_id);

-- Hanya pemilik yang bisa hapus postingan sendiri
create policy "Hanya pemilik yang bisa hapus postingan"
  on public.posts for delete using (auth.uid() = user_id);

-- ── 4. Storage bucket ─────────────────────────────────────
-- Buat bucket "vidora-posts" di: Storage → New Bucket
-- Name   : vidora-posts
-- Public : YES (centang "Public bucket")
--
-- Lalu tambahkan policy ini di Storage → Policies → vidora-posts:
--
-- INSERT: authenticated users only
-- SELECT: public (everyone)
-- DELETE: owner only (storage.foldername(name)[1] = auth.uid()::text)

-- ── 5. Tabel komentar ─────────────────────────────────────
create table if not exists public.comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)  on delete cascade,
  text       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "Komentar bisa dibaca siapa saja"
  on public.comments for select using (auth.role() = 'authenticated');

create policy "User login bisa tambah komentar"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Hanya pemilik yang bisa hapus komentar"
  on public.comments for delete using (auth.uid() = user_id);
