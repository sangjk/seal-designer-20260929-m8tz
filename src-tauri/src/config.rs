//! 运行期常量配置。
//!
//! ★ 边界纪律（架构设计 §1.3 / 问题 012）：
//!   本文件**只放 V免签支付凭据与业务常量**。
//!   微软包身份（Identity / Publisher / PFN / SID / MSA / StoreID）**绝不出现在本 crate**，
//!   它们只存在于 `tauri.conf.json` 与 `msix/AppxManifest.xml`（由 CI 注入）。

/// V免签 应用 ID（App Proxy 模式）。
pub const VMQ_APP_ID: &str = "app_291d8ce254e0";

/// V免签 应用密钥（仅 Rust 侧持有，绝不下发前端）。
pub const VMQ_APP_SECRET: &str = "3f8fc3001b4f331426d1fc8709c55cfc";

/// V免签 API Host（`tauri.conf.json` 的 `connect-src` 白名单与此一致）。
pub const VMQ_HOST: &str = "https://vmianqian2.ifama.top";

/// 解锁价格（元）。功能限制支付模式：一次性解锁导出功能。
pub const PRICE: &str = "9.9";

/// 支付渠道：微信支付。
pub const CHANNEL_WECHAT: u8 = 1;

/// 支付渠道：支付宝。
pub const CHANNEL_ALIPAY: u8 = 2;

/// 轮询间隔（秒）。
pub const POLL_INTERVAL_SECS: u64 = 3;

/// 订单超时（秒）。超时后 Rust 主动关单并广播 `payment:timeout`。
pub const ORDER_TIMEOUT_SECS: u64 = 300;

/// 单次 HTTP 请求超时（秒）。
pub const HTTP_TIMEOUT_SECS: u64 = 15;

/// 商户单号前缀（`SEAL{ms13}{rand4}`）。
pub const PAY_ID_PREFIX: &str = "SEAL";

/// 解锁状态文件名（隐藏点文件，ADR-002）。
pub const UNLOCK_FILE_NAME: &str = ".unlocked.json";

/// 解锁状态文件写入时的临时文件名（原子写中转）。
pub const UNLOCK_TMP_NAME: &str = ".unlocked.json.tmp";

/// HMAC 派生盐（与设备相关的 `app_data_dir` 路径共同派生密钥，ADR-002）。
pub const UNLOCK_HMAC_SALT: &str = "seal-designer/unlock/v1";

/// 解锁文件负载版本标记（未来结构升级时用于区分）。
pub const UNLOCK_PAYLOAD_VERSION: &str = "v1";

// ── 事件名（中性命名，无禁用词；架构设计 §3.3） ──────────────

/// 每次轮询返回时广播。
pub const EVENT_PAYMENT_STATE_CHANGED: &str = "payment:state-changed";

/// 支付成功且解锁文件写入完成后广播。
pub const EVENT_PAYMENT_SUCCEEDED: &str = "payment:succeeded";

/// 订单超时后广播。
pub const EVENT_PAYMENT_TIMEOUT: &str = "payment:timeout";

/// 订单失败 / 关闭 / 网络异常时广播。
pub const EVENT_PAYMENT_FAILED: &str = "payment:failed";

/// 解锁态变更时广播（唯一状态源）。
pub const EVENT_UNLOCK_CHANGED: &str = "unlock:changed";
