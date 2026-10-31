import { Platform } from 'react-native';

/**
 * Claude Design System (CDS) tokens
 * 逆向取证基线：Claude Desktop @ant/desktop v2.37337.1（open-claude-ui / REA v6.5.0）
 * 仅消费令牌，不在组件内写死色值。
 */
export const cds = {
  clay: '#d97757',
  clayHover: '#cc5a36',
  clayLight: '#fbf3ef',
  brand: '#c6613f',

  surface0: '#f8f3e9',
  surface1: '#fbf7ef',
  surface2: '#ffffff',
  surface3: '#ffffff',
  popover: '#ffffff',

  alpha1: 'rgba(21,21,21,0.05)',
  alpha2: 'rgba(21,21,21,0.10)',
  alpha3: 'rgba(21,21,21,0.20)',
  alpha4: 'rgba(21,21,21,0.35)',

  border: 'rgba(21,21,21,0.10)',
  borderStrong: 'rgba(21,21,21,0.20)',

  textPrimary: '#151515',
  textSecondary: '#525252',
  textMuted: '#8a8a8a',

  userBubble: 'rgba(21,21,21,0.05)',
  segmentedTrack: 'rgba(0,0,0,0.06)',

  codeBg: '#0d0d0c',
  codeText: '#f5f5f5',
  codeMuted: '#9c9c96',

  cacheRead: '#2f9e75',
  cacheCreation: '#4a9ee8',
  tokenInput: '#d97757',
  tokenOutput: '#8b7fd4',

  success: '#2f9e75',
  warning: '#c98a2e',
  error: '#c64545',
} as const;

export const radius = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  panel: 10,
  xl: 12,
  xxl: 16,
  bubble: 18,
  composer: 20,
  pill: 999,
} as const;

export const gap = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const font = {
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
};

/** 排版 7 阶标尺（移动端等比收敛，桌面 display 38px → 移动 30px） */
export const text = {
  caption: { fontSize: 11, lineHeight: 16 },
  bodySm: { fontSize: 13, lineHeight: 20 },
  body: { fontSize: 14, lineHeight: 22 },
  bodyLg: { fontSize: 15, lineHeight: 24 },
  title: { fontSize: 17, lineHeight: 23 },
  display: { fontSize: 30, lineHeight: 38 },
  mono: { fontSize: 11.5, lineHeight: 17 },
  monoSm: { fontSize: 10.5, lineHeight: 15 },
  composer: { fontSize: 16, lineHeight: 22 },
} as const;

export const style = {
  body: {
    fontFamily: font.sans,
    ...text.body,
    color: cds.textPrimary,
  },
  secondary: {
    fontFamily: font.sans,
    ...text.bodySm,
    color: cds.textSecondary,
  },
  muted: {
    fontFamily: font.sans,
    ...text.caption,
    color: cds.textMuted,
  },
  mono: {
    fontFamily: font.mono,
    ...text.mono,
    color: cds.textSecondary,
  },
  monoSm: {
    fontFamily: font.mono,
    ...text.monoSm,
    color: cds.textMuted,
  },
  serif: {
    fontFamily: font.serif,
    ...text.display,
    color: cds.textPrimary,
    letterSpacing: -0.4,
  },
  /** 动态数字必须用等宽数字，杜绝水平抖动 */
  tabular: {
    fontVariant: ['tabular-nums'] as ('tabular-nums' | 'small-caps' | 'oldstyle-nums' | 'lining-nums' | 'proportional-nums')[],
  },
} as const;

/**
 * 阴影：CDS 为双层复合（近距微遮蔽 + 远距漫反射），RN 仅支持单层，
 * 取远距层为主、降低透明度以接近肉眼观感。
 */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  composer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  composerFocus: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  popover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  /** 拖拽/审批态：陶土漫射光晕 */
  clayGlow: {
    shadowColor: cds.clay,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;
