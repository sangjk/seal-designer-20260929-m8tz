//! 应用信息命令（关于页 F-47 使用）。

use serde::Serialize;
use tauri::AppHandle;

/// 应用信息。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    /// 用户可见产品名（来自 `tauri.conf.json` 的 `productName`）。
    pub product_name: String,
    /// 版本号（Tauri semver 三段，如 `1.0.0`；MSIX 的四段版本由 CI 注入）。
    pub version: String,
}

/// 读取产品名与版本号。
///
/// ★ 名字三分离（ADR-004 / 问题 001、003）：
///   这里返回的是**用户可见产品名**「印章生成器」；
///   exe 名是 `seal-designer`（ASCII，`mainBinaryName`）；
///   微软包身份在 `AppxManifest.xml`，与本 crate 无关。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 应用信息。
#[tauri::command]
pub fn get_app_info(app: AppHandle) -> AppInfo {
    let pkg = app.package_info();
    AppInfo {
        product_name: pkg.name.clone(),
        version: pkg.version.to_string(),
    }
}
