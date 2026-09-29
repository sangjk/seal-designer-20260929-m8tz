<script setup lang="ts">
import { inject, computed } from 'vue';
import { useRoute } from 'vue-router';
import UnlockBadge from '@/components/payment/UnlockBadge.vue';
import { APP_NAME, NAV_ABOUT, NAV_DESIGNER } from '@/core/copy';
import brandLogo from '@/assets/brand-logo.png';

/**
 * 顶部栏：品牌 Logo + 产品名 + 导航 + 参数抽屉开关 + 解锁徽标。
 * 文案取自 `core/copy.ts`（禁用词单一防线）。
 */

const route = useRoute();

/** 当前是否处于关于页。 */
const onAbout = computed<boolean>(() => route.name === 'about');

/** 参数抽屉开合状态（纯 UI，由 App.vue provide）。脚本侧读取 `.value`，
 * 模板统一消费下方 computed，避免模板自动解包导致的 `.value` 失配。 */
const drawerState = inject<{ value: boolean }>('drawerOpen');
const toggleDrawer = inject<() => void>('toggleDrawer');

/** 抽屉是否展开（模板用）。 */
const drawerIsOpen = computed<boolean>(() => (drawerState ? drawerState.value : true));

/** 抽屉开关按钮的 aria 标签。 */
const drawerLabel = computed<string>(() =>
  drawerIsOpen.value ? '收起参数面板' : '展开参数面板',
);
</script>

<template>
  <header class="app-header">
    <div class="app-header__brand">
      <img class="app-header__logo" :src="brandLogo" alt="" aria-hidden="true" />
      <h1 class="app-header__title">{{ APP_NAME }}</h1>
    </div>

    <nav class="app-header__nav" :aria-label="APP_NAME">
      <RouterLink class="app-header__link" :class="{ 'is-active': !onAbout }" to="/designer">
        {{ NAV_DESIGNER }}
      </RouterLink>
      <RouterLink class="app-header__link" :class="{ 'is-active': onAbout }" to="/about">
        {{ NAV_ABOUT }}
      </RouterLink>
    </nav>

    <div class="app-header__right">
      <button
        v-if="!onAbout"
        type="button"
        class="app-header__drawer"
        :class="{ 'is-active': drawerIsOpen }"
        :aria-label="drawerLabel"
        :aria-pressed="drawerIsOpen"
        @click="toggleDrawer && toggleDrawer()"
      >
        <span class="app-header__drawer-bar" />
        <span class="app-header__drawer-bar" />
        <span class="app-header__drawer-bar" />
      </button>
      <UnlockBadge />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex: 0 0 auto;
  height: var(--header-height);
  padding: 0 var(--space-5);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.app-header__logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  background-color: var(--color-cream);
  padding: 1px;
}

.app-header__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  line-height: var(--text-sm-lh);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.04em;
  color: var(--color-foreground);
  white-space: nowrap;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-right: auto;
}

.app-header__link {
  padding: 6px var(--space-3);
  border-radius: var(--radius-base);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--fg-60);
  text-decoration: none;
  transition:
    background-color var(--transition-interactive),
    color var(--transition-interactive);
}

.app-header__link:hover {
  background-color: var(--fg-8);
  color: var(--color-foreground);
}

.app-header__link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.app-header__link.is-active {
  background-color: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__drawer {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  width: 34px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: var(--color-surface);
  cursor: pointer;
  transition: var(--transition-interactive);
}

.app-header__drawer:hover {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.app-header__drawer:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.app-header__drawer.is-active {
  border-color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.app-header__drawer-bar {
  height: 2px;
  border-radius: var(--radius-full);
  background-color: var(--color-foreground);
  transition: background-color var(--transition-interactive);
}

.app-header__drawer:hover .app-header__drawer-bar,
.app-header__drawer.is-active .app-header__drawer-bar {
  background-color: var(--color-accent-strong);
}
</style>
