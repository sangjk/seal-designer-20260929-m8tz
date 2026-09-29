import { defineConfig } from '@playwright/test';

/**
 * Playwright 冒烟配置。
 *
 * 仅验证前端可达性与渲染结果（非 Tauri 环境：不断言导出 / 兑换的业务结果）。
 * 启动 `vite preview`（即已构建的 dist），复用 dist 内的真实产物。
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
