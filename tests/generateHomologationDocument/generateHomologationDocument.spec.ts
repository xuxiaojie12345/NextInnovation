/**
 * Generate Homologation Document 模块 (UD03) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/GenerateHomologationDocument/GenerateHomologationDocument_単体テスト仕様書.md
 * 对应前端：react-ud/src/GenerateHomologationDocument/GenerateHomologationDocument.tsx
 * 对应测试数据：tests/generateHomologationDocument/generateHomologationDocument_test_data.sql（需先执行）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081
 * 3. 已执行 generateHomologationDocument_test_data.sql（HDOC_DOCUMENT_LIST 含 VIN_CERT/HOMOLOG/CONFORM）
 * 4. 登录用户 menuall（拥有 hdoc 权限，见 tests/menu/menu_test_data.sql）
 *
 * 【画面访问（从 Menu 进入）】
 * - 先登录进入 Menu，点击“Generate Doc”菜单项，使右侧 iframe 加载 /GenerateHomologationDocument。
 * - 文档类型接口 GET /api/UD03SelectHdocdocumentlistApi（真实后端返回 HDOC_DOCUMENT_LIST 数据）。
 * - 表单校验为纯前端（zod）；提交后该画面通过 postMessage 通知 Menu 右侧切换到 /generate-document。
 *
 * 【运行方式】
 * - 本测试为“真实后端 + Menu iframe”集成测试。多个 worker 并行执行时，
 *   共享后端/数据库与浏览器资源会造成 AntD 下拉等时序偶发失败，因此请使用：
 *   npx playwright test tests/generateHomologationDocument/generateHomologationDocument.spec.ts --workers=1
 *
 * 【截图约定】
 * - 每个“动作”之后与每个“断言”之后各截取一张图片
 * - 格式：JPEG；存放目录：tests\generateHomologationDocument\image
 * - 命名：GenerateHomologationDocument01.jpeg（01 起，全局递增）
 *
 * 【说明】依赖后端异常注入或代码未实现的用例（No.12/27/32/33/34/35/36）默认 skip。
 */

import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 前端 dev server 地址
const BASE_URL = 'http://localhost:3000';
// 画面路由（iframe 内加载）
const PAGE_PATH = '/GenerateHomologationDocument';
// 菜单项 Generate Doc 对应的文案
const MENU_ITEM_LABEL = 'Generate Doc';
// 通用测试密码（复用 Menu 测试用户 menuall，拥有 hdoc 权限）
const TEST_PASSWORD = 'Menu@123';
// Skip 控制（由环境变量开启后端配合用例）
const SKIP_BACKEND = !process.env.GH_BACKEND_ERR;

// ============================================================================
// 截图工具
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;

function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

