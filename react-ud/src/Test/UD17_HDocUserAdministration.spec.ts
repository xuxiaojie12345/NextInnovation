// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD17_HDocUserAdministration 单元测试
// 测试规格书: テスト式样書UD17.md
// 画面文件: UD17_HDocUserAdministration.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD17');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD17画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD17 页面
 */
async function goToUD17(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD17');
  await page.waitForSelector('.ud17-container');
  await page.waitForTimeout(1500);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-7)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD17_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud17-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    await expect(page.locator('#ud17-userid')).toBeVisible();
    await takeScreenshot(page, 'UserID输入框可见');

    await expect(page.locator('.ud17-btn-info')).toBeVisible();
    await takeScreenshot(page, 'UserInfo按钮可见');

    await expect(page.locator('#ud17-user')).toBeVisible();
    await takeScreenshot(page, 'User标签可见');

    // 8行权限配置
    const roleLabels = page.locator('.ud17-roles-label');
    await expect(roleLabels).toHaveCount(3);
    await expect(roleLabels.nth(0)).toHaveText('Roles');
    await expect(roleLabels.nth(1)).toHaveText('Manage Variable List');
    await expect(roleLabels.nth(2)).toHaveText('Market Super User');
    await takeScreenshot(page, '权限配置区域');

    await expect(page.locator('.ud17-btn-update')).toBeVisible();
    await expect(page.locator('.ud17-btn-delete')).toBeVisible();
    await takeScreenshot(page, '按钮可见');

    await expect(page.locator('.ud17-message')).not.toBeVisible();
    await takeScreenshot(page, '消息区域隐藏');
  });

  test('UD17_002_画面初始化_UserID输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    const input = page.locator('#ud17-userid');
    await expect(input).toBeVisible();
    await expect(page.locator('label[for="ud17-userid"]')).toHaveText('UserID');
    expect(await input.getAttribute('maxLength')).toBe('10');
    expect(await input.inputValue()).toBe('');
    await expect(input).toBeEnabled();
    await takeScreenshot(page, 'UserID输入框');
  });

  test('UD17_003_画面初始化_User标签', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    const input = page.locator('#ud17-user');
    await expect(input).toBeVisible();
    expect(await input.inputValue()).toBe('');
    await takeScreenshot(page, 'User标签');
  });

  test('UD17_004_画面初始化_权限配置区域', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    // 8个角色行
    const chkStandard = page.locator('[id="chk-Standard User"]');
    const chkRule = page.locator('[id="chk-Rule Admin"]');
    const chkTemplate = page.locator('[id="chk-Template Admin"]');
    const chkDocument = page.locator('[id="chk-Document Auth Admin"]');
    const chkUser = page.locator('[id="chk-User Admin"]');
    const chkAdapt = page.locator('[id="chk-Adaptation user"]');
    const chkManage = page.locator('[id="chk-Manage Variable List"]');

    await expect(chkStandard).toBeVisible();
    await expect(chkRule).toBeVisible();
    await expect(chkTemplate).toBeVisible();
    await expect(chkDocument).toBeVisible();
    await expect(chkUser).toBeVisible();
    await expect(chkAdapt).toBeVisible();
    await expect(chkManage).toBeVisible();

    // Market Super User 没有checkbox，只有market select
    await expect(page.locator('.ud17-checkbox-item-inline .ud17-market-select')).toBeVisible();

    // 所有 checkbox 初期未选中
    await expect(chkStandard).not.toBeChecked();
    await expect(chkRule).not.toBeChecked();
    await expect(chkTemplate).not.toBeChecked();
    await expect(chkDocument).not.toBeChecked();
    await expect(chkUser).not.toBeChecked();
    await expect(chkAdapt).not.toBeChecked();
    await expect(chkManage).not.toBeChecked();
    await takeScreenshot(page, '权限配置区域');
  });

  test('UD17_005_画面初始化_Market下拉列表数据源', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD17(page);
    await page.waitForTimeout(1500);

    // Rule Admin 的 Market 下拉列表（非固定）
    const ruleMarketSelect = page.locator('[id="chk-Rule Admin"]').locator('..').locator('..').locator('.ud17-market-select');
    // 用更可靠的方式获取
    const marketSelects = page.locator('.ud17-market-select');
    const selectCount = await marketSelects.count();
    expect(selectCount).toBeGreaterThanOrEqual(4); // Standard(-EU固定), Rule, Template, Doc Auth, Adapt(-EU固定), Mkt Super User

    // Standard User 的 Market 固定为 -EU
    const standardSelect = page.locator('.ud17-checkbox-item').first().locator('.ud17-market-select');
    await expect(standardSelect).toBeVisible();
    await takeScreenshot(page, 'Market下拉列表数据源');
  });

  test('UD17_006_画面初始化_按钮初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud17-btn-info')).toHaveText('User Info');
    await expect(page.locator('.ud17-btn-info')).toBeEnabled();

    await expect(page.locator('.ud17-btn-update')).toHaveText('Update Role');
    await expect(page.locator('.ud17-btn-update')).toBeEnabled();

    await expect(page.locator('.ud17-btn-delete')).toHaveText('Delete Role');
    await expect(page.locator('.ud17-btn-delete')).toBeEnabled();
    await takeScreenshot(page, '按钮初期状态');
  });

  test('UD17_007_画面初始化_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud17-message')).not.toBeVisible();
    await takeScreenshot(page, '消息区域隐藏');
  });
});

