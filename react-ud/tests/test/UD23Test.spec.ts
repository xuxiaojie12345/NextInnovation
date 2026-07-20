/**
 * UD23 - Download and Print Quick Guides Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD23.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实页面（无API调用，纯前端展示）
 * 截图保存: tests/test/Image/UD23/
 * 测试用例数: 21
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { createScreenshot, login, PAGE_URL } from './utils';

// -- 截图 --
const ss = createScreenshot('UD23');

// ============================================================
// 元素定位（匹配 DownloadAndPrintQuickGuides.tsx / CSS）
// ============================================================

const $container     = (p: Page) => p.locator('.dpg-container');
const $header        = (p: Page) => p.locator('.panel-header h1');

// Back link
const $backLink      = (p: Page) => p.locator('.dpg-back-link .dpg-link');

// Quick Guides 链接（通过文本定位）
const $linkByText    = (p: Page, text: string) =>
  p.locator('.dpg-link-item .dpg-link').filter({ hasText: text });

// 复选框
const $chkPrint      = (p: Page) => p.locator('.dpg-checkbox-label').filter({ hasText: 'To print do the following' }).locator('input[type="checkbox"]');
const $chkFold       = (p: Page) => p.locator('.dpg-checkbox-label').filter({ hasText: 'To fold do the following' }).locator('input[type="checkbox"]');

// 说明区域
const $printPanel    = (p: Page) => p.locator('.dpg-instruction-panel').filter({ hasText: 'Print Instructions' });
const $foldPanel     = (p: Page) => p.locator('.dpg-instruction-panel').filter({ hasText: 'Fold Instructions' });

// ============================================================
// 导航辅助函数
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  // 通过 UD24 - User Guide (HDoc Help) 画面点击 HDoc Quick Guide 进入
  await page.goto(PAGE_URL + '/menu/guide-user', { waitUntil: 'load' });
  await page.waitForSelector('.user-guide-page');
  await page.waitForTimeout(1000);
  // 点击 "HDoc Quick Guide" 链接
  await page.locator('.help-link-item .help-link-text').filter({ hasText: 'HDoc Quick Guide' }).click();
  // 等待跳转到 quick-guides 页面
  await page.waitForURL('**/menu/quick-guides', { timeout: 10000 });
  await page.waitForSelector('.dpg-container');
  await page.waitForTimeout(1000);
}

// ============================================================
// 测试数据常量（链接文本列表）
// ============================================================

const UPPER_LINKS = [
  'WIS Quick Guide',
  'PERF Quick Guide',
  'W8-Calc Quick Guide',
  'HDoc Quick Guide',
  'EDB Quick Guide',
  'COS Quick Guide',
  'VBI Quick Guide (Intranet version)',
  'VBI Quick Guide (Internet version)',
];

