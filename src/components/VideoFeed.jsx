// ============================================================
// VIDEO FEED — Feed utama aplikasi Vidora
// ============================================================
// Strategi tampilan:
//   1. Jika Supabase terkonfigurasi → tampilkan postingan nyata
//      dari semua user (via useFeed hook)
//   2. Jika Supabase BELUM terkonfigurasi → tampilkan video mock
//      sebagai fallback agar tampilan tidak kosong
//
// Postingan diurutkan terbaru di atas.
// Video tampil full-screen (snap), gambar tampil sebagai card.
// ============================================================

import { useRef, useCallback } from 'react';
import VideoCard from './VideoCard';
import PostCard from './PostCard';
import { videos } from '../data/videos';
import { useFeed } from '../hooks/useFeed';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './VideoFeed.css';

// ── Spinner sederhana untuk loading state ──
function FeedSpinner() {
  return (
    <div className="feed-spinner-wrap" aria-label="Memuat postingan...">
      <div className="spinner" />
      <p className="feed-spinner-text">Memuat postingan...</p>
    </div>
  );
}

// ── Empty state ──
function FeedEmpty() {
  return (
    <div className="feed-empty">
      <p className="feed-empty-title">Belum ada postingan</p>
      <p className="feed-empty-hint">
        Jadilah yang pertama posting! Tekan tombol <strong>+</strong> di bawah.
      </p>
    </div>
  );
}

// ── Error state ──
function FeedError({ message, onRetry }) {
  return (
    <div className="feed-error">
      <p className="feed-error-title">⚠️ Gagal memuat feed</p>
      <p className="feed-error-detail">{message}</p>
      <button className="feed-error-retry" onClick={onRetry}>Coba Lagi</button>
    </div>
  );
}

function VideoFeed() {
  const { feedPosts, loading, error, hasMore, loadMore, refresh } = useFeed();
  const feedRef = useRef(null);

  // ── Infinite scroll: deteksi saat user mendekati bawah ──
  const handleScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el || loading || !hasMore) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300;
    if (nearBottom) loadMore();
  }, [loading, hasMore, loadMore]);

  // ── Fallback: Supabase belum dikonfigurasi → tampilkan mock data ──
  if (!isSupabaseConfigured) {
    return (
      <div className="video-feed">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    );
  }

  // ── Loading awal ──
  if (loading && feedPosts.length === 0) {
    return (
      <div className="video-feed feed--centered">
        <FeedSpinner />
      </div>
    );
  }

  // ── Error awal ──
  if (error && feedPosts.length === 0) {
    return (
      <div className="video-feed feed--centered">
        <FeedError message={error} onRetry={refresh} />
      </div>
    );
  }

  // ── Feed kosong ──
  if (!loading && feedPosts.length === 0) {
    return (
      <div className="video-feed feed--centered">
        <FeedEmpty />
      </div>
    );
  }

  // ── Feed berisi postingan nyata ──
  return (
    <div className="video-feed" ref={feedRef} onScroll={handleScroll}>
      {feedPosts.map((post) => (
        // Semua postingan dari DB ditampilkan via PostCard
        // (PostCard menangani baik video maupun gambar)
        <PostCard key={post.id} post={post} />
      ))}

      {/* Indikator loading halaman berikutnya */}
      {loading && feedPosts.length > 0 && (
        <div className="feed-load-more" aria-label="Memuat lebih banyak...">
          <div className="spinner" />
        </div>
      )}

      {/* Tidak ada postingan lagi */}
      {!hasMore && feedPosts.length > 0 && (
        <div className="feed-end">
          <p>Kamu sudah melihat semua postingan 🎉</p>
        </div>
      )}
    </div>
  );
}

export default VideoFeed;
