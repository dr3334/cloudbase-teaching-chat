import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { EASE, ENTER_FADE_UP, SPRING } from '../cds/motion';
import { cds, font, gap, radius, style } from '../cds/tokens';
import type { Turn } from '../types';
import { McpToolCard } from './McpToolCard';
import { RichText } from './RichText';
import { ThinkingAccordion } from './ThinkingAccordion';

/** 流式光标：呼吸淡入淡出，替代静态方块 */
function Caret() {
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 0.15,
          duration: 620,
          easing: EASE.pulse,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 620,
          easing: EASE.pulse,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  return <Animated.Text style={[styles.caret, { opacity: breathe }]}>▍</Animated.Text>;
}

export function AssistantMessage({ turn }: { turn: Turn }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      ...SPRING.snappy,
    }).start();
  }, [enter]);

  const toolCount = turn.blocks.filter((b) => b.kind === 'tool').length;
  const answer = turn.blocks.find((b) => b.kind === 'answer');

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [ENTER_FADE_UP.fromY, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.logoRow}>
        <Text style={styles.logo}>✦</Text>
      </View>

      {turn.blocks.map((block) => {
        if (block.kind === 'thinking') {
          return <ThinkingAccordion key={block.id} block={block} />;
        }
        if (block.kind === 'tool') {
          return <McpToolCard key={block.id} block={block} />;
        }
        return (
          <View key={block.id} style={styles.answer}>
            <RichText content={block.text} />
            {!block.done ? <Caret /> : null}
          </View>
        );
      })}

      {turn.error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {turn.error}</Text>
        </View>
      ) : null}

      {turn.phase === 'done' && answer ? (
        <Text style={[styles.footer, style.tabular]}>
          {toolCount} tools · {(turn.elapsedMs / 1000).toFixed(1)}s · {answer.tokens} tok
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    marginTop: gap.lg,
    marginBottom: gap.xs,
  },
  logo: {
    fontFamily: font.sans,
    fontSize: 13,
    color: cds.clay,
  },
  answer: {
    paddingLeft: 0,
  },
  caret: {
    color: cds.clay,
    fontSize: 12,
    marginTop: -2,
  },
  errorBox: {
    marginTop: gap.sm,
    marginBottom: gap.md,
    paddingHorizontal: gap.md,
    paddingVertical: gap.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(198,69,69,0.4)',
    backgroundColor: 'rgba(198,69,69,0.06)',
  },
  errorText: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18,
    color: cds.error,
  },
  footer: {
    fontFamily: font.mono,
    fontSize: 10,
    lineHeight: 14,
    color: cds.textMuted,
    marginTop: gap.md,
    marginBottom: gap.lg,
  },
});
