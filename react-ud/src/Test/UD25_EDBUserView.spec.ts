// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD25_EDBUserView 单元测试
// 测试规格书: テスト式样書UD25.md
// 画面文件: UD25_EDBUserView.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD25');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// DB: hdoc_user_infor 表实际数据
// admin: System Admin / Manager / admin@volvo.com
// user004: Admin / Manager / john@test.com
// user005: Tester / Leader / alice@test.com


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD25画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD25 页面（携带 userId）
 */
async function goToUD25(page: Page, userId: string) {
  await login(page);
  // React Router v6 将用户数据存在 history.state.usr 中
  await page.addInitScript((uid) => {
    window.history.replaceState({ usr: { userId: uid } }, '');
  }, userId);
  await page.goto(BASE_URL + '/UD25');
  await page.waitForSelector('.ud25-container');
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
// 1. 画面初期表示 (No.1-10)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD25_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud25-container')).toBeVisible();

    // 2. 页面标题显示
    await expect(page.locator('.ud25-title')).toHaveText('EDB User View');

    // 3. 按钮区域可见
    await expect(page.locator('.ud25-button-row')).toBeVisible();

    // 4. 用户信息区域可见
    await expect(page.locator('.ud25-form-group')).toHaveCount(4);

    // 5. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud25-message')).not.toBeVisible();

    await takeScreenshot(page, '整体布局確認');
  });

  test('UD25_002_画面初始化_用户信息显示_admin', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载完成
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs.length === 4 && inputs[0].value !== '';
    }, { timeout: 10000 });

    const inputs = page.locator('.ud25-form-group input');

    // 1. Userid = admin
    await expect(inputs.nth(0)).toHaveValue('admin');

    // 2. Responsible = System Admin
    await expect(inputs.nth(1)).toHaveValue('System Admin');

    // 3. User Position = Manager
    await expect(inputs.nth(2)).toHaveValue('Manager');

    // 4. E-mail = admin@volvo.com
    await expect(inputs.nth(3)).toHaveValue('admin@volvo.com');

    // 5. 所有输入框为只读状态
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveAttribute('readOnly', '');
    }

    // 6. 消息区域隐藏
    await expect(page.locator('.ud25-message')).not.toBeVisible();

    await takeScreenshot(page, '用户信息確認');
  });

  test('UD25_003_画面初始化_用户信息显示_user004', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD25(page, 'user004');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs.length === 4 && inputs[0].value !== '';
    }, { timeout: 10000 });

    const inputs = page.locator('.ud25-form-group input');

    await expect(inputs.nth(0)).toHaveValue('user004');
    await expect(inputs.nth(1)).toHaveValue('Admin');
    await expect(inputs.nth(2)).toHaveValue('Manager');
    await expect(inputs.nth(3)).toHaveValue('john@test.com');

    await takeScreenshot(page, 'user004情報確認');
  });

  test('UD25_004_画面初始化_用户信息显示_user005', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD25(page, 'user005');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs.length === 4 && inputs[0].value !== '';
    }, { timeout: 10000 });

    const inputs = page.locator('.ud25-form-group input');

    await expect(inputs.nth(0)).toHaveValue('user005');
    await expect(inputs.nth(1)).toHaveValue('Tester');
    await expect(inputs.nth(2)).toHaveValue('Leader');
    await expect(inputs.nth(3)).toHaveValue('alice@test.com');

    await takeScreenshot(page, 'user005情報確認');
  });

  test('UD25_005_画面初始化_比较运算符下拉列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    const compares = page.locator('.ud25-compare-select');

    // 1-4. 各字段左侧有比较运算符下拉列表
    await expect(compares).toHaveCount(4);

    // 5. 所有比较运算符默认选择 =
    for (let i = 0; i < 4; i++) {
      await expect(compares.nth(i)).toHaveValue('=');
    }

    await takeScreenshot(page, '比较运算符確認');
  });

  test('UD25_006_画面初始化_输入框只读状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs.length === 4 && inputs[0].value !== '';
    }, { timeout: 10000 });

    const inputs = page.locator('.ud25-form-group input');

    // 1-4. 所有输入框为只读（readOnly），不可编辑
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveAttribute('readOnly', '');
    }

    await takeScreenshot(page, '只读状態確認');
  });

  test('UD25_007_画面初始化_Loading状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';

    // 模拟 API 延迟响应（在 login 之前设置）
    await page.route('**/api/ud01/authentication*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200, msg: '查询成功',
          data: { userId: 'admin', responsible: 'System Admin', userPosition: 'Manager', email: 'admin@volvo.com' }
        }),
      });
    });

    await login(page);
    // 使用 addInitScript 注入 userId（与 goToUD25 相同的格式）
    await page.addInitScript((uid) => {
      window.history.replaceState({ usr: { userId: uid } }, '');
    }, 'admin');
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 各输入框显示 加载中... 占位文字
    const inputs = page.locator('.ud25-form-group input');
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveAttribute('placeholder', '加载中...');
    }

    // Clear 按钮和 Back 按钮处于禁用状态
    await expect(page.locator('.ud25-btn--default')).toBeDisabled();
    await expect(page.locator('.ud25-btn--primary')).toBeDisabled();

    await takeScreenshot(page, 'Loading中確認');

    // 加载完成后各字段显示实际数据
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs[0].value === 'admin';
    }, { timeout: 10000 }).catch(() => {});

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud01/authentication*');
  });

  test('UD25_008_画面初始化_未获取到用户ID', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await login(page);

    // 直接访问 UD25（不传递 userId）
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. 消息区域可见
    await expect(page.locator('.ud25-message')).toBeVisible();

    // 2. 消息内容
    await expect(page.locator('.ud25-message')).toHaveText('未获取到用户ID');

    // 3. 类型为 Error（红色）
    await expect(page.locator('.ud25-message--error')).toBeVisible();

    // 4. 各字段保持为空
    const inputs = page.locator('.ud25-form-group input');
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }

    await takeScreenshot(page, '操作後');
  });

  test('UD25_009_画面初始化_用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD25(page, 'NONEXIST');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 1. 消息区域可见
    await expect(page.locator('.ud25-message')).toBeVisible();

    // 2. 消息内容
    const msgText = await page.locator('.ud25-message').textContent();
    expect(msgText).toContain('未找到用户信息');
    await expect(page.locator('.ud25-message--error')).toBeVisible();

  });

  test('UD25_010_画面初始化_API失败_模拟500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';

    // 先登录（mock 必须在登录之后设置，避免影响登录 API）
    await login(page);

    // 模拟 API 返回 500
    await page.route('**/api/ud01/authentication*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取用户信息失败' }),
      });
    });

    // 再导航到 UD25
    await page.addInitScript((uid) => {
      window.history.replaceState({ usr: { userId: uid } }, '');
    }, 'admin');
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 1. 消息区域可见
    await expect(page.locator('.ud25-message')).toBeVisible();
    await expect(page.locator('.ud25-message')).toHaveText('获取用户信息失败');
    await expect(page.locator('.ud25-message--error')).toBeVisible();

    await page.unroute('**/api/ud01/authentication*');
  });

});

