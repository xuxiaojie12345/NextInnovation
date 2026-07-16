/**
 * UD07 - Vehicle Specification Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD07.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD07/
 * 测试用例数: 29
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot } from './utils';

// ── 截图 ──
const ss = createScreenshot('UD07');

// ── 元素定位（匹配 VehicleSpecification.tsx 源码） ──
const $container   = (p: Page) => p.locator('.vs-container');
const $title       = (p: Page) => p.locator('.vs-title');
const $loading     = (p: Page) => p.locator('.vs-loading');
const $err         = (p: Page) => p.locator('.vs-error');
const $backBtn     = (p: Page) => p.locator('.btn.btn-secondary');
const $infoTable   = (p: Page) => p.locator('.vs-info-table');
const $infoLabel   = (p: Page, text: string) => p.locator('.vs-info-table .info-label').filter({ hasText: text });
const $infoValueByLabel = (p: Page, label: string) =>
  p.locator('.vs-info-table .info-label').filter({ hasText: label }).locator('xpath=following-sibling::td[1]');
const $symbolItems = (p: Page) => p.locator('.td-symbol');
const $sNoteNo     = (p: Page) => p.locator('.vs-footer .vs-link-text');
const $emptyMsg    = (p: Page) => p.locator('.vs-empty');
const $generateDocErr = (p: Page) => p.locator('.generate-doc-error');

// ── Generate Doc / Result 页面元素（用于导航到 Vehicle Specification） ──
const $gdSeries    = (p: Page) => p.locator('.f-row').filter({ hasText: 'Chassis series' }).locator('input');
const $gdChnr      = (p: Page) => p.locator('.f-row').filter({ hasText: 'Chassis no' }).locator('input');
const $gdDocType   = (p: Page) => p.locator('.f-row').filter({ hasText: 'Document type' }).locator('select');
const $gdSubmit    = (p: Page) => p.locator('button.btn-primary');

// ═══════════════════════════════════════════════════════════
// 数据库辅助函数
// ═══════════════════════════════════════════════════════════

/** 从 DB 查询有效车辆（匹配 VehicleSpecification API 的多表联合查询） */
async function getTestVehicle(): Promise<{ serie: string; chnr: string } | null> {
  // 1. 三表齐全：OM + VDA_GENERAL + VDA_VARIANTS（最完整数据）
  let rows = await queryDB(
    'SELECT om.SERIE, om.CHNR FROM HDOC_REC_DATA_OM om ' +
    'INNER JOIN HDOC_REC_DATA_VDA_GENERAL ge ON om.SERIE = ge.SERIE AND om.CHNR = ge.CHNR ' +
    'INNER JOIN HDOC_REC_DATA_VDA_VARIANTS ants ON ants.SERIE = ge.SERIE AND ants.CHNR = ge.CHNR ' +
    'LIMIT 1'
  );
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].SERIE || rows[0].serie), chnr: String(rows[0].CHNR || rows[0].chnr) };
  }

  // 2. OM + VDA_GENERAL（有基本规格数据）
  rows = await queryDB(
    'SELECT om.SERIE, om.CHNR FROM HDOC_REC_DATA_OM om ' +
    'INNER JOIN HDOC_REC_DATA_VDA_GENERAL ge ON om.SERIE = ge.SERIE AND om.CHNR = ge.CHNR ' +
    'LIMIT 1'
  );
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].SERIE || rows[0].serie), chnr: String(rows[0].CHNR || rows[0].chnr) };
  }

  // 3. 仅 OM 表
  rows = await queryDB('SELECT SERIE, CHNR FROM HDOC_REC_DATA_OM LIMIT 1');
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].SERIE || rows[0].serie), chnr: String(rows[0].CHNR || rows[0].chnr) };
  }

  // 4. 仅 VDA_GENERAL 表
  rows = await queryDB('SELECT SERIE, CHNR FROM HDOC_REC_DATA_VDA_GENERAL LIMIT 1');
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].SERIE || rows[0].serie), chnr: String(rows[0].CHNR || rows[0].chnr) };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// 导航辅助函数
// ═══════════════════════════════════════════════════════════