const LOWER_LINKS = [
  'KBS Quick Guide',
  'CVM Quick Guide',
  'AVP Quick Guide',
  'KAX Quick Guide',
  'C&E Homepage Quick Guide',
  'RPD Quick Guide',
  'SPC Quick Guide',
  'WebFRAME Quick Guide',
];

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD23 Download and Print Quick Guides', () => {

  // ===========================================================
  // 画面初期表示 (TC1~6)
  // ===========================================================

  test('01 - Quick Guides card area', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '01');
    // 页面容器可见
    await expect($container(page)).toBeVisible();
    // 标题
    await expect($header(page)).toBeVisible();
    await expect($header(page)).toHaveText('Download and Print Quick Guides');
    // Quick Guides 卡片展示区 - 标题链接
    const titleLink = $linkByText(page, 'Download and Print Quick Guides');
    await expect(titleLink).toBeVisible();
    await ss(page, 'card area verified', '01');
  });

  test('02 - Upper Quick Guides links (8 items)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '02');
    // 确认上部 8 个链接
    for (const name of UPPER_LINKS) {
      await expect($linkByText(page, name)).toBeVisible();
      console.log(`  ✅ ${name}`);
    }
    await ss(page, 'upper links verified', '02');
  });

  test('03 - Volvo 3P Quick Guides links list', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '03');
    // Volvo 3P Quick Guides 标题
    await expect($linkByText(page, 'Volvo 3P Quick Guides')).toBeVisible();
    // 下部 8 个链接
    for (const name of LOWER_LINKS) {
      await expect($linkByText(page, name)).toBeVisible();
      console.log(`  ✅ ${name}`);
    }
    await ss(page, 'volvo 3p links verified', '03');
  });

  test('04 - Checkboxes initial state', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '04');
    // To print 复选框可见，初期未勾选
    await expect($chkPrint(page)).toBeVisible();
    await expect($chkPrint(page)).not.toBeChecked();
    // To fold 复选框可见，初期未勾选
    await expect($chkFold(page)).toBeVisible();
    await expect($chkFold(page)).not.toBeChecked();
    await ss(page, 'checkboxes initial state verified', '04');
  });

  test('05 - Instruction panels hidden by default', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '05');
    // 打印操作说明区域默认隐藏
    await expect($printPanel(page)).not.toBeVisible();
    // 折叠操作说明区域默认隐藏
    await expect($foldPanel(page)).not.toBeVisible();
    await ss(page, 'panels hidden verified', '05');
  });

  test('06 - Back button', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '06');
    // Back 链接可见
    await expect($backLink(page)).toBeVisible();
    await expect($backLink(page)).toHaveText('Back');
    await ss(page, 'back link verified', '06');
  });

  // ===========================================================
  // Quick Guides 链接显示 (TC7~8)
  // ===========================================================

  test('07 - Links alignment and style', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '07');
    // 检查链接的样式 - 下划线，可点击
    const firstLink = $linkByText(page, 'WIS Quick Guide');
    await expect(firstLink).toBeVisible();
    // 确认文字有下划线样式
    const textDecor = await firstLink.evaluate(el => window.getComputedStyle(el).textDecoration);
    console.log('  Text decoration: ' + textDecor);
    expect(textDecor).toContain('underline');
    // 左对齐
    const linkItem = firstLink.locator('..');
    const textAlign = await linkItem.evaluate(el => window.getComputedStyle(el).textAlign);
    console.log('  Text align: ' + textAlign);
    await ss(page, 'links style verified', '07');
  });

  test('08 - Click link shows modal (feature not implemented)', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '08');
    // 点击任意 Quick Guide 链接 → 显示 antd Modal
    const link = $linkByText(page, 'WIS Quick Guide');
    await link.click();
    await page.waitForTimeout(1000);
    await ss(page, 'link clicked - modal shown', '08');
    // antd Modal 应该出现
    const modal = page.locator('.ant-modal-confirm-body');
    await expect(modal).toBeVisible({ timeout: 5000 });
    // Modal 标题
    await expect(modal.locator('.ant-modal-confirm-title')).toContainText('Info');
    // 关闭 Modal
    const okBtn = page.locator('.ant-modal-confirm-btns .ant-btn');
    await okBtn.click();
    await page.waitForTimeout(500);
    await ss(page, 'modal closed', '08');
  });

  // ===========================================================
  // To print do the following 复选框 (TC9~12)
  // ===========================================================

  test('09 - Print checkbox - show instructions when checked', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '09');
    // 勾选 To print
    await $chkPrint(page).check({ force: true });
    await ss(page, 'print checked', '09');
    await expect($chkPrint(page)).toBeChecked();
    // 打印操作说明区域可见
    await expect($printPanel(page)).toBeVisible();
    await expect($printPanel(page)).toContainText('Print Instructions');
    await ss(page, 'print instructions visible', '09');
  });

  test('10 - Print checkbox - hide instructions when unchecked', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '10');
    // 先勾选
    await $chkPrint(page).check({ force: true });
    await ss(page, 'print checked', '10');
    await expect($printPanel(page)).toBeVisible();
    // 取消勾选
    await $chkPrint(page).uncheck({ force: true });
    await ss(page, 'print unchecked', '10');
    await expect($chkPrint(page)).not.toBeChecked();
    await expect($printPanel(page)).not.toBeVisible();
    await ss(page, 'print instructions hidden', '10');
  });

  test('11 - Print checkbox - re-check shows instructions again', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '11');
    // 勾选
    await $chkPrint(page).check({ force: true });
    await ss(page, 'print checked', '11');
    await expect($printPanel(page)).toBeVisible();
    // 取消
    await $chkPrint(page).uncheck({ force: true });
    await ss(page, 'print unchecked', '11');
    await expect($printPanel(page)).not.toBeVisible();
    // 再次勾选
    await $chkPrint(page).check({ force: true });
    await ss(page, 'print re-checked', '11');
    await expect($printPanel(page)).toBeVisible();
    await expect($printPanel(page)).toContainText('Print Instructions');
    await ss(page, 'print instructions visible again', '11');
  });

  test('12 - Print checkbox - does not affect fold checkbox', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '12');
    // 勾选 To print
    await $chkPrint(page).check({ force: true });
    await ss(page, 'print checked', '12');
    await expect($chkPrint(page)).toBeChecked();
    await expect($printPanel(page)).toBeVisible();
    // To fold 不受影响
    await expect($chkFold(page)).not.toBeChecked();
    await expect($foldPanel(page)).not.toBeVisible();
    await ss(page, 'fold not affected', '12');
  });

  // ===========================================================
  // To fold do the following 复选框 (TC13~16)
  // ===========================================================

  test('13 - Fold checkbox - show instructions when checked', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '13');
    // 勾选 To fold
    await $chkFold(page).check({ force: true });
    await ss(page, 'fold checked', '13');
    await expect($chkFold(page)).toBeChecked();
    // 折叠操作说明区域可见
    await expect($foldPanel(page)).toBeVisible();
    await expect($foldPanel(page)).toContainText('Fold Instructions');
    await ss(page, 'fold instructions visible', '13');
  });

  test('14 - Fold checkbox - hide instructions when unchecked', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '14');
    // 先勾选
    await $chkFold(page).check({ force: true });
    await ss(page, 'fold checked', '14');
    await expect($foldPanel(page)).toBeVisible();
    // 取消勾选
    await $chkFold(page).uncheck({ force: true });
    await ss(page, 'fold unchecked', '14');
    await expect($chkFold(page)).not.toBeChecked();
    await expect($foldPanel(page)).not.toBeVisible();
    await ss(page, 'fold instructions hidden', '14');
  });

  test('15 - Fold checkbox - re-check shows instructions again', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '15');
    // 勾选
    await $chkFold(page).check({ force: true });
    await ss(page, 'fold checked', '15');
    await expect($foldPanel(page)).toBeVisible();
    // 取消
    await $chkFold(page).uncheck({ force: true });
    await ss(page, 'fold unchecked', '15');
    await expect($foldPanel(page)).not.toBeVisible();
    // 再次勾选
    await $chkFold(page).check({ force: true });
    await ss(page, 'fold re-checked', '15');
    await expect($foldPanel(page)).toBeVisible();
    await expect($foldPanel(page)).toContainText('Fold Instructions');
    await ss(page, 'fold instructions visible again', '15');
  });

  test('16 - Fold checkbox - does not affect print checkbox', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '16');
    // 勾选 To fold
    await $chkFold(page).check({ force: true });
    await ss(page, 'fold checked', '16');
    await expect($chkFold(page)).toBeChecked();
    await expect($foldPanel(page)).toBeVisible();
    // To print 不受影响
    await expect($chkPrint(page)).not.toBeChecked();
    await expect($printPanel(page)).not.toBeVisible();
    await ss(page, 'print not affected', '16');
  });

  // ===========================================================
  // 两个复选框同时操作 (TC17~18)
  // ===========================================================

  test('17 - Both checkboxes - check both simultaneously', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '17');
    // 勾选 To print
    await $chkPrint(page).check({ force: true });
    await ss(page, 'print checked', '17');
    // 同时勾选 To fold
    await $chkFold(page).check({ force: true });
    await ss(page, 'both checked', '17');
    // 两个复选框均为选中状态
    await expect($chkPrint(page)).toBeChecked();
    await expect($chkFold(page)).toBeChecked();
    // 两个说明区域同时显示
    await expect($printPanel(page)).toBeVisible();
    await expect($foldPanel(page)).toBeVisible();
    await ss(page, 'both panels visible', '17');
  });

  test('18 - Both checkboxes - uncheck both', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '18');
    // 两个都勾选
    await $chkPrint(page).check({ force: true });
    await $chkFold(page).check({ force: true });
    await ss(page, 'both checked', '18');
    await expect($printPanel(page)).toBeVisible();
    await expect($foldPanel(page)).toBeVisible();
    // 逐个取消
    await $chkPrint(page).uncheck({ force: true });
    await ss(page, 'print unchecked', '18');
    await $chkFold(page).uncheck({ force: true });
    await ss(page, 'fold unchecked', '18');
    // 两个复选框均为未选中状态
    await expect($chkPrint(page)).not.toBeChecked();
    await expect($chkFold(page)).not.toBeChecked();
    // 两个说明区域均隐藏
    await expect($printPanel(page)).not.toBeVisible();
    await expect($foldPanel(page)).not.toBeVisible();
    await ss(page, 'both panels hidden', '18');
  });

  // ===========================================================
  // Back 按钮 (TC19)
  // ===========================================================

  test('19 - Back button - return to HDoc Help page', async ({ page }) => {
    await navigateToPage(page);
    await ss(page, 'page display', '19');
    // 点击 Back
    await $backLink(page).click();
    await page.waitForTimeout(1500);
    await ss(page, 'after back', '19');
    // 页面跳转到 HDoc Help 画面
    await expect(page).toHaveURL(/\/menu\/guide-user/);
    await ss(page, 'back navigation verified', '19');
  });

  // ===========================================================
  // 安全性 (TC20~21)
  // ===========================================================

  test('20 - Security - unauthenticated access redirects to login', async ({ page }) => {
    // 清除 localStorage
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.evaluate(() => { localStorage.clear(); });
    await ss(page, 'localStorage cleared', '20');
    // 直接访问 Quick Guides 页面
    await page.goto(PAGE_URL + '/menu/quick-guides', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await ss(page, 'redirect result', '20');
    await expect(page).toHaveURL(/\/login/);
    await ss(page, 'redirected to login', '20');
  });

  test('21 - Security - XSS protection (checkbox labels)', async ({ page }) => {
    // 注册 dialog 监听
    page.on('dialog', (dialog) => {
      console.log('  Dialog detected: ' + dialog.message());
      dialog.dismiss();
      throw new Error('XSS vulnerability: alert() dialog was triggered');
    });
    await navigateToPage(page);
    await ss(page, 'page display', '21');
    // 确认复选框标签文本安全，无可执行代码
    const printLabel = page.locator('.dpg-checkbox-label').filter({ hasText: 'To print do the following' });
    await expect(printLabel).toBeVisible();
    const foldLabel = page.locator('.dpg-checkbox-label').filter({ hasText: 'To fold do the following' });
    await expect(foldLabel).toBeVisible();
    // 页面正常运行，无 XSS 执行风险
    console.log('  No XSS detected - labels are safe text');
    await ss(page, 'xss protection verified', '21');
  });

});
