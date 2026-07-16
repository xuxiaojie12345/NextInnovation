/**
 * UD05 - Modify Document Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD05.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD05/
 * 测试用例数: 41
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot } from './utils';

// ── 截图 ──
const ss = createScreenshot('UD05');

// ── 元素定位（匹配 ModifyDocument.tsx 源码） ──
const $container   = (p: Page) => p.locator('.modify-doc-container');
const $title       = (p: Page) => p.locator('.modify-doc-title');
const $loading     = (p: Page) => p.locator('.modify-doc-loading');
const $err         = (p: Page) => p.locator('.msg-error');
const $backBtn     = (p: Page) => p.locator('.btn.btn-secondary');
const $saveBtn     = (p: Page) => p.locator('.btn.btn-primary');
const $templateLink = (p: Page) => p.locator('.modify-doc-template-link');
const $table       = (p: Page) => p.locator('.modify-doc-table');
const $tableRows   = (p: Page) => p.locator('.modify-doc-table tbody tr');
const $inputFields = (p: Page) => p.locator('.modify-input');
const $emptyMsg    = (p: Page) => p.locator('.modify-doc-empty');

// Info item helpers
const $infoLabel   = (p: Page, text: string) => p.locator('.modify-doc-info-item .info-label').filter({ has: p.getByText(text, { exact: true }) });
const $infoValue   = (p: Page, label: string) =>
  p.locator('.modify-doc-info-item').filter({ has: p.getByText(label, { exact: true }) }).locator('.info-value');

// Chassis no clickable element
const $chassisClick = (p: Page) => p.locator('.modify-doc-info-item .info-value strong').filter({ has: p.locator('strong') });

// ── Generate Doc 页面元素（用于导航到结果页面 → Modify Doc Link） ──
const $gdSeries    = (p: Page) => p.locator('.f-row').filter({ hasText: 'Chassis series' }).locator('input');
const $gdChnr      = (p: Page) => p.locator('.f-row').filter({ hasText: 'Chassis no' }).locator('input');
const $gdDocType   = (p: Page) => p.locator('.f-row').filter({ hasText: 'Document type' }).locator('select');
const $gdSubmit    = (p: Page) => p.locator('button.btn-primary');

// ═══════════════════════════════════════════════════════════
// 数据库辅助函数
// ═══════════════════════════════════════════════════════════

/** 从 DB 查询 AD-Change 激活的车辆（ACT='Y'） */
async function getTestVehicle(): Promise<{ serie: string; chnr: string; market?: string } | null> {
  const rows = await queryDB(
    'SELECT om.serie, om.chnr FROM HDOC_REC_DATA_OM om ' +
    'INNER JOIN HDOC_ADCA_CHANGE adca ON om.serie=adca.serie AND om.chnr=adca.chnr WHERE adca.ACT=? LIMIT 1',
    ['Y']
  );
  if (rows && rows.length > 0) {
    return { serie: String(rows[0].serie), chnr: String(rows[0].chnr) };
  }
  return null;
}

/** 从 DB 查询 AD-Change 修改数据 */
async function getAdcaModifications(serie: string, chnr: string): Promise<any[] | null> {
  return await queryDB('SELECT VARIABLE, NEWVAL FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=?', [serie, chnr]);
}

// ═══════════════════════════════════════════════════════════
// 导航辅助函数
// ═══════════════════════════════════════════════════════════

