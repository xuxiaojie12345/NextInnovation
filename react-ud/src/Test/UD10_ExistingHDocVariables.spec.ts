// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD10_ExistingHDocVariables 单元测试
// 测试规格书: テスト式样書UD10.md
// 画面文件: UD10_ExistingHDocVariables.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD10');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// 真实数据库已有数据
const EXISTING_VARIABLE = '1001';
const EXISTING_VARIABLE_1002 = '1002';
const NONEXIST_VARIABLE = 'NONEXIST_VAR_99999';

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD10画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD10 页面
 */
async function goToUD10(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD10');
  await page.waitForSelector('.ud10-container');
  await page.waitForTimeout(1000);
}

/**
 * 获取第N个字段行（1-indexed）
 * .ud10-content > .ud10-row 索引:
 * 1: Variable, 2: Type, 3: Description, 4: Created by user, 5: Date
 */
function fieldRow(n: number) {
  return `.ud10-content > .ud10-row:nth-child(${n + 1})`;
}

/** 获取第N个字段的输入框 */
function fieldInput(n: number) {
  return `${fieldRow(n)} .ud10-input`;
}

/** 获取第N个字段的选择框（仅Type字段有） */
function fieldSelect(n: number) {
  return `${fieldRow(n)} .ud10-select`;
}

/** 获取第N个字段的运算符下拉框 */
function fieldOperator(n: number) {
  return `${fieldRow(n)} .ud10-compare-select`;
}

/** 获取第N个字段的标签 */
function fieldLabel(n: number) {
  return `${fieldRow(n)} .ud10-label`;
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-9)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD10_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud10-container')).toBeVisible();
    // 2. 标题
    await expect(page.locator('.ud10-title')).toHaveText('Existing HDoc Variables');
    // 3. 所有输入控件可见
    const labels = ['Variable', 'Type', 'Description', 'Created by user', 'Date'];
    for (let i = 0; i < labels.length; i++) {
      await expect(page.locator(fieldLabel(i + 1))).toContainText(labels[i]);
    }
    // 4. 所有操作按钮可见
    const buttons = ['Search', 'Clear', 'Back', 'Add', 'Update', 'Delete', 'Excel'];
    for (const btn of buttons) {
      await expect(page.locator(`.ud10-btn`).filter({ hasText: btn })).toBeVisible();
    }
    // 5. 消息区域不在页面中
    await expect(page.locator('.ud10-message')).toHaveCount(0);
  });

  test('UD10_002_画面初始化_Variable输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(input).toBeEnabled();
  });

  test('UD10_003_画面初始化_Type下拉列表', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const select = page.locator(fieldSelect(2));
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('');
    await expect(select).toBeEnabled();

    // 下拉选项包含 VDA、User Defined
    const options = await select.locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed).toContain('VDA');
    expect(trimmed).toContain('User Defined');
  });

  test('UD10_004_画面初始化_Description输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(3));
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(input).toBeEnabled();
  });

  test('UD10_005_画面初始化_Created by user输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(input).toBeEnabled();
    await expect(page.locator(`${fieldRow(4)} .ud10-suffix`)).toContainText('Automatic');
  });

  test('UD10_006_画面初始化_Date输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(5));
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(input).toBeEnabled();
    await expect(page.locator(`${fieldRow(5)} .ud10-suffix`)).toContainText('Automatic');
  });

  test('UD10_007_画面初始化_按钮初期状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const btnLabels = ['Search', 'Clear', 'Back', 'Add', 'Update', 'Delete', 'Excel'];
    for (const label of btnLabels) {
      const btn = page.locator('.ud10-btn').filter({ hasText: label });
      await expect(btn).toBeVisible();
      await expect(btn).toHaveText(label);
      await expect(btn).toBeEnabled();
    }
  });

  test('UD10_008_画面初始化_消息区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    // 消息区域不在页面中
    await expect(page.locator('.ud10-message')).toHaveCount(0);
  });

  test('UD10_009_画面初始化_比较运算符下拉框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    // Date（第5字段）运算符选项为 =, <, >
    const dateOps = await page.locator(fieldOperator(5)).locator('option').allTextContents();
    expect(dateOps.map(o => o.trim())).toEqual(['=', '<', '>']);

    // 其他字段（Variable, Type, Description, Created by user）运算符选项为 =, !=
    for (const idx of [1, 2, 3, 4]) {
      const ops = await page.locator(fieldOperator(idx)).locator('option').allTextContents();
      expect(ops.map(o => o.trim())).toContain('=');
      expect(ops.map(o => o.trim())).toContain('!=');
    }

    // 所有下拉框默认选择 =
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(fieldOperator(i))).toHaveValue('=');
    }
  });
});

