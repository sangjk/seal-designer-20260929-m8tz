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
  min-height: 100vh;
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
