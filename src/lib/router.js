// src/lib/router.js
// A tiny history-based router. The site scrolls the document (not a ScrollView) so mobile
// Safari's toolbar collapses naturally, which a navigator's fixed-height screens prevent.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

const ROUTES = [
  { name: 'home', pattern: /^\/$/ },
  { name: 'project', pattern: /^\/projects\/([^/]+)\/?$/, keys: ['slug'] },
  { name: 'resume', pattern: /^\/resume(?:\/([^/]+))?\/?$/, keys: ['version'] },
  { name: 'admin', pattern: /^\/admin\/?$/ },
  { name: 'go', pattern: /^\/r\/([^/]+)\/?$/, keys: ['code'] },
  { name: 'brief', pattern: /^\/brief\/?$/ },
  { name: 'card', pattern: /^\/card\/?$/ },
  { name: 'endorse', pattern: /^\/endorse\/([^/]+)\/?$/, keys: ['token'] },
];

export function matchRoute(pathname) {
  for (const r of ROUTES) {
    const m = pathname.match(r.pattern);
    if (m) {
      const params = {};
      (r.keys || []).forEach((k, i) => { if (m[i + 1]) params[k] = decodeURIComponent(m[i + 1]); });
      return { name: r.name, params };
    }
  }
  return { name: 'notFound', params: {} };
}

const read = () => (isWeb ? { pathname: window.location.pathname, hash: window.location.hash.slice(1) } : { pathname: '/', hash: '' });

export const scrollToId = (id, smooth = true) => {
  if (!isWeb) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' });
  return true;
};

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(read);

  useEffect(() => {
    if (!isWeb) return undefined;
    const onPop = () => setLoc(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (!isWeb) { setLoc({ pathname: to.split('#')[0] || '/', hash: to.split('#')[1] || '' }); return; }
    const url = new URL(to, window.location.origin);
    if (url.origin !== window.location.origin) { window.location.href = to; return; }
    const samePage = url.pathname === window.location.pathname;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search + url.hash);
    setLoc({ pathname: url.pathname, hash: url.hash.slice(1) });
    if (url.hash) {
      // Wait a frame so a newly rendered page has its sections in the DOM.
      requestAnimationFrame(() => setTimeout(() => scrollToId(url.hash.slice(1), samePage), samePage ? 0 : 60));
    } else if (!samePage) {
      window.scrollTo(0, 0);
    }
  }, []);

  const value = useMemo(() => ({ ...loc, route: matchRoute(loc.pathname), navigate }), [loc, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

// Props for a Pressable/Text that should behave like a real link: right-click, cmd-click
// and "copy link" work on web, while a plain click navigates without a reload.
export function useLinkProps(href, { external } = {}) {
  const { navigate } = useRouter();
  const isExternal = external ?? /^(https?:|mailto:|tel:)/.test(href || '');
  if (!href) return {};
  return {
    href,
    hrefAttrs: isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : undefined,
    accessibilityRole: 'link',
    onPress: (e) => {
      if (isExternal) {
        if (!isWeb) require('react-native').Linking.openURL(href);
        return;
      }
      const ne = e?.nativeEvent;
      if (ne && (ne.metaKey || ne.ctrlKey || ne.shiftKey || ne.button === 1)) return;
      e?.preventDefault?.();
      navigate(href);
    },
  };
}