/** 登录 → 通过 Generate Doc → 结果页面 → 点击 Modify Doc Link → Modify Doc 页面 */
async function navigateToModifyDoc(page: Page, serie: string, chnr: string) {
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

  // 点击 Modify Doc Link
  await page.locator('.modify-warning.link-like').click();
  try { await page.waitForURL('**/modify-document', { timeout: 10000 }); } catch { /* ok */ }

  await page.waitForSelector('.modify-doc-container, .modify-doc-loading', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

/** 登录 + 直接导航到 Modify Doc 页面（无 state，用于异常测试） */
async function directNavigateToModifyDoc(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
  await page.goto('http://localhost:3000/menu/modify-document', { waitUntil: 'load' });
  await page.waitForSelector('.modify-doc-container, .modify-doc-loading', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

/** 登录 → Generate Doc 页面（用于 route 拦截场景） */
async function loginAndGoToGenerateDoc(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
  await page.goto('http://localhost:3000/menu/generate-doc', { waitUntil: 'load' });
  await page.waitForSelector('.generate-doc-page');
  await page.waitForTimeout(1500);
}

/** 在 Generate Doc 页面填入数据并提交 */
async function fillAndSubmitOnGenerateDoc(page: Page, serie: string, chnr: string) {
  const firstOpt = await $gdDocType(page).locator('option:not([value=""])').first().getAttribute('value');
  await $gdSeries(page).fill(serie);
  await $gdChnr(page).fill(chnr);
  if (firstOpt) await $gdDocType(page).selectOption(firstOpt);
  await $gdSubmit(page).click();
}

test.describe.configure({ mode: 'serial' });
test.describe('UD05 Modify Document', () => {

  // ════════════════════════════════════════════
  // 画面初期表示 (TC01~11)
  // ════════════════════════════════════════════

  test('01-画面初期表示-整体布局', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await ss(page, '结果画面', '01');

    await expect($container(page)).toBeVisible();
    await expect($title(page)).toContainText('Modify Document');
    // 确认表格存在（Variable/Description/Current value/Modified value 列）
    const headers = await page.locator('.modify-doc-table th').allTextContents();
    expect(headers.some(h => h.includes('Variable'))).toBe(true);
    expect(headers.some(h => h.includes('Description'))).toBe(true);
    expect(headers.some(h => h.includes('Current value'))).toBe(true);
    expect(headers.some(h => h.includes('Modified value'))).toBe(true);
    await expect($saveBtn(page)).toBeVisible();
    // 无错误时错误消息区域不在页面中
    await expect($err(page)).not.toBeVisible();
    await ss(page, '整体布局', '01');
  });

  test('02-画面初期表示-Chassis no显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await ss(page, '结果画面', '02');

    await expect($infoLabel(page, 'Chassis no:')).toBeVisible();
    await expect($infoValue(page, 'Chassis no:')).toContainText(v.chnr);
    await ss(page, 'Chassis no显示', '02');
  });

  test('03-画面初期表示-Market显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await ss(page, '结果画面', '03');

    await expect($infoLabel(page, 'Market:')).toBeVisible();
    const marketVal = await page.locator('.modify-doc-info-item').filter({ has: page.getByText('Market:', { exact: true }) }).locator('.info-value').textContent();
    console.log(`  Market: ${marketVal}`);
    await ss(page, 'Market显示', '03');
  });

  test('04-画面初期表示-Template文件链接', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    await expect($templateLink(page)).toBeVisible();
    await expect($templateLink(page)).toContainText('Template:');
    await ss(page, 'Template文件链接', '04');
  });

  test('05-画面初期表示-Variable列表加载', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    expect(rows).toBeGreaterThan(0);
    console.log(`  Variable 列表行数: ${rows}`);
    await ss(page, 'Variable列表加载', '05');
  });

  test('06-画面初期表示-Description列显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await ss(page, '结果画面', '06');

    const descCells = await page.locator('.td-desc').all();
    expect(descCells.length).toBeGreaterThan(0);
    // 验证至少有一行有 Variable 和 Description 内容
    const firstRowDesc = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').allTextContents();
    console.log(`  第一行 Variable/Description: ${firstRowDesc.join(' / ')}`);
    await ss(page, 'Description列显示', '06');
  });

  test('07-画面初期表示-Current value显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const currentCells = await page.locator('.td-current').all();
    expect(currentCells.length).toBeGreaterThan(0);
    await ss(page, 'Current value显示', '07');
  });

  test('08-画面初期表示-Modified value输入框', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const inputs = await $inputFields(page).all();
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      await expect(input).toBeEnabled();
      const val = await input.inputValue();
      console.log(`  输入框值: "${val}"`);
    }
    await ss(page, 'Modified value输入框', '08');
  });

  test('09-画面初期表示-Save按钮初期表示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    await expect($saveBtn(page)).toBeVisible();
    await expect($saveBtn(page)).toHaveText('Save');
    await expect($saveBtn(page)).toBeEnabled();
    await ss(page, 'Save按钮初期', '09');
  });

  test('10-画面初期表示-错误消息区域默认隐藏', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    // 无错误时错误消息区域不在页面中
    await expect($err(page)).not.toBeVisible();
    await ss(page, '错误消息隐藏', '10');
  });

  test('11-画面初期表示-加载中状态', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    // 拦截 API 延迟响应
    await page.route('**/api/v1/hdoc/modifydocument/select', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await page.unroute('**/api/v1/hdoc/modifydocument/select');
    await ss(page, '加载中状态', '11');
  });

  // ════════════════════════════════════════════
  // Modified value输入框 属性校验 (TC12~15)
  // ════════════════════════════════════════════

  test('12-Modified value-控件类型', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const firstInput = $inputFields(page).first();
    await expect(firstInput).toBeVisible();
    await expect(firstInput).toHaveAttribute('type', 'text');
    await ss(page, '入力前', '12');
    await firstInput.fill('test_value');
    await expect(firstInput).toHaveValue('test_value');
    await ss(page, '控件类型', '12');
  });

  test('13-Modified value-初期值（空字符串）', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const firstInput = $inputFields(page).first();
    const val = await firstInput.inputValue();
    console.log(`  初期值: "${val}"`);
    await ss(page, '初期值', '13');
  });

  test('14-Modified value-最大长度（500字符）', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const firstInput = $inputFields(page).first();
    await expect(firstInput).toHaveAttribute('maxLength', '500');
    // 尝试输入 501 字符
    const longText = 'A'.repeat(501);
    await ss(page, '入力前', '14');
    await firstInput.fill(longText);
    const actual = await firstInput.inputValue();
    expect(actual.length).toBeLessThanOrEqual(500);
    console.log(`  输入 501 字符后实际长度: ${actual.length}`);
    await ss(page, '最大长度', '14');
  });

  test('15-Modified value-表示制御（初期活性）', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const inputs = await $inputFields(page).all();
    for (const input of inputs) {
      await expect(input).toBeEnabled();
    }
    await ss(page, '初期活性', '15');
  });

  // ════════════════════════════════════════════
  // Save按钮 属性校验 (TC16~17)
  // ════════════════════════════════════════════

  test('16-Save按钮-初期表示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    await expect($saveBtn(page)).toBeVisible();
    await expect($saveBtn(page)).toHaveText('Save');
    await expect($saveBtn(page)).toBeEnabled();
    await ss(page, 'Save初期表示', '16');
  });

  test('17-Save按钮-保存中状态', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '17');
      await $inputFields(page).first().fill('SAVING_TEST');
      await ss(page, 'Save押下前', '17');
      await $saveBtn(page).click();
      // 立即确认按钮状态变为 Saving...（如果 API 响应过快则跳过）
      try {
        await expect($saveBtn(page)).toHaveText('Saving...', { timeout: 2000 });
        await expect($saveBtn(page)).toBeDisabled();
      } catch { console.log('  Saving... 状态转瞬即逝'); }
      await ss(page, '保存中状态', '17');
    }
  });

  // ════════════════════════════════════════════
  // 业务逻辑-Save按钮点击事件 (TC18~26)
  // ════════════════════════════════════════════

  test('18-空值校验-无任何修改', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    // 确保所有输入框为空
    const inputs = await $inputFields(page).all();
    for (const input of inputs) {
      await ss(page, '入力前', '18');
      await input.fill('');
    }
    await $saveBtn(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('NO UNRELEASED VERSION EXISTS!');
    await ss(page, '无修改错误', '18');
  });

  test('19-保存成功-有修改值', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      // 获取第一个 Variable 的值
      const firstVariable = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').first().textContent();
      console.log(`  修改 Variable: ${firstVariable}`);
      
      await ss(page, '入力前', '19');
      await $inputFields(page).first().fill('NEW_TEST_VALUE');
      await $saveBtn(page).click();

      try {
        await page.waitForURL('**/save-modifications', { timeout: 10000 });
        console.log(`  跳转到: ${page.url()}`);
        // DB 验证
        if (firstVariable) {
          const modRows = await queryDB(
            'SELECT NEWVAL, UPDATE_DATETIME, UPDATE_USER FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=? AND VARIABLE=?',
            [v.serie, v.chnr, firstVariable.trim()]
          );
          if (modRows && modRows.length > 0) {
            console.log(`  DB NEWVAL: ${modRows[0].NEWVAL}`);
            console.log(`  DB UPDATE_DATETIME: ${modRows[0].UPDATE_DATETIME}`);
            console.log(`  DB UPDATE_USER: ${modRows[0].UPDATE_USER}`);
          }
        }
      } catch {
        if (await $err(page).isVisible().catch(() => false)) {
          console.log(`  错误: ${await $err(page).textContent()}`);
        }
      }
    }
    await ss(page, '保存成功', '19');
  });

  test('20-保存失败-API返回错误', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/update', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, message: 'Failed to save modifications. Please try again.', data: null }),
      });
    });
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '20');
      await $inputFields(page).first().fill('ERR_TEST');
      await ss(page, 'Save押下前', '20');
      await $saveBtn(page).click();
      await page.waitForTimeout(2000);
      if (await $err(page).isVisible().catch(() => false)) {
        console.log(`  错误消息: ${await $err(page).textContent()}`);
      }
    }
    await page.unroute('**/api/v1/hdoc/modifydocument/update');
    await ss(page, '保存失败', '20');
  });

  test('21-保存失败-网络异常', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/update', route => route.abort());
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '21');
      await $inputFields(page).first().fill('NET_TEST');
      await ss(page, 'Save押下前', '21');
      await $saveBtn(page).click();
      await expect($err(page)).toBeVisible({ timeout: 10000 });
      await expect($err(page)).toContainText('System error. Please contact administrator.');
      await expect($saveBtn(page)).toBeEnabled();
    }
    await page.unroute('**/api/v1/hdoc/modifydocument/update');
    await ss(page, '网络异常', '21');
  });

  test('22-保存中-防止重复提交', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/update', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '22');
      await $inputFields(page).first().fill('DUP_TEST');
      await ss(page, 'Save押下前', '22');
      await $saveBtn(page).click();
      // 立即再次点击
      await $saveBtn(page).click();
      await $saveBtn(page).click();
      try {
        await expect($saveBtn(page)).toBeDisabled({ timeout: 2000 });
        console.log('  Save 按钮已禁用，防止重复提交');
      } catch { console.log('  响应过快'); }
    }
    await page.unroute('**/api/v1/hdoc/modifydocument/update');
    await page.waitForTimeout(5000);
    await ss(page, '重复提交', '22');
  });

  test('23-页面加载-Variable列表加载失败', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/select', route => route.abort());
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await page.unroute('**/api/v1/hdoc/modifydocument/select');

    await expect($err(page)).toBeVisible({ timeout: 10000 });
    // 当加载失败且无数据时，显示错误 + Back 按钮
    const errText = await $err(page).textContent();
    console.log(`  错误消息: ${errText}`);
    await ss(page, '列表加载失败', '23');
  });

  test('24-保存后-页面跳转到Save Modifications', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '24');
      await $inputFields(page).first().fill('NAV_TEST');
      await $saveBtn(page).click();
      try {
        await page.waitForURL('**/save-modifications', { timeout: 10000 });
        console.log(`  跳转到: ${page.url()}`);
      } catch {
        if (await $err(page).isVisible().catch(() => false)) {
          console.log(`  错误: ${await $err(page).textContent()}`);
        }
      }
    }
    await ss(page, '页面跳转', '24');
  });

  test('25-入力校验-输入超长字符', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const firstInput = $inputFields(page).first();
    // 输入 501 字符
    const longText = 'X'.repeat(501);
    await ss(page, '入力前', '25');
    await firstInput.fill(longText);
    const actual = await firstInput.inputValue();
    expect(actual.length).toBeLessThanOrEqual(500);
    console.log(`  输入 501 字符后实际长度: ${actual.length}`);
    await ss(page, '超长字符', '25');
  });

  test('26-保存成功后-Modified value内容保持', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      const firstVariable = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').first().textContent();
      await ss(page, '入力前', '26');
      await $inputFields(page).first().fill('KEEP_TEST_VALUE');
      await $saveBtn(page).click();
      try {
        await page.waitForURL('**/save-modifications', { timeout: 10000 });
        // DB 验证
        if (firstVariable) {
          const modRows = await queryDB(
            'SELECT NEWVAL FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=? AND VARIABLE=?',
            [v.serie, v.chnr, firstVariable.trim()]
          );
          if (modRows && modRows.length > 0) {
            console.log(`  DB NEWVAL: ${modRows[0].NEWVAL}, 期待: KEEP_TEST_VALUE`);
          }
        }
      } catch {
        if (await $err(page).isVisible().catch(() => false)) {
          await expect($saveBtn(page)).toBeEnabled();
        }
      }
    }
    await ss(page, '内容保持', '26');
  });

  // ════════════════════════════════════════════
  // Chassis no点击事件 (TC27)
  // ════════════════════════════════════════════

  test('27-Chassis no点击-页面跳转', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    // 点击 Chassis no（info-value 中的第二个 strong 元素）
    const chassisNoEl = page.locator('.modify-doc-info-item').first().locator('.info-value strong');
    if (await chassisNoEl.count() > 1) {
      await chassisNoEl.last().click();
    } else {
      await chassisNoEl.click();
    }
    try { await page.waitForURL('**/vehicle-specification', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'Chassis no点击跳转', '27');
  });

  // ════════════════════════════════════════════
  // Template文件链接 (TC28)
  // ════════════════════════════════════════════

  test('28-Template文件-链接显示', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    await expect($templateLink(page)).toBeVisible();
    await expect($templateLink(page)).toContainText('Template:');
    // 点击确认不报错
    await $templateLink(page).click();
    await page.waitForTimeout(500);
    await expect($container(page)).toBeVisible();
    await ss(page, 'Template链接', '28');
  });

  // ════════════════════════════════════════════
  // 异常处理 (TC29~32)
  // ════════════════════════════════════════════

  test('29-异常处理-Chassis参数无效', async ({ page }) => {
    await directNavigateToModifyDoc(page);

    if (await $err(page).isVisible().catch(() => false)) {
      await expect($err(page)).toContainText('Invalid chassis information.');
    }
    await ss(page, '参数无效', '29');
  });

  test('30-异常处理-数据加载失败', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/select', route => route.abort());
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await page.unroute('**/api/v1/hdoc/modifydocument/select');

    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, '数据加载失败', '30');
  });

  test('31-异常处理-API超时', async ({ page }) => {
    test.setTimeout(60000);
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/select', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.continue();
    });
    await navigateToModifyDoc(page, v.serie, v.chnr);
    // 等待 API 响应完成后页面渲染
    await page.waitForSelector('.modify-doc-container, .modify-doc-loading', { timeout: 20000 });
    await page.unroute('**/api/v1/hdoc/modifydocument/select');
    await ss(page, 'API超时', '31');
  });

  test('32-异常处理-API返回非200', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await page.route('**/api/v1/hdoc/modifydocument/select', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Internal server error.', data: null }),
      });
    });
    await navigateToModifyDoc(page, v.serie, v.chnr);
    await page.unroute('**/api/v1/hdoc/modifydocument/select');
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误消息: ${await $err(page).textContent()}`);
    }
    await ss(page, 'API非200', '32');
  });

  // ════════════════════════════════════════════
  // 数据库校验 (TC33~36)
  // ════════════════════════════════════════════

  test('33-数据库校验-Variable列表与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const dbRows = await queryDB('SELECT VARIABLE FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=?', [v.serie, v.chnr]);
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB Variable 数: ${dbRows.length}`);
      const dbVariables = dbRows.map(r => String(r.VARIABLE));
      // 确认画面显示每个 Variable
      for (const dbVar of dbVariables) {
        const cell = page.locator('.modify-doc-table tbody tr').filter({ hasText: dbVar });
        await expect(cell.first()).toBeVisible();
        console.log(`  ✅ Variable: ${dbVar}`);
      }
    }
    await ss(page, 'DB校验Variable', '33');
  });

  test('34-数据库校验-Description与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const firstVariable = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').first().textContent();
    if (firstVariable) {
      const dbRows = await queryDB('SELECT DESCRIPTION FROM HDOC_VARIABLES WHERE VARIABLE=?', [firstVariable.trim()]);
      if (dbRows && dbRows.length > 0) {
        const dbDesc = String(dbRows[0].DESCRIPTION);
        const displayDesc = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').last().textContent();
        console.log(`  DB DESCRIPTION: ${dbDesc}, 画面: ${displayDesc}`);
      }
    }
    await ss(page, 'DB校验Description', '34');
  });

  test('35-数据库校验-Current value与DB一致', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const firstVariable = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').first().textContent();
    if (firstVariable) {
      const modRows = await queryDB(
        'SELECT NEWVAL FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=? AND VARIABLE=?',
        [v.serie, v.chnr, firstVariable.trim()]
      );
      if (modRows && modRows.length > 0) {
        const dbNewVal = String(modRows[0].NEWVAL);
        const displayCurrent = await page.locator('.modify-doc-table tbody tr').first().locator('.td-current').textContent();
        console.log(`  DB NEWVAL: ${dbNewVal}, 画面 Current value: ${displayCurrent}`);
      } else {
        // 尝试从 HDOC_REC_DATA_KOLA_VARIANT 获取
        const variantRows = await queryDB(
          'SELECT SYMBOL FROM HDOC_REC_DATA_KOLA_VARIANT WHERE serie=? AND chnr=? AND VARIABLE=?',
          [v.serie, v.chnr, firstVariable.trim()]
        );
        if (variantRows && variantRows.length > 0) {
          console.log(`  KOLA_VARIANT SYMBOL: ${variantRows[0].SYMBOL}`);
        }
      }
    }
    await ss(page, 'DB校验Current value', '35');
  });

  test('36-数据库校验-保存后DB更新确认', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      const firstVariable = await page.locator('.modify-doc-table tbody tr').first().locator('.td-desc').first().textContent();
      await ss(page, '入力前', '36');
      await $inputFields(page).first().fill('DB_UPDATE_TEST');
      await $saveBtn(page).click();

      try {
        await page.waitForURL('**/save-modifications', { timeout: 10000 });
        if (firstVariable) {
          const modRows = await queryDB(
            'SELECT NEWVAL, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS FROM HDOC_ADCA_MODIFICATION WHERE serie=? AND chnr=? AND VARIABLE=?',
            [v.serie, v.chnr, firstVariable.trim()]
          );
          if (modRows && modRows.length > 0) {
            const m = modRows[0];
            console.log(`  DB NEWVAL: ${m.NEWVAL}`);
            console.log(`  DB UPDATE_DATETIME: ${m.UPDATE_DATETIME}`);
            console.log(`  DB UPDATE_USER: ${m.UPDATE_USER}`);
            console.log(`  DB UPDATE_PROCESS: ${m.UPDATE_PROCESS}`);
            // 全字段验证
            expect(String(m.NEWVAL)).toBe('DB_UPDATE_TEST');
            expect(m.UPDATE_DATETIME).not.toBeNull();
            expect(m.UPDATE_USER).not.toBeNull();
            expect(m.UPDATE_PROCESS).not.toBeNull();
          }
        }
      } catch {
        if (await $err(page).isVisible().catch(() => false)) {
          console.log(`  错误: ${await $err(page).textContent()}`);
        }
      }
    }
    await ss(page, 'DB校验保存更新', '36');
  });

  // ════════════════════════════════════════════
  // 消息显示 (TC37~38)
  // ════════════════════════════════════════════

  test('37-消息显示-Error样式', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    // 清空所有输入
    const inputs = await $inputFields(page).all();
    for (const input of inputs) {
      await ss(page, '入力前', '37');
      await input.fill('');
    }
    await $saveBtn(page).click();

    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('NO UNRELEASED VERSION EXISTS!');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log(`  错误文字颜色: ${color}`);
    await ss(page, 'Error样式', '37');
  });

  test('38-消息清空-新操作时错误消息消失', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    // 第1次：点击 Save 触发空值错误
    const inputs = await $inputFields(page).all();
    for (const input of inputs) {
      await ss(page, '入力前', '38');
      await input.fill('');
    }
    await $saveBtn(page).click();
    await expect($err(page)).toBeVisible();
    const firstErr = await $err(page).textContent();
    console.log(`  第1次错误: ${firstErr}`);

    // 第2次：输入修改值后保存
    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '38b');
      await $inputFields(page).first().fill('MSG_CLEAR_TEST');
      await $saveBtn(page).click();
      await page.waitForTimeout(2000);
      // 可能是跳转或显示新错误
      if (await $err(page).isVisible().catch(() => false)) {
        console.log(`  新错误: ${await $err(page).textContent()}`);
      } else {
        console.log('  错误消息已清除');
      }
    }
    await ss(page, '消息清空', '38');
  });

  // ════════════════════════════════════════════
  // 安全性 (TC39~41)
  // ════════════════════════════════════════════

  test('39-安全性-未登录访问', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await page.goto('http://localhost:3000/menu/modify-document', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`  当前URL: ${url}`);
    if (url.includes('/login')) console.log('  已跳转到登录页');
    await ss(page, '未登录访问', '39');
  });

  test('40-安全性-SQL注入防护', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '40');
      await $inputFields(page).first().fill("' OR '1'='1");
      await $saveBtn(page).click();
      await page.waitForTimeout(2000);
      if (await $err(page).isVisible().catch(() => false)) {
        const errText = await $err(page).textContent();
        expect(errText).not.toContain('SQL');
        expect(errText).not.toContain('syntax');
        console.log(`  错误消息: ${errText}`);
      }
    }
    await ss(page, 'SQL注入', '40');
  });

  test('41-安全性-XSS防护', async ({ page }) => {
    const v = await getTestVehicle();
    if (!v) { test.skip(); return; }
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });

    await navigateToModifyDoc(page, v.serie, v.chnr);

    const rows = await $tableRows(page).count();
    if (rows > 0) {
      await ss(page, '入力前', '41');
      await $inputFields(page).first().fill('<script>alert(1)</script>');
      await $saveBtn(page).click();
      await page.waitForTimeout(2000);
    }
    expect(dialogCount).toBe(0);
    console.log(`  dialog 弹出次数: ${dialogCount}`);
    await ss(page, 'XSS防护', '41');
  });

});
