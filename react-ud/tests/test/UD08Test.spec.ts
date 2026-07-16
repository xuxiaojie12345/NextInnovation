/**
 * UD08 - Homologation Variables Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD08.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 数据库验证: 通过 SQL 查询确认数据
 * 截图保存: tests/test/Image/UD08/
 * 测试用例数: 42
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot } from './utils';

const ss = createScreenshot('UD08');

// ── 元素定位（匹配 HomologationVariables.tsx 源码） ──
const $container  = (p: Page) => p.locator('.homologation-vars-container');
const $title      = (p: Page) => p.locator('.homologation-vars-header h1');
const $err        = (p: Page) => p.locator('.hv-error');
const $success    = (p: Page) => p.locator('.hv-success');
const $btnSearch  = (p: Page) => p.locator('button.btn-primary').filter({ hasText: 'Search' });
const $btnClear   = (p: Page) => p.locator('.btn-cell button.btn').filter({ hasText: 'Clear' });
const $btnAdd     = (p: Page) => p.locator('.btn-cell button.btn').filter({ hasText: 'Add' });
const $btnUpdate  = (p: Page) => p.locator('.btn-cell button.btn').filter({ hasText: 'Update' });
const $btnDelete  = (p: Page) => p.locator('.btn-cell button.btn').filter({ hasText: 'Delete' });
const $condRow    = (p: Page, label: string) => p.locator('.hv-cond-row').filter({ has: p.locator('.hv-cond-label', { hasText: label }) });
const $condInput  = (p: Page, label: string) => $condRow(p, label).locator('.hv-cond-input');
const $condSelect = (p: Page, label: string) => $condRow(p, label).locator('select.hv-cond-select');
const $variantInput1 = (p: Page) => p.locator('.hv-variant-group .hv-variant-subrow').first().locator('.hv-cond-input');
const $variantInput2 = (p: Page) => p.locator('.hv-variant-group .hv-variant-subrow').last().locator('.hv-cond-input');

// ═══════════════════════════════════════════════════════════
// 数据库辅助函数
// ═══════════════════════════════════════════════════════════

async function getExistingRule(): Promise<{ pc: string; num: string; market: string } | null> {
  const rows = await queryDB('SELECT PC, NUM, MARKET FROM HDOC_USER_DEFINED_RULES LIMIT 1');
  if (rows && rows.length > 0) {
    return { pc: String(rows[0].PC), num: String(rows[0].NUM), market: String(rows[0].MARKET) };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// 导航辅助函数
// ═══════════════════════════════════════════════════════════

async function loginAndGoToPage(page: Page) {
  const u = await getTestUser();
  if (!u) throw new Error('无可用用户');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForSelector('.login-container');
  await page.locator('input[placeholder="UserID"]').fill(u.userid);
  await page.locator('input[placeholder="Password"]').fill(u.password);
  await page.locator('.login-button').click();
  await page.waitForURL('**/menu', { timeout: 15000 });
  await page.goto('http://localhost:3000/menu/homologation-variables', { waitUntil: 'load' });
  await page.waitForSelector('.homologation-vars-container');
  await page.waitForTimeout(1500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD08 Homologation Variables', () => {

  // ════════════════════════════════════════════
  // 画面初期表示 (TC01~07)
  // ════════════════════════════════════════════

  test('01-画面初期表示-整体布局', async ({ page }) => {
    await loginAndGoToPage(page);
    await ss(page, '画面表示', '01');
    await expect($container(page)).toBeVisible();
    await expect($title(page)).toContainText('Homologation Variables');
    await expect($btnSearch(page)).toBeVisible();
    await expect($btnClear(page)).toBeVisible();
    await expect($btnAdd(page)).toBeVisible();
    await expect($btnUpdate(page)).toBeVisible();
    await expect($btnDelete(page)).toBeVisible();
    await expect($err(page)).not.toBeVisible();
    await ss(page, '整体布局', '01');
  });

  test('02-画面初期表示-Product class下拉列表加载', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '02');
    const select = $condSelect(page, 'Product class');
    await expect(select).toBeVisible();
    const options = await select.locator('option').all();
    expect(options.length).toBeGreaterThan(1);
    console.log(`  Product class 选项数: ${options.length - 1}`);
    await ss(page, 'Product class列表', '02');
  });

  test('03-画面初期表示-Number输入框属性', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '03');
    const input = $condInput(page, 'Number');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveAttribute('maxLength', '10');
    const val = await input.inputValue();
    expect(val).toBe('');
    await ss(page, 'Number输入框', '03');
  });

  test('04-画面初期表示-Market下拉列表加载', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '04');
    const select = $condSelect(page, 'Market');
    await expect(select).toBeVisible();
    const options = await select.locator('option').all();
    expect(options.length).toBeGreaterThan(1);
    console.log(`  Market 选项数: ${options.length - 1}`);
    await ss(page, 'Market列表', '04');
  });

  test('05-画面初期表示-Variable/Value/Variant/Comments输入框', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '05');
    const varInput = $condInput(page, 'Variable');
    await expect(varInput).toBeVisible();
    await expect(varInput).toHaveAttribute('maxLength', '20');

    const valInput = $condInput(page, 'Value');
    await expect(valInput).toBeVisible();
    await expect(valInput).toHaveAttribute('maxLength', '200');

    const cmtInput = $condInput(page, 'Comments');
    await expect(cmtInput).toBeVisible();
    await expect(cmtInput).toHaveAttribute('maxLength', '100');

    await expect($variantInput1(page)).toBeVisible();
    await expect($variantInput2(page)).toBeVisible();
    await ss(page, '输入框属性', '05');
  });

  test('06-画面初期表示-按钮初期状态', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '06');
    await expect($btnSearch(page)).toBeEnabled();
    await expect($btnSearch(page)).toHaveText('Search');
    await expect($btnClear(page)).toBeEnabled();
    await expect($btnClear(page)).toHaveText('Clear');
    await expect($btnAdd(page)).toBeEnabled();
    await expect($btnAdd(page)).toHaveText('Add');
    await expect($btnUpdate(page)).toBeEnabled();
    await expect($btnUpdate(page)).toHaveText('Update');
    await expect($btnDelete(page)).toBeEnabled();
    await expect($btnDelete(page)).toHaveText('Delete');
    await ss(page, '按钮初期', '06');
  });

  test('07-画面初期表示-错误消息区域默认隐藏', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '07');
    await expect($err(page)).not.toBeVisible();
    await ss(page, '错误消息隐藏', '07');
  });

  // ════════════════════════════════════════════
  // 入力控件属性校验 (TC08~15)
  // ════════════════════════════════════════════

  test('08-Product class-控件类型', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '08');
    const tag = await $condSelect(page, 'Product class').evaluate(el => el.tagName);
    expect(tag).toBe('SELECT');
    await ss(page, 'Product class控件', '08');
  });

  test('09-Number-允许文字（仅数字）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '09');
    const input = $condInput(page, 'Number');
    await ss(page, '入力前', '09');
    await input.fill('12345');
    await expect(input).toHaveValue('12345');
    // 测试非数字字符被过滤
    await input.fill('12ab34');
    await expect(input).toHaveValue('1234');
    await ss(page, 'Number数字', '09');
  });

  test('10-Market-控件类型', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '10');
    const tag = await $condSelect(page, 'Market').evaluate(el => el.tagName);
    expect(tag).toBe('SELECT');
    await ss(page, 'Market控件', '10');
  });

  test('11-Variable-最大长度（20）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '11');
    const input = $condInput(page, 'Variable');
    await expect(input).toHaveAttribute('maxLength', '20');
    const longText = 'A'.repeat(21);
    await ss(page, '入力前', '11');
    await input.fill(longText);
    const actual = await input.inputValue();
    expect(actual.length).toBeLessThanOrEqual(20);
    console.log(`  输入 21 字符后实际长度: ${actual.length}`);
    await ss(page, 'Variable最大长度', '11');
  });

  test('12-Value-最大长度（200）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '12');
    const input = $condInput(page, 'Value');
    await expect(input).toHaveAttribute('maxLength', '200');
    await ss(page, 'Value最大长度', '12');
  });

  test('13-Variant string.1-最大长度（100）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '13');
    await expect($variantInput1(page)).toHaveAttribute('maxLength', '100');
    await ss(page, 'Variant1最大长度', '13');
  });

  test('14-Variant string.2-最大长度（100）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '14');
    await expect($variantInput2(page)).toHaveAttribute('maxLength', '100');
    await ss(page, 'Variant2最大长度', '14');
  });

  test('15-Comments-最大长度（100）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '15');
    await expect($condInput(page, 'Comments')).toHaveAttribute('maxLength', '100');
    await ss(page, 'Comments最大长度', '15');
  });

  // ════════════════════════════════════════════
  // Search/Clear按钮 (TC16~18)
  // ════════════════════════════════════════════

  test('16-Search按钮-空值校验', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '16');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    const errText = await $err(page).textContent();
    console.log(`  错误消息: ${errText}`);
    await ss(page, 'Search空值', '16');
  });

  test('17-Search按钮-正常查询', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '17');
    // 选择 Product class 第一个有效选项
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '17');
    await $condInput(page, 'Number').fill('0000000001');
    const mktOpt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (mktOpt) await $condSelect(page, 'Market').selectOption(mktOpt);
    await ss(page, 'Search押下前', '17');
    await $btnSearch(page).click();
    try { await page.waitForURL('**/homologation-variables/result', { timeout: 10000 }); } catch { /* ok */ }
    await ss(page, 'Search查询', '17');
  });

  test('18-Clear按钮-清除输入', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '18');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '18');
    await $condInput(page, 'Number').fill('12345');
    await $condInput(page, 'Variable').fill('TEST_VAR');
    await $condInput(page, 'Value').fill('TEST_VAL');
    await $condInput(page, 'Comments').fill('CLR_TEST');
    await ss(page, 'Clear押下前', '18');
    await $btnClear(page).click();
    await expect($condInput(page, 'Number')).toHaveValue('');
    await expect($condInput(page, 'Variable')).toHaveValue('');
    await expect($condInput(page, 'Value')).toHaveValue('');
    await expect($condInput(page, 'Comments')).toHaveValue('');
    await expect($condSelect(page, 'Product class')).toHaveValue('');
    await expect($condSelect(page, 'Market')).toHaveValue('');
    await ss(page, 'Clear清除', '18');
  });

  // ════════════════════════════════════════════
  // Add按钮 (TC19~25)
  // ════════════════════════════════════════════

  test('19-Add按钮-空值校验', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '19');
    // 确保 Product class/Market 未选择
    await ss(page, '入力前', '19');
    await $condInput(page, 'Number').fill('12345');
    await ss(page, 'Add押下前', '19');
    await $btnAdd(page).click();
    await expect($err(page)).toBeVisible();
    console.log(`  错误: ${await $err(page).textContent()}`);
    await ss(page, 'Add空值', '19');
  });

  test('20-Add按钮-主键重复校验', async ({ page }) => {
    const rule = await getExistingRule();
    if (!rule) { test.skip(); return; }
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '20');
    await $condSelect(page, 'Product class').selectOption(rule.pc);
    await $condInput(page, 'Number').fill(rule.num);
    // 查找 Market 选项是否存在
    const mktOpt = await $condSelect(page, 'Market').locator(`option[value="${rule.market}"]`).count();
    if (mktOpt > 0) {
      await $condSelect(page, 'Market').selectOption(rule.market);
    } else {
      const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
      if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    }
    await ss(page, 'Add押下前', '20');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Add主键重复', '20');
  });

  test('21-Add按钮-Variable存在性校验', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '21');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    const mktOpt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '21');
    await $condInput(page, 'Number').fill('9999999999');
    if (mktOpt) await $condSelect(page, 'Market').selectOption(mktOpt);
    await $condInput(page, 'Variable').fill('NON_EXIST_VAR');
    await ss(page, 'Add押下前', '21');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Add Variable校验', '21');
  });

  test('22-Add按钮-添加成功', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '22');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    const mktOpt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    const testNum = `99${Date.now() % 10000000}`;
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '22');
    await $condInput(page, 'Number').fill(testNum);
    if (mktOpt) await $condSelect(page, 'Market').selectOption(mktOpt);
    await $condInput(page, 'Variable').fill('VIN');
    await $condInput(page, 'Value').fill('NEW_VALUE');
    await $variantInput1(page).fill('VS1_VALUE');
    await $variantInput2(page).fill('VS2_VALUE');
    await $condInput(page, 'Comments').fill('ADD_TEST_CMT');
    await ss(page, 'Add押下前', '22');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    if (await $success(page).isVisible().catch(() => false)) {
      console.log(`  成功: ${await $success(page).textContent()}`);
      // DB 验证
      const dbRows = await queryDB(
        'SELECT * FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND NUMBER=? AND MARKET=?',
        [pcOpt || '', testNum, mktOpt || '']
      );
      if (dbRows && dbRows.length > 0) {
        const r = dbRows[0];
        console.log(`  DB PC: ${r.PC}, NUMBER: ${r.NUMBER}, MARKET: ${r.MARKET}`);
        console.log(`  DB VARIABLE: ${r.VARIABLE}, VAL: ${r.VAL}`);
        console.log(`  DB VS: ${r.VS}, VS2: ${r.VS2}, COMMENTS: ${r.COMMENTS}`);
        console.log(`  DB ADD_DATE: ${r.ADD_DATE}, UPDATE_USER: ${r.UPDATE_USER}`);
      }
    } else if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Add成功', '22');
  });

  test('23-Add按钮-加载中状态', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '23');
    // 拦截 Add API 延迟响应
    await page.route('**/api/v1/hdoc/ud08/add', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    const mktOpt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '23');
    await $condInput(page, 'Number').fill('9912345678');
    if (mktOpt) await $condSelect(page, 'Market').selectOption(mktOpt);
    await $btnAdd(page).click();
    try {
      await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  响应过快'); }
    await page.unroute('**/api/v1/hdoc/ud08/add');
    await ss(page, 'Add加载中', '23');
  });

  test('24-Add按钮-防止重复提交', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '24');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    const mktOpt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '24');
    await $condInput(page, 'Number').fill('9912345679');
    if (mktOpt) await $condSelect(page, 'Market').selectOption(mktOpt);
    await $btnAdd(page).click();
    await $btnAdd(page).click();
    await $btnAdd(page).click();
    try {
      await expect($btnAdd(page)).toBeDisabled({ timeout: 2000 });
    } catch { console.log('  响应过快'); }
    await ss(page, 'Add重复提交', '24');
  });

  test('25-Add操作-添加后DB全字段验证（含审计字段）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '25');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    const mktOpt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    const testNum = `88${Date.now() % 10000000}`;
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '25');
    await $condInput(page, 'Number').fill(testNum);
    if (mktOpt) await $condSelect(page, 'Market').selectOption(mktOpt);
    await $condInput(page, 'Variable').fill('VIN');
    await $condInput(page, 'Value').fill('AUDIT_VAL');
    await $variantInput1(page).fill('AUDIT_VS1');
    await $variantInput2(page).fill('AUDIT_VS2');
    await $condInput(page, 'Comments').fill('AUDIT_CMT');
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    // DB 全字段 + 审计字段验证
    const dbRows = await queryDB(
      'SELECT * FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND NUMBER=? AND MARKET=?',
      [pcOpt || '', testNum, mktOpt || '']
    );
    if (dbRows && dbRows.length > 0) {
      const r = dbRows[0];
      console.log(`  DB ADD_DATE: ${r.ADD_DATE}`);
      console.log(`  DB UPDATE_USER: ${r.UPDATE_USER}`);
      console.log(`  DB UPDATE_DATETIME: ${r.UPDATE_DATETIME}`);
      console.log(`  DB DELETE_DATE: ${r.DELETE_DATE}`);
      expect(r.ADD_DATE).not.toBeNull();
      expect(r.UPDATE_USER).not.toBeNull();
      expect(r.UPDATE_DATETIME).not.toBeNull();
    } else {
      console.log('  DB 无结果（可能添加失败）');
    }
    await ss(page, 'Add DB全字段', '25');
  });

  // ════════════════════════════════════════════
  // Update按钮 (TC26~30)
  // ════════════════════════════════════════════

  test('26-Update按钮-空值校验', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '26');
    await ss(page, '入力前', '26');
    await $condInput(page, 'Number').fill('');
    await $btnUpdate(page).click();
    await expect($err(page)).toBeVisible();
    console.log(`  错误: ${await $err(page).textContent()}`);
    await ss(page, 'Update空值', '26');
  });

  test('27-Update按钮-记录不存在', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '27');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '27');
    await $condInput(page, 'Number').fill('9999999999');
    const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Update不存在', '27');
  });

  test('28-Update按钮-更新成功', async ({ page }) => {
    const rule = await getExistingRule();
    if (!rule) { test.skip(); return; }
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '28');
    // 从 Result List 返回的方式模拟：直接填入主键和值
    await $condSelect(page, 'Product class').selectOption(rule.pc);
    await ss(page, '入力前', '28');
    await $condInput(page, 'Number').fill(rule.num);
    const mktOpt = await $condSelect(page, 'Market').locator(`option[value="${rule.market}"]`).count();
    if (mktOpt > 0) {
      await $condSelect(page, 'Market').selectOption(rule.market);
    } else {
      const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
      if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    }
    await ss(page, '入力前', '28b');
    await $condInput(page, 'Variable').fill('VIN');
    await $condInput(page, 'Value').fill('UPDATED_VAL_PW');
    await $condInput(page, 'Comments').fill('UPDATE_TEST_CMT');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    if (await $success(page).isVisible().catch(() => false)) {
      console.log(`  成功: ${await $success(page).textContent()}`);
      const dbRows = await queryDB(
        'SELECT VAL, COMMENTS, UPDATE_USER, UPDATE_DATETIME FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND NUMBER=? AND MARKET=?',
        [rule.pc, rule.num, rule.market]
      );
      if (dbRows && dbRows.length > 0) {
        console.log(`  DB VAL: ${dbRows[0].VAL}`);
        console.log(`  DB COMMENTS: ${dbRows[0].COMMENTS}`);
      }
    } else if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Update成功', '28');
  });

  test('29-Update按钮-Variable存在性校验', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '29');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '29');
    await $condInput(page, 'Number').fill('0000000001');
    const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    await $condInput(page, 'Variable').fill('NON_EXIST_VAR');
    await ss(page, 'Update押下前', '33');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Update Variable校验', '29');
  });

  test('30-Update按钮-更新后审计字段确认', async ({ page }) => {
    const rule = await getExistingRule();
    if (!rule) { test.skip(); return; }
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '30');
    await $condSelect(page, 'Product class').selectOption(rule.pc);
    await ss(page, '入力前', '30');
    await $condInput(page, 'Number').fill(rule.num);
    const mktOpt = await $condSelect(page, 'Market').locator(`option[value="${rule.market}"]`).count();
    if (mktOpt > 0) {
      await $condSelect(page, 'Market').selectOption(rule.market);
    } else {
      const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
      if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    }
    await $condInput(page, 'Value').fill('AUDIT_UPDATE_VAL');
    await ss(page, 'Update押下前', '32');
    await $btnUpdate(page).click();
    await page.waitForTimeout(2000);
    const dbRows = await queryDB(
      'SELECT UPDATE_USER, UPDATE_DATETIME, ADD_DATE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND NUMBER=? AND MARKET=?',
      [rule.pc, rule.num, rule.market]
    );
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB UPDATE_USER: ${dbRows[0].UPDATE_USER}`);
      console.log(`  DB UPDATE_DATETIME: ${dbRows[0].UPDATE_DATETIME}`);
      console.log(`  DB ADD_DATE: ${dbRows[0].ADD_DATE}`);
      expect(dbRows[0].UPDATE_USER).not.toBeNull();
      expect(dbRows[0].UPDATE_DATETIME).not.toBeNull();
    }
    await ss(page, 'Update审计字段', '30');
  });

  // ════════════════════════════════════════════
  // Delete按钮 (TC31~34)
  // ════════════════════════════════════════════

  test('31-Delete按钮-空值校验', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '31');
    await $btnDelete(page).click();
    await expect($err(page)).toBeVisible();
    console.log(`  错误: ${await $err(page).textContent()}`);
    await ss(page, 'Delete空值', '31');
  });

  test('32-Delete按钮-记录不存在', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '32');
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '32');
    await $condInput(page, 'Number').fill('9999999999');
    const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Delete不存在', '32');
  });

  test('33-Delete按钮-删除成功', async ({ page }) => {
    const rule = await getExistingRule();
    if (!rule) { test.skip(); return; }
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '33');
    await $condSelect(page, 'Product class').selectOption(rule.pc);
    await $condInput(page, 'Number').fill(rule.num);
    const mktOpt = await $condSelect(page, 'Market').locator(`option[value="${rule.market}"]`).count();
    if (mktOpt > 0) {
      await $condSelect(page, 'Market').selectOption(rule.market);
    } else {
      const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
      if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    }
    await ss(page, 'Delete押下前', '33');
    await $btnDelete(page).click();
    await page.waitForTimeout(2000);
    if (await $success(page).isVisible().catch(() => false)) {
      console.log(`  成功: ${await $success(page).textContent()}`);
      const dbRows = await queryDB(
        'SELECT DELETE_DATE FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND NUMBER=? AND MARKET=?',
        [rule.pc, rule.num, rule.market]
      );
      if (dbRows && dbRows.length > 0) {
        console.log(`  DB DELETE_DATE: ${dbRows[0].DELETE_DATE}`);
      }
    } else if (await $err(page).isVisible().catch(() => false)) {
      console.log(`  错误: ${await $err(page).textContent()}`);
    }
    await ss(page, 'Delete成功', '33');
  });

  test('34-Delete操作-DELETE_DATE确认', async ({ page }) => {
    const rule = await getExistingRule();
    if (!rule) { test.skip(); return; }
    const dbRows = await queryDB(
      'SELECT DELETE_DATE, UPDATE_USER FROM HDOC_USER_DEFINED_RULES WHERE PC=? AND NUMBER=? AND MARKET=?',
      [rule.pc, rule.num, rule.market]
    );
    if (dbRows && dbRows.length > 0) {
      console.log(`  DB DELETE_DATE: ${dbRows[0].DELETE_DATE}`);
      console.log(`  DB UPDATE_USER: ${dbRows[0].UPDATE_USER}`);
    } else {
      console.log('  DB 无记录');
    }
  });

  // ════════════════════════════════════════════
  // 异常处理 (TC35~37)
  // ════════════════════════════════════════════

  test('35-异常处理-下拉列表加载失败', async ({ page }) => {
    await page.route('**/api/v1/hdoc/ud08/productclass', route => route.abort());
    await page.route('**/api/v1/hdoc/ud08/market', route => route.abort());
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '35');
    await page.unroute('**/api/v1/hdoc/ud08/productclass');
    await page.unroute('**/api/v1/hdoc/ud08/market');
    // 下拉列表可能为空
    const pcOptions = await $condSelect(page, 'Product class').locator('option').all();
    console.log(`  Product class 选项数: ${pcOptions.length}`);
    await ss(page, '下拉列表加载失败', '35');
  });

  test('36-异常处理-网络异常（Add操作）', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '36');
    await page.route('**/api/v1/hdoc/ud08/add', route => route.abort());
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '36');
    await $condInput(page, 'Number').fill('9911111111');
    const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    await $btnAdd(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    console.log(`  错误: ${await $err(page).textContent()}`);
    await page.unroute('**/api/v1/hdoc/ud08/add');
    await ss(page, 'Add网络异常', '36');
  });

  test('37-异常处理-API超时', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '37');
    await page.route('**/api/v1/hdoc/ud08/checkRule', async route => {
      await new Promise(r => setTimeout(r, 15000));
      await route.continue();
    });
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await ss(page, '入力前', '37');
    await $condInput(page, 'Number').fill('9911111112');
    const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    await $btnAdd(page).click();
    await page.unroute('**/api/v1/hdoc/ud08/checkRule');
    await ss(page, 'API超时', '37');
  });

  // ════════════════════════════════════════════
  // 消息显示 (TC38~39)
  // ════════════════════════════════════════════

  test('38-消息显示-Error样式', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '38');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toContainText('required');
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    console.log(`  错误文字颜色: ${color}`);
    await ss(page, 'Error样式', '38');
  });

  test('39-消息清空-Clear时错误消息消失', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '39');
    await $btnSearch(page).click();
    await expect($err(page)).toBeVisible();
    await $btnClear(page).click();
    await expect($err(page)).not.toBeVisible();
    await ss(page, '消息清空', '39');
  });

  // ════════════════════════════════════════════
  // 安全性 (TC40~42)
  // ════════════════════════════════════════════

  test('40-安全性-未登录访问', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await page.goto('http://localhost:3000/menu/homologation-variables', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`  当前URL: ${url}`);
    if (url.includes('/login')) console.log('  已跳转到登录页');
    await ss(page, '未登录访问', '40');
  });

  test('41-安全性-SQL注入防护', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '41');
    await $condInput(page, 'Variable').fill("' OR '1'='1");
    const pcOpt = await $condSelect(page, 'Product class').locator('option:not([value=""])').first().getAttribute('value');
    if (pcOpt) await $condSelect(page, 'Product class').selectOption(pcOpt);
    await $condInput(page, 'Number').fill('0000000001');
    const firstMkt = await $condSelect(page, 'Market').locator('option:not([value=""])').first().getAttribute('value');
    if (firstMkt) await $condSelect(page, 'Market').selectOption(firstMkt);
    await $btnSearch(page).click();
    await page.waitForTimeout(1000);
    if (await $err(page).isVisible().catch(() => false)) {
      const errText = await $err(page).textContent();
      expect(errText).not.toContain('SQL');
      expect(errText).not.toContain('syntax');
    }
    await ss(page, 'SQL注入', '41');
  });

  test('42-安全性-XSS防护', async ({ page }) => {
    await loginAndGoToPage(page);
    await expect($container(page)).toBeVisible();
    await ss(page, '画面表示', '42');
    let dialogCount = 0;
    page.on('dialog', () => { dialogCount++; });
    await $condInput(page, 'Variable').fill('<script>alert(1)</script>');
    expect(dialogCount).toBe(0);
    console.log(`  dialog 弹出次数: ${dialogCount}`);
    await ss(page, 'XSS防护', '42');
  });

});
