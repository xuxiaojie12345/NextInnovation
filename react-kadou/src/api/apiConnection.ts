/**
 * API 接続状況の監視
 *
 * 通信失敗（接続不可・タイムアウト）や 5xx を検知したら、
 * 購読している画面（App）へ通知して全画面のエラー画面を表示する。
 * 4xx（入力エラーなどの業務エラー）は通知しない。
 */
import type { AxiosError, AxiosInstance } from 'axios';

/** 通信不可（レスポンスなし）を表す表示用ステータス */
export const CONNECTION_ERROR_STATUS = 503;

type Listener = (status: number) => void;

const listeners = new Set<Listener>();

/** 接続失敗を購読する（戻り値で解除） */
export const onApiConnectionError = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** 接続失敗を通知する（5xx 以外・不明なステータスは 503 として扱う） */
export const notifyApiConnectionError = (status?: number): void => {
  const code = status && status >= 500 ? status : CONNECTION_ERROR_STATUS;
  listeners.forEach((listener) => listener(code));
};

/**
 * fetch のラッパー。
 * 通信失敗・5xx を監視し、そのまま呼び出し元へ結果／例外を返す。
 */
export const apiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    notifyApiConnectionError();
    throw error;
  }
  if (response.status >= 500) {
    notifyApiConnectionError(response.status);
  }
  return response;
};

/** axios インスタンスに接続失敗の監視を付ける */
export const attachApiConnectionMonitor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (!error.response) {
        // 通信失敗・タイムアウト（サーバーに到達できない）
        notifyApiConnectionError();
      } else if (error.response.status >= 500) {
        notifyApiConnectionError(error.response.status);
      }
      return Promise.reject(error);
    },
  );
};
