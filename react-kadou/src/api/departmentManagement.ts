import type { Department } from '../WorkStatus/types';
import { httpRequest, SAVE_TIMEOUT_MS } from '../utils/http';

/** 部門 API の共通リクエスト（設計案 4.4 のタイムアウト / エラー正規化を適用） */
interface DeptRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  opUser?: string | null;
  body?: unknown;
  /** GET の自動再試行を有効にするか（既定 false） */
  retry?: boolean;
}

async function request<T>(url: string, opts: DeptRequest = {}): Promise<T> {
  return httpRequest<T>(url, {
    method: opts.method ?? 'GET',
    body: opts.body,
    operatorId: opts.opUser,
    timeoutMs: SAVE_TIMEOUT_MS,
    retry: (opts.method ?? 'GET') === 'GET',
  });
}

/** 部門の追加 / 更新ペイロード（departmentId はバックエンド側で採番・特定する） */
export type DepartmentPayload = Pick<Department, 'name' | 'location'> & {
  alisa?: Department['alisa'];
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
    opUser,
    body: data,
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
      opUser,
      body: data,
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