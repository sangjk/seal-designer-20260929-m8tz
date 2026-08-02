<script lang="ts">
/** 模块级自增序列，保证每个滑块实例的 id 唯一（label ↔ input 关联）。 */
let sliderSeq = 0;

/**
 * 取得下一个滑块 id。
 *
 * @returns 形如 `paper-slider-3` 的唯一 id。
 */
export function nextSliderId(): string {
  sliderSeq += 1;
  return `paper-slider-${sliderSeq}`;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Paper Design 数值滑块。
 *
 * min / max / step 一律由调用方从 `core/types.RANGES` 展开传入，
 * 保证「UI 可拖范围」与「store 夹取范围」同源（架构设计 §7 单一真相源）。
 */

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min: number;
    max: number;
    step: number;
    label: string;
    suffix?: string;
    disabled?: boolean;
  }>(),
  {
    suffix: '',
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const fieldId = nextSliderId();

/** 当前值在轨道上的百分比位置（用于已填充轨道着色）。 */
const percent = computed<number>(() => {
  const span = props.max - props.min;
  if (span <= 0) {
    return 0;
  }
  const ratio = (props.modelValue - props.min) / span;
  return Math.min(100, Math.max(0, ratio * 100));
});

/** 展示值：step 含小数时去掉多余零，否则取整。 */
const displayValue = computed<string>(() => {
  if (props.step >= 1) {
    return String(Math.round(props.modelValue));
  }
  const text = props.modelValue.toFixed(2);
  return text.replace(/0+$/, '').replace(/\.$/, '');
});

/**
 * 处理原生 input 事件。
 *
 * @param event 输入事件。
 */
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const value = Number.parseFloat(target.value);
  if (Number.isFinite(value)) {
    emit('update:modelValue', value);
  }
}
</script>

<template>
  <div class="slider" :class="{ 'is-disabled': disabled }">
    <div class="slider__head">
      <label class="slider__label" :for="fieldId">{{ label }}</label>
      <span class="slider__value">{{ displayValue }}{{ suffix }}</span>
    </div>
    <input
      :id="fieldId"
      class="slider__input"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      :style="{ '--fill': `${percent}%` }"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
.slider {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.slider__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.slider__label {
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.slider__value {
  font-size: 12px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--fg-60);
}

.slider__input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 20px;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.slider__input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-base);
}

/* 轨道（WebKit / WebView2） */
.slider__input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    var(--color-blue) 0%,
    var(--color-blue) var(--fill),
    var(--fg-12) var(--fill),
    var(--fg-12) 100%
  );
}

.slider__input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  border: 1px solid var(--fg-20);
  box-shadow: var(--shadow-subtle);
  transition: transform var(--duration-micro) ease-out;
}

.slider__input:hover:not(:disabled)::-webkit-slider-thumb {
  border-color: var(--color-blue);
}

.slider__input:active:not(:disabled)::-webkit-slider-thumb {
  transform: scale(1.1);
}

/* Firefox 兜底（本地开发可能使用非 WebView2 浏览器） */
.slider__input::-moz-range-track {
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--fg-12);
}

.slider__input::-moz-range-progress {
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--color-blue);
}

.slider__input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  border: 1px solid var(--fg-20);
}

.slider.is-disabled {
  opacity: 0.7;
}

.slider.is-disabled .slider__input {
  cursor: not-allowed;
}

.slider.is-disabled .slider__label,
.slider.is-disabled .slider__value {
  color: var(--color-fg-disabled);
}
</style>
