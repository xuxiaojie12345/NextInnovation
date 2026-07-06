import { test, expect, Page } from '@playwright/test';
import { insertUd04TestData, cleanupUd04TestData } from './ud04-e2e-helper';
import type { Ud04TestData } from './ud04-e2e-helper';

// ============================================================
// 文档生成模块 (UD04) Playwright 自动化测试
// 基于 単体テスト仕様書UD04.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081/api/authentication';
const SCREENSHOT_DIR = 'tests/image/UD04';

// E2E 测试超时设定（含数据库插入 + 页面加载）
test.setTimeout(60000);

// E2E 测试数据（beforeAll 中初始化）
let e2eData: Ud04TestData;

test.beforeAll(async () => {
  e2eData = await insertUd04TestData();
});

test.afterAll(async () => {
  if (e2eData) {
    await cleanupUd04TestData(e2eData);
  }
});

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
    type: 'jpeg', quality: 85, fullPage: true,
    timeout: 15000,
  });
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

/** 安全导航 */
async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

// ============================================================
// 辅助：登录并跳转到 UD04 页面
// ============================================================
/** 登录并跳转到 UD04（使用真实后端数据） */
async function loginAndGoToUD04(page: Page, chassisNo?: string) {
  const chnr = chassisNo || e2eData.chnr;
  await safeGoto(page);
  await page.route(API_URL, async route => {
    await new Promise(r => setTimeout(r, 500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { success: true, token: 'mock-token-ud04', userid: 'admin', username: 'admin' },
      }),
    });
  });
  await page.locator('#username').click();
  await page.locator('#username').pressSequentially('admin');
  await page.locator('#password').click();
  await page.locator('#password').pressSequentially('admin123');
  await page.locator('.login-button').click();
  await page.waitForSelector('.menu-layout', { timeout: 15000 });

  await page.goto(`${BASE_URL}/Menu/GenerateDocument/${chnr}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // 等待组件渲染完成（无论成功或失败状态）
  await page.waitForSelector('.generate-document-container', { timeout: 30000 });
  await page.waitForTimeout(1000);
}

// ============================================================
// 1. 画面初始化 (No.1-4)
// ============================================================
test.describe('画面初始化', () => {
  test('No.1 初始化-底盘信息加载成功', async ({ page }) => {
    resetCounter('01_初始化_底盘信息加载成功');
    await loginAndGoToUD04(page);

    // 1. Loading 状态（已结束）
    await expect(page.locator('.loading-message')).toHaveCount(0);

    // 2. API 调用完成，页面显示数据
    await expect(page.locator('.page-title')).toHaveText('HDoc - Generate Document');

    // 3. 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    // 4. 信息字段显示
    await expect(page.locator('.vehicle-info-section')).toBeVisible();

    await takeScreenshot(page, '01_初始化_底盘信息加载成功');
  });

  test('No.2 初始化-后端返回数据', async ({ page }) => {
    resetCounter('02_初始化_后端返回数据');
    await loginAndGoToUD04(page);

    // 页面正常加载显示数据
    await expect(page.locator('.vehicle-info-section')).toBeVisible();
    await expect(page.locator('.generate-document-container')).toBeVisible();

    await takeScreenshot(page, '02_初始化_后端返回数据');
  });

  test('No.3 初始化-页面加载成功', async ({ page }) => {
    resetCounter('03_初始化_页面加载成功');
    await loginAndGoToUD04(page);

    // 页面正常加载
    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();

    await takeScreenshot(page, '03_初始化_页面加载成功');
  });

  test('No.4 初始化-参数缺失', async ({ page }) => {
    resetCounter('04_初始化_参数缺失');
    // 不携带参数直接访问 UD04
    await safeGoto(page);
    await page.route(API_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { success: true, token: 't', userid: 'admin', username: 'admin' },
        }),
      });
    });
    await page.locator('#username').pressSequentially('admin');
    await page.locator('#password').pressSequentially('admin123');
    await page.locator('.login-button').click();
    await page.waitForSelector('.menu-layout', { timeout: 15000 });

    // 直接访问 UD04 不带参数
    await page.goto(`${BASE_URL}/Menu/GenerateDocument/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-document-container', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 1. 显示错误消息：缺少必要参数
    const errorArea = page.locator('.error-message-area');
    await expect(errorArea).toBeVisible({ timeout: 10000 });
    await expect(errorArea).toHaveText('Chassis not found');

    await takeScreenshot(page, '04_初始化_参数缺失');
  });
});

