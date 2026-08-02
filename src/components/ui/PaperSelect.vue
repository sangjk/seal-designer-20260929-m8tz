<script lang="ts">
/** 下拉项。 */
export interface SelectOption {
  value: string;
  label: string;
  /** 可选的辅助说明（如字体可用性提示）。 */
  hint?: string;
}

/** 模块级自增序列，保证 label ↔ select 的 id 唯一。 */
let selectSeq = 0;

/**
 * 取得下一个下拉框 id。
 *
 * @returns 形如 `paper-select-2` 的唯一 id。
 */
export function nextSelectId(): string {
  selectSeq += 1;
  return `paper-select-${selectSeq}`;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Paper Design 原生下拉选择。
 *
 * 使用原生 `<select>`：桌面端 WebView2 下键盘可达性与本地化最好，
 * 且避免自建浮层带来的焦点陷阱（UI规则 inputs.md 状态规格照常适用）。
 */

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SelectOption[];
    label?: string;
    disabled?: boolean;
  }>(),
  {
    label: '',
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const fieldId = nextSelectId();

/** 当前选中项的辅助说明。 */
const activeHint = computed<string>(() => {
  const found = props.options.find((o) => o.value === props.modelValue);
  return found?.hint ?? '';
});

/**
 * 处理选择变更。
 *
 * @param event 变更事件。
 */
function handleChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="pselect" :class="{ 'is-disabled': disabled }">
    <label v-if="label" class="pselect__label" :for="fieldId">{{ label }}</label>
    <div class="pselect__wrap">
      <select
        :id="fieldId"
        class="pselect__control"
        :value="modelValue"
        :disabled="disabled"
        @change="handleChange"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="pselect__chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>
    <p v-if="activeHint" class="pselect__hint">{{ activeHint }}</p>
  </div>
</template>

<style scoped>
.pselect {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pselect__label {
  display: block;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.pselect__wrap {
  position: relative;
  display: block;
}

.pselect__control {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 32px 8px var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: var(--color-surface);
  color: var(--color-foreground);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  cursor: pointer;
  transition: border-color var(--transition-interactive);
}

.pselect__control:hover:not(:disabled) {
  border-color: var(--color-border-dark);
}

.pselect__control:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-color: var(--color-focus);
}

.pselect__control:disabled {
  background-color: var(--fg-4);
  color: var(--color-fg-disabled);
  cursor: not-allowed;
}

.pselect__chevron {
  position: absolute;
  top: 50%;
  right: var(--space-3);
  transform: translateY(-50%);
  display: inline-flex;
  color: var(--fg-50);
  pointer-events: none;
}

.pselect__hint {
  font-size: 12px;
  line-height: 16px;
  color: var(--color-fg-warning);
}

.pselect.is-disabled {
  opacity: 0.7;
}

.pselect.is-disabled .pselect__label {
  color: var(--color-fg-disabled);
}
</style>
