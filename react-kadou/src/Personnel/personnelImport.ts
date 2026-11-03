/**
 * 要員情報（社員情報）の一括読み込み
 *
 * 「社員情報」の固定テンプレート Excel を取り込み、社員番号で突合して
 * 要員一覧を上書きする。
 *
 * ■ 対応ファイル
 *   - Excel (.xlsx / .xlsm) … ZIP をネイティブ展開してセル値を読み取る（外部ライブラリ不要）
 *   - CSV / タブ区切りテキスト（同じセル位置で読み取る）
 *   - Excel (.xls 旧形式) … 非対応（.xlsx か CSV で保存し直してもらう）
 *
 * ■ 固定テンプレートのレイアウト
 *   3 行目からデータが始まる（1〜2 行目は見出し等の固定行なので読み飛ばす）。
 *   B 列 … 社員番号（B3 が 1 件目）
 *   C 列 … 氏名（C3 が 1 件目）
 *   R 列 … 役割（R3 が 1 件目）
 *   T 列 … 所属（T3 が 1 件目。部門マスタの部門名）
 *
 *   ※見出し名による列判定は行わない（列位置が固定のため）。
 *
 * NOTE: バックエンド実装時は、この parsePersonnelFile() を API 呼び出しに置き換える。
 *       画面側・App 側のインターフェース（PersonnelImportRow）はそのまま利用できる。
 * NOTE: 表形式ファイル（Excel / CSV）の読み取り処理（readSpreadsheetFile）は
 *       プロジェクト情報の一括読み込み（Project/projectImport.ts）と共用する。
 */

