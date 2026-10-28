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
 * 成功時は年度概要の配列を返す。
 */
export async function fetchYearSelect(): Promise<YearSelectItem[]> {
  const res = await fetch('/api/year-summaries');
  if (!res.ok) {
    throw new Error('年度データの取得に失敗しました。');
  }
  const data = (await res.json()) as YearSelectResponse;
  return data.years;
}