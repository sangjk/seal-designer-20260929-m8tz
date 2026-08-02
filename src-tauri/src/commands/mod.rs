//! Tauri 命令层。
//!
//! 命令是前端唯一能触达 Rust 的入口。分组：
//! - [`unlock`]：解锁态读取（+ debug 构建的本地开关）；
//! - [`payment`]：V免签建单 / 轮询 / 关单 / 配置；
//! - [`export`]：★ 落盘唯一出口，首行即软锁闸门；
//! - [`app_info`]：产品名与版本号（关于页用）。

pub mod app_info;
pub mod export;
pub mod payment;
pub mod unlock;
