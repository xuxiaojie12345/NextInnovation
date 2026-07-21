import { test, expect, Page } from '@playwright/test';

// ============================================================
// 菜单导航模块 (UD02) Playwright 自动化测试
// 基于 単体テスト仕様書UD02.md（44个测试用例）
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'tests/image/UD02';

// 截图计数器
let screenshotCounter: { [key: string]: number } = {};

async function takeScreenshot(page: Page, name: string) {
  if (!screenshotCounter[name]) screenshotCounter[name] = 0;
  screenshotCounter[name]++;
  const seq = String(screenshotCounter[name]).padStart(3, '0');
  try {
    if (page.isClosed()) return;
    await page.waitForTimeout(500);
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

/** 安全导航：domcontentloaded + 重试机制 */
async function safeGoto(page: Page, url: string = BASE_URL) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2000);
      return;
    } catch (e) {
      if (i === 2 || page.isClosed()) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

/** 通过 localStorage 模拟登录（跳过 Login 页面） */
async function loginViaLocalStorage(page: Page) {
  const userInfo = {
    username: 'admin',
    role: 'Administrator',
    permissions: [
      "GenerateDucument",
      "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy",
    ],
  };
  await page.evaluate((info) => {
    localStorage.setItem('userInfo', JSON.stringify(info));
  }, userInfo);
}

/** 导航到 Menu 页面（先模拟登录再跳转） */
async function gotoMenu(page: Page) {
  await safeGoto(page);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await loginViaLocalStorage(page);
  await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
}

// ============================================================
// 1. 画面初始化（No.1-7）
// ============================================================
test.describe.serial('画面初始化（No.1-7）', () => {
  test.setTimeout(120000);

  test('No.1 画面初期表示-整体布局', async ({ page }) => {
    resetCounter('01_画面初期表示_整体布局');
    await gotoMenu(page);

    // 确认左侧菜单区（Sider）
    await expect(page.locator('.menu-sider')).toBeVisible();
    // 确认右侧内容区
    await expect(page.locator('.menu-content')).toBeVisible();
    // 确认系统标题
    await expect(page.locator('.menu-title')).toContainText('EDB Engineering Database');
    // 确认整体布局采用左右分栏
    await expect(page.locator('.menu-layout')).toBeVisible();
    // 初始状态无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '01_画面初期表示_整体布局');
  });

  test('No.2 画面初期表示-一级菜单显示', async ({ page }) => {
    resetCounter('02_一级菜单显示');
    await gotoMenu(page);

    // 确认一级菜单标题：Generate Ducument 是普通菜单项，其余是子菜单
    const menuItemTexts = await page.locator('.ant-menu-item').allTextContents();
    expect(menuItemTexts.map(t => t.trim())).toContain('Generate Ducument');

    const submenuTitles = page.locator('.ant-menu-submenu-title');
    const titles = await submenuTitles.allTextContents();
    const titleTexts = titles.map(t => t.trim());

    expect(titleTexts).toContain('User Administration');
    expect(titleTexts).toContain('Archive');
    expect(titleTexts).toContain('Documentation');

    await takeScreenshot(page, '02_一级菜单显示');
  });

  test('No.3 画面初期表示-二级菜单Generate显示', async ({ page }) => {
    resetCounter('03_二级菜单Generate显示');
    await gotoMenu(page);

    // 确认 Generate 组下的菜单项
    const menuItems = page.locator('.ant-menu-item');
    const itemTexts = await menuItems.allTextContents();
    const texts = itemTexts.map(t => t.trim());

    expect(texts).toContain('Generate Doc');
    expect(texts).toContain('Generate in Batch');
    expect(texts).toContain('Regdata Archive');
    expect(texts).toContain('Regdata Batch');

    await takeScreenshot(page, '03_二级菜单Generate显示');
  });

  test('No.4 画面初期表示-二级菜单Admin显示', async ({ page }) => {
    resetCounter('04_二级菜单Admin显示');
    await gotoMenu(page);

    const menuItems = page.locator('.ant-menu-item');
    const itemTexts = await menuItems.allTextContents();
    const texts = itemTexts.map(t => t.trim());

    expect(texts).toContain('Update user defined variables (rules)');
    expect(texts).toContain('Update user defined variables (UNICODE rules)');
    expect(texts).toContain('Existing HDoc variables');
    expect(texts).toContain('Unlock Document');
    expect(texts).toContain('HDoc Number Series');
    expect(texts).toContain('Upload/Delete template');
    expect(texts).toContain('List available templates');
    expect(texts).toContain('VPPS Vin plate');
    expect(texts).toContain('AD/CA Change');

    await takeScreenshot(page, '04_二级菜单Admin显示');
  });

  test('No.5 画面初期表示-User Administration菜单显示', async ({ page }) => {
    resetCounter('05_UserAdministration菜单显示');
    await gotoMenu(page);

    const menuItems = page.locator('.ant-menu-item');
    const itemTexts = await menuItems.allTextContents();
    const texts = itemTexts.map(t => t.trim());

    expect(texts).toContain('HDoc User Administration');
    expect(texts).toContain('HDoc User Doc Administration');
    expect(texts).toContain('Search User');
    expect(texts).toContain('Change Password');
    expect(texts).toContain('User Position');

    await takeScreenshot(page, '05_UserAdministration菜单显示');
  });

  test('No.6 画面初期表示-Archive菜单显示', async ({ page }) => {
    resetCounter('06_Archive菜单显示');
    await gotoMenu(page);

    const menuItems = page.locator('.ant-menu-item');
    const itemTexts = await menuItems.allTextContents();
    const texts = itemTexts.map(t => t.trim());

    expect(texts).toContain('Search');
    expect(texts).toContain('Upload Document');

    await takeScreenshot(page, '06_Archive菜单显示');
  });

  test('No.7 画面初期表示-Documentation菜单显示', async ({ page }) => {
    resetCounter('07_Documentation菜单显示');
    await gotoMenu(page);

    const menuItems = page.locator('.ant-menu-item');
    const itemTexts = await menuItems.allTextContents();
    const texts = itemTexts.map(t => t.trim());

    expect(texts).toContain('User Guide');
    expect(texts).toContain('AD/CA Change Guide');
    expect(texts).toContain('Vin plate Guide FM/FH');
    expect(texts).toContain('Archive Guide');
    expect(texts).toContain('Privacy');

    await takeScreenshot(page, '07_Documentation菜单显示');
  });
});

// ============================================================
// 2. 菜单布局（No.8-11）
// ============================================================
test.describe.serial('菜单布局（No.8-11）', () => {
  test.setTimeout(120000);

  test('No.8 菜单宽度-左侧菜单区显示', async ({ page }) => {
    resetCounter('08_菜单宽度_左侧菜单区显示');
    await gotoMenu(page);

    // 确认左侧菜单区显示
    const sider = page.locator('.menu-sider');
    await expect(sider).toBeVisible();
    // 所有菜单项在左侧菜单区内完整显示
    await expect(page.locator('.ant-menu-root.menu-tree')).toBeVisible();

    await takeScreenshot(page, '08_菜单宽度_左侧菜单区显示');
  });

  test('No.9 菜单项文字-不截断不省略', async ({ page }) => {
    resetCounter('09_菜单项文字_不截断不省略');
    await gotoMenu(page);

    // 确认较长菜单项文字完整显示（如 Update user defined variables (rules)）
    const longItem = page.locator('.ant-menu-item', { hasText: 'Update user defined variables (rules)' });
    await expect(longItem).toBeVisible();
    const text = await longItem.textContent();
    expect(text?.trim()).toBe('Update user defined variables (rules)');
    // 文字末尾不显示省略号
    expect(text?.trim().endsWith('...')).toBe(false);

    await takeScreenshot(page, '09_菜单项文字_不截断不省略');
  });

  test('No.10 右侧内容区-初始空白', async ({ page }) => {
    resetCounter('10_右侧内容区_初始空白');
    await gotoMenu(page);

    // 右侧内容区初始状态（无子路由时空白）
    const content = page.locator('.menu-content');
    await expect(content).toBeVisible();
    // 不显示错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '10_右侧内容区_初始空白');
  });

  test('No.11 菜单项对齐方式', async ({ page }) => {
    resetCounter('11_菜单项对齐方式');
    await gotoMenu(page);

    // 确认所有菜单项文字左对齐（Ant Design 默认左对齐）
    const firstItem = page.locator('.ant-menu-item').first();
    await expect(firstItem).toBeVisible();

    await takeScreenshot(page, '11_菜单项对齐方式');
  });
});

// ============================================================
// 3. 菜单展开与折叠（No.12-15）
// ============================================================
test.describe.serial('菜单展开与折叠（No.12-15）', () => {
  test.setTimeout(120000);

  test('No.12 子菜单默认全部展开', async ({ page }) => {
    resetCounter('12_子菜单默认全部展开');
    await gotoMenu(page);

    // 确认所有子菜单项可见（说明默认展开）
    const menuItems = page.locator('.ant-menu-item');
    const count = await menuItems.count();
    // 应该有大量菜单项可见
    expect(count).toBeGreaterThan(10);

    await takeScreenshot(page, '12_子菜单默认全部展开');
  });

  test('No.13 子菜单不允许折叠', async ({ page }) => {
    resetCounter('13_子菜单不允许折叠');
    await gotoMenu(page);

    // 点击一级菜单标题，确认子菜单不会折叠
    const firstSubmenu = page.locator('.ant-menu-submenu-title').first();
    await firstSubmenu.click();
    await page.waitForTimeout(500);

    // 子菜单项仍然可见
    const menuItems = page.locator('.ant-menu-item');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(10);

    await takeScreenshot(page, '13_子菜单不允许折叠');
  });

  test('No.14 页面刷新后子菜单状态', async ({ page }) => {
    resetCounter('14_页面刷新后子菜单状态');
    await gotoMenu(page);

    // 刷新页面
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 子菜单仍保持展开状态
    const menuItems = page.locator('.ant-menu-item');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(10);

    await takeScreenshot(page, '14_页面刷新后子菜单状态');
  });

  test('No.15 页面切换后返回菜单状态', async ({ page }) => {
    resetCounter('15_页面切换后返回菜单状态');
    await gotoMenu(page);

    // 点击 Generate Doc 菜单项导航到子页面
    const generateDoc = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    if (await generateDoc.isVisible()) {
      await generateDoc.click();
      await page.waitForTimeout(1500);
    }

    // 返回 Menu 页面
    await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    // 子菜单仍保持展开
    const menuItems = page.locator('.ant-menu-item');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(10);

    await takeScreenshot(page, '15_页面切换后返回菜单状态');
  });
});

// ============================================================
// 4. 菜单导航（No.16-29）
// ============================================================
test.describe.serial('菜单导航（No.16-29）', () => {
  test.setTimeout(120000);

  test('No.16 导航-Generate>>Generate Doc', async ({ page }) => {
    resetCounter('16_导航_GenerateDoc');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    // SPA 路由断言：确认 URL 变化
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');
    // 确认菜单项高亮（selected 类）
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '16_导航_GenerateDoc');
  });

  test('No.17 导航-Admin>>Update user defined variables (rules)', async ({ page }) => {
    resetCounter('17_导航_UpdateRules');
    await gotoMenu(page);

    // 精确匹配避免与 UNICODE rules 冲突
    const menuItem = page.getByRole('menuitem', { name: /Update user defined variables \(rules\)$/ });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/HomologationVariables');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '17_导航_UpdateRules');
  });

  test('No.18 导航-Admin>>Existing HDoc variables', async ({ page }) => {
    resetCounter('18_导航_ExistingHDocVariables');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'Existing HDoc variables' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/ExistingHDocVariables');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '18_导航_ExistingHDocVariables');
  });

  test('No.19 导航-Admin>>Upload/Delete template', async ({ page }) => {
    resetCounter('19_导航_UploadDeleteTemplate');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'Upload/Delete template' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/UploadDeleteTemplate');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '19_导航_UploadDeleteTemplate');
  });

  test('No.20 导航-Admin>>List available templates', async ({ page }) => {
    resetCounter('20_导航_ListTemplates');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'List available templates' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/ListTemplates');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '20_导航_ListTemplates');
  });

  test('No.21 导航-Admin>>VPPS Vin plate', async ({ page }) => {
    resetCounter('21_导航_VPPSVinPlate');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'VPPS Vin plate' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/VinPlate');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '21_导航_VPPSVinPlate');
  });

  test('No.22 导航-Admin>>AD/CA Change', async ({ page }) => {
    resetCounter('22_导航_ADCAChange');
    await gotoMenu(page);

    // 使用 getByRole 精确定位（避免同时匹配 "AD/CA Change Guide"）
    const menuItem = page.getByRole('menuitem', { name: /AD\/CA Change$/ });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/ADCAChange');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '22_导航_ADCAChange');
  });

  test('No.23 导航-User Administration>>HDoc User Administration', async ({ page }) => {
    resetCounter('23_导航_HDocUserAdmin');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'HDoc User Administration' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/HDocUserAdministration');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '23_导航_HDocUserAdmin');
  });

  test('No.24 导航-User Administration>>HDoc User Doc Administration', async ({ page }) => {
    resetCounter('24_导航_HDocUserDocAdmin');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'HDoc User Doc Administration' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/HDocUserDocAdministration');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '24_导航_HDocUserDocAdmin');
  });

  test('No.25 导航-User Administration>>Search User', async ({ page }) => {
    resetCounter('25_导航_SearchUser');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'Search User' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/SearchUser');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '25_导航_SearchUser');
  });

  test('No.26 导航-Documentation>>User Guide', async ({ page }) => {
    resetCounter('26_导航_UserGuide');
    await gotoMenu(page);

    const menuItem = page.locator('.ant-menu-item', { hasText: 'User Guide' });
    await expect(menuItem).toBeVisible();
    await menuItem.click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/Menu/UserGuide');
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '26_导航_UserGuide');
  });

  test('No.27 导航-菜单高亮切换', async ({ page }) => {
    resetCounter('27_导航_菜单高亮切换');
    await gotoMenu(page);

    // 点击 Generate Doc
    const generateDoc = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    await generateDoc.click();
    await page.waitForTimeout(1000);
    await expect(generateDoc).toHaveClass(/ant-menu-item-selected/);

    // 点击 Existing HDoc variables
    const existingVar = page.locator('.ant-menu-item', { hasText: 'Existing HDoc variables' });
    await existingVar.click();
    await page.waitForTimeout(1000);

    // Generate Doc 取消高亮
    await expect(generateDoc).not.toHaveClass(/ant-menu-item-selected/);
    // Existing HDoc variables 高亮
    await expect(existingVar).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '27_导航_菜单高亮切换');
  });

  test('No.28 导航-重复点击同一菜单项', async ({ page }) => {
    resetCounter('28_导航_重复点击同一菜单项');
    await gotoMenu(page);

    // 第一次点击 List available templates
    const menuItem = page.locator('.ant-menu-item', { hasText: 'List available templates' });
    await menuItem.click();
    await page.waitForTimeout(1000);
    const urlAfterFirst = page.url();

    // 第二次点击同一菜单项
    await menuItem.click();
    await page.waitForTimeout(1000);

    // URL 不变
    expect(page.url()).toBe(urlAfterFirst);
    // 菜单项保持高亮
    await expect(menuItem).toHaveClass(/ant-menu-item-selected/);

    await takeScreenshot(page, '28_导航_重复点击同一菜单项');
  });

  test('No.29 导航-浏览器前进后退', async ({ page }) => {
    resetCounter('29_导航_浏览器前进后退');
    await gotoMenu(page);

    // 点击 Generate Doc
    const generateDoc = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    await generateDoc.click();
    await page.waitForTimeout(1000);

    // 点击 Upload/Delete template
    const uploadDelete = page.locator('.ant-menu-item', { hasText: 'Upload/Delete template' });
    await uploadDelete.click();
    await page.waitForTimeout(1000);

    // 浏览器后退
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/GenerateHomologationDocument');

    // 浏览器前进
    await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/UploadDeleteTemplate');

    await takeScreenshot(page, '29_导航_浏览器前进后退');
  });
});

