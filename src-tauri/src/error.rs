//! 统一错误类型。
//!
//! ★ 序列化为**纯字符串**：Tauri 会把 `Err(AppError)` 直接抛给前端的 `invoke` Promise，
//!   序列化成对象会让前端拿到 `[object Object]`。字符串形式便于日志与排查。
//! ★ 前端**不依赖**错误文案做分支判断（文案属于 `core/copy.ts` 的职责），
//!   仅在 catch 中重新 `get_unlock_state` 判定是否属于"未开通"。

use serde::{Serialize, Serializer};
use thiserror::Error;

/// 应用统一错误。
#[derive(Debug, Error)]
pub enum AppError {
    /// 导出闸门拒绝：解锁态为未开通（ADR-007 / 问题 011）。
    #[error("导出功能尚未开通")]
    Locked,

    /// 网络层失败（连接、超时、TLS）。
    #[error("网络请求失败：{0}")]
    Network(String),

    /// 支付网关业务失败（`code != 200` 或字段缺失）。
    #[error("支付网关返回错误：{0}")]
    Gateway(String),

    /// 本地文件读写失败。
    #[error("文件操作失败：{0}")]
    Io(String),

    /// 数据解析 / 序列化失败。
    #[error("数据解析失败：{0}")]
    Parse(String),

    /// 其它内部错误。
    #[error("内部错误：{0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(value: std::io::Error) -> Self {
        AppError::Io(value.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(value: serde_json::Error) -> Self {
        AppError::Parse(value.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(value: reqwest::Error) -> Self {
        AppError::Network(value.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(value: tauri::Error) -> Self {
        AppError::Internal(value.to_string())
    }
}

/// 命令返回值别名。
pub type AppResult<T> = Result<T, AppError>;
