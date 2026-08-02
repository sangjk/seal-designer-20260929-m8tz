import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

/** 提示语气。 */
export type ToastKind = 'info' | 'success' | 'danger' | 'warning';

/** 单条提示。 */
export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

/** 默认停留时长（毫秒）。 */
const DEFAULT_DURATION_MS = 3200;

/** 同屏最多保留的提示条数。 */
const MAX_TOASTS = 3;

const items = ref<ToastItem[]>([]);
const timers = new Map<number, number>();
let seq = 0;

/**
 * 移除指定提示。
 *
 * @param id 提示 id。
 */
function remove(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
  const index = items.value.findIndex((t) => t.id === id);
  if (index >= 0) {
    items.value.splice(index, 1);
  }
}

/**
 * 推送一条提示。
 *
 * @param message 文案（必须来自 `core/copy.ts`，禁止组件硬编码）。
 * @param kind 语气，默认 `info`。
 * @param duration 停留毫秒数，默认 3200。
 * @returns 新提示的 id。
 */
function push(
  message: string,
  kind: ToastKind = 'info',
  duration: number = DEFAULT_DURATION_MS,
): number {
  seq += 1;
  const id = seq;
  items.value.push({ id, message, kind });
  while (items.value.length > MAX_TOASTS) {
    const oldest = items.value[0];
    if (!oldest) {
      break;
    }
    remove(oldest.id);
  }
  const timer = window.setTimeout(() => remove(id), duration);
  timers.set(id, timer);
  return id;
}

/** 清空全部提示。 */
function clear(): void {
  for (const timer of timers.values()) {
    window.clearTimeout(timer);
  }
  timers.clear();
  items.value = [];
}

/** 提示中心返回值。 */
export interface ToastApi {
  toasts: DeepReadonly<Ref<ToastItem[]>>;
  push: typeof push;
  success: (message: string) => number;
  error: (message: string) => number;
  info: (message: string) => number;
  remove: typeof remove;
  clear: typeof clear;
}

/**
 * 轻量全局提示中心（模块级单例，`ToastHost` 负责渲染）。
 *
 * @returns 提示 API。
 */
export function useToast(): ToastApi {
  return {
    toasts: readonly(items),
    push,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'danger'),
    info: (message: string) => push(message, 'info'),
    remove,
    clear,
  };
}
