// ─── Drop this into your PlayerPage.tsx / VideoPlayer.tsx ────────────────────
// Replace your existing SOURCES array and add the resolveStream function

// ── Embed fallback sources (reliable 2026) ──
export const EMBED_SOURCES = [
  {
    id: 's1',
    label: 'VidSrc',
    getUrl: (id: string | number) => `https://vidsrc.mov/embed/movie/${id}`,
  },
  {
    id: 's2',
    label: 'VidLink',
    getUrl: (id: string | number) => `https://vidlink.pro/movie/${id}`,
  },
  {
    id: 's3',
    label: 'Videasy',
    getUrl: (id: string | number) => `https://player.videasy.net/movie/${id}`,
  },
  {
    id: 's4',
    label: '2Embed',
    getUrl: (id: string | number) => `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: 's5',
    label: 'Smashy',
    getUrl: (id: string | number) =>
      `https://embed.smashystream.com/playere.php?tmdb=${id}`,
  },
];

// ── Stream resolver — tries native first, falls back to embeds ──
export interface StreamResult {
  type: 'native' | 'iframe';
  url: string;
  provider: string;
}

export async function resolveStream(
  tmdbId: string | number,
  onStatus?: (msg: string) => void
): Promise<StreamResult> {
  onStatus?.('Finding best stream…');

  try {
    // Call our Vercel serverless function
    const res = await fetch(`/api/stream?tmdb=${tmdbId}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        onStatus?.(`Loaded via ${data.provider}`);
        return {
          type: 'native',
          url: data.url,
          provider: data.provider,
        };
      }
    }
  } catch {
    // API unavailable — fall through to embed
  }

  // Fall back to best embed source
  onStatus?.('Using embed source…');
  return {
    type: 'iframe',
    url: EMBED_SOURCES[0].getUrl(tmdbId),
    provider: 'vidsrc.mov',
  };
}
