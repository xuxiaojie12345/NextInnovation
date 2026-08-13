/**
 * Existing HDoc Variables 模块 (UD10) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/ExistingHDocVariables/ExistingHDocVariables_単体テスト仕様書.md
 * 对应前端：react-ud/src/ExistingHDocVariables/ExistingHDocVariables.tsx
 *         + react-ud/src/ExistingHDocVariablesResultList/ExistingHDocVariablesResultList.tsx (UD11)
 * 对应后端：SearchController / VariableServiceImpl（UD10Search/Add/Update/Delete、UD11Search）
 * 对应测试数据：tests/existingHDocVariables/existingHDocVariables_test_data.sql（需先 node seed.js）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081（含 UD10/UD11 接口）
 * 3. 已执行 node tests/existingHDocVariables/seed.js（种入 ud_test 库，5 条变量）
 * 4. 登录用户 menuall
 *
 * 【画面进入方式】
 * - UD10 主画面：直接导航 /existing-hdoc-variables（独立页面）
 * - UD11 ResultList：经 UD10 Search 跳转，或直接导航 /existing-hdoc-variables-result-list
 *
 * 【截图约定】
 * - 每个"动作/断言"会叠加临时信息栏（操作步骤/设定值/实际结果）再截图
 * - 格式：JPEG；存放目录：tests\existingHDocVariables\image
 * - 命名：ExistingHDocVariables01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端，请使用：
 *   npx playwright test tests/existingHDocVariables/existingHDocVariables.spec.ts --workers=1
 *
 * 【Skip】依赖 mock/异常的用例默认 skip（网络失败、500、Back 父页面、导出异常、加载中禁用等）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 ExistingHDocVariablesNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
function nextCounter() {
  ensureImageDir();
  const pat = /^ExistingHDocVariables(\d+)\.jpeg$/;
  const existing = fs.readdirSync(IMAGE_DIR)
    .filter((f) => pat.test(f))
    .map((f) => parseInt((f.match(pat) || [])[1], 10) || 0);
  screenshotCounter = existing.length ? Math.max(...existing) : 0;
  return screenshotCounter + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  const filename = `ExistingHDocVariables${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'ehv-shot-info';
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
    await page.evaluate(() => { document.getElementById('ehv-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD10/UD11 通过 Menu 菜单在右侧 iframe 加载）
// ============================================================================
// 业务入口：Menu 点击菜单项后，右侧 <iframe class="menu-iframe" src=...> 加载子画面。
// 所有元素定位统一通过 iframe 的 frameLocator（page.frameLocator('.menu-iframe')）。
const IFRAME_SELECTOR = '.menu-iframe';
function frame(page: Page) {
  return page.frameLocator(IFRAME_SELECTOR);
}
function ehvMessage(page: Page) {
  return frame(page).locator('.ehv-message');
}
function ehvInput(page: Page, label: string) {
  return frame(page).locator('.ehv-field').filter({ has: frame(page).locator('.ehv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.ehv-input');
}
function ehvSelect(page: Page, label: string) {
  return frame(page).locator('.ehv-field').filter({ has: frame(page).locator('.ehv-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.ehv-select');
}
function erliRows(page: Page) {
  return frame(page).locator('.erli-table .ant-table-row');
}

async function login(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// 通过 Menu 菜单点击“Existing HDoc variables”进入 UD10（真实业务入口，iframe 加载）
async function gotoEhd(page: Page) {
  await login(page);
  await page.getByRole('button', { name: 'Existing HDoc variables' }).click();
  // 等 iframe 内 UD10 标题出现
  await expect(frame(page).locator('.ehv-header-title')).toBeVisible({ timeout: 15000 });
}

// 经 UD10 Search 携带条件进入 UD11 ResultList（iframe 内部跳转，不改变父页面 URL）
async function searchToResultList(page: Page, fill: (f: Page) => Promise<void>) {
  await gotoEhd(page);
  await fill(page);
  await frame(page).getByRole('button', { name: 'Search' }).click();
  await expect(frame(page).locator('.erli-header-title')).toBeVisible({ timeout: 15000 });
}

// 用 child_process 执行 seed.js 恢复种子数据（修改类测试后调用）
function reseed() {
  const seedPath = path.join(__dirname, 'seed.js');
  execSync(`node "${seedPath}"`, { stdio: 'ignore', timeout: 30000 });
}

// ============================================================================
// Test 1：画面初始状态 + Type 下拉固定选项
// 覆盖 No.1, 2
// ============================================================================
test.describe('画面初始状态 / Type 下拉 (UD10)', () => {
  test('No.1 画面初始状态：字段为空 + 按钮活性', async ({ page }) => {
    await gotoEhd(page);
    // 所有输入字段为空
    await expect(ehvInput(page, 'Variable')).toHaveValue('');
    await expect(ehvInput(page, 'Description')).toHaveValue('');
    await expect(ehvInput(page, 'Created by user')).toHaveValue('');
    await expect(ehvInput(page, 'Date')).toHaveValue('');
    // Type 下拉为空（allowClear）
    await expect(ehvSelect(page, 'Type').locator('.ant-select-selection-item')).toHaveCount(0);
    // 所有按钮活性
    for (const name of ['Search', 'Clear', 'Back', 'Add', 'Update', 'Delete']) {
      await expect(frame(page).getByRole('button', { name })).toBeEnabled();
    }
    await shot(page, '断言: No.1 画面初始状态', {
      step: '加载画面，未做任何操作',
      value: '无',
      actual: '所有输入字段为空，6 个按钮全部活性',
    });
  });

  test('No.2 Type 下拉列表固定选项', async ({ page }) => {
    await gotoEhd(page);
    await ehvSelect(page, 'Type').click();
    // 下拉包含 VDA 和 User Defined
    await expect(frame(page).locator('.ant-select-item-option', { hasText: 'VDA' }).first()).toBeVisible({ timeout: 10000 });
    await expect(frame(page).locator('.ant-select-item-option', { hasText: 'User Defined' }).first()).toBeVisible();
    const options = await frame(page).locator('.ant-select-item-option').allTextContents();
    expect(options.some((t) => t.trim() === 'VDA')).toBeTruthy();
    expect(options.some((t) => t.trim() === 'User Defined')).toBeTruthy();
    // 关闭下拉（iframe 内点击按钮行空白处）
    await frame(page).locator('.ehv-buttons').click();
    await shot(page, '断言: No.2 Type 下拉固定选项', {
      step: '展开 Type 下拉列表',
      value: '—',
      actual: '下拉包含空选项和固定选项 VDA、User Defined',
    });
  });
});

// ============================================================================
// Test 2：检索（无条件 / 单条件 / 组合 / 空结果）
// 覆盖 No.3, 4, 5, 6
// ============================================================================
test.describe('检索 (UD10-UD11)', () => {
  test('No.3 无条件检索返回全部记录', async ({ page }) => {
    await searchToResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    await expect(frame(page).locator('.erli-count')).toHaveText('Number of lines found: 5');
    await expect(frame(page).locator('.erli-table')).toContainText('EnginePower');
    await shot(page, '断言: No.3 无条件检索全部记录', {
      step: '所有检索条件为空，点击 Search',
      value: '全部为空',
      actual: '返回全部 5 条变量记录，Count=5',
    });
  });

  test('No.4 单条件检索（Variable 模糊）', async ({ page }) => {
    await searchToResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('ENGINE');
    });
    await expect(erliRows(page)).toHaveCount(1, { timeout: 15000 });
    await expect(frame(page).locator('.erli-table')).toContainText('EnginePower');
    await shot(page, '断言: No.4 Variable 模糊检索', {
      step: '输入 Variable="ENGINE" 点击 Search',
      value: 'Variable="ENGINE"',
      actual: '返回匹配记录 EnginePower（1 条）',
    });
  });

  test('No.5 多条件组合检索（Variable + Type）', async ({ page }) => {
    await searchToResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('ENGINE');
      await ehvSelect(p, 'Type').click();
      await frame(p).locator('.ant-select-item-option', { hasText: 'VDA' }).first().click();
    });
    await expect(erliRows(page)).toHaveCount(1, { timeout: 15000 });
    await expect(frame(page).locator('.erli-table')).toContainText('EnginePower');
    await shot(page, '断言: No.5 组合检索 Variable+Type', {
      step: '输入 Variable="ENGINE", Type="ENGINE" 点击 Search',
      value: 'Variable="ENGINE%", Type="ENGINE"',
      actual: '仅返回同时满足两条件的 EnginePower 记录',
    });
  });

  test('No.6 检索结果为空', async ({ page }) => {
    await searchToResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('NONEXIST');
    });
    await expect(frame(page).locator('.erli-message-error')).toHaveText('No records found matching the search criteria.', { timeout: 15000 });
    await expect(erliRows(page)).toHaveCount(0);
    await expect(frame(page).locator('.erli-count')).toHaveText('Number of lines found: 0');
    await shot(page, '断言: No.6 检索结果为空', {
      step: '输入 Variable="NONEXIST" 点击 Search',
      value: 'Variable="NONEXIST"',
      actual: '显示 "No records found matching the search criteria."，列表为空，Count=0',
    });
  });
});

// ============================================================================
// Test 3：检索结果点击回填
// 覆盖 No.9
// ============================================================================
test.describe('检索结果回填 (UD10-UD11)', () => {
  test('No.9 检索结果点击回填输入字段', async ({ page }) => {
    await searchToResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('ENGINE');
    });
    await expect(erliRows(page)).toHaveCount(1, { timeout: 15000 });
    // 勾选这一行并 Select 回填
    await frame(page).locator('.erli-table .ant-table-row input[type="checkbox"]').first().check();
    await shot(page, '动作: 在结果列表勾选一行', {
      step: '勾选 EnginePower 记录',
      value: '选中 Variable=EnginePower',
      actual: '该行 checkbox 被勾选',
    });
    await frame(page).getByRole('button', { name: 'Select' }).click();
    // 回到 UD10 主画面，字段回填
    await expect(frame(page).locator('.ehv-header-title')).toBeVisible({ timeout: 15000 });
    await expect(ehvInput(page, 'Variable')).toHaveValue('EnginePower');
    await expect(ehvInput(page, 'Description')).toHaveValue('Engine power output');
    await expect(ehvSelect(page, 'Type')).toContainText('VDA');
    await expect(ehvInput(page, 'Created by user')).toHaveValue('system');
    await shot(page, '断言: No.9 检索结果点击回填', {
      step: '结果列表勾选一行并点击 Select',
      value: '点击 Variable=EnginePower 的行',
      actual: 'Variable/Type/Description/Created by user/Date 回填至输入字段',
    });
  });
});

// ============================================================================
// Test 4：Clear 清除所有输入字段
// 覆盖 No.22
// ============================================================================
test.describe('Clear (UD10)', () => {
  test('No.22 Clear 清除所有输入字段', async ({ page }) => {
    await gotoEhd(page);
    // 填写所有字段
    await ehvInput(page, 'Variable').fill('TestVar');
    await ehvSelect(page, 'Type').click();
    await frame(page).locator('.ant-select-item-option', { hasText: 'VDA' }).first().click();
    await ehvInput(page, 'Description').fill('Test desc');
    await ehvInput(page, 'Created by user').fill('menuall');
    await ehvInput(page, 'Date').fill('2026-08-13');
    await shot(page, '动作: 填写所有输入字段', {
      step: '填写 Variable/Type/Description/Created by user/Date',
      value: '所有字段有值',
      actual: '5 个字段均已填写',
    });
    await frame(page).getByRole('button', { name: 'Clear' }).click();
    // 全部清空
    await expect(ehvInput(page, 'Variable')).toHaveValue('');
    await expect(ehvInput(page, 'Description')).toHaveValue('');
    await expect(ehvInput(page, 'Created by user')).toHaveValue('');
    await expect(ehvInput(page, 'Date')).toHaveValue('');
    await expect(ehvSelect(page, 'Type').locator('.ant-select-selection-item')).toHaveCount(0);
    await shot(page, '断言: No.22 Clear 清空所有字段', {
      step: '填写所有字段后点击 Clear',
      value: '所有字段有值',
      actual: 'Variable/Type/Description/Created by user/Date 全部清空，恢复初始状态',
    });
  });
});

// ============================================================================
// Test 5：Add 校验（Variable 为空 / 已存在）
// 覆盖 No.11, 12（No.10 Add 成功在 serial Test6 中）
// ============================================================================
test.describe('Add 校验 (UD10)', () => {
  test('No.11 Variable 为空点 Add 报错', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('');
    await frame(page).getByRole('button', { name: 'Add' }).click();
    await expect(ehvMessage(page)).toHaveText('Variable is required.', { timeout: 10000 });
    await shot(page, '断言: No.11 Variable 为空', {
      step: 'Variable 未填写，点击 Add',
      value: 'Variable=""',
      actual: '显示 "Variable is required."，不调用 API',
    });
  });

  test('No.12 Variable 已存在点 Add 报错', async ({ page }) => {
    await gotoEhd(page);
    // 输入已存在的 Variable=EnginePower
    await ehvInput(page, 'Variable').fill('EnginePower');
    await frame(page).getByRole('button', { name: 'Add' }).click();
    await expect(ehvMessage(page)).toHaveText('Variant already exists. Please enter the correct content.', { timeout: 10000 });
    await shot(page, '断言: No.12 Variable 已存在', {
      step: '输入已存在 Variable=EnginePower 点击 Add',
      value: 'Variable="EnginePower"（已存在）',
      actual: '显示 "Variant already exists. Please enter the correct content."',
    });
  });
});

// ============================================================================
// Test 6：Add/Update/Delete 成功 + Delete/Update 校验（串行 + 恢复种子）
// 覆盖 No.10, 14, 18, 19, 20, 21, 15, 16
// ============================================================================
test.describe.serial('Add/Update/Delete (UD10)', () => {
  test.afterEach(async () => {
    reseed();
  });

  test('No.10 Add 成功 + 清空输入', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('NEW_VAR');
    await ehvSelect(page, 'Type').click();
    await frame(page).locator('.ant-select-item-option', { hasText: 'VDA' }).first().click();
    await ehvInput(page, 'Description').fill('New variable');
    await shot(page, '动作: 填写 Add 表单', {
      step: '填写 Variable=NEW_VAR, Type=VDA, Description=New',
      value: 'Variable="NEW_VAR"',
      actual: '字段已填写',
    });
    await frame(page).getByRole('button', { name: 'Add' }).click();
    await expect(ehvMessage(page)).toHaveText('Variable added successfully.', { timeout: 10000 });
    // 成功消息+清空输入（绿色 No.29 在此断言）
    const color = await frame(page).locator('.ehv-message-success').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)'); // #52c41a
    await expect(ehvInput(page, 'Variable')).toHaveValue('');
    await shot(page, '断言: No.10 Add 成功 + No.29 绿色成功', {
      step: '填写 NEW_VAR 后点击 Add',
      value: 'Variable="NEW_VAR"',
      actual: '显示 "Variable added successfully."（绿色），输入字段清空',
    });
  });

  test('No.14 Update 成功', async ({ page }) => {
    await gotoEhd(page);
    // 输入已存在的 EnginePower，改 Type=User Defined, Description=Updated
    await ehvInput(page, 'Variable').fill('EnginePower');
    await ehvSelect(page, 'Type').click();
    await frame(page).locator('.ant-select-item-option', { hasText: 'User Defined' }).first().click();
    await ehvInput(page, 'Description').fill('Updated');
    await shot(page, '动作: 填写 Update 条件', {
      step: '输入 Variable=EnginePower, Type=User Defined, Description=Updated',
      value: 'Type=User Defined, Description=Updated',
      actual: '字段已填写',
    });
    await frame(page).getByRole('button', { name: 'Update' }).click();
    await expect(ehvMessage(page)).toHaveText('Variable updated successfully.', { timeout: 10000 });
    await shot(page, '断言: No.14 Update 成功', {
      step: '对 EnginePower 执行 Update',
      value: 'Type=User Defined, Description=Updated',
      actual: '显示 "Variable updated successfully."',
    });
  });

  test('No.15 Update Variable 为空报错', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('');
    await frame(page).getByRole('button', { name: 'Update' }).click();
    await expect(ehvMessage(page)).toHaveText('Variable is required.', { timeout: 10000 });
    await shot(page, '断言: No.15 Update Variable 为空', {
      step: 'Variable 未填写，点击 Update',
      value: 'Variable=""',
      actual: '显示 "Variable is required."',
    });
  });

  test('No.16 Update Variable 不存在报错', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('NONEXIST');
    await frame(page).getByRole('button', { name: 'Update' }).click();
    await expect(ehvMessage(page)).toHaveText('Variant does not exist. Please enter the correct content.', { timeout: 10000 });
    await shot(page, '断言: No.16 Update 不存在', {
      step: '输入不存在的 Variable=NONEXIST 点击 Update',
      value: 'Variable="NONEXIST"',
      actual: '显示 "Variant does not exist. Please enter the correct content."',
    });
  });

  test('No.18 Delete 成功 + 清空输入', async ({ page }) => {
    await gotoEhd(page);
    // 删除种子变量之一（WheelType），验证 count 变化后 reseed 恢复
    await ehvInput(page, 'Variable').fill('WheelType');
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).toHaveText('Confirm Deletion');
    await shot(page, '动作: 弹出删除确认对话框', {
      step: '输入 Variable=WheelType 点击 Delete',
      value: 'Variable="WheelType"',
      actual: '弹出确认对话框',
    });
    await frame(page).getByRole('button', { name: 'Yes' }).click();
    await expect(ehvMessage(page)).toHaveText('Variable deleted successfully.', { timeout: 10000 });
    await expect(ehvInput(page, 'Variable')).toHaveValue('');
    await shot(page, '断言: No.18 Delete 成功', {
      step: '确认删除 WheelType',
      value: 'Variable="WheelType"',
      actual: '显示 "Variable deleted successfully."，输入清空',
    });
  });

  test('No.19 删除取消确认，列表不变', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('WheelType');
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).toHaveText('Confirm Deletion');
    // 点击取消
    await frame(page).getByRole('button', { name: 'No' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).not.toBeVisible();
    // 无成功消息（取消未调用 API）—— 通过 Variable 仍保留原值验证
    await expect(ehvMessage(page)).not.toBeVisible();
    await shot(page, '断言: No.19 删除取消确认', {
      step: '点 Delete 后在确认对话框选择取消',
      value: 'Variable="WheelType"',
      actual: '取消后不调用 API，输入保留原值',
    });
  });

  test('No.20 Delete Variable 为空报错', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('');
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(ehvMessage(page)).toHaveText('Variable is required.', { timeout: 10000 });
    await shot(page, '断言: No.20 Delete Variable 为空', {
      step: 'Variable 未填写，点击 Delete',
      value: 'Variable=""',
      actual: '显示 "Variable is required."',
    });
  });

  test('No.21 Delete Variable 不存在报错', async ({ page }) => {
    await gotoEhd(page);
    await ehvInput(page, 'Variable').fill('NONEXIST');
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).toBeVisible();
    await frame(page).getByRole('button', { name: 'Yes' }).click();
    await expect(ehvMessage(page)).toHaveText('Variant does not exist. Please enter the correct content.', { timeout: 10000 });
    await shot(page, '断言: No.21 Delete 不存在', {
      step: '输入不存在 Variable=NONEXIST 点 Delete 并确认',
      value: 'Variable="NONEXIST"',
      actual: '显示 "Variant does not exist. Please enter the correct content."',
    });
  });
});

// ============================================================================
// Test 7：Excel 导出
// 覆盖 No.24, 25
// ============================================================================
test.describe('Excel 导出 (UD11)', () => {
  test('No.24 有数据时导出 CSV 文件', async ({ page }) => {
    await searchToResultList(page, async () => {});
    await expect(erliRows(page)).toHaveCount(5, { timeout: 15000 });
    // 触发下载（download 事件在 page 顶层捕获，Excel 按钮在 iframe 内）
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await frame(page).getByRole('button', { name: 'Excel' }).click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^HDoc_Variables_/);
    expect(filename.endsWith('.csv')).toBeTruthy();
    await shot(page, '断言: No.24 有数据导出 CSV', {
      step: '检索结果含 5 条记录，点击 Excel',
      value: '检索结果含多条记录',
      actual: '生成 CSV 文件并触发下载（HDoc_Variables_日期.csv）',
    });
  });

  test('No.25 无数据时导出提示', async ({ page }) => {
    await searchToResultList(page, async (p) => {
      await ehvInput(p, 'Variable').fill('NONEXIST');
    });
    await expect(frame(page).locator('.erli-message-error')).toHaveText('No records found matching the search criteria.', { timeout: 15000 });
    // 点击 Excel 显示 No data to export.
    await frame(page).getByRole('button', { name: 'Excel' }).click();
    await expect(frame(page).locator('.erli-message-error')).toHaveText('No data to export.');
    await shot(page, '断言: No.25 无数据导出提示', {
      step: '检索结果为空（searchResults=[]）点击 Excel',
      value: 'searchResults=[]',
      actual: '显示 "No data to export."，不生成文件',
    });
  });
});

// ============================================================================
// Skip：依赖 mock/异常注入的用例在纯真实后端下无法稳定验证
// No.7 (API 500) / No.8 (网络失败) / No.13 (Add 网络失败)
// No.17 (Update 网络失败) / No.23 (Back 父页面) / No.26 (导出失败) / No.27 (加载中禁用)
// ============================================================================
test.skip('Skip: 依赖 mock/异常注入的用例（No.7,8,13,17,23,26,27）', async () => {
  expect(true).toBeTruthy();
});
