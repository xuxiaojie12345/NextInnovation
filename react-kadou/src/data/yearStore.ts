/**
 * 年度（日暦年）ごとのデータセット
 *
 * 部門・要員・プロジェクト・休日・済南統計は「年度ごとに変わる」
 * という前提で、年度をキーにしたストアとして持つ。
 *
 *  - 2025 / 2026 のみモックデータを用意する（それ以外の年度は空＝空白表示）
 *  - 実運用ではバックエンドから年度を指定して取得する想定
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
import { buildProjectAbbr } from '../Project/projectAbbr';
import {
  MOCK_DEPARTMENTS,
  MOCK_PERSONNEL,
  MOCK_PROJECTS,
} from './mockData';
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
  id: string;
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

/** 選択できる年度の範囲（2025〜2036） */
export const AVAILABLE_YEARS: number[] = Array.from(
  { length: 12 },
  (_, i) => 2025 + i,
);

/** 当年（アプリ既定の年度） */
export const currentYear = (): number => dayjs().year();

/* ------------------------------------------------------------------ */
/* 2025 年度のモックデータ                                             */
/* ・2025 は 第二開発部 が無い（2026 で新設）                          */
/* ・同じ社員番号の要員が年度で所属・案件を変える例を含む               */
/* ------------------------------------------------------------------ */

const DEPARTMENTS_2025: Department[] = [
  { departmentId: 'dept-0001', name: '第一開発部', location: 'JN' },
  { departmentId: 'dept-0003', name: '第三開発部', location: 'JN' },
];

const PROJECTS_2025: Project[] = [
  {
    projectId: 'pj-0001',
    projectCode: 'PRJ-0001',
    customer: '桜井商事',
    caseName: '基幹刷新',
    team: '第一',
    subTeam: 'A',
    abbr: buildProjectAbbr('桜井商事', '基幹刷新', '第一', 'A'),
    departmentId: 'dept-0001',
    name: '基幹刷新',
  },
  {
    projectId: 'pj-0003',
    projectCode: 'PRJ-0003',
    customer: '北斗物流',
    caseName: '業務効率化',
    team: '基盤',
    subTeam: 'A',
    abbr: buildProjectAbbr('北斗物流', '業務効率化', '基盤', 'A'),
    departmentId: 'dept-0003',
    name: '業務効率化',
  },
  {
    projectId: 'pj-0004',
    projectCode: 'PRJ-0004',
    customer: '北斗物流',
    caseName: '保守運用',
    team: '運用',
    subTeam: 'C',
    abbr: buildProjectAbbr('北斗物流', '保守運用', '運用', 'C'),
    departmentId: 'dept-0003',
    name: '保守・運用',
  },
  {
    // 内・退職（この項目の要員はグレー表示にする）
    projectId: 'pj-0006',
    projectCode: '',
    customer: '内',
    caseName: '退職',
    team: '',
    subTeam: '',
    abbr: buildProjectAbbr('内', '退職', '', ''),
    departmentId: 'dept-0003',
    name: '内・退職',
  },
];

