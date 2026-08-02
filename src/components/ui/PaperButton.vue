<script lang="ts">
/** 按钮视觉变体（UI规则 buttons.md）。 */
export type PaperButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark';

/** 按钮尺寸。 */
export type PaperButtonSize = 'xs' | 'sm' | 'base' | 'lg';
</script>

<script setup lang="ts">
/**
 * Paper Design 按钮。
 *
 * 规格（UI规则 buttons.md）：6px 圆角、medium 字重、150ms 过渡、按下 scale(0.97)、
 * disabled 透明度 0.7 + not-allowed；焦点环 2px focus 色 + 2px 偏移。
 */

const props = withDefaults(
  defineProps<{
    variant?: PaperButtonVariant;
    size?: PaperButtonSize;
    disabled?: boolean;
    loading?: boolean;
    /** 撑满父容器宽度。 */
    block?: boolean;
    /** 原生 button type。 */
    type?: 'button' | 'submit';
  }>(),
  {
    variant: 'secondary',
    size: 'base',
    disabled: false,
    loading: false,
    block: false,
    type: 'button',
  },
);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

/**
 * 转发点击事件（禁用或加载中时吞掉）。
 *
 * @param event 原生鼠标事件。
 */
function handleClick(event: MouseEvent): void {
  if (props.disabled || props.loading) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button
    class="paper-btn"
    :class="[`v-${variant}`, `s-${size}`, { 'is-block': block, 'is-loading': loading }]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : 'false'"
    @click="handleClick"
  >
    <span v-if="loading" class="paper-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.paper-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  box-sizing: border-box;
  border: none;
  border-radius: var(--radius-base);
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  transition:
    background-color var(--transition-interactive),
    color var(--transition-interactive),
    outline-color var(--transition-interactive),
    transform var(--duration-micro) ease-out;
}

.paper-btn.is-block {
  display: flex;
  width: 100%;
}

.paper-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.paper-btn:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.paper-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: var(--fg-8);
  color: var(--color-fg-disabled);
  box-shadow: none;
  border-color: transparent;
}

/* ── 尺寸 ── */
.s-xs {
  font-size: 12px;
  line-height: 16px;
  padding: var(--space-1) 10px;
}

.s-sm {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  padding: 7px var(--space-3);
}

.s-base {
  font-size: var(--text-sm);
  line-height: var(--text-sm-lh);
  padding: 10px var(--space-4);
}

.s-lg {
  font-size: var(--text-sm);
  line-height: var(--text-sm-lh);
  padding: var(--space-3) 18px;
}

/* ── 变体：Blue（主 CTA） ── */
.v-primary {
  background: linear-gradient(to bottom, var(--blue-400), var(--blue-500));
  color: var(--white);
  box-shadow: var(--shadow-button);
}

.v-primary:hover:not(:disabled) {
  background: linear-gradient(to bottom, var(--blue-300), var(--blue-500));
}

/* ── 变体：Secondary ── */
.v-secondary {
  background-color: var(--fg-8);
  color: var(--color-foreground);
}

.v-secondary:hover:not(:disabled) {
  background-color: var(--fg-12);
}

/* ── 变体：Outline ── */
.v-outline {
  background-color: transparent;
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
}

.v-outline:hover:not(:disabled) {
  background-color: var(--fg-4);
}

/* ── 变体：Ghost（无边框无阴影） ── */
.v-ghost {
  background-color: transparent;
  color: var(--color-foreground);
}

.v-ghost:hover:not(:disabled) {
  background-color: var(--fg-8);
}

/* ── 变体：Dark ── */
.v-dark {
  background-color: var(--color-off-black);
  color: var(--paper-100);
}

.v-dark:hover:not(:disabled) {
  background-color: var(--black);
}

@media (prefers-color-scheme: dark) {
  .v-dark {
    background-color: var(--white);
    color: var(--color-off-black);
  }

  .v-dark:hover:not(:disabled) {
    background-color: var(--paper-100);
  }
}

/* ── 加载指示 ── */
.paper-btn__spinner {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: paper-btn-spin 700ms linear infinite;
}

@keyframes paper-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
