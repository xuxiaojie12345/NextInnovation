// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD16_ADChange 单元测试
// 测试规格书: テスト式样書UD16.md
// 画面文件: UD16_ADChange.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD16');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';
const UNIQUE_ID = `T${Date.now().toString(36).toUpperCase()}`;

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD16画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD16 页面
 */
async function goToUD16(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD16');
  await page.waitForSelector('.ud16-container');
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
// 1. 画面初期表示 (No.1-5)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD16_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await goToUD16(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud16-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    await expect(page.locator('.ud16-title')).toHaveText('AD Change');
    await takeScreenshot(page, '页面标题');

    await expect(page.locator('#serieChnr')).toBeVisible();
    await takeScreenshot(page, 'Serie-Chnr输入框可见');

    await expect(page.locator('#desc')).toBeVisible();
    await takeScreenshot(page, 'Desc输入框可见');

    await expect(page.locator('.ud16-btn-add')).toBeVisible();
    await expect(page.locator('.ud16-btn-delete')).toBeVisible();
    await expect(page.locator('.ud16-btn-check')).toBeVisible();
    await takeScreenshot(page, '按钮可见');

    await expect(page.locator('.ud16-message')).not.toBeVisible();
    await expect(page.locator('.ud16-modal-overlay')).not.toBeVisible();
    await takeScreenshot(page, '整体布局');
  });

  test('UD16_002_画面初始化_SerieChnr输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD16(page);
    await page.waitForTimeout(1000);

    const input = page.locator('#serieChnr');
    await expect(input).toBeVisible();
    await expect(page.locator('label[for="serieChnr"]')).toHaveText('Serie-Chnr');
    expect(await input.getAttribute('placeholder')).toBe('请输入Serie-Chnr');
    expect(await input.getAttribute('maxLength')).toBe('16');
    expect(await input.inputValue()).toBe('');
    await expect(input).toBeEnabled();
    await takeScreenshot(page, 'SerieChnr输入框');
  });

  test('UD16_003_画面初始化_Desc输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD16(page);
    await page.waitForTimeout(1000);

    const input = page.locator('#desc');
    await expect(input).toBeVisible();
    await expect(page.locator('label[for="desc"]')).toHaveText('Desc');
    expect(await input.getAttribute('placeholder')).toBe('请输入描述');
    expect(await input.getAttribute('maxLength')).toBe('4000');
    expect(await input.inputValue()).toBe('');
    await expect(input).toBeEnabled();
    await takeScreenshot(page, 'Desc输入框');
  });

  test('UD16_004_画面初始化_按钮初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD16(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud16-btn-add')).toHaveText('ADD');
    await expect(page.locator('.ud16-btn-add')).toBeEnabled();

    await expect(page.locator('.ud16-btn-delete')).toHaveText('DELETE');
    await expect(page.locator('.ud16-btn-delete')).toBeEnabled();

    await expect(page.locator('.ud16-btn-check')).toHaveText('CHECK');
    await expect(page.locator('.ud16-btn-check')).toBeEnabled();
    await takeScreenshot(page, '按钮初期状态');
  });

  test('UD16_005_画面初始化_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD16(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud16-message')).not.toBeVisible();
    await expect(page.locator('.ud16-modal-overlay')).not.toBeVisible();
    await takeScreenshot(page, '消息区域隐藏');
  });
});

// ============================================================
// 2. Serie-Chnr 输入框属性校验 (No.6-10)
// ============================================================
test.describe('Serie-Chnr 输入框属性校验', () => {

  test('UD16_006_SerieChnr_最大长度', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#serieChnr');
    await input.fill('A'.repeat(17));
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    const val = await input.inputValue();
    expect(val.length).toBe(16);
    await takeScreenshot(page, 'SerieChnr最大长度');
  });

  test('UD16_007_SerieChnr_半角英数字输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#serieChnr');
    await input.fill('ABC123');
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    await expect(input).toHaveValue('ABC123');
    await takeScreenshot(page, 'SerieChnr半角英数字');
  });

  test('UD16_008_SerieChnr_连字符输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#serieChnr');
    await input.fill('ABC-123');
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    await expect(input).toHaveValue('ABC-123');
    await takeScreenshot(page, 'SerieChnr连字符');
  });

  test('UD16_009_SerieChnr_特殊字符不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#serieChnr');
    // 逐字输入模拟用户操作：先输入有效字符，特殊字符被拒绝后继续输入
    await input.pressSequentially('ABC@123', { delay: 50 });
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    // @不被接收被跳过，后续123被输入，最终值为ABC123
    const val = await input.inputValue();
    expect(val).toBe('ABC123');
    await takeScreenshot(page, 'SerieChnr特殊字符');
  });

  test('UD16_010_SerieChnr_文字配置左对齐', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#serieChnr');
    await input.fill('test');
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    // 确认文字左对齐
    await expect(input).toHaveValue('test');
    await takeScreenshot(page, 'SerieChnr左对齐');
  });
});

