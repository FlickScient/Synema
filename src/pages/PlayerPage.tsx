import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Upload, Film } from 'lucide-react';
import { getMovieDetails, getImageUrl, BACKDROP_SIZE, POSTER_SIZE } from '../services/tmdb';
import { searchArchive, type ArchiveItem } from '../services/archive';
import { supabase } from '../services/supabase';
import type { MovieDetails } from '../types/tmdb';

// ─── Sources ──────────────────────────────────────────────────────────────────

const EMBED_SOURCES = [
  { id: 'embedsu',      label: 'Source 1', url: (id: string) => `https://embed.su/embed/movie/${id}` },
  { id: 'vidsrc',      label: 'Source 2', url: (id: string) => `https://vidsrc.me/embed/movie?tmdb=${id}` },
  { id: 'vidsrcto',    label: 'Source 3', url: (id: string) => `https://vidsrc.to/embed/movie/${id}` },
  { id: 'smashy',      label: 'Source 4', url: (id: string) => `https://player.smashy.stream/movie/${id}` },
  { id: 'multiembed',  label: 'Source 5', url: (id: string) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: '#000',
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  fill: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0, left: 0, right: 0,
    zIndex: 20,
    padding: '48px 14px 20px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  pill: (active: boolean) => ({
    padding: '5px 13px',
    borderRadius: 999,
    border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.15)'}`,
    background: active ? '#fff' : 'rgba(255,255,255,0.06)',
    color: active ? '#000' : 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  }),
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.6)',
    padding: 8,
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    marginRight: 2,
    whiteSpace: 'nowrap' as const,
  },
  playBtn: {
    width: 72, height: 72,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  modal: {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    background: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '8px 12px',
    color: '#fff',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  submitBtn: (disabled: boolean) => ({
    width: '100%',
    padding: '10px',
    borderRadius: 12,
    background: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
    color: disabled ? 'rgba(0,0,0,0.4)' : '#000',
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: 4,
  }),
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveSource = 'embed' | 'archive' | 'upload';

interface UploadRow {
  id: string;
  video_url: string;
  quality: string;
  language: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie]           = useState<MovieDetails | null>(null);
  const [started, setStarted]       = useState(false);
  const [embedIdx, setEmbedIdx]     = useState(0);
  const [activeSource, setActive]   = useState<ActiveSource>('embed');

  // Archive
  const [archiveItem, setArchiveItem]       = useState<ArchiveItem | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearched, setArchiveSearched] = useState(false);

  // Upload / admin
  const [isAdmin, setIsAdmin]           = useState(false);
  const [uploads, setUploads]           = useState<UploadRow[]>([]);
  const [uploadIdx, setUploadIdx]       = useState(0);
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState({ video_url: '', quality: '1080p', language: 'English' });
  const [saving, setSaving]             = useState(false);

  // ── Load movie ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getMovieDetails(parseInt(id)).then(setMovie).catch(console.error);
  }, [id]);

  // ── Auth / uploads ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') setIsAdmin(true);
      const { data: rows } = await supabase
        .from('movie_uploads')
        .select('id, video_url, quality, language')
        .eq('tmdb_id', parseInt(id));
      if (rows) setUploads(rows);
    })();
  }, [id]);

  // ── Archive lazy search ────────────────────────────────────────────────────
  useEffect(() => {
    if (activeSource !== 'archive' || archiveSearched || !movie) return;
    setArchiveSearched(true);
    setArchiveLoading(true);
    searchArchive(movie.title).then(r => {
      setArchiveItem(r);
      setArchiveLoading(false);
    });
  }, [activeSource, archiveSearched, movie]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate(-1); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const switchEmbed = (i: number) => {
    setEmbedIdx(i);
    setActive('embed');
    if (!started) setStarted(true);
  };

  const switchArchive = () => {
    setActive('archive');
    if (!started) setStarted(true);
  };

  const switchUpload = () => {
    setActive('upload');
    if (!started) setStarted(true);
  };

  const handlePlay = () => setStarted(true);

  const handleSave = async () => {
    if (!form.video_url || !id) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('movie_uploads').insert({
      tmdb_id: parseInt(id),
      title: movie?.title || '',
      video_url: form.video_url,
      quality: form.quality,
      language: form.language,
      uploaded_by: user?.id,
    }).select().single();
    if (!error && data) {
      setUploads(p => [...p, data]);
      setShowModal(false);
      setForm({ video_url: '', quality: '1080p', language: 'English' });
    }
    setSaving(false);
  };

  // ── Current URL ────────────────────────────────────────────────────────────
  const currentEmbedUrl = id ? EMBED_SOURCES[embedIdx].url(id) : '';
  const currentUploadUrl = uploads[uploadIdx]?.video_url || '';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* VIDEO AREA */}
      <div style={S.fill}>

        {/* Pre-play splash */}
        {!started && (
          <>
            {movie?.backdrop_path && (
              <img
                src={getImageUrl(movie.backdrop_path, BACKDROP_SIZE)}
                alt=""
                style={{ ...S.fill, objectFit: 'cover', filter: 'brightness(0.22)' }}
              />
            )}
            <div style={{ ...S.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={handlePlay} style={S.playBtn}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Archive loading */}
        {started && activeSource === 'archive' && archiveLoading && (
          <div style={{ ...S.fill, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Searching archive…</span>
          </div>
        )}

        {/* Archive not found */}
        {started && activeSource === 'archive' && !archiveLoading && !archiveItem && (
          <div style={{ ...S.fill, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Film size={36} color="rgba(255,255,255,0.15)" />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Not in public archive</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>Try another source</p>
          </div>
        )}

        {/* Archive native video */}
        {started && activeSource === 'archive' && !archiveLoading && archiveItem && (
          <video
            key={archiveItem.videoUrl}
            src={archiveItem.videoUrl}
            controls autoPlay
            style={{ ...S.fill, objectFit: 'contain', background: '#000' }}
          />
        )}

        {/* Upload native video */}
        {started && activeSource === 'upload' && currentUploadUrl && (
          <video
            key={currentUploadUrl}
            src={currentUploadUrl}
            controls autoPlay
            style={{ ...S.fill, objectFit: 'contain', background: '#000' }}
          />
        )}

        {/* Upload — no source yet */}
        {started && activeSource === 'upload' && !currentUploadUrl && (
          <div style={{ ...S.fill, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Upload size={36} color="rgba(255,255,255,0.15)" />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>No uploaded source yet</p>
          </div>
        )}

        {/* Embed iframe */}
        {started && activeSource === 'embed' && (
          <iframe
            key={`${embedIdx}-${id}`}
            src={currentEmbedUrl}
            style={{ ...S.fill, border: 'none' }}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        )}
      </div>

      {/* TOP BAR */}
      <div style={S.topBar}>
        <button onClick={() => navigate(-1)} style={S.iconBtn}>
          <ArrowLeft size={20} />
        </button>
        {movie?.poster_path && (
          <img
            src={getImageUrl(movie.poster_path, POSTER_SIZE)}
            alt=""
            style={{ width: 30, borderRadius: 4, flexShrink: 0 }}
          />
        )}
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {movie?.title}
        </span>
        <button
          onClick={() => navigate(`/movie/${id}`)}
          style={{ ...S.iconBtn, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}
        >
          Details
        </button>
      </div>

      {/* BOTTOM SOURCE SWITCHER */}
      <div style={S.bottomBar}>
        <span style={S.label}>Source</span>

        {/* Embed pills */}
        {EMBED_SOURCES.map((src, i) => (
          <button key={src.id} onClick={() => switchEmbed(i)} style={S.pill(activeSource === 'embed' && embedIdx === i)}>
            {src.label}
          </button>
        ))}

        {/* Archive pill */}
        <button onClick={switchArchive} style={S.pill(activeSource === 'archive')}>
          Archive
        </button>

        {/* Upload pill — show if uploads exist or admin */}
        {(uploads.length > 0 || isAdmin) && (
          <button onClick={switchUpload} style={S.pill(activeSource === 'upload')}>
            Upload{uploads.length > 0 ? ` (${uploads.length})` : ''}
          </button>
        )}

        {/* Admin add button */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{ ...S.iconBtn, marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* ADMIN UPLOAD MODAL */}
      {showModal && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Upload size={15} /> Add video source
              </span>
              <button onClick={() => setShowModal(false)} style={S.iconBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4 }}>Direct .mp4 URL</div>
                <input
                  style={S.input}
                  type="url"
                  placeholder="https://example.com/movie.mp4"
                  value={form.video_url}
                  onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4 }}>Quality</div>
                  <select
                    style={S.input}
                    value={form.quality}
                    onChange={e => setForm(f => ({ ...f, quality: e.target.value }))}
                  >
                    {['480p','720p','1080p','4K'].map(q => (
                      <option key={q} value={q} style={{ background: '#111' }}>{q}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 4 }}>Language</div>
                  <input
                    style={S.input}
                    placeholder="English"
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!form.video_url || saving}
                style={S.submitBtn(!form.video_url || saving)}
              >
                {saving ? 'Saving…' : 'Save source'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
