import { useCallback, useRef, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cds, font, gap, text } from '../cds/tokens';
import { AssistantMessage } from '../components/AssistantMessage';
import { Composer } from '../components/Composer';
import { MessageBubble } from '../components/MessageBubble';
import { PromptChips } from '../components/PromptChips';
import { TopBar } from '../components/TopBar';
import { suggestedPrompts } from '../mock/demoScript';
import type { ChatSession, Phase } from '../types';

interface Props {
  session: ChatSession;
  onBack: () => void;
}

export function DemoChatScreen({ session, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { turns, stats, running, send, reset } = session;

  const phase: Phase = turns.length === 0 ? 'idle' : turns[turns.length - 1].phase;
  const empty = turns.length === 0;

  const followRef = useRef(true);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceToBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    followRef.current = distanceToBottom < 56;
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (!followRef.current) return;
    scrollRef.current?.scrollToEnd({ animated: !running });
  }, [running]);

  return (
    <View style={styles.root}>
      <TopBar
        stats={stats}
        phase={phase}
        canReset={!empty}
        onReset={reset}
        onBack={onBack}
        title="CloudBase 教学演示"
        phaseOverride={phase === 'idle' ? '演示模式 · Ready' : undefined}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {empty ? (
            <View style={styles.empty}>
              <Text style={styles.brand}>✦</Text>
              <Text style={styles.greeting}>把云开发{'\n'}讲明白</Text>
              <Text style={styles.sub}>
                输入问题，或点下面的示例。推理与工具调用折叠为摘要行，点开看细节。
              </Text>
              <PromptChips items={suggestedPrompts} onPick={send} disabled={running} />
            </View>
          ) : (
            turns.map((turn) => (
              <View key={turn.id}>
                <MessageBubble text={turn.prompt} />
                <AssistantMessage turn={turn} />
              </View>
            ))
          )}
        </ScrollView>

        <View style={{ paddingBottom: Math.max(insets.bottom, gap.xs) }}>
          <Composer onSend={send} running={running} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: cds.surface1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: gap.lg,
    paddingBottom: gap.xl,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 28,
  },
  brand: {
    fontFamily: font.sans,
    fontSize: 22,
    color: cds.clay,
    marginBottom: 14,
  },
  greeting: {
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
    maxWidth: 300,
  },
});
