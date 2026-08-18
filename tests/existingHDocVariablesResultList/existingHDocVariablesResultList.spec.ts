/**
 * Existing HDoc Variables Result List 模块 (UD11) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/ExistingHDocVariablesResultList/ExistingHDocVariablesResultList_単体テスト仕様書.md
 * 对应前端：react-ud/src/ExistingHDocVariablesResultList/ExistingHDocVariablesResultList.tsx
 *         + react-ud/src/ExistingHDocVariables/ExistingHDocVariables.tsx (UD10，Back/回填)
 *         + react-ud/src/HomologationVariables/HomologationVariables.tsx (UD08，Down 跳转 filterVariable)
 * 对应后端：SearchController / VariableServiceImpl（UD11Search / UD10Search）
 * 对应测试数据：tests/existingHDocVariablesResultList/existingHDocVariablesResultList_test_data.sql（需先 node seed.js）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081（含 UD11Search / UD10Search）
 * 3. 已执行 node tests/existingHDocVariablesResultList/seed.js（种入 ud_test，5 条变量）
 * 4. 登录用户 menuall（拥有 hdoc_variables 权限）
 *
 * 【画面进入方式（真实业务链路，Menu iframe）】
 * - ResultList 无 Menu 直接入口，经 UD10 进入：
 *   Menu → "Existing HDoc variables" → 右侧 iframe 加载 UD10 → 填检索条件 Search →
 *   iframe 内跳转至 UD11 ResultList（/existing-hdoc-variables-result-list）。
 * - 所有 UD11 元素（erli-*）通过 iframe frameLocator('.menu-iframe') 定位。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\existingHDocVariablesResultList\image
 * - 命名：ExistingHDocVariablesResultList01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端，请使用：
 *   npx playwright test tests/existingHDocVariablesResultList/existingHDocVariablesResultList.spec.ts --workers=1
 *
 * 【Skip】依赖 mock/异常的用例默认 skip（网络失败、500、打印、导出异常、链接失败、加载中禁用等）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 ExistingHDocVariablesResultListNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
function nextCounter() {
  ensureImageDir();
  const pat = /^ExistingHDocVariablesResultList(\d+)\.jpeg$/;
  const existing = fs.readdirSync(IMAGE_DIR)
    .filter((f) => pat.test(f))
    .map((f) => parseInt((f.match(pat) || [])[1], 10) || 0);
  screenshotCounter = existing.length ? Math.max(...existing) : 0;
  return screenshotCounter + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  const filename = `ExistingHDocVariablesResultList${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'erli-shot-info';
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
    await page.evaluate(() => { document.getElementById('erli-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD10/UD11 在 Menu 右侧 iframe；UD08 HomologationVariables 也是独立 iframe 路由）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function erliMessage(page: Page) {
  return frame(page).locator('.erli-message');
}
function erliRows(page: Page) {
  return frame(page).locator('.erli-table .ant-table-row');
}
function erliRowCheckboxes(page: Page) {
  return frame(page).locator('.erli-table .ant-table-row input[type="checkbox"]');
}
// UD10 字段定位（进入 ResultList 前的 Search 条件填表）
function ehvInput(page: Page, label: string) {
  return frame(page).locator('.ehv-field').filter({ has: frame(page).locator('.ehv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.ehv-input');
}
function ehvSelect(page: Page, label: string) {
  return frame(page).locator('.ehv-field').filter({ has: frame(page).locator('.ehv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.ehv-select');
}
// UD08 HomologationVariables 字段定位（Down 跳转后回填验证）
function hvInput(page: Page, label: string) {
  return frame(page).locator('.hv-field').filter({ has: frame(page).locator('.hv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.hv-input');
}

async function login(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// 经 Menu → UD10 → Search → UD11 ResultList（真实业务链路，iframe 内）
async function gotoResultList(page: Page, fill: (p: Page) => Promise<void>) {
  await login(page);
  await page.getByRole('button', { name: 'Existing HDoc variables' }).click();
  await expect(frame(page).locator('.ehv-header-title')).toBeVisible({ timeout: 15000 });
  await fill(page);
  await frame(page).getByRole('button', { name: 'Search' }).click();
  await expect(frame(page).locator('.erli-header-title')).toBeVisible({ timeout: 15000 });
}

// ============================================================================
// Test 1：无条件加载 + Count 显示
// 覆盖 No.2, 21
// ============================================================================
test.describe('无条件加载 / Count (UD11)', () => {
  test('No.2,21 无条件加载全部记录 + Count', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    // No.21 Count 显示件数
    await expect(frame(page).locator('.erli-count')).toHaveText('Number of lines found: 5');
    await expect(frame(page).locator('.erli-table')).toContainText('EnginePower');
    await shot(page, '断言: No.2/21 无条件加载全部记录 + Count', {
      step: '前一画面未传入检索条件，点击 Search',
      value: '检索条件全部为 null',
      actual: '返回全部 5 条变量记录，Count 显示 5',
    });
  });
});

// ============================================================================
// Test 2：携带检索条件加载
// 覆盖 No.1
// ============================================================================
test.describe('携带检索条件加载 (UD11)', () => {
  test('No.1 携带 Variable=ENGINE, Type=VDA 加载', async ({ page }) => {
    await gotoResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('ENGINE');
      await ehvSelect(p, 'Type').click();
      await frame(p).locator('.ant-select-item-option', { hasText: 'VDA' }).first().click();
    });
    await expect(erliRows(page)).toHaveCount(1, { timeout: 15000 });
    await expect(frame(page).locator('.erli-count')).toHaveText('Number of lines found: 1');
    await expect(frame(page).locator('.erli-table')).toContainText('EnginePower');
    await shot(page, '断言: No.1 携带条件加载', {
      step: '传入 Variable=ENGINE%, Type=VDA 后 Search',
      value: 'Variable="ENGINE%", Type="VDA"',
      actual: '返回 1 条匹配记录（EnginePower），Count=1',
    });
  });
});

// ============================================================================
// Test 3：检索结果为空
// 覆盖 No.3
// ============================================================================
test.describe('检索结果为空 (UD11)', () => {
  test('No.3 检索结果为空', async ({ page }) => {
    await gotoResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('NONEXIST');
    });
    await expect(frame(page).locator('.erli-message-error')).toHaveText('No records found matching the search criteria.', { timeout: 15000 });
    await expect(erliRows(page)).toHaveCount(0);
    await expect(frame(page).locator('.erli-count')).toHaveText('Number of lines found: 0');
    await shot(page, '断言: No.3 检索结果为空', {
      step: '传入不存在条件 Variable="NONEXIST" 后 Search',
      value: 'totalCount=0',
      actual: '显示 "No records found matching the search criteria."，列表为空，Count=0',
    });
  });
});

// ============================================================================
// Test 4：Select（未选 / 多选报错 / 单选回填）
// 覆盖 No.6, 7, 8
// ============================================================================
test.describe('Select (UD11)', () => {
  test('No.6 未选中记录点击 Select 报错', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Select' }).click();
    await expect(erliMessage(page)).toHaveText('Please select exactly one record.');
    await expect(frame(page).locator('.erli-header-title')).toBeVisible();
    await shot(page, '断言: No.6 未选中 Select 报错', {
      step: '不勾选任何行，点击 Select',
      value: '无选中记录',
      actual: '显示 "Please select exactly one record."，画面不跳转',
    });
  });

  test('No.7 选中多条记录点击 Select 报错', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    await erliRowCheckboxes(page).nth(0).check();
    await erliRowCheckboxes(page).nth(1).check();
    await shot(page, '动作: 勾选多行', {
      step: '勾选第 1、2 行',
      value: '选中记录 A 和 B',
      actual: '两行 checkbox 均被勾选',
    });
    await frame(page).getByRole('button', { name: 'Select' }).click();
    await expect(erliMessage(page)).toHaveText('Please select exactly one record.');
    await shot(page, '断言: No.7 多选 Select 报错', {
      step: '勾选多行后点击 Select',
      value: '选中记录 A 和 B',
      actual: '显示 "Please select exactly one record."，画面不跳转',
    });
  });

  test('No.8 选中一条记录点击 Select 回填前一画面', async ({ page }) => {
    // 携带条件使列表只有 EnginePower 一条
    await gotoResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('ENGINE');
      await ehvSelect(p, 'Type').click();
      await frame(p).locator('.ant-select-item-option', { hasText: 'VDA' }).first().click();
    });
    await expect(erliRows(page)).toHaveCount(1, { timeout: 15000 });
    await erliRowCheckboxes(page).first().check();
    await shot(page, '动作: 勾选唯一一行', {
      step: '勾选 EnginePower 记录',
      value: '选中记录 A',
      actual: '该行 checkbox 被勾选',
    });
    await frame(page).getByRole('button', { name: 'Select' }).click();
    // 回填到 UD10 前一画面
    await expect(frame(page).locator('.ehv-header-title')).toBeVisible({ timeout: 15000 });
    await expect(ehvInput(page, 'Variable')).toHaveValue('EnginePower');
    await expect(ehvInput(page, 'Description')).toHaveValue('Engine power output');
    await expect(ehvSelect(page, 'Type')).toContainText('VDA');
    await shot(page, '断言: No.8 单选 Select 回填', {
      step: '勾选一行并点击 Select',
      value: '选中记录 A（EnginePower）',
      actual: '记录 A 数据回填至 UD10，跳转至 Existing HDoc Variables',
    });
  });
});

// ============================================================================
// Test 5：Down（未选 / 多选报错 / 单选跳转 HomologationVariables）
// 覆盖 No.9, 10, 11
// ============================================================================
test.describe('Down (UD11)', () => {
  test('No.9 未选中记录点击 Down 报错', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Down' }).click();
    await expect(erliMessage(page)).toHaveText('No key defined for table.');
    await shot(page, '断言: No.9 未选中 Down 报错', {
      step: '不勾选任何行，点击 Down',
      value: '无选中记录',
      actual: '显示 "No key defined for table."，画面不跳转',
    });
  });

  test('No.10 选中多条记录点击 Down 报错', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    await erliRowCheckboxes(page).nth(0).check();
    await erliRowCheckboxes(page).nth(1).check();
    await frame(page).getByRole('button', { name: 'Down' }).click();
    await expect(erliMessage(page)).toHaveText('Please select exactly one record.');
    await shot(page, '断言: No.10 多选 Down 报错', {
      step: '勾选多行后点击 Down',
      value: '选中记录 A 和 B',
      actual: '显示 "Please select exactly one record."，画面不跳转',
    });
  });

  test('No.11 选中一条记录点击 Down 跳转 HomologationVariables 并过滤', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    // 选中 EnginePower 行
    const row = erliRows(page).filter({ hasText: 'EnginePower' });
    await row.locator('input[type="checkbox"]').first().check();
    await shot(page, '动作: 勾选 EnginePower 行', {
      step: '勾选 Variable=EnginePower 的记录',
      value: '选中记录 A',
      actual: 'EnginePower 行被勾选',
    });
    await frame(page).getByRole('button', { name: 'Down' }).click();
    // 跳转 HomologationVariables，自动应用 Variable=EnginePower 过滤（回填到输入框）
    await expect(frame(page).locator('.hv-header-title')).toBeVisible({ timeout: 15000 });
    await expect(hvInput(page, 'Variable')).toHaveValue('EnginePower');
    await shot(page, '断言: No.11 Down 跳转并过滤', {
      step: '勾选 Variable=EnginePower 后点击 Down',
      value: 'Variable="EnginePower"',
      actual: '跳转 Homologation Variables 画面，Variable 自动回填为 EnginePower（应用过滤）',
    });
  });
});

// ============================================================================
// Test 6：Back 返回前一画面
// 覆盖 No.12
// ============================================================================
test.describe('Back (UD11)', () => {
  test('No.12 Back 返回 Existing HDoc Variables 并回显条件', async ({ page }) => {
    await gotoResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('ENGINE');
    });
    await expect(erliRows(page)).toHaveCount(1, { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Back' }).click();
    await expect(frame(page).locator('.ehv-header-title')).toBeVisible({ timeout: 15000 });
    await expect(ehvInput(page, 'Variable')).toHaveValue('ENGINE');
    await shot(page, '断言: No.12 Back 返回并回显条件', {
      step: '点击 Back 按钮',
      value: '当前检索条件 Variable="ENGINE%"',
      actual: '返回 Existing HDoc Variables，Variable 自动回显为 ENGINE',
    });
  });
});

// ============================================================================
// Test 7：Excel 导出
// 覆盖 No.15, 16
// ============================================================================
test.describe('Excel 导出 (UD11)', () => {
  test('No.15 有数据时导出 CSV 文件', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Excel' }).click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^HDoc_Variables_/);
    expect(filename.endsWith('.csv')).toBeTruthy();
    await shot(page, '断言: No.15 有数据导出 CSV', {
      step: '检索结果含 5 条记录，点击 Excel',
      value: '检索结果含多条记录',
      actual: '生成 CSV 文件并触发下载（HDoc_Variables_日期.csv）',
    });
  });

  test('No.16 无数据时导出提示', async ({ page }) => {
    await gotoResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('NONEXIST');
    });
    await expect(frame(page).locator('.erli-message-error')).toHaveText('No records found matching the search criteria.', { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Excel' }).click();
    await expect(frame(page).locator('.erli-message-error')).toHaveText('No data to export.');
    await shot(page, '断言: No.16 无数据导出提示', {
      step: '检索结果为空（records=[]）点击 Excel',
      value: 'records=[]',
      actual: '显示 "No data to export."，不生成文件',
    });
  });
});

// ============================================================================
// Test 8：Created by user 链接跳转
// 覆盖 No.18
// ============================================================================
test.describe('Created by user 链接 (UD11)', () => {
  test('No.18 点击 Created by user 链接打开新页面', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    const link = frame(page).locator('.erli-table .ant-table-row a').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/edb-user-view\//);
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10000 }),
      link.click(),
    ]);
    await popup.waitForLoadState('domcontentloaded').catch(() => {});
    const popupUrl = await popup.url();
    expect(popupUrl).toContain('/edb-user-view/');
    await shot(page, '断言: No.18 Created by user 链接跳转', {
      step: '点击 Created by user 列链接',
      value: 'createdByUser',
      actual: '打开新页面跳转至 EDB User View',
    });
  });
});

// ============================================================================
// Test 9：错误消息红色 + checkbox 交互
// 覆盖 No.22, 23
// ============================================================================
test.describe('消息颜色 / 复选框交互 (UD11)', () => {
  test('No.22 错误消息红色显示', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Select' }).click();
    await expect(erliMessage(page)).toHaveText('Please select exactly one record.');
    const color = await frame(page).locator('.erli-message-error').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.22 错误消息红色', {
      step: '未选中点击 Select 触发错误',
      value: '错误消息',
      actual: '消息以红色 #ff4d4f 显示',
    });
  });

  test('No.23 复选框勾选/取消交互', async ({ page }) => {
    await gotoResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    const first = erliRowCheckboxes(page).first();
    await first.check();
    await expect(first).toBeChecked();
    const checkedAfter = await frame(page).locator('.erli-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checkedAfter).toBe(1);
    await first.uncheck();
    await expect(first).not.toBeChecked();
    const checkedAfterUncheck = await frame(page).locator('.erli-table .ant-table-row input[type="checkbox"]:checked').count();
    expect(checkedAfterUncheck).toBe(0);
    await shot(page, '断言: No.23 复选框交互', {
      step: '勾选第一行 checkbox 再取消',
      value: '选中记录 A，再取消',
      actual: '勾选时选中数为 1，取消后为 0',
    });
  });
});

// ============================================================================
// Skip：依赖 mock/异常注入的用例在纯真实后端下无法稳定验证
// No.4 (API 500) / No.5 (网络失败) / No.13 (打印成功) / No.14 (打印失败)
// No.17 (导出失败) / No.19 (链接失败) / No.20 (加载中禁用)
// ============================================================================
test.skip('Skip: 依赖 mock/异常注入的用例（No.4,5,13,14,17,19,20）', async () => {
  expect(true).toBeTruthy();
});
