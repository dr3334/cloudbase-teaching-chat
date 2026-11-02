import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PanResponderInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAuiState,
} from '@assistant-ui/react-native';

import { cds, font, gap, radius, shadow } from '../cds/tokens';

interface Props {
  open: boolean;
  /** 由 useDrawerGesture 提供，抽屉与内容区共用同一份进度 */
  progress: Animated.Value;
  pan: PanResponderInstance['panHandlers'];
  onClose: () => void;
  /** 退出真实对话，回到入口页 */
  onExit: () => void;
}

/**
 * 左缘热区：Android 手势导航把最左侧约 16~20dp 划走做系统返回，
 * 从那里起滑会被系统截走，所以热区从 10dp 起、铺到 90dp。
 * 上下留白是为了不挡住顶栏按钮和底部输入区。
 */
const EDGE_LEFT = 10;
const EDGE_WIDTH = 80;
const EDGE_TOP = 56;
const EDGE_BOTTOM = 96;

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
export function ThreadDrawer({ open, progress, pan, onClose, onExit }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(312, width * 0.84);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* 关闭态：在消息区左缘右滑拉出 */}
      <View
        style={[styles.edge, { top: EDGE_TOP, bottom: insets.bottom + EDGE_BOTTOM }]}
        pointerEvents={open ? 'none' : 'auto'}
        {...pan}
      />

      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} {...pan} />
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
        {...pan}
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
