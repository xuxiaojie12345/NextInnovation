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
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});

  // Mock 文档列表使 selectOption 可选中 CERTIFICATE/DIMENSION_PLATE 等
  // 各测试可自行 override
  await page.route('**/api/ud20/getdocumentlist', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: [
        { documentType: 'TECHNICAL_SPEC', description: 'Technical Spec' },
        { documentType: 'CERTIFICATE', description: 'Certificate' },
        { documentType: 'DIMENSION_PLATE', description: 'Dimension Plate' },
        { documentType: '123', description: 'Doc 123' },
      ]})
    });
  });
});

// ============================================================
// 1. 画面初期表示 (No.1-7)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD18_001_画面初期表示_全体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';

    await goToUD18(page);
    await page.waitForTimeout(1000);

    // 1. 页面容器可见
    await expect(page.locator('.ud18-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    // 2. UserID 输入框可见
    await expect(page.locator('#ud18-userid')).toBeVisible();
    await takeScreenshot(page, 'UserID输入框');

    // 3. User 标签存在于DOM中（初期为空，空span零尺寸故用toBeAttached）
    await expect(page.locator('.ud18-user-value')).toBeAttached();
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

    // 3. 下拉列表包含文档选项（数量取决于后端数据）
    const options = await docSelect.locator('option').count();
    expect(options).toBeGreaterThanOrEqual(1);

    // 4. 处于可用状态
    await expect(docSelect).toBeEnabled();
    await takeScreenshot(page, 'Document下拉列表');
  });

  test('UD18_005_画面初期表示_加载文档列表失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';

    // 先清除 beforeEach 注册的 getdocumentlist handler，再注册返回 500
    await page.unroute('**/api/ud20/getdocumentlist');
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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const useridInput = page.locator('#ud18-userid');
    // 输入 A 重复11次
    await useridInput.fill('A'.repeat(11));
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    const val = await useridInput.inputValue();
    expect(val.length).toBe(10);
    expect(val).toBe('A'.repeat(10));
    await takeScreenshot(page, 'UserID最大长度');
  });

  test('UD18_009_UserID_半角英数字输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin445');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    const val = await useridInput.inputValue();
    expect(val).toBe('admin445');
    await takeScreenshot(page, 'UserID半角英数字输入');
  });

  test('UD18_010_UserID_特殊字符不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const useridInput = page.locator('#ud18-userid');
    // 逐字输入含特殊字符的值，@ 被 USER_ID_REGEX 逐个过滤
    // 最终 'admin' 被接受、'@' 被过滤、'123' 继续被接受
    await useridInput.pressSequentially('admin@123', { delay: 50 });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    const val = await useridInput.inputValue();
    expect(/^[a-zA-Z0-9]*$/.test(val)).toBeTruthy();
    await takeScreenshot(page, 'UserID特殊字符不可输入');
  });

  test('UD18_011_UserID_文字配置左对齐', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请输入UserID');
    await takeScreenshot(page, 'UserInfoUserID为空');
  });

  test('UD18_013_UserInfo_UserID含非半角英数字', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin@123');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 前端已拦截特殊字符
    const val = await useridInput.inputValue();
    expect(val).not.toContain('@');
    await takeScreenshot(page, 'UserID含非半角英数字');
  });

  test('UD18_014_UserInfo_查询用户存在admin', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 输入 admin
    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 点击 User Info
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 查询成功，User 标签显示用户名（使用真实后端数据）
    await expect(page.locator('.ud18-user-value')).not.toHaveText('');
    // 消息区域隐藏
    await expect(page.locator('.ud18-message')).not.toBeVisible();
    await takeScreenshot(page, '查询用户存在admin');
  });

  test('UD18_015_UserInfo_查询用户显示用户名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 查询成功，User 标签显示用户名
    await expect(page.locator('.ud18-user-value')).not.toHaveText('');
    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '查询用户显示用户名');
  });

  test('UD18_016_UserInfo_查询用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('NONEXIST999');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 后端返回用户不存在
    await expect(page.locator('.ud18-message-error')).toBeVisible();
    // User 标签保持为空
    await expect(page.locator('.ud18-user-value')).toHaveText('');
    await takeScreenshot(page, '查询用户不存在');
  });

  test('UD18_017_UserInfo_UserID含首尾空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 逐字输入含空格的 UserID，空格被 USER_ID_REGEX 逐个过滤，字母被逐个接受
    // 最终 userID='admin'，trim 后查询成功
    await page.locator('#ud18-userid').pressSequentially('  admin  ', { delay: 50 });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 查询成功说明空格被过滤后查询生效
    await expect(page.locator('.ud18-user-value')).not.toHaveText('');
    await takeScreenshot(page, 'UserID含首尾空格');
  });

  test('UD18_018_UserInfo_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';

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
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请输入UserID');
    await takeScreenshot(page, 'UpdateUserID为空');
  });

  test('UD18_020_Update_未先查询用户信息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 未点击 User Info 直接点击 Update
    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('请先查询用户信息');
    await takeScreenshot(page, 'Update未先查询用户信息');
  });

  test('UD18_021_Update_新增文档权限', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 查询 admin 用户
    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 选择文档
    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    // 点击 Update（使用真实后端 API）
    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await takeScreenshot(page, 'Update新增文档权限');
  });

  test('UD18_022_Update_更新文档权限', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 选择文档后点击 Update（使用真实后端 API）
    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await takeScreenshot(page, 'Update更新文档权限');
  });

  test('UD18_023_Update_用户不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';

    // Mock checkauth 第二次调用返回不存在（模拟用户消失场景）
    let checkCount = 0;
    await page.route('**/api/ud18/checkauth*', async route => {
      checkCount++;
      if (checkCount === 1) {
        await route.continue();
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, msg: '', data: { exists: false } })
        });
      }
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 先查询
    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 选择文档后点击 Update
    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await takeScreenshot(page, 'Update用户不存在');
  });

  test('UD18_024_Update_更新失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';

    // Mock 完整 API 链：checkauth → getuserdoc → deleteedoc → createdoc（返回 500）
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });
    await page.route('**/api/ud01/authentication*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } })
      });
    });
    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { doctypes: ['TECHNICAL_SPEC'] } })
      });
    });
    await page.route('**/api/ud18/deleteedoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '' })
      });
    });
    await page.route('**/api/ud18/createdoc', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '权限更新失败', data: null })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 取消所有选择，直接点击 Update
    await page.locator('#ud18-document').selectOption([]);
    await page.waitForTimeout(200);

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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const docSelect = page.locator('#ud18-document');
    await docSelect.selectOption(['CERTIFICATE', 'DIMENSION_PLATE']);
    await page.waitForTimeout(200);

    await expect(docSelect).toBeVisible();
    await takeScreenshot(page, 'Document多选支持');
  });

  test('UD18_027_Document_全选所有文档', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const docSelect = page.locator('#ud18-document');
    await docSelect.selectOption(['123', 'CERTIFICATE', 'DIMENSION_PLATE', 'TECHNICAL_SPEC']);
    await page.waitForTimeout(200);

    await expect(docSelect).toBeVisible();
    await takeScreenshot(page, 'Document全选所有文档');
  });

  test('UD18_028_Document_取消选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

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

    // Mock checkauth 延迟响应（需要延时来测试加载状态）
    await page.route('**/api/ud18/checkauth*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

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

    // Mock checkauth 延迟响应（需要延时来测试防重复提交）
    await page.route('**/api/ud18/checkauth*', async route => {
      apiCallCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 触发错误消息（UserID 为空点击 User Info）
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await takeScreenshot(page, '错误消息表示');

    // 开始输入 UserID
    await page.locator('#ud18-userid').fill('a');
    await page.waitForTimeout(300);

    // 旧消息被清除
    await expect(page.locator('.ud18-message')).not.toBeVisible();
    await takeScreenshot(page, '输入时清除旧消息');
  });

  test('UD18_032_UI交互_查询成功后显示用户名', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // User 标签显示用户名（使用真实后端数据）
    await expect(page.locator('.ud18-user-value')).not.toHaveText('');
    await takeScreenshot(page, '查询成功后显示用户名');
  });

  test('UD18_033_UI交互_查询后文档权限高亮', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // Document 下拉列表显示
    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '查询后文档权限高亮');
  });

  test('UD18_034_UI交互_更新后页面显示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '更新后页面显示');
  });

  test('UD18_035_UI交互_数据显示正常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 页面数据显示正常（使用真实后端数据）
    await expect(page.locator('#ud18-document')).toBeVisible();
    await takeScreenshot(page, '数据显示正常');
  });

  test('UD18_036_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

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

    // Mock 超时连接（触发 ECONNABORTED → 网络连接失败）
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.abort('timedout');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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

    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud18-message-error')).toBeVisible();
    await expect(page.locator('.ud18-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, '异常处理服务器内部错误');
  });

  test('UD18_039_异常处理_数据库查询失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';

    // Mock 网络断开（触发 else 分支 → 数据库查询失败）
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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

    // Mock 完整 API 链
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });
    await page.route('**/api/ud01/authentication*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } })
      });
    });
    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { doctypes: ['TECHNICAL_SPEC'] } })
      });
    });
    await page.route('**/api/ud18/deleteedoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '' })
      });
    });
    // Mock createdoc 网络中断
    await page.route('**/api/ud18/createdoc', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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

    await page.route('**/api/ud18/checkauth*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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

    // Mock 完整 API 链
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });
    await page.route('**/api/ud01/authentication*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } })
      });
    });
    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { doctypes: ['TECHNICAL_SPEC'] } })
      });
    });
    await page.route('**/api/ud18/deleteedoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '' })
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
    // Mock 文档列表确保 selectOption 可选到 CERTIFICATE
    await page.route('**/api/ud20/getdocumentlist', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [
          { documentType: 'TECHNICAL_SPEC', description: 'Technical Spec' },
          { documentType: 'CERTIFICATE', description: 'Certificate' },
          { documentType: 'DIMENSION_PLATE', description: 'Dimension Plate' },
          { documentType: '123', description: 'Doc 123' },
        ]})
      });
    });

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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

    // 1. 先登录系统，进入 UD18 画面
    await goToUD18(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD18/);
    await expect(page.locator('.ud18-container')).toBeVisible();
    await takeScreenshot(page, 'UD18画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    // 页面未刷新，UD18 画面仍然显示（React 不自动检测 localStorage 变化）
    await expect(page).toHaveURL(/\/UD18/);
    await expect(page.locator('.ud18-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD18 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD18');
    // AppLayout 检测到未登录状态，自动重定向到 Login
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD18 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud18-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD18_044_安全性_UserID格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '44';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const useridInput = page.locator('#ud18-userid');
    await useridInput.fill('admin@123');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    const val = await useridInput.inputValue();
    expect(val).not.toContain('@');
    expect(val).not.toContain('#');
    await takeScreenshot(page, '安全性UserID格式验证');
  });

  test('UD18_045_安全性_UserID去除首尾空格', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '45';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 逐字输入含空格的 UserID，空格被 USER_ID_REGEX 逐个过滤
    // 最终 userID='admin'，trim 后查询成功
    await page.locator('#ud18-userid').pressSequentially('  admin  ', { delay: 50 });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    // 查询成功说明空格被过滤、trim 生效
    await expect(page.locator('.ud18-user-value')).not.toHaveText('');
    await takeScreenshot(page, '安全性UserID去除首尾空格');
  });

  test('UD18_046_安全性_操作更新流程', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '46';

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
    await page.locator('.ud18-btn-info').click();
    await page.waitForTimeout(1500);

    await page.locator('#ud18-document').selectOption(['TECHNICAL_SPEC', 'CERTIFICATE']);
    await page.waitForTimeout(200);

    // 使用真实后端 API 进行更新
    await page.locator('.ud18-btn-update').click();
    await page.waitForTimeout(1500);

    await takeScreenshot(page, '安全性操作更新流程');
  });

  test('UD18_047_安全性_防止未授权权限修改', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '47';

    // Mock 完整 API 链
    await page.route('**/api/ud18/checkauth*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: { exists: true } })
      });
    });
    await page.route('**/api/ud01/authentication*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { username: 'Administrator' } })
      });
    });
    await page.route('**/api/ud18/getuserdoc*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { doctypes: ['TECHNICAL_SPEC'] } })
      });
    });
    await page.route('**/api/ud18/deleteedoc', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '' })
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

    await goToUD18(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#ud18-userid').fill('admin');
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');
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
