// ============================================================
// APP - Komponen utama aplikasi "Vidora"
// ============================================================
// Alur tampilan:
//   loading = true  → layar loading (cek sesi awal)
//   user = null     → AuthPage (Login / Register)
//   user = ada      → Feed Video + tombol Logout di pojok atas
//
// checkConnection() dipanggil sekali di awal untuk log Console.
// useAuth() mengelola semua state dan logika autentikasi.
// ============================================================

import { useEffect, useState } from 'react'
import VideoFeed from './components/VideoFeed'
import BottomNav from './components/BottomNav'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './hooks/useAuth'
import { checkConnection } from './lib/supabaseClient'
import './App.css'
// AuthPage.css dimuat via AuthPage.jsx — loading screen pakai class dari sana
import './pages/AuthPage.css'

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth()
  // Tab aktif dikelola di App agar ProfilePage bisa di-render/sembunyi
  const [activeTab, setActiveTab] = useState('home')

  // Log status koneksi Supabase ke Console sekali saat mount
  useEffect(() => {
    checkConnection()
  }, [])

  // ── Layar loading awal: cegah "kedipan" halaman login ──
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-logo">Vidora</div>
        <div className="auth-loading-spinner" aria-label="Memuat..." />
      </div>
    )
  }

  // ── Belum login: tampilkan halaman auth ──
  if (!user) {
    return <AuthPage onSignUp={signUp} onSignIn={signIn} />
  }

  // ── Sudah login: tampilkan feed + navigasi ──
  return (
    <div className="app">
      {/* Feed video — sembunyikan saat di tab profil agar state video terjaga */}
      <div
        className="app-feed-layer"
        style={{ display: activeTab === 'profile' ? 'none' : 'block' }}
        aria-hidden={activeTab === 'profile'}
      >
        <VideoFeed />
      </div>

      {/* Halaman profil */}
      {activeTab === 'profile' && (
        <div className="app-profile-layer">
          <ProfilePage user={user} onSignOut={signOut} />
        </div>
      )}

      {/* Navigasi bawah — kirim activeTab & setter ke BottomNav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
