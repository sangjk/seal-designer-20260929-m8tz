<script lang="ts">
/** 模块级自增序列，保证 label ↔ input 的 id 唯一。 */
let inputSeq = 0;

/**
 * 取得下一个输入框 id。
 *
 * @returns 形如 `paper-input-7` 的唯一 id。
 */
export function nextInputId(): string {
  inputSeq += 1;
  return `paper-input-${inputSeq}`;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Paper Design 单行文本输入。
 *
 * `maxlength` 一律由调用方从 `core/types.LIMITS` 传入，与 `constraints.clampText`
 * 同源，杜绝「输入框能敲进去但 store 截断」的观感割裂。
 */

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    maxlength: number;
    placeholder?: string;
    disabled?: boolean;
    /** 在标签行右侧显示 `已用/上限` 计数。 */
    showCount?: boolean;
  }>(),
  {
    placeholder: '',
    disabled: false,
    showCount: true,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const fieldId = nextInputId();

/** 当前字符数。 */
const used = computed<number>(() => props.modelValue.length);

/**
 * 处理输入并按上限截断。
 *
 * @param event 输入事件。
 */
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const next =
    target.value.length > props.maxlength ? target.value.slice(0, props.maxlength) : target.value;
  if (next !== target.value) {
    target.value = next;
  }
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="pinput" :class="{ 'is-disabled': disabled }">
    <div class="pinput__head">
      <label class="pinput__label" :for="fieldId">{{ label }}</label>
      <span v-if="showCount" class="pinput__count">{{ used }}/{{ maxlength }}</span>
    </div>
    <input
      :id="fieldId"
      class="pinput__control selectable"
      type="text"
      autocomplete="off"
      spellcheck="false"
      :value="modelValue"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
.pinput {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pinput__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.pinput__label {
  display: block;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.pinput__count {
  font-size: 12px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--fg-50);
}

.pinput__control {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 8px var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: transparent;
  color: var(--color-foreground);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  transition:
    border-color var(--transition-interactive),
    background-color var(--transition-interactive);
}

.pinput__control::placeholder {
  color: var(--fg-50);
}

.pinput__control:hover:not(:disabled) {
  border-color: var(--color-border-dark);
}

.pinput__control:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-color: var(--color-focus);
}

.pinput__control:disabled {
  background-color: var(--fg-4);
  color: var(--color-fg-disabled);
  cursor: not-allowed;
}

.pinput.is-disabled {
  opacity: 0.7;
}

.pinput.is-disabled .pinput__label,
.pinput.is-disabled .pinput__count {
  color: var(--color-fg-disabled);
}
</style>