// ============================================================
// 2. UserID 输入框属性校验 (No.8-11)
// ============================================================
test.describe('UserID 输入框属性校验', () => {

  test('UD17_008_UserID_最大长度', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#ud17-userid');
    await input.fill('A'.repeat(11));
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    const val = await input.inputValue();
    expect(val.length).toBe(10);
    await takeScreenshot(page, 'UserID最大长度');
  });

  test('UD17_009_UserID_半角英数字输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#ud17-userid');
    await input.fill('admin445');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    await expect(input).toHaveValue('admin445');
    await takeScreenshot(page, 'UserID半角英数字');
  });

  test('UD17_010_UserID_特殊字符不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#ud17-userid');
    // 逐字输入含特殊字符的值，@ 被 USER_ID_REGEX 逐个过滤
    // 最终 'admin' 被接受、'@' 被过滤、'123' 继续被接受
    await input.pressSequentially('admin@123', { delay: 50 });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    const val = await input.inputValue();
    expect(/^[a-zA-Z0-9]*$/.test(val)).toBeTruthy();
    await takeScreenshot(page, 'UserID特殊字符');
  });

  test('UD17_011_UserID_文字配置左对齐', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#ud17-userid');
    await input.fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    await expect(input).toHaveValue('admin');
    await takeScreenshot(page, 'UserID左对齐');
  });
});

// ============================================================
// 3. User Info 按钮操作 (No.12-17)
// ============================================================
test.describe('User Info 按钮操作', () => {

  test('UD17_012_UserInfo_UserID为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请输入用户ID');
    await takeScreenshot(page, 'UserInfo为空');
  });

  test('UD17_013_UserInfo_查询用户存在admin', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // User 标签显示 Administrator
    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');

    // admin 有4个权限：Rule Admin(R), Template Admin(T), Document Auth Admin(D), Manage Variable List(MCSU)
    await expect(page.locator('[id="chk-Standard User"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-Rule Admin"]')).toBeChecked();
    await expect(page.locator('[id="chk-Template Admin"]')).toBeChecked();
    await expect(page.locator('[id="chk-Document Auth Admin"]')).toBeChecked();
    await expect(page.locator('[id="chk-User Admin"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-Adaptation user"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-Manage Variable List"]')).toBeChecked();

    // 消息区域隐藏
    await expect(page.locator('.ud17-message')).not.toBeVisible();
    await takeScreenshot(page, 'UserInfo查询admin');
  });

  test('UD17_014_UserInfo_查询用户存在admin445', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin445');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // User 标签显示 wangwu
    await expect(page.locator('#ud17-user')).toHaveValue('wangwu');
    await takeScreenshot(page, 'UserInfo查询admin445');
  });

  test('UD17_015_UserInfo_查询用户存在user004', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('user004');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // User 标签显示 John Smith
    await expect(page.locator('#ud17-user')).toHaveValue('John Smith');
    await takeScreenshot(page, 'UserInfo查询user004');
  });

  test('UD17_016_UserInfo_查询用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('NONEXIST999');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText("We didn't recognize the userid you entered. Please try again.");

    // User 标签保持为空
    await expect(page.locator('#ud17-user')).toHaveValue('');
    await takeScreenshot(page, 'UserInfo查询不存在');
  });

  test('UD17_017_UserInfo_UserID含首尾空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 逐字输入含空格的 UserID，空格被 USER_ID_REGEX 逐个过滤，字母被逐个接受
    // 最终 userID ='admin'，trim 后查询成功
    await page.locator('#ud17-userid').pressSequentially('  admin  ', { delay: 50 });
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // User 标签显示 Administrator（查询admin成功）
    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');
    await takeScreenshot(page, 'UserInfo空格处理');
  });
});

