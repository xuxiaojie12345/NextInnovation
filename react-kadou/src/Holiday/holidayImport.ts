/**
 * 休日情報の一括読み込み（フロント モック実装）
 *
 * ■ 対応ファイル
 *   - Excel (.xlsx / .xlsm) … 要員情報の一括読み込みと同じ読み取り処理を利用
 *   - CSV / タブ区切りテキスト
 *   - Excel (.xls 旧形式) … 非対応（.xlsx か CSV で保存し直してもらう）
 *
 * ■ 想定する列（1行目は見出し行。列順は自由、見出し名で判定する）
 *   日付 / 名称 / 区分
 *   ※日付は YYYY-MM-DD / YYYY/MM/DD / Excel の日付セル（シリアル値）に対応
 *   ※見出し行が見つからない場合は上記の並びとみなす
 *
 * ■ 取込ルール
 *   - 同一日付の既存休日は上書き（名称・区分を更新）
 *   - ファイル内で同一日付が複数ある場合は後ろの行を優先
 *   - 選択中年度以外の日付は取り込まない（警告）
 *   - 区分が空・未知の場合は「会社休日」として取り込む（警告）
 */
import dayjs from 'dayjs';
import { HolidayKind } from '../data/yearStore';
import {
  normalizeKey,
  readSpreadsheetFile,
} from '../Personnel/personnelImport';

/** 一括読み込みで受け取る1件分の休日情報 */
export interface HolidayImportRow {
  /** 日付（'YYYY-MM-DD'） */
  date: string;
  /** 休日名称 */
  name: string;
  /** 区分 */
  kind: HolidayKind;
}

/** 一括読み込みの結果 */
export interface HolidayImportResult {
  /** 取り込み対象になった休日情報（日付は一意） */
  rows: HolidayImportRow[];
  /** 取り込めなかった行の警告（「n行目：〜」形式） */
  warnings: string[];
  /** 読み取り元の説明（結果メッセージ用。例：'Excel(.xlsx) / シート:Sheet1'） */
  source: string;
}

/** ファイル選択ダイアログで許可する拡張子 */
export const HOLIDAY_IMPORT_ACCEPT =
  '.xlsx,.xlsm,.xls,.csv,text/csv,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-excel';

/** 画面に表示する形式の説明 */
export const HOLIDAY_IMPORT_FORMAT_HINT =
  '形式：日付／名称／区分（1行目は見出し行）。日付は YYYY-MM-DD / YYYY/MM/DD、Excel の日付セルに対応。同じ日付は上書きします。';

/** 見出し（列名）の候補。表記ゆれを吸収して判定する */
const HEADER_ALIASES: Record<keyof HolidayImportRow, string[]> = {
  date: ['日付', '休日', '休日付', 'date'],
  name: ['名称', '休日名称', '名前', 'name'],
  kind: ['区分', '種別', 'kind', 'type'],
};

/** 見出し行が見出しと判定されるのに必要な一致数（誤検出を避ける） */
const HEADER_MATCH_MIN = 2;

/** 見出し行を探す範囲（先頭からの行数） */
const HEADER_SEARCH_ROWS = 5;

/** 項目の並び（見出し行が無い場合のフォールバック） */
const FIELD_ORDER: Array<keyof HolidayImportRow> = ['date', 'name', 'kind'];

/** 区分の表記ゆれを吸収する */
const KIND_ALIASES: Record<string, HolidayKind> = {
  祝日: '祝日',
  しゅくじつ: '祝日',
  会社休日: '会社休日',
  companyholiday: '会社休日',
  振替休日: '振替休日',
  代休: '振替休日',
};

/** 文字列の区分を HolidayKind へ変換する（未知は null） */
const parseKind = (raw: string): HolidayKind | null => {
  const key = normalizeKey(raw);
  return key ? KIND_ALIASES[key] ?? null : null;
};

/** Excel の日付シリアル値を 'YYYY-MM-DD' へ変換する */
const parseExcelSerial = (serial: number): string | null => {
  // Excel のシリアル値は 1900-01-01 = 1（1900 年の閏日バグを考慮して基準日を 1899-12-30 にする）
  if (!Number.isFinite(serial) || serial <= 0 || serial > 2958465) return null;
  return dayjs('1899-12-30')
    .add(Math.floor(serial), 'day')
    .format('YYYY-MM-DD');
};

