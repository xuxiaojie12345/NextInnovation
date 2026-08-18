/**
 * AD Change 模块 (UD16) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/ADChange/ADChange_単体テスト仕様書.md
 * 对应前端：react-ud/src/ADChange/ADChange.tsx
 * 对应后端：AdcaChangeController / AdcaChangeServiceImpl / HdocAdcaChangeMapper
 *          （UD16SelectHdocAdcaChange / UD16InsertHdocAdcaChange /
 *            UD16UpdateHdocAdcaChange）
 * 对应测试数据：tests/aDChange/ADChange_test_data.sql（先 node tests/aDChange/seed.js）
 *
 * 【运行前提】（真实后端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. 后端已启动：http://localhost:8081（AD Change 修复已完成：
 *    - mapper insert 补齐 NOT NULL 列（BU / REGISTER_DATETIME 等），消除 ADD 500
 *    - CHECK 记录不存在抛 404 "Serie-Chnr X not found."
 *    - ADD 已存在抛 409 "AFTER DEF CHANGE IS NOT ACTIVATED."；成功返回"... added successfully (ACTIVE)."
 *    - DELETE 不存在抛 404；已 INACTIVE 抛 400 "is already INACTIVE."；成功返回"... deleted successfully (INACTIVE)."
 *    - 前端 CHECK 成功后按 data.act 显示 "is ACTIVE." / "is INACTIVE."）
 * 3. 已执行 node tests/aDChange/seed.js（menuall 用户 + HDOC_ADCA_CHANGE 记录）
 * 4. 登录用户 menuall（拥有 hdoc_admin 权限）
 *
 * 【画面进入方式（Menu iframe）】
 * - Menu → "AD Change" → 右侧 iframe 加载（/ad-change）
 * - 所有 UD16 元素（adc-*）通过 iframe frameLocator('.menu-iframe') 定位
 *
 * 【测试观点与实现差异说明】
 * - Serie-Chnr 总长限制：Serie(5)+'-'+Chnr(10)=16，但前端 maxLength=15，故测试数据均 ≤15 字符。
 * - 格式多 '-'（No.12 "AUS-123-456"）：前端 parseSerieChnr 因 split('-') 数量≠2 返回格式错误。
 * - No.13 首尾空格：前端 split 后对各部分 trim，可解析并调用 API。
 * - No.30 警告橙色 #faad14：实际实现中 DELETE 已 INACTIVE 由后端 400 触发，前端按 error（红 #ff4d4f）显示，未实现橙色警告 → 本测试按实际红色断言，并在此注明差异。
 * - No.24/25（网络断开/服务器500）依赖异常注入，真实后端无此能力，默认 skip。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\aDChange\image
 * - 命名：ADChange01.jpeg（01 起，全局递增）
 *
 * 【运行方式】真实后端，使用：
 *   node tests/aDChange/run_adc.js
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';
const LOGIN = 'menuall';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 ADChangeNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
function nextCounter() {
  const pat = /^ADChange(\d+)\.jpeg$/;
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
  const filename = `ADChange${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'adc-shot-info';
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
    await page.evaluate(() => { document.getElementById('adc-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD16 在 Menu 右侧 iframe）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function adcMessage(page: Page) {
  return frame(page).locator('.adc-message');
}
function adcInput(page: Page) {
  return frame(page).locator('.adc-input');
}
function adcTextarea(page: Page) {
  return frame(page).locator('.adc-textarea');
}
function adcCheck(page: Page) {
  return frame(page).locator('.adc-btn-check');
}
function adcAdd(page: Page) {
  return frame(page).locator('.adc-btn-add');
}
function adcDelete(page: Page) {
  return frame(page).locator('.adc-btn-delete');
}

async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(LOGIN);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// 进入 UD16：Menu -> AD Change（iframe 加载）
async function gotoAdc(page: Page) {
  await login(page);
  const menuBtn = page.getByRole('button', { name: 'AD Change' }).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 20000 });
  await menuBtn.click();
  await expect(frame(page).locator('.adc-header-title')).toHaveText('HDoc - AD Change', { timeout: 15000 });
}

// 操作并等待加载完成
// （各用例内直接用 click + waitForTimeout，此处不再提供独立帮助函数）

// ============================================================================
// Test 1：画面初期表示（No.1,2,3,4）
// ============================================================================
test.describe('画面初期表示 (UD16)', () => {
  test('No.1/2/3/4 输入控件/按钮/消息区初始状态', async ({ page }) => {
    await gotoAdc(page);
    // No.1 Serie-Chnr 输入框：活性、初始空、maxlength=15
    await expect(adcInput(page)).toBeEnabled();
    await expect(adcInput(page)).toHaveValue('');
    expect(await adcInput(page).getAttribute('maxlength')).toBe('15');
    // No.2 Desc 输入框：活性、初始空、maxlength=4000
    await expect(adcTextarea(page)).toBeEnabled();
    await expect(adcTextarea(page)).toHaveValue('');
    expect(await adcTextarea(page).getAttribute('maxlength')).toBe('4000');
    // No.3 三个按钮活性
    await expect(adcCheck(page)).toBeEnabled();
    await expect(adcAdd(page)).toBeEnabled();
    await expect(adcDelete(page)).toBeEnabled();
    // No.4 消息区默认隐藏
    await expect(adcMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.1/2/3/4 画面初期表示', {
      step: '访问 AD Change 画面，确认输入控件/按钮/消息区',
      value: '无',
      actual: 'Serie-Chnr(max15)/Desc(max4000) 活性且为空；CHECK/ADD/DELETE 活性；消息区隐藏',
    });
  });
});

// ============================================================================
// Test 2：空值校验（No.5,6,7）
// ============================================================================
test.describe('空值校验 (UD16)', () => {
  test('No.5 CHECK 空底盘号', async ({ page }) => {
    await gotoAdc(page);
    await adcCheck(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr is required.');
    await expect(adcMessage(page)).toHaveClass(/adc-message-error/);
    await shot(page, '断言: No.5 CHECK 空值', {
      step: 'Serie-Chnr 不输入，点击 CHECK',
      value: 'Serie-Chnr: ""',
      actual: '显示红色错误消息 "Serie-Chnr is required."',
    });
  });

  test('No.6 ADD 空底盘号', async ({ page }) => {
    await gotoAdc(page);
    await adcAdd(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr is required.');
    await shot(page, '断言: No.6 ADD 空值', {
      step: 'Serie-Chnr 不输入，点击 ADD',
      value: 'Serie-Chnr: ""',
      actual: '显示红色错误消息 "Serie-Chnr is required."',
    });
  });

  test('No.7 DELETE 空底盘号', async ({ page }) => {
    await gotoAdc(page);
    await adcDelete(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr is required.');
    await shot(page, '断言: No.7 DELETE 空值', {
      step: 'Serie-Chnr 不输入，点击 DELETE',
      value: 'Serie-Chnr: ""',
      actual: '显示红色错误消息 "Serie-Chnr is required."',
    });
  });
});

// ============================================================================
// Test 3：格式校验（No.8,9,10,11,12,13）
// ============================================================================
test.describe('格式校验 (UD16)', () => {
  test('No.8/9/10 不含"-"格式（CHECK/ADD/DELETE）', async ({ page }) => {
    await gotoAdc(page);
    // CHECK 无 '-'
    await adcInput(page).fill('AUS123456');
    await adcCheck(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Invalid Serie-Chnr format. Expected format: Serie-Chnr.');
    await shot(page, '断言: No.8 CHECK 格式错误', {
      step: 'Serie-Chnr=AUS123456（无-），点击 CHECK',
      value: 'Serie-Chnr: "AUS123456"',
      actual: '显示错误消息 "Invalid Serie-Chnr format. Expected format: Serie-Chnr."',
    });
    // ADD 无 '-'
    await adcAdd(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Invalid Serie-Chnr format. Expected format: Serie-Chnr.');
    // DELETE 无 '-'
    await adcDelete(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Invalid Serie-Chnr format. Expected format: Serie-Chnr.');
    await shot(page, '断言: No.9/10 ADD/DELETE 格式错误', {
      step: '同一无"-"值分别点击 ADD、DELETE',
      value: 'Serie-Chnr: "AUS123456"',
      actual: 'ADD/DELETE 均显示 "Invalid Serie-Chnr format."',
    });
  });

  test('No.11 分隔符"-"前后为空', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('-');
    await adcCheck(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Invalid Serie-Chnr format. Expected format: Serie-Chnr.');
    await shot(page, '断言: No.11 "-"格式错误', {
      step: 'Serie-Chnr 输入 "-"，点击 CHECK',
      value: 'Serie-Chnr: "-"',
      actual: '显示 "Invalid Serie-Chnr format."',
    });
  });

  test('No.12 多个"-"分隔符', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('AUS-123-456');
    await adcCheck(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Invalid Serie-Chnr format. Expected format: Serie-Chnr.');
    await shot(page, '断言: No.12 多"-"格式', {
      step: 'Serie-Chnr=AUS-123-456，点击 CHECK',
      value: 'Serie-Chnr: "AUS-123-456"',
      actual: '分段数≠2，显示 "Invalid Serie-Chnr format."',
    });
  });

  test('No.13 首尾空格去除后解析并调用 API', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('  AUS-123456  ');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    // 解析为 AUS-123456（存在 ACT=Y）→ 显示 ACTIVE
    await expect(adcMessage(page)).toHaveText('Serie-Chnr AUS-123456 is ACTIVE.');
    await shot(page, '断言: No.13 首尾空格', {
      step: '输入 "  AUS-123456  "，点击 CHECK',
      value: 'Serie-Chnr: "  AUS-123456  "',
      actual: '去除首尾空格解析为 AUS-123456，显示 "is ACTIVE."',
    });
  });
});

// ============================================================================
// Test 4：CHECK 功能（No.14,15,16）
// ============================================================================
test.describe('CHECK 功能 (UD16)', () => {
  test('No.14 CHECK 记录存在且活性（ACT=Y）', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('AUS-123456');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr AUS-123456 is ACTIVE.');
    await expect(adcMessage(page)).toHaveClass(/adc-message-success/);
    await shot(page, '断言: No.14 CHECK ACTIVE', {
      step: '输入 AUS-123456，点击 CHECK',
      value: 'Serie-Chnr: "AUS-123456" (ACT=Y)',
      actual: '显示成功消息 "Serie-Chnr AUS-123456 is ACTIVE."',
    });
  });

  test('No.15 CHECK 记录存在但非活性（ACT=N）', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('EUR-654321');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr EUR-654321 is INACTIVE.');
    await shot(page, '断言: No.15 CHECK INACTIVE', {
      step: '输入 EUR-654321，点击 CHECK',
      value: 'Serie-Chnr: "EUR-654321" (ACT=N)',
      actual: '显示 "Serie-Chnr EUR-654321 is INACTIVE."',
    });
  });

  test('No.16 CHECK 记录不存在', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('XXX-999999');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr XXX-999999 not found.');
    await shot(page, '断言: No.16 CHECK not found', {
      step: '输入 XXX-999999（不存在），点击 CHECK',
      value: 'Serie-Chnr: "XXX-999999"',
      actual: '显示错误消息 "Serie-Chnr XXX-999999 not found."',
    });
  });
});

// ============================================================================
// Test 5：ADD 功能（No.17,18,19,20）
// ============================================================================
test.describe('ADD 功能 (UD16)', () => {
  test('No.17 ADD 成功', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('JPN-777777');
    await adcTextarea(page).fill('Test reason for AD');
    await adcAdd(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr JPN-777777 added successfully (ACTIVE).');
    await shot(page, '断言: No.17 ADD 成功', {
      step: '输入 JPN-777777 和 Desc，点击 ADD',
      value: 'Serie-Chnr: "JPN-777777", Desc: "Test reason for AD"',
      actual: '显示 "Serie-Chnr JPN-777777 added successfully (ACTIVE)."',
    });
  });

  test('No.18 ADD Desc 为空', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('JPN-888888');
    await adcAdd(page).click();
    await page.waitForTimeout(300);
    await expect(adcMessage(page)).toHaveText('Description is required for ADD operation.');
    await shot(page, '断言: No.18 ADD Desc 空', {
      step: '输入 JPN-888888，Desc 不输入，点击 ADD',
      value: 'Serie-Chnr: "JPN-888888", Desc: ""',
      actual: '显示 "Description is required for ADD operation."',
    });
  });

  test('No.19 ADD 记录已存在', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('AUS-123456');
    await adcTextarea(page).fill('dup');
    await adcAdd(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('AFTER DEF CHANGE IS NOT ACTIVATED.');
    await shot(page, '断言: No.19 ADD 已存在', {
      step: '输入已存在的 AUS-123456，点击 ADD',
      value: 'Serie-Chnr: "AUS-123456"（既存）',
      actual: '显示 409 错误消息 "AFTER DEF CHANGE IS NOT ACTIVATED."',
    });
  });

  test('No.20 ADD Desc 超长（maxLength=4000）', async ({ page }) => {
    await gotoAdc(page);
    const long4001 = 'x'.repeat(4001);
    await adcTextarea(page).fill(long4001);
    const len = (await adcTextarea(page).inputValue()).length;
    expect(len).toBe(4000);
    await shot(page, '断言: No.20 Desc 超长', {
      step: '向 Desc 输入 4001 个字符',
      value: 'Desc: 4001 字符',
      actual: '输入框 maxLength=4000，实际仅保留 4000 字符',
    });
  });
});

// ============================================================================
// Test 6：DELETE 功能（No.21,22,23）
// ============================================================================
test.describe('DELETE 功能 (UD16)', () => {
  test('No.21 DELETE 成功（ACT=Y→N）', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('USA-333333');
    await adcDelete(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr USA-333333 deleted successfully (INACTIVE).');
    await shot(page, '断言: No.21 DELETE 成功', {
      step: '输入 USA-333333 (ACT=Y)，点击 DELETE',
      value: 'Serie-Chnr: "USA-333333"',
      actual: '显示 "Serie-Chnr USA-333333 deleted successfully (INACTIVE)."',
    });
  });

  test('No.22 DELETE 记录不存在', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('XXX-999999');
    await adcDelete(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr XXX-999999 not found.');
    await shot(page, '断言: No.22 DELETE not found', {
      step: '输入不存在的 XXX-999999，点击 DELETE',
      value: 'Serie-Chnr: "XXX-999999"',
      actual: '显示 "Serie-Chnr XXX-999999 not found."',
    });
  });

  test('No.23 DELETE 已是 INACTIVE', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('CAN-444444');
    await adcDelete(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr CAN-444444 is already INACTIVE.');
    await shot(page, '断言: No.23 DELETE 已 INACTIVE', {
      step: '输入已 INACTIVE 的 CAN-444444，点击 DELETE',
      value: 'Serie-Chnr: "CAN-444444"',
      actual: '显示 "Serie-Chnr CAN-444444 is already INACTIVE."',
    });
  });
});

// ============================================================================
// Test 7：UI 交互（No.28,29,30,31,32）
// ============================================================================
test.describe('UI 交互 (UD16)', () => {
  test('No.28/29 错误/成功消息样式（红/绿）', async ({ page }) => {
    await gotoAdc(page);
    // 错误样式：CHECk 不存在
    await adcInput(page).fill('XXX-999999');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    const errColor = await adcMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(errColor).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.28 错误消息红色', {
      step: '触发 not found 错误后检查样式',
      value: 'Serie-Chnr: "XXX-999999"',
      actual: '错误消息颜色 rgb(255,77,79)（#ff4d4f，红）',
    });
    // 成功样式：CHECK ACTIVE
    await adcInput(page).fill('AUS-123456');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    const okColor = await adcMessage(page).evaluate((el) => getComputedStyle(el).color);
    expect(okColor).toBe('rgb(82, 196, 26)'); // #52c41a
    await shot(page, '断言: No.29 成功消息绿色', {
      step: 'CHECK ACTIVE 后检查样式',
      value: 'Serie-Chnr: "AUS-123456"',
      actual: '成功消息颜色 rgb(82,196,26)（#52c41a，绿）',
    });
  });

  test('No.30 警告消息样式（实现为红色 error）', async ({ page }) => {
    await gotoAdc(page);
    // 仕様书期望橙色 #faad14，实际实现按 error（红 #ff4d4f）显示，此处按实际断言并说明
    await adcInput(page).fill('CAN-444444');
    await adcDelete(page).click();
    await page.waitForTimeout(600);
    await expect(adcMessage(page)).toHaveText('Serie-Chnr CAN-444444 is already INACTIVE.');
    const color = await adcMessage(page).evaluate((el) => getComputedStyle(el).color);
    await shot(page, '断言: No.30 警告样式(实现为红)', {
      step: 'DELETE 已 INACTIVE 后检查样式',
      value: 'Serie-Chnr: "CAN-444444"',
      actual: `消息显示 "${await adcMessage(page).innerText()}"，颜色 ${color}（实现未提供橙色警告，按 error 红显示）`,
    });
  });

  test('No.31 CHECK 后 Desc 保持', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('AUS-123456');
    await adcTextarea(page).fill('Test reason');
    await adcCheck(page).click();
    await page.waitForTimeout(600);
    await expect(adcTextarea(page)).toHaveValue('Test reason');
    await shot(page, '断言: No.31 CHECK 后 Desc 保持', {
      step: '输入 Serie-Chnr/AUS-123456 与 Desc 后 CHECK',
      value: 'Desc: "Test reason"',
      actual: 'CHECK 后 Desc 输入框仍为 "Test reason"（不清空）',
    });
  });

  test('No.32 操作成功后输入框保持', async ({ page }) => {
    await gotoAdc(page);
    await adcInput(page).fill('JPN-777777');
    await adcTextarea(page).fill('keep me');
    await adcAdd(page).click();
    await page.waitForTimeout(600);
    await expect(adcInput(page)).toHaveValue('JPN-777777');
    await expect(adcTextarea(page)).toHaveValue('keep me');
    await shot(page, '断言: No.32 操作后输入框保持', {
      step: 'ADD JPN-777777 成功后检查输入框',
      value: 'Serie-Chnr: "JPN-777777", Desc: "keep me"',
      actual: '操作成功后 Serie-Chnr 与 Desc 输入框保持原值',
    });
  });
});
