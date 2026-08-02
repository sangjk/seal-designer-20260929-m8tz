<script setup lang="ts">
import PaperButton from '@/components/ui/PaperButton.vue';
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperInput from '@/components/ui/PaperInput.vue';
import PaperSlider from '@/components/ui/PaperSlider.vue';
import { BTN_ADD_ROW, BTN_REMOVE_ROW, CARD_FREE_TEXT, ROW_LIMIT_HINT } from '@/core/copy';
import { LIMITS, RANGES } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/** F-19 ~ F-20：自由排版多行文字（1–8 行增删）/ 字距 / 附加文字。 */

const s = useDesignStore();

/**
 * 更新指定行文本。
 *
 * @param index 行索引。
 * @param value 新文本。
 */
function setRow(index: number, value: string): void {
  s.design.freeTexts[index] = value;
}
</script>

<template>
  <PaperCard :title="CARD_FREE_TEXT" :hint="ROW_LIMIT_HINT" compact>
    <div v-for="(row, index) in s.design.freeTexts" :key="`free-${index}`" class="row">
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
        :disabled="!s.canRemoveFreeRow"
        @click="s.removeTextRow('free', index)"
      >
        {{ BTN_REMOVE_ROW }}
      </PaperButton>
    </div>

    <PaperButton
      variant="outline"
      size="sm"
      block
      :disabled="!s.canAddFreeRow"
      @click="s.addTextRow('free')"
    >
      {{ BTN_ADD_ROW }}
    </PaperButton>

    <PaperSlider
      v-model="s.design.freeSpacing"
      label="字距 / 行距"
      suffix=" px"
      :min="RANGES.freeSpacing.min"
      :max="RANGES.freeSpacing.max"
      :step="RANGES.freeSpacing.step"
    />

    <PaperInput
      v-model="s.design.freeSubText"
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
