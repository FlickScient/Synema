import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { searchArchive } from '../services/archive';
import {
  getMovieDetails, getSimilarMovies, getImageUrl,
  BACKDROP_SIZE, POSTER_SIZE,
} from '../services/tmdb';
import type { MovieDetails, Movie } from '../types/tmdb';

type SourceType = 'source1' | 'source2' | 'source3' | 'source4' | 'source5' | 'archive' | 'upload';
interface UploadRow { id: string; video_url: string; quality: string; language: string; }

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IcBack = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M5 12l7-7M5 12l7 7" />
  </svg>
);
const IcPlay = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const IcPause = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const IcRewind = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 5C7.86 5 4.5 8.36 4.5 12.5S7.86 20 12 20s7.5-3.36 7.5-7.5"
      stroke="white" strokeWidth="2" strokeLinecap="round" />
    <polyline points="7,2.5 7,7 11.5,7" stroke="white" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="15" fontSize="5.5" fill="white" fontFamily="system-ui,sans-serif"
      fontWeight="800" textAnchor="middle">10</text>
  </svg>
);
const IcForward = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 5c4.14 0 7.5 3.36 7.5 7.5S16.14 20 12 20 4.5 16.64 4.5 12.5"
      stroke="white" strokeWidth="2" strokeLinecap="round" />
    <polyline points="17,2.5 17,7 12.5,7" stroke="white" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="15" fontSize="5.5" fill="white" fontFamily="system-ui,sans-serif"
      fontWeight="800" textAnchor="middle">10</text>
  </svg>
);
const IcLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IcPiP = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor" />
  </svg>
);
const IcSettings = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65
      1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9
      19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68
      15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0
      0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0
      1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2
      0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0
      4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IcFullscreen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
