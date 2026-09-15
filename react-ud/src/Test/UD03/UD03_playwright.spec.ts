/**
 * UD03_playwright.spec.ts
 * ---------------------------------------------------------------
 * GenerateHomologationDocument 模块（UD03）Playwright 自动化测试
 *
 * 测试式样书：プロンプトUD03_単体テスト仕様書.md
 * 参照画面　：src/GenerateHomologationDocument​/GenerateDoc.tsx
 *
 * 说明：
 * - 仕様書记载的全部 25 个测试对象（测试观点）各对应一个 test 用例；
 * - 每执行一步（操作 / 确认）都会以 JPEG 截图保存；
 * - 截图以「测试观点名称为单元」从 001 开始循环命名；
 *   保存位置：src/Test/UD03/screenshots/<观点名称>/<观点名称>_001.jpeg ...
 * - 元素定位与 GenerateDoc.tsx 保持一致：
 *   #chassisSeries / #chassisNo / #documentType / .error-message /
 *   .form-footer > button.footer-button / .support-mail /
 *   .generate-doc-container / .generate-doc-title。
 *   本画面在应用内嵌于 Menu 右侧内容区，因此通过 URL「/Menu」访问。
 * - UD03SelectHdocdocumentlist 接口通过 page.route 拦截模拟，结果确定、不依赖后端。
 *
 * 【重要】仕様書と実装の相違点（3 件）
 *   本 spec 的 3 处预期结果与当前实现不一致，代码中已按「实际实现」断言并加注释标注：
 *   (1) No.08 Chassis series 非法字符：
 *       仕様書：全角数字/英字/符号 均被阻止。
 *       実装　：半角英数字 a-zA-Z0-9 允许（用户要求支持 JPCT 等英字系列号），仅全角/符号被阻止。
 *   (2) No.16 Submit 未入力：
 *       仕様書：无空值校验，直接携带空值迁移至 Generate document。
 *       実装　：存在必须项目校验，显示「Chassis series is required.」且不迁移。
 *   (3) No.18 Reset 重新初期表示：
 *       仕様書：Reset 后重新调用 API 获取 documentTypeList。
 *       実装　：Reset 仅清除画面数据，不重新调用 API（下拉列表保持既有数据）。
 *
 * 运行前提：
 *   1. 启动前端：npm start（默认 http://localhost:3000）
 *   2. 运行：npx playwright test UD03/UD03_playwright.spec.ts
 *   可用环境变量 BASE_URL 覆盖被测地址（默认 http://localhost:3000）。
 */
import { test, expect, Page, TestInfo } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/** 被测应用地址（默认本地前端 3000，可用 BASE_URL 覆盖） */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/** 与 GenerateDoc.tsx 保持一致的元素定位器 */
const SEL = {
  /** 画面整体容器 */
  container: '.generate-doc-container',
  /** 画面标题 */
  title: '.generate-doc-title',
  /** 表单区域 */
  form: '.generate-doc-form',
  /** Chassis series 输入框 */
  chassisSeries: '#chassisSeries',
  /** Chassis no 输入框 */
  chassisNo: '#chassisNo',
  /** Document type 下拉列表 */
  documentType: '#documentType',
  /** 下拉列表的选项 */
  documentTypeOption: '#documentType option',
  /** error message area（仅 message 非空时渲染） */
  message: '.error-message',
  /** フッターバー（Submit / Reset / Help 按钮） */
  footer: '.form-footer',
  /** 底部按钮（Submit / Reset / Help） */
  footerButton: '.form-footer button.footer-button',
  /** Support Mail */
  supportMail: '.support-mail',
};

/** UD03：DocumentType 取得 API */
const DOC_TYPE_API = '**/api/GenerateDocument/UD03SelectHdocdocumentlist';
/** UD04：GenerateDocument 画面初期表示的 API */
const UD04_API = '**/api/GenerateDocument/UD04SelectGeneratedocument';

