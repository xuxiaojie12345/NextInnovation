/**
 * 部門に関する純関数の単体テスト
 *
 * ・部門IDは削除後も再利用しない
 * ・部門削除は要員・プロジェクト・稼働行の参照でブロックする
 * ・要員の所属未設定を検出する
 * ・ユーザーの削除済み部門は「全部門」に正規化する
 * ・異動の新所属は「新規に保存される異動」だけを対象にする
 * ・保存済みの異動は取消不可の判定に使う
 * ・済南統計の対象部門は部門マスタから生成する
 */
import { describe, expect, it } from '@jest/globals';
import type {
  Department,
  Personnel,
  Project,
  WorkStatusRow,
} from '../WorkStatus/types';
import {
  buildDepartmentUpdates,
  buildPersonnelSaveValues,
  countDepartmentReferences,
  departmentDeleteBlockMessage,
  departmentExists,
  findMissingDepartmentEmployeeNo,
  getJinanTargetDepartmentIds,
  hasMissingDepartment,
  hasSavedTransfer,
  nextDepartmentId,
  normalizeUserDepartmentId,
} from './departmentRules';

const makeDepartment = (overrides: Partial<Department> = {}): Department => ({
  departmentId: 'dept-0001',
  name: '第一開発部',
  location: '済南',
  ...overrides,
});

const makePersonnel = (overrides: Partial<Personnel> = {}): Personnel => ({
  employeeNo: '001',
  name: '山田 太郎',
  departmentId: 'dept-0001',
  role: 'T11E03',
  ...overrides,
});

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  projectId: 'pj-0001',
  projectCode: '',
  customer: '顧客',
  caseName: '案件',
  team: '',
  subTeam: '',
  abbr: '顧・案件',
  departmentId: 'dept-0001',
  name: '案件',
  validFlg: true,
  educationFlg: false,
  ...overrides,
});

const makeRow = (overrides: Partial<WorkStatusRow> = {}): WorkStatusRow => ({
  key: 'r-1',
  employeeNo: '001',
  departmentId: 'dept-0001',
  ...overrides,
});

describe('nextDepartmentId', () => {
  it('連番で発番し、カウンタを進める', () => {
    expect(nextDepartmentId(0)).toEqual({
      departmentId: 'dept-0001',
      seq: 1,
    });
    expect(nextDepartmentId(4)).toEqual({
      departmentId: 'dept-0005',
      seq: 5,
    });
  });

  it('既存の最大番号より前の ID を返さない', () => {
    expect(nextDepartmentId(3).departmentId).toBe('dept-0004');
    expect(nextDepartmentId(3).seq).toBe(4);
  });
});

describe('countDepartmentReferences / departmentDeleteBlockMessage', () => {
  const data = {
    personnel: [makePersonnel(), makePersonnel({ employeeNo: '002' })],
    projects: [makeProject()],
    workStatusRows: [makeRow(), makeRow({ key: 'r-2' })],
  };

  it('要員・プロジェクト・稼働行の参照件数を数える', () => {
    expect(countDepartmentReferences('dept-0001', data)).toEqual({
      personnel: 2,
      projects: 1,
      workStatusRows: 2,
    });
  });

  it('参照が無ければ削除できる（理由は null）', () => {
    expect(
      countDepartmentReferences('dept-9999', data),
    ).toEqual({
      personnel: 0,
      projects: 0,
      workStatusRows: 0,
    });
    expect(
      departmentDeleteBlockMessage(makeDepartment(), {
        personnel: 0,
        projects: 0,
        workStatusRows: 0,
      }),
    ).toBeNull();
  });

  it('参照があれば件数と種別を含む理由を返す', () => {
    const message = departmentDeleteBlockMessage(
      makeDepartment(),
      countDepartmentReferences('dept-0001', data),
    );
    expect(message).toContain('部門「第一開発部」');
    expect(message).toContain('社員 2 名');
    expect(message).toContain('プロジェクト 1 件');
    expect(message).toContain('稼働表行 2 行');
  });

  it('協力会社は種別名を「協力会社」にする', () => {
    const message = departmentDeleteBlockMessage(
      makeDepartment({ kind: 'partner', name: '協力会社A' }),
      { personnel: 1, projects: 0, workStatusRows: 0 },
    );
    expect(message).toContain('協力会社「協力会社A」');
  });
});

describe('departmentExists', () => {
  const departments = [makeDepartment()];

  it('存在する部門IDは true', () => {
    expect(departmentExists(departments, 'dept-0001')).toBe(true);
  });

  it('存在しない部門ID・未指定は false', () => {
    expect(departmentExists(departments, 'dept-9999')).toBe(false);
    expect(departmentExists(departments, undefined)).toBe(false);
  });
});

describe('hasMissingDepartment', () => {
  it('所属が設定されていれば false', () => {
    expect(hasMissingDepartment(makePersonnel())).toBe(false);
  });

  it('所属が空欄・要員未登録は true', () => {
    expect(hasMissingDepartment(makePersonnel({ departmentId: '' }))).toBe(
      true,
    );
    expect(hasMissingDepartment(undefined)).toBe(true);
  });
});

describe('normalizeUserDepartmentId', () => {
  const departments = [makeDepartment()];

  it('存在する部門はそのまま返す', () => {
    expect(normalizeUserDepartmentId(departments, 'dept-0001')).toBe(
      'dept-0001',
    );
  });

  it('削除済みの部門・未指定は undefined（全部門）', () => {
    expect(
      normalizeUserDepartmentId(departments, 'dept-9999'),
    ).toBeUndefined();
    expect(normalizeUserDepartmentId(departments, undefined)).toBeUndefined();
  });
});