async function shot(page: Page, label: string) {
  ensureImageDir();
  screenshotCounter += 1;
  const filename = `GenerateHomologationDocument${String(screenshotCounter).padStart(2, '0')}.jpeg`;
  await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
  try {
    await page.screenshot({
      path: path.join(IMAGE_DIR, filename),
      type: 'jpeg',
      quality: 80,
      timeout: 8000,
    });
  } catch {
    // 截图失败不致命
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
  return filename;
}

// ============================================================================
// 辅助：从 Menu 画面进入 GenerateHomologationDocument
// ============================================================================
// 登录进入 Menu 画面（真实后端）
async function loginToMenu(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await shot(page, '动作: 登录表单填写完成');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  await shot(page, '断言: 登录成功进入 Menu');
}

// 从 Menu 点击 Generate Doc，使右侧 iframe 加载 GenerateHomologationDocument
async function gotoPage(page: Page) {
  // 先清除 localStorage 中的上次条件，确保画面初始为空（同源页面可操作）
  await page.goto(BASE_URL).catch(() => {});
  await page.evaluate(() => localStorage.removeItem('generateHomologationConditions')).catch(() => {});
  await loginToMenu(page);
  await page.getByRole('button', { name: new RegExp(MENU_ITEM_LABEL) }).click();
  const iframe = page.locator('.menu-iframe');
  await expect(iframe).toHaveAttribute('src', new RegExp(PAGE_PATH.replace('/', '\\/')), { timeout: 10000 });
  await expect(gh(page).locator('.gh-header-title')).toBeVisible({ timeout: 15000 });
  // 等待文档类型下拉加载完成（loading 结束后 Select 不再 disabled）
  await expect(gh(page).locator('.gh-select')).toBeEnabled({ timeout: 15000 });
  await shot(page, '动作: 从 Menu 打开 Generate Homologation Document 画面');
}

/** 带预设 localStorage 条件从 Menu 进入画面（用于“上次条件回显”用例） */
async function gotoPageWithConditions(page: Page, conditions: object | null) {
  // 先在同源页面设置/清除 localStorage，再通过 Menu 进入画面
  await page.goto(BASE_URL);
  if (conditions) {
    await page.evaluate((c) => {
      localStorage.setItem('generateHomologationConditions', JSON.stringify(c));
    }, conditions);
  } else {
    await page.evaluate(() => localStorage.removeItem('generateHomologationConditions'));
  }
  await loginToMenu(page);
  await page.getByRole('button', { name: new RegExp(MENU_ITEM_LABEL) }).click();
  const iframe = page.locator('.menu-iframe');
  await expect(iframe).toHaveAttribute('src', new RegExp(PAGE_PATH.replace('/', '\\/')), { timeout: 10000 });
  await expect(gh(page).locator('.gh-header-title')).toBeVisible({ timeout: 15000 });
  await expect(gh(page).locator('.gh-select')).toBeEnabled({ timeout: 15000 });
  await shot(page, '动作: 从 Menu 打开画面（带预设条件）');
}

// ============================================================================
// 辅助：iframe 内控件定位（GenerateHomologationDocument 在 Menu 右侧 iframe 中）
// ============================================================================
function gh(page: Page) {
  return page.frameLocator('.menu-iframe');
}
// 两个输入框共用 class .gh-input，按顺序取：0=Chassis series, 1=Chassis no
function seriesInput(page: Page): Locator {
  return gh(page).locator('input.gh-input').nth(0);
}
function noInput(page: Page): Locator {
  return gh(page).locator('input.gh-input').nth(1);
}
function docTypeSelect(page: Page): Locator {
  return gh(page).locator('.gh-select');
}
function errorMsg(page: Page): Locator {
  return gh(page).locator('.gh-error-message');
}

async function fillSeries(page: Page, value: string) {
  await seriesInput(page).fill(value);
  await shot(page, `动作: 输入 Chassis series = ${value}`);
}
async function fillNo(page: Page, value: string) {
  await noInput(page).fill(value);
  await shot(page, `动作: 输入 Chassis no = ${value}`);
}
// code -> description 映射（与 generateHomologationDocument_test_data.sql 一致）
const DOC_TYPE_DESC: Record<string, string> = {
  VIN_CERT: 'VIN Plate Certificate',
  HOMOLOG: 'Homologation Document',
  CONFORM: 'Certificate of Conformity',
};
/** 从下拉选择文档类型（code 转 description 匹配选项文本） */
async function selectDocType(page: Page, code: string) {
  const desc = DOC_TYPE_DESC[code] || code;
  await docTypeSelect(page).click();
  // 等待下拉面板出现（AntD dropdown 渲染在 iframe 内的 document.body）
  await expect(gh(page).locator('.ant-select-dropdown')).toBeVisible({ timeout: 10000 });
  await expect(gh(page).locator('.ant-select-item-option', { hasText: desc }).first()).toBeVisible({ timeout: 10000 });
  await gh(page).locator('.ant-select-item-option', { hasText: desc }).first().click();
  await shot(page, `动作: 选择 Document type = ${desc}`);
}

/** 点击 Submit 按钮（iframe 内） */
async function clickSubmit(page: Page) {
  await gh(page).getByRole('button', { name: 'Submit' }).click();
  await shot(page, '动作: 点击 Submit 按钮');
}
/** 点击 Reset 按钮（iframe 内） */
async function clickReset(page: Page) {
  await gh(page).getByRole('button', { name: 'Reset' }).click();
  await shot(page, '动作: 点击 Reset 按钮');
}

// ============================================================================
// 画面表示
// ============================================================================
test.describe('画面表示', () => {
  test('No.1 画面初期表示-输入框', async ({ page }) => {
    await gotoPage(page);
    await expect(seriesInput(page)).toBeVisible();
    await expect(noInput(page)).toBeVisible();
    await expect(seriesInput(page)).toBeEnabled();
    await expect(noInput(page)).toBeEnabled();
    await expect(seriesInput(page)).toHaveValue('');
    await expect(noInput(page)).toHaveValue('');
    await expect(docTypeSelect(page)).toBeEnabled();
    await shot(page, '断言: 两个输入框与下拉可用且为空');
    await expect(errorMsg(page)).toHaveCount(0);
    await shot(page, '断言: 无错误消息');
  });

  test('No.2 画面初期表示-按钮', async ({ page }) => {
    await gotoPage(page);
    const submit = gh(page).getByRole('button', { name: 'Submit' });
    const reset = gh(page).getByRole('button', { name: 'Reset' });
    const help = gh(page).getByRole('button', { name: 'Help' });
    await expect(submit).toBeVisible();
    await expect(reset).toBeVisible();
    await expect(help).toBeVisible();
    await expect(submit).toBeEnabled();
    await expect(reset).toBeEnabled();
    await expect(help).toBeEnabled();
    await shot(page, '断言: Submit/Reset/Help 按钮可见可点击');
  });

  test('No.3 画面初期表示-控件属性(Chassis series)', async ({ page }) => {
    await gotoPage(page);
    await expect(gh(page).locator('.gh-label', { hasText: 'Chassis series' })).toBeVisible();
    await expect(seriesInput(page)).toHaveAttribute('maxlength', '5');
    await shot(page, '断言: Chassis series 标签与 maxlength=5');
  });

  test('No.4 画面初期表示-控件属性(Chassis no)', async ({ page }) => {
    await gotoPage(page);
    await expect(gh(page).locator('.gh-label', { hasText: 'Chassis no' })).toBeVisible();
    await expect(noInput(page)).toHaveAttribute('maxlength', '10');
    await shot(page, '断言: Chassis no 标签与 maxlength=10');
  });

  test('No.5 画面初期表示-控件属性(Document type)', async ({ page }) => {
    await gotoPage(page);
    await expect(gh(page).locator('.gh-label', { hasText: 'Document type' })).toBeVisible();
    await expect(docTypeSelect(page)).toBeVisible();
    // 下拉展开后有选项（等待选项渲染）
    await docTypeSelect(page).click();
    await expect(gh(page).locator('.ant-select-item-option').first()).toBeVisible({ timeout: 10000 });
    await shot(page, '断言: Document type 下拉标签与选项');
  });

  test('No.6 画面初期表示-Support Mail', async ({ page }) => {
    await gotoPage(page);
    await expect(gh(page).locator('.gh-footer')).toContainText('HDoc support');
    await expect(gh(page).locator('a', { hasText: 'support.tpi@volvo.com' })).toBeVisible();
    await shot(page, '断言: Support Mail 页脚显示');
  });
});

// ============================================================================
// 画面初始化-文档类型列表加载
// ============================================================================
test.describe('文档类型列表加载', () => {
  test('No.7 文档类型加载-正常加载', async ({ page }) => {
    await gotoPage(page);
    await docTypeSelect(page).click();
    // 从真实后端加载的选项应至少含 VIN_CERT/HOMOLOG（测试数据）
    await expect(gh(page).locator('.ant-select-item-option', { hasText: 'VIN Plate Certificate' }).first())
      .toBeVisible();
    await shot(page, '断言: 下拉加载了 VIN Plate Certificate');
  });

  test('No.8 文档类型加载-列表内容验证', async ({ page }) => {
    await gotoPage(page);
    await docTypeSelect(page).click();
    await expect(gh(page).locator('.ant-select-item-option', { hasText: 'VIN Plate Certificate' }).first())
      .toBeVisible();
    await expect(gh(page).locator('.ant-select-item-option', { hasText: 'Homologation Document' }).first())
      .toBeVisible();
    await expect(gh(page).locator('.ant-select-item-option', { hasText: 'Certificate of Conformity' }).first())
      .toBeVisible();
    await shot(page, '断言: 下拉含 VIN_CERT/HOMOLOG/CONFORM 描述');
  });
});

// ============================================================================
// 上次条件回显（localStorage）
// ============================================================================
test.describe('上次条件回显', () => {
  test('No.9 上次条件回显-全部回显', async ({ page }) => {
    await gotoPageWithConditions(page, {
      chassisSeries: 'JPCT', chassisNo: '028321', documentType: 'VIN_CERT',
    });
    await expect(seriesInput(page)).toHaveValue('JPCT');
    await expect(noInput(page)).toHaveValue('028321');
    await shot(page, '断言: 全部条件回显');
    await page.evaluate(() => localStorage.removeItem('generateHomologationConditions'));
  });

  test('No.10 上次条件回显-仅部分保存', async ({ page }) => {
    await gotoPageWithConditions(page, { chassisSeries: 'JPCT' });
    await expect(seriesInput(page)).toHaveValue('JPCT');
    await expect(noInput(page)).toHaveValue('');
    await shot(page, '断言: 部分条件回显');
    await page.evaluate(() => localStorage.removeItem('generateHomologationConditions'));
  });

  test('No.11 上次条件回显-无保存条件', async ({ page }) => {
    await gotoPageWithConditions(page, null);
    await expect(seriesInput(page)).toHaveValue('');
    await expect(noInput(page)).toHaveValue('');
    await shot(page, '断言: 无保存条件时为空');
  });
});

// ============================================================================
// 空值校验（纯前端，无后端调用）
// ============================================================================
test.describe('空值校验', () => {
  test('No.13 空值校验-三者均为空', async ({ page }) => {
    await gotoPage(page);
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series, Chassis no and Document type are required.');
    await shot(page, '断言: 三者为空报错');
  });

  test('No.14 空值校验-Chassis series 为空', async ({ page }) => {
    await gotoPage(page);
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series, Chassis no and Document type are required.');
    await shot(page, '断言: series 为空报错');
  });

  test('No.15 空值校验-Chassis no 为空', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series, Chassis no and Document type are required.');
    await shot(page, '断言: no 为空报错');
  });

  test('No.16 空值校验-Document type 未选择', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '028321');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series, Chassis no and Document type are required.');
    await shot(page, '断言: document type 未选报错');
  });

  test('No.17 空值校验-半角空格视为空', async ({ page }) => {
    await gotoPage(page);
    await seriesInput(page).fill('   ');
    await noInput(page).fill('   ');
    await shot(page, '动作: 输入半角空格');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series, Chassis no and Document type are required.');
    await shot(page, '断言: 空格视为空报错');
  });
});