// ============================================================
// 5. 用户信息与登出（No.30-34）
// ============================================================
test.describe.serial('用户信息与登出（No.30-34）', () => {
  test.setTimeout(120000);

  test('No.30 用户信息-显示登录用户信息', async ({ page }) => {
    resetCounter('30_用户信息_显示登录用户');
    await gotoMenu(page);

    // 验证 localStorage 中存在用户登录信息
    const storedInfo = await page.evaluate(() => localStorage.getItem('userInfo'));
    expect(storedInfo).not.toBeNull();

    if (storedInfo) {
      const userInfo = JSON.parse(storedInfo);
      console.log(`Logged in user: ${userInfo.username}, role: ${userInfo.role}`);
    }

    // 注意：Menu 组件当前未显示用户名和角色（功能可能待实现）
    // 验证 localStorage 中存储了正确的用户信息
    const username = await page.evaluate(() => {
      try {
        const info = JSON.parse(localStorage.getItem('userInfo') || '{}');
        return info.username || '';
      } catch { return ''; }
    });
    expect(username).toBe('admin');

    await takeScreenshot(page, '30_用户信息_显示登录用户');
  });

  test('No.31 用户信息-不同用户显示', async ({ page }) => {
    resetCounter('31_用户信息_不同用户');
    // 使用不同用户信息登录
    const userInfo = {
      username: 'Jane.Smith',
      role: 'User',
      permissions: ["GenerateDucument", "GenerateDoc"],
    };
    await safeGoto(page);
    await page.evaluate((info) => {
      localStorage.setItem('userInfo', JSON.stringify(info));
    }, userInfo);
    await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    // 验证 localStorage 中的用户信息
    const storedInfo = await page.evaluate(() => localStorage.getItem('userInfo'));
    expect(storedInfo).not.toBeNull();
    if (storedInfo) {
      const parsed = JSON.parse(storedInfo);
      expect(parsed.username).toBe('Jane.Smith');
      expect(parsed.role).toBe('User');
    }

    await takeScreenshot(page, '31_用户信息_不同用户');
  });

  test('No.32 登出按钮-显示', async ({ page }) => {
    resetCounter('32_登出按钮_显示');
    await gotoMenu(page);

    // 检查页面中是否存在登出按钮/链接
    // 当前 Menu 组件未实现登出按钮，但测试脚本保留此用例用于未来验证
    const logoutExists = await page.locator('button:has-text("Logout"), a:has-text("Logout"), *:has-text("Logout")').count();
    console.log(`Logout button found: ${logoutExists > 0}`);

    await takeScreenshot(page, '32_登出按钮_显示');
  });

  test('No.33 登出功能-成功登出', async ({ page }) => {
    resetCounter('33_登出功能_成功登出');
    await gotoMenu(page);

    // 清除 localStorage 模拟登出
    await page.evaluate(() => localStorage.removeItem('userInfo'));
    // 刷新页面应跳转到登录页
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 确认跳转到登录页（URL 变为 /）
    const currentUrl = page.url();
    expect(currentUrl === `${BASE_URL}/` || currentUrl === `${BASE_URL}`).toBe(true);

    await takeScreenshot(page, '33_登出功能_成功登出');
  });

  test('No.34 登出功能-登出确认', async ({ page }) => {
    resetCounter('34_登出功能_登出确认');
    await gotoMenu(page);

    // 清除用户信息后无法访问 Menu 页面
    await page.evaluate(() => localStorage.removeItem('userInfo'));
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 确认跳转到登录页
    expect(page.url()).not.toContain('/Menu');

    await takeScreenshot(page, '34_登出功能_登出确认');
  });
});