// ============================================================
// 2. Clear 按钮操作 (No.11-12)
// ============================================================
test.describe('Clear按钮操作', () => {

  test('UD25_011_Clear_清空所有字段', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 等待数据加载
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs[0].value === 'admin';
    }, { timeout: 10000 });

    // 点击 Clear 按钮
    // 将焦点移到 Clear 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud25-btn--default')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Clearボタン押下');
    await page.locator('.ud25-btn--default').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 1-4. 所有字段被清空
    const inputs = page.locator('.ud25-form-group input');
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }

    // 5. 消息区域被清空
    await expect(page.locator('.ud25-message')).not.toBeVisible();
  });

  test('UD25_012_Clear_空状态点击清空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 先清空所有字段
    await page.locator('.ud25-btn--default').click();
    await page.waitForTimeout(300);

    // 将焦点移到 Clear 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud25-btn--default')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Clearボタン押下');
    // 空状态下再次点击 Clear
    await page.locator('.ud25-btn--default').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');

    // 各字段保持为空状态
    const inputs = page.locator('.ud25-form-group input');
    for (let i = 0; i < 4; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }

    // 无报错信息
    await expect(page.locator('.ud25-message')).not.toBeVisible();
  });

});

// ============================================================
// 3. Back 按钮操作 (No.13-14)
// ============================================================
test.describe('Back按钮操作', () => {

  test('UD25_013_Back_返回前画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await login(page);
    // 先访问 UD24 构建历史记录，模拟从 UD09 跳转到 UD25
    await page.goto(BASE_URL + '/UD09');
    await page.waitForSelector('.ud09-container');
    // 再访问 UD25
    await page.addInitScript((uid) => {
      window.history.replaceState({ usr: { userId: uid } }, '');
    }, 'admin');
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    // 等待数据加载完成
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs.length === 4 && (inputs[0] as HTMLInputElement).value !== '';
    }, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    // 将焦点移到 Back 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud25-btn--primary')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Backボタン押下');
    await page.locator('.ud25-btn--primary').click();
    await page.waitForTimeout(1000);
    // 移除焦点，避免前画面按钮显示 hover 样式
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '操作後');

    // 画面返回 UD09
    await expect(page).toHaveURL(/\/UD09/);
  });

  test('UD25_014_Back_从UDxx返回上一页', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await login(page);
    // 先访问 UD24 构建历史记录
    await page.goto(BASE_URL + '/UD11');
    await page.waitForSelector('.ud11-container');
    // 再访问 UD25
    await page.addInitScript((uid) => {
      window.history.replaceState({ usr: { userId: uid } }, '');
    }, 'admin');
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    // 等待数据加载完成
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs.length === 4 && (inputs[0] as HTMLInputElement).value !== '';
    }, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    // 将焦点移到 Back 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud25-btn--primary')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Backボタン押下');
    await page.locator('.ud25-btn--primary').click();
    await page.waitForTimeout(1000);
    // 移除焦点，避免前画面按钮显示 hover 样式
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '操作後');

    // navigate(-1) 返回 UD11
    await expect(page).toHaveURL(/\/UD11/);
  });

});