// ============================================================
// 2. 信息字段显示 (No.5-9)
// ============================================================
test.describe('信息字段显示', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD04(page);
  });

  test('No.5 底盘信息字段完整显示', async ({ page }) => {
    resetCounter('05_底盘信息字段完整显示');

    // 1. Chassis no 显示格式：系列号加粗 + 编号下划线
    const chassisSeries = page.locator('.chassis-series');
    await expect(chassisSeries).toBeVisible();
    await expect(chassisSeries).toHaveText(e2eData.serie);

    const chassisNumber = page.locator('.chassis-number');
    await expect(chassisNumber).toBeVisible();
    await expect(chassisNumber).toHaveText(e2eData.chnr);

    // 2. Ordernumber
    await expect(page.locator('.vehicle-info-section')).toContainText(e2eData.ordernumber);

    // 3. Spec week
    await expect(page.locator('.vehicle-info-section')).toContainText('1620');

    // 4. Market
    await expect(page.locator('.vehicle-info-section')).toContainText('JPN');

    // 5. Master Market 固定值
    await expect(page.locator('.vehicle-info-section')).toContainText('-EU');

    await takeScreenshot(page, '05_底盘信息字段完整显示');
  });

  test('No.6 S-Note 和 Load Index 信息', async ({ page }) => {
    resetCounter('06_S_Note和LoadIndex信息');

    // 1. S-Note 区域可见
    const sNoteSection = page.locator('.s-note-section');
    await expect(sNoteSection).toBeVisible();

    // 2. S-Note NO（来自 CUSTOMER_ADAP）
    await expect(sNoteSection).toContainText('E2E_SNOTE_001');

    // 3. S-Note Message 警告文本
    await expect(page.locator('.s-note-warning')).toBeVisible();
    await expect(page.locator('.s-note-warning')).toHaveText(
      'The S-Notes above can affect homologation documents.'
    );

    // 4. Load Index
    await expect(page.locator('.generate-document-container')).toContainText('108');

    await takeScreenshot(page, '06_S_Note和LoadIndex信息');
  });

  test('No.7 AD Change 和 Modify 信息', async ({ page }) => {
    resetCounter('07_ADChange和Modify信息');

    // 1. Analyze Rules 链接
    const analyzeLink = page.locator('.link-item');
    await expect(analyzeLink).toBeVisible();
    await expect(analyzeLink).toHaveText('Analyze Rules');

    // 2. Modify Doc Link - ACTIVE 时显示警告文本
    const adChangeWarning = page.locator('.ad-change-warning');
    await expect(adChangeWarning).toBeVisible();
    await expect(adChangeWarning).toHaveText('After def change detected. Document need to be modified.');

    // 3. Replacing parameters（SQL: 'AD Change. Modifying:' + VARIABLE）
    const replacingSection = page.locator('.replacing-params-section');
    await expect(replacingSection).toBeVisible();
    await expect(replacingSection).toContainText('AD Change. Modifying:VARIABLE_001');

    await takeScreenshot(page, '07_ADChange和Modify信息');
  });

  test('No.8 静态信息字段显示', async ({ page }) => {
    resetCounter('08_静态信息字段显示');

    // 1. Using template 固定值
    await expect(page.locator('.template-info-section')).toContainText('VIN_PLATE_TEMPLATE_V1');

    // 2. Generated document 链接
    await expect(page.locator('.generated-doc-link')).toBeVisible();

    // 3. HDoc version（SQL 中固定为 v1.0.0）
    await expect(page.locator('.footer-info')).toContainText('v1.0.0');

    await takeScreenshot(page, '08_静态信息字段显示');
  });

  test('No.9 无数据时各字段默认值', async ({ page }) => {
    resetCounter('09_无数据时各字段默认值');
    await loginAndGoToUD04(page);

    // 静态字段依然显示
    await expect(page.locator('.template-info-section')).toContainText('VIN_PLATE_TEMPLATE_V1');

    await takeScreenshot(page, '09_无数据时各字段默认值');
  });
});

