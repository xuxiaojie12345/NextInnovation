import { execute } from './db';

// ============================================================
// UD05 E2E 测试数据管理
// 插入/清理 HDOC_ADCA_MODIFICATION 和 HDOC_VARIABLES 表的数据
// ============================================================

// 生成唯一的测试标识（时间戳 + 随机数，避免并行冲突）
const TS = Date.now().toString().slice(-3);
const RND = Math.random().toString(36).slice(2, 4).toUpperCase();
export const TEST_SERIE = `S${TS}`;
export const TEST_CHNO = `C${RND}`;
export const TEST_VARIABLE = `VAR_${RND}`;
export const TEST_DESCRIPTION = `Test ${RND}`;
export const TEST_NEWVAL = `CUR_${RND}`;

const NOW = new Date().toISOString().slice(0, 19).replace('T', ' ');

/** 插入 UD05 测试数据 */
export async function insertUd05TestData() {
  // 1. HDOC_VARIABLES（变量主表）
  await execute(
    `INSERT IGNORE INTO HDOC_VARIABLES (VARIABLE, DESCRIPTION, TYPE,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'T', ?, 'E2E_TEST', 'UD05_E2E', ?, 'E2E_TEST', 'UD05_E2E')`,
    [TEST_VARIABLE, TEST_DESCRIPTION, NOW, NOW]
  );

  // 2. HDOC_ADCA_MODIFICATION（底盘变量修改记录）
  await execute(
    `INSERT INTO HDOC_ADCA_MODIFICATION
     (SERIE, CHNO, DOCTYPE, LANG, VARIABLE, VERS, NEWVAL, STA, BU,
      REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS,
      UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
     VALUES (?, ?, 'HOMOLOG', 'EN', ?, 1, ?, 0, 'BU001',
      ?, 'E2E_TEST', 'UD05_E2E', ?, 'E2E_TEST', 'UD05_E2E')`,
    [TEST_SERIE, TEST_CHNO, TEST_VARIABLE, TEST_NEWVAL, NOW, NOW]
  );
}

/** 清理 UD05 测试数据 */
export async function cleanupUd05TestData() {
  await execute(`DELETE FROM HDOC_ADCA_MODIFICATION WHERE SERIE = ? AND CHNO = ?`, [TEST_SERIE, TEST_CHNO]);
  await execute(`DELETE FROM HDOC_VARIABLES WHERE VARIABLE = ?`, [TEST_VARIABLE]);
}
