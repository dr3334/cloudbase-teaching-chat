import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { cds } from './src/cds/tokens';
import { isLlmConfigured } from './src/config/llm';
import { useLiveRuntime } from './src/chat/useLiveRuntime';
import { useChatSession } from './src/hooks/useChatSession';
import { DemoChatScreen } from './src/screens/DemoChatScreen';
import { EntryScreen } from './src/screens/EntryScreen';
import { LiveChatScreen } from './src/screens/LiveChatScreen';

type Mode = 'entry' | 'demo' | 'live';

export default function App() {
  const [mode, setMode] = useState<Mode>('entry');

  // 会话状态提升到根组件，切换入口时不丢对话
  const demoSession = useChatSession();
  const liveRuntime = useLiveRuntime();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        {mode === 'entry' && (
          <EntryScreen
            liveReady={isLlmConfigured()}
            onPickDemo={() => setMode('demo')}
            onPickLive={() => setMode('live')}
          />
        )}
        {mode === 'demo' && (
          <DemoChatScreen session={demoSession} onBack={() => setMode('entry')} />
        )}
        {mode === 'live' && (
          <LiveChatScreen runtime={liveRuntime} onBack={() => setMode('entry')} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: cds.surface1,
  },
});
