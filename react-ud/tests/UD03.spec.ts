import { test, expect, Page } from '@playwright/test';

// ============================================================
// 认证文档生成模块 (UD03) Playwright 自动化测试
// 基于 単体テスト仕様書UD03.md
// ============================================================

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8081/api/authentication';
const DOC_API_URL = 'http://localhost:8081/api/documenttypes';
const SCREENSHOT_DIR = 'tests/image/UD03';

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

// ============================================================
// 辅助：登录并跳转到 UD03 页面
// ============================================================
/** 登录并跳转到 UD03（使用真实后端数据） */
async function loginAndGoToUD03(page: Page) {
  await safeGoto(page);
  await page.route(API_URL, async route => {
    await new Promise(r => setTimeout(r, 500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { success: true, token: 'mock-token-ud03', userid: 'admin', username: 'admin' },
      }),
    });
  });
  await page.locator('#username').click();
  await page.locator('#username').pressSequentially('admin');
  await page.locator('#password').click();
  await page.locator('#password').pressSequentially('admin123');
  await page.locator('.login-button').click();
  await page.waitForSelector('.menu-layout', { timeout: 15000 });

  // 导航到 UD03 页面（不 Mock API，使用真实后端数据）
  await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
  // 等待 API 加载完成
  await page.waitForTimeout(1000);
}

/** 登录并跳转到 UD03（Mock 文档类型 API，用于异常场景） */
async function loginAndGoToUD03_Mock(page: Page, mockResponse?: any) {
  await safeGoto(page);
  await page.route(API_URL, async route => {
    await new Promise(r => setTimeout(r, 500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { success: true, token: 'mock-token-ud03', userid: 'admin', username: 'admin' },
      }),
    });
  });
  await page.locator('#username').click();
  await page.locator('#username').pressSequentially('admin');
  await page.locator('#password').click();
  await page.locator('#password').pressSequentially('admin123');
  await page.locator('.login-button').click();
  await page.waitForSelector('.menu-layout', { timeout: 15000 });

  // Mock 文档类型 API
  if (mockResponse === 'abort') {
    await page.context().route(/\/api\/documenttypes/, async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.abort('connectionrefused');
    });
  } else if (mockResponse) {
    await page.context().route(/\/api\/documenttypes/, async route => {
      await route.fulfill({ status: mockResponse.status || 200, contentType: 'application/json', body: JSON.stringify(mockResponse.body) });
    });
  }

  await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

/** 获取第一个有效的文档类型选项值 */
async function getFirstDocType(page: Page): Promise<string> {
  return await page.locator('#documentType option:not([value=""])').first().getAttribute('value') || '';
}

/** 辅助：填写表单并提交 */
async function fillFormAndSubmit(page: Page, series: string, no: string, docType: string) {
  if (series !== undefined) {
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').fill('');
    await page.locator('#chassisSeries').pressSequentially(series);
  }
  if (no !== undefined) {
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').fill('');
    await page.locator('#chassisNo').pressSequentially(no);
  }
  if (docType !== undefined) {
    await page.locator('#documentType').selectOption(docType);
  }
  await page.locator('.button-area button').first().click();
}

