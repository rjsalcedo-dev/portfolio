// src/components/SkillSheet.js
// "Show me the proof": every project, credential and role that demonstrates a skill.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useRouter } from '../lib/router';
import { evidenceCount, evidenceFor, skillEntry } from '../lib/evidence';
import { formatMonth } from '../lib/format';
import { BRAND_ICONS } from '../lib/skillIcons';
import { track } from '../lib/track';
import { Modal } from './Modal';
import { T } from './ui';
import { FONT, RADIUS } from '../theme/tokens';

const SkillContext = createContext({ openSkill: () => {} });
export const useSkillSheet = () => useContext(SkillContext);

export function SkillSheetProvider({ children }) {
  const [skill, setSkill] = useState(null);
  const openSkill = useCallback((name) => { setSkill(name); track('skill', { id: String(name).slice(0, 40) }); }, []);
  const value = useMemo(() => ({ openSkill }), [openSkill]);
  return (
    <SkillContext.Provider value={value}>
      {children}
      <SkillSheet skill={skill} onClose={() => setSkill(null)} />
    </SkillContext.Provider>
  );
}

function Row({ icon, image, title, sub, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: RADIUS.md, backgroundColor: hovered && onPress ? colors.surfaceMuted : 'transparent', cursor: onPress ? 'pointer' : 'default' })}>
      <View style={{ width: 56, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Feather name={icon} size={18} color={colors.text2} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors.text }}>{title}</Text>
        {sub ? <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 13, color: colors.text2 }}>{sub}</Text> : null}
      </View>
      {onPress ? <Feather name="chevron-right" size={16} color={colors.text3} /> : null}
    </Pressable>
  );
}

function SkillSheet({ skill, onClose }) {
  const { colors } = useTheme();
  const { content } = useContent();
  const { navigate } = useRouter();
  if (!skill) return null;
  const label = skillEntry(skill).label;
  const ev = evidenceFor(skill, content);
  const n = evidenceCount(ev);
  const parts = [
    ev.projects.length && `${ev.projects.length} project${ev.projects.length > 1 ? 's' : ''}`,
    ev.credentials.length && `${ev.credentials.length} credential${ev.credentials.length > 1 ? 's' : ''}`,
    ev.experience.length && `${ev.experience.length} role${ev.experience.length > 1 ? 's' : ''}`,
  ].filter(Boolean);
  const go = (href) => { onClose(); navigate(href); };

  const Group = ({ title, children }) => (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4, paddingHorizontal: 12 }}>{title}</Text>
      {children}
    </View>
  );

  return (
    <Modal visible onClose={onClose} title={label} width={520}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Feather name={n ? 'check-circle' : 'info'} size={16} color={n ? colors.success : colors.text3} />
        <T variant="small" color="secondary">{n ? `Used in ${parts.join(', ')}.` : 'Part of my toolkit. No public project shows it yet.'}</T>
      </View>
      {ev.projects.length ? (
        <Group title="Projects">
          {ev.projects.map((p) => <Row key={p.id} image={p.cover} icon="box" title={p.title} sub={p.role || p.tagline} onPress={() => go(`/projects/${p.slug}`)} />)}
        </Group>
      ) : null}
      {ev.credentials.length ? (
        <Group title="Credentials">
          {ev.credentials.map((c) => <Row key={c.id} image={c.image} icon="award" title={c.title} sub={[c.issuer, formatMonth(c.issued)].filter(Boolean).join(' · ')} onPress={() => go('/#credentials')} />)}
        </Group>
      ) : null}
      {ev.experience.length ? (
        <Group title="Experience">
          {ev.experience.map((x) => <Row key={x.id} icon="briefcase" title={x.role} sub={x.org} onPress={() => go('/#about')} />)}
        </Group>
      ) : null}
    </Modal>
  );
}

