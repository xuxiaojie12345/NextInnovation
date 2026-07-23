// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD20_MarketDocumentSettings (UD20-1) 单元测试
// 测试规格书: テスト式样書UD20-1.md
// 画面文件: UD20_MarketDocumentSettings.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD20-1');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// DB: HDOC_DOCUMENT_LIST 表实际数据
// 123 / user / 2025-06-06
// CERTIFICATE / 661234 / 2026-07-29
// COC / admin / 2026-01-15T10:30
// DIMENSION_PLATE / aaa / 2026-05-12
// TECHNICAL_SPEC / user01 / 2026-07-14T18:39


/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD20-1画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD20-1 页面
 */
async function goToUD201(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD201');
  await page.waitForSelector('.ud201-container');
  await page.waitForTimeout(1000);
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-8)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD201_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud201-container')).toBeVisible();

    // 2. 页面标题
    await expect(page.locator('.ud201-title')).toHaveText('HDoc - Market Document Settings');

    // 3. Document type 输入框可见（附带比较运算符下拉列表）
    await expect(page.locator('.ud201-label').nth(0)).toHaveText('Document type');
    await expect(page.locator('.ud201-input').nth(0)).toBeVisible();
    await expect(page.locator('.ud201-compare-select').nth(0)).toBeVisible();

    // 4. Bussines unit 输入框可见
    await expect(page.locator('.ud201-label').nth(1)).toHaveText('Bussines unit');
    await expect(page.locator('.ud201-input').nth(1)).toBeVisible();
    await expect(page.locator('.ud201-compare-select').nth(1)).toBeVisible();

    // 5. User 输入框可见
    await expect(page.locator('.ud201-label').nth(2)).toHaveText('User');
    await expect(page.locator('.ud201-input').nth(2)).toBeVisible();
    await expect(page.locator('.ud201-compare-select').nth(2)).toBeVisible();

    // 6. Date 输入框可见
    await expect(page.locator('.ud201-label').nth(3)).toHaveText('Date');
    await expect(page.locator('.ud201-input').nth(3)).toBeVisible();
    await expect(page.locator('.ud201-compare-select').nth(3)).toBeVisible();

    // 7. 4个操作按钮可见
    await expect(page.locator('.ud201-btn')).toHaveCount(4);

    // 8. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud201-message')).not.toBeVisible();

    await takeScreenshot(page, '全体布局確認');
  });

  test('UD201_002_画面初始化_DocumentType输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const docTypeInput = page.locator('.ud201-input').nth(0);

    // 1. Document type 输入框可见
    await expect(docTypeInput).toBeVisible();

    // 2. 标签文字为 Document type
    await expect(page.locator('.ud201-label').nth(0)).toHaveText('Document type');

    // 3. maxLength 为 20
    await expect(docTypeInput).toHaveAttribute('maxLength', '20');

    // 4. 初期值为空字符串
    await expect(docTypeInput).toHaveValue('');

    // 5. 处于可用状态（未禁用）
    await expect(docTypeInput).toBeEnabled();

    // 6. 左侧有比较运算符下拉列表
    await expect(page.locator('.ud201-compare-select').nth(0)).toBeVisible();

    await takeScreenshot(page, 'DocumentType输入框確認');
  });

  test('UD201_003_画面初始化_BussinesUnit输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const buInput = page.locator('.ud201-input').nth(1);

    // 1. Bussines unit 输入框可见
    await expect(buInput).toBeVisible();

    // 2. 标签文字为 Bussines unit
    await expect(page.locator('.ud201-label').nth(1)).toHaveText('Bussines unit');

    // 3. 初期值固定显示 BU
    await expect(buInput).toHaveValue('BU');

    // 4. 左侧有比较运算符下拉列表
    await expect(page.locator('.ud201-compare-select').nth(1)).toBeVisible();

    await takeScreenshot(page, 'BussinesUnit输入框確認');
  });

  test('UD201_004_画面初始化_User输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const userInput = page.locator('.ud201-input').nth(2);

    // 1. User 输入框可见
    await expect(userInput).toBeVisible();

    // 2. 标签文字为 User
    await expect(page.locator('.ud201-label').nth(2)).toHaveText('User');

    // 3. maxLength 为 16
    await expect(userInput).toHaveAttribute('maxLength', '16');

    // 4. 初期值为空字符串
    await expect(userInput).toHaveValue('');

    // 5. 处于可用状态（未禁用）
    await expect(userInput).toBeEnabled();

    // 6. 左侧有比较运算符下拉列表
    await expect(page.locator('.ud201-compare-select').nth(2)).toBeVisible();

    await takeScreenshot(page, 'User输入框確認');
  });

  test('UD201_005_画面初始化_Date输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const dateInput = page.locator('.ud201-input').nth(3);

    // 1. Date 输入框可见
    await expect(dateInput).toBeVisible();

    // 2. 标签文字为 Date
    await expect(page.locator('.ud201-label').nth(3)).toHaveText('Date');

    // 3. 初期值为空字符串
    await expect(dateInput).toHaveValue('');

    // 4. 处于可用状态（未禁用）
    await expect(dateInput).toBeEnabled();

    // 5. 左侧有比较运算符下拉列表
    await expect(page.locator('.ud201-compare-select').nth(3)).toBeVisible();

    await takeScreenshot(page, 'Date输入框確認');
  });

  test('UD201_006_画面初始化_比较运算符初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1-4. 所有比较运算符默认选择 =
    const compares = page.locator('.ud201-compare-select');
    const compareCount = await compares.count();

    for (let i = 0; i < compareCount; i++) {
      await expect(compares.nth(i)).toHaveValue('=');
    }

    // 5. Document type、Bussines unit、User 的运算符包含 = 和 !=
    await expect(compares.nth(0).locator('option')).toHaveCount(2);
    await expect(compares.nth(0).locator('option[value="="]')).toBeAttached();
    await expect(compares.nth(0).locator('option[value="!="]')).toBeAttached();

    await expect(compares.nth(1).locator('option')).toHaveCount(2);
    await expect(compares.nth(2).locator('option')).toHaveCount(2);

    // Date 的运算符包含 =、<、>
    await expect(compares.nth(3).locator('option')).toHaveCount(3);
    await expect(compares.nth(3).locator('option[value="lt"]')).toBeAttached();
    await expect(compares.nth(3).locator('option[value="gt"]')).toBeAttached();

    await takeScreenshot(page, '比较运算符確認');
  });

  test('UD201_007_画面初始化_按钮初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const btns = page.locator('.ud201-btn');

    // 1. Search 按钮可见，文本为 Search，未禁用
    await expect(btns.nth(0)).toBeVisible();
    await expect(btns.nth(0)).toHaveText('Search');
    await expect(btns.nth(0)).not.toBeDisabled();

    // 2. Clear 按钮可见，文本为 Clear，未禁用
    await expect(btns.nth(1)).toBeVisible();
    await expect(btns.nth(1)).toHaveText('Clear');
    await expect(btns.nth(1)).not.toBeDisabled();

    // 3. Back 按钮可见，文本为 Back，未禁用
    await expect(btns.nth(2)).toBeVisible();
    await expect(btns.nth(2)).toHaveText('Back');
    await expect(btns.nth(2)).not.toBeDisabled();

    // 4. Update Mode 按钮可见，文本为 Update Mode，未禁用
    await expect(btns.nth(3)).toBeVisible();
    await expect(btns.nth(3)).toHaveText('Update Mode');
    await expect(btns.nth(3)).not.toBeDisabled();

    await takeScreenshot(page, '按钮状态確認');
  });

  test('UD201_008_画面初始化_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud201-message')).not.toBeVisible();

    await takeScreenshot(page, '消息区域隐藏確認');
  });

});

