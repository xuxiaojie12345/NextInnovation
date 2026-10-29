/**
 * 済南拠点 稼働率統計 の共通定数・型。
 *
 * 統計値そのものは稼働表（保存済みデータ）から算出する。
 * 部門の対象一覧も部門マスタから生成するため、固定モックは持たない。
 */

/** 稼働率の目標値（%） */
export const JINAN_TARGET_RATE = 50;

/** 済南全社（全部門の合計）を表すラベル */
export const JINAN_ALL_LABEL = '済南全社' as const;

/** 統計上の部門（済南全社 を含む） */
export type JinanDept = string;

/** 済南拠点の週次稼動統計（1 週 = 月曜〜日曜 / 部門別） */
export interface JinanWeeklyStat {
  /** 週キー（月曜日 'YYYY-MM-DD'） */
  weekKey: string;
  /** 週の開始日（月曜）'YYYY/M/D' */
  start: string;
  /** 週の終了日（日曜）'YYYY/M/D' */
  end: string;
  /** 部門ID（済南全社 は 各部門の合計として算出する） */
  departmentId: string;
  /** 総人数（在籍者数） */
  headcount: number;
  /** 離職人数 */
  leavers: number;
  /** 総稼動人数（契約稼動 + 非契約稼動） */
  activeTotal: number;
  /** 非契約稼動人数 */
  nonContractActive: number;
  /** 教育実施人数 */
  training: number;
  /** 現地稼動人数（日本出張含） */
  localActive: number;
}

