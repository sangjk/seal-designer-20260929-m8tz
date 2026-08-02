# ADR-008：前端状态管理与 Paper Design 落地

- **状态**：已接受（阶段 2）
- **日期**：2025-08-02
- **提出**：Lin（架构师）
- **关联**：UI规则（Paper Design Token）、G3（100% 离线）、问题 020

## 背景

前端需管理 30+ 设计参数（跨 12 张参数卡片共享）与解锁态；UI 视觉须遵循「Paper Design」设计语言。UI规则明确 Token 是"设计系统 Token 而非 Tailwind class"，需自行映射。G3 要求 100% 离线（禁 Google Fonts CDN）。问题 020 要求禁用词（激活/会员/VIP/订阅）绝不能出现在 UI。

## 决策

- **状态管理**：Pinia 双 store —— `design.ts`（全量 `SealDesign` + 联动 action）/ `unlock.ts`（解锁态镜像）。参数卡片不收 props，直接 `useDesignStore()` + `v-model`，避免 12 层透传。
- **样式**：原生 CSS 自定义属性（`src/styles/tokens.css`）承载全部 Paper Design Token（含 `--paper-*` 颜色/间距/圆角/阴影 + `@media (prefers-color-scheme)` 暗色）。**不引入 Tailwind、不引入任何 UI 组件库**。
- **基础件**：`src/components/ui/` 下 9 个 Paper Design 基础组件（Card/Button/Segmented/Slider/Input/Select/Toggle/Modal/Badge），全部引用 Token、三态（hover/focus/disabled）统一，是唯一的"被允许的抽象"。
- **字体**：`@fontsource/montserrat` 本地打包（拉丁子集），`base.css` 设 Montserrat + 中文系统回退栈。
- **禁用词防线**：所有用户可见文案集中在 `src/core/copy.ts`（白名单），组件禁止硬编码禁用词；QA 以 `激活|会员|VIP|订阅` 为关键字扫描。

## 理由

- Token 即设计系统，自行映射比套 Tailwind 更直接可控，且省去一层构建与映射复杂度。
- UI 组件库（Element Plus 等）体积大、风格与 Paper Design 不符、引入额外心智负担；9 个基础件足够覆盖本项目。
- 离线要求禁用 CDN，`@fontsource` 本地打包是唯一合规路径。
- `copy.ts` 单点防线让禁用词扫描从"全仓grep"收敛到"单文件审查"（问题 020）。

## 备选方案

- **Tailwind CSS**：需额外把设计 Token 映射成 utility class，增加构建层与风格漂移风险 → 否决。
- **Element Plus / Naive UI**：重、风格不符、引入非 Paper Design 视觉 → 否决。
- **Google Fonts CDN**：违反 G3 离线 → 否决。
- **组件内联禁用词文案**：扫描面大、易漏 → 否决（采用 copy.ts 收敛）。

## 影响

- 工程师写任意组件只能 `var(--paper-*)`，不得硬编码 hex（业务印色除外，见 palette.ts 豁免）。
- 新增 UI 元素优先复用 `ui/` 9 基础件；确实需要新件时归入 `ui/` 并接 Token。
- `copy.ts` 变更需同步 QA 扫描白名单。

## 遵循约束

UI规则（Paper Design Token）、G3（离线）、问题 020（禁用词）。
