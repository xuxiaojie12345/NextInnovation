/** 休日の区分 */
export type HolidayKind = "祝日" | "会社休日" | "振替休日" | "未指定";

/** 休日設定の1件 */
export interface Holiday {
  id: string | null;
  /** 'YYYY-MM-DD' */
  date: string;
  name: string;
  kind: HolidayKind | null;
}

export interface HolidaySettingsScreenProps {
  /** 表示する年度 */
  year: number;
  /** その年度の休日（App 側で年度ごとに保持） */
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  currentUserId: string | null;
}

/** 一括読み込みで受け取る1件分の休日情報 */
export interface HolidayImportRow {
  /** 日付（'YYYY-MM-DD'） */
  date: string;
}

/** 一括読み込みの結果 */
export interface HolidayImportResult {
  /** 取り込み対象になった休日情報（日付は一意） */
  rows: HolidayImportRow[];
  /** 取り込めなかった行の警告（「n行目：〜」形式） */
  warnings: string[];
  error: string[];
  /** 読み取り元の説明（結果メッセージ用。例：'Excel(.xlsx) / シート:Sheet1'） */
  source: string;
}

export interface HolidayResponse {
  id: number;
  year: string;
  kind: string;
  data: string;
  name: string;
}

export interface HolidayRequest {
  kind: string;
  data: string;
  name: string;
}

export interface HolidayImportRequest {
  data: string[];
}