describe('findMissingDepartmentEmployeeNo', () => {
  it('所属が未設定の社員番号を返す（空行は対象外）', () => {
    const rows = [
      makeRow({ employeeNo: '' }),
      makeRow({ employeeNo: '001' }),
      makeRow({ key: 'r-2', employeeNo: '002' }),
    ];
    const departments = new Map([
      ['001', 'dept-0001'],
      ['002', ''],
    ]);
    expect(
      findMissingDepartmentEmployeeNo(rows, (employeeNo) =>
        departments.get(employeeNo),
      ),
    ).toBe('002');
  });

  it('全員所属が設定されていれば undefined', () => {
    expect(
      findMissingDepartmentEmployeeNo([makeRow()], () => 'dept-0001'),
    ).toBeUndefined();
  });
});

describe('buildDepartmentUpdates', () => {
  const OLD_DEPT = 'dept-0001';
  const NEW_DEPT = 'dept-0002';
  const currentOf = (employeeNo: string) =>
    employeeNo === '001' ? OLD_DEPT : undefined;

  it('新規に保存される異動だけを現在所属として返す', () => {
    const rows = [
      makeRow({
        key: 'r-1',
        activeTo: '2026-10-18',
      }),
      makeRow({
        key: 'r-2',
        departmentId: NEW_DEPT,
        activeFrom: '2026-10-19',
        splitFromKey: 'r-1',
      }),
    ];
    const savedRows = [makeRow({ key: 'r-1' })];

    expect(buildDepartmentUpdates(rows, savedRows, currentOf)).toEqual([
      { employeeNo: '001', departmentId: NEW_DEPT },
    ]);
  });

  it('保存済みの異動は再送しない', () => {
    const rows = [
      makeRow({ key: 'r-1', activeTo: '2026-10-18' }),
      makeRow({
        key: 'r-2',
        departmentId: NEW_DEPT,
        activeFrom: '2026-10-19',
        splitFromKey: 'r-1',
      }),
    ];
    const savedRows = [
      makeRow({ key: 'r-1', activeTo: '2026-10-18' }),
      makeRow({
        key: 'r-2',
        departmentId: NEW_DEPT,
        activeFrom: '2026-10-19',
        splitFromKey: 'r-1',
      }),
    ];

    expect(buildDepartmentUpdates(rows, savedRows, () => NEW_DEPT)).toEqual(
      [],
    );
  });

  it('新しい所属が現在所属と同じなら返さない', () => {
    const rows = [
      makeRow({ key: 'r-1' }),
      makeRow({
        key: 'r-2',
        departmentId: OLD_DEPT,
        activeFrom: '2026-10-19',
        splitFromKey: 'r-1',
      }),
    ];
    expect(
      buildDepartmentUpdates(rows, [makeRow({ key: 'r-1' })], currentOf),
    ).toEqual([]);
  });

  it('異動が無い（1 行）要員は対象外', () => {
    expect(
      buildDepartmentUpdates([makeRow()], [makeRow()], currentOf),
    ).toEqual([]);
  });

  it('適用開始週が新しい行の所属を採用する（行の並び順に依存しない）', () => {
    const rows = [
      makeRow({
        key: 'r-2',
        departmentId: NEW_DEPT,
        activeFrom: '2026-12-07',
        splitFromKey: 'r-1',
      }),
      makeRow({
        key: 'r-1',
        departmentId: OLD_DEPT,
        activeFrom: '2026-04-06',
        activeTo: '2026-11-30',
      }),
    ];
    expect(
      buildDepartmentUpdates(rows, [makeRow({ key: 'r-1' })], currentOf),
    ).toEqual([{ employeeNo: '001', departmentId: NEW_DEPT }]);
  });
});

describe('hasSavedTransfer', () => {
  it('保存済みデータで 2 行なら true', () => {
    expect(
      hasSavedTransfer('001', [
        makeRow({ key: 'r-1' }),
        makeRow({ key: 'r-2', splitFromKey: 'r-1' }),
      ]),
    ).toBe(true);
  });

  it('保存済みデータで 1 行なら false（未保存の異動は取消可能）', () => {
    expect(hasSavedTransfer('001', [makeRow()])).toBe(false);
  });

  it('社員番号が空なら false', () => {
    expect(hasSavedTransfer('', [makeRow({ employeeNo: '' })])).toBe(false);
  });
});

describe('buildPersonnelSaveValues', () => {
  const values = {
    employeeNo: '001',
    name: '山田 太郎',
    role: 'T11E03',
    departmentId: 'dept-0002',
  };

  it('既存の更新では所属を含めない', () => {
    const update = buildPersonnelSaveValues(values, false);
    expect(update).toEqual({
      employeeNo: '001',
      name: '山田 太郎',
      role: 'T11E03',
    });
    expect('departmentId' in update).toBe(false);
  });

  it('新規登録では所属を含める', () => {
    expect(buildPersonnelSaveValues(values, true)).toEqual(values);
  });
});

describe('getJinanTargetDepartmentIds', () => {
  it('済南拠点かつ協力会社以外の部門IDを順序を保って返す', () => {
    const departments = [
      makeDepartment({ departmentId: 'D1', name: '済南1' }),
      makeDepartment({
        departmentId: 'D2',
        name: '天津1',
        location: '天津',
      }),
      makeDepartment({
        departmentId: 'D3',
        name: '協力会社A',
        kind: 'partner',
      }),
      makeDepartment({ departmentId: 'D4', name: '済南2' }),
    ];
    expect(getJinanTargetDepartmentIds(departments)).toEqual(['D1', 'D4']);
  });
});
