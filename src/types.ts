export type Phase = 'idle' | 'thinking' | 'tool' | 'answering' | 'done';

export type ToolStatus = 'running' | 'success' | 'error';

export interface ToolMeta {
  name: string;
  server: string;
  args: Record<string, string>;
  summary?: string;
}

export interface ThinkingBlock {
  kind: 'thinking';
  id: string;
  text: string;
  tokens: number;
  done: boolean;
}

export interface ToolBlock extends ToolMeta {
  kind: 'tool';
  id: string;
  status: ToolStatus;
  result?: string;
  tokens: number;
  durationMs?: number;
  startedAt: number;
}

export interface AnswerBlock {
  kind: 'answer';
  id: string;
  text: string;
  tokens: number;
  done: boolean;
}

export type Block = ThinkingBlock | ToolBlock | AnswerBlock;

export interface Turn {
  id: string;
  prompt: string;
  blocks: Block[];
  phase: Phase;
  startedAt: number;
  elapsedMs: number;
  /** 真实链路请求失败时的提示 */
  error?: string;
}

export interface TokenStats {
  /** 命中缓存的输入（翡翠绿，0.1x 计价） */
  cacheRead: number;
  /** 写入缓存的输入（天空蓝，1.25x 计价） */
  cacheCreation: number;
  /** 新增输入（陶土橙，1x 计价） */
  input: number;
  /** 模型输出（紫罗兰，1x 计价） */
  output: number;
  total: number;
  rate: number;
}

/** 演示模式与真实对话共用的会话契约 */
export interface ChatSession {
  turns: Turn[];
  stats: TokenStats;
  running: boolean;
  send: (text: string) => void;
  reset: () => void;
}

export type DemoEvent =
  | { type: 'thinking'; text: string; tokens: number }
  | {
      type: 'tool';
      tool: ToolMeta;
      durationMs: number;
      result: string;
      tokens: number;
    }
  | { type: 'answer'; text: string; tokens: number };
