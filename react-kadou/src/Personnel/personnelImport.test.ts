/**
 * 要員情報の一括読み込み（Excel 解析）のテスト
 *
 * NOTE: .xlsx は ZIP + XML なので、テスト用に最小構成の xlsx バイト列を組み立てて
 *       parsePersonnelFile() を通して検証する（DOMParser / File は jsdom で利用可能）。
 */
import { describe, expect, it } from '@jest/globals';
import {
  normalizeKey,
  parsePersonnelFile,
  validatePersonnelImportRows,
} from './personnelImport';

// ---------------------------------------------------------------------------
// 最小構成の .xlsx（無圧縮 ZIP）を組み立てるヘルパー
// ---------------------------------------------------------------------------

// NOTE: jsdom 環境では TextEncoder が無いため、自前で UTF-8 へ変換する
const utf8 = (value: string): Uint8Array => {
  const out: number[] = [];
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      out.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return Uint8Array.from(out);
};

// NOTE: jsdom 環境では TextDecoder が無いため、UTF-8 デコーダを補う
if (typeof globalThis.TextDecoder === 'undefined') {
  class Utf8Decoder {
    decode(bytes: Uint8Array): string {
      let out = '';
      let i = 0;
      while (i < bytes.length) {
        const b = bytes[i];
        if (b < 0x80) {
          out += String.fromCharCode(b);
          i += 1;
        } else if (b < 0xe0) {
          out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
          i += 2;
        } else if (b < 0xf0) {
          out += String.fromCharCode(
            ((b & 0x0f) << 12) |
              ((bytes[i + 1] & 0x3f) << 6) |
              (bytes[i + 2] & 0x3f),
          );
          i += 3;
        } else {
          const code =
            ((b & 0x07) << 18) |
            ((bytes[i + 1] & 0x3f) << 12) |
            ((bytes[i + 2] & 0x3f) << 6) |
            (bytes[i + 3] & 0x3f);
          out += String.fromCodePoint(code);
          i += 4;
        }
      }
      return out;
    }
  }
  (globalThis as unknown as { TextDecoder: unknown }).TextDecoder = Utf8Decoder;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

interface Entry {
  name: string;
  data: Uint8Array;
}

/** 無圧縮（method=0）ZIP を生成する */
const buildZip = (entries: Entry[]): Uint8Array => {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = utf8(entry.name);
    const crc = crc32(entry.data);

    const local = new Uint8Array(30 + nameBytes.length + entry.data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // method = 0（無圧縮）
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, entry.data.length, true);
    lv.setUint32(22, entry.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(entry.data, 30 + nameBytes.length);
    locals.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true); // method = 0
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);

    offset += local.length;
  });

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const total =
    locals.reduce((sum, l) => sum + l.length, 0) + centralSize + eocd.length;
  const out = new Uint8Array(total);
  let pos = 0;
  locals.forEach((l) => {
    out.set(l, pos);
    pos += l.length;
  });
  centrals.forEach((c) => {
    out.set(c, pos);
    pos += c.length;
  });
  out.set(eocd, pos);
  return out;
};

/** 共有文字列 + シートから .xlsx の File 相当オブジェクトを作る */
const makeXlsxFile = (
  sharedStringsXml: string,
  sheetXml: string,
  fileName = 'test.xlsx',
): File => {
  const zip = buildZip([
    {
      name: 'xl/workbook.xml',
      // NOTE: 要員情報の一括読み込みはシート名に「全員情報」を含むシートを読む
      //       （IMPORT_SHEET_RULES.personnel）。テスト用フィクスチャも合わせる。
      data: utf8(
        '<workbook><sheets><sheet name="全員情報"/></sheets></workbook>',
      ),
    },
    { name: 'xl/sharedStrings.xml', data: utf8(sharedStringsXml) },
    { name: 'xl/worksheets/sheet1.xml', data: utf8(sheetXml) },
  ]);
  // NOTE: jsdom の File は arrayBuffer() を持たないため、
  //       readSpreadsheetFile() が使う name / arrayBuffer / text だけを実装する
  return {
    name: fileName,
    arrayBuffer: async () =>
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength),
    text: async () => '',
  } as unknown as File;
};

/**
 * セル配置を指定してシート XML を作る。
 * cells: { 'B3': sharedStringIndex, 'C3': ... } の形で指定する。
 */
const sheetFromCells = (cells: Record<string, string>): string => {
  const byRow = new Map<
    number,
    Array<{ col: number; ref: string; v: string }>
  >();
  Object.entries(cells).forEach(([ref, v]) => {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!m) return;
    const row = Number(m[2]);
    let col = 0;
    for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
    col -= 1;
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)!.push({ col, ref, v });
  });
  const rows = [...byRow.entries()].sort((a, b) => a[0] - b[0]);
  return `<worksheet><sheetData>${rows
    .map(
      ([rowNum, list]) =>
        `<row r="${rowNum}">${list
          .sort((a, b) => a.col - b.col)
          .map((c) => `<c r="${c.ref}" t="s"><v>${c.v}</v></c>`)
          .join('')}</row>`,
    )
    .join('')}</sheetData></worksheet>`;
};

/** 共有文字列 XML を作る */
const sharedStrings = (items: string[]): string =>
  `<sst>${items.map((i) => `<si>${i}</si>`).join('')}</sst>`;

describe('normalizeKey', () => {
  it('全角括弧書きを除去する', () => {
    expect(normalizeKey('氏名（フリガナ）')).toBe('氏名');
    expect(normalizeKey(' 社員 番号 ')).toBe('社員番号');
    expect(normalizeKey('ＥＭＰＬＯＹＥＥＮＯ')).toBe('employeeno');
  });
});

