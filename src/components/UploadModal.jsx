// ============================================================
// UPLOAD MODAL - Modal untuk posting video baru
// ============================================================
// Muncul saat pengguna menekan tombol + di bottom nav.
// Mendukung pemilihan file video, thumbnail otomatis, judul,
// dan deskripsi sebelum dikirim.
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { CloseIcon, PlusIcon } from './icons';
import './UploadModal.css';

function UploadModal({ onClose }) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const fileInputRef = useRef(null);

  // ── Proses file yang dipilih ──
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Hanya file video yang didukung.');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      alert('Ukuran file maksimal 200 MB.');
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }, []);

  // ── Input file biasa ──
  const handleFileInput = (e) => {
    handleFile(e.target.files[0]);
  };

  // ── Drag & Drop ──
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Hapus video yang dipilih ──
  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit / Post ──
  const handlePost = async () => {
    if (!videoFile) return;
    setIsUploading(true);

    // Simulasi upload (ganti dengan logika Supabase Storage di sini)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsUploading(false);
    setUploadDone(true);

    // Tutup modal setelah 1.5 detik
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // ── Tutup modal saat klik backdrop ──
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isUploading) onClose();
  };

  return (
    <div
      className="upload-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Upload video baru"
    >
      <div className="upload-modal">
        {/* Header */}
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">Posting Video</h2>
          <button
            className="upload-modal-close"
            onClick={onClose}
            aria-label="Tutup modal"
            disabled={isUploading}
          >
            <CloseIcon size={22} />
          </button>
        </div>

        {/* Konten */}
        <div className="upload-modal-body">
          {/* Area pilih video */}
          {!videoFile ? (
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Klik atau seret video ke sini"
            >
              <div className="upload-dropzone-icon">
                <PlusIcon size={32} />
              </div>
              <p className="upload-dropzone-text">Ketuk untuk pilih video</p>
              <p className="upload-dropzone-hint">atau seret & lepas file di sini</p>
              <p className="upload-dropzone-limit">MP4, MOV, AVI · Maks. 200 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className="upload-file-input"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className="upload-preview-wrap">
              {/* Preview video */}
              <video
                className="upload-preview-video"
                src={videoPreview}
                controls
                playsInline
                aria-label="Preview video yang dipilih"
              />
              <button
                className="upload-preview-remove"
                onClick={handleRemoveVideo}
                aria-label="Hapus video"
                disabled={isUploading}
              >
                <CloseIcon size={16} />
              </button>
              <p className="upload-preview-filename">{videoFile.name}</p>
            </div>
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
              aria-label="Caption video"
            />
            <span className="upload-caption-count">{caption.length}/300</span>
          </div>
        </div>

        {/* Footer / Tombol Post */}
        <div className="upload-modal-footer">
          {uploadDone ? (
            <div className="upload-success" aria-live="polite">
              ✓ Video berhasil diposting!
            </div>
          ) : (
            <button
              className={`upload-post-btn ${!videoFile || isUploading ? 'disabled' : ''}`}
              onClick={handlePost}
              disabled={!videoFile || isUploading}
              aria-disabled={!videoFile || isUploading}
            >
              {isUploading ? (
                <span className="upload-spinner" aria-label="Sedang mengupload..." />
              ) : null}
              {isUploading ? 'Mengupload...' : 'Posting Sekarang'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
