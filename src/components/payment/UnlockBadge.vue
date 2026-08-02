<script setup lang="ts">
import { computed } from 'vue';
import PaperBadge, { type PaperBadgeVariant } from '@/components/ui/PaperBadge.vue';
import { useUnlock } from '@/composables/useUnlock';
import { openPaymentDialog } from '@/composables/usePaymentDialog';
import { UNLOCK_LOCKED, UNLOCK_OPEN } from '@/core/copy';

/**
 * 顶栏解锁态徽标（F-45）。
 *
 * 无 props：解锁态直接来自 `useUnlock()`（Rust 单一真相源的前端镜像）。
 *
 * ★ 未开通时整个徽标是一个按钮，点击即打开支付弹窗（不带续做动作，
 *   因为用户此时并没有在导出流程中）；已开通时退化为纯展示的静态徽标。
 *
 * ★ 禁用词纪律：两种状态文案逐字取自 `core/copy.ts`（未开通 / 已开通）。
 */

const { exportUnlocked } = useUnlock();

/** 当前应显示的文案。 */
const label = computed<string>(() => (exportUnlocked.value ? UNLOCK_OPEN : UNLOCK_LOCKED));

/** 当前徽标变体。 */
const variant = computed<PaperBadgeVariant>(() => (exportUnlocked.value ? 'success' : 'neutral'));

/** 打开支付弹窗（未开通时可点）。 */
function handleClick(): void {
  if (exportUnlocked.value) {
    return;
  }
  openPaymentDialog();
}
</script>

<template>
  <button
    v-if="!exportUnlocked"
    class="unlock-badge unlock-badge--action"
    type="button"
    :aria-label="label"
    @click="handleClick"
  >
    <PaperBadge :variant="variant" size="default" pill dot>{{ label }}</PaperBadge>
  </button>
  <span v-else class="unlock-badge">
    <PaperBadge :variant="variant" size="default" pill dot>{{ label }}</PaperBadge>
  </span>
</template>

<style scoped>
.unlock-badge {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
}

.unlock-badge--action {
  border-radius: var(--radius-full);
  transition: opacity var(--transition-interactive);
}

.unlock-badge--action:hover {
  opacity: 0.82;
}

.unlock-badge--action:active {
  transform: scale(0.97);
}

.unlock-badge--action:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