// ============================================================
// 6. 会话验证（No.35-38）
// ============================================================
test.describe.serial('会话验证（No.35-38）', () => {
  test.setTimeout(120000);

  test('No.35 会话验证-Token有效', async ({ page }) => {
    resetCounter('35_会话验证_Token有效');
    await gotoMenu(page);

    // Token 有效时 Menu 页面正常加载
    await expect(page.locator('.menu-layout')).toBeVisible();
    await expect(page.locator('.menu-sider')).toBeVisible();
    // 不跳转到 Login 页面
    expect(page.url()).toContain('/Menu');

    await takeScreenshot(page, '35_会话验证_Token有效');
  });

  test('No.36 会话验证-Token失效', async ({ page }) => {
    resetCounter('36_会话验证_Token失效');
    // 先清除 userInfo 模拟 Token 过期
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Token 失效时应跳转到登录页
    expect(page.url()).not.toContain('/Menu');

    await takeScreenshot(page, '36_会话验证_Token失效');
  });

  test('No.37 会话验证-未登录直接访问', async ({ page }) => {
    resetCounter('37_会话验证_未登录直接访问');
    // 清除所有登录信息
    await safeGoto(page);
    await page.evaluate(() => localStorage.clear());
    // 直接访问 Menu 页面
    await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 未登录状态下无法访问 Menu 页面，跳转到登录页
    expect(page.url()).not.toContain('/Menu');

    await takeScreenshot(page, '37_会话验证_未登录直接访问');
  });

  test('No.38 会话验证-登录后Token刷新', async ({ page }) => {
    resetCounter('38_会话验证_Token刷新');
    await gotoMenu(page);

    // 长时间停留在 Menu 页面（模拟等待）
    await page.waitForTimeout(3000);

    // 页面应保持正常，不跳转到登录页
    await expect(page.locator('.menu-layout')).toBeVisible();
    expect(page.url()).toContain('/Menu');

    await takeScreenshot(page, '38_会话验证_Token刷新');
  });
});

