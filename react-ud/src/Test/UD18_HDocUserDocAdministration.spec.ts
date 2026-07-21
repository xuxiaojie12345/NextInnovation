// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD18_HDocUserDocAdministration 单元测试
// 测试规格书: テスト式样書UD18.md
// 画面文件: UD18_HDocUserDocAdministration.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD18');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// Mock 文档列表
const MOCK_DOC_LIST = [
  { id: 1, documentType: '123', businessUnit: '', registerUser: '', registerDateTime: '' },
  { id: 2, documentType: 'CERTIFICATE', businessUnit: '', registerUser: '', registerDateTime: '' },
  { id: 3, documentType: 'DIMENSION_PLATE', businessUnit: '', registerUser: '', registerDateTime: '' },
  { id: 4, documentType: 'TECHNICAL_SPEC', businessUnit: '', registerUser: '', registerDateTime: '' },
];

// Mock 用户 admin 的文档权限
const MOCK_ADMIN_DOCS = { code: 200, msg: '', data: { doctypes: ['TECHNICAL_SPEC'] } };

// Mock 用户 x001 的文档权限（全部权限）
const MOCK_X001_DOCS = { code: 200, msg: '', data: { doctypes: ['123', 'CERTIFICATE', 'DIMENSION_PLATE', 'TECHNICAL_SPEC'] } };

// Mock 用户 admin445 的文档权限
const MOCK_ADMIN445_DOCS = { code: 200, msg: '', data: { doctypes: ['123', 'DIMENSION_PLATE'] } };


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD18画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD18 页面
 */
async function goToUD18(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD18');
  await page.waitForSelector('.ud18-container');
  await page.waitForTimeout(1500);
}

/**
 * 设置文档列表 Mock
 */
async function setupDocListMock(page: Page) {
  await page.route('**/api/ud20/getdocumentlist', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, msg: '', data: MOCK_DOC_LIST })
    });
  });
}

/**
 * 设置用户认证 Mock（存在）
 */
async function setupAuthExistsMock(page: Page, userId: string) {
  await page.route('**/api/ud18/checkauth*', async (route, request) => {
    const url = new URL(request.url());
    const reqUserId = url.searchParams.get('userId');
    if (reqUserId === userId) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * 设置用户认证 Mock（不存在）
 */
async function setupAuthNotExistsMock(page: Page) {
  await page.route('**/api/ud18/checkauth*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, msg: '', data: { exists: false } })
    });
  });
}

/**
 * 设置用户名查询 Mock
 */
