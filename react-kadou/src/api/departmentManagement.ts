import type { Department } from '../WorkStatus/types';

/** バックエンド API の共通リクエストヘルパー */
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

/**
 * 操作者（登録・更新者）の ID を付与したリクエストヘッダーを作る。
 * バックエンドは register_user / update_user にこの値を書き込む。
 */
function operatorHeaders(opUser?: string | null): Record<string, string> {
  return opUser ? { 'X-User-Id': opUser } : {};
}

/** 部門の追加 / 更新ペイロード（departmentId はバックエンド側で採番・特定する） */
export type DepartmentPayload = Pick<Department, 'name' | 'location'> & {
  kind?: Department['kind'];
};

/** 部門一覧を取得する（GET /api/kadou/departments/{year}） */
export async function fetchDepartments(year: number): Promise<Department[]> {
  const list = await request<Department[]>(`/api/kadou/departments/${year}`);
  return list.map((d) => ({
    ...d,
    kind: d.kind ?? 'dept',
  }));
}

/** 部門を追加する（POST /api/kadou/departments/{year}）。作成された部門を返す */
export async function addDepartment(
  year: number,
  data: DepartmentPayload,
  opUser?: string | null,
): Promise<Department> {
  const d = await request<Department>(`/api/kadou/departments/${year}`, {
    method: 'POST',
    headers: operatorHeaders(opUser),
    body: JSON.stringify(data),
  });
  return { ...d, kind: d.kind ?? 'dept' };
}

/** 部門を更新する（PUT /api/kadou/departments/{year}/{id}）。更新後の部門を返す */
export async function updateDepartment(
  year: number,
  departmentId: string,
  data: DepartmentPayload,
  opUser?: string | null,
): Promise<Department> {
  const d = await request<Department>(
    `/api/kadou/departments/${year}/${encodeURIComponent(departmentId)}`,
    {
      method: 'PUT',
      headers: operatorHeaders(opUser),
      body: JSON.stringify(data),
    },
  );
  return { ...d, kind: d.kind ?? 'dept' };
}

/** 部門を削除する（DELETE /api/kadou/departments/{year}/{id}） */
export async function deleteDepartment(
  year: number,
  departmentId: string,
): Promise<void> {
  await request<{ code: number }>(
    `/api/kadou/departments/${year}/${encodeURIComponent(departmentId)}`,
    { method: 'DELETE' },
  );
}