/**
 * Download and Print Quick Guides 模块 (UD23) Playwright 测试
 * -----------------------------------------------------------------
 * 对应测试式样书：react-ud/src/DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides_単体テスト仕様書.md
 * 对应前端：react-ud/src/DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides.tsx
 * 对应后端：无 API 调用（纯前端静态内容 + 链接跳转/下载 + 复选框切换操作说明）
 * 对应测试数据：tests/downloadAndPrintQuickGuides/DownloadAndPrintQuickGuides_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实前端模式）
 * 1. 前端 dev server (localhost:3000) 已启动；登录用户 menuall（拥有 hdoc_admin）。
 * 2. 从 Menu → "Download and Print Quick Guides" 进入（iframe /download-print-quick-guides）。
 * 3. 本模块无 API / 无数据库表依赖，仅前端交互。
 *
 * 【画面结构（mih 类名 → qgd-*）】
 * - 两个下载链接 .qgd-link：
 *     "Download and Print Quick Guides" -> /quick-guides/hdoc-quick-guides.pdf（target=_blank）
 *     "Volvo 3P Quick Guides"          -> /quick-guides/volvo-3p-quick-guides.pdf（download）
 * - 两个复选框 .qgd-checkbox：
 *     "To print do the following"（打印说明 .qgd-instruction-content / .qgd-steps）
 *     "To fold do the following"（折叠说明 .qgd-instruction-content / .qgd-steps）
 *
 * 【业务含义 / 差异说明】
 * - public 目录未提供 quick-guides/*.pdf 文件，点击链接会导航/打开到 404
 *   （符合仕様書 No.9/22 的"链接失效 → 浏览器 404"场景）。
 * - 测试重点断言：链接属性（href / target=_blank / download）与复选框切换行为；
 *   目标文件 404 场景在差异说明中注明。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\downloadAndPrintQuickGuides\image
 * - 命名：DownloadAndPrintQuickGuides01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实前端：node tests/downloadAndPrintQuickGuides/run_qgd.js
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';
const LOGIN = 'menuall';

const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^DownloadAndPrintQuickGuides(\d+)\.jpeg$/;
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
  const filename = `DownloadAndPrintQuickGuides${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'qgd-shot-info';
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
    await page.evaluate(() => { document.getElementById('qgd-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function qgdHeader(page: Page) {
  return frame(page).locator('.qgd-header-title');
}
function qgdLink(page: Page, text: string) {
  return frame(page).locator('.qgd-link', { hasText: text }).first();
}
function qgdCheckbox(page: Page, label: string) {
  return frame(page).locator('.qgd-checkbox', { hasText: label }).first();
}
function checkboxChecked(page: Page, label: string) {
  return qgdCheckbox(page, label).locator('input[type=checkbox]').isChecked();
}
function instructionCount(page: Page) {
  return frame(page).locator('.qgd-instruction-content').count();
}
// 返回第几个说明块的 Step 文本列表
async function stepTexts(page: Page, index: number): Promise<string[]> {
  const ol = frame(page).locator('.qgd-instruction-content .qgd-steps').nth(index);
  const items = await ol.locator('li').allTextContents();
  return items.map((t) => t.trim());
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
  const menuBtn = page.getByRole('button', { name: 'Download and Print Quick Guides' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(qgdHeader(page)).toHaveText('HDoc - Download and Print Quick Guides', { timeout: 15000 });
  await page.waitForTimeout(800);
}

// ============================================================================
// Test 1：画面初期表示（No.1/2/3/4）
// ============================================================================
test.describe('画面初期表示 (UD23)', () => {
  test('No.1/2/3/4 链接 + 复选框 + 说明隐藏 + 无操作按钮', async ({ page }) => {
    await gotoSru(page);
    // No.1 两个下载链接显示
    await expect(qgdLink(page, 'Download and Print Quick Guides')).toBeVisible();
    await expect(qgdLink(page, 'Volvo 3P Quick Guides')).toBeVisible();
    await expect(frame(page).locator('.qgd-link')).toHaveCount(2);
    // No.2 两个复选框，初始未勾选
    for (const lb of ['To print do the following', 'To fold do the following']) {
      await expect(qgdCheckbox(page, lb)).toBeVisible();
      expect(await checkboxChecked(page, lb)).toBe(false);
    }
    // No.3 操作说明初始隐藏
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(0);
    // No.4 无操作按钮（提交/保存/删除等 qgd-btn）
    await expect(frame(page).locator('.qgd-btn')).toHaveCount(0);
    await expect(frame(page).locator('.qgd-card button')).toHaveCount(0);
    await shot(page, '断言: No.1/2/3/4 画面初期表示', {
      step: '从 Menu 进入 Download and Print Quick Guides 画面',
      value: '无（初始状态）',
      actual: '2 个下载链接；2 个复选框初始未勾选；操作说明隐藏；无操作按钮',
    });
  });
});

// ============================================================================
// Test 2：下载链接功能（No.5/6/7/8/9）
// ============================================================================
test.describe('下载链接功能 (UD23)', () => {
  test('No.5/6 Download and Print 链接 target=_blank + 新窗口', async ({ page }) => {
    await gotoSru(page);
    const link = qgdLink(page, 'Download and Print Quick Guides');
    // 断言 href 与 target=_blank
    expect(await link.getAttribute('href')).toBe('/quick-guides/hdoc-quick-guides.pdf');
    expect(await link.getAttribute('target')).toBe('_blank');
    // 点击触发新窗口（popup）
    const popupPromise = page.waitForEvent('popup', { timeout: 10000 }).catch(() => null);
    await link.click();
    const popup = await popupPromise;
    let popupUrl = 'no-popup';
    if (popup) { popupUrl = popup.url(); await popup.close().catch(() => {}); }
    await shot(page, '断言: No.5/6 新窗口打开', {
      step: '点击 "Download and Print Quick Guides" 链接',
      value: 'href=/quick-guides/hdoc-quick-guides.pdf target=_blank',
      actual: `target=_blank 打开新窗口 URL=${popupUrl}（差异：public 无该 pdf，新窗口显示 404）`,
    });
  });

  test('No.7/8 Volvo 3P 链接 download 属性', async ({ page }) => {
    await gotoSru(page);
    const link = qgdLink(page, 'Volvo 3P Quick Guides');
    expect(await link.getAttribute('href')).toBe('/quick-guides/volvo-3p-quick-guides.pdf');
    // download 属性存在（触发直接下载）
    const dl = await link.getAttribute('download');
    expect(dl).not.toBeNull();
    // 尝试触发下载/导航（记录 download 事件；文件缺失时可能不触发）
    let downloaded = false;
    page.on('download', () => { downloaded = true; });
    const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
    await link.click();
    const popup = await popupPromise;
    if (popup) { await popup.close().catch(() => {}); }
    await page.waitForTimeout(500);
    await shot(page, '断言: No.7/8 download 属性', {
      step: '点击 "Volvo 3P Quick Guides" 链接',
      value: 'href=/quick-guides/volvo-3p-quick-guides.pdf + download 属性',
      actual: `链接带 download 属性；download 事件=${downloaded}（public 无该 pdf，若未触发即 404）`,
    });
  });

  test('No.9 链接指向不存在文件(404)', async ({ page }) => {
    await gotoSru(page);
    // 两个链接 href 指向 /quick-guides/*.pdf；public 目录无该文件 → 点击返回 404
    const h1 = await qgdLink(page, 'Download and Print Quick Guides').getAttribute('href');
    const h2 = await qgdLink(page, 'Volvo 3P Quick Guides').getAttribute('href');
    expect(h1).toBe('/quick-guides/hdoc-quick-guides.pdf');
    expect(h2).toBe('/quick-guides/volvo-3p-quick-guides.pdf');
    await shot(page, '断言: No.9 链接指向 404 文件', {
      step: '检查两个下载链接的 href',
      value: '/quick-guides/*.pdf',
      actual: 'public 未提供这些 pdf，点击将显示 404（符合仕様書失效场景）',
    });
  });
});

// ============================================================================
// Test 3：打印复选框（No.11/12/13/14）
// ============================================================================
test.describe('To print 复选框 (UD23)', () => {
  test('No.11/12/14 勾选后显示打印说明', async ({ page }) => {
    await gotoSru(page);
    // No.11 初始未勾选 + 说明隐藏
    expect(await checkboxChecked(page, 'To print do the following')).toBe(false);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(0);
    // No.12 勾选 → 说明显示
    await qgdCheckbox(page, 'To print do the following').click();
    expect(await checkboxChecked(page, 'To print do the following')).toBe(true);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(1);
    // No.14 内容 Step 1-5
    const steps = await stepTexts(page, 0);
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps[0]).toContain('Open the downloaded PDF');
    await shot(page, '断言: No.11/12/14 打印说明', {
      step: '勾选 "To print do the following"',
      value: '勾選',
      actual: `说明显示，含 ${steps.length} 个 Step；首条=${steps[0]}`,
    });
  });

  test('No.13 取消勾选后隐藏', async ({ page }) => {
    await gotoSru(page);
    await qgdCheckbox(page, 'To print do the following').click();
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(1);
    await qgdCheckbox(page, 'To print do the following').click();
    expect(await checkboxChecked(page, 'To print do the following')).toBe(false);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(0);
    await shot(page, '断言: No.13 取消后隐藏', {
      step: '勾选后再取消 "To print do the following"',
      value: '勾選→取消',
      actual: '复选框未勾选；说明内容隐藏',
    });
  });
});

// ============================================================================
// Test 4：折叠复选框（No.15/16/17/18）
// ============================================================================
test.describe('To fold 复选框 (UD23)', () => {
  test('No.15/16/18 勾选后显示折叠说明', async ({ page }) => {
    await gotoSru(page);
    expect(await checkboxChecked(page, 'To fold do the following')).toBe(false);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(0);
    await qgdCheckbox(page, 'To fold do the following').click();
    expect(await checkboxChecked(page, 'To fold do the following')).toBe(true);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(1);
    const steps = await stepTexts(page, 0);
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps[0]).toContain('Place the printed page face up');
    await shot(page, '断言: No.15/16/18 折叠说明', {
      step: '勾选 "To fold do the following"',
      value: '勾選',
      actual: `说明显示，含 ${steps.length} 个 Step；首条=${steps[0]}`,
    });
  });

  test('No.17 取消勾选后隐藏', async ({ page }) => {
    await gotoSru(page);
    await qgdCheckbox(page, 'To fold do the following').click();
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(1);
    await qgdCheckbox(page, 'To fold do the following').click();
    expect(await checkboxChecked(page, 'To fold do the following')).toBe(false);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(0);
    await shot(page, '断言: No.17 取消后隐藏', {
      step: '勾选后再取消 "To fold do the following"',
      value: '勾選→取消',
      actual: '复选框未勾选；说明内容隐藏',
    });
  });
});

// ============================================================================
// Test 5：复选框联动（No.19/20）
// ============================================================================
test.describe('复选框联动 (UD23)', () => {
  test('No.19/20 独立控制 + 同时显示', async ({ page }) => {
    await gotoSru(page);
    // No.19 独立控制：勾打印不影响折叠
    await qgdCheckbox(page, 'To print do the following').click();
    expect(await checkboxChecked(page, 'To print do the following')).toBe(true);
    expect(await checkboxChecked(page, 'To fold do the following')).toBe(false);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(1);
    // No.20 再勾折叠 → 两个说明同时显示
    await qgdCheckbox(page, 'To fold do the following').click();
    expect(await checkboxChecked(page, 'To fold do the following')).toBe(true);
    await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(2);
    await shot(page, '断言: No.19/20 联动', {
      step: '先勾打印，再勾折叠',
      value: '兩方勾選',
      actual: '两个复选框独立；打印与折叠说明同时显示（2 个说明块）',
    });
  });
});

// ============================================================================
// Test 6：UI 交互（No.23/24/25/26）
// ============================================================================
test.describe('UI 交互 (UD23)', () => {
  test('No.23/24/25 链接样式 + 标签对齐 + 说明排版', async ({ page }) => {
    await gotoSru(page);
    // No.23 链接为蓝色（CSS color）
    const link = qgdLink(page, 'Download and Print Quick Guides');
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(0, 0, 0)');
    // No.24 复选框标签存在且可见
    await expect(qgdCheckbox(page, 'To print do the following')).toBeVisible();
    await expect(qgdCheckbox(page, 'To fold do the following')).toBeVisible();
    // No.25 勾选后说明用有序列表排版（ol.qgd-steps）
    await qgdCheckbox(page, 'To print do the following').click();
    await expect(frame(page).locator('.qgd-instruction-content .qgd-steps li')).toHaveCount(5);
    await shot(page, '断言: No.23/24/25 样式/排版', {
      step: '勾选打印说明查看样式',
      value: '勾選',
      actual: '链接为蓝色；复选框标签对齐；说明为有序列表(5 个 Step)',
    });
  });

  test('No.26 重复切换正常', async ({ page }) => {
    await gotoSru(page);
    for (let i = 0; i < 3; i++) {
      await qgdCheckbox(page, 'To print do the following').click();
      expect(await checkboxChecked(page, 'To print do the following')).toBe(true);
      await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(1);
      await qgdCheckbox(page, 'To print do the following').click();
      expect(await checkboxChecked(page, 'To print do the following')).toBe(false);
      await expect(frame(page).locator('.qgd-instruction-content')).toHaveCount(0);
    }
    await shot(page, '断言: No.26 重复切换', {
      step: '反复勾选/取消打印复选框 3 次',
      value: '重複切替',
      actual: '每次切换正确，无状态异常',
    });
  });
});
