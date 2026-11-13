/**
 * プロジェクト管理画面（ProjectManagementScreen）のバックエンド API クライアント
 *
 * API_ID  : ProjectManagementScreen
 * 参照先  : api_kadou/app/api/project.py
 *   GET    /api/kadou/projects/{year}            … プロジェクト一覧
 *   POST   /api/kadou/projects/{year}            … 追加
 *   PUT    /api/kadou/projects/{year}/{key}      … 更新
 *   DELETE /api/kadou/projects/{year}/{key}      … 削除
 *   POST   /api/kadou/projects/import/{year}     … 一括取り込み
 *
 * NOTE: 開発時は src/setupProxy.js により /api が http://127.0.0.1:8000 へ転送される。
 *
 * 通信はログイン画面と同じく共通 HTTP クライアント（utils/http の httpRequest）を使う。
 * ・タイムアウト / エラー正規化（ApiError）は httpRequest 側で一括して行う
 * ・操作者 ID は httpRequest の operatorId（X-User-Id ヘッダー）で渡す
 * ・GET は 5xx / タイムアウト時に 1 回自動再試行する
 */

import { httpRequest, SAVE_TIMEOUT_MS } from '../utils/http';
import { isApiError } from '../utils/ApiError';
import { apiErrorMessage } from '../utils/errorMessage';

/** プロジェクト（1件） */
export interface ProjectApiInfo {
  /** システム項目ID（主キーの一部） */
  projectId: string | null;
  /** 項目ID（任意入力。主キーではない） */
  projectCode: string | null;
  customer: string;
  caseName: string;
  team: string | null;
  subTeam: string | null;
  /** 略称（サーバー側で自動生成） */
  abbr: string | null;
  /** 所属部門ID */
  departmentId: string | null;
  /** Project名称 */
  project_name: string | null;
  /** 有効稼働（true = 有効） */
  validFlg?: boolean | null;
  /** 教育かどうか（true = 教育） */
  educationFlg?: boolean | null;
}

/** プロジェクトの登録・更新ペイロード（所属は部門ID） */
export interface ProjectSavePayload {
  customer: string;
  caseName: string;
  team?: string;
  subTeam?: string;
  departmentId?: string;
  /** 項目ID（任意入力） */
  projectCode?: string;
  /** Project名称 */
  project_name?: string;
  /** 有効稼働（true = 有効） */
  validFlg?: boolean;
  /** 教育かどうか（true = 教育） */
  educationFlg?: boolean;
}

/** 一括取り込みの1件分 */
export interface ProjectImportApiRow {
  customer: string;
  caseName: string;
  team: string;
  subTeam: string;
  /** 所属部門名（部門マスタの名称） */
  department: string;
  /** 項目ID */
  projectCode: string;
  /** Project名称 */
  project_name: string;
  /** ファイル上の行番号（警告メッセージに含める） */
  line?: number;
}

/** 一括取り込みの結果 */
export interface ProjectImportApiResult {
  added: number;
  skipped: number;
  /** 既存データと重複した件数（略称 / 項目ID / Project名称 のいずれか一致） */
  duplicated?: number;
  /** 既存データと重複した行のファイル上での行番号 */
  duplicatedLines?: number[];
  /** 重複した行ごとの理由（行番号 → ['略称','項目ID','Project名称'] の部分集合） */
  duplicatedReasons?: Record<number, string[]>;
  /** 全項目（顧客/案件/チーム/Subチーム/所属部門/項目ID/Project名称）が完全一致した行番号（強制スキップ） */
  fullDuplicateLines?: number[];
  /**
   * 略称 / 項目ID / Project名称 のいずれかだけが一致した行番号（部分重複）。
   * 既定は取り込み対象で、ユーザーが外した行だけ取り込まない。
   */
  partialDuplicateLines?: number[];
  /** 重複せず、そのまま追加できる行番号 */
  addableLines?: number[];
  /** ファイル全体を中止したか */
  aborted: boolean;
  /** ファイル全体を中止した理由 */
  abortReason: string | null;
  warnings: string[];
}

/**
 * 一括取り込みが中止された場合に投げるエラー（409）。
 * 画面はプレビューを復元して中止理由を表示するため、result 全体を保持する。
 */
