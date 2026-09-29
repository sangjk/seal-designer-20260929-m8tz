//! 印章生成器 —— Rust 后端入口。
//!
//! 职责红线（架构设计 §1.3）：
//! 1. Rust **不做任何印章渲染**（渲染 100% 在前端 Canvas/SVG）。
//! 2. 所有 V免签网络请求只在 Rust（`payment/`）。
//! 3. 文件落盘只有 `export_png` / `export_svg` 两个命令能做，且首行必查解锁态。
//! 4. 微软包身份（Identity/Publisher/PFN/SID/MSA/StoreID）**绝不出现在本 crate**，
//!    只存在于 `tauri.conf.json` 与 `msix/AppxManifest.xml`（ADR-004 / 问题 012）。

pub mod commands;
pub mod config;
pub mod error;
pub mod payment;
pub mod unlock;
pub mod window_fit;

use payment::watcher::WatcherState;
use tauri::Manager;

/// 构建并运行 Tauri 应用。
///
/// `dev_set_export_unlocked` 仅在 debug 构建注册，release 二进制中根本不存在该命令，
/// 从源头杜绝「前端自助解锁」（ADR-002）。
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(WatcherState::default());

    #[cfg(debug_assertions)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        commands::unlock::get_unlock_state,
        commands::unlock::dev_set_export_unlocked,
        commands::unlock::redeem_review_code,
        commands::payment::create_wechat_order,
        commands::payment::create_alipay_order,
        commands::payment::poll_order,
        commands::payment::start_order_watch,
        commands::payment::cancel_order_watch,
        commands::payment::close_order,
        commands::payment::get_pay_config,
        commands::export::export_png,
        commands::export::export_svg,
        commands::app_info::get_app_info,
    ]);

    #[cfg(not(debug_assertions))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        commands::unlock::get_unlock_state,
        commands::unlock::redeem_review_code,
        commands::payment::create_wechat_order,
        commands::payment::create_alipay_order,
        commands::payment::poll_order,
        commands::payment::start_order_watch,
        commands::payment::cancel_order_watch,
        commands::payment::close_order,
        commands::payment::get_pay_config,
        commands::export::export_png,
        commands::export::export_svg,
        commands::app_info::get_app_info,
    ]);

    builder
        .setup(|app| {
            // 启动即把主窗口约束进工作区，避免底部被 Windows 任务栏遮挡
            // （最底部「做旧效果」等控件之前因此无法操作）。
            if let Some(window) = app.get_webview_window("main") {
                window_fit::fit_window_to_work_area(&window);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to launch seal-designer");
}