/** 一括読み込みで受け取る1件分の社員情報 */
export interface PersonnelImportRow {
  /** 社員番号（必須） */
  employeeNo: string;
  /** 氏名（必須） */
  name: string;
  /**
   * 所属（部門マスタの部門名）。
   * 取込時に E 列×N 列で部門を確定してから設定する（それまでは空）。
   */
  department: string;
  /**
   * E 列【所属部門】（部門マスタの部門別名と照合する）
   */
  departmentAlias?: string;
  /**
   * N 列【労働関係所属地】（部門マスタの拠点と照合する）
   */
  workLocation?: string;
  /** 所属の確定に使った部門ID（部門マスタに一致した場合のみ） */
  departmentId?: string;
  /**
   * E 列×N 列の自動照合で所属が確定したか。
   * true = 自動確定（プレビューではテキスト表示）
   * false/未設定 = 手動選択（プレビューではプルダウン表示を維持）
   */
  departmentAutoMatched?: boolean;
  /** 役割コード（空欄も許容 → 取込時に既存値を保持／新規は「要員」） */
  role: string;
  /** ファイル上の行番号（警告メッセージの表示用） */
  line?: number;
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

/**
 * 固定テンプレートのレイアウト。
 * 列は 0 始まりのインデックス（B=1, C=2, E=4, N=13, R=17）。
 */
export const PERSONNEL_TEMPLATE = {
  /** データが始まる行（1 始まり）。B3 が 1 件目 */
  startRow: 3,
  /** 列位置（0 始まり） */
  columns: {
    employeeNo: 1, // B
    name: 2, // C
    /** E 列：所属部門（部門マスタの「部門別名」と照合） */
    departmentAlias: 4, // E
    /** N 列：労働関係所属地（部門マスタの「拠点」と照合） */
    workLocation: 13, // N
    role: 17, // R
  },
} as const;

/** 画面に表示する形式の説明（固定テンプレート） */
export const PERSONNEL_IMPORT_FORMAT_HINT =
  '固定テンプレート：3行目から 社員番号＝B列／氏名＝C列／所属部門＝E列／労働関係所属地＝N列／役割＝R列 を読み取ります（B3 が1件目）。E列とN列で部門マスタ（部門別名・拠点）を照合して所属を確定します。';

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

/**
 * 要素直下の <t> だけを連結して文字列にする。
 *
 * NOTE: Excel は振り仮名（ふりがな）を <rPh><t>ヤマダ</t></rPh> として
 *       同じ <si> の中に持つ。getElementsByTagName('t') だと <rPh> 内の
 *       <t> も拾ってしまい「山田太郎ヤマダタロウ」になるため、
 *       <rPh>（および <phoneticPr>）配下の <t> は必ず除外する。
 */
const readTextElement = (el: Element): string => {
  // 文字列は <si> 直下の <t>、または <r><t> の 2 パターン
  const direct = Array.from(el.children).filter((c) => {
    const name = c.tagName.toLowerCase();
    return name === 't' || name === 'r';
  });
  if (direct.length === 0) {
    // <si> 直下に <t> が無い場合は従来どおり（注音だけ除外して）連結する
    return readTextExcludingPhonetic(el);
  }
  return direct
    .map((c) =>
      c.tagName.toLowerCase() === 't'
        ? c.textContent ?? ''
        : readTextExcludingPhonetic(c),
    )
    .join('');
};

/** 注音（rPh / phoneticPr）配下の <t> を除いて <t> を連結する */
const readTextExcludingPhonetic = (el: Element): string =>
  Array.from(el.getElementsByTagName('t'))
    .filter((t) => !isInsidePhonetic(t))
    .map((t) => t.textContent ?? '')
    .join('');

/** <rPh> / <phoneticPr> 配下かどうか */
const isInsidePhonetic = (el: Element): boolean => {
  let node: Element | null = el.parentElement;
  while (node) {
    const name = node.tagName.toLowerCase();
    if (name === 'rph' || name === 'phoneticpr') return true;
    node = node.parentElement;
  }
  return false;
};

/** xl/sharedStrings.xml を文字列配列へ変換する（振り仮名は除外する） */
const parseSharedStrings = (xml: string | undefined): string[] => {
  if (!xml) return [];
  const doc = parseXml(xml);
  return Array.from(doc.getElementsByTagName('si')).map(readTextElement);
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
        // セル内文字列。<is> 直下の <t> のみを対象とし、振り仮名（<rPh>）は除外する
        const is = cellEl.getElementsByTagName('is')[0];
        raw = is ? readTextElement(is) : '';
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

/** 行列から固定テンプレートのセル値を取り出す */
const cellAt = (row: string[] | undefined, columnIndex: number): string =>
  (row?.[columnIndex] ?? '').trim();

/**
 * 行列を検証して社員情報の一覧を作る（固定テンプレート）。
 *
 * レイアウト：
 *   3 行目からデータ開始（2 行目までは読み飛ばす）
 *   B 列：社員番号 / C 列：氏名 / R 列：役割 / T 列：所属
 */
const buildRows = (
  matrix: string[][],
  source: string,
): PersonnelImportResult => {
  const warnings: string[] = [];
  const rows: PersonnelImportRow[] = [];
  const { startRow, columns } = PERSONNEL_TEMPLATE;

  // データ行が 1 行も無い（＝テンプレートの形になっていない）場合は明示的にエラー
  if (matrix.length < startRow - 1) {
    throw new Error(
      `テンプレートの形式ではありません。${startRow} 行目からデータを入力してください。`,
    );
  }

  // 3 行目（index 2）以降を読み取る
  for (let index = startRow - 1; index < matrix.length; index += 1) {
    const row = matrix[index];
    const lineNo = index + 1;

    const employeeNo = cellAt(row, columns.employeeNo);
    const name = cellAt(row, columns.name);
    const role = cellAt(row, columns.role);
    const departmentAlias = cellAt(row, columns.departmentAlias);
    const workLocation = cellAt(row, columns.workLocation);

    // 完全な空行はスキップする（テンプレート下部の余白行など）
    if (
      !employeeNo &&
      !name &&
      !role &&
      !departmentAlias &&
      !workLocation
    ) {
      continue;
    }

    if (!employeeNo) {
      warnings.push(
        `${lineNo}行目：B 列（社員番号）が空のため取り込みませんでした`,
      );
      continue;
    }
    if (!name) {
      warnings.push(
        `${lineNo}行目：C 列（氏名）が空のため取り込みませんでした（社員番号 ${employeeNo}）`,
      );
      continue;
    }
    // 所属部門・労働関係所属地は必須（空欄は取り込まない）
    if (!departmentAlias) {
      warnings.push(
        `${lineNo}行目：E 列（所属部門）が空のため取り込みませんでした（社員番号 ${employeeNo}）`,
      );
      continue;
    }
    if (!workLocation) {
      warnings.push(
        `${lineNo}行目：N 列（労働関係所属地）が空のため取り込みませんでした（社員番号 ${employeeNo}）`,
      );
      continue;
    }

    // 所属（department）は E 列×N 列で部門マスタを照合してから確定する。
    // ファイル内の重複はそのまま保持し、行番号を付けてバックエンドで判定させる
    // （docs 8.1：ファイル内重複があればファイル全体を中止する）
    rows.push({
      employeeNo,
      name,
      department: '',
      departmentAlias,
      workLocation,
      role,
      line: lineNo,
    });
  }

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
