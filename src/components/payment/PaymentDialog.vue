<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import PaperButton from '@/components/ui/PaperButton.vue';
import PaperModal from '@/components/ui/PaperModal.vue';
import PaperSegmented, { type SegmentedOption } from '@/components/ui/PaperSegmented.vue';
import { usePayment, type PayChannel } from '@/composables/usePayment';
import { notifyUnlocked } from '@/composables/usePaymentDialog';
import { useToast } from '@/composables/useToast';
import {
  BTN_PAY_CLOSE,
  BTN_PAY_RETRY,
  BTN_REVIEW_CODE_REDEEM,
  PAY_AMOUNT_LABEL,
  PAY_CHANNEL_ALIPAY,
  PAY_CHANNEL_WECHAT,
  PAY_NOTICE,
  PAY_ORDER_LABEL,
  PAY_SCAN_TIP,
  PAY_SUBTITLE,
  PAY_SUCCESS,
  PAY_TITLE,
  REVIEW_CODE_FAILED,
  REVIEW_CODE_INVALID,
  REVIEW_CODE_LABEL,
  REVIEW_CODE_PLACEHOLDER,
  REVIEW_CODE_SUCCESS,
  payCountdownText,
  priceText,
} from '@/core/copy';

/**
 * 支付弹窗（架构设计 §4.3 / F-44）。
 *
 * ★ 前端职责极薄：
 *   建单 → 展示**本地静态二维码** + **实际应付金额（reallyPrice）** → 等待 Rust 广播。
 *   轮询 / 超时 / 关单 / 写解锁文件全在 Rust（ADR-003），因此：
 *   - 二维码是打包进 `public/pay/` 的本地图片，**离线可用**，不依赖网关返回图片；
 *   - 本地静态码模式下网关会对金额做「分位错开」，故**必须**展示 `reallyPrice`
 *     而不是标价，否则用户付错金额将永远匹配不上订单（附录 A 坑位）。
 *
 * ★ 禁用词纪律：本组件所有用户可见文案均取自 `core/copy.ts`。
 */

