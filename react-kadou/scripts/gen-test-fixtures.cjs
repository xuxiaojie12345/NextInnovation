/**
 * 検証用の .xlsx / .csv を生成する開発補助スクリプト（一時ファイル）
 *   node scripts/gen-test-fixtures.cjs
 * 出力先: <OS temp>/ni-personnel-fixtures/
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const makeZip = (files) => {
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((file) => {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const data = Buffer.from(file.data, 'utf8');
    const compressed = zlib.deflateRawSync(data);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  });

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuf, eocd]);
};

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const sharedStrings = [
  '社員番号', '名前', '役割', '所属',
  '田中 太郎', 'T11E03', '第一開発部',
  '小林 沙耶',
  '一括 太郎', 'T01E01', '第三開発部',
  '第二開発部',
  '未登録 花子', 'T01E03', '第四開発部',
];

const sst = `${XML_DECL}<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">${sharedStrings
  .map((s) => `<si><t>${s}</t></si>`)
  .join('')}</sst>`;

const sheet = `${XML_DECL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`
  + '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>'
  // 既存（上書き）
  + '<row r="2"><c r="A2"><v>10001</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c><c r="D2" t="s"><v>6</v></c></row>'
  // 既存（役割・所属が空 → 既存値を保持）
  + '<row r="3"><c r="A3"><v>10009</v></c><c r="B3" t="s"><v>7</v></c></row>'
  // 新規
  + '<row r="4"><c r="A4"><v>90001</v></c><c r="B4" t="s"><v>8</v></c><c r="C4" t="s"><v>9</v></c><c r="D4" t="s"><v>10</v></c></row>'
  // 名前が空 → 取込対象外
  + '<row r="5"><c r="A5"><v>90002</v></c><c r="C5" t="s"><v>9</v></c><c r="D5" t="s"><v>11</v></c></row>'
  // 空行 → スキップ
  + '<row r="6"></row>'
  // 新規（部門マスタに無い所属）
  + '<row r="7"><c r="A7"><v>90003</v></c><c r="B7" t="s"><v>12</v></c><c r="C7" t="s"><v>13</v></c><c r="D7" t="s"><v>14</v></c></row>'
  + '</sheetData></worksheet>';

const workbook = `${XML_DECL}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="社員情報" sheetId="1" r:id="rId1"/></sheets></workbook>`;
const workbookRels = `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`;
const rootRels = `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
const contentTypes = `${XML_DECL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`;

const xlsx = makeZip([
  { name: '[Content_Types].xml', data: contentTypes },
  { name: '_rels/.rels', data: rootRels },
  { name: 'xl/workbook.xml', data: workbook },
  { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
  { name: 'xl/sharedStrings.xml', data: sst },
  { name: 'xl/worksheets/sheet1.xml', data: sheet },
]);

const outDir = path.join(os.tmpdir(), 'ni-personnel-fixtures');
fs.mkdirSync(outDir, { recursive: true });

const xlsxPath = path.join(outDir, 'personnel_import_test.xlsx');
fs.writeFileSync(xlsxPath, xlsx);

const csvPath = path.join(outDir, 'personnel_import_test.csv');
fs.writeFileSync(
  csvPath,
  '\uFEFF社員番号,名前,役割,所属\r\n10005,渡辺 大輝,T09E02,第一開発部\r\n90010,CSV 花子,T02E01,第二開発部\r\n',
  'utf8',
);

console.log('xlsx:', xlsxPath, fs.statSync(xlsxPath).size, 'bytes');
console.log('csv :', csvPath, fs.statSync(csvPath).size, 'bytes');
