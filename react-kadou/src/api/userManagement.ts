import type { AuthUser, UserRole } from '../types/user';
import {
  DEFAULT_ROLE,
  YAKUSHOKU_ROLE_MAP,
  ROLE_TO_KUBUN,
} from '../constants/options';
import { httpRequest, SAVE_TIMEOUT_MS } from '../utils/http';

/** バックエンドのユーザーAPI レスポンス（role は役職区分コード '0'/'1'/'2'） */
interface UserDto {
  userId: string;
  name: string;
  role: string;
  roleLabel: string;
  departmentId: string | null;
  password: string;
}

/** 役職区分コード → AuthUser に変換する（未知の区分は部長扱い） */
function toAuthUser(dto: UserDto): AuthUser {
  const { role, roleLabel } = YAKUSHOKU_ROLE_MAP[dto.role] ?? DEFAULT_ROLE;
  return {
    userId: dto.userId,
    name: dto.name,
    role: role as UserRole,
    roleLabel,
    departmentId: dto.departmentId ?? undefined,
    password: dto.password,
  };
}

/** ユーザー API の共通リクエスト（部門 API と同様のタイムアウト / エラー正規化を適用） */
interface UserRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  opUser?: string | null;
  body?: unknown;
}

async function request<T>(url: string, opts: UserRequest = {}): Promise<T> {
  return httpRequest<T>(url, {
    method: opts.method ?? 'GET',
    body: opts.body,
    operatorId: opts.opUser,
    timeoutMs: SAVE_TIMEOUT_MS,
    retry: (opts.method ?? 'GET') === 'GET',
  });
}

/** 追加 / 更新ペイロード（roleLabel はバックエンドが role から生成するため送らない） */
export type UserPayload = Pick<AuthUser, 'name' | 'role'> & {
  departmentId?: string;
  password: string;
};

/** ユーザー一覧を取得する（GET /api/users/select） */
export async function fetchUsers(): Promise<AuthUser[]> {
  const list = await request<UserDto[]>('/api/users/select');
  return list.map(toAuthUser);
}

/** ユーザーを追加する（POST /api/users/insert）。作成されたユーザーを返す */
export async function addUser(
  data: UserPayload & { userId: string },
  opUser?: string | null,
): Promise<AuthUser> {
  const dto = await request<UserDto>('/api/users/insert', {
    method: 'POST',
    opUser,
    body: {
      userId: data.userId,
      name: data.name,
      role: ROLE_TO_KUBUN[data.role],
      departmentId: data.departmentId ?? null,
      password: data.password,
    },
  });
  return toAuthUser(dto);
}

/** ユーザーを更新する（PUT /api/users/update/{userId}）。更新後のユーザーを返す */
export async function updateUser(
  userId: string,
  data: UserPayload,
  opUser?: string | null,
): Promise<AuthUser> {
  const dto = await request<UserDto>(
    `/api/users/update/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      opUser,
      body: {
        name: data.name,
        role: ROLE_TO_KUBUN[data.role],
        departmentId: data.departmentId ?? null,
        password: data.password,
      },
    },
  );
  return toAuthUser(dto);
}

/** ユーザーを削除する（DELETE /api/users/delete/{userId}） */
export async function deleteUser(userId: string): Promise<void> {
  await request<{ code: number }>(
    `/api/users/delete/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
}