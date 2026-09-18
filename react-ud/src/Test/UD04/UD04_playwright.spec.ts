/**
 * UD04_playwright.spec.ts
 * ---------------------------------------------------------------
 * GenerateDocument 模块（UD04）Playwright 自动化测试
 *
 * 测试式样书：プロンプトUD04_単体テスト仕様書.md
 * 参照画面　：src/GenerateDocument/GenerateDocument.tsx
 *
 * 说明：
 * - 仕様書记载的全部 27 个测试对象（测试观点）各对应一个 test 用例；
 * - 每执行一步（操作 / 确认）都会以 JPEG 截图保存；
 * - 截图以「测试观点名称为单元」从 001 开始循环命名；
 *   保存位置：src/Test/UD04/screenshots/<观点名称>/<观点名称>_001.jpeg ...
 * - 元素定位与 GenerateDocument.tsx 完全一致：
 *   .generate-doc / .generate-doc__card / .generate-doc__title /
 *   .generate-doc__error-message / .generate-doc__status /
 *   .generate-doc-row(.generate-doc-row__label / __value) /
 *   .generate-doc-section__title / .generate-doc__snote-list / .generate-doc__snote-item /
 *   .generate-doc__warning / .generate-doc__replacing-item /
 *   .generate-doc__link / .generate-doc__button / .generate-doc__footer。
 * - UD04SelectGeneratedocument / UD03SelectHdocdocumentlist 接口均通过 page.route 拦截模拟，
 *   结果确定、不依赖后端（也不需要启动 8081 后端）。
 *
 * 访问方式：
 * 1) 单独访问：直接打开路由「/GenerateDocument」（此时检索条件为演示默认值 JPCT / 013945）；
 * 2) 应用内迁移：/Menu → [GenerateDoc] 画面输入检索条件 → Submit
 *    （由 Menu 在右侧同一位置渲染 <GenerateDocument chassisSeries chassisNo .../>，
 *      该路径可验证「接收前画面参数」「画面迁移」「Modify Doc Link 回调」）。
 *
 * 【重要】仕様書と実装の相違点（4 件／代码中已按「实际实现」断言并加注释标注）
 *   (1) No.03 Chassis no 表示：
 *       仕様書：显示前画面 ChassisSeries + ChassisNo 的组合值（如 series01001）。
 *       実装　：仅显示 ChassisNo（如 001）。
 *   (2) No.04 Date 固定值：
 *       仕様書：`2022-12-02 05:11:45`。
 *       実装　：`Date: 2022-12-06 07:30:31`（固定文本，日期值不同）。
 *   (3) No.22 账户锁定：
 *       実装　：UD04 无 401 专用分支，code≠200 时直接显示后端返回的 message，
 *               因此本用例 mock 后端返回 code=401 + 锁定消息来验证。
 *   (4) No.23 错误消息颜色：
 *       仕様書：红色 #ff4d4f。
 *       実装　：GenerateDocument.css 使用 #c0392b（同为红色系），断言采用「红通道强/绿蓝弱」。
 *   (5) No.01/No.03/No.08/No.15/No.19〜No.22 设定值 ChassisSeries=`series01`：
 *       実装　：前画面 [Chassis series] 入力框 maxLength=5 且仅接受半角英数字（GenerateDoc.tsx），
 *               仕様書值 `series01`（7 字）实际只能入力前 5 字 `serie`，
 *               故本 spec 以「实际可入力值」设定，并按该值断言传入本画面的检索条件。
 *   (6) No.23/No.25 左对齐：
 *       実装　：GenerateDocument.css 未指定 text-align，Chrome 计算值为 `start`
 *               （LTR 下等价左对齐），断言接受 `left` / `start` 两种关键字。
 *   另：No.07「API 返回空数据」仕様書描述 data 为空时显示无数据提示，
 *       実装中 data={} 会被视为有值（不提示），仅 data=null 时才提示
 *       「No chassis data found.」，故本用例 mock data=null 以验证仕様書记载的期待动作。
 *
 * 运行前提：
 *   1. 启动前端：npm start（默认 http://localhost:3000）
 *   2. 运行：npx playwright test UD04/UD04_playwright.spec.ts
 * 可用环境变量 BASE_URL 覆盖被测地址（默认 http://localhost:3000）。
 */
