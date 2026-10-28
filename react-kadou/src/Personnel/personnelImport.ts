/**
 * 要員情報（社員情報）の一括読み込みファイル解析
 *
 * 「社員情報」の Excel を解析し、社員番号で突合できる形に整える。
 *
 * ■ 対応ファイル
 *   - Excel (.xlsx / .xlsm) … ZIP をネイティブ展開してセル値を読み取る（外部ライブラリ不要）
 *   - CSV / タブ区切りテキスト
 *   - Excel (.xls 旧形式) … 非対応（.xlsx か CSV で保存し直してもらう）
 *
 * ■ 想定する列（1行目は見出し行。列順は自由、見出し名で判定する）
 *   社員番号 / 名前（氏名） / 役割 / 所属（部門）
 *   ※見出し行が見つからない場合は 社員番号, 名前, 役割, 所属 の並びとみなす
 *
 * NOTE: 解析結果は確認後、POST /api/personnel/import に JSON で送信する。
 * NOTE: 表形式ファイル（Excel / CSV）の読み取り処理（readSpreadsheetFile）は
 *       プロジェクト情報の一括読み込み（Project/projectImport.ts）と共用する。
 */

/** 一括読み込みで受け取る1件分の社員情報 */
export interface PersonnelImportRow {
  /** 社員番号（必須） */
  employeeNo: string;
  /** 氏名（必須） */
  name: string;
  /** 所属（部門マスタの部門名。空欄も許容 → 取込時に既存値を保持） */
  department: string;
  /** 役割コード（空欄も許容 → 取込時に既存値を保持／新規は「要員」） */
  role: string;
}

/** 一括読み込みの結果 */
export interface PersonnelImportResult {
  /** 取り込み対象になった社員情報 */
  rows: PersonnelImportRow[];
  /** 取り込めなかった行の警告（「n行目：〜」形式） */
  warnings: string[];
  /** 読み取り元の説明（結果メッセージ用。例：'Excel(.xlsx) / シート:Sheet1'） */
  source: string;
}

/** ファイル選択ダイアログで許可する拡張子 */
export const PERSONNEL_IMPORT_ACCEPT =
  '.xlsx,.xlsm,.xls,.csv,text/csv,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-excel';

/** 画面に表示する形式の説明 */
export const PERSONNEL_IMPORT_FORMAT_HINT =
  '形式：社員番号／名前／役割／所属（1行目は見出し行）。Excel(.xlsx)・CSV に対応。同じ社員番号は上書きします。';

/** 見出し（列名）の候補。表記ゆれを吸収して判定する */
const HEADER_ALIASES: Record<keyof PersonnelImportRow, string[]> = {
  employeeNo: ['社員番号', '社員no', '社員コード', 'employeeno', 'employeenumber'],
  name: ['名前', '氏名', 'namae', 'name'],
  role: ['役割', 'ロール', 'role'],
  department: ['所属', '部門', '部署', 'department', 'dept'],
};

/** 見出し行が見出しと判定されるのに必要な一致数（誤検出を避ける） */
const HEADER_MATCH_MIN = 2;

/** 見出し行を探す範囲（先頭からの行数） */
const HEADER_SEARCH_ROWS = 5;

// ---------------------------------------------------------------------------
// 文字列ユーティリティ
// ---------------------------------------------------------------------------

/** 全角英数字・全角スペースを半角へ寄せる */
const toHalfWidth = (value: string): string =>
  value
    .replace(/[\uFF01-\uFF5E]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, ' ');

/** 見出し比較用の正規化（半角化・小文字化・空白／括弧書きの除去） */
export const normalizeKey = (value: string): string =>
  toHalfWidth(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（(].*?[)）]/g, '');

/** セル値を正規化する（全角スペース除去・前後空白除去・数値の ".0" 除去） */
const normalizeCellValue = (raw: string): string => {
  const value = raw.replace(/\u00a0/g, ' ').trim();
  // Excel が数値セルを "10001.0" のように返す場合があるため整数表記へ寄せる
  return /^-?\d+\.0+$/.test(value) ? value.replace(/\.0+$/, '') : value;
};

// ---------------------------------------------------------------------------
// CSV / 区切りテキスト
// ---------------------------------------------------------------------------

/** 1行を区切り文字で分割する（ダブルクォート対応） */
const splitDelimitedLine = (line: string, delimiter: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
};

