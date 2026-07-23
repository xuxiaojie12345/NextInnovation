// @ts-nocheck
/* eslint-disable */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

// ============================================================
// UD13_HDocTemplateCheck 单元测试
// 测试规格书: テスト式样書UD13.md
// 画面文件: UD13_HDocTemplateCheck.tsx
// ============================================================

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_ROOT = path.resolve(__dirname, 'Image', 'UD13');

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
  const filename = `${currentTestNo}_UD13画面ピクチャー${String(screenshotCounter).padStart(3, '0')}.jpeg`;
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
 * 导航到 UD13 页面
 */
async function goToUD13(page: Page) {
  await login(page);
  await page.goto(BASE_URL + '/UD13');
  await page.waitForSelector('.ud13-container');
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

  test('UD13_001_画面初期表示_全体布局', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '01';
    await goToUD13(page);
    await page.waitForTimeout(1000);

    // 1. 页面容器可见
    await expect(page.locator('.ud13-container')).toBeVisible();
    await takeScreenshot(page, '页面容器可见');

    // 2. 页面标题显示 HDoc Template Check
    await expect(page.locator('.ud13-page-title')).toHaveText('HDoc Template Check');
    await takeScreenshot(page, '页面标题');

    // 3. Template File 输入框可见
    await expect(page.locator('#ud13TemplateFileInput')).toBeVisible();
    await takeScreenshot(page, 'TemplateFile输入框');

    // 4. Check 按钮可见，文本为 Check
    await expect(page.locator('.ud13-btn-check')).toBeVisible();
    await expect(page.locator('.ud13-btn-check')).toHaveText('Check');
    await takeScreenshot(page, 'Check按钮');

    // 5. 消息区域不在页面中（默认隐藏）
    await expect(page.locator('.ud13-message')).not.toBeVisible();

    // 6. 检查结果显示区域不在页面中（默认隐藏）
    await expect(page.locator('.ud13-result-section')).not.toBeVisible();
    await takeScreenshot(page, '整体布局');
  });

  test('UD13_002_画面初期表示_TemplateFile输入框', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '02';
    await goToUD13(page);
    await page.waitForTimeout(1000);

    // 1. Template File 输入框可见
    const fileInput = page.locator('#ud13TemplateFileInput');
    await expect(fileInput).toBeVisible();

    // 2. 标签文字为 Template File
    await expect(page.locator('.ud13-label')).toHaveText('Template File');

    // 3. accept 属性为 .rtf
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toBe('.rtf');

    // 4. 未选择任何文件
    const fileValue = await fileInput.inputValue();
    expect(fileValue).toBe('');

    // 5. 处于可用状态（未禁用）
    await expect(fileInput).toBeEnabled();
    await takeScreenshot(page, 'TemplateFile输入框');
  });

  test('UD13_003_画面初期表示_Check按钮状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '03';
    await goToUD13(page);
    await page.waitForTimeout(1000);

    // 1. Check 按钮可见
    await expect(page.locator('.ud13-btn-check')).toBeVisible();

    // 2. 文本为 Check
    await expect(page.locator('.ud13-btn-check')).toHaveText('Check');

    // 3. 处于可用状态（未禁用）
    await expect(page.locator('.ud13-btn-check')).toBeEnabled();
    await takeScreenshot(page, 'Check按钮状态');
  });

  test('UD13_004_画面初期表示_Download链接状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '04';
    await goToUD13(page);
    await page.waitForTimeout(1000);

    // Download checked template 链接不在页面中（当前版本机能不实装，不显示）
    const downloadLink = page.locator('text=Download');
    await expect(downloadLink).not.toBeVisible();
    await takeScreenshot(page, 'Download链接状态');
  });

  test('UD13_005_画面初期表示_检查结果区域隐藏', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '05';
    await goToUD13(page);
    await page.waitForTimeout(1000);

    // Variables found 区域不在页面中（默认隐藏）
    await expect(page.locator('.ud13-result-section')).not.toBeVisible();
    await expect(page.locator('.ud13-result-label')).not.toBeVisible();
    await takeScreenshot(page, '检查结果区域隐藏');
  });
});