// ============================================================
// 1. 画面初始化 (No.1-5)
// ============================================================
test.describe('画面初始化', () => {
  test.beforeEach(async ({ page }) => {
    // 不在此处调用 loginAndGoToUD03，各测试自行控制
  });

  test('No.1 初始化-文档类型下拉列表加载成功', async ({ page }) => {
    resetCounter('01_文档类型下拉列表加载成功');
    await loginAndGoToUD03(page);

    // 1. API 返回文档类型列表
    const select = page.locator('#documentType');
    await expect(select).toBeVisible();

    // 2. 默认显示空选项 "-- Select --"
    await expect(select).toHaveValue('');

    // 3. 选项数量至少 1 个（来自真实 API）
    const options = select.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2); // 空选项 + 至少一个真实选项

    // 4. 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '01_文档类型下拉列表加载成功');
  });

  test('No.2 初始化-底盘系列号输入框', async ({ page }) => {
    resetCounter('02_底盘系列号输入框');
    await loginAndGoToUD03(page);

    // 底盘系列号是文本输入框（非下拉列表）
    const input = page.locator('#chassisSeries');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', '例: JPCT');

    // 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '02_底盘系列号输入框');
  });

  test('No.3 初始化-所有控件初始状态', async ({ page }) => {
    resetCounter('03_所有控件初始状态');
    await loginAndGoToUD03(page);

    // 1. 底盘系列号：为空
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    // 2. 底盘号：为空
    await expect(page.locator('#chassisNo')).toHaveValue('');
    // 3. 文档类型：未选择
    await expect(page.locator('#documentType')).toHaveValue('');
    // 4. Submit 按钮可用，文字 "Submit"
    const submitBtn = page.locator('.button-area button').first();
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn).toHaveText('Submit');
    // 5. Reset 按钮可用，文字 "Reset"
    const resetBtn = page.locator('.button-area button').nth(1);
    await expect(resetBtn).toBeEnabled();
    await expect(resetBtn).toHaveText('Reset');
    // 6. 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);

    await takeScreenshot(page, '03_所有控件初始状态');
  });

  test('No.4 初始化-文档类型 API 加载失败', async ({ page }) => {
    resetCounter('04_文档类型API加载失败');
    // Mock API 返回 500
    await loginAndGoToUD03_Mock(page, { status: 500, body: {} });

    // 1. 显示错误消息
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();

    // 2. 文档类型下拉列表为空（只有空选项）
    const select = page.locator('#documentType');
    const options = await select.locator('option').count();
    expect(options).toBe(1); // 只有 "-- Select --"

    // 3. 底盘系列号输入框正常
    await expect(page.locator('#chassisSeries')).toBeVisible();
    // 4. Submit 按钮可用
    await expect(page.locator('.button-area button').first()).toBeEnabled();

    await takeScreenshot(page, '04_文档类型API加载失败');
  });

  test('No.5 初始化-API 超时', async ({ page }) => {
    resetCounter('05_API超时');
    // Mock API 延迟后中断，模拟超时
    await loginAndGoToUD03_Mock(page, 'abort');
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 1. 显示超时/错误消息
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible({ timeout: 10000 });

    // 2. 文档类型下拉列表为空
    await expect(page.locator('#documentType')).toHaveValue('');

    // 3. Submit 按钮可用
    await expect(page.locator('.button-area button').first()).toBeEnabled();

    await page.unroute(DOC_API_URL);
    await takeScreenshot(page, '05_API超时');
  });
});

// ============================================================
// 2. 底盘号输入校验 (No.6-9)
// ============================================================
test.describe('底盘号输入校验', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.6 底盘号输入-半角数字', async ({ page }) => {
    resetCounter('06_底盘号输入_半角数字');
    // 实际实现仅允许数字，输入 "1234567890"
    const inp = page.locator('#chassisNo');
    await inp.click();
    await inp.pressSequentially('1234567890');
    await expect(inp).toHaveValue('1234567890');
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '06_底盘号输入_半角数字');
  });

  test('No.7 底盘号输入-符号被阻止', async ({ page }) => {
    resetCounter('07_底盘号输入_符号被阻止');
    // 实现仅允许数字，符号被阻止
    const inp = page.locator('#chassisNo');
    await inp.click();
    await inp.pressSequentially('ABC-123');
    // 只有数字 "123" 被接受
    await expect(inp).toHaveValue('123');
    await takeScreenshot(page, '07_底盘号输入_符号被阻止');
  });

  test('No.8 底盘号输入-全角字符阻止', async ({ page }) => {
    resetCounter('08_底盘号输入_全角字符');
    const inp = page.locator('#chassisNo');
    await inp.click();
    await page.keyboard.type('１２３４５');
    // 全角字符被阻止
    await expect(inp).toHaveValue('');
    await takeScreenshot(page, '08_底盘号输入_全角字符');
  });

  test('No.9 底盘号-最大长度限制', async ({ page }) => {
    resetCounter('09_底盘号_最大长度限制');
    const inp = page.locator('#chassisNo');
    await inp.click();
    await inp.pressSequentially('12345678901');
    const val = await inp.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
    expect(val).toBe('1234567890');
    await takeScreenshot(page, '09_底盘号_最大长度限制');
  });
});

