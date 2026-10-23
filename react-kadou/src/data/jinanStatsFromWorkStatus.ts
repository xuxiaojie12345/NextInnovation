/**
 * 済南稼働率統計を「要員稼動管理の稼働表」から算出する。
 *
 * ・行（WorkStatusRow）は所属と有効期間を持つ
 * ・年途中の部門異動は 2 行に分かれるため、その週に有効な行だけを数える
 * ・割当（assignment）と BUFFER（unpaid）は社員番号キー（有効期間は重ならない）
 *
 * ※教育実施人数だけは判定材料が無いため、現行モック値を流用する（保留中の指標）
 */
import dayjs from 'dayjs';
import type { Project, WorkStatusRow } from '../WorkStatus/types';
import type { WorkStatusData } from './yearStore';
import {
  JINAN_ALL_LABEL,
  JinanWeeklyStat,
  getJinanWeeklyStats,
} from './mockJinanStats';
import { buildYearWeeks } from './yearWeeks';
import type { WeekCol } from './yearWeeks';

/** 「内・退職」を表すプロジェクト名（WorkStatus と同一） */
const LEAVE_PROJECT_NAME = '内・退職';

/** その週が行の有効期間内か */
const isActive = (row: WorkStatusRow, weekKey: string): boolean =>
  (!row.activeFrom || weekKey >= row.activeFrom) &&
  (!row.activeTo || weekKey <= row.activeTo);

/**
 * 指定部門（済南全社 を含む）の週次統計を稼働表から算出する。
 * targetDepartments は済南拠点の対象部門ID（済南全社 はこの合計）。
 */
export const getWorkStatusJinanWeeklyStats = (
  department: string,
  year: number,
  targetDepartments: string[],
  workStatus: WorkStatusData,
  projects: Project[],
): JinanWeeklyStat[] => {
  const weeks = buildYearWeeks(year);
  const rows = workStatus.rows ?? [];
  const assignment = workStatus.assignment ?? {};
  const unpaid = workStatus.unpaid ?? {};
  const leaveProjectId = projects.find(
    (p) => p.name === LEAVE_PROJECT_NAME || p.abbr === LEAVE_PROJECT_NAME,
  )?.projectId;

  // 教育実施人数だけは保留中のため、現行モック値を流用する
  const mock = getJinanWeeklyStats(department, year, targetDepartments);
  const trainingByWeek = new Map<string, number>();
  for (let i = 0; i < mock.length; i += 1) {
    trainingByWeek.set(mock[i].weekKey, mock[i].training);
  }

  /** 1 部門 × 1 週分の統計 */
  const buildOne = (
    departmentId: string,
    weekKey: string,
    week: WeekCol,
  ): JinanWeeklyStat => {
    let headcount = 0;
    let leavers = 0;
    let activeTotal = 0;
    let nonContractActive = 0;
    const prevWeekKey = dayjs(weekKey)
      .subtract(7, 'day')
      .format('YYYY-MM-DD');
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (row.departmentId !== departmentId) continue;
      if (!isActive(row, weekKey)) continue;
      const cell = assignment[row.employeeNo] ?? {};
      const isLeave =
        !!leaveProjectId && cell[weekKey] === leaveProjectId;
      const wasLeave =
        !!leaveProjectId && cell[prevWeekKey] === leaveProjectId;
      if (isLeave) {
        // 退職週のみ「離職人数」に数え、退職週以降は総人数から外す
        if (!wasLeave) leavers += 1;
        continue;
      }
      headcount += 1;
      const pid = cell[weekKey];
      if (pid) {
        // 総稼動人数は BUFFER を含む
        activeTotal += 1;
        if (unpaid[row.employeeNo]?.[weekKey]) nonContractActive += 1;
      }
    }
    return {
      weekKey,
      start: week.monday.format('YYYY/M/D'),
      end: week.sunday.format('YYYY/M/D'),
      departmentId,
      headcount,
      leavers,
      activeTotal,
      nonContractActive,
      training: trainingByWeek.get(weekKey) ?? 0,
      localActive: activeTotal,
    };
  };

  const out: JinanWeeklyStat[] = [];
  for (let w = 0; w < weeks.length; w += 1) {
    const week = weeks[w];
    if (department !== JINAN_ALL_LABEL) {
      if (!targetDepartments.includes(department)) continue;
      out.push(buildOne(department, week.key, week));
      continue;
    }
    // 済南全社 = 対象部門の合計（率は画面側で合計値から計算する）
    let headcount = 0;
    let leavers = 0;
    let activeTotal = 0;
    let nonContractActive = 0;
    for (let d = 0; d < targetDepartments.length; d += 1) {
      const s = buildOne(targetDepartments[d], week.key, week);
      headcount += s.headcount;
      leavers += s.leavers;
      activeTotal += s.activeTotal;
      nonContractActive += s.nonContractActive;
    }
    out.push({
      weekKey: week.key,
      start: week.monday.format('YYYY/M/D'),
      end: week.sunday.format('YYYY/M/D'),
      departmentId: JINAN_ALL_LABEL,
      headcount,
      leavers,
      activeTotal,
      nonContractActive,
      training: trainingByWeek.get(week.key) ?? 0,
      localActive: activeTotal,
    });
  }
  return out;
};