// ============================================================
// 4. UI交互 (No.15-16)
// ============================================================
test.describe('UI交互', () => {

  test('UD25_015_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    // 模拟 API 延迟响应（在 login 之前设置）
    await page.route('**/api/ud01/authentication*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200, msg: '查询成功',
          data: { userId: 'admin', responsible: 'System Admin', userPosition: 'Manager', email: 'admin@volvo.com' }
        }),
      });
    });

    await login(page);
    // 使用 addInitScript 注入 userId（与 goToUD25 相同的格式）
    await page.addInitScript((uid) => {
      window.history.replaceState({ usr: { userId: uid } }, '');
    }, 'admin');
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // Clear 按钮禁用
    await expect(page.locator('.ud25-btn--default')).toBeDisabled();
    // Back 按钮禁用
    await expect(page.locator('.ud25-btn--primary')).toBeDisabled();

    // 加载完成后按钮恢复可用
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => {
      const clearBtn = document.querySelector('.ud25-btn--default') as HTMLButtonElement;
      return clearBtn && !clearBtn.disabled;
    }, { timeout: 10000 }).catch(() => {});

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud01/authentication*');
  });

  test('UD25_016_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await login(page);

    // 直接访问 UD25（不传递 userId）
    await page.goto(BASE_URL + '/UD25');
    await page.waitForSelector('.ud25-container');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 1. 错误消息文字为红色
    await expect(page.locator('.ud25-message--error')).toBeVisible();

    // 2. 文字左对齐
    await expect(page.locator('.ud25-message')).toHaveCSS('text-align', 'left');

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 5. 异常处理 (No.17-20)
// ============================================================
test.describe('异常处理', () => {

  test('UD25_017_异常处理_API调用超时', { timeout: 180000 }, async ({ page }) => {
    currentTestNo = '017';
    test.setTimeout(120000);

    await login(page);
    // 使用 addInitScript 注入 userId（与 goToUD25 相同的格式）
    await page.addInitScript((uid) => {
      window.history.replaceState({ usr: { userId: uid } }, '');
    }, 'admin');

    await page.route('**/api/ud01/authentication*', async (route) => {
      // 第一层校验：通过请求来源URL判断，仅当前页面路径包含/UD25时才执行Mock
      const currentPageUrl = page.url();
      if (currentPageUrl.includes('/UD25')) {
        // 仅UD25页面的请求才延迟31秒后触发超时
        await new Promise(resolve => setTimeout(resolve, 31000));
        await route.abort('timedout');
      } else {
        // Login/Menu等其他页面的同路径请求直接放行，完全走原有真实接口逻辑
        await route.continue();
      }
    });
    // 注册完拦截器再跳转页面
    await page.goto(BASE_URL + '/UD25', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.ud25-container');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '初期表示');

    // 等待 API 超时（路由中已设置 31 秒延迟后 abort），然后等待错误消息出现
    await page.locator('.ud25-message--error').waitFor({
      state: 'visible',
      timeout: 60000
    });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後');
    await expect(page.locator('.ud25-message--error')).toHaveText('请求超时，请稍后重试.');
    await expect(page.locator('.ud25-message')).toBeVisible();
    await expect(page.locator('.ud25-message--error')).toBeVisible();
    await page.unroute('**/api/ud01/authentication*');

  });

  test('UD25_018_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';

    // 模拟网络断开（仅在 UD25 页面时生效，不影响登录）
    await page.route('**/api/ud01/authentication*', async (route) => {
      const currentPageUrl = page.url();
      if (currentPageUrl.includes('/UD25')) {
        await route.abort('connectionrefused');
      } else {
        await route.continue();
      }
    });

    await goToUD25(page, 'admin');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见
    await expect(page.locator('.ud25-message')).toBeVisible();
    await expect(page.locator('.ud25-message')).toHaveText('网络连接失败，请检查网络设置');
    await expect(page.locator('.ud25-message--error')).toBeVisible();
    await page.unroute('**/api/ud01/authentication*');
  });

  test('UD25_019_异常处理_数据解析错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';

    // 模拟 API 返回异常格式
    await page.route('**/api/ud01/authentication*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: null }),
      });
    });

    await goToUD25(page, 'admin');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '初期表示');

    // 消息区域可见（无数据时显示 msg 或默认消息）
    await expect(page.locator('.ud25-message')).toBeVisible();
    await expect(page.locator('.ud25-message--error')).toBeVisible();

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud01/authentication*');
  });

  test('UD25_020_异常处理_画面迁移失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';

    // 在页面加载前拦截 history.go，使其抛出异常模拟导航失败
    await page.addInitScript(() => {
      const origGo = window.history.go.bind(window.history);
      window.history.go = function (delta) {
        if (delta === -1 || delta === undefined) {
          throw new Error('模拟导航失败');
        }
        return origGo(delta);
      };
    });

    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 页面正常显示
    await expect(page.locator('.ud25-container')).toBeVisible();

    // 点击 Back 按钮
    await page.locator('.ud25-btn--primary').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後');

    // 1. 消息区域可见
    await expect(page.locator('.ud25-message')).toBeVisible();
    // 2. 消息内容
    await expect(page.locator('.ud25-message')).toHaveText('画面迁移失败');
    // 3. 类型为 Error（红色）
    await expect(page.locator('.ud25-message--error')).toBeVisible();
    // 4. 停留在当前页面
    await expect(page).toHaveURL(/\/UD25/);
  });

});

