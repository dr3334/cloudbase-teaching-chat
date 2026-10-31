/** 模型列表探测：GET {baseUrl}/models，兼容 OpenAI 与 ModelScope 的返回结构 */

const trimBase = (url: string) => url.trim().replace(/\/+$/, '');

export interface ModelListResult {
  ids: string[];
}

export async function fetchModelList(
  baseUrl: string,
  apiKey: string,
  timeoutMs = 15000,
): Promise<ModelListResult> {
  const url = `${trimBase(baseUrl)}/models`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const raw = await response.text();

    if (!response.ok) {
      let message = raw.trim().slice(0, 160);
      try {
        const json = JSON.parse(raw);
        message = json?.error?.message ?? json?.message ?? message;
      } catch {
        // 非 JSON，直接用截断文本
      }
      throw new Error(`HTTP ${response.status}${message ? ` · ${message}` : ''}`);
    }

    const json = JSON.parse(raw);
    const list: unknown[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

    const ids = list
      .map((item) => {
        if (typeof item === 'string') return item;
        const id = (item as { id?: unknown })?.id;
        return typeof id === 'string' ? id : '';
      })
      .filter((id) => id.length > 0);

    if (ids.length === 0) throw new Error('接口没有返回任何模型');

    return { ids: Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b)) };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`探测超时（${Math.round(timeoutMs / 1000)}s）`);
    }
    if (error instanceof TypeError) {
      throw new Error('请求失败，请检查 Base URL 与网络');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
