export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdb = searchParams.get('tmdb');

  if (!tmdb) {
    return Response.json({ error: 'tmdb required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://vidsrc.rip/api/movie?tmdb=${tmdb}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://vidsrc.rip/',
        },
      }
    );
    const data = await res.json();
    const url = data?.sources?.[0]?.file || data?.url || null;

    if (url) {
      return Response.json({ url, type: url.includes('.m3u8') ? 'hls' : 'mp4' });
    }
  } catch {}

  return Response.json({ error: 'No stream found', fallback: true }, { status: 404 });
}
