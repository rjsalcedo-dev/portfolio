// netlify/lib/events.mjs
// Visit events for Insights: one small blob per event under ev/<YYYY-MM-DD>/<time>-<rand>.
// One blob per event means concurrent visitors never overwrite each other's counts.
import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

export const TYPES = ['view', 'resume', 'download', 'resume-text', 'contact', 'vcard', 'credential', 'certificate', 'verify', 'link-open', 'skill', 'rolefit', 'brief', 'endorse'];
export const eventsStore = () => getStore({ name: 'events', consistency: 'eventual' });
export const linksStore = () => getStore({ name: 'private', consistency: 'strong' });

const clip = (v, n = 80) => (v == null ? undefined : String(v).slice(0, n));

export async function recordEvent(raw, context) {
  if (!TYPES.includes(raw.type)) return false;
  const now = new Date();
  const event = {
    t: now.toISOString(),
    type: raw.type,
    path: clip(raw.path, 120),
    slug: clip(raw.slug),
    id: clip(raw.id),
    code: clip(raw.code, 24),
    referrer: clip(raw.referrer),
    device: ['mobile', 'tablet', 'desktop'].includes(raw.device) ? raw.device : undefined,
    sid: clip(raw.sid, 16),
    country: context?.geo?.country?.name || undefined,
  };
  const key = `ev/${event.t.slice(0, 10)}/${now.getTime()}-${crypto.randomBytes(3).toString('hex')}`;
  await eventsStore().setJSON(key, event);
  return true;
}

export async function readLinks() {
  return (await linksStore().get('links', { type: 'json' })) || [];
}