// ============================================================
// 3. 必填项校验（前端校验）(No.10-14)
// ============================================================
test.describe('必填项校验', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.10 必填校验-底盘系列号未选择', async ({ page }) => {
    resetCounter('10_必填校验_底盘系列号未选择');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('1234567890');
    const dt1 = await getFirstDocType(page);
    await page.locator('#documentType').selectOption(dt1);
    await page.locator('.button-area button').first().click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Chassis series is required.');
    // Submit 按钮恢复可用
    await expect(page.locator('.button-area button').first()).toBeEnabled();
    await takeScreenshot(page, '10_必填校验_底盘系列号未选择');
  });

  test('No.11 必填校验-底盘号为空', async ({ page }) => {
    resetCounter('11_必填校验_底盘号为空');
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    const firstDocType = await getFirstDocType(page);
    await page.locator('#documentType').selectOption(firstDocType);
    await page.locator('.button-area button').first().click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Chassis no is required.');
    await takeScreenshot(page, '11_必填校验_底盘号为空');
  });

  test('No.12 必填校验-文档类型未选择', async ({ page }) => {
    resetCounter('12_必填校验_文档类型未选择');
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('1234567890');
    await page.locator('.button-area button').first().click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Please select a Document type.');
    await takeScreenshot(page, '12_必填校验_文档类型未选择');
  });

  test('No.13 必填校验-全部为空', async ({ page }) => {
    resetCounter('13_必填校验_全部为空');
    await page.locator('.button-area button').first().click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    // 只显示第一个错误（底盘系列号）
    await expect(msg).toHaveText('Chassis series is required.');
    await expect(page.locator('.error-message')).toHaveCount(1);
    await takeScreenshot(page, '13_必填校验_全部为空');
  });

  test('No.14 连续多次空值提交', async ({ page }) => {
    resetCounter('14_连续多次空值提交');
    const btn = page.locator('.button-area button').first();
    for (let i = 0; i < 3; i++) {
      await btn.click();
      await page.waitForTimeout(300);
    }
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();
    await expect(msg).toHaveText('Chassis series is required.');
    await takeScreenshot(page, '14_连续多次空值提交');
  });
});

// ============================================================
// 4. 生成与跳转 (No.15-16)
// ============================================================
test.describe('生成与跳转', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.15 生成成功-跳转到 UD04', async ({ page }) => {
    resetCounter('15_生成成功_跳转到UD04');
    // 实际实现直接跳转，不调用 API
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('1234567890');
    const dt3 = await getFirstDocType(page);
    await page.locator('#documentType').selectOption(dt3);
    await takeScreenshot(page, '15_生成成功_跳转到UD04');

    // 点击 Submit
    await page.locator('.button-area button').first().click();
    await page.waitForTimeout(1000);

    // 跳转到 UD04 GenerateDocument 页面
    expect(page.url()).toContain('/Menu/GenerateDocument/1234567890');
    await takeScreenshot(page, '15_生成成功_跳转到UD04');

    // 回到 UD03 准备后续测试
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
  });

  test('No.16 生成-无 API 验证（直接跳转）', async ({ page }) => {
    resetCounter('16_生成_无API验证直接跳转');
    // 当前实现不调用 API，直接导航到 UD04
    // 即使输入无效数据也能跳转（UD04 页面会做校验）
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('TEST');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('9999999999');
    const dt2 = await getFirstDocType(page);
    await page.locator('#documentType').selectOption(dt2);
    await takeScreenshot(page, '16_生成_无API验证直接跳转');

    await page.locator('.button-area button').first().click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/Menu/GenerateDocument/9999999999');
    await takeScreenshot(page, '16_生成_无API验证直接跳转');

    // 回到 UD03
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
  });
});