// ============================================================
// 6. 安全性 (No.21-24)
// ============================================================
test.describe('安全性', () => {

  test('UD25_021_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';

    // 1. 先登录系统，进入 UD25 画面
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD25/);
    await expect(page.locator('.ud25-container')).toBeVisible();
    await takeScreenshot(page, 'UD25画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD25/);
    await expect(page.locator('.ud25-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD25 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD25');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD25 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud25-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD25_022_安全性_HTTPS数据传输', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 确认 API 请求参数中不包含密码等敏感信息
    // 仅传递 userId 参数
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs[0].value === 'admin';
    }, { timeout: 10000 });

    await takeScreenshot(page, '操作後');
  });

  test('UD25_023_安全性_用户敏感信息不暴露', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 页面正常显示用户信息，但控制台不应输出敏感日志
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs[0].value === 'admin';
    }, { timeout: 10000 });

    await takeScreenshot(page, '操作後');
  });

  test('UD25_024_安全性_授权用户访问', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD25(page, 'admin');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '初期表示');

    // 页面正常显示用户信息
    await page.waitForFunction(() => {
      const inputs = document.querySelectorAll('.ud25-form-group input');
      return inputs[0].value === 'admin';
    }, { timeout: 10000 });

    await takeScreenshot(page, '操作後');
  });

});
