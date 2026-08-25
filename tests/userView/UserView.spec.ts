/**
 * User View 模块 (UD25) Playwright 测试
 * -----------------------------------------------------------------
 * 对应测试式样书：react-ud/src/UserView/UserView_単体テスト仕様書.md
 * 对应前端：react-ud/src/UserView/UserView.tsx（主页面路由 /edb-user-view）
 * 对应后端：AuthenticationServiceImpl（POST /api/authentication）
 *          - needPassword=true（默认，Login 使用）：要求 userId+password
 *          - needPassword=false（UserView 使用）：仅按 userId 查询用户信息
 * 对应测试数据：tests/userView/UserView_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实前端+真实后端模式）
 * 1. 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
 * 2. 后端已实现 needPassword 标志（本次会话已按用户要求修复，重新编译并重启）。
 * 3. 已执行 node tests/userView/seed.js（user123 与仕様書预期值对齐）。
 * 4. UserView 为主页面路由（非 iframe），直接访问 /edb-user-view?userId=xxx。
 *
 * 【画面结构（uev-*，主页面元素，非 iframe）】
 * - 标题 .uev-header-title = "HDoc - EDB User View"
 * - 消息区 .uev-message / .uev-message-error / .uev-message-success
 * - 加载中 .uev-loading = "Loading user information..."
 * - 用户明细 .uev-details > .uev-info-row（.uev-label + .uev-value）
 * - 邮箱链接 .uev-email-link（href=mailto:...）
 * - 无数据 .uev-no-data = "No user information available."
 * - 按钮 .uev-btn-clear / .uev-btn-back（.uev-buttons 居中，位于卡片底部）
 *
 * 【业务含义 / 差异说明】
 * - 本画面按 userId 从 Saviynt（后端 hdoc_user_infor）获取用户信息并展示。
 * - 后端 /api/authentication 原为 Login（userId+password）专用；UserView 只传 userId，
 *   导致合约不一致（永远 400）。本次按用户决策为后端增加 needPassword 标志：
 *   UserView 传 needPassword=false → 仅按 userId 查询（selectByUserId），返回 {status,data:{...}}。
 * - 仕様書 No.8 预期 user123 显示 Responsible=John Doe / User Position=Manager，
 *   与 DB 原值(John/User)不一致，由 seed 将 user123 对齐为仕様書预期值。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\userView\image
 * - 命名：UserView01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实前端：node tests/userView/run_uvw.js
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const API_URL = '**/api/authentication';

