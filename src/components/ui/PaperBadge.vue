<script lang="ts">
/** 徽标视觉变体（UI规则 badges.md）。 */
export type PaperBadgeVariant =
  | 'blue'
  | 'neutral'
  | 'gray'
  | 'danger'
  | 'success'
  | 'warning'
  | 'dark';

/** 徽标尺寸。 */
export type PaperBadgeSize = 'default' | 'large';
</script>

<script setup lang="ts">
/**
 * Paper Design 徽标。
 *
 * 规格：1px 边框、默认 8px 圆角（pill 时 9999px），
 * 尺寸 default 12px/6px·2px、large 14px/8px·4px。
 */

withDefaults(
  defineProps<{
    variant?: PaperBadgeVariant;
    size?: PaperBadgeSize;
    /** 使用全圆角药丸形态。 */
    pill?: boolean;
    /** 在文字前显示一个圆点指示器。 */
    dot?: boolean;
  }>(),
  {
    variant: 'neutral',
    size: 'default',
    pill: false,
    dot: false,
  },
);
</script>

<template>
  <span class="badge" :class="[`v-${variant}`, `s-${size}`, { 'is-pill': pill }]">
    <span v-if="dot" class="badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  box-sizing: border-box;
  border-radius: var(--radius-badge);
  border: 1px solid transparent;
  font-weight: var(--weight-medium);
  white-space: nowrap;
}

.badge.is-pill {
  border-radius: var(--radius-full);
}

.s-default {
  font-size: 12px;
  line-height: 16px;
  padding: 2px 6px;
}

.s-large {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  padding: var(--space-1) var(--space-2);
}

.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: currentColor;
  flex: 0 0 auto;
}

/* ── 变体 ── */
.v-blue {
  background-color: color-mix(in srgb, var(--blue-300) 15%, transparent);
  border-color: color-mix(in srgb, var(--blue-400) 30%, transparent);
  color: var(--blue-500);
}

@media (prefers-color-scheme: dark) {
  .v-blue {
    color: var(--blue-300);
  }
}

.v-neutral {
  background-color: var(--fg-4);
  border-color: var(--fg-8);
  color: var(--color-foreground);
}

.v-gray {
  background-color: var(--gray-100);
  border-color: var(--fg-8);
  color: var(--color-foreground);
}

@media (prefers-color-scheme: dark) {
  .v-gray {
    background-color: var(--gray-800);
  }
}

.v-danger {
  background-color: var(--color-danger-soft);
  border-color: color-mix(in srgb, var(--color-border-danger) 30%, transparent);
  color: var(--color-fg-danger);
}

.v-success {
  background-color: var(--color-success-soft);
  border-color: color-mix(in srgb, var(--color-border-success) 30%, transparent);
  color: var(--color-fg-success);
}

.v-warning {
  background-color: var(--color-warning-soft);
  border-color: color-mix(in srgb, var(--color-border-warning) 30%, transparent);
  color: var(--color-fg-warning);
}

.v-dark {
  background-color: var(--color-off-black);
  border-color: transparent;
  color: var(--paper-100);
}

@media (prefers-color-scheme: dark) {
  .v-dark {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-cream);
  }
}
</style>
