import type { AuthUser } from '../types/user';

/** バックエンドのログインAPIレスポンス */
export interface LoginResponse {
  userId: string;
  name: string;
  yakushokukubun: string;
  department: string | null;
  token: string;
}

/**
 * 役職区分（yakushokukubun）→ ロール・表示名の変換。
 * 個別のロール判定（部長／事業部長／管理者）はこのマップで行う。
 * ※jn_user_table の区分値：部長=0 / 管理者=1 / 事業部長=2 に合わせる。
 */
const YAKUSHOKU_ROLE_MAP: Record<string, { role: AuthUser['role']; roleLabel: string }> = {
  '0': { role: 'bucho', roleLabel: '部長' },
  '1': { role: 'admin', roleLabel: '管理者' },
  '2': { role: 'jigyo-bucho', roleLabel: '事業部長' },
};

const DEFAULT_ROLE = { role: 'bucho', roleLabel: '部長' };

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