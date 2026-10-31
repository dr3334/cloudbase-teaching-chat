/**
 * 预置模型清单：取自 ModelScope 兼容 OpenAI 协议的可用模型。
 * 这里只放经过实测返回 200 的 id，避免切换后落到 no provider supported。
 */
export interface PresetModel {
  id: string;
  /** 选择器上展示的短名 */
  label: string;
  note: string;
}

export const presetModels: PresetModel[] = [
  { id: 'Qwen/Qwen3.8-Flash-Next', label: 'Qwen3.8 Flash', note: '通用 · 快' },
  { id: 'Qwen/Qwen3.5-397B-A17B', label: 'Qwen3.5 397B', note: '大参数 · 稳' },
  { id: 'deepseek-ai/DeepSeek-V4.1-Flash', label: 'DeepSeek V4.1', note: '推理 · 快' },
  { id: 'ZhipuAI/GLM-5.2', label: 'GLM-5.2', note: '中文 · 均衡' },
  { id: 'MiniMax/MiniMax-M3', label: 'MiniMax M3', note: '长上下文' },
];

export const shortModelName = (id: string) => {
  const preset = presetModels.find((model) => model.id === id);
  if (preset) return preset.label;
  const tail = id.split('/').pop() ?? id;
  return tail;
};