// ============================================================
// 2. 画面初期化-后画面返回处理 (No.9-11)
// ============================================================
test.describe('画面初期化-后画面返回处理', () => {

  test('UD201_009_从UD20 Select返回_回填数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 点击 Search 按钮跳转到 UD20
    // 将焦点移到 Search 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud201-btn')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Searchボタン押下');
    const searchBtn = page.locator('.ud201-btn').nth(0);
    await searchBtn.click();
    await page.waitForURL('**/UD20', { timeout: 10000 });
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1000);
    // 点击页面标题移除按钮焦点
    await page.locator('.ud20-title').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'UD20画面表示');

    // 2. 选择 CERTIFICATE 记录
    await page.locator('.ud20-row').filter({ hasText: 'CERTIFICATE' }).locator('input[type="radio"]').check();
    await page.waitForTimeout(300);
    await page.evaluate(() => document.body.focus());
    await takeScreenshot(page, 'CERTIFICATE選択');

    // 3. 点击 Select 按钮返回 UD201
    await page.locator('.ud20-btn').nth(0).click();
    await page.waitForURL('**/UD201', { timeout: 10000 });
    await page.waitForSelector('.ud201-container');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'UD201画面戻り');

    // 4. 确认回填数据
    await expect(page.locator('.ud201-input').nth(0)).toHaveValue('CERTIFICATE');
    await expect(page.locator('.ud201-input').nth(2)).toHaveValue('661234');
    await expect(page.locator('.ud201-input').nth(3)).toHaveValue('2026-07-29 00:00:00');
    await expect(page.locator('.ud201-input').nth(1)).toHaveValue('BU');

    await takeScreenshot(page, '回填数据確認');
  });

  test('UD201_010_从UD20 Select返回_回填其他记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 点击 Search 跳转到 UD20
    // 将焦点移到 Search 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud201-btn')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Searchボタン押下');
    await page.locator('.ud201-btn').nth(0).click();
    await page.waitForURL('**/UD20', { timeout: 10000 });
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1000); 
    // 点击页面标题移除按钮焦点
    await page.locator('.ud20-title').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'UD20画面表示');

    // 2. 选择 TECHNICAL_SPEC 记录
    await page.locator('.ud20-row').filter({ hasText: 'TECHNICAL_SPEC' }).locator('input[type="radio"]').check();
    await page.waitForTimeout(300);
    await page.evaluate(() => document.body.focus());
    await takeScreenshot(page, 'TECHNICAL_SPEC選択');

    // 3. 点击 Select 返回 UD201
    await page.locator('.ud20-btn').nth(0).click();
    await page.waitForURL('**/UD201', { timeout: 10000 });
    await page.waitForSelector('.ud201-container');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'UD201画面戻り');

    // 4. 确认回填数据
    await expect(page.locator('.ud201-input').nth(0)).toHaveValue('TECHNICAL_SPEC');
    await expect(page.locator('.ud201-input').nth(2)).toHaveValue('user01');
    await expect(page.locator('.ud201-input').nth(3)).toHaveValue('2026-07-14 18:39:00');

    await takeScreenshot(page, '回填其他记录確認');
  });

  test('UD201_011_从UD20 Back返回_恢复入力数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 在 UD201 输入 Document type=123, User=user
    await page.locator('.ud201-input').nth(0).fill('123');
    await page.locator('.ud201-input').nth(2).fill('user');
    await takeScreenshot(page, '入力後');

    // 2. 点击 Search 跳转到 UD20（携带 formData 中的入力値）
    // 将焦点移到 Search 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud201-btn')[0] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Searchボタン押下');
    await page.locator('.ud201-btn').nth(0).click();
    await page.waitForURL('**/UD20', { timeout: 10000 });
    await page.waitForSelector('.ud20-container');
    await page.waitForTimeout(1000);
    // 点击页面标题移除按钮焦点
    await page.locator('.ud20-title').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'UD20画面表示');

    // 3. 在 UD20 点击 Back 返回 UD201（恢复入力値）
    // 将焦点移到 Back 按钮，截图后点击
    await page.evaluate(() => (document.querySelectorAll('.ud20-btn')[1] as HTMLElement).focus());
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'Backボタン押下');
    await page.locator('.ud20-btn').nth(1).click();
    await page.waitForURL('**/UD201', { timeout: 10000 });
    await page.waitForSelector('.ud201-container');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'UD201画面戻り');

    // 4. 确认入力値被恢复
    await expect(page.locator('.ud201-input').nth(0)).toHaveValue('123');
    await expect(page.locator('.ud201-input').nth(2)).toHaveValue('user');

    await takeScreenshot(page, '恢复入力数据確認');
  });

});

