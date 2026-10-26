/**
 * 部門ID・部門名の相互変換ユーティリティ
 *
 * 部門は年度ごとに凍結され、参照は departmentId で行う。
 * 部門名は一意制約を持たないため、同名部門が存在する場合は
 * 表示ラベルに部門IDを付けて区別する。
 */
import type { Department } from '../WorkStatus/types';

/** 部門IDから部門を取得する（見つからない場合は undefined） */
export const findDepartment = (
  departments: Department[],
  departmentId: string,
): Department | undefined =>
  departments.find((d) => d.departmentId === departmentId);

/** 部門IDから表示名を返す（見つからない場合はIDをそのまま返す） */
export const departmentNameOf = (
  departments: Department[],
  departmentId: string,
): string => findDepartment(departments, departmentId)?.name ?? departmentId;

/**
 * 画面表示用の部門ラベルを返す。
 * 同名部門が複数ある場合だけ「部門名（部門ID）」で区別する。
 */
export const departmentLabelOf = (
  departments: Department[],
  departmentId: string,
): string => {
  const department = findDepartment(departments, departmentId);
  if (!department) return departmentId;
  const duplicated =
    departments.filter((d) => d.name === department.name).length > 1;
  return duplicated
    ? `${department.name}（${department.departmentId}）`
    : department.name;
};

/**
 * 部門名から部門IDを解決する（取込ファイルの「所属部門」列などで使用）。
 * 同名部門が複数存在する場合は一意に決められないため null を返す。
 */
export const resolveDepartmentIdByName = (
  departments: Department[],
  name: string,
): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const matches = departments.filter((d) => d.name === trimmed);
  return matches.length === 1 ? matches[0].departmentId : null;
};