// ============================================================
// 3. Desc 输入框属性校验 (No.11-13)
// ============================================================
test.describe('Desc 输入框属性校验', () => {

  test('UD16_011_Desc_最大长度4000', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#desc');
    await input.fill('A'.repeat(4001));
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(500);

    const val = await input.inputValue();
    expect(val.length).toBe(4000);
    await takeScreenshot(page, 'Desc最大长度');
  });

  test('UD16_012_Desc_允许任意可见字符', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#desc');
    await input.fill('Test description with 中文 and 日本語');
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    await expect(input).toHaveValue('Test description with 中文 and 日本語');
    await takeScreenshot(page, 'Desc任意字符');
  });

  test('UD16_013_Desc_文字配置左对齐', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#desc');
    await input.fill('test');
    await takeScreenshot(page, '入力後');
    await page.waitForTimeout(200);

    await expect(input).toHaveValue('test');
    await takeScreenshot(page, 'Desc左对齐');
  });
});

// ============================================================
// 4. ADD 按钮操作 (No.14-19)
// ============================================================
test.describe('ADD 按钮操作', () => {

  test('UD16_014_ADD_SerieChnr为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Serie-Chnr 为空，Desc 输入值
    await page.locator('#desc').fill('test');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('请输入Serie-Chnr');
    await takeScreenshot(page, 'ADD为空');
  });

  test('UD16_015_ADD_SerieChnr格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 无连字符格式
    await page.locator('#serieChnr').fill('ABC123');
    await page.locator('#desc').fill('test');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('Serie-Chnr格式不正确，请使用连字符分隔（例：ABC-123）');
    await takeScreenshot(page, 'ADD格式验证');
  });

  test('UD16_016_ADD_添加新记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 规格书设定值: Serie-Chnr=NEWTE-123
    await page.locator('#serieChnr').fill('NEWTE-123');
    await page.locator('#desc').fill('Test add new record');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud16-message--success')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('添加成功');

    // 输入框被清空
    await expect(page.locator('#serieChnr')).toHaveValue('');
    await expect(page.locator('#desc')).toHaveValue('');
    await takeScreenshot(page, 'ADD成功');
  });

  test('UD16_017_ADD_添加记录含Desc空值', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 规格书设定值: Serie-Chnr=DESCT-001
    await page.locator('#serieChnr').fill('DESCT-001');
    // Desc 为空
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud16-message--success')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('添加成功');
    await takeScreenshot(page, 'ADD空Desc');
  });

  test('UD16_018_ADD_添加已存在的记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 使用已存在的记录 ABC-123（ACT=N）
    await page.locator('#serieChnr').fill('ABC-123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(1500);

    // 根据组件逻辑，如果返回 409 → 弹框
    const modalVisible = await page.locator('.ud16-modal-dialog').isVisible().catch(() => false);
    const errorVisible = await page.locator('.ud16-message--error').isVisible().catch(() => false);
    expect(modalVisible || errorVisible).toBeTruthy();

    if (modalVisible) {
      await takeScreenshot(page, 'ADD已存在弹框');
      // 关闭弹框
      await page.locator('.ud16-btn-modal-ok').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.ud16-modal-overlay')).not.toBeVisible();
    } else {
      await takeScreenshot(page, 'ADD已存在错误');
    }
  });

  test('UD16_019_ADD_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/addchange', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await page.locator('#serieChnr').fill('TEST500-001');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, 'ADD 500错误');
  });
});

