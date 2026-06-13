import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getMovieDetails, getImageUrl, BACKDROP_SIZE, POSTER_SIZE } from '../services/tmdb';
import { EMBED_SOURCES, type SourceId } from '../services/sources';
import type { MovieDetails } from '../types/tmdb';

const SOURCES = [
  { id: 'embedsu', label: 'Source 1', url: (id: string) => `https://embed.su/embed/movie/${id}` },
  { id: 'vidsrc', label: 'Source 2', url: (id: string) => `https://vidsrc.me/embed/movie?tmdb=${id}` },
  { id: 'autoembed', label: 'Source 3', url: (id: string) => `https://autoembed.cc/movie/tmdb/${id}` },
  { id: 'multiembed', label: 'Source 4', url: (id: string) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` },
  { id: 'vidsrc2', label: 'Source 5', url: (id: string) => `https://vidsrc.to/embed/movie/${id}` },
];

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [started, setStarted] = useState(false);
  const [activeSource, setActiveSource] = useState(0);

  useEffect(() => {
    if (!id) return;
    getMovieDetails(parseInt(id)).then(setMovie).catch(console.error);
  }, [id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  const currentUrl = id ? SOURCES[activeSource].url(id) : '';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
          <ArrowLeft size={20} />
        </button>
        {movie?.poster_path && (
          <img src={getImageUrl(movie.poster_path, POSTER_SIZE)} alt="" style={{ width: 32, borderRadius: 4 }} />
        )}
        <span style={{ color: 'white', fontSize: 14, fontWeight: 500, flex: 1 }}>{movie?.title}</span>
        <button onClick={() => navigate(`/movie/${id}`)} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
          Details
        </button>
      </div>

      {/* Video area */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {!started ? (
          // Splash screen
          <>
            {movie?.backdrop_path && (
              <img
                src={getImageUrl(movie.backdrop_path, BACKDROP_SIZE)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.25)', position: 'absolute', inset: 0 }}
              />
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => setStarted(true)}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
              </button>
            </div>
          </>
        ) : (
          <iframe
            key={`${activeSource}-${id}`}
            src={currentUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        )}
      </div>

      {/* Source pills */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '40px 16px 20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
        zIndex: 10,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Source</span>
        {SOURCES.map((src, i) => (
          <button
            key={src.id}
            onClick={() => { setActiveSource(i); if (!started) setStarted(true); }}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: activeSource === i ? 'white' : 'rgba(255,255,255,0.15)',
              background: activeSource === i ? 'white' : 'rgba(255,255,255,0.05)',
              color: activeSource === i ? 'black' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {src.label}
          </button>
        ))}
      </div>
    </div>
  );
}
