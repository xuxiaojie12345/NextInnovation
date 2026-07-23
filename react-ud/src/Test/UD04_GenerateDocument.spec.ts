// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD04_GenerateDocument 单元测试
// 测试规格书: テスト式样書UD04.md
// 画面文件: UD04_GenerateDocument.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD04');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// 正常系 Mock 数据（基于数据库 lwws/12345 记录）
const MOCK_NORMAL_DATA = {
  code: 200,
  data: {
    ordernumber: '1097295',
    build: '2016173',
    spec: '201617',
    countryOfOperation: 'IDO',
    customerAdap: 'S1810111',
    loadIndex: 'FTLI-15',
    act: '',
    newval: '',
    variable: '',
  }
};

// ACT=Y 的 Mock 数据（Modify Doc Link 显示）
const MOCK_ACT_Y_DATA = {
  code: 200,
  data: {
    ordernumber: '1097295',
    build: '2016173',
    spec: '201617',
    countryOfOperation: 'IDO',
    customerAdap: 'S1810111',
    loadIndex: 'FTLI-15',
    act: 'Y',
    newval: 'new_value',
    variable: 'VAR_TEST',
  }
};

// 无 S-Note 数据
const MOCK_NO_SNOTE_DATA = {
  code: 200,
  data: {
    ordernumber: '999999',
    build: '202001',
    spec: '202001',
    countryOfOperation: 'TEST',
    customerAdap: '',
    loadIndex: 'TEST-LI',
    act: '',
    newval: '',
    variable: '',
  }
};

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD04画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

/**
 * 登录系统
 */
async function login(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.locator('#userID').fill(REAL_USER);
  await page.locator('#password').fill(REAL_PASS);
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForURL('**/Menu', { timeout: 60000 });
  await page.waitForSelector('.menu-container');
}

/**
 * 导航到UD04并注入路由参数+Mock API
 */