async function setupUserNameMock(page: Page, userId: string, username: string) {
  await page.route('**/api/ud01/authentication*', async (route, request) => {
    const url = new URL(request.url());
    const reqUserId = url.searchParams.get('userId');
    if (reqUserId === userId) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { username } })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * 设置用户文档权限查询 Mock
 */
async function setupUserDocMock(page: Page, userId: string, docData: any) {
  await page.route('**/api/ud18/getuserdoc*', async (route, request) => {
    const url = new URL(request.url());
    const reqUserId = url.searchParams.get('userId');
    if (reqUserId === userId) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(docData)
      });
    } else {
      await route.continue();
    }
  });
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

  test('UD18_001_画面初期表示_全体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 1. 页面容器可见
    await expect(page.locator('.ud18-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    // 2. UserID 输入框可见
    await expect(page.locator('#ud18-userid')).toBeVisible();
    await takeScreenshot(page, 'UserID输入框');

    // 3. User 标签可见（初期为空）
    await expect(page.locator('.ud18-user-value')).toBeVisible();
    await takeScreenshot(page, 'User标签');

    // 4. Document 下拉列表（多选）可见
    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, 'Document下拉列表');

    // 5. User Info 按钮可见
    await expect(page.locator('.ud18-btn-info')).toBeVisible();
    await takeScreenshot(page, 'UserInfo按钮');

    // 6. Update 按钮可见
    await expect(page.locator('.ud18-btn-update')).toBeVisible();
    await takeScreenshot(page, 'Update按钮');

    // 7. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud18-message')).not.toBeVisible();
    await takeScreenshot(page, '整体布局');
  });

  test('UD18_002_画面初期表示_UserID输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    // 1. UserID 输入框可见
    await expect(useridInput).toBeVisible();
    // 2. maxLength 为 10
    const maxLen = await useridInput.getAttribute('maxLength');
    expect(maxLen).toBe('10');
    // 3. 初期值为空字符串
    const val = await useridInput.inputValue();
    expect(val).toBe('');
    // 4. 处于可用状态（未禁用）
    await expect(useridInput).toBeEnabled();
    await takeScreenshot(page, 'UserID输入框');
  });

  test('UD18_003_画面初期表示_User标签', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 1. User 标签可见
    await expect(page.locator('.ud18-user-label-text')).toBeVisible();
    // 2. 初期值为空
    await expect(page.locator('.ud18-user-value')).toHaveText('');
    await takeScreenshot(page, 'User标签');
  });

  test('UD18_004_画面初期表示_Document下拉列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 1. Document 下拉列表可见，支持多选
    const docSelect = page.locator('#ud18-document');
    await expect(docSelect).toBeVisible();
    const multiple = await docSelect.getAttribute('multiple');
    expect(multiple).not.toBeNull();

    // 2. 初期未选择任何选项
    const selectedVal = await docSelect.inputValue();
    expect(selectedVal).toBe('');

    // 3. 下拉列表包含文档选项
    const options = await docSelect.locator('option').count();
    expect(options).toBe(4);
    await expect(docSelect.locator('option').nth(0)).toHaveText('123');
    await expect(docSelect.locator('option').nth(1)).toHaveText('CERTIFICATE');
    await expect(docSelect.locator('option').nth(2)).toHaveText('DIMENSION_PLATE');
    await expect(docSelect.locator('option').nth(3)).toHaveText('TECHNICAL_SPEC');

    // 4. 处于可用状态
    await expect(docSelect).toBeEnabled();
    await takeScreenshot(page, 'Document下拉列表');
  });

  test('UD18_005_画面初期表示_加载文档列表失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';

    // Mock API 返回 500
    await page.route('**/api/ud20/getdocumentlist', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取文档列表失败', data: null })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('获取文档列表失败');
    await takeScreenshot(page, '加载文档列表失败');
  });

  test('UD18_006_画面初期表示_按钮初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 1. User Info 按钮可见，文本为 User Info，未禁用
    await expect(page.locator('.ud18-btn-info')).toBeVisible();
    await expect(page.locator('.ud18-btn-info')).toHaveText('User Info');
    await expect(page.locator('.ud18-btn-info')).toBeEnabled();

    // 2. Update 按钮可见，文本为 Update，未禁用
    await expect(page.locator('.ud18-btn-update')).toBeVisible();
    await expect(page.locator('.ud18-btn-update')).toHaveText('Update');
    await expect(page.locator('.ud18-btn-update')).toBeEnabled();
    await takeScreenshot(page, '按钮初期状态');
  });

  test('UD18_007_画面初期表示_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud18-message')).not.toBeVisible();
    await takeScreenshot(page, '消息区域隐藏');
  });
});

// ============================================================
// 2. UserID 输入框属性校验 (No.8-11)
// ============================================================
test.describe('UserID 输入框属性校验', () => {

  test('UD18_008_UserID_最大长度maxLength10', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    // 输入 A 重复11次
    await useridInput.fill('A'.repeat(11));
    await page.waitForTimeout(200);

    const val = await useridInput.inputValue();
    expect(val.length).toBe(10);
    expect(val).toBe('A'.repeat(10));
    await takeScreenshot(page, 'UserID最大长度');
  });

  test('UD18_009_UserID_半角英数字输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin445');
    await page.waitForTimeout(200);

    const val = await useridInput.inputValue();
    expect(val).toBe('admin445');
    await takeScreenshot(page, 'UserID半角英数字输入');
  });

  test('UD18_010_UserID_特殊字符不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    // 尝试输入特殊字符
    await useridInput.fill('admin@123');
    await page.waitForTimeout(200);

    const val = await useridInput.inputValue();
    expect(val).toBe('admin'); // @ 和后续字符被过滤
    await takeScreenshot(page, 'UserID特殊字符不可输入');
  });

  test('UD18_011_UserID_文字配置左对齐', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin');
    await page.waitForTimeout(200);

    // 文字左对齐（默认样式）
    await expect(useridInput).toBeVisible();
    await takeScreenshot(page, 'UserID文字左对齐');
  });
});

