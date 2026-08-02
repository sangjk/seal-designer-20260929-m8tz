<script setup lang="ts">
import AdjustCard from './AdjustCard.vue';
import BorderCard from './BorderCard.vue';
import CenterCard from './CenterCard.vue';
import ColorCard from './ColorCard.vue';
import FangzhangTextCard from './FangzhangTextCard.vue';
import FontCard from './FontCard.vue';
import FreeTextCard from './FreeTextCard.vue';
import GongzhangTextCard from './GongzhangTextCard.vue';
import PresetCard from './PresetCard.vue';
import RealisticCard from './RealisticCard.vue';
import ShapeTypeCard from './ShapeTypeCard.vue';
import { PANEL_TITLE } from '@/core/copy';
import { useDesignStore } from '@/stores/design';

/**
 * 参数面板容器：负责卡片顺序编排与按版式显隐（架构设计 §3.4）。
 *
 * ★ 本组件**不接收任何 props**，卡片同样不接收 props，各自直连
 *   `useDesignStore()`。这是本项目刻意选择的"务实耦合"，避免 12 层透传。
 */

const s = useDesignStore();
</script>

<template>
  <aside class="panel" :aria-label="PANEL_TITLE">
    <div class="panel__scroll">
      <PresetCard />
      <ShapeTypeCard />
      <BorderCard />
      <CenterCard v-if="s.gongzhangActive" />
      <GongzhangTextCard v-if="s.gongzhangActive" />
      <FangzhangTextCard v-if="s.fangzhangActive" />
      <FreeTextCard v-if="s.freeActive" />
      <AdjustCard />
      <ColorCard />
      <FontCard />
      <RealisticCard />
    </div>
  </aside>
</template>

<style scoped>
.panel {
  flex: 0 0 var(--panel-width);
  width: var(--panel-width);
  min-width: var(--panel-width);
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* 经典 Windows 工具面板：3D 灰面 + 右侧立体分隔 */
  border-right: 1px solid var(--win-shadow);
  background-color: var(--win-face);
  font-family: var(--win-font);
}

.panel__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
}

/* ── 经典灰滚动条（3D 凸起滑块） ── */
.panel__scroll::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

.panel__scroll::-webkit-scrollbar-track {
  background: var(--win-face);
  border-left: 1px solid var(--win-shadow);
}

.panel__scroll::-webkit-scrollbar-thumb {
  background: var(--win-face);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
}

.panel__scroll::-webkit-scrollbar-thumb:hover {
  background: var(--win-light);
}

/* ════════════ 经典 Windows 皮肤（仅作用于左侧面板内部） ════════════ */
/* 分组框（卡片） */
.panel :deep(.paper-card) {
  background-color: var(--win-face);
  border: 1px solid var(--win-shadow);
  border-radius: 0;
  outline: none;
  overflow: visible;
}

.panel :deep(.paper-card__head) {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--win-shadow);
}

.panel :deep(.paper-card__title) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 700;
  color: var(--win-text);
}

.panel :deep(.paper-card__hint) {
  font-size: 12px;
  line-height: 16px;
  color: var(--win-text-dim);
  margin-right: auto;
}

.panel :deep(.paper-card__body) {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
}

.panel :deep(.paper-card.is-compact .paper-card__body) {
  padding: var(--space-2);
  gap: var(--space-2);
}

/* 字段标题统一加粗 */
.panel :deep(.seg-field__label),
.panel :deep(.slider__label),
.panel :deep(.pinput__label),
.panel :deep(.pselect__label),
.panel :deep(.ptoggle__label) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 700;
  color: var(--win-text);
}

.panel :deep(.slider__value),
.panel :deep(.pinput__count),
.panel :deep(.pselect__hint),
.panel :deep(.ptoggle__hint) {
  font-size: 12px;
  line-height: 16px;
  color: var(--win-text-dim);
}

/* 分段选择器 → 经典凸起按钮组 */
.panel :deep(.seg) {
  display: flex;
  gap: var(--space-1);
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  outline: none;
}

.panel :deep(.seg__item) {
  flex: 1 1 0;
  min-width: 0;
  padding: 4px var(--space-2);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
  border-radius: 0;
  background-color: var(--win-face);
  color: var(--win-text);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: none;
}

.panel :deep(.seg__item:hover:not(:disabled):not(.is-active)) {
  background-color: var(--win-light);
}

.panel :deep(.seg__item:focus-visible) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

.panel :deep(.seg__item.is-active) {
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  box-shadow: inset 1px 1px var(--win-dkshadow), inset -1px -1px var(--win-light);
  background-color: var(--win-face-2);
  color: var(--win-text);
  font-weight: 700;
}

.panel :deep(.seg__item:disabled) {
  color: var(--win-shadow);
  background-color: var(--win-face);
  opacity: 1;
  cursor: not-allowed;
}

/* 滑块 → 凹槽轨道 + 凸起滑块 */
.panel :deep(.slider__input) {
  height: 22px;
}

.panel :deep(.slider__input:focus-visible) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: 1px;
  border-radius: 0;
}

.panel :deep(.slider__input::-webkit-slider-runnable-track) {
  height: 6px;
  border-radius: 0;
  background: var(--win-window);
  border: 1px solid;
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  box-shadow: inset 1px 1px var(--win-dkshadow);
}

.panel :deep(.slider__input::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 11px;
  height: 20px;
  margin-top: -8px;
  border-radius: 0;
  background-color: var(--win-face);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
}

.panel :deep(.slider__input:hover:not(:disabled)::-webkit-slider-thumb) {
  background-color: var(--win-light);
}