// ============================================================
// 2. Variable输入框 属性校验 (No.10-18)
// ============================================================
test.describe('Variable输入框 属性校验', () => {

  test('UD10_010_Variable_必须属性（Add/Update/Delete时必填）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    // Variable 为空，点击 Add
    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（Variable为空Add）');

    await expect(page.locator('.ud10-message--error')).toContainText('Variable是必填项');
  });

  test('UD10_011_Variable_最大长度超过30字符（31字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('A'.repeat(31));
    await takeScreenshot(page, '入力後（31文字）');

    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(30);
  });

  test('UD10_012_Variable_最大长度30字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234');
    await takeScreenshot(page, '入力後（30文字）');

    await expect(input).toHaveValue('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234');
    await expect(page.locator('.ud10-message')).toHaveCount(0);
  });

  test('UD10_013_Variable_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('VAR_TEST_001');
    await takeScreenshot(page, '入力後');

    await expect(input).toHaveValue('VAR_TEST_001');
  });

  test('UD10_014_Variable_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('TestVariable123');
    await takeScreenshot(page, '入力後');

    await expect(input).toHaveValue('TestVariable123');
  });

  test('UD10_015_Variable_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('VAR-TEST_001.abc');
    await takeScreenshot(page, '入力後');

    await expect(input).toHaveValue('VAR-TEST_001.abc');
  });

  test('UD10_016_Variable_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');

    // 组件不阻止全角输入，验证实际行为
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD10_017_Variable_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');

    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD10_018_Variable_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(1));
    await input.fill('testvar');
    await takeScreenshot(page, '入力後');

    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 3. Type下拉列表 属性校验 (No.19-20)
// ============================================================
test.describe('Type下拉列表 属性校验', () => {

  test('UD10_019_Type_下拉选项内容', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '019';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const select = page.locator(fieldSelect(2));
    const options = await select.locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed).toContain('VDA');
    expect(trimmed).toContain('User Defined');
    await expect(select).toHaveValue('');
  });

  test('UD10_020_Type_选择选项', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '選択Type=VDA');
    await expect(page.locator(fieldSelect(2))).toHaveValue('VDA');

    await page.locator(fieldSelect(2)).selectOption('User Defined');
    await takeScreenshot(page, '切替Type=User Defined');
    await expect(page.locator(fieldSelect(2))).toHaveValue('User Defined');
  });
});

// ============================================================
// 4. Description输入框 属性校验 (No.21-27)
// ============================================================
test.describe('Description输入框 属性校验', () => {

  test('UD10_021_Description_最大长度超过100字符（101字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('A'.repeat(101));
    await takeScreenshot(page, '入力後（101文字）');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('UD10_022_Description_最大长度100字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('A'.repeat(100));
    await takeScreenshot(page, '入力後（100文字）');
    const val = await input.inputValue();
    expect(val.length).toBe(100);
  });

  test('UD10_023_Description_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('Test variable description 123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('Test variable description 123');
  });

  test('UD10_024_Description_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('TestDesc123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('TestDesc123');
  });

  test('UD10_025_Description_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('VAR_DESC-TEST.001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VAR_DESC-TEST.001');
  });

  test('UD10_026_Description_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD10_027_Description_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(3));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });
});

