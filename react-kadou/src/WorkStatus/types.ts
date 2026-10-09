/**
 * 要員の稼働（週別 プロジェクト割当）管理 で利用する型定義
 */

/** 要員 */
export interface Personnel {
  id: string;
  /** 社員番号 */
  employeeNo: string;
  /** 氏名 */
  name: string;
  /** 所属（部門マスタの部門名。モックのため名称で参照する） */
  department: string;
  /** 役割コード（例: T11E03 / T09E01 / T08E02） */
  role: string;
  /**
   * 案件所属（項目）のプロジェクトキー
   * ※社員所属（department）と異なる場合は退場予定の入力が必要
   */
  projectKey?: string;
  /**
   * 退場予定（自由入力）
   * ※社員所属≠案件所属の場合に入力が必要
   */
  leavePlan?: string;
}

/** 部門（部門マスタ） */
export interface Department {
  /** 部門ID（主キー。画面には表示しない） */
  id: string;
  /** 部門名 */
  name: string;
}

/** プロジェクト（固定リスト / マスタ） */
export interface Project {
  /**
   * システム項目ID（主キー。画面には一覧の最右に表示する）
   * システムが自動採番するため編集不可。セルの割当値としても利用する。
   */
  key: string;
  /** 項目ID（任意入力・空欄可。主キーではないので重複も許容する） */
  id: string;
  /** 顧客（必須） */
  customer: string;
  /** 案件（必須） */
  caseName: string;
  /** チーム（任意） */
  team: string;
  /** Subチーム（任意） */
  subTeam: string;
  /**
   * 略称（自動生成・編集不可）
   * 「顧客の1番目の文字」＋「・」＋「案件」＋「・」＋「チーム」＋「・」＋「Subチーム」
   * ※未入力の項目は連結しない
   */
  abbr: string;
  /** 所属部門（必須） */
  department: string;
  /** Project名称（任意） */
  name: string;
}

/**
 * 割当（プロジェクト）の保持構造
 * 要員ID -> (週キー: 週の月曜日 'YYYY-MM-DD' -> プロジェクトID または null)
 */
export type AssignmentMap = Record<string, Record<string, string | null>>;
