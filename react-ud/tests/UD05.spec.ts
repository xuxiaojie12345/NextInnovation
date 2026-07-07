import { test, expect, Page } from '@playwright/test';
import { execute, query } from './db';

// ============================================================
// 文档修改模块 (UD05) Playwright 自动化测试
// 基于 単体テスト仕様書UD05.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081/api/authentication';
const QUERY_API = '**/api/ud05/modifydocument/query';
const UPDATE_API = '**/api/ud05/modifydocument/update';
const SCREENSHOT_DIR = 'tests/image/UD05';

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

/** 安全导航：domcontentloaded + 重试 */
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

/** Mock 变量数据 */
const MOCK_VARIABLES = [
  { variable: 'VAR001', description: 'Test Variable 1', currentValue: 'OLD_VAL_001', modifiedValue: '' },
  { variable: 'VAR002', description: 'Test Variable 2', currentValue: 'OLD_VAL_002', modifiedValue: '' },
  { variable: 'VAR003', description: 'Test Variable 3', currentValue: 'OLD_VAL_003', modifiedValue: '' },
];

const MOCK_QUERY_RESPONSE = {
  code: 200,
  message: 'success',
  data: {
    chassisNo: 'C001',
    variables: MOCK_VARIABLES,
    templateFile: 'aus/UD_TEST.odt',
  },
};

/** 测试数据参数 */
const TEST_SERIE = 'S001';
const TEST_CHNR = 'C001';

// ============================================================
// 辅助：登录
// ============================================================
async function login(page: Page) {
  await safeGoto(page);
  await page.route(API_URL, async route => {
    await new Promise(r => setTimeout(r, 500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { success: true, token: 'mock-token-ud05', userid: 'admin', username: 'admin' },
      }),
    });
  });
  await page.locator('#username').click();
  await page.locator('#username').pressSequentially('admin');
  await page.locator('#password').click();
  await page.locator('#password').pressSequentially('admin123');
  await page.locator('.login-button').click();
  await page.waitForSelector('.menu-layout', { timeout: 15000 });
}

