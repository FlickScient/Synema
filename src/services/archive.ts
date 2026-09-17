// Archive.org service — searches Internet Archive for public domain films
// No API key required. Uses the Archive.org Advancedsearch API.

export interface ArchiveItem {
  identifier: string;
  title: string;
  year?: string;
  description?: string;
  videoUrl: string;
  thumbUrl: string;
}

const ARCHIVE_API = 'https://archive.org';

function pickBestVideoFile(files: any[]): any | null {
  // Archive.org items often list many files per upload — samples, thumbnails,
  // low-res previews, and the real feature file, in no particular order.
  // Picking the FIRST match (the old bug) often grabs a tiny sample/preview
  // instead of the actual movie. Instead: filter to real video extensions,
  // exclude anything obviously not the main feature, then pick the LARGEST
  // remaining file — the real film is virtually always the biggest file.
  const videoExts = ['.mp4', '.ogv', '.mpeg', '.webm'];
  const excludePatterns = /sample|trailer|thumb|preview|clip/i;

  const candidates = files.filter(f => {
    const name: string = f.name || '';
    const hasVideoExt = videoExts.some(ext => name.toLowerCase().endsWith(ext));
    return hasVideoExt && !excludePatterns.test(name);
  });

  if (candidates.length === 0) return null;

  // Prefer .mp4 specifically (best browser compatibility) among the largest files
  const mp4Candidates = candidates.filter(f => f.name?.toLowerCase().endsWith('.mp4'));
  const pool = mp4Candidates.length > 0 ? mp4Candidates : candidates;

  return pool.reduce((largest, current) => {
    const largestSize = parseInt(largest.size || '0', 10);
    const currentSize = parseInt(current.size || '0', 10);
    return currentSize > largestSize ? current : largest;
  });
}

export async function searchArchive(title: string): Promise<ArchiveItem | null> {
  try {
    const query = encodeURIComponent(`title:(${title}) AND mediatype:(movies)`);
    const url = `${ARCHIVE_API}/advancedsearch.php?q=${query}&fl[]=identifier,title,year,description&rows=5&output=json`;

    const res = await fetch(url);
    const data = await res.json();
    const docs = data?.response?.docs;

    if (!docs || docs.length === 0) return null;

    // Try candidates in order until one actually has a usable video file —
    // the top search result isn't always a real, complete upload.
    for (const candidate of docs) {
      const identifier = candidate.identifier;

      const metaRes = await fetch(`${ARCHIVE_API}/metadata/${identifier}`);
      const meta = await metaRes.json();
      const files: any[] = meta?.files || [];

      const videoFile = pickBestVideoFile(files);
      if (!videoFile) continue; // try next candidate

      return {
        identifier,
        title: candidate.title || title,
        year: candidate.year,
        description: candidate.description,
        videoUrl: `https://archive.org/download/${identifier}/${videoFile.name}`,
        thumbUrl: `https://archive.org/services/img/${identifier}`,
      };
    }

    return null; // none of the candidates had a usable video file
  } catch (err) {
    console.error('[Archive.org] Search failed:', err);
    return null;
  }
}
