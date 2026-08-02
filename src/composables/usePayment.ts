import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { ref, type Ref } from 'vue';
import {
  PAY_CREATE_FAILED,
  PAY_CREATING,
  PAY_FAILED,
  PAY_SUCCESS,
  PAY_TIMEOUT,
  PAY_WAITING,
} from '@/core/copy';

/**
 * 支付会话状态机（架构设计 §4.3）。
 *
 * 前端职责极薄：**建单 → 展示本地静态二维码与实际应付金额 → 监听 Rust 广播事件**。
 * 轮询、超时、关单、写解锁文件全部在 Rust（ADR-003），因此：
 * - 用户关掉弹窗后台仍在轮询，不会漏单；
 * - 前端拿不到 appSecret，也没有任何外部网络能力。
 */

/** 支付渠道。 */
export type PayChannel = 'wechat' | 'alipay';

/** 会话阶段。 */
export type PayPhase = 'idle' | 'creating' | 'waiting' | 'succeeded' | 'timeout' | 'failed';

/** 支付会话快照。 */
export interface PaySession {
  /** 当前阶段。 */
  phase: PayPhase;
  /** 当前渠道。 */
  channel: PayChannel;
  /** 系统单号。 */
  orderId: string;
  /** 商户单号。 */
  payId: string;
  /** 下单金额。 */
  price: string;
  /** 实际应付金额（本地静态码模式必须展示此值）。 */
  reallyPrice: string;
  /** 剩余秒数（倒计时）。 */
  remainingSecs: number;
  /** 状态文案（全部取自 `core/copy.ts`）。 */
  message: string;
}

/** Rust `OrderInfo` 的前端镜像。 */
interface OrderInfoPayload {
  orderId: string;
  payId: string;
  channel: number;
  price: string;
  reallyPrice: string;
}

/** Rust `PayConfig` 的前端镜像。 */
interface PayConfigPayload {
  price: string;
  pollIntervalSecs: number;
  timeoutSecs: number;
}

/** `payment:state-changed` 事件负载。 */
interface StateChangedPayload {
  orderId: string;
  state: number;
  elapsedSecs: number;
}

/** `payment:succeeded` / `payment:timeout` 事件负载。 */
interface OrderIdEventPayload {
  orderId: string;
}

/** 默认超时（秒），在 `get_pay_config` 返回前作为占位。 */
const FALLBACK_TIMEOUT_SECS = 300;

/** 默认价格，在 `get_pay_config` 返回前作为占位。 */
const FALLBACK_PRICE = '9.9';

/**
 * 创建一份初始会话。
 *
 * @param channel 初始渠道。
 * @returns 初始会话快照。
 */
function createSession(channel: PayChannel): PaySession {
  return {
    phase: 'idle',
    channel,
    orderId: '',
    payId: '',
    price: FALLBACK_PRICE,
    reallyPrice: FALLBACK_PRICE,
    remainingSecs: FALLBACK_TIMEOUT_SECS,
    message: '',
  };
}

/** 支付 API。 */
export interface PaymentApi {
  /** 会话快照。 */
  session: Ref<PaySession>;
  /** 以指定渠道建单并开始等待支付。 */
  open: (channel: PayChannel) => Promise<void>;
  /** 切到支付宝（重新建单）。 */
  switchToAlipay: () => Promise<void>;
  /** 切到微信支付（重新建单）。 */
  switchToWechat: () => Promise<void>;
  /** 取消当前会话（停止轮询并尝试关单）。 */
  cancel: () => Promise<void>;
  /** 释放事件监听与定时器。 */
  dispose: () => void;
}

/**
 * 创建支付会话编排。
 *
 * @param onSucceeded 支付成功且 Rust 已完成解锁写盘后的回调。
 * @returns 支付 API。
 */
