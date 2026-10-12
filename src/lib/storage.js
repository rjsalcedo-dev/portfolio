// src/lib/storage.js
// localStorage that never throws (private windows and blocked storage just act empty).
const ls = () => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
};

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = ls()?.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { ls()?.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { ls()?.removeItem(key); } catch {}
  },
};
