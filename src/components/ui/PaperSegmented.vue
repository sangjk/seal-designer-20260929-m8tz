<script lang="ts">
/** 分段项。 */
export interface SegmentedOption {
  value: string;
  label: string;
}
</script>

<script setup lang="ts">
/**
 * Paper Design 分段选择器（单选组的紧凑形态）。
 *
 * 语义：`role="radiogroup"` + `role="radio"`，支持键盘方向键切换。
 */

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SegmentedOption[];
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

/**
 * 选中某一项。
 *
 * @param value 目标值。
 */
function select(value: string): void {
  if (props.disabled || value === props.modelValue) {
    return;
  }
  emit('update:modelValue', value);
}

/**
 * 方向键在分段间移动选择。
 *
 * @param event 键盘事件。
 */
function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled) {
    return;
  }
  let delta = 0;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    delta = 1;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    delta = -1;
  }
  if (delta === 0 || props.options.length === 0) {
    return;
  }
  event.preventDefault();
  const index = props.options.findIndex((o) => o.value === props.modelValue);
  const base = index < 0 ? 0 : index;
  const next = props.options[(base + delta + props.options.length) % props.options.length];
  if (next) {
    select(next.value);
  }
}
</script>

<template>
  <div class="seg-field">
    <span v-if="label" class="seg-field__label">{{ label }}</span>
    <div
      class="seg"
      role="radiogroup"
      :aria-label="label || undefined"
      :aria-disabled="disabled ? 'true' : 'false'"
      @keydown="handleKeydown"
    >
      <button
        v-for="option in options"
        :key="option.value"
        class="seg__item"
        :class="{ 'is-active': option.value === modelValue }"
        type="button"
        role="radio"
        :aria-checked="option.value === modelValue ? 'true' : 'false'"
        :tabindex="option.value === modelValue ? 0 : -1"
        :disabled="disabled"
        @click="select(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.seg-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.seg-field__label {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.seg {
  display: flex;
  gap: 2px;
  padding: 2px;
  background-color: var(--fg-4);
  border-radius: var(--radius-base);
  outline: 1px solid var(--outline-card);
}

.seg__item {
  flex: 1 1 0;
  min-width: 0;
  padding: 6px var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--fg-70);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    background-color var(--transition-interactive),
    color var(--transition-interactive);
}

.seg__item:hover:not(:disabled):not(.is-active) {
  background-color: var(--fg-8);
  color: var(--color-foreground);
}

.seg__item:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.seg__item.is-active {
  background-color: var(--color-surface);
  color: var(--color-foreground);
  outline: 1px solid var(--outline-card);
}

.seg__item:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  color: var(--color-fg-disabled);
}
</style>
