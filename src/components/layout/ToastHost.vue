<script setup lang="ts">
import { useToast } from '@/composables/useToast';

/**
 * 全局提示宿主（右下角堆叠）。
 *
 * 文案全部由调用方从 `core/copy.ts` 传入，本组件不产生任何用户可见字面量
 * （禁用词单一防线，架构设计 §7.1）。
 */

const { toasts, remove } = useToast();
</script>

<template>
  <div class="toast-host" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="item in toasts" :key="item.id" class="toast" :class="`k-${item.kind}`">
        <span class="toast__text">{{ item.message }}</span>
        <button class="toast__close" type="button" aria-label="关闭提示" @click="remove(item.id)">
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 380px;
  padding: 10px var(--space-3);
  border-radius: var(--radius-base);
  border: 1px solid transparent;
  background-color: var(--color-surface);
  outline: 1px solid var(--outline-card);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  color: var(--color-foreground);
  pointer-events: auto;
}

.toast__text {
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-all;
}

.toast__close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border: none;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--fg-50);
  transition:
    background-color var(--transition-interactive),
    color var(--transition-interactive);
}

.toast__close:hover {
  background-color: var(--fg-8);
  color: var(--color-foreground);
}

.toast__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.k-success {
  background-color: var(--color-success-soft);
  border-color: color-mix(in srgb, var(--color-border-success) 30%, transparent);
  color: var(--color-fg-success);
}

.k-danger {
  background-color: var(--color-danger-soft);
  border-color: color-mix(in srgb, var(--color-border-danger) 30%, transparent);
  color: var(--color-fg-danger);
}

.k-warning {
  background-color: var(--color-warning-soft);
  border-color: color-mix(in srgb, var(--color-border-warning) 30%, transparent);
  color: var(--color-fg-warning);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-content) var(--ease-out),
    transform var(--duration-content) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