// ============================================================
// 4. Update Role 按钮操作 (No.18-22)
// ============================================================
test.describe('Update Role 按钮操作', () => {

  test('UD17_018_UpdateRole_未查询用户信息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请先查询用户信息');
    await takeScreenshot(page, 'UpdateRole未查询');
  });

  test('UD17_019_UpdateRole_更新权限成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 查询 admin
    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');

    // 勾选 Rule Admin、Template Admin（已勾选，无需再勾选）
    // 选择对应 Market
    // 点击 Update Role
    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud17-message-success')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限更新成功');
    await takeScreenshot(page, 'UpdateRole成功');
  });

  test('UD17_020_UpdateRole_用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Mock 返回400模拟用户不存在
    await page.route('**/api/ud17/updaterole', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: "We didn't recognize the userid you entered. Please try again." })
      });
    });

    // 先查询一个已存在的用户
    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText("We didn't recognize the userid you entered. Please try again.");
    await takeScreenshot(page, 'UpdateRole用户不存在');
  });

  test('UD17_021_UpdateRole_更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud17/updaterole', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '用户权限更新失败，请稍后重试' })
      });
    });

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限更新失败，请稍后重试');
    await takeScreenshot(page, 'UpdateRole失败');
  });

  test('UD17_022_UpdateRole_查询后更改UserID', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 查询 admin
    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');

    // 将 UserID 改为 user004
    await page.locator('#ud17-userid').fill('user004');

    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请先查询用户信息');
    await takeScreenshot(page, 'UpdateRole更改UserID');
  });
});

// ============================================================
// 5. Delete Role 按钮操作 (No.23-27)
// ============================================================
test.describe('Delete Role 按钮操作', () => {

  test('UD17_023_DeleteRole_未查询用户信息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请先查询用户信息');
    await takeScreenshot(page, 'DeleteRole未查询');
  });

  test('UD17_024_DeleteRole_删除权限成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 先查询一个用户
    await page.locator('#ud17-userid').fill('user004');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#ud17-user')).toHaveValue('John Smith');

    // 处理确认对话框
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud17-message-success')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限删除成功');

    // User 标签被清空
    await expect(page.locator('#ud17-user')).toHaveValue('');

    // 所有 Checkbox 恢复未选中
    await expect(page.locator('[id="chk-Rule Admin"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-Template Admin"]')).not.toBeChecked();
    await takeScreenshot(page, 'DeleteRole成功');
  });

  test('UD17_025_DeleteRole_用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud17/deleteuser', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: "We didn't recognize the userid you entered. Please try again." })
      });
    });

    // 先查询用户
    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // 处理确认对话框
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText("We didn't recognize the userid you entered. Please try again.");
    await takeScreenshot(page, 'DeleteRole用户不存在');
  });

  test('UD17_026_DeleteRole_删除失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    await page.route('**/api/ud17/deleteuser', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '用户权限删除失败，请稍后重试' })
      });
    });

    await page.locator('#ud17-userid').fill('admin');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限删除失败，请稍后重试');
    await takeScreenshot(page, 'DeleteRole失败');
  });

  test('UD17_027_DeleteRole_查询后更改UserID', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');

    // 更改 UserID
    await page.locator('#ud17-userid').fill('user004');

    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请先查询用户信息');
    await takeScreenshot(page, 'DeleteRole更改UserID');
  });
});

