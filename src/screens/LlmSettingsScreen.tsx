import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { cds, font, gap, radius, text } from '../cds/tokens';
import { getLlmConfig, saveLlmConfig } from '../config/llm';
import { fetchModelList } from '../services/models';

interface FieldProps {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secure?: boolean;
  multiline?: boolean;
}

function Field({ label, hint, value, onChangeText, placeholder, secure, multiline }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={cds.textMuted}
        style={[styles.input, multiline ? styles.inputArea : null]}
        secureTextEntry={secure}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

interface Props {
  onSaved: () => void;
  onCancel?: () => void;
  /** 探测到的模型列表回调给上层，用于更新对话页的模型选择 */
  onModelsDiscovered?: (ids: string[]) => void;
}

export function LlmSettingsScreen({ onSaved, onCancel, onModelsDiscovered }: Props) {
  const initial = getLlmConfig();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [systemPrompt, setSystemPrompt] = useState(initial.systemPrompt);

  const canSave =
    apiKey.trim().length > 0 && baseUrl.trim().length > 0 && model.trim().length > 0;

  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState('');
  const [probed, setProbed] = useState<string[]>([]);

  const handleProbe = async () => {
    if (probing || !baseUrl.trim()) return;
    setProbing(true);
    setProbeError('');
    try {
      const { ids } = await fetchModelList(baseUrl, apiKey);
      setProbed(ids);
      onModelsDiscovered?.(ids);
    } catch (error) {
      setProbed([]);
      setProbeError(error instanceof Error ? error.message : '探测失败');
    } finally {
      setProbing(false);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    saveLlmConfig({ apiKey, baseUrl, model, systemPrompt });
    onSaved();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>连接真实模型</Text>
        <Text style={styles.sub}>
          兼容 OpenAI 协议的 /chat/completions 接口。密钥只在本次运行的内存中有效，不写入磁盘。
        </Text>

        <Field
          label="API Key"
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-..."
          secure
        />
        <Field
          label="Base URL"
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="https://api-inference.modelscope.cn/v1"
          hint="含 /v1，末尾不带斜杠；也可填自建代理地址"
        />
        <Field
          label="Model"
          value={model}
          onChangeText={setModel}
          placeholder="Qwen/Qwen3.8-Flash-Next"
          hint="例如 Qwen/Qwen3.8-Flash-Next / deepseek-ai/DeepSeek-V4.1-Flash"
        />

        <View style={styles.probeRow}>
          <Pressable
            onPress={handleProbe}
            disabled={probing || !baseUrl.trim()}
            style={({ pressed }) => [
              styles.probeBtn,
              probing || !baseUrl.trim() ? styles.probeBtnOff : null,
              pressed ? styles.probeBtnPressed : null,
            ]}
          >
            <Text style={styles.probeBtnText}>{probing ? '探测中…' : '探测可用模型'}</Text>
          </Pressable>
          {probed.length > 0 ? <Text style={styles.probeMeta}>共 {probed.length} 个</Text> : null}
        </View>

        {probeError ? <Text style={styles.probeError}>⚠ {probeError}</Text> : null}

        {probed.length > 0 ? (
          <View style={styles.modelList}>
            {probed.map((id) => {
              const active = id === model;

              return (
                <Pressable
                  key={id}
                  onPress={() => setModel(id)}
                  hitSlop={4}
                  style={styles.modelItem}
                >
                  <Text
                    style={[styles.modelId, active ? styles.modelIdOn : null]}
                    numberOfLines={1}
                  >
                    {id}
                  </Text>
                  {active ? <Text style={styles.modelCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Field
          label="System Prompt"
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="系统提示词"
          multiline
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.save,
            canSave ? null : styles.saveOff,
            pressed && canSave ? styles.savePressed : null,
          ]}
        >
          <Text style={[styles.saveText, canSave ? null : styles.saveTextOff]}>保存并开始对话</Text>
        </Pressable>

        {onCancel ? (
          <Pressable onPress={onCancel} style={styles.cancel} hitSlop={8}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        ) : null}

        <Text style={styles.note}>
          安全提示：客户端直连会把密钥放在设备上，任何人拿到安装包或调试权限都能提取。正式环境请把 Base URL
          指向你自己的后端代理，由服务端持有密钥。
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: cds.surface1,
  },
  wrap: {
    paddingHorizontal: gap.lg,
    paddingTop: gap.xl,
    paddingBottom: gap.xxl,
  },
  title: {
    fontFamily: font.serif,
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: cds.textPrimary,
  },
  sub: {
    fontFamily: font.sans,
    ...text.body,
    color: cds.textSecondary,
    marginTop: gap.sm,
    marginBottom: gap.lg,
  },
  field: {
    marginTop: gap.md,
  },
  probeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    marginTop: gap.md,
  },
  probeBtn: {
    paddingHorizontal: gap.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: cds.borderStrong,
    backgroundColor: cds.surface2,
  },
  probeBtnPressed: { backgroundColor: cds.surface0 },
  probeBtnOff: { opacity: 0.5 },
  probeBtnText: { fontFamily: font.sans, fontSize: 12, color: cds.textSecondary },
  probeMeta: { fontFamily: font.mono, fontSize: 10.5, color: cds.textMuted },
  probeError: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18,
    color: cds.error,
    marginTop: gap.sm,
  },
  modelList: {
    marginTop: gap.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cds.border,
    backgroundColor: cds.surface2,
    paddingVertical: gap.xs,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    paddingHorizontal: gap.md,
    paddingVertical: 7,
  },
  modelId: {
    flex: 1,
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 16,
    color: cds.textSecondary,
  },
  modelIdOn: { color: cds.brand, fontWeight: '600' },
  modelCheck: { fontFamily: font.sans, fontSize: 12, color: cds.clay },
  label: {
    fontFamily: font.mono,
    ...text.monoSm,
    letterSpacing: 0.6,
    color: cds.textMuted,
    marginBottom: gap.xs,
  },
  input: {
    fontFamily: font.mono,
    fontSize: 13,
    lineHeight: 19,
    color: cds.textPrimary,
    backgroundColor: cds.surface3,
    borderWidth: 1,
    borderColor: cds.border,
    borderRadius: radius.lg,
    paddingHorizontal: gap.md,
    paddingVertical: 11,
  },
  inputArea: {
    minHeight: 96,
    paddingTop: 11,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: font.sans,
    ...text.caption,
    color: cds.textMuted,
    marginTop: gap.xs,
  },
  save: {
    marginTop: gap.xl,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cds.clay,
  },
  savePressed: {
    backgroundColor: cds.clayHover,
  },
  saveOff: {
    backgroundColor: cds.alpha1,
  },
  saveText: {
    fontFamily: font.sans,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveTextOff: {
    color: cds.textMuted,
  },
  cancel: {
    marginTop: gap.md,
    alignItems: 'center',
    paddingVertical: gap.sm,
  },
  cancelText: {
    fontFamily: font.sans,
    ...text.bodySm,
    color: cds.textSecondary,
  },
  note: {
    fontFamily: font.sans,
    ...text.caption,
    lineHeight: 18,
    color: cds.textMuted,
    marginTop: gap.xl,
  },
});