// ============================================================
// 2. 文件选择 (No.6-12)
// ============================================================
test.describe('文件选择', () => {

  test('UD13_006_文件选择_选择RTF文件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '06';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test content') });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 文件被成功选择，不显示错误消息
    await expect(page.locator('.ud13-message-error')).not.toBeVisible();
    // 检查状态被重置，Variables found 区域不显示
    await expect(page.locator('.ud13-result-section')).not.toBeVisible();
    await takeScreenshot(page, '选择RTF文件');
  });

  test('UD13_007_文件选择_选择非RTF文件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '07';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择非 RTF 文件（.docx）
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({
      name: 'document.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test')
    });
    await page.waitForTimeout(300);

    // 消息区域可见，消息内容为 只支持RTF格式文件
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');
    await takeScreenshot(page, '选择非RTF文件');
  });

  test('UD13_008_文件选择_选择空文件0KB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '08';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择大小为 0KB 的空 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'empty.rtf', mimeType: 'application/rtf', buffer: Buffer.from([]) });
    await page.waitForTimeout(300);

    // 消息区域可见，消息内容为 文件为空，请选择有效的RTF文件
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('文件为空，请选择有效的RTF文件');
    await takeScreenshot(page, '选择空文件0KB');
  });

  test('UD13_009_文件选择_文件大小边界值10MB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '09';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择大小为 10MB 的 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    const fileSize = 10 * 1024 * 1024;
    const fileContent = 'x'.repeat(fileSize);
    await fileInput.setInputFiles({
      name: '10MB_template.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from(fileContent)
    });
    await page.waitForTimeout(300);

    // 文件大小校验通过（≤10MB），不显示错误消息
    await expect(page.locator('.ud13-message-error')).not.toBeVisible();
    await takeScreenshot(page, '文件大小边界值10MB');
  });

  test('UD13_010_文件选择_文件大小超过10MB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '10';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择大小为 10MB+1 字节的 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
    await fileInput.setInputFiles({
      name: 'oversize_template.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from(largeContent)
    });
    await page.waitForTimeout(300);

    // 消息区域可见，消息内容为 文件大小超过限制（最大10MB）
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('文件大小超过限制（最大10MB）');
    await takeScreenshot(page, '文件大小超过10MB');
  });

  test('UD13_011_文件选择_选择后重新选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '11';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const fileInput = page.locator('#ud13TemplateFileInput');

    // 先选择文件 a.rtf
    await fileInput.setInputFiles({ name: 'a.rtf', mimeType: 'application/rtf', buffer: Buffer.from('aaa') });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 再次选择文件 b.rtf
    await fileInput.setInputFiles({ name: 'b.rtf', mimeType: 'application/rtf', buffer: Buffer.from('bbb') });
    await page.waitForTimeout(200);

    // 不显示错误消息
    await expect(page.locator('.ud13-message-error')).not.toBeVisible();
    await takeScreenshot(page, '选择后重新选择');
  });

  test('UD13_012_文件选择_取消选择', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '12';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 验证初始状态确认无文件被选择
    const fileInput = page.locator('#ud13TemplateFileInput');
    const fileValue = await fileInput.inputValue();
    expect(fileValue).toBe('');

    // selectedFile 保持为 null（无错误消息触发）
    await expect(page.locator('.ud13-message')).not.toBeVisible();
    await takeScreenshot(page, '取消选择');
  });
});

// ============================================================
// 3. Check 按钮操作 (No.13-15)
// ============================================================
test.describe('Check 按钮操作', () => {

  test('UD13_013_Check_未选择文件时点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '13';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 不选择任何文件，点击 Check 按钮
    await page.locator('.ud13-btn-check').click();
    await page.waitForTimeout(500);

    // 消息区域可见，消息内容为 Check 机能未实装（当前版本暂不支持）
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('Check 机能未实装（当前版本暂不支持）');
    // 检查状态保持为 false，Variables found 区域不显示
    await expect(page.locator('.ud13-result-section')).not.toBeVisible();
    await takeScreenshot(page, '未选择文件点击Check');
  });

  test('UD13_014_Check_选择RTF文件后点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '14';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 点击 Check 按钮
    await page.locator('.ud13-btn-check').click();
    await page.waitForTimeout(500);

    // 消息区域可见，消息内容为 Check 机能未实装（当前版本暂不支持）
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('Check 机能未实装（当前版本暂不支持）');
    // 检查状态保持为 false
    await expect(page.locator('.ud13-result-section')).not.toBeVisible();
    await takeScreenshot(page, '选择RTF文件后点击Check');
  });

  test('UD13_015_Check_选择文件后重复点击', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '15';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 连续点击 2 次 Check 按钮
    const checkBtn = page.locator('.ud13-btn-check');
    await checkBtn.click();
    await page.waitForTimeout(300);
    await checkBtn.click();
    await page.waitForTimeout(300);

    // 每次点击都显示相同的消息
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('Check 机能未实装（当前版本暂不支持）');
    await takeScreenshot(page, '重复点击Check');
  });
});