/** 区切り文字を推定する（先頭行の出現数が多いもの） */
const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  const counts: Array<[string, number]> = [
    ['\t', (firstLine.match(/\t/g) ?? []).length],
    [',', (firstLine.match(/,/g) ?? []).length],
    [';', (firstLine.match(/;/g) ?? []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
};

/** CSV / タブ区切りテキストを行列へ変換する */
const parseDelimitedText = (text: string): string[][] => {
  const body = text.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(body);
  return body
    .split(/\r?\n/)
    .map((line) => splitDelimitedLine(line, delimiter))
    .map((cells) => cells.map(normalizeCellValue));
};

// ---------------------------------------------------------------------------
// Excel (.xlsx) 読み取り：ZIP 展開 + XML 解析（外部ライブラリなし）
// ---------------------------------------------------------------------------

interface ZipEntry {
  name: string;
  /** 0 = 無圧縮 / 8 = deflate */
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;

/** End of Central Directory レコードの位置を末尾から探す */
const findEndOfCentralDirectory = (view: DataView): number => {
  const min = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= min; i -= 1) {
    if (view.getUint32(i, true) === SIG_EOCD) return i;
  }
  return -1;
};

/** ZIP のセントラルディレクトリからエントリ一覧を得る（ZIP64 は非対応） */
const listZipEntries = (view: DataView): ZipEntry[] => {
  const eocd = findEndOfCentralDirectory(view);
  if (eocd < 0) {
    throw new Error('Excel ファイルとして認識できませんでした。');
  }
  const entryCount = view.getUint16(eocd + 10, true);
  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntry[] = [];
  let offset = view.getUint32(eocd + 16, true);

  for (let i = 0; i < entryCount; i += 1) {
    if (offset + 46 > view.byteLength) break;
    if (view.getUint32(offset, true) !== SIG_CENTRAL) break;
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const nameBytes = new Uint8Array(
      view.buffer,
      view.byteOffset + offset + 46,
      nameLength,
    );
    entries.push({
      name: decoder.decode(nameBytes),
      method: view.getUint16(offset + 10, true),
      compressedSize: view.getUint32(offset + 20, true),
      localHeaderOffset: view.getUint32(offset + 42, true),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

/** raw deflate を展開する（ブラウザ標準の DecompressionStream を利用） */
const inflateRaw = async (data: Uint8Array): Promise<Uint8Array> => {
  const Ctor = (
    globalThis as {
      DecompressionStream?: new (format: string) => {
        readable: ReadableStream<Uint8Array>;
        writable: WritableStream<Uint8Array>;
      };
    }
  ).DecompressionStream;

  if (!Ctor) {
    throw new Error(
      'お使いの環境は .xlsx の読み込みに未対応です。CSV で保存し直してください。',
    );
  }

  const stream = new Ctor('deflate-raw');
  const writer = stream.writable.getWriter();
  void writer.write(data);
  void writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }

  const out = new Uint8Array(total);
  let position = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, position);
    position += chunk.length;
  });
  return out;
};

/** ZIP エントリをテキストとして取り出す */
const readZipEntryText = async (
  bytes: Uint8Array,
  view: DataView,
  entry: ZipEntry,
): Promise<string> => {
  const nameLength = view.getUint16(entry.localHeaderOffset + 26, true);
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
  const start = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const compressed = bytes.subarray(start, start + entry.compressedSize);

  if (entry.method === 0) return new TextDecoder('utf-8').decode(compressed);
  if (entry.method !== 8) {
    throw new Error('Excel 内に未対応の圧縮形式が含まれています。');
  }
  return new TextDecoder('utf-8').decode(await inflateRaw(compressed));
};

/** XML 文字列を Document へ変換する */
const parseXml = (xml: string): Document => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Excel の内容を解析できませんでした。');
  }
  return doc;
};

/** xl/sharedStrings.xml を文字列配列へ変換する */
const parseSharedStrings = (xml: string | undefined): string[] => {
  if (!xml) return [];
  const doc = parseXml(xml);
  return Array.from(doc.getElementsByTagName('si')).map((si) =>
    Array.from(si.getElementsByTagName('t'))
      .map((t) => t.textContent ?? '')
      .join(''),
  );
};

/** セル参照（例 "C12"）から 0 始まりの列番号を得る */
const columnIndexOfRef = (ref: string): number => {
  const letters = /^([A-Za-z]+)/.exec(ref)?.[1]?.toUpperCase() ?? '';
  let index = 0;
  for (const ch of letters) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index - 1;
};

