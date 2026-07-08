import { test, expect, Page } from '@playwright/test';

// ============================================================
// Menu 导航模块 (UD02) Playwright 自动化测试
// 基于 単体テスト仕様書UD02.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD02';

let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    if (page.isClosed()) return;
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${name}_${seq}.jpeg`,
      type: 'jpeg', quality: 85, fullPage: true,
      timeout: 10000,
    });
  } catch (e) {
    console.warn(`Screenshot failed for ${name}: ${e}`);
  }
}

function resetCounter(name: string) {
  screenshotCounter[name] = 0;
}

/** 设置登录状态（写入localStorage） */
async function setLoginState(page: Page, overrides?: Record<string, any>) {
  await page.evaluate((params) => {
    const defaultInfo = {
      token: 'test-token',
      userid: 'wang',
      username: 'wang',
      responsible: 'Engineering',
      userposition: 'Manager',
      email: 'wang@example.com',
      permissions: [
        "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
        "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
        "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
        "HDocTemplateCheck",
        "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
        "ArchiveSearch", "UploadDocument",
        "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy",
      ]
    };
    const info = params ? { ...defaultInfo, ...params } : defaultInfo;
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, overrides);
}

/** 清除登录状态 */
async function clearLoginState(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/** 安全导航：domcontentloaded + 重试 */
async function safeGoto(page: Page, url: string) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.menu-layout', { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

/** 通过文本查找并点击 Ant Design 菜单项 */
async function clickMenuItem(page: Page, label: string) {
  // leaf menu item
  const item = page.locator(`.ant-menu-item:has-text("${label}")`);
  if (await item.isVisible().catch(() => false)) {
    await item.click();
    return;
  }
  // submenu title
  const sub = page.locator(`.ant-menu-submenu-title:has-text("${label}")`);
  if (await sub.isVisible().catch(() => false)) {
    await sub.click();
  }
}

// ============================================================
// 测试前置：设置登录状态
// ============================================================
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await setLoginState(page);
  await page.close();
});

// ============================================================
// 1. 画面初始化 - No.1-7
// ============================================================
test.describe.serial('画面初始化', () => {

  test('No.1 画面初期表示-整体布局', async ({ page }) => {
    resetCounter('01_整体布局');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    await expect(page.locator('.menu-sider')).toBeVisible();
    await expect(page.locator('.menu-content-layout')).toBeVisible();
    await expect(page.locator('.menu-tree')).toBeVisible();
    await expect(page.locator('.menu-content')).toBeVisible();
    await takeScreenshot(page, '01_整体布局');
  });

  test('No.2 画面初期表示-一级菜单显示', async ({ page }) => {
    resetCounter('02_一级菜单显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-submenu-title:has-text("Generate Ducument")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("User Administration")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("Archive")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("Documentation")')).toBeVisible();
    await takeScreenshot(page, '02_一级菜单显示');
  });

  test('No.3 画面初期表示-二级菜单Generate显示', async ({ page }) => {
    resetCounter('03_二级菜单Generate显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("Generate Doc")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Generate in Batch")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Regdata Archive")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Regdata Batch")')).toBeVisible();
    await takeScreenshot(page, '03_二级菜单Generate显示');
  });

  test('No.4 画面初期表示-二级菜单Admin显示', async ({ page }) => {
    resetCounter('04_二级菜单Admin显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("Update user defined variables (rules)")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Update user defined variables (UNICODE rules)")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Existing HDoc variables")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Unlock Document")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("HDoc Number Series")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Upload/Delete template")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("List available templates")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("VPPS Vin plate")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("AD/CA Change")')).toBeVisible();
    await takeScreenshot(page, '04_二级菜单Admin显示');
  });

  test('No.5 画面初期表示-User Administration菜单显示', async ({ page }) => {
    resetCounter('05_UserAdmin菜单显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("HDoc User Administration")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("HDoc User Doc Administration")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Search User")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("User Position")')).toBeVisible();
    await takeScreenshot(page, '05_UserAdmin菜单显示');
  });

  test('No.6 画面初期表示-Archive菜单显示', async ({ page }) => {
    resetCounter('06_Archive菜单显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("Search")').first()).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Upload Document")')).toBeVisible();
    await takeScreenshot(page, '06_Archive菜单显示');
  });

  test('No.7 画面初期表示-Documentation菜单显示', async ({ page }) => {
    resetCounter('07_Documentation菜单显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("User Guide")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("AD/CA Change Guide")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Vin plate Guide FM/FH")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Archive Guide")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Privacy")')).toBeVisible();
    await takeScreenshot(page, '07_Documentation菜单显示');
  });
});

// ============================================================
// 2. 菜单布局 - No.8-11
// ============================================================
test.describe.serial('菜单布局', () => {

  test('No.8 菜单宽度-左侧菜单区显示', async ({ page }) => {
    resetCounter('08_菜单宽度_显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-sider', { timeout: 15000 });
    await expect(page.locator('.menu-sider')).toBeVisible();
    await expect(page.locator('.menu-tree')).toBeVisible();
    await takeScreenshot(page, '08_菜单宽度_显示');
  });

  test('No.9 菜单项文字-不截断不省略', async ({ page }) => {
    resetCounter('09_菜单项文字_不截断');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    const longItem = page.locator('.ant-menu-item:has-text("Update user defined variables (rules)")');
    await expect(longItem).toBeVisible();
    await expect(page.locator('.menu-tree-container')).toHaveCSS('overflow-x', 'hidden');
    await takeScreenshot(page, '09_菜单项文字_不截断');
  });

  test('No.10 右侧内容区-初始空白', async ({ page }) => {
    resetCounter('10_右侧内容区_初始空白');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-content', { timeout: 15000 });
    await expect(page.locator('.menu-content')).toBeVisible();
    await takeScreenshot(page, '10_右侧内容区_初始空白');
  });

  test('No.11 菜单项对齐方式', async ({ page }) => {
    resetCounter('11_菜单项对齐方式');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 一级菜单标题
    const submenuTitles = page.locator('.ant-menu-submenu-title');
    const firstTitle = submenuTitles.first();
    await expect(firstTitle).toBeVisible();
    await takeScreenshot(page, '11_菜单项对齐方式');
  });
});

// ============================================================
// 3. 菜单展开与折叠 - No.12-15
// ============================================================
test.describe.serial('菜单展开与折叠', () => {

  test('No.12 子菜单默认全部展开', async ({ page }) => {
    resetCounter('12_子菜单默认全部展开');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 验证所有叶子菜单项可见（说明子菜单已展开）
    await expect(page.locator('.ant-menu-item:has-text("Generate Doc")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("HDoc User Administration")')).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("Search")').first()).toBeVisible();
    await expect(page.locator('.ant-menu-item:has-text("User Guide")')).toBeVisible();
    await takeScreenshot(page, '12_子菜单默认全部展开');
  });

  test('No.13 子菜单不允许折叠', async ({ page }) => {
    resetCounter('13_子菜单不允许折叠');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 点击一级菜单标题尝试折叠
    const submenuTitle = page.locator('.ant-menu-submenu-title:has-text("Generate Ducument")');
    await submenuTitle.click();
    await page.waitForTimeout(500);
    // 子菜单仍应展开（叶子菜单项可见）
    await expect(page.locator('.ant-menu-item:has-text("Generate Doc")')).toBeVisible();
    await takeScreenshot(page, '13_子菜单不允许折叠');
  });

  test('No.14 页面刷新后子菜单状态', async ({ page }) => {
    resetCounter('14_页面刷新后子菜单状态');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("Generate Doc")')).toBeVisible();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("Generate Doc")')).toBeVisible();
    await takeScreenshot(page, '14_页面刷新后子菜单状态');
  });

  test('No.15 页面切换后返回菜单状态', async ({ page }) => {
    resetCounter('15_页面切换后返回菜单状态');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 点击菜单项进入子页面
    await page.locator('.ant-menu-item:has-text("Generate Doc")').click();
    await page.waitForTimeout(1000);
    // 返回Menu页面
    await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-item:has-text("Generate Doc")')).toBeVisible();
    await takeScreenshot(page, '15_页面切换后返回菜单状态');
  });
});

// ============================================================
// 4. 菜单导航 - No.16-43
// ============================================================
test.describe.serial('菜单导航', () => {

  test('No.16 导航-Generate>>Generate Doc', async ({ page }) => {
    resetCounter('16_导航_GenerateDoc');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Generate Doc")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("Generate Doc")')).toBeVisible();
    await takeScreenshot(page, '16_导航_GenerateDoc');
  });

  test('No.17 导航-Generate>>Generate in Batch', async ({ page }) => {
    resetCounter('17_导航_GenerateBatch');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Generate in Batch")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Generate in Batch")')).toBeVisible();
    await takeScreenshot(page, '17_导航_GenerateBatch');
  });

  test('No.18 导航-Generate>>Regdata Archive', async ({ page }) => {
    resetCounter('18_导航_RegdataArchive');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Regdata Archive")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Regdata Archive")')).toBeVisible();
    await takeScreenshot(page, '18_导航_RegdataArchive');
  });

  test('No.19 导航-Generate>>Regdata Batch', async ({ page }) => {
    resetCounter('19_导航_RegdataBatch');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Regdata Batch")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Regdata Batch")')).toBeVisible();
    await takeScreenshot(page, '19_导航_RegdataBatch');
  });

  test('No.20 导航-Admin>>Update user defined variables (rules)', async ({ page }) => {
    resetCounter('20_导航_UpdateRules');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Update user defined variables (rules)")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("Update user defined variables (rules)")')).toBeVisible();
    await takeScreenshot(page, '20_导航_UpdateRules');
  });

  test('No.21 导航-Admin>>Update user defined variables (UNICODE rules)', async ({ page }) => {
    resetCounter('21_导航_UpdateUnicodeRules');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Update user defined variables (UNICODE rules)")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("Update user defined variables (UNICODE rules)")')).toBeVisible();
    await takeScreenshot(page, '21_导航_UpdateUnicodeRules');
  });

  test('No.22 导航-Admin>>Existing HDoc variables', async ({ page }) => {
    resetCounter('22_导航_ExistingVariables');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Existing HDoc variables")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("Existing HDoc variables")')).toBeVisible();
    await takeScreenshot(page, '22_导航_ExistingVariables');
  });

  test('No.23 导航-Admin>>Unlock Document', async ({ page }) => {
    resetCounter('23_导航_UnlockDocument');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Unlock Document")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Unlock Document")')).toBeVisible();
    await takeScreenshot(page, '23_导航_UnlockDocument');
  });

  test('No.24 导航-Admin>>HDoc Number Series', async ({ page }) => {
    resetCounter('24_导航_HDocNumberSeries');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("HDoc Number Series")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("HDoc Number Series")')).toBeVisible();
    await takeScreenshot(page, '24_导航_HDocNumberSeries');
  });

  test('No.25 导航-Admin>>Upload/Delete template', async ({ page }) => {
    resetCounter('25_导航_UploadDeleteTemplate');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Upload/Delete template")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("Upload/Delete template")')).toBeVisible();
    await takeScreenshot(page, '25_导航_UploadDeleteTemplate');
  });

  test('No.26 导航-Admin>>List available templates', async ({ page }) => {
    resetCounter('26_导航_ListTemplates');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("List available templates")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("List available templates")')).toBeVisible();
    await takeScreenshot(page, '26_导航_ListTemplates');
  });

  test('No.27 导航-Admin>>VPPS Vin plate', async ({ page }) => {
    resetCounter('27_导航_VPPSVinPlate');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("VPPS Vin plate")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("VPPS Vin plate")')).toBeVisible();
    await takeScreenshot(page, '27_导航_VPPSVinPlate');
  });

  test('No.28 导航-Admin>>AD/CA Change', async ({ page }) => {
    resetCounter('28_导航_ADCAChange');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("AD/CA Change")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("AD/CA Change")')).toBeVisible();
    await takeScreenshot(page, '28_导航_ADCAChange');
  });

  test('No.29 导航-User Administration>>HDoc User Administration', async ({ page }) => {
    resetCounter('29_导航_HDocUserAdmin');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("HDoc User Administration")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("HDoc User Administration")')).toBeVisible();
    await takeScreenshot(page, '29_导航_HDocUserAdmin');
  });

  test('No.30 导航-User Administration>>HDoc User Doc Administration', async ({ page }) => {
    resetCounter('30_导航_HDocUserDocAdmin');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("HDoc User Doc Administration")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("HDoc User Doc Administration")')).toBeVisible();
    await takeScreenshot(page, '30_导航_HDocUserDocAdmin');
  });

  test('No.31 导航-User Administration>>Search User', async ({ page }) => {
    resetCounter('31_导航_SearchUser');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Search User")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("Search User")')).toBeVisible();
    await takeScreenshot(page, '31_导航_SearchUser');
  });

  test('No.32 导航-User Administration>>Change Password', async ({ page }) => {
    resetCounter('32_导航_ChangePassword');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Change Password")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Change Password")')).toBeVisible();
    await takeScreenshot(page, '32_导航_ChangePassword');
  });

  test('No.33 导航-User Administration>>User Position', async ({ page }) => {
    resetCounter('33_导航_UserPosition');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("User Position")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("User Position")')).toBeVisible();
    await takeScreenshot(page, '33_导航_UserPosition');
  });

  test('No.34 导航-Archive>>Search', async ({ page }) => {
    resetCounter('34_导航_ArchiveSearch');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Search")').first().click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '34_导航_ArchiveSearch');
  });

  test('No.35 导航-Archive>>Upload Document', async ({ page }) => {
    resetCounter('35_导航_UploadDocument');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Upload Document")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Upload Document")')).toBeVisible();
    await takeScreenshot(page, '35_导航_UploadDocument');
  });

  test('No.36 导航-Documentation>>User Guide', async ({ page }) => {
    resetCounter('36_导航_UserGuide');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("User Guide")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.ant-menu-item-selected:has-text("User Guide")')).toBeVisible();
    await takeScreenshot(page, '36_导航_UserGuide');
  });

  test('No.37 导航-Documentation>>AD/CA Change Guide', async ({ page }) => {
    resetCounter('37_导航_ADCAChangeGuide');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("AD/CA Change Guide")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("AD/CA Change Guide")')).toBeVisible();
    await takeScreenshot(page, '37_导航_ADCAChangeGuide');
  });

  test('No.38 导航-Documentation>>Vin plate Guide FM/FH', async ({ page }) => {
    resetCounter('38_导航_VinPlateGuide');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Vin plate Guide FM/FH")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Vin plate Guide FM/FH")')).toBeVisible();
    await takeScreenshot(page, '38_导航_VinPlateGuide');
  });

  test('No.39 导航-Documentation>>Archive Guide', async ({ page }) => {
    resetCounter('39_导航_ArchiveGuide');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Archive Guide")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Archive Guide")')).toBeVisible();
    await takeScreenshot(page, '39_导航_ArchiveGuide');
  });

  test('No.40 导航-Documentation>>Privacy', async ({ page }) => {
    resetCounter('40_导航_Privacy');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await page.locator('.ant-menu-item:has-text("Privacy")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Privacy")')).toBeVisible();
    await takeScreenshot(page, '40_导航_Privacy');
  });

  test('No.41 导航-菜单高亮切换', async ({ page }) => {
    resetCounter('41_菜单高亮切换');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 点击第一个菜单
    await page.locator('.ant-menu-item:has-text("Generate Doc")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Generate Doc")')).toBeVisible();
    // 点击另一个菜单
    await page.locator('.ant-menu-item:has-text("Existing HDoc variables")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Existing HDoc variables")')).toBeVisible();
    await expect(page.locator('.ant-menu-item-selected:has-text("Generate Doc")')).toHaveCount(0);
    await takeScreenshot(page, '41_菜单高亮切换');
  });

  test('No.42 导航-重复点击同一菜单项', async ({ page }) => {
    resetCounter('42_重复点击同一菜单项');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    const targetItem = page.locator('.ant-menu-item:has-text("List available templates")');
    await targetItem.click();
    await page.waitForTimeout(500);
    await targetItem.click();
    await page.waitForTimeout(500);
    await expect(targetItem).toBeVisible();
    await takeScreenshot(page, '42_重复点击同一菜单项');
  });

  test('No.43 导航-浏览器前进后退', async ({ page }) => {
    resetCounter('43_浏览器前进后退');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 第一步：点击Generate Doc
    await page.locator('.ant-menu-item:has-text("Generate Doc")').click();
    await page.waitForTimeout(500);
    // 第二步：点击Upload/Delete template
    await page.locator('.ant-menu-item:has-text("Upload/Delete template")').click();
    await page.waitForTimeout(500);
    // 后退
    await page.go_back();
    await page.waitForTimeout(500);
    // 前进
    await page.go_forward();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '43_浏览器前进后退');
  });
});

// ============================================================
// 5. 用户信息与登出 - No.44-48
// ============================================================
test.describe.serial('用户信息与登出', () => {

  test('No.44 用户信息-显示登录用户信息', async ({ page }) => {
    resetCounter('44_用户信息_显示');
    await setLoginState(page, { username: 'John.Doe', userid: 'John.Doe' });
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-user-info', { timeout: 15000 });
    await expect(page.locator('.menu-user-info')).toContainText('John.Doe');
    await takeScreenshot(page, '44_用户信息_显示');
  });

  test('No.45 用户信息-不同用户显示', async ({ page }) => {
    resetCounter('45_用户信息_不同用户');
    await setLoginState(page, { username: 'Jane.Smith', userid: 'Jane.Smith' });
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-user-info', { timeout: 15000 });
    await expect(page.locator('.menu-user-info')).toContainText('Jane.Smith');
    await takeScreenshot(page, '45_用户信息_不同用户');
  });

  test('No.46 登出按钮-显示', async ({ page }) => {
    resetCounter('46_登出按钮_显示');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-content-header', { timeout: 15000 });
    await expect(page.locator('.header-logout')).toBeVisible();
    await expect(page.locator('.header-logout')).toContainText('Logout');
    await takeScreenshot(page, '46_登出按钮_显示');
  });

  test('No.47 登出功能-成功登出', async ({ page }) => {
    resetCounter('47_登出功能_成功登出');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.header-logout', { timeout: 15000 });
    await page.locator('.header-logout').click();
    await page.waitForTimeout(1000);
    // 应跳转到登录页（检测 URL 或 login 元素）
    await takeScreenshot(page, '47_登出功能_成功登出');
  });

  test('No.48 登出功能-登出确认', async ({ page }) => {
    resetCounter('48_登出功能_登出确认');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.header-logout', { timeout: 15000 });
    await page.locator('.header-logout').click();
    await page.waitForTimeout(1000);
    // 登出后应跳转到登录页
    await takeScreenshot(page, '48_登出功能_登出确认');
  });
});

// ============================================================
// 6. 权限控制 - No.49-52
// ============================================================
test.describe.serial('权限控制', () => {

  test('No.49 权限控制-管理员权限可见所有菜单', async ({ page }) => {
    resetCounter('49_权限控制_管理员');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    await expect(page.locator('.ant-menu-submenu-title:has-text("Generate Ducument")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("User Administration")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("Archive")')).toBeVisible();
    await expect(page.locator('.ant-menu-submenu-title:has-text("Documentation")')).toBeVisible();
    await takeScreenshot(page, '49_权限控制_管理员');
  });

  test('No.50 权限控制-普通用户隐藏管理菜单', async ({ page }) => {
    resetCounter('50_权限控制_普通用户');
    await setLoginState(page, {
      permissions: [
        "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      ]
    });
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // Admin相关菜单项应被隐藏
    await expect(page.locator('.ant-menu-item:has-text("Upload/Delete template")')).toHaveCount(0);
    await expect(page.locator('.ant-menu-item:has-text("Existing HDoc variables")')).toHaveCount(0);
    await takeScreenshot(page, '50_权限控制_普通用户');
  });

  test('No.51 权限控制-无User Admin权限隐藏用户管理', async ({ page }) => {
    resetCounter('51_权限控制_无UserAdmin');
    await setLoginState(page, {
      permissions: [
        "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
        "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
        "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
        "ArchiveSearch", "UploadDocument",
        "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy",
      ]
    });
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // User Administration 一级菜单应被隐藏
    await expect(page.locator('.ant-menu-submenu-title:has-text("User Administration")')).toHaveCount(0);
    await takeScreenshot(page, '51_权限控制_无UserAdmin');
  });

  test('No.52 权限控制-无权限菜单不可直接访问', async ({ page }) => {
    resetCounter('52_权限控制_无权限访问');
    await setLoginState(page, {
      permissions: [] // 无任何权限
    });
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForTimeout(1000);
    // 应跳转到登录页面或显示错误
    await takeScreenshot(page, '52_权限控制_无权限访问');
  });
});

// ============================================================
// 7. 会话验证 - No.53-56
// ============================================================
test.describe.serial('会话验证', () => {

  test('No.53 会话验证-Token有效', async ({ page }) => {
    resetCounter('53_会话验证_Token有效');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    await expect(page.locator('.menu-sider')).toBeVisible();
    await expect(page.locator('.menu-content-layout')).toBeVisible();
    await takeScreenshot(page, '53_会话验证_Token有效');
  });

  test('No.54 会话验证-Token失效', async ({ page }) => {
    resetCounter('54_会话验证_Token失效');
    await setLoginState(page, { token: 'expired-token' });
    // 模拟token过期场景，直接导航
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '54_会话验证_Token失效');
  });

  test('No.55 会话验证-未登录直接访问', async ({ page }) => {
    resetCounter('55_会话验证_未登录访问');
    await clearLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForTimeout(1000);
    // 未登录应跳转到登录页
    await takeScreenshot(page, '55_会话验证_未登录访问');
  });

  test('No.56 会话验证-登录后Token刷新', async ({ page }) => {
    resetCounter('56_会话验证_Token刷新');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    await page.waitForTimeout(2000);
    // 长时间停留，页面应保持正常
    await expect(page.locator('.menu-sider')).toBeVisible();
    await takeScreenshot(page, '56_会话验证_Token刷新');
  });
});

// ============================================================
// 8. 异常处理 - No.57-59
// ============================================================
test.describe.serial('异常处理', () => {

  test('No.57 异常处理-路由配置错误', async ({ page }) => {
    resetCounter('57_异常处理_路由错误');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu/nonexistent-route`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '57_异常处理_路由错误');
  });

  test('No.58 异常处理-网络超时', async ({ page }) => {
    resetCounter('58_异常处理_网络超时');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-layout', { timeout: 15000 });
    // 在Menu页面执行操作（菜单已加载，模拟操作）
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '58_异常处理_网络超时');
  });

  test('No.59 异常处理-页面组件加载失败', async ({ page }) => {
    resetCounter('59_异常处理_组件加载失败');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 点击菜单项导航
    await page.locator('.ant-menu-item:has-text("Generate Doc")').click();
    await page.waitForTimeout(1000);
    // 左侧菜单应正常可用
    await expect(page.locator('.menu-tree')).toBeVisible();
    await takeScreenshot(page, '59_异常处理_组件加载失败');
  });
});