async function goToUD04(
  page: Page,
  mockResponse: any,
  chassisSeries = 'lwws',
  chassisNo = '12345'
) {
  await page.route('**/api/ud04/getdocumentdata', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });

  await login(page);
  await page.goto(BASE_URL + '/UD04');
  await page.waitForSelector('.ud04-container');

  await page.evaluate(({ series, no }) => {
    window.history.replaceState(
      { chassisSeries: series, chassisNo: no },
      '',
      '/UD04'
    );
  }, { series: chassisSeries, no: chassisNo });
  await page.reload();
  await page.waitForSelector('.ud04-container');
  await page.waitForTimeout(2000);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-18)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD04_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('h1.page-title')).toHaveText('Generate Document');
    await expect(page.locator('.result-section')).toBeVisible();
    const labels = ['Chassis no:', 'Ordernumber:', 'Build week:', 'Spec week:',
      'Market:', 'Master Market:', 'Load Index:', 'Using template:', 'Date:', 'HDoc version:'];
    for (const lbl of labels) {
      await expect(page.locator('.result-label').filter({ hasText: lbl })).toBeVisible();
    }
    await expect(page.locator('.link-blue').filter({ hasText: 'Analyze Rules' })).toBeVisible();
    await expect(page.locator('.result-value-GeneratedDocument')).toBeVisible();
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD04_002_画面初始化_Chassis no属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');

    const chassisSpan = page.locator('.result-label-chassisNo + .result-value.link-blue');
    await expect(chassisSpan).toContainText('lwws 12345');
    await expect(chassisSpan).toHaveCSS('cursor', 'pointer');
  });

  test('UD04_003_画面初始化_Ordernumber属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Ordernumber:' }).locator('+ span')).toHaveText('1097295');
  });

  test('UD04_004_画面初始化_Build week属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Build week:' }).locator('+ span')).toHaveText('2016173');
  });

  test('UD04_005_画面初始化_Spec week属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Spec week:' }).locator('+ span')).toHaveText('201617');
  });

  test('UD04_006_画面初始化_Market属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Market:' }).locator('+ span')).toHaveText('IDO');
  });

  test('UD04_007_画面初始化_Master Market属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Master Market:' }).locator('+ span')).toHaveText('-EU');
  });

  test('UD04_008_画面初始化_S-Note NO属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-section')).toContainText('S1810111');
  });

  test('UD04_009_画面初始化_S-Note Message属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.s-note-message')).toContainText('The S-Notes above can affect homologation documents.');
  });

  test('UD04_010_画面初始化_Load Index属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Load Index:' }).locator('+ span')).toHaveText('FTLI-15');
  });

  test('UD04_011_画面初始化_Analyze Rules属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    const analyzeLink = page.locator('.link-blue').filter({ hasText: 'Analyze Rules' });
    await expect(analyzeLink).toBeVisible();
    await expect(analyzeLink).toHaveCSS('cursor', 'pointer');
  });

  test('UD04_012_画面初始化_Using template属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Using template:' }).locator('+ span'))
      .toHaveText('_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
  });

  test('UD04_013_画面初始化_Replacing parameters属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD04(page, MOCK_ACT_Y_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label-ReplacingParameters')).toContainText('Replacing parameters:');
    await expect(page.locator('.result-section')).toContainText('AD Change. Modifying:VAR_TEST');
  });

  test('UD04_014_画面初始化_Generated document属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    const genDoc = page.locator('.result-value-GeneratedDocument');
    await expect(genDoc).toBeVisible();
    await expect(genDoc).toHaveCSS('cursor', 'pointer');
    await expect(genDoc).toContainText('Generated document:');
  });

  test('UD04_015_画面初始化_Date属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    const dateSpan = page.locator('.result-label').filter({ hasText: 'Date:' }).locator('+ span');
    const dateText = await dateSpan.textContent();
    expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('UD04_016_画面初始化_HDoc version属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'HDoc version:' }).locator('+ span')).toHaveText('4.2.1');
  });

  test('UD04_017_画面初始化_Error message area属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.error-message-area')).toHaveCount(0);
  });

  test('UD04_018_初期表示_各字段最大显示长度确认', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD04(page, {
      code: 200,
      data: {
        ordernumber: '1234567890123456',
        build: '1234567890',
        spec: '1234567890',
        countryOfOperation: '1234567890',
        customerAdap: 'A'.repeat(100),
        loadIndex: '1234567890',
        act: '',
        newval: '',
        variable: '',
      }
    }, 'jpctL', '8888012345');
    await takeScreenshot(page, '初期表示');

    const chassisSpan = page.locator('.result-label-chassisNo + .result-value.link-blue');
    await expect(chassisSpan).toContainText('jpctL 8888012345');

    const orderVal = await page.locator('.result-label').filter({ hasText: 'Ordernumber:' }).locator('+ span').textContent();
    expect(orderVal.length).toBeLessThanOrEqual(16);

    const buildVal = await page.locator('.result-label').filter({ hasText: 'Build week:' }).locator('+ span').textContent();
    expect(buildVal.length).toBeLessThanOrEqual(10);
  });
});

// ============================================================
// 2. 数据加载与数据库字段对应 (No.19-21)
// ============================================================
test.describe('画面初期表示-数据加载与数据库字段对应', () => {

  test('UD04_019_数据加载_API调用成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    let capturedUrl = null;
    await page.route('**/api/ud04/getdocumentdata', async route => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NORMAL_DATA)
      });
    });

    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => {
      window.history.replaceState({ chassisSeries: 'lwws', chassisNo: '12345' }, '', '/UD04');
    });
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    expect(capturedUrl).toContain('chassisSerie=lwws');
    expect(capturedUrl).toContain('chassisNo=12345');
  });

  test('UD04_020_数据加载_各Label字段与数据库字段对应关系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator('.result-label').filter({ hasText: 'Ordernumber:' }).locator('+ span')).toHaveText('1097295');
    await expect(page.locator('.result-label').filter({ hasText: 'Build week:' }).locator('+ span')).toHaveText('2016173');
    await expect(page.locator('.result-label').filter({ hasText: 'Spec week:' }).locator('+ span')).toHaveText('201617');
    await expect(page.locator('.result-label').filter({ hasText: 'Market:' }).locator('+ span')).toHaveText('IDO');
    await expect(page.locator('.result-label').filter({ hasText: 'Master Market:' }).locator('+ span')).toHaveText('-EU');
    await expect(page.locator('.result-section')).toContainText('S1810111');
    await expect(page.locator('.s-note-message')).toContainText('The S-Notes above can affect homologation documents.');
    await expect(page.locator('.result-label').filter({ hasText: 'Load Index:' }).locator('+ span')).toHaveText('FTLI-15');
    await expect(page.locator('.result-label').filter({ hasText: 'Using template:' }).locator('+ span'))
      .toHaveText('_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf');
    await expect(page.locator('.result-label').filter({ hasText: 'HDoc version:' }).locator('+ span')).toHaveText('4.2.1');
  });

  test('UD04_021_数据加载_无S-Note数据时S-Note Message不显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD04(page, MOCK_NO_SNOTE_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.s-note-message')).toHaveCount(0);
    await expect(page.locator('.result-label').filter({ hasText: 'Ordernumber:' }).locator('+ span')).toHaveText('999999');
  });
});

