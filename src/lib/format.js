// src/lib/format.js
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2025-06' or '2025-06-14' → 'Jun 2025'; '2025' → '2025'
export function formatMonth(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})(?:-(\d{1,2}))?/);
  if (!m) return String(value);
  return m[2] ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : m[1];
}

export function formatRange(start, end) {
  const a = formatMonth(start);
  const b = end ? formatMonth(end) : 'Present';
  return a ? `${a} – ${b}` : b;
}

export const toDate = (value) => {
  const m = String(value || '').match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
  return m ? new Date(Number(m[1]), m[2] ? Number(m[2]) - 1 : 0, m[3] ? Number(m[3]) : 1) : null;
};

// Share of the program completed, 0–1.
export function progressBetween(start, end, now = new Date()) {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b || b <= a) return 0;
  return Math.min(1, Math.max(0, (now - a) / (b - a)));
}

export function relativeTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const slugify = (s) =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const hostOf = (url) => {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; }
};

// 'https://github.com/rjsalcedo-dev/' → 'github.com/rjsalcedo-dev'
export const shortUrl = (url) => {
  try {
    const u = new URL(url);
    return (u.host.replace(/^www\./, '') + u.pathname).replace(/\/$/, '');
  } catch { return String(url || ''); }
};

// While typing: lowercase and swap anything else for "-", but keep dashes so typing works.
export const cleanSlug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 60);

// The availability details a recruiter filters on, as [icon, text] pairs; blank ones are left out.
export function availabilityParts(profile) {
  const a = profile?.availability || {};
  const start = toDate(a.start);
  return [
    start && ['calendar', start > new Date() ? `Can start ${formatMonth(a.start)}` : 'Can start now'],
    a.hours && ['clock', /ojt|intern/i.test(a.hours) ? a.hours : `${a.hours} OJT`],
    a.setup && ['map-pin', a.setup],
  ].filter(Boolean);
}
