/**
 * Vehicle Specification 模块 (UD07) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/VehicleSpecification/VehicleSpecification_単体テスト仕様書.md
 * 对应前端：react-ud/src/VehicleSpecification/VehicleSpecification.tsx
 * 对应测试数据：tests/vehicleSpecification/vehicleSpecification_test_data.sql（需先执行）
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. React 后端已启动：http://localhost:8081（含 getVehicleSpecification 完整组装）
 * 3. 已执行 generateDocument_test_data.sql / modifyDocument_test_data.sql / vehicleSpecification_test_data.sql
 * 4. 登录用户 menuall（拥有 hdoc 权限）
 *
 * 【画面进入方式】
 * - VehicleSpecification 从 ModifyDocument 的 chassis no 链接进入（与 SaveModifications 一致，
 *   通过 React Router navigate + location.state 在右侧内容区 iframe 内跳转显示，不再新开窗口）。
 *   本测试走完整 Menu 链路，并在 ModifyDocument 点 chassis 链接后在 iframe 内等待画面出现。
 *
 * 【截图约定】
 * - 每个"动作/断言"会叠加临时信息栏（操作步骤/设定值/实际结果）再截图
 * - 格式：JPEG；存放目录：tests\vehicleSpecification\image
 * - 命名：VehicleSpecification01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端 + iframe 集成，请使用：
 *   npx playwright test tests/vehicleSpecification/vehicleSpecification.spec.ts --workers=1
 *
 * 【Skip】chassisNo 无效参数（2,3）、异常/404/500/网络（13,14,15）、Tooltip（16,17,18）、
 * 特殊数据（8 无 DPX、10 超8位、12 sNote 无记录、21 空 symbol）等默认 skip。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const MENU_ITEM_LABEL = 'Generate Doc';
const TEST_PASSWORD = 'Menu@123';
const CHASSIS_NO = '028321';

// ============================================================================
// 截图工具（叠加信息栏）
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  screenshotCounter += 1;
  const filename = `VehicleSpecification${String(screenshotCounter).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'vs-shot-info';
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
    await page.evaluate(() => { document.getElementById('vs-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助：iframe 内定位（主链路画面在 .menu-iframe）
// ============================================================================
function md(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function vsRowValue(scope: any, label: string) {
  return scope.locator('.vs-row').filter({ has: scope.locator('.vs-label', { hasText: new RegExp('^' + label + '$') }) }).locator('.vs-value');
}

const DOC_TYPE_DESC: Record<string, string> = { VIN_CERT: 'VIN Plate Certificate', HOMOLOG: 'Homologation Document', CONFORM: 'Certificate of Conformity' };

async function loginToMenu(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

/**
 * 完整 Menu 链路进入 ModifyDocument（在 iframe 内）。
 * 登录 -> GenerateHomologationDocument(028321) -> GenerateDocument -> Modify Doc -> ModifyDocument
 */
async function gotoModifyDocumentViaChain(page: Page) {
  await loginToMenu(page);
  await shot(page, '断言: 登录成功进入 Menu');
  const scope = md(page);
  await page.getByRole('button', { name: new RegExp(MENU_ITEM_LABEL) }).click();
  const iframe = page.locator('.menu-iframe');
  await expect(iframe).toHaveAttribute('src', /GenerateHomologationDocument/, { timeout: 10000 });
  await expect(scope.locator('.gh-header-title')).toBeVisible({ timeout: 15000 });
  await expect(scope.locator('.gh-select')).toBeEnabled({ timeout: 15000 });
  await scope.locator('input.gh-input').nth(0).fill('AAAAA');
  await scope.locator('input.gh-input').nth(1).fill(CHASSIS_NO);
  await scope.locator('.gh-select').click();
  await expect(scope.locator('.ant-select-dropdown')).toBeVisible({ timeout: 10000 });
  await scope.locator('.ant-select-item-option', { hasText: DOC_TYPE_DESC.VIN_CERT }).first().click();
  await scope.getByRole('button', { name: 'Submit' }).click();
  await expect(iframe).toHaveAttribute('src', /generate-document/, { timeout: 10000 });
  await expect(scope.locator('.gd-header-title')).toBeVisible({ timeout: 15000 });
  await expect(scope.locator('.gd-loading')).toHaveCount(0, { timeout: 15000 }).catch(() => {});
  await expect(scope.locator('.gd-link-modify')).toBeVisible({ timeout: 10000 });
  await scope.locator('.gd-link-modify').first().click();
  await expect(scope.locator('.md-header-title')).toBeVisible({ timeout: 15000 });
  await expect(scope.locator('.md-loading')).toHaveCount(0, { timeout: 15000 }).catch(() => {});
  await shot(page, '动作: 进入 Modify Document 画面（完整链路）');
}

