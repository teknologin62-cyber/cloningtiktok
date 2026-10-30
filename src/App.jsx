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

import { useEffect } from 'react'
import VideoFeed from './components/VideoFeed'
import BottomNav from './components/BottomNav'
import AuthPage from './pages/AuthPage'
import { LogOutIcon } from './components/icons'
import { useAuth } from './hooks/useAuth'
import { checkConnection } from './lib/supabaseClient'
import './App.css'
// AuthPage.css dimuat via AuthPage.jsx — loading screen pakai class dari sana
import './pages/AuthPage.css'

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth()

  // Log status koneksi Supabase ke Console sekali saat mount
  useEffect(() => {
    checkConnection()
  }, [])

  // ── Layar loading awal: cegah "kedipan" halaman login ──
  // Ditampilkan hanya saat pertama kali aplikasi memeriksa sesi
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

  // ── Sudah login: tampilkan feed video ──
  return (
    <div className="app">
      {/* Tombol logout — pojok kanan atas, di luar feed */}
      <button
        className="app-logout-btn"
        onClick={signOut}
        aria-label="Keluar dari akun"
        title={`Keluar (${user.email})`}
      >
        <LogOutIcon size={18} />
      </button>

      <VideoFeed />
      <BottomNav />
    </div>
  )
}

export default App
