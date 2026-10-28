/**
 * 部門管理 画面のバックエンド API 呼び出し
 *
 * 対象 API: POST /api/kadou/departments/{year}
 * 画面のフォーム値（種別・名称・拠点・年度）をバックエンドの契約に変換して送信し、
 * レスポンスを画面側の Department 型に変換して返す。
 */
import axios, { AxiosError } from 'axios';
import {
  Department,
  DepartmentKind,
  DepartmentLocation,
} from '../WorkStatus/types';

/**
 * API クライアント。
 * 開発時は CRA の proxy（package.json の proxy）経由で同一オリジンに送るため baseURL は空。
 * 本番など別オリジンに送る場合は REACT_APP_API_BASE_URL で上書きする。
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL ?? '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** 画面フォームから受け取る値 */
export interface DepartmentFormValues {
  /** 画面上で選択されている年度 */
  year: number;
  /** 種別（部門 / 協力会社） */
  kind: DepartmentKind;
  /** 名称（必須） */
  name: string;
  /** 拠点（必須） */
  location: DepartmentLocation;
}

/** 部門登録 API のリクエストボディ（バックエンドの DepartmentCreate に対応） */
export interface DepartmentCreateRequest {
  /** 年度ID（パスパラメータの year と一致させる） */
  yearid: string;
  /** 部門名 */
  department_name: string;
  /** 拠点 */
  location: DepartmentLocation;
  /** 種別 */
  kind: DepartmentKind;
}

/** 部門登録 API のレスポンス（バックエンドの DepartmentOut に対応） */
export interface DepartmentResponse {
  department_id: string;
  year_id: string;
  department_name: string;
  location: DepartmentLocation;
  kind: DepartmentKind;
  register_datetime?: string | null;
  register_user?: string | null;
  update_datetime?: string | null;
  update_user?: string | null;
}

/** バックエンドの名称桁数上限（DB の department_name = varchar(20)） */
const NAME_MAX_LENGTH = 20;

/**
 * フォーム値を API のリクエストボディへ変換する。
 * 名称は前後空白を除去し、バックエンドの桁数上限を超える場合は例外にする。
 */
export const buildCreateRequest = (
  values: DepartmentFormValues,
): DepartmentCreateRequest => {
  const name = values.name.trim();
  if (!name) {
    throw new Error('名称を入力してください。');
  }
  if (name.length > NAME_MAX_LENGTH) {
    throw new Error(`名称は${NAME_MAX_LENGTH}文字以内で入力してください。`);
  }
  return {
    // パスパラメータと body の yearid は一致必須のため、同じ値から生成する
    yearid: String(values.year),
    department_name: name,
    location: values.location,
    kind: values.kind,
  };
};

/** API レスポンスを画面の Department 型へ変換するのに必要な項目（登録 / 一覧で共通） */
type DepartmentFields = Pick<
  DepartmentResponse,
  'department_id' | 'department_name' | 'location' | 'kind'
>;

/** 部門一覧取得 API のレスポンス（バックエンドの DepartmentQueryOut に対応） */
export type DepartmentQueryResponse = DepartmentFields;

/** API レスポンスを画面の Department 型へ変換する */
export const toDepartment = (response: DepartmentFields): Department => ({
  departmentId: response.department_id,
  name: response.department_name,
  location: response.location,
  kind: response.kind,
});

/** エラーから表示用のメッセージを取り出す（FastAPI の detail 形式に対応） */
const extractErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallbackMessage;
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
 * 年度に紐づく部門一覧を取得する（画面の初期表示時に使用）。
 * @param year 画面上で選択されている年度
 * @returns 該当年度の部門一覧（協力会社を含む）
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const fetchDepartments = async (
  year: number,
): Promise<Department[]> => {
  try {
    const { data } = await api.get<DepartmentQueryResponse[]>(
      `/api/kadou/departments/${encodeURIComponent(String(year))}`,
    );
    return data.map(toDepartment);
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, '部門一覧の取得に失敗しました。'),
    );
  }
};

/**
 * 部門を新規登録する（新規登録モード時のみ使用）。
 * @param values 画面のフォーム値（年度・種別・名称・拠点）
 * @returns 登録された部門（バックエンドが採番した departmentId を含む）
 * @throws 入力不正・通信失敗・API エラー時にメッセージ付きの Error
 */
export const registerDepartment = async (
  values: DepartmentFormValues,
): Promise<Department> => {
  const year = String(values.year);
  try {
    const { data } = await api.post<DepartmentResponse>(
      `/api/kadou/departments/${encodeURIComponent(year)}`,
      buildCreateRequest(values),
    );
    return toDepartment(data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, '登録に失敗しました。'));
  }
};

/** 部門更新時に受け取る値（フォーム値 + 修正対象の部門ID） */
export interface DepartmentUpdateValues extends DepartmentFormValues {
  /** 修正対象の部門ID（パスパラメータの id） */
  departmentId: string;
}

/**
 * 部門を更新する（修正モード時のみ使用）。
 * @param values フォーム値と修正対象の部門ID
 * @returns 更新後の部門
 * @throws 入力不正・通信失敗・API エラー時にメッセージ付きの Error
 */
export const updateDepartment = async (
  values: DepartmentUpdateValues,
): Promise<Department> => {
  const year = String(values.year);
  try {
    const { data } = await api.put<DepartmentResponse>(
      `/api/kadou/departments/${encodeURIComponent(
        year,
      )}/${encodeURIComponent(values.departmentId)}`,
      buildCreateRequest(values),
    );
    return toDepartment(data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, '更新に失敗しました。'));
  }
};

/**
 * 部門を削除する（一覧の「削除」操作で使用）。
 * @param year 年度ID
 * @param departmentId 削除対象の部門ID
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const deleteDepartment = async (
  year: number,
  departmentId: string,
): Promise<void> => {
  try {
    await api.delete(
      `/api/kadou/departments/${encodeURIComponent(
        String(year),
      )}/${encodeURIComponent(departmentId)}`,
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, '削除に失敗しました。'));
  }
};
