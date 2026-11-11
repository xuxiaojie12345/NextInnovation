import { ApiError } from './ApiError';
import {
  normalizeHttpError,
  normalizeTransportError,
} from './normalizeError';

/**
 * 共通 HTTP クライアント（設計案 4.3 / 4.4 の一部）。
 * - タイムアウト（fetch の AbortController で実現）
 * - エラーの正規化（normalizeHttpError / normalizeTransportError）
 * - GET のみ、5xx / タイムアウト時に 1 回自動再試行
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  /** タイムアウト（ms）。既定 10 秒 */
  timeoutMs?: number;
  /** GET の自動再試行を有効にする（5xx / 503 / タイムアウト時に 1 回） */
  retry?: boolean;
  /** 操作者 ID（バックエンドの更新者記録用） */
  operatorId?: string | null;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** 保存系などの長い処理に使うタイムアウト */
export const SAVE_TIMEOUT_MS = 15_000;

export async function httpRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const attempts = options.retry ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    let timedOut = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    let res: Response;
    let transportError: unknown;
    try {
      res = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.operatorId ? { 'X-User-Id': options.operatorId } : {}),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (e) {
      transportError = e;
    } finally {
      clearTimeout(timer);
    }

    // 通信到達前エラー（タイムアウト / オフライン / ネットワーク）
    if (transportError !== undefined) {
      // GET はタイムアウト時に 1 回だけ再試行する（設計案：年度データ取得, 統計）
      if (timedOut && options.retry) {
        if (attempt === attempts - 1) {
          throw normalizeTransportError(transportError, { timedOut });
        }
        continue;
      }
      throw normalizeTransportError(transportError, { timedOut });
    }

    // HTTP エラー（4xx / 5xx）
    if (!res!.ok) {
      const apiError = await normalizeHttpError(res!);
      // GET は 5xx（/500/502/503/504）で 1 回だけ再試行する
      if (
        options.retry &&
        (apiError.status === undefined || apiError.status >= 500) &&
        attempt < attempts - 1
      ) {
        continue;
      }
      throw apiError;
    }

    // 成功
    if (res!.status === 204) return undefined as T;
    return (await res!.json()) as T;
  }

  // 到達しない（上記ループ内で常に return / throw する）
  throw new ApiError({
    kind: 'server',
    message: '予期しないエラーが発生しました。',
  });
}