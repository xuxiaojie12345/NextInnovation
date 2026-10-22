/**
 * プロジェクト情報の一括読み込み（フロント モック実装）
 *
 * ■ 対応ファイル
 *   - Excel (.xlsx / .xlsm) … 要員情報の一括読み込みと同じ読み取り処理を利用
 *   - CSV / タブ区切りテキスト
 *   - Excel (.xls 旧形式) … 非対応（.xlsx か CSV で保存し直してもらう）
 *
 * ■ 想定する列（1行目は見出し行。列順は自由、見出し名で判定する）
 *   顧客 / 案件 / チーム / Subチーム / 所属部門 / 項目ID / Project名称
 *   ※見出し行が見つからない場合は上記の並びとみなす
 *   ※略称は自動生成するため取り込まない（システム項目IDも自動採番）
 *
 * ■ 取込ルール
 *   - 取り込んだ行はすべて「新しいプロジェクト」として追加する（重複可）
 *   - 顧客・案件・所属部門が空の行は取り込まない（警告を表示）
 *   - 所属部門が部門マスタに無くても取り込む（画面側で警告を表示）
 */
import {
  normalizeKey,
  readSpreadsheetFile,
} from '../Personnel/personnelImport';

/** 一括読み込みで受け取る1件分のプロジェクト情報 */
export interface ProjectImportRow {
  /** 顧客（必須） */
  customer: string;
  /** 案件（必須） */
  caseName: string;
  /** チーム（任意） */
  team: string;
  /** Subチーム（任意） */
  subTeam: string;
  /** 所属部門（必須） */
  department: string;
  /** 項目ID（任意） */
  id: string;
  /** Project名称（任意） */
  name: string;
}

/** 一括読み込みの結果 */
export interface ProjectImportResult {
  /** 取り込み対象になったプロジェクト情報 */
  rows: ProjectImportRow[];
  /** 取り込めなかった行の警告（「n行目：〜」形式） */
  warnings: string[];
  /** 読み取り元の説明（結果メッセージ用。例：'Excel(.xlsx) / シート:Sheet1'） */
  source: string;
}

/** ファイル選択ダイアログで許可する拡張子 */
export const PROJECT_IMPORT_ACCEPT =
  '.xlsx,.xlsm,.xls,.csv,text/csv,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-excel';

/** 画面に表示する形式の説明 */
export const PROJECT_IMPORT_FORMAT_HINT =
  '形式：顧客／案件／チーム／Subチーム／所属部門／項目ID／Project名称（1行目は見出し行）。Excel(.xlsx)・CSV に対応。取り込むと新しいプロジェクトとして追加されます。';

/** 見出し（列名）の候補。表記ゆれを吸収して判定する */
const HEADER_ALIASES: Record<keyof ProjectImportRow, string[]> = {
  customer: ['顧客', '顧客名', 'customer', 'client'],
  caseName: ['案件', '案件名', 'casename', 'case'],
  team: ['チーム', 'team'],
  subTeam: ['subチーム', 'サブチーム', 'subteam'],
  department: ['所属部門', '部門', '部署', 'department', 'dept'],
  id: ['項目id', 'id', 'projectid'],
  name: [
    'project名称',
    'プロジェクト名称',
    'プロジェクト名',
    'project名',
    '名称',
    'name',
    'projectname',
  ],
};

/** 見出し行が見出しと判定されるのに必要な一致数（誤検出を避ける） */
const HEADER_MATCH_MIN = 2;

/** 見出し行を探す範囲（先頭からの行数） */
const HEADER_SEARCH_ROWS = 5;

/** 項目の並び（見出し行が無い場合のフォールバック） */
const FIELD_ORDER: Array<keyof ProjectImportRow> = [
  'customer',
  'caseName',
  'team',
  'subTeam',
  'department',
  'id',
  'name',
];

/** 見出し行から列の対応を判定する（見出し行でなければ null） */
const detectColumns = (
  row: string[] | undefined,
): Record<keyof ProjectImportRow, number> | null => {
  if (!row) return null;
  const found: Partial<Record<keyof ProjectImportRow, number>> = {};

  row.forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (!key) return;
    (Object.keys(HEADER_ALIASES) as Array<keyof ProjectImportRow>).forEach(
      (field) => {
        if (found[field] !== undefined) return;
        if (HEADER_ALIASES[field].some((alias) => normalizeKey(alias) === key)) {
          found[field] = index;
        }
      },
    );
  });

  if (Object.keys(found).length < HEADER_MATCH_MIN) return null;
  const result = {} as Record<keyof ProjectImportRow, number>;
  FIELD_ORDER.forEach((field, index) => {
    result[field] = found[field] ?? index;
  });
  return result;
};

/** 行列を検証してプロジェクト情報の一覧を作る */
const buildRows = (
  matrix: string[][],
  source: string,
): ProjectImportResult => {
  const warnings: string[] = [];
  const rows: ProjectImportRow[] = [];

  // 見出し行を探す（見つからない場合は先頭から FIELD_ORDER の並びとみなす）
  let headerIndex = -1;
  let columns = {} as Record<keyof ProjectImportRow, number>;
  FIELD_ORDER.forEach((field, index) => {
    columns[field] = index;
  });
  for (let i = 0; i < Math.min(matrix.length, HEADER_SEARCH_ROWS); i += 1) {
    const detected = detectColumns(matrix[i]);
    if (detected) {
      headerIndex = i;
      columns = detected;
      break;
    }
  }

  matrix.forEach((row, index) => {
    if (index <= headerIndex) return;
    const lineNo = index + 1;

    const customer = (row[columns.customer] ?? '').trim();
    const caseName = (row[columns.caseName] ?? '').trim();
    const team = (row[columns.team] ?? '').trim();
    const subTeam = (row[columns.subTeam] ?? '').trim();
    const department = (row[columns.department] ?? '').trim();
    const id = (row[columns.id] ?? '').trim();
    const name = (row[columns.name] ?? '').trim();

    // 完全な空行はスキップする
    if (
      !customer &&
      !caseName &&
      !team &&
      !subTeam &&
      !department &&
      !id &&
      !name
    ) {
      return;
    }

    if (!customer) {
      warnings.push(`${lineNo}行目：顧客が空のため取り込みませんでした`);
      return;
    }
    if (!caseName) {
      warnings.push(`${lineNo}行目：案件が空のため取り込みませんでした`);
      return;
    }
    if (!department) {
      warnings.push(`${lineNo}行目：所属部門が空のため取り込みませんでした`);
      return;
    }

    rows.push({ customer, caseName, team, subTeam, department, id, name });
  });

  return { rows, warnings, source };
};

/**
 * プロジェクト情報ファイル（Excel / CSV）を読み取り、取り込み可能な行を返す。
 * 解析に失敗した場合は Error（日本語メッセージ）を投げる。
 */
export const parseProjectFile = async (
  file: File,
): Promise<ProjectImportResult> => {
  const { matrix, source } = await readSpreadsheetFile(file);
  return buildRows(matrix, source);
};
