<script setup lang="ts">
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
 * 参数面板容器：负责卡片顺序编排与按版式显隐（架构设计 §3.4）。
 *
 * ★ 本组件**不接收任何 props**，卡片同样不接收 props，各自直连
 *   `useDesignStore()`。这是本项目刻意选择的"务实耦合"，避免 12 层透传。
 */

const s = useDesignStore();
</script>

<template>
  <aside class="panel" :aria-label="PANEL_TITLE">
    <div class="panel__scroll">
      <PresetCard />
      <ShapeTypeCard />
      <BorderCard />
      <CenterCard v-if="s.gongzhangActive" />
      <GongzhangTextCard v-if="s.gongzhangActive" />
      <FangzhangTextCard v-if="s.fangzhangActive" />
      <FreeTextCard v-if="s.freeActive" />
      <AdjustCard />
      <ColorCard />
      <FontCard />
      <RealisticCard />
    </div>
  </aside>
</template>

<style scoped>
.panel {
  flex: 0 0 var(--panel-width);
  width: var(--panel-width);
  min-width: var(--panel-width);
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--color-border);
  background-color: var(--color-background);
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
}
</style>
