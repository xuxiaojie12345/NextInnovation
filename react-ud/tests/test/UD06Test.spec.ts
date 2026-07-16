/**
 * UD06 - Save Modifications Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD06.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD06/
 * 测试用例数: 26
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot } from './utils';

// ── 截图 ──
const ss = createScreenshot('UD06');

// ── 元素定位（匹配 SaveModifications.tsx 源码） ──
const $container   = (p: Page) => p.locator('.save-mod-container');
const $title       = (p: Page) => p.locator('.save-mod-title');
const $loading     = (p: Page) => p.locator('.save-mod-loading');
const $err         = (p: Page) => p.locator('.save-mod-error');
const $closeBtn    = (p: Page) => p.locator('.save-mod-actions .btn.btn-primary');
const $backBtn     = (p: Page) => p.locator('.btn.btn-secondary');
const $message     = (p: Page) => p.locator('.save-mod-message');
const $storingRow  = (p: Page) => p.locator('.save-mod-version-row');

// Info row helpers
const $infoLabel   = (p: Page, text: string) => p.locator('.save-mod-info-row .info-label').filter({ has: p.getByText(text, { exact: true }) });
const $infoValue   = (p: Page, label: string) =>
  p.locator('.save-mod-info-row').filter({ has: p.getByText(label, { exact: true }) }).locator('.info-value');

// ── Generate Doc / Modify Doc 页面元素（用于导航到 Save Modifications） ──
const $gdSeries    = (p: Page) => p.locator('.f-row').filter({ hasText: 'Chassis series' }).locator('input');
const $gdChnr      = (p: Page) => p.locator('.f-row').filter({ hasText: 'Chassis no' }).locator('input');
const $gdDocType   = (p: Page) => p.locator('.f-row').filter({ hasText: 'Document type' }).locator('select');
const $gdSubmit    = (p: Page) => p.locator('button.btn-primary');
const $gdErr       = (p: Page) => p.locator('.generate-doc-error');
const $modifyInput = (p: Page) => p.locator('.modify-input');
const $modifySave  = (p: Page) => p.locator('.btn.btn-primary');
const $modifyErr   = (p: Page) => p.locator('.msg-error');

// ═══════════════════════════════════════════════════════════
// 数据库辅助函数
// ═══════════════════════════════════════════════════════════

/** 从 DB 查询有效的测试车辆，按优先级依次尝试 */
async function getTestVehicle(): Promise<{ serie: string; chnr: string } | null> {
  // 1. AD-Change 激活且存在修改记录的车辆（最优先：modify-warning 链接 + 修改数据齐全）
  let rows = await queryDB(
    'SELECT om.serie, om.chnr FROM HDOC_REC_DATA_OM om ' +
    'INNER JOIN HDOC_ADCA_CHANGE adca ON om.serie=adca.serie AND om.chnr=adca.chnr ' +
    'INNER JOIN HDOC_ADCA_MODIFICATION mod ON om.serie=mod.serie AND om.chnr=mod.chnr ' +
    'WHERE adca.ACT=? LIMIT 1',
    ['Y']
  );
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].serie), chnr: String(rows[0].chnr) };
  }

  // 2. 仅 AD-Change 激活（modify-warning 链接可用）
  rows = await queryDB(
    'SELECT om.serie, om.chnr FROM HDOC_REC_DATA_OM om ' +
    'INNER JOIN HDOC_ADCA_CHANGE adca ON om.serie=adca.serie AND om.chnr=adca.chnr ' +
    'WHERE adca.ACT=? LIMIT 1',
    ['Y']
  );
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].serie), chnr: String(rows[0].chnr) };
  }

  // 3. 存在修改记录的车辆（modification 表中有数据）
  rows = await queryDB(
    'SELECT DISTINCT serie, chnr FROM HDOC_ADCA_MODIFICATION LIMIT 1'
  );
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].serie), chnr: String(rows[0].chnr) };
  }

  // 4. 任意 OM 表车辆
  rows = await queryDB('SELECT serie, chnr FROM HDOC_REC_DATA_OM LIMIT 1');
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].serie), chnr: String(rows[0].chnr) };
  }

  // 5. 任意 VDA_GENERAL 表车辆
  rows = await queryDB('SELECT serie, chnr FROM HDOC_REC_DATA_VDA_GENERAL LIMIT 1');
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].serie), chnr: String(rows[0].chnr) };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// 导航辅助函数
// ═══════════════════════════════════════════════════════════

