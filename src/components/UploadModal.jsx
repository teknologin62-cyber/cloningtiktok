// ============================================================
// UPLOAD MODAL — Posting video atau gambar baru
// ============================================================
// Muncul saat pengguna menekan tombol + di bottom nav.
// Mendukung: video (MP4, MOV, AVI) dan gambar (JPG, PNG, GIF, WebP).
// Setelah post berhasil, memanggil onPost(file, caption) agar
// App.jsx bisa menyimpan ke usePosts hook.
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { CloseIcon, PlusIcon } from './icons';
import './UploadModal.css';

// Tipe file yang diterima
const ACCEPT = 'video/*,image/*';

function UploadModal({ onClose, onPost }) {
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null); // object URL
  const [fileType, setFileType]       = useState(null); // 'video' | 'image'
  const [caption, setCaption]         = useState('');
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone]   = useState(false);
  const [error, setError]             = useState(null);

  const fileInputRef = useRef(null);

  // ── Validasi & proses file yang dipilih ──
  const handleFile = useCallback((raw) => {
    if (!raw) return;
    setError(null);

    const isVideo = raw.type.startsWith('video/');
    const isImage = raw.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setError('Hanya file video atau gambar yang didukung.');
      return;
    }
    if (isVideo && raw.size > 200 * 1024 * 1024) {
      setError('Ukuran video maksimal 200 MB.');
      return;
    }
    if (isImage && raw.size > 20 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 20 MB.');
      return;
    }

    // Revoke URL lama sebelum buat yang baru
    if (preview) URL.revokeObjectURL(preview);

    setFile(raw);
    setPreview(URL.createObjectURL(raw));
    setFileType(isVideo ? 'video' : 'image');
  }, [preview]);

  const handleFileInput = (e) => handleFile(e.target.files?.[0]);

  // ── Drag & Drop ──
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // ── Hapus file yang dipilih ──
  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setFileType(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit / Post ──
  const handlePost = async () => {
    if (!file || isUploading) return;
    setError(null);
    setIsUploading(true);

    try {
      // Panggil callback — App.jsx akan simpan ke usePosts
      await onPost?.(file, caption);
      setUploadDone(true);
      // Tutup modal setelah animasi sukses
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      setError('Gagal menyimpan postingan. Coba lagi.');
      setIsUploading(false);
    }
  };

  // ── Tutup modal saat klik backdrop ──
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isUploading) onClose();
  };

  // ── Label tipe file ──
  const typeLabel = fileType === 'image' ? 'Gambar' : fileType === 'video' ? 'Video' : '';

  return (
    <div
      className="upload-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Posting konten baru"
    >
      <div className="upload-modal">

        {/* ── Header ── */}
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">
            {typeLabel ? `Posting ${typeLabel}` : 'Posting Konten'}
          </h2>
          <button
            className="upload-modal-close"
            onClick={onClose}
            aria-label="Tutup modal"
            disabled={isUploading}
          >
            <CloseIcon size={22} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="upload-modal-body">

          {/* Area pilih file */}
          {!file ? (
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Klik atau seret file ke sini"
            >
              <div className="upload-dropzone-icon">
                <PlusIcon size={32} />
              </div>
              <p className="upload-dropzone-text">Ketuk untuk pilih file</p>
              <p className="upload-dropzone-hint">atau seret & lepas di sini</p>
              <p className="upload-dropzone-limit">
                Video: MP4, MOV, AVI · Maks. 200 MB
                <br />
                Gambar: JPG, PNG, GIF, WebP · Maks. 20 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileInput}
                className="upload-file-input"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="upload-preview-wrap">
              {/* Preview konten */}
              {fileType === 'video' ? (
                <video
                  className="upload-preview-media"
                  src={preview}
                  controls
                  playsInline
                  aria-label="Preview video"
                />
              ) : (
                <img
                  className="upload-preview-media upload-preview-image"
                  src={preview}
                  alt="Preview gambar"
                />
              )}

              {/* Badge tipe */}
              <span className="upload-preview-type-badge">
                {typeLabel}
              </span>

              {/* Tombol hapus */}
              <button
                className="upload-preview-remove"
                onClick={handleRemove}
                aria-label="Hapus file"
                disabled={isUploading}
              >
                <CloseIcon size={16} />
              </button>

              {/* Nama file */}
              <p className="upload-preview-filename">
                {file.name}
                <span className="upload-preview-filesize">
                  {' '}· {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </p>
            </div>
          )}

          {/* Pesan error */}
          {error && (
            <p className="upload-error" role="alert">{error}</p>
          )}

          {/* Caption */}
          <div className="upload-caption-wrap">
            <textarea
              className="upload-caption-input"
              placeholder="Tulis caption yang menarik..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
              rows={3}
              disabled={isUploading}
              aria-label="Caption postingan"
            />
            <span className="upload-caption-count">{caption.length}/300</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="upload-modal-footer">
          {uploadDone ? (
            <div className="upload-success" aria-live="polite">
              ✓ Postingan berhasil disimpan!
            </div>
          ) : (
            <button
              className={`upload-post-btn ${!file || isUploading ? 'disabled' : ''}`}
              onClick={handlePost}
              disabled={!file || isUploading}
              aria-disabled={!file || isUploading}
            >
              {isUploading && (
                <span className="upload-spinner" aria-label="Menyimpan..." />
              )}
              {isUploading ? 'Menyimpan...' : 'Posting Sekarang'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default UploadModal;
