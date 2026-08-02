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
            // 让主窗口始终落在 Windows「工作区」（屏幕高度减去任务栏）之内，
            // 避免窗口底部被任务栏遮挡，导致左侧面板最底部（做旧效果开关 / 磨损滑块）
            // 控件无法点击、必须移动窗口才能看到的问题。
            // 仅当窗口当前未完全落在工作区内时才调整（尊重用户已摆放的位置）。
            if let Some(window) = app.get_webview_window("main") {
                let monitor = window
                    .primary_monitor()
                    .ok()
                    .flatten()
                    .or_else(|| window.current_monitor().ok().flatten());
                if let Some(monitor) = monitor {
                    if let (work_area, Ok(scale)) =
                        (monitor.work_area(), window.scale_factor())
                    {
                        if scale > 0.0 {
                            let wa_x = work_area.position.x as f64 / scale;
                            let wa_y = work_area.position.y as f64 / scale;
                            let wa_w = work_area.size.width as f64 / scale;
                            let wa_h = work_area.size.height as f64 / scale;
                            if let (Ok(outer), Ok(pos)) =
                                (window.outer_size(), window.outer_position())
                            {
                                let cur_x = pos.x as f64 / scale;
                                let cur_y = pos.y as f64 / scale;
                                let cur_w = outer.width as f64 / scale;
                                let cur_h = outer.height as f64 / scale;
                                let margin = 24.0_f64;
                                let fits = cur_x >= wa_x - 0.5
                                    && cur_y >= wa_y - 0.5
                                    && cur_x + cur_w <= wa_x + wa_w + 0.5
                                    && cur_y + cur_h <= wa_y + wa_h + 0.5;
                                if !fits {
                                    let new_w = cur_w.min(wa_w - margin).max(480.0);
                                    let new_h = cur_h.min(wa_h - margin).max(640.0);
                                    let _ = window.set_size(tauri::Size::Logical(
                                        tauri::LogicalSize::new(new_w, new_h),
                                    ));
                                    let pos_x = wa_x + (wa_w - new_w) / 2.0;
                                    let pos_y = wa_y + (wa_h - new_h) / 2.0;
                                    let _ = window.set_position(tauri::Position::Logical(
                                        tauri::LogicalPosition::new(pos_x, pos_y),
                                    ));
                                }
                            }
                        }
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to launch seal-designer");
}
