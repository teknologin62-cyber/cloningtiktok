// ============================================================
// VIDEO FEED - Wadah feed video dengan scroll vertikal
// ============================================================
// Komponen ini menampilkan daftar video dalam bentuk feed vertikal.
// Pengguna dapat menggulir ke bawah untuk melihat video berikutnya.
// Setiap video akan menempel (snap) ke layar saat digulir.
// ============================================================

import VideoCard from './VideoCard';
import { videos } from '../data/videos';
import './VideoFeed.css';

function VideoFeed() {
  return (
    <div className="video-feed">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

export default VideoFeed;
