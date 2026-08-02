<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import { CARD_COLOR } from '@/core/copy';
import { INK_COLORS } from '@/core/palette';
import { useDesignStore } from '@/stores/design';

/**
 * F-28 / F-29：七色印色选择。
 *
 * ★ 颜色双轨（架构设计 §7.2）：色块的 hex 来自 `core/palette.ts` 的**业务印色**，
 *   不是 UI Token；本组件自身的视觉（边框/焦点环）仍然只用 Token。
 */

const s = useDesignStore();
</script>

<template>
  <PaperCard :title="CARD_COLOR" compact>
    <div class="swatches" role="radiogroup" :aria-label="CARD_COLOR">
      <button
        v-for="ink in INK_COLORS"
        :key="ink.value"
        class="swatch"
        :class="{ 'is-active': s.design.sealColor.toLowerCase() === ink.value.toLowerCase() }"
        type="button"
        role="radio"
        :aria-checked="
          s.design.sealColor.toLowerCase() === ink.value.toLowerCase() ? 'true' : 'false'
        "
        :title="ink.name"
        :aria-label="ink.name"
        @click="s.setColor(ink.value)"
      >
        <span class="swatch__chip" :style="{ backgroundColor: ink.value }" aria-hidden="true" />
        <span class="swatch__name">{{ ink.name }}</span>
      </button>
    </div>
  </PaperCard>
</template>

<style scoped>
.swatches {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-1);
  border: 1px solid transparent;
  border-radius: var(--radius-base);
  background-color: transparent;
  transition:
    background-color var(--transition-interactive),
    border-color var(--transition-interactive);
}

.swatch:hover {
  background-color: var(--fg-4);
}

.swatch:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.swatch.is-active {
  border-color: var(--color-blue);
  background-color: var(--fg-4);
}

.swatch__chip {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--fg-12);
}

.swatch__name {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-70);
  white-space: nowrap;
}
</style>
