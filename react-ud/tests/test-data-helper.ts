/**
 * 测试数据管理 helper
 * 使用 db.ts 连接数据库，插入/清理测试数据
 * 正常场景用真实数据，异常场景用 Mock
 */
import { execute, query } from './db';
export { execute };

// ============================================================
// UD03 - HDOC_DOCUMENT_LIST
// ============================================================
const UD03_DOC_TYPES = [
  { doctype: 'COC', description: 'Certificate of Conformity' },
  { doctype: 'VCC', description: 'Vehicle Certification Code' },
  { doctype: 'EEC', description: 'European Economic Community' },
];

export async function insertUD03TestData() {
  for (const doc of UD03_DOC_TYPES) {
    await execute(
      `INSERT IGNORE INTO HDOC_DOCUMENT_LIST 
       (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, 
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, NOW(), 'test', 'UD03Test', NOW(), 'test', 'UD03Test')`,
      [doc.doctype, doc.description]
    );
  }
}

export async function cleanupUD03TestData() {
  const doctypes = UD03_DOC_TYPES.map(d => d.doctype);
  const placeholders = doctypes.map(() => '?').join(',');
  await execute(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE IN (${placeholders})`, doctypes);
}

// ============================================================
// UD04 - 多表联合数据
// ============================================================
const UD04_TEST_SERIE = 'ABC12';
const UD04_TEST_CHNR = '1234567890';
const UD04_TEST_TRANS_TS = '20241001000000';

export async function insertUD04TestData() {
  // 1. HDOC_REC_DATA_VDA_GENERAL
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_VDA_GENERAL 
     (SERIE, CHNR, COUNTRY_OF_OPERATION, TRANS_TS, 
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'DE', ?,
      NOW(), 'test', 'UD04Test', NOW(), 'test', 'UD04Test')`,
    [UD04_TEST_SERIE, UD04_TEST_CHNR, UD04_TEST_TRANS_TS]
  );

  // 2. HDOC_REC_DATA_OM
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_OM
     (SERIE, CHNR, ORDERNUMBER, BUILD, SPEC, CUSTOMER_ADAP,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'GOLF', '2022W45', '2023W10', 'S-NOTE-001',
      NOW(), 'test', 'UD04Test', NOW(), 'test', 'UD04Test')`,
    [UD04_TEST_SERIE, UD04_TEST_CHNR]
  );

  // 3. HDOC_REC_DATA_KOLA_TIRE_MASTER
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_KOLA_TIRE_MASTER
     (TRANS_TS, LOAD_INDEX,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, '91',
      NOW(), 'test', 'UD04Test', NOW(), 'test', 'UD04Test')`,
    [UD04_TEST_TRANS_TS]
  );

  // 4. HDOC_ADCA_CHANGE
  await execute(
    `INSERT IGNORE INTO HDOC_ADCA_CHANGE
     (SERIE, CHNR, ACT, BU, REASON,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'ACTIVE', 'BU01', 'Test ADCA change',
      NOW(), 'test', 'UD04Test', NOW(), 'test', 'UD04Test')`,
    [UD04_TEST_SERIE, UD04_TEST_CHNR]
  );

  // 5. HDOC_ADCA_MODIFICATION
  await execute(
    `INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
     (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'VIN_PLATE', 'EN', 'PARAM1', 1, 'NewVal1', 0, 'BU01',
      NOW(), 'test', 'UD04Test', NOW(), 'test', 'UD04Test')`,
    [UD04_TEST_SERIE, UD04_TEST_CHNR]
  );
  await execute(
    `INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
     (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'VIN_PLATE', 'EN', 'PARAM2', 1, 'NewVal2', 0, 'BU01',
      NOW(), 'test', 'UD04Test', NOW(), 'test', 'UD04Test')`,
    [UD04_TEST_SERIE, UD04_TEST_CHNR]
  );
}

