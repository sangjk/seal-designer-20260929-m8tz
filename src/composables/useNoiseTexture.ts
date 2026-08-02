import { readonly, ref, type DeepReadonly, type Ref } from 'vue';
import { generateProceduralNoise } from '@/core/aging';

/**
 * 做旧纹理懒加载（F-38 / ADR-006）。
 *
 * ★ 同源加载：`sealNoisy.png` 随 `frontendDist` 内嵌进 exe，由 WebView 以同源方式取得，
 *   `drawImage` 不会污染 Canvas，导出时 `toBlob('image/png')` 可正常工作（问题 014 / P2）。
 * ★ 缺失兜底：加载失败时回退到 `aging.generateProceduralNoise()` 的程序化三层噪声。
 *
 * 模块级单例：预览与导出共用同一份纹理，避免 3.7MB 资源被重复解码。
 */

/**
 * 纹理路径（同源，随打包内嵌）。
 *
 * 使用 `BASE_URL` 前缀而非裸相对路径：hash 路由下文档 URL 恒为 `/index.html`，
 * 裸相对路径虽可解析，但与支付二维码等静态资源的取址方式保持一致更利于维护。
 */
const TEXTURE_URL = `${import.meta.env.BASE_URL}textures/sealNoisy.png`;

/** 兜底程序化纹理的边长。 */
const FALLBACK_SIZE = 1024;

/** 兜底程序化纹理的密度系数。 */
const FALLBACK_DENSITY = 1;

const texture = ref<HTMLCanvasElement | null>(null);
const ready = ref<boolean>(false);
const usingFallback = ref<boolean>(false);
let loading: Promise<void> | null = null;

/**
 * 把已解码的图片绘制进离屏 Canvas。
 *
 * @param img 已解码图片。
 * @returns 承载纹理像素的 Canvas。
 */
function toCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || FALLBACK_SIZE;
  canvas.height = img.naturalHeight || FALLBACK_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx !== null) {
    ctx.drawImage(img, 0, 0);
  }
  return canvas;
}

/**
 * 加载同源纹理图片。
 *
 * @returns 解码完成的图片元素。
 * @throws 加载失败时抛出 `Error`。
 */
function loadImage(): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve(img);
    img.onerror = (): void => reject(new Error('噪声纹理加载失败'));
    // 同源资源，无需 crossOrigin；显式相对路径确保 hash 路由下也能命中
    img.src = TEXTURE_URL;
  });
}

/**
 * 触发一次纹理加载（幂等，多次调用共享同一个 Promise）。
 *
 * @returns 加载完成的 Promise（无论成功或走兜底都会 resolve）。
 */
function load(): Promise<void> {
  if (loading !== null) {
    return loading;
  }
  loading = (async (): Promise<void> => {
    try {
      const img = await loadImage();
      texture.value = toCanvas(img);
      usingFallback.value = false;
    } catch {
      texture.value = generateProceduralNoise(FALLBACK_SIZE, FALLBACK_DENSITY);
      usingFallback.value = true;
    } finally {
      ready.value = true;
    }
  })();
  return loading;
}

/** 纹理句柄。 */
export interface NoiseTextureApi {
  texture: DeepReadonly<Ref<HTMLCanvasElement | null>>;
  ready: DeepReadonly<Ref<boolean>>;
  usingFallback: DeepReadonly<Ref<boolean>>;
  load: () => Promise<void>;
  /** 取当前纹理的原始引用（供 core 纯函数使用，绕开 readonly 代理）。 */
  raw: () => HTMLCanvasElement | null;
}

/**
 * 取得做旧纹理句柄。
 *
 * @returns 纹理 API。
 */
export function useNoiseTexture(): NoiseTextureApi {
  return {
    texture: readonly(texture) as DeepReadonly<Ref<HTMLCanvasElement | null>>,
    ready: readonly(ready),
    usingFallback: readonly(usingFallback),
    load,
    raw: (): HTMLCanvasElement | null => texture.value,
  };
}
