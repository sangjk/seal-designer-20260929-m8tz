// ★ release 构建隐藏控制台窗口（问题 006 / 018：打开软件弹出终端窗口）
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    seal_designer_lib::run();
}
