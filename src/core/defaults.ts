import type { SealDesign } from './types';
import { DEFAULT_FONT_STACK } from './fonts';

/**
 * 创建一份默认设计态。
 *
 * 默认值与网页版基线 `S` 对象逐字段对齐，保证首屏预览结果一致。
 * 每次调用返回**全新对象**（数组亦为新引用），避免 store 之间共享引用。
 *
 * @returns 全新的默认 `SealDesign`。
 */
export function createDefaultDesign(): SealDesign {
  return {
    // 形状与类型
    shape: 'circle',
    sealType: 'yangwen',
    layoutStyle: 'gongzhang',
    arrangement: 'horizontal',

    // 边框
    borderStyle: 'single',
    borderGap: 8,
    borderWidth: 12,

    // 尺寸与字号
    sealSize: 420,
    fontSize: 56,
    bottomFontSize: 32,
    centerFontSize: 52,
    starSize: 140,

    // 弧形排布
    topCharGap: -8,
    bottomCharGap: -5,
    topArcDeg: 260,
    bottomArcDeg: 160,
    topMargin: 39,
    bottomMargin: 28,

    // 中心区
    centerLineGap: 10,
    centerOffset: 14,
    centerBottomGap: 10,

    // 外观
    sealColor: '#FF0000', // 朱红
    fontFamily: DEFAULT_FONT_STACK,
    bold: true,

    // 中心元素
    centerStyle: 'text',
    centerSymbol: '★',

    // 公章文本
    arcTopText: '某某某科技有限公司',
    arcBottomText: '123456789',
    centerText1: '合同章',
    centerText2: '',
    serialNumber: '',
    gongzhangSubText: '',

    // 方章文本
    fangTexts: ['人言信息', '科技', '有限'],
    fangzhangSubText: '',
    fangLineGap: 8,

    // 自由排版文本
    freeTexts: ['人言信息', '科技'],
    freeSubText: '',
    freeSpacing: 8,

    // 做旧（默认开启：磨损强度 1.4、磨损区域 120%）
    realistic: true,
    wearLevel: 1.4,
    wearX: 0,
    wearY: 0,
    wearSize: 120,
    wearFeather: 20,
  };
}

/**
 * 深拷贝一份设计态（仅含基本类型与字符串数组，无需结构化克隆）。
 *
 * @param d 源设计态。
 * @returns 全新的副本。
 */
export function cloneDesign(d: SealDesign): SealDesign {
  return {
    ...d,
    fangTexts: [...d.fangTexts],
    freeTexts: [...d.freeTexts],
  };
}
