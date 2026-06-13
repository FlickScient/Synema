import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Film, Upload, ChevronRight, X, Plus } from 'lucide-react';
import { getMovieDetails, getImageUrl, POSTER_SIZE, BACKDROP_SIZE } from '../services/tmdb';
import { EMBED_SOURCES, type SourceId } from '../services/sources';
import { searchArchive, type ArchiveItem } from '../services/archive';
import { supabase } from '../services/supabase';
import type { MovieDetails } from '../types/tmdb';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedSource {
  id: string;
  video_url: string;
  quality: string;
  language: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [activeSource, setActiveSource] = useState<SourceId>('embedsu');
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Archive
  const [archiveItem, setArchiveItem] = useState<ArchiveItem | null>(null);
  const [archiveSearched, setArchiveSearched] = useState(false);

  // Admin upload
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploads, setUploads] = useState<UploadedSource[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ video_url: '', quality: '1080p', language: 'English' });
  const [uploadLoading, setUploadLoading] = useState(false);

  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeKey = useRef(0); // force re-mount on source change

  // ─── Load movie ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    getMovieDetails(parseInt(id))
      .then(setMovie)
      .catch(console.error);
  }, [id]);

  // ─── Check admin + load uploads ─────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') setIsAdmin(true);

      const { data: rows } = await supabase
        .from('movie_uploads')
        .select('id, video_url, quality, language')
        .eq('tmdb_id', parseInt(id));

      if (rows) setUploads(rows);
    };
    init();
  }, [id]);

  // ─── Archive search (lazy — only when selected) ──────────────────────────────

  useEffect(() => {
    if (activeSource !== 'archive' || archiveSearched || !movie) return;
    setArchiveSearched(true);
    setLoading(true);
    searchArchive(movie.title).then(result => {
      setArchiveItem(result);
      setLoading(false);
    });
  }, [activeSource, archiveSearched, movie]);

  // ─── Controls hide logic ─────────────────────────────────────────────────────

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (started) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [started]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(-1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  // ─── Source switch ───────────────────────────────────────────────────────────

  const switchSource = (src: SourceId) => {
    if (src === activeSource) return;
    iframeKey.current += 1;
    setActiveSource(src);
    if (!started) setStarted(true);
  };

  const handlePlay = () => {
    setStarted(true);
    resetControlsTimer();
  };

  // ─── Admin upload ────────────────────────────────────────────────────────────

  const handleUploadSubmit = async () => {
    if (!uploadForm.video_url || !id) return;
    setUploadLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('movie_uploads').insert({
      tmdb_id: parseInt(id),
      title: movie?.title || '',
      video_url: uploadForm.video_url,
      quality: uploadForm.quality,
      language: uploadForm.language,
      uploaded_by: user?.id,
    }).select().single();

    if (!error && data) {
      setUploads(prev => [...prev, data]);
      setShowUploadModal(false);
      setUploadForm({ video_url: '', quality: '1080p', language: 'English' });
    }
    setUploadLoading(false);
  };

  // ─── Current source URL ──────────────────────────────────────────────────────

  const getCurrentUrl = (): string | null => {
    if (!id) return null;
    if (activeSource === 'archive') return archiveItem?.videoUrl || null;
    if (activeSource === 'upload') return uploads[0]?.video_url || null;
    const src = EMBED_SOURCES.find(s => s.id === activeSource);
    return src ? src.getUrl(id) : null;
  };

  const isNativeVideo = activeSource === 'archive' || activeSource === 'upload';
  const currentUrl = getCurrentUrl();

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black z-[100]"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >

      {/* ── VIDEO AREA ─────────────────────────────────────────────────────── */}

      {!started ? (
        // Pre-play splash
        <div className="absolute inset-0 flex items-center justify-center">
          {movie?.backdrop_path && (
            <img
              src={getImageUrl(movie.backdrop_path, BACKDROP_SIZE)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'brightness(0.25)' }}
            />
          )}
          <button
            onClick={handlePlay}
            className="relative z-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all duration-300"
          >
            <svg className="w-9 h-9 text-white fill-white ml-1" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>
      ) : loading ? (
        // Loading state (Archive search)
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Searching archive…</span>
        </div>
      ) : activeSource === 'archive' && !archiveItem ? (
        // Archive — not found
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Film className="w-10 h-10 text-white/20" />
          <p className="text-white/40 text-sm">Not available in public archive</p>
          <p className="text-white/25 text-xs">Try another source</p>
        </div>
      ) : isNativeVideo && currentUrl ? (
        // Native <video> — Archive or Upload
        <video
          key={currentUrl}
          src={currentUrl}
          controls
          autoPlay
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : currentUrl ? (
        // Iframe embed
        <iframe
          key={`${activeSource}-${iframeKey.current}`}
          src={currentUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          style={{ border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
        />
      ) : null}

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}

      <div
        className={`absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 flex items-center gap-3 transition-opacity duration-300 ${
          showControls || !started ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-white/60 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {movie?.poster_path && (
          <img
            src={getImageUrl(movie.poster_path, POSTER_SIZE)}
            alt=""
            className="w-8 h-auto rounded shrink-0"
          />
        )}

        <span className="text-white text-sm font-medium truncate flex-1">
          {movie?.title}
        </span>

        <Link
          to={`/movie/${id}`}
          className="shrink-0 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── SOURCE SWITCHER ─────────────────────────────────────────────────── */}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-5 pt-12 transition-opacity duration-300 ${
          showControls || !started ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">

          {/* Label */}
          <span className="text-white/30 text-xs mr-1 shrink-0">Source</span>

          {/* Embed source pills */}
          {EMBED_SOURCES.map((src) => (
            <button
              key={src.id}
              onClick={() => switchSource(src.id as SourceId)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeSource === src.id
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {src.label}
            </button>
          ))}

          {/* Archive pill */}
          <button
            onClick={() => switchSource('archive')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
              activeSource === 'archive'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            Archive
          </button>

          {/* Upload pill — only if uploads exist OR admin */}
          {(uploads.length > 0 || isAdmin) && (
            <button
              onClick={() => switchSource('upload')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeSource === 'upload'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              Upload {uploads.length > 0 && `(${uploads.length})`}
            </button>
          )}

          {/* Admin: add upload button */}
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="ml-auto p-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Add video source"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── ADMIN UPLOAD MODAL ──────────────────────────────────────────────── */}

      {showUploadModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Add video source
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Direct .mp4 URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/movie.mp4"
                  value={uploadForm.video_url}
                  onChange={e => setUploadForm(f => ({ ...f, video_url: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Quality</label>
                  <select
                    value={uploadForm.quality}
                    onChange={e => setUploadForm(f => ({ ...f, quality: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {['480p', '720p', '1080p', '4K'].map(q => (
                      <option key={q} value={q} className="bg-[#111]">{q}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1 block">Language</label>
                  <input
                    type="text"
                    placeholder="English"
                    value={uploadForm.language}
                    onChange={e => setUploadForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <button
                onClick={handleUploadSubmit}
                disabled={!uploadForm.video_url || uploadLoading}
                className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {uploadLoading ? 'Saving…' : 'Save source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
            
