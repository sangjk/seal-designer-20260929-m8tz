<script setup lang="ts">
import PaperCard from '@/components/ui/PaperCard.vue';
import PaperInput from '@/components/ui/PaperInput.vue';
import { CARD_GONGZHANG_TEXT } from '@/core/copy';
import { LIMITS } from '@/core/types';
import { useDesignStore } from '@/stores/design';

/** F-11 ~ F-15：上弧文字 / 下弧文字 / 中心两行文字 / 编号 / 附加文字。 */

const s = useDesignStore();
</script>

<template>
  <PaperCard :title="CARD_GONGZHANG_TEXT" compact>
    <PaperInput
      v-model="s.design.arcTopText"
      label="上弧文字"
      placeholder="某某科技有限公司"
      :maxlength="LIMITS.arcTopText"
    />
    <PaperInput
      v-model="s.design.arcBottomText"
      label="下弧文字"
      placeholder="NO.2024001"
      :maxlength="LIMITS.arcBottomText"
    />
    <PaperInput
      v-model="s.design.centerText1"
      label="中心文字 · 第一行"
      placeholder="合同专用章"
      :maxlength="LIMITS.centerText"
    />
    <PaperInput
      v-model="s.design.centerText2"
      label="中心文字 · 第二行"
      placeholder="（可留空）"
      :maxlength="LIMITS.centerText"
    />
    <PaperInput
      v-model="s.design.serialNumber"
      label="编号"
      placeholder="（可留空）"
      :maxlength="LIMITS.serialNumber"
    />
    <PaperInput
      v-model="s.design.gongzhangSubText"
      label="附加文字"
      placeholder="（可留空）"
      :maxlength="LIMITS.subText"
    />
  </PaperCard>
</template>