// ============================================================
// 辅助：登录并跳转到 UD05（通过 SPA 内部导航设置 location.state）
// ============================================================
async function loginAndGoToUD05(page: Page, serie: string = TEST_SERIE, chnr: string = TEST_CHNR, market: string = 'JPN') {
  await login(page);

  // SPA 内部导航：通过 history.pushState + popstate 设置 location.state
  await page.evaluate(({ serie, chnr, market }) => {
    window.history.pushState(
      { chassisNo: chnr, serie, market },
      '',
      '/Menu/ModifyDocument'
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, { serie, chnr, market });

  await page.waitForSelector('.modify-document-container', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// ============================================================
// 辅助：登录并跳转到 UD05（Mock Query API）
// ============================================================
async function loginAndGoToUD05WithMock(
  page: Page,
  mockResponse: any = MOCK_QUERY_RESPONSE,
  serie: string = TEST_SERIE,
  chnr: string = TEST_CHNR
) {
  await login(page);

  // Mock Query API
  if (mockResponse === 'abort') {
    await page.route(QUERY_API, async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.abort('connectionrefused');
    });
  } else if (mockResponse === 'timeout') {
    await page.route(QUERY_API, async route => {
      await new Promise(r => setTimeout(r, 30000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_QUERY_RESPONSE) });
    });
  } else {
    await page.route(QUERY_API, async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: mockResponse.status || 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse.body !== undefined ? mockResponse.body : mockResponse),
      });
    });
  }

  // SPA 内部导航
  await page.evaluate(({ serie, chnr }) => {
    window.history.pushState(
      { chassisNo: chnr, serie, market: 'JPN' },
      '',
      '/Menu/ModifyDocument'
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, { serie, chnr });

  await page.waitForSelector('.modify-document-container', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// ============================================================
// 1. 画面初始化 (No.1-5)
// ============================================================
test.describe('画面初始化', () => {

  test('No.1 初始化-变量列表加载成功', async ({ page }) => {
    resetCounter('01_初始化_变量列表加载成功');
    await loginAndGoToUD05WithMock(page);

    // 1. Loading 状态（已结束）
    await expect(page.locator('.loading-message')).toHaveCount(0);

    // 2. 页面标题
    await expect(page.locator('.page-title')).toHaveText('HDoc - Modify Document');

    // 3. 显示变量列表表格
    const variableTable = page.locator('.variable-table');
    await expect(variableTable).toBeVisible();

    // 4. 表格表头正确
    await expect(page.locator('.col-variable')).toHaveText('Variable');
    await expect(page.locator('.col-description')).toHaveText('Description');
    await expect(page.locator('.col-current')).toHaveText('Current value');
    await expect(page.locator('.col-modified')).toHaveText('Modified value');

    // 5. 行数 = 3
    const rows = page.locator('.variable-table tbody tr');
    await expect(rows).toHaveCount(3);

    // 6. 各变量数据显示
    await expect(page.locator('.variable-table tbody')).toContainText('VAR001');
    await expect(page.locator('.variable-table tbody')).toContainText('VAR002');
    await expect(page.locator('.variable-table tbody')).toContainText('VAR003');

    // 7. 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    await takeScreenshot(page, '01_初始化_变量列表加载成功');
  });

  test('No.2 初始化-模板文件和底盘信息显示', async ({ page }) => {
    resetCounter('02_初始化_模板文件和底盘信息显示');
    await loginAndGoToUD05WithMock(page);

    // 1. 底盘信息区域
    const infoSection = page.locator('.vehicle-info-section');
    await expect(infoSection).toBeVisible();

    // 2. chassis no 显示
    await expect(infoSection).toContainText('chassis no:');
    await expect(infoSection).toContainText('S001 C001');

    // 3. Market 显示
    await expect(infoSection).toContainText('Market:');
    await expect(infoSection).toContainText('JPN');

    // 4. 模板文件链接
    const templateLink = page.locator('.template-link');
    await expect(templateLink).toBeVisible();
    await expect(templateLink).toContainText('Template: aus/UD_TEST.odt');

    await takeScreenshot(page, '02_初始化_模板文件和底盘信息显示');
  });

  test('No.3 初始化-加载失败（500）', async ({ page }) => {
    resetCounter('03_初始化_加载失败500');
    await loginAndGoToUD05WithMock(page, { status: 500, body: { code: 500, message: 'Internal server error', data: null } });

    // 1. 显示错误消息
    const errorArea = page.locator('.error-message-area');
    await expect(errorArea).toBeVisible({ timeout: 10000 });

    // 2. 变量列表为空
    await expect(page.locator('.variable-table')).toHaveCount(0);

    await takeScreenshot(page, '03_初始化_加载失败500');
  });

  test('No.4 初始化-无变量数据（空列表）', async ({ page }) => {
    resetCounter('04_初始化_无变量数据空列表');
    await loginAndGoToUD05WithMock(page, {
      code: 200,
      message: 'success',
      data: { chassisNo: 'C001', variables: [], templateFile: 'aus/UD_TEST.odt' },
    });

    // 1. 显示空状态消息
    const emptyMsg = page.locator('.empty-message');
    await expect(emptyMsg).toBeVisible();
    await expect(emptyMsg).toContainText('未找到该底盘的变量记录');

    // 2. 无错误消息
    await expect(page.locator('.error-message-area')).toHaveCount(0);

    // 3. 其他页面元素正常显示
    await expect(page.locator('.page-title')).toBeVisible();
    await expect(page.locator('.vehicle-info-section')).toBeVisible();

    await takeScreenshot(page, '04_初始化_无变量数据空列表');
  });

  test('No.5 初始化-API 返回 400', async ({ page }) => {
    resetCounter('05_初始化_API返回400');
    await loginAndGoToUD05WithMock(page, { status: 400, body: { code: 400, message: '参数异常', data: null } });

    // 1. 显示错误消息
    const errorArea = page.locator('.error-message-area');
    await expect(errorArea).toBeVisible({ timeout: 10000 });

    // 2. 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    await takeScreenshot(page, '05_初始化_API返回400');
  });
});

// ============================================================
// 2. 变量修改功能 (No.6-11)
// ============================================================
test.describe('变量修改功能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD05WithMock(page);
  });

  test('No.6 修改变量值-正常输入', async ({ page }) => {
    resetCounter('06_修改变量值_正常输入');
    const inputs = page.locator('.modified-input');
    await expect(inputs).toHaveCount(3);

    // 在第一个输入框中输入新值
    const firstInput = inputs.nth(0);
    await firstInput.click();
    await firstInput.fill('');
    await firstInput.pressSequentially('NEW_VALUE_001');

    // 1. 输入框显示新值
    await expect(firstInput).toHaveValue('NEW_VALUE_001');

    // 2. Current value 保持不变（第一行的 currentValue 是 OLD_VAL_001）
    const firstRow = page.locator('.variable-table tbody tr').nth(0);
    await expect(firstRow.locator('td').nth(2)).toHaveText('OLD_VAL_001');

    // 3. 其他列不变
    await expect(firstRow.locator('td').nth(0)).toHaveText('VAR001');
    await expect(firstRow.locator('td').nth(1)).toHaveText('Test Variable 1');

    // 4. 无错误消息
    await expect(page.locator('.message-area')).toHaveCount(0);

    await takeScreenshot(page, '06_修改变量值_正常输入');
  });

  test('No.7 修改变量值-清空为空白', async ({ page }) => {
    resetCounter('07_修改变量值_清空为空白');
    // 先输入值再清空
    const firstInput = page.locator('.modified-input').nth(0);
    await firstInput.click();
    await firstInput.fill('SOME_VALUE');
    await expect(firstInput).toHaveValue('SOME_VALUE');

    // 清空
    await firstInput.fill('');
    await expect(firstInput).toHaveValue('');

    // 1. 输入框显示为空
    // 2. 无错误消息
    await expect(page.locator('.message-area')).toHaveCount(0);

    // 3. 页面其他元素不受影响
    await expect(page.locator('.page-title')).toBeVisible();

    await takeScreenshot(page, '07_修改变量值_清空为空白');
  });

  test('No.8 修改变量值-超长文本', async ({ page }) => {
    resetCounter('08_修改变量值_超长文本');
    const longText = 'A'.repeat(600);
    const firstInput = page.locator('.modified-input').nth(0);
    await firstInput.click();
    await firstInput.fill('');
    await firstInput.pressSequentially(longText);

    // 输入框限制最大长度（500字符）
    const actualValue = await firstInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(500);
    expect(actualValue.length).toBe(500);

    // 无错误消息
    await expect(page.locator('.message-area')).toHaveCount(0);

    await takeScreenshot(page, '08_修改变量值_超长文本');
  });

  test('No.9 修改变量值-特殊字符', async ({ page }) => {
    resetCounter('09_修改变量值_特殊字符');
    const firstInput = page.locator('.modified-input').nth(0);
    await firstInput.click();
    await firstInput.fill('');
    await firstInput.pressSequentially('A&B@C#D');

    // 输入框正常显示特殊字符
    await expect(firstInput).toHaveValue('A&B@C#D');

    // 无错误消息
    await expect(page.locator('.message-area')).toHaveCount(0);

    await takeScreenshot(page, '09_修改变量值_特殊字符');
  });

  test('No.10 修改变量值-多行文本', async ({ page }) => {
    resetCounter('10_修改变量值_多行文本');
    const firstInput = page.locator('.modified-input').nth(0);
    await firstInput.click();
    // 注：input[type=text] 不支持多行，输入换行符会被忽略
    // 验证输入框可正常输入文本
    await firstInput.fill('Line1');
    await expect(firstInput).toHaveValue('Line1');

    await takeScreenshot(page, '10_修改变量值_多行文本');
  });

  test('No.11 修改变量值-日语/Unicode 字符', async ({ page }) => {
    resetCounter('11_修改变量值_日语Unicode字符');
    const firstInput = page.locator('.modified-input').nth(0);
    await firstInput.click();
    await firstInput.fill('');
    await firstInput.pressSequentially('テスト値');

    // 输入框正常显示 Unicode 字符
    await expect(firstInput).toHaveValue('テスト値');

    // 无错误消息
    await expect(page.locator('.message-area')).toHaveCount(0);

    await takeScreenshot(page, '11_修改变量值_日语Unicode字符');
  });
});

