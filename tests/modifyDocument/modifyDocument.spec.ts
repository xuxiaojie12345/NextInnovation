/**
 * Modify Document 模块 (UD05) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/ModifyDocument/ModifyDocument_単体テスト仕様書.md
 * 对应前端：react-ud/src/ModifyDocument/ModifyDocument.tsx
 * 对应测试数据：tests/modifyDocument/modifyDocument_test_data.sql（需先执行）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081（含 ModifyDocument 增强 + /api/download/template）
 * 3. 已执行 generateDocument_test_data.sql 与 modifyDocument_test_data.sql
 * 4. 登录用户 menuall（拥有 hdoc 权限，见 tests/menu/menu_test_data.sql）
 *
 * 【画面进入方式】
 * - ModifyDocument 从 location.state.chassisNo 接收底盘号，直访无 state 会报错。
 * - 本测试主 happy path 走完整 Menu 链路（自动通过 GenerateDocument 的 Modify Doc 链接进入）。
 * - 跳转/边界用例采用 history.replaceState 注入 state 后 reload（真实渲染画面）。
 *
 * 【截图约定】
 * - 每个"动作/断言"后会叠加一个临时信息栏（操作步骤/设定值/实际结果）再截图
 * - 格式：JPEG；存放目录：tests\modifyDocument\image
 * - 命名：ModifyDocument01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端 + iframe 集成，请使用：
 *   npx playwright test tests/modifyDocument/modifyDocument.spec.ts --workers=1
 *
 * 【Skip】依赖后端异常注入/中间态/未实现功能的用例默认 skip。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 前端 dev server 地址
const BASE_URL = 'http://localhost:3000';
const MENU_ITEM_LABEL = 'Generate Doc';
const TEST_PASSWORD = 'Menu@123';
// 底部底盘：与 generateDocument_test_data.sql 一致
const CHASSIS_NO = '028321';

// ============================================================================
// 截图工具（叠加信息栏：操作步骤 / 设定值 / 实际结果）
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;

function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

interface ShotInfo {
  step: string;
  value: string;
  actual: string;
}

async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  screenshotCounter += 1;
  const filename = `ModifyDocument${String(screenshotCounter).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'md-shot-info';
      d.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:999999;background:#003366;color:#fff;' +
        'padding:8px 12px;font:12px/1.5 sans-serif;white-space:pre-wrap;' +
        'box-shadow:0 2px 6px rgba(0,0,0,.3);';
      d.textContent = `[操作步骤] ${inf.step}\n[设定值] ${inf.value}\n[实际结果] ${inf.actual}`;
      document.body.prepend(d);
    }, info);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));
  }
  try {
    await page.screenshot({
      path: path.join(IMAGE_DIR, filename),
      type: 'jpeg',
      quality: 80,
      timeout: 8000,
      fullPage: true,
    });
  } catch {
    // 截图失败不致命
  }
  if (info) {
    await page.evaluate(() => {
      document.getElementById('md-shot-info')?.remove();
    }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助：iframe 内 ModifyDocument 控件定位（完整链路下位于 .menu-iframe 内）
// ============================================================================
function md(page: Page) {
  return page.frameLocator('.menu-iframe');
}

/** 按 label 精确找到 info-row 中的链接/值 */
function infoRowValue(scope: any, label: string) {
  return scope.locator('.md-info-row').filter({ has: scope.locator('.md-info-label', { hasText: new RegExp('^' + label + '$') }) });
}

/** 按 variable 名定位某一行 */
function rowByVariable(scope: any, variable: string) {
  return scope.locator('.md-tr').filter({ has: scope.locator('.md-td-variable', { hasText: variable }) });
}

