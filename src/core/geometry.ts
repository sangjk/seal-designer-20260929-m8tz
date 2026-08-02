import type { ArcChar } from './types';

/**
 * 几何与 SVG 片段工具（纯函数，零依赖）。
 *
 * ★ 全部算法自网页版基线 1:1 移植，坐标/角度约定不得更改，
 *   否则预览与导出会与既有印章效果产生视觉漂移。
 */

/**
 * 生成十角星（五角星轮廓）多边形的 `points` 属性字符串。
 *
 * 角度自正上方（-90°）起，每 36° 一个顶点，外/内半径交替。
 *
 * @param cx 星形中心 X。
 * @param cy 星形中心 Y。
 * @param outerR 外接半径。
 * @param innerR 内凹半径（惯例取 `outerR * 0.38`）。
 * @returns 形如 `"x1,y1 x2,y2 ..."` 的点串。
 */
export function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = ((-90 + i * 36) * Math.PI) / 180;
    pts.push(`${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

/**
 * 生成圆角矩形的 SVG path `d` 字符串。
 *
 * @param x 左上角 X。
 * @param y 左上角 Y。
 * @param w 宽度。
 * @param h 高度。
 * @param r 圆角半径。
 * @returns path 的 `d` 属性值。
 */
export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M${x + r},${y}` +
    `L${x + w - r},${y}` +
    `Q${x + w},${y} ${x + w},${y + r}` +
    `L${x + w},${y + h - r}` +
    `Q${x + w},${y + h} ${x + w - r},${y + h}` +
    `L${x + r},${y + h}` +
    `Q${x},${y + h} ${x},${y + h - r}` +
    `L${x},${y + r}` +
    `Q${x},${y} ${x + r},${y}` +
    'Z'
  );
}

/**
 * 计算弧形排布中每个字符的位置与旋转角。
 *
 * SVG 坐标系为 y 向下、角度自 +x 轴顺时针：
 * - 顶部弧中心角 = -π/2；底部弧中心角 = +π/2。
 * - 顶部文字沿切线方向（朝外可读）；底部文字切线 + π（朝外正立）。
 *
 * @param text 待排布文本。
 * @param cx 弧心 X。
 * @param cy 弧心 Y。
 * @param baseR 基准半径。
 * @param arcDeg 弧张角（度）。
 * @param side `'top'` 顶部弧 / `'bottom'` 底部弧。
 * @param isEllipse 椭圆形状时 Y 方向按 0.75 压缩。
 * @param offset 半径偏移（正值外扩）。
 * @param charSpacing 字间附加角度（度）。
 * @returns 每个字符的位置与旋转信息数组。
 */
export function computeArcChars(
  text: string,
  cx: number,
  cy: number,
  baseR: number,
  arcDeg: number,
  side: 'top' | 'bottom',
  isEllipse: boolean,
  offset: number,
  charSpacing: number,
): ArcChar[] {
  const chars = text.split('');
  const n = chars.length;
  const results: ArcChar[] = [];
  if (n === 0) {
    return results;
  }

  const aspect = isEllipse ? 0.75 : 1.0;
  const R = baseR + offset;

  const centerAngle = side === 'top' ? -Math.PI / 2 : Math.PI / 2;
  const halfArc = ((arcDeg / 2) * Math.PI) / 180;
  const totalArc = 2 * halfArc + (charSpacing * (n - 1) * Math.PI) / 180;
  const startAngle = centerAngle - totalArc / 2;
  const stepAngle = n > 1 ? totalArc / (n - 1) : 0;

  for (let i = 0; i < n; i++) {
    const theta = startAngle + i * stepAngle;

    const posX = cx + R * Math.cos(theta);
    const posY = cy + R * aspect * Math.sin(theta);

    // 椭圆切向量：(-R·sinθ, R·aspect·cosθ)
    const tx = -R * Math.sin(theta);
    const ty = R * aspect * Math.cos(theta);
    const tangentAngle = Math.atan2(ty, tx);

    const rotRad = side === 'top' ? tangentAngle : tangentAngle + Math.PI;
    const rotDeg = (rotRad * 180) / Math.PI;

    results.push({ x: posX, y: posY, rotDeg, char: chars[i] });
  }
  return results;
}

/**
 * XML 文本转义（用于 SVG `<text>` 内容与属性值）。
 *
 * @param s 原始文本。
 * @returns 转义后的安全文本。
 */
export function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