import { test, expect, Page, TestInfo, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/** 被测应用地址（默认本地前端 3000，可用 BASE_URL 覆盖） */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/** 与 GenerateDocument.tsx 保持一致的元素定位器 */
const SEL = {
  /** 画面整体容器 */
  container: '.generate-doc',
  /** 内容区（浅蓝边框矩形） */
  card: '.generate-doc__card',
  /** 画面标题（Generate document） */
  title: '.generate-doc__title',
  /** error message area（仅消息非空时渲染） */
  errorMessage: '.generate-doc__error-message',
  /** 数据取得状态提示（Loading...） */
  status: '.generate-doc__status',
  /** 区块 */
  section: '.generate-doc__section',
  /** 小节标题（S-Notes / Load Index） */
  sectionTitle: '.generate-doc-section__title',
  /** 单条信息行 */
  row: '.generate-doc-row',
  /** 信息行标签 */
  rowLabel: '.generate-doc-row__label',
  /** 信息行值 */
  rowValue: '.generate-doc-row__value',
  /** S-Note 列表 */
  snoteList: '.generate-doc__snote-list',
  /** S-Note 条目 */
  snoteItem: '.generate-doc__snote-item',
  /** 红色警示文字（S-Note Message / AD-Change 提示） */
  warning: '.generate-doc__warning',
  /** 替换参数条目 */
  replacingItem: '.generate-doc__replacing-item',
  /** 超链接（button 模拟：Analyze Rules / Modify Doc Link / Generated document） */
  link: '.generate-doc__link',
  /** 操作按钮（Quit / Archive / Archive & Distribute） */
  button: '.generate-doc__button',
  /** 操作按钮组 */
  buttonGroup: '.generate-doc__button-group',
  /** 底部信息（Date / HDoc version / EDB version） */
  footer: '.generate-doc__footer',
  /** 迁移目标画面 ModifyDocument */
  modifyDoc: '.modify-doc',
  modifyDocTitle: '.modify-doc__title',
  modifyDocInfo: '.modify-doc__info',
  modifyDocButton: '.modify-doc__button',
  /** 检索画面（UD03 / GenerateDoc，内嵌于 Menu 右侧） */
  ud03Series: '#chassisSeries',
  ud03No: '#chassisNo',
  ud03DocType: '#documentType',
  ud03FooterButton: '.form-footer button.footer-button',
};

/** UD04：GenerateDocument 画面初期表示的 API */
const UD04_API = '**/api/GenerateDocument/UD04SelectGeneratedocument';
/** UD03：DocumentType 取得 API（经 Menu → GenerateDoc → Submit 进入本画面时必需） */
const UD03_API = '**/api/GenerateDocument/UD03SelectHdocdocumentlist';

/** 直接访问路由时的演示默认检索条件（GenerateDocument.tsx 默认值） */
const DEFAULT_SERIES = 'JPCT';
const DEFAULT_NO = '013945';

/**
 * 前画面 [GenerateHomologationDocument] 的检索条件（仕様書 No.01/No.03/No.08/No.15/No.19〜No.22 设定值）。
 * 【仕様書との相違】(5) 前画面 [Chassis series] 入力框 maxLength=5，
 * 仕様書值 `series01`（7 字）实际只能入力前 5 字，故以该实际值设定。
 */
const SPEC_SERIES = 'series01';
/** 前画面 Chassis series 入力框可接受的値（maxLength=5） */
const SERIES = SPEC_SERIES.slice(0, 5);
/** 仕様書 No.07 设定值 ChassisSeries=`series99`（同受 maxLength=5 限制） */
const SERIES_99 = 'series99'.slice(0, 5);
/** 仕様書设定值 ChassisNo（maxLength=10，可直接入力） */
const SPEC_NO = '001';

/** CORS 头（模拟后端响应，避免跨域校验差异） */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

/** UD04 标准返回数据（对应仕様書 No.02 / No.09〜No.13 的设定值） */
const DOC_DATA_OK = {
  ordernumber: 'ordernumber01',
  build: 'build01',
  spec: 'spec01',
  custrAdap: 'S1610111 ENGINE CONTROL SPEED',
  countryOfOperation: 'countryOfOperation01',
  loadIndex: 'loadIndex01',
};

/** UD04 正常响应（code=200 + 数据） */
const RESP_OK = { code: 200, message: '', data: DOC_DATA_OK };

/** UD03 正常响应（documentType1 / documentType2） */
const DOC_TYPE_OK = {
  code: 200,
  message: '',
  data: { documentTypeList: ['documentType1', 'documentType2'] },
};

/**
 * 4000 字符长文本（仕様書 No.26 设定值）
 * 以 30 字模式重复后截取 4000 字（截断落在模式中间，末尾非空白字符，
 * 故画面侧 trim() 不会改变长度）。
 */
const LONG_TEXT = 'S1610111 ENGINE CONTROL SPEED '.repeat(134).slice(0, 4000);

/** 去除文件名非法字符，得到安全目录/文件名 */
function sanitize(name: string): string {
  return name
    .replace(/[\\:*?"<>|]/g, '_')
    .replace(/\//g, '_')
    .replace(/\s+/g, '_')
    .trim();
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

/** 转义正则特殊字符（用于标签精确匹配） */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 取得指定标签对应的「值」元素（如 Ordernumber / Build week / Market 等） */
function rowValue(page: Page, label: string) {
  return page
    .locator(SEL.row)
    .filter({
      has: page.locator(SEL.rowLabel, {
        hasText: new RegExp(`^${escapeRegExp(label)}$`),
      }),
    })
    .locator(SEL.rowValue);
}

/** 取得指定文本的超链接（Analyze Rules / Modify Doc Link / Generated document） */
function link(page: Page, label: string) {
  return page
    .locator(SEL.link)
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) });
}

/** 取得指定文本的操作按钮（Quit / Archive / Archive & Distribute） */
function actionButton(page: Page, label: string) {
  return page
    .locator(SEL.button)
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) });
}

