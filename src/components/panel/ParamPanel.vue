<script setup lang="ts">
import { ref } from 'vue';
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
 * 参数面板容器（本轮：手风琴分组 + 宣纸暖中性皮肤）。
 *
 * ★ 本组件**不接收任何 props**，卡片同样不接收 props，各自直连
 *   `useDesignStore()`（沿用务实耦合，避免 12 层透传）。
 * ★ 分组仅为视觉组织，所有卡片功能不变；手风琴默认展开，1 次点击可达。
 */

const s = useDesignStore();

/** 手风琴分组开合状态（纯 UI）。 */
const openShape = ref<boolean>(true);
const openText = ref<boolean>(true);
const openColor = ref<boolean>(true);
const openFine = ref<boolean>(true);

interface Group {
  key: 'shape' | 'text' | 'color' | 'fine';
  title: string;
  open: typeof openShape;
}

const groups: Group[] = [
  { key: 'shape', title: '版式与形状', open: openShape },
  { key: 'text', title: '文字内容', open: openText },
  { key: 'color', title: '印色与字体', open: openColor },
  { key: 'fine', title: '精细与做旧', open: openFine },
];

function toggle(g: Group): void {
  g.open.value = !g.open.value;
}
</script>

<template>
  <aside class="panel" :aria-label="PANEL_TITLE">
    <div class="panel__scroll">
      <p class="panel__heading">{{ PANEL_TITLE }}</p>

      <PresetCard />

      <section v-for="g in groups" :key="g.key" class="group">
        <button
          type="button"
          class="group__head"
          :aria-expanded="g.open.value"
          @click="toggle(g)"
        >
          <span class="group__title">{{ g.title }}</span>
          <span class="group__chevron" :class="{ 'is-open': g.open.value }" aria-hidden="true" />
        </button>

        <div v-show="g.open.value" class="group__body">
          <template v-if="g.key === 'shape'">
            <ShapeTypeCard />
            <BorderCard />
          </template>

          <template v-else-if="g.key === 'text'">
            <CenterCard v-if="s.gongzhangActive" />
            <GongzhangTextCard v-if="s.gongzhangActive" />
            <FangzhangTextCard v-if="s.fangzhangActive" />
            <FreeTextCard v-if="s.freeActive" />
          </template>

          <template v-else-if="g.key === 'color'">
            <ColorCard />
            <FontCard />
          </template>

          <template v-else>
            <AdjustCard />
            <RealisticCard />
          </template>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
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
  padding-bottom: calc(var(--space-3) + 24px);
}

.panel__heading {
  margin: 0;
  padding: 2px var(--space-1);
  font-family: var(--font-serif);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.06em;
  color: var(--color-accent-strong);
}

/* ── 手风琴分组 ── */
.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.group__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  padding: 6px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-base);
  background-color: transparent;
  cursor: pointer;
  transition: var(--transition-interactive);
}

.group__head:hover {
  background-color: var(--fg-6);
}

.group__head:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.group__title {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-semibold);
  color: var(--color-foreground);
}

.group__chevron {
  position: relative;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--color-muted);
  border-bottom: 2px solid var(--color-muted);
  transform: rotate(-45deg);
  transition: transform var(--transition-interactive);
}

.group__chevron.is-open {
  transform: rotate(45deg);
}

.group__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* ── 卡片：暖白底 + 圆角 + 1px 暖边 ── */
.panel :deep(.paper-card) {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
  outline: none;
  overflow: visible;
}

.panel :deep(.paper-card__head) {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.panel :deep(.paper-card__title) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-semibold);
  color: var(--color-foreground);
}

.panel :deep(.paper-card__hint) {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-muted);
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
  font-weight: var(--weight-semibold);
  color: var(--color-foreground);
}

.panel :deep(.slider__value),
.panel :deep(.pinput__count),
.panel :deep(.pselect__hint),
.panel :deep(.ptoggle__hint) {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-muted);
}

