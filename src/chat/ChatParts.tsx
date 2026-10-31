import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  useAuiState,
} from '@assistant-ui/react-native';

import { EASE } from '../cds/motion';
import { cds, font, gap, radius, text } from '../cds/tokens';
import { MessageBubble } from '../components/MessageBubble';
import { RichText } from '../components/RichText';
import { useTurnMetrics, type TurnMetrics } from './useTurnMetrics';

/** 流式光标：呼吸淡入淡出 */
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

/** 首字等待（TTFT）动效：三点跳动 + 实时计时，收到第一个 token 后自动消失 */
function WaitingIndicator() {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const dots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startRef.current), 100);

    const loops = dots.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((dots.length - 1 - index) * 150),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());

    return () => {
      clearInterval(timer);
      loops.forEach((loop) => loop.stop());
    };
  }, [dots]);

  return (
    <View style={styles.waitingRow}>
      <View style={styles.dots}>
        {dots.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waitingDot,
              {
                opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                transform: [
                  { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                ],
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.waitingText}>{(elapsed / 1000).toFixed(1)}s · 等待首字</Text>
    </View>
  );
}

/** RN 没有 navigator.clipboard，交给 expo-clipboard 写入系统剪贴板 */
const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

function CopyButton() {
  return (
    <ActionBarPrimitive.Copy
      copyToClipboard={copyToClipboard}
      style={styles.action}
      hitSlop={8}
    >
      {({ isCopied }) => (
        <Text style={[styles.actionText, isCopied ? styles.actionOn : null]}>
          {isCopied ? '已复制' : '复制'}
        </Text>
      )}
    </ActionBarPrimitive.Copy>
  );
}

function EditButton() {
  return (
    <ActionBarPrimitive.Edit style={styles.action} hitSlop={8}>
      <Text style={styles.actionText}>编辑</Text>
    </ActionBarPrimitive.Edit>
  );
}

function ActionBar() {
  return (
    <View style={styles.actionBar}>
      <CopyButton />

      <ActionBarPrimitive.Reload style={styles.action} hitSlop={8}>
        {({ disabled }) => (
          <Text style={[styles.actionText, disabled ? styles.actionOff : null]}>重新生成</Text>
        )}
      </ActionBarPrimitive.Reload>

      <AuiIf condition={(s) => s.message.branchCount > 1}>
        <View style={styles.branchRow}>
          <BranchPickerPrimitive.Previous style={styles.action} hitSlop={8}>
            <Text style={styles.actionText}>‹</Text>
          </BranchPickerPrimitive.Previous>
          <BranchPickerPrimitive.Number style={styles.actionText} />
          <Text style={styles.actionText}>/</Text>
          <BranchPickerPrimitive.Count style={styles.actionText} />
          <BranchPickerPrimitive.Next style={styles.action} hitSlop={8}>
            <Text style={styles.actionText}>›</Text>
          </BranchPickerPrimitive.Next>
        </View>
      </AuiIf>
    </View>
  );
}

/** 结算行：首字延迟 + 平均输出速率，数字用等宽避免跳动 */
function formatMetrics(metrics: TurnMetrics): string {
  const ttft = `首字 ${(metrics.ttft / 1000).toFixed(1)}s`;
  if (metrics.rate <= 0) return ttft;
  return `${ttft} · 平均 ${metrics.rate} tok/s`;
}

function AssistantRow() {
  const statusType = useAuiState((s) => s.message.status?.type);
  const last = useAuiState((s) => s.message.isLast);
  const threadRunning = useAuiState((s) => s.thread.isRunning);
  const hasText = useAuiState((s) =>
    (s.message.content ?? []).some(
      (part) => part.type === 'text' && Boolean((part as { text?: string }).text?.trim()),
    ),
  );
  const streaming = statusType === 'running';
  // 消息刚建好时 status 还没切到 running，用线程态兜住这一帧
  const waiting = !hasText && (streaming || (last && threadRunning));
  const settled = statusType === 'complete' || statusType === 'incomplete';
  const metrics = useTurnMetrics();

  return (
    <MessagePrimitive.Root style={styles.assistant}>
      <View style={styles.logoRow}>
        <Text style={styles.logo}>✦</Text>
      </View>

      {waiting ? <WaitingIndicator /> : null}

      <MessagePrimitive.Content
        renderText={({ part }) => (
          <View>
            <RichText content={part.text} />
            {streaming ? <Caret /> : null}
          </View>
        )}
      />

      <ErrorPrimitive.Root style={styles.errorBox}>
        <ErrorPrimitive.Message style={styles.errorText} />
      </ErrorPrimitive.Root>

      {hasText || settled ? <ActionBar /> : null}

      {hasText && metrics ? <Text style={styles.meta}>{formatMetrics(metrics)}</Text> : null}
    </MessagePrimitive.Root>
  );
}

/** 列表项：按角色分派到用户气泡或助手正文 */
export function MessageRow() {
  const role = useAuiState((s) => s.message.role);

  if (role === 'user') {
    return (
      <MessagePrimitive.Root>
        <MessagePrimitive.Content renderText={({ part }) => <MessageBubble text={part.text} />} />
        <View style={styles.userActions}>
          <CopyButton />
          <EditButton />
        </View>
      </MessagePrimitive.Root>
    );
  }

  if (role === 'assistant') return <AssistantRow />;

  return null;
}

/** 编辑已发送的消息：改完重发会形成新分支 */
export function EditComposerRow() {
  return (
    <ComposerPrimitive.Root style={styles.editRoot}>
      <ComposerPrimitive.Input
        style={styles.editInput}
        multiline
        placeholder="修改后重新发送"
        placeholderTextColor={cds.textMuted}
      />
      <View style={styles.editActions}>
        <ComposerPrimitive.Cancel style={styles.editButton} hitSlop={6}>
          <Text style={styles.editCancel}>取消</Text>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send style={[styles.editButton, styles.editSend]} hitSlop={6}>
          <Text style={styles.editSendText}>发送</Text>
        </ComposerPrimitive.Send>
      </View>
    </ComposerPrimitive.Root>
  );
}

const styles = StyleSheet.create({
  assistant: { paddingBottom: gap.sm },
  logoRow: { marginTop: gap.lg, marginBottom: gap.xs },
  logo: { fontFamily: font.sans, fontSize: 13, color: cds.clay },
  caret: { color: cds.clay, fontSize: 12, marginTop: -2 },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    paddingTop: 2,
    paddingBottom: gap.xs,
  },
  dots: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 12 },
  waitingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: cds.clay },
  waitingText: {
    fontFamily: font.mono,
    fontSize: 10.5,
    lineHeight: 15,
    color: cds.textMuted,
  },
  meta: {
    fontFamily: font.mono,
    fontSize: 10.5,
    lineHeight: 15,
    color: cds.textMuted,
    marginTop: -4,
    marginBottom: gap.xs,
  },
  errorBox: {
    marginTop: gap.sm,
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
  actionBar: {
    flexDirection: 'row',
    gap: gap.lg,
    marginTop: gap.sm,
    marginBottom: gap.sm,
  },
  action: { paddingVertical: 2 },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: gap.lg,
    marginTop: gap.xs,
    marginBottom: gap.sm,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.xs,
    marginLeft: 'auto',
  },
  actionText: { fontFamily: font.sans, fontSize: 12, color: cds.textMuted },
  actionOn: { color: cds.success },
  actionOff: { color: cds.alpha3 },
  editRoot: {
    marginTop: gap.md,
    marginBottom: gap.md,
    padding: gap.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: cds.borderStrong,
    backgroundColor: cds.surface2,
  },
  editInput: {
    fontFamily: font.sans,
    ...text.body,
    color: cds.textPrimary,
    maxHeight: 140,
    paddingTop: 6,
    paddingBottom: 6,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: gap.sm,
    marginTop: gap.sm,
  },
  editButton: {
    paddingHorizontal: gap.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: cds.alpha1,
  },
  editSend: { backgroundColor: cds.clay },
  editCancel: { fontFamily: font.sans, fontSize: 12, color: cds.textSecondary },
  editSendText: { fontFamily: font.sans, fontSize: 12, color: '#ffffff' },
});
