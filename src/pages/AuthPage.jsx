// ============================================================
// AUTH PAGE — Halaman Login & Register
// ============================================================
// Satu halaman dengan dua mode yang bisa diToggle:
//   'login'    → form email + password
//   'register' → form email + password + konfirmasi password
//
// Validasi dilakukan di sisi klien sebelum mengirim ke Supabase.
// Pesan error dari Supabase ditampilkan dalam bahasa Indonesia.
// ============================================================

import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../components/icons'
import './AuthPage.css'

// Terjemahkan pesan error Supabase ke bahasa Indonesia
function translateError(message) {
  if (!message) return 'Terjadi kesalahan. Silakan coba lagi.'
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Email atau password salah. Periksa kembali dan coba lagi.'
  if (m.includes('email not confirmed'))
    return 'Email belum dikonfirmasi. Periksa kotak masuk email Anda dan klik tautan konfirmasi.'
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
  if (m.includes('password should be at least'))
    return 'Password minimal 6 karakter.'
  if (m.includes('unable to validate email address'))
    return 'Format email tidak valid. Pastikan email Anda benar.'
  if (m.includes('email rate limit') || m.includes('rate limit'))
    return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Tidak dapat terhubung. Periksa koneksi internet Anda.'
  if (m.includes('signup is disabled'))
    return 'Pendaftaran akun sementara dinonaktifkan. Coba lagi nanti.'

  return message  // fallback: tampilkan pesan asli
}

// ── Komponen field password dengan tombol tampilkan/sembunyikan ──
function PasswordField({ id, label, value, onChange, error, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="auth-field">
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`auth-input has-toggle ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={id === 'password' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          className="auth-eye-btn"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          tabIndex={-1}
        >
          {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  )
}

// ── Komponen utama AuthPage ──
function AuthPage({ onSignUp, onSignIn }) {
  const [mode, setMode]           = useState('login')   // 'login' | 'register'
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Error per-field (validasi klien)
  const [fieldErrors, setFieldErrors] = useState({})

  // Pesan dari Supabase (error atau sukses)
  const [alert, setAlert]         = useState(null)  // { type: 'error'|'success', msg }

  // Ganti mode dan bersihkan semua state
  function switchMode(newMode) {
    setMode(newMode)
    setEmail('')
    setPassword('')
    setConfirm('')
    setFieldErrors({})
    setAlert(null)
  }

  // ── Validasi input sebelum kirim ke Supabase ──
  function validate() {
    const errors = {}
    if (!email.trim())
      errors.email = 'Email tidak boleh kosong.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Format email tidak valid.'

    if (!password)
      errors.password = 'Password tidak boleh kosong.'
    else if (password.length < 6)
      errors.password = 'Password minimal 6 karakter.'

    if (mode === 'register') {
      if (!confirm)
        errors.confirm = 'Konfirmasi password tidak boleh kosong.'
      else if (confirm !== password)
        errors.confirm = 'Password dan konfirmasi tidak sama.'
    }
    return errors
  }

  // ── Submit form ──
  async function handleSubmit(e) {
    e.preventDefault()
    setAlert(null)

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await onSignIn(email, password)
        if (error) {
          setAlert({ type: 'error', msg: translateError(error.message) })
        }
        // Jika berhasil, App.jsx akan mendeteksi perubahan sesi
        // dan mengganti tampilan ke feed — tidak perlu navigasi manual

      } else {
        // Register
        const { error } = await onSignUp(email, password)
        if (error) {
          setAlert({ type: 'error', msg: translateError(error.message) })
        } else {
          // Berhasil daftar — tampilkan pesan sukses
          // (pengguna mungkin perlu konfirmasi email sebelum bisa login)
          setAlert({
            type: 'success',
            msg: 'Pendaftaran berhasil! Periksa kotak masuk email Anda untuk mengkonfirmasi akun, lalu kembali ke halaman Login.',
          })
          // Kosongkan form tapi tetap di halaman register
          setEmail('')
          setPassword('')
          setConfirm('')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo Vidora */}
        <div className="auth-logo">
          <div className="auth-logo-text">Vidora</div>
          <div className="auth-logo-tagline">Video pendek tanpa batas</div>
        </div>

        {/* Judul form */}
        <h1 className="auth-title">
          {mode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Selamat datang kembali!'
            : 'Bergabung dan mulai berbagi video'}
        </p>

        {/* Pesan error / sukses dari Supabase */}
        {alert && (
          <div className={`auth-alert ${alert.type}`} role="alert">
            {alert.msg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`auth-input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="contoh@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="auth-field-error">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <PasswordField
            id="password"
            label="Password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
            error={fieldErrors.password}
          />

          {/* Konfirmasi password — hanya saat register */}
          {mode === 'register' && (
            <PasswordField
              id="confirm"
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: '' })) }}
              error={fieldErrors.confirm}
            />
          )}

          {/* Tombol submit */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={submitting}
          >
            {submitting && <span className="auth-btn-spinner" aria-hidden="true" />}
            {submitting
              ? (mode === 'login' ? 'Masuk...' : 'Mendaftar...')
              : (mode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>

        {/* Pindah ke Login/Register */}
        <p className="auth-switch">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Daftar di sini' : 'Masuk'}
          </button>
        </p>

      </div>
    </div>
  )
}

export default AuthPage