// ============================================================================
// Test 1：完整链路 - 通过 ModifyDocument 的 chassis no 链接进入 VehicleSpecification
// 覆盖 No.1,4,5,6,7,9,11,19
// ============================================================================
test.describe('完整链路 - Vehicle Specification 数据展示 (028321)', () => {
  test('No.1,4,5,6,7,9,11,19 数据展示', async ({ page }) => {
    await gotoModifyDocumentViaChain(page);
    const scope = md(page);

    // 点击 chassis no 链接 -> navigate 在右侧 iframe 内显示 VehicleSpecification
    // （与 SaveModifications 一致，通过 React Router navigate + state 传递 chassisNo）
    await scope.locator('.md-info-row').filter({ has: scope.locator('.md-info-label', { hasText: /^chassis no$/ }) }).locator('.md-link').click();
    // 在 Menu 右侧 iframe 内等待 VehicleSpecification 画面出现（不再新开 popup）
    await expect(scope.locator('.vs-header-title')).toBeVisible({ timeout: 15000 });
    await expect(scope.locator('.vs-loading')).toHaveCount(0, { timeout: 15000 }).catch(() => {});

    // ---- No.1 chassisNo 参数正确（location.state 传递 chassisNo，画面接收） ----
    await shot(page, '动作: 通过 chassis 链接打开 Vehicle Specification 画面', {
      step: 'ModifyDocument 点击 chassis no 链接',
      value: 'chassisNo=028321（location.state 传递）',
      actual: '右侧内容区 iframe 内显示 /vda-vehicle-specification',
    });

    // ---- No.19 画面初始数据已加载（无错误、chassis no 显示） ----
    await expect(vsRowValue(scope, 'Chassis no')).toHaveText('028321');
    await expect(scope.locator('.vs-message-error')).toHaveCount(0);

    // ---- No.4 API 返回完整字段 ----
    await expect(vsRowValue(scope, 'Model')).toHaveText('MODEL-A');
    await expect(vsRowValue(scope, 'Built week')).toHaveText('202245');
    await expect(vsRowValue(scope, 'Product type')).toHaveText('VAN');
    await expect(vsRowValue(scope, 'VIN')).toHaveText('028321');
    await expect(vsRowValue(scope, 'Engine no')).toHaveText('DPX12345');
    await expect(vsRowValue(scope, 'Country of Operation')).toHaveText('DE');
    await expect(vsRowValue(scope, 'S-Note NO')).toHaveText('SN001');
    await expect(vsRowValue(scope, 'S-Note Desc')).toHaveText('Special customer adaptation');
    await shot(page, '断言: No.4 完整字段', {
      step: '读取车辆规格字段',
      value: 'model=MODEL-A, builtWeek=202245, productType=VAN, vin=028321, engineNo=DPX12345, country=DE, sNoteNo=SN001, sNoteDesc=Special customer adaptation',
      actual: '各字段正确绑定显示',
    });

    // ---- No.7 EngineNo 取 DPX 前缀（FAMILY_ID DPX12 -> SYMBOL DPX12345）----
    await expect(vsRowValue(scope, 'Engine no')).toHaveText('DPX12345');
    await shot(page, '断言: No.7 Engine no 取 DPX 前缀', {
      step: '读取 Engine no',
      value: 'FAMILY_ID=DPX12 -> SYMBOL=DPX12345',
      actual: 'Engine no=DPX12345',
    });

    // ---- No.5/6 多个 Symbol + sortKey 升序排序 ----
    const symbolItems = scope.locator('.vs-symbol-item');
    await expect(symbolItems).toHaveCount(3);
    const symbolTexts = await symbolItems.allTextContents();
    // sortKey 升序：DPXDPX12 < FG01A001 < FG02A002 -> DPX12345, SYMBOL1, SYMBOL2
    // (display 为 8 位，trim 后比较)
    const trimmed = symbolTexts.map((t) => t.replace(/\s+$/g, ''));
    expect(trimmed[0]).toBe('DPX12345');
    expect(trimmed[1]).toBe('SYMBOL1');
    expect(trimmed[2]).toBe('SYMBOL2');
    await shot(page, '断言: No.5/6 多个 Symbol 按 sortKey 升序', {
      step: '读取 SYMBOL_STR 符号列表',
      value: 'symbolList=[DPX12345, SYMBOL1, SYMBOL2]（sortKey 升序）',
      actual: '一行的图标按排序显示',
    });

    // ---- No.9 display 不足 8 位右补空格（左对齐）----
    // SYMBOL1 -> "SYMBOL1  "（补空格至 8 位），通过原始文本长度 >= 8 验证补空格
    const rawTexts = symbolTexts; // 含尾部空格
    // 找出 SYMBOL1 对应的项（还原后以 SYMBOL1 开头）
    const rawItem = rawTexts.find((t) => t.startsWith('SYMBOL1'));
    expect(rawItem).toBeTruthy();
    if (rawItem) {
      expect(rawItem.length).toBeGreaterThanOrEqual(8);
    }
    await shot(page, '断言: No.9 display 补空格至 8 位', {
      step: '检查 SYMBOL1 的 display 长度',
      value: 'display 不足 8 位右补空格',
      actual: 'SYMBOL1 显示为 8 位（含尾部空格），左对齐',
    });
  });
});

// ============================================================================
// Skip：无效参数/异常/特殊数据
// ============================================================================
test.describe('Skip（chassisNo 无效/异常/特殊数据）', () => {
  test.skip('No.2 chassisNo 参数为空（需 state 注入）', async () => {});
  test.skip('No.3 chassisNo 参数格式无效', async () => {});
  test.skip('No.8 无 DPX 记录（需特殊数据）', async () => {});
  test.skip('No.10 display 超 8 位截断（需 SYMBOL>8 位数据）', async () => {});
  test.skip('No.12 S-Note Desc 无对应记录（需特殊数据）', async () => {});
  test.skip('No.13 API 返回 404（需 mock）', async () => {});
  test.skip('No.14 API 返回 500（需 mock）', async () => {});
  test.skip('No.15 网络请求失败（需 mock）', async () => {});
  test.skip('No.16 鼠标悬停显示 Tooltip', async () => {});
  test.skip('No.17 鼠标移出隐藏 Tooltip', async () => {});
  test.skip('No.18 Tooltip 数据异常静默处理', async () => {});
  test.skip('No.20 部分字段缺失显示 -', async () => {});
  test.skip('No.21 symbolList 为空数组', async () => {});
  test.skip('No.22 错误消息样式（红色）', async () => {});
  test.skip('No.23 SYMBOL_STR 符号间距', async () => {});
});
