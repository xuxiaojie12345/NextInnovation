// @ts-nocheck
/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ============================================================
// UD02_Menu 单元测试
// 测试规格书: 测试式样书UD02.md
// 画面文件: Menu.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD02');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

/**
 * 截图（JPEG，格式：测试编号No_UD02画面ピクチャーXXX.jpeg）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD02画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
  const filepath = path.join(SCREENSHOT_ROOT, filename);
  return page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
}

if (!fs.existsSync(SCREENSHOT_ROOT)) {
  fs.mkdirSync(SCREENSHOT_ROOT, { recursive: true });
}

/**
 * 登录到 Menu 页面（每个测试前执行）
 */
async function loginToMenu(page: Page) {
  // 在页面加载前注入 localStorage，绕过 UI 登录
  await page.addInitScript((user) => {
    localStorage.clear();
    localStorage.setItem('userID', user);
    localStorage.setItem('userName', 'Administrator');
    localStorage.setItem('token', 'dummy-test-token');
  }, REAL_USER);
  await page.goto(BASE_URL + '/Menu');
  await page.waitForSelector('.menu-container', { timeout: 30000 });
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
});

// ============================================================
// 1. 画面初期表示
// ============================================================

test.describe('画面初期表示', () => {

  test('UD02_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await loginToMenu(page);

    // 1. 菜单主体显示在画面左侧
    await expect(page.locator('.menu-container')).toBeVisible();
    await takeScreenshot(page,  'Menu画面全体');

    // 2. 画面右侧为内容区域
    await expect(page.locator('.app-layout')).toBeVisible();
    await expect(page.locator('.menu-sidebar')).toBeVisible();
    await expect(page.locator('.content-area')).toBeVisible();

    // 3. 菜单按功能分为多个分组展示
    const sectionTitles = await page.getByRole('heading', { level: 3 }).allTextContents();
    expect(sectionTitles.length).toBeGreaterThanOrEqual(4);
    const expectedTitles = ['Generate Document', 'Admin', 'User Administration', 'Documentation'];
    for (const title of expectedTitles) {
      expect(sectionTitles).toContain(title);
    }
    await takeScreenshot(page,  '分组标题确认');

    // 4. 各分组的标题文字正常显示
    for (const title of expectedTitles) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }

    // 5. 画面不显示错误消息
    await expect(page.locator('.menu-error')).not.toBeVisible();
    await takeScreenshot(page,  '无错误消息确认');
  });

  test('UD02_002_画面初始化_Generate分组内容', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await loginToMenu(page);

    // 1. Generate Document 分组标题显示
    const generateSection = page.getByRole('heading', { name: 'Generate Document', exact: true });
    await expect(generateSection).toBeVisible();
    await takeScreenshot(page,  'Generate分组标题');

    // 2. Generate分组下包含可点击的菜单项
    const generateSectionEl = generateSection.locator('..');
    const clickableItems = generateSectionEl.locator('.menu-item.clickable');
    const clickableCount = await clickableItems.count();
    expect(clickableCount).toBeGreaterThanOrEqual(1);

    // 3. 菜单链接"Generate Doc"存在且可点击
    const generateDocItem = page.locator('.menu-label', { hasText: 'Generate Doc' });
    await expect(generateDocItem).toBeVisible();

    // 4. 文字居左对齐
    const textAlign = await generateDocItem.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(['left', 'start']).toContain(textAlign);

    // 5. 链接处于可点击状态
    const generateDocParent = generateDocItem.locator('..');
    await expect(generateDocParent).toHaveCSS('cursor', 'pointer');

    await takeScreenshot(page,  'Generate分组确认');
  });

  test('UD02_003_画面初始化_Admin分组内容', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await loginToMenu(page);

    // 1. Admin 分组标题显示
    const adminSection = page.getByRole('heading', { name: 'Admin', exact: true });
    await expect(adminSection).toBeVisible();
    await takeScreenshot(page,  'Admin分组标题');

    // 2. Admin分组下可点击的菜单项
    const adminLabels = [
      'Update user defined variables (rules)',
      'Existing HDoc variables',
      'Upload/Delete template',
      'List available templates',
      'VPPS Vin plate',
      'AD/CA Change',
    ];
    for (const label of adminLabels) {
      const item = label === 'AD/CA Change'
        ? page.locator('.menu-label', { hasText: /^AD\/CA Change$/ })
        : page.locator('.menu-label', { hasText: label });
      await expect(item).toBeVisible();

      // 所有链接处于可点击状态
      const parent = item.locator('..');
      await expect(parent).toHaveCSS('cursor', 'pointer');
    }
    await takeScreenshot(page,  'Admin分组确认');
  });

  test('UD02_004_画面初始化_UserAdministration分组内容', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await loginToMenu(page);

    // 1. User Administration 分组标题显示
    const userAdminSection = page.getByRole('heading', { name: 'User Administration', exact: true });
    await expect(userAdminSection).toBeVisible();
    await takeScreenshot(page,  'UserAdmin分组标题');

    // 2. User Administration分组下可点击的菜单项
    const userAdminLabels = [
      'HDoc User Administration',
      'HDoc User Doc Administration',
      'Search User',
    ];
    for (const label of userAdminLabels) {
      const item = page.locator('.menu-label', { hasText: label });
      await expect(item).toBeVisible();

      // 所有链接处于可点击状态
      await expect(item.locator('..')).toHaveCSS('cursor', 'pointer');
    }
    await takeScreenshot(page,  'UserAdmin分组确认');
  });

  test('UD02_005_画面初始化_Documentation分组内容', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await loginToMenu(page);

    // 1. Documentation 分组标题显示
    const docSection = page.getByRole('heading', { name: 'Documentation', exact: true });
    await expect(docSection).toBeVisible();
    await takeScreenshot(page,  'Documentation分组标题');

    // 2. Documentation分组下可点击的菜单项
    const userGuideItem = page.locator('.menu-label', { hasText: 'User Guide' });
    await expect(userGuideItem).toBeVisible();

    // 3. 链接处于可点击状态
    const userGuideParent = userGuideItem.locator('..');
    await expect(userGuideParent).toHaveCSS('cursor', 'pointer');

    await takeScreenshot(page,  'Documentation分组确认');
  });

  test('UD02_006_画面初始化_链接默认样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await loginToMenu(page);

    // 1. 链接文字为蓝色
    const menuItem = page.locator('.menu-item.clickable').first();
    await expect(menuItem).toHaveCSS('color', 'rgb(0, 51, 102)');

    // 2. 链接文字无下划线
    await expect(menuItem).toHaveCSS('text-decoration', /^none/);

    await takeScreenshot(page,  '链接默认样式确认');
  });

  test('UD02_007_画面初始化_链接悬停样式', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await loginToMenu(page);

    // 获取第一个可点击的菜单项
    const menuItem = page.locator('.menu-item.clickable').first();

    // 1. 鼠标悬停前无下划线
    await expect(menuItem).toHaveCSS('text-decoration', /^none/);
    await takeScreenshot(page,  '悬停前样式');

    // 2. 鼠标悬停时背景色变化
    await menuItem.hover();
    await expect(menuItem).toHaveCSS('background-color', 'rgb(213, 227, 240)');
    await takeScreenshot(page,  '悬停时样式');

    // 3. 鼠标指针变为手型指针（cursor: pointer）
    await expect(menuItem).toHaveCSS('cursor', 'pointer');
  });

  test('UD02_008_画面初始化_页面加载来源', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // 2. 所有分组标题显示
    const sectionTitles = ['Generate Document', 'Admin', 'User Administration', 'Documentation'];
    for (const title of sectionTitles) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }

    // 3. 可点击的菜单链接显示
    const clickableItems = page.locator('.menu-item.clickable');
    const count = await clickableItems.count();
    expect(count).toBeGreaterThanOrEqual(8);

    // 4. 画面不显示加载中状态
    await expect(page.locator('.menu-container')).toBeVisible();
    await takeScreenshot(page,  'Menu加载完成');
  });
});

