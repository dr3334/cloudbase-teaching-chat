import { createLocalStorageAdapter } from '@assistant-ui/core/react';
import { useLocalRuntime, useRemoteThreadListRuntime } from '@assistant-ui/react-native';

import { openAiChatModel } from './modelAdapter';
import { threadStorage } from './threadStorage';
import { firstMessageTitle } from './titleFromMessages';

/**
 * 真实对话的运行时就绪点：assistant-ui 负责线程、分支、编辑、重试等状态，
 * 模型调用由 openAiChatModel 直接打到 OpenAI 兼容接口。
 *
 * 外层的 RemoteThreadListRuntime 提供「多会话 + 历史记录」，每条线程的消息
 * 由 createLocalStorageAdapter 写进 storage，侧边抽屉读取同一份数据。
 */
const threadListAdapter = createLocalStorageAdapter({
  storage: threadStorage,
  prefix: 'aui:',
  titleGenerator: firstMessageTitle,
});

export function useLiveRuntime() {
  return useRemoteThreadListRuntime({
    runtimeHook: () => useLocalRuntime(openAiChatModel),
    adapter: threadListAdapter,
  });
}