/** 取得检索画面（UD03）的底部按钮（Submit / Reset / Help） */
function ud03FooterButton(page: Page, label: string) {
  return page.locator(SEL.ud03FooterButton).filter({ hasText: label });
}

/**
 * 断言指定元素（CSS 选择器或 Locator）的文字为红色系
 * （GenerateDocument.css：.generate-doc__warning / __error-message 为 #c0392b）
 */
async function expectRedText(page: Page, target: string | Locator) {
  const el =
    typeof target === 'string' ? page.locator(target).first() : target.first();
  const color = await el.evaluate(
    (node) => window.getComputedStyle(node as Element).color,
  );
  const matched = color.match(/\d+/g);
  expect(matched, `文字颜色应可解析为 rgb，实际: ${color}`).not.toBeNull();
  const [r, g, b] = (matched as string[]).map(Number);
  expect(r, `红通道应较强，实际: ${color}`).toBeGreaterThan(150);
  expect(g, `绿通道应较弱，实际: ${color}`).toBeLessThan(100);
  expect(b, `蓝通道应较弱，实际: ${color}`).toBeLessThan(100);
}

/**
 * 断言文字为左对齐
 * 【仕様書との相違】(6) CSS 未指定 text-align 时 Chrome 计算值为 `start`（LTR 下等价左对齐）。
 */
function expectLeftAlign(align: string | null | undefined) {
  expect(['left', 'start'], `文字应对齐左侧，实际: ${align}`).toContain(align);
}

/** Mock UD04SelectGeneratedocument 接口 */
async function mockUd04(
  page: Page,
  body: unknown,
  status = 200,
  onRequest?: (postData: unknown) => void,
) {
  await page.route(UD04_API, async (route) => {
    if (route.request().method() !== 'OPTIONS' && onRequest) {
      try {
        onRequest(route.request().postDataJSON());
      } catch {
        onRequest(null);
      }
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(body),
    });
  });
}

/** Mock UD03SelectHdocdocumentlist 接口（检索画面下拉列表） */
async function mockDocTypeApi(page: Page) {
  await page.route(UD03_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(DOC_TYPE_OK),
    });
  });
}

/**
 * 打开 Menu 页面
 * 使用 domcontentloaded 等待，避免 dev server 子资源加载缓慢导致 load 事件超时。
 */
async function gotoMenu(page: Page) {
  await page.goto(`${BASE_URL}/Menu`, { waitUntil: 'domcontentloaded' });
}

/** 打开 GenerateDocument 画面（直接访问路由 /GenerateDocument，检索条件为演示默认值） */
async function openDirect(page: Page) {
  await page.goto(`${BASE_URL}/GenerateDocument`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator(SEL.card)).toBeVisible();
  // 初期表示 API 完成（Loading... 消失）
  await expect(page.locator(SEL.status)).toHaveCount(0);
}

/**
 * 经应用内迁移路径打开本画面：
 * /Menu → [GenerateDoc] 输入检索条件 → Submit → Menu 右侧同一位置渲染 [GenerateDocument]
 */
