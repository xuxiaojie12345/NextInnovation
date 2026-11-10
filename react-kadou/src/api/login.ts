import type { AuthUser } from '../types/user';
import { YAKUSHOKU_ROLE_MAP, DEFAULT_ROLE } from '../constants/options';
import { t } from '../constants/messages';
import { httpRequest } from '../utils/http';
import { isApiError } from '../utils/ApiError';

/** バックエンドのログインAPIレスポンス */
export interface LoginResponse {
  userId: string;
  name: string;
  yakushokukubun: string;
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
    departmentId: data.department ?? undefined,
  };
}

/** ログイン失敗時のメッセージを返す。
 * ユーザー不存在などの DB 関連判断は后端で行い、后端は business code を返す。
 * 前端は code で文案を引く（E_KADOU_001）。通信異常時は ApiError の message をそのまま使う。
 */
export function loginErrorMessage(e: unknown): string {
  if (isApiError(e) && e.code) {
    // 后端から返った business code で定数を引く（未定義 code は t() が汎用でフォールバック）
    return t(e.code);
  }
  return e instanceof Error && e.message ? e.message : '';
}