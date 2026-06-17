import type { VercelRequest, VercelResponse } from '@vercel/node';

// Tries to extract a direct m3u8/mp4 stream URL from multiple providers
// Falls back gracefully — client will use embeds if this returns null

const PROVIDERS = [
  {
    name: 'vidsrc.rip',
    url: (tmdb: string) =>
      `https://vidsrc.rip/api/movie?tmdb=${tmdb}`,
    extract: (data: any): string | null => {
      // vidsrc.rip returns { sources: [{ file, label }] }
      const sources = data?.sources || data?.data?.sources;
      if (Array.isArray(sources) && sources.length > 0) {
        return sources[0]?.file || sources[0]?.url || null;
      }
      return null;
    },
  },
  {
    name: 'autoembed',
    url: (tmdb: string) =>
      `https://api.autoembed.cc/movie/${tmdb}`,
    extract: (data: any): string | null => {
      return data?.stream || data?.url || data?.source || null;
    },
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers — allow your Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { tmdb } = req.query;

  if (!tmdb || typeof tmdb !== 'string') {
    return res.status(400).json({ error: 'tmdb query param required' });
  }

  // Try each provider in order
  for (const provider of PROVIDERS) {
    try {
      const response = await fetch(provider.url(tmdb), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://vidsrc.rip/',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const streamUrl = provider.extract(data);

      if (streamUrl) {
        return res.status(200).json({
          url: streamUrl,
          provider: provider.name,
          type: streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
        });
      }
    } catch (err) {
      // Provider failed — try next
      continue;
    }
  }

  // All providers failed — tell client to use embeds
  return res.status(404).json({
    error: 'No stream found',
    fallback: true,
  });
}
