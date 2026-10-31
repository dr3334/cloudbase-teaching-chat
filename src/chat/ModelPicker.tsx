import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cds, font, gap, radius, shadow } from '../cds/tokens';
import { shortModelName } from '../config/models';

interface Props {
  current: string;
  models: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

/** 模型列表：入口是一枚按钮，点开是底部抽屉列表，切换后下一条消息即用新模型 */
export function ModelPicker({ current, models, onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <>
      <View style={styles.bar}>
        <Pressable
          onPress={() => setOpen(true)}
          disabled={disabled}
          hitSlop={6}
          style={({ pressed }) => [
            styles.trigger,
            disabled ? styles.triggerOff : null,
            pressed && !disabled ? styles.triggerPressed : null,
          ]}
        >
          <View style={styles.dot} />
          <Text style={styles.triggerText}>{shortModelName(current)}</Text>
          <Text style={styles.caret}>▾</Text>
        </Pressable>

        <Text style={styles.count}>{models.length} 个模型</Text>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>选择模型</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.sheetClose}>关闭</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {models.map((id) => {
                const active = id === current;

                return (
                  <Pressable
                    key={id}
                    onPress={() => choose(id)}
                    style={({ pressed }) => [
                      styles.item,
                      active ? styles.itemOn : null,
                      pressed && !active ? styles.itemPressed : null,
                    ]}
                  >
                    <View style={styles.itemMain}>
                      <Text style={[styles.itemName, active ? styles.itemNameOn : null]}>
                        {shortModelName(id)}
                      </Text>
                      <Text style={styles.itemId} numberOfLines={1}>
                        {id}
                      </Text>
                    </View>
                    {active ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gap.lg,
    paddingBottom: gap.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: gap.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(217,119,87,0.45)',
    backgroundColor: cds.clayLight,
  },
  triggerPressed: { backgroundColor: cds.surface0 },
  triggerOff: { opacity: 0.5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: cds.clay },
  triggerText: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: cds.brand,
  },
  caret: { fontFamily: font.sans, fontSize: 10, color: cds.brand, marginTop: -1 },
  count: { fontFamily: font.mono, fontSize: 10.5, color: cds.textMuted },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(21,21,21,0.28)',
  },
  sheet: {
    maxHeight: '62%',
    backgroundColor: cds.surface2,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: gap.lg,
    paddingBottom: gap.xl,
    ...shadow.popover,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gap.lg,
    paddingBottom: gap.md,
  },
  sheetTitle: {
    fontFamily: font.sans,
    fontSize: 15,
    fontWeight: '600',
    color: cds.textPrimary,
  },
  sheetClose: { fontFamily: font.sans, fontSize: 12, color: cds.textMuted },
  list: { paddingHorizontal: gap.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    paddingHorizontal: gap.md,
    paddingVertical: gap.md,
    borderRadius: radius.lg,
  },
  itemOn: { backgroundColor: cds.clayLight },
  itemPressed: { backgroundColor: cds.surface0 },
  itemMain: { flex: 1, gap: 2 },
  itemName: {
    fontFamily: font.sans,
    fontSize: 14,
    lineHeight: 20,
    color: cds.textPrimary,
  },
  itemNameOn: { color: cds.brand, fontWeight: '600' },
  itemId: { fontFamily: font.mono, fontSize: 10.5, lineHeight: 14, color: cds.textMuted },
  check: { fontFamily: font.sans, fontSize: 13, color: cds.clay },
});
