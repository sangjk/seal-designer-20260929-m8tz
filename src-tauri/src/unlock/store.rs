//! `.unlocked.json` 原子读写 + HMAC-SHA256 防篡改（ADR-002 / 问题 018）。
//!
//! 文件结构：
//! ```json
//! { "exportUnlocked": true, "orderRef": "SEAL...", "sig": "<base64 HMAC-SHA256>" }
//! ```
//!
//! 关键纪律：
//! 1. **原子写**：先写 `.unlocked.json.tmp`，再 `rename` 覆盖，避免半截文件。
//! 2. **防篡改**：签名密钥由固定盐 + 设备相关的 `app_data_dir` 路径派生，
//!    用户手工把 `exportUnlocked` 改成 `true` 会因 `sig` 不匹配而被拒。
//! 3. **保守失败**：任何读取/校验异常一律视为「未开通」，绝不放行。

use std::fs;
use std::path::PathBuf;

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tauri::{AppHandle, Manager};

use crate::config;
use crate::error::{AppError, AppResult};

/// HMAC-SHA256 别名。
type HmacSha256 = Hmac<Sha256>;

/// 解锁态（前端镜像的数据结构，序列化为 camelCase）。
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnlockState {
    /// 导出功能是否已开通。
    pub export_unlocked: bool,
}

/// 磁盘上的解锁文件结构。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UnlockFile {
    /// 导出功能是否已开通。
    export_unlocked: bool,
    /// 订单参考号（商户单号），仅用于溯源。
    #[serde(default)]
    order_ref: String,
    /// HMAC-SHA256 签名（base64）。
    #[serde(default)]
    sig: String,
}

/// 取得应用数据目录（不存在则创建）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 应用数据目录绝对路径。
fn app_data_dir(app: &AppHandle) -> AppResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(format!("无法定位应用数据目录：{e}")))?;
    if !dir.exists() {
        fs::create_dir_all(&dir)?;
    }
    Ok(dir)
}

/// 解锁文件完整路径。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// `.unlocked.json` 的绝对路径。
fn unlock_path(app: &AppHandle) -> AppResult<PathBuf> {
    Ok(app_data_dir(app)?.join(config::UNLOCK_FILE_NAME))
}

/// 临时文件完整路径（原子写中转）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// `.unlocked.json.tmp` 的绝对路径。
fn unlock_tmp_path(app: &AppHandle) -> AppResult<PathBuf> {
    Ok(app_data_dir(app)?.join(config::UNLOCK_TMP_NAME))
}

/// 派生 HMAC 密钥。
///
/// 密钥 = 固定盐 + 设备相关的应用数据目录路径。既不入库也不随包分发，
/// 换机复制文件会因路径不同导致签名校验失败（符合"本机生效"的产品定义）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 密钥字节序列。
fn hmac_key(app: &AppHandle) -> AppResult<Vec<u8>> {
    let dir = app_data_dir(app)?;
    let mut key = String::from(config::UNLOCK_HMAC_SALT);
    key.push('|');
    key.push_str(&dir.to_string_lossy());
    Ok(key.into_bytes())
}

/// 构造参与签名的规范化负载。
///
/// # 参数
/// - `export_unlocked`：解锁标志。
/// - `order_ref`：订单参考号。
///
/// # 返回
/// 规范化负载字符串。
fn payload_of(export_unlocked: bool, order_ref: &str) -> String {
    format!(
        "{}|{}|{}",
        config::UNLOCK_PAYLOAD_VERSION,
        export_unlocked,
        order_ref
    )
}

/// 计算负载签名。
///
/// # 参数
/// - `key`：HMAC 密钥。
/// - `payload`：规范化负载。
///
/// # 返回
/// base64 编码的 HMAC-SHA256。
fn sign(key: &[u8], payload: &str) -> AppResult<String> {
    let mut mac = HmacSha256::new_from_slice(key)
        .map_err(|e| AppError::Internal(format!("签名密钥无效：{e}")))?;
    mac.update(payload.as_bytes());
    Ok(BASE64.encode(mac.finalize().into_bytes()))
}

/// 校验签名（常量时间比较由 `hmac` crate 的 `verify_slice` 提供）。
///
/// # 参数
/// - `key`：HMAC 密钥。
/// - `payload`：规范化负载。
/// - `sig_b64`：待校验的 base64 签名。
///
/// # 返回
/// 校验通过返回 `true`。
fn verify(key: &[u8], payload: &str, sig_b64: &str) -> bool {
    let Ok(expected) = BASE64.decode(sig_b64) else {
        return false;
    };
    let Ok(mut mac) = HmacSha256::new_from_slice(key) else {
        return false;
    };
    mac.update(payload.as_bytes());
    mac.verify_slice(&expected).is_ok()
}

/// 读取解锁态。
///
/// **保守失败**：文件缺失、JSON 破损、签名不符一律返回「未开通」。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 解锁态快照。
pub fn read(app: &AppHandle) -> UnlockState {
    let Ok(path) = unlock_path(app) else {
        return UnlockState::default();
    };
    let Ok(text) = fs::read_to_string(&path) else {
        return UnlockState::default();
    };
    let Ok(file) = serde_json::from_str::<UnlockFile>(&text) else {
        return UnlockState::default();
    };
    let Ok(key) = hmac_key(app) else {
        return UnlockState::default();
    };
    let payload = payload_of(file.export_unlocked, &file.order_ref);
    if !verify(&key, &payload, &file.sig) {
        return UnlockState::default();
    }
    UnlockState {
        export_unlocked: file.export_unlocked,
    }
}

/// 原子写入解锁态。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `export_unlocked`：目标解锁标志。
/// - `order_ref`：订单参考号（无订单场景传空串）。
///
/// # 返回
/// 成功返回 `Ok(())`。
///
/// # 错误
/// 目录不可写、签名失败、序列化失败时返回 `AppError`。
pub fn write_state(app: &AppHandle, export_unlocked: bool, order_ref: &str) -> AppResult<()> {
    let key = hmac_key(app)?;
    let payload = payload_of(export_unlocked, order_ref);
    let file = UnlockFile {
        export_unlocked,
        order_ref: order_ref.to_string(),
        sig: sign(&key, &payload)?,
    };
    let text = serde_json::to_string_pretty(&file)?;

    let tmp = unlock_tmp_path(app)?;
    let target = unlock_path(app)?;
    fs::write(&tmp, text.as_bytes())?;
    // rename 在同一目录内是原子操作；Windows 下目标已存在时需先移除
    if target.exists() {
        fs::remove_file(&target)?;
    }
    fs::rename(&tmp, &target)?;
    Ok(())
}

/// 写入「已开通」状态（支付成功后由 `watcher` 调用）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `order_ref`：商户单号，用于溯源。
///
/// # 返回
/// 成功返回 `Ok(())`。
pub fn write_unlocked(app: &AppHandle, order_ref: &str) -> AppResult<()> {
    write_state(app, true, order_ref)
}
