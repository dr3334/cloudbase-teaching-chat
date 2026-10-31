import type { ChatModelAdapter, ThreadMessage } from '@assistant-ui/react-native';

import { getLlmConfig } from '../config/llm';

/**
 * assistant-ui 的本地运行时适配器：把 OpenAI 兼容的 /chat/completions 流式响应
 * 包装成 ChatModelAdapter 需要的 async generator。
 *
 * 用 XHR 而不是 fetch：RN 的 fetch 不暴露 response.body，拿不到增量数据；
 * XHR 的 onprogress 可以边收边解析 SSE。
 */

type OpenAiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: Error };

type LoosePart = { type: string; text?: string };

const trimBase = (url: string) => url.trim().replace(/\/+$/, '');

function describeHttpError(status: number, body: string): string {
  try {
    const json = JSON.parse(body);
    const message = json?.error?.message ?? json?.message;
    if (typeof message === 'string' && message) return `HTTP ${status} · ${message}`;
  } catch {
    // 非 JSON 响应，走兜底
  }
  const snippet = body.trim().slice(0, 160);
  return snippet ? `HTTP ${status} · ${snippet}` : `HTTP ${status} · 服务端无响应内容`;
}

function textOf(message: ThreadMessage): string {
  const parts = (message as unknown as { content?: readonly LoosePart[] }).content ?? [];
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');
}

function toOpenAiMessages(
  systemPrompt: string,
  messages: readonly ThreadMessage[],
): OpenAiMessage[] {
  const history: OpenAiMessage[] = [];
  if (systemPrompt.trim()) history.push({ role: 'system', content: systemPrompt });

  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue;
    const text = textOf(message).trim();
    if (!text) continue;
    history.push({ role: message.role, content: text });
  }

  return history;
}

export const openAiChatModel: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const config = getLlmConfig();
    if (!config.apiKey.trim()) throw new Error('尚未配置 API Key，请先在设置中填写');
    if (!config.baseUrl.trim()) throw new Error('尚未配置 Base URL，请先在设置中填写');

    const history = toOpenAiMessages(config.systemPrompt, messages);
    if (history.length === 0) throw new Error('没有可发送的消息');

    const url = `${trimBase(config.baseUrl)}/chat/completions`;
    const xhr = new XMLHttpRequest();
    const events: StreamEvent[] = [];
    let wake: (() => void) | null = null;
    let cursor = 0;
    let buffer = '';
    let settled = false;
    let acc = '';

    const push = (event: StreamEvent) => {
      events.push(event);
      const notify = wake;
      wake = null;
      notify?.();
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      push({ type: 'done' });
    };

    const consume = (raw: string) => {
      buffer += raw;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          finish();
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) push({ type: 'delta', text: delta });
        } catch {
          // 半包，等下一段数据补齐
        }
      }
    };

    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${config.apiKey.trim()}`);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.timeout = 120000;

    xhr.onprogress = () => {
      const chunk = xhr.responseText.slice(cursor);
      cursor = xhr.responseText.length;
      if (chunk) consume(chunk);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const tail = xhr.responseText.slice(cursor);
        cursor = xhr.responseText.length;
        if (tail) consume(tail);

        // 服务端忽略 stream、返回一次性 JSON 时的兜底
        if (!acc && !settled) {
          try {
            const json = JSON.parse(xhr.responseText);
            const text = json?.choices?.[0]?.message?.content;
            if (typeof text === 'string' && text) push({ type: 'delta', text });
          } catch {
            // 忽略
          }
        }
        finish();
        return;
      }

      settled = true;
      push({ type: 'error', error: new Error(describeHttpError(xhr.status, xhr.responseText)) });
    };

    xhr.onerror = () => {
      settled = true;
      push({ type: 'error', error: new Error('网络请求失败，请检查 Base URL 与设备网络') });
    };
    xhr.ontimeout = () => {
      settled = true;
      push({ type: 'error', error: new Error('请求超时（120s）') });
    };
    xhr.onabort = () => {
      settled = true;
      push({ type: 'done' });
    };

    const onAbort = () => {
      xhr.abort();
    };

    if (abortSignal.aborted) throw new Error('已取消');
    abortSignal.addEventListener('abort', onAbort);

    xhr.send(
      JSON.stringify({
        model: config.model.trim(),
        messages: history,
        stream: true,
        temperature: 0.7,
      }),
    );

    try {
      for (;;) {
        if (events.length === 0) {
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
        }

        while (events.length > 0) {
          const event = events.shift();
          if (!event) break;
          if (event.type === 'error') throw event.error;
          if (event.type === 'done') return;

          acc += event.text;
          yield { content: [{ type: 'text' as const, text: acc }] };
        }
      }
    } finally {
      abortSignal.removeEventListener('abort', onAbort);
      if (!settled) {
        settled = true;
        xhr.abort();
      }
    }
  },
};