export function usePayment(onSucceeded: () => void): PaymentApi {
  const session = ref<PaySession>(createSession('wechat'));

  /** 服务端下发的超时秒数。 */
  let timeoutSecs = FALLBACK_TIMEOUT_SECS;

  /** 倒计时定时器。 */
  let ticker: number | null = null;

  /** 事件解绑句柄集合。 */
  let unlisteners: UnlistenFn[] = [];

  /** 停止倒计时。 */
  function stopTicker(): void {
    if (ticker !== null) {
      window.clearInterval(ticker);
      ticker = null;
    }
  }

  /** 启动倒计时（每秒递减，到 0 停止，真正的超时判定以 Rust 事件为准）。 */
  function startTicker(): void {
    stopTicker();
    ticker = window.setInterval(() => {
      const next = session.value.remainingSecs - 1;
      session.value.remainingSecs = next > 0 ? next : 0;
      if (next <= 0) {
        stopTicker();
      }
    }, 1000);
  }

  /**
   * 注册 Rust 事件监听（幂等）。
   */
  async function ensureListeners(): Promise<void> {
    if (unlisteners.length > 0) {
      return;
    }
    try {
      const offState = await listen<StateChangedPayload>('payment:state-changed', (event) => {
        const payload = event.payload;
        if (payload.orderId !== session.value.orderId) {
          return;
        }
        const remaining = timeoutSecs - payload.elapsedSecs;
        session.value.remainingSecs = remaining > 0 ? remaining : 0;
      });

      const offSucceeded = await listen<OrderIdEventPayload>('payment:succeeded', (event) => {
        if (event.payload.orderId !== session.value.orderId) {
          return;
        }
        stopTicker();
        session.value.phase = 'succeeded';
        session.value.message = PAY_SUCCESS;
        onSucceeded();
      });

      const offTimeout = await listen<OrderIdEventPayload>('payment:timeout', (event) => {
        if (event.payload.orderId !== session.value.orderId) {
          return;
        }
        stopTicker();
        session.value.phase = 'timeout';
        session.value.message = PAY_TIMEOUT;
        session.value.remainingSecs = 0;
      });

      const offFailed = await listen<OrderIdEventPayload>('payment:failed', (event) => {
        if (event.payload.orderId !== session.value.orderId) {
          return;
        }
        stopTicker();
        session.value.phase = 'failed';
        session.value.message = PAY_FAILED;
      });

      unlisteners = [offState, offSucceeded, offTimeout, offFailed];
    } catch {
      // 非 Tauri 环境下监听不可用：保持在 waiting 阶段，由用户手动关闭
      unlisteners = [];
    }
  }

  /** 拉取一次支付配置（价格 / 超时）。 */
  async function loadConfig(): Promise<void> {
    try {
      const cfg = await invoke<PayConfigPayload>('get_pay_config');
      timeoutSecs = cfg.timeoutSecs > 0 ? cfg.timeoutSecs : FALLBACK_TIMEOUT_SECS;
      session.value.price = cfg.price;
    } catch {
      timeoutSecs = FALLBACK_TIMEOUT_SECS;
    }
  }

  /**
   * 建单并进入等待支付。
   *
   * @param channel 支付渠道。
   */
  async function open(channel: PayChannel): Promise<void> {
    stopTicker();
    await cancelWatchQuietly();

    session.value = createSession(channel);
    session.value.phase = 'creating';
    session.value.message = PAY_CREATING;

    await loadConfig();
    await ensureListeners();

    try {
      const command = channel === 'wechat' ? 'create_wechat_order' : 'create_alipay_order';
      const order = await invoke<OrderInfoPayload>(command);

      session.value.orderId = order.orderId;
      session.value.payId = order.payId;
      session.value.price = order.price;
      session.value.reallyPrice = order.reallyPrice;
      session.value.remainingSecs = timeoutSecs;
      session.value.phase = 'waiting';
      session.value.message = PAY_WAITING;

      await invoke('start_order_watch', {
        orderId: order.orderId,
        payId: order.payId,
      });
      startTicker();
    } catch {
      session.value.phase = 'failed';
      session.value.message = PAY_CREATE_FAILED;
    }
  }

  /** 静默取消后台轮询（忽略异常）。 */
  async function cancelWatchQuietly(): Promise<void> {
    try {
      await invoke('cancel_order_watch');
    } catch {
      // 非 Tauri 环境或尚未启动轮询：无需处理
    }
  }

  /** 取消当前会话：停轮询 + 尝试关单。 */
  async function cancel(): Promise<void> {
    stopTicker();
    await cancelWatchQuietly();
    const orderId = session.value.orderId;
    const shouldClose = orderId.length > 0 && session.value.phase === 'waiting';
    if (shouldClose) {
      try {
        await invoke('close_order', { orderId });
      } catch {
        // 关单失败不影响本地状态，订单会在网关侧自然过期
      }
    }
    session.value = createSession(session.value.channel);
  }

  /** 释放监听与定时器。 */
  function dispose(): void {
    stopTicker();
    for (const off of unlisteners) {
      off();
    }
    unlisteners = [];
  }

  return {
    session,
    open,
    switchToAlipay: (): Promise<void> => open('alipay'),
    switchToWechat: (): Promise<void> => open('wechat'),
    cancel,
    dispose,
  };
}
