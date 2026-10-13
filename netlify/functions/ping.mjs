// GET /api/ping?url=… → {up, ms, status}
// Checks (and so wakes) a project's live demo. Only URLs listed as a project's live link
// are allowed, so this can't be used to make requests to arbitrary sites.
import { getStore } from '@netlify/blobs';
import { json } from '../lib/auth.mjs';

const TIMEOUT = 8000;

export default async (req) => {
  const target = new URL(req.url).searchParams.get('url') || '';
  const content = await getStore({ name: 'portfolio', consistency: 'strong' }).get('content', { type: 'json' });
  const allowed = new Set((content?.projects || []).map((p) => p.links?.live).filter(Boolean));
  if (!allowed.has(target)) return json({ error: 'Not a listed demo.' }, 400);

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(target, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'rjsalcedo-portfolio-status' } });
    clearTimeout(timer);
    // Free hosts answer 502/503 while they boot; treat those as "still waking".
    return json({ up: res.status < 500, status: res.status, ms: Date.now() - started }, 200, { 'cache-control': 'public, max-age=20' });
  } catch {
    clearTimeout(timer);
    return json({ up: false, status: 0, ms: Date.now() - started });
  }
};

export const config = { path: '/api/ping' };