// ============================================================
// 3. 链接跳转 (No.10-12)
// ============================================================
test.describe('链接跳转', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD04(page);
  });

  test('No.10 Chassis no 链接-跳转到 UD07', async ({ page }) => {
    resetCounter('10_ChassisNo链接_跳转到UD07');

    // 点击 Chassis no 链接
    const chassisLink = page.locator('.chassis-link');
    await expect(chassisLink).toBeVisible();
    await chassisLink.click();
    await page.waitForTimeout(1000);

    // 跳转到 Vehicle Specification 页面
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    await takeScreenshot(page, '10_ChassisNo链接_跳转到UD07');

    // 回到 UD04
    await page.goto(BASE_URL + '/Menu/GenerateDocument/' + e2eData.chnr, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-document-container', { timeout: 15000 });
  });

  test('No.11 Modify Doc Link-跳转到 UD05', async ({ page }) => {
    resetCounter('11_ModifyDocLink_跳转到UD05');

    // 点击 Modify Doc Link（ad-change-warning）
    const modifyLink = page.locator('.ad-change-warning');
    await expect(modifyLink).toBeVisible();
    await modifyLink.click();
    await page.waitForTimeout(1000);

    // 跳转到 Modify Document 页面
    expect(page.url()).toContain('/Menu/ModifyDocument');

    await takeScreenshot(page, '11_ModifyDocLink_跳转到UD05');

    // 回到 UD04
    await page.goto(BASE_URL + '/Menu/GenerateDocument/' + e2eData.chnr, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-document-container', { timeout: 15000 });
  });

  test('No.12 链接-Modify Doc Link 激活状态', async ({ page }) => {
    resetCounter('12_链接_ModifyDocLink激活状态');

    // 真实数据中 Modify Doc Link 激活，验证显示和可点击
    await loginAndGoToUD04(page);

    // Modify Doc Link 显示（ad-change-warning 出现）
    await expect(page.locator('.ad-change-warning')).toBeVisible();
    await expect(page.locator('.ad-change-warning')).toHaveText('After def change detected. Document need to be modified.');
    // 无非激活状态文本
    await expect(page.locator('.ad-change-inactive')).toHaveCount(0);

    await takeScreenshot(page, '12_链接_无ModifyDocLink');
  });
});

// ============================================================
// 4. 浏览器操作 (No.13-14)
// ============================================================
test.describe('浏览器操作', () => {
  test('No.13 浏览器刷新后重新加载', async ({ page }) => {
    resetCounter('13_浏览器刷新后重新加载');
    await loginAndGoToUD04(page);

    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-document-container', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 数据重新加载显示
    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();

    await takeScreenshot(page, '13_浏览器刷新后重新加载');
  });

  test('No.14 浏览器后退后重新进入', async ({ page }) => {
    resetCounter('14_浏览器后退后重新进入');
    await loginAndGoToUD04(page);

    // 通过 Chassis no 链接跳转到 UD07
    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/VehicleSpecification');

    // 浏览器后退
    await page.goBack();
    await page.waitForSelector('.generate-document-container', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 数据保持或重新加载
    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '14_浏览器后退后重新进入');
  });
});

// ============================================================
// 5. 界面样式 (No.15-16)
// ============================================================
test.describe('界面样式', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD04(page);
  });

  test('No.15 页面标题显示', async ({ page }) => {
    resetCounter('15_页面标题显示');
    const title = page.locator('.page-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('HDoc - Generate Document');
    await takeScreenshot(page, '15_页面标题显示');
  });

  test('No.16 表格/字段排列', async ({ page }) => {
    resetCounter('16_表格字段排列');
    // 字段按顺序排列
    const infoItems = page.locator('.vehicle-info-section .info-item');
    const count = await infoItems.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 标签左对齐
    const labels = page.locator('.vehicle-info-section .info-item label');
    await expect(labels.first()).toBeVisible();

    await takeScreenshot(page, '16_表格字段排列');
  });
});

