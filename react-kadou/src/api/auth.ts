import type { AuthUser } from '../data/mockUsers';

/** バックエンドのログインAPIレスポンス */
export interface LoginResponse {
  user_id: string;
  name: string;
  role: AuthUser['role'];
  role_label: string;
  department: string | null;
}

/**
 * ログインAPIを呼び出す（POST /api/v1/login）。
 * 成功時は AuthUser を返し、認証失敗時は Error を投げる。
 */
export async function loginApi(
  userId: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch('/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, password }),
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
  return {
    userId: data.user_id,
    password: '',
    name: data.name,
    role: data.role,
    roleLabel: data.role_label,
    departmentId: data.department ?? undefined,
  };
}
