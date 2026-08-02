# 印章生成器

完全本地离线的印章设计与导出工具。支持**公章**、**方章**、**自由排版**三种版式，实时预览做旧效果，可导出 3× 高清透明 PNG 与无损矢量 SVG。

- 桌面框架：**Tauri 2**（Rust 后端 + WebView 前端）
- 前端：**Vue 3** + TypeScript + Pinia + Vue Router + Vite 5
- 渲染：**100% 前端**（SVG 生成 + Canvas 2D 做旧），预览与导出同源同参数
- 分发：Windows NSIS 安装包（`.exe`）+ 微软应用商店包（`.msix`）

---

## 目录结构

```
印章生成器/
├── index.html                      # Vite 入口
├── package.json                    # 前端依赖与脚本
├── vite.config.ts                  # 构建配置（别名 @ → src）
├── tsconfig.json / tsconfig.node.json
├── icon.png                        # 1024×1024 源 logo
├── public/
│   ├── textures/sealNoisy.png      # 做旧纹理（同源，避免 Canvas 污染）
│   └── pay/{weixin,zhifubao}.png   # 本地静态收款码（离线可用）
├── src/
│   ├── main.ts / App.vue
│   ├── core/                       # 纯域层，零框架依赖
│   │   ├── types.ts                # 设计域模型
│   │   ├── defaults.ts             # 默认值
│   │   ├── constraints.ts          # RANGES / LIMITS 与夹取
│   │   ├── geometry.ts             # 弧排文字几何
│   │   ├── buildSvg.ts             # ★ SVG 生成（预览与导出共用）
│   │   ├── aging.ts                # ★ 做旧合成（Canvas 2D）
│   │   ├── exportRaster.ts         # PNG 栅格化（scale=3）
│   │   ├── palette.ts              # 7 种印色（业务数据）
│   │   ├── presets.ts              # 快速预设
│   │   ├── fonts.ts                # 字体栈与运行时可用性探测
│   │   └── copy.ts                 # ★ 全量用户可见文案（单点防线）
│   ├── stores/                     # Pinia：design / unlock
│   ├── composables/                # 预览、纹理、导出、支付、解锁、提示
│   ├── components/                 # ui / layout / panel / preview / payment
│   ├── views/                      # DesignerView / AboutView
│   ├── router/index.ts             # 2 条路由，无权限守卫
│   └── styles/                     # tokens.css / base.css / paper-texture.css
├── src-tauri/
│   ├── Cargo.toml                  # crate name = seal-designer（ASCII）
│   ├── tauri.conf.json             # productName=印章生成器, mainBinaryName=seal-designer
│   ├── capabilities/default.json   # 最小权限，**不授予 fs 写**
│   ├── icons/                      # tauri icon 生成的全套图标
│   ├── msix/AppxManifest.xml       # 微软包身份（CI 注入四段版本号）
│   └── src/
│       ├── main.rs / lib.rs
│       ├── config.rs               # V免签凭据与常量
│       ├── error.rs                # AppError 统一错误
│       ├── unlock/store.rs         # 解锁态读写（HMAC-SHA256 + 原子写）
│       ├── payment/                # models / sign / vmq_client / watcher
│       └── commands/               # unlock / payment / export / app_info
└── .github/
    ├── scripts/pack-msix.ps1       # 白名单 staging + 清单预检 + makeappx
    └── workflows/build-release.yml # NSIS + MSIX + Release
```

---

## 开发

### 环境要求

| 依赖 | 版本 |
|---|---|
| Node.js | ≥ 20 |
| Rust | stable（`rustup` 安装） |
| Windows 打包 | Windows 10/11 + Windows SDK（提供 `makeappx.exe`） |

### 常用命令

```bash
npm install                 # 安装前端依赖
npm run dev                 # 仅前端（浏览器，Tauri 命令不可用）
npm run tauri dev           # 桌面调试（推荐）
npm run typecheck           # vue-tsc --noEmit
npm run build               # 类型检查 + 前端产物到 dist/
npm run tauri build -- --bundles nsis   # 出 NSIS 安装包
```

Rust 侧：

```bash
cd src-tauri
cargo check                 # 快速类型检查
cargo test                  # 含 V免签签名回归测试
```

### 重新生成图标

换 logo 后必须整套重生成，不要只替换其中一两个文件：

```bash
npx @tauri-apps/cli icon ./icon.png     # 源图需 1024×1024 透明 PNG
```

---

## 架构要点

### 1. 渲染 100% 在前端，Rust 不参与绘制

`core/buildSvg.ts` 依据设计参数生成 SVG 字符串，`core/aging.ts` 把它画到 Canvas 再叠加做旧纹理。

- **预览**：`scale = 1`
- **导出**：`scale = 3`

两者调用**同一对函数、同一份参数**，因此「所见即所得」在结构上被保证，而不是靠人工对齐。Rust 侧的 `export_png` / `export_svg` 只负责把前端算好的字节写到磁盘。

### 2. 软锁闸门下沉到 Rust

导出功能属于完整版。校验逻辑写在 Rust 命令的**第一行**：

```rust
pub fn export_png(app: AppHandle, path: String, data: Vec<u8>) -> AppResult<String> {
    ensure_unlocked(&app)?;   // ← 未开通直接 AppError::Locked
    ...
}
```