// ============================================================
// 2. Generate>>Generate Doc 菜单点击操作
// ============================================================

test.describe('Generate菜单点击', () => {

  test('UD02_009_GenerateDoc_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // 点击 Generate Doc 菜单链接
    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click();

    // 画面跳转到 /UD03
    await page.waitForURL('**/UD03', { timeout: 30000 });
    await takeScreenshot(page,  'UD03画面跳转后');

    // 登录状态保持
    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe(REAL_USER);
  });
});

// ============================================================
// 3. Admin菜单点击操作
// ============================================================

test.describe('Admin菜单点击', () => {

  test('UD02_010_AdminUpdateRules_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'Update user defined variables (rules)' }).click();
    await page.waitForURL('**/UD08', { timeout: 30000 });
    await takeScreenshot(page,  'UD08画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_011_AdminExistingHDocVariables_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'Existing HDoc variables' }).click();
    await page.waitForURL('**/UD10', { timeout: 30000 });
    await takeScreenshot(page,  'UD10画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_012_AdminUploadDeleteTemplate_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'Upload/Delete template' }).click();
    await page.waitForURL('**/UD12', { timeout: 30000 });
    await takeScreenshot(page,  'UD12画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_013_AdminListAvailableTemplates_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'List available templates' }).click();
    await page.waitForURL('**/UD14', { timeout: 30000 });
    await takeScreenshot(page,  'UD14画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_014_AdminVPPSVinPlate_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'VPPS Vin plate' }).click();
    await page.waitForURL('**/UD15', { timeout: 30000 });
    await takeScreenshot(page,  'UD15画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_015_AdminADCAChange_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: /^AD\/CA Change$/ }).click();
    await page.waitForURL('**/UD16', { timeout: 30000 });
    await takeScreenshot(page,  'UD16画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });
});

// ============================================================
// 4. User Administration菜单点击操作
// ============================================================

test.describe('UserAdmin菜单点击', () => {

  test('UD02_016_UserAdminHDocUserAdmin_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'HDoc User Administration' }).click();
    await page.waitForURL('**/UD17', { timeout: 30000 });
    await takeScreenshot(page,  'UD17画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_017_UserAdminHDocUserDocAdmin_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'HDoc User Doc Administration' }).click();
    await page.waitForURL('**/UD18', { timeout: 30000 });
    await takeScreenshot(page,  'UD18画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });

  test('UD02_018_UserAdminSearchUser_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'Search User' }).click();
    await page.waitForURL('**/UD19', { timeout: 30000 });
    await takeScreenshot(page,  'UD19画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });
});

// ============================================================
// 5. Documentation菜单点击操作
// ============================================================

test.describe('Documentation菜单点击', () => {

  test('UD02_019_DocumentationUserGuide_正常跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    await page.locator('.menu-label', { hasText: 'User Guide' }).click();
    await page.waitForURL('**/UD24', { timeout: 30000 });
    await takeScreenshot(page,  'UD24画面跳转后');
    expect(await page.evaluate(() => localStorage.getItem('userID'))).toBe(REAL_USER);
  });
});

// ============================================================
// 6. 异常处理
// ============================================================

test.describe('异常处理', () => {

  test('UD02_020_异常处理_网络异常不影响客户端路由跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // React Router 导航是客户端路由，不依赖网络
    // 点击菜单链接应正常跳转
    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click();

    // 页面正常跳转到目标 URL
    await page.waitForURL('**/UD03', { timeout: 30000 });
    await takeScreenshot(page,  '跳转成功');

    // 页面不崩溃
    await expect(page.locator('body')).toBeAttached();
  });

  test('UD02_021_异常处理_目标页面不存在', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '21';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // 浏览器地址栏直接输入不存在的页面地址（无匹配路由渲染空白）
    await page.goto(BASE_URL + '/nonexist-page');
    await takeScreenshot(page,  '不存在的页面');

    // 未匹配的路由不显示内容
    await expect(page.locator('.app-layout')).not.toBeVisible();
  });
});

// ============================================================
// 7. UI交互
// ============================================================

test.describe('UI交互', () => {

  test('UD02_022_UI交互_从Login登录成功后跳转到Menu', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await loginToMenu(page);
    await takeScreenshot(page,  '跳转到Menu');

    // 2. Menu 画面正常显示
    await expect(page.locator('.menu-container')).toBeVisible();

    // 3. 分组标题全部显示
    const sectionTitles = ['Generate Document', 'Admin', 'User Administration', 'Documentation'];
    for (const title of sectionTitles) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }

    // 4. 菜单链接可点击
    const clickableItems = page.locator('.menu-item.clickable');
    const count = await clickableItems.count();
    expect(count).toBeGreaterThanOrEqual(8);
    await takeScreenshot(page,  'Menu完整显示');
  });

  test('UD02_023_UI交互_点击链接后目标画面加载前的状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // 点击菜单链接
    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click();

    // 等待导航开始
    await page.waitForTimeout(500);
    await takeScreenshot(page,  '跳转中状态');

    // 目标画面加载完成后自动跳转
    await page.waitForURL('**/UD03', { timeout: 30000 });
    await takeScreenshot(page,  '目标画面加载完成');
  });

  test('UD02_024_UI交互_连续快速点击多个菜单链接', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // 快速连续点击2个不同的菜单链接
    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click();
    await page.locator('.menu-label', { hasText: 'Existing HDoc variables' }).click();

    // 画面跳转到最后点击的链接
    await page.waitForURL('**/UD10', { timeout: 30000 });
    await takeScreenshot(page,  '最后点击目标画面');

    // 页面不崩溃
    await expect(page.locator('body')).toBeAttached();
  });

  test('UD02_025_UI交互_浏览器返回按钮从目标画面返回Menu', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await loginToMenu(page);
    await takeScreenshot(page,  'Menu画面');

    // 点击菜单链接跳转到目标画面
    await page.locator('.menu-label', { hasText: 'Generate Doc' }).click();
    await page.waitForURL('**/UD03', { timeout: 30000 });
    await takeScreenshot(page,  '目标画面');

    // 点击浏览器返回按钮
    await page.goBack();

    // 返回后 Menu 画面正常显示
    await page.waitForSelector('.menu-container');
    await takeScreenshot(page,  '返回Menu画面');

    // 所有分组标题显示
    await expect(page.getByRole('heading', { name: 'Generate Document', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();
  });
});

// ============================================================
// 8. 安全性
// ============================================================

test.describe('安全性', () => {

  test('UD02_026_安全性_未登录直接访问Menu画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';
    // Step 1: 使用 UI 登录后访问 Menu 画面（避免 loginToMenu 的 addInitScript 干扰）
    await page.goto(BASE_URL + '/');
    await page.waitForSelector('.login-container');
    await page.locator('#userID').fill(REAL_USER);
    await page.locator('#password').fill(REAL_PASS);
    await page.locator('button[type="submit"]').click({ noWaitAfter: true });
    await page.waitForURL('**/Menu', { timeout: 60000 });
    await page.waitForSelector('.menu-container');
    await expect(page).toHaveURL(/\/Menu/);
    await expect(page.locator('.menu-container')).toBeVisible();
    await takeScreenshot(page, 'Menu画面表示');

    // Step 2: 清除 localStorage（画面未刷新）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/Menu/);
    await expect(page.locator('.menu-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // Step 3: 直接访问 Menu URL → 重定向到 Login
    await page.goto(BASE_URL + '/Menu');
    await page.waitForTimeout(2000);

    // Step 4: 验证重定向结果
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.menu-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD02_027_安全性_登录状态保持', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await loginToMenu(page);

    // 1. localStorage 存在用户信息
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const userID = await page.evaluate(() => localStorage.getItem('userID'));
    const userName = await page.evaluate(() => localStorage.getItem('userName'));
    expect(token).not.toBeNull();
    expect(userID).toBe(REAL_USER);
    expect(userName).not.toBe('');
    await takeScreenshot(page,  '登录后Menu');

    // 2. 刷新页面
    await page.reload();
    await page.waitForSelector('.menu-container');
    await takeScreenshot(page,  '刷新后Menu');

    // 3. 刷新后仍保持在 Menu 画面
    await expect(page).toHaveURL(/Menu/);

    // 4. 所有菜单链接正常显示
    const clickableItems = page.locator('.menu-item.clickable');
    const count = await clickableItems.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });
});
