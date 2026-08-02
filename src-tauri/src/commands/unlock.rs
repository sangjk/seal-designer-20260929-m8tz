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
