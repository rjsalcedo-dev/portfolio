// GET /api/media/:key → the uploaded file (public, cached forever: keys never change).
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const key = context.params?.key;
  if (!key || !/^[a-z0-9-]+\.[a-z]+$/.test(key)) return new Response('Not found', { status: 404 });
  const result = await getStore('media').getWithMetadata(key, { type: 'arrayBuffer' });
  if (!result) return new Response('Not found', { status: 404 });
  // Files uploaded with the Netlify CLI carry no metadata, so fall back to the extension.
  const EXT = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', pdf: 'application/pdf' };
  const type = result.metadata?.type || EXT[key.split('.').pop()] || 'application/octet-stream';
  const headers = {
    'content-type': type,
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
  };
  // Images get a locked-down sandbox. PDFs can't have it: Chrome's PDF viewer refuses to
  // render sandboxed documents. Uploads are admin-only and type-checked either way.
  if (type !== 'application/pdf') headers['content-security-policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  else headers['content-disposition'] = `inline; filename="${key.replace(/^[a-z0-9]+-/, '')}"`;
  return new Response(result.data, { headers });
};

export const config = { path: '/api/media/:key' };
