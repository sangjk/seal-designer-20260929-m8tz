import { LIMITS, RANGES, type LayoutStyle, type RangeKey, type SealDesign, type Shape } from './types';

/**
 * 参数联动约束与边界夹取（F-04 等）。
 *
 * 单一真相源：数值边界一律取自 `types.RANGES`，文本上限取自 `types.LIMITS`。
 * store 的每次写入都应经过本模块，杜绝「UI 能拖到但渲染不接受」的漂移。
 */

/**
 * 把数值夹取到区间内，并对齐到 step 网格。
 *
 * @param key 区间键。
 * @param value 原始值。
 * @returns 夹取并对齐后的数值；非有限数时回落到 `min`。
 */
export function clampRange(key: RangeKey, value: number): number {
  const range = RANGES[key];
  if (!Number.isFinite(value)) {
    return range.min;
  }
  const clamped = Math.min(range.max, Math.max(range.min, value));
  const steps = Math.round((clamped - range.min) / range.step);
  const snapped = range.min + steps * range.step;
  // 消除浮点累积误差（step 最小 0.05，保留两位足够）
  const fixed = Math.round(snapped * 100) / 100;
  return Math.min(range.max, Math.max(range.min, fixed));
}

/**
 * 截断文本到指定长度上限。
 *
 * @param text 原始文本。
 * @param max 最大字符数。
 * @returns 截断后的文本。
 */
export function clampText(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * 公章版式是否真正生效。
 *
 * 公章（环形排布）只在圆形 / 椭圆下有意义；方形时退化为其他版式。
 *
 * @param d 设计态。
 * @returns 公章版式生效返回 true。
 */
export function isGongzhangActive(d: SealDesign): boolean {
  return d.layoutStyle === 'gongzhang' && (d.shape === 'circle' || d.shape === 'ellipse');
}

/**
 * 切换形状时的联动处理（F-04）。
 *
 * 方形与公章（环形）版式互斥 —— 选择方形时自动切到方章版式。
 *
 * @param d 设计态（原地修改）。
 * @param shape 目标形状。
 */
export function applyShapeConstraint(d: SealDesign, shape: Shape): void {
  d.shape = shape;
  if (shape === 'square' && d.layoutStyle === 'gongzhang') {
    d.layoutStyle = 'fangzhang';
  }
}

/**
 * 切换版式时的联动处理（F-04）。
 *
 * 选择公章版式时，若当前是方形则自动切回圆形。
 *
 * @param d 设计态（原地修改）。
 * @param layout 目标版式。
 */
export function applyLayoutConstraint(d: SealDesign, layout: LayoutStyle): void {
  d.layoutStyle = layout;
  if (layout === 'gongzhang' && d.shape === 'square') {
    d.shape = 'circle';
  }
}

/**
 * 文本行数组是否还能继续增加。
 *
 * @param rows 当前行数组。
 * @returns 未达上限返回 true。
 */
export function canAddRow(rows: readonly string[]): boolean {
  return rows.length < LIMITS.maxRows;
}

/**
 * 文本行数组是否还能删除。
 *
 * @param rows 当前行数组。
 * @returns 高于下限返回 true。
 */
export function canRemoveRow(rows: readonly string[]): boolean {
  return rows.length > LIMITS.minRows;
}

/**
 * 把行数组夹取到 [minRows, maxRows] 且逐行截断长度。
 *
 * @param rows 原始行数组。
 * @returns 规范化后的新数组。
 */
export function clampRows(rows: readonly string[]): string[] {
  const trimmed = rows.slice(0, LIMITS.maxRows).map((r) => clampText(r, LIMITS.rowText));
  while (trimmed.length < LIMITS.minRows) {
    trimmed.push('');
  }
  return trimmed;
}

/** 需要逐一夹取的数值字段（与 `RANGES` 键集一致）。 */
const NUMERIC_KEYS: readonly RangeKey[] = Object.keys(RANGES) as RangeKey[];

/**
 * 对整份设计态做一次完整的边界规范化（数值夹取 + 文本截断 + 行数夹取 + 版式联动）。
 *
 * 该函数是**幂等**的：对已规范化的对象再次调用不会产生变化。
 *
 * @param d 设计态（原地修改）。
 * @returns 同一个对象引用，便于链式使用。
 */
export function clampDesign(d: SealDesign): SealDesign {
  for (const key of NUMERIC_KEYS) {
    d[key] = clampRange(key, d[key]);
  }

  d.arcTopText = clampText(d.arcTopText, LIMITS.arcTopText);
  d.arcBottomText = clampText(d.arcBottomText, LIMITS.arcBottomText);
  d.centerText1 = clampText(d.centerText1, LIMITS.centerText);
  d.centerText2 = clampText(d.centerText2, LIMITS.centerText);
  d.serialNumber = clampText(d.serialNumber, LIMITS.serialNumber);
  d.gongzhangSubText = clampText(d.gongzhangSubText, LIMITS.subText);
  d.fangzhangSubText = clampText(d.fangzhangSubText, LIMITS.subText);
  d.freeSubText = clampText(d.freeSubText, LIMITS.subText);
  d.centerSymbol = clampText(d.centerSymbol, LIMITS.centerSymbol);

  d.fangTexts = clampRows(d.fangTexts);
  d.freeTexts = clampRows(d.freeTexts);

  // 版式联动（方形不支持公章环形排布）
  if (d.shape === 'square' && d.layoutStyle === 'gongzhang') {
    d.layoutStyle = 'fangzhang';
  }

  return d;
}
