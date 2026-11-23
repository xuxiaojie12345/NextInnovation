/**
 * 済南稼働率統計を「要員稼動管理の稼働表」から算出する。
 *
 * ・行（WorkStatusRow）は所属と有効期間を持つ
 * ・年途中の部門異動は 2 行に分かれるため、その週に有効な行だけを数える
 * ・割当（assignment）と BUFFER（unpaid）は社員番号キー（有効期間は重ならない）
 *
 * プロジェクトのフラグによる集計ルール：
 * ・総稼動人数 = 「割当あり かつ プロジェクトの有効flg = true」だけを数える
 *   （無効プロジェクトの割当は稼動系指標に計上しない。BUFFER も同じ扱い）
 * ・教育実施人数 = 「割当あり かつ 教育flg = true」を数える
 *   （有効flg・BUFFER とは無関係。有効 + 教育は稼動と教育の両方に計上する）
 * ・「内・退職」は名前で判定し、フラグより先に除外する
 *   離職人数 = その週に「内・退職」が設定されている人数（退職後は毎週計上）
 *   総人数 = その週の部門行数 − 離職人数
 */
import type { Project, WorkStatusRow } from '../WorkStatus/types';
import type { WorkStatusData } from './yearStore';
import { JINAN_ALL_LABEL } from './jinanStats';
import type { JinanWeeklyStat } from './jinanStats';
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

  // projectId → Project（有効flg・教育flg の判定に使う）
  const projectById = new Map(projects.map((p) => [p.projectId, p]));

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
    let training = 0;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (row.departmentId !== departmentId) continue;
      if (!isActive(row, weekKey)) continue;
      const cell = assignment[row.employeeNo] ?? {};
      const isLeave =
        !!leaveProjectId && cell[weekKey] === leaveProjectId;
      if (isLeave) {
        // 当週「内・退職」の人数（退職後は毎週計上。総人数からは外す）
        leavers += 1;
        continue;
      }
      headcount += 1;
      const pid = cell[weekKey];
      const project = pid ? projectById.get(pid) : undefined;
      if (project?.validFlg) {
        // 総稼動人数は BUFFER を含む（無効プロジェクトの割当は計上しない）
        activeTotal += 1;
        if (unpaid[row.employeeNo]?.[weekKey]) nonContractActive += 1;
      }
      if (project?.educationFlg) {
        // 教育実施人数は有効flg・BUFFER と無関係に計上する
        training += 1;
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
      training,
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
    let training = 0;
    for (let d = 0; d < targetDepartments.length; d += 1) {
      const s = buildOne(targetDepartments[d], week.key, week);
      headcount += s.headcount;
      leavers += s.leavers;
      activeTotal += s.activeTotal;
      nonContractActive += s.nonContractActive;
      training += s.training;
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
      training,
      localActive: activeTotal,
    });
  }
  return out;
};