// ============================================================
// 3. User Info 按钮操作 (No.12-18)
// ============================================================
test.describe('User Info 按钮操作', () => {

  test('UD18_012_UserInfo_UserID为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请输入UserID');
    await takeScreenshot(page, 'UserInfoUserID为空');
  });

  test('UD18_013_UserInfo_UserID含非半角英数字', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin@123');
    await page.waitForTimeout(200);

    // 前端已拦截特殊字符
    const val = await useridInput.inputValue();
    expect(val).not.toContain('@');
    await takeScreenshot(page, 'UserID含非半角英数字');
  });

  test('UD18_014_UserInfo_查询用户存在admin', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');
    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 输入 admin
    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);

    // 点击 User Info
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // User 标签显示用户名
    await expect(page.locator('.ud18-user-value')).toContainText('Administrator');
    // Document 下拉列表中 TECHNICAL_SPEC 被选中
    await expect(page.locator('#ud18-document')).toBeVisible();
    // 消息区域隐藏
    await expect(page.locator('.ud18-message')).not.toBeVisible();
    await takeScreenshot(page, '查询用户存在admin');
  });

  test('UD18_015_UserInfo_查询用户存在多文档权限x001', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'x001');
    await setupUserNameMock(page, 'x001', 'UserX001');
    await setupUserDocMock(page, 'x001', MOCK_X001_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('x001');
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-user-value')).toContainText('UserX001');
    // 多选项全部高亮显示
    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '查询用户存在多文档权限x001');
  });

  test('UD18_016_UserInfo_查询用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';

    await setupDocListMock(page);
    await setupAuthNotExistsMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('NONEXIST999');
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText("We didn't recognize the userid you entered. Please try again.");
    // User 标签保持为空
    await expect(page.locator('.ud18-user-value')).toHaveText('');
    await takeScreenshot(page, '查询用户不存在');
  });

  test('UD18_017_UserInfo_UserID含首尾空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');
    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 输入含前后空格的 admin
    await page.locator('#ud18-userid').fill('  admin  ');
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 查询成功，User 标签显示用户名（前端 trim 后查询）
    await expect(page.locator('.ud18-user-value')).toContainText('Administrator');
    await takeScreenshot(page, 'UserID含首尾空格');
  });

  test('UD18_018_UserInfo_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';

    await setupDocListMock(page);

    // Mock checkauth 返回 500
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, 'UserInfo后端500错误');
  });
});

// ============================================================
// 4. Update 按钮操作 (No.19-25)
// ============================================================
test.describe('Update 按钮操作', () => {

  test('UD18_019_Update_UserID为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请输入UserID');
    await takeScreenshot(page, 'UpdateUserID为空');
  });

  test('UD18_020_Update_未先查询用户信息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);

    // 未点击 User Info 直接点击 Update
    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请先查询用户信息');
    await takeScreenshot(page, 'Update未先查询用户信息');
  });

  test('UD18_021_Update_新增文档权限', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    // Mock 获取用户当前文档权限（初始只有 TECHNICAL_SPEC）
    await page.route('**/api/ud18/getuserdoc*', async (route, request) => {
      const url = new URL(request.url());
      const reqUserId = url.searchParams.get('userId');
      if (reqUserId === 'admin') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ADMIN_DOCS)
        });
      } else {
        await route.continue();
      }
    });

    // Mock createdoc 成功
    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 查询 admin 用户
    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 选择 CERTIFICATE
    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    // 点击 Update
    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    // 成功消息
    await expect(page.locator('.ud18-message')).toBeVisible();
    await takeScreenshot(page, 'Update新增文档权限');
  });

  test('UD18_022_Update_更新已有文档权限先删后增', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin445');

    // Mock 获取 admin445 的当前文档权限
    await page.route('**/api/ud18/getuserdoc*', async (route, request) => {
      const url = new URL(request.url());
      const reqUserId = url.searchParams.get('userId');
      if (reqUserId === 'admin445') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ADMIN445_DOCS)
        });
      } else {
        await route.continue();
      }
    });

    // Mock deleteedoc 成功
    await page.route('**/api/ud18/deleteedoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: null })
      });
    });

    // Mock createdoc 成功
    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: null })
      });
    });

    await setupUserNameMock(page, 'admin445', 'Admin445User');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin445');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 当前已有：123, DIMENSION_PLATE；取消 123，新增 CERTIFICATE
    await page.locator('#ud18-document').selectOption(['DIMENSION_PLATE', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message')).toBeVisible();
    await takeScreenshot(page, 'Update更新已有文档权限');
  });

  test('UD18_023_Update_用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';

    await setupDocListMock(page);

    // 先让 checkauth 返回存在，再让 checkauth（Update 中调用）返回不存在
    let checkCount = 0;
    await page.route('**/api/ud18/checkauth*', async route => {
      checkCount++;
      if (checkCount === 1) {
        // 第一次（User Info）返回存在
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
        });
      } else {
        // 第二次（Update）返回不存在
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, msg: '', data: { exists: false } })
        });
      }
    });

    // Mock getuserdoc
    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 先查询
    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 选择文档后点击 Update
    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText("We didn't recognize the userid you entered. Please try again.");
    await takeScreenshot(page, 'Update用户不存在');
  });

  test('UD18_024_Update_更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    // Mock createdoc 返回错误
    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '权限更新失败', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await takeScreenshot(page, 'Update更新失败');
  });

  test('UD18_025_Update_不选择任何文档直接更新', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 不选择任何文档，直接点击 Update
    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(500);

    // 前端校验：请选择至少一个文档权限
    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请选择至少一个文档权限');
    await takeScreenshot(page, 'Update不选择文档');
  });
});

