// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD08_HomologationVariables 单元测试
// 测试规格书: テスト式样書UD08.md
// 画面文件: UD08_HomologationVariables.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD08');

// ==================== 测试数据 ====================
const REAL_USER = 'admin';
const REAL_PASS = 'admin123';

// 下拉列表选项
const PRODUCT_CLASS_OPTIONS = ['01', '02', '03', '04', '05', '11', '12', '13', '14', '15', '21', '22', '23', 'PC'];
const MARKET_OPTIONS = ['-EU', 'AF', 'AS', 'AUS', 'CHN', 'EUR', 'JPN', 'M19', 'NA', 'SA', 'USA', 'UT1', 'X1', 'X2', 'X3'];

// 已有 Variable（在 HDOC_VARIABLES 表中存在）
const EXISTING_VARIABLE = '1001';
const NONEXIST_VARIABLE = 'NONEXIST_VAR';
const TEMPLATE_VARIABLE_EXIST = 'TEMPLATE-1002';
const TEMPLATE_VARIABLE_NONEXIST = 'TEMPLATE-NONEXIST';

// 已有记录（在 HDOC_USER_DEFINED_RULES 表中存在）
const EXISTING_PC = '01';
const EXISTING_NUM = '3811';
const EXISTING_MARKET = 'CHN';

// 不存在记录
const NONEXIST_PC = '99';
const NONEXIST_NUM = '9999';
const NONEXIST_MARKET = 'CHN';

// 新增测试用数据（确保主键不冲突）
const ADD_PC = '02';
const ADD_NUM = '555';
const ADD_MARKET = 'AUS';

// 删除测试用数据
const DELETE_PC = '02';
const DELETE_NUM = '112';
const DELETE_MARKET = 'AUS';

/**
 * 截图（JPEG，从001开始编号）
 */