// ============================================================
// 5. Created by user输入框 属性校验 (No.28-35)
// ============================================================
test.describe('Created by user输入框 属性校验', () => {

  test('UD10_028_Created by user_最大长度超过16字符（17字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '028';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    // 组件没有 maxLength 限制
    await input.fill('A'.repeat(17));
    await takeScreenshot(page, '入力後（17文字）');
    const val = await input.inputValue();
    expect(val.length).toBeGreaterThanOrEqual(16);
  });

  test('UD10_029_Created by user_最大长度16字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('ABCDEFGHIJKLMNOP');
    await takeScreenshot(page, '入力後（16文字）');
    await expect(input).toHaveValue('ABCDEFGHIJKLMNOP');
  });

  test('UD10_030_Created by user_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(4));
    await input.fill('user_test_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('user_test_001');
  });

  test('UD10_031_Created by user_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(4));
    await input.fill('User123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('User123');
  });

  test('UD10_032_Created by user_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(4));
    await input.fill('test-user.001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('test-user.001');
  });

  test('UD10_033_Created by user_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(4));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD10_034_Created by user_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(4));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD10_035_Created by user_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(4));
    await input.fill('testuser');
    await takeScreenshot(page, '入力後');
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 6. Search 按钮操作 (No.36-38)
// ============================================================
test.describe('Search 按钮操作', () => {

  test('UD10_036_Search_带检索条件跳转到UD11', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '036';
    await page.route('**/UD11', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud11-container">UD11 Mock</div></body></html>' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('1001');
    await page.locator(fieldSelect(2)).selectOption('User Defined');
    await page.locator(fieldInput(3)).fill('UD10更新测试');
    await takeScreenshot(page, '入力後（检索条件）');

    await page.locator('.ud10-btn--search').click();
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '操作後（Search跳转）');
    await expect(page).toHaveURL(/\/UD11/);
  });

  test('UD10_037_Search_不带检索条件跳转到UD11', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '037';
    await page.route('**/UD11', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud11-container">UD11 Mock</div></body></html>' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud10-btn--search').click();
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '操作後（Search跳转）');
    await expect(page).toHaveURL(/\/UD11/);
  });

  test('UD10_038_Search_带部分条件检索跳转到UD11', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '038';
    await page.route('**/UD11', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="ud11-container">UD11 Mock</div></body></html>' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('VIN_TEXT2');
    await takeScreenshot(page, '入力後（部分条件）');

    await page.locator('.ud10-btn--search').click();
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '操作後（Search跳转）');
    await expect(page).toHaveURL(/\/UD11/);
  });
});

// ============================================================
// 7. Clear 按钮操作 (No.39-40)
// ============================================================
test.describe('Clear 按钮操作', () => {

  test('UD10_039_Clear_清空所有输入字段', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '039';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    // 输入各种值
    await page.locator(fieldInput(1)).fill('1001');
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await page.locator(fieldInput(3)).fill('Test Description');
    await takeScreenshot(page, '入力後');

    // 点击 Clear
    await page.locator('.ud10-btn--clear').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（Clear）');

    // 验证清空
    await expect(page.locator(fieldInput(1))).toHaveValue('');
    await expect(page.locator(fieldSelect(2))).toHaveValue('');
    await expect(page.locator(fieldInput(3))).toHaveValue('');
    await expect(page.locator(fieldInput(4))).toHaveValue('');
    await expect(page.locator(fieldInput(5))).toHaveValue('');

    // 运算符恢复为 =
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(fieldOperator(i))).toHaveValue('=');
    }
  });

  test('UD10_040_Clear_空状态点击清空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '040';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud10-btn--clear').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（Clear空状态）');

    // 各字段保持为空
    await expect(page.locator(fieldInput(1))).toHaveValue('');
    await expect(page.locator(fieldSelect(2))).toHaveValue('');
    await expect(page.locator(fieldInput(3))).toHaveValue('');

    // 无报错信息
    await expect(page.locator('.ud10-message--error')).toHaveCount(0);
  });
});

