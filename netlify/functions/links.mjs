// Tracked share links (admin only). Kept out of the public content document so the
// companies you apply to stay private.
// GET    /api/links                       → {items}
// POST   /api/links {label, target}       → {item}
// DELETE /api/links?code=…
import crypto from 'node:crypto';
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';
import { linksStore, readLinks } from '../lib/events.mjs';

const validTarget = (t) => typeof t === 'string' && /^\/[a-z0-9/_-]*$/i.test(t) && t.length < 100;

export default async (req) => {
  if (!isAdmin(req)) return unauthorized();
  const store = linksStore();

  if (req.method === 'GET') return json({ items: await readLinks() });

  if (req.method === 'POST') {
    const { label, target } = await req.json().catch(() => ({}));
    const name = String(label || '').trim().slice(0, 60);
    if (!name) return json({ error: 'Give the link a name, like the company or recruiter.' }, 400);
    const items = await readLinks();
    // Short, unguessable, readable: 6 chars without look-alikes.
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code;
    do code = Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
    while (items.some((l) => l.code === code));
    const item = { code, label: name, target: validTarget(target) ? target : '/', createdAt: new Date().toISOString() };
    await store.setJSON('links', [item, ...items]);
    return json({ item });
  }

  if (req.method === 'DELETE') {
    const code = new URL(req.url).searchParams.get('code');
    await store.setJSON('links', (await readLinks()).filter((l) => l.code !== code));
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/links' };