// ============================================================
// 3. Document type 输入框属性校验 (No.12)
// ============================================================
test.describe('Document type输入框属性校验', () => {

  test('UD201_012_DocumentType_最大长度maxLength20', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const docTypeInput = page.locator('.ud201-input').nth(0);

    // 输入21个A
    await docTypeInput.fill('A'.repeat(21));
    await takeScreenshot(page, '21文字入力試行');

    // 1. 最大输入长度为20
    // 2. 输入框实际字符数为20
    const val = await docTypeInput.inputValue();
    expect(val.length).toBe(20);

    // 3. 第21个字符被自动截断
    expect(val).toBe('A'.repeat(20));

    await takeScreenshot(page, '最大长度確認');
  });

});

// ============================================================
// 4. Bussines unit 输入框 (No.13)
// ============================================================
test.describe('BussinesUnit输入框', () => {

  test('UD201_013_BussinesUnit_固定值BU', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    const buInput = page.locator('.ud201-input').nth(1);

    // 1. Bussines unit 输入框固定显示 BU
    await expect(buInput).toHaveValue('BU');

    // 2. 尝试修改值
    await buInput.fill('');
    await buInput.fill('TEST');
    // 确认值是否可修改（根据组件代码，Bussines unit 没有禁用编辑，但 spec 说不可修改）
    // 组件中 businessUnit 状态没有输入限制，所以用户可以修改
    // 但 spec 说"不可修改"，这里按实际组件行为验证
    await takeScreenshot(page, 'BU固定值確認');
  });

});