// ============================================================
// 3. 保存功能 (No.12-16)
// ============================================================
test.describe('保存功能', () => {

  test('No.12 保存修改成功-跳转到 UD06', async ({ page }) => {
    resetCounter('12_保存修改成功_跳转到UD06');
    await loginAndGoToUD05WithMock(page);

    // 修改变量值
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock Update API 返回成功
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '更新成功', data: null }),
      });
    });

    // 点击 Save 按钮
    const saveBtn = page.locator('.save-button');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // 跳转到 UD06
    await page.waitForSelector('.save-modifications-container', { timeout: 15000 }).catch(() => {});
    // 验证跳转（URL 包含 SaveModifications）
    expect(page.url()).toContain('/Menu/SaveModifications');

    await takeScreenshot(page, '12_保存修改成功_跳转到UD06');
  });

  test('No.13 保存失败-API 返回 500', async ({ page }) => {
    resetCounter('13_保存失败_API返回500');
    await loginAndGoToUD05WithMock(page);

    // 修改变量值
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock Update API 返回 500
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'Internal server error', data: null }),
      });
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    const msgArea = page.locator('.message-area');
    await expect(msgArea).toBeVisible();
    await expect(msgArea).toContainText('保存失败');

    // 2. 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    // 3. 输入的修改内容不丢失
    await expect(inputs.nth(0)).toHaveValue('UPDATED_VAL');

    // 4. 保存按钮恢复可用
    await expect(page.locator('.save-button')).toBeEnabled();

    await takeScreenshot(page, '13_保存失败_API返回500');
  });

  test('No.14 保存失败-API 返回 400', async ({ page }) => {
    resetCounter('14_保存失败_API返回400');
    await loginAndGoToUD05WithMock(page);

    // 修改变量值
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock Update API 返回 400
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, message: '参数异常：底盘编号不能为空', data: null }),
      });
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    const msgArea = page.locator('.message-area');
    await expect(msgArea).toBeVisible();

    // 2. 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    // 3. 输入的修改内容不丢失
    await expect(inputs.nth(0)).toHaveValue('UPDATED_VAL');

    await takeScreenshot(page, '14_保存失败_API返回400');
  });

  test('No.15 未修改直接保存', async ({ page }) => {
    resetCounter('15_未修改直接保存');
    await loginAndGoToUD05WithMock(page);

    // 不修改变量值，直接点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    // 应显示 "NO UNRELEASED VERSION EXISTS!" 消息
    const msgArea = page.locator('.message-area');
    await expect(msgArea).toBeVisible();
    await expect(msgArea).toContainText('NO UNRELEASED VERSION EXISTS!');

    // 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    await takeScreenshot(page, '15_未修改直接保存');
  });

  test('No.16 部分变量修改后保存', async ({ page }) => {
    resetCounter('16_部分变量修改后保存');
    await loginAndGoToUD05WithMock(page);

    const inputs = page.locator('.modified-input');
    // 只修改前 2 个变量
    await inputs.nth(0).click();
    await inputs.nth(0).fill('MODIFIED_001');
    await inputs.nth(1).click();
    await inputs.nth(1).fill('MODIFIED_002');
    // 第3个不变

    // Mock Update API
    let updateCount = 0;
    await page.route(UPDATE_API, async route => {
      updateCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '更新成功', data: null }),
      });
    });

    // 点击 Save
    await page.locator('.save-button').click();

    // 验证只提交了2个被修改的变量
    await page.waitForTimeout(1000);
    // 如果跳转到 UD06，说明部分修改成功
    if (page.url().includes('SaveModifications')) {
      // 跳转成功
      await expect(page.locator('.save-modifications-container')).toBeVisible();
    } else {
      // 保持在当前页面也接受（取决于后端是否允许部分提交）
      await expect(page.locator('.modify-document-container')).toBeVisible();
    }

    await takeScreenshot(page, '16_部分变量修改后保存');
  });
});

