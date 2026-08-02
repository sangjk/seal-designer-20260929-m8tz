//! 支付命令（架构设计 §3.3，共 7 个）。
//!
//! 前端只做三件事：建单（拿 `really_price`）→ 展示本地静态二维码 → 监听 Rust 广播事件。
//! 任何 V免签请求都不经过前端（ADR-003 / 问题 016、017）。

use tauri::{AppHandle, Manager};

use crate::config;
use crate::error::AppResult;
use crate::payment::models::{OrderInfo, OrderStatus, PayConfig};
use crate::payment::vmq_client::{new_pay_id, VmqClient};
use crate::payment::watcher::{self, WatcherState};

/// 建单公共实现。
///
/// # 参数
/// - `channel`：支付渠道，1=微信、2=支付宝。
///
/// # 返回
/// 订单信息。
///
/// # 错误
/// 网络或网关异常时返回 `AppError`。
async fn create_order(channel: u8) -> AppResult<OrderInfo> {
    let client = VmqClient::new()?;
    let pay_id = new_pay_id();
    client.create_order(&pay_id, channel, config::PRICE).await
}

/// 创建微信支付订单。
///
/// # 参数
/// - `app`：Tauri 应用句柄（保留以对齐 IPC 契约，便于后续扩展窗口级会话）。
///
/// # 返回
/// 订单信息（含实际应付金额）。
///
/// # 错误
/// 网络或网关异常时返回 `AppError`。
#[tauri::command]
pub async fn create_wechat_order(app: AppHandle) -> AppResult<OrderInfo> {
    let _ = &app;
    create_order(config::CHANNEL_WECHAT).await
}

/// 创建支付宝订单。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 订单信息（含实际应付金额）。
///
/// # 错误
/// 网络或网关异常时返回 `AppError`。
#[tauri::command]
pub async fn create_alipay_order(app: AppHandle) -> AppResult<OrderInfo> {
    let _ = &app;
    create_order(config::CHANNEL_ALIPAY).await
}

/// 主动查询一次订单状态（弹窗打开时的兜底手动刷新）。
///
/// # 参数
/// - `order_id`：系统单号。
///
/// # 返回
/// 订单状态。
///
/// # 错误
/// 网络或网关异常时返回 `AppError`。
#[tauri::command]
pub async fn poll_order(order_id: String) -> AppResult<OrderStatus> {
    let client = VmqClient::new()?;
    client.check_order(&order_id).await
}

/// 启动后台轮询任务。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `order_id`：系统单号。
/// - `pay_id`：商户单号。
#[tauri::command]
pub fn start_order_watch(app: AppHandle, order_id: String, pay_id: String) {
    let state = app.state::<WatcherState>();
    watcher::start(app.clone(), &state, order_id, pay_id);
}

/// 取消后台轮询任务（用户关闭支付弹窗时调用）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
#[tauri::command]
pub fn cancel_order_watch(app: AppHandle) {
    app.state::<WatcherState>().cancel();
}

/// 关闭订单。
///
/// # 参数
/// - `order_id`：系统单号。
///
/// # 返回
/// 成功返回 `Ok(())`（网关拒绝也视为已尽力关闭，不阻断前端流程）。
///
/// # 错误
/// 网络异常时返回 `AppError::Network`。
#[tauri::command]
pub async fn close_order(order_id: String) -> AppResult<()> {
    let client = VmqClient::new()?;
    let _ = client.close_order(&order_id).await?;
    Ok(())
}

/// 读取支付配置（价格 / 轮询间隔 / 超时）。
///
/// 前端倒计时与提示节奏都以此为准，避免两侧各写一份魔数。
///
/// # 返回
/// 支付配置。
#[tauri::command]
pub fn get_pay_config() -> PayConfig {
    PayConfig {
        price: config::PRICE.to_string(),
        poll_interval_secs: config::POLL_INTERVAL_SECS,
        timeout_secs: config::ORDER_TIMEOUT_SECS,
    }
}