前端的按钮拦截只是 UX，绕过它也拿不到落盘能力——`capabilities/default.json` 没有授予 `fs` 写权限，前端物理上无法写文件。

### 3. 解锁态的唯一真相源是 Rust

`.unlocked.json` 存放在应用数据目录，内容带 **HMAC-SHA256** 签名，密钥由固定盐 + 应用数据目录路径派生：

- 文件缺失 / 内容破损 / 签名不符 → 一律判定为**未开通**（保守失败）
- 写入采用 `tmp → rename` 原子替换，避免断电产生半截文件
- 状态变更由 Rust 通过 `unlock:changed` 事件**单向推送**给前端，前端只做镜像

### 4. 支付走 App Proxy 模式

所有网络请求都在 Rust（`payment/vmq_client.rs`），前端拿不到 `appSecret`，也没有任何外部网络能力（CSP `connect-src` 只放行网关域名）。

- 建单签名：`md5(payId + param + type + price + secret)`
- 查单/关单签名：`md5(orderId + secret)`
- **`param` 恒为空字符串 `""`，永不为 `null`** —— 传 `null` 会让签名串出现字面量 `"null"`，签名必然不匹配
- 轮询间隔 3 秒，超时 300 秒后自动关单
- 本地静态码模式下网关会对金额做分位错开，因此界面必须展示 `reallyPrice` 而非标价

后台轮询由 `payment/watcher.rs` 承担：**用户关掉支付弹窗也不会漏单**。支付成功时严格遵循「**先落盘、后广播**」的顺序——先写 `.unlocked.json`，再发 `unlock:changed` 与 `payment:succeeded`，保证前端收到事件时状态已经持久化。

### 5. 名字四分离

| 维度 | 取值 | 位置 |
|---|---|---|
| 用户可见产品名 | `印章生成器` | `tauri.conf.json` `productName`、窗口标题、MSIX `DisplayName` |
| 可执行文件名 | `seal-designer.exe` | `mainBinaryName`、Cargo `name`、`AppxManifest` `Executable` |
| 微软包身份 | `sangkl.30724BA61D061` | `AppxManifest` `<Identity Name>` |
| Release 资产名 | `seal-designer_*_x64.*` | CI 重命名步骤 |

混用任意两项都会导致上架失败或安装信息乱码。**中文只出现在「用户安装后看到的地方」，机器读的地方一律 ASCII。**

### 6. 文案单点防线

所有用户可见字符串集中在 `src/core/copy.ts`。组件中**禁止**硬编码文案，统一使用中性措辞：**开通 / 解锁 / 未开通 / 已开通 / 完整版**。

---

## 打包与发布

### 产物

| 文件 | 用途 | 生成方式 |
|---|---|---|
| `seal-designer_1.0.0_x64-setup.exe` | 直接分发安装 | `tauri build --bundles nsis` |
| `seal-designer_1.0.0.0_x64.msix` | 微软应用商店 | `.github/scripts/pack-msix.ps1` |

Tauri 2 的 Windows bundler **只实现了 MSI/NSIS，没有 MSIX target**，因此 MSIX 由 Windows SDK 的 `makeappx.exe` 手工封装。

### 版本号

| 位置 | 段数 | 示例 |
|---|---|---|
| `package.json` / `Cargo.toml` / `tauri.conf.json` | 3（semver 限制） | `1.0.0` |
| `AppxManifest.xml` | 4（微软要求） | `1.0.0.0` |

四段版本号由 `pack-msix.ps1` 读取 `package.json` 补 `.0` 后注入 staging 里的清单副本，**不修改仓库中的模板文件**。

### 本地打包 MSIX（Windows）

```powershell
npm run tauri build -- --bundles nsis
.\.github\scripts\pack-msix.ps1
```

脚本会依次完成：白名单 staging → 注入版本号 → 复制三张 MSIX 图标 → 清单预检 → 污染自检 → `makeappx pack`。

**staging 内容用白名单挑选。** `target/release/` 下混杂着 `.fingerprint`（数千个文件）、`nsis` 工具链、`.cargo-lock` 等构建中间产物；黑名单要求穷举所有不想要的东西，随工具链升级必然滞后，且失败时静默通过。白名单漏放会当场报错，安全得多。

### 触发 CI 发布

```bash
git tag v1.0.0
git push origin v1.0.0
```

`build-release.yml` 会在 `windows-latest` 上构建两个产物并直接创建 GitHub Release（跳过 artifact 中间步骤）。

### 关于证书

MSIX **不需要本地签名**。未签名的包直接上传微软合作伙伴中心，审核通过后由商店自动签名。仅企业侧载或直接下载安装的场景才需要自备代码签名证书。

---

## 已知约束

| 项 | 说明 |
|---|---|
| 平台 | 仅 Windows 分发（macOS/Linux 可开发调试，未做打包配置） |
| 字体 | 不嵌入 CJK 字体（体积考虑），使用 Windows 自带字体栈；运行时探测缺失字体并给出提示，自动回退同类字体 |
| 网络 | 除支付网关外零外部请求；二维码为本地静态图片；设计内容永不上传 |
| 解锁范围 | 解锁状态按本机生效，不跨设备同步 |

---

## 免责声明

本软件仅供设计参考与娱乐，请遵守相关法律法规。
