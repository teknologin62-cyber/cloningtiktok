// ============================================================
// BOTTOM NAV - Navigasi bawah aplikasi
// ============================================================
// Berisi 5 item: Beranda, Jelajahi, tombol Tambah, Kotak Masuk, Profil.
// Tab yang aktif ditandai dengan ikon penuh dan warna terang.
// Tombol Tambah memiliki gaya khusus (kotak dengan gradien).
// ============================================================

import { useState } from 'react';
import { HomeIcon, CompassIcon, PlusIcon, ChatIcon, UserIcon } from './icons';
import UploadModal from './UploadModal';
import './BottomNav.css';

function BottomNav({ activeTab = 'home', onTabChange, onPost }) {
  // Kontrol visibilitas modal upload — lokal cukup di sini
  const [showUpload, setShowUpload] = useState(false);

  const goTo = (tab) => onTabChange?.(tab);

  // Dipanggil oleh UploadModal saat user klik "Posting Sekarang"
  const handlePost = async (file, caption) => {
    await onPost?.(file, caption);
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Navigasi utama">
        {/* Beranda */}
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => goTo('home')}
          aria-label="Beranda"
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          <HomeIcon filled={activeTab === 'home'} size={26} />
          <span className="nav-label">Beranda</span>
        </button>

        {/* Jelajahi */}
        <button
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => goTo('explore')}
          aria-label="Jelajahi"
          aria-current={activeTab === 'explore' ? 'page' : undefined}
        >
          <CompassIcon filled={activeTab === 'explore'} size={26} />
          <span className="nav-label">Jelajahi</span>
        </button>

        {/* Tombol Tambah — membuka modal upload */}
        <button
          className="nav-add"
          onClick={() => setShowUpload(true)}
          aria-label="Tambah video baru"
          aria-haspopup="dialog"
        >
          <PlusIcon size={26} />
        </button>

        {/* Kotak Masuk */}
        <button
          className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => goTo('inbox')}
          aria-label="Kotak Masuk"
          aria-current={activeTab === 'inbox' ? 'page' : undefined}
        >
          <ChatIcon filled={activeTab === 'inbox'} size={26} />
          <span className="nav-label">Kotak Masuk</span>
        </button>

        {/* Profil */}
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => goTo('profile')}
          aria-label="Profil"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <UserIcon filled={activeTab === 'profile'} size={26} />
          <span className="nav-label">Profil</span>
        </button>
      </nav>

      {/* Modal Upload — render di luar nav agar z-index benar */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onPost={handlePost}
        />
      )}
    </>
  );
}

export default BottomNav;
