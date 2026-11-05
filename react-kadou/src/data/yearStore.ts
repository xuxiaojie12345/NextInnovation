/**
 * 年度（日暦年）ごとのデータセット
 *
 * 部門・要員・プロジェクト・休日・済南統計は「年度ごとに変わる」
 * という前提で、年度をキーにしたストアとして持つ。
 *
 *  - ストアは初期状態では空（データ無し＝空白表示）で、各画面が
 *    バックエンドAPIから年度を指定してデータを取得し、このストアに反映する
 *    （src/data/kadouRepository.ts を参照）
 */
import dayjs from 'dayjs';
import {
  AssignmentMap,
  Department,
  Personnel,
  Project,
  WorkStatusRows,
} from '../WorkStatus/types';
import {
  JinanWeeklyStat,
  getJinanDepartments,
  getJinanWeeklyStats,
} from './mockJinanStats';
import { buildYearWeeks } from './yearWeeks';

/** 休日の区分 */
export type HolidayKind = '祝日' | '会社休日' | '振替休日';

/** 休日設定の1件 */
export interface Holiday {
  id: string | null;
  /** 'YYYY-MM-DD' */
  date: string;
  name: string;
  kind: HolidayKind;
}

/** 無償支援（BUFFER）: 要員ID -> (週キー -> true) */
export type UnpaidMap = Record<string, Record<string, boolean>>;

/** 要員稼動管理グリッドの保存済みデータ */
export interface WorkStatusData {
  /** 稼働表に表示する要員（社員番号の並び） */
  rows: WorkStatusRows;
  assignment: AssignmentMap;
  unpaid: UnpaidMap;
}

/** 1 年度分のデータセット（＝保存済みデータ。画面の編集はこれを書き換える） */
export interface YearStore {
  year: number;
  departments: Department[];
  personnel: Personnel[];
  projects: Project[];
  holidays: Holiday[];
  /** 済南拠点の週次統計（済南全社 は含まない） */
  jinan: JinanWeeklyStat[];
  workStatus: WorkStatusData;
}

/** 年度選択で扱う最小年度（定数） */
export const MIN_YEAR = 2025;
/** 年度選択で扱う最大年度（定数） */
export const MAX_YEAR = 2036;

/** 選択できる年度の範囲（MIN_YEAR 〜 MAX_YEAR の連番） */
export const AVAILABLE_YEARS: number[] = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i,
);

/** 当年（アプリ既定の年度） */
export const currentYear = (): number => dayjs().year();

/**
 * 指定年度のストアを新規作成する（保存済みデータの初期状態）。
 * データはバックエンドAPIからの取得を待つため、初期状態はすべて空にする。
 * ・データが無い年度は空（＝空白表示）になる
 */
export const createYearStore = (year: number): YearStore => {
  // 初期表示は全要員（＝マスタ）だが、要員マスタもAPIから取得するため空で始める。
  // 週次割当は空で、画面で入力して保存する。
  const rows: WorkStatusRows = [];
  const assignment: AssignmentMap = {};

  // 済南統計は部門別（済南全社 は画面側で合算する）
  const jinan = getJinanDepartments(year).flatMap((d) =>
    getJinanWeeklyStats(d, year),
  );

  return {
    year,
    departments: [],
    personnel: [],
    projects: [],
    holidays: [],
    jinan,
    workStatus: { rows, assignment, unpaid: {} },
  };
};

/** 年度データの概要（年度選択画面で表示する） */
export interface YearSummary {
  year: number;
  hasData: boolean;
  departmentCount: number;
  personnelCount: number;
  projectCount: number;
  holidayCount: number;
  weekCount: number;
}

/**
 * 年度データの概要（年度選択画面で表示する）。
 * その時点の年度ストアの内容から作るため、部門・要員・項目・休日を
 * 編集すると年度選択画面の件数も追随する。
 */
export const getYearSummary = (
  year: number,
  store?: YearStore,
): YearSummary => {
  const departmentCount = store?.departments.length ?? 0;
  const personnelCount = store?.personnel.length ?? 0;
  const projectCount = store?.projects.length ?? 0;
  const holidayCount = store?.holidays.length ?? 0;
  return {
    year,
    hasData:
      departmentCount + personnelCount + projectCount + holidayCount > 0,
    departmentCount,
    personnelCount,
    projectCount,
    holidayCount,
    weekCount: buildYearWeeks(year).length,
  };
};