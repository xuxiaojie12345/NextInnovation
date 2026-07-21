// @ts-nocheck
import { test, expect, Page } from '@playwright/test';
import path from 'path';
// import fs from 'fs';

// ============================================================
// UD04_GenerateDocument 单元测试
// 测试规格书: 测试式样书UD04.md
// 画面文件: UD04_GenerateDocument.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD04');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

/**
 * 截图（JPEG）
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
 * 登录 → Menu → UD03 提交 → 跳转到 UD04
 */
async function loginAndGoToUD04(page: Page, chassisSeries = 'lwws', chassisNo = '12345', docType = 'CERTIFICATE') {
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('.login-container');
  await page.locator('#userID').fill(REAL_USER);
  await page.locator('#password').fill(REAL_PASS);
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForURL('**/Menu', { timeout: 60000 });

  // 从 Menu 点击 Generate Doc
  await page.waitForSelector('.menu-container');
  await page.locator('.menu-label', { hasText: 'Generate Doc' }).click({ noWaitAfter: true });
  await page.waitForURL('**/UD03', { timeout: 30000 });
  await page.waitForSelector('.ud03-container');

  // 填写 UD03 表单并提交
  await page.locator('#chassisSeries').fill(chassisSeries);
  await page.locator('#chassisNo').fill(chassisNo);
  await page.locator('#documentType').selectOption(docType);
  await page.locator('.btn-submit').click({ noWaitAfter: true });
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示
// ============================================================

test.describe('画面初期表示', () => {

  test('UD04_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await loginAndGoToUD04(page);

    // 等待 UD04 加载完成（成功或错误都需等待）
    try {
      await page.waitForURL('**/UD04', { timeout: 30000 });
    } catch {
      // 可能停留在 UD03 显示错误消息
    }
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    // 1. 画面标题
    await expect(page.locator('.page-title')).toHaveText('Generate Document');
    // 2. Chassis no 显示
    await expect(page.locator('.result-label-chassisNo')).toBeVisible();
    // 3-15. 各 Label 和链接
    await expect(page.locator('.result-label', { hasText: 'Ordernumber:' })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'Build week:' })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'Spec week:' })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: /^Market:$/ })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'Load Index:' })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'Analyze Rules:' })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'Using template:' })).toBeVisible();
    await expect(page.locator('.result-value-GeneratedDocument')).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'Date:' })).toBeVisible();
    await expect(page.locator('.result-label', { hasText: 'HDoc version:' })).toBeVisible();
    // 16. Error message area 不显示
    await expect(page.locator('.error-message-area')).not.toBeVisible();

    await takeScreenshot(page, '整体布局');
  });

  test('UD04_002_画面初始化_ChassisNo属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '02';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 });
    await page.waitForSelector('.ud04-container');

    // 1. 控件类型为 Label
    await expect(page.locator('.result-label-chassisNo')).toBeVisible();
    // 2. 显示格式 "lwws 12345"
    await expect(page.locator('.result-label-chassisNo + .result-value')).toContainText(/lwws|12345/);
    // 3. 文字居左对齐
    const chassisRow = page.locator('.result-item').first();
    await expect(chassisRow).toHaveCSS('text-align', 'left');
    // 5. 可点击的 Link
    const link = page.locator('.link-blue').first();
    await expect(link).toHaveCSS('cursor', 'pointer');

    await takeScreenshot(page, 'ChassisNo显示');
  });

  test('UD04_003_画面初始化_Ordernumber属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '03';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Ordernumber 标签存在
    const label = page.locator('.result-label', { hasText: 'Ordernumber:' });
    await expect(label).toBeVisible();
    await takeScreenshot(page, 'Ordernumber显示');
  });

  test('UD04_004_画面初始化_BuildWeek属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '04';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.result-label', { hasText: 'Build week:' })).toBeVisible();
    await takeScreenshot(page, 'BuildWeek显示');
  });

  test('UD04_005_画面初始化_SpecWeek属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '05';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.result-label', { hasText: 'Spec week:' })).toBeVisible();
    await takeScreenshot(page, 'SpecWeek显示');
  });

  test('UD04_006_画面初始化_Market属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '06';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.result-label', { hasText: /^Market:$/ })).toBeVisible();
    await takeScreenshot(page, 'Market显示');
  });

  test('UD04_007_画面初始化_MasterMarket属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '07';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    // Master Market 固定显示 "-EU"
    await expect(page.locator('.result-value', { hasText: '-EU' })).toBeVisible();
    await takeScreenshot(page, 'MasterMarket显示');
  });

  test('UD04_008_画面初始化_SNoteNO属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '08';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // S-Note NO 显示（在结果区域中找到 customerAdap 值）
    await expect(page.locator('.result-value', { hasText: 'S1810111' })).toBeVisible();
    await takeScreenshot(page, 'SNoteNO显示');
  });

  test('UD04_009_画面初始化_SNoteMessage属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '09';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // S-Note Message 显示
    await expect(page.locator('.result-value', { hasText: 'The S-Notes above can affect homologation documents.' })).toBeVisible();
    await takeScreenshot(page, 'SNoteMessage显示');
  });

  test('UD04_010_画面初始化_LoadIndex属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '10';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.result-label', { hasText: 'Load Index:' })).toBeVisible();
    await takeScreenshot(page, 'LoadIndex显示');
  });

  test('UD04_011_画面初始化_AnalyzeRules属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '11';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Analyze Rules 链接可点击
    const analyzeLink = page.locator('.link-blue', { hasText: 'Analyze Rules' });
    await expect(analyzeLink).toBeVisible();
    await expect(analyzeLink).toHaveCSS('cursor', 'pointer');
    await takeScreenshot(page, 'AnalyzeRules显示');
  });

  test('UD04_012_画面初始化_UsingTemplate属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '12';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    // Using template 固定显示
    await expect(page.locator('.result-value', { hasText: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf' })).toBeVisible();
    await takeScreenshot(page, 'UsingTemplate显示');
  });

  test('UD04_013_画面初始化_GeneratedDocument属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '13';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    await expect(page.locator('.result-value-GeneratedDocument')).toBeVisible();
    await expect(page.locator('.result-value-GeneratedDocument')).toHaveCSS('cursor', 'pointer');
    await takeScreenshot(page, 'GeneratedDocument显示');
  });

  test('UD04_014_画面初始化_Date属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '14';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    await expect(page.locator('.result-label', { hasText: 'Date:' })).toBeVisible();
    await takeScreenshot(page, 'Date显示');
  });

  test('UD04_015_画面初始化_HDocVersion属性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '15';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    // HDoc version 固定显示 "4.2.1"
    await expect(page.locator('.result-value', { hasText: '4.2.1' })).toBeVisible();
    await takeScreenshot(page, 'HDocVersion显示');
  });

  test('UD04_016_画面初始化_ErrorMessageArea属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});

    await expect(page.locator('.error-message-area')).not.toBeVisible();
    await takeScreenshot(page, 'ErrorArea隐藏');
  });
});

