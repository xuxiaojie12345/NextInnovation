/**
 * List Available Templates 模块 (UD14) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/ListAvailableTemplates/ListAvailableTemplates_単体テスト仕様書.md
 * 对应前端：react-ud/src/ListAvailableTemplates/ListAvailableTemplates.tsx
 * 对应后端：AvailableTemplatesController / FileServiceImpl / MasterDataServiceImpl
 *          （UD14SelectMarketmaster / UD14SelectHdocuserdefinedrules / UD14downfile）
 * 对应测试数据：tests/listAvailableTemplates/ListAvailableTemplates_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. 后端已启动：http://localhost:8081（UD14 三个接口，UD14SelectHdocuserdefinedrules 接收 market 并返回
 *    filename/used/lastMod/size）。注意：后端需为修复后的版本（见 AvailableTemplatesController/FileServiceImpl）。
 * 3. 已执行 node tests/listAvailableTemplates/seed.js（种入 JPN/EU 市场、HDOC_USER_DEFINED_RULES.VARIABLE、
 *    并在 uploads/{JPN,EU} 预置不同大小的模板文件）。
 * 4. 登录用户 menuall（拥有 hdoc_admin 权限）。
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "List available templates" → 右侧 iframe 加载（/list-available-templates）。
 * - 所有 UD14 元素（lat-*）通过 iframe frameLocator('.menu-iframe') 定位。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\listAvailableTemplates\image
 * - 命名：ListAvailableTemplates01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端，使用：
 *   node tests/listAvailableTemplates/run_lat.js
 *
 * 【Skip】依赖后端异常注入/并发/瞬时 loading/下载错误分支的用例默认 skip
 *   （No.5、8、9、14、15、16、20、25、26、28、29、31、33、34、35、36、37）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 ListAvailableTemplatesNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
function nextCounter() {
  ensureImageDir();
  const pat = /^ListAvailableTemplates(\d+)\.jpeg$/;
  const existing = fs.readdirSync(IMAGE_DIR)
    .filter((f) => pat.test(f))
    .map((f) => parseInt((f.match(pat) || [])[1], 10) || 0);
  screenshotCounter = existing.length ? Math.max(...existing) : 0;
  return screenshotCounter + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  const filename = `ListAvailableTemplates${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'lat-shot-info';
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
    await page.evaluate(() => { document.getElementById('lat-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD14 在 Menu 右侧 iframe）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function latMessage(page: Page) {
  return frame(page).locator('.lat-message');
}
function latMarketSelect(page: Page) {
  return frame(page).locator('.lat-select');
}
function latOption(page: Page, text: string) {
  return frame(page).locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: text }).first();
}
function latDropdown(page: Page) {
  return frame(page).locator('.ant-select-dropdown:visible');
}
function latTableBody(page: Page) {
  return frame(page).locator('.lat-table .ant-table-tbody');
}
function latRow(page: Page, index: number) {
  return frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').nth(index);
}

async function login(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// 进入 UD14：Menu -> List available templates（iframe 加载）
async function gotoLat(page: Page) {
  await login(page);
  const menuBtn = page.getByRole('button', { name: 'List available templates' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(frame(page).locator('.lat-header-title')).toHaveText('HDoc - List Available Templates', { timeout: 15000 });
}

// 选择 Market（antd Select）
async function selectMarket(page: Page, optionText: string) {
  await latMarketSelect(page).click();
  await expect(latDropdown(page)).toBeVisible({ timeout: 10000 });
  await latOption(page, optionText).click();
}

// ============================================================================
// Test 1：画面初期表示（No.1,2,3,4）
// ============================================================================
test.describe('画面初期表示 (UD14)', () => {
  test('No.1/3/4 初期表示：SelectMarket / 表格隐藏 / 错误区隐藏', async ({ page }) => {
    await gotoLat(page);
    // No.1/3 SelectMarket 下拉显示（活性，初始未选）
    await expect(frame(page).locator('.lat-label')).toHaveText('Select Market');
    await expect(latMarketSelect(page)).toBeEnabled();
    await shot(page, '断言: No.1/3 画面初期表示', {
      step: '访问 List Available Templates 画面',
      value: '无',
      actual: 'SelectMarket 下拉正常显示（活性）',
    });
    // No.4 错误消息区默认隐藏；未选 Market 时表格区不显示
    await expect(latMessage(page)).toHaveCount(0);
    await expect(frame(page).locator('.lat-table-section')).toHaveCount(0);
    await shot(page, '断言: No.4 错误区隐藏', {
      step: '画面正常加载（无错误）',
      value: '无',
      actual: '错误消息区域隐藏；未选 Market 时文件表格不显示',
    });
  });

  test('No.2 选择 Market 后显示 DataTable 表头', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    // 表格出现后验证表头
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    const headers = await frame(page).locator('.lat-table .ant-table-thead th').allInnerTexts();
    expect(headers.join('|')).toContain('Filename');
    expect(headers.join('|')).toContain('Used');
    expect(headers.join('|')).toContain('Last Mod');
    expect(headers.join('|')).toContain('Size');
    await shot(page, '断言: No.2 表头显示', {
      step: '选择 JPN 使表格显示',
      value: 'Market="JPN"',
      actual: 'Filename / Used / Last Mod / Size 表头正常显示',
    });
  });
});

// ============================================================================
// Test 2：Market 加载（No.6,7）
// ============================================================================
test.describe('Market 加载 (UD14)', () => {
  test('No.6/7 Market 列表加载并选择 JPN', async ({ page }) => {
    await gotoLat(page);
    await latMarketSelect(page).click();
    await expect(latDropdown(page)).toBeVisible({ timeout: 10000 });
    await expect(latOption(page, 'JPN - Japan')).toBeVisible();
    await expect(latOption(page, 'EU - Europe')).toBeVisible();
    await latOption(page, 'JPN - Japan').click();
    // 选择后 value 显示 JPN（label JPN - Japan）
    await expect(latMarketSelect(page)).toContainText('JPN');
    await shot(page, '断言: No.6/7 Market 下拉加载', {
      step: '打开 SelectMarket 下拉并选择 JPN',
      value: 'response: JPN-Japan, EU-Europe',
      actual: '下拉显示 JPN-Japan、EU-Europe，选择 JPN 值为 JPN',
    });
  });
});

// ============================================================================
// Test 3：模板列表加载 + 表格数据（No.10,17,18,19,21,22,23,38,39,40,41,42）
// ============================================================================
test.describe('模板列表/表格 (UD14)', () => {
  test('No.10/17/23 选择 JPN 加载多行 + Filename 链接', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    // 等待表格加载（含 6 个文件）
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    // Filename 显示且为链接（blue link class）
    const firstLink = frame(page).locator('.lat-file-link').first();
    await expect(firstLink).toBeVisible();
    const tag = await firstLink.evaluate((el) => el.tagName);
    expect(tag).toBe('A');
    await shot(page, '断言: No.10/17/23 表格多行 + Filename 链接', {
      step: '选择 Market=JPN，等待文件列表加载',
      value: 'Market="JPN"',
      actual: '表格显示 6 行文件，Filename 为可点击链接样式',
    });
  });

  test('No.18/19 Used 列显示：被使用 TEMPLATE-EXAMPLE / 未使用 "-"', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    // 找 template_example 行的 Used 单元格（第 2 列，index 1）
    const tplRow = frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: 'template_example.odt' });
    await expect(tplRow.locator('td').nth(1)).toHaveText('TEMPLATE-EXAMPLE');
    // test.odt / guide.odt 的 Used = "-"
    const testRow = frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: 'test.odt' });
    await expect(testRow.locator('td').nth(1)).toHaveText('-');
    const guideRow = frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: 'guide.odt' });
    await expect(guideRow.locator('td').nth(1)).toHaveText('-');
    await shot(page, '断言: No.18/19 Used 列', {
      step: '选择 JPN，检查 Used 列',
      value: 'template_example.odt / test.odt / guide.odt',
      actual: 'template_example.odt Used=TEMPLATE-EXAMPLE；test/guide Used=-',
    });
  });

  test('No.21/41 Last Mod 显示为可读日期格式', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    const lastMod = await frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').first()
      .locator('td').nth(2).innerText();
    expect(lastMod).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    await shot(page, '断言: No.21/41 Last Mod 格式', {
      step: '选择 JPN，检查 Last Mod 列',
      value: '更新日: yyyy-MM-dd HH:mm:ss',
      actual: `Last Mod 显示可读日期格式：${lastMod}`,
    });
  });

  test('No.22/38/39/40 Size 列格式化：Bytes / KB / MB', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    const row = (name: string) => frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: name });
    await expect(row('small.odt').locator('td').nth(3)).toHaveText('500 Bytes'); // No.38
    await expect(row('kb.odt').locator('td').nth(3)).toHaveText('5.00 KB'); // No.39
    await expect(row('mb.odt').locator('td').nth(3)).toHaveText('1.00 MB'); // No.40
    await shot(page, '断言: No.22/38/39/40 Size 格式化', {
      step: '选择 JPN，检查 Size 列',
      value: 'small=500B, kb=5120B, mb=1MB',
      actual: 'Size 列显示 500 Bytes / 5.00 KB / 1.00 MB',
    });
  });

  test('No.42 Used 列无匹配显示 "-"', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'EU - Europe');
    // EU 有 eu_guide.odt（未匹配变量）→ Used=-
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(3, { timeout: 15000 });
    const guideRow = frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: 'eu_guide.odt' });
    await expect(guideRow.locator('td').nth(1)).toHaveText('-');
    await shot(page, '断言: No.42 Used 无匹配显示 -', {
      step: '选择 EU，检查 eu_guide.odt 的 Used 列',
      value: '无匹配变量',
      actual: 'Used 列显示 "-"',
    });
  });
});

// ============================================================================
// Test 4：Market 切换 / 清空（No.11,12）
// ============================================================================
test.describe('Market 切换/清空 (UD14)', () => {
  test('No.11 切换 JPN -> EU 清空旧数据并重载', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    // 切到 EU -> 重新加载 EU 的 3 个文件，JPN 数据被清空
    await selectMarket(page, 'EU - Europe');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(3, { timeout: 15000 });
    // EU 独有文件 eu_guide.odt 出现；JPN 独有文件（guide.odt）不再出现
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: 'eu_guide.odt' })).toHaveCount(1);
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row').filter({ hasText: 'guide.odt' }).filter({ hasNotText: 'eu' })).toHaveCount(0);
    await shot(page, '断言: No.11 切换 Market 重载', {
      step: 'SelectMarket 从 JPN 切换为 EU',
      value: 'JPN -> EU',
      actual: '旧列表被清空，重新加载 EU 的文件（eu_guide.odt 等）',
    });
  });

  test('No.12 切换 SelectMarket 为空 -> 表格清空', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    // 清空 SelectMarket（hover 显示 clear 图标后点击）
    await latMarketSelect(page).hover();
    await frame(page).locator('.lat-select .ant-select-clear').first().click({ timeout: 5000 }).catch(() => {
      // fallback：若 clear 不可用，用 Escape 关闭下拉（仍需确保 value 清空）
    });
    // 表格被清空，未选 Market 时表格区隐藏
    await expect(frame(page).locator('.lat-table-section')).toHaveCount(0, { timeout: 10000 });
    await shot(page, '断言: No.12 清空 Market 表格清空', {
      step: '选择 JPN 后清空 SelectMarket',
      value: '選擇後切為空',
      actual: '文件列表被清空，表格不再显示',
    });
  });
});

// ============================================================================
// Test 5：空市场（No.13）+ 错误清除（No.32）
// ============================================================================
test.describe('空市场 / 错误清除 (UD14)', () => {
  test('No.13 空文件夹 Market -> "No templates found for the selected market."', async ({ page }) => {
    await gotoLat(page);
    // 选一个 uploads 下无对应文件夹的市场（如 JP 无文件）
    await selectMarket(page, 'JP - Japan');
    await expect(latMessage(page)).toHaveText('No templates found for the selected market.', { timeout: 15000 });
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(0);
    // No.30/错误红色：该消息为 error 类型（#ff4d4f）
    await expect(frame(page).locator('.lat-message-error')).toBeVisible();
    const color = await frame(page).locator('.lat-message-error').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.13 空市场 + 错误红色', {
      step: '选择无文件的 Market(JP)',
      value: 'Market="JP"（无文件）',
      actual: '显示 "No templates found for the selected market."（红色错误）',
    });
  });

  test('No.32 选择新 Market 清除旧错误消息', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JP - Japan');
    await expect(latMessage(page)).toHaveText('No templates found for the selected market.', { timeout: 15000 });
    // 选择有新文件的 JPN -> 错误清除，表格加载
    await selectMarket(page, 'JPN - Japan');
    await expect(latMessage(page)).toHaveCount(0, { timeout: 10000 });
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    await shot(page, '断言: No.32 新 Market 清除旧错误', {
      step: 'JP（空）触发错误后切换到 JPN',
      value: 'JP -> JPN',
      actual: '旧错误消息被清除，表格正常加载 JPN 文件',
    });
  });
});

// ============================================================================
// Test 6：下载（No.24）
// ============================================================================
test.describe('文件下载 (UD14)', () => {
  test('No.24 点击文件名触发下载（调用 UD14downfile）', async ({ page }) => {
    await gotoLat(page);
    await selectMarket(page, 'JPN - Japan');
    await expect(frame(page).locator('.lat-table .ant-table-tbody .ant-table-row')).toHaveCount(6, { timeout: 15000 });
    const link = frame(page).locator('.lat-file-link').filter({ hasText: 'test.odt' });
    // 捕获下载接口响应（返回 200 即视为触发下载）
    const respPromise = page.waitForResponse(
      (r) => r.url().includes('/api/UD14downfile') && r.url().includes('test.odt') && r.status() === 200,
      { timeout: 15000 }
    );
    await link.click();
    const resp = await respPromise;
    expect(resp.status()).toBe(200);
    await shot(page, '断言: No.24 点击文件名下载', {
      step: '点击 test.odt 文件名链接',
      value: 'Market="JPN", Filename="test.odt"',
      actual: '调用 GET /api/UD14downfile（含 fileName=test.odt）返回 200，触发下载',
    });
  });
});

// ============================================================================
// Skip：依赖后端异常注入/并发/瞬时 loading/下载错误分支的用例
// No.5,8,9,14,15,16,20,25,26,28,29,31,33,34,35,36,37
// ============================================================================
test.skip('Skip: 依赖 mock/异常注入/并发/下载错误分支的用例（No.5,8,9,14,15,16,20,25,26,28,29,31,33,34,35,36,37）', async () => {
  expect(true).toBeTruthy();
});