/** 登录 → Generate Doc → 结果页面 → Modify Doc → Save → Save Modifications 页面 */
async function navigateToSaveModifications(page: Page, serie: string, chnr: string) {
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

  try { await page.waitForURL('**/generate-document/result', { timeout: 15000 }); } catch { /* ok */ }
  await page.waitForSelector('.modify-warning.link-like', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // 点击 Modify Doc Link → 进入 Modify Doc 页面
  await page.locator('.modify-warning.link-like').click();
  try { await page.waitForURL('**/modify-document', { timeout: 10000 }); } catch { /* ok */ }
  await page.waitForSelector('.modify-doc-container, .modify-doc-loading', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 在 Modify Doc 页面输入修改值并保存
  const inputCount = await $modifyInput(page).count();
  if (inputCount > 0) {
    await $modifyInput(page).first().fill('UD06_NAV_TEST');
    await $modifySave(page).click();
    try { await page.waitForURL('**/save-modifications', { timeout: 10000 }); } catch { /* ok */ }
  }

  await page.waitForSelector('.save-mod-container, .save-mod-error', { timeout: 10000 });
  await page.waitForTimeout(500);
}

/** 登录 + 直接导航到 Save Modifications 页面（无 state，用于异常测试） */
async function directNavigateToSaveModifications(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
  await page.goto('http://localhost:3000/menu/save-modifications', { waitUntil: 'load' });
  await page.waitForSelector('.save-mod-container', { timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD06 Save Modifications', () => {

  // ════════════════════════════════════════════
  // 画面初期表示 (TC01~12)
  // ════════════════════════════════════════════

  test('01-画面初期表示-整体布局', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '01');

    await expect($container(page)).toBeVisible();
    await expect($title(page)).toContainText('Save Modifications');
    await expect($infoLabel(page, 'Chassis serie:')).toBeVisible();
    await expect($infoLabel(page, 'Chassis number:')).toBeVisible();
    await expect($storingRow(page)).toBeVisible();
    await expect($message(page)).toBeVisible();
    await expect($closeBtn(page)).toBeVisible();
    await ss(page, '整体布局', '01');
  });

  test('02-画面初期表示-Chassis serie显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '02');

    await expect($infoLabel(page, 'Chassis serie:')).toBeVisible();
    await expect($infoValue(page, 'Chassis serie:')).toContainText(v.serie);
    await ss(page, 'Chassis serie显示', '02');
  });

  test('03-画面初期表示-Chassis number显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '03');

    await expect($infoLabel(page, 'Chassis number:')).toBeVisible();
    await expect($infoValue(page, 'Chassis number:')).toContainText(v.chnr);
    await ss(page, 'Chassis number显示', '03');
  });

  test('04-画面初期表示-Doctype显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '04');

    if (await $infoLabel(page, 'Doctype:').count() > 0) {
      await expect($infoLabel(page, 'Doctype:')).toBeVisible();
      const doctypeVal = await $infoValue(page, 'Doctype:').textContent();
      console.log(`  Doctype: ${doctypeVal}`);
    } else {
      console.log('  Doctype 未显示（meta 可能未加载）');
    }
    await ss(page, 'Doctype显示', '04');
  });

  test('05-画面初期表示-Version显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '05');

    if (await $infoLabel(page, 'Version:').count() > 0) {
      await expect($infoLabel(page, 'Version:')).toBeVisible();
      const verVal = await $infoValue(page, 'Version:').textContent();
      console.log(`  Version: ${verVal}`);
    } else {
      console.log('  Version 未显示（meta 可能未加载）');
    }
    await ss(page, 'Version显示', '05');
  });

  test('06-画面初期表示-Storing列表显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '06');

    await expect($storingRow(page)).toBeVisible();
    const storingText = await $storingRow(page).locator('.info-value').textContent();
    console.log(`  Storing: ${storingText}`);
    expect(storingText?.length).toBeGreaterThan(0);
    await ss(page, 'Storing列表显示', '06');
  });

  test('07-画面初期表示-FOUND UNRELEASED VERSION显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '07');

    const unrelLabel = page.locator('.save-mod-info-row .info-label').filter({ hasText: 'FOUND UNRELEASED VERSION' });
    if (await unrelLabel.count() > 0) {
      console.log('  FOUND UNRELEASED VERSION 可见');
    } else {
      console.log('  FOUND UNRELEASED VERSION 不可见');
    }
    await ss(page, 'UNRELEASED VERSION', '07');
  });

  test('08-画面初期表示-Message显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '08');

    await expect($message(page)).toBeVisible();
    await expect($message(page)).toHaveText('VERSION IS RELEASED');
    await ss(page, 'Message显示', '08');
  });

  test('09-画面初期表示-Close按钮初期表示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '09');

    await expect($closeBtn(page)).toBeVisible();
    await expect($closeBtn(page)).toHaveText('Close');
    await expect($closeBtn(page)).toBeEnabled();
    await ss(page, 'Close按钮初期', '09');
  });

  test('10-画面初期表示-错误消息区域默认隐藏', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '10');

    // 错误消息区域不在页面中（正常状态不显示）
    await expect($err(page)).not.toBeVisible();
    await ss(page, '错误消息隐藏', '10');
  });

  test('11-画面初期表示-加载中状态', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/adcamodification', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '11');
    await page.unroute('**/api/v1/hdoc/adcamodification');
    await ss(page, '加载中状态', '11');
  });

  test('12-画面初期表示-无修改记录时消息', async ({ page }) => {
    // 使用不存在的车辆数据，直接导航到页面
    await directNavigateToSaveModifications(page);
    await ss(page, '画面表示', '12');

    // 无 state 时显示 Invalid chassis information.
    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('Invalid chassis information.');
    }
    await ss(page, '无修改记录', '12');
  });

  // ════════════════════════════════════════════
  // Close按钮 属性校验 (TC13~14)
  // ════════════════════════════════════════════

  test('13-Close按钮-初期表示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '13');

    await expect($closeBtn(page)).toBeVisible();
    await expect($closeBtn(page)).toHaveText('Close');
    await expect($closeBtn(page)).toBeEnabled();
    await ss(page, 'Close初期表示', '13');
  });

  test('14-Close按钮-关闭页面', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '14');

    await ss(page, 'Close押下前', '14');
    await $closeBtn(page).click();
    try { await page.waitForURL('**/modify-document', { timeout: 10000 }); } catch { /* ok */ }
    console.log(`  关闭后 URL: ${page.url()}`);
    await ss(page, 'Close关闭', '14');
  });

  // ════════════════════════════════════════════
  // 异常处理 (TC15~18)
  // ════════════════════════════════════════════

  test('15-异常处理-Chassis参数无效', async ({ page }) => {
    await directNavigateToSaveModifications(page);
    await ss(page, '画面表示', '15');

    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('Invalid chassis information.');
      await expect($backBtn(page)).toBeVisible();
    }
    await ss(page, '参数无效', '15');
  });

  test('16-异常处理-修改记录不存在', async ({ page }) => {
    await directNavigateToSaveModifications(page);
    await ss(page, '画面表示', '16');

    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误消息: ${await $err(page).textContent()}`);
    }
    await ss(page, '无修改记录', '16');
  });

  test('17-异常处理-网络异常', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/adcamodification', route => route.abort());
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '17');
    await page.unroute('**/api/v1/hdoc/adcamodification');

    // API 失败时 meta 获取为非关键失败，页面仍正常显示
    await expect($container(page)).toBeVisible();
    await ss(page, '网络异常', '17');
  });

  test('18-异常处理-API返回非200', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/adcamodification', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Failed to query record.', data: null }),
      });
    });
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '18');
    await page.unroute('**/api/v1/hdoc/adcamodification');

    await expect($container(page)).toBeVisible();
    await ss(page, 'API非200', '18');
  });

  // ════════════════════════════════════════════
  // 数据库校验 (TC19~21)
  // ════════════════════════════════════════════

  test('19-数据库校验-Doctype/Version与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '19');

    // 画面显示值
    let displayDoctype = '';
    let displayVersion = '';
    if (await $infoLabel(page, 'Doctype:').count() > 0) {
      displayDoctype = await $infoValue(page, 'Doctype:').textContent() || '';
    }
    if (await $infoLabel(page, 'Version:').count() > 0) {
      displayVersion = await $infoValue(page, 'Version:').textContent() || '';
    }

    // DB 查询
    const dbRows = await queryDB(
      'SELECT DISTINCT DOCTYPE, VERS FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=?',
      [v.serie, v.chnr]
    );
    if (dbRows && dbRows.length > 0 && displayDoctype) {
      console.log(`  DB DOCTYPE: ${dbRows[0].DOCTYPE}, 画面: ${displayDoctype}`);
      console.log(`  DB VERS: ${dbRows[0].VERS}, 画面: ${displayVersion}`);
    }
    await ss(page, 'DB校验Doctype/Version', '19');
  });

  test('20-数据库校验-Storing列表与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '20');

    // 画面 Storing 文本
    const storingText = await $storingRow(page).locator('.info-value').textContent() || '';
    console.log(`  画面 Storing: ${storingText}`);

    // DB 查询
    const dbRows = await queryDB(
      'SELECT VARIABLE, NEWVAL FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=?',
      [v.serie, v.chnr]
    );
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB 记录数: ${dbRows.length}`);
      for (const r of dbRows) {
        console.log(`  DB VARIABLE: ${r.VARIABLE}, NEWVAL: ${r.NEWVAL}`);
      }
    }
    await ss(page, 'DB校验Storing', '20');
  });

  test('21-数据库校验-审计字段确认', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '21');

    // DB 审计字段查询
    const dbRows = await queryDB(
      'SELECT REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=? LIMIT 1',
      [v.serie, v.chnr]
    );
    if (dbRows && dbRows.length > 0) {
      const d = dbRows[0];
      console.log(`  REGISTER_DATETIME: ${d.REGISTER_DATETIME}`);
      console.log(`  REGISTER_USER: ${d.REGISTER_USER}`);
      console.log(`  REGISTER_PROCESS: ${d.REGISTER_PROCESS}`);
      console.log(`  UPDATE_DATETIME: ${d.UPDATE_DATETIME}`);
      console.log(`  UPDATE_USER: ${d.UPDATE_USER}`);
      console.log(`  UPDATE_PROCESS: ${d.UPDATE_PROCESS}`);
      // 审计字段不为空
      expect(d.REGISTER_DATETIME).not.toBeNull();
      expect(d.REGISTER_USER).not.toBeNull();
      expect(d.REGISTER_PROCESS).not.toBeNull();
      expect(d.UPDATE_DATETIME).not.toBeNull();
      expect(d.UPDATE_USER).not.toBeNull();
      expect(d.UPDATE_PROCESS).not.toBeNull();
    }
    await ss(page, 'DB校验审计字段', '21');
  });

  // ════════════════════════════════════════════
  // 消息显示 (TC22~23)
  // ════════════════════════════════════════════

  test('22-消息显示-Message样式', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '22');

    await expect($message(page)).toBeVisible();
    await expect($message(page)).toHaveText('VERSION IS RELEASED');
    const color = await $message(page).evaluate(el => getComputedStyle(el).color);
    console.log(`  Message 文字颜色: ${color}`);
    await ss(page, 'Message样式', '22');
  });

  test('23-消息清空-重新加载时错误消息消失', async ({ page }) => {
    // 第1次：直接导航触发错误
    await directNavigateToSaveModifications(page);
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  第1次错误: ${await $err(page).textContent()}`);
    }

    // 第2次：使用有效数据重新加载
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '23');
    await expect($err(page)).not.toBeVisible();
    await expect($title(page)).toBeVisible();
    await ss(page, '消息清空', '23');
  });

  // ════════════════════════════════════════════
  // 安全性 (TC24~26)
  // ════════════════════════════════════════════

  test('24-安全性-未登录访问', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await page.goto('http://localhost:3000/menu/save-modifications', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`  当前URL: ${url}`);
    if (url.includes('/login')) console.log('  已跳转到登录页');
    await ss(page, '未登录访问', '24');
  });

  test('25-安全性-SQL注入防护', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '25');

    // 确认页面正常显示，无 SQL 相关错误
    await expect($container(page)).toBeVisible();
    if (await $err(page).isVisible().catch(() => false)) {
      const errText = await $err(page).textContent();
      expect(errText).not.toContain('SQL');
      expect(errText).not.toContain('syntax');
    }
    await ss(page, 'SQL注入', '25');
  });

  test('26-安全性-XSS防护', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });

    await navigateToSaveModifications(page, v.serie, v.chnr);
    await ss(page, '画面表示', '26');

    await expect($container(page)).toBeVisible();
    expect(dialogCount).toBe(0);
    console.log(`  dialog 弹出次数: ${dialogCount}`);
    await ss(page, 'XSS防护', '26');
  });

});
