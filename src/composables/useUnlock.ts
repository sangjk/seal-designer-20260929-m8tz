import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { useUnlockStore, type UnlockStatePayload } from '@/stores/unlock';

/**
 * 解锁态读取与监听（架构设计 §4.1 / §7.4）。
 *
 * ★ Rust 是解锁态的**唯一真相源**：
 *   - 首屏 `invoke("get_unlock_state")` 拉取一次；
 *   - 之后由 Rust 的 `unlock:changed` 事件单向推送更新；
 *   - 前端只做镜像，不做任何"可写"的判断逻辑。
 *
 * 事件监听器与首屏加载均为**模块级单例**，多个组件（App / UnlockBadge / ExportBar）
 * 同时调用 `useUnlock()` 也只会注册一次监听、只会拉取一次状态。
 */

/** 解锁态变更事件名（中性命名，无禁用词）。 */
const EVENT_UNLOCK_CHANGED = 'unlock:changed';

/** 首屏加载 Promise（幂等复用）。 */
let bootstrap: Promise<void> | null = null;

/** 事件解绑句柄。 */
let unlisten: UnlistenFn | null = null;

/** 监听注册中的 Promise，避免并发重复注册。 */
let listening: Promise<void> | null = null;

/** 解锁 API。 */
export interface UnlockApi {
  /** 导出功能是否已开通（完整版）。 */
  exportUnlocked: Ref<boolean>;
  /** 是否已完成过一次真实读取。 */
  loaded: Ref<boolean>;
  /** 确保已完成首屏加载并注册事件监听（幂等）。 */
  ensureLoaded: () => Promise<void>;
  /** 主动重新拉取一次解锁态。 */
  refresh: () => Promise<void>;
  /** 释放事件监听（仅应用外壳在卸载时调用）。 */
  dispose: () => void;
}

/**
 * 取得解锁态句柄。
 *
 * @returns 解锁 API。
 */
export function useUnlock(): UnlockApi {
  const store = useUnlockStore();
  const { exportUnlocked, loaded } = storeToRefs(store);

  /** 注册 `unlock:changed` 监听（幂等）。 */
  async function ensureListening(): Promise<void> {
    if (unlisten !== null) {
      return;
    }
    if (listening !== null) {
      return listening;
    }
    listening = (async (): Promise<void> => {
      try {
        unlisten = await listen<UnlockStatePayload>(EVENT_UNLOCK_CHANGED, (event) => {
          store.applyState({ exportUnlocked: event.payload?.exportUnlocked === true });
        });
      } catch {
        // 非 Tauri 环境（如浏览器里跑 vite dev）监听不可用：保持未开通即可
        unlisten = null;
      } finally {
        listening = null;
      }
    })();
    return listening;
  }

  /**
   * 确保已完成首屏加载并注册事件监听。
   *
   * @returns 加载完成的 Promise。
   */
  function ensureLoaded(): Promise<void> {
    if (bootstrap !== null) {
      return bootstrap;
    }
    bootstrap = (async (): Promise<void> => {
      await ensureListening();
      await store.refresh();
    })();
    return bootstrap;
  }

  /** 释放事件监听。 */
  function dispose(): void {
    if (unlisten !== null) {
      unlisten();
      unlisten = null;
    }
    bootstrap = null;
  }

  return {
    exportUnlocked,
    loaded,
    ensureLoaded,
    refresh: (): Promise<void> => store.refresh(),
    dispose,
  };
}