// ============================================================
// 4. 消息显示 (No.16-18)
// ============================================================
test.describe('消息显示', () => {

  test('UD13_016_消息类型_错误红色', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '16';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择非 RTF 文件触发错误
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test')
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 消息区域从隐藏变为可见，错误消息文字为红色
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');
    await takeScreenshot(page, '错误红色消息');
  });

  test('UD13_017_消息清空_新操作覆盖旧消息', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '17';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const fileInput = page.locator('#ud13TemplateFileInput');

    // 第一次操作：选择非 RTF 文件触发错误
    await fileInput.setInputFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test')
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');

    // 第二次操作：选择有效的 RTF 文件
    await fileInput.setInputFiles({ name: 'valid.rtf', mimeType: 'application/rtf', buffer: Buffer.from('valid content') });
    await page.waitForTimeout(300);

    // 旧错误消息被清除，消息区域隐藏
    await expect(page.locator('.ud13-message')).not.toBeVisible();
    await takeScreenshot(page, '消息清空新操作覆盖');
  });

  test('UD13_018_消息清空_Check后消息不残留', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '18';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const fileInput = page.locator('#ud13TemplateFileInput');

    // 第一次操作：选择非 RTF 文件触发错误
    await fileInput.setInputFiles({
      name: 'test.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('test')
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.ud13-message-error')).toBeVisible();

    // 第二次操作：选择有效 RTF 文件（旧消息被清除）
    await fileInput.setInputFiles({ name: 'valid.rtf', mimeType: 'application/rtf', buffer: Buffer.from('valid') });
    await page.waitForTimeout(300);
    await expect(page.locator('.ud13-message')).not.toBeVisible();

    // 第三次操作：点击 Check 按钮
    await page.locator('.ud13-btn-check').click();
    await page.waitForTimeout(500);

    // 显示新消息
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('Check 机能未实装（当前版本暂不支持）');
    await takeScreenshot(page, 'Check后消息不残留');
  });
});

// ============================================================
// 5. UI交互 (No.19-20)
// ============================================================
test.describe('UI交互', () => {

  test('UD13_019_UI交互_选择文件后重置检查状态', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '19';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 先点击 Check 按钮（isChecked 保持 false）
    await page.locator('.ud13-btn-check').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ud13-message-error')).toBeVisible();

    // 选择新的 RTF 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(300);

    // 检查状态被重置为 false，Variables found 区域不显示
    await expect(page.locator('.ud13-result-section')).not.toBeVisible();
    await takeScreenshot(page, '选择文件后重置检查状态');
  });

  test('UD13_020_UI交互_选择文件后重新选择同一文件', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '20';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const fileInput = page.locator('#ud13TemplateFileInput');

    // 选择文件 template.rtf
    await fileInput.setInputFiles({ name: 'template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);
    await takeScreenshot(page, '入力後');

    // 再次选择同一文件 template.rtf
    await fileInput.setInputFiles({ name: 'template.rtf', mimeType: 'application/rtf', buffer: Buffer.from('test') });
    await page.waitForTimeout(200);

    // 不显示错误消息
    await expect(page.locator('.ud13-message-error')).not.toBeVisible();
    await takeScreenshot(page, '重新选择同一文件');
  });
});

// ============================================================
// 6. 异常处理 (No.21-25)
// ============================================================
test.describe('异常处理', () => {

  test('UD13_021_异常处理_文件格式错误exe', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '21';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择 .exe 可执行文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'malware.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('exe content') });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');
    await takeScreenshot(page, '文件格式错误exe');
  });

  test('UD13_022_异常处理_文件格式错误PDF', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '22';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择 .pdf 文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf content') });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');
    await takeScreenshot(page, '文件格式错误PDF');
  });

  test('UD13_023_异常处理_文件格式错误图片', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '23';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择 .png 图片文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from('png content') });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');
    await takeScreenshot(page, '文件格式错误图片');
  });

  test('UD13_024_异常处理_文件内容为空0KB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '24';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择大小为 0KB 的空文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({ name: 'empty.rtf', mimeType: 'application/rtf', buffer: Buffer.from([]) });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('文件为空，请选择有效的RTF文件');
    await takeScreenshot(page, '文件内容为空0KB');
  });

  test('UD13_025_异常处理_文件大小超限', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '25';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择超过 10MB 的文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
    await fileInput.setInputFiles({ name: 'large.rtf', mimeType: 'application/rtf', buffer: Buffer.from(largeContent) });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 消息区域可见，消息内容为 文件大小超过限制（最大10MB）
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('文件大小超过限制（最大10MB）');
    await takeScreenshot(page, '文件大小超限');
  });
});

