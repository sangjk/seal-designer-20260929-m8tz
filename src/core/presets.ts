import { DEFAULT_INK } from './palette';
import type { PresetKey, SealDesign } from './types';

/**
 * 四套快速预设（F-39）。
 *
 * 数值自网页版 `applyPreset()` 1:1 移植，逐字段对齐。
 * 预设为 `Partial<SealDesign>`，由 store 合并进当前设计态后统一走 `clampDesign`。
 */

/** 预设显示项。 */
export interface PresetItem {
  key: PresetKey;
  label: string;
  desc: string;
}

/** 公章类共用基线（company / contract / finance 三者仅文本不同）。 */
const GONGZHANG_BASE: Partial<SealDesign> = {
  shape: 'circle',
  sealType: 'yangwen',
  layoutStyle: 'gongzhang',
  borderStyle: 'single',
  borderGap: 8,
  sealSize: 420,
  borderWidth: 5,
  fontSize: 56,
  bottomFontSize: 32,
  centerFontSize: 52,
  starSize: 140,
  topCharGap: 0,
  bottomCharGap: 0,
  topArcDeg: 260,
  bottomArcDeg: 160,
  topMargin: 28,
  bottomMargin: 28,
  centerLineGap: 10,
  centerOffset: 14,
  centerBottomGap: 10,
  sealColor: DEFAULT_INK,
  fontFamily: "'SimSun','STSong','NSimSun',serif",
  centerStyle: 'star',
  centerSymbol: '★',
  serialNumber: '',
  gongzhangSubText: '',
  realistic: true,
  wearLevel: 1,
  wearX: 0,
  wearY: 0,
  wearSize: 80,
  wearFeather: 20,
  bold: true,
};

/** 预设参数表。 */
export const PRESETS: Record<PresetKey, Partial<SealDesign>> = {
  company: {
    ...GONGZHANG_BASE,
    arcTopText: '苏州市工业园区科技创新发展有限公司',
    arcBottomText: 'NO.2024001',
    centerText1: '',
    centerText2: '',
  },
  contract: {
    ...GONGZHANG_BASE,
    arcTopText: '某某科技有限公司',
    arcBottomText: 'NO.2024002',
    centerText1: '合同章',
    centerText2: '',
  },
  finance: {
    ...GONGZHANG_BASE,
    arcTopText: '某某科技有限公司',
    arcBottomText: 'NO.2024003',
    centerText1: '财务章',
    centerText2: '',
  },
  personal: {
    shape: 'circle',
    sealType: 'yangwen',
    layoutStyle: 'fangzhang',
    arrangement: 'vertical',
    borderStyle: 'single',
    borderGap: 8,
    sealSize: 260,
    borderWidth: 4,
    fontSize: 48,
    fangLineGap: 8,
    sealColor: DEFAULT_INK,
    fontFamily: "'KaiTi','STKaiti',serif",
    fangTexts: ['张', '三'],
    fangzhangSubText: '',
    realistic: true,
    wearLevel: 1,
    wearX: 0,
    wearY: 0,
    wearSize: 80,
    wearFeather: 20,
    bold: true,
  },
};

/** 预设在 UI 中的展示顺序与说明。 */
export const PRESET_ITEMS: readonly PresetItem[] = [
  { key: 'company', label: '公司公章', desc: '圆形 · 五角星 · 单线边框' },
  { key: 'contract', label: '合同专用章', desc: '圆形 · 含中心文字' },
  { key: 'finance', label: '财务专用章', desc: '圆形 · 含中心文字' },
  { key: 'personal', label: '个人名章', desc: '方章 · 竖排 · 楷体' },
] as const;