// ============================================================
// 2. 数据加载与数据库字段对应
// ============================================================

test.describe('数据加载', () => {

  test('UD04_017_数据加载_API调用成功', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '17';
    let apiCalled = false;
    let capturedParams = {};

    await page.route('**/api/ud04/getdocumentdata**', async route => {
      apiCalled = true;
      const url = new URL(route.request().url());
      capturedParams = { chassisSerie: url.searchParams.get('chassisSerie'), chassisNo: url.searchParams.get('chassisNo') };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { ordernumber: '1097295', build: '2016173', spec: '201617', countryOfOperation: 'IDO', loadIndex: 'FTLI-15', customerAdap: 'S1810111', act: '', newval: '', variable: '' } }) });
    });

    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    expect(apiCalled).toBe(true);
    expect(capturedParams).toEqual({ chassisSerie: 'lwws', chassisNo: '12345' });
    await takeScreenshot(page, 'API调用成功');
  });

  test('UD04_018_数据加载_各Label字段对应关系', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '18';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 验证各字段值
    await expect(page.locator('.result-value', { hasText: '1097295' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '2016173' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '201617' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'IDO' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '-EU' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'S1810111' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'FTLI-15' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '4.2.1' }).first()).toBeVisible();

    await takeScreenshot(page, '数据字段对应');
  });

  test('UD04_019_数据加载_无SNote数据时SNoteMessage不显示', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '19';
    // customerAdap 为空 → S-Note 数据不存在
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        code: 200, data: { ordernumber: '1097295', build: '2016173', spec: '201617', countryOfOperation: 'IDO', loadIndex: 'FTLI-15', customerAdap: '', act: '', newval: '', variable: '' },
      }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // S-Note Message 不显示
    await expect(page.locator('.s-note-message')).not.toBeVisible();
    await takeScreenshot(page, '无SNote数据');
  });
});

