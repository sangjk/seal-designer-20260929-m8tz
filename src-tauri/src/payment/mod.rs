//! V免签支付模块（App Proxy 模式，ADR-003）。
//!
//! 边界纪律：
//! - **所有** V免签网络请求都在这里（`vmq_client`），前端一律不发起外部请求；
//! - 签名规则集中在 `sign`，`param` 恒为 `&str("")`，**永不传 `null`**（问题 009）；
//! - 轮询与超时由 `watcher` 的后台任务负责，关掉支付弹窗也不会漏单；
//! - 支付成功后由本模块直接写解锁文件并广播事件，前端不介入写入。

pub mod models;
pub mod sign;
pub mod vmq_client;
pub mod watcher;
