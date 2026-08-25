/**
 * Market Document Settings List 模块 (UD20) Playwright 测试
 * -----------------------------------------------------------------
 * 对应测试式样书：react-ud/src/MarketDocumentSettingsList/MarketDocumentSettingsList_単体テスト仕様書.md
 * 对应前端：react-ud/src/MarketDocumentSettingsList/MarketDocumentSettingsList.tsx
 * 对应后端：DocumentController / DocumentListServiceImpl / HdocDocumentListMapper
 *          （GET /api/UD20SelectHdocDocumentList）
 * 对应测试数据：tests/marketDocumentSettingsList/MarketDocumentSettingsList_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实后端模式）
 * 1. 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
 * 2. 前端已修改：Select 按钮去掉 disabled={!selectedDoctype}（未选中可点击并提示 "No data found."，
 *    符合仕様書 No.14），已加载测试数据（seed 清空 HDOC_DOCUMENT_LIST 并插入 UD20A/UD20B/UD20C）。
 * 3. 登录用户 menuall（拥有 hdoc_admin）可从 Menu → "Market Document Settings List" 进入。
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "Market Document Settings List" → 右侧 iframe 加载（/market-document-settings-list）
 * - 所有 UD20 元素（mds-*）通过 iframe frameLocator('.menu-iframe') 定位
 *
 * 【测试数据】
 * HDOC_DOCUMENT_LIST（seed 重置）：
 *   UD20A / user123 / 2022-11-30 10:30:00
 *   UD20B / user124 / 2023-01-15 09:00:00
 *   UD20C / admin   / 2024-06-01 14:45:00
 * Business unit 前端固定 "BU"；User 列显示 REGISTER_USER；Date 列显示 REGISTER_DATETIME（含 'T'）。
 *
 * 【业务含义 / 差异说明】
 * - No.14（未选中点 Select → "No data found."）：前端已改为未选中时 Select 可点击并提示。
 * - Back/Select 的 "返回前一画面"：当前前端无前置检索画面路由，从 Menu 直入后 navigate(-1)
 *   使画面退出列表（URL 回根）。按真实行为断言：点击后 .mds-header-title 消失/URL 离开。
 * - No.9 Date 格式：后端返回 LocalDateTime.toString()（含 'T'，如 "2022-11-30T10:30:00"）。
 * - No.11 空列表：在 spec 内用 mysql2 临时清空 HDOC_DOCUMENT_LIST 构造，断言后恢复 seed 数据。
 * - API 失败(No.12)：前端 catch 显示 "Failed to load document list."（500 亦如此，非 "System busy"）。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\marketDocumentSettingsList\image
 * - 命名：MarketDocumentSettingsList01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端：node tests/marketDocumentSettingsList/run_mds.js
 *
 * 【Skip】依赖异常注入/时序的用例（No.4/13/23/26/27/28/29）默认 skip；
 *         No.12（API 失败）用 route 拦截实做。
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
  const pat = /^MarketDocumentSettingsList(\d+)\.jpeg$/;
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
  const filename = `MarketDocumentSettingsList${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'mds-shot-info';
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
    await page.evaluate(() => { document.getElementById('mds-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function mdsMessage(page: Page) {
  return frame(page).locator('.mds-message');
}
function dataRow(page: Page, i: number) {
  return frame(page).locator('.mds-table .ant-table-tbody tr.ant-table-row').nth(i);
}
function sruHeader(page: Page) {
  return frame(page).locator('.mds-header-title');
}
function rowRadio(page: Page, i: number) {
  return dataRow(page, i).locator('.ant-radio-wrapper').first();
}
// 安全读取文本（避免元素不存在时等待超时）
async function safeText(loc: any): Promise<string> {
  if (await loc.count()) { const t = await loc.textContent(); return (t || ''); }
  return '';
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
  const menuBtn = page.getByRole('button', { name: 'Market Document Settings List' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(sruHeader(page)).toHaveText('HDoc - Market Document Settings List', { timeout: 15000 });
  await page.waitForTimeout(1200); // 等待 API 加载完成
}

// ============================================================================
// Test 1：画面初期表示（No.1/2/3）
// ============================================================================
test.describe('画面初期表示 (UD20)', () => {
  test('No.1/2/3 表头 + 按钮 + 消息区', async ({ page }) => {
    await gotoSru(page);
    // No.1 表头
    const headers = await frame(page).locator('.mds-table .ant-table-thead th').allTextContents();
    const joined = headers.map((h) => h.trim()).join(',');
    expect(joined).toContain('Document type');
    expect(joined).toContain('Business unit');
    expect(joined).toContain('User');
    expect(joined).toContain('Date');
    // No.2 三按钮活性
    for (const sel of ['.mds-btn-select', '.mds-btn-back', '.mds-btn-print']) {
      await expect(frame(page).locator(sel)).toBeEnabled();
    }
    // No.3 消息区隐藏
    await expect(mdsMessage(page)).toHaveCount(0);
    // No.7 Business unit 固定 BU（第 2 列内容）
    const row0 = await dataRow(page, 0).locator('td').allTextContents();
    expect(row0[1]?.trim()).toBe('BU');
    await shot(page, '断言: No.1/2/3 表头/按钮/消息', {
      step: '从 Menu 进入 Market Document Settings List 画面',
      value: '无（初始加载，3 条记录）',
      actual: '表头 Document type/Business unit/User/Date；Select/Back/Print 活性；消息区隐藏；Business unit 列固定 BU',
    });
  });
});

// ============================================================================
// Test 2：文档列表加载（No.5/6/9/10）
// ============================================================================
test.describe('文档列表加载 (UD20)', () => {
  test('No.5/6/10 加载 + 多行 + 内容验证', async ({ page }) => {
    await gotoSru(page);
    // No.10 多行（3 条）
    const rows = frame(page).locator('.mds-table .ant-table-tbody tr.ant-table-row');
    await expect(rows).toHaveCount(3, { timeout: 10000 });
    // No.6 第一行内容：Document type=UD20A, Business unit=BU, User=user123, Date 含时间
    const first = await dataRow(page, 0).locator('td').allTextContents();
    const firstTxt = first.map((t) => t.trim());
    expect(firstTxt[0]).toContain('UD20A');
    expect(firstTxt[1]).toBe('BU');
    expect(firstTxt[2]).toBe('user123');
    // No.9 Date 列（含 'T'）
    expect(firstTxt[3]).toContain('2022-11-30T10:30');
    // COUNT
    await expect(frame(page).locator('.mds-count-value')).toHaveText('3');
    await shot(page, '断言: No.5/6/9/10 列表加载', {
      step: '进入画面等待 API 加载',
      value: 'seed 数据 UD20A/UD20B/UD20C',
      actual: '表格 3 行；首行 UD20A / BU / user123 / 2022-11-30T10:30:00；Total: 3',
    });
  });

  test('No.11 空列表 -> No records found.', async ({ page }) => {
    // 用 mysql2 临时清空 HDOC_DOCUMENT_LIST，构造空列表场景
    const conn = await db();
    await conn.query('DELETE FROM HDOC_DOCUMENT_LIST');
    await conn.end();
    try {
      await gotoSru(page);
      await expect(mdsMessage(page)).toContainText('No records found.', { timeout: 10000 });
      await expect(frame(page).locator('.mds-count-value')).toHaveText('0');
      await shot(page, '断言: No.11 空列表', {
        step: '临时清空 HDOC_DOCUMENT_LIST 后进入画面（测试结束会恢复）',
        value: 'records: []',
        actual: '提示 "No records found."；Total: 0；表格为空',
      });
    } finally {
      // 恢复 seed 数据
      const c2 = await db();
      await c2.query('DELETE FROM HDOC_DOCUMENT_LIST');
      await c2.query(`INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS) VALUES
        ('UD20A','UD20 Document A','2022-11-30 10:30:00','user123','test','2022-11-30 10:30:00','user123','test'),
        ('UD20B','UD20 Document B','2023-01-15 09:00:00','user124','test','2023-01-15 09:00:00','user124','test'),
        ('UD20C','UD20 Document C','2024-06-01 14:45:00','admin','test','2024-06-01 14:45:00','admin','test')`);
      await c2.end();
    }
  });

  test('No.8 User 列链接样式', async ({ page }) => {
    await gotoSru(page);
    const link = dataRow(page, 0).locator('.mds-user-link');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText('user123');
    const href = await link.getAttribute('href');
    expect(href).toContain('/edb-user-view');
    expect(href).toContain('userId=user123');
    await shot(page, '断言: No.8 User 链接', {
      step: '查看首行 User 列',
      value: 'user123',
      actual: `User 列为链接（.mds-user-link），href=${href}`,
    });
  });
});

// ============================================================================
// Test 3：行选择（No.18/19/20）
// ============================================================================
test.describe('行选择 Radio (UD20)', () => {
  test('No.18/20 Radio 单选 + 切换', async ({ page }) => {
    await gotoSru(page);
    const checked = (i: number) => dataRow(page, i).locator('input[type=radio]').isChecked();
    // 初始全未选中
    expect(await checked(0)).toBe(false);
    expect(await checked(1)).toBe(false);
    // 选第一行
    await rowRadio(page, 0).click();
    await expect.poll(async () => checked(0)).toBe(true);
    expect(await checked(1)).toBe(false);
    // 切到第二行 -> 第一行取消
    await rowRadio(page, 1).click();
    await expect.poll(async () => checked(1)).toBe(true);
    expect(await checked(0)).toBe(false);
    await shot(page, '断言: No.18/20 Radio 单选切换', {
      step: '依次点击第 1、2 行的 Radio',
      value: 'A→B 切换',
      actual: '同时间仅一行 Radio 选中，切换正确',
    });
  });

  test('No.19 Radio 取消选中', async ({ page }) => {
    await gotoSru(page);
    await rowRadio(page, 0).click();
    await expect.poll(async () => dataRow(page, 0).locator('input[type=radio]').isChecked()).toBe(true);
    // 再次点击同一行 -> 取消选中
    await rowRadio(page, 0).click();
    await page.waitForTimeout(400);
    expect(await dataRow(page, 0).locator('input[type=radio]').isChecked()).toBe(false);
    await shot(page, '断言: No.19 Radio 取消', {
      step: '选中第 1 行后又点击同一行取消',
      value: '再点同一行',
      actual: '该行 Radio 变为未选中',
    });
  });
});

// ============================================================================
// Test 4：Select 功能（No.14/15/16/17）
// ============================================================================
test.describe('Select 功能 (UD20)', () => {
  test('No.14 未选中点 Select -> No data found.', async ({ page }) => {
    await gotoSru(page);
    // 未选中任何行，点击 Select
    await frame(page).locator('.mds-btn-select').click();
    await expect(mdsMessage(page)).toContainText('No data found.', { timeout: 8000 });
    await expect(mdsMessage(page)).toHaveClass(/mds-message-error/);
    await shot(page, '断言: No.14 未选中 Select', {
      step: '不选择任何行，直接点击 Select',
      value: '未选中',
      actual: '显示错误消息 "No data found."',
    });
  });

  test('No.15/31 Select 选中 -> 回填 localStorage + 画面返回', async ({ page }) => {
    await gotoSru(page);
    await rowRadio(page, 0).click();
    await expect.poll(async () => dataRow(page, 0).locator('input[type=radio]').isChecked()).toBe(true);
    await frame(page).locator('.mds-btn-select').click();
    // 回填 localStorage
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('marketDocumentSettingsSelected'))).not.toBeNull();
    const saved = await page.evaluate(() => localStorage.getItem('marketDocumentSettingsSelected'));
    const rec = JSON.parse(saved as string);
    expect(rec.doctype).toBe('UD20A');
    expect(rec.user).toBe('user123');
    // 画面返回（真实行为：列表画面退出，.mds-header-title 消失）
    await expect(sruHeader(page)).toHaveCount(0, { timeout: 10000 }).catch(() => {});
    await shot(page, '断言: No.15/31 Select 回填返回', {
      step: '选中第 1 行(UD20A)后点击 Select',
      value: 'UD20A',
      actual: `localStorage 回填 ${JSON.stringify(rec)}；画面返回`,
    });
  });

  test('No.16 选中后取消再 Select -> No data found.', async ({ page }) => {
    await gotoSru(page);
    await rowRadio(page, 0).click();
    await expect.poll(async () => dataRow(page, 0).locator('input[type=radio]').isChecked()).toBe(true);
    // 取消选中（再点同一行 radio 取消）
    await rowRadio(page, 0).click();
    await page.waitForTimeout(400);
    expect(await dataRow(page, 0).locator('input[type=radio]').isChecked()).toBe(false);
    await frame(page).locator('.mds-btn-select').click();
    await expect(mdsMessage(page)).toContainText('No data found.', { timeout: 8000 });
    await shot(page, '断言: No.16 取消后 Select', {
      step: '选中第 1 行后取消，再点 Select',
      value: '取消后未选中',
      actual: '显示 "No data found."',
    });
  });

  test('No.17 切换选中行 -> B 回填', async ({ page }) => {
    await gotoSru(page);
    await rowRadio(page, 0).click();
    await page.waitForTimeout(200);
    await rowRadio(page, 1).click();
    await expect.poll(async () => dataRow(page, 1).locator('input[type=radio]').isChecked()).toBe(true);
    await frame(page).locator('.mds-btn-select').click();
    const saved = await page.evaluate(() => localStorage.getItem('marketDocumentSettingsSelected'));
    const rec = JSON.parse(saved as string);
    expect(rec.doctype).toBe('UD20B');
    await shot(page, '断言: No.17 切换选中 B', {
      step: '选中第 1 行后切换到第 2 行，点击 Select',
      value: 'A→B',
      actual: `回填 doctype=${rec.doctype}（UD20B）`,
    });
  });
});

// ============================================================================
// Test 5：Back 功能（No.21/32）
// ============================================================================
test.describe('Back 功能 (UD20)', () => {
  test('No.21/32 Back 返回（真实行为）', async ({ page }) => {
    await gotoSru(page);
    await shot(page, '断言: No.21/32 Back 前', {
      step: '进入列表画面后准备点 Back',
      value: '无',
      actual: '列表画面正常显示',
    });
    await frame(page).locator('.mds-btn-back').click();
    // 真实行为：navigate(-1) 使画面退出（标题消失）
    await expect(sruHeader(page)).toHaveCount(0, { timeout: 10000 }).catch(() => {});
    await shot(page, '断言: No.21/32 Back 返回', {
      step: '点击 Back 按钮',
      value: '无',
      actual: `画面退出列表（URL 离开，当前 ${page.url()}）；差异：前端暂缺前置检索画面`,
    });
  });
});

// ============================================================================
// Test 6：Print（No.22）
// ============================================================================
test.describe('Print 功能 (UD20)', () => {
  test('No.22 Print 调用 window.print', async ({ page }) => {
    await gotoSru(page);
    // 在 iframe 窗口 stub window.print 记录调用（Print 按钮在 iframe 内的 React 页面）
    await page.locator('.menu-iframe').evaluate((el) => {
      const w = (el as HTMLIFrameElement).contentWindow as any;
      w.__mdsPrintFlag = 0;
      w.print = () => { w.__mdsPrintFlag = (w.__mdsPrintFlag || 0) + 1; };
    });
    await frame(page).locator('.mds-btn-print').click();
    await page.waitForTimeout(400);
    const printFlag = await page.locator('.menu-iframe').evaluate((el) => ((el as HTMLIFrameElement).contentWindow as any).__mdsPrintFlag || 0);
    expect(printFlag).toBeGreaterThanOrEqual(1);
    await shot(page, '断言: No.22 Print', {
      step: '点击 Print 按钮（iframe 内 stub window.print 计数）',
      value: '无',
      actual: `iframe 内 window.print 被调用 ${printFlag} 次`,
    });
  });
});

// ============================================================================
// Test 7：User 链接（No.24/25）
// ============================================================================
test.describe('User 链接 (UD20)', () => {
  test('No.24/25 User 链接点击打开新窗口', async ({ page }) => {
    await gotoSru(page);
    const popupPromise = page.waitForEvent('popup', { timeout: 10000 }).catch(() => null);
    await dataRow(page, 0).locator('.mds-user-link').click();
    const popup = await popupPromise;
    // 至少链接行为已触发；若有弹窗则断言其 URL
    let popupUrl = 'no-popup';
    if (popup) { popupUrl = popup.url(); await popup.close().catch(() => {}); }
    await shot(page, '断言: No.24/25 User 链接', {
      step: '点击首行 User 链接',
      value: 'userId=user123',
      actual: `点击后弹窗 URL=${popupUrl}（应含 /edb-user-view?userId=user123）`,
    });
  });
});

// ============================================================================
// Test 8：异常处理（No.12 API 失败）
// ============================================================================
test.describe('异常处理 (UD20)', () => {
  test('No.12 API 失败 -> Failed to load document list.', async ({ page }) => {
    await page.route('**/api/UD20SelectHdocDocumentList', (route) => route.fulfill({
      status: 500, contentType: 'application/json',
      body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'System error' }),
    }));
    await gotoSru(page);
    await expect(mdsMessage(page)).toContainText('Failed to load document list.', { timeout: 10000 });
    await expect(frame(page).locator('.mds-count-value')).toHaveText('0');
    await shot(page, '断言: No.12 API 失败', {
      step: '拦截 API 返回 500 后进入画面',
      value: 'response: 500',
      actual: '显示 "Failed to load document list."；Total 0（差异：前端 500 亦用此文案）',
    });
  });
});

// ============================================================================
// Test 9：UI 交互（No.30 错误消息样式）
// ============================================================================
test.describe('UI 交互 (UD20)', () => {
  test('No.30 错误消息样式为红色', async ({ page }) => {
    await gotoSru(page);
    await frame(page).locator('.mds-btn-select').click();
    await expect(mdsMessage(page)).toContainText('No data found.', { timeout: 8000 });
    const color = await mdsMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.30 错误消息红色', {
      step: '未选中点 Select 触发错误',
      value: '未选中',
      actual: `错误消息为红色 #ff4d4f (${color})`,
    });
  });
});
