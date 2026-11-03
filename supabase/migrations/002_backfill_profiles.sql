-- ============================================================
-- BACKFILL — Buat profil untuk user yang sudah terlanjur login
-- Jalankan SETELAH migration 001_init.sql berhasil
-- ============================================================

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