/* 分段选择器 → 朱红描边胶囊 */
.panel :deep(.seg) {
  display: flex;
  gap: var(--space-1);
  padding: 3px;
  background-color: var(--color-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  outline: none;
}

.panel :deep(.seg__item) {
  flex: 1 1 0;
  min-width: 0;
  padding: 4px var(--space-2);
  border: 1px solid transparent;
  border-radius: calc(var(--radius-base) - 2px);
  background-color: transparent;
  color: var(--color-muted);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: var(--transition-interactive);
}

.panel :deep(.seg__item:hover:not(:disabled):not(.is-active)) {
  background-color: var(--color-surface);
  color: var(--color-foreground);
}

.panel :deep(.seg__item:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.panel :deep(.seg__item.is-active) {
  background-color: var(--color-accent);
  border-color: var(--color-accent-strong);
  color: var(--white);
  font-weight: var(--weight-semibold);
}

.panel :deep(.seg__item:disabled) {
  color: var(--color-muted);
  background-color: transparent;
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滑块 → 朱红填充 */
.panel :deep(.slider__input) {
  height: 22px;
}

.panel :deep(.slider__input:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.panel :deep(.slider__input::-webkit-slider-runnable-track) {
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--color-border);
}

.panel :deep(.slider__input::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-strong);
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.panel :deep(.slider__input:active:not(:disabled)::-webkit-slider-thumb) {
  transform: scale(1.06);
}

.panel :deep(.slider__input::-moz-range-track) {
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--color-border);
}

.panel :deep(.slider__input::-moz-range-thumb) {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-strong);
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

/* 输入框 / 下拉 → 白底圆角 + 朱红聚焦环 */
.panel :deep(.pinput__control) {
  padding: 4px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-foreground);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  transition: var(--transition-interactive);
}

.panel :deep(.pinput__control::placeholder) {
  color: var(--color-muted);
}

.panel :deep(.pinput__control:hover:not(:disabled)) {
  border-color: var(--color-accent);
}

.panel :deep(.pinput__control:focus) {
  border-color: var(--color-accent-ring);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.panel :deep(.pinput__control:disabled) {
  background-color: var(--color-raised);
  color: var(--color-muted);
  cursor: not-allowed;
}

.panel :deep(.pselect__control) {
  padding: 4px 30px 4px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-foreground);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  transition: var(--transition-interactive);
}

.panel :deep(.pselect__control:hover:not(:disabled)) {
  border-color: var(--color-accent);
}

.panel :deep(.pselect__control:focus) {
  border-color: var(--color-accent-ring);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  outline: none;
}

.panel :deep(.pselect__control:disabled) {
  background-color: var(--color-raised);
  color: var(--color-muted);
  cursor: not-allowed;
}

.panel :deep(.pselect__chevron) {
  color: var(--color-muted);
}

/* 开关 → 朱红胶囊 */
.panel :deep(.ptoggle__track) {
  border-radius: var(--radius-full);
  background-color: var(--color-border);
  border: 1px solid var(--color-border);
  transition: var(--transition-interactive);
}

.panel :deep(.ptoggle__thumb) {
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.panel :deep(.ptoggle__input:checked ~ .ptoggle__track) {
  background-color: var(--color-accent-strong);
  border-color: var(--color-accent-strong);
}

.panel :deep(.ptoggle__control:focus-within .ptoggle__track) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* 按钮 → 朱红主按钮 + 描边次按钮 */
.panel :deep(.paper-btn) {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-foreground);
  font-weight: var(--weight-medium);
  padding: 6px var(--space-3);
  transition: var(--transition-interactive);
}

.panel :deep(.paper-btn:hover:not(:disabled)) {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.panel :deep(.paper-btn:active:not(:disabled)) {
  background-color: var(--color-accent-soft);
  transform: none;
}

.panel :deep(.paper-btn:focus-visible) {
  outline: none;
  border-color: var(--color-accent-ring);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.panel :deep(.paper-btn:disabled) {
  opacity: 0.5;
  color: var(--color-muted);
  background-color: var(--color-surface);
  cursor: not-allowed;
}

.panel :deep(.paper-btn.v-primary) {
  background-color: var(--color-accent-strong);
  border-color: var(--color-accent-strong);
  color: var(--white);
}

.panel :deep(.paper-btn.v-primary:hover:not(:disabled)) {
  background-color: var(--color-accent-strong);
  filter: brightness(1.06);
}

.panel :deep(.paper-btn.v-secondary) {
  background-color: var(--color-surface);
  border-color: var(--color-accent-ring);
  color: var(--color-accent-strong);
}

.panel :deep(.paper-btn.v-secondary:hover:not(:disabled)) {
  background-color: var(--color-accent-soft);
  border-color: var(--color-accent-strong);
}

.panel :deep(.paper-btn.v-outline) {
  background-color: transparent;
  border-color: var(--color-border);
  color: var(--color-foreground);
}

.panel :deep(.paper-btn.v-outline:hover:not(:disabled)) {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.panel :deep(.paper-btn.v-ghost) {
  background-color: transparent;
  border-color: transparent;
  color: var(--color-foreground);
}

.panel :deep(.paper-btn.v-ghost:hover:not(:disabled)) {
  background-color: var(--fg-8);
}

.panel :deep(.paper-btn.v-dark) {
  background-color: var(--ink-900);
  border-color: var(--ink-900);
  color: var(--white);
}

/* 预设按钮（PresetCard 自定义控件） */
.panel :deep(.preset) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: var(--color-surface);
  text-align: left;
  transition: var(--transition-interactive);
}

.panel :deep(.preset:hover) {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.panel :deep(.preset:focus-visible) {
  outline: none;
  border-color: var(--color-accent-ring);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.panel :deep(.preset:active) {
  background-color: var(--color-accent-soft);
  transform: none;
}

.panel :deep(.preset__label) {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-semibold);
  color: var(--color-foreground);
}

.panel :deep(.preset__desc) {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-muted);
}

/* 印色色板（ColorCard 自定义控件） */
.panel :deep(.swatch) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: var(--color-surface);
  transition: var(--transition-interactive);
}

.panel :deep(.swatch:hover) {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.panel :deep(.swatch:focus-visible) {
  outline: none;
  border-color: var(--color-accent-ring);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.panel :deep(.swatch.is-active) {
  border-color: var(--color-accent-strong);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
  background-color: var(--color-accent-soft);
}

.panel :deep(.swatch__chip) {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.panel :deep(.swatch__name) {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-muted);
  white-space: nowrap;
}
</style>
