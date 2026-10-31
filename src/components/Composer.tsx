import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DURATION, EASE } from '../cds/motion';
import { cds, font, gap, radius, shadow, text } from '../cds/tokens';

interface Props {
  onSend: (text: string) => void;
  running: boolean;
  hint?: string;
  placeholder?: string;
}

export function Composer({
  onSend,
  running,
  hint = '演示模式 · 推理与工具由脚本模拟',
  placeholder = '问点 CloudBase 的事',
}: Props) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const canSend = value.trim().length > 0 && !running;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: DURATION.base,
      easing: EASE.swift,
      useNativeDriver: false,
    }).start();
  }, [focusAnim, focused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cds.border, cds.borderStrong],
  });

  const handleSend = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.field, focused ? shadow.composerFocus : shadow.composer, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={setValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={running ? '正在生成…' : placeholder}
          placeholderTextColor={cds.textMuted}
          style={styles.input}
          multiline
          maxLength={400}
          editable={!running}
          blurOnSubmit={false}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.send,
            canSend ? null : styles.sendOff,
            pressed && canSend ? styles.sendPressed : null,
          ]}
          hitSlop={6}
        >
          <Text style={[styles.sendGlyph, canSend ? null : styles.sendGlyphOff]}>↑</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: gap.lg,
    paddingTop: gap.sm,
    paddingBottom: gap.xs,
    backgroundColor: cds.surface1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.sm,
    backgroundColor: cds.surface3,
    borderRadius: radius.composer,
    borderWidth: 1,
    paddingLeft: gap.lg,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontFamily: font.sans,
    ...text.composer,
    color: cds.textPrimary,
    maxHeight: 110,
    paddingTop: 9,
    paddingBottom: 9,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cds.clay,
    marginBottom: 1,
  },
  sendPressed: {
    backgroundColor: cds.clayHover,
  },
  sendOff: {
    backgroundColor: cds.alpha1,
  },
  sendGlyph: {
    fontFamily: font.sans,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: -2,
  },
  sendGlyphOff: {
    color: cds.textMuted,
  },
  hint: {
    fontFamily: font.sans,
    fontSize: 11,
    lineHeight: 15,
    color: cds.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