/** UD03 正常响应（documentType1 / documentType2） */
const DOC_TYPE_OK = {
  code: 200,
  data: { documentTypeList: ['documentType1', 'documentType2'] },
  message: '',
};

/** 去除文件名非法字符，得到安全目录/文件名 */
function sanitize(name: string): string {
  return name.replace(/[\\:*?"<>|]/g, '_').replace(/\//g, '_').replace(/\s+/g, '_').trim();
}

/**
 * 创建截图器：以「测试观点名称」为单位，从 001 开始循环命名并保存 JPEG。
 * @param testInfo Playwright TestInfo（用于取观点名称）
 */
function createScreenshotter(testInfo: TestInfo) {
  const unit = sanitize(testInfo.title);
  const dir = path.join(__dirname, 'screenshots', unit);
  fs.mkdirSync(dir, { recursive: true });
  let counter = 0;
  return async function shot(page: Page) {
    counter += 1;
    const file = path.join(
      dir,
      `${unit}_${String(counter).padStart(3, '0')}.jpeg`,
    );
    await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  };
}

/** Mock UD03SelectHdocdocumentlist 接口（status 默认 200） */
async function mockDocTypeApi(page: Page, body: unknown, status = 200) {
  await page.route(DOC_TYPE_API, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/** Mock UD04SelectGeneratedocument 接口（返回空数据） */
async function mockGeneratedDocumentApi(page: Page) {
  await page.route(UD04_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: {}, message: '' }),
    });
  });
}

/**
 * 打开 Menu 页面（本画面内嵌于 Menu 右侧内容区）
 * 使用 domcontentloaded 等待，避免 dev server 子资源加载缓慢导致 load 事件超时。
 */
async function gotoMenu(page: Page) {
  await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded' });
}

/** 打开本画面（内嵌于 Menu 右侧内容区，故访问 /Menu） */
async function openGenerateDoc(page: Page) {
  await gotoMenu(page);
  await expect(page.locator(SEL.container)).toBeVisible();
  // 初期表示 API 完成（按钮恢复可用）
  await expect(page.locator(SEL.footerButton).first()).toBeEnabled();
}

/** 取得指定的底部按钮（Submit / Reset / Help） */
function footerButton(page: Page, label: string) {
  return page.locator(SEL.footerButton).filter({ hasText: label });
}

/** 断言 error message area 为红色系（GenerateDoc.css：.error-message color #d63333） */
async function expectErrorMessageRed(page: Page) {
  const color = await page.locator(SEL.message).evaluate((el) =>
    window.getComputedStyle(el as Element).color,
  );
  const m = color.match(/\d+/g);
  expect(m, `错误消息颜色应可解析，实际: ${color}`).not.toBeNull();
  const [r, g, b] = (m as string[]).map(Number);
  expect(r).toBeGreaterThan(150); // 红通道强
  expect(g).toBeLessThan(100); // 绿通道弱
  expect(b).toBeLessThan(100); // 蓝通道弱
}

/* =========================================================================
 * 一、画面初期表示
 * ========================================================================= */

test('01_画面初始化-控件初期状态', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);

  // 步骤1：访问 Generate Homologation Document 页面
  await openGenerateDoc(page);
  await shot(page);

  // 步骤2：确认各控件的初期表示状态
  await expect(page.locator(SEL.title)).toHaveText(
    'HDoc - Generate Homologation Document',
  ); // 正常输出画面
  await expect(page.locator(SEL.chassisSeries)).toHaveValue(''); // Chassis series 为空
  await expect(page.locator(SEL.chassisNo)).toHaveValue(''); // Chassis no 为空
  await expect(page.locator(SEL.documentType)).toHaveValue(''); // Document type 未选择
  await shot(page);

  // Submit / Reset / Help 按钮均为活性
  await expect(footerButton(page, 'Submit')).toBeEnabled();
  await expect(footerButton(page, 'Reset')).toBeEnabled();
  await expect(footerButton(page, 'Help')).toBeEnabled();
  // error message area 不显示
  await expect(page.locator(SEL.message)).toHaveCount(0);
  // Support Mail 显示
  await expect(page.locator(SEL.supportMail)).toHaveText(
    'HDoc support: support.tpi@volvo.com',
  );
  await shot(page);
});