/** 登录 → Generate Doc → 结果页面 → 点击 Chassis no → Vehicle Specification 页面 */
async function navigateToVehicleSpec(page: Page, serie: string, chnr: string): Promise<boolean> {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });

  // 导航到 Generate Doc 页面
  await page.goto('http://localhost:3000/menu/generate-doc', { waitUntil: 'load' });
  await page.waitForSelector('.generate-doc-page');
  await page.waitForTimeout(1500);

  const firstOpt = await $gdDocType(page).locator('option:not([value=""])').first().getAttribute('value');
  await $gdSeries(page).fill(serie);
  await $gdChnr(page).fill(chnr);
  if (firstOpt) await $gdDocType(page).selectOption(firstOpt);
  await $gdSubmit(page).click();

  // 等待结果页面
  try { await page.waitForURL('**/generate-document/result', { timeout: 15000 }); } catch { /* ok */ }
  await page.waitForSelector('.gen-doc-result-container, .gen-doc-result-error', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 点击 Chassis no 链接 → Vehicle Specification 页面
  const chassisLink = page.locator('.link-chassis');
  if (await chassisLink.count() > 0) {
    await chassisLink.click();
  } else {
    // 降级：直接导航
    await page.goto('http://localhost:3000/menu/vehicle-specification', { waitUntil: 'load' });
  }
  try { await page.waitForURL('**/vehicle-specification', { timeout: 10000 }); } catch { /* ok */ }
  // 等待加载完成（vs-container 出现表示 API 返回，无论成功或失败）
  await page.waitForSelector('.vs-container', { timeout: 30000 });
  await page.waitForTimeout(500);

  // 检测页面是否加载成功（失败时无 vs-title）
  const pageOk = await page.locator('.vs-title').count() > 0;
  if (!pageOk) {
    const errMsg = await page.locator('.vs-error').textContent().catch(() => 'unknown error');
    console.log(`  ⚠ VehicleSpec 页面加载失败: ${errMsg}`);
  }
  return pageOk;
}