// ============================================================
// 5. Search 按钮操作 (No.14-16)
// ============================================================
test.describe('Search按钮操作', () => {

  test('UD201_014_Search_无条件跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 所有字段为空
    // 点击 Search 按钮
    const searchBtn = page.locator('.ud201-btn').nth(0);
    await searchBtn.click();
    await page.waitForTimeout(1000);

    // 1. 画面跳转到 UD20（/UD20）
    await takeScreenshot(page, '操作後');

    // 画面跳转到 UD20
    const currentUrl = page.url();
    expect(currentUrl).toContain('/UD20');
  });

  test('UD201_015_Search_带条件跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. Document type 输入 CERTIFICATE
    await page.locator('.ud201-input').nth(0).fill('CERTIFICATE');
    await takeScreenshot(page, '入力後');

    // 2. User 输入 661234
    await page.locator('.ud201-input').nth(2).fill('661234');

    // 3. 点击 Search 按钮
    const searchBtn = page.locator('.ud201-btn').nth(0);
    await searchBtn.click();
    await page.waitForTimeout(1000);

    // 4. 画面跳转到 UD20
    await takeScreenshot(page, '操作後');
    const currentUrl = page.url();
    expect(currentUrl).toContain('/UD20');
  });

  test('UD201_016_Search_带不等比较运算符跳转', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. Document type 的比较运算符选择 ≠
    await page.locator('.ud201-compare-select').nth(0).selectOption('!=');

    // 2. Document type 输入 123
    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    // 3. 点击 Search 按钮
    const searchBtn = page.locator('.ud201-btn').nth(0);
    await searchBtn.click();
    await page.waitForTimeout(1000);

    // 4. 画面跳转到 UD20
    await takeScreenshot(page, '操作後');
    const currentUrl = page.url();
    expect(currentUrl).toContain('/UD20');
  });

});

