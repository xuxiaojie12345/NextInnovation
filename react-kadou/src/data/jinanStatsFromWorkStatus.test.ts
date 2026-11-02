/**
 * 済南稼働統計の集計ルール（有効flg・教育flg）の単体テスト
 *
 * ・総稼動人数 / 非契約稼動人数 = プロジェクトの有効flg が true の割当だけ
 * ・教育実施人数 = プロジェクトの教育flg が true の割当（有効flg・BUFFER とは無関係）
 * ・「内・退職」はフラグより先に除外する
 * ・離職人数 = 当週「内・退職」の人数（退職後は毎週計上。総人数からは除外）
 * ・総人数 + 離職人数 = 部門の有効行数
 * ・済南全社 = 対象部門の合計（教育人数も合算する）
 */
import { describe, expect, it } from '@jest/globals';
import type {
  AssignmentMap,
  Project,
  WorkStatusRow,
} from '../WorkStatus/types';
import type { UnpaidMap, WorkStatusData } from './yearStore';
import { JINAN_ALL_LABEL } from './jinanStats';
import type { JinanWeeklyStat } from './jinanStats';
import { getWorkStatusJinanWeeklyStats } from './jinanStatsFromWorkStatus';

const YEAR = 2026;
/** 2026-06-01（月）の週（2026 年度の週リストに含まれる） */
const WEEK = '2026-06-01';
/** 割当が無い週（翌週） */
const EMPTY_WEEK = '2026-06-08';

const DEPT_1 = 'dept-0001';
const DEPT_2 = 'dept-0002';
const DEPARTMENTS = [DEPT_1, DEPT_2];

/** テスト用プロジェクト（既定 = 有効 / 非教育） */
const makeProject = (
  projectId: string,
  overrides: Partial<Project> = {},
): Project => ({
  projectId,
  projectCode: '',
  customer: '得意先',
  caseName: projectId,
  team: '',
  subTeam: '',
  abbr: projectId,
  departmentId: DEPT_1,
  name: projectId,
  validFlg: true,
  educationFlg: false,
  ...overrides,
});

const P_VALID = makeProject('p-valid');
const P_VALID_EDU = makeProject('p-valid-edu', { educationFlg: true });
const P_INVALID = makeProject('p-invalid', { validFlg: false });
const P_INVALID_EDU = makeProject('p-invalid-edu', {
  validFlg: false,
  educationFlg: true,
});
const P_LEAVE = makeProject('p-leave', {
  name: '内・退職',
  abbr: '内・退職',
});

const PROJECTS: Project[] = [
  P_VALID,
  P_VALID_EDU,
  P_INVALID,
  P_INVALID_EDU,
  P_LEAVE,
];

const makeRow = (
  employeeNo: string,
  departmentId: string = DEPT_1,
): WorkStatusRow => ({
  key: `r-${employeeNo}`,
  employeeNo,
  departmentId,
});

const makeWorkStatus = (
  rows: WorkStatusRow[],
  assignment: AssignmentMap,
  unpaid: UnpaidMap = {},
): WorkStatusData => ({ rows, assignment, unpaid });

/** 指定した週・部門の統計を取り出す */
const pick = (
  stats: JinanWeeklyStat[],
  weekKey: string,
  departmentId: string,
): JinanWeeklyStat => {
  const hit = stats.find(
    (s) => s.weekKey === weekKey && s.departmentId === departmentId,
  );
  if (!hit) {
    throw new Error(`統計が見つかりません: ${weekKey} / ${departmentId}`);
  }
  return hit;
};

/** 1 部門（DEPT_1）の統計を計算する */
const statsFor = (
  rows: WorkStatusRow[],
  assignment: AssignmentMap,
  unpaid: UnpaidMap = {},
): JinanWeeklyStat[] =>
  getWorkStatusJinanWeeklyStats(
    DEPT_1,
    YEAR,
    DEPARTMENTS,
    makeWorkStatus(rows, assignment, unpaid),
    PROJECTS,
  );