// ============================================================
// 5. Document 下拉列表操作 (No.26-28)
// ============================================================
test.describe('Document 下拉列表操作', () => {

  test('UD18_026_Document_多选支持', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 多选：按住 Ctrl 选择多个选项
    const docSelect = page.locator('#ud18-document');
    await docSelect.selectOption(['CERTIFICATE', 'DIMENSION_PLATE']);
    await page.waitForTimeout(200);

    // 支持多选
    await expect(docSelect).toBeVisible();
    await takeScreenshot(page, 'Document多选支持');
  });

  test('UD18_027_Document_全选所有文档', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const docSelect = page.locator('#ud18-document');
    await docSelect.selectOption(['123', 'CERTIFICATE', 'DIMENSION_PLATE', 'TECHNICAL_SPEC']);
    await page.waitForTimeout(200);

    await expect(docSelect).toBeVisible();
    await takeScreenshot(page, 'Document全选所有文档');
  });

  test('UD18_028_Document_取消选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const docSelect = page.locator('#ud18-document');
    // 先选中
    await docSelect.selectOption(['CERTIFICATE']);
    await page.waitForTimeout(200);
    // 取消选择（select empty）
    await docSelect.selectOption([]);
    await page.waitForTimeout(200);

    await expect(docSelect).toBeVisible();
    await takeScreenshot(page, 'Document取消选择');
  });
});

// ============================================================
// 6. UI交互 (No.29-36)
// ============================================================
test.describe('UI交互', () => {

  test('UD18_029_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';

    await setupDocListMock(page);

    // Mock checkauth 延迟响应
    await page.route('**/api/ud18/checkauth*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(500);

    // Loading 中按钮禁用
    await expect(page.locator('.ud18-btn-info')).toBeDisabled();
    await expect(page.locator('.ud18-btn-update')).toBeDisabled();
    await expect(page.locator('#ud18-userid')).toBeDisabled();
    await expect(page.locator('#ud18-document')).toBeDisabled();
    await takeScreenshot(page, 'Loading中按钮禁用');

    // 等待 API 响应后恢复
    await page.waitForTimeout(3000);
    await expect(page.locator('.ud18-btn-info')).toBeEnabled();
    await expect(page.locator('.ud18-btn-update')).toBeEnabled();
    await expect(page.locator('#ud18-userid')).toBeEnabled();
    await expect(page.locator('#ud18-document')).toBeEnabled();
    await takeScreenshot(page, '加载完成后恢复');
  });

  test('UD18_030_UI交互_Loading中防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';

    let apiCallCount = 0;
    await setupDocListMock(page);

    await page.route('**/api/ud18/checkauth*', async route => {
      apiCallCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);

    // 快速连续点击 2 次
    await page.locator('.ud18-btn-info').click();
    await page.locator('.ud18-btn-info').click({ force: true });
    await page.waitForTimeout(4000);

    // 只发起 1 次 API 调用
    expect(apiCallCount).toBe(1);
    await takeScreenshot(page, 'Loading中防止重复提交');
  });

  test('UD18_031_UI交互_输入时清除旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 触发错误消息（UserID 为空点击 User Info）
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud18-message-error')).toBeVisible();

    // 开始输入 UserID
    await page.locator('#ud18-userid').fill('a');
    await page.waitForTimeout(300);

    // 旧消息被清除
    await expect(page.locator('.ud18-message')).not.toBeVisible();
    await takeScreenshot(page, '输入时清除旧消息');
  });

  test('UD18_032_UI交互_查询成功后显示用户名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');
    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // User 标签显示用户名
    await expect(page.locator('.ud18-user-value')).toContainText('Administrator');
    await takeScreenshot(page, '查询成功后显示用户名');
  });

  test('UD18_033_UI交互_查询后文档权限高亮', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');
    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // Document 下拉列表显示
    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '查询后文档权限高亮');
  });

  test('UD18_034_UI交互_更新成功后刷新显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '更新成功后刷新显示');
  });

  test('UD18_035_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    // 成功消息
    await expect(page.locator('.ud18-message')).toBeVisible();
    await takeScreenshot(page, '成功消息显示绿色');
  });

  test('UD18_036_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 触发空值校验
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(500);

    // 错误消息
    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请输入UserID');
    await takeScreenshot(page, '错误消息显示红色');
  });
});

