import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { searchTMDB, getImageUrl, POSTER_SIZE } from '../services/tmdb';

interface Upload {
  id: string;
  tmdb_id: number;
  title: string;
  video_url: string;
  quality: string;
  language: string;
  created_at: string;
}

export function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadQuality, setUploadQuality] = useState('1080p');
  const [uploadLanguage, setUploadLanguage] = useState('English');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'uploads' | 'users'>('uploads');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  // Load uploads
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('movie_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setUploads(data);
        setLoadingUploads(false);
      });
  }, [isAdmin]);

  // Load users
  useEffect(() => {
    if (tab !== 'users' || !isAdmin) return;
    setLoadingUsers(true);
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setUsers(data);
        setLoadingUsers(false);
      });
  }, [tab, isAdmin]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('movie_uploads').delete().eq('id', id);
    setUploads(prev => prev.filter(u => u.id !== id));
    setDeleting(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data.results?.slice(0, 6) || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSave = async () => {
    if (!selectedMovie || !uploadUrl) return;
    setSaving(true);
    const { data, error } = await supabase.from('movie_uploads').insert({
      tmdb_id: selectedMovie.id,
      title: selectedMovie.title,
      video_url: uploadUrl,
      quality: uploadQuality,
      language: uploadLanguage,
      uploaded_by: user?.id,
    }).select().single();
    if (!error && data) {
      setUploads(prev => [data, ...prev]);
      setShowAddModal(false);
      setSelectedMovie(null);
      setUploadUrl('');
      setSearchQuery('');
      setSearchResults([]);
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const S = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#08090d',
      paddingBottom: 40,
    } as React.CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky' as const,
      top: 0,
      backgroundColor: '#08090d',
      zIndex: 10,
    } as React.CSSProperties,

    tab: (active: boolean): React.CSSProperties => ({
      padding: '8px 18px',
      borderRadius: 999,
      border: 'none',
      background: active ? '#7c3aed' : 'rgba(255,255,255,0.06)',
      color: active ? '#fff' : 'rgba(255,255,255,0.4)',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
    }),

    card: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 10,
    } as React.CSSProperties,

    input: {
      width: '100%',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#fff',
      fontSize: 13,
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-end',
      padding: 0,
    } as React.CSSProperties,

    modalBox: {
      width: '100%',
      background: '#111318',
      borderRadius: '20px 20px 0 0',
      padding: '24px 20px 40px',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    } as React.CSSProperties,
  };

  if (loading) return null;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20, padding: 4 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Admin Panel</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Synema</div>
        </div>
        <div style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: '4px 12px' }}>
          <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 600 }}>⚡ Admin</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 20px' }}>
        {[
          { label: 'Total Uploads', value: uploads.length },
          { label: 'Total Users', value: users.length || '–' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ color: '#a78bfa', fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
        <button onClick={() => setTab('uploads')} style={S.tab(tab === 'uploads')}>Uploads</button>
        <button onClick={() => setTab('users')} style={S.tab(tab === 'users')}>Users</button>
      </div>

      {/* UPLOADS TAB */}
      {tab === 'uploads' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{uploads.length} sources</span>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: '#7c3aed', border: 'none', borderRadius: 20, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add Upload
            </button>
          </div>

          {loadingUploads ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>Loading…</div>
          ) : uploads.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>No uploads yet</div>
          ) : (
            uploads.map(upload => (
              <div key={upload.id} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{upload.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 6 }}>TMDB: {upload.tmdb_id}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                      <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{upload.quality}</span>
                      <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{upload.language}</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {upload.video_url}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <button
                      onClick={() => navigate(`/player/${upload.tmdb_id}`)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, cursor: 'pointer' }}
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => handleDelete(upload.id)}
                      disabled={deleting === upload.id}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 12px', color: '#f87171', fontSize: 12, cursor: 'pointer' }}
                    >
                      {deleting === upload.id ? '…' : '🗑'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div style={{ padding: '0 20px' }}>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>Loading…</div>
          ) : (
            users.map(u => (
              <div key={u.id} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{u.email}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ background: u.role === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${u.role === 'admin' ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '6px 10px', color: u.role === 'admin' ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}
                  >
                    <option value="user" style={{ background: '#111' }}>User</option>
                    <option value="admin" style={{ background: '#111' }}>Admin</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADD UPLOAD MODAL */}
      {showAddModal && (
        <div style={S.modal} onClick={() => setShowAddModal(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Add Upload</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            {/* Movie search */}
            {!selectedMovie ? (
              <>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>Search Movie</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    placeholder="Search movie title…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    style={{ background: '#7c3aed', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                  >
                    {searching ? '…' : 'Search'}
                  </button>
                </div>
                {searchResults.map(movie => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  >
                    {movie.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="" style={{ width: 36, borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 36, height: 54, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                    )}
                    <div>
                      <div style={{ color: '#fff', fontSize: 13 }}>{movie.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{movie.release_date?.split('-')[0]} · ID: {movie.id}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Selected movie */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, marginBottom: 14 }}>
                  {selectedMovie.poster_path && (
                    <img src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`} alt="" style={{ width: 32, borderRadius: 4 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{selectedMovie.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>TMDB ID: {selectedMovie.id}</div>
                  </div>
                  <button onClick={() => setSelectedMovie(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>Direct .mp4 URL</div>
                <input style={{ ...S.input, marginBottom: 10 }} type="url" placeholder="https://example.com/movie.mp4" value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} />

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>Quality</div>
                    <select value={uploadQuality} onChange={e => setUploadQuality(e.target.value)} style={{ ...S.input, padding: '10px 12px' }}>
                      {['480p', '720p', '1080p', '4K'].map(q => <option key={q} value={q} style={{ background: '#111' }}>{q}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>Language</div>
                    <input style={{ ...S.input, padding: '10px 12px' }} placeholder="English" value={uploadLanguage} onChange={e => setUploadLanguage(e.target.value)} />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={!uploadUrl || saving}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: !uploadUrl || saving ? 'rgba(124,58,237,0.3)' : '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 15, cursor: !uploadUrl || saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Saving…' : 'Save Upload'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
  
