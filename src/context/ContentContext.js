// src/context/ContentContext.js
// The whole site renders from one content document. Load order:
//   1. last copy cached in this browser (instant, usually current)
//   2. the live copy from /api/content (replaces it as soon as it arrives)
//   3. the seed in src/data/defaults.js if there is no cache and the API is unreachable
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { DEFAULT_CONTENT, normalizeContent } from '../data/defaults';

const ContentContext = createContext(null);
const CACHE_KEY = 'rj.content';

// The admin's "Preview" button stores the unpublished draft here and opens /?preview=1.
export const PREVIEW_KEY = 'rj.preview';
const previewDraft = () => {
  if (typeof window === 'undefined' || !/[?&]preview=1/.test(window.location.search || '')) return null;
  return storage.get(PREVIEW_KEY);
};

export function ContentProvider({ children }) {
  const [preview] = useState(previewDraft);
  const [cached] = useState(() => storage.get(CACHE_KEY));
  const [content, setContentState] = useState(() => normalizeContent(preview || cached || DEFAULT_CONTENT));
  const [ready, setReady] = useState(!!(preview || cached));
  const [source, setSource] = useState(preview ? 'preview' : cached ? 'cache' : 'default');

  const setContent = useCallback((next) => {
    const n = normalizeContent(next);
    setContentState(n);
    storage.set(CACHE_KEY, n);
  }, []);

  useEffect(() => {
    if (preview) return undefined;
    let alive = true;
    // Don't hold the page for a slow network: show the seed after a short wait.
    const timer = setTimeout(() => alive && setReady(true), 1200);
    api.getContent()
      .then(({ content: live }) => {
        if (!alive) return;
        if (live) { setContent(live); setSource('live'); }
      })
      .catch(() => {})
      .finally(() => { if (alive) { clearTimeout(timer); setReady(true); } });
    return () => { alive = false; clearTimeout(timer); };
  }, [setContent, preview]);

  const value = useMemo(() => ({ content, setContent, ready, source }), [content, setContent, ready, source]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);
