import type { SealDesign } from './types';

/**
 * 做旧（仿真盖印）合成算法。
 *
 * ★ 预览（scale = 1）与导出（scale = 3）调用**同一个** `applyAging`，
 *   所有几何量都按 `scale` 等比换算，保证视觉同源（F-41 / AC-20 / ADR-006）。
 *
 * 合成原理：
 * 1. 先把干净印章副本存下来；
 * 2. 用 `destination-in` 把半透明噪声纹理"啃掉"部分印泥；
 * 3. 用反向径向渐变遮罩，把磨损区域**之外**的干净印泥贴回去，
 *    从而实现"只在指定区域做旧"。
 */

/** 程序化噪声的随机种子（跨调用递进，避免每次纹理完全一致）。 */
let noiseSeed: number = Date.now();

/**
 * 线性同余伪随机数发生器（可复现、无外部依赖）。
 *
 * @param seed 初始种子。
 * @returns 返回 `[0, 1)` 随机数的函数，以及读取当前种子的方法。
 */
function createRandom(seed: number): { next: () => number; current: () => number } {
  let s = seed;
  return {
    next(): number {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    },
    current(): number {
      return s;
    },
  };
}

/**
 * 生成程序化噪声纹理（`sealNoisy.png` 缺失时的兜底路径，F-38 / ADR-006）。
 *
 * 三层叠加：
 * - 第 1 层：全幅纸纤维底噪（alpha 170–200，啃掉 22%–33% 印泥）；
 * - 第 2 层：不规则磨损斑块（alpha 60–160，啃掉 37%–76%）；
 * - 第 3 层：深色针孔麻点（alpha 30–90，啃掉 65%–88%）。
 *
 * @param size 纹理边长（像素，正方形）。
 * @param density 密度系数，取自 `wearLevel`（0.5 ~ 2）。
 * @returns 含 alpha 噪声的离屏 Canvas。
 */
export function generateProceduralNoise(size: number, density: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const nctx = c.getContext('2d');
  if (nctx === null) {
    return c;
  }

  const rng = createRandom(noiseSeed);
  const rand = rng.next;

  // ── 第 1 层：全幅纸纤维底噪 ──
  const idata = nctx.createImageData(size, size);
  const d = idata.data;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const i = (py * size + px) * 4;
      const a = 170 + Math.round(rand() * 30);
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = a;
    }
  }

  // ── 第 2 层：不规则磨损斑块 ──
  const patchCount = Math.floor(size * density * 0.5);
  for (let b = 0; b < patchCount; b++) {
    const bx = Math.floor(rand() * size);
    const by = Math.floor(rand() * size);
    const br = 2 + rand() * 12 * density;
    const minY = Math.max(0, Math.floor(by - br));
    const maxY = Math.min(size - 1, Math.ceil(by + br));
    const minX = Math.max(0, Math.floor(bx - br));
    const maxX = Math.min(size - 1, Math.ceil(bx + br));
    for (let qy = minY; qy <= maxY; qy++) {
      for (let qx = minX; qx <= maxX; qx++) {
        const dist = Math.sqrt((qx - bx) * (qx - bx) + (qy - by) * (qy - by));
        if (dist <= br) {
          const idx = (qy * size + qx) * 4;
          const t = dist / br;
          const patchAlpha = Math.round(60 + t * 100 + rand() * 30);
          if (patchAlpha < d[idx + 3]) {
            d[idx + 3] = patchAlpha;
          }
        }
      }
    }
  }

  // ── 第 3 层：深色针孔麻点 ──
  const pitCount = Math.floor(size * size * density * 0.008);
  for (let p = 0; p < pitCount; p++) {
    const px2 = Math.floor(rand() * size);
    const py2 = Math.floor(rand() * size);
    const pr = 0.3 + rand() * 2.5;
    const pminY = Math.max(0, Math.floor(py2 - pr));
    const pmaxY = Math.min(size - 1, Math.ceil(py2 + pr));
    const pminX = Math.max(0, Math.floor(px2 - pr));
    const pmaxX = Math.min(size - 1, Math.ceil(px2 + pr));
    for (let ry = pminY; ry <= pmaxY; ry++) {
      for (let rx = pminX; rx <= pmaxX; rx++) {
        const pdist = Math.sqrt((rx - px2) * (rx - px2) + (ry - py2) * (ry - py2));
        if (pdist <= pr) {
          const pidx = (ry * size + rx) * 4;
          const pt = pdist / pr;
          const pitAlpha = Math.round(30 + pt * 60);
          if (pitAlpha < d[pidx + 3]) {
            d[pidx + 3] = pitAlpha;
          }
        }
      }
    }
  }

  nctx.putImageData(idata, 0, 0);
  noiseSeed = rng.current();
  return c;
}

