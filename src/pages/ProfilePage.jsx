// ============================================================
// PROFILE PAGE — Halaman profil pengguna
// ============================================================
// Fitur:
//   - Tampilkan foto profil, nama, bio, statistik
//   - Mode edit profil (nama, username, bio, foto)
//   - Grid video yang sudah diposting
//   - Tombol logout terintegrasi
// ============================================================

import { useState, useRef } from 'react';
import {
  EditIcon, CameraIcon, CheckIcon, CloseIcon,
  GridIcon, VideoIcon, LogOutIcon,
} from '../components/icons';
import './ProfilePage.css';

// ── Data profil default (nanti bisa diambil dari Supabase) ──
const DEFAULT_PROFILE = {
  displayName: 'Pengguna Baru',
  username:    'pengguna_baru',
  bio:         'Hei, aku baru di Vidora! 👋',
  avatarColor: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  avatarInitial: 'P',
};

function ProfilePage({ user, onSignOut }) {
  // ── State profil ──
  const [profile, setProfile]         = useState(() => {
    // Coba ambil profil tersimpan dari localStorage
    const saved = localStorage.getItem('vidora_profile');
    if (saved) {
      try { return JSON.parse(saved); }
      catch { /* abaikan jika corrupt */ }
    }
    // Jika belum ada, gunakan email user sebagai nama awal
    const emailName = user?.email?.split('@')[0] ?? 'pengguna';
    return {
      ...DEFAULT_PROFILE,
      displayName:   emailName,
      username:      emailName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      avatarInitial: emailName[0]?.toUpperCase() ?? 'P',
    };
  });

  // ── State edit profil ──
  const [isEditing, setIsEditing]     = useState(false);
  const [editData,  setEditData]      = useState({ ...profile });
  const [avatarPreview, setAvatarPreview] = useState(null); // blob URL foto baru
  const avatarInputRef                = useRef(null);

  // ── Video yang diposting (mock — nanti dari Supabase) ──
  const [posts] = useState([]);

  // ────────────────────────────────────────────────────────
  //  EDIT PROFIL
  // ────────────────────────────────────────────────────────

  const startEdit = () => {
    setEditData({ ...profile });
    setAvatarPreview(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const saveEdit = () => {
    const updated = {
      ...editData,
      // Jika ada foto baru (avatarPreview), simpan sebagai data URL
      avatarUrl: avatarPreview ?? profile.avatarUrl ?? null,
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
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    // Baca sebagai data URL agar bisa disimpan di localStorage
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ────────────────────────────────────────────────────────
  //  AVATAR — tampilkan foto atau inisial
  // ────────────────────────────────────────────────────────
  function Avatar({ size = 84, editable = false }) {
    const src = editable
      ? (avatarPreview ?? profile.avatarUrl)
      : profile.avatarUrl;

    return (
      <div
        className="profile-avatar-wrap"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img
            src={src}
            alt={`Foto profil ${profile.displayName}`}
            className="profile-avatar-img"
          />
        ) : (
          <div
            className="profile-avatar-initials"
            style={{ background: profile.avatarColor }}
            aria-label={`Avatar ${profile.displayName}`}
          >
            {profile.avatarInitial}
          </div>
        )}

        {editable && (
          <button
            className="profile-avatar-edit-btn"
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Ganti foto profil"
          >
            <CameraIcon size={16} />
          </button>
        )}

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarFile}
          className="profile-avatar-file-input"
          aria-hidden="true"
        />
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
        <button
          className="profile-logout-btn"
          onClick={onSignOut}
          aria-label="Keluar"
          title="Keluar dari akun"
        >
          <LogOutIcon size={18} />
        </button>
      </div>

      {/* ── Kartu Profil ── */}
      <div className="profile-card">
        {isEditing ? (
          /* ── MODE EDIT ── */
          <div className="profile-edit-form">
            <Avatar size={84} editable />

            <div className="profile-edit-fields">
              {/* Nama tampil */}
              <div className="profile-field">
                <label className="profile-field-label" htmlFor="edit-name">
                  Nama Tampil
                </label>
                <input
                  id="edit-name"
                  className="profile-field-input"
                  type="text"
                  value={editData.displayName}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, displayName: e.target.value }))
                  }
                  maxLength={40}
                  placeholder="Nama kamu"
                />
              </div>

              {/* Username */}
              <div className="profile-field">
                <label className="profile-field-label" htmlFor="edit-username">
                  Username
                </label>
                <div className="profile-field-prefix-wrap">
                  <span className="profile-field-prefix">@</span>
                  <input
                    id="edit-username"
                    className="profile-field-input with-prefix"
                    type="text"
                    value={editData.username}
                    onChange={(e) =>
                      setEditData((p) => ({
                        ...p,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_.]/g, ''),
                      }))
                    }
                    maxLength={30}
                    placeholder="username_kamu"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="profile-field">
                <label className="profile-field-label" htmlFor="edit-bio">
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  className="profile-field-input profile-field-textarea"
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, bio: e.target.value }))
                  }
                  maxLength={150}
                  rows={3}
                  placeholder="Ceritakan sedikit tentang dirimu..."
                />
                <span className="profile-field-count">
                  {editData.bio.length}/150
                </span>
              </div>
            </div>

            {/* Tombol aksi edit */}
            <div className="profile-edit-actions">
              <button className="profile-btn-cancel" onClick={cancelEdit}>
                <CloseIcon size={16} />
                Batal
              </button>
              <button className="profile-btn-save" onClick={saveEdit}>
                <CheckIcon size={16} />
                Simpan
              </button>
            </div>
          </div>
        ) : (
          /* ── MODE TAMPIL ── */
          <div className="profile-view">
            <Avatar size={84} />

            <div className="profile-info">
              <h2 className="profile-display-name">{profile.displayName}</h2>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}
              <p className="profile-email">{user?.email}</p>
            </div>

            {/* Statistik */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{posts.length}</span>
                <span className="profile-stat-label">Video</span>
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

            {/* Tombol edit profil */}
            <button className="profile-edit-btn" onClick={startEdit}>
              <EditIcon size={16} />
              Edit Profil
            </button>
          </div>
        )}
      </div>

      {/* ── Tab Postingan ── */}
      <div className="profile-posts-section">
        <div className="profile-posts-tab">
          <GridIcon size={18} />
          <span>Postingan</span>
        </div>

        {posts.length === 0 ? (
          /* State kosong */
          <div className="profile-empty-state">
            <div className="profile-empty-icon">
              <VideoIcon size={40} />
            </div>
            <p className="profile-empty-title">Belum ada video</p>
            <p className="profile-empty-hint">
              Tekan tombol <strong>+</strong> di bawah untuk posting video pertamamu!
            </p>
          </div>
        ) : (
          /* Grid video */
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="profile-post-item">
                <video
                  src={post.videoUrl}
                  className="profile-post-thumb"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="profile-post-overlay">
                  <VideoIcon size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default ProfilePage;