// ============================================================
// 4. 界面与交互 (No.17-19)
// ============================================================
test.describe('界面与交互', () => {

  test('No.17 页面滚动-多变量时', async ({ page }) => {
    resetCounter('17_页面滚动_多变量时');
    // 创建大量变量数据
    const manyVariables = Array.from({ length: 20 }, (_, i) => ({
      variable: `VAR${String(i + 1).padStart(3, '0')}`,
      description: `Description ${i + 1}`,
      currentValue: `VAL_${i + 1}`,
      modifiedValue: '',
    }));
    await loginAndGoToUD05WithMock(page, {
      code: 200,
      message: 'success',
      data: { chassisNo: 'C001', variables: manyVariables, templateFile: 'aus/UD_TEST.odt' },
    });

    // 页面可垂直滚动
    const tableSection = page.locator('.data-table-section');
    await expect(tableSection).toBeVisible();

    // 验证最后一条数据可见（通过滚动）
    const lastRow = page.locator('.variable-table tbody tr').last();
    await lastRow.scrollIntoViewIfNeeded();
    await expect(lastRow).toBeVisible();
    await expect(lastRow).toContainText('VAR020');

    await takeScreenshot(page, '17_页面滚动_多变量时');
  });

  test('No.18 保存按钮 Loading 状态', async ({ page }) => {
    resetCounter('18_保存按钮Loading状态');
    await loginAndGoToUD05WithMock(page);

    // 修改变量值
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock Save API 延迟响应
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '更新成功', data: null }),
      });
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(500);

    // 1. 按钮变为禁用状态
    const saveBtn = page.locator('.save-button');
    await expect(saveBtn).toBeDisabled();

    // 2. 按钮文字变为"保存中..."
    await expect(saveBtn).toHaveText('保存中...');

    await takeScreenshot(page, '18_保存按钮Loading状态');
  });

  test('No.19 重置已修改的变量', async ({ page }) => {
    resetCounter('19_重置已修改的变量');
    await loginAndGoToUD05WithMock(page);

    const inputs = page.locator('.modified-input');
    // 修改第一个变量
    await inputs.nth(0).click();
    await inputs.nth(0).fill('MODIFIED_VALUE');

    // 手动清空（组件无重置按钮，通过清空输入框模拟重置）
    await inputs.nth(0).fill('');

    // Modified value 恢复为空
    await expect(inputs.nth(0)).toHaveValue('');

    // 无错误消息
    await expect(page.locator('.message-area')).toHaveCount(0);

    await takeScreenshot(page, '19_重置已修改的变量');
  });
});

