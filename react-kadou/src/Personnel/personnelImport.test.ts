/**
 * 要員情報の一括読み込み（Excel 解析）のテスト
 *
 * NOTE: .xlsx は ZIP + XML なので、テスト用に最小構成の xlsx バイト列を組み立てて
 *       parsePersonnelFile() を通して検証する（DOMParser / File は jsdom で利用可能）。
 */
import { describe, expect, it } from '@jest/globals';
import { normalizeKey, parsePersonnelFile } from './personnelImport';

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
      data: utf8(
        '<workbook><sheets><sheet name="Sheet1"/></sheets></workbook>',
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

/** 見出し行 + データ行を持つシート XML を作る（全セル共有文字列参照） */
const sheetWithRows = (rows: string[][]): string =>
  `<worksheet><sheetData>${rows
    .map(
      (cells, r) =>
        `<row r="${r + 1}">${cells
          .map(
            (cell, c) =>
              `<c r="${String.fromCharCode(65 + c)}${
                r + 1
              }" t="s"><v>${cell}</v></c>`,
          )
          .join('')}</row>`,
    )
    .join('')}</sheetData></worksheet>`;

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

describe('parsePersonnelFile', () => {
  it('Excel の振り仮名（<rPh>）を名前に混入させない', async () => {
    const strings = sharedStrings([
      '<t>社員番号</t>',
      '<t>名前</t>',
      '<t>役割</t>',
      '<t>所属</t>',
      '<t>10001</t>',
      // 漢字 + 振り仮名（実 Excel と同じ構造）
      '<t>山田 太郎</t><rPh sb="0" eb="4"><t>ヤマダ タロウ</t></rPh>',
      '<t>T01</t>',
      '<t>開発部</t>',
    ]);
    const sheet = sheetWithRows([
      ['0', '1', '2', '3'],
      ['4', '5', '6', '7'],
    ]);

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].employeeNo).toBe('10001');
    expect(result.rows[0].name).toBe('山田 太郎');
  });

  it('振り仮名の無い名前はそのまま取り込む', async () => {
    const strings = sharedStrings([
      '<t>社員番号</t>',
      '<t>名前</t>',
      '<t>役割</t>',
      '<t>所属</t>',
      '<t>10002</t>',
      '<t>佐藤 花子</t>',
      '<t>T02</t>',
      '<t>営業部</t>',
    ]);
    const sheet = sheetWithRows([
      ['0', '1', '2', '3'],
      ['4', '5', '6', '7'],
    ]);

    const result = await parsePersonnelFile(makeXlsxFile(strings, sheet));

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('佐藤 花子');
  });
});
