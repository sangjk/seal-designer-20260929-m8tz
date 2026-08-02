<script lang="ts">
/** 模块级自增序列，保证 label ↔ checkbox 的 id 唯一。 */
let toggleSeq = 0;

/**
 * 取得下一个开关 id。
 *
 * @returns 形如 `paper-toggle-5` 的唯一 id。
 */
export function nextToggleId(): string {
  toggleSeq += 1;
  return `paper-toggle-${toggleSeq}`;
}
</script>

<script setup lang="ts">
/**
 * Paper Design 开关。
 *
 * 规格（UI规则 radios-checkboxes-toggle.md）：轨道全圆角，未选 gray-300 / 选中 blue-400，
 * 滑块白色 + 1px fg/6% 边框，focus-within 2px focus 环，禁用态 fg/8% 轨道 + 0.7 透明度。
 */

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    label: string;
    disabled?: boolean;
    /** 标签下方的补充说明。 */
    hint?: string;
  }>(),
  {
    disabled: false,
    hint: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const fieldId = nextToggleId();

/**
 * 处理勾选变更。
 *
 * @param event 变更事件。
 */
function handleChange(event: Event): void {
  if (props.disabled) {
    return;
  }
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
}
</script>

<template>
  <div class="ptoggle" :class="{ 'is-disabled': disabled }">
    <div class="ptoggle__row">
      <label class="ptoggle__label" :for="fieldId">{{ label }}</label>
      <span class="ptoggle__control">
        <input
          :id="fieldId"
          class="ptoggle__input"
          type="checkbox"
          role="switch"
          :checked="modelValue"
          :disabled="disabled"
          @change="handleChange"
        />
        <span class="ptoggle__track" aria-hidden="true">
          <span class="ptoggle__thumb" />
        </span>
      </span>
    </div>
    <p v-if="hint" class="ptoggle__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.ptoggle {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ptoggle__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.ptoggle__label {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
  cursor: pointer;
}

.ptoggle__control {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  width: 40px;
  height: 22px;
}

.ptoggle__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.ptoggle__track {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  background-color: var(--gray-300);
  transition: background-color var(--transition-interactive);
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .ptoggle__track {
    background-color: var(--gray-700);
  }
}

.ptoggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background-color: var(--white);
  border: 1px solid var(--fg-6);
  transition: transform var(--transition-interactive);
}

.ptoggle__input:checked ~ .ptoggle__track {
  background-color: var(--color-blue);
}

.ptoggle__input:checked ~ .ptoggle__track .ptoggle__thumb {
  transform: translateX(18px);
}

.ptoggle__control:focus-within .ptoggle__track {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.ptoggle__input:disabled {
  cursor: not-allowed;
}

.ptoggle__input:disabled ~ .ptoggle__track {
  background-color: var(--fg-8);
}

.ptoggle__input:disabled ~ .ptoggle__track .ptoggle__thumb {
  background-color: var(--fg-20);
}

.ptoggle__hint {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-50);
}

.ptoggle.is-disabled {
  opacity: 0.7;
}

.ptoggle.is-disabled .ptoggle__label {
  color: var(--color-fg-disabled);
  cursor: not-allowed;
}
</style>
