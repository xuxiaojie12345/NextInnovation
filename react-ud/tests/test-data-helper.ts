/**
 * 测试数据管理 helper
 * 使用 db.ts 连接数据库，插入/清理测试数据
 * 正常场景用真实数据，异常场景用 Mock
 */
import { execute, query } from './db';

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
  { serie: 'JPCT', chnr: '013954', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZZ30D8GT013954XYZ', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013963', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013963', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F02', variantId: 'V02', symbol: 'FTLI-150-XYZ', desc: 'Long symbol description' },
  { serie: 'JPCT', chnr: '013966', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013966', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111-EXTRA-INFO', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013967', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013967', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013975', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013975', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013976', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013976', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013977', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013977', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
  { serie: 'JPCT', chnr: '013979', country: 'IDN', productType: 'EM 64 R', vin: 'JPCZZ30D8GT013979', model: 'UD-HDE', build: '1617', sNoteNo: 'S1610111', familyId: 'F01', variantId: 'V01', symbol: 'FTLI-150', desc: 'Front load index: FTLI-150' },
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
       VALUES (?, ?, ?, ?, ?, 'GOLF',
        NOW(), 'test', 'UD07Test', NOW(), 'test', 'UD07Test')`,
      [d.serie, d.chnr, d.model, d.build, d.sNoteNo]
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
  // 清理 KOLA_VARIANT
  const seen = new Set<string>();
  for (const d of UD07_CHASSIS_SETS) {
    const key = `${d.familyId}|${d.variantId}`;
    if (!seen.has(key)) {
      seen.add(key);
      await execute(`DELETE FROM HDOC_REC_DATA_KOLA_VARIANT WHERE FAMILY_ID = ? AND VARIANT_ID = ?`, [d.familyId, d.variantId]);
    }
  }
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
// 全局清理 - 清理所有测试数据
// ============================================================
export async function cleanupAllTestData() {
  await cleanupUD08TestData();
  await cleanupUD07TestData();
  await cleanupUD06TestData();
  await cleanupUD05TestData();
  await cleanupUD04TestData();
  await cleanupUD03TestData();
}
