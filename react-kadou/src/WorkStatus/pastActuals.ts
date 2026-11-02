/**
 * 過去実績（年度初め〜先週の日曜）の判定ユーティリティ
 *
 * 「過去実績」＝今週の月曜より前の週にある、次のいずれか。
 *   - プロジェクトの割当（退職「内・退職」を含む）
 *   - BUFFER（無償支援）
 *
 * 判定は「保存済みデータ」（WorkStatus の savedBaseline）に対して行う。
 * 未保存の下書き（セルの編集中の値）では判定を変えない。
 */
import dayjs, { Dayjs } from 'dayjs';
import { weekKeyOf } from '../data/yearWeeks';
import type { AssignmentMap, WorkStatusRow } from './types';
import type { UnpaidMap } from '../data/yearStore';

/** 保存済みデータ（過去実績の判定基準）。保存時に更新する */
export interface SavedBaseline {
  assignment: AssignmentMap;
  unpaid: UnpaidMap;
}

/** 今週の月曜（週キー 'YYYY-MM-DD'） */
export const currentWeekKey = (now: Dayjs = dayjs()): string =>
  weekKeyOf(now);

/** その週が過去（今週の月曜より前）か */
export const isPastWeek = (
  weekKey: string,
  currentMonday: string,
): boolean => weekKey < currentMonday;

/** 過年度（現在年より前）か */
export const isPastYear = (
  year: number,
  now: Dayjs = dayjs(),
): boolean => year < now.year();

/** その週が行の有効期間内か（未指定 = 年度全体） */
const inRowPeriod = (
  row: Pick<WorkStatusRow, 'activeFrom' | 'activeTo'>,
  weekKey: string,
): boolean =>
  (!row.activeFrom || weekKey >= row.activeFrom) &&
  (!row.activeTo || weekKey <= row.activeTo);

/** その週に実績（割当 or BUFFER）があるか */
const hasActualAt = (
  employeeNo: string,
  weekKey: string,
  baseline: SavedBaseline,
): boolean =>
  baseline.assignment[employeeNo]?.[weekKey] != null ||
  baseline.unpaid[employeeNo]?.[weekKey] === true;

/**
 * 「過去 ∩ 行の有効期間」に実績があるか
 * （行単位・社員単位の判定で共通に使う）
 */
const hasActualIn = (
  employeeNo: string,
  row: Pick<WorkStatusRow, 'activeFrom' | 'activeTo'>,
  baseline: SavedBaseline,
  currentMonday: string,
): boolean => {
  // 保存済みデータは週キーのみを持つ（値が null / false の週は実績なし）
  const weekKeys = new Set([
    ...Object.keys(baseline.assignment[employeeNo] ?? {}),
    ...Object.keys(baseline.unpaid[employeeNo] ?? {}),
  ]);
  for (const weekKey of weekKeys) {
    if (!isPastWeek(weekKey, currentMonday)) continue;
    if (!inRowPeriod(row, weekKey)) continue;
    if (hasActualAt(employeeNo, weekKey, baseline)) return true;
  }
  return false;
};

/**
 * 行単位の過去実績（行削除の可否に使う）
 * 対象は「その行の有効期間 ∩ 過去」
 */
export const hasPastActualsForRow = (
  row: Pick<WorkStatusRow, 'employeeNo' | 'activeFrom' | 'activeTo'>,
  baseline: SavedBaseline,
  currentMonday: string,
): boolean =>
  row.employeeNo !== '' &&
  hasActualIn(row.employeeNo, row, baseline, currentMonday);

/**
 * 社員単位の過去実績（社員番号変更の可否に使う）
 * 対象は「同じ社員の全行（1〜2 行）の有効期間 ∩ 過去」
 * （社員番号は 2 行まとめて変更するため、もう一方の行の実績も対象）
 */
export const hasPastActualsForEmployee = (
  rows: WorkStatusRow[],
  employeeNo: string,
  baseline: SavedBaseline,
  currentMonday: string,
): boolean =>
  employeeNo !== '' &&
  rows.some(
    (row) =>
      row.employeeNo === employeeNo &&
      hasActualIn(employeeNo, row, baseline, currentMonday),
  );

/** その社員に業務データ（割当 or BUFFER）が 1 件でもあるか（全週） */
export const hasWorkData = (
  employeeNo: string,
  assignment: AssignmentMap,
  unpaid: UnpaidMap,
): boolean => {
  if (!employeeNo) return false;
  const weeks = assignment[employeeNo] ?? {};
  if (Object.keys(weeks).some((weekKey) => weeks[weekKey] != null)) return true;
  const buffer = unpaid[employeeNo] ?? {};
  return Object.keys(buffer).some((weekKey) => buffer[weekKey] === true);
};
