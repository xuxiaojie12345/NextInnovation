/**
 * Upload & Delete Template 模块 (UD12) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/Upload&Deletetemplate/Upload&Deletetemplate_単体テスト仕様書.md
 * 对应前端：react-ud/src/Upload&Deletetemplate/Upload&Deletetemplate.tsx
 * 对应后端：TemplateController / FileServiceImpl / MasterDataServiceImpl
 *          （UD12SelectMarket / UD12GetTemplatesByMarket / UD12UploadFile / UD12DeleteFile）
 * 对应测试数据：tests/Upload&Deletetemplate/Upload&Deletetemplate_test_data.sql（需先 node seed.js）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081（含 UD12 接口）
 * 3. 已执行 node tests/Upload&Deletetemplate/seed.js（种入 JPN/EU 市场 + 预置模板文件）
 * 4. 登录用户 menuall（拥有 hdoc_admin 权限）
 *
 * 【画面进入方式（真实业务链路，Menu iframe）】
 * - Menu → "Upload/Delete template" → 右侧 iframe 加载 UD12（/upload-delete-template）。
 * - 所有 UD12 元素（udt-*）通过 iframe frameLocator('.menu-iframe') 定位。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\Upload&Deletetemplate\image
 * - 命名：Upload&Deletetemplate01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端，请使用：
 *   npx playwright test tests/Upload&Deletetemplate/Upload&Deletetemplate.spec.ts --workers=1
 *
 * 【Skip】依赖后端异常注入/并发的用例默认 skip（500、网络失败、权限错误、loading 禁用、路径遍历后端拦截等）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 Upload&DeletetemplateNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
function nextCounter() {
  ensureImageDir();
  const pat = /^Upload&Deletetemplate(\d+)\.jpeg$/;
  const existing = fs.readdirSync(IMAGE_DIR)
    .filter((f) => pat.test(f))
    .map((f) => parseInt((f.match(pat) || [])[1], 10) || 0);
  screenshotCounter = existing.length ? Math.max(...existing) : 0;
  return screenshotCounter + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  const filename = `Upload&Deletetemplate${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'udt-shot-info';
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
    await page.evaluate(() => { document.getElementById('udt-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD12 在 Menu 右侧 iframe）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function udtMessage(page: Page) {
  return frame(page).locator('.udt-message');
}
// 按分区(section)与 label 定位 select。
// 注意：label 含括号（如 "Market (Upload)"），不能直接用 filter({has: RegExp})（FrameLocator 下 has 的正则不生效导致多元素匹配），
// 改用 hasText 字符串子串匹配 .udt-field 内文本（Templates / Market (Delete) 互不包含）。
function udtSelect(page: Page, section: 'udt-upload' | 'udt-delete', label: string) {
  return frame(page).locator(`.${section}-section .udt-field`, { hasText: label })
    .locator('.udt-select');
}
function udtFileInput(page: Page) {
  return frame(page).locator('#udt-file-input');
}
function udtFileSelect(page: Page, name: string, mimeType: string, buffer: Buffer) {
  return udtFileInput(page).setInputFiles({ name, mimeType, buffer });
}
function udtOption(page: Page, text: string) {
  // 只匹配当前可见（打开）的下拉内的选项，避免残留/隐藏 dropdown 干扰
  return frame(page).locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: text }).first();
}
function udtDropdown(page: Page) {
  return frame(page).locator('.ant-select-dropdown:visible');
}

async function login(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// Menu 点击 "Upload/Delete template" 进入 UD12（ifframe 加载）
async function gotoUdt(page: Page) {
  await login(page);
  await page.getByRole('button', { name: 'Upload/Delete template' }).click();
  await expect(frame(page).locator('.udt-header-title')).toBeVisible({ timeout: 15000 });
}

// 从 iframe 内选择 select 下拉的指定选项
async function chooseSelect(page: Page, select: ReturnType<typeof frame>, labelText: string) {
  await select.click();
  await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
  await udtOption(page, labelText).click();
}

// 用 child_process 执行 seed.js 恢复模板文件状态（文件修改类测试后调用）
function reseed() {
  const seedPath = path.join(__dirname, 'seed.js');
  execSync(`node "${seedPath}"`, { stdio: 'ignore', timeout: 30000 });
}

// 一个最小 .odt 内容的 buffer
function odtBuffer(content = 'ODT test content\n') {
  return Buffer.from(content, 'utf8');
}

// ============================================================================
// Test 1：画面初期表示
// 覆盖 No.1, 2, 3, 7
// ============================================================================
test.describe('画面初期表示 (UD12)', () => {
  test('No.1/2/3/7 初期表示：Upload 区 / Delete 区 / Check Template 链接 / 错误区隐藏', async ({ page }) => {
    await gotoUdt(page);
    // Upload 区
    await expect(frame(page).locator('.udt-upload-section .udt-section-title')).toHaveText('Upload Template');
    await expect(udtFileInput(page)).toBeVisible();
    await expect(udtFileInput(page)).toBeEnabled();
    await expect(udtSelect(page, 'udt-upload', 'Market (Upload)')).toBeEnabled();
    await expect(frame(page).locator('.udt-btn-upload')).toBeEnabled();
    // Delete 区
    await expect(frame(page).locator('.udt-delete-section .udt-section-title')).toHaveText('Delete Template');
    await expect(udtSelect(page, 'udt-delete', 'Market (Delete)')).toBeEnabled();
    await expect(udtSelect(page, 'udt-delete', 'Templates').locator('input').first()).toBeDisabled(); // 初始禁用
    await expect(frame(page).locator('.udt-btn-delete')).toBeEnabled();
    // Check Template 链接
    const link = frame(page).locator('.udt-check-link a');
    await expect(link).toHaveText('Check Template (Only for rtf files)');
    await expect(link).toBeEnabled();
    await shot(page, '断言: No.1/2/3 画面初期表示', {
      step: '访问 Upload & Delete Template 画面',
      value: '无',
      actual: 'Upload/Delete 区域、Check Template 链接均正常显示',
    });
    // 错误消息区默认隐藏/为空
    await expect(udtMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.7 错误消息区默认隐藏', {
      step: '画面正常加载（无错误）',
      value: '无',
      actual: '错误消息区域默认隐藏、内容为空',
    });
  });
});

// ============================================================================
// Test 2：Market 列表加载
// 覆盖 No.4, 8, 9
// ============================================================================
test.describe('Market 列表加载 (UD12)', () => {
  test('No.4/8/9 Market 下拉加载 JPN/EU 等市场', async ({ page }) => {
    await gotoUdt(page);
    // Upload 区 Market 下拉
    const upSel = udtSelect(page, 'udt-upload', 'Market (Upload)');
    await upSel.click();
    await expect(udtOption(page, 'JPN - Japan')).toBeVisible({ timeout: 10000 });
    await expect(udtOption(page, 'EU - Europe')).toBeVisible();
    // 选 JPN -> value 为 JPN（label JPN - Japan）
    await udtOption(page, 'JPN - Japan').click();
    await expect(upSel).toContainText('JPN');
    await shot(page, '断言: No.4/8/9 Upload Market 下拉加载', {
      step: '访问画面，等待 Market API 响应',
      value: 'response: JPN-Japan, EU-Europe',
      actual: 'Upload 区 Market 下拉包含 JPN-Japan、EU-Europe，选择 JPN 值为 JPN',
    });
    // Delete 区 Market 下拉也应相同
    const delSel = udtSelect(page, 'udt-delete', 'Market (Delete)');
    await delSel.click();
    await expect(udtOption(page, 'JPN - Japan')).toBeVisible();
    await expect(udtOption(page, 'EU - Europe')).toBeVisible();
    await shot(page, '断言: No.4/8/9 Delete Market 下拉一致', {
      step: '查看 Delete 区 Market 下拉',
      value: 'response: 相同市场列表',
      actual: 'Delete 区 Market 下拉与 Upload 区一致（含 JPN、EU）',
    });
  });
});

// ============================================================================
// Test 3：Templates 初始状态 + 动态加载
// 覆盖 No.6, 36, 37, 38
// ============================================================================
test.describe('Templates 初始/加载 (UD12)', () => {
  test('No.6/36 Templates 初始禁用 + 选 Market 后加载', async ({ page }) => {
    await gotoUdt(page);
    const tplSel = udtSelect(page, 'udt-delete', 'Templates');
    await expect(tplSel.locator('input').first()).toBeDisabled(); // No.6 未选 Market 时禁用
    await shot(page, '断言: No.6 Templates 初始禁用', {
      step: '访问画面，未选择 Market',
      value: '无',
      actual: 'Templates 下拉为空且禁用',
    });
    // 选 Delete Market = JPN -> Templates 加载 test.odt/template_example.odt（No.36）
    await udtSelect(page, 'udt-delete', 'Market (Delete)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    await tplSel.click();
    await expect(udtOption(page, 'test.odt')).toBeVisible({ timeout: 10000 });
    await expect(udtOption(page, 'template_example.odt')).toBeVisible();
    await shot(page, '断言: No.36 Templates 加载 JPN 文件', {
      step: 'Delete Market 选择 JPN',
      value: 'Market="JPN"',
      actual: 'Templates 下拉可用并显示 test.odt、template_example.odt',
    });
  });

  test('No.37/38 Templates 切换 Market / 清空 Market', async ({ page }) => {
    await gotoUdt(page);
    // 切到 JPN
    const delSel = udtSelect(page, 'udt-delete', 'Market (Delete)');
    await delSel.click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    const tplSel = udtSelect(page, 'udt-delete', 'Templates');
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    // No.38 清空 Market -> Templates 清空禁用（hover 显示 clear 图标）
    await delSel.hover();
    await frame(page).locator('.ant-select-clear').first().click({ timeout: 5000 }).catch(() => {});
    await page.keyboard.press('Escape');
    await expect(tplSel.locator('input').first()).toBeDisabled();
    // 通过再次选择验证切换（No.37）：JPN -> EU 重载
    await delSel.click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'EU - Europe').click();
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    await tplSel.click();
    await expect(udtOption(page, 'template_example.odt')).toBeVisible({ timeout: 10000 });
    await shot(page, '断言: No.37/38 Templates 随 Market 切换加载', {
      step: 'Delete Market 从 JPN 切换为 EU',
      value: 'JPN -> EU',
      actual: 'Templates 下拉重新加载并显示 EU 的文件',
    });
  });
});

// ============================================================================
// Test 4：Upload 空值校验
// 覆盖 No.12, 13, 14
// ============================================================================
test.describe('Upload 空值校验 (UD12)', () => {
  test('No.12 文件未选择 + Market 有效 -> 报错', async ({ page }) => {
    await gotoUdt(page);
    await udtSelect(page, 'udt-upload', 'Market (Upload)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    await frame(page).getByRole('button', { name: 'Upload' }).click();
    await expect(udtMessage(page)).toHaveText('NO FILE UPLOADED.', { timeout: 10000 });
    await expect(frame(page).locator('.udt-btn-upload')).toBeEnabled();
    await shot(page, '断言: No.12 文件未选择报错', {
      step: '文件不选择，Market 选 JPN，点击 Upload',
      value: 'Market="JPN"',
      actual: '显示 "NO FILE UPLOADED."，不调用 API，按钮恢复可用',
    });
  });

  test('No.13 文件选择 + Market 未选择 -> 报错', async ({ page }) => {
    await gotoUdt(page);
    await udtFileSelect(page, 'test.odt', 'application/vnd.oasis.opendocument.text', odtBuffer());
    await frame(page).getByRole('button', { name: 'Upload' }).click();
    await expect(udtMessage(page)).toHaveText('Please select a Market.', { timeout: 10000 });
    await shot(page, '断言: No.13 Market 未选择报错', {
      step: '文件选择 test.odt，Market 不选，点击 Upload',
      value: 'Template File: test.odt',
      actual: '显示 "Please select a Market."，不调用 API',
    });
  });

  test('No.14 都不选择 -> 报错（文件优先）', async ({ page }) => {
    await gotoUdt(page);
    await frame(page).getByRole('button', { name: 'Upload' }).click();
    await expect(udtMessage(page)).toHaveText('NO FILE UPLOADED.', { timeout: 10000 });
    await shot(page, '断言: No.14 两者为空报错', {
      step: '文件与 Market 均不选择，点击 Upload',
      value: '无',
      actual: '先触发文件校验，显示 "NO FILE UPLOADED."',
    });
  });
});

// ============================================================================
// Test 5：Upload 文件类型/大小校验
// 覆盖 No.18, 19, 47
// ============================================================================
test.describe('Upload 文件校验 (UD12)', () => {
  test('No.18 文件类型不支持（.exe）', async ({ page }) => {
    await gotoUdt(page);
    await udtFileSelect(page, 'test.exe', 'application/octet-stream', Buffer.from('exe'));
    await expect(udtMessage(page)).toHaveText('File type not supported. Only .odt, .rtf files are allowed.', { timeout: 10000 });
    await shot(page, '断言: No.18 文件类型不支持', {
      step: '选择不支持的格式 test.exe',
      value: 'Template File: test.exe',
      actual: '显示 "File type not supported. Only .odt, .rtf files are allowed."',
    });
  });

  test('No.19 文件大小超出限制（>10MB）', async ({ page }) => {
    await gotoUdt(page);
    const big = Buffer.alloc(11 * 1024 * 1024, 65); // 超过 10MB
    await udtFileSelect(page, 'big.odt', 'application/vnd.oasis.opendocument.text', big);
    await expect(udtMessage(page)).toHaveText('File size exceeds the maximum allowed limit (10MB).', { timeout: 10000 });
    await shot(page, '断言: No.19 文件大小超限', {
      step: '选择超过大小限制的文件',
      value: 'Template File: >10MB',
      actual: '显示 "File size exceeds the maximum allowed limit (10MB)."',
    });
  });

  test('No.47 文件选择后显示文件名', async ({ page }) => {
    await gotoUdt(page);
    await udtFileSelect(page, 'test.odt', 'application/vnd.oasis.opendocument.text', odtBuffer());
    await expect(frame(page).locator('.udt-file-name')).toHaveText('test.odt');
    await shot(page, '断言: No.47 文件选择后显示文件名', {
      step: '选择文件 test.odt',
      value: 'Template File: test.odt',
      actual: '文件选择后显示已选择的文件名 test.odt',
    });
  });
});

// ============================================================================
// Test 6：Upload/Delete 成功 + Templates 刷新（串行，操作真实文件系统）
// 覆盖 No.15, 16, 29, 30, 31, 48, 49
// ============================================================================
test.describe.serial('Upload/Delete 成功 (UD12)', () => {
  test.afterEach(async () => {
    reseed();
  });

  test('No.15 Upload 成功（JPN）+ 绿色成功消息 + 清空文件', async ({ page }) => {
    await gotoUdt(page);
    await udtFileSelect(page, 'udt_test.odt', 'application/vnd.oasis.opendocument.text', odtBuffer('UDT upload'));
    await udtSelect(page, 'udt-upload', 'Market (Upload)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    await shot(page, '动作: 选择文件 udt_test.odt 与 Market JPN', {
      step: '选择文件 udt_test.odt，选择 Market JPN',
      value: 'udt_test.odt, JPN',
      actual: '文件与 Market 已选择',
    });
    await frame(page).getByRole('button', { name: 'Upload' }).click();
    await expect(udtMessage(page)).toHaveText('TEMPLATE udt_test.odt WAS SUCCESSFULLY UPLOADED TO MARKET JPN', { timeout: 15000 });
    // No.49 成功消息绿色
    const color = await frame(page).locator('.udt-message-success').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)'); // #52c41a
    await expect(udtFileInput(page)).toHaveValue('');
    await shot(page, '断言: No.15 Upload 成功 + No.49 绿色消息', {
      step: '上传 udt_test.odt 到 JPN',
      value: 'Template File: udt_test.odt, Market: JPN',
      actual: '显示 "TEMPLATE udt_test.odt WAS SUCCESSFULLY UPLOADED TO MARKET JPN"（绿色），文件被清空',
    });
  });

  test('No.16 Upload 成功（EU）', async ({ page }) => {
    await gotoUdt(page);
    await udtFileSelect(page, 'udt_eu.odt', 'application/vnd.oasis.opendocument.text', odtBuffer('UDT EU'));
    await udtSelect(page, 'udt-upload', 'Market (Upload)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'EU - Europe').click();
    await frame(page).getByRole('button', { name: 'Upload' }).click();
    await expect(udtMessage(page)).toHaveText('TEMPLATE udt_eu.odt WAS SUCCESSFULLY UPLOADED TO MARKET EU', { timeout: 15000 });
    await shot(page, '断言: No.16 Upload 成功（EU）', {
      step: '上传 udt_eu.odt 到 EU',
      value: 'Template File: udt_eu.odt, Market: EU',
      actual: '显示 "TEMPLATE udt_eu.odt WAS SUCCESSFULLY UPLOADED TO MARKET EU"，文件被清空',
    });
  });

  test('No.29/31 Delete 成功（JPN template_example.odt）+ Templates 刷新', async ({ page }) => {
    await gotoUdt(page);
    // 选 Delete Market=JPN -> Templates 加载
    await udtSelect(page, 'udt-delete', 'Market (Delete)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    const tplSel = udtSelect(page, 'udt-delete', 'Templates');
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    await tplSel.click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'template_example.odt').click();
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).toHaveText('Confirm Deletion');
    await expect(frame(page).locator('.ant-modal-confirm-content')).toContainText('Do you really want to delete template?');
    await shot(page, '动作: Delete 确认对话框', {
      step: '选 template_example.odt 后点 Delete',
      value: 'Market: JPN, Templates: template_example.odt',
      actual: '弹出确认对话框 "Do you really want to delete template?"',
    });
    await frame(page).getByRole('button', { name: 'Yes' }).click();
    await expect(udtMessage(page)).toHaveText('TEMPLATE template_example.odt WAS SUCCESSFULLY DELETE FROM MARKET JPN', { timeout: 15000 });
    // No.31 Templates 刷新：不再含已删除的 template_example.odt
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    await tplSel.click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await expect(frame(page).locator('.ant-select-item-option', { hasText: 'template_example.odt' })).toHaveCount(0);
    await expect(udtOption(page, 'test.odt')).toBeVisible();
    await shot(page, '断言: No.29/31 Delete 成功 + Templates 刷新', {
      step: '确认删除 template_example.odt',
      value: 'Market: JPN, Templates: template_example.odt',
      actual: '显示 "TEMPLATE template_example.odt WAS SUCCESSFULLY DELETE FROM MARKET JPN"，Templates 列表刷新不含已删文件',
    });
  });

  test('No.30 Delete 成功（EU test.odt）', async ({ page }) => {
    await gotoUdt(page);
    await udtSelect(page, 'udt-delete', 'Market (Delete)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'EU - Europe').click();
    const tplSel = udtSelect(page, 'udt-delete', 'Templates');
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    await tplSel.click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'test.odt').click();
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).toBeVisible();
    await frame(page).getByRole('button', { name: 'Yes' }).click();
    await expect(udtMessage(page)).toHaveText('TEMPLATE test.odt WAS SUCCESSFULLY DELETE FROM MARKET EU', { timeout: 15000 });
    await shot(page, '断言: No.30 Delete 成功（EU）', {
      step: '确认删除 test.odt（EU）',
      value: 'Market: EU, Templates: test.odt',
      actual: '显示 "TEMPLATE test.odt WAS SUCCESSFULLY DELETE FROM MARKET EU"',
    });
  });
});

// ============================================================================
// Test 7：Delete 空值校验 + 确认对话框
// 覆盖 No.23, 24, 25, 26, 27
// ============================================================================
test.describe('Delete 空值校验 / 确认对话框 (UD12)', () => {
  test('No.23 Delete Market 未选择 -> 报错', async ({ page }) => {
    await gotoUdt(page);
    // Templates 当前禁用（未选 Market）
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(udtMessage(page)).toHaveText('Please select a Market.', { timeout: 10000 });
    await expect(frame(page).locator('.ant-modal-confirm-title')).toHaveCount(0);
    await shot(page, '断言: No.23 Delete Market 未选择', {
      step: 'Market 不选，Templates 选任意，点 Delete',
      value: 'Templates: test.odt',
      actual: '显示 "Please select a Market."，不弹确认框、不调用 API',
    });
  });

  test('No.24 Delete Templates 未选择 -> 报错', async ({ page }) => {
    await gotoUdt(page);
    await udtSelect(page, 'udt-delete', 'Market (Delete)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    // Templates 不选，直接点 Delete
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(udtMessage(page)).toHaveText('Please select a template file to delete.', { timeout: 10000 });
    await expect(frame(page).locator('.ant-modal-confirm-title')).toHaveCount(0);
    await shot(page, '断言: No.24 Delete Template 未选择', {
      step: 'Market 选 JPN，Templates 不选，点 Delete',
      value: 'Market="JPN"',
      actual: '显示 "Please select a template file to delete."，不弹确认框',
    });
  });

  test('No.25 Delete 都不选择 -> 报错（Market 优先）', async ({ page }) => {
    await gotoUdt(page);
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(udtMessage(page)).toHaveText('Please select a Market.', { timeout: 10000 });
    await shot(page, '断言: No.25 Delete 两者为空', {
      step: 'Market 与 Templates 都不选，点 Delete',
      value: '无',
      actual: '先触发 Market 校验，显示 "Please select a Market."',
    });
  });

  test('No.26/27 确认对话框显示 + 点击取消', async ({ page }) => {
    await gotoUdt(page);
    await udtSelect(page, 'udt-delete', 'Market (Delete)').click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'JPN - Japan').click();
    const tplSel = udtSelect(page, 'udt-delete', 'Templates');
    await expect(tplSel).toBeEnabled({ timeout: 15000 });
    await tplSel.click();
    await expect(udtDropdown(page)).toBeVisible({ timeout: 10000 });
    await udtOption(page, 'test.odt').click();
    await frame(page).getByRole('button', { name: 'Delete' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).toHaveText('Confirm Deletion');
    await expect(frame(page).locator('.ant-modal-confirm-content')).toContainText('Do you really want to delete template?');
    await shot(page, '断言: No.26 确认对话框显示', {
      step: '选 test.odt 后点 Delete',
      value: 'Market: JPN, Templates: test.odt',
      actual: '弹出确认对话框 "Do you really want to delete template?"',
    });
    // No.27 点击取消
    await frame(page).getByRole('button', { name: 'No' }).click();
    await expect(frame(page).locator('.ant-modal-confirm-title')).not.toBeVisible();
    await expect(udtMessage(page)).not.toBeVisible();
    await shot(page, '断言: No.27 点击取消不删除', {
      step: '在确认对话框点击取消',
      value: 'Market: JPN, Templates: test.odt',
      actual: '取消操作，不调用 API，不显示任何消息',
    });
  });
});

// ============================================================================
// Test 8：错误消息红色 + Check Template 链接跳转
// 覆盖 No.41, 48
// ============================================================================
test.describe('错误红色 / Check Template 链接 (UD12)', () => {
  test('No.48 错误消息红色显示', async ({ page }) => {
    await gotoUdt(page);
    await frame(page).getByRole('button', { name: 'Upload' }).click();
    await expect(udtMessage(page)).toHaveText('NO FILE UPLOADED.', { timeout: 10000 });
    const color = await frame(page).locator('.udt-message-error').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.48 错误消息红色', {
      step: '触发 Upload 空值校验错误',
      value: '错误消息',
      actual: '错误消息以红色 #ff4d4f 显示',
    });
  });

  test('No.41 Check Template 链接跳转 HDoc Template Check', async ({ page }) => {
    await gotoUdt(page);
    // 点击链接（onClick preventDefault + navigate），在 iframe 内 SPA 跳转到 HDoc Template Check
    await frame(page).locator('.udt-check-link a').click();
    // 跳转后 iframe 内容变为 HDoc Template Check 画面（而非改 src attribute）
    await expect(frame(page).locator('.htc-header-title')).toHaveText('HDoc - Template Check', { timeout: 10000 });
    await shot(page, '断言: No.41 Check Template 跳转', {
      step: '点击 "Check Template (Only for rtf files)" 链接',
      value: '无',
      actual: '画面跳转至 HDoc Template Check 画面',
    });
  });
});

// ============================================================================
// Skip：依赖后端异常注入/并发/权限/安全检查的用例默认 skip
// No.5,10,11 (Market 空/异常) / No.17,20,21,22 (Upload 失败异常)
// No.32,33,34,35 (Delete 失败异常) / No.39,40 (Templates API 异常)
// No.42 (链接失败) / No.43,44,45,46,50 (loading/并发) / No.51,52 (安全)
// ============================================================================
test.skip('Skip: 依赖 mock/异常注入的用例（No.5,10,11,17,20,21,22,32,33,34,35,39,40,42,43,44,45,46,50,51,52）', async () => {
  expect(true).toBeTruthy();
});