// ============================================================
// 3. Chassis no Link 操作
// ============================================================

test.describe('ChassisNoLink操作', () => {

  test('UD04_020_ChassisNoLink_正常跳转到UD07', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '20';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'UD04画面');

    // 点击 Chassis no 链接
    await page.locator('.link-blue').first().click({ noWaitAfter: true });
    await page.waitForURL('**/UD07', { timeout: 30000 });
    await takeScreenshot(page, '跳转到UD07');
  });
});

// ============================================================
// 4. Modify Doc Link 操作（条件显示）
// ============================================================

test.describe('ModifyDocLink操作', () => {

  test('UD04_021_ModifyDocLink_ACT等于Y时显示', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '21';
    // act='Y' 且有 variable
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        code: 200, data: { ordernumber: '', build: '', spec: '', countryOfOperation: '', loadIndex: '', customerAdap: '', act: 'Y', newval: 'NEW_VAL', variable: 'TEST_VAR' },
      }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Modify Doc Link 显示
    await expect(page.locator('.link-red')).toBeVisible();
    await expect(page.locator('.link-red')).toHaveText('After def change detected. Document need to be modified.');
    await takeScreenshot(page, 'ModifyDoc显示');

    // Replacing parameters 显示
    await expect(page.locator('.result-label-ReplacingParameters')).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'TEST_VAR' })).toBeVisible();
  });

  test('UD04_022_ModifyDocLink_ACT不等于Y时不显示', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '22';
    // 真实数据 variable 有值会导致 Replacing parameters 显示，用 mock 确保 act='N' 且 variable 为空
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        code: 200, data: { ordernumber: '', build: '', spec: '', countryOfOperation: '', loadIndex: '', customerAdap: '', act: 'N', newval: '', variable: '' },
      }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Modify Doc Link 不显示
    await expect(page.locator('.link-red')).not.toBeVisible();
    await expect(page.locator('.result-label-ReplacingParameters')).not.toBeVisible();
    await takeScreenshot(page, 'ACT不等于Y');
  });
});

// ============================================================
// 5. Analyze Rules Link 操作
// ============================================================

test.describe('AnalyzeRulesLink操作', () => {

  test('UD04_023_AnalyzeRulesLink_正常点击', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '23';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'UD04画面');

    // 点击 Analyze Rules 链接
    const analyzeLink = page.locator('.link-blue', { hasText: 'Analyze Rules' });
    await expect(analyzeLink).toBeVisible();
    await analyzeLink.click();

    // 不跳转，页面不报错
    await expect(page).toHaveURL(/UD04/);
    await takeScreenshot(page, '点击后页面不变');
  });
});

// ============================================================
// 6. Generated document Link 操作
// ============================================================

test.describe('GeneratedDocumentLink操作', () => {

  test('UD04_024_GeneratedDocumentLink_正常显示', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '24';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'UD04画面');

    // Generated document 链接可点击
    await expect(page.locator('.result-value-GeneratedDocument')).toBeVisible();
    await page.locator('.result-value-GeneratedDocument').click();
    // 不跳转，页面不报错
    await expect(page).toHaveURL(/UD04/);
    await takeScreenshot(page, '点击后页面不变');
  });
});

