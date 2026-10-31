import { useEffect, useRef, useState } from 'react';
import { useAuiState } from '@assistant-ui/react-native';

import { estimateTokens } from '../services/openai';

type LoosePart = { type: string; text?: string };

export interface TurnMetrics {
  /** 从发起到收到第一个 token 的耗时（毫秒） */
  ttft: number;
  /** 输出 token 估值 */
  tokens: number;
  /** 首字之后的平均输出速率（tok/s），过短时为 0 */
  rate: number;
}

/** 组件卸载或切换线程后仍能取回：按消息 id 缓存 */
const cache = new Map<string, TurnMetrics>();

const textOf = (message: { content?: readonly LoosePart[] }) =>
  (message.content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');

/**
 * 记录本轮回答的首字延迟与平均速率。
 * 只在结束后产出一次结果，之后即便重新挂载也从缓存里读。
 */
export function useTurnMetrics(): TurnMetrics | null {
  const id = useAuiState((s) => s.message.id);
  const running = useAuiState((s) => s.message.status?.type === 'running');
  const text = useAuiState((s) => textOf(s.message as unknown as { content?: readonly LoosePart[] }));

  const [done, setDone] = useState<{ id: string; metrics: TurnMetrics } | null>(null);

  const trackRef = useRef<{ id: string; start: number; first: number | null }>({
    id,
    start: Date.now(),
    first: null,
  });

  useEffect(() => {
    if (trackRef.current.id !== id) trackRef.current = { id, start: Date.now(), first: null };
  }, [id]);

  // 首字到达：锁定时刻，后续重渲染不再改写
  useEffect(() => {
    if (!running) return;
    if (trackRef.current.first !== null) return;
    if (!text) return;
    trackRef.current.first = Date.now();
  }, [running, text]);

  // 结束：结算首字延迟与平均速率并缓存
  useEffect(() => {
    if (running) return;
    const track = trackRef.current;
    if (track.id !== id || track.first === null) return;
    if (cache.has(id)) return;

    const tokens = estimateTokens(text);
    if (tokens <= 0) return;

    const seconds = (Date.now() - track.first) / 1000;
    const metrics: TurnMetrics = {
      ttft: track.first - track.start,
      tokens,
      rate: seconds > 0.3 ? Math.round(tokens / seconds) : 0,
    };
    cache.set(id, metrics);
    setDone({ id, metrics });
  }, [running, id, text]);

  if (done && done.id === id) return done.metrics;
  return cache.get(id) ?? null;
}
