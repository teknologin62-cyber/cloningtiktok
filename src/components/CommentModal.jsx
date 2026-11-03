// ============================================================
// COMMENT MODAL — Panel komentar dengan Supabase backend
// ============================================================
// Props:
//   isOpen         — buka/tutup modal
//   onClose        — callback tutup
//   comments       — array komentar dari useInteractions
//   loading        — sedang fetch komentar
//   onAddComment   — kirim komentar baru ke Supabase
//   onDeleteComment— hapus komentar (hanya milik sendiri)
//   post           — data postingan (untuk header)
//   video          — format lama (VideoCard mock) → tetap didukung
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { CloseIcon, SendIcon, TrashIcon } from './icons';
import './CommentModal.css';

function CommentModal({ isOpen, onClose, comments, loading, onAddComment, onDeleteComment, post, video }) {
  const [inputText, setInputText] = useState('');
  const [sending,   setSending]   = useState(false);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  // Mode lama (VideoCard mock) — pakai video.comments
  const isLegacyMode = !!video && !onAddComment;
  const [legacyComments, setLegacyComments] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (isLegacyMode && video?.comments) setLegacyComments(video.comments);
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  }, [isOpen, video, isLegacyMode]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Scroll ke bawah saat komentar baru masuk
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 80);
    }
  }, [comments?.length, legacyComments.length]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    if (isLegacyMode) {
      setLegacyComments((prev) => [...prev, {
        id: `local_${Date.now()}`, username: 'kamu', text, time: 'Baru saja', isLocal: true,
      }]);
      setInputText('');
      return;
    }

    setSending(true);
    await onAddComment?.(text);
    setInputText('');
    setSending(false);
  }, [inputText, sending, isLegacyMode, onAddComment]);

  const displayComments = isLegacyMode ? legacyComments : (comments ?? []);
  const creatorName     = post?.creator?.displayName ?? video?.creator?.displayName ?? 'Postingan';

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />

      <div className="comment-modal" role="dialog" aria-label="Komentar" aria-modal="true">

        {/* Gagang tarik */}
        <div className="modal-handle" aria-hidden="true" />

        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            Komentar
            <span className="modal-count"> ({displayComments.length})</span>
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Tutup komentar">
            <CloseIcon size={22} />
          </button>
        </div>

        {/* Daftar komentar */}
        <div className="comment-list" ref={listRef}>
          {/* Loading state */}
          {loading && displayComments.length === 0 && (
            <div className="comment-loading">
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && displayComments.length === 0 && (
            <p className="comment-empty">Belum ada komentar. Jadilah yang pertama!</p>
          )}

          {/* List komentar */}
          {displayComments.map((comment) => (
            <div
              key={comment.id}
              className={`comment-item ${comment.isLocal || comment.isOwn ? 'comment-local' : ''} ${comment.pending ? 'comment-pending' : ''}`}
            >
              {/* Avatar */}
              <div
                className="comment-avatar"
                aria-hidden="true"
                style={comment.avatarUrl ? undefined : { background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
              >
                {comment.avatarUrl
                  ? <img src={comment.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : (comment.name?.[0] ?? comment.username?.[0] ?? '?').toUpperCase()
                }
              </div>

              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-username">@{comment.username}</span>
                  <span className="comment-time">{comment.pending ? 'Mengirim...' : comment.time}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>

              {/* Tombol hapus — hanya untuk komentar sendiri */}
              {(comment.isOwn || comment.isLocal) && onDeleteComment && !comment.pending && (
                <button
                  className="comment-delete-btn"
                  onClick={() => onDeleteComment(comment.id)}
                  aria-label="Hapus komentar"
                >
                  <TrashIcon size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Form input */}
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-input-avatar" aria-hidden="true">
            {creatorName[0]?.toUpperCase() ?? 'K'}
          </div>
          <input
            ref={inputRef}
            className="comment-input"
            type="text"
            placeholder="Tulis komentar..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={280}
            aria-label="Tulis komentar"
            disabled={sending}
          />
          <button
            type="submit"
            className={`comment-send ${inputText.trim() && !sending ? 'active' : ''}`}
            aria-label="Kirim komentar"
            disabled={!inputText.trim() || sending}
          >
            {sending
              ? <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <SendIcon size={20} />
            }
          </button>
        </form>

      </div>
    </>
  );
}

export default CommentModal;