const IcExitFs = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
    <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
  </svg>
);
const IcVolSvg = ({ muted, vol }: { muted: boolean; vol: number }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
    strokeWidth="2" strokeLinecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="none" />
    {muted || vol === 0
      ? <><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
      : vol > 0.5
        ? <><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>
        : <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    }
  </svg>
);
const IcSunSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
    strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" fill="white" stroke="none" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const IcFilm = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const IcUpload = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IcStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hudTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hudClearTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const sourceFailTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressActiveRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  // Fixed at gesture start — used for left/right side detection, never overwritten mid-gesture
  const touchInitialRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureTypeRef = useRef<'none' | 'h' | 'v' | 'swipedown'>('none');
  const seekDraggingRef = useRef(false);
  // Brightness overlay opacity (0 = fully bright, 0.85 = darkest)
  const brightnessOpacityRef = useRef(0);

  // Movie & playback
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches
  );

  // UI
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [seekDragging, setSeekDragging] = useState(false);

  // Progress resume
  const [lastPlayedTime, setLastPlayedTime] = useState<number | null>(null);

  // Sources — default source1
  const [activeSource, setActiveSource] = useState<SourceType>('source1');
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [activeUploadIdx, setActiveUploadIdx] = useState(0);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);
  const [archiveSearched, setArchiveSearched] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Gestures & HUD
  // brightnessOverlay = opacity of black overlay div (0 = max brightness, 0.85 = min brightness)
  const [brightnessOverlay, setBrightnessOverlay] = useState(0);
  const [hudType, setHudType] = useState<'volume' | 'brightness' | null>(null);
  const [hudValue, setHudValue] = useState(0);
  const [hudVisible, setHudVisible] = useState(false);
  const [rippleLeft, setRippleLeft] = useState(0);
  const [rippleRight, setRippleRight] = useState(0);
  const [seekGesturePreview, setSeekGesturePreview] = useState<number | null>(null);
  const [swipeDownY, setSwipeDownY] = useState(0);
  const [isClosingDown, setIsClosingDown] = useState(false);

  // Source failure
  const [showSourceFail, setShowSourceFail] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadQuality, setUploadQuality] = useState('1080p');
  const [uploadLanguage, setUploadLanguage] = useState('English');
  const [uploadSaving, setUploadSaving] = useState(false);

  // ── Computed ────────────────────────────────────────────────────────────────

  const isNativeSource = activeSource === 'archive' || activeSource === 'upload';
  // Full-screen video mode = landscape OR system fullscreen
  const isFullVideo = isLandscape || isFullscreen;

  const getSourceUrl = useCallback((): string => {
    if (!id) return '';
    switch (activeSource) {
      case 'source1': return `https://embed.su/embed/movie/${id}`;
      case 'source2': return `https://vidsrc.me/embed/movie?tmdb=${id}`;
      case 'source3': return `https://vidsrc.to/embed/movie/${id}`;
      case 'source4': return `https://player.smashy.stream/movie/${id}`;
      case 'source5': return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
      case 'archive': return archiveUrl || '';
      case 'upload': return uploads[activeUploadIdx]?.video_url || '';
      default: return '';
    }
  }, [id, activeSource, archiveUrl, uploads, activeUploadIdx]);

  const allSources: { id: SourceType; label: string }[] = [
    { id: 'source1', label: 'Source 1' },
    { id: 'source2', label: 'Source 2' },
    { id: 'source3', label: 'Source 3' },
    { id: 'source4', label: 'Source 4' },
    { id: 'source5', label: 'Source 5' },
    { id: 'archive', label: 'Archive' },
    ...(uploads.length > 0 || isAdmin
      ? [{ id: 'upload' as SourceType, label: `Upload${uploads.length > 0 ? ` (${uploads.length})` : ''}` }]
      : []),
  ];

  const nextSource = useCallback(() => {
    const ids = allSources.map(s => s.id);
    const idx = ids.indexOf(activeSource);
    setActiveSource(ids[(idx + 1) % ids.length]);
    setShowSourceFail(false);
    setIframeLoaded(false);
  }, [allSources, activeSource]);

  const fmt = (t: number): string => {
    if (!isFinite(t) || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Controls timer ──────────────────────────────────────────────────────────

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // ── HUD — auto-hides at 1.5s, removed from DOM at 2s ───────────────────────

  const triggerHUD = useCallback((type: 'volume' | 'brightness', val: number) => {
    setHudType(type);
    setHudValue(Math.round(Math.max(0, Math.min(100, val))));
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    if (hudClearTimerRef.current) clearTimeout(hudClearTimerRef.current);
    hudTimerRef.current = setTimeout(() => setHudVisible(false), 1500);
    hudClearTimerRef.current = setTimeout(() => setHudType(null), 2000);
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    getMovieDetails(parseInt(id)).then(setMovie).catch(console.error);
    getSimilarMovies(parseInt(id)).then(data => setSimilarMovies(data.slice(0, 12))).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`synema_progress_${id}`);
    if (saved) setLastPlayedTime(parseFloat(saved));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase.from('movie_uploads').select('id, video_url, quality, language')
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
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying && id) {
        localStorage.setItem(`synema_progress_${id}`, videoRef.current.currentTime.toString());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, isPlaying]);

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
    const onVol = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onCanPlay = () => {
      if (sourceFailTimerRef.current) clearTimeout(sourceFailTimerRef.current);
      setShowSourceFail(false);
    };
    const onError = () => setShowSourceFail(true);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDur);
    video.addEventListener('volumechange', onVol);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDur);
      video.removeEventListener('volumechange', onVol);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, [activeSource]);

  // Source-fail timer: 10s for native sources
  useEffect(() => {
    if (showSplash || !isNativeSource) return;
    setShowSourceFail(false);
    if (sourceFailTimerRef.current) clearTimeout(sourceFailTimerRef.current);
    sourceFailTimerRef.current = setTimeout(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 3) setShowSourceFail(true);
    }, 10000);
    return () => { if (sourceFailTimerRef.current) clearTimeout(sourceFailTimerRef.current); };
  }, [activeSource, showSplash, isNativeSource]);

  // Source-fail timer: 10s for iframe sources (cancelled by onLoad)
  useEffect(() => {
    if (showSplash || isNativeSource) return;
    setShowSourceFail(false);
    setIframeLoaded(false);
    if (sourceFailTimerRef.current) clearTimeout(sourceFailTimerRef.current);
    sourceFailTimerRef.current = setTimeout(() => {
      setIframeLoaded(prev => { if (!prev) setShowSourceFail(true); return prev; });
    }, 10000);
    return () => { if (sourceFailTimerRef.current) clearTimeout(sourceFailTimerRef.current); };
  }, [activeSource, showSplash, isNativeSource]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      switch (e.key) {
        case 'Escape': navigate(-1); break;
        case ' ':
          e.preventDefault();
          if (video) { isPlaying ? video.pause() : video.play().catch(() => {}); }
          break;
        case 'ArrowLeft':
          if (video) video.currentTime = Math.max(0, video.currentTime - 10); break;
        case 'ArrowRight':
          if (video) video.currentTime = Math.min(duration, video.currentTime + 10); break;
        case 'm':
          if (video) video.muted = !video.muted; break;
        case 'f': handleFullscreen(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, duration, navigate]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePlay = () => {
    setShowSplash(false);
    const video = videoRef.current;
    if (video && isNativeSource) {
      if (lastPlayedTime && lastPlayedTime > 5) video.currentTime = lastPlayedTime;
      video.play().catch(() => {});
    }
    resetControlsTimer();
  };

  const handleFullscreen = async () => {
    const el = isNativeSource ? videoRef.current : iframeRef.current;
    if (!el) return;
    if (!isFullscreen) {
      try { await (el as HTMLElement).requestFullscreen(); } catch {}
    } else {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  const handlePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {}
  };

  const getSeekTime = (clientX: number): number => {
    const bar = seekBarRef.current;
    if (!bar || !duration) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
  };

  const handlePlayPointerDown = () => {
    longPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      if (videoRef.current) videoRef.current.playbackRate = 2;
    }, 500);
  };
  const handlePlayPointerUp = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (longPressActiveRef.current) {
      longPressActiveRef.current = false;
      if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    } else {
      if (videoRef.current) {
        isPlaying ? videoRef.current.pause() : videoRef.current.play().catch(() => {});
      }
    }
  };
  const handlePlayPointerLeave = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (longPressActiveRef.current) {
      longPressActiveRef.current = false;
      if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const now = Date.now();
    const isTopBar = touch.clientY < 68;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
    touchInitialRef.current = { x: touch.clientX, y: touch.clientY };
    gestureTypeRef.current = isTopBar ? 'swipedown' : 'none';
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const start = touchStartRef.current;
    if (!start) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const W = videoSectionRef.current?.clientWidth || window.innerWidth;

    if (gestureTypeRef.current === 'swipedown') {
      if (dy > 0) setSwipeDownY(dy);
      return;
    }

    if (gestureTypeRef.current === 'none') {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
        gestureTypeRef.current = 'h';
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) {
        gestureTypeRef.current = 'v';
      }
    }

    if (gestureTypeRef.current === 'h' && isNativeSource && videoRef.current) {
      const delta = (dx / W) * 60;
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
      setSeekGesturePreview(newTime);
      videoRef.current.currentTime = newTime;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      return;
    }

    if (gestureTypeRef.current === 'v' && isNativeSource) {
      // Use the INITIAL touch x (fixed) to determine side — prevents mid-gesture drift
      const initialX = touchInitialRef.current?.x ?? start.x;
      const isRightSide = initialX > W / 2;

      if (isRightSide && videoRef.current) {
        // Right side: adjust volume
        const newVol = Math.max(0, Math.min(1, videoRef.current.volume - dy * 0.006));
        videoRef.current.volume = newVol;
        setVolume(newVol);
        triggerHUD('volume', newVol * 100);
      } else {
        // Left side: adjust brightness overlay (drag DOWN = darker, drag UP = brighter)
        const newOpacity = Math.max(0, Math.min(0.85, brightnessOpacityRef.current + dy * 0.004));
        brightnessOpacityRef.current = newOpacity;
        setBrightnessOverlay(newOpacity);
        // HUD shows brightness as 100% when overlay=0 (fully bright), 0% when overlay=0.85
        triggerHUD('brightness', Math.round((1 - newOpacity / 0.85) * 100));
      }
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const now = Date.now();

    if (gestureTypeRef.current === 'swipedown') {
      if (swipeDownY > 90) {
        setIsClosingDown(true);
        setSwipeDownY(window.innerHeight);
        setTimeout(() => navigate(-1), 320);
      } else {
        setSwipeDownY(0);
      }
      touchStartRef.current = null;
      touchInitialRef.current = null;
      gestureTypeRef.current = 'none';
      return;
    }

    if (gestureTypeRef.current === 'h') {
      setTimeout(() => setSeekGesturePreview(null), 900);
      touchStartRef.current = null;
      touchInitialRef.current = null;
      gestureTypeRef.current = 'none';
      return;
    }

    if (gestureTypeRef.current === 'v') {
      touchStartRef.current = null;
      touchInitialRef.current = null;
      gestureTypeRef.current = 'none';
      return;
    }

    if (!start) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);

    const target = e.target as HTMLElement;
    const tappedInteractive = !!target.closest('button, input, select, a, [role="button"]');

    if (dx < 12 && dy < 12) {
      if (tappedInteractive) {
        if (!isLocked) resetControlsTimer();
      } else {
        const lastTap = lastTapRef.current;
        const W = videoSectionRef.current?.clientWidth || window.innerWidth;
        if (lastTap && (now - lastTap.time) < 300 && Math.abs(touch.clientX - lastTap.x) < 80) {
          lastTapRef.current = null;
          if (isNativeSource && videoRef.current) {
            if (touch.clientX < W / 2) {
              videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
              setRippleLeft(c => c + 1);
            } else {
              videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
              setRippleRight(c => c + 1);
            }
          }
        } else {
          lastTapRef.current = { x: touch.clientX, y: touch.clientY, time: now };
          if (!isLocked) {
            if (showControls) {
              setShowControls(false);
              if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
            } else {
              resetControlsTimer();
            }
          }
        }
      }
    }

    touchStartRef.current = null;
    touchInitialRef.current = null;
    gestureTypeRef.current = 'none';
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
      setUploads(p => [...p, data as UploadRow]);
      setShowUploadModal(false);
      setUploadUrl('');
    }
    setUploadSaving(false);
  };

  // ── Style helpers ────────────────────────────────────────────────────────────

  const fillAbs: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    borderRadius: 999,
    border: `1.5px solid ${active ? '#7c3aed' : 'rgba(255,255,255,0.18)'}`,
    background: active ? '#7c3aed' : 'rgba(255,255,255,0.07)',
    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
    fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
    flexShrink: 0, outline: 'none',
    transition: 'all 0.18s ease',
  });

  const glassBtn = (size = 40): React.CSSProperties => ({
    width: size, height: size,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', flexShrink: 0,
  });

  const ctrlVisible = showControls && !isLocked;
  const srcUrl = getSourceUrl();
  const backdropUrl = movie?.backdrop_path
    ? getImageUrl(movie.backdrop_path, BACKDROP_SIZE)
    : movie?.poster_path
    ? getImageUrl(movie.poster_path, POSTER_SIZE)
    : undefined;

  // ── Video section with overlay controls (shared portrait/landscape) ──────────

  const videoAreaStyle: React.CSSProperties = isFullVideo
    ? { ...fillAbs }
    : { position: 'relative', width: '100%', height: '40dvh', flexShrink: 0, overflow: 'hidden', background: '#000' };

  // ── Render: video section inner content ────────────────────────────────────

  const renderVideoSection = () => (
    <div
      ref={videoSectionRef}
      style={{
        ...videoAreaStyle,
        // swipe-down offset only on full-video mode (landscape/fullscreen)
        ...(isFullVideo && swipeDownY > 0 ? {
          transform: `translateY(${swipeDownY}px)`,
          transition: isClosingDown ? 'transform 0.3s cubic-bezier(0.4,0,1,1)' : 'none',
        } : {}),
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={resetControlsTimer}
    >
      {/* BRIGHTNESS OVERLAY — black div, opacity controlled by left-side swipe */}
      {!showSplash && (
        <div style={{
          ...fillAbs,
          backgroundColor: `rgba(0,0,0,${brightnessOverlay})`,
          pointerEvents: 'none',
          zIndex: 5,
          transition: 'background-color 0.05s linear',
        }} />
      )}

      {/* SPLASH ──────────────────────────────────────────────────────────────── */}
      {showSplash && (
        <div style={{ ...fillAbs, zIndex: 6, backgroundColor: '#000' }}>
          {backdropUrl
            ? <img src={backdropUrl} alt="" style={{ ...fillAbs, objectFit: 'cover', filter: 'brightness(0.38)' }} />
            : <div style={{ ...fillAbs, background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0818 50%, #1a0520 100%)' }} />
          }
          <div style={{ ...fillAbs, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />

          {/* Play button */}
          <div style={{ ...fillAbs, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {lastPlayedTime !== null && lastPlayedTime > 5 && (
              <div style={{
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 999, padding: '7px 18px',
                color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
                marginBottom: 18, animation: '_fadeIn 0.4s ease',
              }}>
                Resume from {fmt(lastPlayedTime)}
              </div>
            )}
            <button
              onClick={handlePlay}
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'rgba(124,58,237,0.28)',
                border: '2.5px solid rgba(124,58,237,0.8)',
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                boxShadow: '0 0 52px rgba(124,58,237,0.5), 0 0 20px rgba(124,58,237,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', outline: 'none',
                animation: '_fadeIn 0.45s ease',
              }}
            >
              <IcPlay />
            </button>
          </div>

          {/* Title inside splash (portrait only — landscape has it in top bar) */}
          {!isFullVideo && (
            <div style={{
              position: 'absolute', bottom: 10, left: 0, right: 0,
              textAlign: 'center', padding: '0 24px',
            }}>
              <div style={{
                color: '#fff', fontSize: 18, fontWeight: 700,
                textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {movie?.title ?? ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NATIVE VIDEO ─────────────────────────────────────────────────────────── */}
      {!showSplash && isNativeSource && (
        <>
          {activeSource === 'archive' && archiveLoading && (
            <div style={{ ...fillAbs, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{
                width: 28, height: 28,
                border: '2.5px solid rgba(255,255,255,0.12)', borderTopColor: '#7c3aed',
                borderRadius: '50%', animation: '_spin 0.75s linear infinite',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13 }}>Searching archive…</span>
            </div>
          )}
          {activeSource === 'archive' && !archiveLoading && !archiveUrl && (
            <div style={{ ...fillAbs, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <IcFilm />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0, fontWeight: 500 }}>Not in public archive</p>
              <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, margin: 0 }}>Try another source</p>
            </div>
          )}
          {activeSource === 'upload' && uploads.length === 0 && (
            <div style={{ ...fillAbs, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <IcUpload />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0, fontWeight: 500 }}>No uploaded source yet</p>
              {isAdmin && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    marginTop: 8, padding: '8px 20px',
                    background: 'rgba(124,58,237,0.2)',
                    border: '1.5px solid rgba(124,58,237,0.5)',
                    borderRadius: 999, color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none',
                  }}
                >
                  + Upload Source
                </button>
              )}
            </div>
          )}
          {srcUrl && (
            <video
              ref={videoRef}
              key={srcUrl}
              src={srcUrl}
              controls={false}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
              }}
              autoPlay
              playsInline
            />
          )}
        </>
      )}

      {/* IFRAME ──────────────────────────────────────────────────────────────── */}
      {!showSplash && !isNativeSource && (
        <div style={{ ...fillAbs }}>
          {!iframeLoaded && (
            <div style={{
              ...fillAbs,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
              background: '#000', zIndex: 0,
            }}>
              <div style={{
                width: 32, height: 32,
                border: '2.5px solid rgba(255,255,255,0.1)', borderTopColor: '#7c3aed',
                borderRadius: '50%', animation: '_spin 0.75s linear infinite',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading player…</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            key={`${activeSource}-${id}`}
            src={srcUrl}
            onLoad={() => {
              setIframeLoaded(true);
              setShowSourceFail(false);
              if (sourceFailTimerRef.current) clearTimeout(sourceFailTimerRef.current);
            }}
            style={{
              ...fillAbs, border: 'none', position: 'absolute', zIndex: 1,
              opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.3s ease',
            }}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />
        </div>
      )}

      {/* HUD PILL ─────────────────────────────────────────────────────────────── */}
      {hudType !== null && (
        <div
          key={`${hudType}-pill`}
          style={{
            position: 'absolute', top: 56, left: '50%',
            transform: 'translateX(-50%)',
            animation: '_hudIn 0.18s ease forwards',
            opacity: hudVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none', zIndex: 36,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(8,6,16,0.85)',
            backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999, padding: '9px 16px 9px 12px',
            minWidth: 156,
          }}
        >
          {hudType === 'brightness' ? <IcSunSvg /> : <IcVolSvg muted={isMuted} vol={volume} />}
          <div style={{
            flex: 1, height: 3,
            background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden', minWidth: 80,
          }}>
            <div style={{
              height: '100%', width: `${hudValue}%`,
              background: '#7c3aed', borderRadius: 99,
              transition: 'width 0.07s linear',
            }} />
          </div>
          <span style={{
            color: '#fff', fontSize: 12, fontWeight: 700,
            minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
          }}>
            {hudValue}%
          </span>
        </div>
      )}

      {/* DOUBLE TAP RIPPLES ──────────────────────────────────────────────────── */}
      {rippleLeft > 0 && (
        <div key={`rl-${rippleLeft}`} style={{
          position: 'absolute', left: '25%', top: '50%',
          width: 88, height: 88, marginLeft: -44, marginTop: -44,
          borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          animation: '_ripple 0.6s ease-out forwards',
          pointerEvents: 'none', zIndex: 12,
        }} />
      )}
      {rippleRight > 0 && (
        <div key={`rr-${rippleRight}`} style={{
          position: 'absolute', left: '75%', top: '50%',
          width: 88, height: 88, marginLeft: -44, marginTop: -44,
          borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          animation: '_ripple 0.6s ease-out forwards',
          pointerEvents: 'none', zIndex: 12,
        }} />
      )}

      {/* SEEK GESTURE PREVIEW ────────────────────────────────────────────────── */}
      {seekGesturePreview !== null && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: '_seekIn 0.15s ease forwards',
          pointerEvents: 'none', zIndex: 26,
          background: 'rgba(0,0,0,0.68)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderRadius: 14, padding: '10px 22px',
        }}>
          <span style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(seekGesturePreview)}
          </span>
        </div>
      )}

      {/* SOURCE FAIL ─────────────────────────────────────────────────────────── */}
      {showSourceFail && !showSplash && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: '22px 28px',
          textAlign: 'center', zIndex: 45,
          animation: '_fadeIn 0.22s ease', minWidth: 220,
        }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>Source failed</p>
          <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, margin: '0 0 18px' }}>Try the next source?</p>
          <button onClick={nextSource} style={{
            padding: '10px 26px', background: '#7c3aed',
            border: 'none', borderRadius: 999,
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', outline: 'none',
          }}>Try next</button>
        </div>
      )}

      {/* BACK BUTTON — always tappable ────────────────────────────────────────── */}
      {!showSplash && (
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 14, left: 12,
            background: 'rgba(0,0,0,0.48)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%', width: 40, height: 40,
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 22, outline: 'none',
            opacity: ctrlVisible ? 1 : 0.4,
            pointerEvents: 'auto',
            transition: 'opacity 0.28s ease',
          }}
        >
          <IcBack />
        </button>
      )}
      {/* Back on splash */}
      {showSplash && (
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 14, left: 12,
            background: 'rgba(0,0,0,0.48)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%', width: 40, height: 40,
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 22, outline: 'none',
          }}
        >
          <IcBack />
        </button>
      )}

      {/* TOP BAR (title + icons) ─────────────────────────────────────────────── */}
      {!showSplash && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px 0 58px',
          zIndex: 20,
          opacity: ctrlVisible ? 1 : 0,
          pointerEvents: ctrlVisible ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}>
          <span style={{
            color: '#fff', fontSize: 14, fontWeight: 600, flex: 1,
            textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            padding: '0 8px',
          }}>
            {movie?.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isNativeSource && (
              <button onClick={handlePiP}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 8, display: 'flex', borderRadius: 10, outline: 'none' }}>
                <IcPiP />
              </button>
            )}
            <button onClick={resetControlsTimer}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 8, display: 'flex', borderRadius: 10, outline: 'none' }}>
              <IcSettings />
            </button>
          </div>
        </div>
      )}

      {/* CENTER CONTROLS (native video only) ────────────────────────────────── */}
      {!showSplash && isNativeSource && ctrlVisible && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 16, pointerEvents: 'none',
        }}>
          {/* Lock pill — left side */}
          <button
            onClick={() => setIsLocked(true)}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 20, padding: '8px 12px',
              color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
              pointerEvents: 'auto', outline: 'none',
            }}
          >
            <IcLock />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>LOCK</span>
          </button>

          {/* ↺10 / Play-Pause / ↻10 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, pointerEvents: 'auto' }}>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
              style={glassBtn(52)}
            >
              <IcRewind />
            </button>
            <button
              onPointerDown={handlePlayPointerDown}
              onPointerUp={handlePlayPointerUp}
              onPointerLeave={handlePlayPointerLeave}
              style={glassBtn(70)}
            >
              {isPlaying ? <IcPause /> : <IcPlay />}
            </button>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); }}
              style={glassBtn(52)}
            >
              <IcForward />
            </button>
          </div>
        </div>
      )}

      {/* LOCK PILL — shown when locked, center-left, dark frosted glass ─────── */}
      {!showSplash && isLocked && (
        <button
          onClick={() => { setIsLocked(false); resetControlsTimer(); }}
          style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '8px 12px',
            color: '#fff', cursor: 'pointer', outline: 'none',
            zIndex: 30, animation: '_fadeIn 0.2s ease',
          }}
        >
          <IcLock />
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.4px' }}>
            UNLOCK
          </span>
        </button>
      )}

      {/* BOTTOM BAR ─────────────────────────────────────────────────────────── */}
      {!showSplash && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.55) 75%, transparent 100%)',
          padding: isNativeSource ? '40px 14px 16px' : '14px 14px 20px',
          zIndex: 18,
          opacity: ctrlVisible ? 1 : 0,
          pointerEvents: ctrlVisible ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}>
          {/* Seek bar (native only) */}
          {isNativeSource && (
            <>
              <div
                ref={seekBarRef}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  seekDraggingRef.current = true; setSeekDragging(true);
                  if (videoRef.current) videoRef.current.currentTime = getSeekTime(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (!seekDraggingRef.current) return;
                  e.stopPropagation();
                  if (videoRef.current) videoRef.current.currentTime = getSeekTime(e.clientX);
                }}
                onPointerUp={(e) => { e.stopPropagation(); seekDraggingRef.current = false; setSeekDragging(false); }}
                style={{ width: '100%', height: 20, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
              >
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  height: seekDragging ? 5 : 3,
                  background: 'rgba(255,255,255,0.18)', borderRadius: 99,
                  transition: 'height 0.12s ease',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    background: '#7c3aed', borderRadius: 99,
                  }}>
                    <div style={{
                      position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                      width: seekDragging ? 17 : 13, height: seekDragging ? 17 : 13,
                      borderRadius: '50%', background: '#fff',
                      boxShadow: '0 0 8px rgba(0,0,0,0.55)',
                      transition: 'width 0.12s ease, height 0.12s ease',
                    }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(currentTime)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(duration)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
                    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                    setPlaybackRate(next);
                    if (videoRef.current) videoRef.current.playbackRate = next;
                  }}
                  style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                >
                  {playbackRate}×
                </button>
                <button
                  onClick={handleFullscreen}
                  style={{ padding: '4px 9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, color: '#fff', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isFullscreen ? <IcExitFs /> : <IcFullscreen />}
                </button>
                <button
                  onClick={() => setIsLocked(true)}
                  style={{ padding: '4px 9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, color: '#fff', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <IcLock />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Lock</span>
                </button>
              </div>
            </>
          )}

          {/* Iframe: fullscreen + lock row */}
          {!isNativeSource && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <button
                onClick={handleFullscreen}
                style={{ padding: '4px 9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, color: '#fff', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isFullscreen ? <IcExitFs /> : <IcFullscreen />}
              </button>
              <button
                onClick={() => setIsLocked(true)}
                style={{ padding: '4px 9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 7, color: '#fff', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <IcLock />
                <span style={{ fontSize: 11, fontWeight: 600 }}>Lock</span>
              </button>
            </div>
          )}

          {/* Source pills */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 600, flexShrink: 0, marginRight: 2, letterSpacing: '0.3px' }}>
              Source
            </span>
            {allSources.map(src => (
              <button
                key={src.id}
                onClick={() => { setActiveSource(src.id); setShowSourceFail(false); setIframeLoaded(false); }}
                style={pillStyle(activeSource === src.id)}
              >
                {src.label}
              </button>
            ))}
            {activeSource === 'upload' && uploads.length > 1 && uploads.map((u, i) => (
              <button key={u.id} onClick={() => setActiveUploadIdx(i)} style={pillStyle(activeUploadIdx === i)}>
                {u.quality}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                style={{ padding: '5px 13px', borderRadius: 999, border: '1.5px dashed rgba(124,58,237,0.55)', background: 'rgba(124,58,237,0.1)', color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, outline: 'none' }}
              >
                + Upload
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── Render: suggestions section (portrait only) ──────────────────────────────

  const renderSuggestionsSection = () => (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: '#08090d',
      scrollbarWidth: 'none',
    } as React.CSSProperties}>
      {/* Movie info */}
      {movie && (
        <div style={{ padding: '16px 16px 0' }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            {movie.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {movie.release_date && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {new Date(movie.release_date).getFullYear()}
              </span>
            )}
            {movie.vote_average > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>
                <IcStar /> {movie.vote_average.toFixed(1)}
              </span>
            )}
            {movie.runtime && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </span>
            )}
            {movie.genres?.slice(0, 2).map((g: { id: number; name: string }) => (
              <span key={g.id} style={{
                padding: '2px 10px', borderRadius: 999,
                background: 'rgba(124,58,237,0.18)',
                border: '1px solid rgba(124,58,237,0.35)',
                color: '#a78bfa', fontSize: 11, fontWeight: 600,
              }}>
                {g.name}
              </span>
            ))}
          </div>
          {movie.overview && (
            <p style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.55,
              margin: '0 0 16px',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            }}>
              {movie.overview}
            </p>
          )}
        </div>
      )}

      {/* Source selector strip */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
          {allSources.map(src => (
            <button
              key={src.id}
              onClick={() => { setActiveSource(src.id); setShowSourceFail(false); setIframeLoaded(false); }}
              style={pillStyle(activeSource === src.id)}
            >
              {src.label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              style={{ padding: '5px 13px', borderRadius: 999, border: '1.5px dashed rgba(124,58,237,0.55)', background: 'rgba(124,58,237,0.1)', color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, outline: 'none' }}
            >
              + Upload
            </button>
          )}
        </div>
      </div>

      {/* Similar movies grid */}
      {similarMovies.length > 0 && (
        <div style={{ padding: '0 16px 24px' }}>
          <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.2px' }}>
            More like this
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {similarMovies.map(m => {
              const poster = m.poster_path ? getImageUrl(m.poster_path, POSTER_SIZE) : undefined;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/player/${m.id}`)}
                  style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', background: '#111' }}
                >
                  {poster
                    ? <img src={poster} alt={m.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', aspectRatio: '2/3', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IcFilm />
                      </div>
                  }
                  <div style={{ padding: '6px 7px 8px' }}>
                    <p style={{ color: '#fff', fontSize: 11, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </p>
                    {m.vote_average > 0 && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <IcStar /> {m.vote_average.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes _spin { to { transform: rotate(360deg); } }
          @keyframes _ripple {
            0%   { transform: scale(0); opacity: 0.5; }
            100% { transform: scale(3.8); opacity: 0; }
          }
          @keyframes _hudIn {
            from { transform: translateX(-50%) translateY(-14px); opacity: 0; }
            to   { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
          @keyframes _seekIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.82); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes _fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        `
      }} />

      {/* ── Outer container: fixed, full-viewport, always ─────────────────────── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100dvh',
        backgroundColor: '#000',
        overflow: 'hidden',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {isFullVideo
          ? /* LANDSCAPE / FULLSCREEN — video fills everything */
            renderVideoSection()
          : /* PORTRAIT — video at top 40%, suggestions below 60% */
            <>
              {renderVideoSection()}
              {renderSuggestionsSection()}
            </>
        }
      </div>

      {/* ── UPLOAD MODAL ─────────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div
          onClick={() => setShowUploadModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, animation: '_fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(12,9,22,0.97)',
              border: '1px solid rgba(124,58,237,0.28)',
              borderRadius: 22, padding: '28px 24px',
              width: '100%', maxWidth: 420,
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 22px', letterSpacing: '-0.3px' }}>
              Upload Video Source
            </h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Video URL</label>
              <input
                type="url" value={uploadUrl} onChange={e => setUploadUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Quality</label>
                <select value={uploadQuality} onChange={e => setUploadQuality(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'none' as const }}>
                  {['480p', '720p', '1080p', '4K'].map(q => <option key={q} value={q} style={{ background: '#0c0916' }}>{q}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Language</label>
                <input type="text" value={uploadLanguage} onChange={e => setUploadLanguage(e.target.value)} placeholder="English"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowUploadModal(false)}
                style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                Cancel
              </button>
              <button onClick={handleSaveUpload} disabled={uploadSaving || !uploadUrl.trim()}
                style={{ padding: '10px 26px', background: uploadSaving || !uploadUrl.trim() ? 'rgba(124,58,237,0.38)' : '#7c3aed', border: 'none', borderRadius: 11, color: '#fff', fontSize: 14, fontWeight: 700, cursor: uploadSaving || !uploadUrl.trim() ? 'not-allowed' : 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                {uploadSaving && (
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.28)', borderTopColor: '#fff', borderRadius: '50%', animation: '_spin 0.75s linear infinite' }} />
                )}
                {uploadSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
