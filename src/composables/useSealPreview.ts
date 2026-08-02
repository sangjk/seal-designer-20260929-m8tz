import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { applyAging, svgToImage } from '@/core/aging';
import { buildSvg } from '@/core/buildSvg';
import { useDesignStore } from '@/stores/design';
import { useNoiseTexture } from './useNoiseTexture';

/**
 * 实时预览编排（架构设计 §4.2）。
 *
 * 流程：参数变更 → 防抖 120ms → `buildSvg()` → 注入 SVG 容器
 *       →（realistic 时）解码 SVG 到 Canvas 并 `applyAging(scale=1)`。
 *
 * ★ 与导出共用 `buildSvg` + `applyAging`，杜绝第二套渲染实现（F-41 / AC-20）。
 */

/** 防抖间隔（毫秒）。 */
const DEBOUNCE_MS = 120;

/** 预览句柄。 */
export interface SealPreviewApi {
  /** SVG 宿主容器（矢量预览，未开启做旧时可见）。 */
  svgHost: Ref<HTMLDivElement | null>;
  /** 做旧位图画布（开启做旧时可见）。 */
  canvasEl: Ref<HTMLCanvasElement | null>;
  /** 当前 SVG 字符串（导出 SVG 与栅格化共用）。 */
  svgText: Ref<string>;
  /** 是否正在合成做旧位图。 */
  rendering: Ref<boolean>;
  /** 最近一次渲染是否失败。 */
  failed: Ref<boolean>;
  /** 立即重渲染（跳过防抖）。 */
  rerender: () => void;
}

/**
 * 创建预览编排。
 *
 * 必须在组件 `setup()` 中调用（内部注册了生命周期钩子）。
 *
 * @returns 预览句柄。
 */
export function useSealPreview(): SealPreviewApi {
  const store = useDesignStore();
  const { design } = storeToRefs(store);
  const noise = useNoiseTexture();

  const svgHost = ref<HTMLDivElement | null>(null);
  const canvasEl = ref<HTMLCanvasElement | null>(null);
  const svgText = ref<string>('');
  const rendering = ref<boolean>(false);
  const failed = ref<boolean>(false);

  let timer: number | null = null;
  let renderToken = 0;
  let disposed = false;

  /**
   * 把 SVG 字符串写入宿主容器。
   *
   * 安全性：SVG 完全由 `buildSvg` 内部拼接，所有用户文本均经 `escXml` 转义，
   * 不存在外来 HTML 注入面（架构设计 §4.2 备注）。
   *
   * @param svg SVG 字符串。
   */
  function mountSvg(svg: string): void {
    const host = svgHost.value;
    if (host === null) {
      return;
    }
    host.innerHTML = svg;
  }

  /**
   * 把 SVG 解码到画布并施加做旧（scale = 1）。
   *
   * @param svg SVG 字符串。
   * @param token 本次渲染的令牌，用于丢弃过期结果。
   */
  async function composeAged(svg: string, token: number): Promise<void> {
    const canvas = canvasEl.value;
    if (canvas === null) {
      return;
    }
    rendering.value = true;
    try {
      await noise.load();
      const img = await svgToImage(svg);
      if (token !== renderToken || disposed) {
        return;
      }
      const size = Math.max(1, Math.round(design.value.sealSize));
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        throw new Error('Canvas 2D 上下文不可用');
      }
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      applyAging(canvas, design.value, noise.raw(), 1);
      failed.value = false;
    } catch {
      failed.value = true;
    } finally {
      if (token === renderToken) {
        rendering.value = false;
      }
    }
  }

  /** 执行一次完整渲染。 */
  function render(): void {
    renderToken += 1;
    const token = renderToken;
    try {
      const svg = buildSvg(design.value);
      svgText.value = svg;
      mountSvg(svg);
      failed.value = false;
      if (design.value.realistic) {
        void composeAged(svg, token);
      }
    } catch {
      failed.value = true;
      rendering.value = false;
    }
  }

  /** 立即重渲染（取消挂起的防抖任务）。 */
  function rerender(): void {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    render();
  }

  /** 计划一次防抖渲染。 */
  function schedule(): void {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      timer = null;
      render();
    }, DEBOUNCE_MS);
  }

  watch(design, schedule, { deep: true });

  onMounted(() => {
    render();
    // 首屏后台预热纹理，避免用户首次勾选做旧时卡顿
    void noise.load();
  });

  onBeforeUnmount(() => {
    disposed = true;
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  });

  return { svgHost, canvasEl, svgText, rendering, failed, rerender };
}
