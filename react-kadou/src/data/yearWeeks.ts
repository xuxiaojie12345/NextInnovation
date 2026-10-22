/**
 * 年度（日暦年）の週リストを扱う共通ユーティリティ
 *
 * 週は月曜始まり〜日曜。年度の範囲は
 * 「1月1日を含む週 〜 12月31日を含む週」（前年12月・翌年1月にまたがる週も含む）。
 */
import dayjs, { Dayjs } from 'dayjs';

/** 週列の幅（px）。scroll.x と「初期表示の水平スクロール位置」の計算に使う */
export const WEEK_COL_WIDTH = 96;

/** 左固定列の合計幅（番号60+備考190+役割90+社員番号90+名前90+所属90） */
export const FIXED_LEFT_WIDTH = 610;

/** 1週（月曜〜日曜）の情報 */
export interface WeekCol {
  /** 週キー = 月曜日 'YYYY-MM-DD' */
  key: string;
  monday: Dayjs;
  sunday: Dayjs;
  index: number;
}

/** 指定日が属する週の月曜日を返す */
export const mondayOf = (d: Dayjs): Dayjs => d.subtract((d.day() + 6) % 7, 'day');

/** 指定日が属する週の週キー（月曜 'YYYY-MM-DD'）を返す */
export const weekKeyOf = (d: Dayjs): string => mondayOf(d).format('YYYY-MM-DD');

/**
 * 指定年の週列を列挙する（月曜始まり）。
 * 1月1日を含む週 〜 12月31日を含む週（前年12月・翌年1月にまたがる週も含む）
 */
export const buildYearWeeks = (year: number): WeekCol[] => {
  const firstMonday = mondayOf(dayjs(`${year}-01-01`));
  const lastMonday = mondayOf(dayjs(`${year}-12-31`));
  const weeks: WeekCol[] = [];
  let cur = firstMonday;
  let guard = 0;
  while (!cur.isAfter(lastMonday, 'day') && guard < 80) {
    weeks.push({
      key: cur.format('YYYY-MM-DD'),
      monday: cur,
      sunday: cur.add(6, 'day'),
      index: weeks.length,
    });
    cur = cur.add(7, 'day');
    guard += 1;
  }
  return weeks;
};

/** 指定した月グループキー（'YYYY-M'）を返す（週キー = 月曜の属する月） */
export const monthKeyOfWeek = (weekKey: string): string => {
  const d = dayjs(weekKey);
  return `${d.year()}-${d.month()}`;
};