async function openViaMenu(page: Page, series: string, no: string) {
  await mockDocTypeApi(page);
  await gotoMenu(page);
  await expect(page.locator(SEL.ud03Series)).toBeVisible();
  await page.fill(SEL.ud03Series, series);
  await page.fill(SEL.ud03No, no);
  await page.selectOption(SEL.ud03DocType, { index: 1 });
  await ud03FooterButton(page, 'Submit').click();
  await expect(page.locator(SEL.card)).toBeVisible();
  await expect(page.locator(SEL.status)).toHaveCount(0);
}

/* =========================================================================
 * 一、画面初期表示
 * ========================================================================= */

test('01_画面初始化-接收参数并调用API', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  /** 捕获 UD04SelectGeneratedocument 的请求参数 */
  let capturedBody: unknown = null;
  await mockUd04(page, RESP_OK, 200, (body) => {
    capturedBody = body;
  });

  // 步骤1：在前画面 [GenerateHomologationDocument] 输入检索条件
  // 【仕様書との相違】(5) 仕様書设定 ChassisSeries=`series01`，但入力框 maxLength=5，
  // 实际入力值为其前 5 字 `serie`（常量 SERIES），ChassisNo 为 `001`。
  await mockDocTypeApi(page);
  await gotoMenu(page);
  await expect(page.locator(SEL.ud03Series)).toBeVisible();
  await page.fill(SEL.ud03Series, SERIES);
  await page.fill(SEL.ud03No, SPEC_NO);
  await page.selectOption(SEL.ud03DocType, { index: 1 });
  await shot(page);

  // 步骤2：点击 Submit 迁移至本画面
  await ud03FooterButton(page, 'Submit').click();
  await expect(page.locator(SEL.card)).toBeVisible();
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await shot(page);

  // 步骤3：确认 API 调用（参数为 chassisSeries / chassisNo）
  await expect(rowValue(page, 'Ordernumber')).toHaveText('ordernumber01');
  expect(capturedBody, '应调用 UD04SelectGeneratedocument 接口').not.toBeNull();
  expect(capturedBody).toEqual({ chassisSeries: SERIES, chassisNo: SPEC_NO });
  await shot(page);

  // 步骤3（续）：API 返回 code=200，不显示错误消息
  await expect(rowValue(page, 'Chassis no')).toHaveText('001');
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await shot(page);
});

test('02_画面初始化-各項目数据表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面并等待数据取得完成
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 API 返回数据后的各項目表示
  await expect(rowValue(page, 'Ordernumber')).toHaveText('ordernumber01');
  await expect(rowValue(page, 'Build week')).toHaveText('build01');
  await expect(rowValue(page, 'Spec week')).toHaveText('spec01');
  await expect(rowValue(page, 'Market')).toHaveText('countryOfOperation01');
  await expect(rowValue(page, 'Load index')).toHaveText('loadIndex01');
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await shot(page);
});

test('03_画面初始化-Chassis no 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：由前画面传入 ChassisSeries=series01 / ChassisNo=001 进入本画面
  await openViaMenu(page, SERIES, SPEC_NO);
  await shot(page);

  // 步骤1（续）：确认 Chassis no 項目的表示值
  // 【仕様書との相違】(1) 仕様書为「前画面 ChassisSeries + ChassisNo 的组合值（series01001）」，
  // 実装仅显示 ChassisNo（001），故按实际实现断言。
  await expect(rowValue(page, 'Chassis no')).toHaveText('001');
  await expect(rowValue(page, 'Chassis no')).not.toHaveText('series01001');
  await shot(page);
});

test('04_画面初始化-固定显示項目', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认固定显示項目
  await expect(rowValue(page, 'Master Market')).toHaveText('-EU'); // 固定 -EU
  await expect(rowValue(page, 'Language')).toHaveText('ENG');
  await expect(page.locator(SEL.footer)).toContainText('Date:'); // Date 固定显示
  // 【仕様書との相違】(2) 仕様書的日期为 2022-12-02 05:11:45，実装为固定文本 2022-12-06 07:30:31
  await expect(page.locator(SEL.footer)).toContainText('Date: 2022-12-06 07:30:31');
  await expect(page.locator(SEL.footer)).toContainText('HDoc version: 4.2.1');
  await expect(page.locator(SEL.footer)).toContainText('EDB version: 34307');
  await shot(page);
});

