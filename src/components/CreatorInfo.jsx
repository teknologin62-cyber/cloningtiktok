// ============================================================
// CREATOR INFO - Informasi kreator di bagian bawah video
// ============================================================
// Menampilkan: foto profil (avatar gradien), username, caption,
// dan musik dengan teks berjalan (marquee).
// ============================================================

import { VerifiedIcon, MusicIcon } from './icons';
import './CreatorInfo.css';

function CreatorInfo({ video }) {
  const { creator, caption, music } = video;

  return (
    <div className="creator-info">
      {/* Baris atas: avatar + username + badge verifikasi */}
      <div className="creator-header">
        <div
          className="creator-avatar"
          style={{ background: creator.avatarGradient }}
          aria-label={`Foto profil ${creator.displayName}`}
        >
          {creator.displayName.charAt(0)}
        </div>
        <div className="creator-name-row">
          <span className="creator-username">@{creator.username}</span>
          {creator.verified && (
            <span className="verified-badge">
              <VerifiedIcon size={15} />
            </span>
          )}
        </div>
      </div>

      {/* Caption / deskripsi video */}
      <p className="creator-caption">{caption}</p>

      {/* Baris musik dengan teks berjalan */}
      <div className="creator-music">
        <span className="music-icon">
          <MusicIcon size={16} />
        </span>
        <div className="music-scroll">
          <div className="music-name">
            <span>{music}</span>
            <span>{music}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatorInfo;
