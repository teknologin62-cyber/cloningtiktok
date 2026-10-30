// ============================================================
// COMMENT MODAL - Panel komentar geser dari bawah
// ============================================================
// Menampilkan daftar komentar demo dan form tambah komentar.
// Semua komentar tersimpan di state lokal (tidak ada backend).
// Modal ditutup saat:
//   - Tombol silang diklik
//   - Overlay (latar gelap) diklik
//   - Tombol Escape ditekan
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { CloseIcon, SendIcon } from './icons';
import './CommentModal.css';

function CommentModal({ isOpen, onClose, video }) {
  // Komentar lokal = komentar demo + komentar yang ditambahkan pengguna
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const inputRef    = useRef(null);
  const listRef     = useRef(null);

  // Inisialisasi komentar dari data video saat modal dibuka
  useEffect(() => {
    if (isOpen && video?.comments) {
      setComments(video.comments);
      // Fokus ke input setelah animasi masuk selesai
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  }, [isOpen, video]);

  // Tutup modal saat Escape ditekan
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Kirim komentar baru (tersimpan lokal saja)
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const newComment = {
      id:       `local-${Date.now()}`,
      username: 'kamu',          // nama pengguna demo
      text,
      time:     'Baru saja',
      isLocal:  true,            // penanda komentar lokal
    };

    setComments((prev) => [...prev, newComment]);
    setInputText('');

    // Gulir ke bawah agar komentar baru terlihat
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 80);
  }, [inputText]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay — klik untuk menutup */}
      <div
        className="modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel komentar */}
      <div
        className="comment-modal"
        role="dialog"
        aria-label="Komentar"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            Komentar
            <span className="modal-count"> ({comments.length})</span>
          </span>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup komentar"
          >
            <CloseIcon size={22} />
          </button>
        </div>

        {/* Gagang tarik (visual saja) */}
        <div className="modal-handle" aria-hidden="true" />

        {/* Daftar komentar */}
        <div className="comment-list" ref={listRef}>
          {comments.length === 0 ? (
            <p className="comment-empty">Belum ada komentar. Jadilah yang pertama!</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`comment-item ${comment.isLocal ? 'comment-local' : ''}`}
              >
                {/* Avatar inisial */}
                <div className="comment-avatar" aria-hidden="true">
                  {comment.username.charAt(0).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="comment-username">@{comment.username}</span>
                    <span className="comment-time">{comment.time}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form input komentar */}
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-input-avatar" aria-hidden="true">K</div>
          <input
            ref={inputRef}
            className="comment-input"
            type="text"
            placeholder="Tulis komentar..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={280}
            aria-label="Tulis komentar"
          />
          <button
            type="submit"
            className={`comment-send ${inputText.trim() ? 'active' : ''}`}
            aria-label="Kirim komentar"
            disabled={!inputText.trim()}
          >
            <SendIcon size={20} />
          </button>
        </form>
      </div>
    </>
  );
}

export default CommentModal;
