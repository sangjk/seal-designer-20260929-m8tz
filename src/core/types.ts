/**
 * 印章设计域模型（纯类型层）。
 *
 * ★ 硬性约束（架构设计 §7.3）：本文件字段名与网页版基线 `S` 对象**一一对齐、禁止改名**，
 *   以保证 `buildSvg.ts` 可 1:1 移植且预览/导出像素同源。
 * ★ 本目录（`src/core/`）**不得** import 任何 Vue / Tauri API。
 */

/** 印章外形。 */
export type Shape = 'circle' | 'ellipse' | 'square';

/** 印文类型：朱文（阳文，字为色）/ 白文（阴文，底为色、字反白）。 */
export type SealType = 'yangwen' | 'yinwen';

/** 排版风格：公章（环形）/ 方章（行列）/ 自由排版。 */
export type LayoutStyle = 'gongzhang' | 'fangzhang' | 'free';

/** 方章文字走向。 */
export type Arrangement = 'horizontal' | 'vertical';

/** 边框样式。 */
export type BorderStyle = 'double' | 'single' | 'none';

/** 中心元素样式。 */
export type CenterStyle = 'star' | 'text' | 'none';

/** 快速预设键。 */
export type PresetKey = 'company' | 'contract' | 'finance' | 'personal';

/** 导出格式。 */
export type ExportFormat = 'png' | 'svg';

/** 可增删文本行的归属类别。 */
export type TextRowKind = 'fang' | 'free';

/** 单个弧形排布字符的位置与旋转。 */
export interface ArcChar {
  /** 字符在画布上的 X 坐标。 */
  x: number;
  /** 字符在画布上的 Y 坐标。 */
  y: number;
  /** 以 (x, y) 为原点的旋转角度（度）。 */
  rotDeg: number;
  /** 字符本身。 */
  char: string;
}

/** 印章完整设计态。 */
export interface SealDesign {
  // ── 形状与类型 ──
  shape: Shape;
  sealType: SealType;
  layoutStyle: LayoutStyle;
  arrangement: Arrangement;

  // ── 边框 ──
  borderStyle: BorderStyle;
  borderGap: number;
  borderWidth: number;

  // ── 尺寸与字号 ──
  sealSize: number;
  fontSize: number;
  bottomFontSize: number;
  centerFontSize: number;
  starSize: number;

  // ── 弧形排布微调 ──
  topCharGap: number;
  bottomCharGap: number;
  topArcDeg: number;
  bottomArcDeg: number;
  topMargin: number;
  bottomMargin: number;

  // ── 中心区微调 ──
  centerLineGap: number;
  centerOffset: number;
  centerBottomGap: number;

  // ── 外观 ──
  sealColor: string;
  fontFamily: string;
  bold: boolean;

  // ── 中心元素 ──
  centerStyle: CenterStyle;
  centerSymbol: string;

  // ── 公章文本 ──
  arcTopText: string;
  arcBottomText: string;
  centerText1: string;
  centerText2: string;
  serialNumber: string;
  gongzhangSubText: string;

  // ── 方章文本 ──
  fangTexts: string[];
  fangzhangSubText: string;
  fangLineGap: number;

  // ── 自由排版文本 ──
  freeTexts: string[];
  freeSubText: string;
  freeSpacing: number;

  // ── 做旧 ──
  realistic: boolean;
  wearLevel: number;
  wearX: number;
  wearY: number;
  wearSize: number;
  wearFeather: number;
}

/** 数值区间定义（滑块 min/max/step 与 store 夹取共用）。 */
export interface Range {
  min: number;
  max: number;
  step: number;
}

/**
 * 单一数值区间真相源。
 * 滑块组件与 `constraints.clampDesign()` 共用，杜绝"UI 可拖到 store 不接受"的漂移。
 */
export const RANGES = {
  sealSize: { min: 200, max: 700, step: 5 },
  borderWidth: { min: 1, max: 20, step: 0.5 },
  borderGap: { min: 2, max: 30, step: 1 },
  fontSize: { min: 22, max: 100, step: 1 },
  topCharGap: { min: -8, max: 20, step: 0.5 },
  topArcDeg: { min: 120, max: 300, step: 5 },
  topMargin: { min: 0, max: 60, step: 1 },
  bottomFontSize: { min: 14, max: 60, step: 1 },
  bottomCharGap: { min: -5, max: 15, step: 0.5 },
  bottomArcDeg: { min: 90, max: 240, step: 5 },
  bottomMargin: { min: 0, max: 60, step: 1 },
  centerFontSize: { min: 20, max: 100, step: 1 },
  centerLineGap: { min: 0, max: 30, step: 1 },
  centerOffset: { min: 0, max: 50, step: 1 },
  centerBottomGap: { min: 0, max: 50, step: 1 },
  starSize: { min: 0, max: 260, step: 2 },
  freeSpacing: { min: 0, max: 40, step: 1 },
  fangLineGap: { min: 0, max: 40, step: 1 },
  wearLevel: { min: 0.5, max: 2, step: 0.05 },
  wearX: { min: -200, max: 200, step: 2 },
  wearY: { min: -200, max: 200, step: 2 },
  wearSize: { min: 20, max: 200, step: 5 },
  wearFeather: { min: 0, max: 60, step: 2 },
} as const satisfies Record<string, Range>;

/** 受区间约束的数值字段名。 */
export type RangeKey = keyof typeof RANGES;

/** 文本长度上限（F-11 ~ F-20）。 */
export const LIMITS = {
  arcTopText: 50,
  arcBottomText: 30,
  centerText: 16,
  serialNumber: 30,
  subText: 30,
  rowText: 20,
  centerSymbol: 4,
  maxRows: 8,
  minRows: 1,
} as const;

/** 导出栅格放大倍数（Q7：固定 3×）。 */
export const EXPORT_SCALE = 3;