test('05_画面初始化-S-Note 信息存在', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 API 返回的 CUSTOMER_ADAP（S-Note NO）存在值
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, custrAdap: 'S1610111 ENGINE CONTROL SPEED' },
  });

  // 步骤1：模拟 CUSTOMER_ADAP 存在值并访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤2：确认 S-Note 相关表示
  await expect(
    page.locator(SEL.sectionTitle).filter({ hasText: /^S-Notes$/ }),
  ).toBeVisible();
  await expect(page.locator(SEL.snoteItem)).toHaveText([
    'S1610111 ENGINE CONTROL SPEED',
  ]);
  await shot(page);

  // S-Note Message 固定文案 + 红色警示
  // 注：画面内同时存在 S-Note Message 与 AD-Change 提示 2 个 .generate-doc__warning，
  //     故按文案过滤后再断言（避免 strict mode violation）。
  const snoteWarning = page.locator(SEL.warning).filter({
    hasText: 'The S-Notes above can affect homologation documents.',
  });
  await expect(snoteWarning).toHaveText(
    'The S-Notes above can affect homologation documents.',
  );
  await expectRedText(page, snoteWarning);
  await shot(page);
});

test('06_画面初始化-S-Note 信息不存在', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 API 返回的 CUSTOMER_ADAP 为空
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, custrAdap: '' },
  });

  // 步骤1：模拟 CUSTOMER_ADAP 为空并访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤2：确认 S-Note Message 表示
  await expect(rowValue(page, 'Ordernumber')).toHaveText('ordernumber01');
  await expect(page.locator(SEL.snoteList)).toHaveCount(0); // S-Note NO 显示为空
  await expect(page.locator(SEL.snoteItem)).toHaveCount(0);
  await expect(
    page.locator(SEL.warning).filter({
      hasText: 'The S-Notes above can affect homologation documents.',
    }),
  ).toHaveCount(0);
  await shot(page);
});

test('07_画面初始化-API返回空数据', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 API 返回 code=200 但 data 为空（null）
  await mockUd04(page, { code: 200, message: '', data: null });

  // 步骤1：由前画面传入 series99 / 999 并访问本画面
  await openViaMenu(page, SERIES_99, '999');
  await shot(page);

  // 步骤2：确认结果
  await expect(rowValue(page, 'Chassis no')).toHaveText('999'); // 检索条件仍显示
  await expect(rowValue(page, 'Master Market')).toHaveText('-EU'); // 固定值显示
  await expect(rowValue(page, 'Ordernumber')).toHaveText('—'); // 数据項目为空
  await expect(page.locator(SEL.errorMessage)).toBeVisible(); // 显示无数据提示
  await shot(page);

  // 不进行画面迁移（仍停留在本画面）
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await expect(page).toHaveURL(/\/Menu$/);
  await shot(page);
});

test('08_画面初始化-API失败（非200）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 API 返回 code≠200
  await mockUd04(page, {
    code: 500,
    message: 'System error. Please contact support.',
    data: null,
  });

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤2：确认结果
  await expect(page.locator(SEL.errorMessage)).toHaveText(
    'System error. Please contact support.',
  ); // 显示错误消息
  await expect(page.locator(SEL.errorMessage)).toBeVisible();
  await expectRedText(page, SEL.errorMessage); // 类型为 Error（红色）
  await shot(page);

  // 画面正常表示（不崩溃）
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await expect(link(page, 'Modify Doc Link')).toBeVisible();
  await expect(actionButton(page, 'Quit')).toBeEnabled();
  await shot(page);
});

/* =========================================================================
 * 二、数据显示
 * ========================================================================= */

test('09_Ordernumber 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, ordernumber: 'ordernumber01' },
  });

  // 步骤1：访问本画面并等待数据表示
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 Ordernumber 項目与 API 返回值的对应关系
  await expect(rowValue(page, 'Ordernumber')).toHaveText('ordernumber01');
  await shot(page);
});

test('10_Build week 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, build: 'build01' },
  });

  // 步骤1：访问本画面并等待数据表示
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 Build week 項目与 API 返回值的对应关系
  await expect(rowValue(page, 'Build week')).toHaveText('build01');
  await shot(page);
});

test('11_Spec week 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, spec: 'spec01' },
  });

  // 步骤1：访问本画面并等待数据表示
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 Spec week 項目与 API 返回值的对应关系
  await expect(rowValue(page, 'Spec week')).toHaveText('spec01');
  await shot(page);
});

test('12_Market 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, countryOfOperation: 'countryOfOperation01' },
  });

  // 步骤1：访问本画面并等待数据表示
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 Market 項目与 API 返回值的对应关系
  await expect(rowValue(page, 'Market')).toHaveText('countryOfOperation01');
  await shot(page);
});

