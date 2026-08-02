/**
 * 字体栈注册表与运行时可用性探测（F-30 / F-31，ADR-005）。
 *
 * 决策：**不嵌入 CJK 字体**（体积过大），改用 Windows 自带字体回退栈 +
 * 运行时探测；探测失败时给中性提示（`copy.FONT_MISSING_HINT`），不阻断使用。
 */

/** 单个字体选项。 */
export interface FontOption {
  /** 中文显示名。 */
  label: string;
  /** 完整 CSS font-family 栈（作为 `SealDesign.fontFamily` 的值）。 */
  value: string;
  /** 用于可用性探测的首选字体名（不带引号）。 */
  probe: string;
}

/** 五套字体栈（与网页版基线一致）。 */
export const FONT_OPTIONS: readonly FontOption[] = [
  {
    label: '宋体（公章标准）',
    value: "'SimSun','STSong','NSimSun',serif",
    probe: 'SimSun',
  },
  {
    label: '黑体',
    value: "'SimHei','STHeiti','Microsoft YaHei',sans-serif",
    probe: 'SimHei',
  },
  {
    label: '楷体',
    value: "'KaiTi','STKaiti',serif",
    probe: 'KaiTi',
  },
  {
    label: '仿宋',
    value: "'FangSong','STFangsong',serif",
    probe: 'FangSong',
  },
  {
    label: '隶书',
    value: "'LiSu','STLiti',serif",
    probe: 'LiSu',
  },
] as const;

/** 默认字体栈（宋体）。 */
export const DEFAULT_FONT_STACK = FONT_OPTIONS[0].value;

/** 探测用的测试字符串（覆盖 CJK 与拉丁，字形差异明显）。 */
const PROBE_TEXT = '印章生成器ABCabc0123';

/** 探测基准字号（越大差异越明显）。 */
const PROBE_SIZE = 72;

/** 兜底比较基准字体族。 */
const BASE_FAMILIES: readonly string[] = ['monospace', 'sans-serif', 'serif'];

/** 探测结果缓存，避免重复量测。 */
const probeCache = new Map<string, boolean>();

/**
 * 测量给定 font-family 下测试串的宽度。
 *
 * @param ctx Canvas 2D 上下文。
 * @param family 完整 font-family 值。
 * @returns 文本宽度（px）；上下文不可用时返回 0。
 */
function measure(ctx: CanvasRenderingContext2D, family: string): number {
  ctx.font = `${PROBE_SIZE}px ${family}`;
  return ctx.measureText(PROBE_TEXT).width;
}

/**
 * 判断某个具体字体名在当前系统是否可用。
 *
 * 原理：分别以「基准族」和「目标字体, 基准族」量测同一串文本宽度，
 * 若任一基准下宽度发生变化，说明目标字体真实生效。
 *
 * @param fontName 字体名（如 `SimSun`），不要带引号。
 * @returns 可用返回 true；无法判定（无 Canvas 环境）时保守返回 true。
 */
export function isFontAvailable(fontName: string): boolean {
  const key = fontName.trim();
  if (key.length === 0) {
    return false;
  }
  const cached = probeCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  if (typeof document === 'undefined') {
    return true;
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return true;
  }

  let available = false;
  for (const base of BASE_FAMILIES) {
    const baseWidth = measure(ctx, base);
    const testWidth = measure(ctx, `'${key}',${base}`);
    if (Math.abs(testWidth - baseWidth) > 0.5) {
      available = true;
      break;
    }
  }

  probeCache.set(key, available);
  return available;
}

/**
 * 判断整条字体栈是否至少有一个字体在本机可用。
 *
 * @param stack 完整 CSS font-family 栈。
 * @returns 栈中任一具名字体可用即返回 true；仅剩通用族（serif 等）时返回 false。
 */
export function isStackAvailable(stack: string): boolean {
  const names = stack
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter((s) => s.length > 0 && !['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'].includes(s));
  if (names.length === 0) {
    return false;
  }
  return names.some((n) => isFontAvailable(n));
}

/**
 * 按 `SealDesign.fontFamily` 反查字体选项。
 *
 * @param stack 字体栈值。
 * @returns 命中的选项；未命中返回默认（宋体）。
 */
export function findFontOption(stack: string): FontOption {
  return FONT_OPTIONS.find((o) => o.value === stack) ?? FONT_OPTIONS[0];
}