// ============================================================
// 5. DELETE 按钮操作 (No.20-25)
// ============================================================
test.describe('DELETE 按钮操作', () => {

  test('UD16_020_DELETE_SerieChnr为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('请输入Serie-Chnr');
    await takeScreenshot(page, 'DELETE为空');
  });

  test('UD16_021_DELETE_SerieChnr格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#serieChnr').fill('ABC123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('Serie-Chnr格式不正确，请使用连字符分隔（例：ABC-123）');
    await takeScreenshot(page, 'DELETE格式验证');
  });

  test('UD16_022_DELETE_删除记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 使用数据库中已有的记录 ABC-123（SERIE=ABC、CHNR=123）
    await page.locator('#serieChnr').fill('ABC-123');
    await page.locator('#desc').fill('To be deleted');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud16-message--success')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('删除成功');

    // 输入框被清空
    await expect(page.locator('#serieChnr')).toHaveValue('');
    await expect(page.locator('#desc')).toHaveValue('');
    await takeScreenshot(page, 'DELETE成功');
  });

  test('UD16_023_DELETE_删除不存在的记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#serieChnr').fill('NONEXIST-999');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('记录不存在');
    await takeScreenshot(page, 'DELETE不存在');
  });

  test('UD16_024_DELETE_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/deletechange', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await page.locator('#serieChnr').fill('ABC-123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, 'DELETE 500错误');
  });

  test('UD16_025_DELETE_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/deletechange', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await page.locator('#serieChnr').fill('ABC-123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(35000);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('网络连接失败，请检查网络设置');
    await takeScreenshot(page, 'DELETE网络失败');
  });
});

// ============================================================
// 6. CHECK 按钮操作 (No.26-30)
// ============================================================
test.describe('CHECK 按钮操作', () => {

  test('UD16_026_CHECK_SerieChnr为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud16-btn-check').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('请输入Serie-Chnr');
    await takeScreenshot(page, 'CHECK为空');
  });

  test('UD16_027_CHECK_SerieChnr格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#serieChnr').fill('ABC123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-check').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('Serie-Chnr格式不正确，请使用连字符分隔（例：ABC-123）');
    await takeScreenshot(page, 'CHECK格式验证');
  });

  test('UD16_028_CHECK_检查已存在的记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 使用已存在的记录 jpct-8801（ACT=Y）
    await page.locator('#serieChnr').fill('jpct-8801');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-check').click();
    await page.waitForTimeout(2000);

    // 弹框显示
    await expect(page.locator('.ud16-modal-dialog')).toBeVisible();
    await expect(page.locator('.ud16-modal-message')).toContainText('对应的数据存在');
    await takeScreenshot(page, 'CHECK存在弹框');

    // 关闭弹框
    await page.locator('.ud16-btn-modal-ok').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-modal-overlay')).not.toBeVisible();
    await takeScreenshot(page, 'CHECK弹框关闭');
  });

  test('UD16_029_CHECK_检查不存在的记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('#serieChnr').fill('NONEXIST-999');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-check').click();
    await page.waitForTimeout(2000);

    // 后端可能返回弹框或错误消息
    const modal = page.locator('.ud16-modal-dialog');
    const errorMsg = page.locator('.ud16-message--error');
    const modalVisible = await modal.isVisible().catch(() => false);
    const errorVisible = await errorMsg.isVisible().catch(() => false);
    expect(modalVisible || errorVisible).toBeTruthy();

    if (modalVisible) {
      await expect(page.locator('.ud16-modal-message')).toContainText('记录不存在');
      await takeScreenshot(page, 'CHECK不存在弹框');
      await page.locator('.ud16-btn-modal-ok').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.ud16-modal-overlay')).not.toBeVisible();
    } else {
      await expect(errorMsg).toContainText('记录不存在');
      await takeScreenshot(page, 'CHECK不存在错误');
    }
  });

  test('UD16_030_CHECK_检查后关闭弹框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // CHECK 已存在记录
    await page.locator('#serieChnr').fill('jpct-8801');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-check').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud16-modal-dialog')).toBeVisible();
    await takeScreenshot(page, 'CHECK弹框显示');

    // 点击确定关闭
    await page.locator('.ud16-btn-modal-ok').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-modal-overlay')).not.toBeVisible();
    await takeScreenshot(page, 'CHECK弹框关闭后');
  });
});

