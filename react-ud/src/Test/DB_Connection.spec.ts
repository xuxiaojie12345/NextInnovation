import mysql from 'mysql2/promise';
import { test, expect } from '@playwright/test';

// ============================================================
// 数据库连接配置
// 连接本地 MySQL 时使用默认值即可
// ============================================================

const DB_CONFIG = {
  host: '172.17.0.63',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'react_ud',
  charset: 'utf8mb4',
  connectTimeout: 10000,
};

let connection: mysql.Connection | null = null;

/**
 * 获取数据库连接（单例，复用连接）
 */
async function getConnection(): Promise<mysql.Connection> {
  if (connection !== null) {
    try {
      await (connection as any).execute('SELECT 1');
      return connection;
    } catch {
      connection = null;
    }
  }
  try {
    connection = await mysql.createConnection(DB_CONFIG);
  } catch (err) {
    console.error('数据库连接失败:', err);
    throw err;
  }
  return connection;
}

/**
 * 关闭数据库连接
 */
async function closeConnection(): Promise<void> {
  if (connection !== null) {
    try {
      await connection.end();
    } catch {
      // ignore
    } finally {
      connection = null;
    }
  }
}

/**
 * 执行查询（SELECT），返回结果行
 */
async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const conn = await getConnection();
  const [rows] = await (conn as any).query(sql, params);
  return rows as T[];
}

/**
 * 执行单行查询（SELECT），返回第一行或 null
 */
async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// ============================================================
// E2E 测试：React 登录 → SpringBoot 处理 → DB 数据校验
//
// ★ 请根据数据库中实际存在的用户修改以下值 ★
// ============================================================

const BASE_URL = 'http://localhost:3000';
const REAL_USER = 'admin';       // ← 替换为数据库中存在的 UserID
const REAL_PASS = 'admin123';    // ← 替换为正确的密码
const NON_EXIST_USER = 'nonexist99999';
const WRONG_PASS = 'WrongPass999';

test.describe('E2E 登录全链路测试', () => {
  test.afterAll(async () => {
    await closeConnection();
  });

  test('登录成功 → 跳转Menu → DB数据校验', async ({ page }) => {
    test.setTimeout(120000);
    // ===================== 1. 操作 React 前端 =====================
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 输入表单
    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);

    // 点击登录按钮
    await page.locator('button[type="submit"]').click();

    // 等待登录成功 → 跳转到 /Menu
    await page.waitForURL('**/Menu');
    await page.waitForSelector('.app-layout');

    // ===================== 2. 直接查 DB 校验 =====================
    // 查询用户表，验证数据库中该用户存在
    const user = await queryOne<any>(
      'SELECT USERID, USERNAME FROM hdoc_user_infor WHERE USERID = ?',
      [REAL_USER]
    );

    // 断言：用户必须存在
    expect(user).not.toBeNull();
    expect(user!.USERID).toBe(REAL_USER);
    expect(user!.USERNAME).toBeDefined();

    console.log('✅ E2E 登录验证通过:', user);
  });

  test('登录失败_用户不存在 → 停留在登录页', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(NON_EXIST_USER);
    await page.locator('#password').fill(REAL_PASS);
    await page.locator('button[type="submit"]').click();

    // 等待后端返回错误消息
    await page.waitForSelector('.error-message', { timeout: 10000 });
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('登录失败_密码错误 → 停留在登录页', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(WRONG_PASS);
    await page.locator('button[type="submit"]').click();

    // 等待后端返回错误消息
    await page.waitForSelector('.error-message', { timeout: 10000 });
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('登录失败_空字段 → 显示前端校验提示', async ({ page }) => {
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');

    // 不输入密码，直接点击登录（前端校验，不触发 API）
    await page.locator('#userID').fill(REAL_USER);
    await page.locator('button[type="submit"]').click();

    // 前端立即显示错误消息
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});
