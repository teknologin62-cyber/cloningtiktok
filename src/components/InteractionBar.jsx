// ============================================================
// INTERACTION BAR - Tombol interaksi di sisi kanan video
// ============================================================
// 4 tombol:
//   Suka     → toggle merah, jumlah +1/-1
//   Komentar → buka modal komentar
//   Bookmark → toggle emas, jumlah +1/-1
//   Bagikan  → Web Share API, fallback salin tautan
// ============================================================

import { HeartIcon, CommentIcon, BookmarkIcon, ShareIcon } from './icons';
import { formatCount } from '../data/videos';
import './InteractionBar.css';

// Fungsi bagikan: gunakan Web Share API jika tersedia,
// jika tidak, salin URL ke clipboard
async function handleShare(shareUrl, title) {
  const shareData = {
    title: 'Vidora — ' + title,
    text:  title,
    url:   shareUrl,
  };

  // Web Share API (Android Chrome, iOS Safari, dll.)
  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // Pengguna membatalkan share → bukan error, abaikan
      if (err.name !== 'AbortError') {
        console.warn('[Vidora] Web Share gagal:', err);
      }
    }
    return;
  }

  // Fallback: salin tautan ke clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    // Umpan balik visual: toast mini ditampilkan via custom event
    window.dispatchEvent(new CustomEvent('vidora:toast', {
      detail: { message: 'Tautan disalin ke clipboard!' },
    }));
  } catch {
    // Clipboard tidak tersedia (koneksi non-HTTPS) → tampilkan alert sederhana
    window.alert(`Salin tautan ini:\n${shareUrl}`);
  }
}

function InteractionBar({
  liked,
  bookmarked,
  likeCount,
  commentCount,
  bookmarkCount,
  shareCount,
  shareUrl,
  shareTitle,
  onLike,
  onBookmark,
  onComment,
}) {
  return (
    <div className="interaction-bar">

      {/* Tombol Suka */}
      <button
        className={`interaction-btn ${liked ? 'liked' : ''}`}
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        aria-label={liked ? 'Batalkan suka' : 'Suka'}
        aria-pressed={liked}
      >
        <span className="interaction-icon">
          <HeartIcon filled={liked} size={34} />
        </span>
        <span className="interaction-count">{formatCount(likeCount)}</span>
      </button>

      {/* Tombol Komentar */}
      <button
        className="interaction-btn"
        onClick={(e) => { e.stopPropagation(); onComment(); }}
        aria-label="Komentar"
      >
        <span className="interaction-icon">
          <CommentIcon size={34} />
        </span>
        <span className="interaction-count">{formatCount(commentCount)}</span>
      </button>

      {/* Tombol Bookmark */}
      <button
        className={`interaction-btn ${bookmarked ? 'bookmarked' : ''}`}
        onClick={(e) => { e.stopPropagation(); onBookmark(); }}
        aria-label={bookmarked ? 'Batalkan simpan' : 'Simpan'}
        aria-pressed={bookmarked}
      >
        <span className="interaction-icon">
          <BookmarkIcon filled={bookmarked} size={34} />
        </span>
        <span className="interaction-count">{formatCount(bookmarkCount)}</span>
      </button>

      {/* Tombol Bagikan */}
      <button
        className="interaction-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleShare(shareUrl, shareTitle);
        }}
        aria-label="Bagikan"
      >
        <span className="interaction-icon">
          <ShareIcon size={34} />
        </span>
        <span className="interaction-count">{formatCount(shareCount)}</span>
      </button>

    </div>
  );
}

export default InteractionBar;
