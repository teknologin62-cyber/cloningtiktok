// ============================================================
// PROFILE PAGE — Halaman profil pengguna
// ============================================================
// Fitur:
//   - Tampilkan foto profil, nama, bio, statistik
//   - Mode edit profil (nama, username, bio, foto)
//   - Grid postingan (video & gambar) yang sudah diposting
//   - Tap postingan → lihat detail + edit caption + hapus
//   - Tombol logout terintegrasi
// ============================================================

import { useState, useRef } from 'react';
import {
  EditIcon, CameraIcon, CheckIcon, CloseIcon,
  GridIcon, VideoIcon, LogOutIcon, TrashIcon, ImageIcon,
} from '../components/icons';
import './ProfilePage.css';

const DEFAULT_PROFILE = {
  displayName:   'Pengguna Baru',
  username:      'pengguna_baru',
  bio:           'Hei, aku baru di Vidora! 👋',
  avatarColor:   'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  avatarInitial: 'P',
};

function ProfilePage({ user, posts = [], onSignOut, onRemovePost, onUpdateCaption }) {

  // ── State profil ──
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('vidora_profile');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    const emailName = user?.email?.split('@')[0] ?? 'pengguna';
    return {
      ...DEFAULT_PROFILE,
      displayName:   emailName,
      username:      emailName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      avatarInitial: emailName[0]?.toUpperCase() ?? 'P',
    };
  });

  // ── Edit profil ──
  const [isEditing, setIsEditing]         = useState(false);
  const [editData,  setEditData]          = useState({ ...profile });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef                    = useRef(null);

  // ── Detail postingan (saat tap item di grid) ──
  const [selectedPost, setSelectedPost]     = useState(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft]     = useState('');

  // ────────────────────────────────────────────────────────
  //  EDIT PROFIL
  // ────────────────────────────────────────────────────────
  const startEdit = () => { setEditData({ ...profile }); setAvatarPreview(null); setIsEditing(true); };
  const cancelEdit = () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); setIsEditing(false); };

  const saveEdit = () => {
    const updated = {
      ...editData,
      avatarUrl:     avatarPreview ?? profile.avatarUrl ?? null,
      avatarInitial: (editData.displayName?.[0] ?? 'P').toUpperCase(),
    };
    setProfile(updated);
    localStorage.setItem('vidora_profile', JSON.stringify(updated));
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ────────────────────────────────────────────────────────
  //  DETAIL POSTINGAN
  // ────────────────────────────────────────────────────────
  const openPost = (post) => {
    setSelectedPost(post);
    setCaptionDraft(post.caption ?? '');
    setEditingCaption(false);
  };

  const closePost = () => setSelectedPost(null);

  const handleSaveCaption = () => {
    if (!selectedPost) return;
    onUpdateCaption?.(selectedPost.id, captionDraft);
    setSelectedPost((p) => ({ ...p, caption: captionDraft }));
    setEditingCaption(false);
  };

  const handleDelete = (id) => {
    onRemovePost?.(id);
    closePost();
  };

  // ────────────────────────────────────────────────────────
  //  AVATAR
  // ────────────────────────────────────────────────────────
  function Avatar({ size = 84, editable = false }) {
    const src = editable ? (avatarPreview ?? profile.avatarUrl) : profile.avatarUrl;
    return (
      <div className="profile-avatar-wrap" style={{ width: size, height: size }}>
        {src ? (
          <img src={src} alt={`Foto profil ${profile.displayName}`} className="profile-avatar-img" />
        ) : (
          <div className="profile-avatar-initials" style={{ background: profile.avatarColor }}>
            {profile.avatarInitial}
          </div>
        )}
        {editable && (
          <button className="profile-avatar-edit-btn" onClick={() => avatarInputRef.current?.click()} aria-label="Ganti foto profil">
            <CameraIcon size={16} />
          </button>
        )}
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarFile} className="profile-avatar-file-input" aria-hidden="true" />
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <h1 className="profile-header-title">Profil</h1>
        <button className="profile-logout-btn" onClick={onSignOut} aria-label="Keluar">
          <LogOutIcon size={18} />
        </button>
      </div>

      {/* ── Kartu Profil ── */}
      <div className="profile-card">
        {isEditing ? (
          <div className="profile-edit-form">
            <Avatar size={84} editable />
            <div className="profile-edit-fields">
              <div className="profile-field">
                <label className="profile-field-label" htmlFor="edit-name">Nama Tampil</label>
                <input id="edit-name" className="profile-field-input" type="text"
                  value={editData.displayName}
                  onChange={(e) => setEditData((p) => ({ ...p, displayName: e.target.value }))}
                  maxLength={40} placeholder="Nama kamu"
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label" htmlFor="edit-username">Username</label>
                <div className="profile-field-prefix-wrap">
                  <span className="profile-field-prefix">@</span>
                  <input id="edit-username" className="profile-field-input with-prefix" type="text"
                    value={editData.username}
                    onChange={(e) => setEditData((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))}
                    maxLength={30} placeholder="username_kamu"
                  />
                </div>
              </div>
              <div className="profile-field">
                <label className="profile-field-label" htmlFor="edit-bio">Bio</label>
                <textarea id="edit-bio" className="profile-field-input profile-field-textarea"
                  value={editData.bio}
                  onChange={(e) => setEditData((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={150} rows={3} placeholder="Ceritakan sedikit tentang dirimu..."
                />
                <span className="profile-field-count">{editData.bio.length}/150</span>
              </div>
            </div>
            <div className="profile-edit-actions">
              <button className="profile-btn-cancel" onClick={cancelEdit}><CloseIcon size={16} />Batal</button>
              <button className="profile-btn-save"   onClick={saveEdit}><CheckIcon size={16} />Simpan</button>
            </div>
          </div>
        ) : (
          <div className="profile-view">
            <Avatar size={84} />
            <div className="profile-info">
              <h2 className="profile-display-name">{profile.displayName}</h2>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <p className="profile-email">{user?.email}</p>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{posts.length}</span>
                <span className="profile-stat-label">Postingan</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="profile-stat-value">0</span>
                <span className="profile-stat-label">Pengikut</span>
              </div>
              <div className="profile-stat-divider" />
              <div className="profile-stat">
                <span className="profile-stat-value">0</span>
                <span className="profile-stat-label">Mengikuti</span>
              </div>
            </div>
            <button className="profile-edit-btn" onClick={startEdit}>
              <EditIcon size={16} />Edit Profil
            </button>
          </div>
        )}
      </div>

      {/* ── Grid Postingan ── */}
      <div className="profile-posts-section">
        <div className="profile-posts-tab">
          <GridIcon size={18} />
          <span>Postingan</span>
          {posts.length > 0 && (
            <span className="profile-posts-count">{posts.length}</span>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="profile-empty-state">
            <div className="profile-empty-icon"><VideoIcon size={40} /></div>
            <p className="profile-empty-title">Belum ada postingan</p>
            <p className="profile-empty-hint">
              Tekan tombol <strong>+</strong> di bawah untuk posting pertamamu!
            </p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <button
                key={post.id}
                className="profile-post-item"
                onClick={() => openPost(post)}
                aria-label={`Lihat postingan: ${post.caption || post.fileName}`}
              >
                {/* Thumbnail — gambar atau frame video */}
                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.caption || post.fileName}
                    className="profile-post-thumb"
                    loading="lazy"
                  />
                ) : (
                  <div className="profile-post-thumb profile-post-thumb-placeholder" />
                )}

                {/* Badge tipe */}
                <div className="profile-post-badge">
                  {post.type === 'image'
                    ? <ImageIcon size={13} />
                    : <VideoIcon size={13} />
                  }
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Detail Postingan ── */}
      {selectedPost && (
        <div
          className="post-detail-backdrop"
          onClick={(e) => e.target === e.currentTarget && closePost()}
          role="dialog"
          aria-modal="true"
          aria-label="Detail postingan"
        >
          <div className="post-detail-modal">

            {/* Header modal */}
            <div className="post-detail-header">
              <h3 className="post-detail-title">Detail Postingan</h3>
              <button className="post-detail-close" onClick={closePost} aria-label="Tutup">
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Media */}
            <div className="post-detail-media-wrap">
              {selectedPost.type === 'video' ? (
                selectedPost.blobUrl ? (
                  <video
                    className="post-detail-media"
                    src={selectedPost.blobUrl}
                    controls playsInline
                    aria-label="Video postingan"
                  />
                ) : (
                  /* blobUrl hilang setelah refresh — tampilkan thumbnail */
                  <div className="post-detail-media-fallback">
                    {selectedPost.thumbnail && (
                      <img src={selectedPost.thumbnail} alt="Thumbnail video" className="post-detail-media" />
                    )}
                    <p className="post-detail-media-note">
                      Video tidak tersedia setelah refresh.<br />
                      Thumbnail masih tersimpan.
                    </p>
                  </div>
                )
              ) : (
                <img
                  className="post-detail-media"
                  src={selectedPost.blobUrl ?? selectedPost.thumbnail}
                  alt={selectedPost.caption || 'Gambar postingan'}
                />
              )}
            </div>

            {/* Info */}
            <div className="post-detail-info">
              <p className="post-detail-meta">
                {new Date(selectedPost.createdAt).toLocaleString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                <span className="post-detail-size">
                  {' · '}{(selectedPost.fileSize / 1024 / 1024).toFixed(1)} MB
                </span>
              </p>

              {/* Caption — mode tampil atau edit */}
              {editingCaption ? (
                <div className="post-detail-caption-edit">
                  <textarea
                    className="post-detail-caption-input"
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    maxLength={300}
                    rows={3}
                    autoFocus
                    placeholder="Tulis caption..."
                    aria-label="Edit caption"
                  />
                  <span className="post-detail-caption-count">{captionDraft.length}/300</span>
                  <div className="post-detail-caption-actions">
                    <button className="profile-btn-cancel" onClick={() => { setEditingCaption(false); setCaptionDraft(selectedPost.caption ?? ''); }}>
                      <CloseIcon size={14} />Batal
                    </button>
                    <button className="profile-btn-save" onClick={handleSaveCaption}>
                      <CheckIcon size={14} />Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="post-detail-caption-view">
                  <p className="post-detail-caption-text">
                    {selectedPost.caption || <em className="post-detail-no-caption">Belum ada caption</em>}
                  </p>
                  <button className="post-detail-edit-caption-btn" onClick={() => setEditingCaption(true)}>
                    <EditIcon size={14} />Edit Caption
                  </button>
                </div>
              )}
            </div>

            {/* Tombol hapus */}
            <div className="post-detail-footer">
              <button
                className="post-detail-delete-btn"
                onClick={() => {
                  if (window.confirm('Hapus postingan ini?')) handleDelete(selectedPost.id);
                }}
                aria-label="Hapus postingan"
              >
                <TrashIcon size={16} />
                Hapus Postingan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default ProfilePage;
