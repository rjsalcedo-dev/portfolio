// POST /api/upload (admin; raw file body, content-type + x-filename headers) → {url}
// Files are stored in the "media" blob store and served by media.mjs.
import { getStore } from '@netlify/blobs';
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';

const TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'application/pdf': 'pdf' };
const MAX_BYTES = 4.5 * 1024 * 1024; // Netlify Functions accept ~6 MB request bodies

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isAdmin(req)) return unauthorized();

  const type = (req.headers.get('content-type') || '').split(';')[0].trim();
  const ext = TYPES[type];
  if (!ext) return json({ error: 'Use a PNG, JPG, WebP, GIF, AVIF or PDF file.' }, 415);

  const data = await req.arrayBuffer();
  if (data.byteLength > MAX_BYTES) return json({ error: 'File is over 4.5 MB. Please compress it first.' }, 413);

  const name = decodeURIComponent(req.headers.get('x-filename') || 'file').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
  const key = `${Date.now().toString(36)}-${name}.${ext}`;
  await getStore('media').set(key, data, { metadata: { type, size: data.byteLength } });
  return json({ url: `/api/media/${key}`, key });
};

export const config = { path: '/api/upload' };
