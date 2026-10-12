// src/components/Cards.js
import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { Card, Icon, Media, T, Tag } from './ui';
import { FONT, RADIUS, SPACE } from '../theme/tokens';
import { formatMonth } from '../lib/format';

// Curated gradients for projects without a cover image, picked from the title so each
// project keeps the same one.
const GRADIENTS = [
  ['#0f2027', '#203a43', '#2c5364'],
  ['#1d1d1f', '#3a3a3c', '#636366'],
  ['#0a3d62', '#0071e3', '#5ac8fa'],
  ['#134e5e', '#2a7d5f', '#71b280'],
  ['#2d1b4e', '#5e35b1', '#bf5af2'],
  ['#3e1f0d', '#a0522d', '#ff9f0a'],
];
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function ProjectCover({ project, ratio = 16 / 10, large }) {
  if (project.cover) return <Media uri={project.cover} ratio={ratio} />;
  const g = GRADIENTS[hash(project.title) % GRADIENTS.length];
  return (
    <View style={{ width: '100%', aspectRatio: ratio, overflow: 'hidden' }}>
      <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {/* A big soft monogram instead of repeating the title the card already shows. */}
      <Text aria-hidden numberOfLines={1} style={{ position: 'absolute', right: large ? -10 : -6, bottom: large ? -48 : -34, fontFamily: FONT, color: 'rgba(255,255,255,0.14)', fontSize: large ? 260 : 180, lineHeight: large ? 260 : 180, fontWeight: '700', letterSpacing: -8 }}>
        {project.title.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)}
      </Text>
      <View style={{ flex: 1, padding: large ? 32 : 24, justifyContent: 'flex-end' }}>
        {project.stack?.length ? (
          <Text numberOfLines={1} style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500', letterSpacing: 0.2 }}>{project.stack.slice(0, 4).join('  ·  ')}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function ProjectCard({ project, large }) {
  const { colors } = useTheme();
  return (
    <Card href={`/projects/${project.slug}`} padded={false} style={{ flex: 1 }}>
      <ProjectCover project={project} ratio={large ? 16 / 9 : 16 / 10} large={large} />
      <View style={{ padding: large ? SPACE[7] : SPACE[6], gap: SPACE[2], flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T variant="caption" color="secondary">{[project.category, project.year].filter(Boolean).join(' · ')}</T>
          {project.status === 'Live' ? <Tag tone="success">Live</Tag> : null}
        </View>
        <T variant={large ? 'h2' : 'h3'}>{project.title}</T>
        <T variant="body" color="secondary" numberOfLines={3}>{project.tagline || project.summary}</T>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACE[3] }}>
          <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.accentText }}>Case study</Text>
          <Feather name="chevron-right" size={15} color={colors.accentText} />
        </View>
      </View>
    </Card>
  );
}

export function CredentialCard({ item, onPress }) {
  const { colors } = useTheme();
  const isCert = item.kind === 'certificate';
  const verified = !!item.verifyUrl;
  return (
    <Card onPress={onPress} padded={false} style={{ flex: 1 }}>
      {isCert && item.image ? (
        // Certificates: a landscape preview of the document itself.
        <View style={{ padding: SPACE[3], paddingBottom: 0 }}>
          <View style={{ borderRadius: RADIUS.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' }}>
            <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: '100%', aspectRatio: 1.414 }} accessibilityLabel={item.title + " certificate"} />
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingTop: SPACE[7] }}>
          <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
            {item.image ? (
              <Image source={{ uri: item.image }} resizeMode="contain" style={{ width: 104, height: 104 }} accessibilityLabel={item.title + " badge"} />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={isCert ? 'file-text' : 'award'} size={34} color="accent" />
              </View>
            )}
          </View>
        </View>
      )}
      <View style={{ alignItems: 'center', paddingTop: SPACE[4], paddingHorizontal: SPACE[5], paddingBottom: SPACE[5], gap: SPACE[2], flex: 1 }}>
        <T variant="small" weight="600" align="center" numberOfLines={3} style={{ color: colors.text }}>{item.title}</T>
        <T variant="caption" color="secondary" align="center">{[item.issuer, formatMonth(item.issued)].filter(Boolean).join(' · ')}</T>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACE[1] }}>
          <Text style={{ fontFamily: FONT, fontSize: 11, fontWeight: '600', letterSpacing: 0.3, color: colors.text3, textTransform: 'uppercase' }}>{isCert ? 'Certificate' : 'Badge'}</Text>
          {verified ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="check-circle" size={12} color={colors.success} />
              <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '500', color: colors.success }}>Verified</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

// Lays children out in an even grid. Uses CSS calc on web so gaps stay exact.
export function Grid({ columns, gap = 20, children, style }) {
  const items = React.Children.toArray(children);
  const w = `calc((100% - ${gap * (columns - 1)}px) / ${columns})`;
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>
      {items.map((child, i) => (
        <View key={child.key ?? i} style={{ width: columns === 1 ? '100%' : w, flexDirection: 'column' }}>{child}</View>
      ))}
    </View>
  );
}

export function ProgressBar({ value, height = 6 }) {
  const { colors } = useTheme();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.border, overflow: 'hidden' }} accessibilityRole="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <View style={{ width: `${Math.round(value * 100)}%`, height: '100%', borderRadius: height, backgroundColor: colors.accent }} />
    </View>
  );
}

export const radius = RADIUS;