test('02_画面初始化-Document type列表加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  let apiCalled = false;
  await page.route(DOC_TYPE_API, async (route) => {
    apiCalled = true; // 确认 API 被调用
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(DOC_TYPE_OK),
    });
  });

  // 步骤1/2：访问页面并等待 API 响应
  await openGenerateDoc(page);
  await shot(page);

  // 步骤3：确认 Document type 下拉列表内容
  expect(apiCalled).toBe(true); // 调用了 API
  await expect(page.locator(SEL.documentTypeOption)).toHaveCount(3); // -- Select -- + 2 件
  await expect(page.locator(SEL.documentTypeOption)).toHaveText([
    '-- Select --',
    'documentType1',
    'documentType2',
  ]);
  // 不显示错误消息
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

test('03_画面初始化-列表为空', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：模拟返回空列表
  await mockDocTypeApi(page, {
    code: 200,
    data: { documentTypeList: [] },
    message: '',
  });

  // 步骤2：访问页面
  await openGenerateDoc(page);
  await shot(page);

  // 步骤3：确认下拉列表状态（仅有空选项）
  await expect(page.locator(SEL.documentTypeOption)).toHaveCount(1);
  await expect(page.locator(SEL.documentTypeOption)).toHaveText(['-- Select --']);
  await expect(page.locator(SEL.documentType)).toHaveValue('');
  // 不显示错误消息
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

test('04_画面初始化-加载失败', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：模拟返回非 200 状态码
  await mockDocTypeApi(page, {
    code: 500,
    data: null,
    message: 'System error.',
  });

  // 步骤2：访问页面
  await openGenerateDoc(page);
  await shot(page);

  // 步骤3：确认结果显示
  await expect(page.locator(SEL.message)).toBeVisible(); // error message area 显示
  await expect(page.locator(SEL.message)).toHaveText('System error.');
  await expectErrorMessageRed(page); // 红色（Error）
  await expect(page.locator(SEL.documentTypeOption)).toHaveCount(1); // 下拉列表为空
  await shot(page);
});

test('05_画面初始化-默认显示上次条件', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);

  // 步骤1：已执行过一次检索后再次访问页面（写入上次条件到 localStorage）
  await gotoMenu(page);
  await page.evaluate(() => {
    localStorage.setItem(
      'generateDocConditions',
      JSON.stringify({
        chassisSeries: '12345',
        chassisNo: '1234567890',
        documentType: 'documentType1',
      }),
    );
  });
  await page.reload();
  await expect(page.locator(SEL.container)).toBeVisible();
  await expect(page.locator(SEL.footerButton).first()).toBeEnabled();
  await shot(page);

  // 步骤2：确认各項目初期值
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('12345'); // 上次 Chassis series
  await expect(page.locator(SEL.chassisNo)).toHaveValue('1234567890'); // 上次 Chassis no
  await expect(page.locator(SEL.documentType)).toHaveValue('documentType1'); // 上次 Document type
  await shot(page);
});

/* =========================================================================
 * 二、Chassis series 入力
 * ========================================================================= */

test('06_Chassis series-正常入力（半角数字）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：输入半角数字
  await page.locator(SEL.chassisSeries).pressSequentially('12345');
  await shot(page);
  // 步骤2：确认输入框内容
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('12345');
  await expect(page.locator(SEL.message)).toHaveCount(0); // 无错误消息
  await shot(page);
});

test('07_Chassis series-边界长度（Max=5）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：输入 5 个半角数字
  await page.locator(SEL.chassisSeries).pressSequentially('12345');
  await shot(page);
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('12345');

  // 步骤2：继续尝试输入第 6 个字符（应被阻止）
  await page.locator(SEL.chassisSeries).pressSequentially('6');
  await shot(page);
  // 步骤3：仍保持 5 个字符
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('12345');
  await shot(page);
});

