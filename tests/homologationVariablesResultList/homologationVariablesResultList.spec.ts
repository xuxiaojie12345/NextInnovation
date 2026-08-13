/**
 * Homologation Variables Result List 模块 (UD09) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/HomologationVariablesResultList/HomologationVariablesResultList_単体テスト仕様書.md
 * 对应前端：react-ud/src/HomologationVariablesResultList/HomologationVariablesResultList.tsx
 * 对应后端：SearchController / RuleServiceImpl（UD09Search / UD09DeleteSelected）
 * 对应测试数据：tests/homologationVariablesResultList/homologationVariablesResultList_test_data.sql（需先 node seed.js）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081（含 UD09Search / UD09DeleteSelected 接口）
 * 3. 已执行 node tests/homologationVariablesResultList/seed.js（种入 ud_test 库，3 条规则）
 * 4. 登录用户 menuall
 *
 * 【画面进入方式】
 * - ResultList 从 location.state.searchCriteria 读取检索条件。
 *   * 直接导航 /homologation-variables-result-list（无 state）→ 无条件检索，返回全部 3 条。
 *   * 经 HomologationVariables 填条件 Search → 携带 searchCriteria 进入。
 * - ResultList 无菜单直接入口，本测试先登录再直接导航。
 *
 * 【截图约定】
 * - 每个"动作/断言"会叠加临时信息栏（操作步骤/设定值/实际结果）再截图
 * - 格式：JPEG；存放目录：tests\homologationVariablesResultList\image
 * - 命名：HomologationVariablesResultList01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端，请使用：
 *   npx playwright test tests/homologationVariablesResultList/homologationVariablesResultList.spec.ts --workers=1
 *
 * 【Skip】依赖 mock/异常的用例默认 skip（网络失败、500、404 注入、打印、加载中状态等）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 HomologationVariablesResultListNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
function nextCounter() {
  ensureImageDir();
  const pat = /^HomologationVariablesResultList(\d+)\.jpeg$/;
  const existing = fs.readdirSync(IMAGE_DIR)
    .filter((f) => pat.test(f))
    .map((f) => parseInt((f.match(pat) || [])[1], 10) || 0);
  screenshotCounter = existing.length ? Math.max(...existing) : 0;
  return screenshotCounter + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  const filename = `HomologationVariablesResultList${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'hvrl-shot-info';
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#003366;color:#fff;padding:8px 12px;font:12px/1.5 sans-serif;white-space:pre-wrap;box-shadow:0 2px 6px rgba(0,0,0,.3);';
      d.textContent = `[操作步骤] ${inf.step}\n[设定值] ${inf.value}\n[实际结果] ${inf.actual}`;
      document.body.prepend(d);
    }, info);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));
  }
  try {
    await page.screenshot({ path: path.join(IMAGE_DIR, filename), type: 'jpeg', quality: 80, timeout: 8000, fullPage: true });
  } catch { /* 截图失败不致命 */ }
  if (info) {
    await page.evaluate(() => { document.getElementById('hvrl-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入
// ============================================================================
function hvrlMessage(page: Page) {
  return page.locator('.hvrl-message');
}
function hvrlRows(page: Page) {
  return page.locator('.hvrl-table .ant-table-row');
}
function hvrlRowCheckboxes(page: Page) {
  return page.locator('.hvrl-table .ant-table-row input[type="checkbox"]');
}
function hvrlHeaderCheckbox(page: Page) {
  return page.locator('.hvrl-table .ant-table-thead input[type="checkbox"]');
}

async function login(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// 直接导航 ResultList（无条件检索）
async function gotoResultList(page: Page) {
  await login(page);
  await page.goto(`${BASE_URL}/homologation-variables-result-list`);
  await expect(page.locator('.hvrl-header-title')).toBeVisible({ timeout: 15000 });
}

// HomologationVariables 输入辅助
function hvInput(page: Page, label: string) {
  return page.locator('.hv-field').filter({ has: page.locator('.hv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.hv-input');
}
function hvSelect(page: Page, label: string) {
  return page.locator('.hv-field').filter({ has: page.locator('.hv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.hv-select');
}

// 经 HomologationVariables 携带条件进入 ResultList（条件由参数决定）
async function gotoResultListWithCriteria(page: Page, pcLabel: string, mktLabel: string) {
  await login(page);
  await page.goto(`${BASE_URL}/homologation-variables`);
  await expect(page.locator('.hv-header-title')).toBeVisible({ timeout: 15000 });
  await hvSelect(page, 'Product class').click();
  await page.locator('.ant-select-item-option', { hasText: pcLabel }).first().click();
  await hvSelect(page, 'Market').click();
  await page.locator('.ant-select-item-option', { hasText: mktLabel }).first().click();
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL(/homologation-variables-result-list/);
  await expect(page.locator('.hvrl-header-title')).toBeVisible({ timeout: 15000 });
}

// 用 child_process 执行 seed.js 恢复种子数据（删除类测试后调用，保证可重复）
function reseed() {
  const seedPath = path.join(__dirname, 'seed.js');
  execSync(`node "${seedPath}"`, { stdio: 'ignore', timeout: 30000 });
}

// ============================================================================
// Test 1：无条件加载 + Count 显示 + 结果排序
// 覆盖 No.2, 3, 26（及 No.7 未选中 Select 的独立校验）
// ============================================================================
test.describe('无条件加载 / 排序 / Count (UD09)', () => {
  test('No.2,3,26 无条件加载全部记录 + 排序 + Count', async ({ page }) => {
    await gotoResultList(page);

    // No.2 无条件加载：无检索条件，返回全部 3 条
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // No.26 Count 显示
    await expect(page.locator('.hvrl-count')).toHaveText('Number of lines found: 3');
    await shot(page, '断言: No.2/26 无条件加载全部 + Count', {
      step: '直接导航 ResultList（未传入检索条件）',
      value: '检索条件为 null',
      actual: '返回全部 3 条记录，Count 显示 3',
    });

    // 列内容断言（首行引擎马力记录）
    const firstRow = hvrlRows(page).first();
    await expect(firstRow).toContainText('01');
    await expect(firstRow).toContainText('EnginePower');

    // No.3 结果排序：按 Product Class、Market、Number 升序（ORDER BY PC, MARKET, NUM）
    const pcCols = await page.locator('.hvrl-table .ant-table-row td:nth-child(2)').allTextContents();
    const marketCols = await page.locator('.hvrl-table .ant-table-row td:nth-child(4)').allTextContents();
    // PC 升序：01,01,02
    expect(pcCols.map((s) => s.trim())).toEqual(['01', '01', '02']);
    // Market 升序（同 PC=01 组内 DE 在 JP 前）：DE,JP,JP
    expect(marketCols.map((s) => s.trim())).toEqual(['DE', 'JP', 'JP']);
    await shot(page, '断言: No.3 结果排序', {
      step: '查看列表显示顺序',
      value: 'ORDER BY PC, MARKET, NUM 升序',
      actual: '行顺序为 (01,DE,101),(01,JP,100),(02,JP,200)',
    });
  });

  test('No.7 未选中记录点击 Select 报错', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // 不勾选任何行直接点 Select
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(hvrlMessage(page)).toHaveText('Please select at least one record.');
    // 不跳转（仍在 ResultList）
    await expect(page.locator('.hvrl-header-title')).toBeVisible();
    await shot(page, '断言: No.7 未选中 Select 报错', {
      step: '不勾选任何行，点击 Select',
      value: '无选中记录',
      actual: '显示 "Please select at least one record."，画面不跳转',
    });
  });
});

// ============================================================================
// Test 2：单选 Select 回填
// 覆盖 No.8
// ============================================================================
test.describe('Select 单选回填 (UD09)', () => {
  test('No.8 选中一条记录点击 Select 回填前一画面', async ({ page }) => {
    await gotoResultListWithCriteria(page, /01 - Heavy Duty/, /JP - Japan/);
    await expect(hvrlRows(page)).toHaveCount(1, { timeout: 15000 });
    await expect(page.locator('.hvrl-table')).toContainText('200HP');

    // 勾选这一行
    await hvrlRowCheckboxes(page).first().check();
    await shot(page, '动作: 勾选结果列表唯一一行', {
      step: '勾选 PC=01/NUM=100/MARKET=JP 行',
      value: '选中 EnginePower 记录',
      actual: '该行 checkbox 被勾选',
    });
    await page.getByRole('button', { name: 'Select', exact: true }).click();

    // 跳转回 HomologationVariables 并回填
    await expect(page.locator('.hv-header-title')).toBeVisible({ timeout: 15000 });
    await expect(hvSelect(page, 'Product class')).toContainText('01');
    await expect(hvInput(page, 'Number')).toHaveValue('100');
    await expect(hvSelect(page, 'Market')).toContainText('JP');
    await expect(hvInput(page, 'Variable')).toHaveValue('EnginePower');
    await expect(hvInput(page, 'Value')).toHaveValue('200HP');
    await shot(page, '断言: No.8 单选 Select 回填', {
      step: '结果列表勾选一行并点击 Select',
      value: '选中 PC=01/NUM=100/MARKET=JP 记录',
      actual: '回填 Product class=01, Number=100, Market=JP, Variable=EnginePower, Value=200HP',
    });
  });
});

// ============================================================================
// Test 3：携带条件加载 / 空结果 / Back 返回
// 覆盖 No.1, 4, 10
// ============================================================================
test.describe('携带条件加载 / 空结果 / Back (UD09)', () => {
  test('No.1 携带检索条件加载成功', async ({ page }) => {
    await gotoResultListWithCriteria(page, /01 - Heavy Duty/, /JP - Japan/);
    // No.1 携带 PC=01, Market=JP -> 返回匹配记录，Count 显示 1
    await expect(hvrlRows(page)).toHaveCount(1, { timeout: 15000 });
    await expect(page.locator('.hvrl-count')).toHaveText('Number of lines found: 1');
    await expect(page.locator('.hvrl-table')).toContainText('200HP');
    await shot(page, '断言: No.1 携带条件加载成功', {
      step: '前一画面传入 PC=01, Market=JP 检索条件',
      value: 'PC=01, Market=JP',
      actual: '仅返回 1 条匹配记录（EnginePower=200HP），Count=1',
    });

    // No.10 Back：返回前画面并携带回显检索条件
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('.hv-header-title')).toBeVisible({ timeout: 15000 });
    await expect(hvSelect(page, 'Product class')).toContainText('01');
    await expect(hvSelect(page, 'Market')).toContainText('JP');
    await shot(page, '断言: No.10 Back 返回并回显条件', {
      step: '点击 Back 按钮',
      value: '当前检索条件 PC=01, Market=JP',
      actual: '返回 HomologationVariables，Product class=01、Market=JP 自动回显',
    });
  });

  test('No.4 检索结果为空', async ({ page }) => {
    await gotoResultListWithCriteria(page, /03 - Light Duty/, /SE - Sweden/);
    // No.4 无条件返回 totalCount=0 -> 空结果提示
    await expect(page.locator('.hvrl-message-error')).toHaveText('No records found matching the search criteria.', { timeout: 15000 });
    await expect(hvrlRows(page)).toHaveCount(0);
    await expect(page.locator('.hvrl-count')).toHaveText('Number of lines found: 0');
    await shot(page, '断言: No.4 检索结果为空', {
      step: '传入不存在组合 PC=03, Market=SE',
      value: 'totalCount=0, records=[]',
      actual: '显示 "No records found matching the search criteria."，列表为空，Count=0',
    });
  });
});

// ============================================================================
// Test 4：多选 Select + 全选 + checkbox 交互
// 覆盖 No.9, 22, 23
// ============================================================================
test.describe('多选 Select / checkbox / 全选 (UD09)', () => {
  test('No.23 全选 / 取消全选', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // 表头全选
    await hvrlHeaderCheckbox(page).check();
    await expect(hvrlRowCheckboxes(page)).toHaveCount(3);
    const checkedAfterSelectAll = await page.locator('.hvrl-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checkedAfterSelectAll).toBe(3);
    await shot(page, '断言: No.23 全选', {
      step: '勾选表头全选复选框',
      value: '3 条记录',
      actual: '所有 3 行 checkbox 均被勾选',
    });
    // 取消全选
    await hvrlHeaderCheckbox(page).uncheck();
    const checkedNone = await page.locator('.hvrl-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checkedNone).toBe(0);
    await shot(page, '断言: No.23 取消全选', {
      step: '再次点击表头全选复选框',
      value: '3 条记录',
      actual: '所有行 checkbox 均取消勾选',
    });
  });

  test('No.22 行 checkbox 勾选/取消交互', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    const firstCheckbox = hvrlRowCheckboxes(page).first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
    const checkedAfterCheck = await page.locator('.hvrl-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checkedAfterCheck).toBe(1);
    await firstCheckbox.uncheck();
    await expect(firstCheckbox).not.toBeChecked();
    const checkedAfterUncheck = await page.locator('.hvrl-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checkedAfterUncheck).toBe(0);
    await shot(page, '断言: No.22 行 checkbox 交互', {
      step: '勾选第一行 checkbox 再取消',
      value: '选中记录A，取消选中记录A',
      actual: '勾选时选中数为 1，取消后为 0',
    });
  });

  test('No.9 选中多条记录点击 Select 回填第一条', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // 勾选第一行和第二行
    await hvrlRowCheckboxes(page).nth(0).check();
    await hvrlRowCheckboxes(page).nth(1).check();
    await shot(page, '动作: 勾选多行准备 Select', {
      step: '勾选第 1、2 行',
      value: '选中记录 A 和 B',
      actual: '两行 checkbox 均被勾选',
    });
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(page.locator('.hv-header-title')).toBeVisible({ timeout: 15000 });
    // 回填第一条选中记录（排序后第一行 = PC=01/NUM=101/DE/EnginePower=350HP）
    await expect(hvSelect(page, 'Product class')).toContainText('01');
    await expect(hvInput(page, 'Number')).toHaveValue('101');
    await expect(hvSelect(page, 'Market')).toContainText('DE');
    await expect(hvInput(page, 'Variable')).toHaveValue('EnginePower');
    await expect(hvInput(page, 'Value')).toHaveValue('350HP');
    await shot(page, '断言: No.9 多选 Select 回填第一条', {
      step: '勾选两行后点击 Select',
      value: '选中记录 A 和 B',
      actual: '回填第一条选中记录 (01,101,DE,EnginePower=350HP)',
    });
  });
});

// ============================================================================
// Test 5：Delete Selected 未选中报错 + 确认取消
// 覆盖 No.13, 14（及 No.24 错误红色）
// ============================================================================
test.describe('Delete Selected - 未选中/取消 (UD09)', () => {
  test('No.13/24 未选中点击 Delete Selected 报错(红色)', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await expect(hvrlMessage(page)).toHaveText('Please select at least one record to delete.');
    // No.24 错误消息红色 #ff4d4f
    const color = await page.locator('.hvrl-message-error').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.13/24 未选中 Delete 报错红色', {
      step: '不勾选任何行，点击 Delete Selected',
      value: '无选中记录',
      actual: '显示 "Please select at least one record to delete."，红色显示',
    });
  });

  test('No.14 选中记录后取消确认，列表不变', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    await hvrlRowCheckboxes(page).first().check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    // 确认对话框出现
    await expect(page.locator('.ant-modal-confirm-title')).toHaveText('Confirm Deletion');
    await expect(page.locator('.ant-modal-confirm-content')).toContainText('Are you sure you want to delete the selected records?');
    await shot(page, '动作: 弹出确认对话框', {
      step: '勾选一行后点击 Delete Selected',
      value: '选中记录A',
      actual: '弹出确认对话框 "Confirm Deletion"',
    });
    // 点击取消（No）
    await page.getByRole('button', { name: 'No' }).click();
    await expect(page.locator('.ant-modal-confirm-title')).not.toBeVisible();
    // 列表不变：仍 3 条
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    const checked = await page.locator('.hvrl-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checked).toBe(1); // 选中状态保留
    await shot(page, '断言: No.14 取消确认列表不变', {
      step: '在确认对话框点击 No',
      value: '选中记录A',
      actual: '未调用删除 API，列表仍为 3 条，选中状态保留',
    });
  });
});

// ============================================================================
// Test 6：Delete Selected 成功删除（单选 / 多选 + 绿色成功）
// 覆盖 No.15, 16, 25（串行，删除后 reseed 恢复种子数据）
// ============================================================================
test.describe.serial('Delete Selected - 成功删除 (UD09)', () => {
  test.afterEach(async () => {
    // 每个删除测试后恢复种子数据（totalCount=3）
    reseed();
  });

  test('No.15 选中单条记录成功删除 + 绿色成功消息', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // 勾选第一行（排序后 = PC=01/NUM=101/DE）
    await hvrlRowCheckboxes(page).first().check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await expect(page.locator('.ant-modal-confirm-title')).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();
    // 成功消息 + 绿色 #52c41a
    await expect(hvrlMessage(page)).toHaveText('1 record(s) deleted successfully.', { timeout: 15000 });
    const color = await page.locator('.hvrl-message-success').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)'); // #52c41a
    // 刷新列表，选中状态清空，行数变为 2
    await expect(hvrlRows(page)).toHaveCount(2, { timeout: 15000 });
    await expect(page.locator('.hvrl-count')).toHaveText('Number of lines found: 2');
    const checked = await page.locator('.hvrl-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checked).toBe(0);
    await shot(page, '断言: No.15/25 单选删除成功 + 绿色', {
      step: '勾选一行，Delete Selected 后确认 Yes',
      value: '选中单条记录 A',
      actual: '显示 "1 record(s) deleted successfully."，列表刷新为 2 条，绿色显示',
    });
  });

  test('No.16 选中多条记录成功删除', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // 勾选两行（PC=01/101/DE 和 PC=01/100/JP）
    await hvrlRowCheckboxes(page).nth(0).check();
    await hvrlRowCheckboxes(page).nth(1).check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await expect(page.locator('.ant-modal-confirm-title')).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(hvrlMessage(page)).toHaveText('2 record(s) deleted successfully.', { timeout: 15000 });
    await expect(hvrlRows(page)).toHaveCount(1, { timeout: 15000 });
    await expect(page.locator('.hvrl-count')).toHaveText('Number of lines found: 1');
    await shot(page, '断言: No.16 多选删除成功', {
      step: '勾选两行，Delete Selected 后确认 Yes',
      value: '选中记录 A 和 B',
      actual: '显示 "2 record(s) deleted successfully."，列表刷新为 1 条',
    });
  });
});

// ============================================================================
// Test 7：Created by user 链接跳转
// 覆盖 No.19
// ============================================================================
test.describe('Created by user 链接 (UD09)', () => {
  test('No.19 Created by user 链接打开新页面', async ({ page }) => {
    await gotoResultList(page);
    await expect(hvrlRows(page)).toHaveCount(3, { timeout: 15000 });
    // Created by user 列为链接，href=/edb-user-view/<user>
    const link = page.locator('.hvrl-table .ant-table-row a').first();
    await expect(link).toHaveText('menuall');
    const href = await link.getAttribute('href');
    expect(href).toBe('/edb-user-view/menuall');
    // 点击链接打开新页面（target=_blank -> popup），且 stopPropagation 不影响
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10000 }),
      link.click(),
    ]);
    await popup.waitForLoadState('domcontentloaded').catch(() => {});
    const popupUrl = await popup.url();
    expect(popupUrl).toContain('/edb-user-view/menuall');
    await shot(page, '断言: No.19 Created by user 链接跳转', {
      step: '点击 Created by user 列链接',
      value: 'registerUser=menuall',
      actual: '打开新页面，URL 跳转至 EDB User View（/edb-user-view/menuall）',
    });
  });
});

// ============================================================================
// Skip：依赖 mock/异常注入的用例无法在纯真实后端下稳定验证
// No.5  (API 500) / No.6  (网络失败) / No.11 (打印成功) / No.12 (打印失败)
// No.17 (删除 404) / No.18 (删除网络失败) / No.20 (链接跳转失败) / No.21 (加载中禁用)
// ============================================================================
test.skip('Skip: 依赖 mock/异常注入的用例（No.5,6,11,12,17,18,20,21）', async () => {
  // 说明性占位：这些用例需要 mock API 或断网环境，本 spec 纯真实后端，故跳过。
  expect(true).toBeTruthy();
});
