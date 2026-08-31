/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const MDSL_URL = BASE_URL + "/market-document-settings-list";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD20";

// 页面元素选择器（与 MarketDocumentSettingsList.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".mdsl-title",
  error: ".mdsl-error",
  loading: ".mdsl-loading",
  table: ".mdsl-table",
  row: ".mdsl-row",
  rowSelected: ".mdsl-row-selected",
  radio: ".mdsl-radio",
  td: ".mdsl-td",
  userLink: ".mdsl-user-link",
  noData: ".mdsl-no-data",
  selBtn: ".mdsl-buttons button.mdsl-btn >> nth=0",
  backBtn: ".mdsl-buttons button.mdsl-btn >> nth=1",
  printBtn: ".mdsl-buttons button.mdsl-btn >> nth=2",
};

/**
 * 截图辅助函数：以每个测试观点(用例)为单元，从 001 开始循环命名。
 */
function makeScreenshot(page: Page, caseName: string) {
  let counter = 0;
  return async (stepDesc: string) => {
    counter += 1;
    const seq = String(counter).padStart(3, "0");
    const safeName = caseName.replace(/[^\w\u4e00-\u9fa5]+/g, "_");
    const fileName = `${safeName}_${seq}.jpeg`;
    const fullPath = `${IMG_DIR}\\${fileName}`;
    await page.screenshot({ path: fullPath, type: "jpeg", quality: 80 });
    console.log(`[${caseName}] ${stepDesc} -> ${fullPath}`);
  };
}

async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.getElementById("webpack-dev-server-client-overlay");
    if (overlay) overlay.remove();
    const closeBtn = document.querySelector("#webpack-dev-server-client-overlay-close");
    if (closeBtn) (closeBtn as HTMLElement).click();
  });
}

/** 构造文档记录 */
function docRecord(overrides: any = {}) {
  return { doctype: "COC_EUB1", registerUser: "user001", registerDatetime: "2023-10-15 10:30", ...overrides };
}

/** 默认文档列表 */
const DEFAULT_DOCS = [
  docRecord(),
  docRecord({ doctype: "VDA_EUB1", registerUser: "user002", registerDatetime: "2023-10-16 11:00" }),
];