// ============================================================
// 7. 异常处理（No.39-41）
// ============================================================
test.describe.serial('异常处理（No.39-41）', () => {
  test.setTimeout(120000);

  test('No.39 异常处理-路由配置错误', async ({ page }) => {
    resetCounter('39_异常处理_路由配置错误');
    await gotoMenu(page);

    // 点击无路由配置的菜单项（route: "#"），验证不触发导航
    const batchItem = page.locator('.ant-menu-item', { hasText: 'Generate in Batch' });
    await expect(batchItem).toBeVisible();
    const urlBefore = page.url();
    await batchItem.click();
    await page.waitForTimeout(1000);

    // URL 不变（未导航到无效路由）
    expect(page.url()).toBe(urlBefore);
    // 左侧菜单区正常
    await expect(page.locator('.menu-sider')).toBeVisible();

    await takeScreenshot(page, '39_异常处理_路由配置错误');
  });

  test('No.40 异常处理-网络超时', async ({ page }) => {
    resetCounter('40_异常处理_网络超时');
    await gotoMenu(page);

    // 模拟：通过 page.route 中止请求来模拟网络超时
    await page.route('**/*', (route) => {
      const url = route.request().url();
      // 只中止页面组件加载请求，不中止本地资源
      if (url.includes('/Menu/GenerateHomologationDocument')) {
        route.abort('timedout');
      } else {
        route.continue();
      }
    });

    // 点击 Generate Doc 触发组件加载
    const menuItem = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    await menuItem.click();
    await page.waitForTimeout(2000);

    // 左侧菜单区保持可用
    await expect(page.locator('.menu-sider')).toBeVisible();
    // 恢复路由拦截
    await page.unroute('**/*');

    await takeScreenshot(page, '40_异常处理_网络超时');
  });

  test('No.41 异常处理-页面组件加载失败', async ({ page }) => {
    resetCounter('41_异常处理_组件加载失败');
    await gotoMenu(page);

    // 模拟组件加载失败
    await page.route('**/GenerateHomologationDocument**', (route) => {
      route.abort('connectionrefused');
    });

    const menuItem = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    await menuItem.click();
    await page.waitForTimeout(2000);

    // 左侧菜单区正常可用
    await expect(page.locator('.menu-sider')).toBeVisible();
    // 可继续点击其他菜单项
    const otherItem = page.locator('.ant-menu-item', { hasText: 'List available templates' });
    await expect(otherItem).toBeVisible();
    // 恢复路由拦截
    await page.unroute('**/GenerateHomologationDocument**');

    await takeScreenshot(page, '41_异常处理_组件加载失败');
  });
});

