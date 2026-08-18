/**
 * HDoc Template Check 模块 (UD13) Playwright 测试
 * --------------------------------------------
 * 对应测试式样书：react-ud/src/HDocTemplateCheck/HDocTemplateCheck_単体テスト仕様書.md
 * 对应前端：react-ud/src/HDocTemplateCheck/HDocTemplateCheck.tsx（纯前端 FileReader，无后端 API）
 * 对应测试数据：tests/hDocTemplateCheck/HDocTemplateCheck_test_data.sql（先 node seed.js）
 *
 * 【运行前提】（真实前端模式）
 * 1. 前端 dev server 已启动：http://localhost:3000
 * 2. 已执行 node tests/hDocTemplateCheck/seed.js（确保 menuall 具备 hdoc_admin 权限）
 * 3. 登录用户 menuall / Menu@123
 *
 * 【画面进入方式（真实业务链路，Menu iframe）】
 * - Menu → "Upload/Delete template" → 右侧 iframe 加载 UD12（/upload-delete-template）
 * - UD12 底部 "Check Template (Only for rtf files)" 链接：onClick preventDefault + navigate
 *   → iframe 内 SPA 跳转到 HDoc Template Check（/hdoc-template-check）
 * - 所有 UD13 元素（htc-*）通过 iframe frameLocator('.menu-iframe') 定位；
 *   跳转后 iframe 的 src 属性不变，但内容变为 HDoc Template Check（htc-header-title）。
 *
 * 【截图约定】
 * - 每个"动作/断言"叠加信息栏（操作步骤/设定值/实际结果）后截图
 * - 格式：JPEG；存放目录：tests\hDocTemplateCheck\image
 * - 命名：HDocTemplateCheck01.jpeg（01 起，全局递增）
 *
 * 【运行方式】npx playwright test tests/hDocTemplateCheck/HDocTemplateCheck.spec.ts --workers=1
 *
 * 【Skip】依赖浏览器 FileReader onerror/不支持/瞬时 loading 的用例默认 skip
 *   （No.6 取消对话框、No.17 文件读取失败、No.27 loading、No.31 无 FileReader、No.32 读取异常）。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_PASSWORD = 'Menu@123';

// ============================================================================
// 截图工具（叠加信息栏）—— 命名 HDocTemplateCheckNN.jpeg
// ============================================================================
const IMAGE_DIR = path.join(__dirname, 'image');
let screenshotCounter = 0;
function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
}
function nextCounter() {
  ensureImageDir();
  const pat = /^HDocTemplateCheck(\d+)\.jpeg$/;
  const existing = fs.readdirSync(IMAGE_DIR)
    .filter((f) => pat.test(f))
    .map((f) => parseInt((f.match(pat) || [])[1], 10) || 0);
  screenshotCounter = existing.length ? Math.max(...existing) : 0;
  return screenshotCounter + 1;
}
interface ShotInfo { step: string; value: string; actual: string; }
async function shot(page: Page, label: string, info?: ShotInfo) {
  ensureImageDir();
  const filename = `HDocTemplateCheck${String(nextCounter()).padStart(2, '0')}.jpeg`;
  if (info) {
    await page.evaluate((inf) => {
      const d = document.createElement('div');
      d.id = 'htc-shot-info';
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
    await page.evaluate(() => { document.getElementById('htc-shot-info')?.remove(); }).catch(() => {});
  }
  // eslint-disable-next-line no-console
  console.log(`[截图] ${filename} <- ${label}`);
}

// ============================================================================
// 辅助定位 / 进入（UD13 在 Menu 右侧 iframe 内）
// ============================================================================
function frame(page: Page) {
  return page.frameLocator('.menu-iframe');
}
function htcMessage(page: Page) {
  return frame(page).locator('.htc-message');
}
function htcFileInput(page: Page) {
  return frame(page).locator('.htc-file-input');
}
function htcFileSelect(page: Page, name: string, mimeType: string, buffer: Buffer) {
  return htcFileInput(page).setInputFiles({ name, mimeType, buffer });
}
function htcCheckBtn(page: Page) {
  return frame(page).locator('.htc-btn-check');
}
function htcDownloadLink(page: Page) {
  return frame(page).locator('.htc-download-link a');
}
function htcVariableInfo(page: Page) {
  return frame(page).locator('.htc-variable-info');
}

// 测试用 .rtf 文件 Buffer 工厂
function rtf(content: string) {
  return Buffer.from(content, 'utf8');
}
const odtMime = 'application/vnd.oasis.opendocument.text';
const rtfMime = 'application/rtf';
const txtMime = 'text/plain';

async function login(page: Page, userId = 'menuall') {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('User ID').fill(userId);
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/menu');
  await page.locator('.menu-loading-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
}

// 进入 UD13：Menu -> Upload/Delete template -> Check Template 链接（iframe 内跳转）
async function gotoHtc(page: Page) {
  await login(page);
  await page.getByRole('button', { name: 'Upload/Delete template' }).click();
  await expect(frame(page).locator('.udt-header-title')).toBeVisible({ timeout: 15000 });
  await frame(page).locator('.udt-check-link a').click();
  await expect(frame(page).locator('.htc-header-title')).toHaveText('HDoc - Template Check', { timeout: 15000 });
}

// ============================================================================
// Test 1：画面初期表示（No.1,2,3,4）
// ============================================================================
test.describe('画面初期表示 (UD13)', () => {
  test('No.1/2/3/4 初期表示：文件控件 / Check 按钮 / 链接隐藏 / 错误区隐藏', async ({ page }) => {
    await gotoHtc(page);
    // No.1/2 文件选择控件
    await expect(frame(page).locator('.htc-label').filter({ hasText: 'Template File' })).toBeVisible();
    await expect(htcFileInput(page)).toBeVisible();
    await expect(htcFileInput(page)).toBeEnabled();
    const accept = await htcFileInput(page).getAttribute('accept');
    expect(accept).toBe('.rtf');
    // No.3 Check 按钮
    await expect(htcCheckBtn(page)).toHaveText('Check');
    await expect(htcCheckBtn(page)).toBeEnabled();
    await shot(page, '断言: No.1/2/3 画面初期表示', {
      step: '访问 HDoc Template Check 画面',
      value: '无',
      actual: 'Template File 文件控件与 Check 按钮均正常显示（活性）',
    });
    // No.4 错误消息区默认隐藏 + 下载链接隐藏
    await expect(htcMessage(page)).toHaveCount(0);
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.4 错误区隐藏 / 下载链接隐藏', {
      step: '画面正常加载（无错误）',
      value: '无',
      actual: '错误消息区域默认隐藏；Download checked template 链接隐藏',
    });
  });
});

// ============================================================================
// Test 2：文件选择（No.5,6,7,9）
// ============================================================================
test.describe('文件选择 (UD13)', () => {
  test('No.5 选择 .rtf 文件后显示文件名', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'test_template.rtf', rtfMime, rtf('This is a $VARIABLE_NAME$ template.'));
    await expect(frame(page).locator('.htc-file-name')).toHaveText('test_template.rtf');
    await expect(htcMessage(page)).toHaveCount(0);
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.5 选择 .rtf 显示文件名', {
      step: '选择文件 test_template.rtf',
      value: 'Template File: test_template.rtf',
      actual: '控件显示文件名 test_template.rtf，无错误消息，下载链接隐藏',
    });
  });

  test('No.6 文件选择-取消选择（保持未选择）', async ({ page }) => {
    await gotoHtc(page);
    // 初始未选择任何文件
    await expect(frame(page).locator('.htc-file-name')).toHaveCount(0);
    await expect(htcFileInput(page)).toHaveValue('');
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: Unable to access file!');
    await shot(page, '断言: No.6 未选择文件状态', {
      step: '不做选择（或取消对话框），点击 Check',
      value: '无',
      actual: '控件仍为未选择状态；点 Check 报 "ERROR: Unable to access file!"',
    });
  });

  test('No.7 选择后重新选择（最新文件名替换）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'a.rtf', rtfMime, rtf('$A1$'));
    await expect(frame(page).locator('.htc-file-name')).toHaveText('a.rtf');
    await htcFileSelect(page, 'b.rtf', rtfMime, rtf('$B1$ $B2$'));
    await expect(frame(page).locator('.htc-file-name')).toHaveText('b.rtf');
    await shot(page, '断言: No.7 重新选择替换文件名', {
      step: '先选 a.rtf，再选 b.rtf',
      value: '1次目: a.rtf, 2次目: b.rtf',
      actual: '控件显示最新文件名 b.rtf，原文件被替换',
    });
  });

  test('No.9 选择 .txt 后重新选择 .rtf（清除旧消息）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'test.txt', txtMime, rtftxt('plain'));
    // 触发一次错误（点 Check -> Only .rtf 支持）
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Only .rtf files are supported.');
    await htcFileSelect(page, 'test.rtf', rtfMime, rtf('$X$'));
    await expect(frame(page).locator('.htc-file-name')).toHaveText('test.rtf');
    await expect(htcMessage(page)).toHaveCount(0);
    await shot(page, '断言: No.9 重选 .rtf 清除旧错误消息', {
      step: '先选 test.txt 触发错误，再选 test.rtf',
      value: '1次目: test.txt, 2次目: test.rtf',
      actual: '控件显示 test.rtf；前次的错误消息被清除',
    });
  });
});

function rtftxt(s: string) {
  return Buffer.from(s, 'utf8');
}

// ============================================================================
// Test 3：文件大小限制（No.8）
// ============================================================================
test.describe('文件大小限制 (UD13)', () => {
  test('No.8 文件大小超过 10MB -> 报错且未选择', async ({ page }) => {
    await gotoHtc(page);
    const big = Buffer.alloc(11 * 1024 * 1024, 65); // >10MB
    await htcFileSelect(page, 'big.rtf', rtfMime, big);
    await expect(htcMessage(page)).toHaveText('File size too large to read.');
    await expect(frame(page).locator('.htc-file-name')).toHaveCount(0);
    await expect(htcFileInput(page)).toHaveValue('');
    await shot(page, '断言: No.8 文件超过大小限制', {
      step: '选择超过 10MB 的文件',
      value: 'Template File: big.rtf（>10MB）',
      actual: '显示 "File size too large to read."，文件未被选择',
    });
  });
});

// ============================================================================
// Test 4：Check 空值校验（No.10）
// ============================================================================
test.describe('Check 空值校验 (UD13)', () => {
  test('No.10 文件未选择 -> ERROR: Unable to access file!', async ({ page }) => {
    await gotoHtc(page);
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: Unable to access file!');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.10 空值校验', {
      step: '不选择文件，点击 Check',
      value: '无',
      actual: '显示 "ERROR: Unable to access file!"，下载链接隐藏',
    });
  });
});

// ============================================================================
// Test 5：文件类型校验（No.11,12）
// ============================================================================
test.describe('Check 文件类型 (UD13)', () => {
  test('No.11 非 .rtf 文件 -> Only .rtf files are supported.', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'test.txt', txtMime, rtftxt('hello'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Only .rtf files are supported.');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.11 非 .rtf 文件类型校验', {
      step: '选择 test.txt，点击 Check',
      value: 'Template File: test.txt',
      actual: '显示 "Only .rtf files are supported."，下载链接隐藏，不读取内容',
    });
  });

  test('No.12 扩展名大小写不敏感（.RTF 通过）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'test.RTF', rtfMime, rtf('This is a $VARIABLE_NAME$ template.'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 1 variable(s) found in template.');
    await expect(htcDownloadLink(page)).toBeVisible();
    await shot(page, '断言: No.12 大小写不敏感 .RTF', {
      step: '选择 test.RTF，点击 Check',
      value: 'Template File: test.RTF（大写扩展名）',
      actual: '文件类型校验通过，正常读取并提取 1 个变量',
    });
  });
});

// ============================================================================
// Test 6：内容检查（No.13,14,15,16,18）
// ============================================================================
test.describe('Check 内容检查 (UD13)', () => {
  test('No.13 内容含 1 个变量 -> 成功消息 + 下载链接显示', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'var1.rtf', rtfMime, rtf('This is a $VARIABLE_NAME$ template.'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 1 variable(s) found in template.');
    await expect(frame(page).locator('.htc-message-success')).toBeVisible();
    await expect(htcVariableInfo(page)).toHaveText('Variables found: 1');
    await expect(htcDownloadLink(page)).toBeVisible();
    await shot(page, '断言: No.13 内容含变量成功', {
      step: '选择含 $VARIABLE_NAME$ 的 rtf，点击 Check',
      value: '内容: This is a $VARIABLE_NAME$ template.',
      actual: '显示 "Check completed. 1 variable(s) found in template."，下载链接显示',
    });
  });

  test('No.14 内容含多个变量 -> 计数 3', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'var3.rtf', rtfMime, rtf('$VAR1$ $VAR2$ $VAR3$'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 3 variable(s) found in template.');
    await expect(htcVariableInfo(page)).toHaveText('Variables found: 3');
    await shot(page, '断言: No.14 多个变量', {
      step: '选择 $VAR1$ $VAR2$ $VAR3$，点击 Check',
      value: '内容: $VAR1$ $VAR2$ $VAR3$',
      actual: '提取到 3 个变量，显示 "Check completed. 3 variable(s) found in template."',
    });
  });

  test('No.15 内容无变量 -> ERROR: The file content is incorrect!', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'plain.rtf', rtfMime, rtf('This is a plain text without variables.'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: The file content is incorrect!');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.15 无变量报错', {
      step: '选择无变量的 rtf，点击 Check',
      value: '内容: This is a plain text without variables.',
      actual: '显示 "ERROR: The file content is incorrect!"，下载链接隐藏',
    });
  });

  test('No.16 变量含数字/下划线特殊字符 -> 正常提取 2 个', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'spec.rtf', rtfMime, rtf('$VAR_123$ $TEST_NAME$'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 2 variable(s) found in template.');
    await expect(htcVariableInfo(page)).toHaveText('Variables found: 2');
    await shot(page, '断言: No.16 变量含特殊字符', {
      step: '选择 $VAR_123$ $TEST_NAME$，点击 Check',
      value: '内容: $VAR_123$ $TEST_NAME$',
      actual: '正常提取 VAR_123 与 TEST_NAME，统计 2 个变量',
    });
  });

  test('No.18 空文件（0字节）-> ERROR: The file content is incorrect!', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'empty.rtf', rtfMime, Buffer.alloc(0));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: The file content is incorrect!');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.18 空文件', {
      step: '选择空文件(.0 字节)，点击 Check',
      value: 'Template File: empty.rtf（0 字节）',
      actual: '读取内容为空，未提取到变量，报 "ERROR: The file content is incorrect!"',
    });
  });
});

// ============================================================================
// Test 7：连续检查（No.19,20,21）
// ============================================================================
test.describe('连续检查 (UD13)', () => {
  test('No.19 第一次成功 + 第二次成功（计数重算）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 't1.rtf', rtfMime, rtf('$A$ $B$ $C$'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 3 variable(s) found in template.');
    await htcFileSelect(page, 't2.rtf', rtfMime, rtf('$A$ $B$ $C$ $D$ $E$'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 5 variable(s) found in template.');
    await expect(htcVariableInfo(page)).toHaveText('Variables found: 5');
    await shot(page, '断言: No.19 连续成功', {
      step: '第一次选 3 变量，第二次选 5 变量，均点 Check',
      value: '1次目: 3変数, 2次目: 5変数',
      actual: '第二次显示 "Check completed. 5 variable(s) found in template."（计数重算）',
    });
  });

  test('No.20 第一次失败 + 第二次成功（清除旧错误）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'f1.rtf', rtfMime, rtf('no variables here'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: The file content is incorrect!');
    await htcFileSelect(page, 'f2.rtf', rtfMime, rtf('$X$ $Y$'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 2 variable(s) found in template.');
    await expect(htcDownloadLink(page)).toBeVisible();
    await shot(page, '断言: No.20 失败后成功', {
      step: '第一次选无变量(失败)，第二次选 2 变量(成功)',
      value: '1次目: 変数なし, 2次目: 2変数',
      actual: '第二次显示 "Check completed. 2 variable(s) found in template."，旧错误清除，下载链接显示',
    });
  });

  test('No.21 第一次成功 + 第二次失败（下载链接隐藏）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 's1.rtf', rtfMime, rtf('$A$ $B$ $C$'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('Check completed. 3 variable(s) found in template.');
    await expect(htcDownloadLink(page)).toBeVisible();
    await htcFileSelect(page, 's2.rtf', rtfMime, rtf('no variable'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: The file content is incorrect!');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.21 成功后失败', {
      step: '第一次选 3 变量(成功)，第二次选无变量(失败)',
      value: '1次目: 3変数, 2次目: 変数なし',
      actual: '第二次报错，download 链接隐藏',
    });
  });
});

// ============================================================================
// Test 8：Download checked template（No.22,23,24,25,26）
// ============================================================================
test.describe('Download checked template (UD13)', () => {
  test('No.22/24 检查成功后链接显示；初始隐藏', async ({ page }) => {
    await gotoHtc(page);
    // No.24 初始隐藏
    await expect(htcDownloadLink(page)).toHaveCount(0);
    // No.22 成功后显示
    await htcFileSelect(page, 'dl.rtf', rtfMime, rtf('$A$'));
    await htcCheckBtn(page).click();
    await expect(htcDownloadLink(page)).toBeVisible();
    await expect(htcDownloadLink(page)).toBeEnabled();
    await expect(htcDownloadLink(page)).toHaveText('Download checked template');
    await shot(page, '断言: No.22/24 下载链接显示', {
      step: '检查成功后查看 Download 链接',
      value: '检查成功',
      actual: 'Download checked template 链接显示且活性',
    });
  });

  test('No.23 检查失败后链接隐藏', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'fail.rtf', rtfMime, rtf('no variable'));
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: The file content is incorrect!');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.23 检查失败链接隐藏', {
      step: '选择无变量 rtf 并点 Check（失败）',
      value: '檢查失敗',
      actual: 'Download checked template 链接隐藏',
    });
  });

  test('No.25 点击下载链接触发下载（文件名一致）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'mydownload.rtf', rtfMime, rtf('$A$ $B$'));
    await htcCheckBtn(page).click();
    await expect(htcDownloadLink(page)).toBeVisible();
    // 监听下载
    const downloadPromise = page.waitForEvent('download');
    await htcDownloadLink(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('mydownload.rtf');
    await shot(page, '断言: No.25 点击下载', {
      step: '检查成功后点击 Download checked template 链接',
      value: '检查成功（2 变量）',
      actual: '触发 Blob 下载，下载文件名与原文件 mydownload.rtf 一致',
    });
  });

  test('No.26 选择新文件后下载链接隐藏（需重新 Check）', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'n1.rtf', rtfMime, rtf('$A$'));
    await htcCheckBtn(page).click();
    await expect(htcDownloadLink(page)).toBeVisible();
    await htcFileSelect(page, 'n2.rtf', rtfMime, rtf('$B$'));
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.26 重选文件链接隐藏', {
      step: '检查成功后选择新文件 n2.rtf',
      value: '檢查成功后选择新文件',
      actual: 'Download checked template 链接隐藏，需重新执行 Check',
    });
  });
});

// ============================================================================
// Test 9：UI 交互（No.28,29,30）
// ============================================================================
test.describe('UI 交互 (UD13)', () => {
  test('No.28 错误消息红色显示 (#ff4d4f)', async ({ page }) => {
    await gotoHtc(page);
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: Unable to access file!');
    await expect(frame(page).locator('.htc-message-error')).toBeVisible();
    const color = await frame(page).locator('.htc-message-error').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(255, 77, 79)'); // #ff4d4f
    await shot(page, '断言: No.28 错误消息红色', {
      step: '触发校验错误',
      value: '无',
      actual: '错误消息以红色 #ff4d4f 显示',
    });
  });

  test('No.29 成功消息绿色显示 (#52c41a)', async ({ page }) => {
    await gotoHtc(page);
    await htcFileSelect(page, 'ok.rtf', rtfMime, rtf('$A$'));
    await htcCheckBtn(page).click();
    await expect(frame(page).locator('.htc-message-success')).toBeVisible();
    const color = await frame(page).locator('.htc-message-success').evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(82, 196, 26)'); // #52c41a
    await shot(page, '断言: No.29 成功消息绿色', {
      step: '检查成功',
      value: '檢查成功',
      actual: '成功消息以绿色 #52c41a 显示',
    });
  });

  test('No.30 选择新文件清除旧消息，恢复初始状态', async ({ page }) => {
    await gotoHtc(page);
    await htcCheckBtn(page).click();
    await expect(htcMessage(page)).toHaveText('ERROR: Unable to access file!');
    await htcFileSelect(page, 'reset.rtf', rtfMime, rtf('$A$'));
    await expect(htcMessage(page)).toHaveCount(0);
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.30 选新文件清除旧消息', {
      step: '触发错误后选择新文件',
      value: '无',
      actual: '选择新文件时旧错误消息被清除，画面恢复初始状态',
    });
  });
});

// ============================================================================
// Test 10：异常处理（No.33 可测；No.17/31/32 依赖 FileReader 异常 mock -> skip）
// ============================================================================
test.describe('异常处理 (UD13)', () => {
  test('No.33 二进制不可读内容 -> 无变量则报错', async ({ page }) => {
    await gotoHtc(page);
    // 二进制字节无 $...$ 可读文本变量（含乱码，无合法变量对）
    const bin = Buffer.from([0xff, 0x00, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await htcFileSelect(page, 'bin.rtf', rtfMime, bin);
    await htcCheckBtn(page).click();
    // 读取为文本后无 $...$ 变量 -> 报内容错误
    await expect(htcMessage(page)).toHaveText('ERROR: The file content is incorrect!');
    await expect(htcDownloadLink(page)).toHaveCount(0);
    await shot(page, '断言: No.33 二进制内容', {
      step: '选择内容为二进制格式的 .rtf，点击 Check',
      value: 'Template File: bin.rtf（二进制）',
      actual: '未提取到变量，显示 "ERROR: The file content is incorrect!"',
    });
  });

  test.skip('Skip: No.17 文件读取失败 / No.31 浏览器不支持 FileReader / No.32 读取异常（依赖 mock）', async () => {
    expect(true).toBeTruthy();
  });
});