describe('parsePersonnelFile（固定テンプレート B3/C3/E3/N3/R3）', () => {
  it('3行目の B/C/E/N/R から1件目を読み取る', async () => {
    const strings = sharedStrings([
      '<t>10001</t>',
      '<t>山田 太郎</t>',
      '<t>システム開発部</t>',
      '<t>T01</t>',
      '<t>東京</t>',
    ]);
    // B3=0, C3=1, E3=2, R3=3, N3=4
    const sheet = sheetFromCells({
      B3: '0',
      C3: '1',
      E3: '2',
      R3: '3',
      N3: '4',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      employeeNo: '10001',
      name: '山田 太郎',
      role: 'T01',
      departmentAlias: 'システム開発部',
      workLocation: '東京',
      line: 3,
    });
  });

  it('1〜2行目は読み飛ばし、B4 以降を続きとして読み取る', async () => {
    const strings = sharedStrings([
      '<t>見出し</t>',
      '<t>10002</t>',
      '<t>佐藤 花子</t>',
      '<t>T02</t>',
      '<t>営業部</t>',
      '<t>大阪</t>',
    ]);
    const sheet = sheetFromCells({
      A1: '0',
      B3: '1',
      C3: '2',
      R3: '3',
      E3: '4',
      N3: '5',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].employeeNo).toBe('10002');
    expect(result.rows[0].line).toBe(3);
  });

  it('Excel の振り仮名（<rPh>）を名前に混入させない', async () => {
    const strings = sharedStrings([
      '<t>10001</t>',
      // 漢字 + 振り仮名（実 Excel と同じ構造）
      '<t>山田 太郎</t><rPh sb="0" eb="4"><t>ヤマダ タロウ</t></rPh>',
      '<t>T01</t>',
      '<t>開発部</t>',
      '<t>東京</t>',
    ]);
    const sheet = sheetFromCells({
      B3: '0',
      C3: '1',
      R3: '2',
      E3: '3',
      N3: '4',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].employeeNo).toBe('10001');
    expect(result.rows[0].name).toBe('山田 太郎');
  });

  it('E列（所属部門）が空の行は取り込まず警告する（所属は必須）', async () => {
    const strings = sharedStrings([
      '<t>10003</t>',
      '<t>鈴木 一郎</t>',
      '<t>T03</t>',
      '<t>東京</t>',
    ]);
    // E3 は空（セル自体を置かない）
    const sheet = sheetFromCells({
      B3: '0',
      C3: '1',
      R3: '2',
      N3: '3',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('E 列（所属部門）が空');
    expect(result.warnings[0]).toContain('10003');
  });

  it('N列（労働関係所属地）が空の行は取り込まず警告する', async () => {
    const strings = sharedStrings([
      '<t>10006</t>',
      '<t>田中 次郎</t>',
      '<t>T06</t>',
      '<t>品質管理部</t>',
    ]);
    // N3 は空
    const sheet = sheetFromCells({
      B3: '0',
      C3: '1',
      R3: '2',
      E3: '3',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(0);
    expect(result.warnings[0]).toContain('N 列（労働関係所属地）が空');
  });

  it('C列（氏名）が空の行は取り込まず警告する', async () => {
    const strings = sharedStrings([
      '<t>10004</t>',
      '<t>T04</t>',
      '<t>品質管理部</t>',
      '<t>東京</t>',
    ]);
    const sheet = sheetFromCells({
      B3: '0',
      R3: '1',
      E3: '2',
      N3: '3',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(0);
    expect(result.warnings[0]).toContain('C 列（氏名）が空');
  });

  it('B/C/E/N/R が全て空の行はスキップする（警告なし）', async () => {
    const strings = sharedStrings(['<t>10005</t>', '<t>高橋 美咲</t>']);
    const sheet = sheetFromCells({
      B3: '0',
      C3: '1',
    });

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(1); // E列が空のため1件警告
  });
});

describe('validatePersonnelImportRows（取り込み時の桁数チェック）', () => {
  const base = {
    employeeNo: '10001',
    name: '山田 太郎',
    department: 'システム開発部',
    role: 'T01',
    line: 3,
  };

  it('制限内なら空配列を返す', () => {
    expect(
      validatePersonnelImportRows([
        base,
        { ...base, employeeNo: '99999', role: 'ABCDEF', line: 4 },
      ]),
    ).toEqual([]);
  });

  it('役割が6桁を超える行を検出する', () => {
    const problems = validatePersonnelImportRows([
      { ...base, role: 'ABCDEFG' },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('3行目');
    expect(problems[0]).toContain('役割');
    expect(problems[0]).toContain('6桁以内の半角英数字');
  });

  it('全角の役割を検出する（半角英数字のみ許可）', () => {
    const problems = validatePersonnelImportRows([
      { ...base, role: 'Ｔ１１Ｅ０３' },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('役割');
  });

  it('役割が空欄ならエラーにしない（取込時に既存値を保持）', () => {
    expect(validatePersonnelImportRows([{ ...base, role: '' }])).toEqual([]);
  });

  it('社員番号が5桁を超える・数字以外の行を検出する', () => {
    const problems = validatePersonnelImportRows([
      { ...base, employeeNo: '123456' },
      { ...base, employeeNo: 'A0001', line: 4 },
    ]);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('社員番号');
    expect(problems[1]).toContain('4行目');
  });

  it('名前が20文字を超える行を検出する', () => {
    const problems = validatePersonnelImportRows([
      { ...base, name: 'あ'.repeat(21) },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('名前');
    expect(problems[0]).toContain('20文字以内');
  });
});
