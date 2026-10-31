import { useEffect, useRef } from 'react';
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAuiState,
} from '@assistant-ui/react-native';

import { DURATION, EASE } from '../cds/motion';
import { cds, font, gap, radius, shadow } from '../cds/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 退出真实对话，回到入口页 */
  onExit: () => void;
}

/** 单条会话：点击切换（按下即收起抽屉），右侧删除 */
function ThreadItemRow({ onClose }: { onClose: () => void }) {
  const active = useAuiState((s) => s.threads.mainThreadId === s.threadListItem.id);
  const title = useAuiState((s) => s.threadListItem.title);

  return (
    <View style={[styles.row, active ? styles.rowActive : null]}>
      <ThreadListItemPrimitive.Trigger style={styles.rowTrigger} onPressIn={onClose}>
        <Text
          numberOfLines={1}
          style={[styles.rowTitle, active ? styles.rowTitleActive : null]}
        >
          {title || '新对话'}
        </Text>
      </ThreadListItemPrimitive.Trigger>

      <ThreadListItemPrimitive.Delete style={styles.rowDelete} hitSlop={10}>
        <Text style={styles.rowDeleteText}>×</Text>
      </ThreadListItemPrimitive.Delete>
    </View>
  );
}

/**
 * 左侧会话抽屉：新建 / 切换 / 删除历史对话。
 * 结构对标主流 chat app —— 常驻挂载，靠 translateX + 遮罩透明度做进出场。
 */
export function ThreadDrawer({ open, onClose, onExit }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(312, width * 0.84);
  const progress = useRef(new Animated.Value(0)).current;

  // 抽屉铺满屏高，先把键盘收起来
  useEffect(() => {
    if (open) Keyboard.dismiss();
  }, [open]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? DURATION.sheet : DURATION.base,
      easing: open ? EASE.out : EASE.snap,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={open ? 'box-none' : 'none'}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            paddingBottom: Math.max(insets.bottom, gap.xl),
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.head}>
          <Text style={styles.headTitle}>对话</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.headClose}>
            <Text style={styles.headCloseText}>×</Text>
          </Pressable>
        </View>

        <ThreadListPrimitive.New style={styles.newButton} onPressIn={onClose}>
          <Text style={styles.newPlus}>＋</Text>
          <Text style={styles.newText}>新对话</Text>
        </ThreadListPrimitive.New>

        <ThreadListPrimitive.Items
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>还没有历史对话，发一条消息就会出现在这里。</Text>
          }
          renderItem={() => (
            <ThreadListItemPrimitive.Root>
              <ThreadItemRow onClose={onClose} />
            </ThreadListItemPrimitive.Root>
          )}
        />

        <View style={styles.foot}>
          <Pressable onPress={onExit} hitSlop={8} style={styles.footButton}>
            <Text style={styles.footText}>‹ 返回入口</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(21,21,21,0.32)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: cds.surface1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: cds.border,
    paddingTop: gap.md,
    ...shadow.popover,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gap.lg,
    paddingBottom: gap.sm,
  },
  headTitle: {
    fontFamily: font.serif,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: cds.textPrimary,
  },
  headClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headCloseText: {
    fontFamily: font.sans,
    fontSize: 18,
    lineHeight: 20,
    color: cds.textMuted,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.sm,
    marginHorizontal: gap.sm,
    marginTop: gap.xs,
    paddingHorizontal: gap.md,
    paddingVertical: gap.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cds.border,
    backgroundColor: cds.surface2,
  },
  newPlus: {
    fontFamily: font.sans,
    fontSize: 14,
    lineHeight: 18,
    color: cds.clay,
  },
  newText: {
    fontFamily: font.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: cds.textPrimary,
  },
  list: { flex: 1, marginTop: gap.md },
  listContent: { paddingHorizontal: gap.sm, paddingBottom: gap.md },
  empty: {
    fontFamily: font.sans,
    fontSize: 12,
    lineHeight: 18,
    color: cds.textMuted,
    paddingHorizontal: gap.md,
    paddingTop: gap.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    marginBottom: 2,
  },
  rowActive: { backgroundColor: cds.alpha1 },
  rowTrigger: {
    flex: 1,
    paddingVertical: gap.sm,
    paddingLeft: gap.md,
    paddingRight: gap.xs,
  },
  rowTitle: {
    fontFamily: font.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: cds.textSecondary,
  },
  rowTitleActive: { color: cds.textPrimary },
  rowDelete: {
    width: 30,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: gap.xxs,
  },
  rowDeleteText: {
    fontFamily: font.sans,
    fontSize: 15,
    lineHeight: 18,
    color: cds.textMuted,
  },
  foot: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cds.border,
    paddingTop: gap.sm,
    paddingHorizontal: gap.lg,
  },
  footButton: { paddingVertical: gap.sm },
  footText: {
    fontFamily: font.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: cds.textSecondary,
  },
});