const props = defineProps<{
  /** 弹窗是否打开（由 `usePaymentDialog` 单例经 `App.vue` 下传）。 */
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const toast = useToast();

/** 成功后延迟关闭并续做导出的毫秒数（让用户看清成功状态）。 */
const SUCCESS_HOLD_MS = 1200;

/** 成功后的延迟句柄。 */
let successTimer: number | null = null;

/** 清除成功延迟句柄。 */
function clearSuccessTimer(): void {
  if (successTimer !== null) {
    window.clearTimeout(successTimer);
    successTimer = null;
  }
}

const payment = usePayment(() => {
  toast.success(PAY_SUCCESS);
  clearSuccessTimer();
  // notifyUnlocked：关闭弹窗 + 执行一次"续做"动作（通常是重试刚才被拦下的导出）
  successTimer = window.setTimeout(() => {
    successTimer = null;
    notifyUnlocked();
  }, SUCCESS_HOLD_MS);
});

const { session } = payment;

/** 渠道分段选项。 */
const CHANNEL_OPTIONS: SegmentedOption[] = [
  { value: 'wechat', label: PAY_CHANNEL_WECHAT },
  { value: 'alipay', label: PAY_CHANNEL_ALIPAY },
];

/** 本地静态二维码路径（打包在 `public/pay/` 内，100% 离线）。 */
const QR_SOURCES: Record<PayChannel, string> = {
  wechat: `${import.meta.env.BASE_URL}pay/weixin.png`,
  alipay: `${import.meta.env.BASE_URL}pay/zhifubao.png`,
};

/** 当前渠道的二维码地址。 */
const qrSrc = computed<string>(() => QR_SOURCES[session.value.channel]);

/** 当前渠道名称（用于图片替代文本）。 */
const channelLabel = computed<string>(() =>
  session.value.channel === 'wechat' ? PAY_CHANNEL_WECHAT : PAY_CHANNEL_ALIPAY,
);

/** 是否处于「等待支付」阶段（展示二维码与倒计时）。 */
const isWaiting = computed<boolean>(() => session.value.phase === 'waiting');

/** 是否处于「建单中」阶段。 */
const isCreating = computed<boolean>(() => session.value.phase === 'creating');

/** 是否允许「重新发起」。 */
const canRetry = computed<boolean>(
  () => session.value.phase === 'timeout' || session.value.phase === 'failed',
);

/** 状态文案的语气类名。 */
const statusTone = computed<string>(() => {
  const phase = session.value.phase;
  if (phase === 'succeeded') {
    return 'is-success';
  }
  if (phase === 'timeout' || phase === 'failed') {
    return 'is-danger';
  }
  return 'is-info';
});

/** 渠道分段的双向绑定（切换即重新建单）。 */
const channelModel = computed<string>({
  get: (): string => session.value.channel,
  set: (value: string): void => {
    if (value === session.value.channel || isCreating.value) {
      return;
    }
    void payment.open(value === 'alipay' ? 'alipay' : 'wechat');
  },
});

/** 关闭弹窗（由用户主动触发）。 */
function handleClose(): void {
  clearSuccessTimer();
  emit('close');
}

/** 重新发起一笔订单。 */
function handleRetry(): void {
  void payment.open(session.value.channel);
}

/**
 * 审核测试码兑换（微软商店审核员专用，认证策略 10.3.3「App Is Testable」）。
 *
 * ★ 与支付成功完全同链路：校验在 Rust（`redeem_review_code`），
 *   解锁写盘与 `unlock:changed` 广播也在 Rust；前端只做极薄的输入与结果提示。
 *   码值不下发前端、不出现在任何 UI 文案中，仅经 Partner Center 认证备注提交。
 */
const reviewCode = ref<string>('');

/** 兑换请求进行中（防重复提交）。 */
const redeeming = ref<boolean>(false);

/** 兑换测试码：成功 → 与支付成功一样延迟关闭并续做导出；失败 → 提示无效。 */
async function handleRedeem(): Promise<void> {
  const code = reviewCode.value.trim();
  if (code.length === 0 || redeeming.value) {
    return;
  }
  redeeming.value = true;
  try {
    const ok = await invoke<boolean>('redeem_review_code', { code });
    if (ok) {
      toast.success(REVIEW_CODE_SUCCESS);
      clearSuccessTimer();
      successTimer = window.setTimeout(() => {
        successTimer = null;
        notifyUnlocked();
      }, SUCCESS_HOLD_MS);
      return;
    }
    toast.error(REVIEW_CODE_INVALID);
  } catch {
    toast.error(REVIEW_CODE_FAILED);
  } finally {
    redeeming.value = false;
  }
}

watch(
  () => props.open,
  (isOpen, wasOpen) => {
    if (isOpen === wasOpen) {
      return;
    }
    if (isOpen) {
      // 每次打开都重新建单：旧订单可能已超时或金额已被占用
      void payment.open(session.value.channel);
      return;
    }
    clearSuccessTimer();
    // 关闭即停止后台轮询并尝试关单（成功态不会再关单）
    void payment.cancel();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearSuccessTimer();
  payment.dispose();
});
</script>

<template>
  <PaperModal :open="open" :title="PAY_TITLE" :width="380" @close="handleClose">
    <p class="pay__subtitle">{{ PAY_SUBTITLE }}</p>

    <PaperSegmented v-model="channelModel" :options="CHANNEL_OPTIONS" :disabled="isCreating" />

    <div class="pay__stage">
      <div v-if="isWaiting" class="pay__qr-wrap">
        <img class="pay__qr" :src="qrSrc" :alt="channelLabel" draggable="false" />
        <p class="pay__scan-tip">{{ PAY_SCAN_TIP }}</p>
      </div>
      <div v-else-if="isCreating" class="pay__placeholder" role="status" aria-live="polite">
        <span class="pay__spinner" aria-hidden="true" />
      </div>
      <div v-else class="pay__placeholder pay__placeholder--finished" :class="statusTone">
        <span class="pay__mark" aria-hidden="true">
          {{ session.phase === 'succeeded' ? '✓' : '!' }}
        </span>
      </div>
    </div>

    <dl v-if="isWaiting" class="pay__meta">
      <div class="pay__row">
        <dt class="pay__key">{{ PAY_AMOUNT_LABEL }}</dt>
        <dd class="pay__value pay__value--amount">{{ priceText(session.reallyPrice) }}</dd>
      </div>
      <div class="pay__row">
        <dt class="pay__key">{{ PAY_ORDER_LABEL }}</dt>
        <dd class="pay__value pay__value--mono">{{ session.payId }}</dd>
      </div>
    </dl>

    <p class="pay__status" :class="statusTone" role="status" aria-live="polite">
      <span>{{ session.message }}</span>
      <span v-if="isWaiting" class="pay__countdown">
        {{ payCountdownText(session.remainingSecs) }}
      </span>
    </p>

    <p v-if="isWaiting" class="pay__notice">{{ PAY_NOTICE }}</p>

    <div class="pay__review">
      <label class="pay__review-label" for="review-code-input">{{ REVIEW_CODE_LABEL }}</label>
      <div class="pay__review-row">
        <input
          id="review-code-input"
          v-model="reviewCode"
          class="pay__review-input"
          type="text"
          :placeholder="REVIEW_CODE_PLACEHOLDER"
          autocomplete="off"
          spellcheck="false"
          :disabled="redeeming"
          @keyup.enter="handleRedeem"
        />
        <PaperButton
          variant="secondary"
          size="sm"
          :disabled="redeeming || reviewCode.trim().length === 0"
          @click="handleRedeem"
        >
          {{ BTN_REVIEW_CODE_REDEEM }}
        </PaperButton>
      </div>
    </div>

    <template #footer>
      <PaperButton v-if="canRetry" variant="primary" size="sm" @click="handleRetry">
        {{ BTN_PAY_RETRY }}
      </PaperButton>
      <PaperButton variant="secondary" size="sm" @click="handleClose">
        {{ BTN_PAY_CLOSE }}
      </PaperButton>
    </template>
  </PaperModal>
</template>

<style scoped>
.pay__subtitle {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  color: var(--fg-60);
}

.pay__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 208px;
}