const PERSONNEL_2025: Personnel[] = [
  // 第一開発部（2026 では 第二開発部 になるメンバーを含む）
  { employeeNo: '10001', name: '田中 太郎', departmentId: 'dept-0001', role: 'T11E03' },
  { employeeNo: '10002', name: '佐藤 花子', departmentId: 'dept-0001', role: 'T09E01' },
  { employeeNo: '10003', name: '鈴木 一郎', departmentId: 'dept-0001', role: 'T08E02' },
  { employeeNo: '10004', name: '高橋 美咲', departmentId: 'dept-0001', role: 'T10E04' },
  { employeeNo: '10005', name: '渡辺 大輝', departmentId: 'dept-0001', role: 'T09E02' },
  { employeeNo: '10006', name: '伊藤 健太', departmentId: 'dept-0001', role: 'T11E05' },
  { employeeNo: '10007', name: '山本 彩', departmentId: 'dept-0001', role: 'T09E03' },
  { employeeNo: '10008', name: '中村 拓也', departmentId: 'dept-0001', role: 'T08E01' },
  { employeeNo: '10009', name: '小林 沙耶', departmentId: 'dept-0001', role: 'T07E02' },
  { employeeNo: '10010', name: '加藤 亮', departmentId: 'dept-0001', role: 'T10E01' },
  { employeeNo: '10011', name: '吉田 恵', departmentId: 'dept-0001', role: 'T12E01' },
  { employeeNo: '10012', name: '山田 剛', departmentId: 'dept-0001', role: 'T11E02' },
  { employeeNo: '10013', name: '松本 芽衣', departmentId: 'dept-0001', role: 'T10E03' },
  // 第三開発部
  { employeeNo: '10021', name: '斎藤 美穂', departmentId: 'dept-0003', role: 'T08E04' },
  { employeeNo: '10022', name: '石川 真', departmentId: 'dept-0003', role: 'T11E07' },
  { employeeNo: '10023', name: '前田 亜美', departmentId: 'dept-0003', role: 'T10E02' },
  { employeeNo: '10024', name: '藤田 浩', departmentId: 'dept-0003', role: 'T08E05' },
  { employeeNo: '10025', name: '岡本 千夏', departmentId: 'dept-0003', role: 'T07E03' },
  { employeeNo: '10026', name: '長谷川 舞', departmentId: 'dept-0003', role: 'T12E02' },
  { employeeNo: '10027', name: '後藤 秀', departmentId: 'dept-0003', role: 'T11E08' },
  { employeeNo: '10028', name: '小川 結衣', departmentId: 'dept-0003', role: 'T09E06' },
  { employeeNo: '10029', name: '三浦 陽介', departmentId: 'dept-0003', role: 'T08E06' },
];

const HOLIDAYS_2025: Holiday[] = [
  { id: 'y25-h01', date: '2025-01-01', name: '元日', kind: '祝日' },
  { id: 'y25-h02', date: '2025-01-13', name: '成人の日', kind: '祝日' },
  { id: 'y25-h03', date: '2025-02-11', name: '建国記念の日', kind: '祝日' },
  { id: 'y25-h04', date: '2025-02-23', name: '天皇誕生日', kind: '祝日' },
  { id: 'y25-h05', date: '2025-02-24', name: '振替休日', kind: '振替休日' },
  { id: 'y25-h06', date: '2025-03-20', name: '春分の日', kind: '祝日' },
  { id: 'y25-h07', date: '2025-04-29', name: '昭和の日', kind: '祝日' },
  { id: 'y25-h08', date: '2025-05-03', name: '憲法記念日', kind: '祝日' },
  { id: 'y25-h09', date: '2025-05-04', name: 'みどりの日', kind: '祝日' },
  { id: 'y25-h10', date: '2025-05-05', name: 'こどもの日', kind: '祝日' },
  { id: 'y25-h11', date: '2025-05-06', name: '振替休日', kind: '振替休日' },
  { id: 'y25-h12', date: '2025-07-21', name: '海の日', kind: '祝日' },
  { id: 'y25-h13', date: '2025-08-11', name: '山の日', kind: '祝日' },
  { id: 'y25-h14', date: '2025-08-13', name: '夏季休暇', kind: '会社休日' },
  { id: 'y25-h15', date: '2025-08-14', name: '夏季休暇', kind: '会社休日' },
  { id: 'y25-h16', date: '2025-09-15', name: '敬老の日', kind: '祝日' },
  { id: 'y25-h17', date: '2025-09-23', name: '秋分の日', kind: '祝日' },
  { id: 'y25-h18', date: '2025-10-13', name: 'スポーツの日', kind: '祝日' },
  { id: 'y25-h19', date: '2025-11-03', name: '文化の日', kind: '祝日' },
  { id: 'y25-h20', date: '2025-11-23', name: '勤労感謝の日', kind: '祝日' },
  { id: 'y25-h21', date: '2025-11-24', name: '振替休日', kind: '振替休日' },
  { id: 'y25-h22', date: '2025-12-29', name: '年末年始休暇', kind: '会社休日' },
  { id: 'y25-h23', date: '2025-12-30', name: '年末年始休暇', kind: '会社休日' },
  { id: 'y25-h24', date: '2025-12-31', name: '年末年始休暇', kind: '会社休日' },
];

