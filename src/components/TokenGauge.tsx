import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cds, font, gap, style } from '../cds/tokens';
import type { TokenStats } from '../types';

/** 演示用上下文预算，用于环形容量计的比例换算 */
const CONTEXT_BUDGET = 4000;
const R = 10;
const CIRC = 2 * Math.PI * R;
const WARN_THRESHOLD = 0.8;

interface Props {
  stats: TokenStats;
  active: boolean;
}

export function TokenGauge({ stats, active }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  const total = stats.cacheRead + stats.cacheCreation + stats.input + stats.output;
  const usage = Math.min(1, total / CONTEXT_BUDGET);
  const warning = usage > WARN_THRESHOLD;
  const offset = CIRC * (1 - usage);

  useEffect(() => {
    if (!warning) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, warning]);

  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });

  return (
    <View style={styles.wrap}>
      <View style={styles.ringWrap}>
        <Svg width={30} height={30}>
          <Circle
            cx={15}
            cy={15}
            r={R}
            stroke={cds.alpha2}
            strokeWidth={2.5}
            fill="none"
          />
          <Circle
            cx={15}
            cy={15}
            r={R}
            stroke={warning ? cds.clay : cds.textSecondary}
            strokeWidth={2.5}
            fill="none"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 15 15)"
          />
        </Svg>
      </View>

      <View style={styles.meta}>
        <View style={styles.totalRow}>
          <Animated.Text style={[styles.total, style.tabular, warning ? { opacity: glow } : null]}>
            {total.toLocaleString('en-US')}
          </Animated.Text>
          <Text style={styles.unit}>tok</Text>
          {stats.rate > 0 ? (
            <Text style={[styles.rate, active ? null : styles.rateSettled]}>{stats.rate}/s</Text>
          ) : null}
        </View>

        <View style={styles.stack}>
          {stats.cacheRead > 0 ? (
            <View
              style={[
                styles.segment,
                { flex: stats.cacheRead, backgroundColor: cds.cacheRead },
              ]}
            />
          ) : null}
          {stats.cacheCreation > 0 ? (
            <View
              style={[
                styles.segment,
                { flex: stats.cacheCreation, backgroundColor: cds.cacheCreation },
              ]}
            />
          ) : null}
          {stats.input > 0 ? (
            <View
              style={[styles.segment, { flex: stats.input, backgroundColor: cds.tokenInput }]}
            />
          ) : null}
          {stats.output > 0 ? (
            <View
              style={[styles.segment, { flex: stats.output, backgroundColor: cds.tokenOutput }]}
            />
          ) : null}
          {total === 0 ? <View style={[styles.segment, { flex: 1, backgroundColor: cds.alpha2 }]} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ringWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    gap: 3,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  total: {
    fontFamily: font.mono,
    fontSize: 12.5,
    lineHeight: 15,
    fontWeight: '600',
    color: cds.textPrimary,
  },
  unit: {
    fontFamily: font.mono,
    fontSize: 9,
    color: cds.textMuted,
  },
  rate: {
    fontFamily: font.mono,
    fontSize: 9,
    color: cds.clay,
    marginLeft: 2,
  },
  /** 生成结束后的平均速率：降一档颜色，和实时速率区分 */
  rateSettled: {
    color: cds.textMuted,
  },
  stack: {
    flexDirection: 'row',
    width: 68,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: cds.alpha1,
    gap: 1,
  },
  segment: {
    height: 3,
    borderRadius: 2,
    minWidth: 2,
  },
});
