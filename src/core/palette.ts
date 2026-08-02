/**
 * 印色调色板（F-28 / F-29）。
 *
 * ★ 说明（架构设计 §7.2 颜色双轨）：本文件的 hex 是**业务数据**（印泥颜色，属于产品功能），
 *   与 `src/styles/tokens.css` 的 Paper Design UI Token 是两套体系。
 *   QA 扫描"组件内硬编码 hex"时**豁免本文件**。
 */

/** 单个印色项。 */
export interface InkColor {
  /** 中文显示名。 */
  name: string;
  /** 十六进制色值。 */
  value: string;
}

/** 默认印色（暗朱红）。 */
export const DEFAULT_INK = '#c23b3b';

/**
 * 阴文印面的字色（留白成字，字为纸色）。
 *
 * 阴文渲染时印色铺满印面、文字反白，故字色固定为白，与用户选择的印色无关。
 */
export const YINWEN_INK = '#ffffff';

/** 七色印色预设表。 */
export const INK_COLORS: readonly InkColor[] = [
  { name: '朱红', value: '#FF0000' },
  { name: '暗红', value: '#8B1A1A' },
  { name: '砖红', value: '#B22222' },
  { name: '墨黑', value: '#1A1A1A' },
  { name: '藏蓝', value: '#1A3A6B' },
  { name: '墨绿', value: '#2D5A27' },
  { name: '紫', value: '#6B3A8B' },
] as const;

/**
 * 判断给定色值是否属于预设印色（大小写不敏感）。
 *
 * @param hex 待判定色值。
 * @returns 命中预设返回 true。
 */
export function isPresetInk(hex: string): boolean {
  const target = hex.trim().toLowerCase();
  return INK_COLORS.some((c) => c.value.toLowerCase() === target);
}
