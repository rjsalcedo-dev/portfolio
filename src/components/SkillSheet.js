// src/components/SkillSheet.js
// "Show me the proof": every project, credential and role that demonstrates a skill.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { useRouter } from '../lib/router';
import { evidenceCount, evidenceFor, skillEntry } from '../lib/evidence';
import { formatMonth } from '../lib/format';
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

// A skill chip that opens its proof. Shows how many pieces of evidence back it up.
export function SkillChip({ name, size = 'md', showCount = true }) {
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
        paddingLeft: sm ? 10 : 12, paddingRight: n && showCount ? (sm ? 5 : 6) : sm ? 10 : 12,
        height: sm ? 26 : 32, borderRadius: 999, borderWidth: 1,
        borderColor: hovered ? colors.accent : colors.border,
        backgroundColor: hovered ? colors.accentSoft : sm ? colors.surfaceMuted : colors.surface,
        cursor: 'pointer', transitionProperty: 'border-color, background-color', transitionDuration: '150ms',
      })}
    >
      <Text style={{ fontFamily: FONT, fontSize: sm ? 12 : 14, fontWeight: sm ? '500' : '400', color: sm ? colors.text2 : colors.text }}>{name}</Text>
      {n && showCount ? (
        <View style={{ minWidth: sm ? 16 : 20, height: sm ? 16 : 20, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
          <Text style={{ fontFamily: FONT, fontSize: sm ? 10 : 11, fontWeight: '700', color: colors.accentText }}>{n}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
