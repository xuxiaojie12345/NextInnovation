/**
 * HDoc User Doc Administration 模块 (UD18) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/HDocUserDocAdministration/HDocUserDocAdministration_単体テスト仕様書.md
 * 对应前端：react-ud/src/HDocUserDocAdministration/HDocUserDocAdministration.tsx
 * 对应后端：UserAdminController / UserAdminServiceImpl / HdocUserDocMapper / DocumentController
 *          （UD18SelectHdocFunctionAuth / UD18SelectHdocUserDoc / UD18DeleteHdocUserDoc /
 *            UD18CreateHdocUserDoc / UD20SelectHdocDocumentList）
 * 对应测试数据：tests/hDocUserDocAdministration/HDocUserDocAdministration_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实后端模式）
 * 1. 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
 * 2. 后端 UD18 修复完成（HdocUserDocMapper.insertBatch 补审计列+修属性名；UserDoc 返回 userName
 *    且校验用户存在；Create 校验用户存在且返回仕様书消息）。
 * 3. 已执行 node tests/hDocUserDocAdministration/seed.js
 * 4. 登录用户 menuall（拥有 hdoc_user_admin）
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "HDoc User Doc Admin" → 右侧 iframe 加载（/hdoc-user-doc-administration）
 * - 所有 UD18 元素（hud-*）通过 iframe frameLocator('.menu-iframe') 定位
 *
 * 【测试文档/用户】
 * - 文档复选框来自 GET /api/UD20SelectHdocDocumentList（HDOC_DOCUMENT_LIST，含 UD_TEST/UD_SPEC）
 * - ud18doc    : 预置文档权限（UD_TEST, UD_SPEC）
 * - menuall    : 无文档权限
 * - user123    : Update 测试用（seed 重置为空）
 *
 * 【差异说明】
 * - 文档列表实际为 HDOC_DOCUMENT_LIST 内容（UD_TEST/UD_SPEC 由 seed 提供），断言按实际。
 * - Update 成功消息为后端返回 "User document permissions updated successfully."（仕様书 No.16）。
 * - 用户不存在消息为 "We didn't recognize the userid you entered. Please try again."。
 * - 异常注入类用例（No.7/8 文档列表失败、No.26-29 网络/500/删除插入失败）默认 skip。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\hDocUserDocAdministration\image
 * - 命名：HDocUserDocAdministration01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端：node tests/hDocUserDocAdministration/run_hudd.js
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';
const LOGIN = 'menuall';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 HDocUserDocAdministrationNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^HDocUserDocAdministration(\d+)\.jpeg$/;
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
  const filename = `HDocUserDocAdministration${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'hud-shot-info';
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#003366;color:#fff;padding:8px 12px;font:12px/1.5 sans-serif;white-space:pre-wrap;box-shadow:0 2px 6px rgba(0,0,0,.3);';
      d.textContent = `[操作步骤] ${inf.step}\n[设定值] ${inf.value}\n[实际结果] ${inf.actual}`;
      document.body.prepend(d);
    }, info);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));
  }
  try {
    await page.screenshot({ path: path.join(IMAGE_DIR, filename), type: 'jpeg', quality: 80, timeout: 8000, fullPage: true });
  } catch { /* 截图失败不致命 */ }
  if (info) {
    await page.evaluate(() => { document.getElementById('hud-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD18 在 Menu 右侧 iframe）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function hudMessage(page: Page) {
  return frame(page).locator('.hud-message');
}
function hudInput(page: Page) {
  return frame(page).locator('.hud-input');
}
function hudUser(page: Page) {
  return frame(page).locator('.hud-user-value');
}
function hudInfoBtn(page: Page) {
  return frame(page).locator('.hud-btn-info');
}
function hudUpdateBtn(page: Page) {
  return frame(page).locator('.hud-btn-update');
}
function docCheckbox(page: Page, doctype: string) {
  return frame(page).locator('.hud-doc-row', { hasText: doctype }).locator('input[type="checkbox"]').first();
}
async function isDocChecked(page: Page, doctype: string): Promise<boolean> {
  return docCheckbox(page, doctype).isChecked().catch(() => false);
}
async function toggleDoc(page: Page, doctype: string) {
  await frame(page).getByText(doctype, { exact: true }).first().click();
  await page.waitForTimeout(250);
}

async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(800);
  if (await page.getByPlaceholder('User ID').count()) {
    await page.getByPlaceholder('User ID').fill(LOGIN);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
  }
  await page.waitForURL('**/menu');
  await page.waitForTimeout(1500);
}

// 进入 UD18：Menu -> HDoc User Doc Admin（iframe 加载）
async function gotoHudd(page: Page) {
  await login(page);
  const menuBtn = page.getByRole('button', { name: 'HDoc User Doc Admin' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(frame(page).locator('.hud-header-title')).toHaveText('HDoc - User Doc Administration', { timeout: 15000 });
}

async function userInfo(page: Page, uid: string) {
  await hudInput(page).fill(uid);
  await hudInfoBtn(page).click();
  await page.waitForTimeout(1000);
}

// ============================================================================
// Test 1：画面初期表示（No.1,2,3,4）
// ============================================================================
test.describe('画面初期表示 (UD18)', () => {
  test('No.1/2/3/4 输入控件/按钮/User标签/消息区', async ({ page }) => {
    await gotoHudd(page);
    // No.1 UserID：活性、空、maxLength=10
    await expect(hudInput(page)).toBeEnabled();
    await expect(hudInput(page)).toHaveValue('');
    expect(await hudInput(page).getAttribute('maxlength')).toBe('10');
    // No.2 两按钮活性
    await expect(hudInfoBtn(page)).toBeEnabled();
    await expect(hudUpdateBtn(page)).toBeEnabled();
    // No.3 User 标签占位
    await expect(hudUser(page)).toHaveText(/---/);
    // No.4 消息区隐藏
    await expect(hudMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.1/2/3/4 画面初期表示', {
      step: '访问 HDoc User Doc Administration 画面',
      value: '无（未查询）',
      actual: 'UserID(max10) 活性且空；User Info/Update 活性；User 标签 "---"；消息区隐藏',
    });
  });
});

// ============================================================================
// Test 2：文档列表加载（No.5,6）
// ============================================================================
test.describe('文档列表加载 (UD18)', () => {
  test('No.5/6 文档复选框动态加载（UD_TEST/UD_SPEC）未勾选', async ({ page }) => {
    await gotoHudd(page);
    // 文档复选框中出现 UD_TEST / UD_SPEC
    await expect(frame(page).locator('.hud-doc-row', { hasText: 'UD_TEST' })).toBeVisible({ timeout: 8000 });
    await expect(frame(page).locator('.hud-doc-row', { hasText: 'UD_SPEC' })).toBeVisible();
    // 初始未勾选
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(false);
    await shot(page, '断言: No.5/6 文档列表加载', {
      step: '访问画面并查看文档复选框',
      value: '无',
      actual: '显示 UD_TEST / UD_SPEC 等文档复选框，初始均未勾选',
    });
  });
});

// ============================================================================
// Test 3：User Info 功能（No.9,10,11,12,13,14）
// ============================================================================
test.describe('User Info (UD18)', () => {
  test('No.9 空 UserID 校验', async ({ page }) => {
    await gotoHudd(page);
    await hudInfoBtn(page).click();
    await page.waitForTimeout(300);
    await expect(hudMessage(page)).toHaveText('UserID is required.');
    await expect(hudMessage(page)).toHaveClass(/hud-message-error/);
    await shot(page, '断言: No.9 空UserID', {
      step: 'UserID 不输入，点击 User Info',
      value: 'UserID: ""',
      actual: '显示红色错误 "UserID is required."',
    });
  });

  test('No.10/11 查询有权限用户回显（ud18doc -> UD_TEST/UD_SPEC）', async ({ page }) => {
    await gotoHudd(page);
    await userInfo(page, 'ud18doc');
    await expect(hudUser(page)).toHaveText('Doc User');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(true);
    await shot(page, '断言: No.10/11 权限回显', {
      step: '输入 ud18doc 并点击 User Info',
      value: 'UserID: "ud18doc"（有 UD_TEST/UD_SPEC）',
      actual: 'User 显示 "Doc User"；UD_TEST/UD_SPEC 复选框勾选',
    });
  });

  test('No.12 无权限用户全不勾选', async ({ page }) => {
    await gotoHudd(page);
    await userInfo(page, 'menuall');
    await expect(hudUser(page)).toHaveText('Menu All');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(false);
    await shot(page, '断言: No.12 无权限回显', {
      step: '输入 menuall（无文档权限）并点击 User Info',
      value: 'UserID: "menuall"',
      actual: 'User 显示 "Menu All"；所有文档复选框未勾选',
    });
  });

  test('No.13 用户不存在', async ({ page }) => {
    await gotoHudd(page);
    await userInfo(page, 'unknown');
    await expect(hudMessage(page)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    await shot(page, '断言: No.13 用户不存在', {
      step: '输入不存在的 unknown 并点击 User Info',
      value: 'UserID: "unknown"',
      actual: '显示 "We didn\'t recognize the userid you entered. Please try again."；复选框清空',
    });
  });

  test('No.14 UserID 首尾空格去除', async ({ page }) => {
    await gotoHudd(page);
    await hudInput(page).fill('  ud18doc  ');
    await hudInfoBtn(page).click();
    await page.waitForTimeout(1000);
    await expect(hudUser(page)).toHaveText('Doc User');
    await shot(page, '断言: No.14 首尾空格', {
      step: '输入 "  ud18doc  " 并点击 User Info',
      value: 'UserID: "  ud18doc  "',
      actual: '去除首尾空格后查询成功，User 显示 "Doc User"',
    });
  });
});

// ============================================================================
// Test 4：Update 功能（No.15,16,18,21）
// ============================================================================
test.describe('Update (UD18)', () => {
  test('No.15 空 UserID 校验', async ({ page }) => {
    await gotoHudd(page);
    await hudUpdateBtn(page).click();
    await page.waitForTimeout(300);
    await expect(hudMessage(page)).toHaveText('Please enter a UserID and click User Info first.');
    await shot(page, '断言: No.15 Update 空UserID', {
      step: 'UserID 不输入，点击 Update',
      value: 'UserID: ""',
      actual: '显示 "Please enter a UserID and click User Info first."',
    });
  });

  test('No.16 Update 成功（勾选 UD_TEST/UD_SPEC）并持久化', async ({ page }) => {
    await gotoHudd(page);
    await userInfo(page, 'user123');
    await toggleDoc(page, 'UD_TEST');
    await toggleDoc(page, 'UD_SPEC');
    await hudUpdateBtn(page).click();
    await page.waitForTimeout(1200);
    await expect(hudMessage(page)).toHaveText('User document permissions updated successfully.');
    await expect(hudMessage(page)).toHaveClass(/hud-message-success/);
    // 重新查询确认持久化
    await userInfo(page, 'user123');
    await expect(hudUser(page)).toHaveText('John Doe');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(true);
    await shot(page, '断言: No.16 Update 成功+持久化', {
      step: '查询 user123，勾选 UD_TEST/UD_SPEC，点击 Update',
      value: '選択: ["UD_TEST", "UD_SPEC"]',
      actual: '显示 "User document permissions updated successfully."；重新查询后两文档保持勾选',
    });
  });

  test('No.18 Update 全不选（清空权限）', async ({ page }) => {
    await gotoHudd(page);
    // 使用预置有权限的 ud18doc（seed 保证其初始有权 UD_TEST/UD_SPEC）
    await userInfo(page, 'ud18doc');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(true);
    // 全取消后 Update
    await toggleDoc(page, 'UD_TEST');
    await toggleDoc(page, 'UD_SPEC');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(false);
    await hudUpdateBtn(page).click();
    await page.waitForTimeout(1200);
    await expect(hudMessage(page)).toHaveText('User document permissions updated successfully.');
    // 重新查询确认已清空
    await userInfo(page, 'ud18doc');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(false);
    await shot(page, '断言: No.18 全不选清空', {
      step: 'ud18doc（预置有权）全取消后 Update',
      value: '選択: []',
      actual: 'Update 成功；重新查询后文档权限已清空',
    });
  });

  test('No.21 Update 用户不存在', async ({ page }) => {
    await gotoHudd(page);
    await userInfo(page, 'unknown');
    await hudUpdateBtn(page).click();
    await page.waitForTimeout(1200);
    await expect(hudMessage(page)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    await shot(page, '断言: No.21 Update 用户不存在', {
      step: '输入不存在的 unknown，点击 Update',
      value: 'UserID: "unknown"',
      actual: '显示 "We didn\'t recognize the userid you entered. Please try again."',
    });
  });
});

// ============================================================================
// Test 5：复选框交互（No.23,24,25）
// ============================================================================
test.describe('复选框交互 (UD18)', () => {
  test('No.23/24 勾选与取消勾选', async ({ page }) => {
    await gotoHudd(page);
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    // No.23 勾选
    await toggleDoc(page, 'UD_TEST');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    // No.24 取消
    await toggleDoc(page, 'UD_TEST');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    await shot(page, '断言: No.23/24 勾选/取消', {
      step: '点击 UD_TEST 复选框一次（勾选）再点击一次（取消）',
      value: 'UD_TEST toggle',
      actual: '勾选后状态为 true，再次点击后为 false',
    });
  });

  test('No.25 多选保持', async ({ page }) => {
    await gotoHudd(page);
    await toggleDoc(page, 'UD_TEST');
    await toggleDoc(page, 'UD_SPEC');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    expect(await isDocChecked(page, 'UD_SPEC')).toBe(true);
    await shot(page, '断言: No.25 多选保持', {
      step: '依次勾选 UD_TEST 与 UD_SPEC',
      value: '複数選択: UD_TEST, UD_SPEC',
      actual: '两个复选框均保持勾选',
    });
  });
});

// ============================================================================
// Test 6：UI 交互（No.32,33,34,35）
// ============================================================================
test.describe('UI 交互 (UD18)', () => {
  test('No.32/33 错误红 / 成功绿样式', async ({ page }) => {
    await gotoHudd(page);
    // 错误：查无
    await userInfo(page, 'unknown');
    const errColor = await hudMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(errColor).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.32 错误红色', {
      step: '查询不存在用户后检查样式',
      value: 'UserID: "unknown"',
      actual: `错误消息颜色 ${errColor}（红 #ff4d4f）`,
    });
    // 成功：查询有效用户
    await userInfo(page, 'ud18doc');
    const okColor = await hudMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(okColor).toBe('rgb(82, 196, 26)'); // #52c41a
    await shot(page, '断言: No.33 成功绿色', {
      step: '查询有效用户后检查样式',
      value: 'UserID: "ud18doc"',
      actual: `成功消息颜色 ${okColor}（绿 #52c41a）`,
    });
  });

  test('No.34 User Info 后 UserID 保持', async ({ page }) => {
    await gotoHudd(page);
    await userInfo(page, 'ud18doc');
    await expect(hudInput(page)).toHaveValue('ud18doc');
    await shot(page, '断言: No.34 UserInfo后UserID保持', {
      step: '输入 ud18doc 并 User Info',
      value: 'UserID: "ud18doc"',
      actual: 'User Info 后输入框保持 "ud18doc"',
    });
  });

  test('No.35 Update 后复选框保持', async ({ page }) => {
    await gotoHudd(page);
    // 使用 menuall（seed 保证其无文档权限，初始状态确定）
    await userInfo(page, 'menuall');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(false);
    await toggleDoc(page, 'UD_TEST');
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    await hudUpdateBtn(page).click();
    await page.waitForTimeout(1200);
    expect(await isDocChecked(page, 'UD_TEST')).toBe(true);
    await shot(page, '断言: No.35 Update后复选框保持', {
      step: 'menuall 勾选 UD_TEST 并 Update',
      value: '選択: ["UD_TEST"]',
      actual: '更新成功后 UD_TEST 复选框保持勾选',
    });
  });
});
