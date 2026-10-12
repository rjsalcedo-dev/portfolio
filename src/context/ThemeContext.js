// src/context/ThemeContext.js
// Follows the system appearance by default; the nav toggle can pin light or dark.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { PALETTES, BREAKPOINTS } from '../theme/tokens';
import { storage } from '../lib/storage';

const ThemeContext = createContext(null);
const KEY = 'rj.theme';

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState(() => storage.get(KEY, 'system'));
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const colors = PALETTES[scheme];

  useEffect(() => {
    storage.set(KEY, preference);
  }, [preference]);

  // Keep the document itself (overscroll areas, print, browser chrome) in the same theme.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const root = document.documentElement;
    root.style.background = colors.page;
    root.style.colorScheme = scheme;
    root.dataset.theme = scheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.page);
  }, [colors, scheme]);

  const value = useMemo(() => ({ colors, scheme, preference, setPreference }), [colors, scheme, preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// 'sm' (phones) · 'md' (tablets) · 'lg' (desktop)
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const bp = width >= BREAKPOINTS.lg ? 'lg' : width >= BREAKPOINTS.md ? 'md' : 'sm';
  return { bp, width, isSm: bp === 'sm', isLg: bp === 'lg' };
}
