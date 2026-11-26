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
 * ・離職は「顧客 = 内 かつ 案件名 = 退職」のプロジェクトで判定し、フラグより先に除外する
 *   離職人数 = その週に該当プロジェクトが設定されている人数（退職後は毎週計上）
 *   総人数 = その週の有効な部門行数 − 離職人数
 *   （離職者は稼働する人員ではないため、総人数からも差し引く）
 */
import type { Project, WorkStatusRow } from '../WorkStatus/types';
import type { WorkStatusData } from './yearStore';
import { JINAN_ALL_LABEL } from './jinanStats';
import type { JinanWeeklyStat } from './jinanStats';
import { buildYearWeeks } from './yearWeeks';
import type { WeekCol } from './yearWeeks';

/** 離職を表すプロジェクトの 顧客 */
const LEAVE_CUSTOMER = '内';

/** 離職を表すプロジェクトの 案件名 */
const LEAVE_CASE_NAME = '退職';

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
  /** 離職ID 集合（顧客 = 内 かつ 案件名 = 退職 のプロジェクト） */
  const leaveProjectIds = new Set(
    projects
      .filter(
        (p) =>
          (p.customer ?? '').trim() === LEAVE_CUSTOMER &&
          (p.caseName ?? '').trim() === LEAVE_CASE_NAME,
      )
      .map((p) => p.projectId),
  );
  /** 離職判定（プロジェクトID の集合で判定する） */
  const isLeaveProject = (projectId: string | null | undefined): boolean =>
    !!projectId && leaveProjectIds.has(String(projectId));

  // projectId → Project（有効flg・教育flg の判定に使う）
  const projectById = new Map(projects.map((p) => [p.projectId, p]));

  /** 1 部門 × 1 週分の統計 */
  const buildOne = (
    departmentId: string,
    weekKey: string,
    week: WeekCol,
  ): JinanWeeklyStat => {
    /** その週に有効な部門行数（この部門の全員） */
    let allRows = 0;
    let leavers = 0;
    let activeTotal = 0;
    let nonContractActive = 0;
    let training = 0;
    /**
     * 同一週に処理済みの社員番号。
     * 異動の 2 行は有効期間が重ならない想定だが、画面の下書き（保存前）や
     * 異動日の設定漏れで同じ週に 2 行が有効になることがある。
     * その場合に同じ人を 2 回数えないよう、社員番号で重複を弾く。
     */
    const countedEmployees = new Set<string>();
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (row.departmentId !== departmentId) continue;
      if (!isActive(row, weekKey)) continue;
      // 同一週に同じ社員を二重計上しない（異動行の重なり対策）
      const employeeKey = row.employeeNo || row.key;
      if (countedEmployees.has(employeeKey)) continue;
      countedEmployees.add(employeeKey);
      // 総人数の母数 = 有効な部門行数（離職者も含めて数える）
      allRows += 1;
      const cell = assignment[row.employeeNo] ?? {};
      const pid = cell[weekKey];
      if (isLeaveProject(pid)) {
        // 当週「内・退職」の人数（退職後は毎週計上。他の指標には計上しない）
        leavers += 1;
        continue;
      }
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
    // 総人数 = 有効な部門行数 − 離職人数（負にはしない）
    const headcount = Math.max(0, allRows - leavers);
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
