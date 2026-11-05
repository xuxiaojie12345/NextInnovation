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
 */

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
    headers: operatorHeaders(opUser),
    body: JSON.stringify(data),
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
      headers: operatorHeaders(opUser),
      body: JSON.stringify(data),
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
  return request<ProjectImportApiResult>(
    `/api/kadou/projects/import/${year}`,
    {
      method: 'POST',
      headers: operatorHeaders(options.opUser),
      body: JSON.stringify({
        rows,
        dryRun: options.dryRun ?? false,
        skipLines: options.skipLines ?? [],
      }),
    },
  );
}
