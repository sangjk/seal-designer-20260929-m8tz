<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useNoiseTexture } from '@/composables/useNoiseTexture';
import { useSealPreview } from '@/composables/useSealPreview';
import {
  PREVIEW_RASTER_TAG,
  PREVIEW_RENDERING,
  PREVIEW_TEXTURE_FALLBACK,
  PREVIEW_TITLE,
  PREVIEW_VECTOR_TAG,
  TOAST_RENDER_FAILED,
  zoomText,
} from '@/core/copy';
import { useDesignStore } from '@/stores/design';

/**
 * F-40：预览舞台。
 *
 * - 透明棋盘格底，直观呈现"透明背景"这一导出特征；
 * - 未开启做旧时展示 SVG 矢量预览，开启做旧时展示做旧位图画布；
 * - 印章原始边长可达 700px，舞台按容器尺寸等比缩放（**仅视觉缩放，不改设计值**，
 *   因此导出结果与设计参数严格一致，满足 F-41 / AC-20）。
 *
 * ★ `svgHost` / `canvasEl` 由 `useSealPreview()` 创建并在此解构为顶层绑定，
 *   使模板 `ref="svgHost"` 能正确写回 composable 内部的引用。
 */

const store = useDesignStore();
const { design } = storeToRefs(store);
const { usingFallback } = useNoiseTexture();
const { svgHost, canvasEl, rendering, failed } = useSealPreview();

/** 舞台可视区域（缩放基准）。 */
const viewport = ref<HTMLDivElement | null>(null);

/** 可视区域尺寸（像素）。 */
const viewportWidth = ref<number>(0);
const viewportHeight = ref<number>(0);

/** 舞台内边距（与 CSS `.stage__viewport` 的 padding 保持一致）。 */
const STAGE_PADDING = 32;

let observer: ResizeObserver | null = null;

/** 等比缩放系数：容器放得下时为 1，否则缩小以完整展示。 */
const fitScale = computed<number>(() => {
  const size = Math.max(1, design.value.sealSize);
  const availW = viewportWidth.value - STAGE_PADDING * 2;
  const availH = viewportHeight.value - STAGE_PADDING * 2;
  if (availW <= 0 || availH <= 0) {
    return 1;
  }
  const ratio = Math.min(availW / size, availH / size);
  return ratio >= 1 ? 1 : Math.max(0.1, ratio);
});

/** 缩放后的占位盒尺寸，保证居中与滚动布局正确。 */
const boxStyle = computed<Record<string, string>>(() => {
  const scaled = Math.max(1, design.value.sealSize) * fitScale.value;
  return { width: `${scaled}px`, height: `${scaled}px` };
});

/** 内层实际尺寸与缩放变换。 */
const frameStyle = computed<Record<string, string>>(() => {
  const size = Math.max(1, design.value.sealSize);
  return {
    width: `${size}px`,
    height: `${size}px`,
    transform: `scale(${fitScale.value})`,
    transformOrigin: 'top left',
  };
});

/** 当前展示的是做旧位图还是矢量图。 */
const modeTag = computed<string>(() =>
  design.value.realistic ? PREVIEW_RASTER_TAG : PREVIEW_VECTOR_TAG,
);

/** 同步一次容器尺寸。 */
function measure(): void {
  const el = viewport.value;
  if (el === null) {
    return;
  }
  viewportWidth.value = el.clientWidth;
  viewportHeight.value = el.clientHeight;
}

onMounted(() => {
  measure();
  const el = viewport.value;
  if (el !== null && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure());
    observer.observe(el);
  }
  window.addEventListener('resize', measure);
});

onBeforeUnmount(() => {
  if (observer !== null) {
    observer.disconnect();
    observer = null;
  }
  window.removeEventListener('resize', measure);
});
</script>

<template>
  <section class="stage">
    <header class="stage__head">
      <h3 class="stage__title">{{ PREVIEW_TITLE }}</h3>
      <span class="stage__tag">{{ modeTag }}</span>
      <span class="stage__zoom">{{ zoomText(fitScale) }}</span>
    </header>

    <div ref="viewport" class="stage__viewport paper-checkerboard">
      <div class="stage__box" :style="boxStyle">
        <div class="stage__frame" :style="frameStyle">
          <div v-show="!design.realistic" ref="svgHost" class="stage__svg"></div>
          <canvas v-show="design.realistic" ref="canvasEl" class="stage__canvas"></canvas>
        </div>
      </div>

      <div v-if="rendering" class="stage__status" role="status" aria-live="polite">
        {{ PREVIEW_RENDERING }}
      </div>
      <div v-else-if="failed" class="stage__status is-error" role="alert">
        {{ TOAST_RENDER_FAILED }}
      </div>
    </div>

    <footer v-if="usingFallback" class="stage__foot">
      {{ PREVIEW_TEXTURE_FALLBACK }}
    </footer>
  </section>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  background-color: var(--color-surface);
  border-radius: var(--radius-base);
  outline: 1px solid var(--outline-card);
  overflow: hidden;
}

.stage__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--card-padding-compact);
  border-bottom: 1px solid var(--color-border);
}

.stage__title {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.stage__tag {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-blue);
  padding: 1px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-badge);
}

.stage__zoom {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
}

.stage__viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow: auto;
}

.stage__box {
  position: relative;
  flex: 0 0 auto;
}

.stage__frame {
  position: absolute;
  top: 0;
  left: 0;
}

.stage__svg,
.stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.stage__svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.stage__status {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: var(--radius-badge);
  background-color: var(--color-raised);
  border: 1px solid var(--color-border);
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-70);
}

.stage__status.is-error {
  color: var(--color-fg-danger);
  border-color: var(--color-border-danger);
  background-color: var(--color-danger);
}

.stage__foot {
  padding: var(--space-2) var(--card-padding-compact);
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
}
</style>
