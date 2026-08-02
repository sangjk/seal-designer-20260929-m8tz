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
  /* 现代 Windows / Fluent：中性灰面板面 + 右侧细分隔 */
  border-right: 1px solid var(--win-border);
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
  gap: var(--space-3);
  padding: var(--space-3);
}

/* ── 现代细滚动条（10px 圆角滑块） ── */
.panel__scroll::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.panel__scroll::-webkit-scrollbar-track {
  background: transparent;
}

.panel__scroll::-webkit-scrollbar-thumb {
  background: var(--win-border-strong);
  border: 2px solid var(--win-face);
  border-radius: 6px;
}

.panel__scroll::-webkit-scrollbar-thumb:hover {
  background: var(--win-text-dim);
}

/* ════════════ Fluent 皮肤（仅作用于左侧面板内部） ════════════ */
/* 卡片 = 白底 + 6px 圆角 + 1px 描边 + 轻阴影（与整体主题一致） */
.panel :deep(.paper-card) {
  background-color: var(--win-surface);
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius);
  box-shadow: var(--win-shadow);
  outline: none;
  overflow: visible;
}

.panel :deep(.paper-card__head) {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--win-border);
}

.panel :deep(.paper-card__title) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 600;
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
  padding: var(--space-3);
}

.panel :deep(.paper-card.is-compact .paper-card__body) {
  padding: var(--space-3);
  gap: var(--space-2);
}

/* 字段标题 */
.panel :deep(.seg-field__label),
.panel :deep(.slider__label),
.panel :deep(.pinput__label),
.panel :deep(.pselect__label),
.panel :deep(.ptoggle__label) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 600;
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

/* 分段选择器 → Fluent 分段控件（容器 + 胶囊项） */
.panel :deep(.seg) {
  display: flex;
  gap: var(--space-1);
  padding: 3px;
  background-color: var(--win-surface-2);
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius);
  outline: none;
}

.panel :deep(.seg__item) {
  flex: 1 1 0;
  min-width: 0;
  padding: 4px var(--space-2);
  border: 1px solid transparent;
  border-radius: calc(var(--win-radius) - 2px);
  background-color: transparent;
  color: var(--win-text-dim);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: var(--transition-interactive);
}

.panel :deep(.seg__item:hover:not(:disabled):not(.is-active)) {
  background-color: var(--win-surface);
  color: var(--win-text);
}

.panel :deep(.seg__item:focus-visible) {
  outline: 2px solid var(--win-accent-ring);
  outline-offset: 1px;
}

.panel :deep(.seg__item.is-active) {
  background-color: var(--win-surface);
  border-color: var(--win-border);
  box-shadow: var(--win-shadow);
  color: var(--win-accent-strong);
  font-weight: 600;
}

.panel :deep(.seg__item:disabled) {
  color: var(--win-text-dim);
  background-color: transparent;
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滑块 → 圆角凹槽 + 圆形滑块 */
.panel :deep(.slider__input) {
  height: 22px;
}

.panel :deep(.slider__input:focus-visible) {
  outline: 2px solid var(--win-accent-ring);
  outline-offset: 2px;
  border-radius: var(--win-radius-sm);
}

.panel :deep(.slider__input::-webkit-slider-runnable-track) {
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--win-border);
}

.panel :deep(.slider__input::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border-radius: var(--radius-full);
  background-color: var(--win-accent-strong);
  border: 2px solid var(--win-surface);
  box-shadow: var(--win-shadow);
  cursor: pointer;
}

.panel :deep(.slider__input:hover:not(:disabled)::-webkit-slider-thumb) {
  background-color: var(--win-accent-strong);
}

.panel :deep(.slider__input:active:not(:disabled)::-webkit-slider-thumb) {
  transform: scale(1.06);
}

.panel :deep(.slider__input::-moz-range-track) {
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--win-border);
}

.panel :deep(.slider__input::-moz-range-thumb) {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background-color: var(--win-accent-strong);
  border: 2px solid var(--win-surface);
  box-shadow: var(--win-shadow);
  cursor: pointer;
}

/* 输入框 / 下拉 → 白底圆角 + 蓝色聚焦环 */
.panel :deep(.pinput__control) {
  padding: 4px var(--space-2);
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius-sm);
  background-color: var(--win-surface);
  color: var(--win-text);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  transition: var(--transition-interactive);
}

.panel :deep(.pinput__control::placeholder) {
  color: var(--win-text-dim);
}

.panel :deep(.pinput__control:hover:not(:disabled)) {
  border-color: var(--win-border-strong);
}

.panel :deep(.pinput__control:focus) {
  border-color: var(--win-accent-ring);
  box-shadow: 0 0 0 2px var(--win-accent-soft);
  outline: none;
}

.panel :deep(.pinput__control:disabled) {
  background-color: var(--win-surface-2);
  color: var(--win-text-dim);
  cursor: not-allowed;
}

.panel :deep(.pselect__control) {
  padding: 4px 30px 4px var(--space-2);
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius-sm);
  background-color: var(--win-surface);
  color: var(--win-text);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  transition: var(--transition-interactive);
}

.panel :deep(.pselect__control:hover:not(:disabled)) {
  border-color: var(--win-border-strong);
}

