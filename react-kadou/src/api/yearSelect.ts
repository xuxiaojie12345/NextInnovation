import { httpRequest } from '../utils/http';

/** バックエンドの年度概要APIレスポンス（1年度分）（年度選択画面用） */
export interface YearSelectItem {
  year: number;
  departmentCount: number;
  personnelCount: number;
  projectCount: number;
  holidayCount: number;
  weekCount: number;
}

/** バックエンドの /api/year-summaries レスポンス */
export interface YearSelectResponse {
  years: YearSelectItem[];
}

/**
 * 年度ごとのデータ概要を取得する（GET /api/year-summaries）。
 * 成功時は年度概要の配列を返す。GET のため 5xx / タイムアウト時は 1 回自動再試行する。
 * 失敗時は ApiError を投げる。
 */
export async function fetchYearSelect(): Promise<YearSelectItem[]> {
  const data = await httpRequest<YearSelectResponse>('/api/year-summaries', {
    retry: true,
    timeoutMs: 10_000,
  });
  return data.years;
}