// ============================================================
// APP - Komponen utama aplikasi "Vidora"
// ============================================================
// Alur tampilan:
//   loading = true  → layar loading (cek sesi awal)
//   user = null     → AuthPage (Login / Register)
//   user = ada      → Feed Video + BottomNav + ProfilePage
//
// usePosts dikelola di sini agar UploadModal (via BottomNav)
// dan ProfilePage berbagi sumber data yang sama.
// ============================================================

import { useEffect, useState } from 'react'
import VideoFeed from './components/VideoFeed'
import BottomNav from './components/BottomNav'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import { useAuth } from './hooks/useAuth'
import { usePosts } from './hooks/usePosts'
import { checkConnection } from './lib/supabaseClient'
import './App.css'
import './pages/AuthPage.css'

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth()
  const { posts, addPost, removePost, updatePostCaption } = usePosts()

  // Tab aktif dikelola di App agar ProfilePage bisa di-render/sembunyi
  const [activeTab, setActiveTab] = useState('home')

  // Log status koneksi Supabase ke Console sekali saat mount
  useEffect(() => {
    checkConnection()
  }, [])

  // ── Layar loading awal ──
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-logo">Vidora</div>
        <div className="auth-loading-spinner" aria-label="Memuat..." />
      </div>
    )
  }

  // ── Belum login ──
  if (!user) {
    return <AuthPage onSignUp={signUp} onSignIn={signIn} />
  }

  // ── Sudah login ──
  return (
    <div className="app">
      {/* Feed video — disembunyikan (bukan dihapus) saat di tab profil */}
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
          <ProfilePage
            user={user}
            posts={posts}
            onSignOut={signOut}
            onRemovePost={removePost}
            onUpdateCaption={updatePostCaption}
          />
        </div>
      )}

      {/* Navigasi bawah */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPost={addPost}
      />
    </div>
  )
}

export default App