// ============================================================
// 7. 安全性 (No.26-30)
// ============================================================
test.describe('安全性', () => {

  test('UD13_026_安全性_未登录直接访问重定向', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '26';

    // 1. 先登录系统，进入 UD13 画面
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/UD13/);
    await expect(page.locator('.ud13-container')).toBeVisible();
    await takeScreenshot(page, 'UD13画面表示');

    // 2. 清除所有 localStorage 数据（模拟未登录状态）
    await page.evaluate(() => localStorage.clear());
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/UD13/);
    await expect(page.locator('.ud13-container')).toBeVisible();
    await takeScreenshot(page, 'localStorage清除後（画面未刷新）');

    // 3. 浏览器地址栏直接输入 UD13 画面的完整 URL 并访问
    await page.goto(BASE_URL + '/UD13');
    await page.waitForTimeout(2000);

    // 4. 确认结果：URL 变为根路径（Login 画面），UD13 画面不被显示
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('.ud13-container')).not.toBeVisible();
    await takeScreenshot(page, '重定向結果（Login画面）');
  });

  test('UD13_027_安全性_文件格式验证仅RTF', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '27';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    const fileInput = page.locator('#ud13TemplateFileInput');

    // 测试多种非 RTF 文件格式
    const testFiles = [
      { name: 'document.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', desc: 'docx' },
      { name: 'document.pdf', mimeType: 'application/pdf', desc: 'pdf' },
      { name: 'notes.txt', mimeType: 'text/plain', desc: 'txt' },
      { name: 'malicious.exe', mimeType: 'application/x-msdownload', desc: 'exe' },
    ];

    for (const file of testFiles) {
      await fileInput.setInputFiles({ name: file.name, mimeType: file.mimeType, buffer: Buffer.from('test') });
      await page.waitForTimeout(200);
      await expect(page.locator('.ud13-message-error')).toBeVisible();
      await expect(page.locator('.ud13-message')).toContainText('只支持RTF格式文件');
    }
    await takeScreenshot(page, '文件格式验证仅RTF');
  });

  test('UD13_028_安全性_文件路径遍历防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '28';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择文件名为包含路径遍历字符的文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    await fileInput.setInputFiles({
      name: '../../../etc/passwd.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('test')
    });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 文件扩展名校验通过（以 .rtf 结尾），文件被选择
    await expect(page.locator('.ud13-message-error')).not.toBeVisible();
    await takeScreenshot(page, '文件路径遍历防护');
  });

  test('UD13_029_安全性_文件大小限制10MB', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '29';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择超过 10MB 的文件
    const fileInput = page.locator('#ud13TemplateFileInput');
    const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
    await fileInput.setInputFiles({ name: 'large_file.rtf', mimeType: 'application/rtf', buffer: Buffer.from(largeContent) });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 前端校验文件大小，超过 10MB 被拒绝
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('文件大小超过限制（最大10MB）');
    await takeScreenshot(page, '文件大小限制10MB');
  });

  test('UD13_030_安全性_超大文件防护', { timeout: 120000 }, async ({ page }) => {
    currentTestNo = '30';
    await goToUD13(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '初期表示');

    // 选择远超过 10MB 的文件（1GB）
    const fileInput = page.locator('#ud13TemplateFileInput');
    const hugeContent = 'x'.repeat(40 * 1024 * 1024);
    await fileInput.setInputFiles({ name: 'huge_file.rtf', mimeType: 'application/rtf', buffer: Buffer.from(hugeContent) });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '入力後');

    // 前端校验立即拒绝
    await expect(page.locator('.ud13-message-error')).toBeVisible();
    await expect(page.locator('.ud13-message')).toContainText('文件大小超过限制（最大10MB）');
    await takeScreenshot(page, '超大文件防护');
  });
});
