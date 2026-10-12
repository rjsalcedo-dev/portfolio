// src/lib/api.js
// Client for the Netlify Functions in netlify/functions. All paths are same-origin.
import { storage } from './storage';

const TOKEN_KEY = 'rj.admin.token';
const BASE = process.env.EXPO_PUBLIC_API_BASE || '';

export const getToken = () => storage.get(TOKEN_KEY);
export const setToken = (t) => (t ? storage.set(TOKEN_KEY, t) : storage.remove(TOKEN_KEY));

async function request(path, { method = 'GET', body, auth = false, headers = {}, raw = false } = {}) {
  const h = { ...headers };
  if (auth) {
    const t = getToken();
    if (t) h.authorization = `Bearer ${t}`;
  }
  if (body !== undefined && !raw) h['content-type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers: h, body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    if (res.status === 401 && auth) setToken(null);
    throw err;
  }
  return data;
}

export const api = {
  getContent: () => request('/api/content'),
  saveContent: (content) => request('/api/content', { method: 'PUT', body: { content }, auth: true }),
  listHistory: () => request('/api/content?history=1', { auth: true }),
  restoreHistory: (key) => request('/api/content', { method: 'POST', body: { restore: key }, auth: true }),

  login: async (password) => {
    const { token } = await request('/api/auth', { method: 'POST', body: { password } });
    setToken(token);
    return token;
  },
  checkSession: () => request('/api/auth', { auth: true }),
  logout: () => setToken(null),

  upload: (file) => request('/api/upload', {
    method: 'POST', raw: true, body: file, auth: true,
    headers: { 'content-type': file.type || 'application/octet-stream', 'x-filename': encodeURIComponent(file.name || 'file') },
  }),

  sendMessage: (msg) => request('/api/contact', { method: 'POST', body: msg }),
  listMessages: () => request('/api/contact', { auth: true }),
  updateMessage: (id, patch) => request('/api/contact', { method: 'PATCH', body: { id, ...patch }, auth: true }),
  deleteMessage: (id) => request(`/api/contact?id=${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),

  resolveLink: (code) => request(`/api/go?code=${encodeURIComponent(code)}`),
  listLinks: () => request('/api/links', { auth: true }),
  createLink: (link) => request('/api/links', { method: 'POST', body: link, auth: true }),
  deleteLink: (code) => request(`/api/links?code=${encodeURIComponent(code)}`, { method: 'DELETE', auth: true }),
  insights: (days) => request(`/api/track?days=${days}`, { auth: true }),

  github: () => request('/api/github'),

  endorseInfo: (token) => request(`/api/endorse?token=${encodeURIComponent(token)}`),
  endorseSubmit: (data) => request('/api/endorse', { method: 'POST', body: data }),
  listEndorse: () => request('/api/endorse', { auth: true }),
  createEndorse: (data) => request('/api/endorse', { method: 'POST', body: data, auth: true }),
  reviewEndorse: (token, status) => request('/api/endorse', { method: 'PATCH', body: { token, status }, auth: true }),
  deleteEndorse: (token) => request(`/api/endorse?token=${encodeURIComponent(token)}`, { method: 'DELETE', auth: true }),

  credly: (username) => request(`/api/credly?username=${encodeURIComponent(username)}`, { auth: true }),
};