const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^UserView(\d+)\.jpeg$/;
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
  const filename = `UserView${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'uvw-shot-info';
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
    await page.evaluate(() => { document.getElementById('uvw-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// 进入 UserView 主页面；无 userId 时传 null
async function gotoUvw(page: Page, userId: string | null) {
  const url = userId ? `${BASE_URL}/edb-user-view?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/edb-user-view`;
  await page.goto(url, { timeout: 60000 });
  await expect(page.locator('.uev-header-title')).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(600);
}

// 读取某 label 的值
async function uevValue(page: Page, label: string): Promise<string> {
  const row = page.locator('.uev-info-row', { has: page.locator('.uev-label', { hasText: label }) }).first();
  await row.waitFor({ state: 'visible', timeout: 10000 });
  return (await row.locator('.uev-value').innerText()).trim();
}

// 校验某 label 值等于期望
async function expectUev(page: Page, label: string, expected: string) {
  await expect(page.locator('.uev-info-row', { has: page.locator('.uev-label', { hasText: label }) }).first().locator('.uev-value')).toHaveText(expected, { timeout: 10000 });
}

// ============================================================================
// Test 1：画面表示（No.1/2/3/4/5）
// ============================================================================
test.describe('画面表示 (UD25)', () => {
  test('No.1/2/3/4/5 标题 + 标签 + 按钮 + 无输入控件 + 错误区隐藏', async ({ page }) => {
    await gotoUvw(page, 'user123');
    // No.1 标题
    await expect(page.locator('.uev-header-title')).toHaveText('HDoc - EDB User View');
    // No.2 4 个用户信息标签（数据加载后显示）
    for (const lb of ['Userid:', 'Responsible:', 'User Position:', 'E-mail:']) {
      await expect(page.locator('.uev-label', { hasText: lb }).first()).toBeVisible();
    }
    // No.3 Clear / Back 按钮存在（数据加载后 Clear 活性）
    await expect(page.locator('.uev-btn-clear')).toBeVisible();
    await expect(page.locator('.uev-btn-back')).toBeVisible();
    expect(await page.locator('.uev-btn-clear').isEnabled()).toBe(true);
    expect(await page.locator('.uev-btn-back').isEnabled()).toBe(true);
    // No.4 无输入控件（input/select/textarea）
    expect(await page.locator('.uev-card input').count()).toBe(0);
    expect(await page.locator('.uev-card textarea').count()).toBe(0);
    expect(await page.locator('.uev-card select').count()).toBe(0);
    // No.5 错误消息区隐藏
    expect(await page.locator('.uev-message').count()).toBe(0);
    await shot(page, '断言: No.1/2/3/4/5 画面初期表示', {
      step: '访问 /edb-user-view?userId=user123',
      value: 'userId=user123',
      actual: '标题 HDoc - EDB User View；Userid/Responsible/User Position/E-mail 标签；Clear/Back 按钮活性；无输入控件；无错误消息',
    });
  });
});

// ============================================================================
// Test 2：UserID 参数校验（No.6/7）
// ============================================================================
test.describe('UserID 参数校验 (UD25)', () => {
  test('No.6 UserID 缺失 -> 不调用 API + 错误消息', async ({ page }) => {
    let calls = 0;
    await page.route(API_URL, (route) => { calls += 1; return route.continue(); });
    await gotoUvw(page, null);
    await expect(page.locator('.uev-message-error')).toHaveText('UserID parameter is missing.', { timeout: 10000 });
    // 用户信息字段为空（无 .uev-info-row）
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await page.waitForTimeout(800);
    expect(calls).toBe(0); // 未调用 API
    await shot(page, '断言: No.6 UserID 缺失', {
      step: '访问 /edb-user-view（无 userId 参数）',
      value: 'userId: 無し',
      actual: '显示 "UserID parameter is missing."；未调用 API；字段为空',
    });
  });

  test('No.7 UserID 存在 -> 调用 API 加载用户信息', async ({ page }) => {
    await gotoUvw(page, 'user123');
    await expect(page.locator('.uev-details')).toBeVisible({ timeout: 10000 });
    await shot(page, '断言: No.7 UserID 存在', {
      step: '访问 /edb-user-view?userId=user123',
      value: 'userId: user123',
      actual: '调用 API 获取用户信息并正常显示',
    });
  });
});

// ============================================================================
// Test 3：用户信息获取（No.8/9/10/11/12/13）
// ============================================================================
test.describe('用户信息获取 (UD25)', () => {
  test('No.8 获取成功：4 个字段显示正确', async ({ page }) => {
    await gotoUvw(page, 'user123');
    await expectUev(page, 'Userid:', 'user123');
    await expectUev(page, 'Responsible:', 'John Doe');
    await expectUev(page, 'User Position:', 'Manager');
    await expectUev(page, 'E-mail:', 'john.doe@example.com');
    await shot(page, '断言: No.8 用户信息获取成功', {
      step: '等待 API 响应',
      value: "userId=user123（Responsible=John Doe / UserPosition=Manager）",
      actual: 'Userid=user123；Responsible=John Doe；User Position=Manager；E-mail=john.doe@example.com',
    });
  });

  test('No.9/10/11/12 标签靠左对齐', async ({ page }) => {
    await gotoUvw(page, 'user123');
    for (const [lb, val] of [['Userid:', 'user123'], ['Responsible:', 'John Doe'], ['User Position:', 'Manager'], ['E-mail:', 'john.doe@example.com']] as Array<[string, string]>) {
      expect(await uevValue(page, lb)).toBe(val);
      const align = await page.locator('.uev-label', { hasText: lb }).first().evaluate((el) => getComputedStyle(el).textAlign);
      expect(['left', 'start']).toContain(align || 'left');
    }
    await shot(page, '断言: No.9/10/11/12 标签靠左', {
      step: '查看各标签值',
      value: 'user123 返回的标准用户信息',
      actual: '4 个标签值正确且文字靠左对齐',
    });
  });

  test('No.13 E-mail 以 mailto 链接显示', async ({ page }) => {
    await gotoUvw(page, 'user123');
    const href = await page.locator('.uev-email-link').getAttribute('href');
    expect(href).toBe('mailto:john.doe@example.com');
    await shot(page, '断言: No.13 E-mail mailto 链接', {
      step: '悬停/查看 E-mail',
      value: 'email=john.doe@example.com',
      actual: 'E-mail 以 mailto 链接显示（href=mailto:john.doe@example.com）',
    });
  });

  test('No.14 用户不存在 -> 404 错误消息 + 字段为空', async ({ page }) => {
    await gotoUvw(page, 'unknown');
    await expect(page.locator('.uev-message-error')).toHaveText('User not found. Please try again.', { timeout: 10000 });
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await shot(page, '断言: No.14 用户不存在', {
      step: '访问 /edb-user-view?userId=unknown',
      value: 'userId: unknown',
      actual: 'API 返回 404；显示 "User not found. Please try again."；字段为空',
    });
  });

  test('No.15 无数据时显示 "No user information available."', async ({ page }) => {
    await gotoUvw(page, 'user123');
    // 先清除信息，制造无数据状态（无错误消息）
    await page.locator('.uev-btn-clear').click();
    await expect(page.locator('.uev-no-data')).toHaveText('No user information available.', { timeout: 10000 });
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await shot(page, '断言: No.15 无数据时显示', {
      step: '加载成功后再点 Clear',
      value: 'userInfo: null（无用户信息）',
      actual: '显示 "No user information available."；标签区域为空白',
    });
  });
});

// ============================================================================
// Test 4：Clear 功能（No.16/17/18）
// ============================================================================
test.describe('Clear 功能 (UD25)', () => {
  test('No.16 Clear 清除用户信息', async ({ page }) => {
    await gotoUvw(page, 'user123');
    await expect(page.locator('.uev-details')).toBeVisible();
    await page.locator('.uev-btn-clear').click();
    await expect(page.locator('.uev-no-data')).toHaveText('No user information available.', { timeout: 10000 });
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await shot(page, '断言: No.16 Clear 清除用户信息', {
      step: '信息正常显示后点 Clear',
      value: '取得済みの情報',
      actual: 'Userid/Responsible/User Position/E-mail 标签被清空；显示 "No user information available."',
    });
  });

  test('No.17 Clear 清除错误消息', async ({ page }) => {
    await gotoUvw(page, 'unknown');
    await expect(page.locator('.uev-message-error')).toBeVisible();
    await page.locator('.uev-btn-clear').click();
    await page.waitForTimeout(300);
    expect(await page.locator('.uev-message').count()).toBe(0);
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await shot(page, '断言: No.17 Clear 清除错误消息', {
      step: '显示错误消息后点 Clear',
      value: 'エラーメッセージ表示後',
      actual: '错误消息被清除；字段保持为空',
    });
  });

  test('No.18 无信息时点 Clear 无变化', async ({ page }) => {
    await gotoUvw(page, 'unknown'); // 无用户信息
    await expect(page.locator('.uev-message-error')).toBeVisible();
    // Clear 按钮在无用户信息时禁用（disabled={isLoading || !userInfo}）
    expect(await page.locator('.uev-btn-clear').isEnabled()).toBe(false);
    await shot(page, '断言: No.18 无信息时 Clear 无变化', {
      step: '无用户信息时尝试点 Clear',
      value: '情報なし',
      actual: 'Clear 按钮禁用；点击无效果、无异常',
    });
  });
});

// ============================================================================
// Test 5：Back 功能（No.19）
// ============================================================================
test.describe('Back 功能 (UD25)', () => {
  test('No.19 Back 返回前一画面', async ({ page }) => {
    // 先访问首页建立历史，再进入 UserView
    await page.goto(BASE_URL, { timeout: 60000 });
    await page.waitForTimeout(800);
    await gotoUvw(page, 'user123');
    await page.locator('.uev-btn-back').click();
    await page.waitForTimeout(1000);
    // Back = navigate(-1) → 返回前一画面（BASE_URL）
    expect(page.url().startsWith(BASE_URL)).toBe(true);
    expect(page.url().includes('/edb-user-view')).toBe(false);
    await page.goto(`${BASE_URL}/edb-user-view?userId=user123`, { timeout: 60000 });
    await expect(page.locator('.uev-header-title')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(400);
    await shot(page, '断言: No.19 Back 返回前一画面', {
      step: '进入 UserView 后点 Back',
      value: '無',
      actual: '画面返回前一画面（window.history.back()）',
    });
  });
});

// ============================================================================
// Test 6：异常处理（No.20/21）
// ============================================================================
test.describe('异常处理 (UD25)', () => {
  test('No.20 网络请求失败', async ({ page }) => {
    await page.route(API_URL, (route) => route.abort());
    await gotoUvw(page, 'user123');
    await expect(page.locator('.uev-message-error')).toHaveText('Network connection failed. Please try again later.', { timeout: 10000 });
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await shot(page, '断言: No.20 网络请求失败', {
      step: '模拟网络断开（abort API）',
      value: '無（网络不可达）',
      actual: '显示 "Network connection failed. Please try again later."；字段为空',
    });
  });

  test('No.21 服务器 500 错误', async ({ page }) => {
    await page.route(API_URL, (route) => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'error', code: 500, data: null, message: 'System busy. Please try again later.' }),
    }));
    await gotoUvw(page, 'user123');
    await expect(page.locator('.uev-message-error')).toHaveText('System busy. Please try again later.', { timeout: 10000 });
    expect(await page.locator('.uev-info-row').count()).toBe(0);
    await shot(page, '断言: No.21 服务器 500 错误', {
      step: '模拟后端返回 500',
      value: 'response: 500',
      actual: '显示 "System busy. Please try again later."；字段为空',
    });
  });
});

// ============================================================================
// Test 7：UI 交互（No.22/23/24/25）
// ============================================================================
test.describe('UI 交互 (UD25)', () => {
  test('No.22 加载中按钮禁用', async ({ page }) => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((res) => { release = res; });
    await page.route(API_URL, async (route) => { await gate; await route.continue(); });
    await page.goto(`${BASE_URL}/edb-user-view?userId=user123`, { timeout: 60000 });
    await expect(page.locator('.uev-loading')).toBeVisible({ timeout: 15000 });
    // 加载中 Clear / Back 均禁用
    expect(await page.locator('.uev-btn-clear').isEnabled()).toBe(false);
    expect(await page.locator('.uev-btn-back').isEnabled()).toBe(false);
    await shot(page, '断言: No.22 加载中按钮禁用', {
      step: 'API 响应前查看按钮状态',
      value: '無（加载中）',
      actual: '加载中 Clear 与 Back 按钮均处于禁用状态',
    });
    release!();
    await expect(page.locator('.uev-details')).toBeVisible({ timeout: 15000 });
  });

  test('No.23 错误消息以红色显示', async ({ page }) => {
    await gotoUvw(page, 'unknown');
    await expect(page.locator('.uev-message-error')).toBeVisible();
    const color = await page.locator('.uev-message-error').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.23 错误消息样式', {
      step: '触发错误（不存在的 userId）',
      value: 'userId: unknown',
      actual: '错误消息以红色 #ff4d4f 显示',
    });
  });

  test('No.24 用户信息标签-值对显示', async ({ page }) => {
    await gotoUvw(page, 'user123');
    await expect(page.locator('.uev-details')).toBeVisible();
    expect(await page.locator('.uev-info-row').count()).toBe(4);
    // 每行同时含 .uev-label 与 .uev-value
    const rows = page.locator('.uev-info-row');
    for (let i = 0; i < 4; i++) {
      expect(await rows.nth(i).locator('.uev-label').count()).toBe(1);
      expect(await rows.nth(i).locator('.uev-value').count()).toBe(1);
    }
    await shot(page, '断言: No.24 标签-值对显示', {
      step: '查看用户信息展示形式',
      value: '無',
      actual: '以 4 个清晰的 标签-值对 形式展示（Userid/Responsible/User Position/E-mail）',
    });
  });

  test('No.25 按钮排列居中且位于底部', async ({ page }) => {
    await gotoUvw(page, 'user123');
    await expect(page.locator('.uev-details')).toBeVisible();
    const justify = await page.locator('.uev-buttons').evaluate((el) => getComputedStyle(el).justifyContent);
    expect(justify).toBe('center');
    // 按钮区域在卡片内位于用户信息之后（DOM 顺序：details -> buttons）
    const cardHtml = await page.locator('.uev-card').innerHTML();
    const detailsIdx = cardHtml.indexOf('uev-details');
    const buttonsIdx = cardHtml.indexOf('uev-buttons');
    expect(detailsIdx).toBeGreaterThan(-1);
    expect(buttonsIdx).toBeGreaterThan(detailsIdx);
    await shot(page, '断言: No.25 按钮排列', {
      step: '查看按钮排列位置',
      value: '無',
      actual: 'Clear/Back 按钮居中排列，位于画面卡片底部（用户信息之后）',
    });
  });
});
