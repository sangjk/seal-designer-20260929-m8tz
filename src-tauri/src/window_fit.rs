//! 启动时将主窗口约束到当前显示器的「工作区」(排除任务栏 / 开始菜单栏) 内。
//!
//! ## 背景
//! 配置里窗口默认 `height: 900` 且 `center: true`。在 Windows 高缩放屏
//! (如 1080p @150% → 逻辑高度仅 720) 或矮屏笔记本上，窗口会比可见工作区更高，
//! 居中后底部约 40~90px 被任务栏遮挡。左栏参数面板虽然自身可滚动，但窗口底边
//! 整条落在任务栏之后，最底部的「做旧效果」等控件因此无法点击 / 拖拽。
//!
//! ## 策略
//! 仅做「收缩 + 平移」，**绝不放大**窗口；把窗口内边尺寸钳制进工作区，并预留
//! 标题栏 + 边框 + 取整误差的安全边距，使整窗底部稳定停留在任务栏之上。
//! 万一显示器工作区本就小于请求尺寸，也尽量靠上放置，让顶部控件必可见，
//! 剩余内容由左栏内部滚动兜底。
//!
//! 失败一律静默放弃（保持原窗口），不应阻塞启动。

use tauri::{LogicalPosition, LogicalSize, Position, Size, WebviewWindow};

/// 标题栏 + 上下边框的估算占用（逻辑像素），用于顶部 / 底部留白。
const DECORATION_ALLOWANCE: f64 = 40.0;
/// 四周额外安全边距（逻辑像素），吸收 DPI 取整误差与边框估算偏差。
const SAFE_MARGIN: f64 = 12.0;

/// 将窗口尺寸与位置钳制到当前显示器工作区内部。
pub fn fit_window_to_work_area(window: &WebviewWindow) {
    // —— 取不到任何信息就放弃，保持原窗口不动 ——
    let scale = match window.scale_factor() {
        Ok(s) if s > 0.0 => s,
        _ => return,
    };

    let monitor = match window.current_monitor() {
        Ok(Some(m)) => m,
        _ => return,
    };

    let work_area = monitor.work_area();
    let wa_x = work_area.position.x as f64 / scale;
    let wa_y = work_area.position.y as f64 / scale;
    let wa_w = work_area.size.width as f64 / scale;
    let wa_h = work_area.size.height as f64 / scale;

    let outer_size = match window.outer_size() {
        Ok(s) => s,
        _ => return,
    };
    let outer_pos = match window.outer_position() {
        Ok(p) => p,
        _ => return,
    };

    let cur_w = outer_size.width as f64 / scale;
    let cur_h = outer_size.height as f64 / scale;
    let cur_x = outer_pos.x as f64 / scale;
    let cur_y = outer_pos.y as f64 / scale;

    // 工作区内可用的最大内边尺寸（扣掉装饰与安全边距）。
    let avail_w = (wa_w - 2.0 * SAFE_MARGIN).max(360.0);
    let avail_h = (wa_h - DECORATION_ALLOWANCE - SAFE_MARGIN).max(420.0);

    // 目标内边尺寸：不超过当前窗口（避免放大），且不超过可用区（避免溢出）。
    // 用 outer 减去装饰估算反推内边尺寸，使大屏上窗口大小基本不变。
    let new_w = (cur_w - 2.0 * SAFE_MARGIN).clamp(360.0, avail_w);
    let new_h = (cur_h - DECORATION_ALLOWANCE).clamp(420.0, avail_h);

    // 先按「外框」定位，再保证内框底部不越过工作区底部（留给任务栏）。
    let mut new_x = cur_x;
    let mut new_y = cur_y;

    if new_x < wa_x {
        new_x = wa_x;
    }
    if new_y < wa_y {
        new_y = wa_y;
    }
    if new_x + new_w > wa_x + wa_w {
        new_x = wa_x + wa_w - new_w;
    }
    // 关键约束：内框底 = 外框顶 + 装饰 + 内高，必须 ≤ 工作区底。
    if new_y + new_h + DECORATION_ALLOWANCE > wa_y + wa_h {
        new_y = wa_y + wa_h - DECORATION_ALLOWANCE - new_h;
    }
    if new_x < wa_x {
        new_x = wa_x;
    }
    if new_y < wa_y {
        new_y = wa_y;
    }

    // 临时放开最小尺寸约束，确保小屏下窗口能收缩进工作区；
    // 随后把最小值重置为「配置最小值与可用区」的较小者，避免系统约束导致回弹溢出。
    let _ = window.set_min_size(None::<Size>);
    let _ = window.set_size(Size::Logical(LogicalSize::new(new_w, new_h)));
    let _ = window.set_position(Position::Logical(LogicalPosition::new(new_x, new_y)));

    let min_w = avail_w.min(1080.0).max(360.0);
    let min_h = avail_h.min(700.0).max(420.0);
    let _ = window.set_min_size(Some(Size::Logical(LogicalSize::new(min_w, min_h))));
}
