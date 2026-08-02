import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { ref, type Ref } from 'vue';
import { buildSvg } from '@/core/buildSvg';
import {
  EXPORT_SAVE_TITLE_PNG,
  EXPORT_SAVE_TITLE_SVG,
  TOAST_EXPORT_CANCELLED,
  TOAST_EXPORT_FAILED,
  TOAST_EXPORT_PNG_OK,
  TOAST_EXPORT_SVG_OK,
  savedToText,
} from '@/core/copy';
import { defaultExportFileName, renderPng } from '@/core/exportRaster';
import { EXPORT_SCALE, type ExportFormat } from '@/core/types';
import { useDesignStore } from '@/stores/design';
import { useNoiseTexture } from './useNoiseTexture';
import { openPaymentDialog } from './usePaymentDialog';
import { useToast } from './useToast';
import { useUnlock } from './useUnlock';

/**
 * 导出编排（架构设计 §4.3 / ADR-007）。
 *
 * 顺序：**闸门 → 渲染 → 保存对话框 → invoke 落盘**。
 *
 * ★ 前端这层闸门只是 UX 拦截（未开通就弹支付，不去做无用功），**不是安全边界**：
 *   真正的闸门在 Rust `export_png` / `export_svg` 的首行解锁态校验。
 * ★ 渲染复用 `buildSvg` + `applyAging`（经 `renderPng`），与预览同源，
 *   不存在第二套渲染实现（F-41 / AC-20）。
 */

/** PNG 保存对话框过滤器名称。 */
const FILTER_PNG = 'PNG 图片';

/** SVG 保存对话框过滤器名称。 */
const FILTER_SVG = 'SVG 矢量图';

/** 导出 API。 */
export interface ExportApi {
  /** 是否正在导出（用于按钮 loading 态，避免重复触发）。 */
  exporting: Ref<boolean>;
  /** 请求导出指定格式；未开通时会弹出支付弹窗并在解锁后自动续做。 */
  requestExport: (format: ExportFormat) => Promise<void>;
}

/**
 * 创建导出编排。
 *
 * @returns 导出 API。
 */
export function useExport(): ExportApi {
  const design = useDesignStore();
  const unlock = useUnlock();
  const noise = useNoiseTexture();
  const toast = useToast();

  const exporting = ref<boolean>(false);

  /**
   * 弹出系统保存对话框。
   *
   * @param format 导出格式。
   * @returns 用户选择的路径；取消时返回 `null`。
   */
  async function pickPath(format: ExportFormat): Promise<string | null> {
    const isPng = format === 'png';
    const path = await save({
      title: isPng ? EXPORT_SAVE_TITLE_PNG : EXPORT_SAVE_TITLE_SVG,
      defaultPath: defaultExportFileName(format),
      filters: [
        {
          name: isPng ? FILTER_PNG : FILTER_SVG,
          extensions: [format],
        },
      ],
    });
    return path ?? null;
  }

  /**
   * 执行一次真实导出（假定已开通）。
   *
   * @param format 导出格式。
   */
  async function doExport(format: ExportFormat): Promise<void> {
    const svg = buildSvg(design.design);
    const path = await pickPath(format);
    if (path === null || path.length === 0) {
      toast.info(TOAST_EXPORT_CANCELLED);
      return;
    }

    if (format === 'png') {
      // 纹理确保就绪，否则做旧会走程序化兜底导致与预览有细微差异
      await noise.load();
      const bytes = await renderPng(svg, design.design, noise.raw(), EXPORT_SCALE);
      // Tauri IPC 中嵌套在对象里的二进制需转为普通数组才能被 serde 反序列化为 Vec<u8>
      const saved = await invoke<string>('export_png', {
        path,
        data: Array.from(bytes),
      });
      toast.success(`${TOAST_EXPORT_PNG_OK} · ${savedToText(saved)}`);
      return;
    }

    const saved = await invoke<string>('export_svg', { path, svg });
    toast.success(`${TOAST_EXPORT_SVG_OK} · ${savedToText(saved)}`);
  }

  /**
   * 请求导出。
   *
   * 未开通时：弹出支付弹窗，并登记"解锁后自动续做本次导出"的回调。
   *
   * @param format 导出格式。
   */
  async function requestExport(format: ExportFormat): Promise<void> {
    if (exporting.value) {
      return;
    }

    // ── 闸门（UX 层）──
    await unlock.ensureLoaded();
    if (!unlock.exportUnlocked.value) {
      openPaymentDialog(() => {
        void requestExport(format);
      });
      return;
    }

    exporting.value = true;
    try {
      await doExport(format);
    } catch (err) {
      // Rust 侧闸门拒绝（AppError::Locked）也会走到这里：保守提示 + 重新同步解锁态
      await unlock.refresh();
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message.length > 0 ? `${TOAST_EXPORT_FAILED}（${message}）` : TOAST_EXPORT_FAILED);
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, requestExport };
}
