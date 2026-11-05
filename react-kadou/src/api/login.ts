import type { AuthUser } from '../types/user';
import { YAKUSHOKU_ROLE_MAP, DEFAULT_ROLE } from '../constants/options';

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
 * 成功時は AuthUser を返し、認証失敗時は Error を投げる。
 */
export async function loginApi(
  userId: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch('/api/auth/loginAPI', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });

  if (!res.ok) {
    let message = 'ユーザーIDまたはパスワードが正しくありません。';
    try {
      const data = await res.json();
      if (data && typeof data.detail === 'string') message = data.detail;
    } catch {
      // JSON でないレスポンスは既定メッセージを使う
    }
    throw new Error(message);
  }

  const data = (await res.json()) as LoginResponse;
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