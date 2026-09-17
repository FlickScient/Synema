// src/services/r2.ts
// Browser-side upload helper. This file NEVER holds your R2 secret key.
// It asks our own serverless function (/api/get-upload-url) for a
// short-lived presigned URL, then uploads the file straight to R2 using
// that URL. Only the public URL prefix is used here — safe to expose.

const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev, no trailing slash

/**
 * Uploads a file to R2 with progress reporting, via a presigned URL
 * obtained from our own backend (api/get-upload-url).
 *
 * @param file        The File object (from an <input type="file"> picker)
 * @param pathPrefix  A folder-like prefix, e.g. the tmdb_id or a slug
 * @param onProgress  Optional callback, called with 0-100 as upload proceeds
 */
export async function uploadToR2(
  file: File,
  pathPrefix: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!PUBLIC_URL) {
    throw new Error('VITE_R2_PUBLIC_URL is not set. Check your Vercel environment variables.');
  }

  // 1. Ask our backend for a presigned upload URL (secret key stays server-side)
  const res = await fetch('/api/get-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      pathPrefix,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get upload URL (${res.status})`);
  }

  const { uploadUrl, key } = await res.json();

  // 2. Upload the actual file bytes directly to R2 using that URL.
  // XMLHttpRequest instead of fetch so we get real progress events —
  // important for multi-GB video files on mobile connections.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    xhr.onabort = () => reject(new Error('Upload was cancelled'));

    xhr.send(file);
  });

  // 3. Build the final public URL from the key R2 stored it under.
  return `${PUBLIC_URL}/${key}`;
}

/** Simple client-side size guard. Default warns above 5GB. */
export function checkFileSize(file: File, maxBytes = 5 * 1024 * 1024 * 1024): string | null {
  if (file.size > maxBytes) {
    const gb = (file.size / (1024 * 1024 * 1024)).toFixed(2);
    return `This file is ${gb}GB, which is unusually large for a single upload. It may take a long time or fail on an unstable connection.`;
  }
  return null;
}
