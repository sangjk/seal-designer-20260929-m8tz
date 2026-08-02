//! 支付相关数据结构（请求体、网关响应、下发前端的视图模型）。
//!
//! 序列化纪律：Rust 侧 `snake_case` ↔ 前端 `camelCase`，靠 `#[serde(rename_all = "camelCase")]`
//! 自动映射（架构设计 §3.3）。

use serde::{Deserialize, Deserializer, Serialize};

/// 兼容"字符串 / 数字 / null"三种形态的字段值。
///
/// V免签在不同版本里可能把 `price`、`orderId` 序列化为字符串或数字，
/// 这里统一归一成 `String`，避免解析失败导致整单流程中断。
#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum FlexValue {
    Text(String),
    Int(i64),
    Float(f64),
    Null,
}

/// 把 `FlexValue` 归一为字符串。
///
/// # 参数
/// - `deserializer`：serde 反序列化器。
///
/// # 返回
/// 归一后的字符串；`null` 归一为空串。
fn de_flex_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value = FlexValue::deserialize(deserializer)?;
    Ok(match value {
        FlexValue::Text(s) => s,
        FlexValue::Int(i) => i.to_string(),
        FlexValue::Float(f) => f.to_string(),
        FlexValue::Null => String::new(),
    })
}

/// 兼容"数字 / 字符串 / null"的状态码。
///
/// # 参数
/// - `deserializer`：serde 反序列化器。
///
/// # 返回
/// 订单状态：`0` 未支付、`1` 已支付、`-1` 已关闭；无法解析时返回 `0`。
fn de_flex_state<'de, D>(deserializer: D) -> Result<i8, D::Error>
where
    D: Deserializer<'de>,
{
    let value = FlexValue::deserialize(deserializer)?;
    Ok(match value {
        FlexValue::Int(i) => i as i8,
        FlexValue::Float(f) => f as i8,
        FlexValue::Text(s) => s.trim().parse::<i8>().unwrap_or(0),
        FlexValue::Null => 0,
    })
}

/// 建单请求体（App Proxy 模式，按价格建单）。
#[derive(Debug, Clone, Serialize)]
pub struct CreateOrderReq {
    /// 应用 ID。
    #[serde(rename = "appId")]
    pub app_id: String,
    /// 商户单号。
    #[serde(rename = "payId")]
    pub pay_id: String,
    /// 支付渠道：1=微信、2=支付宝。
    #[serde(rename = "type")]
    pub pay_type: u8,
    /// 金额（元）。
    pub price: String,
    /// 透传参数。★ 恒为空串，**永不为 null**（问题 009）。
    pub param: String,
    /// MD5 签名。
    pub sign: String,
    /// `0` 表示返回 JSON。
    #[serde(rename = "isHtml")]
    pub is_html: String,
}

/// 关单 / 查单的通用请求体。
#[derive(Debug, Clone, Serialize)]
pub struct SimpleOrderReq {
    /// 应用 ID。
    #[serde(rename = "appId")]
    pub app_id: String,
    /// MD5 签名。
    pub sign: String,
}

/// 网关统一响应外层。
///
/// ★ 这里必须显式声明 `bound(deserialize = ...)`：
///   serde 对带 `#[serde(default)]` 且类型含泛型参数的字段会自动追加 `T: Default`
///   约束，而 `CreateOrderData` / `CheckOrderData` 并不实现 `Default`（它们的每个
///   字段都有自定义 `deserialize_with`，凭空造默认值没有业务含义）。显式给定
///   反序列化约束可覆盖掉这条自动推导，使 `Option<T>` 缺省仍为 `None`。
#[derive(Debug, Clone, Deserialize)]
#[serde(bound(deserialize = "T: Deserialize<'de>"))]
pub struct VmqResp<T> {
    /// 业务码，`200` 为成功。
    #[serde(default)]
    pub code: i32,
    /// 提示信息。
    #[serde(default)]
    pub msg: String,
    /// 业务数据。
    #[serde(default = "Option::default")]
    pub data: Option<T>,
}

/// 建单成功的数据段。
#[derive(Debug, Clone, Deserialize)]
pub struct CreateOrderData {
    /// 商户单号。
    #[serde(rename = "payId", default, deserialize_with = "de_flex_string")]
    pub pay_id: String,
    /// 系统单号（轮询与关单用）。
    #[serde(rename = "orderId", default, deserialize_with = "de_flex_string")]
    pub order_id: String,
    /// 下单金额。
    #[serde(default, deserialize_with = "de_flex_string")]
    pub price: String,
    /// ★ 实际应付金额：本地静态码模式下**必须**展示此值，否则会因金额不匹配无法自动确认。
    #[serde(rename = "reallyPrice", default, deserialize_with = "de_flex_string")]
    pub really_price: String,
}

/// 查单成功的数据段。
#[derive(Debug, Clone, Deserialize)]
pub struct CheckOrderData {
    /// 订单状态：0 未支付、1 已支付、-1 已关闭。
    #[serde(default, deserialize_with = "de_flex_state")]
    pub state: i8,
    /// 状态文案（网关提供，仅用于日志，不直接展示给用户）。
    #[serde(rename = "stateText", default, deserialize_with = "de_flex_string")]
    pub state_text: String,
}

/// 下发给前端的订单信息。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderInfo {
    /// 系统单号。
    pub order_id: String,
    /// 商户单号。
    pub pay_id: String,
    /// 支付渠道：1=微信、2=支付宝。
    pub channel: u8,
    /// 下单金额。
    pub price: String,
    /// 实际应付金额（前端必须显示这个值）。
    pub really_price: String,
}

/// 下发给前端的订单状态。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderStatus {
    /// 订单状态：0 未支付、1 已支付、-1 已关闭。
    pub state: i8,
    /// 状态文案（原样透传，仅供排查）。
    pub state_text: String,
}

/// 下发给前端的支付配置。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayConfig {
    /// 价格（元）。
    pub price: String,
    /// 轮询间隔（秒）。
    pub poll_interval_secs: u64,
    /// 订单超时（秒）。
    pub timeout_secs: u64,
}

/// `payment:state-changed` 事件负载。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StateChangedPayload {
    /// 系统单号。
    pub order_id: String,
    /// 最新状态。
    pub state: i8,
    /// 自开始轮询以来经过的秒数。
    pub elapsed_secs: u64,
}

/// `payment:succeeded` / `payment:timeout` 事件负载。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderIdPayload {
    /// 系统单号。
    pub order_id: String,
}

/// `payment:failed` 事件负载。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FailedPayload {
    /// 系统单号。
    pub order_id: String,
    /// 失败原因（仅用于排查，前端展示统一走 `copy.ts`）。
    pub message: String,
}
