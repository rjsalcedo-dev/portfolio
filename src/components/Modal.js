// src/components/Modal.js
// Centered dialog on desktop, bottom sheet on phones. Escape or tapping outside closes it;
// page scroll is locked while open.
import React, { useEffect } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { FONT, MOTION, RADIUS } from '../theme/tokens';

const isWeb = Platform.OS === 'web';

// Overlays render into <body>: a transformed ancestor (e.g. a scroll-reveal) would
// otherwise trap position:fixed inside it.
function Portal({ children }) {
  if (!isWeb) return children;
  const { createPortal } = require('react-dom');
  return createPortal(children, document.body);
}

function useModalBehaviour(onClose) {
  useEffect(() => {
    if (!isWeb) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
}

export function Modal({ visible, onClose, title, children, width = 560, footer }) {
  if (!visible) return null;
  return <Portal><ModalInner onClose={onClose} title={title} width={width} footer={footer}>{children}</ModalInner></Portal>;
}

function ModalInner({ onClose, title, children, width, footer }) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  useModalBehaviour(onClose);
  return (
    <View style={{ position: isWeb ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120, alignItems: 'center', justifyContent: isSm ? 'flex-end' : 'center', padding: isSm ? 0 : 24 }}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, backdropFilter: 'blur(8px)', animationKeyframes: [{ from: { opacity: 0 }, to: { opacity: 1 } }], animationDuration: '200ms' }} />
      <View
        accessibilityRole="dialog"
        aria-modal
        aria-label={title}
        style={{
          width: '100%', maxWidth: isSm ? '100%' : width, maxHeight: isSm ? '92vh' : '88vh',
          backgroundColor: colors.surface, borderRadius: RADIUS.xl, borderBottomLeftRadius: isSm ? 0 : RADIUS.xl, borderBottomRightRadius: isSm ? 0 : RADIUS.xl,
          overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          animationKeyframes: [{ from: { opacity: 0, transform: [{ translateY: isSm ? 40 : 12 }, { scale: isSm ? 1 : 0.98 }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } }],
          animationDuration: `${MOTION.base}ms`, animationTimingFunction: MOTION.ease,
          paddingBottom: isSm ? 'env(safe-area-inset-bottom)' : 0,
        }}
      >
        {isSm ? <View style={{ alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginTop: 8 }} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 12, paddingTop: isSm ? 8 : 14, paddingBottom: 4, gap: 12 }}>
          <Text numberOfLines={1} style={{ fontFamily: FONT, fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 }}>{title}</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close" style={({ hovered }) => ({ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? colors.border : colors.surfaceMuted, cursor: 'pointer' })}>
            <Feather name="x" size={16} color={colors.text2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 12 }}>{children}</ScrollView>
        {footer ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: colors.border }}>{footer}</View> : null}
      </View>
    </View>
  );
}

// Full-screen image viewer with arrow-key / swipe-free paging.
export function Lightbox({ images, index, onClose, onIndex }) {
  if (index == null || !images?.length) return null;
  return <Portal><LightboxInner images={images} index={index} onClose={onClose} onIndex={onIndex} /></Portal>;
}

function LightboxInner({ images, index, onClose, onIndex }) {
  useModalBehaviour(onClose);
  const go = (d) => onIndex((index + d + images.length) % images.length);
  useEffect(() => {
    if (!isWeb) return undefined;
    const onKey = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const item = images[index];
  const Btn = ({ icon, onPress, label, style }) => (
    <Pressable onPress={onPress} accessibilityLabel={label} style={({ hovered }) => [{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)', cursor: 'pointer' }, style]}>
      <Feather name={icon} size={20} color="#fff" />
    </Pressable>
  );
  return (
    <View style={{ position: isWeb ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 130, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center', animationKeyframes: [{ from: { opacity: 0 }, to: { opacity: 1 } }], animationDuration: '200ms' }}>
      <Pressable onPress={onClose} accessibilityLabel="Close" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Image source={{ uri: item.url }} resizeMode="contain" style={{ width: '92%', height: '80%' }} accessibilityLabel={item.caption || 'Image'} />
      {item.caption ? <Text style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 14, paddingHorizontal: 24, textAlign: 'center' }}>{item.caption}</Text> : null}
      <Text style={{ position: 'absolute', top: 24, left: 24, fontFamily: FONT, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{index + 1} / {images.length}</Text>
      <Btn icon="x" label="Close" onPress={onClose} style={{ position: 'absolute', top: 16, right: 16 }} />
      {images.length > 1 ? <Btn icon="chevron-left" label="Previous" onPress={() => go(-1)} style={{ position: 'absolute', left: 16 }} /> : null}
      {images.length > 1 ? <Btn icon="chevron-right" label="Next" onPress={() => go(1)} style={{ position: 'absolute', right: 16 }} /> : null}
    </View>
  );
}
