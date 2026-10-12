// src/components/CommandPalette.js
// ⌘K / Ctrl+K (or "/") opens a Spotlight-style palette that searches every section,
// project, credential and résumé version, plus quick actions like switching theme.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useRouter } from '../lib/router';
import { FONT, RADIUS, SPACE } from '../theme/tokens';
import { downloadVCard } from '../lib/share';
import { track } from '../lib/track';

const PaletteContext = createContext({ open: () => {} });
export const usePalette = () => useContext(PaletteContext);

const isWeb = Platform.OS === 'web';
const isMac = isWeb && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const SHORTCUT_LABEL = isMac ? '⌘K' : 'Ctrl K';

export function PaletteProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!isWeb) return undefined;
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setVisible((v) => !v); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setVisible(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ open }), [open]);
  return (
    <PaletteContext.Provider value={value}>
      {children}
      {visible ? <Palette onClose={close} /> : null}
    </PaletteContext.Provider>
  );
}

function useCommands() {
  const { content } = useContent();
  const { navigate } = useRouter();
  const { preference, setPreference } = useTheme();
  return useMemo(() => {
    const go = (to) => () => navigate(to);
    const ext = (url) => () => window.open(url, '_blank', 'noopener');
    const list = [
      { group: 'Sections', icon: 'home', label: 'Home', run: go('/') },
      { group: 'Sections', icon: 'grid', label: 'Work', hint: 'Projects', run: go('/#work') },
      { group: 'Sections', icon: 'award', label: 'Credentials', hint: 'Certificates & badges', run: go('/#credentials') },
      { group: 'Sections', icon: 'user', label: 'About', run: go('/#about') },
      { group: 'Sections', icon: 'mail', label: 'Contact', run: go('/#contact') },
      { group: 'Sections', icon: 'zap', label: '30-second brief', hint: 'For recruiters', keywords: 'summary recruiter', run: go('/brief') },
      ...(content.settings.showRoleFit ? [{ group: 'Sections', icon: 'target', label: 'Check role fit', hint: 'Paste a job description', keywords: 'job hiring match', run: go('/#fit') }] : []),
      ...content.resumes.map((r, i) => ({ group: 'Résumé', icon: 'file-text', label: `Résumé${content.resumes.length > 1 ? ` · ${r.name}` : ''}`, hint: r.headline, run: go(i === 0 ? '/resume' : `/resume/${r.slug || r.id}`) })),
      ...content.projects.map((p) => ({ group: 'Projects', icon: 'box', label: p.title, hint: p.tagline, keywords: (p.stack || []).join(' '), run: go(`/projects/${p.slug}`) })),
      ...content.credentials.filter((c) => !c.hidden).map((c) => ({ group: 'Credentials', icon: 'check-circle', label: c.title, hint: c.issuer, keywords: (c.skills || []).join(' '), run: c.verifyUrl ? ext(c.verifyUrl) : c.file ? ext(c.file) : go('/#credentials') })),
      ...content.profile.socials.map((s) => ({ group: 'Links', icon: s.icon || 'link', label: s.label, hint: s.url.replace(/^https?:\/\//, ''), run: ext(s.url) })),
      { group: 'Actions', icon: 'sun', label: 'Appearance: Light', hint: preference === 'light' ? 'Current' : '', run: () => setPreference('light') },
      { group: 'Actions', icon: 'moon', label: 'Appearance: Dark', hint: preference === 'dark' ? 'Current' : '', run: () => setPreference('dark') },
      { group: 'Actions', icon: 'monitor', label: 'Appearance: Match system', hint: preference === 'system' ? 'Current' : '', run: () => setPreference('system') },
      { group: 'Actions', icon: 'link-2', label: 'Copy link to this page', run: () => navigator.clipboard?.writeText(window.location.href) },
      { group: 'Actions', icon: 'user-plus', label: 'Save contact card', hint: 'vCard', keywords: 'vcf phone', run: () => { downloadVCard(content.profile); track('vcard'); } },
    ];
    return list;
  }, [content, navigate, preference, setPreference]);
}

// Lowercase without accents, so "resume" finds "Résumé".
const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Palette({ onClose }) {
  const { colors, scheme } = useTheme();
  const { isSm } = useBreakpoint();
  const commands = useCommands();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return commands.filter((c) => c.group !== 'Credentials' && c.group !== 'Links').slice(0, 14);
    return commands.filter((c) => {
      const hay = fold(`${c.label} ${c.hint || ''} ${c.keywords || ''} ${c.group}`);
      return words.every((w) => hay.includes(w));
    }).slice(0, 30);
  }, [q, commands]);

  useEffect(() => setActive(0), [q]);

  const run = useCallback((cmd) => { onClose(); setTimeout(() => cmd?.run(), 0); }, [onClose]);

  useEffect(() => {
    if (!isWeb) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
    };
    // Capture phase: the search input would otherwise swallow Enter and the arrow keys.
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); document.body.style.overflow = prev; };
  }, [results, active, run, onClose]);

  let lastGroup = null;
  return (
    <View style={{ position: isWeb ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', paddingTop: isSm ? 12 : '14vh', paddingHorizontal: isSm ? 12 : 20 }}>
      <Pressable accessibilityLabel="Close search" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, backdropFilter: 'blur(6px)' }} />
      <View
        accessibilityRole="dialog"
        aria-modal
        aria-label="Search"
        style={{ width: '100%', maxWidth: 640, maxHeight: isSm ? '80vh' : '62vh', backgroundColor: scheme === 'dark' ? 'rgba(30,30,32,0.92)' : 'rgba(255,255,255,0.92)', backdropFilter: 'saturate(180%) blur(24px)', borderRadius: RADIUS.lg + 2, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, height: 60, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Feather name="search" size={20} color={colors.text2} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Search projects, credentials, pages…"
            placeholderTextColor={colors.text3}
            aria-activedescendant={`cmd-${active}`}
            style={{ flex: 1, fontFamily: FONT, fontSize: 19, letterSpacing: -0.3, color: colors.text, outlineStyle: 'none', height: '100%' }}
          />
          <Pressable onPress={onClose} accessibilityLabel="Close" style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.surfaceMuted }}>
            <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text2 }}>esc</Text>
          </Pressable>
        </View>
        <ScrollView ref={listRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 8 }}>
          {results.length === 0 ? (
            <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.text2, textAlign: 'center', paddingVertical: 32 }}>No results for “{q}”</Text>
          ) : results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            const on = i === active;
            return (
              <View key={`${c.group}-${c.label}-${i}`}>
                {header ? <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.text3, paddingHorizontal: 12, paddingTop: i ? 14 : 6, paddingBottom: 6 }}>{header}</Text> : null}
                <Pressable
                  nativeID={`cmd-${i}`}
                  onPress={() => run(c)}
                  onHoverIn={() => setActive(i)}
                  ref={(el) => { if (on && el?.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, height: 46, borderRadius: 10, backgroundColor: on ? colors.accent : 'transparent', cursor: 'pointer' }}
                >
                  <Feather name={c.icon} size={17} color={on ? '#fff' : colors.text2} />
                  <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 15, fontWeight: '500', color: on ? '#fff' : colors.text, flexShrink: 0, maxWidth: '60%' }}>{c.label}</Text>
                  {c.hint ? <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 14, color: on ? 'rgba(255,255,255,0.75)' : colors.text3, flex: 1 }}>{c.hint}</Text> : <View style={{ flex: 1 }} />}
                  {on ? <Feather name="corner-down-left" size={14} color="rgba(255,255,255,0.8)" /> : null}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
        {!isSm ? (
          <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
            {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([k, l]) => (
              <Text key={l} style={{ fontFamily: FONT, fontSize: 12, color: colors.text3 }}><Text style={{ color: colors.text2, fontWeight: '600' }}>{k}</Text>  {l}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
