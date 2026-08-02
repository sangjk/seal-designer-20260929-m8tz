<script setup lang="ts">
import PaperButton from '@/components/ui/PaperButton.vue';
import { useExport } from '@/composables/useExport';
import { openPaymentDialog } from '@/composables/usePaymentDialog';
import { useUnlock } from '@/composables/useUnlock';
import {
  BTN_EXPORT_PNG,
  BTN_EXPORT_SVG,
  BTN_UNLOCK,
  EXPORT_LOCKED_HINT,
  EXPORT_PNG_HINT,
  EXPORT_SVG_HINT,
  EXPORT_TITLE,
  UNLOCK_OPEN,
} from '@/core/copy';

/**
 * F-42 / F-43：导出条 —— **软锁的唯一 UX 拦截点**。
 *
 * ★ 安全边界不在这里：即使用户绕过本组件直接调 IPC，Rust 的
 *   `export_png` / `export_svg` 首行仍会校验解锁态并返回 `AppError::Locked`
 *   （ADR-003 / ADR-007 / 问题 011）。本组件只负责"未开通就先弹支付"的体验。
 */

const { exporting, requestExport } = useExport();
const { exportUnlocked } = useUnlock();

/** 触发 PNG 导出。 */
function onExportPng(): void {
  void requestExport('png');
}

/** 触发 SVG 导出。 */
function onExportSvg(): void {
  void requestExport('svg');
}

/** 直接打开支付弹窗（无续做动作）。 */
function onUnlock(): void {
  openPaymentDialog();
}
</script>

<template>
  <section class="export-bar">
    <div class="export-bar__head">
      <h3 class="export-bar__title">{{ EXPORT_TITLE }}</h3>
      <span v-if="exportUnlocked" class="export-bar__state is-open">{{ UNLOCK_OPEN }}</span>
      <span v-else class="export-bar__state">{{ EXPORT_LOCKED_HINT }}</span>
    </div>

    <div class="export-bar__actions">
      <div class="export-bar__slot">
        <PaperButton
          variant="primary"
          size="base"
          :loading="exporting"
          :disabled="exporting"
          @click="onExportPng"
        >
          {{ BTN_EXPORT_PNG }}
        </PaperButton>
        <span class="export-bar__hint">{{ EXPORT_PNG_HINT }}</span>
      </div>

      <div class="export-bar__slot">
        <PaperButton
          variant="secondary"
          size="base"
          :loading="exporting"
          :disabled="exporting"
          @click="onExportSvg"
        >
          {{ BTN_EXPORT_SVG }}
        </PaperButton>
        <span class="export-bar__hint">{{ EXPORT_SVG_HINT }}</span>
      </div>

      <div v-if="!exportUnlocked" class="export-bar__slot export-bar__slot--end">
        <PaperButton variant="dark" size="base" @click="onUnlock">
          {{ BTN_UNLOCK }}
        </PaperButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.export-bar {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--card-padding-compact);
  background-color: var(--color-surface);
  border-radius: var(--radius-base);
  outline: 1px solid var(--outline-card);
}

.export-bar__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.export-bar__title {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.export-bar__state {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
}

.export-bar__state.is-open {
  color: var(--color-fg-success);
}

.export-bar__actions {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.export-bar__slot {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-bar__slot--end {
  margin-left: auto;
}

.export-bar__hint {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
}
</style>