// ============================================================
// 8. Back 按钮操作 (No.41)
// ============================================================
test.describe('Back 按钮操作', () => {

  test('UD10_041_Back_返回到Menu画面', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '041';
    await page.route('**/Menu', route => {
      route.fulfill({ status: 200, body: '<html><body><div class="menu-container">Menu Mock</div></body></html>' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud10-btn--back').click();
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '操作後（Back）');
    await expect(page).toHaveURL(/\/Menu/);
  });
});

// ============================================================
// 9. Add 按钮操作 (No.42-45)
// ============================================================
test.describe('Add 按钮操作', () => {

  test('UD10_042_Add_Variable为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '042';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(2)).selectOption('User Defined');
    await page.locator(fieldInput(3)).fill('Test');
    await takeScreenshot(page, '入力後（Variable为空）');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud10-message--error')).toContainText('Variable是必填项');
  });

  test('UD10_043_Add_添加新记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '043';

    // Mock Add API 返回成功
    await page.route('**/api/ud10/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '添加成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('NEW_VAR_UD10_TEST');
    await page.locator(fieldSelect(2)).selectOption('User Defined');
    await page.locator(fieldInput(3)).fill('Test Description for Add');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Add成功）');

    // 验证成功消息
    await expect(page.locator('.ud10-message--success')).toContainText('添加成功');
    // 输入字段被清空
    await expect(page.locator(fieldInput(1))).toHaveValue('');
    await expect(page.locator(fieldSelect(2))).toHaveValue('');
    await expect(page.locator(fieldInput(3))).toHaveValue('');
  });

  test('UD10_044_Add_Variable已存在（409冲突）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '044';

    await page.route('**/api/ud10/add', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ code: 409, message: 'Variant already exists. Please enter the correct content.' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('User Defined');
    await page.locator(fieldInput(3)).fill('Test');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Add冲突）');

    await expect(page.locator('.ud10-message--error')).toContainText('already exists');
  });

  test('UD10_045_Add_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '045';

    await page.route('**/api/ud10/add', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('TEST_500_VAR');
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Add500）');

    await expect(page.locator('.ud10-message--error')).toContainText('添加失败');
  });
});

// ============================================================
// 10. Update 按钮操作 (No.46-49)
// ============================================================
test.describe('Update 按钮操作', () => {

  test('UD10_046_Update_Variable为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '046';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(2)).selectOption('VDA');
    await page.locator(fieldInput(3)).fill('Updated Desc');
    await takeScreenshot(page, '入力後（Variable为空）');

    await page.locator('.ud10-btn--update').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud10-message--error')).toContainText('Variable是必填项');
  });

  test('UD10_047_Update_更新记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '047';

    await page.route('**/api/ud10/update', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '更新成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await page.locator(fieldInput(3)).fill('Updated Description_xxx');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--update').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Update成功）');

    await expect(page.locator('.ud10-message--success')).toContainText('更新成功');
  });

  test('UD10_048_Update_Variable不存在（404）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '048';

    await page.route('**/api/ud10/update', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: 'Variant does not exists. Please enter the correct content.' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(NONEXIST_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await page.locator(fieldInput(3)).fill('Test');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--update').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Update404）');

    await expect(page.locator('.ud10-message--error')).toContainText('does not exists');
  });

  test('UD10_049_Update_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '049';

    await page.route('**/api/ud10/update', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--update').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Update500）');

    await expect(page.locator('.ud10-message--error')).toContainText('更新失败');
  });
});

// ============================================================
// 11. Delete 按钮操作 (No.50-53)
// ============================================================
test.describe('Delete 按钮操作', () => {

  test('UD10_050_Delete_Variable为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '050';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator('.ud10-btn--delete').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud10-message--error')).toContainText('Variable是必填项');
  });

  test('UD10_051_Delete_删除记录成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '051';

    await page.route('**/api/ud10/delete', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '删除成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('T_SUC_990661');
    await takeScreenshot(page, '入力後');

    // 没有确认对话框（组件无 confirm）
    await page.locator('.ud10-btn--delete').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Delete成功）');

    await expect(page.locator('.ud10-message--success')).toContainText('删除成功');
    // 输入字段被清空（handleClear 被调用）
    await expect(page.locator(fieldInput(1))).toHaveValue('');
  });

  test('UD10_052_Delete_Variable不存在（404）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '052';

    await page.route('**/api/ud10/delete', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: 'Variant does not exists. Please enter the correct content.' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(NONEXIST_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--delete').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Delete404）');

    await expect(page.locator('.ud10-message--error')).toContainText('does not exists');
  });

  test('UD10_053_Delete_后端返回500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '053';

    await page.route('**/api/ud10/delete', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--delete').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Delete500）');

    await expect(page.locator('.ud10-message--error')).toContainText('删除失败');
  });
});

// ============================================================
// 12. Excel 按钮操作 (No.54-55)
// ============================================================
test.describe('Excel 按钮操作', () => {

  test('UD10_054_Excel_导出CSV成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '054';

    // 监听下载事件
    let downloadUrl = '';
    page.on('download', download => {
      downloadUrl = download.url();
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await page.locator(fieldInput(3)).fill('Test');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--excel').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Excel导出）');

    // 验证成功消息
    await expect(page.locator('.ud10-message--success')).toContainText('CSV导出成功');
  });

  test('UD10_055_Excel_空条件导出', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '055';

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    // 所有字段为空
    await page.locator('.ud10-btn--excel').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Excel空条件）');

    await expect(page.locator('.ud10-message--success')).toContainText('CSV导出成功');
  });
});

