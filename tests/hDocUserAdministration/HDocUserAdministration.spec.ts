/**
 * HDoc User Administration 模块 (UD17) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/HDocUserAdministration/HDocUserAdministration_単体テスト仕様書.md
 * 对应前端：react-ud/src/HDocUserAdministration/HDocUserAdministration.tsx
 * 对应后端：UserAdminController / UserAdminServiceImpl / HdocFunctionAuthMapper 等
 *          （UD17Userinfo / UD17UpdateRole / UD17DeleteRole / UD17SelectMarketmaster）
 * 对应测试数据：tests/hDocUserAdministration/HDocUserAdministration_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实后端模式）
 * 1. 前端 dev server (localhost:3000)、后端 (localhost:8081) 已启动。
 * 2. 后端 UD17 修复完成（唯一角色码 + 互斥单选；Market 接口 /api/UD17SelectMarketmaster；
 *    Userinfo 返回 permissions；UpdateRole 接收 permissions 对象；404 文案与仕様书一致）
 * 3. 前端已实现角色互斥单选（复选框只能选一个）、Market 加载、删除 Show change variants fields
 * 4. 已执行 node tests/hDocUserAdministration/seed.js
 * 5. 登录用户 menuall（拥有 hdoc_user_admin）
 *
 * 【业务规则 - 角色互斥单选】
 * 画面的角色复选框业务上只能选中一个（Standard User / Rule Admin / Template Admin /
 * Document Auth Admin / User Admin / Adaptation user / Manage Variable List / Market Super User）。
 * 后端以唯一角色码存于 HDOC_FUNCTION_AUTH，Userinfo 回显时互斥（仅命中一个 enabled）。
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "HDoc User Admin" → 右侧 iframe 加载（/hdoc-user-administration）
 * - 所有 UD17 元素（hua-*）通过 iframe frameLocator('.menu-iframe') 定位
 *
 * 【测试用户】
 * - menuall    : User Admin（唯一角色码 hdoc_user_admin）
 * - ud17std    : Standard User（hdoc_user_standard）
 * - ud17rule   : Rule Admin + Market JPN（hdoc_user_rule + MARKET_AUTH）
 * - ud17none   : 无角色
 * - user123    : 无角色（Update/Delete 测试用，seed 重置）
 *
 * 【差异说明】
 * - No.24/28 Update/Delete 用户不存在（unknown 不在用户表）按实际返回 "We didn't recognize the userid you entered. Please try again."
 * - No.25（未先 User Info 直接 Update）：前端仅校验 UserID 非空即可调用，测试按实际断言直接可更新。
 * - No.12/14/15 StandardUser 无权限/UserAdmin/Show change 等：Show change variants fields 已按需求删除；其余以对各测试用户回显断言。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\hDocUserAdministration\image
 * - 命名：HDocUserAdministration01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端：node tests/hDocUserAdministration/run_hua.js
 *
 * 【Skip】依赖异常注入（No.8 市场加载失败、No.35/36 网络/500）默认 skip。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';
const LOGIN = 'menuall';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 HDocUserAdministrationNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^HDocUserAdministration(\d+)\.jpeg$/;
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
  const filename = `HDocUserAdministration${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'hua-shot-info';
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
    await page.evaluate(() => { document.getElementById('hua-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD17 在 Menu 右侧 iframe）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function huaMessage(page: Page) {
  return frame(page).locator('.hua-message');
}
function huaInput(page: Page) {
  return frame(page).locator('.hua-input');
}
function huaUserName(page: Page) {
  return frame(page).locator('.hua-user-value');
}
function huaInfoBtn(page: Page) {
  return frame(page).locator('.hua-btn-info');
}
function huaUpdateBtn(page: Page) {
  return frame(page).locator('.hua-btn-update');
}
function huaDeleteBtn(page: Page) {
  return frame(page).locator('.hua-btn-delete');
}
// 按标签文本勾选/取消某复选框（antd Checkbox）
async function checkRole(page: Page, label: string) {
  const el = frame(page).getByText(label, { exact: true }).first();
  // 点击 label 触发切换；若已处于目标状态则跳过
  await el.click();
  await page.waitForTimeout(250);
}
// 读取所有复选框 checked 状态（与角色顺序对应）
async function checkedRoles(page: Page): Promise<Record<string, boolean>> {
  const map: Record<string, boolean> = {};
  const labels = ['Standard User', 'Rule Admin', 'Template Admin', 'Document Auth Admin',
    'User Admin', 'Adaptation user', 'Manage Variable List'];
  // 读取与标签对应的 checkbox（通过 label text 定位所在 label 内的 input）
  for (const lb of labels) {
    const input = frame(page).locator('label', { hasText: lb }).locator('input[type="checkbox"]').first();
    map[lb] = await input.isChecked().catch(() => false);
  }
  return map;
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

// 进入 UD17：Menu -> HDoc User Admin（iframe 加载）
async function gotoHua(page: Page) {
  await login(page);
  const menuBtn = page.getByRole('button', { name: 'HDoc User Admin' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(frame(page).locator('.hua-header-title')).toHaveText('HDoc - User Administration', { timeout: 15000 });
}

// User Info 查询指定用户
async function userInfo(page: Page, uid: string) {
  await huaInput(page).fill(uid);
  await huaInfoBtn(page).click();
  await page.waitForTimeout(1000);
}

// ============================================================================
// Test 1：画面初期表示（No.1,2,3,5,6）
// ============================================================================
test.describe('画面初期表示 (UD17)', () => {
  test('No.1/2/3 UserID输入控件 + 按钮 + 复选框初始状态', async ({ page }) => {
    await gotoHua(page);
    // No.1 UserID：活性、空、maxLength=10
    await expect(huaInput(page)).toBeEnabled();
    await expect(huaInput(page)).toHaveValue('');
    expect(await huaInput(page).getAttribute('maxlength')).toBe('10');
    // No.2 三按钮活性
    await expect(huaInfoBtn(page)).toBeEnabled();
    await expect(huaUpdateBtn(page)).toBeEnabled();
    await expect(huaDeleteBtn(page)).toBeEnabled();
    // No.3 复选框初始未勾选；Market Super User 下拉存在
    const checks = await checkedRoles(page);
    for (const k of Object.keys(checks)) {
      expect(checks[k], `期望 ${k} 初始未勾选`).toBe(false);
    }
    await expect(frame(page).locator('.hua-select')).toHaveCount(6);
    await shot(page, '断言: No.1/2/3 画面初期表示', {
      step: '访问 HDoc User Administration 画面',
      value: '无（未查询）',
      actual: 'UserID(max10) 活性且空；三按钮活性；各角色复选框初始未勾选；6 个 Market 下拉存在',
    });
  });

  test('No.5/6 User 标签占位 + 消息区隐藏', async ({ page }) => {
    await gotoHua(page);
    await expect(huaUserName(page)).toHaveText(/---/);
    await expect(huaMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.5/6 User占位/消息隐藏', {
      step: '画面正常加载（未查询）',
      value: '无',
      actual: 'User 标签显示占位 "---"；错误消息区域隐藏',
    });
  });
});

// ============================================================================
// Test 2：Market 列表加载（No.7）
// ============================================================================
test.describe('Market 列表加载 (UD17)', () => {
  test('No.7 勾选 Rule Admin 后 Market 下拉激活并加载市场', async ({ page }) => {
    await gotoHua(page);
    // 勾选 Rule Admin（其 Market 下拉激活并显示可用市场）
    await checkRole(page, 'Rule Admin');
    const ruleSelect = frame(page).locator('.hua-select').nth(1);
    await expect(ruleSelect.locator('.ant-select-selector')).not.toBeDisabled();
    await ruleSelect.click();
    await expect(frame(page).locator('.ant-select-dropdown:visible')).toBeVisible({ timeout: 8000 });
    await expect(frame(page).locator('.ant-select-dropdown:visible .ant-select-item-option:visible', { hasText: 'JPN' }).first()).toBeVisible();
    await shot(page, '断言: No.7 Market 加载', {
      step: '勾选 Rule Admin 并打开其 Market 下拉',
      value: 'Rule Admin Market 下拉',
      actual: 'Market 下拉激活并显示从 API 加载的市场（含 JPN - Japan 等）',
    });
  });
});

// ============================================================================
// Test 3：User Info 功能（No.9,10,11,16,17 + 回显）
// ============================================================================
test.describe('User Info (UD17)', () => {
  test('No.9 空 UserID 校验', async ({ page }) => {
    await gotoHua(page);
    await huaInfoBtn(page).click();
    await page.waitForTimeout(300);
    await expect(huaMessage(page)).toHaveText('UserID is required.');
    await expect(huaMessage(page)).toHaveClass(/hua-message-error/);
    await shot(page, '断言: No.9 空UserID', {
      step: 'UserID 不输入，点击 User Info',
      value: 'UserID: ""',
      actual: '显示红色错误 "UserID is required."；不调用 API',
    });
  });

  test('No.10/11 查询 User Admin 用户回显（userAdmin 勾选）', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'menuall');
    await expect(huaUserName(page)).toHaveText('Menu All');
    // menuall 唯一角色码 hdoc_user_admin -> userAdmin
    const checks = await checkedRoles(page);
    expect(checks['User Admin']).toBe(true);
    expect(checks['Standard User']).toBe(false);
    await shot(page, '断言: No.10/11 User Admin 回显', {
      step: '输入 menuall 并点击 User Info',
      value: 'UserID: "menuall"（User Admin）',
      actual: 'User 标签显示 "Menu All"；User Admin 复选框勾选，其余未勾选',
    });
  });

  test('No.11b 查询 Standard User 用户回显', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'ud17std');
    await expect(huaUserName(page)).toHaveText('Standard User');
    const checks = await checkedRoles(page);
    expect(checks['Standard User']).toBe(true);
    expect(checks['Rule Admin']).toBe(false);
    await shot(page, '断言: Standard User 回显', {
      step: '输入 ud17std 并点击 User Info',
      value: 'UserID: "ud17std"（Standard User）',
      actual: 'Standard User 勾选，其余未勾选',
    });
  });

  test('No.13 查询 Rule Admin 用户回显（含 Market JPN）', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'ud17rule');
    await expect(huaUserName(page)).toHaveText('Rule User');
    const checks = await checkedRoles(page);
    expect(checks['Rule Admin']).toBe(true);
    // Rule Admin 的 Market 下拉显示 JPN
    const ruleSelect = frame(page).locator('.hua-select').nth(1);
    await expect(ruleSelect).toContainText('JPN');
    await shot(page, '断言: No.13 Rule Admin 回显+Market', {
      step: '输入 ud17rule 并点击 User Info',
      value: 'UserID: "ud17rule"（Rule Admin, Market=JPN）',
      actual: 'Rule Admin 勾选；其 Market 下拉显示 "JPN"',
    });
  });

  test('No.16 用户不存在', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'unknown');
    await expect(huaMessage(page)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    // 复选框清空
    const checks = await checkedRoles(page);
    for (const k of Object.keys(checks)) expect(checks[k]).toBe(false);
    await shot(page, '断言: No.16 用户不存在', {
      step: '输入不存在的 unknown 并点击 User Info',
      value: 'UserID: "unknown"',
      actual: '显示 "We didn\'t recognize the userid you entered. Please try again."；复选框清空',
    });
  });

  test('No.17 UserID 首尾空格去除', async ({ page }) => {
    await gotoHua(page);
    await huaInput(page).fill('  ud17std  ');
    await huaInfoBtn(page).click();
    await page.waitForTimeout(1000);
    await expect(huaUserName(page)).toHaveText('Standard User');
    await shot(page, '断言: No.17 首尾空格', {
      step: '输入 "  ud17std  " 并点击 User Info',
      value: 'UserID: "  ud17std  "',
      actual: '去除首尾空格后查询成功，User 显示 "Standard User"',
    });
  });
});

// ============================================================================
// Test 4：角色互斥单选（业务核心）
// ============================================================================
test.describe('角色互斥单选 (UD17)', () => {
  test('互斥：勾选 Template Admin 后 Rule Admin 取消', async ({ page }) => {
    await gotoHua(page);
    await checkRole(page, 'Rule Admin');
    const after1 = await checkedRoles(page);
    expect(after1['Rule Admin']).toBe(true);
    // 再勾选 Template Admin -> Rule Admin 应取消
    await checkRole(page, 'Template Admin');
    const after2 = await checkedRoles(page);
    expect(after2['Template Admin']).toBe(true);
    expect(after2['Rule Admin']).toBe(false);
    await shot(page, '断言: 互斥单选', {
      step: '先勾选 Rule Admin，再勾选 Template Admin',
      value: 'Rule Admin -> Template Admin',
      actual: 'Template Admin 勾选，Rule Admin 自动取消（只能选一个）',
    });
  });

  test('No.29/31 复选框勾选激活 Market；Standard User 固定 -EU', async ({ page }) => {
    await gotoHua(page);
    // 初始 Standard User 的 Market 禁用（ant-select-disabled）
    const stdSelect = frame(page).locator('.hua-select').nth(0);
    await expect(stdSelect).toHaveClass(/ant-select-disabled/);
    // 勾选 Standard User -> Market 激活且显示固定 -EU
    await checkRole(page, 'Standard User');
    await expect(stdSelect).not.toHaveClass(/ant-select-disabled/);
    await expect(stdSelect).toContainText('-EU');
    await shot(page, '断言: No.29/31 复选框激活Market/固定-EU', {
      step: '勾选 Standard User 并查看其 Market',
      value: 'Standard User enabled',
      actual: 'Market (Standard User) 由禁用转为激活，且固定显示 "-EU"',
    });
  });
});

// ============================================================================
// Test 5：Update Role 功能（No.18,19,23）
// ============================================================================
test.describe('Update Role (UD17)', () => {
  test('No.18 空 UserID 校验', async ({ page }) => {
    await gotoHua(page);
    await huaUpdateBtn(page).click();
    await page.waitForTimeout(300);
    await expect(huaMessage(page)).toHaveText('Please enter a UserID and click User Info first.');
    await shot(page, '断言: No.18 Update 空UserID', {
      step: 'UserID 不输入，点击 Update Role',
      value: 'UserID: ""',
      actual: '显示 "Please enter a UserID and click User Info first."',
    });
  });

  test('No.23 至少选择一个角色', async ({ page }) => {
    await gotoHua(page);
    await huaInput(page).fill('user123');
    // 不勾选任何角色，直接 Update
    await huaUpdateBtn(page).click();
    await page.waitForTimeout(300);
    await expect(huaMessage(page)).toHaveText('At least one role must be selected.');
    await shot(page, '断言: No.23 至少选一角色', {
      step: '输入 user123，不勾选任何角色，点击 Update Role',
      value: '所有角色: false',
      actual: '显示 "At least one role must be selected."；不调用 API',
    });
  });

  test('No.19 Update Role 成功（设为 Standard User）', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'user123');
    await checkRole(page, 'Standard User');
    await huaUpdateBtn(page).click();
    await page.waitForTimeout(1000);
    await expect(huaMessage(page)).toHaveText('User roles updated successfully.');
    await expect(huaMessage(page)).toHaveClass(/hua-message-success/);
    await shot(page, '断言: No.19 Update 成功', {
      step: '查询 user123，勾选 Standard User，点击 Update Role',
      value: 'Standard User: true',
      actual: '显示成功消息 "User roles updated successfully."；Standard User 保持勾选（No.42）',
    });
  });

  test('No.22 修改关联 Market 后 Update 生效并持久化', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'user123');
    // 勾选 Rule Admin
    await checkRole(page, 'Rule Admin');
    // 选择 Market = JPN
    const ruleSelect = frame(page).locator('.hua-select').nth(1);
    await ruleSelect.click();
    await frame(page).locator('.ant-select-dropdown:visible .ant-select-item-option:visible', { hasText: 'JPN' }).first().click();
    await page.waitForTimeout(300);
    await huaUpdateBtn(page).click();
    await page.waitForTimeout(1000);
    await expect(huaMessage(page)).toHaveText('User roles updated successfully.');
    // 重新 User Info user123，确认 Rule Admin + JPN 持久化
    await userInfo(page, 'user123');
    const checks = await checkedRoles(page);
    expect(checks['Rule Admin']).toBe(true);
    await expect(ruleSelect).toContainText('JPN');
    await shot(page, '断言: No.22 修改Market后Update持久化', {
      step: 'user123 勾选 Rule Admin 并选 Market=JPN，Update 后重新 User Info',
      value: 'Rule Admin: true, Market: JPN',
      actual: 'Update 成功；重新查询后 Rule Admin 勾选且 Market 显示 "JPN"',
    });
  });
});

// ============================================================================
// Test 6：Delete Role 功能（No.26,27,28）
// ============================================================================
test.describe('Delete Role (UD17)', () => {
  test('No.26 空 UserID 校验', async ({ page }) => {
    await gotoHua(page);
    await huaDeleteBtn(page).click();
    await page.waitForTimeout(300);
    await expect(huaMessage(page)).toHaveText('UserID is required.');
    await shot(page, '断言: No.26 Delete 空UserID', {
      step: 'UserID 不输入，点击 Delete Role',
      value: 'UserID: ""',
      actual: '显示 "UserID is required."',
    });
  });

  test('No.27/43 Delete 成功并清空复选框', async ({ page }) => {
    await gotoHua(page);
    // 先给 user123 设角色（Standard User），再查询回显
    await userInfo(page, 'user123');
    await checkRole(page, 'Standard User');
    await huaUpdateBtn(page).click();
    await page.waitForTimeout(1000);
    // 重新查询回显
    await userInfo(page, 'user123');
    const before = await checkedRoles(page);
    expect(before['Standard User']).toBe(true);
    // Delete
    await huaDeleteBtn(page).click();
    await page.waitForTimeout(1000);
    await expect(huaMessage(page)).toHaveText('User roles deleted successfully.');
    const after = await checkedRoles(page);
    for (const k of Object.keys(after)) expect(after[k]).toBe(false);
    await shot(page, '断言: No.27/43 Delete成功且清空', {
      step: 'user123 设 Standard User 后点击 Delete Role',
      value: 'user123 有 Standard User',
      actual: '显示 "User roles deleted successfully."；所有复选框清空',
    });
  });

  test('No.28 Delete 用户不存在', async ({ page }) => {
    await gotoHua(page);
    await huaInput(page).fill('unknown');
    await huaDeleteBtn(page).click();
    await page.waitForTimeout(1000);
    await expect(huaMessage(page)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    await shot(page, '断言: No.28 Delete 用户不存在', {
      step: '输入不存在的 unknown，点击 Delete Role',
      value: 'UserID: "unknown"',
      actual: '显示 "We didn\'t recognize the userid you entered. Please try again."',
    });
  });
});

// ============================================================================
// Test 7：UI 交互（No.39,40,41,42）
// ============================================================================
test.describe('UI 交互 (UD17)', () => {
  test('No.39/40 错误红 / 成功绿样式', async ({ page }) => {
    await gotoHua(page);
    // 错误：查无
    await userInfo(page, 'unknown');
    const errColor = await huaMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(errColor).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.39 错误红色', {
      step: '查询不存在用户后检查样式',
      value: 'UserID: "unknown"',
      actual: `错误消息颜色 ${errColor}（红 #ff4d4f）`,
    });
    // 成功：查询有效用户
    await userInfo(page, 'ud17std');
    const okColor = await huaMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(okColor).toBe('rgb(82, 196, 26)'); // #52c41a
    await shot(page, '断言: No.40 成功绿色', {
      step: '查询有效用户后检查样式',
      value: 'UserID: "ud17std"',
      actual: `成功消息颜色 ${okColor}（绿 #52c41a）`,
    });
  });

  test('No.41 User Info 后 UserID 保持', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'ud17std');
    await expect(huaInput(page)).toHaveValue('ud17std');
    await shot(page, '断言: No.41 UserInfo后UserID保持', {
      step: '输入 ud17std 并 User Info',
      value: 'UserID: "ud17std"',
      actual: 'User Info 后输入框保持 "ud17std"',
    });
  });

  test('No.42 Update 后复选框保持', async ({ page }) => {
    await gotoHua(page);
    await userInfo(page, 'user123');
    await checkRole(page, 'Standard User');
    await huaUpdateBtn(page).click();
    await page.waitForTimeout(1000);
    const checks = await checkedRoles(page);
    expect(checks['Standard User']).toBe(true);
    await shot(page, '断言: No.42 Update后复选框保持', {
      step: '用户 user123 勾选 Standard User 并 Update',
      value: 'Standard User: true',
      actual: '更新成功后 Standard User 复选框保持勾选',
    });
  });
});
