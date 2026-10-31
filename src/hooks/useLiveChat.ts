import { useCallback, useEffect, useRef, useState } from 'react';

import { getLlmConfig } from '../config/llm';
import {
  estimateTokens,
  streamChatCompletion,
  type ChatMessage,
  type StreamHandle,
} from '../services/openai';
import type { TokenStats, Turn } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

const EMPTY_STATS: TokenStats = {
  cacheRead: 0,
  cacheCreation: 0,
  input: 0,
  output: 0,
  total: 0,
  rate: 0,
};

/** 真实对话：直接把 OpenAI 兼容接口的增量写进现有 Turn/Block 结构 */
export function useLiveChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [stats, setStats] = useState<TokenStats>(EMPTY_STATS);
  const [running, setRunning] = useState(false);

  const turnsRef = useRef<Turn[]>([]);
  const handleRef = useRef<StreamHandle | null>(null);
  const runningRef = useRef(false);
  const samplesRef = useRef<{ t: number; total: number }[]>([]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  // 耗时刷新
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.phase === 'done' ? turn : { ...turn, elapsedMs: Date.now() - turn.startedAt },
        ),
      );
    }, 200);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(
    () => () => {
      handleRef.current?.abort();
    },
    [],
  );

  const readRate = () => {
    const now = Date.now();
    const recent = samplesRef.current.filter((s) => now - s.t < 1200);
    samplesRef.current = recent;
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = (last.t - first.t) / 1000;
    const delta = last.total - first.total;
    return dt > 0 && delta > 0 ? Math.round(delta / dt) : 0;
  };

  const send = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || runningRef.current) return;

    const config = getLlmConfig();
    const turnId = uid();
    const blockId = uid();
    const startedAt = Date.now();

    const history: ChatMessage[] = [{ role: 'system', content: config.systemPrompt }];
    for (const turn of turnsRef.current) {
      history.push({ role: 'user', content: turn.prompt });
      const answer = turn.blocks.find((block) => block.kind === 'answer');
      if (answer && answer.kind === 'answer' && answer.text) {
        history.push({ role: 'assistant', content: answer.text });
      }
    }
    history.push({ role: 'user', content: trimmed });

    const inputTokens = estimateTokens(trimmed);

    runningRef.current = true;
    samplesRef.current = [];
    setRunning(true);
    setTurns((prev) => [
      ...prev,
      {
        id: turnId,
        prompt: trimmed,
        phase: 'answering',
        startedAt,
        elapsedMs: 0,
        blocks: [{ kind: 'answer', id: blockId, text: '', tokens: 0, done: false }],
      },
    ]);
    setStats({ ...EMPTY_STATS, input: inputTokens, total: inputTokens });

    let acc = '';

    const patchAnswer = (updater: (text: string, tokens: number) => { text?: string; tokens?: number; done?: boolean }) => {
      setTurns((prev) =>
        prev.map((turn) => {
          if (turn.id !== turnId) return turn;
          return {
            ...turn,
            blocks: turn.blocks.map((block) => {
              if (block.id !== blockId || block.kind !== 'answer') return block;
              const patch = updater(block.text, block.tokens);
              return { ...block, ...patch };
            }),
          };
        }),
      );
    };

    const handle = streamChatCompletion(config, history, {
      onDelta: (delta) => {
        acc += delta;
        const output = estimateTokens(acc);
        const now = Date.now();
        samplesRef.current.push({ t: now, total: inputTokens + output });
        const rate = readRate();

        patchAnswer(() => ({ text: acc, tokens: output }));
        setStats({
          cacheRead: 0,
          cacheCreation: 0,
          input: inputTokens,
          output,
          total: inputTokens + output,
          rate,
        });
      },
      onDone: () => {
        handleRef.current = null;
        runningRef.current = false;
        const output = estimateTokens(acc);
        patchAnswer(() => ({ text: acc, tokens: output, done: true }));
        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === turnId
              ? { ...turn, phase: 'done', elapsedMs: Date.now() - turn.startedAt }
              : turn,
          ),
        );
        setRunning(false);
        setStats((prev) => ({ ...prev, rate: 0 }));
      },
      onError: (error) => {
        handleRef.current = null;
        runningRef.current = false;
        patchAnswer((text) => ({ text, done: true }));
        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  phase: 'done',
                  elapsedMs: Date.now() - turn.startedAt,
                  error: error.message,
                }
              : turn,
          ),
        );
        setRunning(false);
        setStats((prev) => ({ ...prev, rate: 0 }));
      },
    });

    handleRef.current = handle;
  }, []);

  const stop = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    runningRef.current = false;
    setRunning(false);
    setTurns((prev) =>
      prev.map((turn) =>
        turn.phase === 'done'
          ? turn
          : {
              ...turn,
              phase: 'done',
              elapsedMs: Date.now() - turn.startedAt,
              blocks: turn.blocks.map((block) =>
                block.kind === 'answer' ? { ...block, done: true } : block,
              ),
            },
      ),
    );
  }, []);

  const reset = useCallback(() => {
    handleRef.current?.abort();
    handleRef.current = null;
    runningRef.current = false;
    samplesRef.current = [];
    setTurns([]);
    setStats(EMPTY_STATS);
    setRunning(false);
  }, []);

  return { turns, stats, running, send, stop, reset };
}
