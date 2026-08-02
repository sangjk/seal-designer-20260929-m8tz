<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import AppHeader from './components/layout/AppHeader.vue';
import ToastHost from './components/layout/ToastHost.vue';
import PaymentDialog from './components/payment/PaymentDialog.vue';
import { useUnlock } from './composables/useUnlock';
import { paymentDialogOpen, closePaymentDialog } from './composables/usePaymentDialog';
import { BOOTING } from './core/copy';

const { ensureLoaded, dispose } = useUnlock();
const booted = ref<boolean>(false);

onMounted(async () => {
  await ensureLoaded();
  booted.value = true;
});

onBeforeUnmount(() => {
  dispose();
});

function handleDialogClose(): void {
  closePaymentDialog();
}
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <RouterView v-if="booted" />
      <div v-else class="app-boot" role="status" aria-live="polite">{{ BOOTING }}</div>
    </main>
    <ToastHost />
    <PaymentDialog :open="paymentDialogOpen" @close="handleDialogClose" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  /*
   * ★ 关键：必须是「确定高度」而非 `min-height`。
   * 若用 `min-height: 100vh`，内容（参数面板 12 张卡片）会撑高整条 flex 链
   * （app-shell→app-main→designer→panel 一路变到内容总高），使 `min-height:0`
   * 失去约束基准 —— 面板不可滚动、预览因被居中到超高画布之外而不可见。
   * 改为确定高度后，flex 子项在 100vh 内分配，`min-height:0` 生效、内部滚动恢复。
   */
  height: 100vh;
  background: var(--color-root);
}

.app-main {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.app-boot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  font-size: var(--text-xs);
  color: color-mix(in srgb, var(--color-foreground) 50%, transparent);
}
</style>
