//! 解锁态模块（ADR-002）。
//!
//! 解锁态是**整个软锁体系的真相源**：
//! - 写入方只有 Rust（支付成功后的 `watcher`，或 debug 构建的开发开关）；
//! - 读取方是 `commands::unlock::get_unlock_state` 与导出闸门 `commands::export`；
//! - 前端只做镜像，永不参与判断。

pub mod store;

pub use store::UnlockState;