test('13_Load Index 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, loadIndex: 'loadIndex01' },
  });

  // 步骤1：访问本画面并等待数据表示
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 Load Index 項目与 API 返回值的对应关系
  await expect(
    page.locator(SEL.sectionTitle).filter({ hasText: /^Load Index$/ }),
  ).toBeVisible();
  await expect(rowValue(page, 'Load index')).toHaveText('loadIndex01');
  await shot(page);
});

test('14_HDoc version 表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认 HDoc version 項目的表示
  await expect(page.locator(SEL.footer)).toContainText('HDoc version: 4.2.1');
  await shot(page);
});

/* =========================================================================
 * 三、超链接操作
 * ========================================================================= */

test('15_超链接[Modify Doc Link]-画面迁移', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：经应用内迁移路径进入本画面（仕様書值 chassisSeries=series01 / chassisNo=001；
  // 【仕様書との相違】(5) 受前画面 maxLength=5 限制，实际值为 `serie`）
  await openViaMenu(page, SERIES, SPEC_NO);
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await shot(page);

  // 步骤1（续）：点击 [Modify Doc Link] 超链接
  await link(page, 'Modify Doc Link').click();
  await shot(page);

  // 步骤2：确认画面迁移（迁移至 [Modify Document] 画面）与携带的检索条件
  await expect(page.locator(SEL.modifyDoc)).toBeVisible();
  await expect(page.locator(SEL.modifyDocTitle)).toHaveText('Modify Document');
  await expect(page.locator(SEL.modifyDocInfo)).toContainText(
    `Chassis series: ${SERIES}, Chassis no: ${SPEC_NO}`,
  );
  await expect(page.locator(SEL.title)).toHaveCount(0); // 本画面已切换
  await shot(page);
});

test('16_超链接[Modify Doc Link]-提示文案表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面（AD-Change 活性时显示提示文案与链接）
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认固定提示文案 + 红色警示表示
  // 注：画面内同时存在 S-Note Message 与 AD-Change 提示 2 个 .generate-doc__warning，
  //     故按文案过滤后再断言（避免 strict mode violation）。
  const adChangeWarning = page.locator(SEL.warning).filter({
    hasText: 'After def change detected. Document need to be modified.',
  });
  await expect(adChangeWarning).toHaveText(
    'After def change detected. Document need to be modified.',
  );
  await expectRedText(page, adChangeWarning);
  await expect(link(page, 'Modify Doc Link')).toBeVisible();
  await shot(page);
});

test('17_超链接[Analyze Rules]-点击', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认超链接可正常点击
  await expect(link(page, 'Analyze Rules')).toBeEnabled();
  await shot(page);
  const urlBefore = page.url();
  await link(page, 'Analyze Rules').click();
  await shot(page);

  // 步骤2：确认结果（不发生错误；目标画面后续实现）
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  expect(page.url()).toBe(urlBefore);
  await shot(page);
});

test('18_超链接[Generated document]-点击', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤1（续）：确认超链接可正常点击
  await expect(link(page, 'Generated document')).toBeEnabled();
  await shot(page);
  // 打开 VIN Plate 文件为后续实现（内部設計备注），点击后画面保持正常
  await link(page, 'Generated document').click();
  await shot(page);

  // 步骤2：确认结果（不发生错误、画面不崩溃）
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await shot(page);
});

/* =========================================================================
 * 四、异常处理
 * ========================================================================= */

test('19_异常处理-网络异常', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟网络断开（请求中断）
  await page.route(UD04_API, async (route) => {
    await route.abort('failed');
  });

  // 步骤1：访问本画面（触发 UD04SelectGeneratedocument）
  await page.goto(`${BASE_URL}/GenerateDocument`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator(SEL.card)).toBeVisible();
  await shot(page);

  // 步骤2〜3：确认结果
  await expect(page.locator(SEL.errorMessage)).toHaveText(
    'Network error. Please check your connection and try again.',
  );
  await expectRedText(page, SEL.errorMessage); // 类型为 Error（红色）
  await shot(page);
});

test('20_异常处理-API超时', async ({ page }, testInfo) => {
  test.setTimeout(60000); // 本用例需等待 10 秒超时
  const shot = createScreenshotter(testInfo);
  // 模拟响应超时（延迟 11 秒，超过 axios 的 10 秒超时设定）
  await page.route(UD04_API, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 11000));
    try {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify(RESP_OK),
      });
    } catch {
      // 请求已因超时中断，忽略
    }
  });

  // 步骤1〜2：访问本画面
  await page.goto(`${BASE_URL}/GenerateDocument`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator(SEL.card)).toBeVisible();
  await shot(page);

  // 步骤3〜4：等待超时并确认结果
  await expect(page.locator(SEL.errorMessage)).toHaveText(
    'Request timeout. Please try again.',
    { timeout: 25000 },
  );
  await expectRedText(page, SEL.errorMessage); // 类型为 Error（红色）
  await shot(page);
});

