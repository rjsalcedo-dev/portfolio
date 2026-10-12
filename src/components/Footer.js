// src/components/Footer.js
import React from 'react';
import { View } from 'react-native';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { useContent } from '../context/ContentContext';
import { Button, Container, Divider, T } from './ui';
import { SHORTCUT_LABEL } from './CommandPalette';
import { formatMonth } from '../lib/format';

export default function Footer() {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const { content } = useContent();
  const { profile, updatedAt } = content;
  return (
    <View dataSet={{ noprint: true }} style={{ backgroundColor: colors.pageAlt, paddingVertical: 28 }}>
      <Container>
        <Divider style={{ marginBottom: 20 }} />
        <View style={{ flexDirection: isSm ? 'column' : 'row', justifyContent: 'space-between', gap: 12 }}>
          <T variant="caption" color="secondary">
            © {new Date().getFullYear()} {profile.name}. {profile.location}.
            {updatedAt ? `  Updated ${formatMonth(updatedAt.slice(0, 7))}.` : ''}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            {!isSm ? <T variant="caption" color="tertiary">Press {SHORTCUT_LABEL} to search</T> : null}
            {profile.socials.map((s) => (
              <Button key={s.url} variant="link" title={s.label} href={s.url} size="sm" />
            ))}
          </View>
        </View>
      </Container>
    </View>
  );
}
