-- ============================================================
-- FIX: Tambah foreign key posts.user_id → profiles.id
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- Tambah FK dari posts.user_id ke profiles.id
-- agar PostgREST bisa resolve relationship untuk embedded select
alter table public.posts
  add constraint if not exists fk_posts_profiles
  foreign key (user_id) references public.profiles(id) on delete cascade;
