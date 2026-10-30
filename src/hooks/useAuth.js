// ============================================================
// useAuth — Custom Hook untuk Autentikasi Supabase
// ============================================================
// Hook ini menjadi satu-satunya tempat logika auth di aplikasi.
// Komponen lain cukup memanggil useAuth() untuk mendapat:
//   - user       : objek pengguna yang login, atau null
//   - loading    : true saat sedang cek sesi awal
//   - signUp()   : daftar akun baru
//   - signIn()   : masuk dengan email + password
//   - signOut()  : keluar
//
// Listener onAuthStateChange dipasang satu kali dan dibersihkan
// otomatis saat komponen yang memakainya dilepas dari DOM.
// ============================================================

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export function useAuth() {
  // null  = belum login / belum tahu
  // object = pengguna sedang login
  const [user, setUser]       = useState(null)

  // true selama pengecekan sesi awal berlangsung
  // mencegah "kedipan" halaman login sebelum sesi diketahui
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Jika Supabase belum dikonfigurasi, langsung selesai
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    // ── 1. Ambil sesi yang sudah ada (misalnya dari localStorage) ──
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // ── 2. Dengarkan setiap perubahan status auth ──
    // Ini menangani: login, logout, token diperbarui, dll.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // ── 3. Bersihkan listener saat hook dilepas ──
    return () => subscription.unsubscribe()
  }, [])

  // ------------------------------------------------------------------
  // DAFTAR AKUN BARU
  // Mengembalikan { error } — null jika berhasil
  // Catatan: Supabase mungkin mengirim email konfirmasi tergantung
  // pengaturan Dashboard. Pengguna belum tentu langsung login.
  // ------------------------------------------------------------------
  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  // ------------------------------------------------------------------
  // MASUK DENGAN EMAIL + PASSWORD
  // Mengembalikan { error } — null jika berhasil
  // ------------------------------------------------------------------
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  // ------------------------------------------------------------------
  // KELUAR
  // Mengembalikan { error } — null jika berhasil
  // ------------------------------------------------------------------
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { user, loading, signUp, signIn, signOut }
}
