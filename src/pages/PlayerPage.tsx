import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { searchArchive } from '../services/archive';
import { getMovieDetails, getImageUrl, BACKDROP_SIZE, POSTER_SIZE } from '../services/tmdb';
import type { MovieDetails } from '../types/tmdb';

type SourceType = 'source1' | 'source2' | 'source3' | 'source4' | 'source5' | 'archive' | 'upload';

interface UploadRow {
  id: string;
  video_url: string;
  quality: string;
  language: string;
}

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [lastPlayedTime, setLastPlayedTime] = useState<number | null>(null);
  const [activeSource, setActiveSource] = useState<SourceType>('source1');
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);
  const [archiveSearched, setArchiveSearched] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [gestureBrightness, setGestureBrightness] = useState<number | null>(null);
  const [gestureVolume, setGestureVolume] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadQuality, setUploadQuality] = useState('1080p');
  const [uploadLanguage, setUploadLanguage] = useState('English');
  const [uploadSaving, setUploadSaving] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    if (!id) return;
    getMovieDetails(parseInt(id)).then(setMovie).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`synema_progress_${id}`);
    if (saved) setLastPlayedTime(parseFloat(saved));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('movie_uploads')
      .select('id, video_url, quality, language')
      .eq('tmdb_id', parseInt(id))
      .then(({ data }) => { if (data) setUploads(data); });
  }, [id]);

  useEffect(() => {
    if (activeSource !== 'archive' || archiveSearched || !movie) return;
    setArchiveSearched(true);
    setArchiveLoading(true);
    searchArchive(movie.title).then(result => {
      setArchiveUrl(result?.videoUrl || null);
      setArchiveLoading(false);
    });
  }, [activeSource, archiveSearched, movie]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying && id) {
        localStorage.setItem(`synema_progress_${id}`, videoRef.current.currentTime.toString());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, isPlaying]);

  useEffect(() => {
    const update = () => setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isLocked) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isLocked]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, []);

  useEffect(() => {
    const handler = async () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs && (screen.orientation as any)?.lock) {
        try { await (screen.orientation as any).lock('landscape-primary'); } catch {}
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(video.currentTime);
    const onDur = () => setDuration(video.duration);
    const onVol = () => setVolume(video.volume);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDur);
    video.addEventListener('volumechange', onVol);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDur);
      video.removeEventListener('volumechange', onVol);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      switch (e.key) {
        case 'Escape': navigate(-1); break;
        case ' ':
          e.preventDefault();
          if (video) { isPlaying ? video.pause() : video.play(); }
          break;
        case 'ArrowLeft':
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          if (video) video.currentTime = Math.min(duration, video.currentTime + 10);
          break;
        case 'm':
          if (video) { video.muted = !video.muted; setIsMuted(v => !v); }
          break;
        case 'f': handleFullscreen(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, duration, navigate]);

  const formatTime = (t: number) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    setShowSplash(false);
    const video = videoRef.current;
    if (video) {
      if (lastPlayedTime) video.currentTime = lastPlayedTime;
      video.play().catch(() => {});
    }
  };

  const handleFullscreen = async () => {
    const isNative = activeSource === 'archive' || activeSource === 'upload';
    const el = isNative ? videoRef.current : iframeRef.current;
    if (!el) return;
    if (!isFullscreen) {
      try { await el.requestFullscreen(); } catch {}
    } else {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const getSourceUrl = (): string => {
    if (!id) return '';
    switch (activeSource) {
      case 'source1': return `https://embed.su/embed/movie/${id}`;
      case 'source2': return `https://vidsrc.me/embed/movie?tmdb=${id}`;
      case 'source3': return `https://vidsrc.to/embed/movie/${id}`;
      case 'source4': return `https://player.smashy.stream/movie/${id}`;
      case 'source5': return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      case 'archive': return archiveUrl || '';
      case 'upload': return uploads[0]?.video_url || '';
      default: return '';
    }
  };

  const isNativeSource = activeSource === 'archive' || activeSource === 'upload';

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const touch = e.touches[0];
    const tap = { x: touch.clientX, y: touch.clientY, time: now };
    if (
      lastTapRef.current &&
      now - lastTapRef.current.time < 300 &&
      Math.abs(tap.x - lastTapRef.current.x) < 60
    ) {
      if (!videoRef.current || !isNativeSource) return;
      const isLeft = tap.x < (containerRef.current?.clientWidth || 0) / 2;
      videoRef.current.currentTime = isLeft
        ? Math.max(0, videoRef.current.currentTime - 10)
        : Math.min(duration, videoRef.current.currentTime + 10);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = tap;
      gestureStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      resetControlsTimer();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!gestureStartRef.current || !isNativeSource || !videoRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - gestureStartRef.current.x;
    const dy = touch.clientY - gestureStartRef.current.y;
    const W = containerRef.current?.clientWidth || 1;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      const delta = (dx / W) * 60;
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
      gestureStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    } else if (Math.abs(dy) > 20) {
      if (touch.clientX < W / 2) {
        const nb = Math.max(0, Math.min(200, brightness - dy * 0.5));
        setBrightness(nb);
        setGestureBrightness(nb);
      } else {
        const nv = Math.max(0, Math.min(1, volume - dy * 0.005));
        videoRef.current.volume = nv;
        setVolume(nv);
        setGestureVolume(Math.round(nv * 100));
      }
      gestureStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  };

  const handleTouchEnd = () => {
    gestureStartRef.current = null;
    setTimeout(() => { setGestureBrightness(null); setGestureVolume(null); }, 1200);
  };

  const handleSaveUpload = async () => {
    if (!uploadUrl || !id) return;
    setUploadSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('movie_uploads').insert({
      tmdb_id: parseInt(id),
      title: movie?.title || '',
      video_url: uploadUrl,
      quality: uploadQuality,
      language: uploadLanguage,
      uploaded_by: user?.id,
    }).select().single();
    if (!error && data) {
      setUploads(p => [...p, data]);
      setShowUploadModal(false);
      setUploadUrl('');
    }
    setUploadSaving(false);
  };

  const backdropUrl = movie?.backdrop_path ? getImageUrl(movie.backdrop_path, BACKDROP_SIZE) : undefined;
  const sources: { id: SourceType; label: string }[] = [
    { id: 'source1', label: 'Source 1' },
    { id: 'source2', label: 'Source 2' },
    { id: 'source3', label: 'Source 3' },
    { id: 'source4', label: 'Source 4' },
    { id: 'source5', label: 'Source 5' },
    { id: 'archive', label: 'Archive' },
    ...(uploads.length > 0 || isAdmin ? [{ id: 'upload' as SourceType, label: `Upload${uploads.length > 0 ? ` (${uploads.length})` : ''}` }] : []),
  ];

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '5px 13px',
    borderRadius: 999,
    border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.2)'}`,
    background: active ? '#fff' : 'rgba(255,255,255,0.06)',
    color: active ? '#000' : 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  });

  const fill: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', backgroundColor: '#000', overflow: 'hidden', zIndex: 9999 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={resetControlsTimer}
    >
      {/* SPLASH */}
      {showSplash && (
        <div style={{ ...fill, zIndex: 5 }}>
          {backdropUrl && (
            <img src={backdropUrl} alt="" style={{ ...fill, objectFit: 'cover', filter: 'brightness(0.22)' }} />
          )}
          <div style={{ ...fill, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {lastPlayedTime && (
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 14, background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: 20 }}>
                Resume from {formatTime(lastPlayedTime)}
              </div>
            )}
            <button onClick={handlePlay} style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
            </button>
            <div style={{ position: 'absolute', bottom: 50, textAlign: 'center', padding: '0 24px' }}>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{movie?.title}</div>
              {movie?.release_date && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>{new Date(movie.release_date).getFullYear()}</div>}
            </div>
          </div>
        </div>
      )}

      {/* NATIVE VIDEO */}
      {!showSplash && isNativeSource && (
        <>
          {activeSource === 'archive' && archiveLoading && (
            <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Searching archive…</span>
            </div>
          )}
          {activeSource === 'archive' && !archiveLoading && !archiveUrl && (
            <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 40 }}>🎞</span>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>Not in public archive</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: 0 }}>Try another source</p>
            </div>
          )}
          {activeSource === 'upload' && uploads.length === 0 && (
            <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 40 }}>📁</span>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>No uploaded source yet</p>
            </div>
          )}
          {getSourceUrl() && (
            <video
              ref={videoRef}
              key={getSourceUrl()}
              src={getSourceUrl()}
              style={{ ...fill, objectFit: objectFit, filter: `brightness(${brightness}%)` }}
              autoPlay
              playsInline
            />
          )}
        </>
      )}

      {/* IFRAME */}
      {!showSplash && !isNativeSource && (
        <iframe
          ref={iframeRef}
          key={`${activeSource}-${id}`}
          src={getSourceUrl()}
          style={{ ...fill, border: 'none' }}
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      )}

      {/* TOP BAR */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', zIndex: 20,
        opacity: showControls && !isLocked ? 1 : 0,
        pointerEvents: showControls && !isLocked ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M19 12H5M5 12l7-7M5 12l7 7" /></svg>
        </button>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 10px' }}>
          {movie?.title}
        </span>
        <button onClick={() => navigate(`/movie/${id}`)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12 }}>
          Details
        </button>
      </div>

      {/* CENTER CONTROLS — native video only */}
      {isNativeSource && !showSplash && showControls && !isLocked && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 28, zIndex: 15 }}>
          <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
            style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↺10
          </button>
          <button onClick={() => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); } }}
            style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); }}
            style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ↻10
          </button>
        </div>
      )}

      {/* LOCK ICON */}
      {isLocked && (
        <button onClick={() => setIsLocked(false)}
          style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 46, height: 46, color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🔒
        </button>
      )}

      {/* BOTTOM BAR */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
        padding: '48px 14px 18px', zIndex: 15,
        opacity: showControls && !isLocked ? 1 : 0,
        pointerEvents: showControls && !isLocked ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }}>
        {/* Seek bar — native only */}
        {isNativeSource && !showSplash && (
          <div style={{ marginBottom: 12 }}>
            <div onClick={handleSeekClick} style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, cursor: 'pointer', position: 'relative', marginBottom: 6 }}>
              <div style={{ height: '100%', background: '#7c3aed', borderRadius: 2, width: `${duration ? (currentTime / duration) * 100 : 0}%`, position: 'relative' }}>
                <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, borderRadius: '50%', background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{formatTime(currentTime)}</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{formatTime(duration)}</span>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                { label: objectFit === 'contain' ? 'Fit' : 'Fill', action: () => setObjectFit(f => f === 'contain' ? 'cover' : 'contain') },
                { label: `${playbackRate}x`, action: () => {} },
                { label: isFullscreen ? '↙ Exit' : '↗ Full', action: handleFullscreen },
                { label: '🔓 Lock', action: () => setIsLocked(true) },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                  {btn.label}
                </button>
              ))}
              <select value={playbackRate} onChange={e => {
                const r = parseFloat(e.target.value);
                setPlaybackRate(r);
                if (videoRef.current) videoRef.current.playbackRate = r;
              }} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r} style={{ background: '#111' }}>{r}x</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Source pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, flexShrink: 0 }}>Source</span>
          {sources.map(src => (
            <button key={src.id} onClick={() => setActiveSource(src.id)} style={pill(activeSource === src.id)}>
              {src.label}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => setShowUploadModal(true)}
              style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              +
            </button>
          )}
        </div>
      </div>

      {/* BRIGHTNESS */}
      {gestureBrightness !== null && (
        <div style={{ position: 'absolute', left: '22%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 25, background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ fontSize: 26 }}>☀️</div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{Math.round(gestureBrightness)}%</div>
        </div>
      )}

      {/* VOLUME */}
      {gestureVolume !== null && (
        <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', textAlign: 'center', zIndex: 25, background: 'rgba(0,0,0,0.5)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ fontSize: 26 }}>🔊</div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{gestureVolume}%</div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: showUploadModal ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }} onClick={() => setShowUploadModal(false)}>
        <div style={{ width: '100%', maxWidth: 360, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Add video source</span>
            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 5 }}>Direct .mp4 URL</div>
          <input style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
            type="url" placeholder="https://example.com/movie.mp4" value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <select value={uploadQuality} onChange={e => setUploadQuality(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none' }}>
              {['480p','720p','1080p','4K'].map(q => <option key={q} value={q} style={{ background: '#111' }}>{q}</option>)}
            </select>
            <input style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
              placeholder="English" value={uploadLanguage} onChange={e => setUploadLanguage(e.target.value)} />
          </div>
          <button onClick={handleSaveUpload} disabled={!uploadUrl || uploadSaving}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: !uploadUrl || uploadSaving ? 'rgba(124,58,237,0.4)' : '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 14, cursor: !uploadUrl || uploadSaving ? 'not-allowed' : 'pointer' }}>
            {uploadSaving ? 'Saving…' : 'Save source'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
            }