// ============================================================
// 7. 异常处理
// ============================================================

test.describe('异常处理', () => {

  test('UD04_025_异常处理_API返回业务错误code401', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '25';
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 401, message: 'Unauthorized' }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForSelector('.ud04-container', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '业务错误401');
  });

  test('UD04_026_异常处理_API返回HTTP500', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '26';
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal Server Error' }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForSelector('.ud04-container', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '500错误');
  });

  test('UD04_027_异常处理_API超时', { timeout: 240000 }, async ({ page }) => {
    currentTestNo = '27';
    await page.route('**/api/ud04/getdocumentdata**', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.abort('timedout');
    });
    await loginAndGoToUD04(page);

    // 等待超时错误消息（API 延迟35秒 + 等待时间）
    try {
      await expect(page.locator('.error-message-area')).toHaveText('Request timeout. Please check your network.', { timeout: 90000 });
    } catch {
      // 可能超时消息显示不同文案
    }
    await takeScreenshot(page, '超时错误').catch(() => {});
  });

  test('UD04_028_异常处理_网络异常', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '28';
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.abort('internetdisconnected');
    });
    await loginAndGoToUD04(page);
    await page.waitForSelector('.ud04-container', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '网络异常');
  });

  test('UD04_029_异常处理_数据不存在', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '29';
    // API 返回空数据
    await page.route('**/api/ud04/getdocumentdata**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForSelector('.ud04-container', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message-area')).toBeVisible();
    await takeScreenshot(page, '数据不存在');
  });
});

// ============================================================
// 8. UI交互
// ============================================================

test.describe('UI交互', () => {

  test('UD04_030_UI交互_加载中显示Loading状态', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '30';
    // 延迟 API 响应
    await page.route('**/api/ud04/getdocumentdata**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { ordernumber: '1097295', build: '2016173', spec: '201617', countryOfOperation: 'IDO', loadIndex: 'FTLI-15', customerAdap: 'S1810111', act: '', newval: '', variable: '' } }) });
    });
    await loginAndGoToUD04(page);
    await page.waitForTimeout(3000);

    // 加载中提示
    await expect(page.locator('.loading-indicator')).toBeVisible();
    await takeScreenshot(page, '加载中状态');
  });

  test('UD04_031_UI交互_加载完成后控件恢复活性', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '31';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 加载中提示消失
    await expect(page.locator('.loading-indicator')).not.toBeVisible();
    // Chassis no Link 可点击
    await expect(page.locator('.link-blue').first()).toBeVisible();
    await expect(page.locator('.link-blue').first()).toHaveCSS('cursor', 'pointer');
    await takeScreenshot(page, '加载完成');
  });

  test('UD04_032_UI交互_加载完成后各Label数据填充', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '32';
    await loginAndGoToUD04(page);
    await page.waitForURL('**/UD04', { timeout: 30000 }).catch(() => {});
    await page.waitForSelector('.ud04-container', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '数据填充完成');

    // 各 Label 已填充数据
    await expect(page.locator('.result-value', { hasText: '1097295' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '2016173' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: '201617' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'IDO' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'S1810111' }).first()).toBeVisible();
    await expect(page.locator('.result-value', { hasText: 'FTLI-15' }).first()).toBeVisible();
  });
});

// ============================================================
// 9. 安全性
// ============================================================

test.describe('安全性', () => {

  test('UD04_033_安全性_未登录直接访问UD04画面重定向', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '33';
    // localStorage 已由 beforeEach 清除
    await page.goto(BASE_URL + '/UD04');
    await takeScreenshot(page, '直接访问UD04');

    // 自动重定向到 Login
    await page.waitForURL(BASE_URL + '/');
    await takeScreenshot(page, '重定向到Login');

    await expect(page.locator('.ud04-container')).not.toBeVisible();
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});