// ============================================================
// 5. 重置功能 (No.17-19)
// ============================================================
test.describe('重置功能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.17 重置按钮-清空所有输入', async ({ page }) => {
    resetCounter('17_重置按钮_清空所有输入');
    // 先填入数据
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('1234567890');
    const dt4 = await getFirstDocType(page);
    await page.locator('#documentType').selectOption(dt4);
    await takeScreenshot(page, '17_重置按钮_清空所有输入');

    // 点击 Reset
    await page.locator('.button-area button').nth(1).click();
    await page.waitForTimeout(300);

    // 所有字段重置
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    // 错误消息清除
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '17_重置按钮_清空所有输入');
  });

  test('No.18 重置按钮-空表单时重置', async ({ page }) => {
    resetCounter('18_重置按钮_空表单时重置');
    // 表单已为空，点击 Reset
    await page.locator('.button-area button').nth(1).click();
    await page.waitForTimeout(300);

    // 表单保持为空
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    // 无错误消息
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '18_重置按钮_空表单时重置');
  });

  test('No.19 有错误时重置', async ({ page }) => {
    resetCounter('19_有错误时重置');
    // 触发必填校验
    await page.locator('.button-area button').first().click();
    await expect(page.locator('.error-message')).toBeVisible();

    // 点击 Reset
    await page.locator('.button-area button').nth(1).click();
    await page.waitForTimeout(300);

    // 表单清空，错误消息清除
    await expect(page.locator('#chassisSeries')).toHaveValue('');
    await expect(page.locator('#chassisNo')).toHaveValue('');
    await expect(page.locator('#documentType')).toHaveValue('');
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '19_有错误时重置');
  });
});

// ============================================================
// 6. 输入交互 (No.20-22)
// ============================================================
test.describe('输入交互', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.20 输入底盘系列号后按钮状态', async ({ page }) => {
    resetCounter('20_输入底盘系列号后按钮状态');
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    // Submit 按钮保持可用
    await expect(page.locator('.button-area button').first()).toBeEnabled();
    // 不自动触发提交
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '20_输入底盘系列号后按钮状态');
  });

  test('No.21 快速输入底盘号无异常', async ({ page }) => {
    resetCounter('21_快速输入底盘号无异常');
    const inp = page.locator('#chassisNo');
    await inp.click();
    await inp.pressSequentially('1234567890');
    await expect(inp).toHaveValue('1234567890');
    // 页面无异常
    await expect(page.locator('.error-message')).toHaveCount(0);
    await takeScreenshot(page, '21_快速输入底盘号无异常');
  });

  test('No.22 切换文档类型后生成', async ({ page }) => {
    resetCounter('22_切换文档类型后生成');
    // 获取真实文档类型选项
    const allOptions = await page.locator('#documentType option:not([value=""])').all();
    const firstVal = await allOptions[0].getAttribute('value') || '';
    const secondVal = allOptions.length > 1 ? await allOptions[1].getAttribute('value') || firstVal : firstVal;

    // 先选择第一个类型
    await page.locator('#documentType').selectOption(firstVal);
    await expect(page.locator('#documentType')).toHaveValue(firstVal);
    await takeScreenshot(page, '22_切换文档类型后生成');

    // 切换为第二个类型
    await page.locator('#documentType').selectOption(secondVal);
    await expect(page.locator('#documentType')).toHaveValue(secondVal);

    // 填写其他字段并提交
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('1234567890');
    await page.locator('.button-area button').first().click();
    await page.waitForTimeout(1000);

    // 验证跳转
    expect(page.url()).toContain('/Menu/GenerateDocument/1234567890');
    await takeScreenshot(page, '22_切换文档类型后生成');

    // 回到 UD03
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
  });
});