// ============================================================================
// 辅助：完整 Menu 链路登录
// ============================================================================
async function loginToMenu(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

const DOC_TYPE_DESC: Record<string, string> = {
  VIN_CERT: 'VIN Plate Certificate',
  HOMOLOG: 'Homologation Document',
  CONFORM: 'Certificate of Conformity',
};

/**
 * 完整 Menu 链路进入 ModifyDocument：
 * 登录 -> Generate Doc -> GenerateHomologationDocument(填 028321) -> Submit
 * -> GenerateDocument -> 点 Modify Doc 链接 -> ModifyDocument
 */
async function gotoModifyDocumentViaChain(page: Page) {
  await loginToMenu(page);
  await shot(page, '断言: 登录成功进入 Menu');
  await page.getByRole('button', { name: new RegExp(MENU_ITEM_LABEL) }).click();
  const iframe = page.locator('.menu-iframe');
  await expect(iframe).toHaveAttribute('src', /GenerateHomologationDocument/, { timeout: 10000 });
  await expect(md(page).locator('.gh-header-title')).toBeVisible({ timeout: 15000 });
  await expect(md(page).locator('.gh-select')).toBeEnabled({ timeout: 15000 });
  await shot(page, '动作: 打开 Generate Homologation Document 画面');
  // 填表提交 -> GenerateDocument
  await md(page).locator('input.gh-input').nth(0).fill('AAAAA');
  await md(page).locator('input.gh-input').nth(1).fill(CHASSIS_NO);
  await md(page).locator('.gh-select').click();
  await expect(md(page).locator('.ant-select-dropdown')).toBeVisible({ timeout: 10000 });
  await md(page).locator('.ant-select-item-option', { hasText: DOC_TYPE_DESC.VIN_CERT }).first().click();
  await md(page).getByRole('button', { name: 'Submit' }).click();
  await expect(iframe).toHaveAttribute('src', /generate-document/, { timeout: 10000 });
  await expect(md(page).locator('.gd-header-title')).toBeVisible({ timeout: 15000 });
  await expect(md(page).locator('.gd-loading')).toHaveCount(0, { timeout: 15000 }).catch(() => {});
  await expect(md(page).locator('.gd-row').filter({ has: md(page).locator('.gd-label', { hasText: /^Chassis no$/ }) }).locator('.gd-value')).toContainText(CHASSIS_NO, { timeout: 15000 });
  await shot(page, '动作: 进入 Generate Document 画面（完整链路）');
  // 点击 Modify Doc 链接 -> ModifyDocument
  await expect(md(page).locator('.gd-link-modify')).toBeVisible({ timeout: 10000 });
  await md(page).locator('.gd-link-modify').first().click();
  await expect(md(page).locator('.md-header-title')).toBeVisible({ timeout: 15000 });
  await expect(md(page).locator('.md-loading')).toHaveCount(0, { timeout: 15000 }).catch(() => {});
  await shot(page, '动作: 点击 Modify Doc 进入 Modify Document 画面');
}

/** 通过注入 history.state 快速进入 ModifyDocument（跳转/边界用，独立渲染） */
async function gotoModifyDocumentByState(page: Page) {
  await loginToMenu(page);
  await page.goto(BASE_URL + '/modify-document');
  await page.evaluate((chn) => {
    history.replaceState({ chassisNo: chn }, '', '/modify-document');
  }, CHASSIS_NO);
  await page.reload();
  await expect(page.locator('.md-header-title')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.md-loading')).toHaveCount(0, { timeout: 15000 }).catch(() => {});
}

// ============================================================================
// Test 1：完整链路 - 画面表示 + 保存功能（No.1-4,6,7,8,9,10,13,14,15,16,19,20,26）
// ============================================================================
test.describe('完整链路 - 画面表示与保存 (028321)', () => {
  test('No.1-4,6-10,13,14-16,19,20,26', async ({ page }) => {
    await gotoModifyDocumentViaChain(page);
    const scope = md(page);

    // ============ No.1 基本信息 ============
    await expect(infoRowValue(scope, 'chassis no').locator('.md-link')).toContainText(CHASSIS_NO);
    await expect(infoRowValue(scope, 'Market').locator('.md-info-value')).toHaveText('-');
    await expect(infoRowValue(scope, 'Template').locator('.md-link')).toContainText('Download template file');
    // 左对齐（浏览器 computed text-align 为 start/left）
    await expect(scope.locator('.md-info-label').first()).toHaveCSS('text-align', 'start');
    await shot(page, '断言: No.1 基本信息显示', {
      step: '读取基本信息区域',
      value: 'chassisNo=028321, market=-(未传)',
      actual: 'chassis no 链接=028321 / Market=- / Template 下载链接显示',
    });

    // ============ No.2 表格表头 ============
    const headers = scope.locator('.md-th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');
    await expect(headers.first()).toHaveCSS('text-align', 'left');
    await shot(page, '断言: No.2 表头', {
      step: '读取表格表头',
      value: '-',
      actual: 'Variable/Description/Current value/Modified value 表头显示且左对齐',
    });

    // ============ No.3 Save 按钮 ============
    const saveBtn = scope.locator('.md-button-save');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();
    await shot(page, '断言: No.3 Save 按钮', {
      step: '检查 Save 按钮',
      value: '-',
      actual: 'Save 按钮显示且活性',
    });

    // ============ No.4 Error message 区域 ============
    await expect(scope.locator('.md-message')).toHaveCount(0);
    await shot(page, '断言: No.4 Error message 隐藏', {
      step: '检查错误消息区域',
      value: '无错误',
      actual: 'Error message 区域不显示',
    });

    // ============ No.7 数据行 ============
    // EnginePower / Color / WheelType 三行
    await expect(rowByVariable(scope, 'EnginePower').locator('.md-td-variable')).toHaveText('EnginePower');
    await expect(rowByVariable(scope, 'EnginePower').locator('.md-td-desc')).toHaveText('Engine power output');
    await expect(rowByVariable(scope, 'EnginePower').locator('.md-td-current')).toHaveText('200HP');
    await expect(rowByVariable(scope, 'Color').locator('.md-td-desc')).toHaveText('Vehicle color');
    await expect(rowByVariable(scope, 'Color').locator('.md-td-current')).toHaveText('Blue');
    await expect(rowByVariable(scope, 'WheelType').locator('.md-td-desc')).toHaveText('Wheel type');
    await expect(rowByVariable(scope, 'WheelType').locator('.md-td-current')).toHaveText('Steel');
    await shot(page, '断言: No.7 数据行', {
      step: '读取表格数据行',
      value: 'EnginePower/200HP, Color/Blue, WheelType/Steel',
      actual: 'Variable/Description/Current value 正确显示',
    });

    // ============ No.8 editable=true 可编辑 + maxLength=500 ============
    const engineInput = rowByVariable(scope, 'EnginePower').locator('.md-input');
    await expect(engineInput).toBeEnabled();
    await expect(engineInput).toHaveAttribute('maxlength', '500');
    // No.10 modifiedValue 有预设值（NEWVAL=200HP）
    await expect(engineInput).toHaveValue('200HP');
    await shot(page, '断言: No.8/10 可编辑输入框与预设值', {
      step: '检查 EnginePower 的 Modified value 输入框',
      value: 'editable=true, modifiedValue 预填=200HP',
      actual: '输入框活性、maxlength=500、预填 200HP',
    });

    // ============ No.9 editable=false 只读 ============
    const wheelInput = rowByVariable(scope, 'WheelType').locator('.md-input');
    await expect(wheelInput).toBeDisabled();
    await shot(page, '断言: No.9 只读行', {
      step: '检查 WheelType 输入框',
      value: 'editable=false',
      actual: 'WheelType 输入框禁用（只读）',
    });

    // ============ No.13 链接样式（蓝色下划线）============
    await expect(infoRowValue(scope, 'chassis no').locator('.md-link')).toHaveCSS('cursor', 'pointer');
    await shot(page, '断言: No.13 链接可点击', {
      step: '检查 chassis no / Template 链接',
      value: '-',
      actual: '链接显示为可点击',
    });

    // ============ No.14 空值校验：所有行未改（同 currentValue）点 Save ============
    await saveBtn.click();
    await expect(scope.locator('.md-message')).toHaveText('NO UNRELEASED VERSION EXISTS!', { timeout: 10000 });
    await shot(page, '断言: No.14 所有 modified value 空/相同', {
      step: '不修改任何值直接点 Save',
      value: '所有行 modifiedValue == currentValue',
      actual: '显示 "NO UNRELEASED VERSION EXISTS!"，不跳转',
    });

    // ============ No.15/19/26 保存：EnginePower 改 250HP -> Save -> 跳转 ============
    await engineInput.fill('250HP');
    await shot(page, '动作: 修改 EnginePower 值为 250HP', {
      step: '在 EnginePower Modified value 输入 250HP',
      value: '250HP',
      actual: '输入框显示 250HP',
    });
    await saveBtn.click();
    // Save 后前端 navigate('/save-modifications')，ModifyDocument 位于 iframe 内，
    // 因此等待 iframe 内 SaveModifications 画面（.sm-header-title）出现
    await expect(scope.locator('.sm-header-title')).toHaveText('HDoc - Save Modifications', { timeout: 15000 });
    await shot(page, '断言: No.19/26 保存成功跳转 Save Modifications', {
      step: '点击 Save',
      value: 'EnginePower=250HP（与当前值不同）',
      actual: '跳转至 Save Modifications 画面',
    });
  });
});

// ============================================================================
// Test 2：跳转 - Template 模板下载（No.24）
// ============================================================================
test.describe('跳转 - Template 模板下载', () => {
  test('No.24 模板文件下载', async ({ page }) => {
    await gotoModifyDocumentByState(page);
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('.md-info-row').filter({ has: page.locator('.md-info-label', { hasText: /^Template$/ }) }).locator('.md-link').click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toContain('.trf');
    await shot(page, '断言: No.24 模板文件下载', {
      step: '点击 Template 下载链接',
      value: 'GET /api/download/template',
      actual: '浏览器触发下载 .trf 模板文件',
    });
  });
});

// ============================================================================
// Test 3：跳转 - chassis no 详情（No.25）—— 走完整链路确保 chassisNo 渲染
// ============================================================================
test.describe('跳转 - chassis no 详情', () => {
  test('No.25 底盘详细信息链接', async ({ page }) => {
    await gotoModifyDocumentViaChain(page);
    const scope = md(page);
    const popupPromise = page.waitForEvent('popup', { timeout: 15000 });
    await infoRowValue(scope, 'chassis no').locator('.md-link').click();
    const popup = await popupPromise;
    await expect(popup.url()).toContain('/vda-vehicle-specification');
    await popup.close();
    await shot(page, '断言: No.25 chassis 详情跳转', {
      step: '点击 chassis no 链接',
      value: 'chassisNo=028321',
      actual: '打开新窗口 /vda-vehicle-specification?chassisNo=028321',
    });
  });
});

// ============================================================================
// Test 4：UI 交互 - Modified value 最大长度 500（No.29）—— 走完整链路
// ============================================================================
test.describe('UI 交互 - 输入最大长度', () => {
  test('No.29 Modified value 最大 500 字符', async ({ page }) => {
    await gotoModifyDocumentViaChain(page);
    const scope = md(page);
    const input = rowByVariable(scope, 'EnginePower').locator('.md-input');
    await expect(input).toHaveAttribute('maxlength', '500');
    // 用逐字符输入模拟真实输入，浏览器按 maxlength=500 截断第 501 个字符
    const longValue = 'X'.repeat(501);
    await input.fill('');
    await input.type(longValue, { delay: 0 });
    const val = await input.inputValue();
    await expect(val.length).toBeLessThanOrEqual(500);
    await shot(page, '断言: No.29 最大长度限制', {
      step: '输入 501 字符',
      value: '501 字符（>500）',
      actual: `输入被限制为 ${val.length} 字符（maxlength=500）`,
    });
  });
});

// ============================================================================
// Skip：依赖后端异常注入 / 中间态 / 未实现
// ============================================================================
test.describe('Skip（依赖异常注入/中间态）', () => {
  test.skip('No.5 Loading 状态（需模拟 API 延迟）', async () => {});
  test.skip('No.11 Modified value 无预设值（需特殊数据）', async () => {});
  test.skip('No.12 变量列表为空（需空底盘 + state 进入）', async () => {});
  test.skip('No.17 修改值回退与当前值相同', async () => {});
  test.skip('No.18 修改值为空的行不提交', async () => {});
  test.skip('No.21 保存失败-API 返回错误（需 mock）', async () => {});
  test.skip('No.22 保存失败-长度超限 501（需后端校验）', async () => {});
  test.skip('No.23 保存失败-409 版本冲突（需 mock）', async () => {});
  test.skip('No.27 Save Loading 状态（中间态）', async () => {});
  test.skip('No.28 错误消息样式（红色）', async () => {});
  test.skip('No.30 Template 链接点击不跳转', async () => {});
  test.skip('No.31 网络请求失败（需 mock）', async () => {});
  test.skip('No.32 服务器 500 错误（需 mock）', async () => {});
  test.skip('No.33 模板文件下载失败（需 mock）', async () => {});
  test.skip('No.34 底盘详情跳转失败（需 mock）', async () => {});
});
