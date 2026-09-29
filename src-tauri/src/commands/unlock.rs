//! 解锁态命令（架构设计 §3.3）。

use tauri::{AppHandle, Emitter};

use crate::config;
use crate::unlock::store::{self, UnlockState};

/// 读取当前解锁态。
///
/// 前端 `useUnlock().ensureLoaded()` 在首屏调用一次，之后仅靠 `unlock:changed` 更新。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 解锁态快照；任何异常都会被 `store::read` 内部吸收为「未开通」。
#[tauri::command]
pub fn get_unlock_state(app: AppHandle) -> UnlockState {
    store::read(&app)
}

/// **仅 debug 构建**：本地切换解锁态，便于开发与自测。
///
/// release 二进制中该命令根本不会被编译与注册，因此不存在"前端自助解锁"的攻击面
/// （ADR-002 / 问题 011）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `v`：目标解锁标志。
///
/// # 返回
/// 成功返回 `Ok(())`。
///
/// # 错误
/// 解锁文件写入失败时返回 `AppError`。
#[cfg(debug_assertions)]
#[tauri::command]
pub fn dev_set_export_unlocked(app: AppHandle, v: bool) -> Result<(), crate::error::AppError> {
    store::write_state(&app, v, "DEV")?;
    let _ = app.emit(
        config::EVENT_UNLOCK_CHANGED,
        UnlockState {
            export_unlocked: v,
        },
    );
    Ok(())
}

/// 兑换商店审核测试码（微软认证策略 10.3.3「App Is Testable」）。
///
/// 审核员无法完成真实支付，在支付弹窗内输入测试码即可开通导出功能。
/// 校验通过后走与支付成功**完全相同**的落盘 + 广播链路
/// （`store::write_state` + `unlock:changed`），订单参考号固定为 `MSREVIEW`。
///
/// 安全纪律：
/// - 码值是编译期常量（`config::REVIEW_UNLOCK_CODE`），不存盘、不下发；
/// - 逐字节等长比较，不匹配一律返回 `Ok(false)`，不泄露任何细节；
/// - 幂等：已开通状态下再次兑换仍返回 `Ok(true)`。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `code`：用户输入的测试码（允许首尾空白与连字符大小写差异）。
///
/// # 返回
/// 兑换成功返回 `Ok(true)`，测试码无效返回 `Ok(false)`。
///
/// # 错误
/// 解锁文件写入失败时返回 `AppError`。
#[tauri::command]
pub fn redeem_review_code(app: AppHandle, code: String) -> Result<bool, crate::error::AppError> {
    let normalized = code.trim().to_ascii_uppercase();
    let expected = config::REVIEW_UNLOCK_CODE;
    if normalized.len() != expected.len() || normalized.as_bytes() != expected.as_bytes() {
        return Ok(false);
    }
    store::write_state(&app, true, config::REVIEW_ORDER_REF)?;
    let _ = app.emit(
        config::EVENT_UNLOCK_CHANGED,
        UnlockState {
            export_unlocked: true,
        },
    );
    Ok(true)
}

/// 广播一次解锁态变更事件。
///
/// 供支付轮询任务在写盘成功后调用，保证「文件先落地、事件后广播」的顺序
/// （架构设计 §3.3 事件表）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `export_unlocked`：最新的解锁标志。
pub fn broadcast_unlock_changed(app: &AppHandle, export_unlocked: bool) {
    let _ = app.emit(
        config::EVENT_UNLOCK_CHANGED,
        UnlockState { export_unlocked },
    );
}
