/**
 * 全量用户可见文案常量表。
 *
 * ★ 禁用词单一防线（架构设计 §7.1）：
 *   全应用**任何**用户可见文案都必须来自本文件或由本文件的模板函数生成。
 *   严禁在组件中硬编码任何 PRD 第 341 行「禁用词清单」中的词汇。
 *   统一中性措辞：**开通 / 解锁 / 未开通 / 已开通 / 完整版**。
 *   （本文件刻意不复述禁用词原文，以免 QA 关键字扫描产生误报。）
 */

/** 应用与品牌。 */
export const APP_NAME = '印章生成器';
export const NAV_DESIGNER = '设计器';
export const NAV_ABOUT = '关于';

/** 解锁状态相关（Q5 拍板措辞，逐字不可改）。 */
export const UNLOCK_LOCKED = '未开通导出功能';
export const UNLOCK_OPEN = '已开通导出功能（完整版）';
export const BTN_UNLOCK = '开通导出功能';

/** 免责声明（F-47 / Q8）。 */
export const DISCLAIMER = '仅供设计参考与娱乐，请遵守相关法律法规';

/** 设计免责声明：基于本项目进行印章设计的权责声明（用户要求，置于关于页与导出按钮下方）。 */
export const DISCLAIMER_DESIGN =
  '本软件仅为印章排版设计辅助工具，所生成的图案不代表任何真实、有效的印鉴。用户依据本软件进行印章的设计、制作与使用，须自行遵守《中华人民共和国印章治安管理办法》等相关法律法规，并承担由此产生的一切法律责任与后果。';

/** 导出区域。 */
export const EXPORT_TITLE = '导出';
export const BTN_EXPORT_PNG = '导出 PNG';
export const BTN_EXPORT_SVG = '导出 SVG';
export const EXPORT_PNG_HINT = '3× 高清透明背景位图';
export const EXPORT_SVG_HINT = '可无损缩放的矢量文件';
export const EXPORT_LOCKED_HINT = '导出功能属于完整版，开通后即可保存文件';
export const EXPORT_SAVE_TITLE_PNG = '保存 PNG 图片';
export const EXPORT_SAVE_TITLE_SVG = '保存 SVG 文件';
export const TOAST_EXPORT_PNG_OK = 'PNG 已导出（透明背景）';
export const TOAST_EXPORT_SVG_OK = 'SVG 已导出（矢量文件）';
export const TOAST_EXPORT_CANCELLED = '已取消保存';
export const TOAST_EXPORT_FAILED = '导出失败，请稍后重试';
export const TOAST_RENDER_FAILED = '渲染失败，请调整参数后重试';

/** 支付弹窗。 */
export const PAY_TITLE = '开通导出功能';
export const PAY_SUBTITLE = '一次开通，长期可用（本机生效）';
export const PAY_CHANNEL_WECHAT = '微信支付';
export const PAY_CHANNEL_ALIPAY = '支付宝';
export const PAY_SCAN_TIP = '请使用对应 App 扫码支付';
export const PAY_AMOUNT_LABEL = '应付金额';
export const PAY_ORDER_LABEL = '订单号';
export const PAY_WAITING = '等待支付…';
export const PAY_COUNTDOWN_PREFIX = '剩余';
export const PAY_SUCCESS = '支付成功，已开通导出功能（完整版）';
export const PAY_TIMEOUT = '支付超时，订单已关闭，可重新发起';
export const PAY_FAILED = '支付未完成，请重试';
export const PAY_CREATING = '正在创建订单…';
export const PAY_CREATE_FAILED = '订单创建失败，请检查网络后重试';
export const BTN_PAY_RETRY = '重新发起';
export const BTN_PAY_CLOSE = '关闭';
export const PAY_NOTICE = '支付完成后请勿立即关闭窗口，系统将在数秒内自动确认。';

/** 参数面板卡片标题。 */
export const CARD_SHAPE = '形状与类型';
export const CARD_BORDER = '边框';
export const CARD_CENTER = '中心元素';
export const CARD_GONGZHANG_TEXT = '公章文字';
export const CARD_FANGZHANG_TEXT = '方章文字';
export const CARD_FREE_TEXT = '自由排版文字';
export const CARD_ADJUST = '精细调整';
export const CARD_COLOR = '印色';
export const CARD_FONT = '字体';
export const CARD_REALISTIC = '做旧效果';
export const CARD_PRESET = '快速预设';

/** 预览区。 */
export const PREVIEW_TITLE = '实时预览';
export const PREVIEW_EMPTY = '调整左侧参数即可实时预览';
export const PREVIEW_RENDERING = '正在合成做旧效果…';
export const PREVIEW_TEXTURE_FALLBACK = '未找到内置纹理，已使用程序化纹理替代';
export const PREVIEW_VECTOR_TAG = '矢量预览';
export const PREVIEW_RASTER_TAG = '做旧位图';

/** 应用启动过渡。 */
export const BOOTING = '正在启动…';

/** 参数面板。 */
export const PANEL_TITLE = '参数设置';

/** 字体可用性提示（ADR-005，中性措辞）。 */
export const FONT_MISSING_HINT = '当前系统未检测到该字体，已自动回退到同类字体显示';

/** 文本行编辑。 */
export const BTN_ADD_ROW = '增加一行';
export const BTN_REMOVE_ROW = '删除该行';
export const ROW_LIMIT_HINT = '最多 8 行';

/** 通用按钮。 */
export const BTN_RESET = '恢复默认';
export const BTN_BACK = '返回设计器';

/** 关于页。 */
export const ABOUT_TITLE = '关于 印章生成器';
export const ABOUT_INTRO =
  '印章生成器是一款完全本地运行的印章设计工具，支持公章、方章与自由排版三种版式，可实时预览做旧效果，并导出高清 PNG 与矢量 SVG。';
export const ABOUT_OFFLINE = '本应用不上传任何设计内容，全部渲染均在本机完成。';
export const ABOUT_VERSION_LABEL = '版本';
export const ABOUT_PRODUCT_LABEL = '产品名称';
export const ABOUT_DISCLAIMER_TITLE = '免责声明';

/**
 * 构建倒计时文案。
 *
 * @param seconds 剩余秒数。
 * @returns 形如「剩余 04:59」的文案。
 */
export function payCountdownText(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${PAY_COUNTDOWN_PREFIX} ${mm}:${ss}`;
}

/**
 * 构建导出成功后的路径提示。
 *
 * @param path 实际保存路径。
 * @returns 形如「已保存到 C:\\...\\seal.png」的文案。
 */
export function savedToText(path: string): string {
  return `已保存到 ${path}`;
}

/**
 * 构建预览缩放比例文案。
 *
 * @param ratio 缩放比例（1 表示 100%）。
 * @returns 形如「显示比例 85%」的文案。
 */
export function zoomText(ratio: number): string {
  const pct = Math.round(Math.max(0, ratio) * 100);
  return `显示比例 ${pct}%`;
}

/**
 * 构建金额文案。
 *
 * @param price 金额字符串，如 `9.9`。
 * @returns 形如「¥ 9.9」的文案。
 */
export function priceText(price: string): string {
  return `¥ ${price}`;
}
