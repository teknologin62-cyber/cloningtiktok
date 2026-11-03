// ============================================================
// usePosts — Hook untuk menyimpan postingan milik user sendiri
// ============================================================
// Strategi penyimpanan:
//   1. Jika Supabase terkonfigurasi:
//      - Upload file ke Supabase Storage (bucket: vidora-posts)
//      - Insert baris ke tabel public.posts
//      - Postingan tersimpan permanen dan tampil di feed komunitas
//   2. Jika Supabase BELUM terkonfigurasi (fallback):
//      - Simpan thumbnail ke localStorage saja
//      - Postingan hanya tampil di profil sendiri
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY  = 'vidora_posts';
const BUCKET_NAME  = 'vidora-posts';

// ── Baca postingan lokal dari localStorage ──
function loadLocalPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Simpan postingan lokal ke localStorage ──
function saveLocalPosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('[usePosts] localStorage penuh:', e.message);
  }
}

// ── Buat thumbnail kecil dari video/gambar via Canvas ──
export function generateThumbnail(file, maxSize = 320) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio  = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;

    } else if (file.type.startsWith('video/')) {
      const video        = document.createElement('video');
      video.muted        = true;
      video.playsInline  = true;
      video.preload      = 'metadata';
      video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1); };
      video.onseeked     = () => {
        const canvas = document.createElement('canvas');
        const ratio  = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1);
        canvas.width  = Math.round(video.videoWidth  * ratio);
        canvas.height = Math.round(video.videoHeight * ratio);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      video.src = url;

    } else {
      URL.revokeObjectURL(url);
      resolve(null);
    }
  });
}

// ── Konversi data URL ke Blob (untuk upload thumbnail) ──
function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── Hook utama ──
export function usePosts() {
  // Postingan milik user sendiri (lokal + yang sudah diupload)
  const [posts,    setPosts]   = useState(loadLocalPosts);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync ke localStorage setiap posts berubah
  useEffect(() => { saveLocalPosts(posts); }, [posts]);

  // ── Ambil postingan user dari Supabase (jika sudah terkonfigurasi) ──
  const fetchMyPosts = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) { console.warn('[usePosts] fetchMyPosts error:', error.message); return; }

    // Konversi baris DB → format yang dipahami ProfilePage
    const dbPosts = (data ?? []).map((row) => ({
      id:          row.id,
      type:        row.type,
      thumbnail:   row.thumbnail_url ?? null,
      blobUrl:     row.file_url,          // URL publik Storage — tidak hilang saat refresh
      caption:     row.caption,
      createdAt:   row.created_at,
      fileName:    row.file_name,
      fileSize:    row.file_size,
      fromSupabase: true,
    }));

    setPosts(dbPosts);
    saveLocalPosts(dbPosts);
  }, []);

  useEffect(() => { fetchMyPosts(); }, [fetchMyPosts]);

  // ── Tambah postingan baru ──────────────────────────────────
  const addPost = useCallback(async (file, caption = '') => {
    setIsSyncing(true);
    const thumbnail = await generateThumbnail(file);
    const blobUrl   = URL.createObjectURL(file);
    const type      = file.type.startsWith('image/') ? 'image' : 'video';

    // Postingan optimistis (tampil langsung di profil)
    const tempId   = `temp_${Date.now()}`;
    const tempPost = {
      id: tempId, type, thumbnail, blobUrl,
      caption: caption.trim(),
      createdAt: new Date().toISOString(),
      fileName:  file.name,
      fileSize:  file.size,
      pending:   true,
    };
    setPosts((prev) => [tempPost, ...prev]);

    // ── Upload ke Supabase ──
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Tidak ada sesi aktif');

        const userId    = session.user.id;
        const ext       = file.name.split('.').pop();
        const filePath  = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const thumbPath = filePath.replace(`.${ext}`, '_thumb.jpg');

        // 1. Upload file utama
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, { upsert: false });
        if (uploadErr) throw uploadErr;

        // 2. Upload thumbnail (jika berhasil di-generate)
        let thumbnailUrl = null;
        if (thumbnail) {
          const thumbBlob = dataUrlToBlob(thumbnail);
          const { error: thumbErr } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: false });
          if (!thumbErr) {
            const { data: thumbData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(thumbPath);
            thumbnailUrl = thumbData?.publicUrl ?? null;
          }
        }

        // 3. Ambil URL publik file utama
        const { data: fileData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
        const fileUrl = fileData?.publicUrl ?? blobUrl;

        // 4. Insert baris ke tabel posts
        const { data: row, error: insertErr } = await supabase
          .from('posts')
          .insert({
            user_id:       userId,
            type,
            file_url:      fileUrl,
            thumbnail_url: thumbnailUrl,
            caption:       caption.trim(),
            file_name:     file.name,
            file_size:     file.size,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;

        // 5. Ganti post sementara dengan data resmi dari DB
        const savedPost = {
          id:           row.id,
          type:         row.type,
          thumbnail:    row.thumbnail_url ?? thumbnail,
          blobUrl:      row.file_url,
          caption:      row.caption,
          createdAt:    row.created_at,
          fileName:     row.file_name,
          fileSize:     row.file_size,
          fromSupabase: true,
        };
        setPosts((prev) => prev.map((p) => p.id === tempId ? savedPost : p));
        setIsSyncing(false);
        return savedPost;

      } catch (err) {
        console.error('[usePosts] upload gagal:', err.message);
        // Tandai post sebagai gagal (tapi tetap tampil di profil secara lokal)
        setPosts((prev) => prev.map((p) =>
          p.id === tempId ? { ...p, pending: false, error: true } : p
        ));
        setIsSyncing(false);
        return tempPost;
      }
    }

    // Fallback: hanya simpan lokal
    const localPost = { ...tempPost, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, pending: false };
    setPosts((prev) => prev.map((p) => p.id === tempId ? localPost : p));
    setIsSyncing(false);
    return localPost;
  }, []);

  // ── Hapus postingan ──────────────────────────────────────
  const removePost = useCallback(async (id) => {
    const post = posts.find((p) => p.id === id);

    // Hapus dari Supabase jika online
    if (post?.fromSupabase && isSupabaseConfigured && supabase) {
      await supabase.from('posts').delete().eq('id', id);
    }

    if (post?.blobUrl && !post.fromSupabase) URL.revokeObjectURL(post.blobUrl);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, [posts]);

  // ── Update caption ───────────────────────────────────────
  const updatePostCaption = useCallback(async (id, caption) => {
    const post = posts.find((p) => p.id === id);
    if (post?.fromSupabase && isSupabaseConfigured && supabase) {
      await supabase.from('posts').update({ caption: caption.trim() }).eq('id', id);
    }
    setPosts((prev) =>
      prev.map((p) => p.id === id ? { ...p, caption: caption.trim() } : p)
    );
  }, [posts]);

  return { posts, isSyncing, addPost, removePost, updatePostCaption, refreshPosts: fetchMyPosts };
}
