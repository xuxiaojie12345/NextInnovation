/**
 * 年度選択 画面のバックエンド API 呼び出し
 *
 * 対象 API: GET /api/kadou/{year}（年度別サマリ）
 * パスパラメータは現行未使用のため、固定のセグメント（summary）を指定して呼び出す。
 */
import axios, { AxiosError } from 'axios';
import type { YearSummary } from '../data/yearStore';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL ?? '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** バックエンドの年度サマリ（バックエンドの YearSummary に対応） */
export interface YearSummaryResponse {
  year: number;
  departmentCount: number;
  personnelCount: number;
  projectCount: number;
  holidayCount: number;
  weekCount: number;
}

/** 年度サマリ一覧のレスポンス */
export interface YearSummaryListResponse {
  years: YearSummaryResponse[];
}

/** エラーから表示用のメッセージを取り出す（FastAPI の detail 形式に対応） */
const extractErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : '年度一覧の取得に失敗しました。';
  }
  const axiosError = error as AxiosError;
  if (!axiosError.response) {
    return 'サーバーに接続できませんでした。';
  }
  const detail = (axiosError.response.data as { detail?: unknown } | undefined)
    ?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  return `HTTP ${axiosError.response.status}`;
};

/** バックエンドのレスポンスを画面の YearSummary 型へ変換する */
const toYearSummary = (row: YearSummaryResponse): YearSummary => ({
  year: row.year,
  // いずれかの件数が 1 件以上あれば「データあり」とみなす
  hasData:
    row.departmentCount + row.personnelCount + row.projectCount + row.holidayCount >
    0,
  departmentCount: row.departmentCount,
  personnelCount: row.personnelCount,
  projectCount: row.projectCount,
  holidayCount: row.holidayCount,
  weekCount: row.weekCount,
});

/**
 * 年度ごとのサマリを取得する（画面初期表示時に使用）。
 * @returns 年度昇順のサマリ一覧（2025〜2038 年度）
 * @throws 通信失敗・API エラー時にメッセージ付きの Error
 */
export const fetchYearSummaries = async (): Promise<YearSummary[]> => {
  try {
    const { data } = await api.get<YearSummaryListResponse>(
      '/api/kadou/summary',
    );
    return data.years.map(toYearSummary);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};
