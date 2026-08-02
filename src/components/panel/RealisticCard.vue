<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperSlider from '@/components/ui/PaperSlider.vue';
import PaperToggle from '@/components/ui/PaperToggle.vue';
import { CARD_REALISTIC } from '@/core/copy';
import { RANGES } from '@/core/types';
import { useNoiseTexture } from '@/composables/useNoiseTexture';
import { useDesignStore } from '@/stores/design';

/**
 * F-32 ~ F-36：做旧开关 / 磨损强度 / 区域位置 / 区域大小 / 羽化。
 *
 * 打开开关时立即预热纹理（同源 `sealNoisy.png`，缺失走程序化兜底）。
 */

const s = useDesignStore();
const noise = useNoiseTexture();

/**
 * 切换做旧开关。
 *
 * @param value 新开关值。
 */
function onToggle(value: boolean): void {
  s.design.realistic = value;
  if (value) {
    void noise.load();
  }
}
</script>

<template>
  <PaperCard :title="CARD_REALISTIC" compact>
    <PaperToggle
      :model-value="s.design.realistic"
      label="做旧效果"
      @update:model-value="onToggle"
    />

    <template v-if="s.design.realistic">
      <PaperSlider
        v-model="s.design.wearLevel"
        label="磨损强度"
        :min="RANGES.wearLevel.min"
        :max="RANGES.wearLevel.max"
        :step="RANGES.wearLevel.step"
      />
      <PaperSlider
        v-model="s.design.wearSize"
        label="磨损区域大小"
        suffix=" %"
        :min="RANGES.wearSize.min"
        :max="RANGES.wearSize.max"
        :step="RANGES.wearSize.step"
      />
      <PaperSlider
        v-model="s.design.wearX"
        label="磨损区域 X 偏移"
        suffix=" px"
        :min="RANGES.wearX.min"
        :max="RANGES.wearX.max"
        :step="RANGES.wearX.step"
      />
      <PaperSlider
        v-model="s.design.wearY"
        label="磨损区域 Y 偏移"
        suffix=" px"
        :min="RANGES.wearY.min"
        :max="RANGES.wearY.max"
        :step="RANGES.wearY.step"
      />
      <PaperSlider
        v-model="s.design.wearFeather"
        label="边缘羽化"
        suffix=" px"
        :min="RANGES.wearFeather.min"
        :max="RANGES.wearFeather.max"
        :step="RANGES.wearFeather.step"
      />
    </template>
  </PaperCard>
</template>