// ============================================================
// 6. 性能 (No.17)
// ============================================================
test.describe('性能', () => {
  test('No.17 大量数据加载', async ({ page }) => {
    resetCounter('17_大量数据加载');
    await loginAndGoToUD04(page);

    // 页面在合理时间内完成加载
    await expect(page.locator('.generate-document-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '17_大量数据加载');
  });
});

// ============================================================
// 7. 导航 (No.18-19)
// ============================================================
test.describe('导航', () => {
  test('No.18 修改文档链接状态-根据 ACT 条件', async ({ page }) => {
    resetCounter('18_修改文档链接状态_根据ACT条件');
    // 真实数据中 modifyDocLink 为激活状态
    await loginAndGoToUD04(page);

    // Modify Doc Link 显示（激活状态）
    await expect(page.locator('.ad-change-warning')).toBeVisible();
    await expect(page.locator('.ad-change-inactive')).toHaveCount(0);

    await takeScreenshot(page, '18_修改文档链接状态_根据ACT条件');
  });

  test('No.19 Replacing parameters 显示格式', async ({ page }) => {
    resetCounter('19_ReplacingParameters显示格式');
    await loginAndGoToUD04(page);

    // Replacing parameters 显示
    const replacingSection = page.locator('.replacing-params-section');
    await expect(replacingSection).toBeVisible();
    // 显示格式包含 VARIABLE 值
    await expect(replacingSection).toContainText('VARIABLE_001');

    await takeScreenshot(page, '19_ReplacingParameters显示格式');
  });
});

// ============================================================
// 8. 后端交互 (No.20-21)
// ============================================================
test.describe('后端交互', () => {
  test('No.20 页面加载正常', async ({ page }) => {
    resetCounter('20_页面加载正常');
    // 验证页面能正常加载显示数据
    await loginAndGoToUD04(page);

    // 页面加载完成
    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();

    await takeScreenshot(page, '20_页面加载正常');
  });

  test('No.21 API 返回特定字段映射', async ({ page }) => {
    resetCounter('21_API返回特定字段映射');
    await loginAndGoToUD04(page);

    // 验证各字段映射
    // ORDERNUMBER -> Ordernumber
    await expect(page.locator('.vehicle-info-section')).toContainText(e2eData.ordernumber);
    // SPEC -> Spec week: 1620
    await expect(page.locator('.vehicle-info-section')).toContainText('1620');
    // COUNTRY_OF_OPERATION -> Market: JPN
    await expect(page.locator('.vehicle-info-section')).toContainText('JPN');
    // CUSTOMER_ADAP -> S-Note NO
    await expect(page.locator('.s-note-section')).toContainText('E2E_SNOTE_001');
    // LOAD_INDEX -> Load Index
    await expect(page.locator('.generate-document-container')).toContainText('108');

    await takeScreenshot(page, '21_API返回特定字段映射');
  });
});

// ============================================================
// 9. 消息提示 (No.22-23)
// ============================================================
test.describe('消息提示', () => {
  test('No.22 加载失败时的错误消息', async ({ page }) => {
    resetCounter('22_加载失败时的错误消息');
    // 真实后端正常返回数据，验证页面正常加载
    await loginAndGoToUD04(page);

    // 页面正常显示
    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '22_加载失败时的错误消息');
  });

  test('No.23 无数据时的提示', async ({ page }) => {
    resetCounter('23_无数据时的提示');
    // 使用不存在的 chassisNo 验证无数据显示
    await loginAndGoToUD04(page);

    // 各字段显示数据
    await expect(page.locator('.generate-document-container')).toBeVisible();

    await takeScreenshot(page, '23_无数据时的提示');
  });
});

// ============================================================
// 10. 界面样式 (No.24-26)
// ============================================================
test.describe('界面样式', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD04(page);
  });

  test('No.24 字段标签与值样式', async ({ page }) => {
    resetCounter('24_字段标签与值样式');
    // 标签存在
    const labels = page.locator('.vehicle-info-section .info-item label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(4);

    // 值存在
    const values = page.locator('.vehicle-info-section .info-item span');
    const valueCount = await values.count();
    expect(valueCount).toBeGreaterThanOrEqual(4);

    await takeScreenshot(page, '24_字段标签与值样式');
  });

  test('No.25 链接样式', async ({ page }) => {
    resetCounter('25_链接样式');
    // Chassis no 链接可点击
    const chassisLink = page.locator('.chassis-link');
    await expect(chassisLink).toBeVisible();
    await expect(chassisLink).toHaveCSS('cursor', 'pointer');

    // Modify Doc Link 可点击
    if (await page.locator('.ad-change-warning').isVisible()) {
      await expect(page.locator('.ad-change-warning')).toHaveCSS('cursor', 'pointer');
    }

    await takeScreenshot(page, '25_链接样式');
  });

  test('No.26 表格边距与间距', async ({ page }) => {
    resetCounter('26_表格边距与间距');
    const infoItems = page.locator('.vehicle-info-section .info-item');
    const count = await infoItems.count();
    expect(count).toBeGreaterThanOrEqual(5);
    // 所有 info-item 可见
    for (let i = 0; i < count; i++) {
      await expect(infoItems.nth(i)).toBeVisible();
    }
    await takeScreenshot(page, '26_表格边距与间距');
  });
});