/** 日付セルの値を 'YYYY-MM-DD' へ変換する（解釈できない場合は null） */
const parseDateValue = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;

  // Excel の日付セル（シリアル値）
  if (/^\d+(\.\d+)?$/.test(value)) {
    return parseExcelSerial(Number(value));
  }

  // 時刻や曜日が付いている場合は日付部分だけを使う
  const datePart = value
    .split(/[ T]/)[0]
    .replace(/[（(].*?[)）]/g, '')
    .replace(/年/g, '/')
    .replace(/月/g, '/')
    .replace(/日/g, '')
    .replace(/[.-]/g, '/');

  const matched = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(datePart);
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const parsed = dayjs(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );

  // 存在しない日付（2026/2/30 など）を弾く
  if (
    !parsed.isValid() ||
    parsed.year() !== year ||
    parsed.month() + 1 !== month ||
    parsed.date() !== day
  ) {
    return null;
  }
  return parsed.format('YYYY-MM-DD');
};

/** 見出し行から列の対応を判定する（見出し行でなければ null） */
const detectColumns = (
  row: string[] | undefined,
): Record<keyof HolidayImportRow, number> | null => {
  if (!row) return null;
  const found: Partial<Record<keyof HolidayImportRow, number>> = {};

  row.forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (!key) return;
    (Object.keys(HEADER_ALIASES) as Array<keyof HolidayImportRow>).forEach(
      (field) => {
        if (found[field] !== undefined) return;
        if (HEADER_ALIASES[field].some((alias) => normalizeKey(alias) === key)) {
          found[field] = index;
        }
      },
    );
  });

  if (Object.keys(found).length < HEADER_MATCH_MIN) return null;
  const result = {} as Record<keyof HolidayImportRow, number>;
  FIELD_ORDER.forEach((field, index) => {
    result[field] = found[field] ?? index;
  });
  return result;
};

/** 行列を検証して休日情報の一覧を作る */
const buildRows = (
  matrix: string[][],
  year: number,
  source: string,
): HolidayImportResult => {
  const warnings: string[] = [];
  const rows: HolidayImportRow[] = [];

  // 見出し行を探す（見つからない場合は先頭から FIELD_ORDER の並びとみなす）
  let headerIndex = -1;
  let columns = {} as Record<keyof HolidayImportRow, number>;
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

  /** 日付 → rows のインデックス（ファイル内の重複検出用） */
  const indexByDate = new Map<string, number>();

  matrix.forEach((row, index) => {
    if (index <= headerIndex) return;
    const lineNo = index + 1;

    const rawDate = (row[columns.date] ?? '').trim();
    const name = (row[columns.name] ?? '').trim();
    const rawKind = (row[columns.kind] ?? '').trim();

    // 完全な空行はスキップする
    if (!rawDate && !name && !rawKind) return;

    if (!rawDate) {
      warnings.push(`${lineNo}行目：日付が空のため取り込みませんでした`);
      return;
    }

    const date = parseDateValue(rawDate);
    if (!date) {
      warnings.push(
        `${lineNo}行目：日付「${rawDate}」を解釈できませんでした`,
      );
      return;
    }

    // 選択中年度以外は取り込まない（年度ごとのデータのため）
    if (dayjs(date).year() !== year) {
      warnings.push(
        `${lineNo}行目：${date} は ${year}年度外のため取り込みませんでした`,
      );
      return;
    }

    if (!name) {
      warnings.push(`${lineNo}行目：名称が空のため取り込みませんでした`);
      return;
    }

    // 区分が空・未知の場合は「会社休日」として取り込む
    let kind = parseKind(rawKind);
    if (!kind) {
      kind = '会社休日';
      warnings.push(
        rawKind
          ? `${lineNo}行目：区分「${rawKind}」を認識できないため会社休日として取り込みました`
          : `${lineNo}行目：区分が空のため会社休日として取り込みました`,
      );
    }

    // ファイル内で同じ日付が複数ある場合は後ろの行を優先する
    const duplicate = indexByDate.get(date);
    if (duplicate !== undefined) {
      warnings.push(
        `${lineNo}行目：日付 ${date} が重複しています（後ろの行を優先）`,
      );
      rows[duplicate] = { date, name, kind };
      return;
    }

    indexByDate.set(date, rows.length);
    rows.push({ date, name, kind });
  });

  return { rows, warnings, source };
};

/**
 * 休日情報ファイル（Excel / CSV）を読み取り、取り込み可能な行を返す。
 * 解析に失敗した場合は Error（日本語メッセージ）を投げる。
 */
export const parseHolidayFile = async (
  file: File,
  year: number,
): Promise<HolidayImportResult> => {
  const { matrix, source } = await readSpreadsheetFile(file);
  return buildRows(matrix, year, source);
};
