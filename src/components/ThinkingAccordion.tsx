import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { EASE, SPRING } from '../cds/motion';
import { cds, font, gap, radius, style, text } from '../cds/tokens';
import type { ThinkingBlock } from '../types';

interface Props {
  block: ThinkingBlock;
}

/** 三点波浪：Generating 态的呼吸脉冲 */
function WaveDots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 420,
            easing: EASE.pulse,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 420,
            easing: EASE.pulse,
            useNativeDriver: true,
          }),
          Animated.delay(360 - delay),
        ]),
      );

    const animations = [make(a, 0), make(b, 120), make(c, 240)];
    animations.forEach((x) => x.start());
    return () => animations.forEach((x) => x.stop());
  }, [a, b, c]);

  return (
    <View style={styles.wave}>
      {[a, b, c].map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveDot,
            {
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2.5] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ThinkingAccordion({ block }: Props) {
  const [expanded, setExpanded] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      ...SPRING.snappy,
    }).start();
  }, [enter]);

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      easing: EASE.expand,
      useNativeDriver: true,
    }).start();
  }, [expanded, reveal]);

  const label = block.done ? 'Thought' : 'Thinking';

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        hitSlop={6}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
      >
        {block.done ? (
          <Text style={styles.thoughtGlyph}>✻</Text>
        ) : (
          <WaveDots />
        )}
        <Text style={styles.triggerText}>
          {label}
          {block.done ? ` for ${(block.tokens / 18).toFixed(1)}s` : '…'}
        </Text>
        <Text style={styles.triggerMeta}>{block.tokens} tok</Text>
        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </Pressable>

      {expanded ? (
        <Animated.View
          style={[
            styles.body,
            {
              opacity: reveal,
              transform: [
                { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.log}>
            {block.text || '…'}
            {!block.done ? <Text style={styles.caret}>▍</Text> : null}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: gap.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  triggerPressed: {
    backgroundColor: cds.alpha1,
  },
  thoughtGlyph: {
    fontFamily: font.sans,
    fontSize: 11,
    color: cds.clay,
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 12,
    paddingHorizontal: 2,
  },
  waveDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: cds.clay,
  },
  triggerText: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: cds.textSecondary,
    ...style.tabular,
  },
  triggerMeta: {
    fontFamily: font.mono,
    fontSize: 9.5,
    color: cds.textMuted,
    ...style.tabular,
  },
  chevron: {
    fontFamily: font.sans,
    fontSize: 11,
    color: cds.textMuted,
    marginTop: -2,
  },
  body: {
    paddingLeft: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },
  log: {
    fontFamily: font.mono,
    ...text.mono,
    color: cds.textMuted,
    lineHeight: 18,
  },
  caret: {
    color: cds.clay,
  },
});
