import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  useAuiState,
  type AssistantRuntime,
} from '@assistant-ui/react-native';

import { EditComposerRow, MessageRow } from '../chat/ChatParts';
import { ComposerBar } from '../chat/ComposerBar';
import { ModelPicker } from '../chat/ModelPicker';
import { ThreadDrawer } from '../chat/ThreadDrawer';
import { useThreadStats } from '../chat/useThreadStats';
import { cds, font, gap, text } from '../cds/tokens';
import { TopBar } from '../components/TopBar';
import { getLlmConfig, isLlmConfigured, saveLlmConfig } from '../config/llm';
import { presetModels, shortModelName } from '../config/models';
import { LlmSettingsScreen } from './LlmSettingsScreen';

interface Props {
  runtime: AssistantRuntime;
  onBack: () => void;
}

interface BodyProps {
  model: string;
  models: string[];
  runtime: AssistantRuntime;
  configVersion: number;
  onMenu: () => void;
  onSettings: () => void;
  onReset: () => void;
  onModelChange: (id: string) => void;
}

function EmptyState({ model }: { model: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.brand}>✦</Text>
      <Text style={styles.greeting}>真实模型{'\n'}已在线上</Text>
      <Text style={styles.sub}>
        当前模型 {model}。直接提问即可，回答由接口流式返回，支持 Markdown 与 LaTeX 渲染。
      </Text>
    </View>
  );
}

function ThreadBody({
  model,
  models,
  runtime,
  configVersion,
  onMenu,
  onSettings,
  onReset,
  onModelChange,
}: BodyProps) {
  const insets = useSafeAreaInsets();
  const { stats, phase } = useThreadStats();
  const empty = useAuiState((s) => s.thread.isEmpty);
  const running = useAuiState((s) => s.thread.isRunning);
  const resetVersionRef = useRef(configVersion);

  // 配置变更后清空线程：必须在 provider 挂载之后调用，此时线程绑定才有效
  useEffect(() => {
    if (resetVersionRef.current === configVersion) return;
    resetVersionRef.current = configVersion;
    runtime.thread.reset();
  }, [configVersion, runtime]);

  return (
    <>
      <TopBar
        stats={stats}
        phase={phase}
        canReset={!empty}
        onReset={onReset}
        onMenu={onMenu}
        onSettings={onSettings}
        title="真实对话"
        phaseOverride={empty ? `已连接 · ${shortModelName(model)}` : undefined}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThreadPrimitive.MessagesFlatList
          autoScroll
          components={{ Message: MessageRow, EditComposer: EditComposerRow }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState model={model} />}
        />

        <View style={{ paddingBottom: Math.max(insets.bottom, gap.xs) }}>
          <ModelPicker
            current={model}
            models={models}
            onSelect={onModelChange}
            disabled={running}
          />
          <ComposerBar />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

export function LiveChatScreen({ runtime, onBack }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(!isLlmConfigured());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [model, setModel] = useState(getLlmConfig().model);
  const [models, setModels] = useState<string[]>(() => presetModels.map((item) => item.id));
  const [configVersion, setConfigVersion] = useState(0);

  const handleModelChange = (id: string) => {
    if (id === model) return;
    saveLlmConfig({ model: id });
    setModel(id);
  };

  if (settingsOpen) {
    return (
      <LlmSettingsScreen
        onSaved={() => {
          setModel(getLlmConfig().model);
          setConfigVersion((version) => version + 1);
          setSettingsOpen(false);
        }}
        onCancel={isLlmConfigured() ? () => setSettingsOpen(false) : onBack}
        onModelsDiscovered={setModels}
      />
    );
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root style={styles.root}>
        <ThreadBody
          model={model}
          models={models}
          runtime={runtime}
          configVersion={configVersion}
          onModelChange={handleModelChange}
          onMenu={() => setDrawerOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onReset={() => runtime.thread.reset()}
        />

        <ThreadDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onExit={() => {
            setDrawerOpen(false);
            onBack();
          }}
        />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
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