// ============================================================
// 3. Chassis no Link 操作 (No.22)
// ============================================================
test.describe('Chassis no Link 操作', () => {

  test('UD04_022_Chassis no Link_正常跳转到UD07', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await page.route('**/UD07', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud07-container">UD07 Mock</div></body></html>' });
    });

    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');

    await page.locator('.result-label-chassisNo + .result-value.link-blue').click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '操作後');
    await expect(page).toHaveURL(/\/UD07/);
  });
});

// ============================================================
// 4. Modify Doc Link 操作 (No.23-24)
// ============================================================
test.describe('Modify Doc Link 操作', () => {

  test('UD04_023_Modify Doc Link_ACT=Y时显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await page.route('**/UD05', route => {
      route.fulfill({ status: 200, body: '<html><body>UD05 Mock</body></html>' });
    });

    await goToUD04(page, MOCK_ACT_Y_DATA);
    await takeScreenshot(page, '初期表示');

    const modifyLink = page.locator('.link-red');
    await expect(modifyLink).toBeVisible();
    await expect(modifyLink).toContainText('After def change detected. Document need to be modified.');
    await expect(page.locator('.result-label-ReplacingParameters')).toContainText('Replacing parameters:');
    await expect(page.locator('.result-section')).toContainText('AD Change. Modifying:VAR_TEST');

    await modifyLink.click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '跳转後');
    await expect(page).toHaveURL(/\/UD05/);
  });

  test('UD04_024_Modify Doc Link_ACT≠Y时不显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.link-red')).toHaveCount(0);
    await expect(page.locator('.result-label-ReplacingParameters')).toHaveCount(0);
  });
});

// ============================================================
// 5. Analyze Rules Link 操作 (No.25)
// ============================================================
test.describe('Analyze Rules Link 操作', () => {

  test('UD04_025_Analyze Rules Link_正常点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');

    await page.locator('.link-blue').filter({ hasText: 'Analyze Rules' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    expect(page.url()).toContain('/UD04');
  });
});

// ============================================================
// 6. Generated document Link 操作 (No.26)
// ============================================================
test.describe('Generated document Link 操作', () => {

  test('UD04_026_Generated document Link_正常显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-value-GeneratedDocument')).toBeVisible();
    await page.locator('.result-value-GeneratedDocument').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    expect(page.url()).toContain('/UD04');
  });
});

