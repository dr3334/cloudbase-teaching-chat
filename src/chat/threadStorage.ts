import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 线程存储：assistant-ui 的 createLocalStorageAdapter 需要一个
 * getItem / setItem / removeItem 的 KV，这里直接交给 AsyncStorage，
 * 会话列表与消息随 App 重启保留。
 */
export type ThreadStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const threadStorage: ThreadStorage = AsyncStorage;
