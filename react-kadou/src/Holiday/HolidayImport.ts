import dayjs from "dayjs";
import {
  normalizeKey,
  readSpreadsheetFile,
} from "../Personnel/personnelImport";
import {
  HolidayImportResult,
  HolidayImportRow,
  HolidayKind,
} from "./HolidaySettingMode";
import { HEADER_ALIASES } from "../constants/options";
import { messageInfo } from "../constants/messages";

/** 見出し行が見出しと判定されるのに必要な一致数（誤検出を避ける） */
const HEADER_MATCH_MIN = 2;

/** 見出し行を探す範囲（先頭からの行数） */
const HEADER_SEARCH_ROWS = 5;

/** 項目の並び（見出し行が無い場合のフォールバック） */
const FIELD_ORDER: Array<keyof HolidayImportRow> = ["date"];

/** 区分の表記ゆれを吸収する */
const KIND_ALIASES: Record<string, HolidayKind> = {
  祝日: "祝日",
  しゅくじつ: "祝日",
  会社休日: "会社休日",
  companyholiday: "会社休日",
  振替休日: "振替休日",
  代休: "振替休日",
};

/** 文字列の区分を HolidayKind へ変換する（未知は null） */
const parseKind = (raw: string): HolidayKind | null => {
  const key = normalizeKey(raw);
  return key ? (KIND_ALIASES[key] ?? null) : null;
};

/** Excel の日付シリアル値を 'YYYY-MM-DD' へ変換する */
const parseExcelSerial = (serial: number): string | null => {
  // Excel のシリアル値は 1900-01-01 = 1（1900 年の閏日バグを考慮して基準日を 1899-12-30 にする）
  if (!Number.isFinite(serial) || serial <= 0 || serial > 2958465) return null;
  return dayjs("1899-12-30")
    .add(Math.floor(serial), "day")
    .format("YYYY-MM-DD");
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
    .replace(/[（(].*?[)）]/g, "")
    .replace(/年/g, "/")
    .replace(/月/g, "/")
    .replace(/日/g, "")
    .replace(/[.-]/g, "/");

  const matched = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(datePart);
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const parsed = dayjs(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
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
  return parsed.format("YYYY-MM-DD");
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
        if (
          HEADER_ALIASES[field].some((alias) => normalizeKey(alias) === key)
        ) {
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
  const error: string[] = [];
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

    const rawDate = (row[columns.date] ?? "").trim();

    // 完全な空行はスキップする
    if (!rawDate) return;

    if (!rawDate) {
      warnings.push(messageInfo("I_KADOU_019", [lineNo]));
      return;
    }

    const date = parseDateValue(rawDate);
    if (!date) {
      warnings.push(messageInfo("I_KADOU_020", [lineNo, rawDate]));
      return;
    }

    // ファイル内で同じ日付が複数ある場合は後ろの行を優先する
    const duplicate = indexByDate.get(date);
    if (duplicate !== undefined) {
      error.push(messageInfo("E_KADOU_055", [lineNo, date]));
      rows[duplicate] = { date };
      return;
    }

    indexByDate.set(date, rows.length);
    rows.push({ date });
  });

  return { rows, warnings, error, source };
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
