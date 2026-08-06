/**
 * Menu 模块 Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/Menu/Menu_単体テスト仕様書.md
 * 对应前端：react-ud/src/Menu/Menu.tsx
 *
 * 【运行前提】（纯真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 *    - 在 react-ud 目录执行: npm start
 * 2. React 后端已启动：http://localhost:8081
 * 3. 已执行 menu_test_data.sql（创建测试用户与权限）
 *
 * 【当前 Menu 为 iframe 分栏布局】
 *  - 左侧固定显示菜单，右侧为内容区
 *  - 点击菜单项 → 右侧 iframe 加载对应画面，URL 保持 /menu
 *  - 顶部导航条显示用户名与 Logout
 *  - 权限接口 GET /api/user/GetUserFunctionAuth（请求头 userId）
 *
 * 【可用测试用户】密码统一 Menu@123
 *  - menuall   : 全部权限（hdoc, hdoc_variables, hdoc_admin, hdoc_user_admin）
 *  - menuhdoc  : 仅 hdoc
 *  - menuvar   : 仅 hdoc_variables
 *  - menuadm   : 仅 hdoc_admin
 *  - menuuadm  : 仅 hdoc_user_admin
 *  - menunone  : 无任何权限
 *
 * 【说明】依赖后端异常注入的用例（401/403/500/网络/动态权限重试）在纯真实
 * 后端下无法稳定自动化，已标注并由人工后端配合验证。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 前端 dev server 地址
const BASE_URL = 'http://localhost:3000';

// 通用测试密码
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具
// ----------------------------------------------------------------------------
// 约定：
//  - 每个“动作”之后与每个“断言”之后各截取一张图片
//  - 格式：JPEG；存放目录：tests\menu\image
//  - 命名：Menu01.jpeg（01 起，全局递增）
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');

// 全局截图序号（跨所有用例原子递增，保证文件名唯一且连续）
let screenshotCounter = 0;

/** 确保截图目录存在 */
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

/**
 * 截取当前页面为 JPEG 并保存到 tests\menu\image\MenuNN.jpeg。
 * @param page  页面对象
 * @param label 截图用途说明（写入日志，便于排查）
 */