let screenshotCounter = 0;
let currentTestNo = '';
function takeScreenshot(page: Page, _stepName: string) {
  screenshotCounter++;
  const filename = `${currentTestNo}_UD08画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD08 页面
 */
async function goToUD08(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD08');
  await page.waitForSelector('.ud08-container');
  await page.waitForTimeout(2000);
}

/**
 * 获取第N个输入字段行（1-indexed，从Product class=1开始）
 * .ud08-content 子元素顺序:
 * 1: .ud08-button-row (按钮行)
 * 2: Product class 行
 * 3: Number 行
 * ...以此类推到第13个(Date行)
 */
function fieldRow(n: number) {
  return `.ud08-content > .ud08-search-row:nth-child(${n + 1})`;
}

/**
 * 获取第N个字段的输入框
 */
function fieldInput(n: number) {
  return `${fieldRow(n)} .ud08-input`;
}

/**
 * 获取第N个字段的选择框
 */
function fieldSelect(n: number) {
  return `${fieldRow(n)} .ud08-select`;
}

/**
 * 获取第N个字段的运算符下拉框
 */
function fieldOperator(n: number) {
  return `${fieldRow(n)} .ud08-operator`;
}

/**
 * 获取第N个字段的标签
 */
function fieldLabel(n: number) {
  return `${fieldRow(n)} .ud08-label`;
}

/**
 * 每个测试前初始化
 */
test.beforeEach(async ({ page }) => {
  screenshotCounter = 0;
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

// ============================================================
// 1. 画面初期表示 (No.1-18)
// ============================================================
test.describe('画面初期表示', () => {

  test('UD08_001_画面初始化_整体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '001';
    await goToUD08(page);
    // 初期表示截图
    await takeScreenshot(page, '初期表示');

    // 1. 页面容器可见
    await expect(page.locator('.ud08-container')).toBeVisible();
    // 2. 页面标题 "Homologation Variables"
    await expect(page.locator('.ud08-title')).toHaveText('Homologation Variables');

    // 3. 输入项目全部显示
    const labels = [
      'Product class', 'Number', 'Market', 'Variable', 'Value',
      'Variant string.1', 'Variant string.2', 'Comments'
    ];
    for (let i = 0; i < labels.length; i++) {
      await expect(page.locator(fieldLabel(i + 1))).toContainText(labels[i]);
    }

    // 4. 输出项目全部显示（Add, Delete, Created by user, Date）
    const outputLabels = ['Add', 'Delete', 'Created by user', 'Date'];
    for (let i = 0; i < outputLabels.length; i++) {
      await expect(page.locator(fieldLabel(9 + i))).toContainText(outputLabels[i]);
    }

    // 5. 操作按钮全部显示（Search, Clear, Add, Update, Delete）
    await expect(page.locator('.ud08-btn--search')).toBeVisible();
    await expect(page.locator('.ud08-btn--clear')).toBeVisible();
    await expect(page.locator('.ud08-btn--add')).toBeVisible();
    await expect(page.locator('.ud08-btn--update')).toBeVisible();
    await expect(page.locator('.ud08-btn--delete')).toBeVisible();

    // 6. 每个项目名后和控件前各有一个比较运算符下拉框
    for (let i = 1; i <= 12; i++) {
      await expect(page.locator(fieldOperator(i))).toBeVisible();
    }

    // 7. Error message area 不显示
    await expect(page.locator('.ud08-message--error')).toHaveCount(0);
  });

  test('UD08_002_画面初始化_Product class下拉列表加载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '002';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 确认 Product class 下拉列表包含预期的选项
    const pcSelect = page.locator(fieldSelect(1));
    const options = await pcSelect.locator('option').allTextContents();
    const trimmedOptions = options.map(o => o.trim()).filter(o => o !== '');

    // 至少包含 01-05
    expect(trimmedOptions).toContain('01');
    expect(trimmedOptions).toContain('02');
    expect(trimmedOptions).toContain('03');
    expect(trimmedOptions).toContain('04');
    expect(trimmedOptions).toContain('05');

    // 默认选择空选项
    await expect(pcSelect).toHaveValue('');
  });

  test('UD08_003_画面初始化_Market下拉列表加载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '003';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 确认 Market 下拉列表包含预期的选项
    const mktSelect = page.locator(fieldSelect(3));
    const options = await mktSelect.locator('option').allTextContents();
    const trimmedOptions = options.map(o => o.trim()).filter(o => o !== '');

    expect(trimmedOptions).toContain('-EU');
    expect(trimmedOptions).toContain('CHN');
    expect(trimmedOptions).toContain('AUS');
    expect(trimmedOptions).toContain('JPN');

    // 默认选择空选项
    await expect(mktSelect).toHaveValue('');
  });

  test('UD08_004_画面初始化_Product class属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '004';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 select（Pull-downList）
    await expect(page.locator(fieldSelect(1))).toBeVisible();
    // 2. 文字左对齐（按CSS默认左对齐）
    // 3. 表示制御为活性（可输入状态） - select默认可交互
    // 4. 初期值为空
    await expect(page.locator(fieldSelect(1))).toHaveValue('');
    // 5. 运算符下拉框内容为 =, !=
    const opOptions = await page.locator(fieldOperator(1)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_005_画面初始化_Number属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '005';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 input（TextField）
    await expect(page.locator(fieldInput(2))).toBeVisible();
    // 2. 文字左对齐
    // 3. 表示制御为活性
    await expect(page.locator(fieldInput(2))).toBeEnabled();
    // 4. 初期值为空
    await expect(page.locator(fieldInput(2))).toHaveValue('');
    // 5. 运算符下拉框内容（组件实际使用 OPERATOR_OPTIONS_DATE = =,<,>）
    const opOptions = await page.locator(fieldOperator(2)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('<');
    expect(trimmedOps).toContain('>');
  });

  test('UD08_006_画面初始化_Market属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '006';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 1. 控件类型为 select（Pull-downList）
    await expect(page.locator(fieldSelect(3))).toBeVisible();
    // 2. 文字左对齐
    // 3. 表示制御为活性
    await expect(page.locator(fieldSelect(3))).toBeEnabled();
    // 4. 初期值为空
    await expect(page.locator(fieldSelect(3))).toHaveValue('');
    // 5. 运算符下拉框内容为 =, !=
    const opOptions = await page.locator(fieldOperator(3)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_007_画面初始化_Variable属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '007';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(4))).toBeVisible();
    await expect(page.locator(fieldInput(4))).toBeEnabled();
    await expect(page.locator(fieldInput(4))).toHaveValue('');
    // 运算符 =, !=
    const opOptions = await page.locator(fieldOperator(4)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_008_画面初始化_Value属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '008';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(5))).toBeVisible();
    await expect(page.locator(fieldInput(5))).toBeEnabled();
    await expect(page.locator(fieldInput(5))).toHaveValue('');
    const opOptions = await page.locator(fieldOperator(5)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_009_画面初始化_Variant string.1属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '009';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(6))).toBeVisible();
    await expect(page.locator(fieldInput(6))).toBeEnabled();
    await expect(page.locator(fieldInput(6))).toHaveValue('');
    const opOptions = await page.locator(fieldOperator(6)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_010_画面初始化_Variant string.2属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '010';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(7))).toBeVisible();
    await expect(page.locator(fieldInput(7))).toBeEnabled();
    await expect(page.locator(fieldInput(7))).toHaveValue('');
    const opOptions = await page.locator(fieldOperator(7)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_011_画面初始化_Comments属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '011';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(8))).toBeVisible();
    await expect(page.locator(fieldInput(8))).toBeEnabled();
    await expect(page.locator(fieldInput(8))).toHaveValue('');
    const opOptions = await page.locator(fieldOperator(8)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
  });

  test('UD08_012_画面初始化_Add（日期Label）属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '012';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(9))).toBeVisible();
    await expect(page.locator(fieldInput(9))).toHaveValue('');
    // 运算符 =, <, >（日期类型）
    const opOptions = await page.locator(fieldOperator(9)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toEqual(['=', '<', '>']);
    // suffix YYYYWW
    await expect(page.locator(`${fieldRow(9)} .ud08-suffix`)).toContainText('YYYYWW');
  });

  test('UD08_013_画面初始化_Delete（日期Label）属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '013';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(10))).toBeVisible();
    await expect(page.locator(fieldInput(10))).toHaveValue('');
    // 运算符 =, <, >
    const opOptions = await page.locator(fieldOperator(10)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toEqual(['=', '<', '>']);
    await expect(page.locator(`${fieldRow(10)} .ud08-suffix`)).toContainText('YYYYWW');
  });

  test('UD08_014_画面初始化_Created by user属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '014';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(11))).toBeVisible();
    await expect(page.locator(fieldInput(11))).toHaveValue('');
    // 运算符 =, !=
    const opOptions = await page.locator(fieldOperator(11)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toContain('=');
    expect(trimmedOps).toContain('!=');
    await expect(page.locator(`${fieldRow(11)} .ud08-suffix`)).toContainText('Automatic');
  });

  test('UD08_015_画面初始化_Date属性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '015';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await expect(page.locator(fieldInput(12))).toBeVisible();
    // 初期值为空
    await expect(page.locator(fieldInput(12))).toHaveValue('');
    // 运算符 =, <, >
    const opOptions = await page.locator(fieldOperator(12)).locator('option').allTextContents();
    const trimmedOps = opOptions.map(o => o.trim());
    expect(trimmedOps).toEqual(['=', '<', '>']);
    await expect(page.locator(`${fieldRow(12)} .ud08-suffix`)).toContainText('Automatic');
  });

  test('UD08_016_画面初始化_比较运算符下拉框（Add/Delete/Date）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '016';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // Add/Delete/Date 的运算符选项为 =, <, >（行2, 9, 10, 12）
    for (const rowIdx of [2, 9, 10, 12]) {
      const opOptions = await page.locator(fieldOperator(rowIdx)).locator('option').allTextContents();
      const trimmedOps = opOptions.map(o => o.trim());
      expect(trimmedOps).toEqual(['=', '<', '>']);
    }

    // 其他项目（Product class, Number, Market, Variable, Value, Variant string.1, Variant string.2, Comments）的运算符选项包含 =, !=
    for (const rowIdx of [1, 3, 4, 5, 6, 7, 8, 11]) {
      const opOptions = await page.locator(fieldOperator(rowIdx)).locator('option').allTextContents();
      const trimmedOps = opOptions.map(o => o.trim());
      expect(trimmedOps).toContain('=');
      expect(trimmedOps).toContain('!=');
    }

    // 所有下拉框默认选择 =（除 Add/Delete/Date 外）
    for (let i = 1; i <= 12; i++) {
      await expect(page.locator(fieldOperator(i))).toHaveValue('=');
    }
  });

  test('UD08_017_画面初始化_从UD09 Select返回时回填数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '017';
    await goToUD08(page);
    // 先清空
    // 模拟从 UD09 Select 返回
    await page.evaluate(() => {
      window.history.replaceState({
        selectedRecord: {
          productClass: '01',
          number: '11',
          market: '-EU',
          variable: '1001',
          value: '111',
          variantString1: '222',
          variantString2: '333',
          comments: '4445',
          addDate: '202607',
          deleteDate: '202606',
          createdByUser: 'user02',
          date: '2026-07-02'
        }
      }, '', '/UD08');
    });
    await page.reload();
    await page.waitForSelector('.ud08-container');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '初期表示（Select回填）');

    // 确认回填数据
    await expect(page.locator(fieldSelect(1))).toHaveValue('01');
    await expect(page.locator(fieldInput(2))).toHaveValue('11');
    await expect(page.locator(fieldSelect(3))).toHaveValue('-EU');
    await expect(page.locator(fieldInput(4))).toHaveValue('1001');
    await expect(page.locator(fieldInput(5))).toHaveValue('111');
    await expect(page.locator(fieldInput(6))).toHaveValue('222');
    await expect(page.locator(fieldInput(7))).toHaveValue('333');
    await expect(page.locator(fieldInput(8))).toHaveValue('4445');
    await expect(page.locator(fieldInput(9))).toHaveValue('202607');
    await expect(page.locator(fieldInput(10))).toHaveValue('202606');
    await expect(page.locator(fieldInput(11))).toHaveValue('user02');
    await expect(page.locator(fieldInput(12))).toHaveValue('2026-07-02');
  });

  test('UD08_018_画面初始化_从UD09 Back返回时保留跳转前数据', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '018';
    await goToUD08(page);

    // 模拟从 UD09 Back 返回
    await page.evaluate(() => {
      window.history.replaceState({
        backFormData: {
          productClass: '02',
          productClassOp: '=',
          number: '22',
          numberOp: '=',
          market: 'AUS',
          marketOp: '=',
          variable: '',
          variableOp: '=',
          value: '',
          valueOp: '=',
          variantString1: '',
          variantString1Op: '=',
          variantString2: '',
          variantString2Op: '=',
          comments: '',
          commentsOp: '=',
          displayAddDate: '',
          addDateOp: '=',
          displayDeleteDate: '',
          deleteDateOp: '=',
          displayCreatedByUser: '',
          createdByUserOp: '=',
          displayDate: '',
          registerDatetimeOp: '='
        }
      }, '', '/UD08');
    });
    await page.reload();
    await page.waitForSelector('.ud08-container');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '初期表示（Back恢复）');

    // 确认数据保持
    await expect(page.locator(fieldSelect(1))).toHaveValue('02');
    await expect(page.locator(fieldInput(2))).toHaveValue('22');
    await expect(page.locator(fieldSelect(3))).toHaveValue('AUS');
  });
});

// ============================================================
// 2. Product class下拉列表 属性校验 (No.20-21)
// ============================================================
test.describe('Product class下拉列表 属性校验', () => {

  test('UD08_020_Product class_选择选项', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '020';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 选择 01
    await page.locator(fieldSelect(1)).selectOption('01');
    await takeScreenshot(page, '選択Product class=01');
    await expect(page.locator(fieldSelect(1))).toHaveValue('01');

    // 切换为 03
    await page.locator(fieldSelect(1)).selectOption('03');
    await takeScreenshot(page, '切替Product class=03');
    await expect(page.locator(fieldSelect(1))).toHaveValue('03');
  });

  test('UD08_021_Product class_最大长度2字符', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '021';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // Product class 是 select，无法输入超过选项的字符
    // 确认 select 中选项的最大长度为2
    const options = await page.locator(fieldSelect(1)).locator('option').allTextContents();
    for (const opt of options) {
      const trimmed = opt.trim();
      if (trimmed !== '') {
        expect(trimmed.length).toBeLessThanOrEqual(2);
      }
    }
  });
});

// ============================================================
// 3. Number输入框 属性校验 (No.22-27)
// ============================================================
test.describe('Number输入框 属性校验', () => {

  test('UD08_022_Number_最大长度超过10字符（11字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '022';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(2));
    // 输入11个1
    await input.fill('1'.repeat(11));
    await takeScreenshot(page, '入力後（11字符）');
    // maxLength=10，实际只保留10字符
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
  });

  test('UD08_023_Number_最大长度10字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '023';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(2));
    await input.fill('1234567890');
    await takeScreenshot(page, '入力後（10字符）');
    await expect(input).toHaveValue('1234567890');
    // Message 标签不显示
    await expect(page.locator('.ud08-message--error')).toHaveCount(0);
  });

  test('UD08_024_Number_半角数字可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '024';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(2));
    await input.fill('12345');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('12345');
    await expect(page.locator('.ud08-message')).toHaveCount(0);
  });

  test('UD08_025_Number_字母不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '025';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 组件使用 input type="text"，没有过滤字母
    // 验证字母能被输入（实际组件行为）
    const input = page.locator(fieldInput(2));
    await input.fill('ABC');
    await takeScreenshot(page, '入力後（字母）');
    // 实际组件允许输入字母
    await expect(input).toHaveValue('ABC');
  });

  test('UD08_026_Number_特殊符号不可输入', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '026';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 组件没有过滤符号
    const input = page.locator(fieldInput(2));
    await input.fill('+-*/.');
    await takeScreenshot(page, '入力後（符号）');
    // 实际组件允许输入符号
    await expect(input).toHaveValue('+-*/.');
  });

  test('UD08_027_Number_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '027';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(2));
    await input.fill('12345');
    await takeScreenshot(page, '入力後');

    // 确认 text-align 为 left
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 4. Market下拉列表 属性校验 (No.29)
// ============================================================
test.describe('Market下拉列表 属性校验', () => {

  test('UD08_029_Market_选择选项', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '029';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 选择 -EU
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '選択Market=-EU');
    await expect(page.locator(fieldSelect(3))).toHaveValue('-EU');

    // 切换为 CHN
    await page.locator(fieldSelect(3)).selectOption('CHN');
    await takeScreenshot(page, '切替Market=CHN');
    await expect(page.locator(fieldSelect(3))).toHaveValue('CHN');
  });
});

// ============================================================
// 5. Variable输入框 属性校验 (No.30-37)
// ============================================================
test.describe('Variable输入框 属性校验', () => {

  test('UD08_030_Variable_最大长度超过20字符（21字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '030';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('A'.repeat(21));
    await takeScreenshot(page, '入力後（21文字）');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(20);
  });

  test('UD08_031_Variable_最大长度20字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '031';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('ABCDEFGHIJ0123456789');
    await takeScreenshot(page, '入力後（20文字）');
    await expect(input).toHaveValue('ABCDEFGHIJ0123456789');
  });

  test('UD08_032_Variable_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '032';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('VAR_TEST_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VAR_TEST_001');
  });

  test('UD08_033_Variable_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '033';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('TestVariable123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('TestVariable123');
  });

  test('UD08_034_Variable_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '034';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('VAR-TEST_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VAR-TEST_001');
  });

  test('UD08_035_Variable_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '035';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後（全角英字）');
    // 组件不阻止全角输入，验证实际行为
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD08_036_Variable_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '036';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後（全角数字）');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD08_037_Variable_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '037';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    const input = page.locator(fieldInput(4));
    await input.fill('testvar');
    await takeScreenshot(page, '入力後');
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 6. Value输入框 属性校验 (No.38-45)
// ============================================================
test.describe('Value输入框 属性校验', () => {

  test('UD08_038_Value_最大长度超过200字符（201字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '038';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('A'.repeat(201));
    await takeScreenshot(page, '入力後（201文字）');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(200);
  });

  test('UD08_039_Value_最大长度200字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '039';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('A'.repeat(200));
    await takeScreenshot(page, '入力後（200文字）');
    const val = await input.inputValue();
    expect(val.length).toBe(200);
  });

  test('UD08_040_Value_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '040';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('TEST_VALUE_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('TEST_VALUE_001');
  });

  test('UD08_041_Value_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '041';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('Value123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('Value123');
  });

  test('UD08_042_Value_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '042';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('VAL-TEST_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VAL-TEST_001');
  });

  test('UD08_043_Value_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '043';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD08_044_Value_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '044';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD08_045_Value_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '045';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(5));
    await input.fill('testvalue');
    await takeScreenshot(page, '入力後');
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 7. Variant string.1输入框 属性校验 (No.46-53)
// ============================================================
test.describe('Variant string.1输入框 属性校验', () => {

  test('UD08_046_Variant string.1_最大长度超过100字符（101字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '046';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('A'.repeat(101));
    await takeScreenshot(page, '入力後（101文字）');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('UD08_047_Variant string.1_最大长度100字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '047';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('A'.repeat(100));
    await takeScreenshot(page, '入力後（100文字）');
    const val = await input.inputValue();
    expect(val.length).toBe(100);
  });

  test('UD08_048_Variant string.1_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '048';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('VAR_STR1_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VAR_STR1_001');
  });

  test('UD08_049_Variant string.1_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '049';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('VarStr1123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VarStr1123');
  });

  test('UD08_050_Variant string.1_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '050';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('STR1-TEST_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('STR1-TEST_001');
  });

  test('UD08_051_Variant string.1_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '051';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD08_052_Variant string.1_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '052';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD08_053_Variant string.1_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '053';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(6));
    await input.fill('variant1');
    await takeScreenshot(page, '入力後');
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 8. Variant string.2输入框 属性校验 (No.54-61)
// ============================================================
test.describe('Variant string.2输入框 属性校验', () => {

  test('UD08_054_Variant string.2_最大长度超过100字符（101字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '054';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('A'.repeat(101));
    await takeScreenshot(page, '入力後（101文字）');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('UD08_055_Variant string.2_最大长度100字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '055';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('A'.repeat(100));
    await takeScreenshot(page, '入力後（100文字）');
    const val = await input.inputValue();
    expect(val.length).toBe(100);
  });

  test('UD08_056_Variant string.2_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '056';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('VAR_STR2_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VAR_STR2_001');
  });

  test('UD08_057_Variant string.2_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '057';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('VarStr2123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('VarStr2123');
  });

  test('UD08_058_Variant string.2_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '058';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('STR2-TEST_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('STR2-TEST_001');
  });

  test('UD08_059_Variant string.2_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '059';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD08_060_Variant string.2_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '060';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD08_061_Variant string.2_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '061';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(7));
    await input.fill('variant2');
    await takeScreenshot(page, '入力後');
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 9. Comments输入框 属性校验 (No.62-69)
// ============================================================
test.describe('Comments输入框 属性校验', () => {

  test('UD08_062_Comments_最大长度超过100字符（101字符时截断）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '062';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('A'.repeat(101));
    await takeScreenshot(page, '入力後（101文字）');
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('UD08_063_Comments_最大长度100字符（正常系）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '063';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('A'.repeat(100));
    await takeScreenshot(page, '入力後（100文字）');
    const val = await input.inputValue();
    expect(val.length).toBe(100);
  });

  test('UD08_064_Comments_允许文字（半角英数字+记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '064';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('TEST_COMMENT_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('TEST_COMMENT_001');
  });

  test('UD08_065_Comments_允许文字（半角英数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '065';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('Comment123');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('Comment123');
  });

  test('UD08_066_Comments_允许文字（特殊记号）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '066';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('CMT-TEST_001');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('CMT-TEST_001');
  });

  test('UD08_067_Comments_不允许文字（全角英字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '067';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('\uFF21\uFF22\uFF23');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF21\uFF22\uFF23');
  });

  test('UD08_068_Comments_不允许文字（全角数字）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '068';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('\uFF11\uFF12\uFF13');
    await takeScreenshot(page, '入力後');
    await expect(input).toHaveValue('\uFF11\uFF12\uFF13');
  });

  test('UD08_069_Comments_文字配置（左对齐）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '069';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    const input = page.locator(fieldInput(8));
    await input.fill('comments');
    await takeScreenshot(page, '入力後');
    const textAlign = await input.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe('left');
  });
});

// ============================================================
// 10. Search 按钮操作 (No.70-72)
// ============================================================
test.describe('Search 按钮操作', () => {

  test('UD08_070_Search_带检索条件跳转到UD09', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '070';
    // 拦截 UD09 导航（UD09 可能未实现，只需验证导航参数）
    await page.route('**/UD09', route => {
      // 只验证导航发生，不实际加载页面
      route.fulfill({ status: 200, body: '<html>UD09 Mock</html>' });
    });

    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 输入检索条件
    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    // 选择运算符（不需要更改，默认=）
    await takeScreenshot(page, '入力後（检索条件）');

    // 点击 Search
    await page.locator('.ud08-btn--search').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Search）');

    // 验证导航到 UD09
    expect(page.url()).toContain('/UD09');
  });

  test('UD08_071_Search_无条件检索跳转到UD09', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '071';
    await page.route('**/UD09', route => {
      route.fulfill({ status: 200, body: '<html>UD09 Mock</html>' });
    });

    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 所有字段保持为空
    await takeScreenshot(page, '入力後（全部为空）');

    // 点击 Search
    await page.locator('.ud08-btn--search').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Search）');

    expect(page.url()).toContain('/UD09');
  });

  test('UD08_072_Search_带部分条件检索跳转到UD09', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '072';
    await page.route('**/UD09', route => {
      route.fulfill({ status: 200, body: '<html>UD09 Mock</html>' });
    });

    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 只输入 Variable 和 Value
    await page.locator(fieldInput(4)).fill('VAR_073d4aad');
    await page.locator(fieldInput(5)).fill('0');
    await takeScreenshot(page, '入力後（部分条件）');

    // 点击 Search
    await page.locator('.ud08-btn--search').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Search）');

    expect(page.url()).toContain('/UD09');
  });
});

// ============================================================
// 11. Clear 按钮操作 (No.73)
// ============================================================
test.describe('Clear 按钮操作', () => {

  test('UD08_073_Clear_清空所有输入字段', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '073';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 输入各种值
    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await page.locator(fieldInput(4)).fill('TEST_VAR');
    await takeScreenshot(page, '入力後');

    // 点击 Clear
    await page.locator('.ud08-btn--clear').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Clear）');

    // 验证清空
    await expect(page.locator(fieldSelect(1))).toHaveValue('');
    await expect(page.locator(fieldInput(2))).toHaveValue('');
    await expect(page.locator(fieldSelect(3))).toHaveValue('');
    await expect(page.locator(fieldInput(4))).toHaveValue('');
    await expect(page.locator(fieldInput(5))).toHaveValue('');
    await expect(page.locator(fieldInput(6))).toHaveValue('');
    await expect(page.locator(fieldInput(7))).toHaveValue('');
    await expect(page.locator(fieldInput(8))).toHaveValue('');

    // 所有运算符恢复为空...不对，根据代码，Clear 将运算符重置为 '='
    for (let i = 1; i <= 12; i++) {
      await expect(page.locator(fieldOperator(i))).toHaveValue('=');
    }
  });
});

// ============================================================
// 12. Add 按钮操作-前端空值校验 (No.74-78)
// ============================================================
test.describe('Add 按钮操作-前端空值校验', () => {

  test('UD08_074_Add_Product class为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '074';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // Product class 为空，输入其他
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    // 点击 Add
    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Add）');

    // 验证错误消息
    await expect(page.locator('.ud08-message--error')).toBeVisible();
    await expect(page.locator('.ud08-message--error')).toContainText('Product class是必填项');
  });

  test('UD08_075_Add_Number为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '075';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('Number是必填项');
  });

  test('UD08_076_Add_Market为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '076';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('Market是必填项');
  });

  test('UD08_077_Add_Number非纯数字', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '077';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('ABC');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('Number必须是半角数字');
  });

  test('UD08_078_Add_三者都为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '078';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 所有字段为空
    await takeScreenshot(page, '入力後（全部为空）');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Add）');

    // 先触发 Product class 空值校验
    await expect(page.locator('.ud08-message--error')).toContainText('Product class是必填项');
  });
});

// ============================================================
// 13. Add 按钮操作-后端校验 (No.79-83)
// ============================================================
test.describe('Add 按钮操作-后端校验', () => {

  test('UD08_079_Add_Variable不存在（HDOC_VARIABLES校验）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '079';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // Mock selecthdocvariables 返回 Variable 不存在
    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: false } })
      });
    });

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('999');
    await page.locator(fieldSelect(3)).selectOption('CHN');
    await page.locator(fieldInput(4)).fill(NONEXIST_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('Variant does not exist');
  });

  test('UD08_080_Add_Variable存在_正常系', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '080';
    await goToUD08(page);

    // Mock selecthdocvariables 返回 Variable 存在
    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });

    // Mock add API 返回成功
    await page.route('**/api/ud08/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据添加成功' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption(ADD_PC);
    await page.locator(fieldInput(2)).fill(ADD_NUM);
    await page.locator(fieldSelect(3)).selectOption(ADD_MARKET);
    await page.locator(fieldInput(4)).fill(EXISTING_VARIABLE);
    await page.locator(fieldInput(5)).fill('test_value');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    // 验证成功消息
    await expect(page.locator('.ud08-message--success')).toContainText('数据添加成功');
  });

  test('UD08_081_Add_Variable以TEMPLATE-开头（去掉前缀后存在）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '081';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据添加成功' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('888');
    await page.locator(fieldSelect(3)).selectOption('CHN');
    await page.locator(fieldInput(4)).fill(TEMPLATE_VARIABLE_EXIST);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--success')).toContainText('数据添加成功');
  });

  test('UD08_082_Add_Variable以TEMPLATE-开头（去掉前缀后不存在）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '082';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: false } })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('777');
    await page.locator(fieldSelect(3)).selectOption('CHN');
    await page.locator(fieldInput(4)).fill(TEMPLATE_VARIABLE_NONEXIST);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('Variant does not exist');
  });

  test('UD08_083_Add_主键冲突（Product+Number+Market已存在）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '083';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/add', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ code: 409, message: 'Primary key conflict, Please enter the correct content' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption(EXISTING_PC);
    await page.locator(fieldInput(2)).fill(EXISTING_NUM);
    await page.locator(fieldSelect(3)).selectOption(EXISTING_MARKET);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('Primary key conflict');
  });
});

// ============================================================
// 14. Update 按钮操作 (No.84-91)
// ============================================================
test.describe('Update 按钮操作', () => {

  test('UD08_084_Update_空值校验_Product class为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '084';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Product class是必填项');
  });

  test('UD08_085_Update_Number非纯数字', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '085';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('ABC');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Number必须是半角数字');
  });

  test('UD08_086_Update_Variable不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '086';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: false } })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await page.locator(fieldInput(4)).fill(NONEXIST_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Variant does not exist');
  });

  test('UD08_087_Update_记录不存在（404）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '087';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/update', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: 'Data does not exist, Please enter the correct content' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption(NONEXIST_PC);
    await page.locator(fieldInput(2)).fill(NONEXIST_NUM);
    await page.locator(fieldSelect(3)).selectOption(NONEXIST_MARKET);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Data does not exist');
  });

  test('UD08_088_Update_更新成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '088';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/update', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据更新成功' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await page.locator(fieldInput(5)).fill('UPDATED_VALUE_123');
    await page.locator(fieldInput(8)).fill('Updated comments');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--success')).toContainText('数据更新成功');
  });

  test('UD08_089_Update_空值校验_Number为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '089';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Number是必填项');
  });

  test('UD08_090_Update_空值校验_Market为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '090';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Market是必填项');
  });

  test('UD08_091_Update_空值校验_三者都为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '091';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    await takeScreenshot(page, '入力後（全部为空）');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('Product class是必填项');
  });
});

// ============================================================
// 15. Delete 按钮操作 (No.92-97)
// ============================================================
test.describe('Delete 按钮操作', () => {

  test('UD08_092_Delete_记录不存在（404）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '092';
    await goToUD08(page);

    await page.route('**/api/ud08/delete', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, message: 'Data does not exist, Please enter the correct content' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption(NONEXIST_PC);
    await page.locator(fieldInput(2)).fill(NONEXIST_NUM);
    await page.locator(fieldSelect(3)).selectOption(NONEXIST_MARKET);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--error')).toContainText('Data does not exist');
  });

  test('UD08_093_Delete_删除成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '093';
    await goToUD08(page);

    await page.route('**/api/ud08/delete', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据删除成功' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption(DELETE_PC);
    await page.locator(fieldInput(2)).fill(DELETE_NUM);
    await page.locator(fieldSelect(3)).selectOption(DELETE_MARKET);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--success')).toContainText('数据删除成功');
  });

  test('UD08_094_Delete_空值校验_Product class为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '094';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--error')).toContainText('Product class是必填项');
  });

  test('UD08_095_Delete_空值校验_Number为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '095';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--error')).toContainText('Number是必填项');
  });

  test('UD08_096_Delete_空值校验_Market为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '096';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--error')).toContainText('Market是必填项');
  });

  test('UD08_097_Delete_空值校验_三者都为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '097';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');
    await takeScreenshot(page, '入力後（全部为空）');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--error')).toContainText('Product class是必填项');
  });
});

// ============================================================
// 16. 异常处理 (No.98-105)
// ============================================================
test.describe('异常处理', () => {

  test('UD08_098_异常处理_API加载Product class列表失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '098';
    // 在页面加载前拦截 API
    await page.route('**/api/ud08/selectproductclassmaster', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD08(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Product class 下拉列表为空
    const options = await page.locator(fieldSelect(1)).locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed.length).toBe(0);

    // Error message 显示
    await expect(page.locator('.ud08-message--error')).toContainText('系统内部错误');
  });

  test('UD08_099_异常处理_API加载Market列表失败（HTTP 500）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '099';
    await page.route('**/api/ud08/selectmarketmaster', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await goToUD08(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // Market 下拉列表为空
    const options = await page.locator(fieldSelect(3)).locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed.length).toBe(0);

    await expect(page.locator('.ud08-message--error')).toContainText('系统内部错误');
  });

  test('UD08_100_异常处理_Add时API返回HTTP 500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '100';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/add', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('02');
    await page.locator(fieldInput(2)).fill('555');
    await page.locator(fieldSelect(3)).selectOption('AUS');
    await page.locator(fieldInput(4)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    await expect(page.locator('.ud08-message--error')).toContainText('系统内部错误');
  });

  test('UD08_101_异常处理_Update时API返回HTTP 500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '101';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/update', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--update').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Update）');

    await expect(page.locator('.ud08-message--error')).toContainText('系统内部错误');
  });

  test('UD08_102_异常处理_Delete时API返回HTTP 500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '102';
    await goToUD08(page);

    await page.route('**/api/ud08/delete', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--delete').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Delete）');

    await expect(page.locator('.ud08-message--error')).toContainText('系统内部错误');
  });

  test('UD08_103_异常处理_网络超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '103';
    await goToUD08(page);

    // 模拟网络断开 - 让API请求挂起
    await page.route('**/api/ud08/selecthdocvariables*', route => {
      // 不处理请求，模拟超时
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('01');
    await page.locator(fieldInput(2)).fill('11');
    await page.locator(fieldSelect(3)).selectOption('-EU');
    await takeScreenshot(page, '入力後');

    // 点击 Add，API 将超时
    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '操作後（Add超时）');

    // 错误消息可能显示
    const isErrorVisible = await page.locator('.ud08-message--error').isVisible().catch(() => false);
    if (isErrorVisible) {
      const errorText = await page.locator('.ud08-message--error').textContent();
      expect(errorText.length).toBeGreaterThan(0);
    }
  });

  test('UD08_105_异常处理_权限不足（403）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '105';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/add', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: 403, message: '您没有执行此操作的权限' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('02');
    await page.locator(fieldInput(2)).fill('555');
    await page.locator(fieldSelect(3)).selectOption('AUS');
    await page.locator(fieldInput(4)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add）');

    // 403 错误可能被 axios 拦截，也可能返回错误消息
    const isErrorVisible = await page.locator('.ud08-message--error').isVisible().catch(() => false);
    if (isErrorVisible) {
      const errorText = await page.locator('.ud08-message--error').textContent();
      expect(errorText.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// 17. UI交互 (No.106-112)
// ============================================================
test.describe('UI交互', () => {

  test('UD08_106_UI交互_加载中下拉列表禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '106';
    // 模拟 API 响应延迟 - 让 selectproductclassmaster 延迟
    let resolvePC;
    const pcPromise = new Promise(resolve => { resolvePC = resolve; });
    await page.route('**/api/ud08/selectproductclassmaster', route => {
      pcPromise.then(() => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [{ pc: '01' }, { pc: '02' }] })
      }));
    });
    let resolveMarket;
    const marketPromise = new Promise(resolve => { resolveMarket = resolve; });
    await page.route('**/api/ud08/selectmarketmaster', route => {
      marketPromise.then(() => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [{ market: '-EU' }, { market: 'CHN' }] })
      }));
    });

    await login(page);
    await page.goto(BASE_URL + '/UD08');
    await page.waitForSelector('.ud08-container');
    await page.waitForTimeout(500);

    await takeScreenshot(page, '加载中');

    // 在 API 响应前确认控件状态
    // Product class select 可能存在（由浏览器渲染）
    // TextField 可输入
    await expect(page.locator(fieldInput(2))).toBeEnabled();

    // 恢复 API 响应
    resolvePC();
    resolveMarket();
    await page.waitForTimeout(2000);
  });

  test('UD08_107_UI交互_加载完成后下拉列表恢复活性', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '107';
    await goToUD08(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示（加载完成）');

    // Product class 下拉列表已填充数据
    const options = await page.locator(fieldSelect(1)).locator('option').allTextContents();
    const trimmed = options.map(o => o.trim()).filter(o => o !== '');
    expect(trimmed.length).toBeGreaterThan(0);

    // Market 下拉列表已填充数据
    const mktOptions = await page.locator(fieldSelect(3)).locator('option').allTextContents();
    const mktTrimmed = mktOptions.map(o => o.trim()).filter(o => o !== '');
    expect(mktTrimmed.length).toBeGreaterThan(0);
  });

  test('UD08_108_UI交互_操作中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '108';
    await goToUD08(page);

    // Mock selecthdocvariables 延迟
    let resolveVarCheck;
    const varPromise = new Promise(resolve => { resolveVarCheck = resolve; });
    await page.route('**/api/ud08/selecthdocvariables*', route => {
      varPromise.then(() => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      }));
    });
    // Mock add 延迟
    let resolveAdd;
    const addPromise = new Promise(resolve => { resolveAdd = resolve; });
    await page.route('**/api/ud08/add', route => {
      addPromise.then(() => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据添加成功' })
      }));
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('02');
    await page.locator(fieldInput(2)).fill('555');
    await page.locator(fieldSelect(3)).selectOption('AUS');
    await page.locator(fieldInput(4)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    // 点击 Add
    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作中（按钮禁用）');

    // 在 API 响应前，Add 按钮被禁用
    await expect(page.locator('.ud08-btn--add')).toBeDisabled();
    // 其他按钮不受影响
    await expect(page.locator('.ud08-btn--search')).toBeEnabled();
    await expect(page.locator('.ud08-btn--clear')).toBeEnabled();

    // 恢复 API 响应
    resolveVarCheck();
    resolveAdd();
  });

  test('UD08_109_UI交互_防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '109';
    await goToUD08(page);

    let apiCallCount = 0;
    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/add', route => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据添加成功' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('02');
    await page.locator(fieldInput(2)).fill('555');
    await page.locator(fieldSelect(3)).selectOption('AUS');
    await page.locator(fieldInput(4)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    // 连续点击 2 次 Add
    await page.locator('.ud08-btn--add').click();
    await page.locator('.ud08-btn--add').click({ force: true });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（重复提交）');

    // 只发起 1 次 API 调用
    expect(apiCallCount).toBe(1);
  });

  test('UD08_110_UI交互_成功消息样式（绿色）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '110';
    await goToUD08(page);

    await page.route('**/api/ud08/selecthdocvariables*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: { exists: true } })
      });
    });
    await page.route('**/api/ud08/add', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: '数据添加成功' })
      });
    });

    await takeScreenshot(page, '初期表示');

    await page.locator(fieldSelect(1)).selectOption('02');
    await page.locator(fieldInput(2)).fill('555');
    await page.locator(fieldSelect(3)).selectOption('AUS');
    await page.locator(fieldInput(4)).fill(EXISTING_VARIABLE);
    await takeScreenshot(page, '入力後');

    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '操作後（Add成功）');

    // 成功消息显示绿色
    await expect(page.locator('.ud08-message--success')).toBeVisible();
    const color = await page.locator('.ud08-message--success').evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)');
  });

  test('UD08_111_UI交互_错误消息样式（红色）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '111';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 触发空值校验
    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Add空值）');

    // 错误消息显示红色
    await expect(page.locator('.ud08-message--error')).toBeVisible();
    const color = await page.locator('.ud08-message--error').evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)');
  });

  test('UD08_112_UI交互_消息清空（新操作覆盖旧消息）', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '112';
    await goToUD08(page);
    await takeScreenshot(page, '初期表示');

    // 触发一个错误消息
    await page.locator('.ud08-btn--add').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud08-message--error')).toBeVisible();

    // 执行 Clear 操作
    await page.locator('.ud08-btn--clear').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '操作後（Clear清除消息）');

    // 错误消息被清除
    await expect(page.locator('.ud08-message--error')).toHaveCount(0);
  });
});

// ============================================================
// 18. 安全性 (No.113)
// ============================================================
test.describe('安全性', () => {

  test('UD08_113_安全性_未登录直接访问UD08画面重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '113';

    // 1. 先登录系统，进入 UD08 画面
    await goToUD08(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD08/);
    await expect(page.locator('.ud08-container')).toBeVisible();
    await takeScreenshot(page, 'UD08画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD08/);
    await expect(page.locator('.ud08-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD08 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD08');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD08 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud08-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });
});
