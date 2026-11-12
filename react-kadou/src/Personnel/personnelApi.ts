/**
 * 要員情報画面（PersonnelInfoScreen）のバックエンド API クライアント
 *
 * API_ID  : PersonnelInfoScreen
 * 参照先  : api_kadou/app/api/personnel.py
 *   GET  /api/kadou/personnel/{employeeNo}/{year}   … 社員番号で1件取得
 *   PUT  /api/kadou/personnel/{employeeNo}/{year}   … 保存（更新／追加）
 *   DEL  /api/kadou/personnel/{employeeNo}/{year}   … 削除
 *   GET  /api/kadou/personnel/count/{year}          … 登録要員数
 *   POST /api/kadou/personnel/import/{year}         … 一括取り込み
 *
 * NOTE: 開発時は src/setupProxy.js により /api が http://127.0.0.1:8000 へ転送される。
 */

import { ApiError } from '../utils/ApiError';
import { apiErrorMessage } from '../utils/errorMessage';
import { normalizeHttpError } from '../utils/normalizeError';

/** 要員情報（1件） */
export interface PersonnelInfoResponse {
  id: string | null;
  employeeNo: string;
  name: string;
  /** 所属部門名（部門マスタの名称） */
  department: string | null;
  /** 役割コード */
  role: string | null;
  /** 退場予定 */
  leavePlan: string | null;
}

/** 一括取り込みの1件分（社員番号 / 名前 / 役割 / 所属） */
export interface PersonnelImportApiRow {
  employeeNo: string;
  name: string;
  role: string;
  department: string;
  /** ファイル上の行番号（警告メッセージに含める） */
  line?: number;
}

/** 一括取り込みの結果 */
export interface PersonnelImportApiResult {
  added: number;
  updated: number;
  skipped: number;
  /** 既存データと重複した件数 */
  duplicated: number;
  /** 既存データと重複した社員番号（画面で「追加／上書き」を判定する用） */
  duplicatedEmployeeNos?: string[];
  /**
   * 既存データと重複した行の「DB 上の所属部門名」。
   * 上書き時は所属を更新しないため、プレビューはこの値をグレー表示する。
   */
  duplicatedDepartments?: Record<string, string>;
  /** ファイル全体を中止したか */
  aborted: boolean;
  /** ファイル全体を中止した理由 */
  abortReason: string | null;
  warnings: string[];
}

/** 一括取り込みが中止された場合に投げるエラー（409） */
export class PersonnelImportAbortedError extends Error {
  readonly result: PersonnelImportApiResult;

  constructor(message: string, result: PersonnelImportApiResult) {
    super(message);
    this.name = 'PersonnelImportAbortedError';
    this.result = result;
  }
}

/** 操作者（登録・更新者）の ID を付与したリクエストヘッダーを作る */
function operatorHeaders(opUser?: string | null): Record<string, string> {
  return opUser ? { 'X-User-Id': opUser } : {};
}

/** 未登録（404）を表す Error（画面で「未登録」処理を行うため、システムエラーと区別する） */
export class PersonnelNotFoundError extends Error {
  constructor(message = '要員情報が見つかりません。') {
    super(message);
    this.name = 'PersonnelNotFoundError';
  }
}

/** システムエラー（500 系・DB 接続不可など）を表す Error */
export class PersonnelSystemError extends ApiError {
  constructor(message: string, code?: string, requestId?: string) {
    super({ kind: 'server', message, code, requestId });
    this.name = 'PersonnelSystemError';
  }
}

/**
 * 
 *   normalizeHttpError() で ApiError へ正規化（messageId / params を抽出）し、
 *   apiErrorMessage() で messages.ts の文言へ翻訳する。
 */
async function toRequestError(res: Response): Promise<Error> {
  const apiError = await normalizeHttpError(res);
  const message = apiErrorMessage(apiError);

  // 500 系 / DB 接続不可など → システムエラー（未登録と区別する）
  if (res.status >= 500 || apiError.code === 'SYSTEM_ERROR') {
    return new PersonnelSystemError(
      message,
      apiError.code,
      apiError.requestId,
    );
  }

  // 404 → 「未登録」（画面側で新規追加のフローに分岐する）
  if (res.status === 404) {
    return new PersonnelNotFoundError(message);
  }

  return new Error(message);
}

/** 共通リクエストヘルパー（エラー時はサーバーのメッセージを Error にして投げる） */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    // 通信到達前のエラー（プロキシ・ネットワーク断など）
    throw new PersonnelSystemError(
      'サーバーに接続できませんでした。通信環境を確認してください。',
      'NETWORK_ERROR',
    );
  }
  if (!res.ok) {
    throw await toRequestError(res);
  }
  return (await res.json()) as T;
}