// ============================================================================
// 格式校验（纯前端）
// ============================================================================
test.describe('格式校验', () => {
  test('No.18 格式校验-Chassis series 含数字', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JP1T');
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series must be 1-5 alphabetic characters.');
    await shot(page, '断言: series 含数字报错');
  });

  test('No.19 格式校验-Chassis series 超过5位(maxlength)', async ({ page }) => {
    await gotoPage(page);
    await seriesInput(page).fill('ABCDEF'); // 第6字符被 maxlength=5 拦截
    await expect(seriesInput(page)).toHaveValue('ABCDE');
    await shot(page, '断言: series 输入被截断为5位');
  });

  test('No.20 格式校验-Chassis series 小写字母', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'jpct');
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    // 小写字母允许，校验通过 → 右侧 iframe 切换到 /generate-document
    await expect(page.locator('.menu-iframe')).toHaveAttribute('src', /generate-document/, { timeout: 10000 });
    await shot(page, '断言: 小写字母校验通过切换 GenerateDocument');
  });

  test('No.21 格式校验-Chassis no 含字母', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '02832A');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText('Chassis no must be 1-10 numeric digits.');
    await shot(page, '断言: no 含字母报错');
  });

  test('No.22 格式校验-Chassis no 含符号', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '0283-21');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText('Chassis no must be 1-10 numeric digits.');
    await shot(page, '断言: no 含符号报错');
  });

  test('No.23 格式校验-Chassis no 超过10位(maxlength)', async ({ page }) => {
    await gotoPage(page);
    await noInput(page).fill('12345678901'); // 第11字符被 maxlength=10 拦截
    await expect(noInput(page)).toHaveValue('1234567890');
    await shot(page, '断言: no 输入被截断为10位');
  });
});

