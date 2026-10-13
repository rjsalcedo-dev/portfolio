// src/components/Intro.js
// A short, Apple-style welcome on the first home-page visit of a session: the monogram
// settles in, the name comes into focus, then the curtain lifts to the site (~1.7 s).
// Tap, click, scroll or any key skips it. Never shown with "reduce motion", to bots, on deep
// links or to the signed-in owner.
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { getToken } from '../lib/api';
import { FONT } from '../theme/tokens';

const isWeb = Platform.OS === 'web';
const KEY = 'rj.intro.seen';
const EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
const LIFT_AT = 1350;
const DONE_AT = 1950;

function shouldShow(enabled) {
  if (!isWeb || !enabled) return false;
  try {
    if (sessionStorage.getItem(KEY)) return false;
    if (window.location.pathname !== '/' || window.location.hash || /[?&]preview=1/.test(window.location.search)) return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (/bot|crawl|spider|headless|lighthouse|preview/i.test(navigator.userAgent)) return false;
    if (getToken()) return false;
    return true;
  } catch { return false; }
}

export default function Intro() {
  const { content } = useContent();
  const [show] = useState(() => shouldShow(content.settings.showIntro !== false));
  if (!show) return null;
  return <IntroInner />;
}

function IntroInner() {
  const { colors } = useTheme();
  const { content } = useContent();
  const { profile } = content;
  const [phase, setPhase] = useState('in'); // in → lift → done

  useEffect(() => {
    try { sessionStorage.setItem(KEY, '1'); } catch {}
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const lift = setTimeout(() => setPhase('lift'), LIFT_AT);
    const done = setTimeout(() => setPhase('done'), DONE_AT);
    const skip = () => { setPhase('lift'); setTimeout(() => setPhase('done'), 450); };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('touchmove', skip, { once: true, passive: true });
    return () => {
      clearTimeout(lift);
      clearTimeout(done);
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
    };
  }, []);

  useEffect(() => { if (phase === 'done') document.body.style.overflow = ''; }, [phase]);
  if (phase === 'done') return null;

  const lifting = phase === 'lift';
  const anim = (frames, delay, duration) => ({
    animationKeyframes: [frames],
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationTimingFunction: EASE,
    animationFillMode: 'both',
  });

  return (
    <Pressable
      aria-hidden
      accessibilityLabel="Skip intro"
      onPress={() => setPhase('lift')}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
        backgroundColor: colors.page, alignItems: 'center', justifyContent: 'center', cursor: 'default',
        opacity: lifting ? 0 : 1,
        transform: [{ translateY: lifting ? -24 : 0 }],
        transitionProperty: 'opacity, transform', transitionDuration: '550ms', transitionTimingFunction: EASE,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 64, height: 64, borderRadius: 16, backgroundColor: colors.inverse, alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
            ...anim({ from: { opacity: 0, transform: [{ scale: 0.82 }] }, to: { opacity: 1, transform: [{ scale: 1 }] } }, 0, 650),
          }}
        >
          <Text style={{ fontFamily: FONT, fontSize: 24, fontWeight: '700', letterSpacing: -0.8, color: colors.onInverse }}>{profile.initials || 'RJ'}</Text>
        </View>
        <Text
          style={{
            fontFamily: FONT, fontSize: 34, fontWeight: '600', color: colors.text, marginTop: 22,
            ...anim({ from: { opacity: 0, filter: 'blur(10px)', letterSpacing: 6 }, to: { opacity: 1, filter: 'blur(0px)', letterSpacing: -0.8 } }, 250, 800),
          }}
        >
          {profile.name}
        </Text>
        <Text
          style={{
            fontFamily: FONT, fontSize: 15, color: colors.text2, marginTop: 8,
            ...anim({ from: { opacity: 0, transform: [{ translateY: 6 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } }, 650, 600),
          }}
        >
          {profile.role}
        </Text>
        {/* A hairline that draws across while the site loads behind. */}
        <View style={{ width: 120, height: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 28, overflow: 'hidden' }}>
          <View style={{ height: 2, backgroundColor: colors.accent, ...anim({ from: { width: '0%' }, to: { width: '100%' } }, 300, LIFT_AT - 300) }} />
        </View>
      </View>
    </Pressable>
  );
}
