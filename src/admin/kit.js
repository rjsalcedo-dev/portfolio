// src/admin/kit.js
// Building blocks shared by every admin panel, so headers, toolbars, tool cards and empty
// states look and align the same everywhere.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { Button, Card, T } from '../components/ui';
import { FONT } from '../theme/tokens';

// Panel title row: title + subtitle on the left, actions on the right, centered on one line.
export function PanelHeader({ title, subtitle, action }) {
  const { isSm } = useBreakpoint();
  return (
    <View style={{ flexDirection: isSm ? 'column' : 'row', alignItems: isSm ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isSm ? 14 : 16, marginBottom: 24 }}>
      <View style={{ flexShrink: 1 }}>
        <T variant="h2">{title}</T>
        {subtitle ? <T variant="small" color="secondary" style={{ marginTop: 4 }}>{subtitle}</T> : null}
      </View>
      {action ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{action}</View> : null}
    </View>
  );
}

// 34pt round icon button: the same height as the small pill buttons it sits beside.
export function ToolbarButton({ icon, label, onPress, danger, disabled }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered, pressed }) => ({
        width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
        backgroundColor: hovered && !disabled ? (danger ? colors.dangerSoft : colors.border) : colors.surfaceMuted,
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1, cursor: disabled ? 'default' : 'pointer',
        transitionProperty: 'background-color', transitionDuration: '150ms',
      })}
    >
      <Feather name={icon} size={15} color={danger ? colors.danger : colors.text} />
    </Pressable>
  );
}

// Card for a one-off tool (Cisco quick add, Credly import, testimonial requests):
// icon tile, title, one-line description and an optional action, then the body.
export function ToolCard({ icon, tint, title, description, action, children, style }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  return (
    <Card style={[{ marginBottom: 16 }, style]}>
      <View style={{ flexDirection: isSm ? 'column' : 'row', alignItems: isSm ? 'flex-start' : 'center', gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: tint || colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={icon} size={18} color={tint ? '#fff' : colors.accentText} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T variant="body" weight="600">{title}</T>
            {description ? <T variant="small" color="secondary" style={{ marginTop: 2 }}>{description}</T> : null}
          </View>
        </View>
        {action}
      </View>
      {children ? <View style={{ marginTop: 18 }}>{children}</View> : null}
    </Card>
  );
}

// Friendly empty state with a clear next step.
export function EmptyState({ icon, title, description, actionTitle, onAction }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16, gap: 10 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icon} size={24} color={colors.text3} />
        </View>
        <T variant="h3" align="center">{title}</T>
        {description ? <T variant="small" color="secondary" align="center" style={{ maxWidth: 420 }}>{description}</T> : null}
        {actionTitle ? <Button title={actionTitle} icon="plus" size="sm" onPress={onAction} align="center" style={{ marginTop: 6 }} /> : null}
      </View>
    </Card>
  );
}

// Heading for a group of fields inside a form.
export function SectionTitle({ title, description, first }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingTop: first ? 0 : 22, marginTop: first ? 0 : 6, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border, marginBottom: 2 }}>
      <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.text3 }}>{title}</Text>
      {description ? <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text2, marginTop: 4 }}>{description}</Text> : null}
    </View>
  );
}

// Splits a field list on { section } markers.
export function splitSections(fields) {
  const groups = [];
  let cur = { title: null, description: null, fields: [] };
  for (const f of fields) {
    if (f.section) {
      if (cur.fields.length || cur.title) groups.push(cur);
      cur = { title: f.section, description: f.description, fields: [] };
    } else cur.fields.push(f);
  }
  if (cur.fields.length || cur.title) groups.push(cur);
  return groups;
}
