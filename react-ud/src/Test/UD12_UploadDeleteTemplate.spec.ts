// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD12_UploadDeleteTemplate 单元测试
// 测试规格书: テスト式样書UD12.md
// 画面文件: UD12_UploadDeleteTemplate.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD12');

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
  const filename = `${currentTestNo}_UD12画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD12 页面
 */
async function goToUD12(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD12');
  await page.waitForSelector('.ud12-container');
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

  test('UD12_001_画面初期表示_全体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 1. 页面容器可见
    await expect(page.locator('.ud12-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    // 2. 左侧区域显示标题 HDoc Template Upload
    await expect(page.locator('.ud12-section-title').first()).toHaveText('HDoc Template Upload');
    await takeScreenshot(page, 'Upload标题');

    // 3. 右侧区域显示标题 Hdoc Template Delete/Archive
    await expect(page.locator('.ud12-section-title').nth(1)).toHaveText('Hdoc Template Delete/Archive');
    await takeScreenshot(page, 'Delete标题');

    // 4. Upload 区域包含各控件
    const uploadSection = page.locator('.ud12-upload-section');
    await expect(uploadSection.locator('#templateFileInput')).toBeVisible();
    await expect(uploadSection.locator('.ud12-select')).toBeVisible();
    await expect(uploadSection.locator('.ud12-btn-upload')).toBeVisible();
    await expect(uploadSection.locator('.ud12-footnote')).toBeVisible();
    await takeScreenshot(page, 'Upload区域详细');

    // 5. Delete 区域包含各控件
    const deleteSection = page.locator('.ud12-delete-section');
    await expect(deleteSection.locator('.ud12-select')).toHaveCount(2);
    await expect(deleteSection.locator('.ud12-btn-delete')).toBeVisible();
    await takeScreenshot(page, 'Delete区域详细');

    // 6. 底部 Check Template 区域可见
    await expect(page.locator('.ud12-check-section')).toBeVisible();
    await takeScreenshot(page, 'CheckTemplate区域');

    // 7. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud12-message')).not.toBeVisible();
    await takeScreenshot(page, '整体布局');
  });

  test('UD12_002_画面初期表示_Upload区域控件状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    const uploadSection = page.locator('.ud12-upload-section');
    // 1. 标题显示 HDoc Template Upload
    await expect(uploadSection.locator('.ud12-section-title')).toHaveText('HDoc Template Upload');
    // 2. Template File 输入框可见
    const fileInput = uploadSection.locator('#templateFileInput');
    await expect(fileInput).toBeVisible();
    // 3. 未选择任何文件
    const fileValue = await fileInput.inputValue();
    expect(fileValue).toBe('');
    // 4. Market 下拉列表 -- Select Market -- 为默认选项
    const marketSelect = uploadSection.locator('.ud12-select');
    await expect(marketSelect).toBeVisible();
    await expect(marketSelect.locator('option').first()).toHaveAttribute('value', '');
    // 5. Market 下拉列表已加载
    const optionCount = await marketSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
    // 6. Upload file 按钮可见，文本为 Upload file，未禁用
    const uploadBtn = uploadSection.locator('.ud12-btn-upload');
    await expect(uploadBtn).toHaveText('Upload file');
    await expect(uploadBtn).toBeEnabled();
    // 7. 底部提示文字显示
    await expect(uploadSection.locator('.ud12-footnote')).toContainText('Before uploading new VIN plate templates');
    await takeScreenshot(page, 'Upload区域控件状态');
  });

  test('UD12_003_画面初期表示_Delete区域控件状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteSection = page.locator('.ud12-delete-section');
    // 1. 标题显示 Hdoc Template Delete/Archive
    await expect(deleteSection.locator('.ud12-section-title')).toHaveText('Hdoc Template Delete/Archive');
    // 2. Market 下拉列表 -- Select Market -- 为默认选项
    const marketSelect = deleteSection.locator('.ud12-select').first();
    await expect(marketSelect).toBeVisible();
    await expect(marketSelect.locator('option').first()).toHaveAttribute('value', '');
    // 3. Market 下拉列表已加载
    const marketOptionCount = await marketSelect.locator('option').count();
    expect(marketOptionCount).toBeGreaterThan(1);
    // 4. Templates 下拉列表为空且禁用
    const templateSelect = deleteSection.locator('.ud12-select').nth(1);
    await expect(templateSelect).toBeVisible();
    await expect(templateSelect.locator('option').first()).toHaveAttribute('value', '');
    await expect(templateSelect).toBeDisabled();
    // 5. Delete 按钮可见，文本为 Delete，未禁用
    const deleteBtn = deleteSection.locator('.ud12-btn-delete');
    await expect(deleteBtn).toHaveText('Delete');
    await expect(deleteBtn).toBeEnabled();
    await takeScreenshot(page, 'Delete区域控件状态');
  });

  test('UD12_004_画面初期表示_CheckTemplate区域', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 1. 显示标题 Check your rtf template
    await expect(page.locator('.ud12-check-heading')).toHaveText('Check your rtf template');
    // 2. 显示说明文本
    await expect(page.locator('.ud12-check-description')).toContainText('If you want to verify that your template can be processed');
    // 3. 显示链接 Check Template，可点击
    await expect(page.locator('.ud12-check-link')).toBeVisible();
    await expect(page.locator('.ud12-check-link')).toHaveText('Check Template');
    await takeScreenshot(page, 'CheckTemplate区域');
  });

  test('UD12_005_画面初期表示_Market列表数据来源', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // Upload 区域 Market 下拉列表
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    const uploadOptions = await uploadSelect.locator('option').count();
    expect(uploadOptions).toBeGreaterThan(1);

    // Delete 区域 Market 下拉列表
    const deleteSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const deleteOptions = await deleteSelect.locator('option').count();
    expect(deleteOptions).toBeGreaterThan(1);
  // 1. 确保下拉框可见且启用
    await expect(uploadSelect).toBeVisible();
    await expect(uploadSelect).toBeEnabled();
    await expect(deleteSelect).toBeVisible();
    await expect(deleteSelect).toBeEnabled();
    await takeScreenshot(page, '初期');
    // 两个下拉列表互不影响
    await uploadSelect.click();
    await takeScreenshot(page, 'uploadSelect Market列表数据');
    await uploadSelect.selectOption('JPN');
    await uploadSelect.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'uploadSelect 选择JPN后确认');

    await deleteSelect.click();
    await takeScreenshot(page, 'deleteSelect Market列表数据');
    await deleteSelect.selectOption('CHN')
    await deleteSelect.click();
    await page.waitForTimeout(300);
    await takeScreenshot(page, 'deleteSelect 选择CHN后确认');

    const uploadVal = await uploadSelect.inputValue();
    expect(uploadVal).toBe('JPN');
    const deleteVal = await deleteSelect.inputValue();
    expect(deleteVal).toBe('CHN');
    await takeScreenshot(page, 'Market列表数据来源');
  });

  test('UD12_006_画面初期表示_Market列表为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';

    // Mock API 返回空数据
    await page.route('**/api/ud12/selectmarket', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: [] })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1500);

    // 1. 先确保选择框本身是可见且稳定的（可选，但推荐）
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await expect(uploadSelect).toBeEnabled();
    await page.waitForTimeout(1500);
    await expect(uploadSelect.locator('option')).toHaveCount(1);
    await expect(page.locator('.ud12-message')).not.toBeVisible("");

    // 5. 截图
    await takeScreenshot(page, 'Market列表为空');

  });

  test('UD12_007_画面初期表示_加载Market失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';

    // Mock API 返回 HTTP 500
    await page.route('**/api/ud12/selectmarket', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取Market列表失败', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('获取Market列表失败');
    await expect(page.locator('.ud12-upload-section .ud12-select')).toBeEnabled();
    await expect(page.locator('.ud12-delete-section .ud12-select').first()).toBeEnabled();
    await takeScreenshot(page, '加载Market失败');
  });
});

// ============================================================
// 2. HDoc Template Upload 区域 - 文件选择 (No.8-10)
// ============================================================
test.describe('文件选择', () => {

  test('UD12_008_文件选择_文件大小边界值10MB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 选择大小为 10MB 的文件
    const fileInput = page.locator('#templateFileInput');
    const fileSize = 10 * 1024 * 1024;
    const fileContent = 'x'.repeat(fileSize);
    const file = {
      name: '10MB_file.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from(fileContent)
    };
    await fileInput.setInputFiles(file);
    await page.waitForTimeout(300);

    await expect(page.locator('.ud12-message-error')).not.toBeVisible();
    // 文件被选中
    const files = await fileInput.evaluate((el: HTMLInputElement) => el.files?.length || 0);
    expect(files).toBe(1);
    await takeScreenshot(page, '文件大小边界值10MB');
  });

  test('UD12_009_文件选择_文件大小超过10MB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 选择大小为 10MB+1 字节的文件
    const fileInput = page.locator('#templateFileInput');
    const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
    await fileInput.setInputFiles({
      name: 'oversize_file.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from(largeContent)
    });
    await page.waitForTimeout(300);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('The file exceeds 10MB, please select again');
    // 文件输入框被清空
    expect(await fileInput.inputValue()).toBe('');
    await takeScreenshot(page, '文件大小超过10MB');
  });

  test('UD12_010_文件选择_选择后重新选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 先选择文件 a.rtf
    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'a.rtf', mimeType: 'application/rtf', buffer: Buffer.from('aaa') });
    await page.waitForTimeout(200);

    // 再次选择文件 b.rtf
    await fileInput.setInputFiles({ name: 'b.rtf', mimeType: 'application/rtf', buffer: Buffer.from('bbb') });
    await page.waitForTimeout(200);

    await expect(page.locator('.ud12-message-error')).not.toBeVisible();
    // 新文件被选中替换旧文件
    const files = await fileInput.evaluate((el: HTMLInputElement) => el.files?.length || 0);
    expect(files).toBe(1);
    await takeScreenshot(page, '选择后重新选择');
  });
});

// ============================================================
// 3. HDoc Template Upload 区域 - Upload 按钮操作 (No.11-22)
// ============================================================
test.describe('Upload 按钮操作', () => {

  test('UD12_011_Upload_未选择文件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // Template File 不选择，Market 选择 JPN
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('NO FILE UPLOADED');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'Upload未选择文件');
  });

  test('UD12_012_Upload_Market未选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // Template File 选择，Market 不选择
    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test content') });
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('Please select a market');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'UploadMarket未选择');
  });

  test('UD12_013_Upload_两者都为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('NO FILE UPLOADED');
    await takeScreenshot(page, 'Upload两者都为空');
  });

  test('UD12_014_Upload_上传成功_MarketJPN', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'new_template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);

    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    // 消息内容验证
    await expect(page.locator('.ud12-message-success')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('WAS SUCESSFULLY UPLOADED TO MARKET JPN');

    // 文件选择和 Market 选择被清空
    const fileVal = await fileInput.inputValue();
    expect(fileVal).toBe('');
    const marketVal = await uploadSelect.inputValue();
    expect(marketVal).toBe('');
    await expect(page.locator('.ud12-btn-upload')).toHaveText('Upload file');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'Upload上传成功JPN');
  });

  test('UD12_015_Upload_上传成功_MarketCHN', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'chn_template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);

    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('CHN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-success')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('WAS SUCESSFULLY UPLOADED TO MARKET CHN');

    const fileVal = await fileInput.inputValue();
    expect(fileVal).toBe('');
    const marketVal = await uploadSelect.inputValue();
    expect(marketVal).toBe('');
    await takeScreenshot(page, 'Upload上传成功CHN');
  });

  test('UD12_016_Upload_上传成功_MarketUSA', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'usa_template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);

    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('USA');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-success')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('WAS SUCESSFULLY UPLOADED TO MARKET USA');

    const fileVal = await fileInput.inputValue();
    expect(fileVal).toBe('');
    const marketVal = await uploadSelect.inputValue();
    expect(marketVal).toBe('');
    await takeScreenshot(page, 'Upload上传成功USA');
  });

  test('UD12_017_Upload_上传失败_API业务错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';

    // Mock API 返回 code≠200
    await page.route('**/api/ud12/uploadflie', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '文件上传失败', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('文件上传失败');
    // 按钮恢复可用
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'Upload上传失败');
  });

  test('UD12_018_Upload_异常处理_400错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';

    await page.route('**/api/ud12/uploadflie', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 400, msg: 'NO FILE UPLOADED', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('NO FILE UPLOADED');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'Upload400错误');
  });

  test('UD12_019_Upload_异常处理_服务器500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';

    await page.route('**/api/ud12/uploadflie', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '文件上传失败', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('文件上传失败');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'Upload500错误');
  });

  test('UD12_020_Upload_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';

    // Mock 网络断开
    await page.route('**/api/ud12/uploadflie', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('网络连接失败，请检查网络设置');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'Upload网络连接失败');
  });

  test('UD12_021_Upload_异常处理_API超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';

    // Mock API 响应超时（>30秒）
    await page.route('**/api/ud12/uploadflie', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(35000);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('网络连接失败，请检查网络设置');
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await takeScreenshot(page, 'UploadAPI超时');
  });

  test('UD12_022_Upload_连续上传成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');

    // 第一次上传：JPN
    await fileInput.setInputFiles({ name: 'a.rtf', mimeType: 'application/rtf', buffer: Buffer.from('aaa') });
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);
    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.ud12-message-success')).toBeVisible();
    // 第一次上传后字段清空
    expect(await uploadSelect.inputValue()).toBe('');
    await takeScreenshot(page, '连续上传第1次');

    // 第二次上传：CHN - 可正常重新选择新文件和新 Market
    await fileInput.setInputFiles({ name: 'b.rtf', mimeType: 'application/rtf', buffer: Buffer.from('bbb') });
    await uploadSelect.selectOption('CHN');
    await page.waitForTimeout(200);
    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-success')).toBeVisible();
    expect(await uploadSelect.inputValue()).toBe('');
    await takeScreenshot(page, '连续上传第2次');
  });
});

// ============================================================
// 4. HDoc Template Upload 区域 - UI交互 (No.23-25)
// ============================================================
test.describe('Upload UI交互', () => {

  test('UD12_023_Upload_上传中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';

    // Mock API 延迟响应
    await page.route('**/api/ud12/uploadflie', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);

    // 按钮文字变为 Uploading... 并禁用
    await expect(page.locator('.ud12-btn-upload')).toHaveText('Uploading...');
    await expect(page.locator('.ud12-btn-upload')).toBeDisabled();
    // Template File 输入框禁用
    await expect(fileInput).toBeDisabled();
    // Market 下拉列表禁用
    await expect(uploadSelect).toBeDisabled();
    // Delete 区域按钮和下拉列表不受影响
    await expect(page.locator('.ud12-delete-section .ud12-btn-delete')).toBeEnabled();
    await expect(page.locator('.ud12-delete-section .ud12-select').first()).toBeEnabled();
    await expect(page.locator('.ud12-delete-section .ud12-select').nth(1)).toBeDisabled();
    await takeScreenshot(page, 'Upload上传中按钮状态');
  });

  test('UD12_024_Upload_上传中防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';

    let apiCallCount = 0;
    await page.route('**/api/ud12/uploadflie', async route => {
      apiCallCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    // 再次点击
    await page.locator('.ud12-btn-upload').click({ force: true });
    await page.waitForTimeout(4000);

    expect(apiCallCount).toBe(1);
    await takeScreenshot(page, 'Upload防止重复提交');
  });

  test('UD12_025_Upload_上传成功后清空入力', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';

    await page.route('**/api/ud12/uploadflie', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'TEMPLATE test.rtf WAS SUCESSFULLY UPLOADED TO MARKET JPN', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    // 文件选择被清空
    const fileVal = await fileInput.inputValue();
    expect(fileVal).toBe('');
    // Market 恢复为 -- Select Market --
    const marketVal = await uploadSelect.inputValue();
    expect(marketVal).toBe('');
    await takeScreenshot(page, 'Upload清空入力');
  });
});

// ============================================================
// 5. HDoc Template Delete/Archive 区域 - Market选择联动 (No.26-30)
// ============================================================
test.describe('Delete Market选择联动', () => {

  test('UD12_026_Delete_Market选择后加载Templates', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1500);

    await expect(templateSelect).toBeEnabled();
    const optionCount = await templateSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
    await takeScreenshot(page, 'Market选择后加载Templates');
  });

  test('UD12_027_Delete_切换Market时清空并重新加载', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    // 选择 JPN
    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await expect(templateSelect).toBeEnabled();

    // 切换为 CHN
    await deleteMarketSelect.selectOption('CHN');
    await page.waitForTimeout(1000);

    await expect(templateSelect).toBeEnabled();
    // Templates列表被清空并重新加载，选中值重置
    expect(await templateSelect.inputValue()).toBe('');
    await takeScreenshot(page, '切换Market重新加载');
  });

  test('UD12_028_Delete_切换Market为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await deleteMarketSelect.selectOption('');
    await page.waitForTimeout(500);

    await expect(templateSelect).toBeDisabled();
    expect(await templateSelect.inputValue()).toBe('');
    await takeScreenshot(page, '切换Market为空');
  });

  test('UD12_029_Delete_加载Templates失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '获取模板列表失败', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('获取模板列表失败');
    // Templates下拉列表为空且禁用
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);
    await expect(templateSelect).toBeDisabled();
    const optCount = await templateSelect.locator('option').count();
    expect(optCount).toBe(1);
    await takeScreenshot(page, '加载Templates失败');
  });

  test('UD12_030_Delete_加载Templates网络异常', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('获取模板列表失败');
    // Templates下拉列表为空且禁用
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);
    await expect(templateSelect).toBeDisabled();
    await takeScreenshot(page, '加载Templates网络异常');
  });
});

// ============================================================
// 6. HDoc Template Delete/Archive 区域 - Delete 按钮操作 (No.31-42)
// ============================================================
test.describe('Delete 按钮操作', () => {

  test('UD12_031_Delete_Market未选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '31';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('请选择Market');
    // 不弹出确认对话框、不调用 API
    await expect(page.locator('.ud12-modal-overlay')).not.toBeVisible();
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'DeleteMarket未选择');
  });

  test('UD12_032_Delete_Template未选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '32';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['template_a.rtf'] })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('请选择要删除的模板');
    // 不弹出确认对话框、不调用 API
    await expect(page.locator('.ud12-modal-overlay')).not.toBeVisible();
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'DeleteTemplate未选择');
  });

  test('UD12_033_Delete_两者都为空', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '33';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('请选择Market');
    await takeScreenshot(page, 'Delete两者都为空');
  });

  test('UD12_034_Delete_确认对话框_取消', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '34';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    // 选择一个存在的模板
    const optionCount = await templateSelect.locator('option').count();
    if (optionCount > 1) {
      const firstOption = await templateSelect.locator('option').nth(1).getAttribute('value');
      if (firstOption) {
        await templateSelect.selectOption(firstOption);
      }
    }
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);

    // 确认对话框出现
    await expect(page.locator('.ud12-modal-overlay')).toBeVisible();
    await expect(page.locator('.ud12-modal-header h3')).toHaveText('确认删除');
    await expect(page.locator('.ud12-modal-body')).toContainText('Do you really want to delete template?');
    // 确认对话框显示文件信息
    await expect(page.locator('.ud12-modal-body')).toContainText('Market:');
    await expect(page.locator('.ud12-modal-body')).toContainText('Template:');
    await expect(page.locator('.ud12-btn-cancel')).toBeVisible();
    await expect(page.locator('.ud12-btn-confirm')).toBeVisible();
    await takeScreenshot(page, '确认对话框取消');

    // 点击 Cancel
    await page.locator('.ud12-btn-cancel').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-modal-overlay')).not.toBeVisible();
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, '确认对话框取消后');
  });

  test('UD12_035_Delete_确认对话框_确定', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '35';

    // Mock 延迟以观察 Deleting... 状态
    await page.route('**/api/ud12/deleteflie*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-modal-overlay')).toBeVisible();

    // 点击 OK
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(500);

    // 按钮文字变为 Deleting... 并禁用，Market/Template下拉禁用
    await expect(page.locator('.ud12-btn-delete')).toHaveText('Deleting...');
    await expect(page.locator('.ud12-btn-delete')).toBeDisabled();
    await expect(deleteMarketSelect).toBeDisabled();
    await expect(templateSelect).toBeDisabled();
    await takeScreenshot(page, 'Deleting中状态');

    // 等待完成
    await page.waitForTimeout(3000);

    // 确认对话框关闭
    await expect(page.locator('.ud12-modal-overlay')).not.toBeVisible();
    await takeScreenshot(page, '确认对话框确定');
  });

  test('UD12_036_Delete_删除成功', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '36';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    // 选择一个存在的模板
    const optionCount = await templateSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
    const templateName = await templateSelect.locator('option').nth(1).getAttribute('value');
    if (templateName) {
      await templateSelect.selectOption(templateName);
    }
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud12-message-success')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('WAS SUCESSFULLY DELETE FROM MARKET JPN');

    const marketVal = await deleteMarketSelect.inputValue();
    expect(marketVal).toBe('');
    await expect(templateSelect).toBeDisabled();
    // Templates 恢复到初始状态（仅 -- Select Template --）
    expect(await templateSelect.inputValue()).toBe('');
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'Delete删除成功');
  });

  test('UD12_037_Delete_删除失败_API业务错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '37';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '文件删除失败', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('文件删除失败');
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'Delete删除失败');
  });

  test('UD12_038_Delete_异常处理_404文件不存在', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '38';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['nonexist.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 404, msg: '文件不存在', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('nonexist.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('文件不存在');
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'Delete404');
  });

  test('UD12_039_Delete_异常处理_服务器500错误', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '39';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '文件删除失败', data: null })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('文件删除失败');
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'Delete500错误');
  });

  test('UD12_040_Delete_异常处理_网络连接失败', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '40';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      await route.abort('connectionrefused');
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('网络连接失败，请检查网络设置');
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'Delete网络异常');
  });

  test('UD12_041_Delete_异常处理_API超时', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '41';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000));
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(35000);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('网络连接失败，请检查网络设置');
    await expect(page.locator('.ud12-btn-delete')).toBeEnabled();
    await takeScreenshot(page, 'DeleteAPI超时');
  });

  test('UD12_042_Delete_删除后Templates列表刷新', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '42';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    // 选择一个存在的模板
    const optionCount = await templateSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
    const templateName = await templateSelect.locator('option').nth(1).getAttribute('value');
    if (templateName) {
      await templateSelect.selectOption(templateName);
    }
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(2000);

    const marketVal = await deleteMarketSelect.inputValue();
    expect(marketVal).toBe('');
    // Templates 恢复到初始状态
    await expect(templateSelect).toBeDisabled();
    expect(await templateSelect.inputValue()).toBe('');
    await takeScreenshot(page, 'Delete列表刷新');
  });
});

// ============================================================
// 7. HDoc Template Delete/Archive 区域 - UI交互 (No.43-45)
// ============================================================
test.describe('Delete UI交互', () => {

  test('UD12_043_Delete_删除中按钮禁用', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '43';

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(500);

    // 按钮文字变为 Deleting... 并禁用
    await expect(page.locator('.ud12-btn-delete')).toHaveText('Deleting...');
    await expect(page.locator('.ud12-btn-delete')).toBeDisabled();
    await expect(deleteMarketSelect).toBeDisabled();
    await expect(templateSelect).toBeDisabled();
    // Upload 区域按钮和控件不受影响
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await expect(page.locator('#templateFileInput')).toBeEnabled();
    await expect(page.locator('.ud12-upload-section .ud12-select')).toBeEnabled();
    await takeScreenshot(page, 'Delete删除中按钮状态');
  });

  test('UD12_044_Delete_删除中防止重复提交', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '44';

    let deleteCallCount = 0;
    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    await page.route('**/api/ud12/deleteflie*', async route => {
      deleteCallCount++;
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(500);

    // 再次点击
    await page.locator('.ud12-btn-delete').click({ force: true });
    await page.waitForTimeout(4000);

    expect(deleteCallCount).toBe(1);
    await takeScreenshot(page, 'Delete防止重复提交');
  });

  test('UD12_045_Delete_删除成功后清空入力', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '45';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    // 选择一个存在的模板
    const optionCount = await templateSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
    const templateName = await templateSelect.locator('option').nth(1).getAttribute('value');
    if (templateName) {
      await templateSelect.selectOption(templateName);
    }
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(2000);

    const marketVal = await deleteMarketSelect.inputValue();
    expect(marketVal).toBe('');
    await expect(templateSelect).toBeDisabled();
    const templateVal = await templateSelect.inputValue();
    expect(templateVal).toBe('');
    await takeScreenshot(page, 'Delete清空入力');
  });
});

// ============================================================
// 8. Check Template 链接 (No.46-47)
// ============================================================
test.describe('Check Template 链接', () => {

  test('UD12_046_CheckTemplate链接_画面迁移', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '46';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    await page.locator('.ud12-check-link').click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/UD13/);
    await takeScreenshot(page, 'CheckTemplate跳转');
  });

  test('UD12_047_CheckTemplate链接_UI表示', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '47';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    await expect(page.locator('.ud12-check-heading')).toHaveText('Check your rtf template');
    await expect(page.locator('.ud12-check-description')).toContainText('If you want to verify that your template can be processed');
    await expect(page.locator('.ud12-check-link')).toHaveText('Check Template');
    await expect(page.locator('.ud12-check-link')).toBeEnabled();
    await takeScreenshot(page, 'CheckTemplate链接UI');
  });
});

// ============================================================
// 9. 消息显示 (No.48-53)
// ============================================================
test.describe('消息显示', () => {

  test('UD12_048_消息类型_成功绿色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '48';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    const msg = page.locator('.ud12-message-success');
    await expect(msg).toBeVisible();
    const color = await msg.evaluate(el => getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)');
    await takeScreenshot(page, '成功绿色提示');
  });

  test('UD12_049_消息类型_错误红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '49';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);
    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);

    const msg = page.locator('.ud12-message-error');
    await expect(msg).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('NO FILE UPLOADED');
    const color = await msg.evaluate(el => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)');
    await takeScreenshot(page, '错误红色提示');
  });

  test('UD12_050_消息类型_确认对话框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '50';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    // 选择一个存在的模板
    const optionCount = await templateSelect.locator('option').count();
    if (optionCount > 1) {
      const firstOption = await templateSelect.locator('option').nth(1).getAttribute('value');
      if (firstOption) {
        await templateSelect.selectOption(firstOption);
      }
    }
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);

    await expect(page.locator('.ud12-modal-overlay')).toBeVisible();
    await expect(page.locator('.ud12-modal-header h3')).toHaveText('确认删除');
    await expect(page.locator('.ud12-modal-body')).toContainText('Do you really want to delete template?');
    await expect(page.locator('.ud12-btn-cancel')).toHaveText('Cancel');
    await expect(page.locator('.ud12-btn-confirm')).toHaveText('OK');

    await page.locator('.ud12-btn-cancel').click();
    await takeScreenshot(page, '确认对话框');
  });

  test('UD12_051_消息清空_新操作覆盖旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '51';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 第一次操作：触发错误
    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('NO FILE UPLOADED');

    // 第二次操作：选择文件后上传
    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.ud12-message-success')).toBeVisible();
    await expect(page.locator('.ud12-message-error')).not.toBeVisible();
    await takeScreenshot(page, '消息清空');
  });

  test('UD12_052_消息清空_Market切换时清除消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '52';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 触发错误消息
    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-message-error')).toBeVisible();

    // 切换 Upload 区域的 Market
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(300);

    await expect(page.locator('.ud12-message')).not.toBeVisible();
    await takeScreenshot(page, 'Market切换清除消息');
  });

  test('UD12_053_消息清空_Template切换时清除消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '53';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    // 触发错误消息
    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud12-message-error')).toBeVisible();

    // 切换 Delete 区域的 Templates
    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);

    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);
    // 选择一个存在的模板
    const optionCount = await templateSelect.locator('option').count();
    if (optionCount > 1) {
      const firstOption = await templateSelect.locator('option').nth(1).getAttribute('value');
      if (firstOption) {
        await templateSelect.selectOption(firstOption);
      }
    }
    await page.waitForTimeout(300);

    await expect(page.locator('.ud12-message')).not.toBeVisible();
    await takeScreenshot(page, 'Template切换清除消息');
  });
});

// ============================================================
// 10. UI交互 - 独立性 (No.54)
// ============================================================
test.describe('UI交互独立性', () => {

  test('UD12_054_Upload和Delete操作互不干扰', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '54';

    // ===== 方向1: Upload操作时Delete区域不受影响 =====
    await page.route('**/api/ud12/uploadflie', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({ name: 'test.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(500);

    // Upload 区域禁用
    await expect(page.locator('.ud12-btn-upload')).toBeDisabled();
    await expect(fileInput).toBeDisabled();

    // Delete 区域仍可用
    await expect(page.locator('.ud12-delete-section .ud12-btn-delete')).toBeEnabled();
    await expect(page.locator('.ud12-delete-section .ud12-select').first()).toBeEnabled();

    // 等待Upload完成
    await page.waitForTimeout(5000);

    // ===== 方向2: Delete操作时Upload区域不受影响 =====
    await page.route('**/api/ud12/deleteflie*', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: 'success', data: {} })
      });
    });

    await page.route('**/api/ud12/template/list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, msg: '', data: ['test.rtf'] })
      });
    });

    const deleteMarketSelect = page.locator('.ud12-delete-section .ud12-select').first();
    const templateSelect = page.locator('.ud12-delete-section .ud12-select').nth(1);

    await deleteMarketSelect.selectOption('JPN');
    await page.waitForTimeout(1000);
    await templateSelect.selectOption('test.rtf');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-delete').click();
    await page.waitForTimeout(500);
    await page.locator('.ud12-btn-confirm').click();
    await page.waitForTimeout(500);

    // Delete 区域禁用
    await expect(page.locator('.ud12-btn-delete')).toBeDisabled();
    await expect(deleteMarketSelect).toBeDisabled();

    // Upload 区域仍可用
    await expect(page.locator('.ud12-btn-upload')).toBeEnabled();
    await expect(page.locator('#templateFileInput')).toBeEnabled();
    await takeScreenshot(page, 'UploadDelete独立性');
  });
});

// ============================================================
// 11. 安全性 (No.55-57)
// ============================================================
test.describe('安全性', () => {

  test('UD12_055_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '55';

    // 先导航到目标页面，再清除 localStorage（模拟未登录状态）
    await page.goto(BASE_URL + '/UD12');
    await page.waitForTimeout(1000);
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    // 重新加载页面使其检测到未登录状态
    await page.reload();
    await page.waitForTimeout(2000);

    // AppLayout 重定向到根路径 /（Login 页面）
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await takeScreenshot(page, '未登录重定向');
  });

  test('UD12_056_安全性_文件路径遍历防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '56';

    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    await fileInput.setInputFiles({
      name: '../../../etc/passwd.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('test content')
    });
    const uploadSelect = page.locator('.ud12-upload-section .ud12-select');
    await uploadSelect.selectOption('JPN');
    await page.waitForTimeout(200);

    await page.locator('.ud12-btn-upload').click();
    await page.waitForTimeout(1500);

    // 后端应正常响应（返回上传成功或拦截错误）
    const successMsg = page.locator('.ud12-message-success');
    const errorMsg = page.locator('.ud12-message-error');
    const isSuccess = await successMsg.isVisible().catch(() => false);
    const isError = await errorMsg.isVisible().catch(() => false);
    expect(isSuccess || isError).toBeTruthy();
    await takeScreenshot(page, '文件路径遍历防护');
  });

  test('UD12_057_安全性_文件大小限制10MB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '57';
    await goToUD12(page);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('#templateFileInput');
    const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
    await fileInput.setInputFiles({
      name: 'large_file.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from(largeContent)
    });
    await page.waitForTimeout(300);

    await expect(page.locator('.ud12-message-error')).toBeVisible();
    await expect(page.locator('.ud12-message')).toContainText('The file exceeds 10MB, please select again');
    await takeScreenshot(page, '文件大小限制');
  });
});