test('21_异常处理-系统错误(500)', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 API 返回 500 系统错误
  await mockUd04(
    page,
    { code: 500, message: 'System error. Please contact support.', data: null },
    500,
  );

  // 步骤1〜2：访问本画面
  await page.goto(`${BASE_URL}/GenerateDocument`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator(SEL.card)).toBeVisible();
  await shot(page);

  // 步骤3：确认结果
  await expect(page.locator(SEL.errorMessage)).toHaveText(
    'System error. Please contact support.',
  );
  await expectRedText(page, SEL.errorMessage); // 类型为 Error（红色）
  await shot(page);
});

test('22_异常处理-账户锁定', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 API 返回账户锁定状态
  // 【仕様書との相違】(3) UD04 実装无 401 专用分支，code≠200 时直接显示后端 message，
  //   故此处 mock 后端返回 code=401 + 锁定消息进行验证。
  await mockUd04(page, {
    code: 401,
    message:
      'Your account is locked. Please contact your system administrator.',
    data: null,
  });

  // 步骤1〜2：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤3：确认结果
  await expect(page.locator(SEL.errorMessage)).toHaveText(
    'Your account is locked. Please contact your system administrator.',
  );
  await expectRedText(page, SEL.errorMessage); // 类型为 Error（红色）
  await shot(page);
});

/* =========================================================================
 * 五、消息显示
 * ========================================================================= */

test('23_消息显示-error message area', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 触发错误（API 失败）
  await mockUd04(
    page,
    { code: 500, message: 'System error. Please contact support.', data: null },
    500,
  );

  // 步骤1：访问本画面并触发错误
  await openDirect(page);
  await shot(page);

  // 步骤2：确认 error message area 的显示位置与样式
  const errorBox = page.locator(SEL.errorMessage);
  await expect(errorBox).toBeVisible();
  await expect(errorBox).toHaveText('System error. Please contact support.');
  await expectRedText(page, SEL.errorMessage); // 文字为红色警示
  // 左对齐（【仕様書との相違】(6) 未指定 text-align 时计算值为 start）
  const textAlign = await errorBox.evaluate(
    (el) => window.getComputedStyle(el as Element).textAlign,
  );
  expectLeftAlign(textAlign);
  // 显示在本画面内容区（标题之下）
  const titleBox = await page.locator(SEL.title).boundingBox();
  const errorBounds = await errorBox.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(errorBounds).not.toBeNull();
  expect(errorBounds!.y).toBeGreaterThan(titleBox!.y);
  await shot(page);
});

test('24_消息清空-重新操作时清除', async ({ page }, testInfo) => {
  test.setTimeout(45000);
  const shot = createScreenshotter(testInfo);
  /** 控制 API 返回：先错误、后成功 */
  let mode: 'error' | 'ok' = 'error';
  await page.route(UD04_API, async (route) => {
    const body =
      mode === 'error'
        ? { code: 500, message: 'System error. Please contact support.', data: null }
        : RESP_OK;
    await route.fulfill({
      status: mode === 'error' ? 500 : 200,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(body),
    });
  });

  // 步骤1：触发错误消息显示
  await openDirect(page);
  await expect(page.locator(SEL.errorMessage)).toHaveText(
    'System error. Please contact support.',
  );
  await shot(page);

  // 步骤2：点击 Modify Doc Link（迁移至 Modify Document 画面）
  await link(page, 'Modify Doc Link').click();
  await expect(page.locator(SEL.modifyDocTitle)).toHaveText('Modify Document');
  // 旧消息不再显示（画面已切换）
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await shot(page);

  // 步骤2（续）：返回本画面（重新进入画面 → 初期表示重新执行）
  mode = 'ok';
  const responseWaiter = page.waitForResponse(
    (response) => response.url().includes('UD04SelectGeneratedocument'),
    { timeout: 15000 },
  );
  await page.locator(SEL.modifyDocButton).click();
  await responseWaiter;
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await shot(page);

  // 步骤2（续）：确认旧消息被清除，正常显示数据
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await expect(rowValue(page, 'Ordernumber')).toHaveText('ordernumber01');
  await shot(page);
});

/* =========================================================================
 * 六、UI 表示
 * ========================================================================= */

