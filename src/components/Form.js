// src/components/Form.js
// Form controls shared by the contact form and the admin.
import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { FONT, RADIUS } from '../theme/tokens';

const isWeb = Platform.OS === 'web';

export function FieldLabel({ label, hint, right }) {
  const { colors } = useTheme();
  if (!label) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
      <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: '600', color: colors.text }}>
        {label}
        {hint ? <Text style={{ fontWeight: '400', color: colors.text3 }}>{`  ${hint}`}</Text> : null}
      </Text>
      {right}
    </View>
  );
}

export function Field({ label, hint, value, onChange, multiline, rows = 4, placeholder, mono, style, inputStyle, error, ...rest }) {
  const { colors } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={style}>
      <FieldLabel label={label} hint={hint} />
      <TextInput
        {...rest}
        value={value ?? ''}
        onChangeText={onChange}
        multiline={multiline}
        numberOfLines={multiline ? rows : undefined}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[
          {
            fontFamily: mono ? 'ui-monospace, Menlo, monospace' : FONT,
            fontSize: 16, lineHeight: 22, color: colors.text,
            backgroundColor: colors.surfaceMuted,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: error ? colors.danger : focus ? colors.accent : 'transparent',
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 0,
            height: multiline ? undefined : 46,
            minHeight: multiline ? rows * 22 + 24 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          isWeb && { outlineStyle: 'none', boxShadow: focus ? `0 0 0 4px ${colors.accentSoft}` : 'none', transitionProperty: 'border-color, box-shadow', transitionDuration: '150ms', resize: multiline ? 'vertical' : undefined },
          inputStyle,
        ]}
      />
      {error ? <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.danger, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}

export function Toggle({ label, hint, value, onChange }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: !!value }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 6, cursor: 'pointer' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.text }}>{label}</Text>
        {hint ? <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text2, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      <View style={{ width: 51, height: 31, borderRadius: 16, padding: 2, backgroundColor: value ? colors.success : colors.borderStrong, transitionProperty: 'background-color', transitionDuration: '200ms' }}>
        <View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: '#fff', transform: [{ translateX: value ? 20 : 0 }], boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transitionProperty: 'transform', transitionDuration: '200ms' }} />
      </View>
    </Pressable>
  );
}

// iOS-style segmented control.
export function Segmented({ options, value, onChange, label }) {
  const { colors, scheme } = useTheme();
  return (
    <View>
      <FieldLabel label={label} />
      <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 2, alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          const on = v === value;
          return (
            <Pressable key={v} onPress={() => onChange(v)} style={{ paddingHorizontal: 14, height: 32, justifyContent: 'center', borderRadius: 8, backgroundColor: on ? (scheme === 'dark' ? '#636366' : '#fff') : 'transparent', boxShadow: on ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', cursor: 'pointer' }}>
              <Text style={{ fontFamily: FONT, fontSize: 13, fontWeight: on ? '600' : '500', color: colors.text }}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Checkbox({ checked, label, sub, onChange }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={({ hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: hovered ? colors.surfaceMuted : 'transparent', cursor: 'pointer' })}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: checked ? 0 : 1.5, borderColor: colors.borderStrong, backgroundColor: checked ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {checked ? <Feather name="check" size={15} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.text }} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.text2 }} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}
