<script setup lang="ts">
import ParamPanel from '@/components/panel/ParamPanel.vue';
import ExportBar from '@/components/preview/ExportBar.vue';
import PreviewStage from '@/components/preview/PreviewStage.vue';
import { DISCLAIMER } from '@/core/copy';

/**
 * 设计器主界面：左 `ParamPanel`（参数卡片） + 右 `PreviewStage` / `ExportBar`。
 *
 * 布局为固定两栏（左栏宽度取 `--panel-width`），整体不产生页面级滚动，
 * 仅参数面板内部滚动 —— 桌面工具界面的常规做法。
 */
</script>

<template>
  <div class="designer">
    <ParamPanel />
    <section class="designer__main">
      <PreviewStage />
      <ExportBar />
      <p class="designer__disclaimer">{{ DISCLAIMER }}</p>
    </section>
  </div>
</template>

<style scoped>
.designer {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: stretch;
}

.designer__main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-root);
}

.designer__disclaimer {
  margin: 0;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-40);
}
</style>
