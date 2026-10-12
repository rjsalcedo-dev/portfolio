// src/components/Nav.js
// Apple-style global nav: a 52pt translucent bar that stays put while the page scrolls.
// Phones get a full-screen menu instead of inline links.
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useLinkProps, useRouter } from '../lib/router';
import { usePalette, SHORTCUT_LABEL } from './CommandPalette';
import { Container, IconButton } from './ui';
import { FONT, MOTION, NAV_HEIGHT } from '../theme/tokens';

const isWeb = Platform.OS === 'web';

export const NAV_LINKS = [
  { label: 'Work', href: '/#work' },
  { label: 'Credentials', href: '/#credentials' },
  { label: 'About', href: '/#about' },
  { label: 'Résumé', href: '/resume' },
  { label: 'Contact', href: '/#contact' },
];

function NavLink({ label, href, onNavigate, large }) {
  const { colors } = useTheme();
  const { pathname } = useRouter();
  const link = useLinkProps(href);
  const active = href === pathname;
  return (
    <Pressable
      {...link}
      onPress={(e) => { link.onPress(e); onNavigate?.(); }}
      style={({ hovered }) => ({ paddingHorizontal: large ? 0 : 10, paddingVertical: large ? 10 : 6, opacity: hovered ? 1 : active ? 1 : large ? 1 : 0.8, cursor: 'pointer' })}
    >
      <Text style={{ fontFamily: FONT, fontSize: large ? 28 : 13, fontWeight: large ? '600' : '400', letterSpacing: large ? -0.6 : 0, color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

const THEME_CYCLE = { system: 'light', light: 'dark', dark: 'system' };
const THEME_ICON = { system: 'monitor', light: 'sun', dark: 'moon' };

export default function Nav() {
  const { colors, preference, setPreference } = useTheme();
  const { isSm } = useBreakpoint();
  const { content } = useContent();
  const { open } = usePalette();
  const home = useLinkProps('/');
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isWeb) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isWeb) return undefined;
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  useEffect(() => { if (!isSm) setMenu(false); }, [isSm]);

  return (
    <>
      <View
        dataSet={{ noprint: true }}
        style={{
          position: isWeb ? 'sticky' : 'relative', top: 0, zIndex: 50, height: NAV_HEIGHT,
          backgroundColor: menu ? colors.page : colors.glass,
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottomWidth: 1, borderBottomColor: scrolled && !menu ? colors.border : 'transparent',
          transitionProperty: 'border-color, background-color', transitionDuration: '300ms',
        }}
      >
        <Container style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable {...home} onPress={(e) => { home.onPress(e); setMenu(false); }} accessibilityLabel="Home" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: colors.inverse, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONT, fontSize: 11, fontWeight: '700', letterSpacing: -0.4, color: colors.onInverse }}>{content.profile.initials || 'RJ'}</Text>
            </View>
            <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '600', letterSpacing: -0.3, color: colors.text }}>{content.profile.name}</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: isSm ? 0 : 6 }}>
            {!isSm && NAV_LINKS.map((l) => <NavLink key={l.href} {...l} />)}
            {isSm ? (
              <IconButton icon="search" label="Search" onPress={open} size={40} />
            ) : (
              <Pressable
                onPress={open}
                accessibilityLabel={`Search (${SHORTCUT_LABEL})`}
                style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 30, paddingLeft: 10, paddingRight: 6, marginLeft: 8, borderRadius: 8, backgroundColor: hovered ? colors.border : colors.surfaceMuted, cursor: 'pointer', transitionProperty: 'background-color', transitionDuration: '150ms' })}
              >
                <Feather name="search" size={13} color={colors.text2} />
                <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text2 }}>Search</Text>
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.text3 }}>{SHORTCUT_LABEL}</Text>
                </View>
              </Pressable>
            )}
            <IconButton icon={THEME_ICON[preference]} label={`Appearance: ${preference}. Change`} onPress={() => setPreference(THEME_CYCLE[preference])} size={isSm ? 40 : 34} />
            {isSm ? <IconButton icon={menu ? 'x' : 'menu'} label={menu ? 'Close menu' : 'Open menu'} onPress={() => setMenu((m) => !m)} size={40} /> : null}
          </View>
        </Container>
      </View>

      {isSm && menu ? (
        <View dataSet={{ noprint: true }} style={{ position: isWeb ? 'fixed' : 'absolute', top: NAV_HEIGHT, left: 0, right: 0, bottom: 0, zIndex: 49, backgroundColor: colors.page, animationKeyframes: [{ from: { opacity: 0, transform: [{ translateY: -8 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } }], animationDuration: `${MOTION.base}ms`, animationTimingFunction: MOTION.ease }}>
          <Container style={{ paddingTop: 16 }}>
            {NAV_LINKS.map((l) => <NavLink key={l.href} {...l} large onNavigate={() => setMenu(false)} />)}
          </Container>
        </View>
      ) : null}
    </>
  );
}