.pay__qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.pay__qr {
  width: 176px;
  height: 176px;
  object-fit: contain;
  padding: var(--space-2);
  background-color: var(--white);
  border-radius: var(--radius-base);
  outline: 1px solid var(--outline-card);
  image-rendering: pixelated;
  user-select: none;
}

.pay__scan-tip {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.pay__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 176px;
  height: 176px;
  border-radius: var(--radius-base);
  background-color: var(--fg-4);
  outline: 1px solid var(--outline-card);
}

.pay__placeholder--finished.is-success {
  background-color: var(--color-success-soft);
  color: var(--color-fg-success);
}

.pay__placeholder--finished.is-danger {
  background-color: var(--color-danger-soft);
  color: var(--color-fg-danger);
}

.pay__mark {
  font-size: 40px;
  line-height: 1;
  font-weight: var(--weight-medium);
}

.pay__spinner {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 2px solid var(--fg-30);
  border-top-color: var(--color-foreground);
  animation: pay-spin 700ms linear infinite;
}

@keyframes pay-spin {
  to {
    transform: rotate(360deg);
  }
}

.pay__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
}

.pay__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.pay__key {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.pay__value {
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
  color: var(--color-foreground);
}

.pay__value--amount {
  font-size: var(--text-sm);
  line-height: var(--text-sm-lh);
  font-weight: var(--weight-medium);
}

.pay__value--mono {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.pay__status {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-base);
  font-size: var(--text-xs);
  line-height: var(--text-xs-lh);
}

.pay__status.is-info {
  background-color: var(--fg-4);
  color: var(--fg-70);
}

.pay__status.is-success {
  background-color: var(--color-success-soft);
  color: var(--color-fg-success);
}

.pay__status.is-danger {
  background-color: var(--color-danger-soft);
  color: var(--color-fg-danger);
}

.pay__countdown {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
}

.pay__notice {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.pay__review {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dashed var(--outline-card);
}

.pay__review-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--fg-60);
}

.pay__review-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pay__review-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 var(--space-2);
  border: 1px solid var(--outline-card);
  border-radius: var(--radius-base);
  background-color: var(--white);
  color: var(--color-foreground);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 30px;
  outline: none;
}

.pay__review-input:focus {
  border-color: var(--fg-30);
}

.pay__review-input:disabled {
  opacity: 0.6;
}
</style>