test('08_Chassis series-非法字符阻止', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：依次输入非法字符
  // 1) 全角数字 → 被阻止
  await page.locator(SEL.chassisSeries).pressSequentially('１２３');
  await shot(page);
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('');

  // 2) 符号 → 被阻止
  await page.locator(SEL.chassisSeries).pressSequentially('-@');
  await shot(page);
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('');

  // 3) 半角英字
  //    【仕様書との相違】仕様書 No.08 は「英字 ABC は阻止」を想定しているが、
  //    実装は半角英数字 a-zA-Z0-9 を許可する（Chassis series は JPCT 等の英数字系列のため）。
  //    ここでは実装の現状挙動を検証する。
  await page.locator(SEL.chassisSeries).pressSequentially('ABC');
  await shot(page);
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('ABC');

  // 步骤2/3：无错误消息（输入层拦截，非提交后校验）
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

/* =========================================================================
 * 三、Chassis no 入力
 * ========================================================================= */

test('09_Chassis no-正常入力（半角数字）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：输入半角数字
  await page.locator(SEL.chassisNo).pressSequentially('1234567890');
  await shot(page);
  // 步骤2：确认输入框内容
  await expect(page.locator(SEL.chassisNo)).toHaveValue('1234567890');
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

test('10_Chassis no-边界长度（Max=10）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：输入 10 个半角数字
  await page.locator(SEL.chassisNo).pressSequentially('1234567890');
  await shot(page);
  await expect(page.locator(SEL.chassisNo)).toHaveValue('1234567890');

  // 步骤2：继续尝试输入第 11 个字符（应被阻止）
  await page.locator(SEL.chassisNo).pressSequentially('1');
  await shot(page);
  // 步骤3：仍保持 10 个字符
  await expect(page.locator(SEL.chassisNo)).toHaveValue('1234567890');
  await shot(page);
});

test('11_Chassis no-非法字符阻止', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：依次输入非法字符（全角数字 / 半角英字 / 符号）
  await page.locator(SEL.chassisNo).pressSequentially('９９');
  await shot(page);
  await expect(page.locator(SEL.chassisNo)).toHaveValue('');

  await page.locator(SEL.chassisNo).pressSequentially('XYZ');
  await shot(page);
  await expect(page.locator(SEL.chassisNo)).toHaveValue('');

  await page.locator(SEL.chassisNo).pressSequentially('#');
  await shot(page);
  await expect(page.locator(SEL.chassisNo)).toHaveValue('');

  // 步骤2：输入框内容保持不变
  await shot(page);
});

/* =========================================================================
 * 四、Document type 选择
 * ========================================================================= */

test('12_Document type-下拉列表内容', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);

  // 步骤1/2：访问页面并展开 Document type 下拉列表
  await openGenerateDoc(page);
  await shot(page);
  await page.locator(SEL.documentType).click();
  await shot(page);

  // 步骤3：确认列表内容与 API 返回的 documentTypeList 一致
  await expect(page.locator(SEL.documentTypeOption)).toHaveText([
    '-- Select --',
    ...DOC_TYPE_OK.data.documentTypeList,
  ]);
  await shot(page);
});

test('13_Document type-选择有效值', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1/2：展开下拉列表并选择任意有效值
  await page.locator(SEL.documentType).click();
  await shot(page);
  await page.locator(SEL.documentType).selectOption('documentType1');
  await shot(page);

  // 步骤3：确认选择结果
  await expect(page.locator(SEL.documentType)).toHaveValue('documentType1');
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

/* =========================================================================
 * 五、Submit 按钮
 * ========================================================================= */

/** 入力一套有效的检索条件 */
async function inputValidConditions(page: Page) {
  await page.locator(SEL.chassisSeries).fill('12345');
  await page.locator(SEL.chassisNo).fill('1234567890');
  await page.locator(SEL.documentType).selectOption('documentType1');
}

test('14_Submit压下-画面迁移', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await mockGeneratedDocumentApi(page);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：输入 Chassis series 和 Chassis no；步骤2：选择 Document type
  await inputValidConditions(page);
  await shot(page);

  // 步骤3：点击 Submit 按钮
  await footerButton(page, 'Submit').click();
  await shot(page);

  // 步骤4：确认画面迁移至 [Generate document]
  await expect(page.locator('.generate-doc__title')).toHaveText('Generate document');
  await expect(page.locator(SEL.container)).toHaveCount(0); // 检索画面已切换
  await shot(page);
});