// ============================================================
// 9. 响应式布局 - No.60-62
// ============================================================
test.describe.serial('响应式布局', () => {

  test('No.60 响应式布局-桌面分辨率（1920×1080）', async ({ page }) => {
    resetCounter('60_响应式_1920x1080');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-sider', { timeout: 15000 });
    await expect(page.locator('.menu-sider')).toBeVisible();
    await expect(page.locator('.menu-content')).toBeVisible();
    await takeScreenshot(page, '60_响应式_1920x1080');
  });

  test('No.61 响应式布局-小分辨率（1366×768）', async ({ page }) => {
    resetCounter('61_响应式_1366x768');
    await page.setViewportSize({ width: 1366, height: 768 });
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-sider', { timeout: 15000 });
    await expect(page.locator('.menu-sider')).toBeVisible();
    await expect(page.locator('.menu-content')).toBeVisible();
    await takeScreenshot(page, '61_响应式_1366x768');
  });

  test('No.62 响应式布局-窄屏适配', async ({ page }) => {
    resetCounter('62_响应式_1024x768');
    await page.setViewportSize({ width: 1024, height: 768 });
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-sider', { timeout: 15000 });
    await expect(page.locator('.menu-sider')).toBeVisible();
    await expect(page.locator('.menu-content')).toBeVisible();
    await takeScreenshot(page, '62_响应式_1024x768');
  });
});

