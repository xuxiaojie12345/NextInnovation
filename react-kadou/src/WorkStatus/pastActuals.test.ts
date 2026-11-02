import { describe, expect, it } from '@jest/globals';
import dayjs from 'dayjs';
import {
  currentWeekKey,
  hasPastActualsForEmployee,
  hasPastActualsForRow,
  hasWorkData,
  isPastWeek,
  isPastYear,
} from './pastActuals';
import type { AssignmentMap, WorkStatusRow } from './types';
import type { UnpaidMap } from '../data/yearStore';

/** テスト基準: 2026-10-26（月）の週。先週 = 2026-10-19、翌週 = 2026-11-02 */
const CURRENT_MONDAY = '2026-10-26';
const LAST_MONDAY = '2026-10-19';
const NEXT_MONDAY = '2026-11-02';

const makeRow = (overrides: Partial<WorkStatusRow> = {}): WorkStatusRow => ({
  key: 'r-1',
  employeeNo: '001',
  departmentId: 'D1',
  ...overrides,
});

const makeBaseline = (
  assignment: AssignmentMap = {},
  unpaid: UnpaidMap = {},
) => ({ assignment, unpaid });

describe('currentWeekKey', () => {
  it('指定日が属する週の月曜を返す', () => {
    expect(currentWeekKey(dayjs('2026-10-28'))).toBe(CURRENT_MONDAY);
    expect(currentWeekKey(dayjs('2026-10-26'))).toBe(CURRENT_MONDAY);
    expect(currentWeekKey(dayjs('2026-11-01'))).toBe(CURRENT_MONDAY);
  });
});

describe('isPastWeek', () => {
  it('今週の月曜より前は過去', () => {
    expect(isPastWeek(LAST_MONDAY, CURRENT_MONDAY)).toBe(true);
  });
  it('今週の月曜は過去ではない', () => {
    expect(isPastWeek(CURRENT_MONDAY, CURRENT_MONDAY)).toBe(false);
  });
  it('未来の週は過去ではない', () => {
    expect(isPastWeek(NEXT_MONDAY, CURRENT_MONDAY)).toBe(false);
  });
});

describe('isPastYear', () => {
  it('現在年より前は過年度', () => {
    expect(isPastYear(2025, dayjs('2026-10-26'))).toBe(true);
  });
  it('現在年・未来年は過年度ではない', () => {
    expect(isPastYear(2026, dayjs('2026-10-26'))).toBe(false);
    expect(isPastYear(2027, dayjs('2026-10-26'))).toBe(false);
  });
});

describe('hasPastActualsForRow', () => {
  it('過去週に割当があれば true', () => {
    const baseline = makeBaseline({ '001': { [LAST_MONDAY]: 'P1' } });
    expect(hasPastActualsForRow(makeRow(), baseline, CURRENT_MONDAY)).toBe(
      true,
    );
  });
  it('明示的な未割当（null）は実績に数えない', () => {
    const baseline = makeBaseline({ '001': { [LAST_MONDAY]: null } });
    expect(hasPastActualsForRow(makeRow(), baseline, CURRENT_MONDAY)).toBe(
      false,
    );
  });
  it('過去週の BUFFER も実績に数える', () => {
    const baseline = makeBaseline({}, { '001': { [LAST_MONDAY]: true } });
    expect(hasPastActualsForRow(makeRow(), baseline, CURRENT_MONDAY)).toBe(
      true,
    );
  });
  it('今週・未来の割当は対象外', () => {
    const baseline = makeBaseline({
      '001': { [CURRENT_MONDAY]: 'P1', [NEXT_MONDAY]: 'P2' },
    });
    expect(hasPastActualsForRow(makeRow(), baseline, CURRENT_MONDAY)).toBe(
      false,
    );
  });
  it('行の有効期間外の過去実績は対象外', () => {
    const baseline = makeBaseline({ '001': { [LAST_MONDAY]: 'P1' } });
    const row = makeRow({ activeFrom: CURRENT_MONDAY });
    expect(hasPastActualsForRow(row, baseline, CURRENT_MONDAY)).toBe(false);
  });
  it('社員番号が空の行は対象外', () => {
    const baseline = makeBaseline({ '001': { [LAST_MONDAY]: 'P1' } });
    expect(
      hasPastActualsForRow(
        makeRow({ employeeNo: '' }),
        baseline,
        CURRENT_MONDAY,
      ),
    ).toBe(false);
  });
});

describe('hasPastActualsForEmployee', () => {
  const rows: WorkStatusRow[] = [
    makeRow({ key: 'r-1', activeTo: LAST_MONDAY }),
    makeRow({
      key: 'r-2',
      activeFrom: CURRENT_MONDAY,
      splitFromKey: 'r-1',
    }),
  ];

  it('いずれかの行の過去実績を拾う', () => {
    const baseline = makeBaseline({ '001': { [LAST_MONDAY]: 'P1' } });
    expect(
      hasPastActualsForEmployee(rows, '001', baseline, CURRENT_MONDAY),
    ).toBe(true);
  });
  it('未来の実績だけなら false', () => {
    const baseline = makeBaseline({ '001': { [NEXT_MONDAY]: 'P1' } });
    expect(
      hasPastActualsForEmployee(rows, '001', baseline, CURRENT_MONDAY),
    ).toBe(false);
  });
  it('社員番号が空なら false', () => {
    const baseline = makeBaseline({ '001': { [LAST_MONDAY]: 'P1' } });
    expect(
      hasPastActualsForEmployee(rows, '', baseline, CURRENT_MONDAY),
    ).toBe(false);
  });
});

describe('hasWorkData', () => {
  it('割当があれば true', () => {
    expect(
      hasWorkData('001', { '001': { [LAST_MONDAY]: 'P1' } }, {}),
    ).toBe(true);
  });
  it('BUFFER があれば true', () => {
    expect(
      hasWorkData('001', {}, { '001': { [LAST_MONDAY]: true } }),
    ).toBe(true);
  });
  it('null / false / 空は false', () => {
    expect(
      hasWorkData('001', { '001': { [LAST_MONDAY]: null } }, {}),
    ).toBe(false);
    expect(
      hasWorkData('001', {}, { '001': { [LAST_MONDAY]: false } }),
    ).toBe(false);
    expect(hasWorkData('001', {}, {})).toBe(false);
  });
  it('社員番号が空なら false', () => {
    expect(
      hasWorkData('', { '001': { [LAST_MONDAY]: 'P1' } }, {}),
    ).toBe(false);
  });
});
