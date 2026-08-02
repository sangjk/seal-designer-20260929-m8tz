<script setup lang="ts">
/**
 * Paper Design 卡片容器。
 *
 * 规格（UI规则 cards.md / shadows.md）：surface 背景、1px outline（亮色 fg/6%、
 * 暗色 white/10%）、6px 圆角、**无 box-shadow**（outline-first）。
 */

withDefaults(
  defineProps<{
    /** 卡片标题（省略则不渲染标题栏）。 */
    title?: string;
    /** 标题右侧的补充说明。 */
    hint?: string;
    /** 高密度内边距（参数面板卡片用）。 */
    compact?: boolean;
    /** 叠加纸纹颗粒。 */
    grain?: boolean;
  }>(),
  {
    title: '',
    hint: '',
    compact: false,
    grain: false,
  },
);
</script>

<template>
  <section class="paper-card" :class="{ 'is-compact': compact, 'paper-grain': grain }">
    <header v-if="title" class="paper-card__head">
      <h4 class="paper-card__title">{{ title }}</h4>
      <span v-if="hint" class="paper-card__hint">{{ hint }}</span>
      <slot name="actions" />
    </header>
    <div class="paper-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.paper-card {
  display: block;
  background-color: var(--color-surface);
  border-radius: var(--radius-base);
  outline: 1px solid var(--outline-card);
  outline-offset: 0;
  overflow: hidden;
}

.paper-card__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: var(--space-3) var(--card-padding-compact);
  border-bottom: 1px solid var(--color-border);
}

.paper-card__title {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
  margin: 0;
}

.paper-card__hint {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
  margin-right: auto;
}

.paper-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--card-padding);
}

.paper-card.is-compact .paper-card__body {
  padding: var(--card-padding-compact);
  gap: var(--space-3);
}
</style>
