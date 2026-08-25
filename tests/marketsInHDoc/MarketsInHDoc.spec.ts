/**
 * Markets in HDoc 模块 (UD21) Playwright 测试
 * ---------------------------------------------------------
 * 对应测试式样书：react-ud/src/MarketsInHDoc/MarketsInHDoc_単体テスト仕様書.md
 * 对应前端：react-ud/src/MarketsInHDoc/MarketsInHDoc.tsx
 * 对应后端：UserAdminController / MasterDataService（GET /api/UD19SelectMarketMaster，UD21 复用 UD19 接口）
 * 对应测试数据：tests/marketsInHDoc/MarketsInHDoc_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实后端模式）
 * 1. 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
 * 2. 后端 UD19SelectMarketMaster 返回 [{market, description}]。
 * 3. 登录用户 menuall（拥有 hdoc_admin）可从 Menu → "Markets in HDoc" 进入。
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "Markets in HDoc" → 右侧 iframe 加载（/markets-in-hdoc）
 * - 所有 UD21 元素（mih-*）通过 iframe frameLocator('.menu-iframe') 定位
 *
 * 【业务含义 / 差异说明】
 * - 本画面为纯只读表格（无任何输入框/按钮/核心链接，仅 body 有支持 footer 链接），
 *   Weights from Hdoc 列前端固定显示 "-"（无数据源）。
 * - Market/Description 取自 MARKET_MASTER；接口为 UD19SelectMarketMaster。
 * - 空列表（No.11）用 mysql2 临时清空 MARKET_MASTER 构造，断言后恢复原数据。
 * - API 失败（No.12/15）：前端 catch 显示 "Failed to load market list."（500 亦如此，非 "System busy"）。
 * - No.13/14/15 依赖异常注入默认 skip；No.12（route 500）实做。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\marketsInHDoc\image
 * - 命名：MarketsInHDoc01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端：node tests/marketsInHDoc/run_mih.js
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
  const pat = /^MarketsInHDoc(\d+)\.jpeg$/;
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
  const filename = `MarketsInHDoc${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'mih-shot-info';
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
    await page.evaluate(() => { document.getElementById('mih-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function mihMessage(page: Page) {
  return frame(page).locator('.mih-message');
}
function mihHeader(page: Page) {
  return frame(page).locator('.mih-header-title');
}
function dataRow(page: Page, i: number) {
  return frame(page).locator('.mih-table .ant-table-tbody tr.ant-table-row').nth(i);
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
  const menuBtn = page.getByRole('button', { name: 'Markets in HDoc' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(mihHeader(page)).toHaveText('HDoc - Markets in HDoc', { timeout: 15000 });
  await page.waitForTimeout(1200); // 等待 API 加载
}

// ============================================================================
// Test 1：画面初期表示（No.1/2/4）
// ============================================================================
test.describe('画面初期表示 (UD21)', () => {
  test('No.1/2/4 表头 + 无操作控件 + 消息隐藏', async ({ page }) => {
    await gotoSru(page);
    // No.1 表头：Market / Description / Weights from Hdoc
    const headers = await frame(page).locator('.mih-table .ant-table-thead th').allTextContents();
    const joined = headers.map((h) => h.trim()).join(',');
    expect(joined).toContain('Market');
    expect(joined).toContain('Description');
    expect(joined).toContain('Weights from Hdoc');
    // No.2 无操作控件：主体（.mih-card）内无 input/button
    await expect(frame(page).locator('.mih-card input')).toHaveCount(0);
    await expect(frame(page).locator('.mih-card button')).toHaveCount(0);
    // No.4 消息区隐藏
    await expect(mihMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.1/2/4 表头/无控件/消息', {
      step: '从 Menu 进入 Markets in HDoc 画面',
      value: '无（只读表格）',
      actual: '表头 Market/Description/Weights from Hdoc；主体无 input/button；消息区隐藏',
    });
  });
});

// ============================================================================
// Test 2：市场列表加载（No.5/6/7/8/9/10）
// ============================================================================
test.describe('市场列表加载 (UD21)', () => {
  test('No.5/6/10 正常加载 + 内容 + 多行', async ({ page }) => {
    await gotoSru(page);
    // No.10 多行（至少 4 条：JPN/EU/JP/DE）
    const rows = frame(page).locator('.mih-table .ant-table-tbody tr.ant-table-row');
    await expect.poll(async () => (await rows.count())).toBeGreaterThanOrEqual(4);
    // No.6 内容验证：存在 JPN/Japan、EU/Europe
    const pageText = (await frame(page).locator('.mih-table').innerText());
    expect(pageText).toContain('JPN');
    expect(pageText).toContain('Japan');
    expect(pageText).toContain('EU');
    expect(pageText).toContain('Europe');
    await shot(page, '断言: No.5/6/10 列表加载', {
      step: '进入画面等待 API 返回市场列表',
      value: 'MARKET_MASTER 数据',
      actual: '表格显示 ≥4 行，含 JPN/Japan、EU/Europe',
    });
  });

  test('No.7/8/9 列内容验证', async ({ page }) => {
    await gotoSru(page);
    // 找到 JPN 行
    const jpnRow = frame(page).locator('.mih-table .ant-table-tbody tr.ant-table-row', { hasText: 'JPN' }).first();
    const cells = await jpnRow.locator('td').allTextContents();
    const txt = cells.map((c) => c.trim());
    // No.7 Market 列 = JPN
    expect(txt[0]).toBe('JPN');
    // No.8 Description 列 = Japan
    expect(txt[1]).toBe('Japan');
    // No.9 Weights from Hdoc 列 = "-"
    expect(txt[2]).toBe('-');
    await shot(page, '断言: No.7/8/9 列内容', {
      step: '查看 JPN 行各列值',
      value: 'JPN 行',
      actual: `Market=JPN；Description=Japan；Weights from Hdoc='-'`,
    });
  });
});

// ============================================================================
// Test 3：空列表（No.11）
// ============================================================================
test.describe('空列表 (UD21)', () => {
  test('No.11 空列表 -> No market data available.', async ({ page }) => {
    // 备份当前 MARKET_MASTER 全部数据，临时清空构造空场景，测试后恢复
    const conn = await db();
    const [rows] = await conn.query('SELECT MARKET, DESCRIPTION FROM MARKET_MASTER');
    await conn.query('DELETE FROM MARKET_MASTER');
    await conn.end();
    try {
      await gotoSru(page);
      await expect(mihMessage(page)).toContainText('No market data available.', { timeout: 10000 });
      await expect(frame(page).locator('.mih-table .ant-table-tbody tr.ant-table-row')).toHaveCount(0);
      await shot(page, '断言: No.11 空列表', {
        step: '临时清空 MARKET_MASTER 后进入画面（测试结束会恢复）',
        value: 'data: []',
        actual: '提示 "No market data available."；表格为空',
      });
    } finally {
      // 恢复原数据
      const c2 = await db();
      await c2.query('DELETE FROM MARKET_MASTER');
      const recs = rows as any[];
      for (const r of recs) {
        await c2.query(
          `INSERT INTO MARKET_MASTER (MARKET, DESCRIPTION, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), 'system', 'test', NOW(), 'system', 'test')
           ON DUPLICATE KEY UPDATE DESCRIPTION=VALUES(DESCRIPTION)`,
          [r.MARKET, r.DESCRIPTION]
        );
      }
      await c2.end();
    }
  });
});

// ============================================================================
// Test 4：异常处理（No.12 route 500）
// ============================================================================
test.describe('异常处理 (UD21)', () => {
  test('No.12 API 失败 -> Failed to load market list.', async ({ page }) => {
    await page.route('**/api/UD19SelectMarketMaster', (route) => route.fulfill({
      status: 500, contentType: 'application/json',
      body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'System error' }),
    }));
    await gotoSru(page);
    await expect(mihMessage(page)).toContainText('Failed to load market list.', { timeout: 10000 });
    await expect(frame(page).locator('.mih-table .ant-table-tbody tr.ant-table-row')).toHaveCount(0);
    await shot(page, '断言: No.12 API 失败红色', {
      step: '拦截 API 返回 500 后进入画面',
      value: 'response: 500',
      actual: '显示 "Failed to load market list."；表格为空（差异：500 亦用此文案，非 "System busy"）',
    });
  });
});

