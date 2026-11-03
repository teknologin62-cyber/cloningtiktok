// ============================================================
// useInteractions — Kelola likes, bookmarks, dan comments
// per postingan dengan Supabase sebagai backend
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useInteractions(postId) {
  const [userId,     setUserId]     = useState(null);
  const [liked,      setLiked]      = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount,  setLikeCount]  = useState(0);
  const [comments,   setComments]   = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // ── Ambil userId dari sesi aktif ──
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // ── Cek apakah user sudah like / bookmark postingan ini ──
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !userId || !postId) return;

    // Cek like
    supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));

    // Cek bookmark
    supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setBookmarked(!!data));

    // Ambil jumlah like
    supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single()
      .then(({ data }) => { if (data) setLikeCount(data.likes_count); });

  }, [userId, postId]);

  // ── Toggle like ──────────────────────────────────────────
  const toggleLike = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !userId) {
      // Fallback offline — hanya update UI
      setLiked((l) => !l);
      setLikeCount((c) => liked ? Math.max(c - 1, 0) : c + 1);
      return;
    }

    if (liked) {
      // Hapus like
      setLiked(false);
      setLikeCount((c) => Math.max(c - 1, 0));
      await supabase.from('likes').delete()
        .eq('post_id', postId).eq('user_id', userId);
    } else {
      // Tambah like
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    }
  }, [liked, postId, userId]);

  // ── Toggle bookmark ──────────────────────────────────────
  const toggleBookmark = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !userId) {
      setBookmarked((b) => !b);
      return;
    }

    if (bookmarked) {
      setBookmarked(false);
      await supabase.from('bookmarks').delete()
        .eq('post_id', postId).eq('user_id', userId);
    } else {
      setBookmarked(true);
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId });
    }
  }, [bookmarked, postId, userId]);

  // ── Fetch komentar ───────────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !postId) return;
    setCommentsLoading(true);

    const { data, error } = await supabase
      .from('comments')
      .select('id, text, created_at, user_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) { setCommentsLoading(false); return; }

    // Ambil profil untuk semua user_id komentar
    const userIds = [...new Set((data ?? []).map((c) => c.user_id))];
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);
      if (profs) profilesMap = Object.fromEntries(profs.map((p) => [p.id, p]));
    }

    setComments(
      (data ?? []).map((c) => ({
        id:       c.id,
        userId:   c.user_id,
        username: profilesMap[c.user_id]?.username     ?? 'pengguna',
        name:     profilesMap[c.user_id]?.display_name ?? 'Pengguna',
        text:     c.text,
        time:     formatRelativeTime(c.created_at),
        isOwn:    c.user_id === userId,
      }))
    );
    setCommentsLoading(false);
  }, [postId, userId]);

  // ── Kirim komentar baru ──────────────────────────────────
  const addComment = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!isSupabaseConfigured || !supabase || !userId) {
      // Fallback offline
      setComments((prev) => [...prev, {
        id: `local_${Date.now()}`, userId, username: 'kamu',
        name: 'Kamu', text: trimmed, time: 'Baru saja', isOwn: true,
      }]);
      return;
    }

    // Optimistic insert
    const tempId = `temp_${Date.now()}`;
    setComments((prev) => [...prev, {
      id: tempId, userId, username: '...', name: '...',
      text: trimmed, time: 'Baru saja', isOwn: true, pending: true,
    }]);

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, text: trimmed })
      .select('id, text, created_at, user_id')
      .single();

    if (error) {
      // Hapus optimistic jika gagal
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      console.error('[useInteractions] addComment error:', error.message);
      return;
    }

    // Ganti temp dengan data resmi
    const { data: prof } = await supabase
      .from('profiles').select('username, display_name').eq('id', userId).single();

    setComments((prev) => prev.map((c) =>
      c.id === tempId ? {
        id:       data.id,
        userId,
        username: prof?.username     ?? 'kamu',
        name:     prof?.display_name ?? 'Kamu',
        text:     data.text,
        time:     'Baru saja',
        isOwn:    true,
      } : c
    ));
  }, [postId, userId]);

  // ── Hapus komentar ───────────────────────────────────────
  const deleteComment = useCallback(async (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('comments').delete().eq('id', commentId);
    }
  }, []);

  return {
    liked, bookmarked, likeCount, comments, commentsLoading,
    toggleLike, toggleBookmark, fetchComments, addComment, deleteComment,
  };
}

// ── Helper waktu relatif ──
function formatRelativeTime(iso) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'Baru saja';
  if (hours <  1) return `${mins} mnt lalu`;
  if (days  <  1) return `${hours} jam lalu`;
  if (days  < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
