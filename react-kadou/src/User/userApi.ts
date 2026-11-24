import {
  DEFAULT_ROLE,
  ROLE_TO_KUBUN,
  YAKUSHOKU_ROLE_MAP,
} from '../constants/options';
import type { AuthUser, UserRole } from '../data/userTypes';
import { apiFetch } from '../api/apiConnection';

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

/** バックエンドが返すユーザー（schemas/user.py の User に対応） */
interface UserResponse {
  userId: string;
  name: string;
  /** 役職区分コード（0=部長 / 1=管理者 / 2=事業部長） */
  role: string;
  /** バックエンドが role から生成する表示名 */
  roleLabel: string;
  departmentId?: string | null;
  password: string;
}

/** 追加・更新で送信する値 */
export interface UserSaveValues {
  userId: string;
  name: string;
  role: UserRole;
  /** 未設定（＝全部門）は undefined */
  departmentId?: string;
  password: string;
}

/** エラーから表示用のメッセージを取り出す（FastAPI の detail 形式に対応） */
const errorMessageOf = (body: unknown, status: number): string => {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item as { msg?: unknown }).msg)
      .filter((msg): msg is string => typeof msg === 'string' && msg !== '');
    if (messages.length > 0) {
      return messages.join(' / ');
    }
  }
  return `HTTP ${status}`;
};

/** ログインユーザーIDを X-User-Id ヘッダで送信する（register_user / update_user に保存される） */
const request = async <T>(
  path: string,
  opUserId: string,
  init?: RequestInit,
): Promise<T> => {
  let response: Response;
  try {
    response = await apiFetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': opUserId,
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('サーバーに接続できませんでした。');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    // 画面側で「サーバーエラー（5xx）」を判別できるようステータスを付与する
    const error = new Error(errorMessageOf(body, response.status)) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
};

/** 役職区分コードを画面のロール・表示名へ変換する（未知のコードは部長扱い） */
const toRole = (kubun: string): { role: UserRole; roleLabel: string } =>
  YAKUSHOKU_ROLE_MAP[kubun] ?? DEFAULT_ROLE;

const toAuthUser = (record: UserResponse): AuthUser => {
  const mapped = toRole(record.role);
  return {
    userId: record.userId,
    name: record.name,
    role: mapped.role,
    roleLabel: record.roleLabel || mapped.roleLabel,
    departmentId: record.departmentId ?? undefined,
    password: record.password,
  };
};

/**
 * ユーザー一覧を取得する。
 * @param opUserId 操作中のユーザーID（X-User-Id ヘッダ）
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const fetchUsers = async (opUserId: string): Promise<AuthUser[]> => {
  const records = await request<UserResponse[]>('/api/users/select', opUserId);
  return records.map(toAuthUser);
};

/**
 * ユーザーを追加する。
 * @param values 追加するユーザーの値
 * @param opUserId 操作中のユーザーID（register_user に保存される）
 * @returns 追加されたユーザー
 * @throws ユーザーID重複（409）・通信失敗・API エラー時にメッセージ付きの Error
 */
export const createUser = async (
  values: UserSaveValues,
  opUserId: string,
): Promise<AuthUser> => {
  const record = await request<UserResponse>('/api/users/insert', opUserId, {
    method: 'POST',
    body: JSON.stringify({
      userId: values.userId.trim(),
      name: values.name.trim(),
      role: ROLE_TO_KUBUN[values.role],
      departmentId: values.departmentId ?? null,
      password: values.password,
    }),
  });
  return toAuthUser(record);
};

/**
 * ユーザーを更新する（ユーザーIDは変更できない）。
 * @param userId 更新対象のユーザーID（パスパラメータ）
 * @param values 更新後の値
 * @param opUserId 操作中のユーザーID（update_user に保存される）
 * @returns 更新後のユーザー
 * @throws 対象なし（404）・通信失敗・API エラー時にメッセージ付きの Error
 */
export const updateUser = async (
  userId: string,
  values: Omit<UserSaveValues, 'userId'>,
  opUserId: string,
): Promise<AuthUser> => {
  const record = await request<UserResponse>(
    `/api/users/update/${encodeURIComponent(userId)}`,
    opUserId,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: values.name.trim(),
        role: ROLE_TO_KUBUN[values.role],
        departmentId: values.departmentId ?? null,
        password: values.password,
      }),
    },
  );
  return toAuthUser(record);
};

/**
 * ユーザーを削除する。
 * @param userId 削除対象のユーザーID
 * @param opUserId 操作中のユーザーID（X-User-Id ヘッダ）
 * @throws 対象なし（404）・通信失敗・API エラー時にメッセージ付きの Error
 */
export const deleteUser = async (
  userId: string,
  opUserId: string,
): Promise<void> => {
  await request<{ code: number }>(
    `/api/users/delete/${encodeURIComponent(userId)}`,
    opUserId,
    { method: 'DELETE' },
  );
};
