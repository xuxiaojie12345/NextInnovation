/**
 * プロジェクト管理 画面のバックエンド API 呼び出し
 *
 * 対象 API: GET /api/kadou/projects/{year}
 * 該年度のプロジェクト一覧を取得し、画面側の Project 型へ変換して返す。
 */
import axios, { AxiosError } from 'axios';
import { Project } from '../WorkStatus/types';

/**
 * API クライアント。
 * 開発時はバックエンド（FastAPI）の既定アドレスへ直接アクセスする。
 * 別オリジン / 別ポートに送る場合は REACT_APP_API_BASE_URL で上書きする。
 */
const api = axios.create({
  baseURL: (
    process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'
  ).replace(/\/+$/, ''),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** プロジェクト一覧取得 API のレスポンス（バックエンドの ProjectQueryOut に対応） */
export interface ProjectQueryResponse {
  /** システム項目ID（バックエンドでは数値だが文字列で返る） */
  projectId: string;
  /** 項目ID */
  projectCode: string | null;
  /** 顧客 */
  customer: string;
  /** 案件名 */
  caseName: string;
  /** チーム */
  team: string | null;
  /** Subチーム */
  subTeam: string | null;
  /** 略称（バックエンドで組み立て済み） */
  abbr: string;
  /** 所属部門ID */
  departmentId: string;
  /** 項目名（画面の Project名称） */
  project_name: string | null;
}

/**
 * API レスポンスを画面の Project 型へ変換する。
 * 有効稼働 / 教育かどうか はテーブルに列がないため既定値（有効 / 非教育）にする。
 */
export const toProject = (response: ProjectQueryResponse): Project => ({
  projectId: response.projectId,
  projectCode: response.projectCode ?? '',
  customer: response.customer,
  caseName: response.caseName,
  team: response.team ?? '',
  subTeam: response.subTeam ?? '',
  abbr: response.abbr,
  departmentId: response.departmentId,
  name: response.project_name ?? '',
  validFlg: true,
  educationFlg: false,
});

/** エラーから表示用のメッセージを取り出す（FastAPI の detail 形式に対応） */
const extractErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : 'プロジェクト一覧の取得に失敗しました。';
  }
  const axiosError = error as AxiosError;
  // 通信自体が成立しなかった場合（サーバー停止・タイムアウトなど）
  if (!axiosError.response) {
    return 'サーバーに接続できませんでした。';
  }
  const detail = (axiosError.response.data as { detail?: unknown } | undefined)
    ?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        const msg = (item as { msg?: unknown }).msg;
        return typeof msg === 'string' ? msg : '';
      })
      .filter((msg) => msg.length > 0);
    if (messages.length > 0) {
      return messages.join(' / ');
    }
  }
  return `HTTP ${axiosError.response.status}`;
};

/**
 * 年度に紐づくプロジェクト一覧を取得する（画面の初期表示時に使用）。
 * @param year 画面上で選択されている年度
 * @returns 該当年度のプロジェクト一覧
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const fetchProjects = async (year: number): Promise<Project[]> => {
  try {
    const { data } = await api.get<ProjectQueryResponse[]>(
      `/api/kadou/projects/${encodeURIComponent(String(year))}`,
    );
    return data.map(toProject);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/** プロジェクト登録時に画面フォームから受け取る値 */
export interface ProjectCreateValues {
  /** 項目ID（任意） */
  projectCode: string;
  /** 顧客（必須） */
  customer: string;
  /** 案件名（必須） */
  caseName: string;
  /** チーム（任意） */
  team: string;
  /** Subチーム（任意） */
  subTeam: string;
  /** 所属部門ID（必須） */
  departmentId: string;
  /** 項目名（任意） */
  name: string;
}

/** プロジェクト登録 API のリクエストボディ（バックエンドの ProjectCreate に対応） */
export interface ProjectCreateRequest {
  projectCode: string;
  customer: string;
  caseName: string;
  team: string | null;
  subTeam: string | null;
  departmentId: string;
  project_name: string;
}

/** フォーム値を API のリクエストボディへ変換する（空欄の任意項目は null にする） */
export const buildCreateRequest = (
  values: ProjectCreateValues,
): ProjectCreateRequest => ({
  projectCode: values.projectCode.trim(),
  customer: values.customer.trim(),
  caseName: values.caseName.trim(),
  team: values.team.trim() || null,
  subTeam: values.subTeam.trim() || null,
  departmentId: values.departmentId,
  project_name: values.name.trim(),
});

/**
 * プロジェクトを新規登録する（新規登録モード時のみ使用）。
 * @param year 画面上で選択されている年度
 * @param values 画面フォームの入力値
 * @returns 登録されたプロジェクト（バックエンドが採番したシステム項目IDを含む）
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const createProject = async (
  year: number,
  values: ProjectCreateValues,
): Promise<ProjectQueryResponse> => {
  try {
    const { data } = await api.post<ProjectQueryResponse>(
      `/api/kadou/projects/${encodeURIComponent(String(year))}`,
      buildCreateRequest(values),
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * プロジェクトを更新する（修正モード時のみ使用）。
 * @param year 画面上で選択されている年度
 * @param key システム項目ID（画面の projectId）
 * @param values 画面フォームの入力値
 * @returns 更新後のプロジェクト
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const updateProject = async (
  year: number,
  key: string,
  values: ProjectCreateValues,
): Promise<ProjectQueryResponse> => {
  try {
    const { data } = await api.put<ProjectQueryResponse>(
      `/api/kadou/projects/${encodeURIComponent(String(year))}/${encodeURIComponent(
        key,
      )}`,
      buildCreateRequest(values),
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/** 一括取込 API に送る 1 行（画面の ProjectImportRow と同形） */
export interface ProjectImportRequestRow {
  customer: string;
  caseName: string;
  team: string;
  subTeam: string;
  department: string;
  projectCode: string;
  name: string;
}

/** 一括取込 API のレスポンス（バックエンドの ProjectImportResult に対応） */
export interface ProjectImportApiResult {
  /** 0 = 正常終了 */
  code: number;
  /** 取込件数 */
  imported: number;
  /** スキップ件数 */
  skipped: number;
  /** スキップ理由 */
  warnings: { row: number; message: string }[];
}

/**
 * プロジェクトを一括取込する（一覧の「一括読み込む」で使用）。
 * 所属部門は部門名で送り、department_id の解決はバックエンドで行う。
 * @param year 画面上で選択されている年度
 * @param rows ファイル解析済みのデータ行
 * @returns 取込結果（取込件数・スキップ件数・警告）
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const importProjects = async (
  year: number,
  rows: ProjectImportRequestRow[],
): Promise<ProjectImportApiResult> => {
  try {
    const { data } = await api.post<ProjectImportApiResult>(
      `/api/kadou/projects/import/${encodeURIComponent(String(year))}`,
      rows,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

/**
 * プロジェクトを削除する（一覧の「削除」操作で使用）。
 * @param year 年度ID
 * @param key システム項目ID（画面の projectId）
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const deleteProject = async (
  year: number,
  key: string,
): Promise<void> => {
  try {
    await api.delete(
      `/api/kadou/projects/${encodeURIComponent(String(year))}/${encodeURIComponent(
        key,
      )}`,
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
