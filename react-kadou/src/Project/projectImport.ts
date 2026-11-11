/**
 * プロジェクト情報の一括読み込み（フロント モック実装）
 *
 * ■ 対応ファイル
 *   - Excel (.xlsx / .xlsm) … 要員情報の一括読み込みと同じ読み取り処理を利用
 *   - CSV / タブ区切りテキスト
 *   - Excel (.xls 旧形式) … 非対応（.xlsx か CSV で保存し直してもらう）
 *
 * ■ 想定する列（1行目は見出し行。列順は自由、見出し名で判定する）
 *   顧客 / 案件 / チーム / Subチーム / Subチーム / 略称 / 所属部門 / 項目ID / Project名称
 *   ※4 列目と 5 列目の Subチームのうち、取り込むのは左側（先に見つかった方）のみ。
 *     右側はテンプレート識別用で取込対象外。
 *   ※見出し行が見つからない場合は取込エラー（他画面のテンプレート誤取込を防ぐ）
 *   ※略称は自動生成するため取り込まない（システム項目IDも自動採番）
 *
 * ■ 取込ルール
 *   - 取り込んだ行はすべて「新しいプロジェクト」として追加する（重複可）
 *   - 顧客・案件・所属部門が空の行は取り込まない（警告を表示）
 *   - 所属部門（「所属部門」列）は部門マスタと照合せず、
 *     ファイルに書かれている内容をそのまま登録する
 */
import { normalizeKey, readSpreadsheetFile } from '../Personnel/personnelImport';

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
  /** 所属部門（必須。ファイルの値をそのまま登録する） */
  department: string;
  /** 項目ID（任意） */
  projectCode: string;
  /** Project名称（任意） */
  name: string;
  /** ファイル上の行番号（警告メッセージの表示用） */
  line?: number;
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
  '形式：顧客／案件／チーム／Subチーム／Subチーム／略称／所属部門／項目ID／Project名称（1行目は見出し行）。Excel(.xlsx)・CSV に対応。E 列の Subチームは取込対象外です。「所属部門」は入力どおり登録します。取り込むと新しいプロジェクトとして追加されます。';

/**
 * 取込む項目（列）のキー。行番号 line はファイル上のメタ情報なので列に含めない。
 */
type ProjectImportField = Exclude<keyof ProjectImportRow, 'line'>;

type ProjectImportColumns = Record<ProjectImportField, number>;

type ProjectImportAliases = Record<ProjectImportField, string[]>;

/**
 * 見出し（列名）の候補。表記ゆれを吸収して判定する。
 *
 * NOTE: E 列（2 つ目の Subチーム）はテンプレート識別用の列で、取込対象外。
 *       取込に使う Subチームは D 列（最初に見つかった Subチーム列）のみ。
 */
const HEADER_ALIASES: ProjectImportAliases = {
  customer: ['顧客', '顧客名', 'customer', 'client'],
  caseName: ['案件', '案件名', 'casename', 'case'],
  team: ['チーム', 'team'],
  subTeam: ['subチーム', 'サブチーム', 'subteam'],
  department: ['所属部門', '部門', '部署', 'department', 'dept'],
  projectCode: ['項目id', 'id', 'projectid'],
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
const FIELD_ORDER: ProjectImportField[] = [
  'customer',
  'caseName',
  'team',
  'subTeam',
  'department',
  'projectCode',
  'name',
];

/** 見出し行から列の対応を判定する（見出し行でなければ null） */
const detectColumns = (
  row: string[] | undefined,
): ProjectImportColumns | null => {
  if (!row) return null;
  const found: Partial<Record<ProjectImportField, number>> = {};

  row.forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (!key) return;
    (Object.keys(HEADER_ALIASES) as ProjectImportField[]).forEach(
      (field) => {
        // NOTE: 同じ見出しが複数ある場合（テンプレートの Subチームは D 列と E 列）
        //       は、先に見つかった列（左側）だけを採用する。
        //       → 取込に使うのは D 列の Subチームで、E 列は取込対象外。
        if (found[field] !== undefined) return;
        if (HEADER_ALIASES[field].some((alias) => normalizeKey(alias) === key)) {
          found[field] = index;
        }
      },
    );
  });

  if (Object.keys(found).length < HEADER_MATCH_MIN) return null;
  const result = {} as ProjectImportColumns;
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

  // 見出し行を探す（テンプレートは固定のため、見つからなければエラー）
  let headerIndex = -1;
  let columns = {} as ProjectImportColumns;
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

  // NOTE: 以前は「見出し行が無ければ列順固定として読み込む」フォールバックが
  //       あったが、他のテンプレートの Excel を誤って取り込んでしまうため廃止した。
  if (headerIndex < 0) {
    throw new Error(
      '見出し行を認識できませんでした。1行目が 顧客／案件／チーム／Subチーム／Subチーム／略称／所属部門／項目ID／Project名称 になっているか確認してください。',
    );
  }

  matrix.forEach((row, index) => {
    if (index <= headerIndex) return;
    const lineNo = index + 1;

    const customer = (row[columns.customer] ?? '').trim();
    const caseName = (row[columns.caseName] ?? '').trim();
    const team = (row[columns.team] ?? '').trim();
    const subTeam = (row[columns.subTeam] ?? '').trim();
    const department = (row[columns.department] ?? '').trim();
    const projectCode = (row[columns.projectCode] ?? '').trim();
    const name = (row[columns.name] ?? '').trim();

    // 完全な空行はスキップする
    if (
      !customer &&
      !caseName &&
      !team &&
      !subTeam &&
      !department &&
      !projectCode &&
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

    rows.push({
      customer,
      caseName,
      team,
      subTeam,
      department,
      projectCode,
      name,
      line: lineNo,
    });
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
  // NOTE: シート名で対象シートを選ぶため、テンプレート検証は readXlsx 内で行う。
  const { matrix, source } = await readSpreadsheetFile(file, 'project');
  return buildRows(matrix, source);
};

// ---------------------------------------------------------------------------
// 取り込み時の桁数チェック（画面の入力欄と同じ制限に合わせる）
// ---------------------------------------------------------------------------

/** 取り込み時の桁数チェックで使う上限（画面の入力欄と同じ値） */
export const PROJECT_IMPORT_LIMITS = {
  customer: { max: 100, label: '顧客' },
  caseName: { max: 100, label: '案件' },
  team: { max: 30, label: 'チーム' },
  subTeam: { max: 30, label: 'Subチーム' },
  projectCode: { max: 20, label: '項目ID' },
  name: { max: 30, label: 'Project名称' },
} as const;

/**
 * 取り込み行の桁数を検証する（点【取り込む】時に呼ぶ）。
 *
 * 空欄チェックはプレビュー前に済んでいるため、ここでは
 * 「入力欄と同じ桁数制限」を超えている行だけを返す。
 * 返す値は「5行目：チーム「…」が30文字以内ではありません」形式。
 */
export const validateProjectImportRows = (
  rows: ReadonlyArray<ProjectImportRow>,
): string[] => {
  const problems: string[] = [];

  rows.forEach((row) => {
    const label = row.line ? `${row.line}行目：` : '';
    (
      Object.keys(PROJECT_IMPORT_LIMITS) as Array<keyof typeof PROJECT_IMPORT_LIMITS>
    ).forEach((key) => {
      const { max, label: fieldLabel } = PROJECT_IMPORT_LIMITS[key];
      const value = row[key];
      if (value && value.length > max) {
        problems.push(
          `${label}${fieldLabel}「${value}」が${max}文字以内ではありません`,
        );
      }
    });
  });

  return problems;
};
