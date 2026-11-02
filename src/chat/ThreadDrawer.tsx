import { useEffect, useRef } from 'react';
import {
  Animated,
  Keyboard,
  PanResponder,
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
  onOpen: () => void;
  onClose: () => void;
  /** 退出真实对话，回到入口页 */
  onExit: () => void;
}

/**
 * 边缘滑动热区：Android 手势导航把最左侧约 16dp 划走做系统返回，
 * 热区从 16dp 起算，避免右滑拉抽屉时被系统抢走。
 */
const EDGE_LEFT = 16;
const EDGE_WIDTH = 30;
/** 手势判定：横向位移占优才接管，避免抢列表滚动 */
const shouldPan = (dx: number, dy: number) =>
  Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy) * 1.5;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
export function ThreadDrawer({ open, onOpen, onClose, onExit }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(312, width * 0.84);
  const progress = useRef(new Animated.Value(0)).current;

  // 供 PanResponder 读取最新值（它只创建一次，闭包会拿到旧值）
  const openRef = useRef(open);
  const widthRef = useRef(panelWidth);
  const draggingRef = useRef(false);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  openRef.current = open;
  widthRef.current = panelWidth;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  const animateTo = (toOpen: boolean) => {
    Animated.timing(progress, {
      toValue: toOpen ? 1 : 0,
      duration: toOpen ? DURATION.sheet : DURATION.base,
      easing: toOpen ? EASE.out : EASE.snap,
      useNativeDriver: true,
    }).start();
  };

  // 抽屉铺满屏高，先把键盘收起来；拖动中的状态变化交给手势自己收尾
  useEffect(() => {
    if (draggingRef.current) return;
    if (open) Keyboard.dismiss();
    animateTo(open);
  }, [open]);

  const panRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!panRef.current) {
    panRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => shouldPan(g.dx, g.dy),
      onPanResponderGrant: () => {
        draggingRef.current = true;
        progress.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const base = openRef.current ? widthRef.current : 0;
        progress.setValue(clamp01((base + g.dx) / widthRef.current));
      },
      onPanResponderRelease: (_, g) => {
        draggingRef.current = false;
        const w = widthRef.current;
        // 速度给一点加权，快速轻扫也能生效
        const next = (openRef.current ? w : 0) + g.dx + g.vx * 45;
        const shouldOpen = next > w * 0.42;

        if (shouldOpen === openRef.current) {
          animateTo(shouldOpen);
          return;
        }
        if (shouldOpen) onOpenRef.current();
        else onCloseRef.current();
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        animateTo(openRef.current);
      },
    });
  }
  const pan = panRef.current;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 关闭态：从左边缘右滑拉出 */}
      <View style={styles.edge} pointerEvents={open ? 'none' : 'auto'} {...pan.panHandlers} />

      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} {...pan.panHandlers} />
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
        {...pan.panHandlers}
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
  edge: {
    position: 'absolute',
    left: EDGE_LEFT,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
  },
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