/**
 * 对已绘制好印章的 Canvas 施加做旧效果（原地修改）。
 *
 * 调用前置条件：`canvas` 的宽高必须等于 `design.sealSize * scale`，
 * 且已经把印章图形绘制进去（透明背景）。
 *
 * @param canvas 目标画布（原地修改）。
 * @param design 设计态（读取 wear* 与 realistic 字段）。
 * @param tex 同源加载好的噪声纹理 Canvas；为 `null` 时走程序化兜底。
 * @param scale 相对基准尺寸的放大倍数（预览 1，导出 3）。
 */
export function applyAging(
  canvas: HTMLCanvasElement,
  design: SealDesign,
  tex: HTMLCanvasElement | null,
  scale: number,
): void {
  if (!design.realistic) {
    return;
  }
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return;
  }

  const sz = canvas.width;
  if (sz <= 0) {
    return;
  }

  // 1. 保存干净副本
  const cleanCanvas = document.createElement('canvas');
  cleanCanvas.width = sz;
  cleanCanvas.height = sz;
  const cleanCtx = cleanCanvas.getContext('2d');
  if (cleanCtx === null) {
    return;
  }
  cleanCtx.drawImage(canvas, 0, 0);

  // 2. destination-in：用半透明纹理啃掉印泥
  const texScale = 0.8 + design.wearLevel * 0.6;
  const texSize = Math.max(sz * 1.2, sz);
  // 偏移按 scale 等比换算 —— 保证预览与导出的磨损落点相对一致
  const offsetX = Math.floor(Math.random() * 300) * scale;
  const offsetY = Math.floor(Math.random() * 300) * scale;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  if (tex !== null && tex.width > 0) {
    ctx.drawImage(tex, -offsetX, -offsetY, texSize * texScale, texSize * texScale);
  } else {
    const fallback = generateProceduralNoise(sz, design.wearLevel);
    ctx.drawImage(fallback, 0, 0);
  }
  ctx.restore();

  // 3. 反向径向遮罩：把磨损区域之外的干净印泥贴回
  const cxR = sz / 2 + design.wearX * scale;
  const cyR = sz / 2 + design.wearY * scale;
  const regionR = (sz / 2) * (design.wearSize / 100);
  const feather = design.wearFeather * scale;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = sz;
  maskCanvas.height = sz;
  const maskCtx = maskCanvas.getContext('2d');
  if (maskCtx === null) {
    return;
  }
  const invGrad = maskCtx.createRadialGradient(
    cxR,
    cyR,
    Math.max(0, regionR - feather * 0.3),
    cxR,
    cyR,
    regionR + feather,
  );
  invGrad.addColorStop(0, 'rgba(255,255,255,0)');
  invGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  invGrad.addColorStop(1, 'rgba(255,255,255,1)');
  maskCtx.fillStyle = invGrad;
  maskCtx.fillRect(0, 0, sz, sz);

  const restoreCanvas = document.createElement('canvas');
  restoreCanvas.width = sz;
  restoreCanvas.height = sz;
  const restoreCtx = restoreCanvas.getContext('2d');
  if (restoreCtx === null) {
    return;
  }
  restoreCtx.drawImage(cleanCanvas, 0, 0);
  restoreCtx.globalCompositeOperation = 'destination-in';
  restoreCtx.drawImage(maskCanvas, 0, 0);

  ctx.drawImage(restoreCanvas, 0, 0);
}

/**
 * 把 SVG 字符串转成同源 Blob URL 可加载的 `HTMLImageElement`。
 *
 * 该函数放在 `core/` 是为了让预览与导出复用同一段解码逻辑；
 * 使用 Blob URL 属同源，不会污染 Canvas（ADR-006 / 问题 014）。
 *
 * @param svg 完整 SVG 字符串。
 * @returns 解码完成的图片元素。
 * @throws 解码失败时抛出 `Error`。
 */
export function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = (): void => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (): void => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG 解码失败'));
    };
    img.src = url;
  });
}