// ============================================================================
// Test 5：UI 交互（No.16/17/18）
// ============================================================================
test.describe('UI 交互 (UD21)', () => {
  test('No.16/18 加载结束 + 画面简洁性', async ({ page }) => {
    await gotoSru(page);
    // No.16 加载结束后表格显示（loading 消失）
    await expect(frame(page).locator('.mih-table .ant-table-tbody tr.ant-table-row').first()).toBeVisible({ timeout: 10000 });
    // 表格不再 loading（antd className 无 loading 态）
    await expect(frame(page).locator('.mih-table .ant-spin-spinning')).toHaveCount(0);
    // No.18 简洁性：主体只含 message(隐藏) + 表格，无多余控件
    // 卡片内元素仅表格主体
    const cardChildren = await frame(page).locator('.mih-card > *').count();
    expect(cardChildren).toBeLessThanOrEqual(2);
    await shot(page, '断言: No.16/18 loading 结束 + 简洁', {
      step: '等待 API 响应完成',
      value: '无',
      actual: 'loading 消失、表格显示数据；卡片仅含消息区和表格，无多余元素',
    });
  });

  test('No.17 错误消息样式为红色', async ({ page }) => {
    await page.route('**/api/UD19SelectMarketMaster', (route) => route.fulfill({
      status: 500, contentType: 'application/json',
      body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'System error' }),
    }));
    await gotoSru(page);
    await expect(mihMessage(page)).toContainText('Failed to load market list.', { timeout: 10000 });
    const color = await mihMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.17 错误消息红色', {
      step: '拦截 API 返回 500 触发错误',
      value: 'response: 500',
      actual: `错误消息为红色 #ff4d4f (${color})`,
    });
  });
});
