import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { cds, font, gap, style } from '../cds/tokens';
import type { Phase, TokenStats } from '../types';
import { TokenGauge } from './TokenGauge';

const phaseLabel: Record<Phase, string> = {
  idle: 'Ready',
  thinking: 'Thinking',
  tool: 'Calling tool',
  answering: 'Responding',
  done: 'Done',
};

interface Props {
  stats: TokenStats;
  phase: Phase;
  canReset: boolean;
  onReset: () => void;
  title?: string;
  phaseOverride?: string;
  onBack?: () => void;
  onSettings?: () => void;
  /** 提供后左侧显示菜单按钮（打开会话抽屉），优先于返回箭头 */
  onMenu?: () => void;
}

export function TopBar({
  stats,
  phase,
  canReset,
  onReset,
  title = 'CloudBase 教学演示',
  phaseOverride,
  onBack,
  onSettings,
  onMenu,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const active = phase !== 'idle' && phase !== 'done';

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const breath = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {onMenu ? (
          <Pressable onPress={onMenu} hitSlop={14} style={styles.back}>
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </Pressable>
        ) : onBack ? (
          <Pressable onPress={onBack} hitSlop={14} style={styles.back}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
        ) : null}
        <Animated.View
          style={[styles.dot, { opacity: active ? breath : 1, backgroundColor: cds.clay }]}
        />
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.phase} numberOfLines={1}>
            {phaseOverride ?? phaseLabel[phase]}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <TokenGauge stats={stats} active={active} />
        {onSettings ? (
          <Pressable onPress={onSettings} hitSlop={10} style={styles.reset}>
            <Text style={styles.resetText}>设置</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onReset}
          disabled={!canReset}
          hitSlop={10}
          style={({ pressed }) => [styles.reset, pressed && canReset ? styles.resetPressed : null]}
        >
          <Text style={[styles.resetText, canReset ? null : styles.resetTextOff]}>重置</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: gap.sm,
    paddingHorizontal: gap.lg,
    paddingTop: gap.sm,
    paddingBottom: gap.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cds.border,
    backgroundColor: cds.surface1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    flexShrink: 1,
  },
  back: {
    width: 22,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  menuIcon: {
    width: 17,
    gap: 3.4,
    alignItems: 'stretch',
  },
  menuLine: {
    height: 1.6,
    borderRadius: 1,
    backgroundColor: cds.textSecondary,
  },
  backGlyph: {
    fontFamily: font.sans,
    fontSize: 22,
    lineHeight: 24,
    color: cds.textSecondary,
    marginTop: -2,
  },
  titleWrap: {
    flexShrink: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  title: {
    fontFamily: font.serif,
    fontSize: 14.5,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: cds.textPrimary,
  },
  phase: {
    fontFamily: font.mono,
    fontSize: 9.5,
    lineHeight: 12,
    color: cds.textMuted,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.md,
  },
  reset: {
    paddingHorizontal: gap.sm,
    paddingVertical: gap.xs,
    borderRadius: 6,
  },
  resetPressed: {
    backgroundColor: cds.alpha1,
  },
  resetText: {
    fontFamily: font.sans,
    fontSize: 12,
    fontWeight: '500',
    color: cds.textSecondary,
  },
  resetTextOff: {
    color: cds.textMuted,
  },
});