/** シート XML を行列へ変換する */
const parseSheet = (xml: string, sharedStrings: string[]): string[][] => {
  const doc = parseXml(xml);
  const rows: string[][] = [];

  Array.from(doc.getElementsByTagName('row')).forEach((rowEl, fallbackIndex) => {
    const rowNumber = Number(rowEl.getAttribute('r') ?? fallbackIndex + 1);
    const cells: string[] = [];

    Array.from(rowEl.getElementsByTagName('c')).forEach((cellEl, cellIndex) => {
      const ref = cellEl.getAttribute('r') ?? '';
      const columnIndex = ref ? columnIndexOfRef(ref) : cellIndex;
      const type = cellEl.getAttribute('t');
      let raw = '';

      if (type === 's') {
        // 共有文字列（sharedStrings）への参照
        const index = Number(cellEl.getElementsByTagName('v')[0]?.textContent ?? '');
        raw = Number.isInteger(index) ? sharedStrings[index] ?? '' : '';
      } else if (type === 'inlineStr') {
        raw = Array.from(cellEl.getElementsByTagName('t'))
          .map((t) => t.textContent ?? '')
          .join('');
      } else {
        raw = cellEl.getElementsByTagName('v')[0]?.textContent ?? '';
      }

      cells[columnIndex] = normalizeCellValue(raw);
    });

    // 末尾の空セルは落としておく
    while (cells.length > 0 && (cells[cells.length - 1] ?? '') === '') {
      cells.pop();
    }
    rows[rowNumber - 1] = cells;
  });

  // 空行で抜けた部分を空配列で埋める
  for (let i = 0; i < rows.length; i += 1) {
    if (!rows[i]) rows[i] = [];
  }
  return rows;
};

/** 読み取り対象のシート（1枚目）を選ぶ */
const pickSheetEntry = (entries: ZipEntry[]): ZipEntry | undefined =>
  entries.find((e) => e.name === 'xl/worksheets/sheet1.xml') ??
  entries.find((e) => /^xl\/worksheets\/[^/]+\.xml$/i.test(e.name));

/** シート名（結果表示用）を workbook.xml から取得する */
const readFirstSheetName = (xml: string | undefined): string => {
  if (!xml) return '';
  try {
    const doc = parseXml(xml);
    return doc.getElementsByTagName('sheet')[0]?.getAttribute('name') ?? '';
  } catch {
    return '';
  }
};

/** .xlsx を読み取って行列へ変換する */
const readXlsx = async (
  buffer: ArrayBuffer,
): Promise<{ matrix: string[][]; source: string }> => {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const entries = listZipEntries(view);

  const sheetEntry = pickSheetEntry(entries);
  if (!sheetEntry) {
    throw new Error('Excel にシートが見つかりませんでした。');
  }

  const sharedEntry = entries.find((e) => e.name === 'xl/sharedStrings.xml');
  const workbookEntry = entries.find((e) => e.name === 'xl/workbook.xml');

  const [sheetXml, sharedXml, workbookXml] = await Promise.all([
    readZipEntryText(bytes, view, sheetEntry),
    sharedEntry ? readZipEntryText(bytes, view, sharedEntry) : Promise.resolve(undefined),
    workbookEntry ? readZipEntryText(bytes, view, workbookEntry) : Promise.resolve(undefined),
  ]);

  const matrix = parseSheet(sheetXml, parseSharedStrings(sharedXml));
  const sheetName = readFirstSheetName(workbookXml);
  return {
    matrix,
    source: sheetName ? `Excel(.xlsx) / シート：${sheetName}` : 'Excel(.xlsx)',
  };
};

// ---------------------------------------------------------------------------
// 行列 → 社員情報
// ---------------------------------------------------------------------------

/** 見出し行から列の対応を判定する（見出し行でなければ null） */
const detectColumns = (
  row: string[] | undefined,
): Record<keyof PersonnelImportRow, number> | null => {
  if (!row) return null;
  const found: Partial<Record<keyof PersonnelImportRow, number>> = {};

  row.forEach((cell, index) => {
    const key = normalizeKey(cell);
    if (!key) return;
    (Object.keys(HEADER_ALIASES) as Array<keyof PersonnelImportRow>).forEach(
      (field) => {
        if (found[field] !== undefined) return;
        if (HEADER_ALIASES[field].some((alias) => normalizeKey(alias) === key)) {
          found[field] = index;
        }
      },
    );
  });

  if (Object.keys(found).length < HEADER_MATCH_MIN) return null;
  // 見つからなかった列は「社員番号, 名前, 役割, 所属」の並びで補完する
  const fallback: Array<keyof PersonnelImportRow> = [
    'employeeNo',
    'name',
    'role',
    'department',
  ];
  const result = {} as Record<keyof PersonnelImportRow, number>;
  fallback.forEach((field, index) => {
    result[field] = found[field] ?? index;
  });
  return result;
};

