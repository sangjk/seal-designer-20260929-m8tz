<script setup lang="ts">
import { computed } from 'vue';
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperSelect from '@/components/ui/PaperSelect.vue';
import type { SelectOption } from '@/components/ui/PaperSelect.vue';
import PaperToggle from '@/components/ui/PaperToggle.vue';
import { CARD_FONT, FONT_MISSING_HINT } from '@/core/copy';
import { FONT_OPTIONS, isFontAvailable } from '@/core/fonts';
import { useDesignStore } from '@/stores/design';

/**
 * F-30 / F-31：字体选择与加粗。
 *
 * 字体可用性在运行时探测（ADR-005）；缺失时给中性提示，不阻断使用。
 */

const s = useDesignStore();

/** 下拉项（对不可用字体附带中性提示）。 */
const fontOptions = computed<SelectOption[]>(() =>
  FONT_OPTIONS.map((option) => {
    const available = isFontAvailable(option.probe);
    return {
      value: option.value,
      label: option.label,
      hint: available ? undefined : FONT_MISSING_HINT,
    };
  }),
);

/**
 * 切换字体栈。
 *
 * @param value 字体栈字符串。
 */
function onFont(value: string): void {
  s.setFontFamily(value);
}
</script>

<template>
  <PaperCard :title="CARD_FONT" compact>
    <PaperSelect
      label="字体"
      :model-value="s.design.fontFamily"
      :options="fontOptions"
      @update:model-value="onFont"
    />
    <PaperToggle v-model="s.design.bold" label="加粗" />
  </PaperCard>
</template>
