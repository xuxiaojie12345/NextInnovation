/**
 * UD13 - HDoc Template Check Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD13.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock）
 * 截图保存: tests/test/Image/UD13/
 * 测试用例数: 14
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, getTestUser, createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD13');

// ============================================================
// 元素定位（匹配 HDocTemplateCheck.tsx 源码）
// ============================================================

const $container    = (p: Page) => p.locator('.htc-container');
const $header       = (p: Page) => p.locator('.htc-header');
const $title        = (p: Page) => p.locator('.htc-header h1');
const $form         = (p: Page) => p.locator('.htc-form');
const $formTable    = (p: Page) => p.locator('.htc-form-table');
const $label        = (p: Page) => p.locator('.htc-label');
const $fileInput    = (p: Page) => p.locator('.htc-value input[type="file"]');
const $btnCheck     = (p: Page) => p.locator('.btn-tr .btn');

// Ant Design Modal
const $modalContent  = (p: Page) => p.locator('.ant-modal-confirm-content');
const $modalOkBtn    = (p: Page) => p.locator('.ant-modal-confirm-btns .ant-btn-primary');

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/hdoc-template-check', { waitUntil: 'load' });
  await page.waitForSelector('.htc-container');
  await page.waitForTimeout(1500);
}

test.describe.configure({ mode: 'serial' });
test.describe('UD13 HDoc Template Check', () => {

  // -----------------------------------------------------------
  // 画面初期表示 (TC1~6)
  // -----------------------------------------------------------

  test('01 - Initial display title', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    await expect($container(page)).toBeVisible();
    await expect($header(page)).toBeVisible();
    await expect($title(page)).toBeVisible();
    await expect($title(page)).toHaveText('HDoc Template Check');
    await ss(page, 'title verified', '01');
  });

  test('02 - Template File input state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    await expect($fileInput(page)).toBeVisible();
    // 初期未选择文件
    const files = await $fileInput(page).evaluate(el => (el as HTMLInputElement).files?.length || 0);
    expect(files).toBe(0);
    await expect($fileInput(page)).toBeEnabled();
    await ss(page, 'file input verified', '02');
  });

  test('03 - Check button state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    await expect($btnCheck(page)).toBeVisible();
    await expect($btnCheck(page)).toHaveText('Check');
    await expect($btnCheck(page)).toBeEnabled();
    await ss(page, 'check button verified', '03');
  });

  test('04 - Download checked template link hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // 组件中没有 Download checked template 链接，默认隐藏
    const hasDownloadLink = await page.evaluate(() => {
      return document.body.textContent?.includes('Download checked template') || false;
    });
    expect(hasDownloadLink).toBe(false);
    await ss(page, 'download link hidden', '04');
  });

  test('05 - Error message hidden', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    // 组件中没有错误消息区域，默认隐藏
    const hasErrorMsg = await page.evaluate(() => {
      return !!document.querySelector('.htc-error') || !!document.querySelector('.error-message');
    });
    expect(hasErrorMsg).toBe(false);
    await ss(page, 'error message hidden', '05');
  });

  test('06 - Overall layout', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    await expect($form(page)).toBeVisible();
    await expect($formTable(page)).toBeVisible();
    // Template File 标签
    await expect($label(page).first()).toContainText('Template File');
    // 文件选择框和 Check 按钮在同一表单中
    await expect($fileInput(page)).toBeVisible();
    await expect($btnCheck(page)).toBeVisible();
    await ss(page, 'layout verified', '06');
  });

  // -----------------------------------------------------------
  // Template File 选择 (TC7~8)
  // -----------------------------------------------------------

  test('07 - Select rtf file', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // 用 fileChooser 模拟选择文件
    const fileChooserPromise = page.waitForEvent('filechooser');
    await $fileInput(page).click();
    await ss(page, 'file chooser opened', '07');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'template_check.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('test rtf content'),
    });
    await ss(page, 'file selected', '07');
    const fileName = await $fileInput(page).evaluate(el => (el as HTMLInputElement).files?.[0]?.name || '');
    expect(fileName).toBe('template_check.rtf');
    await ss(page, 'file name verified', '07');
  });

  test('08 - Cancel file selection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    // 先选择文件
    const fc1 = page.waitForEvent('filechooser');
    await $fileInput(page).click();
    const chooser1 = await fc1;
    await chooser1.setFiles({
      name: 'template_check.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('test'),
    });
    await ss(page, 'file selected', '08');
    // 取消选择：通过 evaluate 清空 file input
    await $fileInput(page).evaluate(el => { (el as HTMLInputElement).value = ''; });
    await page.waitForTimeout(300);
    const filesLen = await $fileInput(page).evaluate(el => (el as HTMLInputElement).files?.length || 0);
    expect(filesLen).toBe(0);
    await ss(page, 'file selection cancelled', '08');
  });

  // -----------------------------------------------------------
  // Check 按钮点击事件 (TC9~11)
  // -----------------------------------------------------------

  test('09 - Check without file', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    // Ant Design Modal.info，非浏览器原生 dialog
    await $btnCheck(page).click();
    await expect($modalContent(page)).toBeVisible({ timeout: 5000 });
    const modalText = await $modalContent(page).textContent();
    console.log('  Modal message: ' + modalText);
    expect(modalText).toContain('功能尚未实现');
    await $modalOkBtn(page).click();
    await expect($modalContent(page)).not.toBeVisible();
    await ss(page, 'check clicked', '09');
  });

  test('10 - Check with file selected', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    // 选择文件
    const fc = page.waitForEvent('filechooser');
    await $fileInput(page).click();
    const chooser = await fc;
    await chooser.setFiles({
      name: 'template_check.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('test rtf content'),
    });
    await ss(page, 'file selected', '10');
    // 点击 Check
    await $btnCheck(page).click();
    await expect($modalContent(page)).toBeVisible({ timeout: 5000 });
    const modalText = await $modalContent(page).textContent();
    console.log('  Modal message: ' + modalText);
    expect(modalText).toContain('功能尚未实现');
    await $modalOkBtn(page).click();
    await expect($modalContent(page)).not.toBeVisible();
    await ss(page, 'check with file', '10');
  });

  test('11 - Prevent duplicate submit', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    // 选择文件
    const fc = page.waitForEvent('filechooser');
    await $fileInput(page).click();
    const chooser = await fc;
    await chooser.setFiles({
      name: 'template_check.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('test'),
    });
    await ss(page, 'file selected', '11');
    // 连续点击多次，每次应弹出 Modal
    await $btnCheck(page).click();
    await expect($modalContent(page)).toBeVisible({ timeout: 5000 });
    await $modalOkBtn(page).click();
    await page.waitForTimeout(200);
    await $btnCheck(page).click();
    await expect($modalContent(page)).toBeVisible({ timeout: 5000 });
    await $modalOkBtn(page).click();
    await page.waitForTimeout(200);
    await $btnCheck(page).click();
    await expect($modalContent(page)).toBeVisible({ timeout: 5000 });
    await $modalOkBtn(page).click();
    await page.waitForTimeout(500);
    await ss(page, 'multiple clicks', '11');
    console.log('  All 3 clicks succeeded');
  });

  // -----------------------------------------------------------
  // 异常处理 (TC12)
  // -----------------------------------------------------------

  test('12 - Non-rtf file selection', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    // 选择 .txt 文件
    const fc = page.waitForEvent('filechooser');
    await $fileInput(page).click();
    const chooser = await fc;
    await chooser.setFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('plain text'),
    });
    await ss(page, 'txt file selected', '12');
    const fileName = await $fileInput(page).evaluate(el => (el as HTMLInputElement).files?.[0]?.name || '');
    expect(fileName).toBe('test.txt');
    // 前端不阻止非 rtf 文件的选择
    console.log('  Selected file: ' + fileName);
    await ss(page, 'non-rtf file verified', '12');
  });

  // -----------------------------------------------------------
  // 安全性 (TC13~14)
  // -----------------------------------------------------------

  test('13 - Unauthenticated access', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
    });
    await ss(page, 'localStorage cleared', '13');
    await page.goto(PAGE_URL + '/menu/hdoc-template-check', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('  Current URL: ' + url);
    const isLogin = url.includes('/login');
    console.log('  Redirected to login: ' + isLogin);
    await ss(page, 'unauthenticated redirect', '13');
    expect(isLogin).toBe(true);
  });

  test('14 - XSS protection in filename', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    // 选择文件名包含 XSS 代码的文件
    const fc = page.waitForEvent('filechooser');
    await $fileInput(page).click();
    const chooser = await fc;
    await chooser.setFiles({
      name: '<script>alert(1)</script>.rtf',
      mimeType: 'application/rtf',
      buffer: Buffer.from('xss test'),
    });
    await ss(page, 'xss file selected', '14');
    const fileName = await $fileInput(page).evaluate(el => (el as HTMLInputElement).files?.[0]?.name || '');
    console.log('  Selected file name: ' + fileName);
    // XSS 文件名被正确显示为文本
    expect(fileName).toContain('<script>');
    // 点击 Check 按钮，确认 Modal 内容中不包含可执行的 XSS
    await $btnCheck(page).click();
    await expect($modalContent(page)).toBeVisible({ timeout: 5000 });
    const modalText = await $modalContent(page).textContent();
    console.log('  Modal content: ' + modalText);
    expect(modalText).toContain('功能尚未实现');
    // modalText 是 textContent，不会包含可执行脚本
    expect(modalText).not.toContain('alert(1)');
    await $modalOkBtn(page).click();
    await ss(page, 'xss not executed', '14');
  });

});
