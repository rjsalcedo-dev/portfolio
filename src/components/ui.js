// src/components/ui.js
// Design-system primitives. Screens compose these instead of styling raw RN views, so
// type, spacing and color stay consistent everywhere.
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, Image } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { FONT, FONT_MONO, MAX_WIDTH, MOTION, RADIUS, SPACE, TYPE } from '../theme/tokens';
import { useLinkProps } from '../lib/router';

const isWeb = Platform.OS === 'web';
const webOnly = (s) => (isWeb ? s : null);

const COLOR_ALIASES = { secondary: 'text2', tertiary: 'text3', accent: 'accentText' };

// ── Text ─────────────────────────────────────────────────────────────────────────────
export function T({ variant = 'body', color, align, weight, mono, style, children, ...rest }) {
  const { colors } = useTheme();
  const { bp } = useBreakpoint();
  const [fontSize, lineHeight, letterSpacing, fontWeight] = (TYPE[variant] || TYPE.body)[bp];
  const key = COLOR_ALIASES[color] || color;
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: mono ? FONT_MONO : FONT,
          fontSize, lineHeight, letterSpacing, fontWeight: weight || fontWeight,
          color: key ? colors[key] || key : colors.text,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ── Icon ─────────────────────────────────────────────────────────────────────────────
export function Icon({ name, size = 18, color, style }) {
  const { colors } = useTheme();
  const key = COLOR_ALIASES[color] || color;
  return <Feather name={name} size={size} color={key ? colors[key] || key : colors.text} style={style} />;
}

// ── Layout ───────────────────────────────────────────────────────────────────────────
export function Container({ children, style, width = MAX_WIDTH, ...rest }) {
  const { bp } = useBreakpoint();
  const gutter = bp === 'sm' ? SPACE[5] : bp === 'md' ? SPACE[7] : SPACE[8];
  return (
    <View {...rest} style={[{ width: '100%', maxWidth: width + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter }, style]}>
      {children}
    </View>
  );
}

export function Stack({ gap = 4, row, wrap, align, justify, style, children, ...rest }) {
  return (
    <View
      {...rest}
      style={[{ flexDirection: row ? 'row' : 'column', gap: SPACE[gap] ?? gap, flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: align, justifyContent: justify }, style]}
    >
      {children}
    </View>
  );
}

export function Section({ id, eyebrow, title, subtitle, alt, children, action, style }) {
  const { colors } = useTheme();
  const { bp } = useBreakpoint();
  const pad = bp === 'sm' ? SPACE[11] : bp === 'md' ? SPACE[12] : SPACE[13];
  return (
    <View nativeID={id} style={[{ backgroundColor: alt ? colors.pageAlt : colors.page, paddingVertical: pad }, style]}>
      <Container>
        {(eyebrow || title) && (
          <Reveal>
            <View style={{ marginBottom: bp === 'sm' ? SPACE[8] : SPACE[10], flexDirection: bp === 'sm' ? 'column' : 'row', alignItems: bp === 'sm' ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: SPACE[5] }}>
              <View style={{ flexShrink: 1, maxWidth: 760 }}>
                {eyebrow ? <T variant="eyebrow" color="accent" style={{ marginBottom: SPACE[2] }}>{eyebrow}</T> : null}
                {title ? <T variant="title" accessibilityRole="header" aria-level={2}>{title}</T> : null}
                {subtitle ? <T variant="lead" color="secondary" style={{ marginTop: SPACE[4] }}>{subtitle}</T> : null}
              </View>
              {action}
            </View>
          </Reveal>
        )}
        {children}
      </Container>
    </View>
  );
}

export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

// ── Scroll reveal ────────────────────────────────────────────────────────────────────
// Fades content up as it enters the viewport. Instant when the user prefers reduced motion.
export function Reveal({ children, delay = 0, y = 24, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(!isWeb);

  useEffect(() => {
    if (!isWeb) return undefined;
    const el = ref.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce || !('IntersectionObserver' in window)) { setShown(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <View
      ref={ref}
      style={[
        { opacity: shown ? 1 : 0, transform: [{ translateY: shown ? 0 : y }] },
        webOnly({ transitionProperty: 'opacity, transform', transitionDuration: '900ms', transitionTimingFunction: MOTION.ease, transitionDelay: `${delay}ms` }),
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────────────
// align: 'start' keeps the button content-sized in a column; use 'center' inside rows so it
// lines up with its neighbours instead of sticking to the top.
export function Button({ title, onPress, href, external, variant = 'primary', size = 'md', icon, iconRight, disabled, loading, style, accessibilityLabel, align = 'start' }) {
  const { colors } = useTheme();
  const link = useLinkProps(href, { external });
  const h = size === 'sm' ? 34 : size === 'lg' ? 52 : 44;
  const px = size === 'sm' ? 14 : size === 'lg' ? 26 : 20;
  const fs = size === 'sm' ? 14 : size === 'lg' ? 17 : 15;

  const V = {
    primary: { bg: colors.accent, bgHover: colors.accent, fg: colors.onAccent },
    secondary: { bg: colors.surfaceMuted, bgHover: colors.border, fg: colors.text },
    outline: { bg: 'transparent', bgHover: colors.surfaceMuted, fg: colors.text, border: colors.borderStrong },
    inverse: { bg: colors.inverse, bgHover: colors.inverse, fg: colors.onInverse },
    danger: { bg: colors.dangerSoft, bgHover: colors.dangerSoft, fg: colors.danger },
    link: { bg: 'transparent', bgHover: 'transparent', fg: colors.accentText },
  }[variant];
  const isLink = variant === 'link';

  return (
    <Pressable
      {...link}
      onPress={(e) => { if (disabled || loading) return; link.onPress?.(e); onPress?.(e); }}
      disabled={disabled || loading}
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={accessibilityLabel || title}
      style={({ hovered, pressed, focused }) => [
        {
          height: isLink ? undefined : h,
          paddingHorizontal: isLink ? 0 : px,
          borderRadius: RADIUS.pill,
          backgroundColor: hovered ? V.bgHover : V.bg,
          borderWidth: V.border ? 1 : 0,
          borderColor: V.border,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          opacity: disabled ? 0.4 : pressed ? 0.75 : hovered && !isLink && variant !== 'secondary' && variant !== 'outline' ? 0.88 : 1,
          transform: [{ scale: pressed && !isLink ? 0.97 : 1 }],
          alignSelf: align === 'center' ? 'center' : align === 'stretch' ? 'stretch' : 'flex-start',
        },
        webOnly({ transitionProperty: 'background-color, opacity, transform', transitionDuration: '180ms', cursor: disabled ? 'default' : 'pointer', outlineStyle: focused ? 'solid' : 'none', outlineWidth: 2, outlineColor: colors.accent, outlineOffset: 2 }),
        style,
      ]}
    >
      {({ hovered }) => (
        <>
          {icon ? <Feather name={loading ? 'loader' : icon} size={fs + 1} color={V.fg} /> : null}
          {title ? (
            <Text style={{ fontFamily: FONT, fontSize: isLink ? (size === 'sm' ? 13 : 17) : fs, fontWeight: isLink ? '400' : '500', letterSpacing: -0.2, color: V.fg, textDecorationLine: isLink && hovered ? 'underline' : 'none' }}>
              {loading && !icon ? 'Working…' : title}
            </Text>
          ) : null}
          {iconRight ? <Feather name={iconRight} size={isLink ? (size === 'sm' ? 12 : 16) : fs} color={V.fg} style={{ marginTop: 1 }} /> : null}
        </>
      )}
    </Pressable>
  );
}

// Round icon-only button (nav actions, close buttons).
export function IconButton({ icon, onPress, href, label, size = 36, style, color }) {
  const { colors } = useTheme();
  const link = useLinkProps(href);
  return (
    <Pressable
      {...link}
      onPress={(e) => { link.onPress?.(e); onPress?.(e); }}
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={label}
      style={({ hovered, pressed }) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? colors.surfaceMuted : 'transparent', opacity: pressed ? 0.6 : 1 },
        webOnly({ transitionProperty: 'background-color', transitionDuration: '150ms', cursor: 'pointer' }),
        style,
      ]}
    >
      <Feather name={icon} size={Math.round(size * 0.48)} color={color || colors.text} />
    </Pressable>
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────────────────────
export function Card({ children, style, href, onPress, padded = true, external }) {
  const { colors, scheme } = useTheme();
  const { bp } = useBreakpoint();
  const link = useLinkProps(href, { external });
  const interactive = !!(href || onPress);
  const base = {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.xl,
    borderWidth: scheme === 'dark' ? 1 : 0,
    borderColor: colors.border,
    padding: padded ? (bp === 'sm' ? SPACE[6] : SPACE[7]) : 0,
    overflow: 'hidden',
  };
  if (!interactive) return <View style={[base, webOnly({ boxShadow: scheme === 'light' ? '0 2px 12px rgba(0,0,0,0.04)' : 'none' }), style]}>{children}</View>;
  return (
    <Pressable
      {...link}
      onPress={(e) => { link.onPress?.(e); onPress?.(e); }}
      style={({ hovered, pressed }) => [
        base,
        { transform: [{ scale: pressed ? 0.985 : hovered ? 1.012 : 1 }] },
        webOnly({
          cursor: 'pointer',
          boxShadow: scheme === 'light' ? (hovered ? '0 12px 40px rgba(0,0,0,0.1)' : '0 2px 12px rgba(0,0,0,0.04)') : 'none',
          transitionProperty: 'transform, box-shadow',
          transitionDuration: '400ms',
          transitionTimingFunction: MOTION.ease,
        }),
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Tag({ children, tone = 'neutral', style, icon }) {
  const { colors } = useTheme();
  const tones = {
    neutral: [colors.surfaceMuted, colors.text2],
    accent: [colors.accentSoft, colors.accentText],
    success: [colors.successSoft, colors.success],
    danger: [colors.dangerSoft, colors.danger],
  };
  const [bg, fg] = tones[tone] || tones.neutral;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }, style]}>
      {icon ? <Feather name={icon} size={12} color={fg} /> : null}
      <Text style={{ fontFamily: FONT, fontSize: 12, lineHeight: 16, fontWeight: '500', color: fg }}>{children}</Text>
    </View>
  );
}

// Filter chips (project categories, credential issuers).
export function Chips({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ hovered }) => [
              { paddingHorizontal: 16, height: 36, justifyContent: 'center', borderRadius: RADIUS.pill, backgroundColor: active ? colors.inverse : hovered ? colors.border : colors.surfaceMuted },
              webOnly({ transitionProperty: 'background-color', transitionDuration: '180ms', cursor: 'pointer' }),
            ]}
          >
            <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '500', color: active ? colors.onInverse : colors.text }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Image with a soft placeholder while it loads (or if it has no source at all).
export function Media({ uri, ratio = 16 / 10, style, radius = 0, fallback, contain }) {
  const { colors } = useTheme();
  return (
    <View style={[{ width: '100%', aspectRatio: ratio, backgroundColor: colors.surfaceMuted, borderRadius: radius, overflow: 'hidden' }, style]}>
      {uri ? (
        <Image source={{ uri }} resizeMode={contain ? 'contain' : 'cover'} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      ) : fallback}
    </View>
  );
}

export function StatusDot({ color, size = 8, pulse }) {
  return (
    <View style={{ width: size, height: size }}>
      {pulse && isWeb ? (
        <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: size, backgroundColor: color }, { animationKeyframes: [{ '0%': { transform: [{ scale: 1 }], opacity: 0.6 }, '100%': { transform: [{ scale: 2.6 }], opacity: 0 } }], animationDuration: '2s', animationIterationCount: 'infinite' }]} />
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}
