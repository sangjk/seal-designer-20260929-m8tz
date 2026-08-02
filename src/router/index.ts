import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import DesignerView from '../views/DesignerView.vue';

/**
 * 路由表：仅两条路由（设计器 / 关于）。
 *
 * ★ 软锁纪律：本文件**不得**出现任何 `beforeEach` / `beforeEnter` 权限守卫。
 *   解锁与否只影响「导出落盘」这一动作（闸门在 Rust 侧），不影响任何页面可达性。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'designer',
    // 顶栏导航链接指向 /designer，这里用别名让两个路径都命中同一视图，
    // 避免走 catch-all 重定向导致 RouterLink 的 active 状态抖动
    alias: '/designer',
    component: DesignerView,
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  // 桌面端使用 hash 模式，避免 Tauri 自定义协议下的深链路径问题
  history: createWebHashHistory(),
  routes,
});

export default router;