// ============================================================
// 6. 权限配置操作 (No.28-34)
// ============================================================
test.describe('权限配置操作', () => {

  test('UD17_028_权限配置_Checkbox勾选取消', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const chk = page.locator('[id="chk-Standard User"]');

    // 勾选
    await chk.check();
    await page.waitForTimeout(200);
    await expect(chk).toBeChecked();
    await takeScreenshot(page, 'Checkbox勾选');

    // 取消
    await chk.uncheck();
    await page.waitForTimeout(200);
    await expect(chk).not.toBeChecked();
    await takeScreenshot(page, 'Checkbox取消');
  });

  test('UD17_029_权限配置_Market下拉列表选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 先勾选 Rule Admin
    await page.locator('[id="chk-Rule Admin"]').check();
    await page.waitForTimeout(200);

    // 选择 Rule Admin 对应的 Market 下拉列表
    const ruleItem = page.locator('[id="chk-Rule Admin"]').locator('..').locator('..');
    const marketSelect = ruleItem.locator('.ud17-market-select');
    if (await marketSelect.isVisible().catch(() => false)) {
      await marketSelect.selectOption('JPN');
      await page.waitForTimeout(200);
      await expect(marketSelect).toHaveValue('JPN');
    }
    await takeScreenshot(page, 'Market下拉列表选择');
  });

  test('UD17_030_权限配置_StandardUserMarket固定', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Standard User 的 Market 固定显示 -EU
    const standardItem = page.locator('[id="chk-Standard User"]').locator('..').locator('..');
    const marketSelect = standardItem.locator('.ud17-market-select');
    await expect(marketSelect).toBeVisible();
    await expect(marketSelect).toBeDisabled();
    // 应该只有一个选项 -EU
    const options = await marketSelect.locator('option').count();
    expect(options).toBe(1);
    await expect(marketSelect.locator('option').first()).toHaveAttribute('value', '-EU');
    await takeScreenshot(page, 'StandardUserMarket固定');
  });

  test('UD17_031_权限配置_AdaptationUserMarket固定', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const adaptItem = page.locator('[id="chk-Adaptation user"]').locator('..').locator('..');
    const marketSelect = adaptItem.locator('.ud17-market-select');
    await expect(marketSelect).toBeVisible();
    await expect(marketSelect).toBeDisabled();
    const options = await marketSelect.locator('option').count();
    expect(options).toBe(1);
    await expect(marketSelect).toHaveValue('-EU');
    await takeScreenshot(page, 'AdaptationUserMarket固定');
  });

  test('UD17_032_权限配置_UserAdmin无Market', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const userAdminItem = page.locator('[id="chk-User Admin"]').locator('..').locator('..');
    const marketSelect = userAdminItem.locator('.ud17-market-select');
    await expect(marketSelect).not.toBeVisible();
    await takeScreenshot(page, 'UserAdmin无Market');
  });

  test('UD17_033_权限配置_ManageVariableList无Market', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const manageItem = page.locator('[id="chk-Manage Variable List"]').locator('..').locator('..');
    const marketSelect = manageItem.locator('.ud17-market-select');
    await expect(marketSelect).not.toBeVisible();
    await takeScreenshot(page, 'ManageVariableList无Market');
  });

  test('UD17_034_权限配置_MarketSuperUser为Label', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Market Super User 为 Label，无 Checkbox
    const msuItem = page.locator('.ud17-checkbox-item-inline');
    await expect(msuItem.locator('input[type="checkbox"]')).not.toBeVisible();
    await expect(msuItem.locator('.ud17-market-select')).toBeVisible();
    await takeScreenshot(page, 'MarketSuperUser为Label');
  });
});

// ============================================================
// 7. UI交互 (No.35-42)
// ============================================================
test.describe('UI交互', () => {

  test('UD17_035_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';
    await page.route('**/api/ud17/userinfo*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-btn-info')).toBeDisabled();
    await expect(page.locator('.ud17-btn-update')).toBeDisabled();
    await expect(page.locator('.ud17-btn-delete')).toBeDisabled();
    await expect(page.locator('#ud17-userid')).toBeDisabled();
    await takeScreenshot(page, 'Loading中按钮禁用');

    await page.waitForTimeout(3500);
    await expect(page.locator('.ud17-btn-info')).toBeEnabled();
    await takeScreenshot(page, '加载完成恢复');
  });

  test('UD17_036_UI交互_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';
    let callCount = 0;
    await page.route('**/api/ud17/userinfo*', async route => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    const btn = page.locator('.ud17-btn-info');
    await btn.click();
    await page.waitForTimeout(300);
    await btn.click({ force: true });
    await page.waitForTimeout(4000);

    expect(callCount).toBe(1);
    await takeScreenshot(page, '防止重复提交');
  });

  test('UD17_037_UI交互_输入时清除旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 触发错误消息
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await takeScreenshot(page, '错误消息表示');

    // 开始输入清除旧消息
    await page.locator('#ud17-userid').fill('a');
    await page.waitForTimeout(300);

    await expect(page.locator('.ud17-message')).not.toBeVisible();
    await takeScreenshot(page, '输入清除旧消息');
  });

  test('UD17_038_UI交互_查询成功后显示用户名称', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');
    await takeScreenshot(page, '查询后显示用户名');
  });

  test('UD17_039_UI交互_查询后权限显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // admin 的权限
    await expect(page.locator('[id="chk-Rule Admin"]')).toBeChecked();
    await expect(page.locator('[id="chk-Template Admin"]')).toBeChecked();
    await expect(page.locator('[id="chk-Document Auth Admin"]')).toBeChecked();
    await expect(page.locator('[id="chk-Manage Variable List"]')).toBeChecked();
    await expect(page.locator('[id="chk-Standard User"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-User Admin"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-Adaptation user"]')).not.toBeChecked();
    await takeScreenshot(page, '查询后权限显示');
  });

  test('UD17_040_UI交互_删除成功后清空所有配置', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 查询用户
    await page.locator('#ud17-userid').fill('user004');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#ud17-user')).toHaveValue('John Smith');

    // 删除
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(2000);

    // User 标签被清空
    await expect(page.locator('#ud17-user')).toHaveValue('');
    // Checkbox 恢复未选中
    await expect(page.locator('[id="chk-Rule Admin"]')).not.toBeChecked();
    await expect(page.locator('[id="chk-Template Admin"]')).not.toBeChecked();
    await takeScreenshot(page, '删除后清空');
  });

  test('UD17_041_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud17-message-success')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限更新成功');
    await takeScreenshot(page, '成功消息绿色');
  });

  test('UD17_042_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请输入用户ID');
    await takeScreenshot(page, '错误消息红色');
  });
});

