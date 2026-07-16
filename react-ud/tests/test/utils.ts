/**
 * Playwright 自动化测试共通工具
 *
 * 提供全模块通用的 DB 连接、截图、登录等功能。
 * 所有 spec.ts 文件应从此文件导入共通函数，避免重复定义。
 */

import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ═══════════════════════════════════════════════════════════
// 常量配置
// ═══════════════════════════════════════════════════════════

export const PAGE_URL = 'http://localhost:3000';

export const DB_CONFIG = {
  host: '172.17.0.63',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'react_ud',
  waitForConnections: true,
  connectionLimit: 2,
  connectTimeout: 5000,
};

// ═══════════════════════════════════════════════════════════
// 数据库
// ═══════════════════════════════════════════════════════════

let mysql: any;
try {
  mysql = require('mysql2/promise');
} catch { /* 未安装 mysql2 */ }

/**
 * 执行 SQL 查询
 * @param sql SQL 语句
 * @param params 参数列表
 * @returns 结果数组，失败时返回 null
 */
export async function queryDB(sql: string, params?: any[]): Promise<any[] | null> {
  if (!mysql) return null;
  let conn: any = null;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.execute(sql, params || []);
    return rows as any[];
  } catch (e: any) {
    console.log(`  DB跳过 (${e.code || e.message})`);
    return null;
  } finally {
    if (conn) try { await conn.end(); } catch { /* ignore */ }
  }
}

/**
 * 取得测试用户（从 hdoc_user_infor 表取第一条记录）
 */
export async function getTestUser(): Promise<{ userid: string; password: string; username: string } | null> {
  const rows = await queryDB('SELECT USERID, PASSWORD, USERNAME FROM hdoc_user_infor LIMIT 1');
  if (rows && rows.length > 0) {
    return { userid: rows[0].USERID, password: rows[0].PASSWORD, username: rows[0].USERNAME };
  }
  return null;
}

/**
 * 登录（跳转到首页 → 输入账号密码 → 跳转到 Menu）
 */
export async function login(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto(PAGE_URL, { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
}

// ═══════════════════════════════════════════════════════════
// 截图（每个模块独立计数器 + 独立目录）
// ═══════════════════════════════════════════════════════════

/**
 * 创建截图函数（每个 spec 文件调用一次，获取本模块的截图函数）
 * @param moduleName 模块名，如 'UD10'
 * @returns ss(page, step) 截图函数
 */
export function createScreenshot(moduleName: string) {
  const SCREENSHOT_DIR = path.resolve(__dirname, 'Image', moduleName);
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // 扫描目录，从现有最大序号继续顺番
  let screenshotCounter = 0;
  try {
    const files = fs.readdirSync(SCREENSHOT_DIR);
    const seqs = files
      .map(f => parseInt(f.match(/ピクチャー(\d+)/)?.[1] || '0', 10))
      .filter(n => n > 0);
    if (seqs.length > 0) screenshotCounter = Math.max(...seqs);
  } catch { /* 无文件则从0开始 */ }

  return async function ss(page: Page, step: string, testNumber?: string) {
    screenshotCounter++;
    const seq = String(screenshotCounter).padStart(3, '0');
    const prefix = testNumber ? `${testNumber}-` : '';
    const name = `${prefix}${moduleName}画面ピクチャー${seq}.jpeg`;

    // 等待网络请求完成（最多 5 秒，避免 WebSocket 导致挂起）
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);

    // 判断是否在 Menu 页面内（含 .menu-root 的布局）
    const isMenuPage = await page.evaluate(() => !!document.querySelector('.menu-root'));

    if (isMenuPage) {
      // Menu 页面：解除父容器滚动限制，用 fullPage 拍完整内容
      await page.evaluate(() => {
        const root = document.querySelector('.menu-root') as HTMLElement;
        if (root) {
          root.style.overflow = 'visible';
          root.style.height = 'auto';
        }
        const main = document.querySelector('.menu-main') as HTMLElement;
        if (main) main.style.overflow = 'visible';
      });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), fullPage: true, type: 'jpeg', quality: 85 });
    } else {
      // 非 Menu 页面（如登录页）：固定 100vh 布局，用视口截图
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), type: 'jpeg', quality: 85 });
    }
    console.log(`  📸 ${name} (${step})`);
  };
}

// ═══════════════════════════════════════════════════════════
// DB 全字段验证通用函数
// ═══════════════════════════════════════════════════════════

/**
 * 通用全字段验证：查询指定表、指定主键的记录，逐一核对字段值
 * @param table 表名
 * @param keyColumn 主键列名
 * @param keyValue 主键值
 * @param expected 期望的字段键值对
 * @param action 操作类型：'add' | 'update' | 'delete'
 */
export async function assertDbRecord(
  table: string,
  keyColumn: string,
  keyValue: string,
  expected: Record<string, any>,
  action: 'add' | 'update' | 'delete' = 'add',
) {
  const rows = await queryDB(`SELECT * FROM ${table} WHERE ${keyColumn} = ?`, [keyValue]);

  if (action === 'delete') {
    // 删除操作：确认记录已不存在
    expect(rows?.length ?? 0).toBe(0);
    console.log(`  ✅ DB全字段验证: 记录已删除 (${table}.${keyColumn}=${keyValue})`);
    return;
  }

  // Add / Update：确认记录存在
  expect(rows?.length).toBe(1);
  if (!rows || rows.length === 0) return;

  const record = rows[0];
  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = record[field] !== null && record[field] !== undefined ? String(record[field]) : '';
    if (expectedValue === '__NOT_NULL__') {
      expect(actualValue).not.toBe('');
      console.log(`  ✅ ${field}: ${actualValue} (不为空)`);
    } else {
      expect(actualValue).toBe(String(expectedValue));
      console.log(`  ✅ ${field}: "${actualValue}" === "${expectedValue}"`);
    }
  }
  console.log(`  ✅ DB全字段验证通过: ${table}.${keyColumn}=${keyValue}`);
}

/**
 * 复合主键全字段验证：适用于 (PC, num, MARKET) 等多列主键的表
 * @param table 表名
 * @param keyConditions 主键条件键值对，如 { PC: 'P1', num: '123', MARKET: 'JPN' }
 * @param expected 期望的字段键值对
 * @param action 操作类型：'add' | 'update' | 'delete'
 */
export async function assertDbRecordComposite(
  table: string,
  keyConditions: Record<string, string>,
  expected: Record<string, any>,
  action: 'add' | 'update' | 'delete' = 'add',
) {
  const whereClause = Object.entries(keyConditions)
    .map(([k, v]) => `${k} = ?`)
    .join(' AND ');
  const params = Object.values(keyConditions);
  const rows = await queryDB(`SELECT * FROM ${table} WHERE ${whereClause}`, params);

  if (action === 'delete') {
    expect(rows?.length ?? 0).toBe(0);
    console.log(`  ✅ DB全字段验证: 记录已删除 (${table})`);
    return;
  }

  expect(rows?.length).toBe(1);
  if (!rows || rows.length === 0) return;

  const record = rows[0];
  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = record[field] !== null && record[field] !== undefined ? String(record[field]) : '';
    if (expectedValue === '__NOT_NULL__') {
      expect(actualValue).not.toBe('');
      console.log(`  ✅ ${field}: ${actualValue} (不为空)`);
    } else {
      expect(actualValue).toBe(String(expectedValue));
      console.log(`  ✅ ${field}: "${actualValue}" === "${expectedValue}"`);
    }
  }
  console.log(`  ✅ DB全字段验证通过: ${table} (${whereClause})`);
}
