/**
 * API エラーの分類。
 * react-kadou × api_kadou 通信異常系設計案（docs/react-kadou-api-error-design.html）の
 * エラー契約に沿って、フロントで扱うエラーの種別を表現する。
 */
export type ApiErrorKind =
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'conflict'
  | 'business'
  | 'rateLimit'
  | 'server'
  | 'maintenance'
  | 'timeout'
  | 'offline'
  | 'network'
  | 'badResponse'
  | 'canceled';

/** HTTP ステータスとエラー種別の対応（設計案 2.2 に準拠） */
const KIND_FROM_STATUS: Record<number, ApiErrorKind> = {
  400: 'business',
  401: 'auth',
  403: 'forbidden',
  404: 'notFound',
  409: 'conflict',
  422: 'validation',
  429: 'rateLimit',
  503: 'maintenance',
};

/**
 * 通信異常を正規化したエラー。
 * メッセージは表示用の日本語文言を保持する（オフライン/ネットワーク/タイムアウトなど）。
 */
export class ApiError extends Error {
  /** エラーの分類（正規化済み） */
  readonly kind: ApiErrorKind;
  /** HTTP ステータス（通信到達前なら undefined） */
  readonly status?: number;
  /** バックエンドの error code（例: KADOU_CONFLICT） */
  readonly code?: string;
  /** 業務コード（message id。BusinessException が message に載せる。t() で翻訳に使う） */
  readonly messageId?: string;
  /** メッセージプレースホルダの位置引数（code とセットで返る） */
  readonly params?: Array<string | number>;
  /** フィールド単位のエラー（422 の loc から生成） */
  readonly fieldErrors?: Record<string, string>;
  /** X-Request-Id（バックエンドが返す場合） */
  readonly requestId?: string;
  /**
   * バックエンドが返した detail（エラー契約の生データ）。
   * 一括取り込み中止（409）のように、画面が復元用データを必要とする場合に使う。
   */
  readonly detail?: unknown;

  constructor(opts: {
    kind: ApiErrorKind;
    message: string;
    status?: number;
    code?: string;
    messageId?: string;
    params?: Array<string | number>;
    fieldErrors?: Record<string, string>;
    requestId?: string;
    detail?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.kind = opts.kind;
    this.status = opts.status;
    this.code = opts.code;
    this.messageId = opts.messageId;
    this.params = opts.params;
    this.fieldErrors = opts.fieldErrors;
    this.requestId = opts.requestId;
    this.detail = opts.detail;
  }
}

/** 「ApiError」であるかどうか */
export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** HTTP ステータスに対応するエラー種別を返す（未定義は 500系なら server / それ以外 business） */
export const kindFromStatus = (status: number): ApiErrorKind =>
  KIND_FROM_STATUS[status] ??
  (status >= 500 ? 'server' : 'business');