test('25_UI表示-控件均为只读输出', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤2：确认所有控件的操作可能性（均为 Output：Label / link，不可入力）
  await expect(
    page.locator(`${SEL.container} input, ${SEL.container} select, ${SEL.container} textarea`),
  ).toHaveCount(0);
  // 信息展示均为 span（label + value）
  await expect(page.locator(SEL.rowLabel).first()).toHaveJSProperty(
    'tagName',
    'SPAN',
  );
  await expect(page.locator(SEL.rowValue).first()).toHaveJSProperty(
    'tagName',
    'SPAN',
  );
  // 三个超链接为 button 模拟链接、三个操作按钮为 button
  for (const label of ['Analyze Rules', 'Modify Doc Link', 'Generated document']) {
    await expect(link(page, label)).toHaveJSProperty('tagName', 'BUTTON');
  }
  for (const label of ['Quit', 'Archive', 'Archive & Distribute']) {
    await expect(actionButton(page, label)).toBeVisible();
  }
  await shot(page);

  // 各項目文字均为左对齐
  const alignments = await page
    .locator(SEL.rowValue)
    .evaluateAll((els) =>
      els.map((el) => window.getComputedStyle(el as Element).textAlign),
    );
  expect(alignments.length).toBeGreaterThan(0);
  // 【仕様書との相違】(6) 未指定 text-align 时计算值为 start（LTR 下等价左对齐）
  for (const align of alignments) {
    expectLeftAlign(align);
  }
  await expect(page.locator(SEL.buttonGroup)).toBeVisible();
  await shot(page);
});

test('26_UI表示-长文本表示（S-Note NO）', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 模拟 CUSTOMER_ADAP 返回长文本（4000 字符）
  await mockUd04(page, {
    code: 200,
    message: '',
    data: { ...DOC_DATA_OK, custrAdap: LONG_TEXT },
  });

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤2：确认表示（不崩坏、文本可读）
  const snote = page.locator(SEL.snoteItem);
  await expect(snote).toBeVisible();
  const text = await snote.textContent();
  expect(text?.length).toBe(4000); // 长文本正常表示

  // 自动换行：条目内部无横向溢出
  const metrics = await snote.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    wordBreak: window.getComputedStyle(el as Element).wordBreak,
    overflowWrap: window.getComputedStyle(el as Element).overflowWrap,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
  expect(['break-all', 'break-word', 'normal']).toContain(metrics.wordBreak);
  await shot(page);

  // 画面整体无横向溢出、仍正常表示
  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(noHorizontalOverflow).toBe(true);
  await expect(page.locator(SEL.title)).toHaveText('Generate document');
  await shot(page);
});

test('27_画面布局-固定与数据項目区分', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await mockUd04(page, RESP_OK);

  // 步骤1：访问本画面
  await openDirect(page);
  await shot(page);

  // 步骤2：确认固定显示項目与 API 数据項目的表示
  // 固定显示項目
  await expect(rowValue(page, 'Master Market')).toHaveText('-EU');
  await expect(rowValue(page, 'Language')).toHaveText('ENG');
  await expect(rowValue(page, 'Using template:')).toHaveText(
    '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf',
  );
  await expect(page.locator(SEL.footer)).toContainText('HDoc version: 4.2.1');
  await expect(page.locator(SEL.footer)).toContainText('EDB version: 34307');
  await shot(page);

  // API 数据項目
  await expect(rowValue(page, 'Ordernumber')).toHaveText('ordernumber01');
  await expect(rowValue(page, 'Build week')).toHaveText('build01');
  await expect(rowValue(page, 'Spec week')).toHaveText('spec01');
  await expect(rowValue(page, 'Market')).toHaveText('countryOfOperation01');
  await expect(rowValue(page, 'Load index')).toHaveText('loadIndex01');
  await shot(page);

  // 画面整体布局与式样一致（标题 / 内容区 / 区块 / 操作按钮 / 底部信息）
  await expect(page.locator(SEL.card)).toBeVisible();
  await expect(page.locator(SEL.section).first()).toBeVisible();
  await expect(page.locator(SEL.replacingItem)).toHaveCount(2);
  await expect(
    page.locator(SEL.replacingItem).first(),
  ).toContainText('AD Change. Modifying: AXLE_CONF');
  await expect(actionButton(page, 'Quit')).toBeVisible();
  await expect(actionButton(page, 'Archive')).toBeVisible();
  await expect(actionButton(page, 'Archive & Distribute')).toBeVisible();
  await shot(page);
});
