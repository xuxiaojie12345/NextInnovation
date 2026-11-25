/**
 * 済南稼働率統計画面（JinanWorkRateScreen）のバックエンド API クライアント
 *
 * API_ID  : JinanWorkRateScreen
 * 参照先  : api_kadou/app/api/jinanWorkRate.py
 *   GET    /api/kadou/{year}/stats/jinan       … 済南拠点の稼働率統計
 *
 * NOTE: 開発時は src/setupProxy.js により /api が http://127.0.0.1:8000 へ転送される。
 *
 * 通信は要員管理 / プロジェクト管理と同じく共通 HTTP クライアント（utils/http の
 * httpRequest）を使う。
 * ・タイムアウト / エラー正規化（ApiError）は httpRequest 側で一括して行う
 * ・GET は 5xx / タイムアウト時に 1 回自動再試行する
 * ・統計は保存しない（参照のみ）
 */

import { httpRequest, SAVE_TIMEOUT_MS } from '../utils/http';

/** 部門別の統計値（API レスポンスの departments 要素） */
export interface JinanWorkRateDepartmentStat {
  /** 部門ID（部門マスタの departmentId） */
  departmentId: string;
  /** 部門名 */
  departmentName: string;
  /** 総人数 */
  headcount: number;
  /** 離職人数 */
  leavers: number;
  /** 総稼動人数 */
  activeTotal: number;
  /** 総稼動率（%） */
  activeRate: number;
  /** 非契約稼動人数 */
  nonContractActive: number;
  /** 教育実施人数 */
  training: number;
  /** 現地稼動人数（日本出張含） = 総稼動人数 */
  localActive: number;
  /** 現地稼動率（%） = 総稼動率 */
  localRate: number;
  /** 契約稼動率（%） = (総稼動人数 - 非契約稼動人数) / 総人数 */
  contractRate: number;
}

/** 済南拠点全体（対象部門の合計）の統計値 */
export interface JinanWorkRateTotal {
  headcount: number;
  leavers: number;
  activeTotal: number;
  activeRate: number;
  nonContractActive: number;
  training: number;
  localActive: number;
  localRate: number;
  contractRate: number;
}

/** 済南稼働率統計のレスポンス */
export interface JinanWorkRateApiResult {
  /** 対象年度 */
  year: string;
  /** 集計対象拠点（'JN'） */
  location: string;
  /** 集計対象部門（部門マスタから動的生成） */
  departments: JinanWorkRateDepartmentStat[];
  /** 済南拠点全体（対象部門の合計から算出） */
  total: JinanWorkRateTotal;
  /** 離職と判定するシステム項目ID（暫定値） */
  leaveProjectId?: string | null;
}

/**
 * 済南稼働率統計を取得する（GET /api/kadou/{year}/stats/jinan）。
 * 統計は保存せず、呼び出しのたびにバックエンドで集計する。
 */
export async function fetchJinanWorkRate(
  year: number,
): Promise<JinanWorkRateApiResult> {
  return httpRequest<JinanWorkRateApiResult>(
    `/api/kadou/${year}/stats/jinan`,
    {
      method: 'GET',
      timeoutMs: SAVE_TIMEOUT_MS,
      // GET のみ 5xx / タイムアウト時に 1 回再試行する（要員管理 / プロジェクト管理と同じ）
      retry: true,
    },
  );
}