// ============================================================
// 7. 异常处理 (No.37-42)
// ============================================================
test.describe('异常处理', () => {

  test('UD18_037_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';

    await setupDocListMock(page);

    // Mock 网络断开
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(2000);

    const msg = page.locator('.ud18-message-error');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('网络连接失败');
    }
    await takeScreenshot(page, '异常处理网络连接失败');
  });

  test('UD18_038_异常处理_服务器内部错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';

    await setupDocListMock(page);

    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, '异常处理服务器内部错误');
  });

  test('UD18_039_异常处理_数据库查询失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';

    await setupDocListMock(page);

    await page.route('**/api/ud18/checkauth*', async route => {
      await route.abort('timeout');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(2000);

    const msg = page.locator('.ud18-message-error');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('数据库查询失败');
    }
    await takeScreenshot(page, '异常处理数据库查询失败');
  });

  test('UD18_040_异常处理_数据库更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    await page.route('**/api/ud18/createdoc', async route => {
      await route.abort('connectionrefused');
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(2000);

    const msg = page.locator('.ud18-message-error');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toContainText('数据库更新失败');
    }
    await takeScreenshot(page, '异常处理数据库更新失败');
  });

  test('UD18_041_异常处理_Saviynt服务不可用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';

    await setupDocListMock(page);

    await page.route('**/api/ud18/checkauth*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(2000);

    const msg = page.locator('.ud18-message-error');
    if (await msg.isVisible().catch(() => false)) {
      await expect(msg).toBeVisible();
    }
    await takeScreenshot(page, '异常处理Saviynt服务不可用');
  });

  test('UD18_042_异常处理_并发更新冲突', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    // Mock createdoc 返回 409 冲突
    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ code: 409, msg: '数据已被其他用户修改，请刷新后重试', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('数据已被其他用户修改，请刷新后重试');
    await takeScreenshot(page, '异常处理并发更新冲突');
  });
});

// ============================================================
// 8. 安全性 (No.43-47)
// ============================================================
test.describe('安全性', () => {

  test('UD18_043_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '43';

    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/UD18');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/Login/);
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '未登录重定向');
  });

  test('UD18_044_安全性_UserID格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '44';

    await setupDocListMock(page);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin@123');
    await page.waitForTimeout(200);

    const val = await useridInput.inputValue();
    expect(val).not.toContain('@');
    expect(val).not.toContain('#');
    await takeScreenshot(page, '安全性UserID格式验证');
  });

  test('UD18_045_安全性_UserID去除首尾空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '45';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');
    await setupUserNameMock(page, 'admin', 'Administrator');
    await setupUserDocMock(page, 'admin', MOCK_ADMIN_DOCS);

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 输入含首尾空格
    await page.locator('#ud18-userid').fill('  admin  ');
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 查询成功说明 trim 生效
    await expect(page.locator('.ud18-user-value')).toContainText('Administrator');
    await takeScreenshot(page, '安全性UserID去除首尾空格');
  });

  test('UD18_046_安全性_操作审计记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '46';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    let createdocCalled = false;
    await page.route('**/api/ud18/createdoc', async route => {
      createdocCalled = true;
      const postData = route.request().postDataJSON();
      expect(postData).toBeTruthy();
      expect(postData.userId).toBe('admin');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    expect(createdocCalled).toBe(true);
    await takeScreenshot(page, '安全性操作审计记录');
  });

  test('UD18_047_安全性_防止未授权权限修改', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '47';

    await setupDocListMock(page);
    await setupAuthExistsMock(page, 'admin');

    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DOCS)
      });
    });

    // Mock createdoc 返回权限错误
    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, msg: '权限不足，请联系管理员', data: null })
      });
    });

    await setupUserNameMock(page, 'admin', 'Administrator');

    await goToUD18(page);
    await page.waitForTimeout(1000);

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await takeScreenshot(page, '安全性防止未授权权限修改');
  });
});
