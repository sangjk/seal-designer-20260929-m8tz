<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';
import { onMounted, ref } from 'vue';
import PaperButton from '@/components/ui/PaperButton.vue';
import PaperCard from '@/components/ui/PaperCard.vue';
import {
  ABOUT_DISCLAIMER_TITLE,
  ABOUT_INTRO,
  ABOUT_OFFLINE,
  ABOUT_PRODUCT_LABEL,
  ABOUT_TITLE,
  ABOUT_VERSION_LABEL,
  APP_NAME,
  BTN_BACK,
  DISCLAIMER,
  DISCLAIMER_DESIGN,
} from '@/core/copy';

/**
 * 关于页（F-47）。
 *
 * 展示产品名 / 版本号 / 离线声明 / 免责声明，并提供返回设计器入口。
 *
 * ★ 名字三分离（ADR-004）：这里显示的是 Rust `get_app_info` 返回的
 *   **用户可见产品名**「印章生成器」；exe 名 `seal-designer` 与 MSIX 包身份
 *   都不在此页面出现，避免用户困惑。
 *
 * ★ 无路由守卫：关于页与解锁态无关，任何时候都可达（软锁纪律）。
 */

/** Rust `AppInfo` 的前端镜像。 */
interface AppInfoPayload {
  productName: string;
  version: string;
}

/** 产品名（默认取本地常量，Rust 返回后覆盖）。 */
const productName = ref<string>(APP_NAME);

/** 版本号（读取失败时留空，不展示占位假数据）。 */
const version = ref<string>('');

onMounted(async () => {
  try {
    const info = await invoke<AppInfoPayload>('get_app_info');
    if (info.productName.length > 0) {
      productName.value = info.productName;
    }
    version.value = info.version;
  } catch {
    // 非 Tauri 环境（浏览器调试）拿不到包信息：保留默认产品名、版本留空
    version.value = '';
  }
});
</script>

<template>
  <div class="about">
    <PaperCard :title="ABOUT_TITLE" class="about__card">
      <p class="about__intro">{{ ABOUT_INTRO }}</p>
      <p class="about__offline">{{ ABOUT_OFFLINE }}</p>

      <dl class="about__meta">
        <div class="about__row">
          <dt class="about__key">{{ ABOUT_PRODUCT_LABEL }}</dt>
          <dd class="about__value">{{ productName }}</dd>
        </div>
        <div v-if="version" class="about__row">
          <dt class="about__key">{{ ABOUT_VERSION_LABEL }}</dt>
          <dd class="about__value about__value--mono">{{ version }}</dd>
        </div>
      </dl>

      <section class="about__disclaimer">
        <h3 class="about__disclaimer-title">{{ ABOUT_DISCLAIMER_TITLE }}</h3>
        <p class="about__disclaimer-text">{{ DISCLAIMER }}</p>
        <p class="about__disclaimer-text">{{ DISCLAIMER_DESIGN }}</p>
      </section>

      <div class="about__actions">
        <RouterLink class="about__back" to="/">
          <PaperButton variant="secondary" size="sm">{{ BTN_BACK }}</PaperButton>
        </RouterLink>
      </div>
    </PaperCard>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--space-6);
  overflow-y: auto;
}

.about__card {
  width: 100%;
  max-width: 560px;
  align-self: flex-start;
}

.about__intro,
.about__offline {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  color: var(--fg-70);
}

.about__offline {
  color: var(--fg-60);
}

.about__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-base);
  background-color: var(--fg-4);
}

.about__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.about__key {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.about__value {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  color: var(--color-foreground);
}

.about__value--mono {
  font-family: var(--font-mono);
}

.about__disclaimer {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.about__disclaimer-title {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  font-weight: var(--weight-medium);
  color: var(--color-foreground);
}

.about__disclaimer-text {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.about__actions {
  display: flex;
  justify-content: flex-start;
}

.about__back {
  text-decoration: none;
}

.about__back:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-base);
}
</style>
