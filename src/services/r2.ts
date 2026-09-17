// src/services/r2.ts
// Uploads files directly to Cloudflare R2 (S3-compatible) from the browser.
// Uses a presigned PUT URL generated client-side via aws4fetch-style signing
// is overkill for a single-admin app — instead we sign requests using the
// AWS SDK's S3RequestPresigner so the actual bytes never touch our own server.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL; // e.g. https://xxxx.r2.dev or custom domain, no trailing slash

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Uploads a file to R2 with progress reporting.
 * Returns the public URL once the upload completes.
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
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME || !PUBLIC_URL) {
    throw new Error(
      'R2 is not configured. Check VITE_R2_ACCOUNT_ID, VITE_R2_ACCESS_KEY_ID, ' +
      'VITE_R2_SECRET_ACCESS_KEY, VITE_R2_BUCKET_NAME, and VITE_R2_PUBLIC_URL in your env.'
    );
  }

  const key = `${pathPrefix}/${Date.now()}-${sanitizeFileName(file.name)}`;

  // Generate a presigned PUT URL so the actual file bytes go straight from
  // the browser to R2 — never through any server of ours.
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: file.type || 'application/octet-stream',
  });
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  // Use XMLHttpRequest instead of fetch so we get real upload progress events
  // — important for multi-GB video files on mobile connections.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
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
