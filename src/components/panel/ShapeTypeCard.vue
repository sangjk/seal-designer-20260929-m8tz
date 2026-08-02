<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperSegmented from '@/components/ui/PaperSegmented.vue';
import type { SegmentedOption } from '@/components/ui/PaperSegmented.vue';
import { CARD_SHAPE } from '@/core/copy';
import type { Arrangement, LayoutStyle, Shape } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/**
 * F-01 ~ F-04：外形 / 印文类型 / 排版版式 / 文字走向。
 *
 * 形状与版式的互斥联动由 store 的 `setShape` / `setLayoutStyle` 负责（F-04）。
 */

const s = useDesignStore();

const shapeOptions: SegmentedOption[] = [
  { value: 'circle', label: '圆形' },
  { value: 'ellipse', label: '椭圆' },
  { value: 'square', label: '方形' },
];

const sealTypeOptions: SegmentedOption[] = [
  { value: 'yangwen', label: '朱文（阳文）' },
  { value: 'yinwen', label: '白文（阴文）' },
];

const layoutOptions: SegmentedOption[] = [
  { value: 'gongzhang', label: '公章' },
  { value: 'fangzhang', label: '方章' },
  { value: 'free', label: '自由' },
];

const arrangementOptions: SegmentedOption[] = [
  { value: 'horizontal', label: '横排' },
  { value: 'vertical', label: '竖排' },
];

/**
 * 切换外形。
 *
 * @param value 分段值。
 */
function onShape(value: string): void {
  s.setShape(value as Shape);
}

/**
 * 切换版式。
 *
 * @param value 分段值。
 */
function onLayout(value: string): void {
  s.setLayoutStyle(value as LayoutStyle);
}

/**
 * 切换文字走向。
 *
 * @param value 分段值。
 */
function onArrangement(value: string): void {
  s.design.arrangement = value as Arrangement;
}
</script>

<template>
  <PaperCard :title="CARD_SHAPE" compact>
    <PaperSegmented
      label="外形"
      :model-value="s.design.shape"
      :options="shapeOptions"
      @update:model-value="onShape"
    />
    <PaperSegmented
      label="印文类型"
      :model-value="s.design.sealType"
      :options="sealTypeOptions"
      @update:model-value="(v: string) => (s.design.sealType = v as 'yangwen' | 'yinwen')"
    />
    <PaperSegmented
      label="排版版式"
      :model-value="s.design.layoutStyle"
      :options="layoutOptions"
      @update:model-value="onLayout"
    />
    <PaperSegmented
      v-if="!s.gongzhangActive"
      label="文字走向"
      :model-value="s.design.arrangement"
      :options="arrangementOptions"
      @update:model-value="onArrangement"
    />
  </PaperCard>
</template>
