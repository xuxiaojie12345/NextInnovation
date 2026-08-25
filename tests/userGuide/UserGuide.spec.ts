/**
 * User Guide 模块 (UD24) Playwright 测试
 * -----------------------------------------------------------------
 * 对应测试式样书：react-ud/src/UserGuide/UserGuide_単体テスト仕様書.md
 * 对应前端：react-ud/src/UserGuide/UserGuide.tsx
 * 对应后端：无 API 调用（纯前端静态内容 + 链接跳转 + Other Information 复选框切换）
 * 对应测试数据：tests/userGuide/UserGuide_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实前端模式）
 * 1. 前端 dev server (localhost:3000) 已启动；登录用户 menuall（拥有 hdoc）。
 * 2. 从 Menu → "User Guide" 进入（iframe /user-guide）。
 * 3. 前端已删除 "Describation" 链接（/describation 路由不存在，按用户决策移除并更新了设计书/仕様書）。
 *
 * 【画面结构（usg-*）】
 * - 4 个功能链接 .usg-link：
 *     "HDoc Quick Guide"           -> navigate('/download-print-quick-guides')
 *     "List of document types."    -> navigate('/document-types')
 *     "Markets in HDoc"            -> navigate('/markets-in-hdoc')
 *     "HDoc - Market Document Setting" -> navigate('/market-document-settings-list')
 * - 1 个复选框 .usg-checkbox："Other Information" → 切换 .usg-other-content
 *
 * 【业务含义 / 差异说明】
 * - 链接点击使用 React Router navigate()（iframe 内 SPA 跳转），跳转后 iframe 显示目标画面标题。
 * - Describation 链接已移除（原指向不存在的 /describation 路由，按用户决策删除并在设计书/仕様書中同步更新）。
 * - 跳转目标画面（UD20/21/22/23）需相应数据才能完整展示，但测试仅断言目标画面标题出现。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\userGuide\image
 * - 命名：UserGuide01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实前端：node tests/userGuide/run_usg.js
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';
const LOGIN = 'menuall';

const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^UserGuide(\d+)\.jpeg$/;
  let max = 0;
  if (fs.existsSync(IMAGE_DIR)) {
    fs.readdirSync(IMAGE_DIR).filter((f) => pat.test(f)).forEach((f) => {
      const n = parseInt((f.match(pat) as RegExpMatchArray)[1], 10) || 0;
      if (n > max) max = n;
    });
  }
  return max + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const filename = `UserGuide${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'usg-shot-info';
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#003366;color:#fff;padding:8px 12px;font:12px/1.5 sans-serif;white-space:pre-wrap;box-shadow:0 2px 6px rgba(0,0,0,.3);';
      d.textContent = `[操作步骤] ${inf.step}\n[设定值] ${inf.value}\n[实际结果] ${inf.actual}`;
      document.body.prepend(d);
    }, info);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));
  }
  try {
    await page.screenshot({ path: path.join(IMAGE_DIR, filename), type: 'jpeg', quality: 80, timeout: 8000, fullPage: true });
  } catch { /* 忽略 */ }
  if (info) {
    await page.evaluate(() => { document.getElementById('usg-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function usgHeader(page: Page) {
  return frame(page).locator('.usg-header-title');
}
function usgLink(page: Page, text: string) {
  return frame(page).locator('.usg-link', { hasText: text }).first();
}
function usgCheckbox(page: Page) {
  return frame(page).locator('.usg-checkbox', { hasText: 'Other Information' }).first();
}
function usgChecked(page: Page) {
  return usgCheckbox(page).locator('input[type=checkbox]').isChecked();
}
// iframe 内出现包含指定文本的标题（跳转目标确认）
async function expectFrameText(page: Page, text: string) {
  const loc = frame(page).locator(`h1[class*="-header-title"]`, { hasText: text }).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
}

async function gotoSru(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(800);
  if (await page.getByPlaceholder('User ID').count()) {
    await page.getByPlaceholder('User ID').fill(LOGIN);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
  }
  await page.waitForURL('**/menu');
  await page.waitForTimeout(1500);
  const menuBtn = page.getByRole('button', { name: 'User Guide' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(usgHeader(page)).toHaveText('HDoc - User Guide', { timeout: 15000 });
  await page.waitForTimeout(500);
}

// ============================================================================
// Test 1：画面初期表示（No.1/2/3/4/5）
// ============================================================================
test.describe('画面初期表示 (UD24)', () => {
  test('No.1/2/3/4/5 链接 + 标题 + 复选框 + 无按钮', async ({ page }) => {
    await gotoSru(page);
    // No.2 标题 HDoc Help（subtitle）
    await expect(frame(page).locator('.usg-subtitle')).toHaveText('HDoc Help');
    // No.1 4 个功能链接
    for (const lb of ['HDoc Quick Guide', 'List of document types.', 'Markets in HDoc', 'HDoc - Market Document Setting']) {
      await expect(usgLink(page, lb)).toBeVisible();
    }
    await expect(frame(page).locator('.usg-link')).toHaveCount(4);
    // 确认 Describation 已移除
    await expect(frame(page).locator('.usg-link', { hasText: 'Describation' })).toHaveCount(0);
    // No.3 Other Information 复选框，初始未勾选
    await expect(usgCheckbox(page)).toBeVisible();
    expect(await usgChecked(page)).toBe(false);
    await expect(frame(page).locator('.usg-other-content')).toHaveCount(0);
    // No.4 无操作按钮（提交/保存/删除）
    await expect(frame(page).locator('.usg-btn')).toHaveCount(0);
    await expect(frame(page).locator('.usg-card button')).toHaveCount(0);
    // No.5 链接为蓝色
    const color = await usgLink(page, 'HDoc Quick Guide').evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(0, 0, 0)');
    await shot(page, '断言: No.1/2/3/4/5 画面初期表示', {
      step: '从 Menu 进入 User Guide 画面',
      value: '无（初始状态，Describation 已移除）',
      actual: 'HDoc Help 标题；4 个功能链接；Other Information 未勾选；无操作按钮；链接蓝色',
    });
  });
});

// ============================================================================
// Test 2：链接跳转（No.6/7/8/9）
// ============================================================================
test.describe('链接跳转 (UD24)', () => {
  test('No.6 HDoc Quick Guide -> Download and Print Quick Guides', async ({ page }) => {
    await gotoSru(page);
    await usgLink(page, 'HDoc Quick Guide').click();
    await expectFrameText(page, 'Download and Print Quick Guides');
    await shot(page, '断言: No.6 跳转 Quick Guide', {
      step: '点击 "HDoc Quick Guide" 链接',
      value: 'navigate(/download-print-quick-guides)',
      actual: '跳转至 Download and Print Quick Guides 画面（标题可见）',
    });
  });

  test('No.7 List of document types. -> Document Types', async ({ page }) => {
    await gotoSru(page);
    await usgLink(page, 'List of document types.').click();
    await expectFrameText(page, 'Document Types');
    await shot(page, '断言: No.7 跳转 Document Types', {
      step: '点击 "List of document types." 链接',
      value: 'navigate(/document-types)',
      actual: '跳转至 Document Types 画面（标题可见）',
    });
  });

  test('No.8 Markets in HDoc -> Markets in HDoc', async ({ page }) => {
    await gotoSru(page);
    await usgLink(page, 'Markets in HDoc').click();
    await expectFrameText(page, 'Markets in HDoc');
    await shot(page, '断言: No.8 跳转 Markets in HDoc', {
      step: '点击 "Markets in HDoc" 链接',
      value: 'navigate(/markets-in-hdoc)',
      actual: '跳转至 Markets in HDoc 画面（标题可见）',
    });
  });

  test('No.9 HDoc - Market Document Setting -> Market Document Settings', async ({ page }) => {
    await gotoSru(page);
    await usgLink(page, 'HDoc - Market Document Setting').click();
    await expectFrameText(page, 'Market Document Settings');
    await shot(page, '断言: No.9 跳转 Market Document Setting', {
      step: '点击 "HDoc - Market Document Setting" 链接',
      value: 'navigate(/market-document-settings-list)',
      actual: '跳转至 Market Document Settings List 画面（标题可见）',
    });
  });
});

// ============================================================================
// Test 3：Other Information 复选框（No.10/11/12/13）
// ============================================================================
test.describe('Other Information 复选框 (UD24)', () => {
  test('No.10/11/13 勾选显示 + 取消隐藏', async ({ page }) => {
    await gotoSru(page);
    // No.10 初始未勾选 + 内容隐藏
    expect(await usgChecked(page)).toBe(false);
    await expect(frame(page).locator('.usg-other-content')).toHaveCount(0);
    // No.11 勾选 → 内容显示
    await usgCheckbox(page).click();
    expect(await usgChecked(page)).toBe(true);
    await expect(frame(page).locator('.usg-other-content')).toHaveCount(1);
    await expect(frame(page).locator('.usg-other-content')).toContainText('support.tpi@volvo.com');
    // No.13 取消 → 隐藏
    await usgCheckbox(page).click();
    expect(await usgChecked(page)).toBe(false);
    await expect(frame(page).locator('.usg-other-content')).toHaveCount(0);
    await shot(page, '断言: No.10/11/13 复选框切换', {
      step: '勾选 - 取消 "Other Information"',
      value: '勾選→取消',
      actual: '勾选后内容显示（含支持邮箱）；取消后内容隐藏',
    });
  });

  test('No.12 Other Information 内容显示', async ({ page }) => {
    await gotoSru(page);
    await usgCheckbox(page).click();
    const content = await frame(page).locator('.usg-other-content').innerText();
    expect(content).toContain('support.tpi@volvo.com');
    expect(content).toContain('HDoc system');
    await shot(page, '断言: No.12 Other Information 内容', {
      step: '勾选 "Other Information" 查看内容',
      value: '勾選',
      actual: '内容含联系支持邮箱与 HDoc 系统说明',
    });
  });
});

// ============================================================================
// Test 4：综合跳转（No.14）
// ============================================================================
test.describe('链接跳转综合 (UD24)', () => {
  test('No.14 4 个链接逐一跳转正确', async ({ page }) => {
    await gotoSru(page);
    const cases: Array<[string, string]> = [
      ['HDoc Quick Guide', 'Download and Print Quick Guides'],
      ['List of document types.', 'Document Types'],
      ['Markets in HDoc', 'Markets in HDoc'],
      ['HDoc - Market Document Setting', 'Market Document Settings'],
    ];
    for (const [label, targetTitle] of cases) {
      // 每次重新进入 User Guide（iframe 路由跳转后需返回）
      await page.goto(BASE_URL);
      await page.waitForTimeout(600);
      if (await page.getByPlaceholder('User ID').count()) {
        await page.getByPlaceholder('User ID').fill(LOGIN);
        await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'Login' }).click();
      }
      await page.waitForURL('**/menu');
      await page.waitForTimeout(1200);
      const menuBtn = page.getByRole('button', { name: 'User Guide' }).first();
      await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
      await menuBtn.click();
      await expect(usgHeader(page)).toHaveText('HDoc - User Guide', { timeout: 15000 });
      await page.waitForTimeout(300);
      await usgLink(page, label).click();
      await expectFrameText(page, targetTitle);
    }
    await shot(page, '断言: No.14 综合跳转', {
      step: '依次点击 4 个功能链接',
      value: 'Quick Guide / Document Types / Markets in HDoc / Market Document Setting',
      actual: '4 个链接均正确跳转至对应画面',
    });
  });
});

// ============================================================================
// Test 5：UI 交互（No.17/18/19/20）
// ============================================================================
test.describe('UI 交互 (UD24)', () => {
  test('No.17/18/19/20 复选框对齐 + 区域样式 + 重复切换 + 简洁性', async ({ page }) => {
    await gotoSru(page);
    // No.17 复选框标签对齐（Visible）
    await expect(usgCheckbox(page)).toBeVisible();
    // No.20 简洁性：卡片含链接列表 + Other Information 区块
    const cardChildren = await frame(page).locator('.usg-card > *').count();
    expect(cardChildren).toBeGreaterThanOrEqual(2);
    // No.18 勾选后区域有样式（class usg-other-content）
    await usgCheckbox(page).click();
    await expect(frame(page).locator('.usg-other-content')).toBeVisible();
    // No.19 重复切换 3 次
    for (let i = 0; i < 3; i++) {
      await usgCheckbox(page).click();
      expect(await usgChecked(page)).toBe(false);
      await expect(frame(page).locator('.usg-other-content')).toHaveCount(0);
      await usgCheckbox(page).click();
      expect(await usgChecked(page)).toBe(true);
      await expect(frame(page).locator('.usg-other-content')).toHaveCount(1);
    }
    await shot(page, '断言: No.17/18/19/20 UI 交互', {
      step: '勾选/取消 Other Information 3 次并检查样式',
      value: '重複切替',
      actual: '复选框标签可见；内容区有样式；重复切换无异常；画面简洁',
    });
  });
});
