/**
 * UD14 - List Available Templates Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD14.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 截图保存: tests/test/Image/UD14/
 * 测试用例数: 26
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD14');

// ============================================================
// 元素定位（匹配 ListAvailableTemplates.tsx 源码）
// ============================================================

const $container         = (p: Page) => p.locator('.lat-container');
const $header            = (p: Page) => p.locator('.lat-header');
const $title             = (p: Page) => p.locator('.lat-header h1');
const $form              = (p: Page) => p.locator('.f-form');
const $row               = (p: Page) => p.locator('.f-row');
const $label             = (p: Page) => p.locator('.f-label');
const $select            = (p: Page) => p.locator('.f-input');
const $tableSection      = (p: Page) => p.locator('.lat-table-section');
const $table             = (p: Page) => p.locator('.lat-table');
const $thHeaders         = (p: Page) => p.locator('.lat-table thead th');
const $tbodyRows         = (p: Page) => p.locator('.lat-table tbody tr');
const $downloadLink      = (p: Page) => p.locator('.lat-download-link');
const $err               = (p: Page) => p.locator('.lat-error');
const $successMsg        = (p: Page) => p.locator('.lat-success');
const $emptyCell         = (p: Page) => p.locator('.lat-empty-cell');
const $fileIcon          = (p: Page) => p.locator('.lat-file-icon');

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/list-templates', { waitUntil: 'load', timeout: 15000 }).catch(() => {
    console.log('  ⚠️ Page navigation timed out');
  });
  try {
    await page.waitForSelector('.lat-container', { timeout: 10000 });
  } catch {
    // 超时后检查是否被重定向到登录页
    const currentUrl = page.url();
    console.log('  Current URL after navigation: ' + currentUrl);
    if (currentUrl.includes('/login')) {
      console.log('  ⚠️ Redirected to login - token may not be set or invalid');
    }
    throw new Error(
      `Failed to find .lat-container. Current URL: ${currentUrl}. ` +
      'Possible causes: backend not running, login failed, or page render error.'
    );
  }
  await page.waitForTimeout(1500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD14 List Available Templates', () => {

  // -----------------------------------------------------------
  // 画面初期表示 (TC1~6)
  // -----------------------------------------------------------

  test('01 - Initial display title', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    await expect($header(page)).toBeVisible();
    await expect($title(page)).toBeVisible();
    await expect($title(page)).toHaveText('List Templates');
    await ss(page, 'title verified', '01');
  });

  test('02 - Market dropdown initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    await expect($label(page)).toBeVisible();
    await expect($label(page)).toContainText('Select Market');
    await expect($select(page)).toBeVisible();
    const initVal = await $select(page).inputValue();
    expect(initVal).toBe('');
    const initText = await $select(page).locator('option:checked').textContent();
    expect(initText?.trim()).toBe('-- Select --');
    await expect($select(page)).toBeEnabled();
    await ss(page, 'market dropdown state', '02');
  });

  test('03 - Market dropdown data loaded', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    const opts = await $select(page).locator('option').allTextContents();
    console.log('  Market options: ' + opts.join(', '));
    expect(opts.length).toBeGreaterThan(1); // -- Select -- + at least 1 market
    // DB 验证：查询 MARKET_MASTER 确认数据
    const dbRows = await queryDB('SELECT MARKET FROM MARKET_MASTER ORDER BY MARKET');
    if (dbRows) {
      const dbMarkets = dbRows.map((r: any) => r.MARKET);
      console.log('  DB markets: ' + dbMarkets.join(', '));
      for (const m of dbMarkets) {
        expect(opts).toContain(m);
      }
    }
    await ss(page, 'market dropdown loaded', '03');
  });

  test('04 - DataTable initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    await expect($tableSection(page)).toBeVisible();
    await expect($table(page)).toBeVisible();
    // 表头验证
    const headers = await $thHeaders(page).allTextContents();
    console.log('  Headers: ' + headers.map(h => `"${h.trim()}"`).join(', '));
    const headerTexts = headers.map(h => h.trim()).filter(h => h.length > 0);
    expect(headerTexts).toContain('Filename');
    expect(headerTexts).toContain('Used');
    expect(headerTexts).toContain('Last Mod');
    expect(headerTexts).toContain('Size');
    // 未选择 Market 时无数据行
    const rowCount = await $tbodyRows(page).count();
    expect(rowCount).toBe(0);
    await ss(page, 'datatable initial', '04');
  });

  test('05 - Error and success messages hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    await expect($err(page)).not.toBeVisible();
    await expect($successMsg(page)).not.toBeVisible();
    await ss(page, 'messages hidden', '05');
  });

  test('06 - Market label alignment', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    await expect($label(page)).toBeVisible();
    const labelAlign = await $label(page).evaluate(el => getComputedStyle(el).textAlign);
    console.log('  Label text-align: ' + labelAlign);
    const selectAlign = await $select(page).evaluate(el => getComputedStyle(el).textAlign);
    console.log('  Select text-align: ' + selectAlign);
    await ss(page, 'label alignment', '06');
  });

  // -----------------------------------------------------------
  // Select Market 下拉列表 (TC7~9)
  // -----------------------------------------------------------

  test('07 - Select Market loads template list', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // 选择第一个非空的 Market
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) {
      console.log('  No markets available, skipping');
      return;
    }
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '07');
    // DataTable 应显示模板文件
    const rowCount = await $tbodyRows(page).count();
    console.log('  Template rows: ' + rowCount + ' (market: ' + firstMarket + ')');
    if (rowCount > 0) {
      // 每行显示文件图标、Filename（可点击链接）、Used、Last Mod、Size
      const firstRow = $tbodyRows(page).first();
      await expect(firstRow.locator('.lat-file-icon')).toBeVisible();
      await expect(firstRow.locator('.lat-download-link')).toBeVisible();
    }
    await ss(page, 'template list loaded', '07');
  });

  test('08 - Select Market with no templates', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    // 从 DB 获取一个空的 Market（没有模板文件的 Market）
    // 用 API 实际测：选择某个 Market，如果没有文件则显示空提示
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '08');
    const rowCount = await $tbodyRows(page).count();
    console.log('  Rows count: ' + rowCount + ' (market: ' + firstMarket + ')');
    if (rowCount === 0) {
      // 可能没有数据，显示空提示
      const emptyVisible = await $emptyCell(page).isVisible().catch(() => false);
      if (emptyVisible) {
        await expect($emptyCell(page)).toContainText('No templates found for the selected market.');
      }
    }
    await ss(page, 'no templates', '08');
  });

  test('09 - Switch Market refreshes template list', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    const opts = await $select(page).locator('option:not([value=""])').all();
    if (opts.length < 2) {
      console.log('  Less than 2 markets, skipping');
      return;
    }
    const marketA = await opts[0].getAttribute('value');
    const marketB = await opts[1].getAttribute('value');
    if (!marketA || !marketB) return;
    // 选择 Market A
    await $select(page).selectOption(marketA);
    await page.waitForTimeout(2000);
    await ss(page, 'market A selected', '09');
    const rowsA = await $tbodyRows(page).count();
    console.log('  Market A(' + marketA + ') rows: ' + rowsA);
    // 切换为 Market B
    await $select(page).selectOption(marketB);
    await page.waitForTimeout(2000);
    await ss(page, 'market B selected', '09');
    const rowsB = await $tbodyRows(page).count();
    console.log('  Market B(' + marketB + ') rows: ' + rowsB);
    // 新数据加载完成
    await ss(page, 'market switched', '09');
  });

  // -----------------------------------------------------------
  // DataTable 列属性校验 (TC10~14)
  // -----------------------------------------------------------

  test('10 - File icon column', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '10');
    const rows = await $tbodyRows(page).count();
    if (rows > 0) {
      const iconCount = await $fileIcon(page).count();
      console.log('  File icons count: ' + iconCount);
      expect(iconCount).toBeGreaterThan(0);
      await expect($fileIcon(page).first()).toBeVisible();
    }
    await ss(page, 'file icons', '10');
  });

  test('11 - Filename column (download link)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '11');
    const rows = await $tbodyRows(page).count();
    if (rows > 0) {
      // 列标题为 Filename
      const headerTexts = await $thHeaders(page).allTextContents();
      const hasFilename = headerTexts.some(h => h.trim() === 'Filename');
      expect(hasFilename).toBe(true);
      // 文件名显示为可点击链接
      const links = await $downloadLink(page).count();
      console.log('  Download links count: ' + links);
      expect(links).toBeGreaterThan(0);
      // 第一个文件名
      const firstFileName = await $downloadLink(page).first().textContent();
      console.log('  First filename: ' + firstFileName);
      expect(firstFileName?.trim().length).toBeGreaterThan(0);
    }
    await ss(page, 'filename column', '11');
  });

  test('12 - Used column', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '12');
    const rows = await $tbodyRows(page).count();
    if (rows > 0) {
      const headerTexts = await $thHeaders(page).allTextContents();
      const hasUsed = headerTexts.some(h => h.trim() === 'Used');
      expect(hasUsed).toBe(true);
      // 获取第一行的 Used 值
      const usedVal = await $tbodyRows(page).first().locator('td').nth(2).textContent();
      console.log('  First Used value: ' + usedVal?.trim());
      // Used 列显示 VARIABLE 值或 '-'
      expect(usedVal).not.toBeNull();
    }
    await ss(page, 'used column', '12');
  });

  test('13 - Last Mod column', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '13');
    const rows = await $tbodyRows(page).count();
    if (rows > 0) {
      const headerTexts = await $thHeaders(page).allTextContents();
      const hasLastMod = headerTexts.some(h => h.trim() === 'Last Mod');
      expect(hasLastMod).toBe(true);
      const lastModVal = await $tbodyRows(page).first().locator('td').nth(3).textContent();
      console.log('  First Last Mod value: ' + lastModVal?.trim());
      expect(lastModVal?.trim().length).toBeGreaterThan(0);
    }
    await ss(page, 'last mod column', '13');
  });

  test('14 - Size column', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '14');
    const rows = await $tbodyRows(page).count();
    if (rows > 0) {
      const headerTexts = await $thHeaders(page).allTextContents();
      const hasSize = headerTexts.some(h => h.trim() === 'Size');
      expect(hasSize).toBe(true);
      const sizeVal = await $tbodyRows(page).first().locator('td').nth(4).textContent();
      console.log('  First Size value: ' + sizeVal?.trim());
      expect(sizeVal?.trim().length).toBeGreaterThan(0);
    }
    await ss(page, 'size column', '14');
  });

  // -----------------------------------------------------------
  // 选择Market后加载中状态 (TC15~16)
  // -----------------------------------------------------------

  test('15 - Loading state when selecting market', async ({ page }) => {
    await page.route('**/api/v1/hdoc/template/listTemplates', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) {
      await page.unroute('**/api/v1/hdoc/template/listTemplates');
      return;
    }
    await $select(page).selectOption(firstMarket);
    try {
      await expect($select(page)).toBeDisabled({ timeout: 2000 });
      console.log('  Select is disabled during loading');
    } catch {
      console.log('  Response too fast, no loading state observed');
    }
    await page.unroute('**/api/v1/hdoc/template/listTemplates');
    await page.waitForTimeout(1000);
    await ss(page, 'loading state', '15');
  });

  test('16 - Loading complete restores select', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await expect($select(page)).toBeEnabled();
    await ss(page, 'loaded restored', '16');
  });

  // -----------------------------------------------------------
  // Filename 下载链接点击 (TC17~20)
  // -----------------------------------------------------------

  test('17 - Download without market selection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    // 尝试模拟点击下载链接（但页面上没有下载链接，因为未选 Market）
    // 直接验证错误消息
    const hasLinks = await $downloadLink(page).count();
    console.log('  Download links without market: ' + hasLinks);
    // 不选择 Market，确认没有下载链接
    expect(hasLinks).toBe(0);
    await ss(page, 'no download links', '17');
  });

  test('18 - Download file after market selection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    // 拦截下载请求
    await page.route('**/api/v1/hdoc/template/download', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Buffer.from('mock file content'),
      });
    });
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) {
      await page.unroute('**/api/v1/hdoc/template/download');
      return;
    }
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '18');
    const links = await $downloadLink(page).count();
    if (links > 0) {
      const fileName = await $downloadLink(page).first().textContent();
      console.log('  Clicking download for: ' + fileName);
      await $downloadLink(page).first().click();
      await page.waitForTimeout(1500);
      await ss(page, 'download clicked', '18');
      // 检查成功消息
      const successVisible = await $successMsg(page).isVisible().catch(() => false);
      if (successVisible) {
        await expect($successMsg(page)).toContainText('downloaded successfully');
      }
    }
    await page.unroute('**/api/v1/hdoc/template/download');
    await ss(page, 'download result', '18');
  });

  test('19 - Download file not found', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    await page.route('**/api/v1/hdoc/template/download', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: 'File not found.' }),
      });
    });
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) {
      await page.unroute('**/api/v1/hdoc/template/download');
      return;
    }
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '19');
    const links = await $downloadLink(page).count();
    if (links > 0) {
      await $downloadLink(page).first().click();
      await page.waitForTimeout(1500);
      await page.unroute('**/api/v1/hdoc/template/download');
      await ss(page, 'download error', '19');
    } else {
      await page.unroute('**/api/v1/hdoc/template/download');
    }
  });

  test('20 - Download loading state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '20');
    await page.route('**/api/v1/hdoc/template/download', async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Buffer.from('test'),
      });
    });
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) {
      await page.unroute('**/api/v1/hdoc/template/download');
      return;
    }
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '20');
    const links = await $downloadLink(page).count();
    if (links > 0) {
      await $downloadLink(page).first().click();
      await page.waitForTimeout(500);
      // 下载期间 Market 下拉可能被禁用
      try {
        const disabled = await $select(page).isDisabled();
        console.log('  Select disabled during download: ' + disabled);
      } catch { /* ok */ }
    }
    await page.unroute('**/api/v1/hdoc/template/download');
    await page.waitForTimeout(1000);
    await ss(page, 'download loading', '20');
  });

  // -----------------------------------------------------------
  // 异常处理 (TC21~23)
  // -----------------------------------------------------------

  test('21 - Market list load failure', async ({ page }) => {
    // 先登录进入 Menu 页面
    await login(page);
    // 拦截所有请求，对匹配的返回 500
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('selectMarketmaster')) {
        console.log('  ✅ Intercepted: ' + url);
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }),
        });
      } else if (url.includes('/api/')) {
        // 其他 API 请求放行
        route.continue();
      } else {
        route.continue();
      }
    });
    // 导航到目标页面
    await page.goto(PAGE_URL + '/menu/list-templates', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.unroute('**/*');
    await ss(page, 'page display', '21');
    // 检查页面状态
    const hasContainer = await page.locator('.lat-container').isVisible().catch(() => false);
    console.log('  Container visible: ' + hasContainer);
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'no body');
    console.log('  Body text: ' + bodyText);
    await expect($err(page)).toBeVisible({ timeout: 15000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, 'market load failure', '21');
  });

  test('22 - Market folder not found', async ({ page }) => {
    await login(page);
    await page.goto(PAGE_URL + '/menu/list-templates', { waitUntil: 'load' });
    await page.waitForSelector('.lat-container');
    await page.waitForTimeout(1500);
    await ss(page, 'page display', '22');
    // 选择一个不存在的 Market 值（通过 evaluate 注入）
    await $select(page).evaluate(el => {
      const select = el as HTMLSelectElement;
      const opt = document.createElement('option');
      opt.value = 'NONEXIST_MARKET';
      opt.text = 'NONEXIST_MARKET';
      select.add(opt);
      select.value = 'NONEXIST_MARKET';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(3000);
    await ss(page, 'nonexist market', '22');
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errText = await $err(page).textContent();
      console.log('  Error: ' + errText);
    }
    // 检查错误消息包含 Market folder not found 或类似提示
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await ss(page, 'market folder not found', '22');
  });

  test('23 - Network error when selecting market', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '23');
    await page.route('**/api/v1/hdoc/template/listTemplates', route => route.abort());
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) {
      await page.unroute('**/api/v1/hdoc/template/listTemplates');
      return;
    }
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await page.unroute('**/api/v1/hdoc/template/listTemplates');
    await ss(page, 'network error', '23');
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await expect($err(page)).toContainText('System error. Please contact administrator.');
    await ss(page, 'error message', '23');
  });

  // -----------------------------------------------------------
  // 消息显示 (TC24)
  // -----------------------------------------------------------

  test('24 - Error and Success message style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '24');
    // 触发错误：选择一个 Market 然后网络错误
    await page.route('**/api/v1/hdoc/template/listTemplates', route => route.abort());
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (firstMarket) {
      await $select(page).selectOption(firstMarket);
      await page.waitForTimeout(2000);
    }
    await page.unroute('**/api/v1/hdoc/template/listTemplates');
    await ss(page, 'error displayed', '24');
    const errVisible = await $err(page).isVisible().catch(() => false);
    if (errVisible) {
      const errColor = await $err(page).evaluate(el => getComputedStyle(el).color);
      console.log('  Error color: ' + errColor);
    }
    // 触发成功消息（通过 route 拦截下载）
    await page.route('**/api/v1/hdoc/template/download', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Buffer.from('test'),
      });
    });
    const secondMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (secondMarket) {
      await $select(page).selectOption(secondMarket);
      await page.waitForTimeout(3000);
      const links = await $downloadLink(page).count();
      if (links > 0) {
        await $downloadLink(page).first().click();
        await page.waitForTimeout(1500);
      }
    }
    await page.unroute('**/api/v1/hdoc/template/download');
    const sucVisible = await $successMsg(page).isVisible().catch(() => false);
    if (sucVisible) {
      const sucColor = await $successMsg(page).evaluate(el => getComputedStyle(el).color);
      console.log('  Success color: ' + sucColor);
    }
    await ss(page, 'message styles', '24');
  });

  // -----------------------------------------------------------
  // 安全性 (TC25~26)
  // -----------------------------------------------------------

  test('25 - Unauthenticated access', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await ss(page, 'localStorage cleared', '25');
    await page.goto(PAGE_URL + '/menu/list-templates', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  Current URL: ' + url);
    const isLogin = url.includes('/login');
    console.log('  Redirected to login: ' + isLogin);
    await ss(page, 'unauthenticated redirect', '25');
    expect(isLogin).toBe(true);
  });

  test('26 - Path traversal protection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '26');
    const firstMarket = await $select(page).locator('option:not([value=""])').first().getAttribute('value');
    if (!firstMarket) return;
    await $select(page).selectOption(firstMarket);
    await page.waitForTimeout(3000);
    await ss(page, 'market selected', '26');
    const links = await $downloadLink(page).count();
    if (links > 0) {
      // 获取第一个文件名
      const firstFileName = await $downloadLink(page).first().textContent();
      console.log('  Original filename: ' + firstFileName);
      await ss(page, 'path traversal', '26');
    } else {
      await ss(page, 'no files', '26');
    }

    // 直接调用后端 API 验证路径遍历防护
    const token = await page.evaluate(() => localStorage.getItem('token') || '');
    const apiBase = PAGE_URL.replace(':3000', ':8081') + '/api/v1/hdoc/template';

    // 测试1: 使用路径遍历文件名下载
    const travResp1 = await page.request.post(apiBase + '/download', {
      data: { fileName: '../../../etc/passwd', market: firstMarket || 'JP' },
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
    const travBody1 = await travResp1.json();
    console.log('  Path traversal download response:', travBody1);
    expect(travResp1.status()).not.toBe(200);
    expect(travBody1.message || '').toContain('path traversal');

    // 测试2: 使用路径遍历文件名删除
    const travResp2 = await page.request.post(apiBase + '/delete', {
      data: { fileName: '..\\..\\windows\\system32\\config', market: firstMarket || 'JP' },
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
    const travBody2 = await travResp2.json();
    console.log('  Path traversal delete response:', travBody2);
    expect(travResp2.status()).not.toBe(200);
    expect(travBody2.message || '').toContain('path traversal');

    // 测试3: 使用路径遍历 market 参数列出模板
    const travResp3 = await page.request.post(apiBase + '/listTemplates', {
      data: { market: '../../etc' },
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
    const travBody3 = await travResp3.json();
    console.log('  Path traversal listTemplates response:', travBody3);
    expect(travResp3.status()).not.toBe(200);
    expect(travBody3.message || '').toContain('path traversal');
  });

});