// ── Skill icons ──────────────────────────────────────────────────────────────────────
// Skill name → Simple Icons slug. Names are matched lower-cased.
const ALIASES = {
  'react native': 'react', reactjs: 'react', 'react.js': 'react', js: 'javascript', ts: 'typescript',
  gdscript: 'godotengine', godot: 'godotengine', html: 'html5', css: 'css3', firestore: 'firebase',
  'firebase auth': 'firebase', 'node.js': 'nodedotjs', node: 'nodedotjs', nodejs: 'nodedotjs', 'express.js': 'express',
  'vue.js': 'vuedotjs', vue: 'vuedotjs', 'next.js': 'nextdotjs', tailwind: 'tailwindcss', 'tailwind css': 'tailwindcss',
  postgres: 'postgresql', java: 'openjdk', 'c++': 'cplusplus', '.net': 'dotnet', 'c#': 'dotnet', golang: 'go',
  'google cloud': 'googlecloud', gcp: 'googlecloud', 'github actions': 'githubactions', 'ci/cd': 'githubactions',
  ccna: 'cisco', 'cisco packet tracer': 'cisco', 'redux toolkit': 'redux', 'expo router': 'expo',
};
// Skills with no brand mark get a matching Feather glyph instead.
const GLYPHS = [
  [/vs ?code|visual studio|editor|\bide\b/, 'code'], [/rest|api/, 'share-2'], [/sql|database|data/, 'database'],
  [/cloud|aws|azure|serverless/, 'cloud'], [/secur|cyber/, 'shield'], [/network|\blan\b|\bwan\b|tcp/, 'wifi'],
  [/\bui\b|\bux\b|design|figma/, 'pen-tool'], [/test|qa/, 'check-square'], [/mobile|ios|pwa/, 'smartphone'],
  [/\bai\b|llm|machine|\bml\b/, 'cpu'], [/game/, 'play'], [/linux|bash|shell|terminal/, 'terminal'],
  [/support|hardware|troubleshoot/, 'tool'], [/agile|scrum|kanban/, 'trello'],
];

const luminance = (hex) => {
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

export function skillIcon(name) {
  const n = String(name || '').toLowerCase().trim();
  const slug = ALIASES[n] || n.replace(/\s+/g, '').replace(/\./g, 'dot');
  if (BRAND_ICONS[slug]) return { brand: BRAND_ICONS[slug] };
  const glyph = GLYPHS.find(([re]) => re.test(n));
  return { glyph: glyph ? glyph[1] : 'code' };
}

// The skill's brand mark in its own color, switched to the text color when the brand color
// would vanish on the current background (black marks in dark mode, white in light).
export function SkillIcon({ name, size = 16, mono }) {
  const { colors, scheme } = useTheme();
  const icon = skillIcon(name);
  if (icon.glyph || Platform.OS !== 'web') return <Feather name={icon.glyph || 'code'} size={size - 1} color={colors.text2} />;
  const [hex, path] = icon.brand;
  const l = luminance(hex);
  const fill = mono || (scheme === 'dark' ? l < 0.06 : l > 0.8) ? colors.text : `#${hex}`;
  return React.createElement('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': true, style: { flexShrink: 0, display: 'block' } },
    React.createElement('path', { d: path, fill }));
}

// A skill chip that opens its proof. Shows how many pieces of evidence back it up.
export function SkillChip({ name, size = 'md', showCount = true, icon = size !== 'sm' }) {
  const { colors } = useTheme();
  const { content } = useContent();
  const { openSkill } = useSkillSheet();
  const n = useMemo(() => evidenceCount(evidenceFor(name, content)), [name, content]);
  const sm = size === 'sm';
  return (
    <Pressable
      onPress={() => openSkill(name)}
      accessibilityRole="button"
      accessibilityLabel={`${name}${n ? `, used in ${n} places` : ''}. Show proof`}
      style={({ hovered }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingLeft: icon ? (sm ? 8 : 10) : sm ? 10 : 12, paddingRight: n && showCount ? (sm ? 5 : 6) : sm ? 10 : 12,
        height: sm ? 26 : 32, borderRadius: 999, borderWidth: 1,
        borderColor: hovered ? colors.accent : colors.border,
        backgroundColor: hovered ? colors.accentSoft : sm ? colors.surfaceMuted : colors.surface,
        cursor: 'pointer', transitionProperty: 'border-color, background-color', transitionDuration: '150ms',
      })}
    >
      {icon ? <SkillIcon name={name} size={sm ? 13 : 16} /> : null}
      <Text style={{ fontFamily: FONT, fontSize: sm ? 12 : 14, fontWeight: sm ? '500' : '400', color: sm ? colors.text2 : colors.text }}>{name}</Text>
      {n && showCount ? (
        <View style={{ minWidth: sm ? 16 : 20, height: sm ? 16 : 20, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
          <Text style={{ fontFamily: FONT, fontSize: sm ? 10 : 11, fontWeight: '700', color: colors.accentText }}>{n}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
