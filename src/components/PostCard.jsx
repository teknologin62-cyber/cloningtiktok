// ============================================================
// POST CARD — Kartu postingan (video / gambar) dari komunitas
// Likes, bookmarks, dan komentar disimpan ke Supabase.
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  HeartIcon, CommentIcon, BookmarkIcon, ShareIcon,
  PlayIcon, VolumeOnIcon, VolumeOffIcon,
} from './icons';
import { formatCount } from '../data/videos';
import CommentModal from './CommentModal';
import { useInteractions } from '../hooks/useInteractions';
import './PostCard.css';

// ── Gradien fallback avatar ──
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];
function avatarGradient(userId = '') {
  const code = userId.charCodeAt(userId.length - 1) || 0;
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

function CreatorAvatar({ creator, size = 44 }) {
  if (creator?.avatarUrl) {
    return (
      <img src={creator.avatarUrl} alt={creator.displayName}
        className="postcard-avatar-img" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="postcard-avatar-initials"
      style={{ width: size, height: size, background: avatarGradient(creator?.userId) }}
      aria-label={`Avatar ${creator?.displayName}`}>
      {(creator?.displayName?.[0] ?? '?').toUpperCase()}
    </div>
  );
}

// ── PostCard utama ──
function PostCard({ post }) {
  // ── Interaksi tersimpan (Supabase) ──
  const {
    liked, bookmarked, likeCount,
    comments, commentsLoading,
    toggleLike, toggleBookmark,
    fetchComments, addComment, deleteComment,
  } = useInteractions(post.id);

  const [showComments, setShowComments] = useState(false);

  // ── State pemutar (video) ──
  const [isPaused,  setIsPaused]  = useState(true);
  const [isMuted,   setIsMuted]   = useState(true);
  const [isLoading, setIsLoading] = useState(post.type === 'video');
  const [hasError,  setHasError]  = useState(false);

  // ── Toast ──
  const [toast,    setToast]    = useState('');
  const toastTimer              = useRef(null);
  const videoRef                = useRef(null);
  const cardRef                 = useRef(null);

  // Toast listener (dari share)
  useEffect(() => {
    const handler = (e) => {
      setToast(e.detail.message);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 2800);
    };
    window.addEventListener('vidora:toast', handler);
    return () => { window.removeEventListener('vidora:toast', handler); clearTimeout(toastTimer.current); };
  }, []);

  // Autoplay video
  useEffect(() => {
    if (post.type !== 'video') return;
    const videoEl = videoRef.current;
    const card    = cardRef.current;
    if (!videoEl || !card) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoEl.play().then(() => setIsPaused(false)).catch(() => setIsPaused(true));
        } else {
          videoEl.pause(); videoEl.currentTime = 0;
          setIsPaused(true); setShowComments(false);
        }
      });
    }, { threshold: 0.6 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [post.type, post.id]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Buka komentar → fetch dari Supabase
  const handleOpenComments = useCallback((e) => {
    e.stopPropagation();
    fetchComments();
    setShowComments(true);
  }, [fetchComments]);

  const handleTap = useCallback(() => {
    if (post.type !== 'video') return;
    const el = videoRef.current;
    if (!el || hasError || showComments) return;
    if (el.paused) { el.play().then(() => setIsPaused(false)).catch(() => {}); }
    else           { el.pause(); setIsPaused(true); }
  }, [post.type, hasError, showComments]);

  const handleShare = useCallback(async (e) => {
    e.stopPropagation();
    const url   = post.fileUrl;
    const title = `${post.creator?.displayName}: ${post.caption}`;
    const shareData = { title: 'Vidora — ' + title, text: title, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch (err) { if (err.name !== 'AbortError') console.warn(err); }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      window.dispatchEvent(new CustomEvent('vidora:toast', { detail: { message: 'Tautan disalin!' } }));
    } catch { window.alert(`Salin tautan:\n${url}`); }
  }, [post]);

  // Waktu relatif
  const relativeTime = (() => {
    const diff  = Date.now() - new Date(post.createdAt).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return 'Baru saja';
    if (hours <  1) return `${mins} mnt lalu`;
    if (days  <  1) return `${hours} jam lalu`;
    if (days  < 30) return `${days} hari lalu`;
    return new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  })();

  // Jumlah komentar: pakai panjang array komentar yang sudah di-fetch,
  // atau fallback ke angka dari feed
  const commentCount = showComments ? comments.length : (post.commentsCount ?? 0);

  return (
    <article
      className={`postcard ${post.type === 'image' ? 'postcard--image' : 'postcard--video'}`}
      ref={cardRef}
      onClick={handleTap}
    >
      {/* ── MEDIA ── */}
      {post.type === 'video' ? (
        <>
          <div className="postcard-bg" style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)' }} />
          <video
            ref={videoRef}
            className={`postcard-video${hasError ? ' hidden' : ''}`}
            src={post.fileUrl}
            loop muted playsInline preload="metadata"
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onPlaying={() => { setIsLoading(false); setIsPaused(false); }}
            onWaiting={() => setIsLoading(true)}
            onError={() => { setIsLoading(false); setHasError(true); }}
          />
          {isLoading && !hasError && (
            <div className="postcard-loading" aria-label="Memuat..."><div className="spinner" /></div>
          )}
          {hasError && (
            <div className="postcard-error"><span>⚠️</span><p>Video tidak dapat dimuat</p></div>
          )}
          {isPaused && !isLoading && !hasError && (
            <div className="postcard-play-indicator" aria-hidden="true"><PlayIcon size={64} /></div>
          )}
          {!hasError && (
            <button className="postcard-mute-btn"
              onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }}
              aria-label={isMuted ? 'Aktifkan suara' : 'Matikan suara'}>
              {isMuted ? <VolumeOffIcon size={20} /> : <VolumeOnIcon size={20} />}
            </button>
          )}
        </>
      ) : (
        <div className="postcard-image-wrap">
          <img
            src={post.fileUrl}
            alt={post.caption || `Postingan dari ${post.creator?.displayName}`}
            className="postcard-image"
            loading="lazy"
            onError={(e) => {
              if (post.thumbnailUrl && e.target.src !== post.thumbnailUrl)
                e.target.src = post.thumbnailUrl;
            }}
          />
        </div>
      )}

      {/* ── Overlay ── */}
      <div className="postcard-overlay" />

      {/* ── Info kreator ── */}
      <div className="postcard-creator">
        <CreatorAvatar creator={post.creator} size={40} />
        <div className="postcard-creator-info">
          <span className="postcard-creator-name">{post.creator?.displayName}</span>
          <span className="postcard-creator-username">@{post.creator?.username}</span>
        </div>
        <span className="postcard-time">{relativeTime}</span>
      </div>

      {/* ── Caption ── */}
      {post.caption && <p className="postcard-caption">{post.caption}</p>}

      {/* ── Interaction bar ── */}
      <div className="postcard-interactions">
        {/* Suka — tersimpan ke Supabase */}
        <button
          className={`postcard-btn ${liked ? 'liked' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleLike(); }}
          aria-label={liked ? 'Batalkan suka' : 'Suka'}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} size={30} />
          <span>{formatCount(likeCount)}</span>
        </button>

        {/* Komentar — fetch dari Supabase */}
        <button
          className="postcard-btn"
          onClick={handleOpenComments}
          aria-label="Komentar"
        >
          <CommentIcon size={30} />
          <span>{formatCount(commentCount)}</span>
        </button>

        {/* Bookmark — tersimpan ke Supabase */}
        <button
          className={`postcard-btn ${bookmarked ? 'bookmarked' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleBookmark(); }}
          aria-label={bookmarked ? 'Batalkan simpan' : 'Simpan'}
          aria-pressed={bookmarked}
        >
          <BookmarkIcon filled={bookmarked} size={30} />
        </button>

        {/* Bagikan */}
        <button className="postcard-btn" onClick={handleShare} aria-label="Bagikan">
          <ShareIcon size={30} />
        </button>
      </div>

      {/* ── Modal komentar ── */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        comments={comments}
        loading={commentsLoading}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        post={post}
      />

      {/* ── Toast ── */}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </article>
  );
}

export default PostCard;