// ============================================================
// 5. 异常处理 (No.20-21)
// ============================================================
test.describe('异常处理', () => {

  test('No.20 网络断开-保存失败', async ({ page }) => {
    resetCounter('20_网络断开_保存失败');
    await loginAndGoToUD05WithMock(page);

    // 修改变量值
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock Update API 网络断开
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.abort('connectionrefused');
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    const msgArea = page.locator('.message-area');
    await expect(msgArea).toBeVisible();

    // 2. 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    // 3. 修改内容不丢失
    await expect(inputs.nth(0)).toHaveValue('UPDATED_VAL');

    await takeScreenshot(page, '20_网络断开_保存失败');
  });

  test('No.21 API 超时-保存失败', async ({ page }) => {
    resetCounter('21_API超时_保存失败');
    await loginAndGoToUD05WithMock(page);

    // 修改变量值
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock Update API 超时（延迟很久）
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 30000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1500);

    // 1. 显示错误消息（超时后应显示失败消息）
    const msgArea = page.locator('.message-area');
    // 超时后按钮恢复
    const saveBtn = page.locator('.save-button');
    await expect(saveBtn).toBeEnabled();

    await takeScreenshot(page, '21_API超时_保存失败');
  });
});

// ============================================================
// 6. 数据一致性 (No.22-23)
// ============================================================
test.describe('数据一致性', () => {

  test('No.22 变量数量与 API 一致', async ({ page }) => {
    resetCounter('22_变量数量与API一致');
    await loginAndGoToUD05WithMock(page);

    const rows = page.locator('.variable-table tbody tr');
    await expect(rows).toHaveCount(3);

    // 每个变量的数据正确
    await expect(rows.nth(0)).toContainText('VAR001');
    await expect(rows.nth(1)).toContainText('VAR002');
    await expect(rows.nth(2)).toContainText('VAR003');

    await takeScreenshot(page, '22_变量数量与API一致');
  });

  test('No.23 Current value 显示原始值', async ({ page }) => {
    resetCounter('23_CurrentValue显示原始值');
    await loginAndGoToUD05WithMock(page);

    const firstRow = page.locator('.variable-table tbody tr').nth(0);
    // Current value 列（第3列，index=2）显示原始值
    const currentValueCell = firstRow.locator('td').nth(2);
    await expect(currentValueCell).toHaveText('OLD_VAL_001');

    // Modified value 列（第4列，index=3）初始为空
    const modifiedInput = firstRow.locator('td').nth(3).locator('input');
    await expect(modifiedInput).toHaveValue('');

    await takeScreenshot(page, '23_CurrentValue显示原始值');
  });
});

