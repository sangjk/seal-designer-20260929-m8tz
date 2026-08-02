<script setup lang="ts">
import PaperButton from '@/components/ui/PaperButton.vue';
import PaperCard from '@/components/ui/PaperCard.vue';
import { BTN_RESET, CARD_PRESET } from '@/core/copy';
import { PRESET_ITEMS } from '@/core/presets';
import { useDesignStore } from '@/stores/design';

/** F-39：四套快速预设 + 恢复默认。 */

const s = useDesignStore();
</script>

<template>
  <PaperCard :title="CARD_PRESET" compact>
    <div class="presets">
      <button
        v-for="item in PRESET_ITEMS"
        :key="item.key"
        class="preset"
        type="button"
        @click="s.applyPreset(item.key)"
      >
        <span class="preset__label">{{ item.label }}</span>
        <span class="preset__desc">{{ item.desc }}</span>
      </button>
    </div>
    <PaperButton variant="ghost" size="sm" block @click="s.reset()">
      {{ BTN_RESET }}
    </PaperButton>
  </PaperCard>
</template>

<style scoped>
.presets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.preset {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: transparent;
  text-align: left;
  transition:
    background-color var(--transition-interactive),
    border-color var(--transition-interactive);
}

.preset:hover {
  background-color: var(--fg-4);
  border-color: var(--color-border-dark);
}

.preset:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.preset:active {
  transform: scale(0.97);
}

.preset__label {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.preset__desc {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
}
</style>