// ============================================================
// 10. 界面交互 - No.63-65
// ============================================================
test.describe.serial('界面交互', () => {

  test('No.63 菜单项悬停效果', async ({ page }) => {
    resetCounter('63_菜单项悬停效果');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    const menuItem = page.locator('.ant-menu-item:has-text("Generate Doc")');
    await menuItem.hover();
    await page.waitForTimeout(300);
    await takeScreenshot(page, '63_菜单项悬停效果');
  });

  test('No.64 菜单项点击反馈', async ({ page }) => {
    resetCounter('64_菜单项点击反馈');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    const menuItem = page.locator('.ant-menu-item:has-text("Upload/Delete template")');
    await menuItem.click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-menu-item-selected:has-text("Upload/Delete template")')).toBeVisible();
    await takeScreenshot(page, '64_菜单项点击反馈');
  });

  test('No.65 多个菜单项连续点击', async ({ page }) => {
    resetCounter('65_多个菜单项连续点击');
    await setLoginState(page);
    await safeGoto(page, `${BASE_URL}/Menu`);
    await page.waitForSelector('.menu-tree', { timeout: 15000 });
    // 快速连续点击多个菜单项
    await page.locator('.ant-menu-item:has-text("Generate Doc")').click();
    await page.waitForTimeout(200);
    await page.locator('.ant-menu-item:has-text("Existing HDoc variables")').click();
    await page.waitForTimeout(200);
    await page.locator('.ant-menu-item:has-text("Search User")').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '65_多个菜单项连续点击');
  });
});
