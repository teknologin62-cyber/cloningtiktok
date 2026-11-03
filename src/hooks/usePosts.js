// ============================================================
// usePosts — Hook untuk menyimpan & membaca postingan lokal
// ============================================================
// Menyimpan postingan (video/gambar) ke localStorage sebagai
// data URL sehingga tetap ada setelah refresh.
//
// Setiap postingan menyimpan:
//   id         — unik (timestamp + random)
//   type       — 'video' | 'image'
//   dataUrl    — base64 data URL dari file (preview lokal)
//   caption    — teks caption
//   createdAt  — ISO timestamp
//   fileName   — nama file asli
//   fileSize   — ukuran file (bytes)
//
// Catatan ukuran localStorage: ~5MB per origin.
// File besar (>2MB) akan dikompresi thumbnailnya saja untuk
// menghemat ruang, sementara URL asli disimpan sebagai blob
// di memori selama sesi berlangsung.
// ============================================================

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'vidora_posts';

// ── Baca postingan dari localStorage ──
function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ── Simpan postingan ke localStorage ──
function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return true;
  } catch (e) {
    // QuotaExceededError — localStorage penuh
    console.warn('[usePosts] localStorage penuh, coba hapus postingan lama.', e);
    return false;
  }
}

// ── Buat thumbnail kecil dari video/gambar (canvas) ──
// Mengembalikan Promise<dataUrl|null>
export function generateThumbnail(file, maxSize = 320) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio  = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;

    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.muted    = true;
      video.playsInline = true;
      video.preload  = 'metadata';

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ratio  = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
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

// ── Hook utama ──
export function usePosts() {
  const [posts, setPosts] = useState(loadPosts);

  // Sync ke localStorage setiap kali posts berubah
  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  // ── Tambah postingan baru ──
  const addPost = useCallback(async (file, caption = '') => {
    const thumbnail = await generateThumbnail(file);

    // Simpan blob URL untuk sesi ini (akan hilang saat refresh — wajar)
    // Thumbnail yang kecil (data URL) yang disimpan permanen
    const blobUrl = URL.createObjectURL(file);

    const newPost = {
      id:        `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type:      file.type.startsWith('image/') ? 'image' : 'video',
      thumbnail, // data URL — kecil, aman di localStorage
      blobUrl,   // hanya untuk sesi ini
      caption:   caption.trim(),
      createdAt: new Date().toISOString(),
      fileName:  file.name,
      fileSize:  file.size,
    };

    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  }, []);

  // ── Hapus postingan ──
  const removePost = useCallback((id) => {
    setPosts((prev) => {
      const post = prev.find((p) => p.id === id);
      if (post?.blobUrl) URL.revokeObjectURL(post.blobUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // ── Update caption postingan ──
  const updatePostCaption = useCallback((id, caption) => {
    setPosts((prev) =>
      prev.map((p) => p.id === id ? { ...p, caption: caption.trim() } : p)
    );
  }, []);

  return { posts, addPost, removePost, updatePostCaption };
}
