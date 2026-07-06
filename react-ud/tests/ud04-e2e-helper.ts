import { execute } from './db';

// ============================================================
// UD04 E2E 测试数据管理
// 插入/清理 UD04 页面需要的 5 张关联表的数据
// ============================================================

export interface Ud04TestData {
  serie: string;
  chnr: string;
  transTs: string;
  ordernumber: string;
  partno: string;
}

// 生成唯一的测试标识（时间戳 + 随机数，避免并行冲突）
const TS = Date.now().toString().slice(-3);
const RND = Math.random().toString(36).slice(2, 4).toUpperCase();
export const TEST_SERIE = `T${TS}`;        // max 4 chars
export const TEST_CHNR = `E${RND}`;        // max 4 chars
export const TEST_TRANS_TS = `26${TS}`;
export const TEST_ORDERNUMBER = `O${RND}${TS}`;
export const TEST_PARTNO = `P${RND}`;

const NOW = new Date().toISOString().slice(0, 19).replace('T', ' ');

/** 插入 UD04 测试数据 */
export async function insertUd04TestData(): Promise<Ud04TestData> {
  const data: Ud04TestData = {
    serie: TEST_SERIE,
    chnr: TEST_CHNR,
    transTs: TEST_TRANS_TS,
    ordernumber: TEST_ORDERNUMBER,
    partno: TEST_PARTNO,
  };

  // 1. HDOC_REC_DATA_VDA_GENERAL（主表）
  await execute(
    `INSERT INTO HDOC_REC_DATA_VDA_GENERAL 
     (SERIE, CHNR, TRANS_TS, VIN, COUNTRY_OF_OPERATION, REGISTRATION_NUMBER,
      DELIVERY_DATE, BRAND_ID, PC, PRODUCT_TYPE, COMPANY_CODE, MARKETING_TYPE,
      MAIN_SPEC_WEEK, BODY_SPEC_WEEK, BUILD_WEEK, USING_END_CUSTOMER_ID,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?)`,
    [data.serie, data.chnr, data.transTs, 'VIN-E2E-TEST', 'JPN', 'REG-001',
     '20260701', 'BRAND01', 'PC', 'TRUCK', 'COMP01', 'TYPE_A',
     '1620', '1620', '1620', 'CUST001',
     NOW, 'E2E_TEST', 'UD04_E2E',
     NOW, 'E2E_TEST', 'UD04_E2E']
  );

  // 2. HDOC_REC_DATA_OM（订单信息）
  await execute(
    `INSERT INTO HDOC_REC_DATA_OM
     (ORDERNUMBER, TRANS_TS, SALESMARKET, BUYERPARTYID, ENDCUSTOMERPARTYID,
      DEALAGREEMENTID, SPEC, BUILD, SERIE, CHNR, DELIVERY, MODEL, VIN,
      CUSTOMER_ADAP, VARSTR, SYMBOL_STR, ORDERSTATUS, ASSEMBLY_ORDER,
      FAC_LINE, REGDATE, PC, NSV_DESCR, FIRM_PLAN, VSTATUS, LAST_CD, FO,
      PRODUCTION_END, BUYERPARTYID2, TDI_DEALERID, RELEASEFACTORY, RETAILSALESDATE,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?)`,
    [data.ordernumber, data.transTs, 'JPSALE', 'BUYER01', 'ENDCUST01',
     'DEAL001', 1620, 2016, data.serie, data.chnr, 1, 'MODEL-X', 'VIN-E2E-TEST',
     'E2E_SNOTE_001', 'VARSTR_DATA', 'SYMBOL_DATA', 'ACTIVE', 'ASSY001',
     'F1', '202601', 'PC', 'NSV_DESCR', 1, 1, 0, 'FO001',
     '202607', 'BUYER02', 'TD', 'FAC', '20260701',
     NOW, 'E2E_TEST', 'UD04_E2E',
     NOW, 'E2E_TEST', 'UD04_E2E']
  );

  // 3. HDOC_REC_DATA_KOLA_TIRE_MASTER（轮胎数据 - LEFT JOIN）
  await execute(
    `INSERT INTO HDOC_REC_DATA_KOLA_TIRE_MASTER
     (PARTNO, TDIM, BRAND, LOAD_INDEX, VPV, TRANS_TS,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?)`,
    [data.partno, 'TDIM001', 'BRAND_X', '108', 'VPV001', data.transTs,
     NOW, 'E2E_TEST', 'UD04_E2E',
     NOW, 'E2E_TEST', 'UD04_E2E']
  );

  // 4. HDOC_ADCA_CHANGE（ADCA 变更状态 - LEFT JOIN）
  await execute(
    `INSERT INTO HDOC_ADCA_CHANGE
     (SERIE, CHNR, ACT, BU, REASON,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?)`,
    [data.serie, data.chnr, 'Y', 'BU001', 'E2E test reason',
     NOW, 'E2E_TEST', 'UD04_E2E',
     NOW, 'E2E_TEST', 'UD04_E2E']
  );

  // 5. HDOC_ADCA_MODIFICATION（修改参数 - LEFT JOIN）
  await execute(
    `INSERT INTO HDOC_ADCA_MODIFICATION
     (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
      RELEASE_USER, RELEASE_DATE_TIME,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?)`,
    [data.serie, data.chnr, 'TYPE_A', 'EN', 'VARIABLE_001', 1, 'NEW_VAL', 0, 'BU001',
     'RELEASE_U', NOW,
     NOW, 'E2E_TEST', 'UD04_E2E',
     NOW, 'E2E_TEST', 'UD04_E2E']
  );

  console.log(`[UD04 E2E] 测试数据已插入: SERIE=${data.serie}, CHNR=${data.chnr}`);
  return data;
}

/** 清理 UD04 测试数据 */
export async function cleanupUd04TestData(data: Ud04TestData) {
  await execute('DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?', [data.serie, data.chnr]);
  await execute('DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE = ? AND CHNR = ?', [data.serie, data.chnr]);
  await execute('DELETE FROM HDOC_REC_DATA_KOLA_TIRE_MASTER WHERE PARTNO = ?', [data.partno]);
  await execute('DELETE FROM HDOC_REC_DATA_OM WHERE ORDERNUMBER = ?', [data.ordernumber]);
  await execute('DELETE FROM HDOC_REC_DATA_VDA_GENERAL WHERE SERIE = ? AND CHNR = ?', [data.serie, data.chnr]);
  console.log(`[UD04 E2E] 测试数据已清理: SERIE=${data.serie}, CHNR=${data.chnr}`);
}

/** 获取测试数据的预期显示值 */
export function getExpectedDisplayValues(data: Ud04TestData) {
  return {
    serie: data.serie,
    chassisNo: data.chnr,
    ordernumber: data.ordernumber,
    market: 'JPN',
    loadIndex: '108',
    sNoteNo: 'E2E_SNOTE_001',
    sNoteMessage: 'The S-notes above can affect homologation documents.',
    masterMarket: '-EU',
  };
}