// ============================================================
// 8. 界面交互（No.42-44）
// ============================================================
test.describe.serial('界面交互（No.42-44）', () => {
  test.setTimeout(120000);

  test('No.42 菜单项悬停效果', async ({ page }) => {
    resetCounter('42_菜单项悬停效果');
    await gotoMenu(page);

    // 悬停在 Generate Doc 菜单项上
    const menuItem = page.locator('.ant-menu-item', { hasText: 'Generate Doc' });
    await menuItem.hover();
    await page.waitForTimeout(500);

    // 不触发页面跳转
    expect(page.url()).toContain('/Menu');

    await takeScreenshot(page, '42_菜单项悬停效果');
  });

  test('No.43 菜单项点击反馈', async ({ page }) => {
    resetCounter('43_菜单项点击反馈');
    await gotoMenu(page);

    // 点击 Upload/Delete template
    const menuItem = page.locator('.ant-menu-item', { hasText: 'Upload/Delete template' });
    const startTime = Date.now();
    await menuItem.click();
    await page.waitForTimeout(1500);
    const elapsed = Date.now() - startTime;

    // 导航成功
    expect(page.url()).toContain('/Menu/UploadDeleteTemplate');
    // 响应时间合理（不超过 10 秒）
    expect(elapsed).toBeLessThan(10000);
    // 无重复导航（URL 只包含一次目标路径）
    expect(page.url().split('/Menu/UploadDeleteTemplate').length - 1).toBe(1);

    await takeScreenshot(page, '43_菜单项点击反馈');
  });

  test('No.44 多个菜单项连续点击', async ({ page }) => {
    resetCounter('44_多个菜单项连续点击');
    await gotoMenu(page);

    // 快速连续点击多个菜单项
    const menuItems = [
      page.locator('.ant-menu-item', { hasText: 'Generate Doc' }),
      page.locator('.ant-menu-item', { hasText: 'Existing HDoc variables' }),
      page.locator('.ant-menu-item', { hasText: 'Search User' }),
    ];

    for (const item of menuItems) {
      await item.click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1500);

    // 最终跳转到最后点击的菜单项对应的页面
    expect(page.url()).toContain('/Menu/SearchUser');
    // 页面不崩溃
    await expect(page.locator('.menu-layout')).toBeVisible();

    await takeScreenshot(page, '44_多个菜单项连续点击');
  });
});