.panel :deep(.slider__input:active:not(:disabled)::-webkit-slider-thumb) {
  transform: none;
}

.panel :deep(.slider__input::-moz-range-track) {
  height: 6px;
  border-radius: 0;
  background: var(--win-window);
  border: 1px solid;
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
}

.panel :deep(.slider__input::-moz-range-thumb) {
  width: 11px;
  height: 20px;
  border-radius: 0;
  background-color: var(--win-face);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
}

/* 输入框 / 下拉 → 内凹白底 */
.panel :deep(.pinput__control) {
  padding: 4px var(--space-2);
  border: 1px solid;
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  border-radius: 0;
  background-color: var(--win-window);
  color: var(--win-text);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
}

.panel :deep(.pinput__control::placeholder) {
  color: var(--win-text-dim);
}

.panel :deep(.pinput__control:hover:not(:disabled)),
.panel :deep(.pinput__control:focus) {
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
}

.panel :deep(.pinput__control:focus) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

.panel :deep(.pinput__control:disabled) {
  background-color: var(--win-face-2);
  color: var(--win-shadow);
}

.panel :deep(.pselect__control) {
  padding: 4px 30px 4px var(--space-2);
  border: 1px solid;
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  border-radius: 0;
  background-color: var(--win-window);
  color: var(--win-text);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
}

.panel :deep(.pselect__control:hover:not(:disabled)),
.panel :deep(.pselect__control:focus) {
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
}

.panel :deep(.pselect__control:focus) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

.panel :deep(.pselect__control:disabled) {
  background-color: var(--win-face-2);
  color: var(--win-shadow);
}

.panel :deep(.pselect__chevron) {
  color: var(--win-text);
}

/* 开关 → 内凹方块 + 凸起滑块 */
.panel :deep(.ptoggle__track) {
  border-radius: 0;
  background-color: var(--win-window);
  border: 1px solid;
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  box-shadow: inset 1px 1px var(--win-dkshadow);
}

.panel :deep(.ptoggle__thumb) {
  border-radius: 0;
  background-color: var(--win-face);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
}

.panel :deep(.ptoggle__input:checked ~ .ptoggle__track) {
  background-color: var(--win-face-2);
}

.panel :deep(.ptoggle__control:focus-within .ptoggle__track) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

/* 按钮 → 经典凸起按钮（覆盖全部变体） */
.panel :deep(.paper-btn) {
  border-radius: 0;
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
  background-color: var(--win-face);
  color: var(--win-text);
  font-weight: 400;
  transition: none;
}

.panel :deep(.paper-btn:active:not(:disabled)) {
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  box-shadow: inset 1px 1px var(--win-dkshadow), inset -1px -1px var(--win-light);
  transform: none;
}

.panel :deep(.paper-btn:focus-visible) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

.panel :deep(.paper-btn:disabled) {
  opacity: 1;
  color: var(--win-shadow);
  background-color: var(--win-face);
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
  cursor: not-allowed;
}

.panel :deep(.paper-btn.v-primary),
.panel :deep(.paper-btn.v-secondary),
.panel :deep(.paper-btn.v-outline),
.panel :deep(.paper-btn.v-ghost),
.panel :deep(.paper-btn.v-dark) {
  background: var(--win-face);
  color: var(--win-text);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
}

.panel :deep(.paper-btn.v-primary:hover:not(:disabled)),
.panel :deep(.paper-btn.v-secondary:hover:not(:disabled)),
.panel :deep(.paper-btn.v-outline:hover:not(:disabled)),
.panel :deep(.paper-btn.v-ghost:hover:not(:disabled)),
.panel :deep(.paper-btn.v-dark:hover:not(:disabled)) {
  background-color: var(--win-light);
}

/* 预设按钮（PresetCard 自定义控件） */
.panel :deep(.preset) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
  border-radius: 0;
  background-color: var(--win-face);
  text-align: left;
  transition: none;
}

.panel :deep(.preset:hover) {
  background-color: var(--win-light);
}

.panel :deep(.preset:focus-visible) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

.panel :deep(.preset:active) {
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  box-shadow: inset 1px 1px var(--win-dkshadow), inset -1px -1px var(--win-light);
  transform: none;
}

.panel :deep(.preset__label) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 700;
  color: var(--win-text);
}

.panel :deep(.preset__desc) {
  font-size: 12px;
  line-height: 16px;
  color: var(--win-text-dim);
}

/* 印色色板（ColorCard 自定义控件） */
.panel :deep(.swatch) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  border: 1px solid;
  border-color: var(--win-hilite) var(--win-dkshadow) var(--win-dkshadow) var(--win-hilite);
  box-shadow: inset 1px 1px var(--win-light), inset -1px -1px var(--win-shadow);
  border-radius: 0;
  background-color: var(--win-face);
  transition: none;
}

.panel :deep(.swatch:hover) {
  background-color: var(--win-light);
}

.panel :deep(.swatch:focus-visible) {
  outline: 1px dotted var(--win-dkshadow);
  outline-offset: -3px;
}

.panel :deep(.swatch.is-active) {
  border-color: var(--win-shadow) var(--win-hilite) var(--win-hilite) var(--win-shadow);
  box-shadow: inset 1px 1px var(--win-dkshadow), inset -1px -1px var(--win-light);
  background-color: var(--win-face-2);
}

.panel :deep(.swatch__chip) {
  width: 22px;
  height: 22px;
  border-radius: 0;
  border: 1px solid var(--win-dkshadow);
}

.panel :deep(.swatch__name) {
  font-size: 12px;
  line-height: 16px;
  color: var(--win-text-dim);
  white-space: nowrap;
}
</style>
