import { useEffect, useRef } from 'react';
import { Animated, Keyboard, PanResponder } from 'react-native';

import { DURATION, EASE } from '../cds/motion';

interface Options {
  open: boolean;
  /** 抽屉宽度（dp），用于把位移换算成进度 */
  panelWidth: number;
  onOpen: () => void;
  onClose: () => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** 关闭态只认右滑，打开态左右都能拖；横向位移占优才接管，避免抢列表滚动 */
const shouldPan = (dx: number, dy: number, open: boolean) => {
  if (Math.abs(dx) < 6) return false;
  if (Math.abs(dx) < Math.abs(dy) * 1.5) return false;
  return open || dx > 0;
};

/**
 * 会话抽屉的手势：同一个 Animated.Value 既给抽屉做 translateX，
 * 也给遮罩做透明度。抽屉内部（左滑关闭）和内容区（右滑拉出）共用这套 handlers。
 */
export function useDrawerGesture({ open, panelWidth, onOpen, onClose }: Options) {
  const progress = useRef(new Animated.Value(0)).current;
  const draggingRef = useRef(false);

  // PanResponder 只创建一次，闭包里读不到最新 props，统一走 ref
  const openRef = useRef(open);
  const widthRef = useRef(panelWidth);
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

  useEffect(() => {
    // 拖动中不打断，等手势自己收尾
    if (draggingRef.current) return;
    if (open) Keyboard.dismiss();
    animateTo(open);
  }, [open]);

  const panRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!panRef.current) {
    panRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => shouldPan(g.dx, g.dy, openRef.current),
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
        // 位移为主、速度做加权，快速轻扫也能吸附到目标态
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

  return { progress, handlers: panRef.current.panHandlers };
}