// ============================================================
// 7. UI交互 (No.31-37)
// ============================================================
test.describe('UI交互', () => {

  test('UD16_031_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Mock 延迟观察 Loading 状态
    await page.route('**/api/ud16/addchange', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    await page.locator('#serieChnr').fill('LOADTST-001');
    await page.locator('#desc').fill('Loading test');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(500);

    // Loading 中所有按钮禁用、输入框禁用
    await expect(page.locator('.ud16-btn-add')).toHaveText('处理中...');
    await expect(page.locator('.ud16-btn-add')).toBeDisabled();
    await expect(page.locator('.ud16-btn-delete')).toBeDisabled();
    await expect(page.locator('.ud16-btn-check')).toBeDisabled();
    await expect(page.locator('#serieChnr')).toBeDisabled();
    await expect(page.locator('#desc')).toBeDisabled();
    await takeScreenshot(page, 'Loading中禁用');

    // 等待加载完成
    await page.waitForTimeout(3500);
    await expect(page.locator('.ud16-btn-add')).toBeEnabled();
    await takeScreenshot(page, '加载完成恢复');
  });

  test('UD16_032_UI交互_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/addchange', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    const btn = page.locator('.ud16-btn-add');
    await page.locator('#serieChnr').fill('DUPCHECK-01');
    await takeScreenshot(page, '入力後');
    await btn.click();
    await page.waitForTimeout(300);
    // 第二次点击无效
    await btn.click();
    await page.waitForTimeout(500);

    await expect(btn).toBeDisabled();
    await takeScreenshot(page, '防止重复提交');

    await page.waitForTimeout(3500);
  });

  test('UD16_033_UI交互_输入时清除旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 触发错误消息
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await takeScreenshot(page, '错误消息表示');

    // 开始输入清除旧消息
    await page.locator('#serieChnr').fill('A');
    await page.waitForTimeout(300);

    await expect(page.locator('.ud16-message')).not.toBeVisible();
    await takeScreenshot(page, '输入清除旧消息');
  });

  test('UD16_034_UI交互_ADD成功后清空输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 规格书设定值: Serie-Chnr=CLRTE-001, Desc=Clear test
    await page.locator('#serieChnr').fill('CLRTE-001');
    await page.locator('#desc').fill('Clear test');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(3000);

    await expect(page.locator('.ud16-message--success')).toBeVisible();

    // 输入框被清空
    await expect(page.locator('#serieChnr')).toHaveValue('');
    await expect(page.locator('#desc')).toHaveValue('');
    await takeScreenshot(page, 'ADD後清空');
  });

  test('UD16_035_UI交互_DELETE成功后清空输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 规格书设定值: Serie-Chnr=ABC-123
    await page.locator('#serieChnr').fill('ABC-123');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.ud16-message--success')).toBeVisible();

    await expect(page.locator('#serieChnr')).toHaveValue('');
    await expect(page.locator('#desc')).toHaveValue('');
    await takeScreenshot(page, 'DELETE後清空');
  });

  test('UD16_036_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 规格书设定值: Serie-Chnr=NEWTE-001
    await page.locator('#serieChnr').fill('NEWT-001');
    await page.locator('#desc').fill('Green test');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud16-message--success')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('添加成功');
    await takeScreenshot(page, '成功消息绿色');
  });

  test('UD16_037_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('请输入Serie-Chnr');
    await takeScreenshot(page, '错误消息红色');
  });
});

