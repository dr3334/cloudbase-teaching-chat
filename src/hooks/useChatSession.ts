import { useCallback, useEffect, useRef, useState } from 'react';

import { buildDemo } from '../mock/demoScript';
import type { Block, Phase, TokenStats, Turn } from '../types';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

const EMPTY_STATS: TokenStats = {
  cacheRead: 0,
  cacheCreation: 0,
  input: 0,
  output: 0,
  total: 0,
  rate: 0,
};

/** 首轮请求的 prompt cache 基线：教学演示中体现缓存命中与写入 */
const CACHE_BASELINE = { read: 1240, creation: 380 };

/** 流式生成速率（tokens/秒）：固定值，时长由 token 数反推 */
const TOKENS_PER_SECOND = 200;
/** 每帧推送间隔，约 25fps，保证 200/s 下仍然平滑 */
const STREAM_TICK_MS = 40;

export function useChatSession() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [stats, setStats] = useState<TokenStats>(EMPTY_STATS);
  const [running, setRunning] = useState(false);

  const runIdRef = useRef(0);
  const countersRef = useRef({
    cacheRead: 0,
    cacheCreation: 0,
    input: 0,
    output: 0,
    total: 0,
  });
  const samplesRef = useRef<{ t: number; total: number }[]>([]);
  const rateRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      const recent = samplesRef.current.filter((s) => now - s.t < 1200);
      samplesRef.current = recent;
      if (recent.length >= 2) {
        const first = recent[0];
        const last = recent[recent.length - 1];
        const dt = (last.t - first.t) / 1000;
        const delta = last.total - first.total;
        rateRef.current = dt > 0 && delta > 0 ? delta / dt : 0;
      } else {
        rateRef.current = 0;
      }

      setStats((prev) =>
        prev.rate === Math.round(rateRef.current)
          ? prev
          : { ...prev, rate: Math.round(rateRef.current) },
      );

      setTurns((prev) => {
        let changed = false;
        const next = prev.map((turn) => {
          if (turn.phase === 'done') return turn;
          const elapsedMs = Date.now() - turn.startedAt;
          if (Math.abs(elapsedMs - turn.elapsedMs) < 90) return turn;
          changed = true;
          return { ...turn, elapsedMs };
        });
        return changed ? next : prev;
      });
    }, 220);

    return () => clearInterval(timer);
  }, []);

  const syncStats = useCallback((addInput: number, addOutput: number) => {
    const counters = countersRef.current;
    counters.input += addInput;
    counters.output += addOutput;
    counters.total =
      counters.cacheRead + counters.cacheCreation + counters.input + counters.output;

    samplesRef.current.push({ t: Date.now(), total: counters.total });

    setStats({
      cacheRead: counters.cacheRead,
      cacheCreation: counters.cacheCreation,
      input: counters.input,
      output: counters.output,
      total: counters.total,
      rate: Math.round(rateRef.current),
    });
  }, []);

  const patchTurn = useCallback((turnId: string, updater: (turn: Turn) => Turn) => {
    setTurns((prev) => prev.map((turn) => (turn.id === turnId ? updater(turn) : turn)));
  }, []);

  const patchBlock = useCallback(
    (turnId: string, blockId: string, updater: (block: Block) => Block) => {
      patchTurn(turnId, (turn) => ({
        ...turn,
        blocks: turn.blocks.map((block) => (block.id === blockId ? updater(block) : block)),
      }));
    },
    [patchTurn],
  );

  const send = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      const runId = ++runIdRef.current;
      const turnId = uid();
      const startedAt = Date.now();

      // 首轮命中 prompt cache：只在实际请求时计入
      if (countersRef.current.cacheRead === 0) {
        countersRef.current.cacheRead = CACHE_BASELINE.read;
        countersRef.current.cacheCreation = CACHE_BASELINE.creation;
      }

      setRunning(true);
      setTurns((prev) => [
        ...prev,
        { id: turnId, prompt: trimmed, blocks: [], phase: 'thinking', startedAt, elapsedMs: 0 },
      ]);
      syncStats(Math.max(8, Math.round(trimmed.length * 1.7)), 0);

      const cancelled = () => runIdRef.current !== runId;
      const setPhase = (phase: Phase) =>
        patchTurn(turnId, (turn) => (turn.phase === phase ? turn : { ...turn, phase }));

      const streamText = async (
        blockId: string,
        text: string,
        tokens: number,
        kind: 'thinking' | 'answer',
      ) => {
        const total = Math.max(1, text.length);
        // 目标时长由 token 数决定：tokens / 200 秒
        const duration = Math.max(STREAM_TICK_MS, (tokens / TOKENS_PER_SECOND) * 1000);
        const startedAt = Date.now();
        let emitted = 0;
        let shownChars = 0;

        // 按真实时钟推进，而不是固定步数：渲染开销不会把速率拖慢
        for (;;) {
          if (cancelled()) return false;

          const progress = Math.min(1, (Date.now() - startedAt) / duration);
          const chars = Math.round(total * progress);
          const tok = Math.round(tokens * progress);

          if (chars > shownChars || tok > emitted) {
            shownChars = chars;
            patchBlock(turnId, blockId, (block) =>
              block.kind === 'thinking' || block.kind === 'answer'
                ? { ...block, text: text.slice(0, chars), tokens: tok }
                : block,
            );
            if (tok > emitted) {
              syncStats(0, tok - emitted);
              emitted = tok;
            }
          }

          if (progress >= 1) break;
          await sleep(STREAM_TICK_MS);
        }

        if (cancelled()) return false;
        patchBlock(turnId, blockId, (block) =>
          block.kind === 'thinking' || block.kind === 'answer'
            ? { ...block, text, tokens, done: true }
            : block,
        );
        if (emitted < tokens) syncStats(0, tokens - emitted);
        void kind;
        return true;
      };

      const events = buildDemo(trimmed);

      for (const event of events) {
        if (cancelled()) return;

        if (event.type === 'thinking') {
          setPhase('thinking');
          const blockId = uid();
          patchTurn(turnId, (turn) => ({
            ...turn,
            blocks: [
              ...turn.blocks,
              { kind: 'thinking', id: blockId, text: '', tokens: 0, done: false },
            ],
          }));
          const ok = await streamText(blockId, event.text, event.tokens, 'thinking');
          if (!ok) return;
          continue;
        }

        if (event.type === 'tool') {
          setPhase('tool');
          const blockId = uid();
          patchTurn(turnId, (turn) => ({
            ...turn,
            blocks: [
              ...turn.blocks,
              {
                kind: 'tool',
                id: blockId,
                ...event.tool,
                status: 'running',
                tokens: 0,
                startedAt: Date.now(),
              },
            ],
          }));

          await sleep(event.durationMs);
          if (cancelled()) return;

          patchBlock(turnId, blockId, (block) =>
            block.kind === 'tool'
              ? {
                  ...block,
                  status: 'success',
                  result: event.result,
                  tokens: event.tokens,
                  durationMs: Date.now() - block.startedAt,
                }
              : block,
          );
          syncStats(event.tokens, 0);
          continue;
        }

        setPhase('answering');
        const blockId = uid();
        patchTurn(turnId, (turn) => ({
          ...turn,
          blocks: [...turn.blocks, { kind: 'answer', id: blockId, text: '', tokens: 0, done: false }],
        }));
        const ok = await streamText(blockId, event.text, event.tokens, 'answer');
        if (!ok) return;
      }

      if (cancelled()) return;
      patchTurn(turnId, (turn) => ({
        ...turn,
        phase: 'done',
        elapsedMs: Date.now() - turn.startedAt,
      }));
      setRunning(false);
    },
    [patchBlock, patchTurn, syncStats],
  );

  const reset = useCallback(() => {
    runIdRef.current += 1;
    countersRef.current = { cacheRead: 0, cacheCreation: 0, input: 0, output: 0, total: 0 };
    samplesRef.current = [];
    rateRef.current = 0;
    setTurns([]);
    setStats(EMPTY_STATS);
    setRunning(false);
  }, []);

  return { turns, stats, running, send, reset };
}
