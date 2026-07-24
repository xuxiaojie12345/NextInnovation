/**
 * UD02 - Main Menu Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD02.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实页面（无 Mock）
 * 截图保存: tests/test/Image/UD02/
 * 测试用例数: 38
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD02');

// ============================================================
// 元素定位（匹配 Menu.tsx / Menu.css 源码）
// ============================================================

const $menuRoot      = (p: Page) => p.locator('.menu-root');
const $topbar        = (p: Page) => p.locator('.menu-topbar');
const $topbarTitle   = (p: Page) => p.locator('.topbar-title');
const $sidebar       = (p: Page) => p.locator('.menu-sidebar');
const $main          = (p: Page) => p.locator('.menu-main');
const $userInfo      = (p: Page) => p.locator('.user-info');
const $userName      = (p: Page) => p.locator('.user-name');
const $logoutBtn     = (p: Page) => p.locator('.logout-btn');
const $loginContainer = (p: Page) => p.locator('.login-container');

/** 根据分类标题文字定位 section（精确匹配） */
const $section = (p: Page, title: string) =>
  p.locator('.section-title').filter({ hasText: new RegExp(`^${title}$`) });

/** 根据菜单项文字定位 menu-item（精确匹配） */
const $menuItem = (p: Page, label: string) =>
  p.locator('.menu-item').filter({ hasText: new RegExp(`^\\s*»?\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });

// ============================================================
// 登录辅助函数
// ============================================================

async function loginAndGoToMenu(page: Page) {
  await login(page);
  await page.waitForSelector('.menu-root', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD02 Main Menu', () => {

  // ════════════════════════════════════════════
  // 画面初期表示 (TC1~6)
  // ════════════════════════════════════════════

  test('01-画面初期表示-整体布局', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '001');

    await expect($menuRoot(page)).toBeVisible();
    await expect($sidebar(page)).toBeVisible();
    await expect($main(page)).toBeVisible();
    await expect($topbar(page)).toBeVisible();
    await expect($topbarTitle(page)).toHaveText('HDoc System');
    await ss(page, '整体布局确认', '001');
  });

  test('02-画面初期表示-左侧菜单栏标题', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '002');

    const section = $section(page, 'Generate');
    await expect(section).toBeVisible();
    await expect(section).toHaveText('Generate');
    await ss(page, '菜单栏标题确认', '002');
  });

  test('03-画面初期表示-右侧欢迎信息', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '003');

    await expect(page).toHaveURL(/\/menu$/);
    await expect($main(page)).toContainText('Welcome to the HDoc system. Please select an option from the menu on the left.');
    await ss(page, '欢迎信息确认', '003');
  });

  test('04-画面初期表示-用户信息显示', async ({ page }) => {
    const dbUsers = await queryDB('SELECT USERID, USERNAME FROM hdoc_user_infor LIMIT 1');
    expect(dbUsers).not.toBeNull();
    expect(dbUsers!.length).toBeGreaterThan(0);

    await login(page);
    await page.waitForSelector('.menu-root', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await ss(page, '登录后菜单页', '004');

    await expect($userInfo(page)).toBeVisible();
    await expect($userName(page)).toBeVisible();
    const displayedName = await $userName(page).textContent();
    console.log(`  页面显示用户名: ${displayedName}`);
    await ss(page, '用户信息确认', '004');
  });

  test('05-画面初期表示-一级菜单标题', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '005');

    await expect($section(page, 'Generate')).toBeVisible();
    await expect($section(page, 'Admin')).toBeVisible();
    await expect($section(page, 'User Administration')).toBeVisible();
    await expect($section(page, 'Archive')).toBeVisible();
    await expect($section(page, 'Documentation')).toBeVisible();
    await ss(page, '分类标题确认', '005');
  });

  test('06-画面初期表示-退出按钮', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '006');

    await expect($logoutBtn(page)).toBeVisible();
    await expect($logoutBtn(page)).toHaveText('Logout');
    await ss(page, '退出按钮确认', '006');
  });

  // ════════════════════════════════════════════
  // 菜单结构·Generate分类 (TC7~10)
  // ════════════════════════════════════════════

  test('07-Generate分类-菜单项列表', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '007');

    await expect($menuItem(page, 'Generate Doc')).toBeVisible();
    await expect($menuItem(page, 'Generate in Batch')).toBeVisible();
    await expect($menuItem(page, 'Regdata Archive')).toBeVisible();
    await expect($menuItem(page, 'Regdata Batch')).toBeVisible();

    const genDoc = $menuItem(page, 'Generate Doc');
    await expect(genDoc.locator('.menu-arrow')).toBeVisible();
    await ss(page, 'Generate菜单列表', '007');
  });

  test('08-Generate分类-Generate Doc点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '008');

    await $menuItem(page, 'Generate Doc').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击Generate Doc后', '008');

    await expect(page).toHaveURL(/\/menu\/generate-doc/);
    await expect($menuItem(page, 'Generate Doc')).toHaveClass(/active/);
    await ss(page, 'Generate Doc选中状态', '008');
  });

  test('09-Generate分类-Generate in Batch点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '009');

    await $menuItem(page, 'Generate in Batch').click();
    await page.waitForTimeout(1000);
    await ss(page, '点击Generate in Batch后', '009');

    await expect(page).toHaveURL(/\/menu$/);
    await ss(page, 'Generate in Batch无跳转', '009');
  });

  test('10-Generate分类-Regdata Archive/Regdata Batch', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '010');

    await $menuItem(page, 'Regdata Archive').click();
    await page.waitForTimeout(500);
    await ss(page, '点击Regdata Archive后', '010');
    await expect(page).toHaveURL(/\/menu$/);

    await $menuItem(page, 'Regdata Batch').click();
    await page.waitForTimeout(500);
    await ss(page, '点击Regdata Batch后', '010');
    await expect(page).toHaveURL(/\/menu$/);
    await ss(page, '禁用菜单项确认', '010');
  });

  // ════════════════════════════════════════════
  // 菜单结构·Admin分类 (TC11~19)
  // ════════════════════════════════════════════

  test('11-Admin分类-菜单项列表', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '011');

    const adminItems = [
      'Update user defined variables (rules)',
      'Update user defined variables (UNICODE rules)',
      'Existing HDoc variables',
      'Unlock Document',
      'HDoc Number Series',
      'Upload/Delete template',
      'List available templates',
      'VPPS Vin plate',
      'AD/CA Change',
    ];
    for (const item of adminItems) {
      await expect($menuItem(page, item)).toBeVisible();
      console.log(`  ✅ ${item}`);
    }
    await ss(page, 'Admin菜单列表', '011');
  });

  test('12-Admin分类-Update user defined variables (rules)点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '012');

    await $menuItem(page, 'Update user defined variables (rules)').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '012');

    await expect(page).toHaveURL(/\/menu\/homologation-variables/);
    await expect($menuItem(page, 'Update user defined variables (rules)')).toHaveClass(/active/);
    await ss(page, '选中状态确认', '012');
  });

  test('13-Admin分类-Update user defined variables (UNICODE rules)点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '013');

    await $menuItem(page, 'Update user defined variables (UNICODE rules)').click();
    await page.waitForTimeout(1000);
    await ss(page, '点击后', '013');

    await expect(page).toHaveURL(/\/menu$/);
    await ss(page, '禁用菜单项确认', '013');
  });

  test('14-Admin分类-Existing HDoc variables点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '014');

    await $menuItem(page, 'Existing HDoc variables').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '014');

    await expect(page).toHaveURL(/\/menu\/existing-hdoc-vars/);
    await ss(page, '页面跳转确认', '014');
  });

  test('15-Admin分类-Unlock Document/HDoc Number Series点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '015');

    await $menuItem(page, 'Unlock Document').click();
    await page.waitForTimeout(500);
    await ss(page, '点击Unlock Document后', '015');
    await expect(page).toHaveURL(/\/menu$/);

    await $menuItem(page, 'HDoc Number Series').click();
    await page.waitForTimeout(500);
    await ss(page, '点击HDoc Number Series后', '015');
    await expect(page).toHaveURL(/\/menu$/);
    await ss(page, '禁用菜单项确认', '015');
  });

  test('16-Admin分类-Upload/Delete template点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '016');

    await $menuItem(page, 'Upload/Delete template').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '016');

    await expect(page).toHaveURL(/\/menu\/upload-delete-template/);
    await ss(page, '页面跳转确认', '016');
  });

  test('17-Admin分类-List available templates点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '017');

    await $menuItem(page, 'List available templates').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '017');

    await expect(page).toHaveURL(/\/menu\/list-templates/);
    await ss(page, '页面跳转确认', '017');
  });

  test('18-Admin分类-VPPS Vin plate点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '018');

    await $menuItem(page, 'VPPS Vin plate').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '018');

    await expect(page).toHaveURL(/\/menu\/vin-plate/);
    await ss(page, '页面跳转确认', '018');
  });

  test('19-Admin分类-AD/CA Change点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '019');

    await $menuItem(page, 'AD/CA Change').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '019');

    await expect(page).toHaveURL(/\/menu\/ad-ca-change/);
    await ss(page, '页面跳转确认', '019');
  });

  // ════════════════════════════════════════════
  // 菜单结构·User Administration分类 (TC20~24)
  // ════════════════════════════════════════════

  test('20-User Administration分类-菜单项列表', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '020');

    const uaItems = [
      'HDoc User Administration',
      'HDoc User Doc Administration',
      'Search User',
      'Change Password',
      'User Position',
    ];
    for (const item of uaItems) {
      await expect($menuItem(page, item)).toBeVisible();
      console.log(`  ✅ ${item}`);
    }
    await ss(page, 'User Admin菜单列表', '020');
  });

  test('21-User Administration分类-HDoc User Administration点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '021');

    await $menuItem(page, 'HDoc User Administration').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '021');

    await expect(page).toHaveURL(/\/menu\/hdoc-user-admin/);
    await ss(page, '页面跳转确认', '021');
  });

  test('22-User Administration分类-HDoc User Doc Administration点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '022');

    await $menuItem(page, 'HDoc User Doc Administration').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '022');

    await expect(page).toHaveURL(/\/menu\/hdoc-user-doc-admin/);
    await ss(page, '页面跳转确认', '022');
  });

  test('23-User Administration分类-Search User点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '023');

    await $menuItem(page, 'Search User').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '023');

    await expect(page).toHaveURL(/\/menu\/search-user/);
    await ss(page, '页面跳转确认', '023');
  });

  test('24-User Administration分类-Change Password/User Position点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '024');

    await $menuItem(page, 'Change Password').click();
    await page.waitForTimeout(500);
    await ss(page, '点击Change Password后', '024');
    await expect(page).toHaveURL(/\/menu$/);

    await $menuItem(page, 'User Position').click();
    await page.waitForTimeout(500);
    await ss(page, '点击User Position后', '024');
    await expect(page).toHaveURL(/\/menu$/);
    await ss(page, '禁用菜单项确认', '024');
  });

  // ════════════════════════════════════════════
  // 菜单结构·Archive/Documentation分类 (TC25~29)
  // ════════════════════════════════════════════

  test('25-Archive分类-菜单项列表', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '025');

    await expect($menuItem(page, 'Search')).toBeVisible();
    await expect($menuItem(page, 'Upload Document')).toBeVisible();

    await $menuItem(page, 'Search').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/menu$/);

    await $menuItem(page, 'Upload Document').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/menu$/);
    await ss(page, 'Archive菜单确认', '025');
  });

  test('26-Documentation分类-菜单项列表', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '026');

    const docItems = [
      'User Guide',
      'AD/CA Change Guide',
      'Vin plate Guide FM/FH',
      'Archive Guide',
      'Privacy',
    ];
    for (const item of docItems) {
      await expect($menuItem(page, item)).toBeVisible();
      console.log(`  ✅ ${item}`);
    }
    await ss(page, 'Documentation菜单列表', '026');
  });

  test('27-Documentation分类-User Guide点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '027');

    await $menuItem(page, 'User Guide').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '027');

    await expect(page).toHaveURL(/\/menu\/guide-user/);
    await ss(page, '页面跳转确认', '027');
  });

  test('28-Documentation分类-其他无path菜单项点击', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '028');

    const disabledItems = [
      'AD/CA Change Guide',
      'Vin plate Guide FM/FH',
      'Archive Guide',
      'Privacy',
    ];
    for (const item of disabledItems) {
      await $menuItem(page, item).click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/menu$/);
      console.log(`  ✅ ${item} 无跳转`);
    }
    await ss(page, '禁用菜单项确认', '028');
  });

  test('29-菜单项-悬停效果', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '029');

    const menuItem = $menuItem(page, 'Generate Doc');
    const bgBefore = await menuItem.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`  悬停前背景色: ${bgBefore}`);
    await ss(page, '悬停前', '029');

    await menuItem.hover();
    await page.waitForTimeout(300);
    const bgAfter = await menuItem.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`  悬停后背景色: ${bgAfter}`);
    await ss(page, '悬停后', '029');

    expect(bgAfter).not.toBe(bgBefore);
    const cursor = await menuItem.evaluate(el => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
    await ss(page, '悬停效果确认', '029');
  });

  // ════════════════════════════════════════════
  // 菜单交互·选中状态 (TC30~33)
  // ════════════════════════════════════════════

  test('30-菜单项-选中状态（高亮）', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '030');

    await $menuItem(page, 'Generate Doc').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击Generate Doc后', '030');

    await expect(page).toHaveURL(/\/menu\/generate-doc/);
    await expect($menuItem(page, 'Generate Doc')).toHaveClass(/active/);
    const fontWeight = await $menuItem(page, 'Generate Doc').evaluate(el => window.getComputedStyle(el).fontWeight);
    console.log(`  字体粗细: ${fontWeight}`);
    expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(600);
    const borderLeft = await $menuItem(page, 'Generate Doc').evaluate(el => window.getComputedStyle(el).borderLeft);
    console.log(`  左边框: ${borderLeft}`);
    await ss(page, '选中状态确认', '030');
  });

  test('31-菜单项-选中切换', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '031');

    await $menuItem(page, 'Generate Doc').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击Generate Doc后', '031');
    await expect(page).toHaveURL(/\/menu\/generate-doc/);
    await expect($menuItem(page, 'Generate Doc')).toHaveClass(/active/);

    await $menuItem(page, 'Existing HDoc variables').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击Existing HDoc variables后', '031');

    await expect($menuItem(page, 'Generate Doc')).not.toHaveClass(/active/);
    await expect($menuItem(page, 'Existing HDoc variables')).toHaveClass(/active/);
    await expect(page).toHaveURL(/\/menu\/existing-hdoc-vars/);
    await ss(page, '选中切换确认', '031');
  });

  test('32-菜单项-刷新后选中状态保持', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '032');

    await $menuItem(page, 'Upload/Delete template').click();
    await page.waitForTimeout(1500);
    await ss(page, '点击后', '032');
    await expect(page).toHaveURL(/\/menu\/upload-delete-template/);
    await expect($menuItem(page, 'Upload/Delete template')).toHaveClass(/active/);

    await page.reload();
    await page.waitForSelector('.menu-root', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await ss(page, '刷新后', '032');

    await expect(page).toHaveURL(/\/menu\/upload-delete-template/);
    await expect($menuItem(page, 'Upload/Delete template')).toHaveClass(/active/);
    await ss(page, '刷新后选中状态确认', '032');
  });

  test('33-菜单项-多个菜单项路径不同', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '033');

    const clickableItems: { label: string; expectedPath: string }[] = [
      { label: 'Generate Doc', expectedPath: '/menu/generate-doc' },
      { label: 'Update user defined variables (rules)', expectedPath: '/menu/homologation-variables' },
      { label: 'Existing HDoc variables', expectedPath: '/menu/existing-hdoc-vars' },
      { label: 'Upload/Delete template', expectedPath: '/menu/upload-delete-template' },
      { label: 'List available templates', expectedPath: '/menu/list-templates' },
      { label: 'VPPS Vin plate', expectedPath: '/menu/vin-plate' },
      { label: 'AD/CA Change', expectedPath: '/menu/ad-ca-change' },
      { label: 'HDoc User Administration', expectedPath: '/menu/hdoc-user-admin' },
      { label: 'HDoc User Doc Administration', expectedPath: '/menu/hdoc-user-doc-admin' },
      { label: 'Search User', expectedPath: '/menu/search-user' },
      { label: 'User Guide', expectedPath: '/menu/guide-user' },
    ];

    const visitedUrls: string[] = [];
    for (const item of clickableItems) {
      await $menuItem(page, item.label).click();
      await page.waitForTimeout(1500);
      await ss(page, `点击${item.label}`, '033');
      const currentUrl = page.url();
      console.log(`  ${item.label} → ${currentUrl}`);
      expect(currentUrl).toContain(item.expectedPath);
      expect(visitedUrls).not.toContain(currentUrl);
      visitedUrls.push(currentUrl);
    }
    await ss(page, '所有路径确认', '033');
  });

  // ════════════════════════════════════════════
  // 安全性·会话管理 (TC34~36)
  // ════════════════════════════════════════════

  test('34-安全性-未登录直接访问菜单页', async ({ page }) => {
    // 先访问登录页建立 origin，再清除 localStorage（模拟未登录状态）
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => { localStorage.clear(); });
    await ss(page, 'localStorage清除后', '034');

    // 直接访问 /menu，路由守卫应拦截
    await page.goto(PAGE_URL + '/menu', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await ss(page, '直接访问/menu后', '034');

    // PrivateRoute 检测到无 token，重定向到 /login
    await expect(page).toHaveURL(/\/login/);
    await expect($loginContainer(page)).toBeVisible({ timeout: 10000 });
    await ss(page, '跳转登录页确认', '034');
  });

  test('35-安全性-Token失效处理', async ({ page }) => {
    // PrivateRoute 仅检查 token 存在性（非 null），不校验有效性
    // 因此即使设置无效 token，菜单仍可正常加载
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.setItem('token', 'invalid_token_12345');
      localStorage.setItem('username', 'testuser');
    });
    await ss(page, '设置无效token后', '035');

    await page.goto(PAGE_URL + '/menu', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await ss(page, '访问/menu后', '035');

    // 无效 token 仍通过 PrivateRoute（token 存在），菜单正常显示
    await expect($menuRoot(page)).toBeVisible({ timeout: 10000 });
    await expect($sidebar(page)).toBeVisible();
    await ss(page, 'Token失效处理', '035');
  });

  test('36-安全性-退出后不能通过浏览器返回访问菜单页', async ({ page }) => {
    await login(page);
    await page.waitForSelector('.menu-root', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await ss(page, '登录后', '036');

    await $logoutBtn(page).click();
    await page.waitForTimeout(1500);
    await ss(page, '退出后', '036');

    // 退出后显示登录表单
    await expect($loginContainer(page)).toBeVisible({ timeout: 10000 });

    // 浏览器后退：由于 logout 使用了 replace:true，后退到根路径（即登录页）
    await page.goBack();
    await page.waitForTimeout(2000);
    await ss(page, '后退后', '036');

    // 后退后仍被路由守卫拦截，停留在登录页
    await expect($loginContainer(page)).toBeVisible({ timeout: 10000 });
    await ss(page, '后退拦截确认', '036');
  });

  // ════════════════════════════════════════════
  // 异常处理 (TC37~38)
  // ════════════════════════════════════════════

  test('37-异常处理-路由不存在', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '037');

    // 直接用浏览器地址栏导航到不存在路由（全量加载，保留 localStorage token）
    await page.goto(PAGE_URL + '/menu/nonexistent-route', { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(3000);
    await ss(page, '访问不存在路由后', '037');

    const currentUrl = page.url();
    console.log(`  当前URL: ${currentUrl}`);

    // 左侧菜单栏正常显示
    await expect($sidebar(page)).toBeVisible({ timeout: 10000 });
    // 页面显示错误消息 Page not found.
    await expect(page.locator('body')).toContainText('Page not found.');
    // 无系统崩溃
    await ss(page, '路由不存在处理确认', '037');
  });

  test('38-异常处理-子路由内容区显示', async ({ page }) => {
    await loginAndGoToMenu(page);
    await ss(page, '登录后菜单页', '038');

    await page.goto(PAGE_URL + '/menu/generate-doc', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await ss(page, '访问generate-doc后', '038');

    await expect($sidebar(page)).toBeVisible();
    await expect($main(page)).toBeVisible();
    await expect($menuItem(page, 'Generate Doc')).toHaveClass(/active/);
    await ss(page, '子路由内容显示确认', '038');
  });

});
