# ADR-003：支付模块边界与 Rust 侧调用

- **状态**：已接受（阶段 2）
- **日期**：2025-08-02
- **提出**：Lin（架构师）
- **关联**：约束 2（本地静态码）、约束 7、D3（软锁不可前端绕过）、问题 016、问题 017

## 背景

支付使用 **V免签**（App Proxy 模式）：本地展示静态二维码（`weixin.png`/`zhifubao.png`），价格固定 9.9 元，Rust 侧轮询 V免签 API 查询订单状态（规则/支付规则.md）。要求：前端不能自建网络请求（安全 + CSP），且支付成功后必须触发解锁。问题 016 明令"二维码走外网违禁"，问题 017 要求 CSP 不误拦回调。

## 决策

- **所有 V免签网络请求只在 Rust**（`src-tauri/src/payment/`：`vmq_client.rs` + `sign.rs` + `watcher.rs`）。前端 `usePayment` 仅负责：建单（invoke）→ 展示 `really_price` 与本地二维码 → 监听 Rust 广播事件。
- 签名为 `md5(pay_id + param + type + price + appSecret)`，**`param` 恒为 `&str("")` 绝不传 `null`**（问题 009）。
- 轮询由 Rust `OrderWatcher` 启动 `tokio` 任务，每 3s 查一次、300s 超时；状态变化经 `emit` 广播 `payment:state-changed` / `payment:succeeded` / `payment:timeout` / `payment:failed`。
- 支付成功后由 Rust 直接调用 `unlock::store::write_unlocked` 写解锁文件 + 广播 `unlock:changed`（前端不介入写）。
- `tauri.conf.json` 的 `csp` 中 `connect-src` **仅含 V免签 API host**（`vmianqian2.ifama.top`）；`capabilities/default.json` 仅授予 `core:default` + `dialog:allow-save`。

## 理由

- 前端 JS 可被篡改，若由前端发起支付/解锁判断，软锁形同虚设（D3）。
- 本地静态码模式不需要前端请求任何图片/接口，二维码为同源 `public/pay/*.png`（问题 016 规避）。
- 轮询下沉 Rust 后，用户关掉支付弹窗或最小化应用，轮询仍在后台跑，不会漏单。

## 备选方案

- **前端直连 V免签**：不安全（密钥暴露/可绕过）、违反 D3 与 CSP 纪律 → 否决。
- **前端轮询 + Rust 仅建单**：关弹窗即停轮询，体验差、易漏单 → 否决。

## 影响

- 前端支付相关代码极薄（展示 + 监听）；工程师只需保证 `usePayment` 的状态机正确。
- `vmq_client` 用 `reqwest(rustls-tls)`，不引入 OpenSSL（Windows 友好）。
- 支付配置（appId/appSecret/host/price）只在 `config.rs`，不入前端。

## 遵循约束

约束 2（本地静态码）、约束 7（无服务器）、问题 009/016/017。