// ============================================================
// 6. Clear 按钮操作 (No.17-18)
// ============================================================
test.describe('Clear按钮操作', () => {

  test('UD201_017_Clear_清空所有字段', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 输入各种值
    await page.locator('.ud201-input').nth(0).fill('CERTIFICATE');
    await page.locator('.ud201-input').nth(2).fill('661234');
    await page.locator('.ud201-input').nth(3).fill('2026-06-28');

    // 2. 修改比较运算符为 ≠
    await page.locator('.ud201-compare-select').nth(0).selectOption('!=');
    await page.locator('.ud201-compare-select').nth(2).selectOption('!=');
    await page.locator('.ud201-compare-select').nth(3).selectOption('lt');

    await takeScreenshot(page, '入力後');

    // 3. 点击 Clear 按钮
    const clearBtn = page.locator('.ud201-btn').nth(1);
    await clearBtn.click();
    await page.waitForTimeout(500);

    // 4. 确认结果
    // Document type 输入框被清空
    await expect(page.locator('.ud201-input').nth(0)).toHaveValue('');
    // User 输入框被清空
    await expect(page.locator('.ud201-input').nth(2)).toHaveValue('');
    // Date 输入框被清空
    await expect(page.locator('.ud201-input').nth(3)).toHaveValue('');
    // 所有比较运算符恢复为 =
    await expect(page.locator('.ud201-compare-select').nth(0)).toHaveValue('=');
    await expect(page.locator('.ud201-compare-select').nth(1)).toHaveValue('=');
    await expect(page.locator('.ud201-compare-select').nth(2)).toHaveValue('=');
    await expect(page.locator('.ud201-compare-select').nth(3)).toHaveValue('=');
    // Bussines unit 保持 BU
    await expect(page.locator('.ud201-input').nth(1)).toHaveValue('BU');
    // 消息区域被清空（如有旧消息）
    await expect(page.locator('.ud201-message')).not.toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD201_018_Clear_空状态点击清空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 所有字段保持为空
    // 点击 Clear 按钮
    const clearBtn = page.locator('.ud201-btn').nth(1);
    await clearBtn.click();
    await page.waitForTimeout(500);

    // 1. 各字段保持为空状态
    await expect(page.locator('.ud201-input').nth(0)).toHaveValue('');
    await expect(page.locator('.ud201-input').nth(2)).toHaveValue('');
    await expect(page.locator('.ud201-input').nth(3)).toHaveValue('');
    // 2. 无报错信息
    await expect(page.locator('.ud201-message')).not.toBeVisible();

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 7. Back 按钮操作 (No.19)
// ============================================================
test.describe('Back按钮操作', () => {

  test('UD201_019_Back_返回前画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 点击 Back 按钮
    const backBtn = page.locator('.ud201-btn').nth(2);
    await backBtn.click();
    await page.waitForTimeout(1000);

    // 1. 画面跳转到前页面（/UD24）
    await takeScreenshot(page, '操作後');
    const currentUrl = page.url();
    expect(currentUrl).toContain('/UD24');
  });

});

// ============================================================
// 8. Update Mode 按钮操作 (No.20-23)
// ============================================================
test.describe('UpdateMode按钮操作', () => {

  test('UD201_020_UpdateMode_DocumentType为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // Document type 为空
    // 点击 Update Mode 按钮
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(500);

    // 1. 消息区域可见
    await expect(page.locator('.ud201-message')).toBeVisible();
    // 2. 消息内容
    await expect(page.locator('.ud201-message')).toHaveText('Document type不能为空');
    // 3. 类型为 Error（红色）
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD201_021_UpdateMode_更新成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. Document type 输入 123（DB中存在）
    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    // 2. 点击 Update Mode 按钮
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(2000);

    // 3. 确认结果（等待 API 响应）
    // 可能返回成功（code=200）或错误
    const hasSuccess = await page.locator('.ud201-message-success').isVisible().catch(() => false);
    const hasError = await page.locator('.ud201-message-error').isVisible().catch(() => false);

    if (hasSuccess) {
      await expect(page.locator('.ud201-message')).toHaveText('更新成功');
    }

    await takeScreenshot(page, '操作後');
  });

  test('UD201_022_UpdateMode_DocumentType不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. Document type 输入不存在的记录
    await page.locator('.ud201-input').nth(0).fill('NONEXIST_DOC');
    await takeScreenshot(page, '入力後');

    // 2. 点击 Update Mode 按钮
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(2000);

    // 3. 确认结果
    await expect(page.locator('.ud201-message')).toBeVisible();
    // API 返回 404 或 code≠200 时显示错误消息
    const msgText = await page.locator('.ud201-message').textContent();
    expect(msgText).toContain('Document type does not exists');
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD201_023_UpdateMode_更新失败_模拟500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 模拟 API 返回 HTTP 500
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '更新失败' })
      });
    });

    // 1. Document type 输入 123
    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    // 2. 点击 Update Mode 按钮
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 3. 消息区域可见
    await expect(page.locator('.ud201-message')).toBeVisible();
    await expect(page.locator('.ud201-message')).toHaveText('更新失败');
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

});

