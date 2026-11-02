/**
 * 部門の参照チェック・採番・所属の正規化に関する純関数。
 *
 * 画面や保存処理から独立させ、単体テストできるようにする。
 */
import type {
  Department,
  Personnel,
  Project,
  WorkStatusRow,
} from '../WorkStatus/types';

/** 部門IDの採番結果 */
export interface DepartmentIdAllocation {
  departmentId: string;
  seq: number;
}

/**
 * 年度内で再利用しない部門IDを発番する。
 * 削除してもカウンタは戻さないため、過去の参照と衝突しない。
 */
export const nextDepartmentId = (seq: number): DepartmentIdAllocation => {
  const next = seq + 1;
  return {
    departmentId: `dept-${String(next).padStart(4, '0')}`,
    seq: next,
  };
};

/** 部門を参照している件数 */
export interface DepartmentReferences {
  personnel: number;
  projects: number;
  workStatusRows: number;
}

/** 当年の保存済みデータから、部門の参照件数を数える */
export const countDepartmentReferences = (
  departmentId: string,
  data: {
    personnel: Personnel[];
    projects: Project[];
    workStatusRows: WorkStatusRow[];
  },
): DepartmentReferences => ({
  personnel: data.personnel.filter((p) => p.departmentId === departmentId)
    .length,
  projects: data.projects.filter((p) => p.departmentId === departmentId)
    .length,
  workStatusRows: data.workStatusRows.filter(
    (r) => r.departmentId === departmentId,
  ).length,
});

/** 参照が 1 件でもあるか */
export const hasDepartmentReferences = (refs: DepartmentReferences): boolean =>
  refs.personnel + refs.projects + refs.workStatusRows > 0;

/** 部門削除を拒否する理由（削除可能なら null） */
export const departmentDeleteBlockMessage = (
  department: Pick<Department, 'name' | 'kind'>,
  refs: DepartmentReferences,
): string | null => {
  if (!hasDepartmentReferences(refs)) return null;

  const reasons = [
    refs.personnel > 0 ? `社員 ${refs.personnel} 名` : '',
    refs.projects > 0 ? `プロジェクト ${refs.projects} 件` : '',
    refs.workStatusRows > 0 ? `稼働表行 ${refs.workStatusRows} 行` : '',
  ].filter((reason) => reason !== '');
  const kindLabel = department.kind === 'partner' ? '協力会社' : '部門';
  return `${kindLabel}「${department.name}」は${reasons.join(
    '・',
  )}から参照されているため削除できません。`;
};

/** 部門IDが部門マスタに存在するか */
export const departmentExists = (
  departments: Department[],
  departmentId?: string,
): boolean =>
  !!departmentId &&
  departments.some((d) => d.departmentId === departmentId);

/** 要員の所属が未設定か（未登録の要員も未設定として扱う） */
export const hasMissingDepartment = (personnel?: Personnel): boolean =>
  !personnel?.departmentId;

/** ユーザーの所属部門を正規化する（存在しない部門は undefined = 全部門） */
export const normalizeUserDepartmentId = (
  departments: Department[],
  departmentId?: string,
): string | undefined =>
  departmentExists(departments, departmentId) ? departmentId : undefined;

/** 保存済みデータで異動（同一社員が 2 行）になっているか */
export const hasSavedTransfer = (
  employeeNo: string,
  savedRows: WorkStatusRow[],
): boolean =>
  employeeNo !== '' &&
  savedRows.filter((row) => row.employeeNo === employeeNo).length > 1;

/**
 * 要員情報の保存値。
 * 既存の更新では所属を含めない（所属は異動でのみ変更する）。
 */
export const buildPersonnelSaveValues = (
  values: {
    employeeNo: string;
    name: string;
    role: string;
    departmentId?: string;
  },
  isNew: boolean,
): {
  employeeNo: string;
  name: string;
  role: string;
  departmentId?: string;
} =>
  isNew
    ? values
    : {
        employeeNo: values.employeeNo,
        name: values.name,
        role: values.role,
      };

/** 済南稼働統計の対象部門ID（拠点＝済南 かつ 協力会社以外） */
export const getJinanTargetDepartmentIds = (
  departments: Department[],
): string[] =>
  departments
    .filter((d) => d.location === '済南' && d.kind !== 'partner')
    .map((d) => d.departmentId);

/** 所属が未設定の要員の社員番号（先頭 1 件。無ければ undefined） */
export const findMissingDepartmentEmployeeNo = (
  rows: WorkStatusRow[],
  getDepartmentId: (employeeNo: string) => string | undefined,
): string | undefined =>
  rows.find(
    (row) => row.employeeNo !== '' && !getDepartmentId(row.employeeNo),
  )?.employeeNo;

/**
 * 異動で変更される要員の現在所属を求める。
 *
 * ・同一社員が 2 行になっている（異動）要員だけを対象にする
 * ・既に保存済みの異動は対象外（現在所属は前回の保存で反映済み）
 * ・現在所属と同じ場合は対象外
 */
export const buildDepartmentUpdates = (
  rows: WorkStatusRow[],
  savedRows: WorkStatusRow[],
  getCurrentDepartmentId: (employeeNo: string) => string | undefined,
): { employeeNo: string; departmentId: string }[] => {
  const rowsByEmployee = new Map<string, WorkStatusRow[]>();
  rows.forEach((row) => {
    if (!row.employeeNo) return;
    const list = rowsByEmployee.get(row.employeeNo) ?? [];
    list.push(row);
    rowsByEmployee.set(row.employeeNo, list);
  });

  const savedCountByEmployee = new Map<string, number>();
  savedRows.forEach((row) => {
    if (!row.employeeNo) return;
    savedCountByEmployee.set(
      row.employeeNo,
      (savedCountByEmployee.get(row.employeeNo) ?? 0) + 1,
    );
  });

  const updates: { employeeNo: string; departmentId: string }[] = [];
  rowsByEmployee.forEach((employeeRows, employeeNo) => {
    if (employeeRows.length < 2) return;
    if ((savedCountByEmployee.get(employeeNo) ?? 0) >= 2) return;

    const latest = [...employeeRows].sort((a, b) =>
      (a.activeFrom ?? '').localeCompare(b.activeFrom ?? ''),
    )[employeeRows.length - 1];
    if (!latest.departmentId) return;
    if (latest.departmentId === getCurrentDepartmentId(employeeNo)) return;

    updates.push({
      employeeNo,
      departmentId: latest.departmentId,
    });
  });
  return updates;
};
