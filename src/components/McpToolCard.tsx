import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { EASE, SPRING } from '../cds/motion';
import { cds, font, gap, radius, shadow, style } from '../cds/tokens';
import type { ToolBlock } from '../types';

interface Props {
  block: ToolBlock;
}

function formatDuration(ms?: number) {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** 转动指示灯：running 态的活性反馈 */
function Spinner() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
  );
}

export function McpToolCard({ block }: Props) {
  const [expanded, setExpanded] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;
  const running = block.status === 'running';
  const failed = block.status === 'error';
  const args = Object.entries(block.args);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      ...SPRING.snappy,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.card,
        running ? styles.cardRunning : null,
        failed ? styles.cardFailed : null,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.head, pressed ? styles.headPressed : null]}
        hitSlop={4}
      >
        <View style={[styles.icon, running ? styles.iconRunning : null]}>
          <Text style={[styles.iconGlyph, running ? { color: cds.clay } : null]}>◇</Text>
        </View>

        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={1}>
            {block.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {block.server} · 只读
            {block.summary ? ` · ${block.summary}` : ''}
          </Text>
        </View>

        {running ? (
          <Spinner />
        ) : (
          <Text style={[styles.duration, style.tabular]}>{formatDuration(block.durationMs)}</Text>
        )}

        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.args}>
            {args.map(([key, value]) => (
              <View key={key} style={styles.argRow}>
                <Text style={styles.argKey}>{key}</Text>
                <Text style={styles.argValue} numberOfLines={2}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {block.result ? (
            <View style={styles.result}>
              <Text style={styles.resultLabel}>RETURN</Text>
              <Text style={styles.resultText}>{block.result}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cds.surface2,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cds.border,
    marginBottom: gap.sm,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardRunning: {
    borderColor: 'rgba(217,119,87,0.45)',
    ...shadow.clayGlow,
  },
  cardFailed: {
    borderColor: 'rgba(198,69,69,0.45)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    paddingHorizontal: gap.md,
    paddingVertical: 10,
  },
  headPressed: {
    backgroundColor: cds.alpha1,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cds.alpha1,
  },
  iconRunning: {
    backgroundColor: cds.clayLight,
  },
  iconGlyph: {
    fontFamily: font.sans,
    fontSize: 11,
    color: cds.textSecondary,
  },
  headText: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontFamily: font.mono,
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600',
    color: cds.textPrimary,
  },
  sub: {
    fontFamily: font.mono,
    fontSize: 9.5,
    lineHeight: 13,
    color: cds.textMuted,
  },
  spinner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: cds.alpha2,
    borderTopColor: cds.clay,
  },
  duration: {
    fontFamily: font.mono,
    fontSize: 10,
    color: cds.textMuted,
  },
  chevron: {
    fontFamily: font.sans,
    fontSize: 11,
    color: cds.textMuted,
    marginTop: -1,
  },
  body: {
    paddingHorizontal: gap.md,
    paddingBottom: gap.md,
    gap: gap.sm,
  },
  args: {
    gap: 2,
  },
  argRow: {
    flexDirection: 'row',
    gap: gap.sm,
  },
  argKey: {
    fontFamily: font.mono,
    fontSize: 10.5,
    lineHeight: 15,
    color: cds.textMuted,
    minWidth: 58,
  },
  argValue: {
    fontFamily: font.mono,
    fontSize: 10.5,
    lineHeight: 15,
    flex: 1,
    color: cds.textSecondary,
  },
  result: {
    backgroundColor: cds.surface0,
    borderRadius: radius.lg,
    paddingHorizontal: gap.sm,
    paddingVertical: gap.sm,
  },
  resultLabel: {
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: cds.textMuted,
    marginBottom: 3,
  },
  resultText: {
    fontFamily: font.mono,
    fontSize: 10.5,
    lineHeight: 16,
    color: cds.textSecondary,
  },
});
