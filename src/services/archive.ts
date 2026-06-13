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

export async function searchArchive(title: string): Promise<ArchiveItem | null> {
  try {
    const query = encodeURIComponent(
      `title:(${title}) AND mediatype:movies AND subject:(feature film OR public domain)`
    );
    const url = `${ARCHIVE_API}/advancedsearch.php?q=${query}&fl[]=identifier,title,year,description&rows=5&output=json`;

    const res = await fetch(url);
    const data = await res.json();

    const docs = data?.response?.docs;
    if (!docs || docs.length === 0) return null;

    // Pick best match — closest title
    const best = docs[0];
    const identifier = best.identifier;

    // Get metadata to find actual video file
    const metaRes = await fetch(`${ARCHIVE_API}/metadata/${identifier}`);
    const meta = await metaRes.json();

    const files: any[] = meta?.files || [];
    const videoFile = files.find(
      f => f.name?.endsWith('.mp4') || f.name?.endsWith('.ogv') || f.name?.endsWith('.mpeg')
    );

    if (!videoFile) return null;

    return {
      identifier,
      title: best.title || title,
      year: best.year,
      description: best.description,
      videoUrl: `https://archive.org/download/${identifier}/${videoFile.name}`,
      thumbUrl: `https://archive.org/services/img/${identifier}`,
    };
  } catch (err) {
    console.error('[Archive.org] Search failed:', err);
    return null;
  }
}
