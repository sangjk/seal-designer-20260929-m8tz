//! 订单轮询任务（3s 一次、300s 超时）与事件广播。
//!
//! ★ 轮询下沉 Rust 的意义（ADR-003）：用户关掉支付弹窗、最小化窗口甚至切到别的页面，
//!   后台任务照跑，不会漏单；支付成功由 Rust 直接写解锁文件，前端不介入写入。
//! ★ 事件顺序铁律（架构设计 §3.3）：**先写盘、再广播 `unlock:changed`、最后 `payment:succeeded`**。

use std::sync::Mutex;
use std::time::Duration;

use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Emitter};

use crate::commands::unlock::broadcast_unlock_changed;
use crate::config;
use crate::payment::models::{FailedPayload, OrderIdPayload, StateChangedPayload};
use crate::payment::vmq_client::VmqClient;
use crate::unlock::store;

/// 连续网络失败达到该次数后判定为支付失败（约 15 秒）。
const MAX_CONSECUTIVE_ERRORS: u32 = 5;

/// 轮询任务托管状态（由 `tauri::Builder::manage` 注入全局）。
#[derive(Default)]
pub struct WatcherState {
    /// 当前运行中的轮询任务句柄。
    handle: Mutex<Option<JoinHandle<()>>>,
}

impl WatcherState {
    /// 替换当前任务句柄，旧任务会被中止。
    ///
    /// # 参数
    /// - `handle`：新任务句柄。
    pub fn replace(&self, handle: JoinHandle<()>) {
        if let Ok(mut guard) = self.handle.lock() {
            if let Some(old) = guard.take() {
                old.abort();
            }
            *guard = Some(handle);
        }
    }

    /// 中止当前任务（无任务时静默返回）。
    pub fn cancel(&self) {
        if let Ok(mut guard) = self.handle.lock() {
            if let Some(old) = guard.take() {
                old.abort();
            }
        }
    }
}

/// 启动一次订单轮询。
///
/// 每 [`config::POLL_INTERVAL_SECS`] 秒查一次单，直到：
/// - `state == 1`：写解锁文件 → 广播 `unlock:changed` → 广播 `payment:succeeded`；
/// - `state == -1`：广播 `payment:failed`；
/// - 累计超过 [`config::ORDER_TIMEOUT_SECS`]：关单 → 广播 `payment:timeout`；
/// - 连续网络失败超过阈值：广播 `payment:failed`。
///
/// # 参数
/// - `app`：Tauri 应用句柄（事件广播与解锁写盘都要用）。
/// - `state`：轮询任务托管状态。
/// - `order_id`：系统单号。
/// - `pay_id`：商户单号（写进解锁文件用于溯源）。
pub fn start(app: AppHandle, state: &WatcherState, order_id: String, pay_id: String) {
    let handle = tauri::async_runtime::spawn(async move {
        run_loop(app, order_id, pay_id).await;
    });
    state.replace(handle);
}

/// 轮询主循环。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `order_id`：系统单号。
/// - `pay_id`：商户单号。
async fn run_loop(app: AppHandle, order_id: String, pay_id: String) {
    let client = match VmqClient::new() {
        Ok(c) => c,
        Err(e) => {
            emit_failed(&app, &order_id, &e.to_string());
            return;
        }
    };

    let interval = Duration::from_secs(config::POLL_INTERVAL_SECS.max(1));
    let mut elapsed: u64 = 0;
    let mut errors: u32 = 0;

    loop {
        tokio::time::sleep(interval).await;
        elapsed = elapsed.saturating_add(config::POLL_INTERVAL_SECS.max(1));

        match client.check_order(&order_id).await {
            Ok(status) => {
                errors = 0;
                let _ = app.emit(
                    config::EVENT_PAYMENT_STATE_CHANGED,
                    StateChangedPayload {
                        order_id: order_id.clone(),
                        state: status.state,
                        elapsed_secs: elapsed,
                    },
                );

                if status.state == 1 {
                    // ★ 先落盘，再广播；写盘失败则按失败处理，绝不误报成功
                    match store::write_unlocked(&app, &pay_id) {
                        Ok(()) => {
                            broadcast_unlock_changed(&app, true);
                            let _ = app.emit(
                                config::EVENT_PAYMENT_SUCCEEDED,
                                OrderIdPayload {
                                    order_id: order_id.clone(),
                                },
                            );
                        }
                        Err(e) => emit_failed(&app, &order_id, &e.to_string()),
                    }
                    return;
                }

                if status.state == -1 {
                    emit_failed(&app, &order_id, "订单已关闭");
                    return;
                }
            }
            Err(e) => {
                errors = errors.saturating_add(1);
                if errors >= MAX_CONSECUTIVE_ERRORS {
                    emit_failed(&app, &order_id, &e.to_string());
                    return;
                }
            }
        }

        if elapsed >= config::ORDER_TIMEOUT_SECS {
            let _ = client.close_order(&order_id).await;
            let _ = app.emit(
                config::EVENT_PAYMENT_TIMEOUT,
                OrderIdPayload {
                    order_id: order_id.clone(),
                },
            );
            return;
        }
    }
}

/// 广播支付失败事件。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `order_id`：系统单号。
/// - `message`：失败原因（仅供排查，前端展示走 `copy.ts`）。
fn emit_failed(app: &AppHandle, order_id: &str, message: &str) {
    let _ = app.emit(
        config::EVENT_PAYMENT_FAILED,
        FailedPayload {
            order_id: order_id.to_string(),
            message: message.to_string(),
        },
    );
}
