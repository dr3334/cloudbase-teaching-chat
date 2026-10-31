/**
 * OpenAI 兼容接口的最小客户端。
 *
 * 用 XMLHttpRequest 而不是 fetch：RN 的 fetch 不暴露 response.body，
 * 拿不到增量数据；XHR 的 onprogress 可以边收边解析 SSE。
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface StreamHandle {
  abort: () => void;
}

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

export function streamChatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  handlers: StreamHandlers,
): StreamHandle {
  const xhr = new XMLHttpRequest();
  let cursor = 0;
  let buffer = '';
  let settled = false;
  let sawDelta = false;

  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    if (error) handlers.onError(error);
    else handlers.onDone();
  };

  const emit = (text: string) => {
    if (!text || settled) return;
    sawDelta = true;
    handlers.onDelta(text);
  };

  const consumeSse = (raw: string) => {
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
        if (typeof delta === 'string') emit(delta);
      } catch {
        // 半包，等下一段数据补齐
      }
    }
  };

  xhr.open('POST', `${trimBase(config.baseUrl)}/chat/completions`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${config.apiKey.trim()}`);
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.timeout = 120000;

  xhr.onprogress = () => {
    const chunk = xhr.responseText.slice(cursor);
    cursor = xhr.responseText.length;
    if (chunk) consumeSse(chunk);
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const tail = xhr.responseText.slice(cursor);
      cursor = xhr.responseText.length;
      if (tail) consumeSse(tail);

      // 服务端忽略了 stream，返回一次性 JSON 时的兜底
      if (!sawDelta && !settled) {
        try {
          const json = JSON.parse(xhr.responseText);
          const text = json?.choices?.[0]?.message?.content;
          if (typeof text === 'string') emit(text);
        } catch {
          // 忽略
        }
      }
      finish();
      return;
    }
    finish(new Error(describeHttpError(xhr.status, xhr.responseText)));
  };

  xhr.onerror = () => finish(new Error('网络请求失败，请检查 Base URL 与设备网络'));
  xhr.ontimeout = () => finish(new Error('请求超时（120s）'));
  xhr.onabort = () => finish();

  xhr.send(
    JSON.stringify({
      model: config.model.trim(),
      messages,
      stream: true,
      temperature: 0.7,
    }),
  );

  return {
    abort: () => {
      if (settled) return;
      settled = true;
      xhr.abort();
    },
  };
}

/** 粗略估算 token：中文按 1 字 ≈ 0.7，英文按 4 字符 ≈ 1 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) > 0x2e80) cjk += 1;
  }
  const rest = text.length - cjk;
  return Math.round(cjk * 0.7 + rest / 4);
}
