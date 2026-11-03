// ============================================================
// useFeed — Fetch postingan dari SEMUA user (feed komunitas)
// ============================================================
// - Mengambil postingan terbaru dari tabel public.posts
// - Menyertakan data profil kreator (username, display_name, avatar_url)
// - Berlangganan perubahan real-time (Supabase Realtime)
// - Jika Supabase belum dikonfigurasi, kembalikan array kosong
//   agar VideoFeed tetap menampilkan video mock sebagai fallback
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const PAGE_SIZE = 10; // jumlah postingan per halaman

export function useFeed() {
  const [feedPosts, setFeedPosts]   = useState([]);
  const [loading,   setLoading]     = useState(false);
  const [hasMore,   setHasMore]     = useState(true);
  const [error,     setError]       = useState(null);
  const [page,      setPage]        = useState(0);

  // ── Konversi baris DB → objek yang dipahami PostCard / VideoCard ──
  const mapRow = (row) => ({
    id:           row.id,
    type:         row.type,                        // 'video' | 'image'
    fileUrl:      row.file_url,
    thumbnailUrl: row.thumbnail_url ?? null,
    caption:      row.caption ?? '',
    createdAt:    row.created_at,
    fileName:     row.file_name ?? '',
    fileSize:     row.file_size ?? 0,
    likesCount:   row.likes_count ?? 0,
    commentsCount:row.comments_count ?? 0,
    creator: {
      userId:      row.profiles?.id    ?? row.user_id,
      username:    row.profiles?.username     ?? 'pengguna',
      displayName: row.profiles?.display_name ?? 'Pengguna',
      avatarUrl:   row.profiles?.avatar_url   ?? null,
    },
  });

  // ── Fetch halaman pertama ──
  const fetchFeed = useCallback(async (reset = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    setError(null);

    const from  = reset ? 0 : page * PAGE_SIZE;
    const to    = from + PAGE_SIZE - 1;

    const { data, error: fetchErr } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    setLoading(false);

    if (fetchErr) {
      console.error('[useFeed] fetch error:', fetchErr.message);
      setError(fetchErr.message);
      return;
    }

    const mapped = (data ?? []).map(mapRow);
    setHasMore(mapped.length === PAGE_SIZE);

    if (reset) {
      setFeedPosts(mapped);
      setPage(1);
    } else {
      setFeedPosts((prev) => {
        // Hindari duplikat saat Realtime juga menambah item
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = mapped.filter((p) => !existingIds.has(p.id));
        return [...prev, ...unique];
      });
      setPage((p) => p + 1);
    }
  }, [page]);

  // ── Muat halaman berikutnya ──
  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchFeed(false);
  }, [loading, hasMore, fetchFeed]);

  // ── Refresh dari awal ──
  const refresh = useCallback(() => fetchFeed(true), [fetchFeed]);

  // ── Muat awal ──
  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime — dengarkan postingan baru ──
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          // Ambil data profil kreator untuk postingan baru
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newPost = mapRow({ ...payload.new, profiles: profile });

          setFeedPosts((prev) => {
            // Jangan tambah duplikat
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setFeedPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { feedPosts, loading, error, hasMore, loadMore, refresh };
}