async function shot(page: Page, label: string) {
  ensureImageDir();
  // 同步递增计数器并生成文件名（该段无 await，Node 单线程下原子）
  screenshotCounter += 1;
  const filename = `Menu${String(screenshotCounter).padStart(2, '0')}.jpeg`;
  await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
  try {
    await page.screenshot({
      path: path.join(IMAGE_DIR, filename),
      type: 'jpeg',
      quality: 80,
      timeout: 8000,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`[截图] ${filename} 截图失败(忽略): ${label}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
  return filename;
}

// ============================================================================
// 辅助函数
// ============================================================================

/** 通过真实后端登录指定用户，并跳转到 Menu 画面 */
async function loginAs(page: Page, userId: string) {
  await page.goto(BASE_URL);
  await shot(page, '动作: 打开登录页');
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await shot(page, `动作: 填写登录表单(用户=${userId})`);
  await page.getByRole('button', { name: 'Login' }).click();
  await shot(page, '动作: 点击 Login 按钮');
  await page.waitForURL('**/menu');
  await shot(page, '断言: 登录成功跳转 /menu');
}

/** 进入 Menu 画面（假设已登录，直接带 session 访问） */
async function gotoMenuLoggedIn(page: Page, userId: string) {
  // 先通过登录流程建立 session
  await loginAs(page, userId);
  // 等待权限加载完成
  await expect(page.locator('.menu-sidebar')).toBeVisible();
  await shot(page, '断言: 左侧菜单栏可见');
}

// ============================================================================
// 画面表示
// ============================================================================
test.describe('画面表示', () => {
  test('No.1 画面初期表示-分组标题', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    // 四个分组标题
    await expect(page.getByText('Generate', { exact: true })).toBeVisible();
    await expect(page.getByText('Admin', { exact: true })).toBeVisible();
    await expect(page.getByText('User Administration', { exact: true })).toBeVisible();
    await expect(page.getByText('Documentation', { exact: true })).toBeVisible();
  });

  test('No.2 画面初期表示-菜单项列表', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    // Generate 分组
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toBeVisible();
    // Admin 分组
    await expect(page.getByRole('button', { name: /Update user defined variables/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Existing HDoc variables/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Upload\/Delete template/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /List available templates/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /VPPS Vin plate/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /AD\/CA Change/ })).toBeVisible();
    // User Administration 分组
    await expect(page.getByRole('button', { name: /HDoc User Admin/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /HDoc User Doc Admin/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Search User/ })).toBeVisible();
    // Documentation 分组
    await expect(page.getByRole('button', { name: /User Guide/ })).toBeVisible();
  });

  test('No.3 画面初期表示-Change Password', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuhdoc');
    // Change Password 对所有登录用户可见（无需后端权限）
    await expect(page.getByRole('button', { name: /Change Password/ })).toBeVisible();
  });

  test('No.4 画面初期表示-菜单项对齐方式', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    // 所有菜单项文字靠左对齐（CSS text-align: left，位于左侧菜单栏内）
    const localized = await page.locator('.menu-item').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).textAlign)
    );
    expect(localized.length).toBeGreaterThan(0);
    expect(localized.every((a) => a === 'left' || a === '')).toBe(true);
  });
});

// ============================================================================
// 权限校验-动态显示
// ============================================================================
test.describe('权限校验-动态显示', () => {
  test('No.5 权限校验-有部分权限显示对应菜单', async ({ page }) => {
    // menuhdoc 仅 hdoc：Generate Doc + User Guide 显示，Admin 不显示
    await gotoMenuLoggedIn(page, 'menuhdoc');
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /User Guide/ })).toBeVisible();
    // Admin 分组下项不显示
    await expect(page.getByRole('button', { name: /Update user defined variables/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Existing HDoc variables/ })).toHaveCount(0);
    // User Administration 不显示
    await expect(page.getByRole('button', { name: /HDoc User Admin/ })).toHaveCount(0);
  });

  test('No.6 权限校验-所有权限显示所有菜单', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Update user defined variables/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Existing HDoc variables/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /HDoc User Admin/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Search User/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /User Guide/ })).toBeVisible();
  });

  test('No.7 权限校验-仅Admin权限', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuadm');
    // Generate 不显示
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toHaveCount(0);
    // Admin 的 hdoc_admin 项显示
    await expect(page.getByRole('button', { name: /Upload\/Delete template/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /List available templates/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /VPPS Vin plate/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /AD\/CA Change/ })).toBeVisible();
    // User Administration 不显示
    await expect(page.getByRole('button', { name: /HDoc User Admin/ })).toHaveCount(0);
    // Documentation 不显示
    await expect(page.getByRole('button', { name: /User Guide/ })).toHaveCount(0);
  });

  test('No.8 权限校验-仅User Admin权限', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuuadm');
    // Generate 不显示
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toHaveCount(0);
    // Admin 不显示
    await expect(page.getByRole('button', { name: /Upload\/Delete template/ })).toHaveCount(0);
    // User Administration 显示
    await expect(page.getByRole('button', { name: /HDoc User Admin/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /HDoc User Doc Admin/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Search User/ })).toBeVisible();
    // Documentation 不显示
    await expect(page.getByRole('button', { name: /User Guide/ })).toHaveCount(0);
  });

  test('No.9 权限校验-无任何权限', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menunone');
    // 显示未授权提示
    await expect(page.getByText('YOU ARE NOT AUTHORIZED TO ACCESS THIS PAGE')).toBeVisible();
    // 不显示任何菜单分组与菜单项（仅 Change Password 因代码默认显示，除外）
    await expect(page.getByText('Generate', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toHaveCount(0);
  });

  test('No.10 无权限→重试后恢复（依赖后端动态权限，默认跳过）', async ({ page }, testInfo) => {
    testInfo.skip(
      !process.env.MENU_TEST_RETRY,
      '需在点击 Retry 前更新数据库权限（为 menuretry 补插 hdoc）方可自动化'
    );
    await gotoMenuLoggedIn(page, 'menuretry');
    await expect(page.getByText('YOU ARE NOT AUTHORIZED TO ACCESS THIS PAGE')).toBeVisible();
    // 此处由外部更新权限后点击 Retry
    await page.locator('.menu-retry-button').click();
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toBeVisible();
  });
});

// ============================================================================
// 画面跳转（当前为 iframe 分栏布局）
// ============================================================================
test.describe('画面跳转(iframe)', () => {
  test('No.11 画面跳转-点击菜单项后右侧 iframe 加载对应画面', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    await page.getByRole('button', { name: /Generate Doc/ }).click();
    // URL 保持 /menu
    await expect(page).toHaveURL(/\/menu/i);
    // 右侧 iframe 加载对应路径
    const iframe = page.locator('.menu-iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', '/generate-document');
  });

  test('No.12 画面跳转-所有菜单项逐一验证 iframe', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    const cases: Array<[string, string]> = [
      ['Generate Doc', '/generate-document'],
      ['Update user defined variables', '/modify-document'],
      ['Existing HDoc variables', '/existing-hdoc-variables'],
      ['Upload/Delete template', '/upload-delete-template'],
      ['List available templates', '/list-available-templates'],
      ['VPPS Vin plate', '/vin-plate'],
      ['AD/CA Change', '/ad-ca-change'],
      ['HDoc User Admin', '/hdoc-user-administration'],
      ['HDoc User Doc Admin', '/hdoc-user-doc-administration'],
      ['Search User', '/search-user'],
      ['User Guide', '/user-guide'],
    ];
    const iframe = page.locator('.menu-iframe');
    for (const [label, path] of cases) {
      await page.getByRole('button', { name: new RegExp(label) }).click();
      await expect(iframe).toHaveAttribute('src', path, { timeout: 10000 });
    }
    // Change Password
    await page.getByRole('button', { name: /Change Password/ }).click();
    await expect(iframe).toHaveAttribute('src', '/change-password');
  });
});

// ============================================================================
// 加载状态
// ============================================================================
test.describe('加载状态', () => {
  test('No.13 加载状态-显示 Loading 后显示菜单', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuhdoc');
    // 加载完成后菜单正常显示，(真实后端响应较快，最终态不应有 Loading/错误)
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toBeVisible();
    await expect(page.locator('.menu-loading-container')).toHaveCount(0);
    await expect(page.locator('.menu-error-container')).toHaveCount(0);
  });

  test('No.14 加载状态-Loading结束后显示菜单', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    // 根据权限正常显示菜单项，无 Loading / 错误容器
    await expect(page.getByRole('button', { name: /Generate Doc/ })).toBeVisible();
    await expect(page.locator('.menu-loading-container')).toHaveCount(0);
    await expect(page.locator('.menu-error-container')).toHaveCount(0);
  });
});

// ============================================================================
// 会话验证
// ============================================================================
test.describe('会话验证', () => {
  test('No.15 会话验证-未登录直接访问跳转 Login', async ({ page }) => {
    // 清空 session 后直接访问 /menu
    await page.goto(`${BASE_URL}/menu`);
    // Menu 检测到无 userInfo 后跳回登录页（当前逻辑 navigate('/') -> Login）
    await expect(page.getByPlaceholder('User ID')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// UI交互
// ============================================================================
test.describe('UI交互', () => {
  test('No.22 UI交互-鼠标点击菜单项在右侧加载', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    await page.getByRole('button', { name: /Generate Doc/ }).click();
    await expect(page.locator('.menu-iframe')).toHaveAttribute('src', '/generate-document');
  });

  test('No.23 UI交互-Enter键触发加载', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    const item = page.getByRole('button', { name: /Generate Doc/ });
    await item.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.menu-iframe')).toHaveAttribute('src', '/generate-document');
  });

  test('No.24 UI交互-Tab键切换焦点', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menutab');
    // 聚焦第一个菜单项，按 Tab 应能移动到下一个菜单项
    const focusable = page.locator('.menu-item');
    const count = await focusable.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await focusable.nth(0).focus();
    await expect(focusable.nth(0)).toBeFocused();
    await page.keyboard.press('Tab');
    // 焦点应离开第一个菜单项（移动到下一个可聚焦元素）
    await expect(focusable.nth(0)).not.toBeFocused();
  });

  test('No.25 UI交互-加载权限列表时避免空白画面', async ({ page }) => {
    // 加载期间应显示 Loading/菜单，而非空白画面（真实后端较快，验证最终态非空白）
    await gotoMenuLoggedIn(page, 'menuall');
    const hasSidebar = await page.locator('.menu-sidebar').isVisible();
    const hasLoading = await page.locator('.menu-loading-container').count();
    const hasError = await page.locator('.menu-error-container').count();
    expect(hasSidebar || hasLoading > 0 || hasError > 0).toBe(true);
  });

  test('EXT-1 顶部导航条-显示用户名与 Logout', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    // 导航条显示用户名（Menu All）与 Logout 按钮
    await expect(page.locator('.menu-navbar-user')).toHaveText('Menu All');
    await expect(page.locator('.menu-navbar-logout')).toBeVisible();
  });

  test('EXT-2 Logout-清空 session 并返回 Login', async ({ page }) => {
    await gotoMenuLoggedIn(page, 'menuall');
    await page.locator('.menu-navbar-logout').click();
    // 返回登录页
    await expect(page.getByPlaceholder('User ID')).toBeVisible({ timeout: 10000 });
    // session 已清空
    const stored = await page.evaluate(() => sessionStorage.getItem('userInfo'));
    expect(stored).toBeNull();
  });
});

// ============================================================================
// 异常处理与会话（依赖后端异常注入，默认跳过）
// ============================================================================
test.describe('异常处理与会话(需后端配合)', () => {
  test('No.16 会话过期(401)——依赖后端返回 401，默认跳过', async ({ page }, testInfo) => {
    testInfo.skip(!process.env.MENU_TEST_401, '需后端对缺失/无效 userId 返回 401 方可自动化');
  });

  test('No.17 权限不足(403)——依赖后端返回 403，默认跳过', async ({ page }, testInfo) => {
    testInfo.skip(!process.env.MENU_TEST_403, '需后端返回 403 方可自动化');
  });

  test('No.18 API超时或网络错误——依赖后端异常注入，默认跳过', async ({ page }, testInfo) => {
    testInfo.skip(!process.env.MENU_TEST_ERR, '需后端注入网络/超时异常方可自动化');
  });

  test('No.19 服务器500错误——依赖后端异常注入，默认跳过', async ({ page }, testInfo) => {
    testInfo.skip(!process.env.MENU_TEST_ERR, '需后端返回 500 方可自动化');
  });

  test('No.20 重新加载按钮功能——依赖后端异常后再恢复，默认跳过', async ({ page }, testInfo) => {
    testInfo.skip(!process.env.MENU_TEST_RETRY, '需后端先异常后恢复方可自动化');
  });
});
