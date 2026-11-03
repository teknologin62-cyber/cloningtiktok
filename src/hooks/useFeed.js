// ============================================================
// useFeed — Fetch postingan dari SEMUA user (feed komunitas)
// ============================================================
// Strategi query: dua langkah terpisah untuk menghindari
// masalah relationship cache PostgREST:
//   1. Fetch posts (urut terbaru, paginasi)
//   2. Fetch profiles berdasarkan user_id yang ada di hasil posts
// Digabung di sisi klien sebelum di-render.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const PAGE_SIZE = 10;

export function useFeed() {
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [hasMore,   setHasMore]   = useState(true);
  const [error,     setError]     = useState(null);
  const pageRef = useRef(0); // pakai ref agar tidak trigger re-render

  // ── Gabungkan posts + profiles ────────────────────────────
  const mergePosts = (posts, profilesMap) =>
    posts.map((row) => {
      const prof = profilesMap[row.user_id] ?? {};
      return {
        id:            row.id,
        type:          row.type,
        fileUrl:       row.file_url,
        thumbnailUrl:  row.thumbnail_url ?? null,
        caption:       row.caption ?? '',
        createdAt:     row.created_at,
        fileName:      row.file_name ?? '',
        fileSize:      row.file_size ?? 0,
        likesCount:    row.likes_count ?? 0,
        commentsCount: row.comments_count ?? 0,
        creator: {
          userId:      row.user_id,
          username:    prof.username     ?? 'pengguna',
          displayName: prof.display_name ?? 'Pengguna',
          avatarUrl:   prof.avatar_url   ?? null,
        },
      };
    });

  // ── Fetch satu halaman posts ──────────────────────────────
  const fetchPage = useCallback(async (reset = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    setError(null);

    const from = reset ? 0 : pageRef.current * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    // 1. Ambil posts
    const { data: postsData, error: postsErr } = await supabase
      .from('posts')
      .select('id, user_id, type, file_url, thumbnail_url, caption, file_name, file_size, likes_count, comments_count, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postsErr) {
      console.error('[useFeed] posts error:', postsErr.message);
      setError(postsErr.message);
      setLoading(false);
      return;
    }

    const rows = postsData ?? [];

    // 2. Ambil profiles untuk user_id yang unik
    let profilesMap = {};
    if (rows.length > 0) {
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (!profErr && profData) {
        profilesMap = Object.fromEntries(profData.map((p) => [p.id, p]));
      }
    }

    const mapped  = mergePosts(rows, profilesMap);
    const newPage = reset ? 1 : pageRef.current + 1;
    pageRef.current = newPage;
    setHasMore(rows.length === PAGE_SIZE);

    setFeedPosts((prev) => {
      if (reset) return mapped;
      const existingIds = new Set(prev.map((p) => p.id));
      return [...prev, ...mapped.filter((p) => !existingIds.has(p.id))];
    });

    setLoading(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(false);
  }, [loading, hasMore, fetchPage]);

  const refresh = useCallback(() => {
    pageRef.current = 0;
    fetchPage(true);
  }, [fetchPage]);

  // ── Muat awal ─────────────────────────────────────────────
  useEffect(() => {
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime — dengarkan postingan baru / hapus / update ──
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('feed:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          // Ambil profil kreator secara terpisah
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newPost = mergePosts([payload.new], { [payload.new.user_id]: prof })[0];

          setFeedPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setFeedPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setFeedPosts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id
                ? { ...p, caption: payload.new.caption, likesCount: payload.new.likes_count }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { feedPosts, loading, error, hasMore, loadMore, refresh };
}
