import { invoke } from '@tauri-apps/api/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/** 解锁状态（与 Rust `UnlockState` 的 camelCase 序列化结果对齐）。 */
export interface UnlockStatePayload {
  exportUnlocked: boolean;
}

/**
 * 解锁态镜像仓库。
 *
 * ★ 架构设计 §7.4：**Rust 是解锁态的唯一真相源**。
 *   本仓库永远只是 `get_unlock_state` 的镜像 + `unlock:changed` 事件的接收端，
 *   前端不持有任何"可写"的判断逻辑（安全边界在 Rust 的 export_png / export_svg）。
 */
export const useUnlockStore = defineStore('unlock', () => {
  /** 导出功能是否已开通（完整版）。 */
  const exportUnlocked = ref<boolean>(false);

  /** 是否已完成过一次真实读取（用于首屏门控，避免误显"未开通"闪烁）。 */
  const loaded = ref<boolean>(false);

  /**
   * 应用一份来自 Rust 的解锁态快照。
   *
   * @param state Rust 侧下发的解锁态。
   */
  function applyState(state: UnlockStatePayload): void {
    exportUnlocked.value = state.exportUnlocked === true;
    loaded.value = true;
  }

  /**
   * 主动向 Rust 拉取一次解锁态。
   *
   * 任何异常都视为"未开通"（保守失败），并标记为已加载以避免界面卡在启动态。
   */
  async function refresh(): Promise<void> {
    try {
      const state = await invoke<UnlockStatePayload>('get_unlock_state');
      applyState(state);
    } catch {
      exportUnlocked.value = false;
      loaded.value = true;
    }
  }

  return { exportUnlocked, loaded, applyState, refresh };
});
