<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperInput from '@/components/ui/PaperInput.vue';
import PaperSegmented from '@/components/ui/PaperSegmented.vue';
import type { SegmentedOption } from '@/components/ui/PaperSegmented.vue';
import PaperSlider from '@/components/ui/PaperSlider.vue';
import { CARD_CENTER } from '@/core/copy';
import { LIMITS, RANGES, type CenterStyle } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/**
 * F-08 ~ F-10：中心元素样式 / 星形大小 / 自定义符号。
 *
 * 仅公章版式生效时显示（由 `ParamPanel` 通过 `v-if="s.gongzhangActive"` 控制）。
 */

const s = useDesignStore();

const centerOptions: SegmentedOption[] = [
  { value: 'star', label: '五角星' },
  { value: 'text', label: '文字' },
  { value: 'none', label: '无' },
];

/**
 * 切换中心元素样式。
 *
 * @param value 分段值。
 */
function onCenterStyle(value: string): void {
  s.design.centerStyle = value as CenterStyle;
}
</script>

<template>
  <PaperCard :title="CARD_CENTER" compact>
    <PaperSegmented
      label="中心元素"
      :model-value="s.design.centerStyle"
      :options="centerOptions"
      @update:model-value="onCenterStyle"
    />
    <PaperSlider
      v-if="s.design.centerStyle === 'star'"
      v-model="s.design.starSize"
      label="星形大小"
      suffix=" px"
      :min="RANGES.starSize.min"
      :max="RANGES.starSize.max"
      :step="RANGES.starSize.step"
    />
    <PaperInput
      v-if="s.design.centerStyle === 'star'"
      v-model="s.design.centerSymbol"
      label="自定义符号"
      placeholder="★"
      :maxlength="LIMITS.centerSymbol"
    />
  </PaperCard>
</template>