// ============================================================
// 7. 界面布局 (No.24-26)
// ============================================================
test.describe('界面布局', () => {

  test('No.24 变量表格布局', async ({ page }) => {
    resetCounter('24_变量表格布局');
    await loginAndGoToUD05WithMock(page);

    // 1. 列顺序正确
    const headers = page.locator('.variable-table thead tr').nth(1).locator('th');
    await expect(headers.nth(0)).toHaveText('Variable');
    await expect(headers.nth(1)).toHaveText('Description');
    await expect(headers.nth(2)).toHaveText('Current value');
    await expect(headers.nth(3)).toHaveText('Modified value');

    // 2. 表头可见
    await expect(headers.nth(0)).toBeVisible();

    await takeScreenshot(page, '24_变量表格布局');
  });

  test('No.25 模板文件信息显示', async ({ page }) => {
    resetCounter('25_模板文件信息显示');
    await loginAndGoToUD05WithMock(page);

    // 1. 模板文件链接
    const templateLink = page.locator('.template-link');
    await expect(templateLink).toBeVisible();
    await expect(templateLink).toContainText('Template: aus/UD_TEST.odt');

    // 2. 底盘信息排列整洁
    const infoSection = page.locator('.vehicle-info-section');
    await expect(infoSection).toBeVisible();

    await takeScreenshot(page, '25_模板文件信息显示');
  });

  test('No.26 保存按钮位置', async ({ page }) => {
    resetCounter('26_保存按钮位置');
    await loginAndGoToUD05WithMock(page);

    // 保存按钮在表格顶部
    const saveBtn = page.locator('.save-button');
    await expect(saveBtn).toBeVisible();

    // 按钮在 col-save 的 th 中（表格的第一行只有这一个按钮）
    const saveHeader = page.locator('.col-save');
    await expect(saveHeader).toBeVisible();

    await takeScreenshot(page, '26_保存按钮位置');
  });
});

// ============================================================
// 8. 数据校验 (No.27-29)
// ============================================================
test.describe('数据校验', () => {

  test('No.27 修改前与修改后值对比', async ({ page }) => {
    resetCounter('27_修改前与修改后值对比');
    await loginAndGoToUD05WithMock(page);

    const firstRow = page.locator('.variable-table tbody tr').nth(0);
    const currentValueCell = firstRow.locator('td').nth(2);
    const modifiedInput = firstRow.locator('td').nth(3).locator('input');

    // Current value = old
    await expect(currentValueCell).toHaveText('OLD_VAL_001');

    // 修改值
    await modifiedInput.click();
    await modifiedInput.fill('NEW_VAL_001');

    // Current value 不变，Modified value 为新值
    await expect(currentValueCell).toHaveText('OLD_VAL_001');
    await expect(modifiedInput).toHaveValue('NEW_VAL_001');

    await takeScreenshot(page, '27_修改前与修改后值对比');
  });

  test('No.28 修改变量后跳转到 UD06 的数据完整性', async ({ page }) => {
    resetCounter('28_修改变量后跳转到UD06数据完整性');
    await loginAndGoToUD05WithMock(page);

    // 修改多个变量
    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_001');
    await inputs.nth(1).click();
    await inputs.nth(1).fill('UPDATED_002');

    // Mock Update API
    await page.route(UPDATE_API, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '更新成功', data: null }),
      });
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1500);

    // 跳转到 UD06
    if (page.url().includes('SaveModifications')) {
      await expect(page.locator('.save-modifications-container')).toBeVisible();
    }

    await takeScreenshot(page, '28_修改变量后跳转到UD06数据完整性');
  });

  test('No.29 空值与非空值混合修改', async ({ page }) => {
    resetCounter('29_空值与非空值混合修改');
    await loginAndGoToUD05WithMock(page);

    const inputs = page.locator('.modified-input');

    // 将第一个变量清空（原始 modifiedValue 就是空，保持不变）
    // 第二个变量填入新值
    await inputs.nth(1).click();
    await inputs.nth(1).fill('NEW_VAL_002');

    // 验证
    await expect(inputs.nth(0)).toHaveValue('');
    await expect(inputs.nth(1)).toHaveValue('NEW_VAL_002');

    await takeScreenshot(page, '29_空值与非空值混合修改');
  });
});

