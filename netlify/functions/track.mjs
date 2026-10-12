// POST /api/track {type, …}  → records a visit event (public, sent by the site)
// GET  /api/track?days=30     → aggregated Insights (admin)
import { isAdmin, json, unauthorized } from '../lib/auth.mjs';
import { eventsStore, readLinks, recordEvent } from '../lib/events.mjs';

const KEEP_DAYS = 180;
const MAX_EVENTS = 4000;

export default async (req, context) => {
  if (req.method === 'POST') {
    const text = await req.text();
    if (text.length > 2000) return json({ ok: false }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ ok: false }, 400); }
    await recordEvent(body, context);
    return json({ ok: true });
  }

  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  if (!isAdmin(req)) return unauthorized();

  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 30));
  const store = eventsStore();
  const today = new Date();
  const dayKey = (offset) => new Date(today.getTime() - offset * 864e5).toISOString().slice(0, 10);
  const from = dayKey(days - 1);
  const cutoff = dayKey(KEEP_DAYS);

  const { blobs } = await store.list({ prefix: 'ev/' });
  const keys = [];
  const stale = [];
  for (const b of blobs) {
    const d = b.key.slice(3, 13);
    if (d < cutoff) stale.push(b.key);
    else if (d >= from) keys.push(b.key);
  }
  // Housekeeping: drop events older than KEEP_DAYS.
  await Promise.all(stale.slice(0, 500).map((k) => store.delete(k)));

  keys.sort().reverse();
  const wanted = keys.slice(0, MAX_EVENTS);
  const events = [];
  for (let i = 0; i < wanted.length; i += 50) {
    const batch = await Promise.all(wanted.slice(i, i + 50).map((k) => store.get(k, { type: 'json' }).catch(() => null)));
    events.push(...batch.filter(Boolean));
  }

  const links = await readLinks();
  const linkLabel = Object.fromEntries(links.map((l) => [l.code, l.label]));
  return json(aggregate(events, days, dayKey, linkLabel, keys.length > MAX_EVENTS));
};

function aggregate(events, days, dayKey, linkLabel, truncated) {
  const count = (arr, key) => {
    const m = new Map();
    for (const e of arr) { const k = key(e); if (k) m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };
  const of = (type) => events.filter((e) => e.type === type);
  const views = of('view');

  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(i);
    const dayEvents = events.filter((e) => e.t.startsWith(d));
    daily.push({
      date: d,
      views: dayEvents.filter((e) => e.type === 'view').length,
      visits: new Set(dayEvents.map((e) => e.sid).filter(Boolean)).size,
      resume: dayEvents.filter((e) => e.type === 'resume').length,
    });
  }

  const byCode = new Map();
  for (const e of events) {
    if (!e.code) continue;
    const s = byCode.get(e.code) || { code: e.code, label: linkLabel[e.code] || e.code, opens: 0, resume: 0, downloads: 0, last: e.t };
    if (e.type === 'link-open') s.opens++;
    if (e.type === 'resume') s.resume++;
    if (e.type === 'download') s.downloads++;
    if (e.t > s.last) s.last = e.t;
    byCode.set(e.code, s);
  }

  return {
    days,
    truncated,
    totals: {
      visits: new Set(events.map((e) => e.sid).filter(Boolean)).size,
      views: views.length,
      resume: of('resume').length,
      downloads: of('download').length + of('resume-text').length,
      contacts: of('contact').length,
      vcards: of('vcard').length,
      credentials: of('credential').length + of('verify').length + of('certificate').length,
    },
    daily,
    projects: count(views.filter((e) => e.slug), (e) => e.slug).slice(0, 8),
    referrers: count(events, (e) => e.referrer).slice(0, 8),
    countries: count(events.filter((e) => e.type === 'view'), (e) => e.country).slice(0, 8),
    devices: count(views, (e) => e.device),
    links: [...byCode.values()].sort((a, b) => b.last.localeCompare(a.last)),
    recent: events.slice(0, 40).map((e) => ({ ...e, sid: undefined, label: e.code ? linkLabel[e.code] || e.code : undefined })),
  };
}

export const config = { path: '/api/track' };
