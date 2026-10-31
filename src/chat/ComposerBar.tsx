import { StyleSheet, Text, View } from 'react-native';
import { ComposerPrimitive, useAuiState } from '@assistant-ui/react-native';

import { cds, font, gap, radius, shadow, text } from '../cds/tokens';

/** 底部输入区：发送、停止、草稿状态全部由运行时托管 */
export function ComposerBar() {
  const running = useAuiState((s) => s.thread.isRunning);
  const canSend = useAuiState((s) => s.composer.canSend);

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <ComposerPrimitive.Input
          style={styles.input}
          multiline
          maxLength={400}
          placeholder={running ? '正在生成…' : '问点什么…'}
          placeholderTextColor={cds.textMuted}
        />

        {running ? (
          <ComposerPrimitive.Cancel style={styles.stop} hitSlop={6}>
            <Text style={styles.stopGlyph}>■</Text>
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send
            style={[styles.send, canSend ? null : styles.sendOff]}
            hitSlop={6}
          >
            <Text style={[styles.sendGlyph, canSend ? null : styles.sendGlyphOff]}>↑</Text>
          </ComposerPrimitive.Send>
        )}
      </View>

      <Text style={styles.hint}>
        {running ? '正在接收流式响应 · 点方块停止' : '真实接口 · 内容由模型生成'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: gap.lg,
    paddingTop: gap.sm,
    paddingBottom: gap.xs,
    backgroundColor: cds.surface1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.sm,
    backgroundColor: cds.surface3,
    borderRadius: radius.composer,
    borderWidth: 1,
    borderColor: cds.border,
    paddingLeft: gap.lg,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
    ...shadow.composer,
  },
  input: {
    flex: 1,
    fontFamily: font.sans,
    ...text.composer,
    color: cds.textPrimary,
    maxHeight: 110,
    paddingTop: 9,
    paddingBottom: 9,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cds.clay,
    marginBottom: 1,
  },
  sendOff: { backgroundColor: cds.alpha1 },
  sendGlyph: {
    fontFamily: font.sans,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: -2,
  },
  sendGlyphOff: { color: cds.textMuted },
  stop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cds.alpha2,
    marginBottom: 1,
  },
  stopGlyph: { fontSize: 11, color: cds.textSecondary },
  hint: {
    fontFamily: font.sans,
    fontSize: 11,
    lineHeight: 15,
    color: cds.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