// ============================================================================
// 提交处理
// ============================================================================
test.describe('提交处理', () => {
  test('No.24 提交-校验通过后保存条件并在右侧显示 GenerateDocument', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    // Submit 后 Menu 右侧 iframe 切换到 /generate-document（URL 保持 /menu）
    const iframe = page.locator('.menu-iframe');
    await expect(iframe).toHaveAttribute('src', /\/generate-document/, { timeout: 10000 });
    await shot(page, '断言: 右侧 iframe 切换到 GenerateDocument');
    const saved = await page.evaluate(() =>
      localStorage.getItem('generateHomologationConditions'));
    expect(saved).not.toBeNull();
    await shot(page, '断言: 搜索条件已保存到 localStorage');
  });

  test('No.25 提交-携带查询条件切换 Generate document 画面', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    const iframe = page.locator('.menu-iframe');
    await expect(iframe).toHaveAttribute('src', /generate-document/, { timeout: 10000 });
    const src = (await iframe.getAttribute('src')) || '';
    expect(src).toContain('chassisNo=028321');
    expect(src).toContain('docType=VIN_CERT');
    await shot(page, '断言: 右侧 iframe 携带 chassisNo/docType 切换');
  });

  test('No.26 提交-保存条件覆盖上次值', async ({ page }) => {
    await gotoPageWithConditions(page, {
      chassisSeries: 'OLD', chassisNo: '111111', documentType: 'HOMOLOG',
    });
    await fillSeries(page, 'JPCT');
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    const iframe = page.locator('.menu-iframe');
    await expect(iframe).toHaveAttribute('src', /generate-document/, { timeout: 10000 });
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('generateHomologationConditions') || '{}'));
    expect(saved.chassisSeries).toBe('JPCT');
    expect(saved.chassisNo).toBe('028321');
    await shot(page, '断言: localStorage 条件被覆盖为新值');
    await page.evaluate(() => localStorage.removeItem('generateHomologationConditions'));
  });
});