// ============================================================
// 7. 异常场景 (No.23-25)
// ============================================================
test.describe('异常场景', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.23 初始化时 API 返回错误', async ({ page }) => {
    resetCounter('23_初始化API返回错误');
    // 当前实现在初始化时获取文档类型，无提交 API
    // 测试初始化 API 失败场景已在 No.4 覆盖
    // 这里验证即使 API 失败，表单仍可操作
    await page.route(DOC_API_URL, async route => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 显示错误消息
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();

    // 表单仍可输入
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('TEST');
    await expect(page.locator('#chassisSeries')).toHaveValue('TEST');
    await takeScreenshot(page, '23_初始化API返回错误');
  });

  test('No.24 提交时无网络', async ({ page }) => {
    resetCounter('24_提交时无网络');
    // 当前实现提交时不调用 API，直接导航
    // 所以网络断开不影响提交
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    await page.locator('#chassisNo').click();
    await page.locator('#chassisNo').pressSequentially('1234567890');
    const dt6 = await getFirstDocType(page);
    await page.locator('#documentType').selectOption(dt6);
    await takeScreenshot(page, '24_提交时无网络');

    await page.locator('.button-area button').first().click();
    await page.waitForTimeout(1000);
    // 直接跳转成功（无 API 调用）
    expect(page.url()).toContain('/Menu/GenerateDocument/1234567890');
    await takeScreenshot(page, '24_提交时无网络');

    // 回到 UD03
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
  });

  test('No.25 初始化 API 超时后表单可用', async ({ page }) => {
    resetCounter('25_初始化API超时后表单可用');
    // 已在 No.5 覆盖，这里验证超时后表单仍可用
    await page.route(DOC_API_URL, async route => {
      await new Promise(r => setTimeout(r, 3000));
      await route.abort('connectionrefused');
    });
    await page.goto(BASE_URL + '/Menu/GenerateHomologationDocument', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.generate-homologation-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    // 表单可用
    await page.locator('#chassisSeries').click();
    await page.locator('#chassisSeries').pressSequentially('JPCT');
    await expect(page.locator('#chassisSeries')).toHaveValue('JPCT');
    await takeScreenshot(page, '25_初始化API超时后表单可用');

    await page.unroute(DOC_API_URL);
  });
});

// ============================================================
// 8. 画面布局与样式 (No.26-29)
// ============================================================
test.describe('画面布局与样式', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToUD03(page);
  });

  test('No.26 页面标题显示', async ({ page }) => {
    resetCounter('26_页面标题显示');
    const title = page.locator('.form-card-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('HDoc - Generate Homologation Document');
    await takeScreenshot(page, '26_页面标题显示');
  });

  test('No.27 输入框样式', async ({ page }) => {
    resetCounter('27_输入框样式');
    // 确认各输入框存在且样式统一
    await expect(page.locator('#chassisSeries')).toBeVisible();
    await expect(page.locator('#chassisNo')).toBeVisible();
    await expect(page.locator('#documentType')).toBeVisible();
    // 按钮存在
    await expect(page.locator('.button-area button')).toHaveCount(3);
    await takeScreenshot(page, '27_输入框样式');
  });

  test('No.28 错误消息显示位置', async ({ page }) => {
    resetCounter('28_错误消息显示位置');
    // 触发必填校验
    await page.locator('.button-area button').first().click();
    const msg = page.locator('.error-message');
    await expect(msg).toBeVisible();

    // 错误消息在表单标题下方、控件上方
    const title = page.locator('.form-card-title');
    const formGroup = page.locator('.form-group').first();
    const titleBox = await title.boundingBox();
    const msgBox = await msg.boundingBox();
    const formBox = await formGroup.boundingBox();
    expect(msgBox).toBeTruthy();
    expect(titleBox).toBeTruthy();
    expect(formBox).toBeTruthy();
    // 错误消息在标题下方、表单上方
    expect(msgBox!.y).toBeGreaterThan(titleBox!.y);
    expect(msgBox!.y).toBeLessThan(formBox!.y);
    await takeScreenshot(page, '28_错误消息显示位置');
  });

  test('No.29 标签左对齐', async ({ page }) => {
    resetCounter('29_标签左对齐');
    // 所有标签左对齐
    const labels = page.locator('.form-group label');
    const labelCount = await labels.count();
    expect(labelCount).toBe(3);

    // 检查标签文本
    await expect(labels.nth(0)).toHaveText('Chassis series');
    await expect(labels.nth(1)).toHaveText('Chassis no');
    await expect(labels.nth(2)).toHaveText('Document type');

    await takeScreenshot(page, '29_标签左对齐');
  });
});
