// netlify/lib/auth.mjs
// Stateless admin sessions: an HMAC-signed token, checked on every write.
// Needs ADMIN_PASSWORD (and ideally SESSION_SECRET) in the site's environment variables.
import crypto from 'node:crypto';

const SESSION_DAYS = 7;

export const isConfigured = () => !!process.env.ADMIN_PASSWORD;
const secret = () => process.env.SESSION_SECRET || `pw:${process.env.ADMIN_PASSWORD}`;

const hmac = (data) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export const checkPassword = (pw) => isConfigured() && safeEqual(pw || '', process.env.ADMIN_PASSWORD);

export function issueToken() {
  const body = Buffer.from(JSON.stringify({ sub: 'admin', exp: Date.now() + SESSION_DAYS * 864e5 })).toString('base64url');
  return `${body}.${hmac(body)}`;
}

export function verifyToken(token) {
  if (!isConfigured() || !token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!safeEqual(sig, hmac(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

export const isAdmin = (req) => !!verifyToken((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export const unauthorized = () => json({ error: 'Your session has expired. Please sign in again.' }, 401);
