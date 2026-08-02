import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 配置（Tauri 2 桌面应用）。
 *
 * 关键点：
 * - 固定端口 1420（Tauri devUrl 与之对应），strictPort 防止端口漂移。
 * - 监听器忽略 `src-tauri`，避免 Rust 编译产物触发前端热更新风暴。
 * - `envPrefix` 放行 `TAURI_` 前缀，供 Tauri CLI 注入构建目标信息。
 * - 不做任何 CDN 外链，全部资源本地打包（G3：100% 离线）。
 *
 * 注：此处使用同步对象式配置（而非 Tauri 模板默认的 `async () => ({...})`）。
 * 配置内部不存在任何异步依赖，同步形式可避免 `UserConfigExport` 重载歧义
 * （tsc 在 `tsconfig.node.json` 下会对返回 Promise 的箭头函数报 TS2769）。
 */
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Tauri 期望固定的开发服务器端口
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: false,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Windows 上 Tauri 2 使用的 WebView2 基于 Chromium，可安全使用 ES2021
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