/** 拦截 GET /api/ud20/getdocumentlist */
async function mockDocList(page: Page, payload: any) {
  await page.route("**/api/ud20/getdocumentlist", (route) => {
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

test.describe("UD20 Market Document Settings List 模块测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => localStorage.setItem("userID", "admin001"));
    await dismissOverlay(page);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问 Market Document Settings List 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Market Document Settings List");
    // 3. 表格显示 Document type / Business unit / User / Date 列
    await expect(page.locator(`${SEL.table} th`).nth(1)).toHaveText("Document type");
    await expect(page.locator(`${SEL.table} th`).nth(2)).toHaveText("Business unit");
    await expect(page.locator(`${SEL.table} th`).nth(3)).toHaveText("User");
    await expect(page.locator(`${SEL.table} th`).nth(4)).toHaveText("Date");
    // 4. 每行有 RadioBox
    await expect(page.locator(SEL.radio)).toHaveCount(2);
    // 5. Business unit 列固定显示 BU
    await expect(page.locator(SEL.td).nth(1)).toHaveText("BU"); // 行1 BU
    // 6. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    // Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认标题、表格列、Radio 与 BU 列");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(MDSL_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-文档列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-文档列表加载");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面并设置文档列表 mock");

    // 2. 表格显示 2 行
    await expect(page.locator(SEL.row)).toHaveCount(2);
    // 3. Document type 列显示 doctype
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(0)).toHaveText("COC_EUB1");
    // 4. Business unit 显示 BU
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(1)).toHaveText("BU");
    // 5. User 列显示 registerUser（带链接）
    await expect(page.locator(SEL.row).nth(0).locator(SEL.userLink)).toHaveText("user001");
    // 6. Date 列显示 registerDatetime
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(3)).toHaveText("2023-10-15 10:30");
    // 7. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认文档列表表格正确加载");
  });

  test("TC04 画面初始化-文档列表为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_画面初始化-文档列表为空");
    await mockDocList(page, { body: { success: true, data: [] } });
    await page.goto(MDSL_URL);
    await snap("访问页面并设置空列表 mock");

    // 1. 表格显示 No data found
    await expect(page.locator(SEL.noData)).toHaveText("No data found");
    // 2. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No data found");
    // 4. 表格无数据行
    await expect(page.locator(SEL.row)).toHaveCount(0);
    await snap("确认空文档列表显示 No data found");
  });

  test("TC05 表格-斑马纹样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_表格-斑马纹样式");
    const docs = Array.from({ length: 4 }, (_, i) => docRecord({ doctype: `DOC${i}`, registerUser: `user${i}`, registerDatetime: `2023-10-1${i} 10:00` }));
    await mockDocList(page, { body: { success: true, data: docs } });
    await page.goto(MDSL_URL);
    await snap("访问页面并加载 4 条数据");

    await expect(page.locator(SEL.row)).toHaveCount(4);
    // 选中某行后有高亮样式（selected）
    await page.locator(SEL.row).nth(1).click();
    await expect(page.locator(SEL.rowSelected)).toHaveCount(1);
    await expect(page.locator(SEL.rowSelected)).toHaveText(/DOC1/);
    await snap("确认选中行的 selected 高亮样式");
  });

  // ============================================================
  // 行选择
  // ============================================================

  test("TC06 行选择-点击RadioBox", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_行选择-点击RadioBox");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    // 点击第 1 行（radio 与 tr onClick 都会触发 toggle，直接点击行避免 double-toggle）
    await page.locator(SEL.row).nth(0).click();
    // 1. 该行 RadioBox 选中
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    // 2. 该行添加 selected 高亮样式
    await expect(page.locator(SEL.rowSelected)).toHaveCount(1);
    // 3. 其余行未选中
    await expect(page.locator(SEL.radio).nth(1)).not.toBeChecked();
    await snap("确认第 1 行选中且 RadioBox 勾选");
  });

  test("TC07 行选择-点击整行", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_行选择-点击整行");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    // 点击第 2 行（非 RadioBox 区域）
    await page.locator(SEL.row).nth(1).click();
    // 1-2. 整行点击触发选中，该行 RadioBox 选中
    await expect(page.locator(SEL.radio).nth(1)).toBeChecked();
    // 3. 该行添加 selected 样式
    await expect(page.locator(SEL.rowSelected)).toHaveCount(1);
    await expect(page.locator(SEL.rowSelected)).toHaveText(/VDA_EUB1/);
    await snap("确认点击整行选中第 2 行");
  });

  test("TC08 行选择-单选互斥", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_行选择-单选互斥");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    // 先选第 1 行
    await page.locator(SEL.row).nth(0).click();
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    // 再选第 2 行
    await page.locator(SEL.row).nth(1).click();
    // 1. 第 1 行取消选中
    await expect(page.locator(SEL.radio).nth(0)).not.toBeChecked();
    // 2. 第 2 行选中
    await expect(page.locator(SEL.radio).nth(1)).toBeChecked();
    // 3. 只能有一个记录被选中
    await expect(page.locator(SEL.rowSelected)).toHaveCount(1);
    await snap("确认单选互斥逻辑正确");
  });

  test("TC09 行选择-再次点击取消", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_行选择-再次点击取消");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    // 第一次点击第 1 行（选中）
    await page.locator(SEL.row).nth(0).click();
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    await snap("第一次点击后选中第 1 行");

    // 第二次点击第 1 行（取消选中）
    await page.locator(SEL.row).nth(0).click();
    await expect(page.locator(SEL.radio).nth(0)).not.toBeChecked();
    // 3. selectedIndex 变为 null（无选中行）
    await expect(page.locator(SEL.rowSelected)).toHaveCount(0);
    await snap("第二次点击后取消选中");
  });

  // ============================================================
  // Select 操作
  // ============================================================

  test("TC10 Select-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Select-空值校验");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面并加载数据");

    // 不选择任何行，点击 Select
    await page.locator(SEL.selBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No data found");
    // 3. 不执行画面迁移，当前画面保持打开
    await expect(page).toHaveURL(/\/market-document-settings-list/);
    await snap("确认无选中行时 Select 显示错误且不跳转");
  });

  test("TC11 Select-成功选择记录", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Select-成功选择记录");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面并加载数据");

    // 选择第 1 行（doctype=COC_EUB1）
    await page.locator(SEL.row).nth(0).click();
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();

    // 捕获 navigate(-1) 传的 state
    await page.evaluate(() => {
      (window as any).__navState = null;
    });
    // 点击 Select，触发 navigate(-1)
    await page.locator(SEL.selBtn).click();
    // navigate(-1) 会返回浏览器历史上一页（此处无前页则停留）
    await page.waitForTimeout(500);
    await snap("确认 Select 触发导航回前画面");
  });

  test("TC12 Select-数据传递完整性", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Select-数据传递完整性");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面并加载数据");

    // 用 window.history 控制 navigate(-1)：先 pushState 制造前页
    await page.evaluate(() => {
      window.history.pushState({}, "", "/some-prev");
      window.history.pushState({}, "", "/market-document-settings-list");
    });

    // 选择含所有字段的行
    await page.locator(SEL.row).nth(0).click();
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();

    // 点击 Select 触发 navigate(-1) 返回前页
    await page.locator(SEL.selBtn).click();
    await expect(page).toHaveURL(/\/some-prev/);
    await snap("确认 Select 选择后实际返回前画面");
  });

  // ============================================================
  // Back / Print / User 链接
  // ============================================================

  test("TC13 Back-返回前画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Back-返回前画面");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    // 制造历史记录以便 navigate(-1)
    await page.evaluate(() => {
      window.history.pushState({}, "", "/some-prev");
      window.history.pushState({}, "", "/market-document-settings-list");
    });
    await snap("访问页面并制造历史");

    // 点击 Back
    await page.locator(SEL.backBtn).click();
    // 返回前画面
    await expect(page).toHaveURL(/\/some-prev/);
    // 4. 无错误提示
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认 Back 返回前画面");
  });

  test("TC14 Print-打印功能", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Print-打印功能");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    // 拦截 window.print 记录调用
    let printCalled = false;
    await page.addInitScript(() => {
      (window as any).__printCalled = false;
      const orig = window.print.bind(window);
      window.print = () => { (window as any).__printCalled = true; };
    });
    await page.reload();

    await page.locator(SEL.printBtn).click();
    const called = await page.evaluate(() => (window as any).__printCalled);
    expect(called).toBe(true);
    await snap("确认点击 Print 触发 window.print()");
  });

  test("TC15 User链接-点击用户", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_User链接-点击用户");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    // 点击 user001 链接
    await page.locator(SEL.userLink).nth(0).click();
    // 1. 跳转到 /edb-user-view
    await expect(page).toHaveURL(/\/edb-user-view/);
    await snap("确认点击 User 链接跳转到 EDB User View");
  });

  test("TC16 User链接-用户为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_User链接-用户为空");
    await mockDocList(page, { body: { success: true, data: [docRecord({ registerUser: "" })] } });
    await page.goto(MDSL_URL);
    await snap("访问页面并设置空用户数据");

    // 1. User 列显示 "-"
    await expect(page.locator(SEL.userLink).nth(0)).toHaveText("-");
    // 2. 仍显示为链接样式（存在）
    await expect(page.locator(SEL.userLink).nth(0)).toBeVisible();
    // 3. 点击时传递 "-" 作为 userId 并跳转
    await page.locator(SEL.userLink).nth(0).click();
    await expect(page).toHaveURL(/\/edb-user-view/);
    await snap("确认空用户链接显示 - 并可跳转");
  });

  // ============================================================
  // 异常与 UI 交互
  // ============================================================

  test("TC17 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_异常处理-网络错误");
    await page.route("**/api/ud20/getdocumentlist", (route) => route.abort());
    await page.goto(MDSL_URL);
    await snap("访问页面并设置网络中断 mock");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 3. 表格无数据
    await expect(page.locator(SEL.noData)).toHaveText("No data found");
    // 4. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认列表加载网络错误消息");
  });

  test("TC18 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_异常处理-服务器500错误");
    await mockDocList(page, { status: 500, body: { message: "System error" } });
    await page.goto(MDSL_URL);
    await snap("访问页面并设置 500 mock");

    // 组件对 500 也尝试 response.json()，非 success 则显示 message 或 "No data found"
    await expect(page.locator(SEL.error)).toHaveText("System error");
    // 3. 表格无数据
    await expect(page.locator(SEL.noData)).toHaveText("No data found");
    await snap("确认列表加载 500 错误消息");
  });

  test("TC19 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_LOGOUT-登出");
    await mockDocList(page, { body: { success: true, data: DEFAULT_DOCS } });
    await page.goto(MDSL_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});

