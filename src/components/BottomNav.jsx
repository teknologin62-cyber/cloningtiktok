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

function BottomNav() {
  // Lacak tab mana yang sedang aktif
  const [activeTab, setActiveTab] = useState('home');
  // Kontrol visibilitas modal upload
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <nav className="bottom-nav" aria-label="Navigasi utama">
        {/* Beranda */}
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
          aria-label="Beranda"
        >
          <HomeIcon filled={activeTab === 'home'} size={26} />
          <span className="nav-label">Beranda</span>
        </button>

        {/* Jelajahi */}
        <button
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
          aria-label="Jelajahi"
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
          onClick={() => setActiveTab('inbox')}
          aria-label="Kotak Masuk"
        >
          <ChatIcon filled={activeTab === 'inbox'} size={26} />
          <span className="nav-label">Kotak Masuk</span>
        </button>

        {/* Profil */}
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          aria-label="Profil"
        >
          <UserIcon filled={activeTab === 'profile'} size={26} />
          <span className="nav-label">Profil</span>
        </button>
      </nav>

      {/* Modal Upload — render di luar nav agar z-index benar */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} />
      )}
    </>
  );
}

export default BottomNav;
