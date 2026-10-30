// ============================================================
// VIDEO CARD - Satu kartu video di dalam feed
// ============================================================
// Menampilkan satu video beserta semua interaksi:
//   - Putar/jeda otomatis via IntersectionObserver
//   - Ketuk area video untuk putar/jeda
//   - Kontrol suara (pojok kanan atas)
//   - Spinner loading & pesan error spesifik
//   - Suka (toggle merah)
//   - Komentar (buka CommentModal)
//   - Bookmark (toggle emas)
//   - Bagikan (Web Share API / salin tautan)
//   - Toast notifikasi ringan (salin tautan)
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import CreatorInfo from './CreatorInfo';
import InteractionBar from './InteractionBar';
import CommentModal from './CommentModal';
import { PlayIcon, VolumeOnIcon, VolumeOffIcon } from './icons';
import './VideoCard.css';

// Terjemahkan kode MediaError ke pesan yang mudah dipahami
function getErrorMessage(videoEl) {
  if (!videoEl?.error) return 'Error tidak diketahui';
  const messages = {
    1: 'Pemuatan dihentikan (MEDIA_ERR_ABORTED)',
    2: 'Koneksi jaringan bermasalah (MEDIA_ERR_NETWORK)',
    3: 'Format video tidak didukung browser (MEDIA_ERR_DECODE)',
    4: 'URL tidak dapat diakses (MEDIA_ERR_SRC_NOT_SUPPORTED)',
  };
  return messages[videoEl.error.code] || `MediaError code: ${videoEl.error.code}`;
}

function VideoCard({ video }) {
  // --- State interaksi ---
  const [liked,        setLiked]        = useState(false);
  const [bookmarked,   setBookmarked]   = useState(false);
  const [showComments, setShowComments] = useState(false);

  // --- State pemutar ---
  const [isPaused,  setIsPaused]  = useState(true);
  const [isMuted,   setIsMuted]   = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg,  setErrorMsg]  = useState(null);

  // --- State toast (notifikasi salin tautan) ---
  const [toast, setToast] = useState('');

  // --- Referensi DOM ---
  const videoRef = useRef(null);
  const cardRef  = useRef(null);
  const toastTimer = useRef(null);

  // ----------------------------------------------------------------
  // DENGARKAN EVENT TOAST (dikirim dari InteractionBar saat salin tautan)
  // ----------------------------------------------------------------
  useEffect(() => {
    const handleToast = (e) => {
      setToast(e.detail.message);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 2800);
    };
    window.addEventListener('vidora:toast', handleToast);
    return () => {
      window.removeEventListener('vidora:toast', handleToast);
      clearTimeout(toastTimer.current);
    };
  }, []);

  // ----------------------------------------------------------------
  // PUTAR / JEDA OTOMATIS (IntersectionObserver)
  // ----------------------------------------------------------------
  useEffect(() => {
    const videoEl = videoRef.current;
    const card    = cardRef.current;
    if (!videoEl || !card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play()
              .then(() => setIsPaused(false))
              .catch((err) => {
                console.warn(`[Vidora] Autoplay diblokir #${video.id}:`, err.message);
                setIsPaused(true);
              });
          } else {
            videoEl.pause();
            videoEl.currentTime = 0;
            setIsPaused(true);
            // Tutup modal komentar saat video tidak aktif
            setShowComments(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [video.id]);

  // Sinkronisasi muted ke elemen video
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // ----------------------------------------------------------------
  // KETUK VIDEO untuk putar/jeda
  // ----------------------------------------------------------------
  const handleTap = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl || errorMsg || showComments) return;
    if (videoEl.paused) {
      videoEl.play().then(() => setIsPaused(false)).catch(() => {});
    } else {
      videoEl.pause();
      setIsPaused(true);
    }
  }, [errorMsg, showComments]);

  // ----------------------------------------------------------------
  // KONTROL SUARA
  // ----------------------------------------------------------------
  const handleToggleMute = useCallback((e) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  }, []);

  // ----------------------------------------------------------------
  // EVENT VIDEO
  // ----------------------------------------------------------------
  const handleLoadStart = () => { setIsLoading(true); setErrorMsg(null); };
  const handleWaiting   = () => setIsLoading(true);
  const handleCanPlay   = () => setIsLoading(false);
  const handlePlaying   = () => { setIsLoading(false); setIsPaused(false); };
  const handleError     = (e) => {
    const videoEl = e.currentTarget;
    const msg     = getErrorMessage(videoEl);
    console.error(`[Vidora] Gagal memuat video #${video.id}`);
    console.error(`  URL  : ${videoEl.currentSrc || video.videoUrl}`);
    console.error(`  Error: ${msg}`);
    setIsLoading(false);
    setErrorMsg(msg);
  };

  // Jumlah dinamis berdasarkan state
  const likeCount     = liked      ? video.stats.likes     + 1 : video.stats.likes;
  const bookmarkCount = bookmarked ? video.stats.bookmarks + 1 : video.stats.bookmarks;
  const commentCount  = video.stats.comments;

  return (
    <article className="video-card" ref={cardRef} onClick={handleTap}>

      {/* 1. Latar gradien (fallback) */}
      <div className="video-bg" style={{ background: video.posterGradient }} />

      {/* 2. Elemen video — selalu di-render agar ref valid */}
      <video
        ref={videoRef}
        className={`video-player${errorMsg ? ' video-hidden' : ''}`}
        src={video.videoUrl}
        loop
        muted
        playsInline
        preload="metadata"
        onLoadStart={handleLoadStart}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onPlaying={handlePlaying}
        onError={handleError}
      />

      {/* 3. Spinner loading */}
      {isLoading && !errorMsg && (
        <div className="video-loading" aria-label="Memuat video...">
          <div className="spinner" />
        </div>
      )}

      {/* 4. Pesan error spesifik */}
      {errorMsg && (
        <div className="video-error">
          <span className="video-error-icon">⚠️</span>
          <p className="video-error-title">Video tidak dapat dimuat</p>
          <p className="video-error-detail">{errorMsg}</p>
          <p className="video-error-hint">Buka DevTools (F12) → Console untuk detail</p>
        </div>
      )}

      {/* 5. Indikator jeda */}
      {isPaused && !isLoading && !errorMsg && (
        <div className="play-indicator" aria-hidden="true">
          <PlayIcon size={64} />
        </div>
      )}

      {/* 6. Gradien gelap bawah */}
      <div className="video-overlay" />

      {/* 7. Tombol suara */}
      {!errorMsg && (
        <button
          className="volume-btn"
          onClick={handleToggleMute}
          aria-label={isMuted ? 'Aktifkan suara' : 'Matikan suara'}
        >
          {isMuted ? <VolumeOffIcon size={20} /> : <VolumeOnIcon size={20} />}
        </button>
      )}

      {/* 8. Info kreator */}
      <CreatorInfo video={video} />

      {/* 9. Tombol interaksi */}
      <InteractionBar
        liked={liked}
        bookmarked={bookmarked}
        likeCount={likeCount}
        commentCount={commentCount}
        bookmarkCount={bookmarkCount}
        shareCount={video.stats.shares}
        shareUrl={video.shareUrl}
        shareTitle={video.creator.username + ': ' + video.caption}
        onLike={() => setLiked((prev) => !prev)}
        onBookmark={() => setBookmarked((prev) => !prev)}
        onComment={() => setShowComments(true)}
      />

      {/* 10. Modal komentar */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        video={video}
      />

      {/* 11. Toast notifikasi (salin tautan) */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

    </article>
  );
}

export default VideoCard;
