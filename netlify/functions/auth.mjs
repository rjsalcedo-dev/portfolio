// POST /api/auth {password} → {token}    GET /api/auth (Bearer) → {ok}
import { checkPassword, isAdmin, isConfigured, issueToken, json, unauthorized } from '../lib/auth.mjs';

export default async (req) => {
  if (!isConfigured()) return json({ error: 'Admin is not set up yet. Add ADMIN_PASSWORD to the Netlify environment variables, then redeploy.' }, 503);

  if (req.method === 'GET') return isAdmin(req) ? json({ ok: true }) : unauthorized();

  if (req.method === 'POST') {
    let password = '';
    try { ({ password } = await req.json()); } catch {}
    if (!checkPassword(password)) {
      await new Promise((r) => setTimeout(r, 800)); // slows down guessing
      return json({ error: 'Incorrect password.' }, 401);
    }
    return json({ token: issueToken() });
  }
  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/auth' };
