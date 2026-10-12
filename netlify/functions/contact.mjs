// POST   /api/contact {name, email, message, website} → saves to the inbox (public)
// GET    /api/contact                 → {items} newest first (admin)
// PATCH  /api/contact {id, read}      → mark read/unread (admin)
// DELETE /api/contact?id=…            → delete (admin)
import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';

const LIMIT_PER_HOUR = 5;

export default async (req, context) => {
  const store = getStore({ name: 'inbox', consistency: 'strong' });

  if (req.method === 'POST') {
    let b;
    try { b = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
    // Bots fill the hidden "website" field; pretend it worked.
    if (b.website) return json({ ok: true });
    const name = String(b.name || '').trim().slice(0, 120);
    const email = String(b.email || '').trim().slice(0, 200);
    const message = String(b.message || '').trim().slice(0, 5000);
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10) return json({ error: 'Please fill in your name, a valid email and a message.' }, 400);

    const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
    const ipKey = `rate/${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)}`;
    const hour = Math.floor(Date.now() / 36e5);
    const rate = (await store.get(ipKey, { type: 'json' })) || {};
    const count = rate.hour === hour ? rate.count : 0;
    if (count >= LIMIT_PER_HOUR) return json({ error: 'Too many messages. Please try again in an hour.' }, 429);
    await store.setJSON(ipKey, { hour, count: count + 1 });

    const id = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    await store.setJSON(`msg/${id}`, { id, name, email, message, read: false, createdAt: new Date().toISOString(), country: context.geo?.country?.name || null });
    return json({ ok: true });
  }

  if (!isAdmin(req)) return unauthorized();

  if (req.method === 'GET') {
    const { blobs } = await store.list({ prefix: 'msg/' });
    const keys = blobs.map((b) => b.key).sort().reverse().slice(0, 200);
    const items = (await Promise.all(keys.map((k) => store.get(k, { type: 'json' })))).filter(Boolean);
    return json({ items });
  }

  if (req.method === 'PATCH') {
    const { id, read } = await req.json().catch(() => ({}));
    const msg = id && (await store.get(`msg/${id}`, { type: 'json' }));
    if (!msg) return json({ error: 'Not found' }, 404);
    await store.setJSON(`msg/${id}`, { ...msg, read: !!read });
    return json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id');
    if (!id || !/^[0-9a-f-]+$/.test(id)) return json({ error: 'Not found' }, 404);
    await store.delete(`msg/${id}`);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/contact' };
