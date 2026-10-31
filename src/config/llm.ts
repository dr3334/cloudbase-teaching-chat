import type { LlmConfig } from '../services/openai';

const env = process.env as Record<string, string | undefined>;

/** 构建期可注入默认值：EXPO_PUBLIC_OPENAI_API_KEY / _BASE_URL / _MODEL */
export const llmDefaults: LlmConfig = {
  /** 内置的演示 token：ModelScope 兼容 OpenAI 协议，构建期可用 EXPO_PUBLIC_OPENAI_API_KEY 覆盖 */
  apiKey: env.EXPO_PUBLIC_OPENAI_API_KEY ?? 'ms-3f9c0985-bfc2-4f28-a68f-03f9a9929ae2',
  baseUrl: env.EXPO_PUBLIC_OPENAI_BASE_URL ?? 'https://api-inference.modelscope.cn/v1',
  model: env.EXPO_PUBLIC_OPENAI_MODEL ?? 'Qwen/Qwen3.8-Flash-Next',
  systemPrompt:
    '你是「CloudBase 教学助手」，用简体中文回答。回答要分点、简洁，涉及数学公式时使用 markdown 与 latex 代码块，代码使用带语言标记的代码块。',
};

/** 进程内保存（重启恢复为默认值，避免把密钥落盘） */
let current: LlmConfig = { ...llmDefaults };

export function getLlmConfig(): LlmConfig {
  return current;
}

export function saveLlmConfig(patch: Partial<LlmConfig>): LlmConfig {
  current = { ...current, ...patch };
  return current;
}

export function isLlmConfigured(): boolean {
  return current.apiKey.trim().length > 0;
}
