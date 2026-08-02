import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import {
  applyLayoutConstraint,
  applyShapeConstraint,
  canAddRow,
  canRemoveRow,
  clampDesign,
  isGongzhangActive,
} from '@/core/constraints';
import { createDefaultDesign } from '@/core/defaults';
import { PRESETS } from '@/core/presets';
import type {
  LayoutStyle,
  PresetKey,
  SealDesign,
  Shape,
  TextRowKind,
} from '@/core/types';

/**
 * 设计参数状态仓库。
 *
 * 约定（架构设计 §3.4）：参数卡片**不接收 props**，直接
 * `const s = useDesignStore()` 后 `v-model="s.design.xxx"`。
 * 所有结构性变更（形状 / 版式 / 行增删 / 预设）必须走本 store 的 action，
 * 以保证 `constraints.ts` 的联动与夹取始终生效。
 */
export const useDesignStore = defineStore('design', () => {
  /** 当前设计态（响应式，供 v-model 直接双向绑定）。 */
  const design = reactive<SealDesign>(createDefaultDesign());

  /** 公章环形排布是否真正生效（方形时退化，用于卡片显隐）。 */
  const gongzhangActive = computed<boolean>(() => isGongzhangActive(design));

  /** 当前是否为方章版式。 */
  const fangzhangActive = computed<boolean>(() => design.layoutStyle === 'fangzhang');

  /** 当前是否为自由排版版式。 */
  const freeActive = computed<boolean>(() => design.layoutStyle === 'free');

  /** 方章文本行是否可继续增加。 */
  const canAddFangRow = computed<boolean>(() => canAddRow(design.fangTexts));

  /** 方章文本行是否可删除。 */
  const canRemoveFangRow = computed<boolean>(() => canRemoveRow(design.fangTexts));

  /** 自由排版文本行是否可继续增加。 */
  const canAddFreeRow = computed<boolean>(() => canAddRow(design.freeTexts));

  /** 自由排版文本行是否可删除。 */
  const canRemoveFreeRow = computed<boolean>(() => canRemoveRow(design.freeTexts));

  /**
   * 对当前设计态做一次完整规范化（数值夹取 + 文本截断 + 行数夹取 + 版式联动）。
   *
   * 幂等，可在任意 action 结尾安全调用。
   */
  function normalize(): void {
    clampDesign(design);
  }

  /**
   * 切换印章外形（F-04：方形与公章版式互斥）。
   *
   * @param shape 目标外形。
   */
  function setShape(shape: Shape): void {
    applyShapeConstraint(design, shape);
    normalize();
  }

  /**
   * 切换排版版式（F-04：选择公章版式时方形自动切回圆形）。
   *
   * @param layout 目标版式。
   */
  function setLayoutStyle(layout: LayoutStyle): void {
    applyLayoutConstraint(design, layout);
    normalize();
  }

  /**
   * 取出指定类别的文本行数组引用。
   *
   * @param kind 行类别。
   * @returns 对应的响应式数组。
   */
  function rowsOf(kind: TextRowKind): string[] {
    return kind === 'fang' ? design.fangTexts : design.freeTexts;
  }

  /**
   * 追加一行文本（受 `LIMITS.maxRows` 上限约束）。
   *
   * @param kind 行类别（方章 / 自由排版）。
   */
  function addTextRow(kind: TextRowKind): void {
    const rows = rowsOf(kind);
    if (!canAddRow(rows)) {
      return;
    }
    rows.push('');
    normalize();
  }

  /**
   * 删除指定索引的文本行（受 `LIMITS.minRows` 下限约束）。
   *
   * @param kind 行类别（方章 / 自由排版）。
   * @param index 行索引。
   */
  function removeTextRow(kind: TextRowKind, index: number): void {
    const rows = rowsOf(kind);
    if (!canRemoveRow(rows) || index < 0 || index >= rows.length) {
      return;
    }
    rows.splice(index, 1);
    normalize();
  }

  /**
   * 应用快速预设（F-39）。
   *
   * 预设为 `Partial<SealDesign>`，逐字段覆盖当前设计态后统一规范化。
   *
   * @param key 预设键。
   */
  function applyPreset(key: PresetKey): void {
    const preset = PRESETS[key];
    Object.assign(design, {
      ...preset,
      fangTexts: preset.fangTexts ? [...preset.fangTexts] : design.fangTexts,
      freeTexts: preset.freeTexts ? [...preset.freeTexts] : design.freeTexts,
    });
    normalize();
  }

  /**
   * 设置印色（F-28 / F-29）。
   *
   * @param hex 十六进制色值，来自 `core/palette.ts` 的业务印色表。
   */
  function setColor(hex: string): void {
    design.sealColor = hex;
  }

  /**
   * 设置字体栈（F-30）。
   *
   * @param stack CSS font-family 栈字符串。
   */
  function setFontFamily(stack: string): void {
    design.fontFamily = stack;
  }

  /** 恢复全部参数到默认值。 */
  function reset(): void {
    Object.assign(design, createDefaultDesign());
    normalize();
  }

  return {
    design,
    gongzhangActive,
    fangzhangActive,
    freeActive,
    canAddFangRow,
    canRemoveFangRow,
    canAddFreeRow,
    canRemoveFreeRow,
    normalize,
    setShape,
    setLayoutStyle,
    addTextRow,
    removeTextRow,
    applyPreset,
    setColor,
    setFontFamily,
    reset,
  };
});
