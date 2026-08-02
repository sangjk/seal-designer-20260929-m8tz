<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperSegmented from '@/components/ui/PaperSegmented.vue';
import type { SegmentedOption } from '@/components/ui/PaperSegmented.vue';
import PaperSlider from '@/components/ui/PaperSlider.vue';
import { CARD_BORDER } from '@/core/copy';
import { RANGES, type BorderStyle } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/** F-05 ~ F-07：边框样式 / 双线间距 / 线宽。 */

const s = useDesignStore();

const borderOptions: SegmentedOption[] = [
  { value: 'single', label: '单线' },
  { value: 'double', label: '双线' },
  { value: 'none', label: '无边框' },
];

/**
 * 切换边框样式。
 *
 * @param value 分段值。
 */
function onBorderStyle(value: string): void {
  s.design.borderStyle = value as BorderStyle;
}
</script>

<template>
  <PaperCard :title="CARD_BORDER" compact>
    <PaperSegmented
      label="边框样式"
      :model-value="s.design.borderStyle"
      :options="borderOptions"
      @update:model-value="onBorderStyle"
    />
    <PaperSlider
      v-model="s.design.borderWidth"
      label="线宽"
      suffix=" px"
      :min="RANGES.borderWidth.min"
      :max="RANGES.borderWidth.max"
      :step="RANGES.borderWidth.step"
      :disabled="s.design.borderStyle === 'none'"
    />
    <PaperSlider
      v-model="s.design.borderGap"
      label="双线间距"
      suffix=" px"
      :min="RANGES.borderGap.min"
      :max="RANGES.borderGap.max"
      :step="RANGES.borderGap.step"
      :disabled="s.design.borderStyle !== 'double'"
    />
  </PaperCard>
</template>
