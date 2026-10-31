import { Easing } from 'react-native';

/**
 * CDS 动效物理参数
 * 来源：ClaudeMotionPresets.ts（framer-motion 生产配置逆向取证）
 * 二阶阻尼谐振子：m·x'' + c·x' + k·(x − x_target) = 0
 */
export const SPRING = {
  /** 麦克风按钮/语音条：超调 +8.8%（ζ≈0.612），也用于轻量微弹 */
  bouncy: { stiffness: 600, damping: 30, mass: 1 },
  /** 手势拖拽回弹：超调 +1.9%（ζ≈0.783），消息块入场默认 */
  snappy: { stiffness: 320, damping: 28, mass: 1 },
  /** 补位的中段弹性档位（非客户端观测值，仅补足设计序列） */
  gentle: { stiffness: 380, damping: 18, mass: 1 },
  /** 文件查看器面板宽度：绝对零过冲（ζ≈3.65） */
  heavySnap: { stiffness: 1200, damping: 80, mass: 0.1 },
  /** 用户气泡弹出：stiffness 450 / damping 24 */
  bubble: { stiffness: 450, damping: 24, mass: 1 },
} as const;

/** 时间尺度令牌 */
export const DURATION = {
  fast: 60,
  snap: 120,
  base: 200,
  sheet: 300,
  slow: 450,
  grapheme: 350,
} as const;

/** 贝塞尔缓动（RN 等价于 CSS cubic-bezier） */
export const EASE = {
  /** 幽灵按钮 / 高频微交互 */
  swift: Easing.bezier(0.16, 1, 0.3, 1),
  /** 折叠展开防抖 */
  expand: Easing.bezier(0.19, 1, 0.22, 1),
  /** 消息块入场消融 */
  enter: Easing.bezier(0.22, 1, 0.36, 1),
  /** 标准平滑出场 */
  out: Easing.bezier(0.165, 0.84, 0.44, 1),
  /** 磁吸快速对齐 */
  snap: Easing.bezier(0.32, 0.72, 0, 1),
  /** 经典机械果冻过冲 */
  overshoot: Easing.bezier(0.34, 1.3, 0.64, 1),
  /** 弹窗回弹 */
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** 思考三点呼吸脉冲 */
  pulse: Easing.bezier(0.4, 0, 0.2, 1),
} as const;

/** 消息上浮入场：opacity 0→1, y 12→0，SPRING.snappy */
export const ENTER_FADE_UP = {
  fromY: 12,
  fromOpacity: 0,
} as const;

/** 用户气泡入场：opacity 0→1, scale 0.94→1, y 8→0，SPRING.bubble */
export const ENTER_BUBBLE = {
  fromScale: 0.94,
  fromY: 8,
  fromOpacity: 0,
} as const;
