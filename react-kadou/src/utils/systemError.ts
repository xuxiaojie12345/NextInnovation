import { ApiError, isApiError } from './ApiError';

const SYSTEM_KINDS: ReadonlySet<string> = new Set([
  'server',
  'maintenance',
  'timeout',
  'offline',
  'network',
]);

export const SYSTEM_ERROR_EVENT = 'app:system-error';
const DEDUP_WINDOW_MS = 5000;
let lastNotifiedAt = -1;

/** システムエラーの表示情報（異常画面で code + メッセージ を直接表示するための最小構成） */
export interface SystemErrorDetail {
  /** バックエンドのエラーコード（例: SYSTEM_ERROR / KADOU_xxx / HTTP ステータス） */
  code?: string;
  /** HTTP ステータス（通信到達前なら undefined） */
  status?: number;
  /** 表示用メッセージ */
  message: string;
}

export function isSystemError(e: unknown): boolean {
  if (!isApiError(e)) return false;
  return SYSTEM_KINDS.has(e.kind);
}

/** システムエラーなら異常画面に表示する詳細情報を組み立てる（非システムエラーは null） */
export function getSystemErrorDetail(e: unknown): SystemErrorDetail | null {
  if (!isSystemError(e)) return null;
  const api = e as ApiError;
  return {
    code: api.code,
    status: api.status,
    message: api.message || 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。',
  };
}

/**
 * システムエラーを処理する。
 * - システムエラーだった場合：グローバルイベントを送出して異常画面へ遷移させ、true を返す。
 * - それ以外（業務エラーなど）：何もせず false を返す。
 * 呼び出し元は true の場合、個別の message.error は出さず異常画面に任せること。
 */
export function notifySystemError(e: unknown): boolean {
  if (!isSystemError(e)) return false;
  const now = Date.now();
  if (lastNotifiedAt !== -1 && now - lastNotifiedAt < DEDUP_WINDOW_MS) return true;
  lastNotifiedAt = now;
  const detail = getSystemErrorDetail(e);
  window.dispatchEvent(
    new CustomEvent<SystemErrorDetail>(SYSTEM_ERROR_EVENT, { detail: detail ?? undefined }),
  );
  return true;
}