describe('getWorkStatusJinanWeeklyStats（有効flg・教育flg）', () => {
  it('有効 + 非教育：総稼動に計上し、教育には計上しない', () => {
    const stat = pick(
      statsFor([makeRow('E1')], { E1: { [WEEK]: P_VALID.projectId } }),
      WEEK,
      DEPT_1,
    );

    expect(stat.headcount).toBe(1);
    expect(stat.activeTotal).toBe(1);
    expect(stat.nonContractActive).toBe(0);
    expect(stat.training).toBe(0);
  });

  it('有効 + 教育：総稼動と教育の両方に計上する（重複計上）', () => {
    const stat = pick(
      statsFor([makeRow('E1')], { E1: { [WEEK]: P_VALID_EDU.projectId } }),
      WEEK,
      DEPT_1,
    );

    expect(stat.activeTotal).toBe(1);
    expect(stat.nonContractActive).toBe(0);
    expect(stat.training).toBe(1);
  });

  it('無効 + 非教育：総人数には含むが、稼動・教育とも 0', () => {
    const stat = pick(
      statsFor([makeRow('E1')], { E1: { [WEEK]: P_INVALID.projectId } }),
      WEEK,
      DEPT_1,
    );

    expect(stat.headcount).toBe(1);
    expect(stat.activeTotal).toBe(0);
    expect(stat.nonContractActive).toBe(0);
    expect(stat.training).toBe(0);
  });

  it('無効 + 教育：稼動は 0 だが、教育には計上する', () => {
    const stat = pick(
      statsFor([makeRow('E1')], {
        E1: { [WEEK]: P_INVALID_EDU.projectId },
      }),
      WEEK,
      DEPT_1,
    );

    expect(stat.activeTotal).toBe(0);
    expect(stat.nonContractActive).toBe(0);
    expect(stat.training).toBe(1);
  });

  it('無効 + BUFFER：稼動・非契約とも計上しない', () => {
    const stat = pick(
      statsFor(
        [makeRow('E1')],
        { E1: { [WEEK]: P_INVALID.projectId } },
        { E1: { [WEEK]: true } },
      ),
      WEEK,
      DEPT_1,
    );

    expect(stat.activeTotal).toBe(0);
    expect(stat.nonContractActive).toBe(0);
  });

  it('教育 + BUFFER：教育に計上し、非契約稼動にも計上する', () => {
    const stat = pick(
      statsFor(
        [makeRow('E1')],
        { E1: { [WEEK]: P_VALID_EDU.projectId } },
        { E1: { [WEEK]: true } },
      ),
      WEEK,
      DEPT_1,
    );

    expect(stat.activeTotal).toBe(1);
    expect(stat.nonContractActive).toBe(1);
    expect(stat.training).toBe(1);
  });

  it('内・退職：フラグより先に除外し、離職人数だけを数える', () => {
    const stat = pick(
      statsFor([makeRow('E1')], { E1: { [WEEK]: P_LEAVE.projectId } }),
      WEEK,
      DEPT_1,
    );

    expect(stat.headcount).toBe(0);
    expect(stat.leavers).toBe(1);
    expect(stat.activeTotal).toBe(0);
    expect(stat.training).toBe(0);
  });

  it('内・退職は退職後も毎週「離職人数」に計上する（存量）', () => {
    const stats = statsFor([makeRow('E1')], {
      E1: { [WEEK]: P_LEAVE.projectId, [EMPTY_WEEK]: P_LEAVE.projectId },
    });

    const week1 = pick(stats, WEEK, DEPT_1);
    const week2 = pick(stats, EMPTY_WEEK, DEPT_1);
    expect(week1.leavers).toBe(1);
    expect(week1.headcount).toBe(0);
    expect(week2.leavers).toBe(1);
    expect(week2.headcount).toBe(0);
  });

  it('総人数 + 離職人数 = 部門の有効行数', () => {
    const rows = [makeRow('E1'), makeRow('E2'), makeRow('E3')];
    const assignment: AssignmentMap = {
      E1: { [WEEK]: P_LEAVE.projectId },
      E2: { [WEEK]: P_VALID.projectId },
      E3: { [WEEK]: P_VALID_EDU.projectId },
    };

    const stat = pick(statsFor(rows, assignment), WEEK, DEPT_1);
    expect(stat.headcount + stat.leavers).toBe(rows.length);
  });

  it('マスタに無いプロジェクトの割当は計上しない', () => {
    const stat = pick(
      statsFor([makeRow('E1')], { E1: { [WEEK]: 'p-unknown' } }),
      WEEK,
      DEPT_1,
    );

    expect(stat.headcount).toBe(1);
    expect(stat.activeTotal).toBe(0);
    expect(stat.training).toBe(0);
  });

  it('割当が無い週は稼動・教育とも 0', () => {
    const stat = pick(
      statsFor([makeRow('E1')], { E1: { [WEEK]: P_VALID_EDU.projectId } }),
      EMPTY_WEEK,
      DEPT_1,
    );

    expect(stat.headcount).toBe(1);
    expect(stat.activeTotal).toBe(0);
    expect(stat.nonContractActive).toBe(0);
    expect(stat.training).toBe(0);
  });
});

describe('getWorkStatusJinanWeeklyStats（済南全社）', () => {
  it('済南全社は部門ごとの教育実施人数を合計する', () => {
    const rows = [makeRow('E1', DEPT_1), makeRow('E2', DEPT_2)];
    const assignment: AssignmentMap = {
      E1: { [WEEK]: P_VALID_EDU.projectId },
      E2: { [WEEK]: P_VALID_EDU.projectId },
    };
    const workStatus = makeWorkStatus(rows, assignment);
    const allStats = getWorkStatusJinanWeeklyStats(
      JINAN_ALL_LABEL,
      YEAR,
      DEPARTMENTS,
      workStatus,
      PROJECTS,
    );

    const all = pick(allStats, WEEK, JINAN_ALL_LABEL);
    expect(all.headcount).toBe(2);
    expect(all.activeTotal).toBe(2);
    expect(all.training).toBe(2);

    // 部門別もそれぞれ 1 名（JINAN_ALL_LABEL の結果には部門行が含まれないため個別に計算する）
    const dept1 = pick(
      getWorkStatusJinanWeeklyStats(
        DEPT_1,
        YEAR,
        DEPARTMENTS,
        workStatus,
        PROJECTS,
      ),
      WEEK,
      DEPT_1,
    );
    const dept2 = pick(
      getWorkStatusJinanWeeklyStats(
        DEPT_2,
        YEAR,
        DEPARTMENTS,
        workStatus,
        PROJECTS,
      ),
      WEEK,
      DEPT_2,
    );
    expect(dept1.training).toBe(1);
    expect(dept2.training).toBe(1);
  });

  it('済南全社の稼動は無効プロジェクトの割当を含めない', () => {
    const rows = [makeRow('E1', DEPT_1), makeRow('E2', DEPT_2)];
    const assignment: AssignmentMap = {
      E1: { [WEEK]: P_VALID.projectId },
      E2: { [WEEK]: P_INVALID.projectId },
    };
    const stats = getWorkStatusJinanWeeklyStats(
      JINAN_ALL_LABEL,
      YEAR,
      DEPARTMENTS,
      makeWorkStatus(rows, assignment),
      PROJECTS,
    );

    const all = pick(stats, WEEK, JINAN_ALL_LABEL);
    expect(all.headcount).toBe(2);
    expect(all.activeTotal).toBe(1);
    expect(all.training).toBe(0);
  });
});