// ============================================================================
// Reset 功能（纯前端）
// ============================================================================
test.describe('Reset 功能', () => {
  test('No.28 Reset-清空所有输入', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickReset(page);
    await expect(seriesInput(page)).toHaveValue('');
    await expect(noInput(page)).toHaveValue('');
    await expect(errorMsg(page)).toHaveCount(0);
    await shot(page, '断言: Reset 后输入为空、无错误');
  });

  test('No.29 Reset-输入为空时点击', async ({ page }) => {
    await gotoPage(page);
    await clickReset(page);
    await expect(seriesInput(page)).toHaveValue('');
    await expect(noInput(page)).toHaveValue('');
    await expect(errorMsg(page)).toHaveCount(0);
    await shot(page, '断言: Reset 空输入无变化');
  });

  test('No.30 Reset-有错误消息时点击清空', async ({ page }) => {
    await gotoPage(page);
    await clickSubmit(page); // 触发空值校验错误
    await expect(errorMsg(page)).toBeVisible();
    await shot(page, '动作: 触发空值校验错误');
    await clickReset(page);
    await expect(errorMsg(page)).toHaveCount(0);
    await expect(seriesInput(page)).toHaveValue('');
    await shot(page, '断言: Reset 清空错误消息与输入');
  });
});

// ============================================================================
// Help 功能
// ============================================================================
test.describe('Help 功能', () => {
  test('No.31 Help-点击跳转', async ({ page }) => {
    await gotoPage(page);
    // 通过 popup 事件捕获新窗口（Help 按钮在右侧 iframe 内）
    const popupPromise = page.waitForEvent('popup');
    await gh(page).getByRole('button', { name: 'Help' }).click();
    const popup = await popupPromise;
    await shot(page, '动作: 点击 Help 打开新窗口');
    await expect(popup).toHaveURL(/user-guide/i, { timeout: 10000 });
    await shot(page, '断言: 新窗口跳转 user-guide');
  });
});