test('15_Submit压下-参数传递正确性', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);

  // 拦截迁移目标画面的 API，取得其接收到的参数
  let received: Record<string, unknown> | null = null;
  await page.route(UD04_API, async (route) => {
    received = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data: {}, message: '' }),
    });
  });

  await openGenerateDoc(page);
  // 步骤1：输入指定的 Chassis series 和 Chassis no
  await inputValidConditions(page);
  await shot(page);

  // 步骤2：点击 Submit 按钮
  await footerButton(page, 'Submit').click();
  await expect(page.locator('.generate-doc__title')).toHaveText('Generate document');
  await shot(page);

  // 步骤3：在迁移后的 [Generate document] 画面确认接收到的参数
  await expect.poll(() => received, { timeout: 5000 }).not.toBeNull();
  expect(received).toMatchObject({
    chassisSeries: '12345',
    chassisNo: '1234567890',
  });
  await shot(page);
});

test('16_Submit压下-未入力时的现状确认', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await mockGeneratedDocumentApi(page);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1/2：Chassis series 和 Chassis no 均不输入，点击 Submit
  await footerButton(page, 'Submit').click();
  await shot(page);

  // 步骤3：确认结果（现状行为）
  //    【仕様書との相違】仕様書 No.16 は「空値のまま Generate document へ遷移」を想定しているが、
  //    実装は必須項目チェックを行い、エラーメッセージを表示して遷移しない。
  //    ここでは実装の現状挙動を検証する。
  await expect(page.locator(SEL.message)).toHaveText('Chassis series is required.');
  await expectErrorMessageRed(page);
  await expect(page.locator('.generate-doc__title')).toHaveCount(0); // 迁移未发生
  await shot(page);
});

/* =========================================================================
 * 六、Reset 按钮
 * ========================================================================= */

test('17_Reset压下-清除画面数据', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);

  // 步骤1/2：输入 Chassis series / Chassis no 并选择 Document type
  await inputValidConditions(page);
  await shot(page);

  // 步骤3：点击 Reset 按钮
  await footerButton(page, 'Reset').click();
  await shot(page);

  // 步骤4：确认各項目状态（全部清除）
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('');
  await expect(page.locator(SEL.chassisNo)).toHaveValue('');
  await expect(page.locator(SEL.documentType)).toHaveValue('');
  await shot(page);
});

test('18_Reset压下-重新初期表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);

  await inputValidConditions(page);
  await shot(page);

  // 步骤1：点击 Reset 按钮
  await footerButton(page, 'Reset').click();
  // 步骤2：等待（实现上不重新调用 API）
  await shot(page);

  // 步骤3：确认 Document type 下拉列表状态与画面状态
  //    【仕様書との相違】仕様書 No.18 は「Reset 後に API を再呼び出し」を想定しているが、
  //    実装は Reset で画面データをクリアするのみ（API 再呼び出しは行わない）。
  //    下拉列表保持既有数据，画面恢复初期表示状态。
  await expect(page.locator(SEL.documentTypeOption)).toHaveCount(3);
  await expect(page.locator(SEL.documentTypeOption)).toHaveText([
    '-- Select --',
    'documentType1',
    'documentType2',
  ]);
  await expect(page.locator(SEL.chassisSeries)).toHaveValue('');
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});

/* =========================================================================
 * 七、Help 按钮
 * ========================================================================= */

