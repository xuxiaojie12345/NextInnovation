/**
 * 休日設置 画面のバックエンド API 呼び出し
 *
 * 対象 API:
 * - GET  /api/holidays?year=YYYY  年度内の休日一覧
 * - POST /api/holidays?year=YYYY  休日登録（同一日付は 409）
 */
import { Holiday, HolidayKind } from '../data/yearStore';

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/** バックエンドが返す休日 1 件 */
export interface HolidayRecord {
  holidayId: string;
  /** 'YYYY-MM-DD' */
  date: string;
  name: string;
  kind: HolidayKind;
}

/** HTTP ステータスを保持する API エラー（409 = 同一日付の登録済み） */
export class HolidayApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HolidayApiError';
    this.status = status;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      ...init,
    });
  } catch {
    throw new HolidayApiError('サーバーに接続できませんでした。', 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.detail === 'string'
        ? body.detail
        : `HTTP ${response.status}`;
    throw new HolidayApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
};

const toHoliday = (record: HolidayRecord): Holiday => ({
  id: `db-${record.holidayId}`,
  date: record.date,
  name: record.name,
  kind: record.kind,
});

/** 年度内の休日一覧を取得する */
export const loadHolidays = async (year: number): Promise<Holiday[]> => {
  const response = await request<ApiResponse<HolidayRecord[]>>(
    `/api/holidays?year=${encodeURIComponent(String(year))}`,
  );
  return response.data.map(toHoliday);
};

/** 休日を登録する（同一日付が既にある場合は status=409 のエラー） */
export const addHoliday = async (
  year: number,
  values: { date: string; name: string; kind: HolidayKind },
): Promise<Holiday> => {
  const response = await request<ApiResponse<HolidayRecord>>(
    `/api/holidays?year=${encodeURIComponent(String(year))}`,
    {
      method: 'POST',
      body: JSON.stringify(values),
    },
  );
  return toHoliday(response.data);
};

/** 休日を更新する（日付重複は status=409、対象なしは status=404） */
export const updateHoliday = async (
  year: number,
  holidayId: string,
  values: { date: string; name: string; kind: HolidayKind },
): Promise<Holiday> => {
  const response = await request<ApiResponse<HolidayRecord>>(
    `/api/holidays/${encodeURIComponent(
      holidayId,
    )}?year=${encodeURIComponent(String(year))}`,
    {
      method: 'PUT',
      body: JSON.stringify(values),
    },
  );
  return toHoliday(response.data);
};

/** 休日を削除する（対象なしは status=404） */
export const deleteHoliday = async (
  year: number,
  holidayId: string,
): Promise<void> => {
  await request<ApiResponse<null>>(
    `/api/holidays/${encodeURIComponent(
      holidayId,
    )}?year=${encodeURIComponent(String(year))}`,
    { method: 'DELETE' },
  );
};
