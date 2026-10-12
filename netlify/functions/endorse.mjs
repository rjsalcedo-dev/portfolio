// Testimonial requests. You send someone a private link (/endorse/<token>); they write a
// testimonial; it waits in Admin → Testimonials until you approve it.
//
// Admin:  GET    /api/endorse                     → {items}
//         POST   /api/endorse {name, relationship} → {item}
//         PATCH  /api/endorse {token, status}     → mark approved / declined
//         DELETE /api/endorse?token=…
// Public: GET    /api/endorse?token=…             → {name, relationship, owner} while open
//         POST   /api/endorse {token, quote, …}    → submit once
import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';

const store = () => getStore({ name: 'private', consistency: 'strong' });
const KEY = (t) => `endorse/${t}`;
const clip = (v, n) => String(v || '').trim().slice(0, n);
const validToken = (t) => /^[a-z0-9]{10,32}$/.test(t || '');

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  // ── Public ──
  if (req.method === 'GET' && token) {
    if (!validToken(token)) return json({ error: 'This link is not valid.' }, 404);
    const item = await store().get(KEY(token), { type: 'json' });
    if (!item) return json({ error: 'This link is not valid.' }, 404);
    if (item.status !== 'open') return json({ error: 'This testimonial has already been submitted. Thank you!' }, 410);
    const content = await getStore({ name: 'portfolio', consistency: 'strong' }).get('content', { type: 'json' });
    return json({ name: item.name, relationship: item.relationship, owner: content?.profile?.name || 'R J Salcedo' });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    if (body.token !== undefined) {
      if (!validToken(body.token)) return json({ error: 'This link is not valid.' }, 404);
      const item = await store().get(KEY(body.token), { type: 'json' });
      if (!item) return json({ error: 'This link is not valid.' }, 404);
      if (item.status !== 'open') return json({ error: 'This testimonial has already been submitted.' }, 410);
      const quote = clip(body.quote, 700);
      const name = clip(body.name, 80);
      if (quote.length < 40 || !name) return json({ error: 'Please add your name and a testimonial of at least a few sentences.' }, 400);
      if (!body.consent) return json({ error: 'Please confirm it can be shown publicly.' }, 400);
      const link = clip(body.link, 200);
      await store().setJSON(KEY(body.token), {
        ...item,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submission: { quote, name, role: clip(body.role, 80), org: clip(body.org, 80), link: /^https?:\/\//.test(link) ? link : '' },
      });
      return json({ ok: true });
    }
  }

  // ── Admin ──
  if (!isAdmin(req)) return unauthorized();

  if (req.method === 'GET') {
    const { blobs } = await store().list({ prefix: 'endorse/' });
    const items = (await Promise.all(blobs.map((b) => store().get(b.key, { type: 'json' })))).filter(Boolean);
    return json({ items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const name = clip(body.name, 80);
    if (!name) return json({ error: 'Who is this request for?' }, 400);
    const t = crypto.randomBytes(9).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12).padEnd(12, 'x');
    const item = { token: t, name, relationship: clip(body.relationship, 80), status: 'open', createdAt: new Date().toISOString() };
    await store().setJSON(KEY(t), item);
    return json({ item });
  }

  if (req.method === 'PATCH') {
    const body = await req.json().catch(() => ({}));
    if (!validToken(body.token) || !['approved', 'declined'].includes(body.status)) return json({ error: 'Invalid request' }, 400);
    const item = await store().get(KEY(body.token), { type: 'json' });
    if (!item) return json({ error: 'Not found' }, 404);
    await store().setJSON(KEY(body.token), { ...item, status: body.status, reviewedAt: new Date().toISOString() });
    return json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (!validToken(token)) return json({ error: 'Not found' }, 404);
    await store().delete(KEY(token));
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/endorse' };
