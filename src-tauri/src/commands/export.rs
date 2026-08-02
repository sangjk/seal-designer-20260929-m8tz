//! 导出命令 —— ★ **全应用唯一的落盘出口，也是软锁的真正闸门**。
//!
//! 设计要点（ADR-007 / 共享知识 5 / 问题 010、011）：
//! 1. `fs` 插件**未启用**，前端没有任何写文件能力，绕过本命令就写不了盘；
//! 2. 两个命令的**首行**都必须校验解锁态，未开通直接 `AppError::Locked`；
//! 3. Rust **不参与渲染**：PNG 字节由前端 `exportRaster` 用同一份 `buildSvg + aging`
//!    栅格化后传入，保证预览与导出像素同源（F-41 / AC-20）。

use std::fs;
use std::path::{Path, PathBuf};

use tauri::AppHandle;

use crate::error::{AppError, AppResult};
use crate::unlock::store;

/// 闸门：未开通导出功能时拒绝一切落盘。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
///
/// # 返回
/// 已开通返回 `Ok(())`。
///
/// # 错误
/// 未开通返回 `AppError::Locked`。
fn ensure_unlocked(app: &AppHandle) -> AppResult<()> {
    if store::read(app).export_unlocked {
        Ok(())
    } else {
        Err(AppError::Locked)
    }
}

/// 校验目标路径并确保父目录存在。
///
/// # 参数
/// - `path`：用户在保存对话框中选择的路径。
/// - `expected_ext`：期望的扩展名（不含点）。
///
/// # 返回
/// 规范化后的路径（缺扩展名时自动补上）。
///
/// # 错误
/// 路径为空或父目录创建失败时返回 `AppError::Io`。
fn prepare_path(path: &str, expected_ext: &str) -> AppResult<PathBuf> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(AppError::Io("保存路径为空".to_string()));
    }

    let mut target = PathBuf::from(trimmed);
    let has_ext = target
        .extension()
        .map(|e| e.eq_ignore_ascii_case(expected_ext))
        .unwrap_or(false);
    if !has_ext {
        target.set_extension(expected_ext);
    }

    if let Some(parent) = target.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    Ok(target)
}

/// 把路径转成可回传前端的字符串。
///
/// # 参数
/// - `path`：目标路径。
///
/// # 返回
/// 路径字符串。
fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

/// 导出 PNG（前端已栅格化为透明位图字节）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `path`：保存路径。
/// - `data`：PNG 字节。
///
/// # 返回
/// 实际保存路径。
///
/// # 错误
/// 未开通返回 `AppError::Locked`；写盘失败返回 `AppError::Io`。
#[tauri::command]
pub fn export_png(app: AppHandle, path: String, data: Vec<u8>) -> AppResult<String> {
    ensure_unlocked(&app)?;
    if data.is_empty() {
        return Err(AppError::Io("PNG 数据为空".to_string()));
    }
    let target = prepare_path(&path, "png")?;
    fs::write(&target, &data)?;
    Ok(path_to_string(&target))
}

/// 导出 SVG（前端直接传 `buildSvg` 的字符串）。
///
/// # 参数
/// - `app`：Tauri 应用句柄。
/// - `path`：保存路径。
/// - `svg`：SVG 文档字符串。
///
/// # 返回
/// 实际保存路径。
///
/// # 错误
/// 未开通返回 `AppError::Locked`；写盘失败返回 `AppError::Io`。
#[tauri::command]
pub fn export_svg(app: AppHandle, path: String, svg: String) -> AppResult<String> {
    ensure_unlocked(&app)?;
    if svg.trim().is_empty() {
        return Err(AppError::Io("SVG 内容为空".to_string()));
    }
    let target = prepare_path(&path, "svg")?;
    fs::write(&target, svg.as_bytes())?;
    Ok(path_to_string(&target))
}