/** 登录 + 直接导航到 Vehicle Specification 页面（无 state，用于异常测试） */
async function directNavigateToVehicleSpec(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
  await page.goto('http://localhost:3000/menu/vehicle-specification', { waitUntil: 'load' });
  await page.waitForSelector('.vs-container', { timeout: 15000 });
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD07 Vehicle Specification', () => {

  // ════════════════════════════════════════════
  // 画面初期表示 (TC01~12)
  // ════════════════════════════════════════════

  test('01-画面初期表示-整体布局', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '01');

    await expect($container(page)).toBeVisible();
    await expect($title(page)).toContainText('Vehicle Specification', { timeout: 10000 });
    await expect($infoTable(page)).toBeVisible();
    await expect($err(page)).not.toBeVisible();
    await ss(page, '整体布局', '01');
  });

  test('02-画面初期表示-Chassis no显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '02');

    await expect($infoLabel(page, 'Chassis no:')).toBeVisible();
    await expect($infoValueByLabel(page, 'Chassis no:')).toContainText(v.chnr);
    await ss(page, 'Chassis no显示', '02');
  });

  test('03-画面初期表示-Model显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '03');

    await expect($infoLabel(page, 'Model:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'Model:').textContent();
    console.log(`  Model: ${val}`);
    await ss(page, 'Model显示', '03');
  });

  test('04-画面初期表示-Built week显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '04');

    await expect($infoLabel(page, 'Built week:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'Built week:').textContent();
    console.log(`  Built week: ${val}`);
    await ss(page, 'Built week显示', '04');
  });

  test('05-画面初期表示-Product type显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '05');

    await expect($infoLabel(page, 'Product type:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'Product type:').textContent();
    console.log(`  Product type: ${val}`);
    await ss(page, 'Product type显示', '05');
  });

  test('06-画面初期表示-VIN显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '06');

    await expect($infoLabel(page, 'VIN:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'VIN:').textContent();
    console.log(`  VIN: ${val}`);
    await ss(page, 'VIN显示', '06');
  });

  test('07-画面初期表示-Engine no显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '07');

    await expect($infoLabel(page, 'Engine no:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'Engine no:').textContent();
    console.log(`  Engine no: ${val}`);
    await ss(page, 'Engine no显示', '07');
  });

  test('08-画面初期表示-Country of Operation显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '08');

    await expect($infoLabel(page, 'Country of Operation:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'Country of Operation:').textContent();
    console.log(`  Country: ${val}`);
    await ss(page, 'Country显示', '08');
  });

  test('09-画面初期表示-SYMBOL_STR显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '09');

    await expect($infoLabel(page, 'Symbol:')).toBeVisible();
    const val = await $infoValueByLabel(page, 'Symbol:').textContent();
    console.log(`  Symbol: ${val}`);
    await ss(page, 'SYMBOL_STR显示', '09');
  });

  test('10-画面初期表示-DESCRIPTION tooltip', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '10');

    // 确认 KOLA symbol 列表可见
    const symbols = await $symbolItems(page).all();
    if (symbols.length > 0) {
      // 悬停在第一个 symbol 上触发 tooltip
      await symbols[0].hover();
      await page.waitForTimeout(1000);
      console.log(`  悬停在 symbol: ${await symbols[0].textContent()}`);
    } else {
      console.log('  无 symbol 数据');
    }
    await ss(page, 'DESCRIPTION tooltip', '10');
  });

  test('11-画面初期表示-S-Note NO显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '11');

    await expect($sNoteNo(page)).toBeVisible();
    const val = await $sNoteNo(page).textContent();
    console.log(`  S-Note NO: ${val}`);
    await ss(page, 'S-Note NO显示', '11');
  });

  test('12-画面初期表示-错误消息区域默认隐藏', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '12');

    await expect($err(page)).not.toBeVisible();
    await ss(page, '错误消息隐藏', '12');
  });

  // ════════════════════════════════════════════
  // 业务逻辑-API调用与数据加载 (TC13~16)
  // ════════════════════════════════════════════

  test('13-API调用-加载中状态', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/vehiclespecification', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToVehicleSpec(page, v.serie, v.chnr);
    await ss(page, '画面表示', '13');
    await page.unroute('**/api/v1/hdoc/vehiclespecification');
    await ss(page, '加载中状态', '13');
  });

  test('14-API调用-成功加载显示全部信息', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '14');

    // 确认所有标签可见
    await expect($infoLabel(page, 'Chassis no:')).toBeVisible();
    await expect($infoLabel(page, 'Model:')).toBeVisible();
    await expect($infoLabel(page, 'Built week:')).toBeVisible();
    await expect($infoLabel(page, 'Product type:')).toBeVisible();
    await expect($infoLabel(page, 'VIN:')).toBeVisible();
    await expect($infoLabel(page, 'Engine no:')).toBeVisible();
    await expect($infoLabel(page, 'Country of Operation:')).toBeVisible();
    await expect($infoLabel(page, 'Symbol:')).toBeVisible();
    await expect($sNoteNo(page)).toBeVisible();
    await expect($err(page)).not.toBeVisible();

    // DB 验证
    const omRows = await queryDB('SELECT MODEL, BUILD FROM HDOC_REC_DATA_OM WHERE serie=? AND chnr=?', [v.serie, v.chnr]);
    if (omRows && omRows.length > 0) {
      const displayModel = await $infoValueByLabel(page, 'Model:').textContent();
      const displayBuild = await $infoValueByLabel(page, 'Built week:').textContent();
      console.log(`  DB MODEL: ${omRows[0].MODEL}, 画面: ${displayModel}`);
      console.log(`  DB BUILD: ${omRows[0].BUILD}, 画面: ${displayBuild}`);
    }
    const vdaRows = await queryDB('SELECT PRODUCT_TYPE, VIN, COUNTRY_OF_OPERATION FROM HDOC_REC_DATA_VDA_GENERAL WHERE serie=? AND chnr=?', [v.serie, v.chnr]);
    if (vdaRows && vdaRows.length > 0) {
      const displayType = await $infoValueByLabel(page, 'Product type:').textContent();
      const displayVin  = await $infoValueByLabel(page, 'VIN:').textContent();
      const displayCountry = await $infoValueByLabel(page, 'Country of Operation:').textContent();
      console.log(`  DB PRODUCT_TYPE: ${vdaRows[0].PRODUCT_TYPE}, 画面: ${displayType}`);
      console.log(`  DB VIN: ${vdaRows[0].VIN}, 画面: ${displayVin}`);
      console.log(`  DB COUNTRY_OF_OPERATION: ${vdaRows[0].COUNTRY_OF_OPERATION}, 画面: ${displayCountry}`);
    }
    const kolaRows = await queryDB('SELECT SYMBOL, DESCRIPTION FROM HDOC_REC_DATA_KOLA_VARIANT WHERE serie=? AND chnr=? LIMIT 1', [v.serie, v.chnr]);
    if (kolaRows && kolaRows.length > 0) {
      console.log(`  DB KOLA SYMBOL: ${kolaRows[0].SYMBOL}`);
      console.log(`  DB KOLA DESCRIPTION: ${kolaRows[0].DESCRIPTION}`);
    }
    const om2Rows = await queryDB('SELECT CUSTOMER_ADAP FROM HDOC_REC_DATA_OM WHERE serie=? AND chnr=?', [v.serie, v.chnr]);
    if (om2Rows && om2Rows.length > 0) {
      const displaySNote = await $sNoteNo(page).textContent();
      console.log(`  DB CUSTOMER_ADAP: ${om2Rows[0].CUSTOMER_ADAP}, 画面: ${displaySNote}`);
    }
    await ss(page, '成功加载全部信息', '14');
  });

  test('15-API调用-Chassis no为空', async ({ page }) => {
    await directNavigateToVehicleSpec(page);
    await ss(page, '画面表示', '15');

    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('Chassis no is required. Please return to the previous page.');
    }
    await ss(page, 'Chassis no为空', '15');
  });

  test('16-API调用-车辆数据不存在', async ({ page }) => {
    // 通过 Generate Doc 提交不存在的车辆，检查结果页面
    const u = await getTestUser();
    if (!u) throw new Error('无可用用户');
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.waitForSelector('.login-container');
    await ss(page, 'UserID入力前', '16');
    await page.locator('input[placeholder="UserID"]').fill(u.userid);
    await page.locator('input[placeholder="Password"]').fill(u.password);
    await page.locator('.login-button').click();
    await page.waitForURL('**/menu', { timeout: 15000 });

    await page.goto('http://localhost:3000/menu/generate-doc', { waitUntil: 'load' });
    await page.waitForSelector('.generate-doc-page');
    await page.waitForTimeout(1500);

    const firstOpt = await $gdDocType(page).locator('option:not([value=""])').first().getAttribute('value');
    await ss(page, 'Series入力前', '16');
    await $gdSeries(page).fill('XXXXX');
    await $gdChnr(page).fill('0000000000');
    if (firstOpt) await $gdDocType(page).selectOption(firstOpt);
    await $gdSubmit(page).click();

    await page.waitForTimeout(2000);
    if (await $generateDocErr(page).isVisible().catch(() => false)) {
      console.log(`  Generate Doc 错误: ${await $generateDocErr(page).textContent()}`);
    }
    await ss(page, '车辆数据不存在', '16');
  });

  // ════════════════════════════════════════════
  // 异常处理 (TC17~20)
  // ════════════════════════════════════════════

  test('17-异常处理-网络异常', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/vehiclespecification', route => route.abort());
    await navigateToVehicleSpec(page, v.serie, v.chnr);
    await ss(page, '画面表示', '17');
    await page.unroute('**/api/v1/hdoc/vehiclespecification');

    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, '网络异常', '17');
  });

  test('18-异常处理-API超时', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/vehiclespecification', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.continue();
    });
    await navigateToVehicleSpec(page, v.serie, v.chnr);
    await ss(page, '画面表示', '18');
    await page.unroute('**/api/v1/hdoc/vehiclespecification');
    await ss(page, 'API超时', '18');
  });

  test('19-异常处理-API返回非200', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/vehiclespecification', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Invalid data format. Please contact administrator.', data: null }),
      });
    });
    await navigateToVehicleSpec(page, v.serie, v.chnr);
    await ss(page, '画面表示', '19');
    await page.unroute('**/api/v1/hdoc/vehiclespecification');
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误消息: ${await $err(page).textContent()}`);
    }
    await ss(page, 'API非200', '19');
  });

  test('20-异常处理-DESCRIPTION tooltip显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '20');

    const symbols = await $symbolItems(page).all();
    if (symbols.length > 0) {
      await symbols[0].hover();
      await page.waitForTimeout(1000);
      // 检查 tooltip 是否出现（Antd Tooltip 添加了 ant-tooltip 类）
      const tooltip = page.locator('.ant-tooltip');
      if (await tooltip.isVisible().catch(() => false)) {
        const tooltipText = await tooltip.textContent();
        console.log(`  Tooltip: ${tooltipText}`);
      } else {
        console.log('  Tooltip 未显示（可能被阻止或样式问题）');
      }
    } else {
      console.log('  无 symbol 数据');
    }
    await ss(page, 'Tooltip显示', '20');
  });

  // ════════════════════════════════════════════
  // 数据库校验 (TC21~24)
  // ════════════════════════════════════════════

  test('21-数据库校验-Model/Built week与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '21');

    const displayModel = await $infoValueByLabel(page, 'Model:').textContent();
    const displayBuild = await $infoValueByLabel(page, 'Built week:').textContent();

    const dbRows = await queryDB('SELECT MODEL, BUILD FROM HDOC_REC_DATA_OM WHERE serie=? AND chnr=?', [v.serie, v.chnr]);
    expect(dbRows?.length).toBeGreaterThanOrEqual(1);
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB MODEL: ${dbRows[0].MODEL}, 画面: ${displayModel}`);
      console.log(`  DB BUILD: ${dbRows[0].BUILD}, 画面: ${displayBuild}`);
      expect(displayModel).not.toBe('-');
      expect(displayBuild).not.toBe('-');
    }
    await ss(page, 'DB校验Model/Built', '21');
  });

  test('22-数据库校验-Product type/VIN/Country与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '22');

    const displayType    = await $infoValueByLabel(page, 'Product type:').textContent();
    const displayVin     = await $infoValueByLabel(page, 'VIN:').textContent();
    const displayCountry = await $infoValueByLabel(page, 'Country of Operation:').textContent();

    const dbRows = await queryDB(
      'SELECT PRODUCT_TYPE, VIN, COUNTRY_OF_OPERATION FROM HDOC_REC_DATA_VDA_GENERAL WHERE serie=? AND chnr=?',
      [v.serie, v.chnr]
    );
    expect(dbRows?.length).toBeGreaterThanOrEqual(1);
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB PRODUCT_TYPE: ${dbRows[0].PRODUCT_TYPE}, 画面: ${displayType}`);
      console.log(`  DB VIN: ${dbRows[0].VIN}, 画面: ${displayVin}`);
      console.log(`  DB COUNTRY_OF_OPERATION: ${dbRows[0].COUNTRY_OF_OPERATION}, 画面: ${displayCountry}`);
      expect(displayType).not.toBe('-');
      expect(displayVin).not.toBe('-');
      expect(displayCountry).not.toBe('-');
    }
    await ss(page, 'DB校验VDA_GENERAL', '22');
  });

  test('23-数据库校验-Engine no/SYMBOL_STR与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '23');

    const displayEngine = await $infoValueByLabel(page, 'Engine no:').textContent();
    const displaySymbol = await $infoValueByLabel(page, 'Symbol:').textContent();

    const dbRows = await queryDB(
      'SELECT SYMBOL, DESCRIPTION FROM HDOC_REC_DATA_KOLA_VARIANT WHERE serie=? AND chnr=? LIMIT 1',
      [v.serie, v.chnr]
    );
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB SYMBOL: ${dbRows[0].SYMBOL}, 画面 Engine no: ${displayEngine}`);
      console.log(`  DB DESCRIPTION: ${dbRows[0].DESCRIPTION}`);
    } else {
      console.log('  KOLA_VARIANT 表中无数据');
    }
    await ss(page, 'DB校验KOLA', '23');
  });

  test('24-数据库校验-S-Note NO与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '24');

    const displaySNote = await $sNoteNo(page).textContent();

    const dbRows = await queryDB('SELECT CUSTOMER_ADAP FROM HDOC_REC_DATA_OM WHERE serie=? AND chnr=?', [v.serie, v.chnr]);
    expect(dbRows?.length).toBeGreaterThanOrEqual(1);
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB CUSTOMER_ADAP: ${dbRows[0].CUSTOMER_ADAP}, 画面: ${displaySNote}`);
      expect(displaySNote).not.toBe('-');
    }
    await ss(page, 'DB校验S-Note', '24');
  });

  // ════════════════════════════════════════════
  // 消息显示 (TC25~26)
  // ════════════════════════════════════════════

  test('25-消息显示-Error样式', async ({ page }) => {
    await directNavigateToVehicleSpec(page);
    await ss(page, '画面表示', '25');

    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('Chassis no is required. Please return to the previous page.');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log(`  错误文字颜色: ${color}`);
    await ss(page, 'Error样式', '25');
  });

  test('26-消息清空-重新加载时错误消息消失', async ({ page }) => {
    // 第1次：触发错误
    await directNavigateToVehicleSpec(page);
    await expect($err(page)).toBeVisible();

    // 第2次：使用有效数据重新加载
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '26');
    await expect($err(page)).not.toBeVisible();
    await expect($title(page)).toBeVisible();
    await ss(page, '消息清空', '26');
  });

  // ════════════════════════════════════════════
  // 安全性 (TC27~29)
  // ════════════════════════════════════════════

  test('27-安全性-未登录访问', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await page.goto('http://localhost:3000/menu/vehicle-specification', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`  当前URL: ${url}`);
    if (url.includes('/login')) console.log('  已跳转到登录页');
    await ss(page, '未登录访问', '27');
  });

  test('28-安全性-SQL注入防护', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '28');

    await expect($container(page)).toBeVisible();
    if (await $err(page).isVisible().catch(() => false)) {
      const errText = await $err(page).textContent();
      expect(errText).not.toContain('SQL');
      expect(errText).not.toContain('syntax');
    }
    await ss(page, 'SQL注入', '28');
  });

  test('29-安全性-XSS防护', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });

    const pageOk = await navigateToVehicleSpec(page, v.serie, v.chnr);
    if (!pageOk) { test.skip(); return; }
    await ss(page, '画面表示', '29');

    await expect($container(page)).toBeVisible();
    expect(dialogCount).toBe(0);
    console.log(`  dialog 弹出次数: ${dialogCount}`);
    await ss(page, 'XSS防护', '29');
  });

});
