/**
 * 要員の稼働（週別 プロジェクト割当）管理 で利用する型定義
 */

/** 要員（要員マスタ）。同一性・主キーは employeeNo */
export interface Personnel {
  /** 社員番号（業務上の同一性キー） */
  employeeNo: string;
  /** 氏名 */
  name: string;
  /** 所属部門ID（部門マスタの departmentId） */
  departmentId: string;
  /** 役割コード（例: T11E03 / T09E01 / T08E02） */
  role: string;
  /**
   * 退場予定（自由入力）
   * ※社員所属≠案件所属の場合に入力が必要
   */
  leavePlan?: string;
}

/**
 * 稼働表の1行。
 * 年途中で部門異動した場合は、旧所属の行と新所属の行の2行になる
 * （有効期間は重ならない）。
 */
export interface WorkStatusRow {
  /** 行キー（画面・保存で使用する識別子） */
  key: string;
  /** 社員番号（業務上の同一性キー） */
  employeeNo: string;
  /** この行の所属部門ID（要員マスタの現在所属とは独立） */
  departmentId: string;
  /** 有効開始週（月曜 'YYYY-MM-DD'）。未指定 = 年度初め */
  activeFrom?: string;
  /** 有効終了週（月曜 'YYYY-MM-DD'）。未指定 = 年度末 */
  activeTo?: string;
  /** 異動で分割された行のマーカー（社員番号は 2 行まとめて変更する） */
  employeeNoLocked?: boolean;
  /** この行を分割して作られた元の行キー（異動取消時の復元用） */
  splitFromKey?: string;
}

/** 稼働表に表示する行（＝要員マスタの employeeNo の並び） */
export type WorkStatusRows = WorkStatusRow[];

/** 部門の種別（部門 / 協力会社） */
export type DepartmentKind = 'dept' | 'partner';

/** 拠点（部門の所在地。固定 2 択） */
export type DepartmentLocation = '天津' | '済南';

/** 部門（部門マスタ）。協力会社も同じマスタで部門と平級に管理する */
export interface Department {
  /** 部門ID（主キー。画面には表示しない） */
  departmentId: string;
  /** 部門名（協力会社は会社名） */
  name: string;
  /** 拠点（必須。天津 / 済南） */
  location: DepartmentLocation;
  /**
   * 種別（未設定 = 部門）
   * 'partner' = 協力会社。要員の所属・プロジェクトの所属部門としては選択できるが、
   * 済南稼働率統計（稼働率）の集計対象には含めない。
   */
  kind?: DepartmentKind;
}

/** プロジェクト（固定リスト / マスタ） */
export interface Project {
  /**
   * システム項目ID（主キー。画面には一覧の最右に表示する）
   * システムが自動採番するため編集不可。セルの割当値としても利用する。
   */
  projectId: string;
  /** 項目ID（任意入力・空欄可。主キーではないので重複も許容する） */
  projectCode: string;
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
  /** 所属部門ID（部門マスタの departmentId） */
  departmentId: string;
  /** Project名称（任意） */
  name: string;
  /**
   * 有効flg（既定 true）
   * 統計の稼動系指標（総稼動人数・稼働率など）にだけ作用する。
   * false = 無効（割当・BUFFER・選択肢には影響しない）
   */
  validFlg: boolean;
  /**
   * 教育flg（既定 false）
   * 統計の教育実施人数にだけ作用する（有効flg とは無関係）。
   */
  educationFlg: boolean;
}

/**
 * 割当（プロジェクト）の保持構造
 * 要員ID -> (週キー: 週の月曜日 'YYYY-MM-DD' -> プロジェクトID または null)
 */
export type AssignmentMap = Record<string, Record<string, string | null>>;
