// api/get-upload-url.ts
// Vercel serverless function. Runs server-side only — this is the ONLY
// place your R2 secret key should ever be used. It generates a short-lived
// presigned PUT URL that the browser can upload directly to, without ever
// seeing your actual credentials.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// NOTE: these are NOT prefixed with VITE_ — that's what keeps them out of
// the browser bundle. Set these as plain env vars in Vercel (no VITE_ prefix).
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
// This one IS safe to expose to the browser (it's just a public URL prefix),
// so it stays VITE_-prefixed and is read on the client, not here.

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    return res.status(500).json({
      error: 'R2 is not configured on the server. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in Vercel env vars (no VITE_ prefix).',
    });
  }

  // TODO: once your auth is wired up server-side, verify the requester is
  // actually an admin here before issuing an upload URL. For now this
  // endpoint trusts any caller — fine while you're the only user, but
  // tighten this before opening the admin panel to anyone else.

  const { fileName, contentType, pathPrefix } = req.body || {};
  if (!fileName || !pathPrefix) {
    return res.status(400).json({ error: 'fileName and pathPrefix are required' });
  }

  const key = `${pathPrefix}/${Date.now()}-${sanitizeFileName(fileName)}`;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return res.status(200).json({ uploadUrl, key });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to generate upload URL' });
  }
}

