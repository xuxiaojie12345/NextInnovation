/** 休日の区分 */
export type HolidayKind = '祝日' | '会社休日' | '振替休日' | '未指定';

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
