// src/lib/track.js
// First-party, cookie-free visit stats for the admin's Insights panel. Nothing personal is
// stored: no IP, no cookies, no fingerprint. Your own visits (signed in to /admin), bots
// and browsers sending "Do Not Track" are skipped.
import { Platform } from 'react-native';
import { getToken } from './api';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const REF_KEY = 'rj.ref';

const skip = () => {
  if (!isWeb) return true;
  if (getToken()) return true;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return true;
  if (/bot|crawl|spider|headless|lighthouse|preview/i.test(navigator.userAgent)) return true;
  return /^(localhost|127\.|\[::1\])/.test(window.location.hostname) && !window.location.search.includes('track=1');
};

// A tracked recruiter link (/r/<code>) tags the rest of that visit with its code.
export const setRefCode = (code) => { try { sessionStorage.setItem(REF_KEY, code); } catch {} };
const refCode = () => { try { return sessionStorage.getItem(REF_KEY) || undefined; } catch { return undefined; } };

// A random id for this browser tab's visit, so Insights can count visits as well as views.
// It lives only in sessionStorage and identifies nobody.
const sessionId = () => {
  try {
    let id = sessionStorage.getItem('rj.sid');
    if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('rj.sid', id); }
    return id;
  } catch { return undefined; }
};

// A scan of the printed business card (/?src=card) tags the visit like a share link.
if (isWeb) {
  try { if (new URLSearchParams(window.location.search).get('src') === 'card') sessionStorage.setItem(REF_KEY, 'card'); } catch {}
}

let sentReferrer = false;

export function track(type, data = {}) {
  if (skip()) return;
  let referrer;
  if (!sentReferrer) {
    sentReferrer = true;
    try {
      const r = document.referrer && new URL(document.referrer);
      if (r && r.host !== window.location.host) referrer = r.host.replace(/^www\./, '');
    } catch {}
  }
  const body = JSON.stringify({
    type,
    path: window.location.pathname,
    code: refCode(),
    sid: sessionId(),
    referrer,
    device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop',
    ...data,
  });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true });
  } catch {}
}
