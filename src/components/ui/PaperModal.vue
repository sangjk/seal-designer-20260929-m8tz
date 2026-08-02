<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

/**
 * Paper Design 模态框。
 *
 * 规格（UI规则 modals.md）：遮罩 black/40% + 轻模糊、内容 surface 背景 + 1px outline +
 * 6px 圆角 + shadow-sm；含 `role="dialog"`、焦点陷阱、Esc 关闭、关闭按钮（ghost）。
 */

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    closable?: boolean;
    /** 内容最大宽度（像素）。 */
    width?: number;
  }>(),
  {
    closable: true,
    width: 420,
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const dialogEl = ref<HTMLElement | null>(null);
let lastActive: HTMLElement | null = null;

/** 可聚焦元素选择器（用于焦点陷阱）。 */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 请求关闭（受 `closable` 控制）。 */
function requestClose(): void {
  if (!props.closable) {
    return;
  }
  emit('close');
}

/**
 * 点击遮罩层空白处关闭。
 *
 * @param event 鼠标事件。
 */
function handleBackdrop(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    requestClose();
  }
}

/**
 * 键盘处理：Esc 关闭 + Tab 焦点陷阱。
 *
 * @param event 键盘事件。
 */
function handleKeydown(event: KeyboardEvent): void {
  if (!props.open) {
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    requestClose();
    return;
  }
  if (event.key !== 'Tab' || !dialogEl.value) {
    return;
  }
  const nodes = Array.from(dialogEl.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
  if (nodes.length === 0) {
    event.preventDefault();
    return;
  }
  const first = nodes[0] as HTMLElement;
  const last = nodes[nodes.length - 1] as HTMLElement;
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey && (active === first || !dialogEl.value.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      lastActive = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', handleKeydown, true);
      await nextTick();
      const target = dialogEl.value?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? dialogEl.value)?.focus();
    } else {
      document.removeEventListener('keydown', handleKeydown, true);
      lastActive?.focus();
      lastActive = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="pmodal">
      <div v-if="open" class="pmodal" @mousedown="handleBackdrop">
        <div
          ref="dialogEl"
          class="pmodal__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
          :style="{ maxWidth: `${width}px` }"
        >
          <header class="pmodal__head">
            <h3 class="pmodal__title">{{ title }}</h3>
            <button
              v-if="closable"
              class="pmodal__close"
              type="button"
              aria-label="关闭"
              @click="requestClose"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </header>
          <div class="pmodal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="pmodal__foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pmodal {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.pmodal__panel {
  width: 100%;
  max-height: calc(100vh - var(--space-12));
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-radius: var(--radius-base);
  outline: 1px solid var(--outline-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.pmodal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.pmodal__title {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--text-sm-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.pmodal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: none;
  border-radius: var(--radius-base);
  background-color: transparent;
  color: var(--fg-60);
  transition:
    background-color var(--transition-interactive),
    color var(--transition-interactive);
}

.pmodal__close:hover {
  background-color: var(--fg-8);
  color: var(--color-foreground);
}

.pmodal__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.pmodal__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  overflow-y: auto;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  color: var(--fg-90);
}

.pmodal__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--color-border);
}

.pmodal-enter-active,
.pmodal-leave-active {
  transition: opacity var(--duration-content) var(--ease-out);
}

.pmodal-enter-active .pmodal__panel,
.pmodal-leave-active .pmodal__panel {
  transition: transform var(--duration-content) var(--ease-out);
}

.pmodal-enter-from,
.pmodal-leave-to {
  opacity: 0;
}

.pmodal-enter-from .pmodal__panel,
.pmodal-leave-to .pmodal__panel {
  transform: translateY(8px) scale(0.98);
}
</style>