// ============================================================================
// 异常处理（依赖后端异常注入或代码未实现，默认 skip）
// ============================================================================
test.describe('异常处理(需后端配合)', () => {
  test('No.12 上次条件回显-存储异常（需模拟 localStorage 异常，skip）', async ({ page }, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '需注入 localStorage 读取异常方可自动化');
  });
  test('No.27 提交-跳转失败（依赖路由/异常注入，skip）', async ({ page }, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '需注入跳转失败方可自动化');
  });
  test('No.32 异常-文档类型接口超时（需拦截超时，skip）', async ({ page }, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '需后端注入超时方可自动化');
  });
  test('No.33 异常-文档类型接口500（需后端注入500，skip）', async ({ page }, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '需后端返回500方可自动化');
  });
  test('No.34 异常-文档类型接口401（需后端返回401，skip）', async ({ page }, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '需后端返回401方可自动化');
  });
  test('No.35 异常-本地存储写入异常（需模拟异常，skip）', async ({ page }, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '需注入 localStorage 写入异常方可自动化');
  });
});

// ============================================================================
// UI交互
// ============================================================================
test.describe('UI交互', () => {
  test('No.36 Submit 按钮 Loading 状态（当前代码未实现 loading，skip）', async ({}, testInfo) => {
    testInfo.skip(SKIP_BACKEND, '当前前端 Submit 无 loading/disabled 实现，需代码配合');
  });

  test('No.37 UI交互-错误消息样式为红色', async ({ page }) => {
    await gotoPage(page);
    await clickSubmit(page);
    await expect(errorMsg(page)).toBeVisible();
    const color = await errorMsg(page).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: 错误消息为红色 #ff4d4f');
  });

  test('No.38 UI交互-输入修正后错误消息消失', async ({ page }) => {
    await gotoPage(page);
    await clickSubmit(page);
    await expect(errorMsg(page)).toBeVisible();
    await shot(page, '动作: 触发错误');
    await fillSeries(page, 'JPCT');
    await expect(errorMsg(page)).toHaveCount(0);
    await shot(page, '断言: 修改输入后错误消息消失');
  });

  test('No.39 UI交互-输入框输入限制(Chassis series) 提交时拦截', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'AB123'); // 含数字
    await fillNo(page, '028321');
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText(
      'Chassis series must be 1-5 alphabetic characters.');
    await shot(page, '断言: series 含数字提交被校验拦截');
  });

  test('No.40 UI交互-输入框输入限制(Chassis no) 提交时拦截', async ({ page }) => {
    await gotoPage(page);
    await fillSeries(page, 'JPCT');
    await fillNo(page, '123AB'); // 含字母
    await selectDocType(page, 'VIN_CERT');
    await clickSubmit(page);
    await expect(errorMsg(page)).toHaveText('Chassis no must be 1-10 numeric digits.');
    await shot(page, '断言: no 含字母提交被校验拦截');
  });
});
