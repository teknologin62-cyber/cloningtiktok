-- ============================================================
-- Tabel likes dan bookmarks
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tabel likes ───────────────────────────────────────────
create table if not exists public.likes (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)   on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)   -- satu user hanya bisa like sekali per post
);

alter table public.likes enable row level security;

create policy "likes_select"
  on public.likes for select using (auth.uid() is not null);

create policy "likes_insert"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "likes_delete"
  on public.likes for delete using (auth.uid() = user_id);

-- ── Tabel bookmarks ───────────────────────────────────────
create table if not exists public.bookmarks (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)   on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select"
  on public.bookmarks for select using (auth.uid() is not null);

create policy "bookmarks_insert"
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "bookmarks_delete"
  on public.bookmarks for delete using (auth.uid() = user_id);

-- ── Update likes_count otomatis via trigger ───────────────
create or replace function public.update_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_like_change on public.likes;
create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.update_likes_count();

-- ── Update comments_count otomatis via trigger ────────────
create or replace function public.update_comments_count()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_comment_change on public.comments;
create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.update_comments_count();