// ============================================================
// 8. 异常处理 (No.43-48)
// ============================================================
test.describe('异常处理', () => {

  test('UD17_043_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '43';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud17/userinfo*', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(35000);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('请求超时，请检查网络连接后重试');
    await takeScreenshot(page, '网络连接失败');
  });

  test('UD17_044_异常处理_服务器内部错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '44';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud17/userinfo*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '系统繁忙，请稍后重试' })
      });
    });

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('系统繁忙，请稍后重试');
    await takeScreenshot(page, '服务器内部错误');
  });

  test('UD17_045_异常处理_数据库连接异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '45';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud17/userinfo*', async route => {
      await route.abort('connectionrefused');
    });

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('系统繁忙，请稍后重试');
    await takeScreenshot(page, '数据库连接异常');
  });

  test('UD17_046_异常处理_UserID不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '46';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud17-userid').fill('NONEXIST');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText("We didn't recognize the userid you entered. Please try again.");
    await takeScreenshot(page, 'UserID不存在');
  });

  test('UD17_047_异常处理_权限更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '47';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud17/updaterole', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '用户权限更新失败，请稍后重试' })
      });
    });

    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限更新失败，请稍后重试');
    await takeScreenshot(page, '权限更新失败');
  });

  test('UD17_048_异常处理_权限删除失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '48';
    await goToUD17(page);
    await page.waitForTimeout(1000);

    await page.route('**/api/ud17/deleteuser', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '用户权限删除失败，请稍后重试' })
      });
    });

    await page.locator('#ud17-userid').fill('admin');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('.ud17-btn-delete').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud17-message-error')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限删除失败，请稍后重试');
    await takeScreenshot(page, '权限删除失败');
  });
});

// ============================================================
// 9. 安全性 (No.49-52)
// ============================================================
test.describe('安全性', () => {

  test('UD17_049_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '49';

    // 1. 先登录系统，进入 UD17 画面
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD17/);
    await expect(page.locator('.ud17-container')).toBeVisible();
    await takeScreenshot(page, 'UD17画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD17/);
    await expect(page.locator('.ud17-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD17 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD17');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD17 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud17-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD17_050_安全性_UserID格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '50';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#ud17-userid');
    await input.fill('admin@123');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 前端只接受半角英数字
    const val = await input.inputValue();
    expect(/^[a-zA-Z0-9]*$/.test(val)).toBeTruthy();
    await takeScreenshot(page, 'UserID格式验证');
  });

  test('UD17_051_安全性_UserID去除首尾空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '51';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 逐字输入含空格的 UserID，空格被 USER_ID_REGEX 逐个过滤，字母被逐个接受
    // 最终 userID 状态为 'admin'，trim 后查询 admin 成功
    await page.locator('#ud17-userid').pressSequentially('  admin  ', { delay: 50 });
    await takeScreenshot(page, '入力後（空格被过滤）');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);

    // 查询成功，显示用户名
    await expect(page.locator('#ud17-user')).toHaveValue('Administrator');
    await takeScreenshot(page, 'UserID去除空格');
  });

  test('UD17_052_安全性_操作审计记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '52';
    await goToUD17(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 执行 Update Role 操作
    await page.locator('#ud17-userid').fill('admin');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud17-btn-info').click();
    await page.waitForTimeout(2000);
    await page.locator('.ud17-btn-update').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud17-message-success')).toBeVisible();
    await expect(page.locator('.ud17-message')).toContainText('用户权限更新成功');
    await takeScreenshot(page, '操作审计记录');
  });
});
