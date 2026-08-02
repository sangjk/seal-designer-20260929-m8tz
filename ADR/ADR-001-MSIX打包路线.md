# ADR-001：MSIX 打包路线

- **状态**：已接受（阶段 2）
- **日期**：2025-08-02
- **提出**：Lin（架构师）
- **关联**：约束 1（Windows 分发）、问题 004、问题 012

## 背景

本软件最终需以 **MSIX** 形式上架微软商店 / 可信侧载。但 **Tauri 2 的 Windows bundler 仅实现 MSI 与 NSIS 两种 target，官方没有提供 MSIX target**（问题 004）。同时微软要求 `AppxManifest.xml` 含一组强制标签与真实 `Identity`，且该身份由主理人拍板、不可在每次发布时手改（问题 012）。

## 决策

1. `src-tauri/tauri.conf.json` 的 `bundle.targets` **仅设 `["nsis"]`**，由 Tauri 直接产出 NSIS 安装包（主键分发）。
2. MSIX **不走 Tauri bundler**，改由 CI 在 `build-release.yml` 中调用 `makeappx pack` 手工打包：
   - `pack-msix.ps1` 先按**白名单**将 `seal-designer.exe` + `resources/` + 图标三张（`StoreLogo.png`/`Square44x44Logo.png`/`Square150x150Logo.png`）staging 到临时目录；
   - 注入 `AppxManifest.xml`（版本号四段由脚本读取 `package.json` 补 `.0`）；
   - `makeappx pack` 生成 `.msix`，再做污染自检（确认无调试符号/源码泄露）。
3. MSIX 签名证书由 CI Secrets 注入（`.pfx`），不在仓库内。

## 理由

- Tauri 官方路线图长期未实现 MSIX target，自研 CI 打包是社区通行且稳定的做法。
- 白名单 staging 避免把 `src/`、`.git`、调试产物打进 MSIX（问题 012 的"构建缓存/泄露"风险）。
- `makeappx` 是唯一官方工具，结果可被商店直接消费。

## 备选方案

- **等待社区 msix 插件**：目前不成熟，且版本与 Tauri 2 兼容性差 → 否决。
- **改用 WIX/MSI 上架**：商店要求 MSIX，MSI 无法上架 → 否决。
- **Tauri 同时开 nsis+msix（假想）**：不存在该 target → 不可行。

## 影响

- CI 负责 MSIX 全流程，本地开发只用 `tauri dev` / `tauri build`（NSIS）。
- `AppxManifest.xml` 为模板，版本四段由 CI 注入（见 架构设计.md §8 待明确项 1）。
- 工程师无需在 Rust 侧关心 MSIX；图标三张必须存在（否则 `makeappx` 拒收）。

## 遵循约束

约束 1（Windows 优先分发）、约束 12（仓库名 ASCII `seal-designer`）。
