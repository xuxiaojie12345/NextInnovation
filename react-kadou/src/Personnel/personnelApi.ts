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

/** 共通リクエストヘルパー（エラー時は detail を Error にして投げる） */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = 'サーバーエラーが発生しました。';
    try {
      const data = await res.json();
      if (data && typeof data.detail === 'string') detail = data.detail;
    } catch {
      // JSON でないレスポンスは既定メッセージを使う
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

/**
 * 社員番号で要員情報を取得する（GET /api/kadou/personnel/{employeeNo}/{year}）。
 * 該当なしの場合は 404 → Error('…見つかりません。') を投げる。
 */
export async function fetchPersonnelInfo(
  employeeNo: string,
  year: number,
): Promise<PersonnelInfoResponse> {
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

/** 要員を削除する（DELETE /api/kadou/personnel/{employeeNo}/{year}） */
export async function deletePersonnel(
  employeeNo: string,
  year: number,
): Promise<void> {
  await request<{ code: number }>(
    `/api/kadou/personnel/${encodeURIComponent(employeeNo)}/${year}`,
    { method: 'DELETE' },
  );
}
