// GET /api/credly?username=… (admin) → {items}: every public badge on a Credly profile,
// mapped to the portfolio's credential shape. Proxied because Credly blocks browser CORS.
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';

export default async (req) => {
  if (!isAdmin(req)) return unauthorized();
  const username = (new URL(req.url).searchParams.get('username') || '').trim().replace(/^https?:\/\/(www\.)?credly\.com\/users\//, '').replace(/[/?#].*$/, '');
  if (!/^[a-z0-9._-]+$/i.test(username)) return json({ error: 'Enter your Credly username (the part after credly.com/users/).' }, 400);

  const items = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`https://www.credly.com/users/${encodeURIComponent(username)}/badges.json?page=${page}`, { headers: { accept: 'application/json', 'user-agent': 'portfolio-import' } });
    if (res.status === 404) return json({ error: `No public Credly profile found for "${username}". Check the username and that your profile is public.` }, 404);
    if (!res.ok) return json({ error: `Credly returned ${res.status}. Try again in a minute.` }, 502);
    const body = await res.json();
    for (const b of body.data || []) {
      const t = b.badge_template || {};
      const issuer = b.issuer?.entities?.find((e) => e.primary)?.entity?.name || b.issuer?.entities?.[0]?.entity?.name || t.issuer?.entities?.[0]?.entity?.name || '';
      items.push({
        credlyId: b.id,
        title: t.name || 'Badge',
        issuer,
        issued: (b.issued_at_date || b.issued_at || '').slice(0, 10),
        expires: (b.expires_at_date || '').slice(0, 10),
        image: b.image_url || t.image_url || '',
        verifyUrl: `https://www.credly.com/badges/${b.id}`,
        description: t.description || '',
        skills: (t.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean).slice(0, 8),
        kind: 'badge',
      });
    }
    const meta = body.metadata || {};
    if (!meta.total_pages || page >= meta.total_pages) break;
  }
  return json({ items });
};

export const config = { path: '/api/credly' };
