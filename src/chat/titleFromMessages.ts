import type { ThreadMessage, TitleGenerationAdapter } from '@assistant-ui/react-native';

type LoosePart = { type: string; text?: string };

const textOf = (message: ThreadMessage | undefined) => {
  const parts = (message as unknown as { content?: readonly LoosePart[] } | undefined)?.content ?? [];
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');
};

/** 用首条用户消息做标题，避免为标题再发一次模型请求 */
export const firstMessageTitle: TitleGenerationAdapter = {
  async generateTitle(messages: readonly ThreadMessage[]) {
    const first = messages.find((message) => message.role === 'user');
    const text = textOf(first).replace(/\s+/g, ' ').trim();
    if (!text) return '新对话';
    return text.length > 22 ? `${text.slice(0, 22)}…` : text;
  },
};
