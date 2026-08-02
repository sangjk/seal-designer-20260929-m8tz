import type { SealDesign } from './types';
import { applyAging, svgToImage } from './aging';

/**
 * SVG → 高清透明 PNG 栅格化（Q7：固定 3×）。
 *
 * ★ 与预览共用 `buildSvg` + `applyAging`，不存在第二套渲染实现（D1 / ADR-007）。
 * ★ 纹理为同源资源，`drawImage` 不会污染 Canvas，`toBlob('image/png')` 可正常工作
 *   （ADR-006 / 项目坑 P2）。
 */

/**
 * 把 Canvas 编码为 PNG 字节数组。
 *
 * @param canvas 源画布。
 * @returns PNG 字节数组。
 * @throws 编码失败时抛出 `Error`。
 */
function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error('PNG 编码失败'));
        return;
      }
      blob
        .arrayBuffer()
        .then((buf) => resolve(new Uint8Array(buf)))
        .catch(() => reject(new Error('PNG 字节读取失败')));
    }, 'image/png');
  });
}

/**
 * 将 SVG 字符串渲染为放大若干倍的透明 PNG 字节数组。
 *
 * @param svg 由 `buildSvg` 产出的 SVG 字符串。
 * @param design 设计态（用于做旧参数与基准尺寸）。
 * @param tex 同源噪声纹理；为 `null` 时做旧走程序化兜底。
 * @param scale 放大倍数（默认业务约定 3）。
 * @returns PNG 字节数组，可直接交给 Rust `export_png` 落盘。
 * @throws SVG 解码 / Canvas 不可用 / PNG 编码失败时抛出 `Error`。
 */
export async function renderPng(
  svg: string,
  design: SealDesign,
  tex: HTMLCanvasElement | null,
  scale: number,
): Promise<Uint8Array> {
  const img = await svgToImage(svg);
  const sz = Math.max(1, Math.round(design.sealSize * scale));

  const canvas = document.createElement('canvas');
  canvas.width = sz;
  canvas.height = sz;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('Canvas 2D 上下文不可用');
  }

  ctx.clearRect(0, 0, sz, sz);
  ctx.drawImage(img, 0, 0, sz, sz);

  if (design.realistic) {
    try {
      applyAging(canvas, design, tex, scale);
    } catch {
      // 做旧失败时降级为干净导出，不阻断用户（与网页版行为一致）
      ctx.clearRect(0, 0, sz, sz);
      ctx.drawImage(img, 0, 0, sz, sz);
    }
  }

  return canvasToPngBytes(canvas);
}

/**
 * 生成默认导出文件名。
 *
 * @param ext 扩展名（不含点），如 `png` / `svg`。
 * @returns 形如 `seal_1722568800000.png` 的 ASCII 文件名。
 */
export function defaultExportFileName(ext: string): string {
  return `seal_${Date.now()}.${ext}`;
}
