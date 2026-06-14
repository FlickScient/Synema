import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

type SourceType = 'source1' | 'source2' | 'source3' | 'source4' | 'source5' | 'archive' | 'upload';

export function PlayerPage() {
  const { id: tmdbId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Movie info
  const [title, setTitle] = useState('Loading...');
  const [year, setYear] = useState<number | undefined>();
  const [backdropUrl, setBackdropUrl] = useState<string | undefined>();

  // Player state
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
  const [activeSource, setActiveSource] = useState<SourceType>('source1');
  const [lastPlayedTime, setLastPlayedTime] = useState<number | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadQuality, setUploadQuality] = useState('1080p');
  const [uploadLanguage, setUploadLanguage] = useState('English');
  const [brightness, setBrightness] = useState(100);
  const [gestureBrightness, setGestureBrightness] = useState<number | null>(null);
  const [gestureVolume, setGestureVolume] = useState<number | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [uploadedSources, setUploadedSources] = useState<string[]>([]);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);

  // Fetch movie info from TMDB
  useEffect(() => {
    if (!tmdbId) return;
    const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
    fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || 'Unknown');
        setYear(data.release_date ? new Date(data.release_date).getFullYear() : undefined);
        if (data.backdrop_path) {
          setBackdropUrl(`https://image.tmdb.org/t/p/original${data.backdrop_path}`);
        }
      })
      .catch(console.error);
  }, [tmdbId]);

  // Load saved progress
  useEffect(() => {
    if (!tmdbId) return;
    const saved = localStorage.getItem(`synema_progress_${tmdbId}`);
    if (saved) setLastPlayedTime(parseFloat(saved));
  }, [tmdbId]);

  // Save progress every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying && tmdbId) {
        localStorage.setItem(`synema_progress_${tmdbId}`, videoRef.current.currentTime.toString());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tmdbId, isPlaying]);

  // Orientation handling
  useEffect(() => {
    const handle = () => {};
    window.addEventListener('orientationchange', handle);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('orientationchange', handle);
      window.removeEventListener('resize', handle);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls || isLocked) return;
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isLocked) setShowControls(false);
    }, 3000);
    const container = containerRef.current;
    if (!container) return;
    const show = () => setShowControls(true);
    container.addEventListener('mousemove', show);
    container.addEventListener('touchstart', show);
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      container.removeEventListener('mousemove', show);
      container.removeEventListener('touchstart', show);
    };
  }, [showControls, isLocked]);

  // Fullscreen change
  useEffect(() => {
    const handle = async () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs && screen.orientation?.lock) {
        await screen.orientation.lock('landscape-primary').catch(() => {});
      }
    };
    document.addEventListener('fullscreenchange', handle);
    return () => document.removeEventListener('fullscreenchange', handle);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': navigate(-1); break;
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'ArrowLeft':
          if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          break;
        case 'm': setIsMuted((p) => !p); break;
        case 'f':
          if (!isFullscreen) containerRef.current?.requestFullscreen?.();
          else document.exitFullscreen?.();
          break;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [duration, isFullscreen, navigate]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration);
    const onVolume = () => setVolume(video.volume);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolume);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolume);
    };
  }, []);

  // Gesture handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeSource !== 'source1' || e.button !== 0) return;
    gestureStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setShowControls(true);
    if (!gestureStartRef.current || !videoRef.current || activeSource !== 'source1') return;
    const deltaX = e.clientX - gestureStartRef.current.x;
    const deltaY = e.clientY - gestureStartRef.current.y;
    const W = containerRef.current?.clientWidth || 1;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + (deltaX / W) * 60));
      gestureStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    }
    if (e.clientX < W / 3 && Math.abs(deltaY) > 50) {
      const nb = Math.max(0, Math.min(200, brightness - deltaY * 0.5));
      setBrightness(nb);
      setGestureBrightness(nb);
      gestureStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    }
    if (e.clientX > (W * 2) / 3 && Math.abs(deltaY) > 50 && videoRef.current) {
      const nv = Math.max(0, Math.min(1, volume - deltaY * 0.005));
      videoRef.current.volume = nv;
      setVolume(nv);
      setGestureVolume(nv * 100);
      gestureStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    }
  };

  const handleMouseUp = () => {
    gestureStartRef.current = null;
    setTimeout(() => { setGestureBrightness(null); setGestureVolume(null); }, 1000);
  };

  // Double tap
  const handleTap = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    const tap = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: now };
    if (
      lastTapRef.current &&
      now - lastTapRef.current.time < 300 &&
      Math.abs(tap.x - lastTapRef.current.x) < 50 &&
      Math.abs(tap.y - lastTapRef.current.y) < 50
    ) {
      if (!videoRef.current) return;
      const W = containerRef.current?.clientWidth || 1;
      if (tap.x < W / 2) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      else videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = tap;
      if (activeSource === 'source1') setShowControls((p) => !p);
    }
  };

  const formatTime = (t: number) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    setShowSplash(false);
    if (videoRef.current) {
      if (lastPlayedTime !== null) videoRef.current.currentTime = lastPlayedTime;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleFullscreen = async () => {
    if (!isFullscreen) {
      await containerRef.current?.requestFullscreen?.();
      if (screen.orientation?.lock) await screen.orientation.lock('landscape-primary').catch(() => {});
    } else {
      await document.exitFullscreen?.();
      if (screen.orientation?.unlock) screen.orientation.unlock();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const getSourceUrl = (source: SourceType): string => {
    switch (source) {
      case 'source1': return `https://embed.su/embed/movie/${tmdbId}`;
      case 'source2': return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      case 'source3': return `https://vidsrc.to/embed/movie/${tmdbId}`;
      case 'source4': return `https://player.smashy.stream/movie/${tmdbId}`;
      case 'source5': return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
      case 'archive': return archiveUrl || '';
      case 'upload': return uploadedSources[0] || '';
      default: return '';
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, width: '100%', height: '100dvh',
    backgroundColor: '#000', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', zIndex: 50,
    filter: `brightness(${brightness}%)`,
  };

  const videoContainerStyle: React.CSSProperties = {
    position: 'relative', width: '100%', height: '100%', backgroundColor: '#000',
  };

  const videoStyle: React.CSSProperties = {
    width: '100%', height: '100%', objectFit: objectFit,
    display: activeSource === 'source1' && !showSplash ? 'block' : 'none',
  };

  const iframeStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none',
    display: activeSource !== 'source1' && !showSplash ? 'block' : 'none',
    position: 'absolute', inset: 0, zIndex: 3,
  };

  const splashStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000',
    display: showSplash ? 'flex' : 'none',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    filter: 'brightness(0.25)', zIndex: 1,
  };

  const splashOverlayStyle: React.CSSProperties = {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
    display: showSplash ? 'flex' : 'none',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2,
  };

  const playButtonStyle: React.CSSProperties = {
    width: 80, height: 80, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'transform 0.3s ease', marginBottom: 40,
  };

  const playButtonIconStyle: React.CSSProperties = {
    width: 0, height: 0,
    borderLeft: '20px solid rgba(255,255,255,0.9)',
    borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: 5,
  };

  const splashTextStyle: React.CSSProperties = {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 700,
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  };

  const lastPlayedStyle: React.CSSProperties = {
    position: 'absolute', bottom: 160,
    color: 'rgba(255,255,255,0.8)', fontSize: 14,
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  };

  const topBarStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
    display: showControls && !isLocked ? 'flex' : 'none',
    alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: 16, paddingRight: 16, color: '#fff',
    zIndex: 10, transition: 'opacity 0.3s ease', opacity: showControls ? 1 : 0,
  };

  const centerControlsStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    display: activeSource === 'source1' && !showSplash && (showControls || isLocked) ? 'flex' : 'none',
    alignItems: 'center', justifyContent: 'center', gap: 30, zIndex: 8,
  };

  const controlButtonStyle: React.CSSProperties = {
    width: 50, height: 50, borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)', border: 'none',
    color: '#fff', cursor: 'pointer', fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  };

  const bottomControlsStyle: React.CSSProperties = {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    display: activeSource === 'source1' && !showSplash && showControls && !isLocked ? 'flex' : 'none',
    flexDirection: 'column', padding: '20px 16px 16px', gap: 12, zIndex: 9,
    transition: 'opacity 0.3s ease', opacity: showControls ? 1 : 0,
  };

  const seekBarStyle: React.CSSProperties = {
    width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2, cursor: 'pointer', position: 'relative', overflow: 'hidden',
  };

  const seekProgressStyle: React.CSSProperties = {
    height: '100%', backgroundColor: '#7c3aed',
    width: `${(currentTime / duration) * 100}%`, borderRadius: 2,
  };

  const sourcePillsStyle: React.CSSProperties = {
    display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8,
  };

  const sourcePillStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 20,
    border: active ? 'none' : '1px solid rgba(255,255,255,0.5)',
    backgroundColor: active ? '#7c3aed' : 'transparent',
    color: active ? '#fff' : '#fff', fontSize: 12,
    cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: 500,
  });

  const lockIconStyle: React.CSSProperties = {
    position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
    color: '#fff', fontSize: 24, cursor: 'pointer', zIndex: 11,
    display: isLocked ? 'block' : 'none',
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    display: showUploadModal ? 'flex' : 'none',
    alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(10px)',
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 24, width: '90%', maxWidth: 400, backdropFilter: 'blur(20px)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, color: '#fff', fontSize: 14,
  };

  const brightnessIndicatorStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', textAlign: 'center',
    display: gestureBrightness !== null ? 'flex' : 'none',
    flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 20,
  };

  const volumeIndicatorStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', right: 24, transform: 'translateY(-50%)',
    display: gestureVolume !== null ? 'flex' : 'none',
    flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 20,
  };

  const btnStyle: React.CSSProperties = {
    padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer',
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer',
  };

  const sourceTypes: SourceType[] = ['source1', 'source2', 'source3', 'source4', 'source5', 'archive', 'upload'];
  const sourceLabels: Record<SourceType, string> = {
    source1: 'Source 1', source2: 'Source 2', source3: 'Source 3',
    source4: 'Source 4', source5: 'Source 5', archive: 'Archive', upload: 'Upload',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onTouchStart={handleTap}
    >
      <div style={videoContainerStyle}>

        {/* Splash Screen */}
        <div style={splashStyle} />
        <div style={splashOverlayStyle}>
          {lastPlayedTime !== null && (
            <div style={lastPlayedStyle}>Last played: {formatTime(lastPlayedTime)}</div>
          )}
          <div
            style={playButtonStyle}
            onClick={handlePlay}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
          >
            <div style={playButtonIconStyle} />
          </div>
          {showSplash && (
            <div style={splashTextStyle}>{title}{year && ` (${year})`}</div>
          )}
        </div>

        {/* Native Video (source1) */}
        <video
          ref={videoRef}
          style={videoStyle}
          controls={false}
          controlsList="nodownload"
          crossOrigin="anonymous"
          muted={isMuted}
        />

        {/* Iframe (source2-5, archive, upload) */}
        <iframe
          ref={iframeRef}
          style={iframeStyle}
          src={activeSource !== 'source1' && !showSplash ? getSourceUrl(activeSource) : undefined}
          allowFullScreen
          allow="fullscreen; autoplay"
        />

        {/* Top Bar */}
        <div style={topBarStyle}>
          <button
            onClick={() => navigate(-1)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: 8 }}
          >←</button>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}{year && ` (${year})`}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 8 }}>
              ⚙️
            </button>
          </div>
        </div>

        {/* Center Controls (native video only) */}
        <div style={centerControlsStyle}>
          {!isLocked && (
            <>
              <button
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
                style={controlButtonStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
              >↺10</button>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play().catch(() => {});
                  }
                  setIsPlaying((p) => !p);
                }}
                style={{ ...controlButtonStyle, width: 70, height: 70, fontSize: 28 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
              >{isPlaying ? '⏸' : '▶'}</button>
              <button
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); }}
                style={controlButtonStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
              >↻10</button>
            </>
          )}
        </div>

        {/* Lock Icon */}
        <div style={lockIconStyle} onClick={() => setIsLocked(false)}>🔒</div>

        {/* Bottom Controls (native video only) */}
        <div style={bottomControlsStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#fff', minWidth: 36 }}>{formatTime(currentTime)}</span>
            <div style={seekBarStyle} onClick={handleSeek}>
              <div style={seekProgressStyle} />
            </div>
            <span style={{ fontSize: 12, color: '#fff', minWidth: 36 }}>{formatTime(duration)}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setObjectFit(objectFit === 'contain' ? 'cover' : 'contain')} style={btnStyle}>
              {objectFit === 'contain' ? 'Fit: Contain' : 'Fit: Cover'}
            </button>
            <select value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)} style={selectStyle}>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setPlaybackRate(rate);
                if (videoRef.current) videoRef.current.playbackRate = rate;
              }}
              style={selectStyle}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
            <button onClick={handleFullscreen} style={btnStyle}>{isFullscreen ? '↙' : '↗'}</button>
            <button onClick={() => setIsLocked((p) => !p)} style={btnStyle}>{isLocked ? '🔒' : '🔓'}</button>
          </div>

          {/* Source Pills */}
          <div style={sourcePillsStyle}>
            {sourceTypes.map((source) => (
              <button
                key={source}
                onClick={() => { setActiveSource(source); setShowSplash(false); }}
                style={sourcePillStyle(activeSource === source)}
              >
                {sourceLabels[source]}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                style={{ ...sourcePillStyle(false), marginLeft: 'auto' }}
              >+ Upload</button>
            )}
          </div>
        </div>

        {/* Brightness Indicator */}
        <div style={brightnessIndicatorStyle}>
          <div style={{ fontSize: 24 }}>☀️</div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{Math.round(brightness)}%</div>
        </div>

        {/* Volume Indicator */}
        <div style={volumeIndicatorStyle}>
          <div style={{ fontSize: 24 }}>🔊</div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{Math.round(gestureVolume || 0)}%</div>
        </div>
      </div>

      {/* Upload Modal */}
      <div style={modalStyle} onClick={() => setShowUploadModal(false)}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <h2 style={{ color: '#fff', marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Upload Source</h2>
          <input type="text" placeholder="Direct MP4 URL" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} style={inputStyle} />
          <select value={uploadQuality} onChange={(e) => setUploadQuality(e.target.value)} style={inputStyle}>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4K">4K</option>
          </select>
          <input type="text" placeholder="Language" value={uploadLanguage} onChange={(e) => setUploadLanguage(e.target.value)} style={inputStyle} />
          <button
            onClick={() => {
              setUploadedSources([...uploadedSources, uploadUrl]);
              setShowUploadModal(false);
              setUploadUrl('');
              setUploadQuality('1080p');
              setUploadLanguage('English');
            }}
            style={{ width: '100%', padding: '10px 12px', backgroundColor: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6d28d9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7c3aed'; }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
