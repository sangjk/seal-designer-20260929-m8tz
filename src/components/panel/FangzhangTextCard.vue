<script setup lang="ts">
import PaperButton from '@/components/ui/PaperButton.vue';
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperInput from '@/components/ui/PaperInput.vue';
import PaperSlider from '@/components/ui/PaperSlider.vue';
import {
  BTN_ADD_ROW,
  BTN_REMOVE_ROW,
  CARD_FANGZHANG_TEXT,
  ROW_LIMIT_HINT,
} from '@/core/copy';
import { LIMITS, RANGES } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/** F-16 ~ F-18：方章多行文字（1–8 行增删）/ 行间距 / 附加文字。 */

const s = useDesignStore();

/**
 * 更新指定行文本。
 *
 * @param index 行索引。
 * @param value 新文本。
 */
function setRow(index: number, value: string): void {
  s.design.fangTexts[index] = value;
}
</script>

<template>
  <PaperCard :title="CARD_FANGZHANG_TEXT" :hint="ROW_LIMIT_HINT" compact>
    <div v-for="(row, index) in s.design.fangTexts" :key="`fang-${index}`" class="row">
      <div class="row__input">
        <PaperInput
          :model-value="row"
          :label="`第 ${index + 1} 行`"
          placeholder="请输入文字"
          :maxlength="LIMITS.rowText"
          @update:model-value="(v: string) => setRow(index, v)"
        />
      </div>
      <PaperButton
        variant="ghost"
        size="xs"
        :disabled="!s.canRemoveFangRow"
        @click="s.removeTextRow('fang', index)"
      >
        {{ BTN_REMOVE_ROW }}
      </PaperButton>
    </div>

    <PaperButton
      variant="outline"
      size="sm"
      block
      :disabled="!s.canAddFangRow"
      @click="s.addTextRow('fang')"
    >
      {{ BTN_ADD_ROW }}
    </PaperButton>

    <PaperSlider
      v-model="s.design.fangLineGap"
      label="行间距"
      suffix=" px"
      :min="RANGES.fangLineGap.min"
      :max="RANGES.fangLineGap.max"
      :step="RANGES.fangLineGap.step"
    />

    <PaperInput
      v-model="s.design.fangzhangSubText"
      label="附加文字"
      placeholder="（可留空）"
      :maxlength="LIMITS.subText"
    />
  </PaperCard>
</template>

<style scoped>
.row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.row__input {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