export async function cleanupUD04TestData() {
  await execute(`DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?`, [UD04_TEST_SERIE, UD04_TEST_CHNR]);
  await execute(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?`, [UD04_TEST_SERIE, UD04_TEST_CHNR]);
  await execute(`DELETE FROM HDOC_REC_DATA_KOLA_TIRE_MASTER WHERE TRANS_TS = ?`, [UD04_TEST_TRANS_TS]);
  await execute(`DELETE FROM HDOC_REC_DATA_OM WHERE SERIE = ? AND CHNR = ?`, [UD04_TEST_SERIE, UD04_TEST_CHNR]);
  await execute(`DELETE FROM HDOC_REC_DATA_VDA_GENERAL WHERE SERIE = ? AND CHNR = ?`, [UD04_TEST_SERIE, UD04_TEST_CHNR]);
}

// ============================================================
// UD05 - HDOC_ADCA_MODIFICATION + HDOC_VARIABLES
// ============================================================

/** 主测试数据 - 用于大部分正常测试场景 (3个变量) */
const UD05_TEST_SERIE = 'S001';
const UD05_TEST_CHNO = 'CH001';

const UD05_TEST_DATA_SETS = [
  // 主测试数据 - S001/CH001 (3个变量)
  { serie: 'S001', chno: 'CH001', variable: 'VAR001', newval: '初期値1', docType: 'VIN_PLATE' },
  { serie: 'S001', chno: 'CH001', variable: 'VAR002', newval: '初期値2', docType: 'VIN_PLATE' },
  { serie: 'S001', chno: 'CH001', variable: 'VAR003', newval: '初期値3', docType: 'VIN_PLATE' },
  { serie: 'S008', chno: 'CH008', variable: 'VAR008', newval: 'TEST_VAL_8', docType: 'COC' },
  { serie: 'S009', chno: 'CH009', variable: 'VAR009', newval: 'TEST_VAL_9', docType: 'COC' },
  { serie: 'S010', chno: 'CH010', variable: 'VAR010', newval: 'TEST_VAL_10', docType: 'EEC' },
  { serie: 'S011', chno: 'CH011', variable: 'VAR011', newval: 'TEST_VAL_11', docType: 'VIN_PLATE' },
  { serie: 'S012', chno: 'CH012', variable: 'VAR012', newval: 'TEST_VAL_12', docType: 'VIN_PLATE' },
  { serie: 'S013', chno: 'CH013', variable: 'VAR013', newval: 'TEST_VAL_13', docType: 'COC' },
  { serie: 'S014', chno: 'CH014', variable: 'VAR014_A', newval: 'VAL_A', docType: 'COC' },
  { serie: 'S014', chno: 'CH014', variable: 'VAR014_B', newval: 'VAL_B', docType: 'COC' },
  { serie: 'S014', chno: 'CH014', variable: 'VAR014_C', newval: 'VAL_C', docType: 'COC' },
  { serie: 'S016', chno: 'CH016', variable: 'VAR016_1', newval: 'VAL_1', docType: 'VIN_PLATE' },
  { serie: 'S016', chno: 'CH016', variable: 'VAR016_2', newval: 'VAL_2', docType: 'VIN_PLATE' },
  { serie: 'S018', chno: 'CH018', variable: 'VAR009', newval: '旧值', docType: 'COC' },
  { serie: 'S019', chno: 'CH019', variable: 'VAR019', newval: 'JUMP_VAL', docType: 'VIN_PLATE' },
  { serie: 'S021', chno: 'CH021', variable: 'VAR021', newval: 'TITLE_VAL', docType: 'COC' },
  { serie: 'S022', chno: 'CH022', variable: 'VAR022', newval: 'BTN_VAL', docType: 'COC' },
  { serie: 'S023', chno: 'CH023', variable: 'VAR023', newval: 'INIT_VAL', docType: 'VIN_PLATE' },
  { serie: 'S024', chno: 'CH024', variable: 'VAR024', newval: 'RESP_VAL', docType: 'COC' },
  { serie: 'S025', chno: 'CH025', variable: 'VAR025', newval: 'DB_VAL_1', docType: 'COC' },
  { serie: 'S025', chno: 'CH025', variable: 'VAR026', newval: 'DB_VAL_2', docType: 'COC' },
  { serie: 'S026', chno: 'CH026', variable: 'VAR027', newval: 'OLD_A', docType: 'COC' },
  { serie: 'S026', chno: 'CH026', variable: 'VAR028', newval: 'OLD_B', docType: 'COC' },
];

const UD05_VARIABLES_DATA = [
  { variable: 'VAR001', description: 'Variable 1 Description' },
  { variable: 'VAR002', description: 'Variable 2 Description' },
  { variable: 'VAR003', description: 'Variable 3 Description' },
  { variable: 'VAR008', description: 'Chassis Info Variable' },
  { variable: 'VAR009', description: 'Navigation Test Variable' },
  { variable: 'VAR010', description: 'Market Display Variable' },
  { variable: 'VAR011', description: 'Template Link Variable' },
  { variable: 'VAR012', description: 'Template Click Variable' },
  { variable: 'VAR013', description: 'Header Display Variable' },
  { variable: 'VAR014_A', description: 'Data Row A' },
  { variable: 'VAR014_B', description: 'Data Row B' },
  { variable: 'VAR014_C', description: 'Data Row C' },
  { variable: 'VAR016_1', description: 'Column Display 1' },
  { variable: 'VAR016_2', description: 'Column Display 2' },
  { variable: 'VAR018', description: 'Save Jump Variable' },
  { variable: 'VAR019', description: 'UD07 Jump Variable' },
  { variable: 'VAR021', description: 'Title Display Variable' },
  { variable: 'VAR022', description: 'Button Display Variable' },
  { variable: 'VAR023', description: 'Initial State Variable' },
  { variable: 'VAR024', description: 'Responsive Layout Variable' },
  { variable: 'VAR025', description: 'DB Verify Var 1' },
  { variable: 'VAR026', description: 'DB Verify Var 2' },
  { variable: 'VAR027', description: 'Multi DB Var A' },
  { variable: 'VAR028', description: 'Multi DB Var B' },
];

export async function insertUD05TestData() {
  for (const v of UD05_VARIABLES_DATA) {
    await execute(
      `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, DESCRIPTION) VALUES (?, ?)`,
      [v.variable, v.description]
    );
  }
  for (const d of UD05_TEST_DATA_SETS) {
    await execute(
      `INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
       (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, 'EN', ?, 1, ?, 0, 'BU01',
        NOW(), 'test', 'UD05Test', NOW(), 'test', 'UD05Test')`,
      [d.serie, d.chno, d.docType, d.variable, d.newval]
    );
  }
}

export async function cleanupUD05TestData() {
  const seriesSet = new Set(UD05_TEST_DATA_SETS.map(d => `${d.serie}|${d.chno}`));
  for (const key of seriesSet) {
    const [serie, chno] = key.split('|');
    await execute(`DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?`, [serie, chno]);
  }
  for (const v of UD05_VARIABLES_DATA) {
    await execute(`DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?`, [v.variable]);
  }
}

// ============================================================
// UD06 - HDOC_ADCA_MODIFICATION (API 测试用数据)
// ============================================================

const UD06_TEST_DATA_SETS = [
  { serie: 'S023', chno: 'CH023', variable: 'VAR_APITEST', newval: 'API_TEST_VALUE', docType: 'COC', vers: 1 },
  { serie: 'S029', chno: 'CH029', variable: 'VAR_SQLTEST', newval: 'SQL_TEST_VALUE', docType: 'EEC', vers: 2 },
];

export async function insertUD06TestData() {
  for (const d of UD06_TEST_DATA_SETS) {
    await execute(
      `INSERT IGNORE INTO HDOC_ADCA_MODIFICATION
       (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, 'EN', ?, ?, ?, 0, 'BU01',
        NOW(), 'test', 'UD06Test', NOW(), 'test', 'UD06Test')`,
      [d.serie, d.chno, d.docType, d.variable, d.vers, d.newval]
    );
  }
}

export async function cleanupUD06TestData() {
  const seriesSet = new Set(UD06_TEST_DATA_SETS.map(d => `${d.serie}|${d.chno}`));
  for (const key of seriesSet) {
    const [serie, chno] = key.split('|');
    await execute(`DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?`, [serie, chno]);
  }
}

// ============================================================
// UD07 - 多表联合数据（VDA_GENERAL + OM + VDA_VARIANTS + KOLA_VARIANT）
// ============================================================

const UD07_CHASSIS_SETS = [
  // serie, chnr, country, productType, vin, model, build, sNoteNo, familyId, variantId, symbol, description
  { serie: 'JPCT', chnr: '013945', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013945', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013949', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013949', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013949', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013951', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013951', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013951', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013952', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013952', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013952', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013953', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013953', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013953', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013954', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZZ30D8GT013954XYZ', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013954', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013955', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013955', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013955', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013957', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013957', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013957', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013959', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013959', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013959', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013961', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013961', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013961', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013963', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013963', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013963', familyId: 'F02', variantId: 'V02', symbol: 'FTLI-150-XYZ', desc: 'FTLI-150-XYZ' },
  { serie: 'JPCT', chnr: '013964', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013964', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013964', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013966', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013966', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-EXTRA-INFO', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013967', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013967', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013967', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013975', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013975', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013975', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013976', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013976', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013976', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013977', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013977', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013977', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013979', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013979', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-013979', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
];

const UD07_TRANS_TS = '20241001000000';

export async function insertUD07TestData() {
  for (const d of UD07_CHASSIS_SETS) {
    // 1. HDOC_REC_DATA_VDA_GENERAL
    await execute(
      `INSERT IGNORE INTO HDOC_REC_DATA_VDA_GENERAL
       (SERIE, CHNR, COUNTRY_OF_OPERATION, PRODUCT_TYPE, VIN, TRANS_TS,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, ?, ?, ?,
        NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
      [d.serie, d.chnr, d.country, d.productType, d.vin, UD07_TRANS_TS]
    );

    // 2. HDOC_REC_DATA_OM
    await execute(
      `INSERT IGNORE INTO HDOC_REC_DATA_OM
       (SERIE, CHNR, MODEL, BUILD, CUSTOMER_ADAP, ORDERNUMBER,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, ?, ?, ?,
        NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
      [d.serie, d.chnr, d.model, d.build, d.sNoteNo, `GOLF-${d.chnr}`]
    );

    // 3. HDOC_REC_DATA_VDA_VARIANTS
    await execute(
      `INSERT IGNORE INTO HDOC_REC_DATA_VDA_VARIANTS
       (SERIE, CHNR, FAMILY_ID, VARIANT_ID,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, ?,
        NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
      [d.serie, d.chnr, d.familyId, d.variantId]
    );

    // 4. HDOC_REC_DATA_KOLA_VARIANT (去重用)
    await execute(
      `INSERT IGNORE INTO HDOC_REC_DATA_KOLA_VARIANT
       (FAMILY_ID, VARIANT_ID, SYMBOL, DESCRIPTION,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, ?,
        NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
      [d.familyId, d.variantId, d.symbol, d.desc]
    );
  }
}

export async function cleanupUD07TestData() {
  for (const d of UD07_CHASSIS_SETS) {
    await execute(`DELETE FROM HDOC_REC_DATA_VDA_GENERAL WHERE SERIE = ? AND CHNR = ?`, [d.serie, d.chnr]);
    await execute(`DELETE FROM HDOC_REC_DATA_OM WHERE SERIE = ? AND CHNR = ?`, [d.serie, d.chnr]);
    await execute(`DELETE FROM HDOC_REC_DATA_VDA_VARIANTS WHERE SERIE = ? AND CHNR = ?`, [d.serie, d.chnr]);
  }
  const seen = new Set<string>();
  for (const d of UD07_CHASSIS_SETS) {
    const key = `${d.familyId}|${d.variantId}`;
    if (!seen.has(key)) {
      seen.add(key);
      await execute(`DELETE FROM HDOC_REC_DATA_KOLA_VARIANT WHERE FAMILY_ID = ? AND VARIANT_ID = ?`, [d.familyId, d.variantId]);
    }
  }
}

/** 为指定底盘号插入测试数据（每个测试运行前调用，确保数据独立可用） */
export async function insertSingleChassis(serie: string, chnr: string) {
  const d = UD07_CHASSIS_SETS.find(x => x.serie === serie && x.chnr === chnr);
  if (!d) throw new Error(`Chassis ${serie} ${chnr} not found in test data`);

  // 1. 先清理该底盘的旧数据（避免 ORDERNUMBER 主键冲突）
  await execute(`DELETE FROM HDOC_REC_DATA_VDA_GENERAL WHERE SERIE = ? AND CHNR = ?`, [d.serie, d.chnr]);
  await execute(`DELETE FROM HDOC_REC_DATA_OM WHERE SERIE = ? AND CHNR = ?`, [d.serie, d.chnr]);
  await execute(`DELETE FROM HDOC_REC_DATA_VDA_VARIANTS WHERE SERIE = ? AND CHNR = ?`, [d.serie, d.chnr]);
  // 清理 KOLA_VARIANT 旧数据（INSERT IGNORE 不会覆盖已有记录）
  await execute(`DELETE FROM HDOC_REC_DATA_KOLA_VARIANT WHERE FAMILY_ID = ? AND VARIANT_ID = ?`, [d.familyId, d.variantId]);

  // 2. 插入 VDA_GENERAL
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_VDA_GENERAL
     (SERIE, CHNR, COUNTRY_OF_OPERATION, PRODUCT_TYPE, VIN, TRANS_TS,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?, ?,
      NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
    [d.serie, d.chnr, d.country, d.productType, d.vin, UD07_TRANS_TS]
  );

  // 3. 插入 OM（ORDERNUMBER 用 GOLF-{chnr} 保证唯一）
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_OM
     (SERIE, CHNR, MODEL, BUILD, CUSTOMER_ADAP, ORDERNUMBER,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?, ?,
      NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
    [d.serie, d.chnr, d.model, d.build, d.sNoteNo, `GOLF-${d.chnr}`]
  );

  // 4. 插入 VDA_VARIANTS
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_VDA_VARIANTS
     (SERIE, CHNR, FAMILY_ID, VARIANT_ID,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?,
      NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
    [d.serie, d.chnr, d.familyId, d.variantId]
  );

  // 5. 插入 KOLA_VARIANT（FAMILY_ID+VARIANT_ID 唯一，用 INSERT IGNORE 避免重复）
  await execute(
    `INSERT IGNORE INTO HDOC_REC_DATA_KOLA_VARIANT
     (FAMILY_ID, VARIANT_ID, SYMBOL, DESCRIPTION,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?,
      NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
    [d.familyId, d.variantId, d.symbol, d.desc]
  );
}

// ============================================================
// UD08 - PRODUCT_CLASS_MASTER / MARKET_MASTER / HDOC_VARIABLES
// ============================================================

const UD08_PC_DATA = [
  { pc: 'PC01', desc: 'Product Class 01 Description' },
  { pc: 'PC02', desc: 'Product Class 02 Description' },
];

const UD08_MARKET_DATA = [
  { market: 'DE', desc: 'Germany' },
  { market: 'CHN', desc: 'China' },
  { market: 'JPN', desc: 'Japan' },
];

const UD08_VARIABLE_DATA = [
  { variable: 'VAR001', desc: 'Test Variable 001' },
  { variable: 'VAR002', desc: 'Test Variable 002' },
];

export async function insertUD08TestData() {
  for (const d of UD08_PC_DATA) {
    await execute(`INSERT IGNORE INTO PRODUCT_CLASS_MASTER (PC, DESCRIPTION) VALUES (?, ?)`, [d.pc, d.desc]);
  }
  for (const d of UD08_MARKET_DATA) {
    await execute(`INSERT IGNORE INTO MARKET_MASTER (MARKET, DESCRIPTION) VALUES (?, ?)`, [d.market, d.desc]);
  }
  for (const d of UD08_VARIABLE_DATA) {
    await execute(`INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, DESCRIPTION) VALUES (?, ?)`, [d.variable, d.desc]);
  }
}

export async function cleanupUD08TestData() {
  for (const d of UD08_PC_DATA) {
    await execute(`DELETE FROM PRODUCT_CLASS_MASTER WHERE PC = ?`, [d.pc]);
  }
  for (const d of UD08_MARKET_DATA) {
    await execute(`DELETE FROM MARKET_MASTER WHERE MARKET = ?`, [d.market]);
  }
  for (const d of UD08_VARIABLE_DATA) {
    await execute(`DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?`, [d.variable]);
  }
}

// ============================================================
// UD09 - HDOC_USER_DEFINED_RULES
// ============================================================

const UD09_TEST_RECORDS = [
  { pc: 'PC01', num: '100', market: 'DE', variable: 'TEMPLATE-VAR001', val: 'TestValue', vs: 'Variant1', vs2: 'Variant2', comments: 'Test comment', addDate: '202201', deleteDate: '', updateUser: 'admin', updateDatetime: '2022-12-02 05:11:45' },
  { pc: 'PC01', num: '200', market: 'DE', variable: 'TEMPLATE-VAR002', val: 'Value2', vs: 'OnlyV1', vs2: '', comments: 'Test comment 2', addDate: '202202', deleteDate: '202301', updateUser: 'admin', updateDatetime: '2022-12-03 05:11:45' },
  { pc: 'PC01', num: '300', market: 'FR', variable: 'VAR003', val: 'Value3', vs: '', vs2: '', comments: 'No variant', addDate: '202203', deleteDate: '', updateUser: 'operator', updateDatetime: '2022-12-04 05:11:45' },
  { pc: 'PC02', num: '100', market: 'DE', variable: 'VAR004', val: 'Value4', vs: 'VS1', vs2: 'VS2', comments: 'PC02 record', addDate: '202204', deleteDate: '', updateUser: 'admin', updateDatetime: '2022-12-05 05:11:45' },
  { pc: 'PC02', num: '150', market: 'CHN', variable: 'VAR005', val: 'Value5', vs: '', vs2: '', comments: '', addDate: '202205', deleteDate: '', updateUser: 'operator', updateDatetime: '2022-12-06 05:11:45' },
  { pc: 'PC03', num: '100', market: 'JPN', variable: 'VAR006', val: 'Value6', vs: 'Test', vs2: 'Me', comments: 'Japan record', addDate: '202206', deleteDate: '', updateUser: 'testuser', updateDatetime: '2022-12-07 05:11:45' },
];

export async function insertUD09TestData() {
  for (const r of UD09_TEST_RECORDS) {
    await execute(
      `INSERT IGNORE INTO HDOC_USER_DEFINED_RULES
       (PC, NUM, MARKET, VARIABLE, VAL, VS, VS2, COMMENTS, ADD_DATE, DELETE_DATE, USERID, UP_DATE,
        REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        NOW(), 'test', 'UD09Test', NOW(), 'test', 'UD09Test')`,
      [r.pc, r.num, r.market, r.variable, r.val, r.vs, r.vs2, r.comments, r.addDate, r.deleteDate, r.updateUser, r.updateDatetime]
    );
  }
}

export async function cleanupUD09TestData() {
  const keySet = new Set(UD09_TEST_RECORDS.map(r => `${r.pc}|${r.num}|${r.market}`));
  for (const key of keySet) {
    const [pc, num, market] = key.split('|');
    await execute(`DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = ? AND NUM = ? AND MARKET = ?`, [pc, num, market]);
  }
}

// ============================================================
// UD10 - ExistingHDocVariables（HDOC_VARIABLES 变量定义数据）
// ============================================================

const UD10_TEST_RECORDS = [
  { variable: 'VAR001', type: 'VDA', description: 'Test Variable 001', userid: 'admin', registerDatetime: '2026-01-15 10:30:00' },
  { variable: 'VAR002', type: 'VDA', description: 'Test Variable 002', userid: 'admin', registerDatetime: '2026-01-16 10:30:00' },
  { variable: 'VAR003', type: 'User Defined', description: 'User defined test variable', userid: 'operator', registerDatetime: '2026-02-01 09:00:00' },
];

export async function insertUD10TestData() {
  for (const r of UD10_TEST_RECORDS) {
    await execute(
      `INSERT IGNORE INTO HDOC_VARIABLES
       (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME,
        REGISTER_USER, REGISTER_PROCESS,
        UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
       VALUES (?, ?, ?, ?, ?,
        ?, 'UD10Test',
        NOW(), ?, 'UD10Test')`,
      [r.variable, r.type, r.description, r.userid, r.registerDatetime, r.userid, r.userid]
    );
  }
}

export async function cleanupUD10TestData() {
  const variables = UD10_TEST_RECORDS.map(r => r.variable);
  const placeholders = variables.map(() => '?').join(',');
  await execute(`DELETE FROM HDOC_VARIABLES WHERE VARIABLE IN (${placeholders})`, variables);
}

/** 为 UD11 插入单条变量记录（每个测试独立插入，避免数据冲突） */
export async function insertUD11Record(variable: string, type: string, description: string, userid: string, registerDatetime: string) {
  await execute(`DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?`, [variable]);
  await execute(
    `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, TYPE, DESCRIPTION, USERID, REGISTER_DATETIME,
      REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?,
      ?, 'UD11Test', NOW(), ?, 'UD11Test')`,
    [variable, type, description, userid, registerDatetime, userid, userid]
  );
}

// ============================================================
// 全局清理 - 清理所有测试数据
// ============================================================
export async function cleanupAllTestData() {
  await cleanupUD10TestData();
  await cleanupUD09TestData();
  await cleanupUD08TestData();
  await cleanupUD07TestData();
  await cleanupUD06TestData();
  await cleanupUD05TestData();
  await cleanupUD04TestData();
  await cleanupUD03TestData();
}

// ============================================================
// UD16 - HDOC_ADCA_CHANGE
// ============================================================
const UD16_ACTIVE_SERIE = 'JPCT';
const UD16_ACTIVE_CHNR = 'G28321';
const UD16_INACTIVE_SERIE = 'JPCT';
const UD16_INACTIVE_CHNR = 'G28322';

export async function insertUD16TestData() {
  // 激活的记录（ACT='Y'）
  await execute(
    `INSERT IGNORE INTO HDOC_ADCA_CHANGE
     (SERIE, CHNR, ACT, BU, REASON,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'Y', 'BU0001', 'Test activated record',
      NOW(), 'test', 'UD16Test', NOW(), 'test', 'UD16Test')`,
    [UD16_ACTIVE_SERIE, UD16_ACTIVE_CHNR]
  );
  // 未激活的记录（ACT='N'）
  await execute(
    `INSERT IGNORE INTO HDOC_ADCA_CHANGE
     (SERIE, CHNR, ACT, BU, REASON,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'N', 'BU0001', 'Test inactive record',
      NOW(), 'test', 'UD16Test', NOW(), 'test', 'UD16Test')`,
    [UD16_INACTIVE_SERIE, UD16_INACTIVE_CHNR]
  );
}

export async function cleanupUD16TestData() {
  await execute(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?`, [UD16_ACTIVE_SERIE, UD16_ACTIVE_CHNR]);
  await execute(`DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?`, [UD16_INACTIVE_SERIE, UD16_INACTIVE_CHNR]);
}

// ============================================================
// UD17 - HDOC_USER_INFOR + HDOC_FUNCTION_AUTH + HDOC_MARKET_AUTH
// ============================================================
const UD17_TEST_USER = 'V0C6900';
const UD17_TEST_USERNAME = 'Test User UD17';

export async function insertUD17TestData() {
  // 1. 测试用户
  await execute(
    `INSERT IGNORE INTO HDOC_USER_INFOR
     (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'dummy123', ?, 'Test Resp', 'Test Pos', 'test@test.com',
      NOW(), 'test', 'UD17Test', NOW(), 'test', 'UD17Test')`,
    [UD17_TEST_USER, UD17_TEST_USERNAME]
  );
  // 2. 功能权限 - Standard User (USER)
  await execute(
    `INSERT IGNORE INTO HDOC_FUNCTION_AUTH
     (USERID, \`FUNCTION\`,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'USER',
      NOW(), 'test', 'UD17Test', NOW(), 'test', 'UD17Test')`,
    [UD17_TEST_USER]
  );
  // 3. 功能权限 - Rule Admin (RULES)
  await execute(
    `INSERT IGNORE INTO HDOC_FUNCTION_AUTH
     (USERID, \`FUNCTION\`,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'RULES',
      NOW(), 'test', 'UD17Test', NOW(), 'test', 'UD17Test')`,
    [UD17_TEST_USER]
  );
  // 4. 市场权限 - Rule Admin / JPN
  await execute(
    `INSERT IGNORE INTO HDOC_MARKET_AUTH
     (USERID, MARKET, TYPE, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'JPN', 'R', 'BU01',
      NOW(), 'test', 'UD17Test', NOW(), 'test', 'UD17Test')`,
    [UD17_TEST_USER]
  );
  // 5. 市场权限 - Rule Admin / CHN
  await execute(
    `INSERT IGNORE INTO HDOC_MARKET_AUTH
     (USERID, MARKET, TYPE, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'CHN', 'R', 'BU01',
      NOW(), 'test', 'UD17Test', NOW(), 'test', 'UD17Test')`,
    [UD17_TEST_USER]
  );
}

export async function cleanupUD17TestData() {
  await execute(`DELETE FROM HDOC_MARKET_AUTH WHERE USERID = ?`, [UD17_TEST_USER]);
  await execute(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [UD17_TEST_USER]);
  await execute(`DELETE FROM HDOC_USER_INFOR WHERE USERID = ?`, [UD17_TEST_USER]);
}

// ============================================================
// UD18 - HDOC_USER_INFOR + HDOC_FUNCTION_AUTH + HDOC_USER_DOC
// ============================================================
const UD18_TEST_USER = 'A420064';
const UD18_TEST_USERNAME = 'Jenna Wang';

export async function insertUD18TestData() {
  // 1. 测试用户
  await execute(
    `INSERT IGNORE INTO HDOC_USER_INFOR
     (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'dummy123', ?, 'Test Resp', 'Test Pos', 'test@test.com',
      NOW(), 'test', 'UD18Test', NOW(), 'test', 'UD18Test')`,
    [UD18_TEST_USER, UD18_TEST_USERNAME]
  );
  // 2. 功能权限记录（用于 checkAuth 存在性校验）
  await execute(
    `INSERT IGNORE INTO HDOC_FUNCTION_AUTH
     (USERID, \`FUNCTION\`,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'USER',
      NOW(), 'test', 'UD18Test', NOW(), 'test', 'UD18Test')`,
    [UD18_TEST_USER]
  );
  // 3. 文档权限（HDOC_USER_DOC）- 授权 COC 和 VCC
  await execute(
    `INSERT IGNORE INTO HDOC_USER_DOC
     (USERID, DOCTYPE,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'COC',
      NOW(), 'test', 'UD18Test', NOW(), 'test', 'UD18Test')`,
    [UD18_TEST_USER]
  );
  await execute(
    `INSERT IGNORE INTO HDOC_USER_DOC
     (USERID, DOCTYPE,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'VCC',
      NOW(), 'test', 'UD18Test', NOW(), 'test', 'UD18Test')`,
    [UD18_TEST_USER]
  );
}

export async function cleanupUD18TestData() {
  await execute(`DELETE FROM HDOC_USER_DOC WHERE USERID = ?`, [UD18_TEST_USER]);
  await execute(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [UD18_TEST_USER]);
  await execute(`DELETE FROM HDOC_USER_INFOR WHERE USERID = ?`, [UD18_TEST_USER]);
}

// ============================================================
// UD19 - HDOC_USER_INFOR + HDOC_MARKET_AUTH + HDOC_FUNCTION_AUTH
// ============================================================
const UD19_TEST_USERID = 'SWE';
const UD19_TEST_USERNAME = 'SWETestUser';

export async function insertUD19TestData() {
  // 1. 测试用户
  await execute(
    `INSERT IGNORE INTO HDOC_USER_INFOR
     (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'dummy123', ?, 'TestResp', 'TestPos', 'test@test.com',
      NOW(), 'test', 'UD19Test', NOW(), 'test', 'UD19Test')`,
    [UD19_TEST_USERID, UD19_TEST_USERNAME]
  );
  // 2. Rule Admin 功能权限
  await execute(
    `INSERT IGNORE INTO HDOC_FUNCTION_AUTH
     (USERID, \`FUNCTION\`,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'RULES',
      NOW(), 'test', 'UD19Test', NOW(), 'test', 'UD19Test')`,
    [UD19_TEST_USERID]
  );
  // 3. Template Admin 功能权限
  await execute(
    `INSERT IGNORE INTO HDOC_FUNCTION_AUTH
     (USERID, \`FUNCTION\`,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'TEMPLATE',
      NOW(), 'test', 'UD19Test', NOW(), 'test', 'UD19Test')`,
    [UD19_TEST_USERID]
  );
  // 4. 市场权限 - Rule Admin / JPN
  await execute(
    `INSERT IGNORE INTO HDOC_MARKET_AUTH
     (USERID, MARKET, TYPE, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'JPN', 'R', 'BU01',
      NOW(), 'test', 'UD19Test', NOW(), 'test', 'UD19Test')`,
    [UD19_TEST_USERID]
  );
  // 5. 市场权限 - Template / DEU
  await execute(
    `INSERT IGNORE INTO HDOC_MARKET_AUTH
     (USERID, MARKET, TYPE, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'DEU', 'T', 'BU01',
      NOW(), 'test', 'UD19Test', NOW(), 'test', 'UD19Test')`,
    [UD19_TEST_USERID]
  );
}

export async function cleanupUD19TestData() {
  await execute(`DELETE FROM HDOC_MARKET_AUTH WHERE USERID = ?`, [UD19_TEST_USERID]);
  await execute(`DELETE FROM HDOC_FUNCTION_AUTH WHERE USERID = ?`, [UD19_TEST_USERID]);
  await execute(`DELETE FROM HDOC_USER_INFOR WHERE USERID = ?`, [UD19_TEST_USERID]);
}

// ============================================================
// UD20-1 - HDOC_DOCUMENT_LIST
// ============================================================
const UD201_TEST_DOCTYPE = 'COC';

export async function insertUD201TestData() {
  await execute(
    `INSERT IGNORE INTO HDOC_DOCUMENT_LIST
     (DOCTYPE, DESCRIPTION,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, 'Certificate of Conformity - Test',
      '2026-01-15 10:30:00', 'admin', 'UD201Test',
      '2026-01-15 10:30:00', 'admin', 'UD201Test')`,
    [UD201_TEST_DOCTYPE]
  );
}

export async function cleanupUD201TestData() {
  await execute(`DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE = ?`, [UD201_TEST_DOCTYPE]);
}
