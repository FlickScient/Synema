// All video sources for Synema player
// Add/remove sources here without touching PlayerPage

export type SourceId = 'embedsu' | 'vidsrc' | 'autoembed' | 'multiembed' | 'archive' | 'upload';

export interface Source {
  id: SourceId;
  label: string;
  getUrl: (tmdbId: string, title?: string) => string;
  isIframe: boolean; // false = native <video> tag (Archive, Upload)
}

export const EMBED_SOURCES: Source[] = [
  {
    id: 'embedsu',
    label: 'Source 1',
    getUrl: (id) => `https://embed.su/embed/movie/${id}`,
    isIframe: true,
  },
  {
    id: 'vidsrc',
    label: 'Source 2',
    getUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    isIframe: true,
  },
  {
    id: 'autoembed',
    label: 'Source 3',
    getUrl: (id) => `https://autoembed.cc/movie/tmdb/${id}`,
    isIframe: true,
  },
  {
    id: 'multiembed',
    label: 'Source 4',
    getUrl: (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    isIframe: true,
  },
];

// Archive and Upload are handled separately in PlayerPage
// since they need async lookup / different rendering

