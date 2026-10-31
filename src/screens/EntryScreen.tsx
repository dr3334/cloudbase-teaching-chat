import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cds, font, gap, radius, shadow, text } from '../cds/tokens';

interface CardProps {
  tag: string;
  title: string;
  desc: string;
  highlight?: boolean;
  onPress: () => void;
}

function EntryCard({ tag, title, desc, highlight, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlight ? styles.cardHighlight : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.cardBody}>
        <View style={[styles.tag, highlight ? styles.tagOn : null]}>
          <Text style={[styles.tagText, highlight ? styles.tagTextOn : null]}>{tag}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

interface Props {
  liveReady: boolean;
  onPickDemo: () => void;
  onPickLive: () => void;
}

export function EntryScreen({ liveReady, onPickDemo, onPickLive }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Text style={styles.brand}>✦</Text>
      <Text style={styles.title}>把云开发{'\n'}讲明白</Text>
      <Text style={styles.sub}>
        两个入口：演示模式完全离线，用脚本模拟推理链路；真实对话会调用你配置的模型接口。
      </Text>

      <View style={styles.cards}>
        <EntryCard
          tag="离线"
          title="演示模式"
          desc="脚本驱动的推理、工具调用与 token 计量，不消耗额度"
          onPress={onPickDemo}
        />
        <EntryCard
          tag="实时"
          title="真实对话"
          desc={
            liveReady
              ? '当前已配置接口，进入后即可对话'
              : '首次进入需要填写 API Key、Base URL 与模型名'
          }
          highlight
          onPress={onPickLive}
        />
      </View>

      <Text style={styles.footer}>OpenAI 兼容协议 · 流式输出 · 客户端直连</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: gap.lg,
    paddingTop: gap.xl,
    paddingBottom: gap.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brand: {
    fontFamily: font.sans,
    fontSize: 22,
    color: cds.clay,
    marginBottom: 14,
  },
  title: {
    fontFamily: font.serif,
    ...text.display,
    color: cds.textPrimary,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: font.sans,
    ...text.body,
    color: cds.textSecondary,
    marginTop: gap.md,
    maxWidth: 320,
  },
  cards: {
    marginTop: gap.xl,
    gap: gap.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.md,
    paddingHorizontal: gap.lg,
    paddingVertical: gap.lg,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: cds.border,
    backgroundColor: cds.surface2,
    ...shadow.sm,
  },
  cardHighlight: {
    borderColor: 'rgba(217,119,87,0.38)',
  },
  cardPressed: {
    backgroundColor: cds.surface0,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: gap.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: cds.alpha1,
  },
  tagOn: {
    backgroundColor: cds.clayLight,
  },
  tagText: {
    fontFamily: font.mono,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: cds.textMuted,
  },
  tagTextOn: {
    color: cds.brand,
  },
  cardTitle: {
    fontFamily: font.sans,
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '600',
    color: cds.textPrimary,
  },
  cardDesc: {
    fontFamily: font.sans,
    ...text.bodySm,
    color: cds.textSecondary,
  },
  arrow: {
    fontFamily: font.sans,
    fontSize: 15,
    color: cds.textMuted,
  },
  footer: {
    fontFamily: font.mono,
    ...text.monoSm,
    color: cds.textMuted,
    textAlign: 'center',
    marginTop: gap.xl,
  },
});