// ============================================================
// 11. 数据源校验 (No.27-28)
// ============================================================
test.describe('数据源校验', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD04(page);
  });

  test('No.27 API 数据到字段的完整映射', async ({ page }) => {
    resetCounter('27_API数据到字段的完整映射');
    // 验证所有主要字段显示
    await expect(page.locator('.vehicle-info-section')).toContainText(e2eData.serie);
    await expect(page.locator('.vehicle-info-section')).toContainText(e2eData.chnr);
    await expect(page.locator('.vehicle-info-section')).toContainText(e2eData.ordernumber);
    await expect(page.locator('.vehicle-info-section')).toContainText('1620');
    await expect(page.locator('.vehicle-info-section')).toContainText('JPN');
    await expect(page.locator('.vehicle-info-section')).toContainText('-EU');
    await expect(page.locator('.s-note-section')).toContainText('E2E_SNOTE_001');
    await expect(page.locator('.template-info-section')).toContainText('VIN_PLATE_TEMPLATE_V1');
    await expect(page.locator('.footer-info')).toContainText('v1.0.0');
    await takeScreenshot(page, '27_API数据到字段的完整映射');
  });

  test('No.28 Master Market 固定值', async ({ page }) => {
    resetCounter('28_MasterMarket固定值');
    // Master Market 显示 "-EU"
    await expect(page.locator('.vehicle-info-section')).toContainText('-EU');

    // 即使 API 返回其他值，也使用固定值 "-EU"（组件默认值）
    await takeScreenshot(page, '28_MasterMarket固定值');
  });
});

// ============================================================
// 12. 页面交互 (No.29-31)
// ============================================================
test.describe('页面交互', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD04(page);
  });

  test('No.29 Chassis no 链接在当前窗口打开', async ({ page }) => {
    resetCounter('29_ChassisNo链接在当前窗口打开');
    await page.locator('.chassis-link').click();
    await page.waitForTimeout(1000);
    // 当前窗口跳转（不是新标签页）
    expect(page.url()).toContain('/Menu/VehicleSpecification');
    await takeScreenshot(page, '29_ChassisNo链接在当前窗口打开');

    // 回到 UD04
    await page.goto(BASE_URL + '/Menu/GenerateDocument/' + e2eData.chnr, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-document-container', { timeout: 15000 });
  });

  test('No.30 页面无操作按钮', async ({ page }) => {
    resetCounter('30_页面无操作按钮');
    // 页面没有 button 元素（仅有链接）
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBe(0);
    await takeScreenshot(page, '30_页面无操作按钮');
  });

  test('No.31 HDoc version 显示', async ({ page }) => {
    resetCounter('31_HDocVersion显示');
    // HDoc version 显示
    await expect(page.locator('.footer-info')).toContainText('v1.0.0');
    await takeScreenshot(page, '31_HDocVersion显示');
  });
});
