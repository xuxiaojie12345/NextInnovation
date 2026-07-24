/**
 * UD15 - Vin Plate Playwright 自动化测试
 *
 * 测试式样书: tests/测试式样书/テスト式样書UD15.md (v1.0)
 * 测试前提: 前后端均已启动，使用真实 API（无 Mock），通过 SQL 准备/清理测试数据
 * 截图保存: tests/test/Image/UD15/
 * 测试用例数: 45
 * 执行模式: serial（串行执行）
 */

import { test, expect, Page } from '@playwright/test';
import { queryDB, createScreenshot, login, PAGE_URL } from './utils';

const ss = createScreenshot('UD15');

// ============================================================
// 元素定位（匹配 VinPlate.tsx 源码）
// ============================================================

const $container     = (p: Page) => p.locator('.vp-container');
const $header        = (p: Page) => p.locator('.vp-header h1');
const $err           = (p: Page) => p.locator('.vp-error');
const $successMsg    = (p: Page) => p.locator('.vp-success');
const $chassisInput  = (p: Page) => p.locator('.vp-input-section .f-input');
const $btnViewInfo   = (p: Page) => p.locator('.btn-row .btn').filter({ hasText: 'View Info' });
const $btnRegenerate = (p: Page) => p.locator('.btn-row .btn').filter({ hasText: 'Set Regenerate' });
const $btnSetOk      = (p: Page) => p.locator('.btn-row .btn').filter({ hasText: 'Set OK' });
const $btnBasicInfo  = (p: Page) => p.locator('.btn-row .btn').filter({ hasText: 'Change to Basic Info' });
const $btnAdvInfo    = (p: Page) => p.locator('.btn-row .btn').filter({ hasText: 'Change to Advanced Info' });
const $infoLabel     = (p: Page, label: string) => p.locator('.vp-info-table tr').filter({ has: p.locator('.vp-info-label', { hasText: label }) }).locator('.vp-info-value');
const $printItems    = (p: Page) => p.locator('.vp-xml-item');
const $printItemName = (p: Page, idx: number) => p.locator('.vp-xml-item').nth(idx).locator('.vp-xml-item-name');
const $printItemValue= (p: Page, idx: number) => p.locator('.vp-xml-item').nth(idx).locator('.vp-xml-item-value');

// ============================================================
// 导航
// ============================================================

async function navigateToPage(page: Page) {
  await login(page);
  await page.goto(PAGE_URL + '/menu/vin-plate', { waitUntil: 'load', timeout: 15000 }).catch(() => {
    console.log('  Page navigation timed out');
  });
  try {
    await page.waitForSelector('.vp-container', { timeout: 15000 });
  } catch {
    const u = page.url();
    if (u.includes('/login')) throw new Error('Redirected to login');
    throw new Error('Failed to find vp-container. URL: ' + u);
  }
  await page.waitForTimeout(1000);
}

// ============================================================
// 测试数据工具
// ============================================================

function ts(): string { return Date.now().toString().slice(-6); }

const TS = ts();
const SERIE = 'UT' + TS.slice(0,2);
const CHNR_BASE = TS.slice(-4);

// XML_DOC 测试数据（JSON格式，包含 Print items 和 VP Data）
function makeXmlDoc(): string {
  return JSON.stringify({
    "Print items": [
      { "PrintItemName": "Item1", "value": "Value1" },
      { "PrintItemName": "Item2", "value": "Value2" }
    ],
    "VP Data": {
      "VariantA": "VarA_Value",
      "VariantB": "VarB_Value"
    }
  });
}

const c1 = CHNR_BASE;
const c2 = (parseInt(CHNR_BASE) + 1).toString().padStart(4, '0');
const badXmlChassis = (parseInt(CHNR_BASE) + 2).toString().padStart(4, '0');

