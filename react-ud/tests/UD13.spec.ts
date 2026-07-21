import { test, expect, Page } from '@playwright/test';

// ============================================================
// HDocTemplateCheck 模块 (UD13) Playwright 自动化测试
// 基于 単体テスト仕様書UD13.md（6个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD13';
const UD13_URL = `${BASE_URL}/Menu/HDocTemplateCheck`;

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(300);
    if (page.isClosed()) return;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`, type: 'jpeg', quality: 85, fullPage: true, timeout: 10000 });
  } catch (e) { console.warn(`Screenshot failed for ${name}: ${e}`); }
}

function resetCounter(name: string) { screenshotCounter[name] = 0; }

async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) { if (i === 2 || page.isClosed()) throw e; await page.waitForTimeout(2000); }
  }
}

async function loginViaLocalStorage(page: Page) {
  await page.evaluate((info) => { localStorage.setItem('userInfo', JSON.stringify(info)); }, {
    username: 'admin', role: 'Administrator',
    permissions: ["GenerateDucument", "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy"],
  });
}

async function gotoUD13(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => localStorage.clear());
  await loginViaLocalStorage(page);
  await page.goto(UD13_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('.ud13-page-title', { timeout: 10000 });
}

// ============================================================
// 1. 画面初始化（No.1-2）
// ============================================================
test.describe.serial('画面初始化（No.1-2）', () => {
  test.setTimeout(120000);

  test('No.1 页面标题显示', async ({ page }) => {
    resetCounter('01_页面标题');
    await gotoUD13(page);
    // 页面标题
    await expect(page.locator('.ud13-page-title')).toContainText('HDoc Template Check');
    // 文件选择框为空
    await expect(page.locator('#ud13-file-input')).toBeVisible();
    // 没有 Download checked template 链接（本页面无此链接）
    await takeScreenshot(page, '01_页面标题');
  });

  test('No.2 画面初始状态', async ({ page }) => {
    resetCounter('02_初始状态');
    await gotoUD13(page);
    // 文件选择框显示为空
    await expect(page.locator('#ud13-file-input')).toBeVisible();
    // Check 按钮可用
    await expect(page.locator('.ud13-btn').filter({ hasText: 'Check' })).toBeEnabled();
    // 无错误消息和成功消息
    await expect(page.locator('.ud13-error')).toHaveCount(0);
    await expect(page.locator('.ud13-success')).toHaveCount(0);
    await takeScreenshot(page, '02_初始状态');
  });
});

// ============================================================
// 2. 文件选择（No.3-5）
// ============================================================
test.describe.serial('文件选择（No.3-5）', () => {
  test.setTimeout(120000);

  test('No.3 文件选择-正常选择rtf文件', async ({ page }) => {
    resetCounter('03_选择rtf');
    await gotoUD13(page);
    // 选择 rtf 文件
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#ud13-file-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test_template.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs60 Hello, World!}'),
    });
    await page.waitForTimeout(500);
    // 文件被选择后无错误消息
    await expect(page.locator('.ud13-error')).toHaveCount(0);
    await takeScreenshot(page, '03_选择rtf');
  });

  test('No.4 文件选择-取消选择', async ({ page }) => {
    resetCounter('04_取消选择');
    await gotoUD13(page);
    // 取消选择 = 不设置文件
    await takeScreenshot(page, '04_取消选择');
  });

  test('No.5 文件选择-重新选择替换', async ({ page }) => {
    resetCounter('05_重新选择');
    await gotoUD13(page);
    // 先选择 a.rtf
    const fc1 = page.waitForEvent('filechooser');
    await page.locator('#ud13-file-input').click();
    const fileChooser1 = await fc1;
    await fileChooser1.setFiles({
      name: 'a.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('{\\rtf1 a}'),
    });
    await page.waitForTimeout(300);
    // 再选择 b.rtf
    const fc2 = page.waitForEvent('filechooser');
    await page.locator('#ud13-file-input').click();
    const fileChooser2 = await fc2;
    await fileChooser2.setFiles({
      name: 'b.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('{\\rtf1 b}'),
    });
    await page.waitForTimeout(500);
    // 无错误消息
    await expect(page.locator('.ud13-error')).toHaveCount(0);
    await takeScreenshot(page, '05_重新选择');
  });
});

// ============================================================
// 3. 安全性（No.6）
// ============================================================
test.describe.serial('安全性（No.6）', () => {
  test.setTimeout(120000);

  test('No.6 文件类型-非rtf文件也可选择', async ({ page }) => {
    resetCounter('06_非rtf文件');
    await gotoUD13(page);
    // 选择 .txt 文件
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#ud13-file-input').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('plain text content'),
    });
    await page.waitForTimeout(500);
    // 非rtf文件也可被选择，无错误消息
    await expect(page.locator('.ud13-error')).toHaveCount(0);
    await takeScreenshot(page, '06_非rtf文件');
  });
});