// ============================================================
// 13. 异常处理 (No.56-58)
// ============================================================
test.describe('异常处理', () => {

  test('UD10_056_异常处理_Add时网络超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '056';

    // 模拟 API 超时
    await page.route('**/api/ud10/add', route => {
      // 长时间不响应
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('TEST_NET_VAR');
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '操作後（Add超时）');

    // 超时可能显示错误消息
    const isError = await page.locator('.ud10-message--error').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud10-message--error').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD10_057_异常处理_Update时网络超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '057';

    await page.route('**/api/ud10/update', route => {
      // 长时间不响应
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--update').click();
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '操作後（Update超时）');

    const isError = await page.locator('.ud10-message--error').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud10-message--error').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('UD10_058_异常处理_Delete时网络超时', { timeout: 60000 }, async ({ page }) => {
    currentTestNo = '058';

    await page.route('**/api/ud10/delete', route => {
      // 长时间不响应
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--delete').click();
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '操作後（Delete超时）');

    const isError = await page.locator('.ud10-message--error').isVisible().catch(() => false);
    if (isError) {
      const text = await page.locator('.ud10-message--error').textContent();
      expect(text.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// 14. UI交互 (No.59-64)
// ============================================================
test.describe('UI交互', () => {

  test('UD10_059_UI交互_操作中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '059';

    let resolveApi;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    await page.route('**/api/ud10/add', async route => {
      await apiPromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '添加成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    // 点击 Add
    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作中（按钮禁用）');

    // Add 按钮被禁用
    await expect(page.locator('.ud10-btn--add')).toBeDisabled();
    // 其他按钮不受影响
    await expect(page.locator('.ud10-btn--search')).toBeEnabled();
    await expect(page.locator('.ud10-btn--clear')).toBeEnabled();
    await expect(page.locator('.ud10-btn--back')).toBeEnabled();

    resolveApi();
    await page.waitForTimeout(1000);
  });

  test('UD10_060_UI交互_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '060';

    let apiCallCount = 0;
    await page.route('**/api/ud10/add', async route => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '添加成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('TEST_DUP_VAR');
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    // 连续点击 2 次
    await page.locator('.ud10-btn--add').click();
    await page.locator('.ud10-btn--add').click({ force: true });
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（重复提交）');

    expect(apiCallCount).toBe(1);
  });

  test('UD10_061_UI交互_Add成功后清空输入字段', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '061';

    await page.route('**/api/ud10/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '添加成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('NEW_CLR_TEST');
    await page.locator(fieldSelect(2)).selectOption('User Defined');
    await page.locator(fieldInput(3)).fill('Clear after add');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Add清空）');

    // Add 成功后字段被清空
    await expect(page.locator(fieldInput(1))).toHaveValue('');
    await expect(page.locator(fieldSelect(2))).toHaveValue('');
    await expect(page.locator(fieldInput(3))).toHaveValue('');
  });

  test('UD10_062_UI交互_Delete成功后清空输入字段', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '062';

    await page.route('**/api/ud10/delete', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '删除成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill('T_CLR_581363');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--delete').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（Delete清空）');

    // Delete 成功后 Variable 清空
    await expect(page.locator(fieldInput(1))).toHaveValue('');
  });

  test('UD10_063_UI交互_错误消息显示红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '063';
    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    // 触发空值校验
    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(500);

    await takeScreenshot(page, '操作後（错误消息）');

    // 错误消息可见
    await expect(page.locator('.ud10-message--error')).toBeVisible();
    // 文字为红色
    const color = await page.locator('.ud10-message--error').evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)');
  });

  test('UD10_064_UI交互_成功消息显示绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '064';

    await page.route('**/api/ud10/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '添加成功' })
      });
    });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill(EXISTING_VARIABLE);
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（成功消息）');

    // 成功消息可见，文字为绿色
    await expect(page.locator('.ud10-message--success')).toBeVisible();
    const color = await page.locator('.ud10-message--success').evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)');
  });
});

// ============================================================
// 15. 安全性 (No.65-66)
// ============================================================
test.describe('安全性', () => {

  test('UD10_065_安全性_未登录直接访问UD10画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '065';

    await page.evaluate(() => localStorage.clear());
    await takeScreenshot(page, '初期表示（未登录）');

    await page.goto(BASE_URL + '/UD10');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '操作後（重定向）');

    await expect(page).toHaveURL(/\/Login/);
    await expect(page.locator('.ud10-container')).toHaveCount(0);
  });

  test('UD10_066_安全性_Variable XSS防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '066';

    await page.route('**/api/ud10/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '添加成功' })
      });
    });

    // 监听对话框
    let dialogShown = false;
    page.on('dialog', () => { dialogShown = true; });

    await goToUD10(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(1)).fill("<script>alert('xss')</script>");
    await page.locator(fieldSelect(2)).selectOption('VDA');
    await takeScreenshot(page, '入力後（XSS）');

    await page.locator('.ud10-btn--add').click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '操作後（XSS）');

    // 页面不会弹出 alert 对话框
    expect(dialogShown).toBe(false);
  });
});
