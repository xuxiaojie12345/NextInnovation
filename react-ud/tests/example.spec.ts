import { test, expect } from '@playwright/test';
import { query, queryOne } from './db';

// ============================================================
// 示例：在测试中操作前端后，直接查数据库校验数据
// ============================================================

test('React登录 → SpringBoot处理 → DB数据校验', async ({ page }) => {
  // ===================== 1. 操作 React 前端 =====================
  await page.goto('http://localhost:3000/login');

  await page.getByPlaceholder('用户名').fill('testuser');
  await page.getByPlaceholder('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL('**/dashboard');

  // ===================== 2. 直接查 DB 校验 =====================
  const rows = await query(
    `SELECT id, username, last_login_time, status 
     FROM sys_user 
     WHERE username = ?`,
    ['testuser']
  );

  expect(rows.length).toBe(1);
  expect(rows[0].status).toBe('ACTIVE');
  expect(rows[0].last_login_time).not.toBeNull();

  console.log('✅ 数据库校验通过', rows[0]);
});

// ============================================================
// 也可以保持原来的 Playwright 官方示例做基础冒烟测试
// ============================================================

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