/**
 * 社員番号で要員情報を取得する（GET /api/kadou/personnel/{employeeNo}/{year}）。
 * 該当なしの場合は 404 → PersonnelNotFoundError を投げる。
 * DB 接続不可などのサーバーエラーは PersonnelSystemError を投げる（未登録とは区別する）。
 */
export async function fetchPersonnelInfo(
  employeeNo: string,
  year: number,
): Promise<PersonnelInfoResponse> {
  // NOTE: 404 は toRequestError() が PersonnelNotFoundError へ変換済み。
  //       文言変更に影響されないよう、文字列判定は行わない。
  return request<PersonnelInfoResponse>(
    `/api/kadou/personnel/${encodeURIComponent(employeeNo)}/${year}`,
  );
}

/** 現在の登録要員数を取得する（GET /api/kadou/personnel/count/{year}） */
export async function fetchPersonnelCount(year: number): Promise<number> {
  const data = await request<{ year: string; count: number }>(
    `/api/kadou/personnel/count/${year}`,
  );
  return data.count;
}

/**
 * 社員情報を一括取り込みする（POST /api/kadou/personnel/import/{year}）。
 *
 * 年度 + 社員番号で既存を判定し、存在すれば更新・なければ追加する。
 *
 * @param dryRun    true = 検証のみ（DB へ書き込まない）
 * @param overwrite true = 既存データの重複を上書きする
 *
 * ファイル全体が中止された場合（409）は PersonnelImportAbortedError を投げる。
 */
export async function importPersonnelRows(
  year: number,
  rows: PersonnelImportApiRow[],
  options: { dryRun?: boolean; overwrite?: boolean; opUser?: string | null } = {},
): Promise<PersonnelImportApiResult> {
  const body = JSON.stringify({
    rows,
    dryRun: options.dryRun ?? false,
    overwrite: options.overwrite ?? false,
  });

  const res = await fetch(`/api/kadou/personnel/import/${year}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...operatorHeaders(options.opUser),
    },
    body,
  });

  if (res.ok) {
    return (await res.json()) as PersonnelImportApiResult;
  }

  // 409：ファイル全体を中止（1件も反映していない）
  let detail: unknown = null;
  try {
    detail = await res.json();
  } catch {
    detail = null;
  }

  const d = detail as
    | { detail?: { message?: string; result?: PersonnelImportApiResult } }
    | null;
  const abortResult = d?.detail?.result;
  if (res.status === 409 && abortResult) {
    throw new PersonnelImportAbortedError(
      d?.detail?.message ?? '取り込みを中止しました。',
      abortResult,
    );
  }

  throw new Error(
    typeof d?.detail === 'string'
      ? d.detail
      : '一括読み込みに失敗しました。',
  );
}

/** 要員の保存ペイロード（所属は部門ID） */
export interface PersonnelSavePayload {
  name: string;
  departmentId?: string;
  role: string;
  leavePlan?: string | null;
}

/**
 * 要員を保存する（PUT /api/kadou/personnel/{employeeNo}/{year}）。
 * 年度 + 社員番号で既存を判定し、存在すれば更新・なければ追加する。
 */
export async function savePersonnel(
  employeeNo: string,
  year: number,
  data: PersonnelSavePayload,
  opUser?: string | null,
): Promise<PersonnelInfoResponse> {
  return request<PersonnelInfoResponse>(
    `/api/kadou/personnel/${encodeURIComponent(employeeNo)}/${year}`,
    {
      method: 'PUT',
      headers: operatorHeaders(opUser),
      body: JSON.stringify(data),
    },
  );
}

/**
 * 指定年度 + 社員番号の週割当件数を取得する
 * （GET /api/kadou/personnel/{employeeNo}/{year}/weekly-count）
 *
 * 要員削除の確認ダイアログで「週割当も削除するか」を判断するために使う。
 */
export async function fetchWeeklyCount(
  employeeNo: string,
  year: number,
): Promise<number> {
  const data = await request<{ year: string; employeeNo: string; count: number }>(
    `/api/kadou/personnel/${encodeURIComponent(employeeNo)}/${year}/weekly-count`,
  );
  return data.count;
}

/** 要員削除の結果 */
export interface PersonnelDeleteResponse {
  code: number;
  /** 実際に削除した週割当件数（deleteWeekly=false なら 0） */
  deletedWeeklyCount: number;
}

/**
 * 要員を削除する（DELETE /api/kadou/personnel/{employeeNo}/{year}）。
 *
 * @param deleteWeekly true のとき、jn_weekly_assignment_table の
 *                     当該年度・当該社員番号の週割当も同時に削除する
 */
export async function deletePersonnel(
  employeeNo: string,
  year: number,
  deleteWeekly = false,
): Promise<PersonnelDeleteResponse> {
  const query = deleteWeekly ? '?deleteWeekly=true' : '';
  return request<PersonnelDeleteResponse>(
    `/api/kadou/personnel/${encodeURIComponent(employeeNo)}/${year}${query}`,
    { method: 'DELETE' },
  );
}