/** 行列を検証して社員情報の一覧を作る */
const buildRows = (
  matrix: string[][],
  source: string,
): PersonnelImportResult => {
  const warnings: string[] = [];
  const rows: PersonnelImportRow[] = [];

  // 見出し行を探す（見つからない場合は先頭から 社員番号/名前/役割/所属 の並びとみなす）
  let headerIndex = -1;
  let columns: Record<keyof PersonnelImportRow, number> = {
    employeeNo: 0,
    name: 1,
    role: 2,
    department: 3,
  };
  for (let i = 0; i < Math.min(matrix.length, HEADER_SEARCH_ROWS); i += 1) {
    const detected = detectColumns(matrix[i]);
    if (detected) {
      headerIndex = i;
      columns = detected;
      break;
    }
  }

  /** 社員番号 → rows のインデックス（ファイル内の重複検出用） */
  const indexByNo = new Map<string, number>();

  matrix.forEach((row, index) => {
    if (index <= headerIndex) return;
    const lineNo = index + 1;

    const employeeNo = (row[columns.employeeNo] ?? '').trim();
    const name = (row[columns.name] ?? '').trim();
    const role = (row[columns.role] ?? '').trim();
    const department = (row[columns.department] ?? '').trim();

    // 完全な空行はスキップする
    if (!employeeNo && !name && !role && !department) return;

    if (!employeeNo) {
      warnings.push(`${lineNo}行目：社員番号が空のため取り込みませんでした`);
      return;
    }
    if (!name) {
      warnings.push(
        `${lineNo}行目：名前が空のため取り込みませんでした（社員番号 ${employeeNo}）`,
      );
      return;
    }

    // ファイル内で同じ社員番号が複数ある場合は後ろの行を優先する
    const duplicate = indexByNo.get(employeeNo);
    if (duplicate !== undefined) {
      warnings.push(
        `${lineNo}行目：社員番号 ${employeeNo} が重複しています（後ろの行を優先）`,
      );
      rows[duplicate] = { employeeNo, name, department, role };
      return;
    }

    indexByNo.set(employeeNo, rows.length);
    rows.push({ employeeNo, name, department, role });
  });

  return { rows, warnings, source };
};

// ---------------------------------------------------------------------------
// エントリポイント
// ---------------------------------------------------------------------------

/**
 * 表形式ファイル（Excel / CSV）を読み取り、セルの行列と読み取り元を返す。
 * ※要員情報・プロジェクト情報の一括読み込みで共用する。
 */
export const readSpreadsheetFile = async (
  file: File,
): Promise<{ matrix: string[][]; source: string }> => {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xlsm')) {
    return readXlsx(await file.arrayBuffer());
  }

  if (fileName.endsWith('.xls')) {
    throw new Error(
      '.xls（旧形式）は未対応です。Excel で「.xlsx」または「CSV UTF-8」として保存し直してください。',
    );
  }

  // CSV / タブ区切りテキスト
  return { matrix: parseDelimitedText(await file.text()), source: 'CSV' };
};

/**
 * 社員情報ファイル（Excel / CSV）を読み取り、取り込み可能な行を返す。
 * 解析に失敗した場合は Error（日本語メッセージ）を投げる。
 */
export const parsePersonnelFile = async (
  file: File,
): Promise<PersonnelImportResult> => {
  const { matrix, source } = await readSpreadsheetFile(file);
  return buildRows(matrix, source);
};

/** 取り込み前後の増減（追加・上書き件数）を数える */
export const countPersonnelImport = (
  current: ReadonlyArray<{ employeeNo: string }>,
  rows: ReadonlyArray<PersonnelImportRow>,
): { added: number; updated: number } => {
  const existing = new Set(current.map((p) => p.employeeNo));
  let added = 0;
  let updated = 0;
  rows.forEach((row) => {
    if (existing.has(row.employeeNo)) updated += 1;
    else added += 1;
  });
  return { added, updated };
};