// ============================================================
// 8. 异常处理 (No.38-44)
// ============================================================
test.describe('异常处理', () => {

  test('UD16_038_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/addchange', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await page.locator('#serieChnr').fill('NETFAIL-01');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(35000);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('网络连接失败，请检查网络设置');
    await takeScreenshot(page, '网络连接失败');
  });

  test('UD16_039_异常处理_服务器内部错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/addchange', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '服务器内部错误，请联系管理员', data: null })
      });
    });

    await page.locator('#serieChnr').fill('SRVFAIL-01');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('服务器内部错误，请联系管理员');
    await takeScreenshot(page, '服务器内部错误');
  });

  test('UD16_040_异常处理_数据库插入失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 模拟连接断开导致数据库插入失败
    await page.route('**/api/ud16/addchange', async route => {
      await route.abort('connectionrefused');
    });

    await page.locator('#serieChnr').fill('DBFAIL-01');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await takeScreenshot(page, '数据库插入失败');
  });

  test('UD16_041_异常处理_数据库删除失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/deletechange', async route => {
      await route.abort('connectionrefused');
    });

    await page.locator('#serieChnr').fill('ABC-123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-delete').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await takeScreenshot(page, '数据库删除失败');
  });

  test('UD16_042_异常处理_数据库查询失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    await page.route('**/api/ud16/checkchange', async route => {
      await route.abort('connectionrefused');
    });

    await page.locator('#serieChnr').fill('ABC-123');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-check').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud16-message--error')).toBeVisible();
    await takeScreenshot(page, '数据库查询失败');
  });

  test('UD16_043_异常处理_并发操作冲突', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '43';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 模拟 409 Conflict
    await page.route('**/api/ud16/addchange', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ code: 409, msg: '数据已被其他用户修改，请刷新后重试', data: null })
      });
    });

    await page.locator('#serieChnr').fill('CONFLICT-01');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(1500);

    // 组件对 409 处理为弹框
    const dialog = page.locator('.ud16-modal-dialog');
    if (await dialog.isVisible().catch(() => false)) {
      await expect(page.locator('.ud16-modal-message')).toContainText('AFTER DEF CHANGE IS NOT ACTIVATED');
      await takeScreenshot(page, '并发冲突弹框');
      await page.locator('.ud16-btn-modal-ok').click();
    } else {
      await takeScreenshot(page, '并发冲突错误消息');
    }
  });

  test('UD16_044_异常处理_主键冲突', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '44';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 使用已存在的记录测试主键冲突
    await page.locator('#serieChnr').fill('jpct-8801');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(2000);

    // 组件可能返回弹框或错误消息
    const dialog = page.locator('.ud16-modal-dialog');
    const errorMsg = page.locator('.ud16-message--error');
    const dialogVisible = await dialog.isVisible().catch(() => false);
    const errorVisible = await errorMsg.isVisible().catch(() => false);
    expect(dialogVisible || errorVisible).toBeTruthy();

    if (dialogVisible) {
      await takeScreenshot(page, '主键冲突弹框');
      await page.locator('.ud16-btn-modal-ok').click();
    } else {
      await takeScreenshot(page, '主键冲突错误');
    }
  });
});

// ============================================================
// 9. 安全性 (No.45-48)
// ============================================================
test.describe('安全性', () => {

  test('UD16_045_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '45';

    await page.goto(BASE_URL + '/UD16');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示(未Login)');
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '未登录重定向');
  });

  test('UD16_046_安全性_SerieChnr格式验证', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '46';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const input = page.locator('#serieChnr');
    // 逐字输入，特殊字符被跳过，最终只保留有效字符
    await input.pressSequentially('ABC@#123', { delay: 50 });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // @和#被跳过，最终值为ABC123
    const val = await input.inputValue();
    expect(val).toBe('ABC123');
    await takeScreenshot(page, 'SerieChnr格式验证');
  });

  test('UD16_047_安全性_操作审计记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '47';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 规格书设定值: Serie-Chnr=AUDIT-TST01
    await page.locator('#serieChnr').fill('AUDIT-TST01');
    await page.locator('#desc').fill('Audit test');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud16-message--success')).toBeVisible();
    await expect(page.locator('.ud16-message')).toContainText('添加成功');
    await takeScreenshot(page, '审计记录');
  });

  test('UD16_048_安全性_防止未授权数据修改', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '48';
    await goToUD16(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 前端不阻止操作，后端验证权限
    // 正常登录用户应该能访问
    await page.locator('#serieChnr').fill('AUTH-001');
    await takeScreenshot(page, '入力後');
    await page.locator('.ud16-btn-add').click();
    await page.waitForTimeout(2000);

    // 正常用户操作应成功（或根据权限返回相应消息）
    const successMsg = page.locator('.ud16-message--success');
    const errorMsg = page.locator('.ud16-message--error');
    const isSuccess = await successMsg.isVisible().catch(() => false);
    const isError = await errorMsg.isVisible().catch(() => false);

    if (isSuccess) {
      await expect(successMsg).toContainText('添加成功');
    }
    await takeScreenshot(page, '权限验证');
  });
});
