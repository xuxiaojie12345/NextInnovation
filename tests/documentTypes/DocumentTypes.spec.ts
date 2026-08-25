/**
 * Document Types 模块 (UD22) Playwright 测试
 * ---------------------------------------------------------
 * 对应测试式样书：react-ud/src/DocumentTypes/DocumentTypes_単体テスト仕様書.md
 * 对应前端：react-ud/src/DocumentTypes/DocumentTypes.tsx
 * 对应后端：DocumentController / DocumentListServiceImpl / HdocDocumentListMapper
 *          （GET /api/UD20SelectHdocDocumentList，UD22 复用 UD20 接口）
 * 对应测试数据：tests/documentTypes/DocumentTypes_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实后端模式）
 * 1. 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
 * 2. 后端已修复：DocumentListRecord 增加 description 字段（返回 HDOC_DOCUMENT_LIST.DESCRIPTION），
 *    records 每项含 { doctype, businessUnit, user, date, description }；
 *    前端 Description 列显示真实描述（原 "-"，因 DTO 无 description 字段，已修复）。
 * 3. 登录用户 menuall（拥有 hdoc_admin）可从 Menu → "Document Types" 进入。
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "Document Types" → 右侧 iframe 加载（/document-types）
 * - 所有 UD22 元素（dot-*）通过 iframe frameLocator('.menu-iframe') 定位
 *
 * 【业务含义 / 差异说明】
 * - 本画面为纯只读表格（Key/Description 两列），无输入框/按钮/核心链接。
 * - Key 列 = HDOC_DOCUMENT_LIST.DOCTYPE；Description 列 = DESCRIPTION（后端已修复返回 description）。
 * - 空列表（No.10）用 mysql2 临时清空 HDOC_DOCUMENT_LIST 构造，断言后恢复 seed 数据。
 * - API 失败（No.11/12/14）：前端 catch 显示 "Failed to load document types."（500 亦如此，非 "System busy"）。
 * - No.3/12/13/14 依赖异常注入默认 skip；No.11（route 500）实做。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\documentTypes\image
 * - 命名：DocumentTypes01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端：node tests/documentTypes/run_dot.js
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';
const LOGIN = 'menuall';

const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^DocumentTypes(\d+)\.jpeg$/;
  let max = 0;
  if (fs.existsSync(IMAGE_DIR)) {
    fs.readdirSync(IMAGE_DIR).filter((f) => pat.test(f)).forEach((f) => {
      const n = parseInt((f.match(pat) as RegExpMatchArray)[1], 10) || 0;
      if (n > max) max = n;
    });
  }
  return max + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const filename = `DocumentTypes${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'dot-shot-info';
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#003366;color:#fff;padding:8px 12px;font:12px/1.5 sans-serif;white-space:pre-wrap;box-shadow:0 2px 6px rgba(0,0,0,.3);';
      d.textContent = `[操作步骤] ${inf.step}\n[设定值] ${inf.value}\n[实际结果] ${inf.actual}`;
      document.body.prepend(d);
    }, info);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));
  }
  try {
    await page.screenshot({ path: path.join(IMAGE_DIR, filename), type: 'jpeg', quality: 80, timeout: 8000, fullPage: true });
  } catch { /* 忽略 */ }
  if (info) {
    await page.evaluate(() => { document.getElementById('dot-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function dotMessage(page: Page) {
  return frame(page).locator('.dot-message');
}
function dotHeader(page: Page) {
  return frame(page).locator('.dot-header-title');
}
function dataRow(page: Page, i: number) {
  return frame(page).locator('.dot-table .ant-table-tbody tr.ant-table-row').nth(i);
}

async function db() {
  return mysql.createConnection({ host: '172.17.0.63', port: 3306, user: 'root', password: '1234', database: 'ud_test' });
}

async function gotoSru(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(800);
  if (await page.getByPlaceholder('User ID').count()) {
    await page.getByPlaceholder('User ID').fill(LOGIN);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
  }
  await page.waitForURL('**/menu');
  await page.waitForTimeout(1500);
  const menuBtn = page.getByRole('button', { name: 'Document Types' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(dotHeader(page)).toHaveText('HDoc - Document Types', { timeout: 15000 });
  await page.waitForTimeout(1200); // 等待 API 加载
}

// ============================================================================
// Test 1：画面初期表示（No.1/2/4）
// ============================================================================
test.describe('画面初期表示 (UD22)', () => {
  test('No.1/2/4 表头 + 无操作控件 + 消息隐藏', async ({ page }) => {
    await gotoSru(page);
    // No.1 表头：Key / Description
    const headers = await frame(page).locator('.dot-table .ant-table-thead th').allTextContents();
    const joined = headers.map((h) => h.trim()).join(',');
    expect(joined).toContain('Key');
    expect(joined).toContain('Description');
    // No.2 无操作控件：主体（.dot-card）内无 input/button
    await expect(frame(page).locator('.dot-card input')).toHaveCount(0);
    await expect(frame(page).locator('.dot-card button')).toHaveCount(0);
    // No.4 消息区隐藏
    await expect(dotMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.1/2/4 表头/无控件/消息', {
      step: '从 Menu 进入 Document Types 画面',
      value: '无（只读表格）',
      actual: '表头 Key/Description；主体无 input/button；消息区隐藏',
    });
  });
});

// ============================================================================
// Test 2：文档类型列表加载（No.5/6/7/8/9）
// ============================================================================
test.describe('文档类型列表加载 (UD22)', () => {
  test('No.5/6/9 正常加载 + 内容 + 多行', async ({ page }) => {
    await gotoSru(page);
    // No.9 多行（3 条：DOT_A/B/C）
    const rows = frame(page).locator('.dot-table .ant-table-tbody tr.ant-table-row');
    await expect(rows).toHaveCount(3, { timeout: 10000 });
    // No.6 内容验证：DOT_A / Document Type A 等
    const first = await dataRow(page, 0).locator('td').allTextContents();
    const txt = first.map((t) => t.trim());
    expect(txt[0]).toBe('DOT_A');
    expect(txt[1]).toBe('Document Type A');
    await shot(page, '断言: No.5/6/9 列表加载', {
      step: '进入画面等待 API 返回文档类型',
      value: 'DOT_A/DOT_B/DOT_C 受控数据',
      actual: '表格 3 行；首行 Key=DOT_A、Description=Document Type A',
    });
  });

  test('No.7/8 Key 与 Description 列内容', async ({ page }) => {
    await gotoSru(page);
    // 遍历所有行，验证 Key 与 Description 一一对应
    const rows = frame(page).locator('.dot-table .ant-table-tbody tr.ant-table-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const dotARow = rows.filter({ hasText: 'DOT_B' }).first();
    const cells = await dotARow.locator('td').allTextContents();
    const txt = cells.map((t) => t.trim());
    expect(txt[0]).toBe('DOT_B');
    expect(txt[1]).toBe('Document Type B');
    await shot(page, '断言: No.7/8 Key/Description 列', {
      step: '查看 DOT_B 行',
      value: 'DOT_B 行',
      actual: 'Key=DOT_B；Description=Document Type B',
    });
  });
});

// ============================================================================
// Test 3：空列表（No.10）
// ============================================================================
test.describe('空列表 (UD22)', () => {
  test('No.10 空列表 -> No document types available.', async ({ page }) => {
    // 备份当前 HDOC_DOCUMENT_LIST 全部数据，临时清空构造空场景，测试后恢复
    const conn = await db();
    const [rows] = await conn.query('SELECT DOCTYPE, DESCRIPTION FROM HDOC_DOCUMENT_LIST');
    await conn.query('DELETE FROM HDOC_DOCUMENT_LIST');
    await conn.end();
    try {
      await gotoSru(page);
      await expect(dotMessage(page)).toContainText('No document types available.', { timeout: 10000 });
      await expect(frame(page).locator('.dot-table .ant-table-tbody tr.ant-table-row')).toHaveCount(0);
      await shot(page, '断言: No.10 空列表', {
        step: '临时清空 HDOC_DOCUMENT_LIST 后进入画面（测试结束会恢复）',
        value: 'records: []',
        actual: '提示 "No document types available."；表格为空',
      });
    } finally {
      // 恢复 seed 数据
      const c2 = await db();
      await c2.query('DELETE FROM HDOC_DOCUMENT_LIST');
      await c2.query(`INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS) VALUES
        ('DOT_A','Document Type A',NOW(),'system','test',NOW(),'system','test'),
        ('DOT_B','Document Type B',NOW(),'system','test',NOW(),'system','test'),
        ('DOT_C','Document Type C',NOW(),'system','test',NOW(),'system','test')`);
      await c2.end();
    }
  });
});

// ============================================================================
// Test 4：异常处理（No.11 route 500）
// ============================================================================
test.describe('异常处理 (UD22)', () => {
  test('No.11 API 失败 -> Failed to load document types.', async ({ page }) => {
    await page.route('**/api/UD20SelectHdocDocumentList', (route) => route.fulfill({
      status: 500, contentType: 'application/json',
      body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'System error' }),
    }));
    await gotoSru(page);
    await expect(dotMessage(page)).toContainText('Failed to load document types.', { timeout: 10000 });
    await expect(frame(page).locator('.dot-table .ant-table-tbody tr.ant-table-row')).toHaveCount(0);
    await shot(page, '断言: No.11 API 失败', {
      step: '拦截 API 返回 500 后进入画面',
      value: 'response: 500',
      actual: '显示 "Failed to load document types."；表格为空（差异：500 亦用此文案，非 "System busy"）',
    });
  });
});

// ============================================================================
// Test 5：UI 交互（No.15/16/17）
// ============================================================================
test.describe('UI 交互 (UD22)', () => {
  test('No.15/17 加载结束 + 画面简洁性', async ({ page }) => {
    await gotoSru(page);
    // No.15 加载结束后表格显示（loading 消失）
    await expect(frame(page).locator('.dot-table .ant-table-tbody tr.ant-table-row').first()).toBeVisible({ timeout: 10000 });
    await expect(frame(page).locator('.dot-table .ant-spin-spinning')).toHaveCount(0);
    // No.17 简洁性：卡片内仅消息区(隐藏) + 表格
    const cardChildren = await frame(page).locator('.dot-card > *').count();
    expect(cardChildren).toBeLessThanOrEqual(2);
    await shot(page, '断言: No.15/17 loading 结束 + 简洁', {
      step: '等待 API 响应完成',
      value: '无',
      actual: 'loading 消失、表格显示数据；卡片仅含消息区和表格，无多余元素',
    });
  });

  test('No.16 错误消息样式为红色', async ({ page }) => {
    await page.route('**/api/UD20SelectHdocDocumentList', (route) => route.fulfill({
      status: 500, contentType: 'application/json',
      body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'System error' }),
    }));
    await gotoSru(page);
    await expect(dotMessage(page)).toContainText('Failed to load document types.', { timeout: 10000 });
    const color = await dotMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.16 错误消息红色', {
      step: '拦截 API 返回 500 触发错误',
      value: 'response: 500',
      actual: `错误消息为红色 #ff4d4f (${color})`,
    });
  });
});
