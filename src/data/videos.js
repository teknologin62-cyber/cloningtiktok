// ============================================================
// DATA CONTOH UNTUK PROTOTIPE APLIKASI VIDEO PENDEK "VIDORA"
// ============================================================
// Semua data di bawah ini adalah data tiruan (mock) untuk demo.
// Tidak ada koneksi ke backend atau database.
//
// Sumber video (CC0 / bebas pakai):
//   - MDN Web Docs media samples (CC0)
//   - Wikimedia Commons (CC0)
//   - W3Schools sample video (demo)
// ============================================================

export const videos = [
  {
    id: 1,
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    posterGradient: 'linear-gradient(160deg, #667eea 0%, #764ba2 100%)',
    shareUrl: 'https://vidora.app/v/1',   // URL demo untuk fitur bagikan
    creator: {
      username: 'bunga.cipta',
      displayName: 'Bunga Cipta',
      avatarGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      verified: true,
    },
    caption: 'Pagi yang cerah di taman bunga! Jangan lupa nikmati alam ya 🌸',
    music: 'Lofi Morning - Chill Beats Collection',
    stats: {
      likes: 12800,
      comments: 342,
      bookmarks: 890,
      shares: 156,
    },
    comments: [
      { id: 'c1', username: 'rara.senja',    text: 'Indah banget bunganya! 😍',             time: '2 jam lalu' },
      { id: 'c2', username: 'dimas.foto',    text: 'Lokasi mana ini kak?',                   time: '1 jam lalu' },
      { id: 'c3', username: 'nindi.kreatif', text: 'Video slow-motion nya keren!',           time: '45 mnt lalu' },
      { id: 'c4', username: 'farhan.lens',   text: 'Warna bunganya vivid banget, editing?',  time: '20 mnt lalu' },
    ],
  },
  {
    id: 2,
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    posterGradient: 'linear-gradient(160deg, #f6d365 0%, #fda085 100%)',
    shareUrl: 'https://vidora.app/v/2',
    creator: {
      username: 'arif.lensa',
      displayName: 'Arif Lensa',
      avatarGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      verified: false,
    },
    caption: 'Eksperimen sinematik pertama saya. Bagaimana menurut kalian? 🎬',
    music: 'Ambient Dreams - Electronic Sounds',
    stats: {
      likes: 5400,
      comments: 128,
      bookmarks: 420,
      shares: 67,
    },
    comments: [
      { id: 'c1', username: 'tania.visual',  text: 'Color grading-nya mantap!',              time: '3 jam lalu' },
      { id: 'c2', username: 'budi.sinema',   text: 'Sudut kamera-nya bagus banget',          time: '2 jam lalu' },
      { id: 'c3', username: 'lina.kreatif',  text: 'Terus berkarya ya! 👍',                  time: '1 jam lalu' },
    ],
  },
  {
    id: 3,
    videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm',
    posterGradient: 'linear-gradient(160deg, #fa709a 0%, #fee140 100%)',
    shareUrl: 'https://vidora.app/v/3',
    creator: {
      username: 'dewi.petualang',
      displayName: 'Dewi Petualang',
      avatarGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      verified: true,
    },
    caption: 'Film animasi open source terbaik sepanjang masa! 🐰',
    music: 'Night Vibes - Lofi House Mix',
    stats: {
      likes: 8900,
      comments: 215,
      bookmarks: 1200,
      shares: 98,
    },
    comments: [
      { id: 'c1', username: 'eko.animasi',   text: 'Big Buck Bunny klasik banget! 🐰',       time: '5 jam lalu' },
      { id: 'c2', username: 'sari.kreatif',  text: 'Open source tapi kualitasnya luar biasa', time: '3 jam lalu' },
      { id: 'c3', username: 'hadi.motion',   text: 'Sudah nonton ini 100x masih suka',        time: '2 jam lalu' },
      { id: 'c4', username: 'putri.film',    text: 'Blender Foundation keren banget!',        time: '1 jam lalu' },
      { id: 'c5', username: 'yoga.studio',   text: 'Referensi animasi terbaik untuk belajar', time: '30 mnt lalu' },
    ],
  },
  {
    id: 4,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    posterGradient: 'linear-gradient(160deg, #a18cd1 0%, #fbc2eb 100%)',
    shareUrl: 'https://vidora.app/v/4',
    creator: {
      username: 'rio.jalan2',
      displayName: 'Rio Jalan2',
      avatarGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      verified: false,
    },
    caption: 'Melarikan diri dari rutinitas! Liburan terbaik 🌴',
    music: 'Summer Escape - Tropical House',
    stats: {
      likes: 3200,
      comments: 89,
      bookmarks: 340,
      shares: 45,
    },
    comments: [
      { id: 'c1', username: 'maya.travel',   text: 'Mau ikut dong! 🌴',                      time: '4 jam lalu' },
      { id: 'c2', username: 'andi.explore',  text: 'Destinasinya dimana ini?',               time: '2 jam lalu' },
    ],
  },
];

// Fungsi untuk memformat angka besar menjadi lebih ringkas
// Contoh: 12800 -> "12.8K", 342 -> "342"
export function formatCount(num) {
  if (num >= 1000) {
    const result = (num / 1000).toFixed(1);
    return result.endsWith('.0') ? result.slice(0, -2) + 'K' : result + 'K';
  }
  return String(num);
}
