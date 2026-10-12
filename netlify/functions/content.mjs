// GET  /api/content                 → {content} (public; null until the first save)
// PUT  /api/content {content}       → saves, keeping the previous copy in history (admin)
// GET  /api/content?history=1       → [{key, savedAt}] (admin)
// POST /api/content {restore: key}  → restores a history entry (admin)
import { getStore } from '@netlify/blobs';
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';

const KEEP = 30;
const MAX_BYTES = 1_000_000;

export default async (req) => {
  const store = getStore({ name: 'portfolio', consistency: 'strong' });
  const url = new URL(req.url);

  if (req.method === 'GET' && !url.searchParams.has('history')) {
    const content = await store.get('content', { type: 'json' });
    return json({ content: content || null }, 200, { 'cache-control': 'public, max-age=0, must-revalidate' });
  }

  if (!isAdmin(req)) return unauthorized();

  if (req.method === 'GET') {
    const { blobs } = await store.list({ prefix: 'history/' });
    const items = blobs.map((b) => ({ key: b.key, savedAt: new Date(Number(b.key.split('/')[1])).toISOString() })).sort((a, b) => b.key.localeCompare(a.key));
    return json({ items });
  }

  if (req.method === 'PUT') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const next = body?.content;
    if (!next || typeof next !== 'object' || !next.profile) return json({ error: 'Content is missing required fields.' }, 400);
    next.updatedAt = new Date().toISOString();
    const serialized = JSON.stringify(next);
    if (serialized.length > MAX_BYTES) return json({ error: 'Content is too large (over 1 MB). Use uploads for images instead of pasting them.' }, 413);

    await archiveCurrent(store);
    await store.set('content', serialized);
    return json({ content: next });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    if (!String(body?.restore || '').startsWith('history/')) return json({ error: 'Unknown version' }, 400);
    const old = await store.get(body.restore, { type: 'json' });
    if (!old) return json({ error: 'That version no longer exists.' }, 404);
    await archiveCurrent(store);
    old.updatedAt = new Date().toISOString();
    await store.setJSON('content', old);
    return json({ content: old });
  }

  return json({ error: 'Method not allowed' }, 405);
};

// Copies the live content into history/<timestamp> and trims history to the newest KEEP.
async function archiveCurrent(store) {
  const current = await store.get('content');
  if (!current) return;
  await store.set(`history/${Date.now()}`, current);
  const { blobs } = await store.list({ prefix: 'history/' });
  const old = blobs.map((b) => b.key).sort().reverse().slice(KEEP);
  await Promise.all(old.map((k) => store.delete(k)));
}

export const config = { path: '/api/content' };
