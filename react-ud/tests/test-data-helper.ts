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
// 全局清理 - 清理所有测试数据
// ============================================================
export async function cleanupAllTestData() {
  await cleanupUD04TestData();
  await cleanupUD03TestData();
}
