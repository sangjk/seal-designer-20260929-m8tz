<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperSlider from '@/components/ui/PaperSlider.vue';
import { CARD_ADJUST } from '@/core/copy';
import { RANGES } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/**
 * F-21 ~ F-27：印章尺寸、各类字号、弧度/字距/边距、中心区偏移等精细调整。
 *
 * 全部滑块的 min/max/step 直接展开自 `RANGES`，与 store 夹取同源。
 * 仅公章版式相关的项在 `gongzhangActive` 为真时显示。
 */

const s = useDesignStore();
</script>

<template>
  <PaperCard :title="CARD_ADJUST" compact>
    <PaperSlider
      v-model="s.design.sealSize"
      label="印章尺寸"
      suffix=" px"
      :min="RANGES.sealSize.min"
      :max="RANGES.sealSize.max"
      :step="RANGES.sealSize.step"
    />

    <PaperSlider
      v-model="s.design.fontSize"
      :label="s.gongzhangActive ? '上弧字号' : '主文字号'"
      suffix=" px"
      :min="RANGES.fontSize.min"
      :max="RANGES.fontSize.max"
      :step="RANGES.fontSize.step"
    />

    <template v-if="s.gongzhangActive">
      <PaperSlider
        v-model="s.design.topCharGap"
        label="上弧字距"
        suffix=" px"
        :min="RANGES.topCharGap.min"
        :max="RANGES.topCharGap.max"
        :step="RANGES.topCharGap.step"
      />
      <PaperSlider
        v-model="s.design.topArcDeg"
        label="上弧张角"
        suffix="°"
        :min="RANGES.topArcDeg.min"
        :max="RANGES.topArcDeg.max"
        :step="RANGES.topArcDeg.step"
      />
      <PaperSlider
        v-model="s.design.topMargin"
        label="上弧边距"
        suffix=" px"
        :min="RANGES.topMargin.min"
        :max="RANGES.topMargin.max"
        :step="RANGES.topMargin.step"
      />

      <PaperSlider
        v-model="s.design.bottomFontSize"
        label="下弧字号"
        suffix=" px"
        :min="RANGES.bottomFontSize.min"
        :max="RANGES.bottomFontSize.max"
        :step="RANGES.bottomFontSize.step"
      />
      <PaperSlider
        v-model="s.design.bottomCharGap"
        label="下弧字距"
        suffix=" px"
        :min="RANGES.bottomCharGap.min"
        :max="RANGES.bottomCharGap.max"
        :step="RANGES.bottomCharGap.step"
      />
      <PaperSlider
        v-model="s.design.bottomArcDeg"
        label="下弧张角"
        suffix="°"
        :min="RANGES.bottomArcDeg.min"
        :max="RANGES.bottomArcDeg.max"
        :step="RANGES.bottomArcDeg.step"
      />
      <PaperSlider
        v-model="s.design.bottomMargin"
        label="下弧边距"
        suffix=" px"
        :min="RANGES.bottomMargin.min"
        :max="RANGES.bottomMargin.max"
        :step="RANGES.bottomMargin.step"
      />

      <PaperSlider
        v-model="s.design.centerFontSize"
        label="中心字号"
        suffix=" px"
        :min="RANGES.centerFontSize.min"
        :max="RANGES.centerFontSize.max"
        :step="RANGES.centerFontSize.step"
      />
      <PaperSlider
        v-model="s.design.centerLineGap"
        label="中心行距"
        suffix=" px"
        :min="RANGES.centerLineGap.min"
        :max="RANGES.centerLineGap.max"
        :step="RANGES.centerLineGap.step"
      />
      <PaperSlider
        v-model="s.design.centerOffset"
        label="中心上移"
        suffix=" px"
        :min="RANGES.centerOffset.min"
        :max="RANGES.centerOffset.max"
        :step="RANGES.centerOffset.step"
      />
      <PaperSlider
        v-model="s.design.centerBottomGap"
        label="中心下留白"
        suffix=" px"
        :min="RANGES.centerBottomGap.min"
        :max="RANGES.centerBottomGap.max"
        :step="RANGES.centerBottomGap.step"
      />
    </template>
  </PaperCard>
</template>