/* ------------------------------------------------------------------ */
/* 2026 年度のモックデータ（既存の mockData をそのまま使う）           */
/* ------------------------------------------------------------------ */

const HOLIDAYS_2026: Holiday[] = [
  { id: 'y26-h01', date: '2026-01-01', name: '元日', kind: '祝日' },
  { id: 'y26-h02', date: '2026-02-11', name: '建国記念の日', kind: '祝日' },
  { id: 'y26-h03', date: '2026-03-20', name: '春分の日', kind: '祝日' },
  { id: 'y26-h04', date: '2026-04-29', name: '昭和の日', kind: '祝日' },
  { id: 'y26-h05', date: '2026-05-04', name: 'みどりの日', kind: '祝日' },
  { id: 'y26-h06', date: '2026-05-05', name: 'こどもの日', kind: '祝日' },
  { id: 'y26-h07', date: '2026-08-13', name: '夏季休暇', kind: '会社休日' },
  { id: 'y26-h08', date: '2026-08-14', name: '夏季休暇', kind: '会社休日' },
  { id: 'y26-h09', date: '2026-09-21', name: '敬老の日', kind: '祝日' },
  { id: 'y26-h10', date: '2026-09-23', name: '秋分の日', kind: '祝日' },
  { id: 'y26-h11', date: '2026-09-24', name: '振替休日', kind: '振替休日' },
  { id: 'y26-h12', date: '2026-12-29', name: '年末年始休暇', kind: '会社休日' },
];

/* ------------------------------------------------------------------ */
/* 年度データの定義                                                    */
/* ------------------------------------------------------------------ */

interface YearSourceData {
  departments: Department[];
  personnel: Personnel[];
  projects: Project[];
  holidays: Holiday[];
}

const YEAR_DATA: Record<number, YearSourceData> = {
  2025: {
    departments: DEPARTMENTS_2025,
    personnel: PERSONNEL_2025,
    projects: PROJECTS_2025,
    holidays: HOLIDAYS_2025,
  },
  2026: {
    departments: MOCK_DEPARTMENTS,
    personnel: MOCK_PERSONNEL,
    projects: MOCK_PROJECTS,
    holidays: HOLIDAYS_2026,
  },
};

/** 指定年度のモックデータがあるか */
export const hasYearData = (year: number): boolean => !!YEAR_DATA[year];

/**
 * 指定年度のストアを新規作成する（保存済みデータの初期状態）。
 * ・要員稼動グリッドの初期値（自動セット）をここで確定させておくことで、
 *   画面を開いた直後が「未保存」にならないようにする
 * ・データが無い年度は空（＝空白表示）になる
 */
export const createYearStore = (year: number): YearStore => {
  const source = YEAR_DATA[year];
  const departments = source ? source.departments : [];
  const personnel = source ? source.personnel : [];
  const projects = source ? source.projects : [];
  const holidays = source ? source.holidays : [];

  // 初期表示はマスタの全要員。週次割当は空で、画面で入力して保存する。
  // 行は「所属＋有効期間」を持つ（年途中の部門異動は行を分けて表現する）
  const rows: WorkStatusRows = personnel.map((p, i) => ({
    key: `r-${i + 1}`,
    employeeNo: p.employeeNo,
    departmentId: p.departmentId,
  }));
  const assignment: AssignmentMap = {};
  rows.forEach((row) => {
    assignment[row.employeeNo] = {};
  });

  // 済南統計は部門別（済南全社 は画面側で合算する）
  const jinan = getJinanDepartments(year).flatMap((d) =>
    getJinanWeeklyStats(d, year),
  );

  return {
    year,
    departments,
    personnel,
    projects,
    holidays,
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
 * 静的モック（YEAR_DATA）ではなく、その時点の年度ストアの内容から作るため、
 * 部門・要員・項目・休日を編集すると年度選択画面の件数も追随する。
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
