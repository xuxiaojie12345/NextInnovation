import { ApiError, kindFromStatus } from './ApiError';

/** FastAPI の 422 ボディに含まれる検証エラー1件（設計案 4.2 参照） */
interface FieldErrorItem {
  loc: Array<string | number>;
  msg: string;
}

/**
 * HTTP エラーレスポンス（4xx/5xx）を ApiError に正規化する。
 * FastAPI のエラー形式は以下の 3 種類があるため、ここで統一する（設計案 4.2）。
 *   a) { "code": "...", "message": "...", "detail": "...", "fieldErrors": {...} }
 *   b) { "detail": "文字列" }（HTTPException）
 *   c) { "detail": [{loc,msg,type}] }（422 RequestValidationError）
 *   それ以外（HTML / 空 / 非JSON）は badResponse / server として扱う。
 */
export async function normalizeHttpError(res: Response): Promise<ApiError> {
  const status = res.status;
  const kind = kindFromStatus(status);

  let body: unknown;
  let raw = '';
  try {
    raw = await res.text();
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null; // 非JSON（HTML の 500 や空ボディなど）
  }

  // requestId はヘッダから（バックエンドが都度返す仕様）
  const requestId = res.headers.get('X-Request-Id') ?? undefined;

  // ボディを解釈できない場合は JSON 形式を期待できない
  if (typeof body !== 'object' || body === null) {
    return new ApiError({
      kind: status >= 500 ? 'server' : 'badResponse',
      status,
      code: status >= 500 ? 'SYSTEM_ERROR' : undefined,
      message:
        status >= 500
          ? 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。'
          : `リクエストに失敗しました（ステータス: ${status}）。`,
      requestId,
    });
  }

  const data = body as Record<string, unknown>;

  // (a) error code を持つ独自エラー形式
  if (typeof data.code === 'string') {
    return new ApiError({
      kind,
      status,
      code: data.code,
      // BusinessException は業務コード（message id）を message に載せる。
      // code（システム分類）と分離して messageId として保持し、t() 翻訳に使う。
      messageId: typeof data.message === 'string' ? data.message : undefined,
      message:
        typeof data.message === 'string' ? data.message : 'エラーが発生しました。',
      params: extractParams(body),
      fieldErrors: toFieldErrors(data.fieldErrors),
      requestId,
      detail: data.detail,
    });
  }

  // (b) detail が文字列（HTTPException）
  if (typeof data.detail === 'string') {
    return new ApiError({
      kind,
      status,
      code: status >= 500 ? 'SYSTEM_ERROR' : undefined,
      message: data.detail,
      requestId,
    });
  }

  // (c) detail が配列（422 検証エラー）
  if (Array.isArray(data.detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of data.detail as FieldErrorItem[]) {
      const key = item.loc?.[item.loc.length - 1];
      if (typeof key === 'string' && key && item.msg) {
        fieldErrors[key] = item.msg;
      }
    }
    return new ApiError({
      kind: 'validation',
      status,
      code: 'VALIDATION_ERROR',
      message:
        Object.keys(fieldErrors).length > 0
          ? '入力内容に誤りがあります。'
          : '入力内容に誤りがあります。',
      fieldErrors,
      requestId,
    });
  }

  // その他（未知の JSON を含むエラー）
  return new ApiError({
    kind: status >= 500 ? 'server' : 'business',
    status,
    code: status >= 500 ? 'SYSTEM_ERROR' : undefined,
    message:
      status >= 500
        ? 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。'
        : 'エラーが発生しました。',
    requestId,
  });
}

/** fetch が throw した（通信到達前の）エラーを ApiError に正規化する */
export function normalizeTransportError(
  err: unknown,
  opts?: { timedOut?: boolean },
): ApiError {
  const timedOut = opts?.timedOut ?? false;

  // タイムアウト
  if (timedOut) {
    return new ApiError({
      kind: 'timeout',
      message: '通信がタイムアウトしました。時間を置いて再度お試しください。',
    });
  }

  // オフライン（navigator.onLine が false）
  // ※テスト・Node では navigator が無い場合があるためガードする
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.onLine === 'boolean' &&
    navigator.onLine === false
  ) {
    return new ApiError({
      kind: 'offline',
      message: 'インターネットに接続されていません。通信環境を確認してください。',
    });
  }

  // その他の通信エラー（CORS 設定・ネットワーク断の可能性。設計案 4.2 の ERR_NETWORK 相当）
  return new ApiError({
    kind: 'network',
    message:
      'サーバーに接続できませんでした。通信経路の設定（CORS・プロキシ）などをご確認ください。',
  });
}

/** ユーザー向けに表示するメッセージを返す（通常の Error は message、ApiError は message） */
export function displayMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** 任意の値（{key: "メッセージ"} 形式）を正規化する */
function toFieldErrors(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const out: Record<string, string> = {};
  let has = false;
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') {
      out[k] = v;
      has = true;
    } else if (typeof v === 'object' && v !== null) {
      const msg = (v as Record<string, unknown>).message;
      if (typeof msg === 'string') {
        out[k] = msg;
        has = true;
      }
    }
  }
  return has ? out : undefined;
}

/** バックエンドが返すメッセージ位置引数（params）を正規化する。
 * トップレベルまたは detail 内から探す（main.py の _error_body は params を detail に格納する）。 */
function extractParams(
  body: unknown,
): Array<string | number> | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const data = body as Record<string, unknown>;
  let params: unknown = data.params;
  if (
    params === undefined &&
    typeof data.detail === 'object' &&
    data.detail !== null
  ) {
    params = (data.detail as Record<string, unknown>).params;
  }
  if (!Array.isArray(params)) return undefined;
  const out: Array<string | number> = [];
  for (const p of params) {
    if (typeof p === 'string' || typeof p === 'number') out.push(p);
  }
  return out.length ? out : undefined;
}