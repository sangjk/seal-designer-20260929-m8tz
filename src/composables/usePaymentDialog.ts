import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

/**
 * 支付弹窗的全局开关（模块级单例）。
 *
 * 弹窗实体挂在 `App.vue`（全局唯一），而触发点在 `ExportBar` / `UnlockBadge`，
 * 两者不在同一组件树分支上，因此用模块级单例而非 props 透传或 Pinia store
 * ——它只是一段 UI 编排状态，不属于领域状态。
 *
 * ★ 支付成功后的"续做"回调（架构设计 §4.3 第 777 步：弹窗关闭后重试导出）
 *   由 `pendingAction` 承载，成功一次即消费掉。
 */

/** 弹窗是否打开。 */
const openState = ref<boolean>(false);

/** 支付成功后要续做的动作（例如重试一次导出）。 */
let pendingAction: (() => void) | null = null;

/** 只读的弹窗开关，供模板绑定。 */
export const paymentDialogOpen: DeepReadonly<Ref<boolean>> = readonly(openState);

/**
 * 打开支付弹窗。
 *
 * @param onUnlocked 支付成功并完成解锁后要执行的续做动作（可选）。
 */
export function openPaymentDialog(onUnlocked?: () => void): void {
  pendingAction = onUnlocked ?? null;
  openState.value = true;
}

/** 关闭支付弹窗（丢弃未消费的续做动作）。 */
export function closePaymentDialog(): void {
  openState.value = false;
  pendingAction = null;
}

/**
 * 通知"已完成解锁"：关闭弹窗并执行一次续做动作。
 *
 * 幂等：续做动作只会被执行一次。
 */
export function notifyUnlocked(): void {
  const action = pendingAction;
  pendingAction = null;
  openState.value = false;
  if (action !== null) {
    action();
  }
}