export class ProjectImportAbortedError extends Error {
  readonly result: ProjectImportApiResult;

  constructor(message: string, result: ProjectImportApiResult) {
    super(message);
    this.name = 'ProjectImportAbortedError';
    this.result = result;
  }
}

/**
 * プロジェクト API の共通リクエスト（タイムアウト / エラー正規化は httpRequest が行う）
 */
interface ProjectRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 操作者 ID（更新者記録用の X-User-Id ヘッダー） */
  opUser?: string | null;
  body?: unknown;
}

async function request<T>(
  url: string,
  opts: ProjectRequest = {},
): Promise<T> {
  const method = opts.method ?? 'GET';
  return httpRequest<T>(url, {
    method,
    body: opts.body,
    operatorId: opts.opUser,
    timeoutMs: SAVE_TIMEOUT_MS,
    // GET のみ 5xx / タイムアウト時に 1 回再試行する（ログイン画面の方針に合わせる）
    retry: method === 'GET',
  });
}

/** 指定年度のプロジェクト一覧を取得する（GET /api/kadou/projects/{year}） */
export async function fetchProjects(
  year: number,
): Promise<ProjectApiInfo[]> {
  return request<ProjectApiInfo[]>(`/api/kadou/projects/${year}`);
}

/** プロジェクトを追加する（POST /api/kadou/projects/{year}） */
export async function createProject(
  year: number,
  data: ProjectSavePayload,
  opUser?: string | null,
): Promise<ProjectApiInfo> {
  return request<ProjectApiInfo>(`/api/kadou/projects/${year}`, {
    method: 'POST',
    opUser,
    body: data,
  });
}

/**
 * プロジェクトを更新する（PUT /api/kadou/projects/{year}/{key}）。
 * key はシステム項目ID。
 */
export async function updateProject(
  year: number,
  key: string,
  data: ProjectSavePayload,
  opUser?: string | null,
): Promise<ProjectApiInfo> {
  return request<ProjectApiInfo>(
    `/api/kadou/projects/${year}/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      opUser,
      body: data,
    },
  );
}

/**
 * プロジェクトを削除する（DELETE /api/kadou/projects/{year}/{key}）。
 * key はシステム項目ID。
 */
export async function deleteProject(
  year: number,
  key: string,
): Promise<void> {
  await request<{ code: number }>(
    `/api/kadou/projects/${year}/${encodeURIComponent(key)}`,
    { method: 'DELETE' },
  );
}

/**
 * プロジェクト情報を一括取り込みする（POST /api/kadou/projects/import/{year}）。
 *
 * @param dryRun true = 検証のみ（DB へ書き込まない）
 *
 * ファイル全体が中止された場合（409）は ProjectImportAbortedError を投げる
 * （画面はプレビューを復元して中止理由を表示する）。
 */
export async function importProjectRows(
  year: number,
  rows: ProjectImportApiRow[],
  options: {
    dryRun?: boolean;
    opUser?: string | null;
    /** ユーザーが「取り込まない」を選んだ行番号（部分重複行のみ有効） */
    skipLines?: number[];
  } = {},
): Promise<ProjectImportApiResult> {
  try {
    return await request<ProjectImportApiResult>(
      `/api/kadou/projects/import/${year}`,
      {
        method: 'POST',
        opUser: options.opUser,
        body: {
          rows,
          dryRun: options.dryRun ?? false,
          skipLines: options.skipLines ?? [],
        },
      },
    );
  } catch (e) {
    // 409：ファイル全体を中止（1件も反映していない）
    if (isApiError(e) && e.status === 409) {
      const result = extractAbortResult(e.detail);
      if (result) {
        throw new ProjectImportAbortedError(apiErrorMessage(e), result);
      }
    }
    throw e;
  }
}

/**
 * 中止レスポンス（409）の detail から取り込み結果を取り出す。
 * バックエンドは { code, message, params, detail, result } の形で返すため、
 * detail.result を探す（params に中止理由が入る）。
 */
function extractAbortResult(
  detail: unknown,
): ProjectImportApiResult | null {
  if (typeof detail !== 'object' || detail === null) return null;
  const result = (detail as Record<string, unknown>).result;
  if (typeof result !== 'object' || result === null) return null;
  return result as ProjectImportApiResult;
}