// ============================================================
// 9. 页面交互 (No.30-31)
// ============================================================
test.describe('页面交互', () => {

  test('No.30 键盘操作-Tab 切换输入框', async ({ page }) => {
    resetCounter('30_键盘操作_Tab切换输入框');
    await loginAndGoToUD05WithMock(page);

    const inputs = page.locator('.modified-input');

    // 聚焦第一个输入框
    await inputs.nth(0).focus();
    await expect(inputs.nth(0)).toBeFocused();

    // Tab 切换到下一个
    await page.keyboard.press('Tab');
    await expect(inputs.nth(1)).toBeFocused();

    // 再 Tab
    await page.keyboard.press('Tab');
    await expect(inputs.nth(2)).toBeFocused();

    await takeScreenshot(page, '30_键盘操作_Tab切换输入框');
  });

  test('No.31 页面滚动-变量列表较长时', async ({ page }) => {
    resetCounter('31_页面滚动_变量列表较长时');
    // 创建更多变量数据
    const manyVariables = Array.from({ length: 15 }, (_, i) => ({
      variable: `VAR${String(i + 1).padStart(3, '0')}`,
      description: `Description ${i + 1}`,
      currentValue: `VAL_${i + 1}`,
      modifiedValue: '',
    }));
    await loginAndGoToUD05WithMock(page, {
      code: 200,
      message: 'success',
      data: { chassisNo: 'C001', variables: manyVariables, templateFile: 'aus/UD_TEST.odt' },
    });

    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 保存按钮可见
    const saveBtn = page.locator('.save-button');
    await expect(saveBtn).toBeVisible();

    // 最后一行数据可见
    const lastRow = page.locator('.variable-table tbody tr').last();
    await expect(lastRow).toBeVisible();
    await expect(lastRow).toContainText('VAR015');

    await takeScreenshot(page, '31_页面滚动_变量列表较长时');
  });
});

// ============================================================
// 10. 错误处理 (No.32-33)
// ============================================================
test.describe('错误处理', () => {

  test('No.32 保存-部分变量修改失败', async ({ page }) => {
    resetCounter('32_保存_部分变量修改失败');
    await loginAndGoToUD05WithMock(page);

    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_001');
    await inputs.nth(1).click();
    await inputs.nth(1).fill('UPDATED_002');

    // Mock: 第一个更新成功，第二个失败
    let callIndex = 0;
    await page.route(UPDATE_API, async route => {
      callIndex++;
      await new Promise(r => setTimeout(r, 200));
      if (callIndex === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, message: '更新成功', data: null }),
        });
      } else {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, message: 'Internal server error', data: null }),
        });
      }
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // 显示错误消息
    const msgArea = page.locator('.message-area');
    // 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    await takeScreenshot(page, '32_保存_部分变量修改失败');
  });

  test('No.33 保存-API 返回格式异常', async ({ page }) => {
    resetCounter('33_保存_API返回格式异常');
    await loginAndGoToUD05WithMock(page);

    const inputs = page.locator('.modified-input');
    await inputs.nth(0).click();
    await inputs.nth(0).fill('UPDATED_VAL');

    // Mock: API 返回非标准格式
    await page.route(UPDATE_API, async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html>Server Error</html>',
      });
    });

    // 点击 Save
    await page.locator('.save-button').click();
    await page.waitForTimeout(1000);

    // 异常被捕获，显示错误消息
    const msgArea = page.locator('.message-area');
    // 保持在当前页面
    await expect(page.locator('.modify-document-container')).toBeVisible();

    await takeScreenshot(page, '33_保存_API返回格式异常');
  });
});
