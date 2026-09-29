<script setup lang="ts">
import { computed, inject } from 'vue';
import ParamPanel from '@/components/panel/ParamPanel.vue';
import ExportBar from '@/components/preview/ExportBar.vue';
import PreviewStage from '@/components/preview/PreviewStage.vue';
import { DISCLAIMER_DESIGN } from '@/core/copy';

/**
 * 设计器主界面（本轮新布局：中央聚焦画布 + 右侧参数抽屉）。
 *
 * - 中央 `PreviewStage` 占满主区域，印章预览居中、最大化可见；
 * - 底部 `ExportBar` + 设计免责声明常驻；
 * - 右侧 `ParamPanel` 为可折叠抽屉，由顶栏按钮开合（纯 UI 状态）。
 * 仅布局重组，功能入口与组件全部沿用，未删未藏。
 */

const drawerState = inject<{ value: boolean }>('drawerOpen');

/** 模板中 ref 会自动解包，统一在脚本侧收敛为普通布尔，避免 `.value` 失配。 */
const drawerIsOpen = computed<boolean>(() => (drawerState ? drawerState.value : true));
</script>

<template>
  <div class="designer" :class="{ 'drawer-collapsed': !drawerIsOpen }">
    <section class="designer__stage">
      <PreviewStage />
      <div class="designer__dock">
        <ExportBar />
        <p class="designer__disclaimer">{{ DISCLAIMER_DESIGN }}</p>
      </div>
    </section>

    <aside class="designer__drawer" :aria-hidden="!drawerIsOpen">
      <ParamPanel />
    </aside>
  </div>
</template>

<style scoped>
.designer {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: stretch;
}

.designer__stage {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-root);
}

.designer__dock {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.designer__disclaimer {
  margin: 0;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-40);
}

/* 右侧参数抽屉：开合仅改变宽度（非浮层），不遮挡画布 */
.designer__drawer {
  flex: 0 0 var(--drawer-width);
  width: var(--drawer-width);
  min-width: 0;
  display: flex;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-cream);
  transition:
    width var(--duration-content) var(--ease-out),
    flex-basis var(--duration-content) var(--ease-out);
}

.designer.drawer-collapsed .designer__drawer {
  flex-basis: 0;
  width: 0;
  border-left: none;
}
</style>