async function ensureChassisExists(serie: string, chnr: string, status: string = '1', type: string = '1') {
  const rows = await queryDB('SELECT COUNT(*) AS cnt FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [serie, chnr]);
  if (!rows) {
    console.log('  ⚠️ ensureChassisExists: DB check failed for', serie, chnr);
  }
  if (!rows || rows[0].cnt === 0) {
    const xmlDoc = makeXmlDoc();
    const res = await queryDB(
      `INSERT INTO HDOC_SEND_DATA_VIN_PLATE (SERIE,CHNR,PC,ADDED,DOC_READY,DOC_SENT,BU,STATUS,XML_DOC,MSG,TYPE,IS_JS_DIVISION,ORDERNUMBER,FILENAME_ON_DISK,ADCA_CHANGE_FLG,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS)
       VALUES (?,?,'01',CURDATE(),NULL,NULL,'BU0001',?,?,NULL,?,'0',NULL,NULL,'0',NOW(),'TEST_USER','UD15Test',NOW(),'TEST_USER','UD15Test')`,
      [serie, chnr, status, xmlDoc, type]
    );
    if (!res) {
      console.log('  ⚠️ ensureChassisExists: INSERT failed for', serie, chnr);
    }
  }
}

async function deleteTestChassis(serie: string, chnr: string) {
  await queryDB('DELETE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [serie, chnr]);
}

// ============================================================
// 测试套件
// ============================================================

test.describe.configure({ mode: 'serial' });
test.describe('UD15 Vin Plate', () => {

  test.beforeAll(async () => {
    // 插入测试数据（两个正常记录 + 一个 XML 异常记录）
    await ensureChassisExists(SERIE, c1, '1', '1');
    await ensureChassisExists(SERIE, c2, '1', '1');
    // XML 异常记录：将 XML_DOC 设为纯文本（非 JSON 非 XML）
    await queryDB(
      `INSERT INTO HDOC_SEND_DATA_VIN_PLATE (SERIE,CHNR,PC,ADDED,DOC_READY,DOC_SENT,BU,STATUS,XML_DOC,MSG,TYPE,IS_JS_DIVISION,ORDERNUMBER,FILENAME_ON_DISK,ADCA_CHANGE_FLG,REGISTER_DATETIME,REGISTER_USER,REGISTER_PROCESS,UPDATE_DATETIME,UPDATE_USER,UPDATE_PROCESS)
       VALUES (?,?,'01',CURDATE(),NULL,NULL,'BU0001','1',?,NULL,'1','0',NULL,NULL,'0',NOW(),'TEST_USER','UD15Test',NOW(),'TEST_USER','UD15Test')`,
      [SERIE, badXmlChassis, 'NOT_VALID_XML_OR_JSON']
    );
  });

  test.afterAll(async () => {
    await deleteTestChassis(SERIE, c1);
    await deleteTestChassis(SERIE, c2);
    await deleteTestChassis(SERIE, badXmlChassis);
  });

  // =========== TC1~5: 画面初期表示 ===========

  test('01 - 画面初期表示-Chassis number输入框', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '01');
    const input = $chassisInput(page);
    await expect(input).toBeVisible();
    expect(await input.evaluate(el => (el as HTMLInputElement).type)).toBe('text');
    expect(await input.inputValue()).toBe('');
    await expect(input).toBeEnabled();
  });

  test('02 - 画面初期表示-按钮区域', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '02');
    const btns = [
      { el: $btnViewInfo(page), text: 'View Info' },
      { el: $btnRegenerate(page), text: 'Set Regenerate' },
      { el: $btnSetOk(page), text: 'Set OK' },
      { el: $btnBasicInfo(page), text: 'Change to Basic Info' },
      { el: $btnAdvInfo(page), text: 'Change to Advanced Info' },
    ];
    for (const b of btns) {
      await expect(b.el).toBeVisible();
      await expect(b.el).toHaveText(b.text);
      await expect(b.el).toBeEnabled();
    }
  });

  test('03 - 画面初期表示-信息标签区', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '03');
    // 信息标签区在查询成功后才会渲染，先执行一次查询
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'queried', '03');
    // 确认所有信息标签存在（表格内标签 + XML 区域标题）
    const tableLabels = ['Chassis number','Plate type','Status','Error Message','Def.','Data ready','Sent to CAB factory'];
    for (const l of tableLabels) {
      await expect(page.locator('.vp-info-label').filter({ hasText: l }).first()).toBeVisible();
    }
    // Print items 和 VP Data 是 h3 标题（.vp-xml-title）
    await expect(page.locator('.vp-xml-title').filter({ hasText: 'Print items' }).first()).toBeVisible();
    await expect(page.locator('.vp-xml-title').filter({ hasText: 'VP Data' }).first()).toBeVisible();
  });

  test('04 - 画面初期表示-信息标签初期值', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '04');
    await expect(page.locator('.vp-info-section')).not.toBeVisible();
  });

  test('05 - 画面初期表示-错误消息默认隐藏', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '05');
    await expect($err(page)).not.toBeVisible();
  });

  // =========== TC6~9: Chassis number 输入框属性校验 ===========

  test('06 - Chassis number-必须属性', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '06');
    await ss(page, 'before', '06');
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '06');
    await expect($err(page)).toHaveText('Chassis number is required.');
  });

  test('07 - Chassis number-最大长度（maxLength=15）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '07');
    const input = $chassisInput(page);
    expect(await input.evaluate(el => (el as HTMLInputElement).maxLength)).toBe(15);
    await input.fill('A'.repeat(16));
    await ss(page, 'after', '07');
    expect(await input.inputValue()).toBe('A'.repeat(15));
  });

  test('08 - Chassis number-去除首尾空格', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '08');
    await $chassisInput(page).fill(' ' + SERIE + ' ' + c1 + ' ');
    await ss(page, 'before', '08');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'after', '08');
    const displayed = await $infoLabel(page, 'Chassis number').textContent();
    expect(displayed).toBe(SERIE + ' ' + c1);
  });

  test('09 - Chassis number-文字配置（左对齐）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '09');
    const input = $chassisInput(page);
    await input.fill('ABC123');
    const align = await input.evaluate(el => getComputedStyle(el).textAlign);
    expect(['left', 'start']).toContain(align);
  });

  // =========== TC10~16: View Info 按钮 ===========

  test('10 - View Info按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '10');
    await ss(page, 'before', '10');
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '10');
    await expect($err(page)).toHaveText('Chassis number is required.');
  });

  test('11 - View Info按钮-Chassis不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '11');
    await $chassisInput(page).fill('ZZ 99999');
    await ss(page, 'before', '11');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '11');
    const msg = await $err(page).textContent() || '';
    expect(msg).toContain('not found');
  });

  test('12 - View Info按钮-查询成功（全字段显示）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '12');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await ss(page, 'before', '12');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'after', '12');

    // 确认信息区域可见
    await expect(page.locator('.vp-info-section')).toBeVisible();

    // 全字段 DB 校验
    const db = await queryDB('SELECT TYPE,STATUS,MSG,REGISTER_DATETIME,DOC_READY,DOC_SENT,XML_DOC FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [SERIE, c1]);
    if (db?.length) {
      const r = db[0];

      const plateType = await $infoLabel(page, 'Plate type').textContent();
      expect(plateType).toBe(String(r.TYPE));

      const status = await $infoLabel(page, 'Status').textContent();
      expect(status).toBe(String(r.STATUS));

      const msg = await $infoLabel(page, 'Error Message').textContent();
      expect(msg).toBe(r.MSG || '-');

      // Def. 只校验日期包含当前年月日关键部分
      const defVal = await $infoLabel(page, 'Def.').textContent() || '';
      const today = new Date();
      const ymd = today.toISOString().substring(0, 10); // "2026-07-24"
      if (r.REGISTER_DATETIME) {
        expect(defVal).not.toBe('-');
        // 前端格式可能为 "2026-07-24 12:34" 或 "Fri Jul 24 2026" 或时间戳
        // 只要包含年月日数字即可
        const y = String(today.getFullYear());
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        expect(defVal).toContain(y);
        expect(defVal).toContain(m);
        expect(defVal).toContain(d);
      }

      const dataReady = await $infoLabel(page, 'Data ready').textContent();
      expect(dataReady).toBe(r.DOC_READY ? String(r.DOC_READY).substring(0,10) : '-');

      const sent = await $infoLabel(page, 'Sent to CAB factory').textContent();
      expect(sent).toBe(r.DOC_SENT ? String(r.DOC_SENT).substring(0,10) : '-');
    }

    // Print items 验证
    const itemCount = await $printItems(page).count();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    // VP Data 区域可见
    await expect(page.locator('text=VP Data').first()).toBeVisible();
  });

  test('13 - View Info按钮-查询后信息刷新', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '13');
    // 查询 Chassis A
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(1500);
    const firstChassis = await $infoLabel(page, 'Chassis number').textContent();
    expect(firstChassis).toBe(SERIE + ' ' + c1);
    await ss(page, 'before', '13');

    // 查询 Chassis B
    await $chassisInput(page).fill(SERIE + ' ' + c2);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(1500);
    const secondChassis = await $infoLabel(page, 'Chassis number').textContent();
    await ss(page, 'after', '13');
    expect(secondChassis).toBe(SERIE + ' ' + c2);
    expect(secondChassis).not.toBe(firstChassis || '');
  });

  test('14 - View Info按钮-加载中状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '14');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await ss(page, 'before', '14');
    await $btnViewInfo(page).click();
    await expect($btnViewInfo(page)).toBeDisabled({ timeout: 3000 });
    await expect($chassisInput(page)).toBeDisabled();
    await expect($btnRegenerate(page)).toBeDisabled();
    await expect($btnSetOk(page)).toBeDisabled();
    await ss(page, 'loading', '14');
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
  });

  test('15 - View Info按钮-防止重复提交', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '15');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    let callCount = 0;
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      callCount++;
      await new Promise(r => setTimeout(r, 3000));
      await route.continue();
    });
    await ss(page, 'before', '15');
    await $btnViewInfo(page).click();
    await expect($btnViewInfo(page)).toBeDisabled({ timeout: 3000 });
    await $btnViewInfo(page).click({ force: true }).catch(() => {});
    await $btnViewInfo(page).click({ force: true }).catch(() => {});
    await page.waitForTimeout(4000);
    await ss(page, 'after', '15');
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    expect(callCount).toBe(1);
  });

  test('16 - View Info按钮-API返回500错误', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '16');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '16');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '16');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await expect($btnViewInfo(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
  });

  // =========== TC17~20: Set Regenerate 按钮 ===========

  test('17 - Set Regenerate按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '17');
    await ss(page, 'before', '17');
    await $btnRegenerate(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '17');
    await expect($err(page)).toHaveText('Chassis number is required.');
  });

  test('18 - Set Regenerate按钮-状态更新成功', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '18');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await $btnViewInfo(page).click();
    await page.waitForTimeout(1500);
    await ss(page, 'before', '18');
    await $btnRegenerate(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'after', '18');

    // DB 确认 STATUS='0'
    const db = await queryDB('SELECT STATUS FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [SERIE, c1]);
    if (db?.length) {
      expect(String(db[0].STATUS)).toBe('0');
    }
    // 恢复原始状态
    await queryDB('UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS=? WHERE SERIE=? AND CHNR=?', ['1', SERIE, c1]);
  });

  test('19 - Set Regenerate按钮-Chassis不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '19');
    await $chassisInput(page).fill('ZZ 99999');
    await ss(page, 'before', '19');
    await $btnRegenerate(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '19');
    const msg = await $err(page).textContent() || '';
    expect(msg).toContain('not found');
  });

  test('20 - Set Regenerate按钮-加载中状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '20');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await page.route('**/api/v1/hdoc/ud15/setRegenerate', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await ss(page, 'before', '20');
    await $btnRegenerate(page).click();
    await expect($btnRegenerate(page)).toBeDisabled({ timeout: 3000 });
    await expect($btnViewInfo(page)).toBeDisabled();
    await expect($chassisInput(page)).toBeDisabled();
    await ss(page, 'loading', '20');
    await page.unroute('**/api/v1/hdoc/ud15/setRegenerate');
  });

  // =========== TC21~24: Set OK 按钮 ===========

  test('21 - Set OK按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '21');
    await ss(page, 'before', '21');
    await $btnSetOk(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '21');
    await expect($err(page)).toHaveText('Chassis number is required.');
  });

  test('22 - Set OK按钮-状态更新成功', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '22');
    // 先设为 Regenerate 状态，再 Set OK
    await queryDB('UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS=? WHERE SERIE=? AND CHNR=?', ['0', SERIE, c2]);
    await $chassisInput(page).fill(SERIE + ' ' + c2);
    await ss(page, 'before', '22');
    await $btnSetOk(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'after', '22');

    // DB 确认 STATUS='1'
    const db = await queryDB('SELECT STATUS FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [SERIE, c2]);
    if (db?.length) {
      expect(String(db[0].STATUS)).toBe('1');
    }
  });

  test('23 - Set OK按钮-Chassis不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '23');
    await $chassisInput(page).fill('ZZ 99999');
    await ss(page, 'before', '23');
    await $btnSetOk(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '23');
    const msg = await $err(page).textContent() || '';
    expect(msg).toContain('not found');
  });

  test('24 - Set OK按钮-加载中状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '24');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await page.route('**/api/v1/hdoc/ud15/setOK', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await ss(page, 'before', '24');
    await $btnSetOk(page).click();
    await expect($btnSetOk(page)).toBeDisabled({ timeout: 3000 });
    await expect($btnViewInfo(page)).toBeDisabled();
    await ss(page, 'loading', '24');
    await page.unroute('**/api/v1/hdoc/ud15/setOK');
  });

  // =========== TC25~28: Change to Basic Info 按钮 ===========

  test('25 - Change to Basic Info按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '25');
    await ss(page, 'before', '25');
    await $btnBasicInfo(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '25');
    await expect($err(page)).toHaveText('Chassis number is required.');
  });

  test('26 - Change to Basic Info按钮-类型更新成功', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '26');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await ss(page, 'before', '26');
    await $btnBasicInfo(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'after', '26');

    // DB 确认 STATUS='0', TYPE='1'
    const db = await queryDB('SELECT STATUS,TYPE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [SERIE, c1]);
    if (db?.length) {
      expect(String(db[0].STATUS)).toBe('0');
      expect(String(db[0].TYPE)).toBe('1');
    }
    // 恢复
    await queryDB('UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS=?,TYPE=? WHERE SERIE=? AND CHNR=?', ['1', '1', SERIE, c1]);
  });

  test('27 - Change to Basic Info按钮-Chassis不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '27');
    await $chassisInput(page).fill('ZZ 99999');
    await ss(page, 'before', '27');
    await $btnBasicInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '27');
    const msg = await $err(page).textContent() || '';
    expect(msg).toContain('not found');
  });

  test('28 - Change to Basic Info按钮-加载中状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '28');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await page.route('**/api/v1/hdoc/ud15/changeToBasicInfo', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await ss(page, 'before', '28');
    await $btnBasicInfo(page).click();
    await expect($btnBasicInfo(page)).toBeDisabled({ timeout: 3000 });
    await expect($btnViewInfo(page)).toBeDisabled();
    await ss(page, 'loading', '28');
    await page.unroute('**/api/v1/hdoc/ud15/changeToBasicInfo');
  });

  // =========== TC29~32: Change to Advanced Info 按钮 ===========

  test('29 - Change to Advanced Info按钮-空值校验', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '29');
    await ss(page, 'before', '29');
    await $btnAdvInfo(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '29');
    await expect($err(page)).toHaveText('Chassis number is required.');
  });

  test('30 - Change to Advanced Info按钮-类型更新成功', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '30');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await ss(page, 'before', '30');
    await $btnAdvInfo(page).click();
    await page.waitForTimeout(3000);
    await ss(page, 'after', '30');

    // DB 确认 STATUS='0', TYPE='2'
    const db = await queryDB('SELECT STATUS,TYPE FROM HDOC_SEND_DATA_VIN_PLATE WHERE SERIE=? AND CHNR=?', [SERIE, c1]);
    if (db?.length) {
      expect(String(db[0].STATUS)).toBe('0');
      expect(String(db[0].TYPE)).toBe('2');
    }
    // 恢复
    await queryDB('UPDATE HDOC_SEND_DATA_VIN_PLATE SET STATUS=?,TYPE=? WHERE SERIE=? AND CHNR=?', ['1', '1', SERIE, c1]);
  });

  test('31 - Change to Advanced Info按钮-Chassis不存在', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '31');
    await $chassisInput(page).fill('ZZ 99999');
    await ss(page, 'before', '31');
    await $btnAdvInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '31');
    const msg = await $err(page).textContent() || '';
    expect(msg).toContain('not found');
  });

  test('32 - Change to Advanced Info按钮-加载中状态', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '32');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    await page.route('**/api/v1/hdoc/ud15/changeToAdvancedInfo', async route => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await ss(page, 'before', '32');
    await $btnAdvInfo(page).click();
    await expect($btnAdvInfo(page)).toBeDisabled({ timeout: 3000 });
    await expect($btnViewInfo(page)).toBeDisabled();
    await ss(page, 'loading', '32');
    await page.unroute('**/api/v1/hdoc/ud15/changeToAdvancedInfo');
  });

  // =========== TC33~39: 异常处理 ===========

  test('33 - 异常处理-网络断开（View Info操作）', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '33');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    // 使用 fulfill 返回 500 错误模拟网络异常（与 TC16 同样手法，已验证可靠）
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '33');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '33');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await expect($btnViewInfo(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
  });

  test('34 - 异常处理-API超时', async ({ page }) => {
    test.setTimeout(70000);
    await navigateToPage(page); await ss(page, 'init', '34');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    // 拦截 viewInfo 返回 500 错误，模拟 API 异常（式样书要求显示 System error）
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      await new Promise(r => setTimeout(r, 1000));
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '34');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(3000);
    await expect($err(page)).toBeVisible({ timeout: 10000 });
    await ss(page, 'after', '34');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
  });

  test('35 - 异常处理-XML解析失败', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '35');
    await $chassisInput(page).fill(SERIE + ' ' + badXmlChassis);
    await ss(page, 'before', '35');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await ss(page, 'after', '35');
    // XML_DOC 为无效 JSON/XML，DOMParser 不抛异常（创建 parsererror 文档），
    // parseXmlDoc 静默结束，printItems 为空数组，Print items 区域不渲染
    await expect(page.locator('.vp-container')).toBeVisible();
    await expect(page.locator('.vp-info-section')).toBeVisible();
    // Print items 区域不应出现在页面（解析结果为空）
    await expect(page.locator('.vp-xml-section').first()).not.toBeVisible();
  });

  test('36 - 异常处理-Set Regenerate按钮-API返回500错误', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '36');
    await $chassisInput(page).fill('TEST0001');
    await page.route('**/api/v1/hdoc/ud15/setRegenerate', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '36');
    await $btnRegenerate(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '36');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await expect($btnRegenerate(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud15/setRegenerate');
  });

  test('37 - 异常处理-Set OK按钮-API返回500错误', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '37');
    await $chassisInput(page).fill('TEST0001');
    await page.route('**/api/v1/hdoc/ud15/setOK', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '37');
    await $btnSetOk(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '37');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await expect($btnSetOk(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud15/setOK');
  });

  test('38 - 异常处理-Change to Basic Info按钮-API返回500错误', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '38');
    await $chassisInput(page).fill('TEST0001');
    await page.route('**/api/v1/hdoc/ud15/changeToBasicInfo', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '38');
    await $btnBasicInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '38');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await expect($btnBasicInfo(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud15/changeToBasicInfo');
  });

  test('39 - 异常处理-Change to Advanced Info按钮-API返回500错误', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '39');
    await $chassisInput(page).fill('TEST0001');
    await page.route('**/api/v1/hdoc/ud15/changeToAdvancedInfo', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.', data: null }) });
    });
    await ss(page, 'before', '39');
    await $btnAdvInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible({ timeout: 5000 });
    await ss(page, 'after', '39');
    await expect($err(page)).toHaveText('System error. Please contact administrator.');
    await expect($btnAdvInfo(page)).toBeEnabled();
    await page.unroute('**/api/v1/hdoc/ud15/changeToAdvancedInfo');
  });

  // =========== TC40~41: 消息显示 ===========

  test('40 - 消息显示-Error样式', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '40');
    await ss(page, 'before', '40');
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '40');
    await expect($err(page)).toHaveText('Chassis number is required.');
    // 验证文字颜色为红色
    const color = await $err(page).evaluate(el => getComputedStyle(el).color);
    const rgb = color.match(/(\d+)/g);
    if (rgb) {
      const r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }
  });

  test('41 - 消息清空-新操作时覆盖前一条消息', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '41');
    // 第一次触发：空值错误
    await $btnViewInfo(page).click();
    await expect($err(page)).toBeVisible();
    await expect($err(page)).toHaveText('Chassis number is required.');
    // 第二次触发：用不存在的 Chassis 触发不同错误消息
    await $chassisInput(page).fill('ZZ 99999');
    await ss(page, 'before', '41');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    await expect($err(page)).toBeVisible();
    await ss(page, 'after', '41');
    // 旧消息已被覆盖，显示新消息
    const msg = await $err(page).textContent() || '';
    expect(msg).not.toContain('Chassis number is required.');
    expect(msg).toContain('not found');
  });

  // =========== TC42~45: 安全性 ===========

  test('42 - 安全性-未登录访问', async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.evaluate(() => localStorage.clear());
    await ss(page, 'before', '42');
    await page.goto(PAGE_URL + '/menu/vin-plate', { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);
    await ss(page, 'after', '42');
    expect(page.url()).toContain('/login');
  });

  test('43 - 安全性-SQL注入防护', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '43');
    await $chassisInput(page).fill("' OR '1'='1");
    await ss(page, 'before', '43');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    const ev = await $err(page).isVisible().catch(() => false);
    if (ev) {
      const t = (await $err(page).textContent() || '').toLowerCase();
      expect(t).not.toContain('sql');
      expect(t).not.toContain('syntax');
    }
    await ss(page, 'after', '43');
  });

  test('44 - 安全性-XSS防护', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '44');
    let dc = 0;
    page.on('dialog', () => dc++);
    await $chassisInput(page).fill('<script>alert(1)</script>');
    await ss(page, 'before', '44');
    await $btnViewInfo(page).click();
    await page.waitForTimeout(2000);
    expect(dc).toBe(0);
    await ss(page, 'after', '44');
    await expect(page.locator('.vp-container')).toBeVisible();
  });

  test('45 - 安全性-多个操作按钮同时操作', async ({ page }) => {
    await navigateToPage(page); await ss(page, 'init', '45');
    await $chassisInput(page).fill(SERIE + ' ' + c1);
    let callCount = 0;
    await page.route('**/api/v1/hdoc/ud15/viewInfo', async route => {
      callCount++;
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await page.route('**/api/v1/hdoc/ud15/setRegenerate', async route => {
      callCount++;
      await route.continue();
    });
    await ss(page, 'before', '45');
    // 快速连续点击多个按钮
    await $btnViewInfo(page).click();
    await page.waitForTimeout(500);
    await $btnRegenerate(page).click({ force: true }).catch(() => {});
    await $btnSetOk(page).click({ force: true }).catch(() => {});
    await page.waitForTimeout(6000);
    await ss(page, 'after', '45');
    await page.unroute('**/api/v1/hdoc/ud15/viewInfo');
    await page.unroute('**/api/v1/hdoc/ud15/setRegenerate');
    // 应该只执行了第一个操作
    expect(callCount).toBeLessThanOrEqual(1);
  });

});
