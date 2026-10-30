// ============================================================
// SUPABASE CLIENT — Inisialisasi koneksi ke Supabase
// ============================================================
// File ini membaca dua variabel dari .env.local dan membuat
// satu instance client Supabase untuk seluruh aplikasi.
//
// Cara mengimpor di file lain:
//   import { supabase } from '../lib/supabaseClient'
//
// Cara mengisi kredensial:
//   1. Salin .env.example → .env.local
//   2. Isi nilai dari: Supabase Dashboard → Connect → App Frameworks
//
// Referensi resmi:
//   https://supabase.com/docs/reference/javascript/initializing
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// ------------------------------------------------------------------
// VALIDASI — cegah createClient dipanggil dengan nilai kosong
// Jika variabel belum diisi, client tidak dibuat dan error dicegah.
// ------------------------------------------------------------------
const isMisconfigured =
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl.includes('xxxxxxxxxxxxxxxxxxxx') ||
  supabaseKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')

// Ekspor flag — dipakai oleh checkConnection() untuk deteksi dini
export const isSupabaseConfigured = !isMisconfigured

// Buat client hanya jika konfigurasi valid
// Jika tidak, ekspor null dan biarkan checkConnection() menangani pesannya
export const supabase = isMisconfigured
  ? null
  : createClient(supabaseUrl, supabaseKey)

// ------------------------------------------------------------------
// CHECK CONNECTION — uji koneksi ke Supabase sekali saat startup
// ------------------------------------------------------------------
// Fungsi ini:
//   1. Memeriksa apakah variabel lingkungan sudah diisi
//   2. Memanggil supabase.auth.getSession() — API ringan yang tidak
//      memerlukan login dan tidak membuat/mengubah data apapun
//   3. Mencetak hasil yang jelas ke Console (tanpa nilai rahasia)
//
// Dipanggil dari App.jsx menggunakan useEffect sekali saat mount.
// ------------------------------------------------------------------
export async function checkConnection() {
  const label = '[Vidora · Supabase]'

  // --- 1. Cek konfigurasi ---
  if (isMisconfigured) {
    // Tampilkan hanya sebagian URL untuk konfirmasi tanpa membocorkan nilai penuh
    const urlHint = supabaseUrl
      ? `${supabaseUrl.slice(0, 12)}...` // contoh: "https://abcd..."
      : '(tidak diisi)'

    console.warn(
      `${label} ⚠️  Konfigurasi belum lengkap\n` +
      `  VITE_SUPABASE_URL        : ${urlHint}\n` +
      `  VITE_SUPABASE_PUBLISHABLE_KEY : ${supabaseKey ? '(ada, tapi mungkin placeholder)' : '(tidak diisi)'}\n\n` +
      `  Langkah perbaikan:\n` +
      `  1. Buka file .env.local\n` +
      `  2. Ganti nilai placeholder dengan kredensial dari Supabase Dashboard\n` +
      `  3. Restart server: Ctrl+C → npm run dev`
    )
    return { ok: false, reason: 'misconfigured' }
  }

  // --- 2. Cek koneksi dengan getSession() ---
  // getSession() adalah pemanggilan API paling ringan — hanya membaca
  // sesi dari storage lokal dan memverifikasi token ke Supabase.
  // Tidak membuat data, tidak mengubah tabel, tidak butuh login.
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error(
        `${label} ❌  Koneksi gagal\n` +
        `  Pesan error : ${error.message}\n` +
        `  Kode        : ${error.status ?? 'tidak ada kode'}\n\n` +
        `  Kemungkinan penyebab:\n` +
        `  - URL atau key salah di .env.local\n` +
        `  - Proyek Supabase sedang tidak aktif (cek Dashboard)\n` +
        `  - Tidak ada koneksi internet`
      )
      return { ok: false, reason: 'connection_error', error }
    }

    // Berhasil terhubung
    const hasSession = !!data.session

    // Tampilkan hanya sebagian URL — konfirmasi tanpa membocorkan nilai penuh
    const urlConfirm = `${supabaseUrl.slice(0, 20)}...`

    if (hasSession) {
      console.info(
        `${label} ✅  Terhubung ke Supabase\n` +
        `  URL (sebagian) : ${urlConfirm}\n` +
        `  Status sesi    : Pengguna sedang login\n` +
        `  User ID        : ${data.session.user.id}`
      )
    } else {
      console.info(
        `${label} ✅  Terhubung ke Supabase\n` +
        `  URL (sebagian) : ${urlConfirm}\n` +
        `  Status sesi    : Tidak ada pengguna yang login (normal untuk tahap ini)`
      )
    }

    return { ok: true, hasSession }

  } catch (err) {
    // Error tak terduga (misalnya jaringan terputus sepenuhnya)
    console.error(
      `${label} ❌  Error tak terduga saat menghubungi Supabase\n` +
      `  ${err?.message ?? String(err)}`
    )
    return { ok: false, reason: 'unexpected_error', error: err }
  }
}
