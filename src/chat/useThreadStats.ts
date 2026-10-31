import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuiState } from '@assistant-ui/react-native';

import { estimateTokens } from '../services/openai';
import type { Phase, TokenStats } from '../types';

type LoosePart = { type: string; text?: string };

/** 采样窗口：用最近 1.4s 的增量算瞬时速率，避免单个 chunk 抖动 */
const WINDOW_MS = 1400;
const TICK_MS = 250;

const textOf = (message: { content?: readonly LoosePart[] }) =>
  (message.content ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');

/** 从线程消息估算顶栏需要的 token 统计与阶段 */
export function useThreadStats(): { stats: TokenStats; phase: Phase } {
  const messages = useAuiState((s) => s.thread.messages);
  const running = useAuiState((s) => s.thread.isRunning);

  const { input, output } = useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    for (const message of messages) {
      const text = textOf(message as unknown as { content?: readonly LoosePart[] });
      if (!text) continue;
      if (message.role === 'user') inputTokens += estimateTokens(text);
      else if (message.role === 'assistant') outputTokens += estimateTokens(text);
    }
    return { input: inputTokens, output: outputTokens };
  }, [messages]);

  const [rate, setRate] = useState(0);

  const totalRef = useRef(input + output);
  const outputRef = useRef(output);
  const runningRef = useRef(running);
  totalRef.current = input + output;
  outputRef.current = output;
  runningRef.current = running;

  const samplesRef = useRef<{ t: number; total: number }[]>([]);
  const runRef = useRef({ started: false, startOutput: 0, startAt: 0 });

  // 定时采样：流式中给出瞬时速率，结束后定格为本轮平均速率
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      if (runningRef.current) {
        if (!runRef.current.started) {
          runRef.current = { started: true, startOutput: outputRef.current, startAt: now };
          samplesRef.current = [];
        }

        samplesRef.current.push({ t: now, total: totalRef.current });
        samplesRef.current = samplesRef.current.filter((sample) => now - sample.t < WINDOW_MS);

        if (samplesRef.current.length >= 2) {
          const first = samplesRef.current[0];
          const last = samplesRef.current[samplesRef.current.length - 1];
          const seconds = (last.t - first.t) / 1000;
          const delta = last.total - first.total;
          const next = seconds > 0 && delta > 0 ? Math.round(delta / seconds) : 0;
          setRate((prev) => (prev === next ? prev : next));
        }
        return;
      }

      if (runRef.current.started) {
        const seconds = (now - runRef.current.startAt) / 1000;
        const delta = outputRef.current - runRef.current.startOutput;
        runRef.current = { started: false, startOutput: 0, startAt: 0 };
        samplesRef.current = [];
        if (seconds > 0.4 && delta > 0) setRate(Math.round(delta / seconds));
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, []);

  const phase: Phase = running ? 'answering' : messages.length > 0 ? 'done' : 'idle';

  return {
    phase,
    stats: { cacheRead: 0, cacheCreation: 0, input, output, total: input + output, rate },
  };
}
