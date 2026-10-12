// src/theme/tokens.js
// Design tokens. Apple-style: near-black text on an off-white page, one accent blue,
// hairline borders, generous whitespace. Every spacing value sits on a 4pt grid.
import { Platform } from 'react-native';

export const PALETTES = {
  light: {
    mode: 'light',
    page: '#fbfbfd',
    pageAlt: '#f5f5f7',
    surface: '#ffffff',
    surfaceMuted: '#f5f5f7',
    glass: 'rgba(251, 251, 253, 0.72)',
    text: '#1d1d1f',
    text2: '#6e6e73',
    text3: '#86868b',
    border: 'rgba(0, 0, 0, 0.08)',
    borderStrong: 'rgba(0, 0, 0, 0.16)',
    accent: '#0071e3',
    accentText: '#0066cc',
    accentSoft: 'rgba(0, 113, 227, 0.1)',
    onAccent: '#ffffff',
    success: '#248a3d',
    successSoft: 'rgba(36, 138, 61, 0.12)',
    warning: '#b25000',
    danger: '#d70015',
    dangerSoft: 'rgba(215, 0, 21, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.32)',
    inverse: '#1d1d1f',
    onInverse: '#f5f5f7',
  },
  dark: {
    mode: 'dark',
    page: '#000000',
    pageAlt: '#0b0b0c',
    surface: '#161617',
    surfaceMuted: '#1d1d1f',
    glass: 'rgba(22, 22, 23, 0.72)',
    text: '#f5f5f7',
    text2: '#a1a1a6',
    text3: '#6e6e73',
    border: 'rgba(255, 255, 255, 0.1)',
    borderStrong: 'rgba(255, 255, 255, 0.2)',
    accent: '#0a84ff',
    accentText: '#2997ff',
    accentSoft: 'rgba(41, 151, 255, 0.14)',
    onAccent: '#ffffff',
    success: '#30d158',
    successSoft: 'rgba(48, 209, 88, 0.14)',
    warning: '#ff9f0a',
    danger: '#ff453a',
    dangerSoft: 'rgba(255, 69, 58, 0.12)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    inverse: '#f5f5f7',
    onInverse: '#1d1d1f',
  },
};

export const SPACE = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64, 11: 80, 12: 96, 13: 120, 14: 160 };

export const RADIUS = { sm: 8, md: 12, lg: 18, xl: 28, pill: 999 };

export const BREAKPOINTS = { md: 734, lg: 1068 }; // Apple's own breakpoints

export const MAX_WIDTH = 1080;
export const NAV_HEIGHT = 52;

// SF Pro on Apple devices, Inter (Google Fonts, loaded in public/index.html) everywhere else.
export const FONT = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
  default: undefined,
});
export const FONT_MONO = Platform.select({
  web: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
  default: undefined,
});

// Type scale per breakpoint: [fontSize, lineHeight, letterSpacing, fontWeight]
// Tight tracking on large sizes, neutral on body copy, just like Apple's marketing pages.
export const TYPE = {
  hero:    { sm: [44, 48, -0.9, '700'], md: [64, 68, -1.4, '700'], lg: [80, 84, -1.8, '700'] },
  title:   { sm: [32, 36, -0.6, '700'], md: [40, 44, -0.8, '700'], lg: [48, 52, -1.0, '700'] },
  h2:      { sm: [24, 28, -0.4, '600'], md: [28, 32, -0.5, '600'], lg: [32, 36, -0.6, '600'] },
  h3:      { sm: [19, 24, -0.2, '600'], md: [21, 26, -0.3, '600'], lg: [21, 26, -0.3, '600'] },
  lead:    { sm: [19, 28, -0.2, '400'], md: [21, 30, -0.3, '400'], lg: [24, 34, -0.4, '400'] },
  body:    { sm: [17, 26, -0.2, '400'], md: [17, 26, -0.2, '400'], lg: [17, 26, -0.2, '400'] },
  small:   { sm: [14, 20, -0.1, '400'], md: [14, 20, -0.1, '400'], lg: [14, 20, -0.1, '400'] },
  caption: { sm: [12, 16, 0, '400'],    md: [12, 16, 0, '400'],    lg: [12, 16, 0, '400'] },
  eyebrow: { sm: [14, 20, 0, '600'],    md: [15, 20, 0, '600'],    lg: [17, 24, -0.2, '600'] },
  label:   { sm: [13, 18, 0, '600'],    md: [13, 18, 0, '600'],    lg: [13, 18, 0, '600'] },
};

export const MOTION = { fast: 160, base: 280, slow: 600, ease: 'cubic-bezier(0.28, 0.11, 0.32, 1)' };