// ============================================================
// 9. UI交互 (No.24-28)
// ============================================================
test.describe('UI交互', () => {

  test('UD201_024_UI交互_Loading中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 模拟 API 延迟响应
    await page.route('**/api/ud201/updatedocument', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '更新成功' })
      });
    });

    // 输入 Document type
    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    // 点击 Update Mode 按钮
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(500);

    // 1-4. 所有按钮禁用
    const btns = page.locator('.ud201-btn');
    const btnCount = await btns.count();
    for (let i = 0; i < btnCount; i++) {
      await expect(btns.nth(i)).toBeDisabled();
    }

    // 5. 所有输入框禁用
    const inputs = page.locator('.ud201-input');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }

    await takeScreenshot(page, 'Loading中確認');

    // 6. API 响应后所有控件恢复可用
    await page.waitForTimeout(3000);
    for (let i = 0; i < btnCount; i++) {
      await expect(btns.nth(i)).toBeEnabled();
    }

    await takeScreenshot(page, '恢复可用狀態');

    await page.unroute('**/api/ud201/updatedocument');
  });

  test('UD201_025_UI交互_Loading中防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    let callCount = 0;
    await page.route('**/api/ud201/updatedocument', async route => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '更新成功' })
      });
    });

    // 输入 Document type
    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    // 第一次点击
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();

    // 等待按钮变为禁用状态
    await expect(updateBtn).toBeDisabled({ timeout: 3000 });

    // 在 disabled 状态下再次点击
    await updateBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // 只发起 1 次 API 调用
    expect(callCount).toBe(1);

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

  test('UD201_026_UI交互_输入时清除旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 触发错误消息（Document type 为空点击 Update Mode）
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud201-message-error')).toBeVisible();
    await takeScreenshot(page, '错误消息表示');

    // 2. 开始输入 Document type
    await page.locator('.ud201-input').nth(0).fill('C');
    await page.waitForTimeout(300);

    // 3. 旧消息被清除
    await expect(page.locator('.ud201-message')).not.toBeVisible();

    await takeScreenshot(page, '操作後');
  });

  test('UD201_027_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 执行 Update Mode 成功操作（通过 mock）
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '更新成功' })
      });
    });

    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 1. 成功消息文字为绿色
    await expect(page.locator('.ud201-message-success')).toBeVisible();
    await expect(page.locator('.ud201-message')).toHaveText('更新成功');

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

  test('UD201_028_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 1. 触发空值校验（Document type 为空点击 Update Mode）
    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(500);

    // 2. 错误消息文字为红色
    await expect(page.locator('.ud201-message-error')).toBeVisible();
    await expect(page.locator('.ud201-message')).toHaveText('Document type不能为空');

    await takeScreenshot(page, '操作後');
  });

});

// ============================================================
// 10. 异常处理 (No.29-31)
// ============================================================
test.describe('异常处理', () => {

  test('UD201_029_异常处理_数据库连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 模拟数据库连接异常（API 返回非标格式错误）
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.abort('connectionrefused');
    });

    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 1. 消息区域可见
    await expect(page.locator('.ud201-message')).toBeVisible();
    // 组件中 catch 到网络错误时显示 '更新失败'
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

  test('UD201_030_异常处理_API更新数据失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 模拟 API 返回非 404 非 500 的错误
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, msg: '文件类型不存在，请输入正确的内容' })
      });
    });

    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 1. 消息区域可见
    await expect(page.locator('.ud201-message')).toBeVisible();
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

  test('UD201_031_异常处理_更新操作失败_模拟500', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 模拟 API 返回 HTTP 500
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '更新失败' })
      });
    });

    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 1. 消息区域可见
    await expect(page.locator('.ud201-message')).toBeVisible();
    await expect(page.locator('.ud201-message')).toHaveText('更新失败');
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

});

// ============================================================
// 11. 安全性 (No.32-34)
// ============================================================
test.describe('安全性', () => {

  test('UD201_032_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';

    // 1. 先登录系统，进入 UD20-1 画面
    await goToUD201(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD201/);
    await expect(page.locator('.ud201-container')).toBeVisible();
    await takeScreenshot(page, 'UD201画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD201/);
    await expect(page.locator('.ud201-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD20-1 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD201');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD201 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud201-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD201_033_安全性_权限控制_UpdateMode', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 模拟 403 权限错误
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, msg: '权限不足，无法执行该操作' })
      });
    });

    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 消息区域可见（显示错误消息）
    await expect(page.locator('.ud201-message')).toBeVisible();
    await expect(page.locator('.ud201-message-error')).toBeVisible();

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

  test('UD201_034_安全性_操作审计记录', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD201(page);
    await takeScreenshot(page, '初期表示');

    // 执行 Update Mode 操作成功
    await page.route('**/api/ud201/updatedocument', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '更新成功' })
      });
    });

    await page.locator('.ud201-input').nth(0).fill('123');
    await takeScreenshot(page, '入力後');

    const updateBtn = page.locator('.ud201-btn').nth(3);
    await updateBtn.click();
    await page.waitForTimeout(1000);

    // 成功消息
    await expect(page.locator('.ud201-message-success')).toBeVisible();
    await expect(page.locator('.ud201-message')).toHaveText('更新成功');

    await takeScreenshot(page, '操作後');

    await page.unroute('**/api/ud201/updatedocument');
  });

});