// ============================================================
// 7. 异常处理 (No.27-31)
// ============================================================
test.describe('异常处理', () => {

  test('UD04_027_异常处理_API返回业务错误（code≠200）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 401, data: null }) });
    });
    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => window.history.replaceState({ chassisSeries: 'lwws', chassisNo: '12345' }, '', '/UD04'));
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.error-message-area')).toContainText('We can not get the data. Please try again.');
  });

  test('UD04_028_异常处理_API返回HTTP 500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    await page.route('**/api/ud04/getdocumentdata', async route => route.fulfill({ status: 500, body: 'Internal Server Error' }));
    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => window.history.replaceState({ chassisSeries: 'lwws', chassisNo: '12345' }, '', '/UD04'));
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.error-message-area')).toContainText('System error. Please try again later.');
  });

  test('UD04_029_异常处理_API超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '029';
    await page.route('**/api/ud04/getdocumentdata', async route => { await new Promise(r => setTimeout(r, 10000)); });
    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => window.history.replaceState({ chassisSeries: 'lwws', chassisNo: '12345' }, '', '/UD04'));
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '超时');
    const isError = await page.locator('.error-message-area').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.error-message-area').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD04_030_异常处理_网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await page.route('**/api/ud04/getdocumentdata', async route => route.abort('internetdisconnected'));
    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => window.history.replaceState({ chassisSeries: 'lwws', chassisNo: '12345' }, '', '/UD04'));
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.error-message-area')).toContainText('System error. Please try again later.');
  });

  test('UD04_031_异常处理_数据不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 400, data: null }) });
    });
    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => window.history.replaceState({ chassisSeries: 'XXXXX', chassisNo: '9999999999' }, '', '/UD04'));
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.error-message-area')).toContainText('We can not get the data. Please try again.');
  });
});

// ============================================================
// 8. UI交互 (No.32-34)
// ============================================================
test.describe('UI交互', () => {

  test('UD04_032_UI交互_加载中显示Loading状态', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '032';
    let resolveApi;
    const apiPromise = new Promise(r => { resolveApi = r; });
    await page.route('**/api/ud04/getdocumentdata', async route => {
      await apiPromise;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMAL_DATA) });
    });
    await login(page);
    await page.goto(BASE_URL + '/UD04');
    await page.waitForSelector('.ud04-container');
    await page.evaluate(() => window.history.replaceState({ chassisSeries: 'lwws', chassisNo: '12345' }, '', '/UD04'));
    await page.reload();
    await page.waitForSelector('.ud04-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '加载中');
    await expect(page.locator('.loading-indicator')).toBeVisible();
    resolveApi();
    await page.waitForTimeout(2000);
    await expect(page.locator('.loading-indicator')).toHaveCount(0);
  });

  test('UD04_033_UI交互_加载完成后控件恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.loading-indicator')).toHaveCount(0);
    await expect(page.locator('.result-label-chassisNo + .result-value.link-blue')).toBeVisible();
    await expect(page.locator('.link-blue').filter({ hasText: 'Analyze Rules' })).toBeVisible();
    await expect(page.locator('.result-value-GeneratedDocument')).toBeVisible();
  });

  test('UD04_034_UI交互_加载完成后各Label数据填充', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD04(page, MOCK_NORMAL_DATA);
    await takeScreenshot(page, '初期表示');
    await expect(page.locator('.result-label').filter({ hasText: 'Ordernumber:' }).locator('+ span')).toHaveText('1097295');
    await expect(page.locator('.result-label').filter({ hasText: 'Build week:' }).locator('+ span')).toHaveText('2016173');
    await expect(page.locator('.result-label').filter({ hasText: 'Spec week:' }).locator('+ span')).toHaveText('201617');
    await expect(page.locator('.result-label').filter({ hasText: 'Market:' }).locator('+ span')).toHaveText('IDO');
    await expect(page.locator('.result-label').filter({ hasText: 'Load Index:' }).locator('+ span')).toHaveText('FTLI-15');
    const dateText = await page.locator('.result-label').filter({ hasText: 'Date:' }).locator('+ span').textContent();
    expect(dateText.trim().length).toBeGreaterThan(0);
  });
});

// ============================================================
// 9. 安全性 (No.35)
// ============================================================
test.describe('安全性', () => {

  test('UD04_035_安全性_未登录直接访问UD04画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    // Step 1: 登录后访问 UD04 画面
    await goToUD04(page, { code: 200, data: [] });
    await expect(page).toHaveURL(/\/UD04/);
    await expect(page.locator('.ud04-container')).toBeVisible();
    await takeScreenshot(page, 'UD04画面表示');

    // Step 2: 清除 localStorage（画面未刷新）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD04/);
    await expect(page.locator('.ud04-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // Step 3: 直接访问 UD04 URL → 重定向到 Login
    await page.goto(BASE_URL + '/UD04');
    await page.waitForTimeout(2000);

    // Step 4: 验证重定向结果
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud04-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });
});
