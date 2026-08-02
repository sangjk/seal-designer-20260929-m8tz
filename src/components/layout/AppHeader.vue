<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import UnlockBadge from '@/components/payment/UnlockBadge.vue';
import { APP_NAME, NAV_ABOUT, NAV_DESIGNER } from '@/core/copy';

/**
 * 顶部栏：产品名 + 解锁徽标 + 关于入口。
 *
 * 全部文案取自 `core/copy.ts`（禁用词单一防线）。
 */

const route = useRoute();

/** 当前是否处于关于页。 */
const onAbout = computed<boolean>(() => route.name === 'about');
</script>

<template>
  <header class="app-header">
    <h1 class="app-header__title">{{ APP_NAME }}</h1>
    <nav class="app-header__nav" :aria-label="APP_NAME">
      <RouterLink class="app-header__link" :class="{ 'is-active': !onAbout }" to="/designer">
        {{ NAV_DESIGNER }}
      </RouterLink>
      <RouterLink class="app-header__link" :class="{ 'is-active': onAbout }" to="/about">
        {{ NAV_ABOUT }}
      </RouterLink>
    </nav>
    <div class="app-header__right">
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
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
}

.app-header__title {
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--text-sm-lh);
  font-weight: var(--weight-medium);
  letter-spacing: 0.02em;
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
  background-color: var(--fg-8);
  color: var(--color-foreground);
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
