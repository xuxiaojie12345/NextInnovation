import type { AuthUser } from '../types/user';
import { YAKUSHOKU_ROLE_MAP, DEFAULT_ROLE } from '../constants/options';
import { httpRequest } from '../utils/http';

/** バックエンドのログインAPIレスポンス */
export interface LoginResponse {
  userId: string;
  name: string;
  yakushokukubun: string;
  /** 担当部門ID（年度に依存しない） */
  departmentId?: string | number | null;
  department: string | null;
  token: string;
}

/**
 * ログインAPIを呼び出す（POST /api/auth/loginAPI）。
 * 成功時は AuthUser を返し、失敗時は ApiError を投げる。
 * ・認証失敗（401）は kind=auth
 * ・タイムアウト / ネットワーク断は取得できない（通信異常は kind=timeout/offline/network）
 */
export async function loginApi(
  userId: string,
  password: string,
): Promise<AuthUser> {
  const data = await httpRequest<LoginResponse>('/api/auth/loginAPI', {
    method: 'POST',
    body: { userId, password },
    timeoutMs: 10_000,
  });
  const { role, roleLabel } =
    YAKUSHOKU_ROLE_MAP[data.yakushokukubun] ?? DEFAULT_ROLE;
  return {
    userId: data.userId,
    password: '',
    name: data.name,
    role,
    roleLabel,
    departmentId:
      data.departmentId === null || data.departmentId === undefined
        ? undefined
        : String(data.departmentId),
  };
}