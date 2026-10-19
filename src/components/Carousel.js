// src/components/Carousel.js
// Swipeable rows for project cards and screenshots. Native horizontal scrolling with CSS
// scroll-snap on web, so touch, trackpad and the arrow buttons all move it the same way.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme, useBreakpoint } from '../context/ThemeContext';
import { FONT, MOTION, RADIUS, SPACE } from '../theme/tokens';
import { T } from './ui';

const isWeb = Platform.OS === 'web';
const webOnly = (s) => (isWeb ? s : null);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Round paddle button, Apple-store style.
function Paddle({ icon, onPress, disabled, label, overlay, size = 36 }) {
  const { colors, scheme } = useTheme();
  const bg = overlay ? (scheme === 'dark' ? 'rgba(29,29,31,0.72)' : 'rgba(255,255,255,0.82)') : colors.surfaceMuted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ hovered, pressed }) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.7 : 1, transform: [{ scale: hovered && !disabled ? 1.06 : 1 }] },
        webOnly({ cursor: disabled ? 'default' : 'pointer', transitionProperty: 'transform, opacity', transitionDuration: '200ms', backdropFilter: overlay ? 'saturate(180%) blur(20px)' : undefined, boxShadow: overlay ? '0 4px 16px rgba(0,0,0,0.14)' : 'none' }),
      ]}
    >
      <Feather name={icon} size={Math.round(size * 0.5)} color={colors.text} />
    </Pressable>
  );
}

// Position dots; the active one stretches into a pill.
function Dots({ count, index, onPress }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: count }, (_, i) => (
        <Pressable key={i} onPress={() => onPress(i)} accessibilityRole="button" accessibilityLabel={`Go to slide ${i + 1}`} hitSlop={6}
          style={[{ width: i === index ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === index ? colors.text : colors.text3, opacity: i === index ? 0.85 : 0.35 }, webOnly({ cursor: 'pointer', transitionProperty: 'width, opacity', transitionDuration: '300ms', transitionTimingFunction: MOTION.ease })]} />
      ))}
    </View>
  );
}

/**
 * @param perView  whole items visible at once
 * @param peek     fraction of the next item left showing, a hint that the row scrolls
 * @param bleed    px the row extends past its container, so cards can reach the screen edge
 * @param controls 'below' (dots + paddles), 'overlay' (paddles on the sides) or 'none'
 */