.panel :deep(.pselect__control:focus) {
  border-color: var(--win-accent-ring);
  box-shadow: 0 0 0 2px var(--win-accent-soft);
  outline: none;
}

.panel :deep(.pselect__control:disabled) {
  background-color: var(--win-surface-2);
  color: var(--win-text-dim);
  cursor: not-allowed;
}

.panel :deep(.pselect__chevron) {
  color: var(--win-text-dim);
}

/* 开关 → Fluent 圆角胶囊 */
.panel :deep(.ptoggle__track) {
  border-radius: var(--radius-full);
  background-color: var(--win-border);
  border: 1px solid var(--win-border-strong);
  transition: var(--transition-interactive);
}

.panel :deep(.ptoggle__thumb) {
  border-radius: var(--radius-full);
  background-color: var(--win-surface);
  box-shadow: var(--win-shadow);
}

.panel :deep(.ptoggle__input:checked ~ .ptoggle__track) {
  background-color: var(--win-accent-strong);
  border-color: var(--win-accent-strong);
}

.panel :deep(.ptoggle__control:focus-within .ptoggle__track) {
  outline: 2px solid var(--win-accent-ring);
  outline-offset: 2px;
}

/* 按钮 → Fluent 扁平按钮（覆盖全部变体） */
.panel :deep(.paper-btn) {
  border-radius: var(--win-radius-sm);
  border: 1px solid var(--win-border);
  background-color: var(--win-surface);
  color: var(--win-text);
  font-weight: 500;
  padding: 6px var(--space-3);
  transition: var(--transition-interactive);
}

.panel :deep(.paper-btn:hover:not(:disabled)) {
  background-color: var(--win-surface-2);
  border-color: var(--win-border-strong);
}

.panel :deep(.paper-btn:active:not(:disabled)) {
  background-color: var(--win-surface-2);
  transform: none;
}

.panel :deep(.paper-btn:focus-visible) {
  outline: none;
  border-color: var(--win-accent-ring);
  box-shadow: 0 0 0 2px var(--win-accent-soft);
}

.panel :deep(.paper-btn:disabled) {
  opacity: 0.5;
  color: var(--win-text-dim);
  background-color: var(--win-surface);
  cursor: not-allowed;
}

.panel :deep(.paper-btn.v-primary) {
  background-color: var(--win-accent-strong);
  border-color: var(--win-accent-strong);
  color: #ffffff;
}

.panel :deep(.paper-btn.v-primary:hover:not(:disabled)) {
  background-color: var(--win-accent-strong);
  filter: brightness(1.05);
}

.panel :deep(.paper-btn.v-secondary) {
  background-color: var(--win-surface);
  border-color: var(--win-accent-ring);
  color: var(--win-accent-strong);
}

.panel :deep(.paper-btn.v-secondary:hover:not(:disabled)) {
  background-color: var(--win-accent-soft);
  border-color: var(--win-accent-strong);
}

.panel :deep(.paper-btn.v-outline) {
  background-color: transparent;
  border-color: var(--win-border);
  color: var(--win-text);
}

.panel :deep(.paper-btn.v-outline:hover:not(:disabled)) {
  background-color: var(--win-surface-2);
  border-color: var(--win-border-strong);
}

.panel :deep(.paper-btn.v-ghost) {
  background-color: transparent;
  border-color: transparent;
  color: var(--win-text);
}

.panel :deep(.paper-btn.v-ghost:hover:not(:disabled)) {
  background-color: var(--win-surface-2);
}

.panel :deep(.paper-btn.v-dark) {
  background-color: var(--gray-900);
  border-color: var(--gray-900);
  color: #ffffff;
}

/* 预设按钮（PresetCard 自定义控件） */
.panel :deep(.preset) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius);
  background-color: var(--win-surface);
  text-align: left;
  transition: var(--transition-interactive);
}

.panel :deep(.preset:hover) {
  background-color: var(--win-surface-2);
  border-color: var(--win-border-strong);
}

.panel :deep(.preset:focus-visible) {
  outline: none;
  border-color: var(--win-accent-ring);
  box-shadow: 0 0 0 2px var(--win-accent-soft);
}

.panel :deep(.preset:active) {
  background-color: var(--win-surface-2);
  transform: none;
}

.panel :deep(.preset__label) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: 600;
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
  border: 1px solid var(--win-border);
  border-radius: var(--win-radius);
  background-color: var(--win-surface);
  transition: var(--transition-interactive);
}

.panel :deep(.swatch:hover) {
  background-color: var(--win-surface-2);
  border-color: var(--win-border-strong);
}

.panel :deep(.swatch:focus-visible) {
  outline: none;
  border-color: var(--win-accent-ring);
  box-shadow: 0 0 0 2px var(--win-accent-soft);
}

.panel :deep(.swatch.is-active) {
  border-color: var(--win-accent-strong);
  box-shadow: 0 0 0 2px var(--win-accent-soft);
  background-color: var(--win-surface-2);
}

.panel :deep(.swatch__chip) {
  width: 22px;
  height: 22px;
  border-radius: var(--win-radius-sm);
  border: 1px solid var(--win-border-strong);
}

.panel :deep(.swatch__name) {
  font-size: 12px;
  line-height: 16px;
  color: var(--win-text-dim);
  white-space: nowrap;
}
</style>