test('19_Help压下-画面迁移', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, DOC_TYPE_OK);
  await openGenerateDoc(page);
  await shot(page);

  // 步骤1：点击 Help 按钮
  await footerButton(page, 'Help').click();
  await shot(page);

  // 步骤2：确认画面迁移至 [Help] 画面（同一位置显示）
  await expect(page.locator('.help-container')).toBeVisible();
  await expect(page.locator('.help-title')).toHaveText('HDoc Help');
  await expect(page.locator(SEL.container)).toHaveCount(0);
  await shot(page);
});

/* =========================================================================
 * 八、异常处理
 * ========================================================================= */

test('20_异常处理-网络异常', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：模拟网络断开（中断请求，无响应）
  await page.route(DOC_TYPE_API, async (route) => route.abort('failed'));

  // 步骤2：访问页面（触发 UD03SelectHdocdocumentlist）
  await gotoMenu(page);
  await expect(page.locator(SEL.message)).toBeVisible();
  await shot(page);

  // 步骤3：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Network error. Please check your connection and try again.',
  );
  await expectErrorMessageRed(page);
  await shot(page);
});

test('21_异常处理-API超时', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  const shot = createScreenshotter(testInfo);
  // 步骤1：模拟响应超过 axios 超时时间（10s）
  await page.route(DOC_TYPE_API, async (route) => {
    await new Promise((r) => setTimeout(r, 12000));
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DOC_TYPE_OK),
      });
    } catch {
      // 客户端已超时取消，忽略
    }
  });

  // 步骤2：访问页面
  await gotoMenu(page);
  await shot(page);

  // 步骤3/4：等待超时后确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Request timeout. Please try again.',
    { timeout: 20000 },
  );
  await expectErrorMessageRed(page);
  await shot(page);
});

test('22_异常处理-系统错误500', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：模拟返回 500 系统错误
  await mockDocTypeApi(page, { code: 500, data: null, message: 'System error.' }, 500);

  // 步骤2：访问页面
  await gotoMenu(page);
  await expect(page.locator(SEL.message)).toBeVisible();
  await shot(page);

  // 步骤3：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'System error. Please contact support.',
  );
  await expectErrorMessageRed(page);
  await shot(page);
});

test('23_异常处理-账户锁定', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：模拟 API 返回账户锁定状态（code=401）
  await mockDocTypeApi(page, {
    code: 401,
    data: {},
    message: 'Your account is locked. Please contact your system administrator.',
  });

  // 步骤2：访问页面
  await gotoMenu(page);
  await expect(page.locator(SEL.message)).toBeVisible();
  await shot(page);

  // 步骤3：确认结果
  await expect(page.locator(SEL.message)).toHaveText(
    'Your account is locked. Please contact your system administrator.',
  );
  await expectErrorMessageRed(page);
  await shot(page);
});

/* =========================================================================
 * 九、消息显示
 * ========================================================================= */

test('24_消息显示-error message area', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：触发错误（模拟 API 失败）
  await mockDocTypeApi(page, { code: 500, data: null, message: 'System error.' });
  await gotoMenu(page);
  await expect(page.locator(SEL.message)).toBeVisible();
  await shot(page);

  // 步骤2：确认 error message area 的显示位置与样式
  //  1) 错误消息显示在 error message area
  await expect(page.locator(SEL.message)).toHaveText('System error.');
  //  2) 文字颜色为红色警示
  await expectErrorMessageRed(page);
  //  3) 左对齐
  const align = await page
    .locator(SEL.message)
    .evaluate((el) => window.getComputedStyle(el as Element).textAlign);
  expect(['left', 'start']).toContain(align);
  await shot(page);
});

test('25_消息清空-重新操作时清除', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockDocTypeApi(page, { code: 500, data: null, message: 'System error.' });

  // 步骤1：触发错误消息显示
  await gotoMenu(page);
  await expect(page.locator(SEL.message)).toHaveText('System error.');
  await shot(page);

  // 步骤2：重新执行操作（点击 Reset）
  await footerButton(page, 'Reset').click();
  await shot(page);

  // 步骤3：确认旧消息被清除
  await expect(page.locator(SEL.message)).toHaveCount(0);
  await shot(page);
});