export const Carousel = forwardRef(function Carousel(
  { data, renderItem, keyExtractor, perView = 1, peek = 0, gap = 20, bleed = 0, controls = 'below', label, onIndex },
  ref,
) {
  const { colors } = useTheme();
  const { isSm } = useBreakpoint();
  const scroller = useRef(null);
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState({ x: 0, max: 0 });
  const visible = perView + peek;
  const itemW = width ? (width - gap * (Math.ceil(visible) - 1)) / visible : 0;
  const step = itemW + gap;
  const last = Math.max(0, data.length - Math.floor(visible));
  const atStart = pos.x <= 2;
  const atEnd = pos.x >= pos.max - 2;
  const index = atEnd && pos.max > 0 ? last : clamp(Math.round(pos.x / (step || 1)), 0, last);

  useEffect(() => { onIndex?.(index); }, [index, onIndex]);

  const goTo = useCallback((i) => {
    const x = clamp(clamp(i, 0, last) * step, 0, pos.max || Infinity);
    scroller.current?.scrollTo({ x, animated: true });
  }, [last, step, pos.max]);
  useImperativeHandle(ref, () => ({ goTo }), [goTo]);

  const onScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setPos({ x: contentOffset.x, max: Math.max(0, contentSize.width - layoutMeasurement.width) });
  };
  const page = Math.max(1, Math.floor(visible));
  const scrollable = data.length > Math.floor(visible);

  return (
    <View accessibilityRole={isWeb ? 'region' : undefined} aria-roledescription="carousel" accessibilityLabel={label}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onContentSizeChange={(w) => setPos((p) => ({ ...p, max: Math.max(0, w - width - bleed * 2) }))}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={isWeb ? undefined : step}
          // Vertical padding leaves room for card hover lift and shadows inside the clip.
          style={[{ marginHorizontal: -bleed, marginVertical: -SPACE[4] }, webOnly({ scrollSnapType: 'x mandatory', scrollPaddingLeft: bleed, scrollPaddingRight: bleed, overscrollBehaviorX: 'contain' })]}
          contentContainerStyle={{ paddingHorizontal: bleed, paddingVertical: SPACE[4], gap }}
        >
          {width ? data.map((item, i) => (
            <View key={keyExtractor ? keyExtractor(item, i) : i} style={[{ width: itemW, flexDirection: 'column' }, webOnly({ scrollSnapAlign: 'start' })]} aria-roledescription="slide" accessibilityLabel={`${i + 1} of ${data.length}`}>
              {renderItem(item, i, itemW)}
            </View>
          )) : null}
        </ScrollView>

        {controls === 'overlay' && scrollable && !isSm ? (
          <>
            <View pointerEvents="box-none" style={[{ position: 'absolute', left: SPACE[4], top: 0, bottom: 0, justifyContent: 'center', opacity: atStart ? 0 : 1 }, webOnly({ transitionProperty: 'opacity', transitionDuration: '250ms', pointerEvents: atStart ? 'none' : 'box-none' })]}>
              <Paddle overlay icon="chevron-left" label="Previous" disabled={atStart} onPress={() => goTo(index - 1)} size={40} />
            </View>
            <View pointerEvents="box-none" style={[{ position: 'absolute', right: SPACE[4], top: 0, bottom: 0, justifyContent: 'center', opacity: atEnd ? 0 : 1 }, webOnly({ transitionProperty: 'opacity', transitionDuration: '250ms', pointerEvents: atEnd ? 'none' : 'box-none' })]}>
              <Paddle overlay icon="chevron-right" label="Next" disabled={atEnd} onPress={() => goTo(index + 1)} size={40} />
            </View>
          </>
        ) : null}
      </View>

      {controls === 'below' && scrollable ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isSm ? 'center' : 'space-between', marginTop: SPACE[6] }}>
          {last < 12 ? <Dots count={last + 1} index={index} onPress={goTo} /> : <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text2, fontVariant: ['tabular-nums'] }}>{index + 1} / {last + 1}</Text>}
          {!isSm ? (
            <View style={{ flexDirection: 'row', gap: SPACE[3] }}>
              <Paddle icon="chevron-left" label="Previous projects" disabled={atStart} onPress={() => goTo(index - page)} />
              <Paddle icon="chevron-right" label="Next projects" disabled={atEnd} onPress={() => goTo(index + page)} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

// Project screenshots: a large stage that fits any shape (phone or desktop) over a soft
// blurred copy of itself, a caption with a counter, and a thumbnail strip to jump around.
export function Gallery({ images, onOpen }) {
  const { colors } = useTheme();
  const { isSm, bp } = useBreakpoint();
  const stage = useRef(null);
  const strip = useRef(null);
  const [index, setIndex] = useState(0);
  const thumbW = isSm ? 76 : 104;
  const gutter = isSm ? SPACE[5] : 0;

  useEffect(() => {
    strip.current?.scrollTo({ x: Math.max(0, index * (thumbW + 8) - thumbW * 2), animated: true });
  }, [index, thumbW]);

  const current = images[index] || images[0];
  return (
    <View>
      <Carousel
        ref={stage}
        data={images}
        label="Screenshots"
        controls="overlay"
        gap={isSm ? 12 : 16}
        peek={isSm && images.length > 1 ? 0.08 : 0}
        bleed={gutter}
        onIndex={setIndex}
        keyExtractor={(g, i) => g.url + i}
        renderItem={(g, i) => (
          <Pressable onPress={() => onOpen(i)} accessibilityLabel={`Enlarge ${g.caption || 'screenshot ' + (i + 1)}`}
            style={[{ width: '100%', aspectRatio: bp === 'lg' ? 16 / 9 : 16 / 10, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border }, webOnly({ cursor: 'zoom-in' })]}>
            {isWeb ? <Image aria-hidden source={{ uri: g.url }} resizeMode="cover" style={[{ position: 'absolute', top: -40, left: -40, right: -40, bottom: -40, opacity: 0.45 }, { filter: 'blur(36px) saturate(140%)' }]} /> : null}
            <Image source={{ uri: g.url }} resizeMode="contain" style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
          </Pressable>
        )}
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[4], marginTop: SPACE[4], minHeight: 20 }}>
        <T variant="small" color="secondary" style={{ flex: 1 }} numberOfLines={2}>{current?.caption || ''}</T>
        {images.length > 1 ? <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.text3, fontVariant: ['tabular-nums'] }}>{index + 1} / {images.length}</Text> : null}
      </View>

      {images.length > 1 ? (
        <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACE[4], marginHorizontal: -gutter }} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter, paddingVertical: 2 }}>
          {images.map((g, i) => (
            <Pressable key={g.url + i} onPress={() => stage.current?.goTo(i)} accessibilityRole="button" accessibilityLabel={`Show screenshot ${i + 1}`} accessibilityState={{ selected: i === index }}
              style={({ hovered }) => [{ width: thumbW, aspectRatio: 16 / 10, borderRadius: RADIUS.sm, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 2, borderColor: i === index ? colors.accent : 'transparent', opacity: i === index || hovered ? 1 : 0.55 }, webOnly({ cursor: 'pointer', transitionProperty: 'opacity, border-color', transitionDuration: '200ms' })]}>
              <Image source={{ uri: g.url }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
