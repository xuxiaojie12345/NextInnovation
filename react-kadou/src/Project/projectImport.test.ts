/**
 * プロジェクト情報の一括読み込み：取り込み時の桁数チェックのテスト
 */
import { describe, expect, it } from '@jest/globals';
import { ProjectImportRow, validateProjectImportRows } from './projectImport';

const base: ProjectImportRow = {
  customer: '顧客A',
  caseName: '案件A',
  team: 'チームA',
  subTeam: 'SubA',
  department: 'システム開発部',
  projectCode: 'PJ-001',
  name: 'ProjectA',
  line: 2,
};

describe('validateProjectImportRows', () => {
  it('制限内なら空配列を返す', () => {
    expect(validateProjectImportRows([base])).toEqual([]);
  });

  it('チームが30文字を超える行を検出する（行番号・項目名つき）', () => {
    const problems = validateProjectImportRows([
      { ...base, team: 'あ'.repeat(31), line: 5 },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('5行目');
    expect(problems[0]).toContain('チーム');
    expect(problems[0]).toContain('30文字以内');
  });

  it('顧客・案件が100文字を超える行を検出する', () => {
    const problems = validateProjectImportRows([
      { ...base, customer: 'あ'.repeat(101) },
      { ...base, caseName: 'い'.repeat(101), line: 7 },
    ]);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('顧客');
    expect(problems[1]).toContain('7行目');
    expect(problems[1]).toContain('案件');
  });

  it('項目ID（20文字）と Project名称（30文字）を超える行を検出する', () => {
    const problems = validateProjectImportRows([
      { ...base, projectCode: 'P'.repeat(21) },
      { ...base, name: 'N'.repeat(31), line: 9 },
    ]);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('項目ID');
    expect(problems[1]).toContain('Project名称');
  });

  it('任意項目が空欄ならエラーにしない', () => {
    expect(
      validateProjectImportRows([
        { ...base, team: '', subTeam: '', projectCode: '', name: '' },
      ]),
    ).toEqual([]);
  });
});
