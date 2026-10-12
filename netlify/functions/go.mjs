// GET /api/go?code=… (public) → {target}, recording the open for Insights.
// Unknown codes just go home, so an old or mistyped link never shows an error.
import { json } from '../lib/auth.mjs';
import { readLinks, recordEvent } from '../lib/events.mjs';

export default async (req, context) => {
  const code = (new URL(req.url).searchParams.get('code') || '').slice(0, 24);
  const link = (await readLinks()).find((l) => l.code === code);
  if (!link) return json({ target: '/' });
  const ua = req.headers.get('user-agent') || '';
  // Link-preview bots (Slack, LinkedIn, mail scanners) fetch links too; don't count them.
  if (!/bot|crawl|spider|preview|slack|linkedin|facebookexternalhit|whatsapp|telegram/i.test(ua)) {
    await recordEvent({ type: 'link-open', code, path: link.target, device: /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop' }, context);
  }
  return json({ target: link.target });
};

export const config = { path: '/api/go' };
