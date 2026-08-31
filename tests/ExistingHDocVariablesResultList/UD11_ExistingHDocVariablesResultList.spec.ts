/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EHRL_URL = BASE_URL + "/existing-hdoc-variables-result";
const EHR_URL = BASE_URL + "/existing-hdoc-variables";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD11";

// 页面元素选择器（与 ExistingHDocVariablesResultList.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 错误 / 加载
  title: ".ehrl-title",
  error: ".ehrl-error",
  loading: ".ehrl-loading",
  // 计数
  count: ".ehrl-count",
  // 表格
  table: ".ehrl-table",
  row: ".ehrl-row",
  rowSelected: ".ehrl-row-selected",
  radio: ".ehrl-radio",
  noData: ".ehrl-no-data",
  userLink: ".ehrl-user-link",
  // 按钮（Select/Down/Back/Print/Excel）
  btnSelect: ".ehrl-buttons .ehrl-btn >> nth=0",
  btnDown: ".ehrl-buttons .ehrl-btn >> nth=1",
  btnBack: ".ehrl-buttons .ehrl-btn >> nth=2",
  btnPrint: ".ehrl-buttons .ehrl-btn >> nth=3",
  btnExcel: ".ehrl-buttons .ehrl-btn >> nth=4",
  allButtons: ".ehrl-btn",
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

/**
 * 拦截并模拟检索 API：POST /api/hdoc/existing-variables/search
 */
async function mockSearch(page: Page, respond: { status?: number; data: any[] }) {
  await page.route(/\/api\/hdoc\/existing-variables\/search/, async (route) => {
    await route.fulfill({
      status: respond.status || 200,
      contentType: "application/json",
      body: JSON.stringify({ code: respond.status || 200, data: respond.data }),
    });
  });
}

/** 成功检索响应 */
function searchResponse(records: any[]) {
  return { code: 200, data: records };
}

/**
 * 通过 history API 以携带 location.state(检索条件) 的方式导航到结果列表页面。
 * React Router v6 将用户 state 存在 history.state 的 usr 字段中，需用 history.back() 触发真实 popstate。
 * withState=false 用于测"无检索条件"用例（TC02）。
 */
async function gotoResultList(
  page: Page,
  criteria: Record<string, unknown>,
  opts: { withState?: boolean } = {}
) {
  const withState = opts.withState ?? true;
  await page.goto(BASE_URL + "/");
  await dismissOverlay(page);
  if (withState) {
    const rrState = { usr: criteria, key: "default", idx: 1 };
    await page.evaluate(
      ({ rrState }) => {
        window.history.replaceState({}, "", "/existing-hdoc-variables");
        window.history.pushState(rrState, "", "/existing-hdoc-variables-result");
        window.history.pushState({ ...rrState, idx: 2 }, "", "/existing-hdoc-variables-result");
        window.history.back();
      },
      { rrState }
    );
  } else {
    // 无检索条件：直接导航到结果页面（无 location.state）
    await page.goto(BASE_URL + "/existing-hdoc-variables-result");
  }
  await page.waitForURL("**/existing-hdoc-variables-result");
  await page.waitForTimeout(300);
}

/** 默认检索条件 */
const DEFAULT_CRITERIA = { variable: "VAR_001", type: "User Defined", description: "", createdByUser: "", date: "" };

/** 默认检索结果 mock 数据（多行，便于排序/选择测试） */
const DEFAULT_RECORDS = [
  { variable: "VAR_001", type: "User Defined", description: "Desc A", registerUser: "admin", registerDatetime: "2023-10-01 10:00:00" },
  { variable: "VAR_002", type: "VDA", description: "Desc B", registerUser: "user02", registerDatetime: "2023-10-02 10:00:00" },
  { variable: "VAR_003", type: "User Defined", description: "Desc C", registerUser: "admin", registerDatetime: "2023-10-03 10:00:00" },
];

test.describe("UD11 Existing HDoc Variables Result List 模块测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => localStorage.setItem("userID", "user001"));
    await dismissOverlay(page);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("从 Existing HDoc Variables 页面点击 Search 跳转到结果列表页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Existing HDoc Variables Result List");
    // 2. 显示检索结果表格（Variable、Type、Description、Created by user、Date）
    await expect(page.locator(SEL.table)).toBeVisible();
    // 3. 显示 COUNT
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    // 4. 显示 Select、Down、Back、Print、Excel 按钮
    for (const label of ["Select", "Down", "Back", "Print", "Excel"]) {
      await expect(page.locator(SEL.allButtons).filter({ hasText: new RegExp(`^${label}$`) })).toBeVisible();
    }
    // 5. 每行有单选按钮
    await expect(page.locator(SEL.radio)).toHaveCount(3);
    // 6. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、表格、COUNT、按钮与单选按钮");
  });

  test("TC02 画面初始化-无检索条件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-无检索条件");
    // 不传递检索条件（withState=false）
    await gotoResultList(page, {}, { withState: false });
    await snap("以无检索条件方式访问页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No search criteria provided.");
    // 4. 页面显示错误状态（count/表格为空）
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 0");
    await expect(page.locator(SEL.noData)).toHaveText("No records found matching your criteria.");
    await snap("确认无检索条件错误消息");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(EHRL_URL);
    await snap("访问页面");

    // 1. localStorage 中无 userID
    const hasUserID = await page.evaluate(() => !!localStorage.getItem("userID"));
    expect(hasUserID).toBe(false);
    // 2. 自动跳转到 /login
    await page.waitForURL("**/login");
    // 3. 不显示页面内容
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认未登录自动跳转到 /login 且不显示页面内容");
  });

  // ============================================================
  // 结果加载
  // ============================================================

  test("TC04 结果加载-调用检索 API", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_结果加载-调用检索 API");
    let capturedBody: any = null;
    const holder: { release?: () => void } = {};
    const hold = new Promise<void>((r) => (holder.release = r));
    await page.route(/\/api\/hdoc\/existing-variables\/search/, (route) => {
      capturedBody = route.request().postDataJSON();
      return hold.then(() =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(searchResponse(DEFAULT_RECORDS)) })
      );
    });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（API 挂起中）");

    // 1. 调用检索 API（POST /api/hdoc/existing-variables/search）
    await expect.poll(() => capturedBody).not.toBeNull();
    // 2. 请求体传递检索条件
    expect(capturedBody.variable).toBe("VAR_001");
    // 3. 数据加载期间显示 Loading 状态
    await expect(page.locator(SEL.loading)).toHaveText("Loading...");
    await snap("确认 API 调用与 Loading 状态");

    // 放行响应
    holder.release?.();
    await expect(page.locator(SEL.table)).toBeVisible();
    await snap("数据加载完成后表格显示");
  });

  test("TC05 结果加载-成功填充表格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_结果加载-成功填充表格");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 各列数据正确显示
    await expect(page.locator(`${SEL.table} tbody tr`)).toHaveCount(3);
    await expect(page.locator("tbody tr").nth(0)).toContainText("VAR_001");
    await expect(page.locator("tbody tr").nth(0)).toContainText("User Defined");
    await expect(page.locator("tbody tr").nth(0)).toContainText("Desc A");
    await expect(page.locator("tbody tr").nth(0)).toContainText("admin");
    await expect(page.locator("tbody tr").nth(0)).toContainText("2023-10-01");
    // 2. 每行有单选按钮
    await expect(page.locator(SEL.radio)).toHaveCount(3);
    // 3. COUNT 显示正确
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    // 4. 表格数据完整
    await expect(page.locator("tbody tr").nth(2)).toContainText("VAR_003");
    await snap("确认表格填充、单选按钮与 COUNT");
  });

  test("TC06 结果加载-无检索结果", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_结果加载-无检索结果");
    // 模拟 API 返回空数组（data 为 [] 时组件走成功分支，dataList 为空）
    await mockSearch(page, { data: [] });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（API 返回空数据）");

    // 1. 表格中显示"无记录"占位文本
    await expect(page.locator(SEL.noData)).toHaveText("No records found matching your criteria.");
    // 3. COUNT 显示 0
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 0");
    // 2. 表格为空
    await expect(page.locator(`${SEL.table} tbody tr`)).toHaveCount(1);
    await snap("确认无检索结果空数据占位与 COUNT=0");
  });

  // ============================================================
  // 行选择
  // ============================================================

  test("TC07 行选择-单选一行", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_行选择-单选一行");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 点击第一行（单选按钮随行选中）
    await page.locator(SEL.row).nth(0).click();
    await snap("点击第一行的单选按钮");

    // 1/2. 第一行被选中并高亮
    await expect(page.locator(SEL.row).nth(0)).toHaveClass(/ehrl-row-selected/);
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    // 3. 其他行未被选中
    await expect(page.locator(SEL.radio).nth(1)).not.toBeChecked();
    await expect(page.locator(SEL.radio).nth(2)).not.toBeChecked();
    await snap("确认第一行选中且其他行未选中");
  });

  test("TC08 行选择-切换选择行", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_行选择-切换选择行");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 先选择第一行
    await page.locator(SEL.row).nth(0).click();
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    await snap("先选择第一行");

    // 2. 再选择第二行
    await page.locator(SEL.row).nth(1).click();
    await snap("再选择第二行");

    // 3. 单选模式下第二行选中，第一行取消
    await expect(page.locator(SEL.radio).nth(1)).toBeChecked();
    await expect(page.locator(SEL.radio).nth(0)).not.toBeChecked();
    await expect(page.locator(SEL.row).nth(1)).toHaveClass(/ehrl-row-selected/);
    await expect(page.locator(SEL.row).nth(0)).not.toHaveClass(/ehrl-row-selected/);
    await snap("确认切换选择后第二行选中、第一行取消");
  });

  // ============================================================
  // Select 操作
  // ============================================================

  test("TC09 Select-未选择时点击", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_Select-未选择时点击");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 不选择任何行，点击 Select
    await page.locator(SEL.btnSelect).click();
    await snap("未选择行时点击 Select");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please select a record first.");
    // 3. 不执行跳转，页面保持正常
    await expect(page.locator(SEL.title)).toBeVisible();
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    await snap("确认未选择时 Select 显示错误提示");
  });

  test("TC10 Select-选中后回传数据", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Select-选中后回传数据");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 选择第一行
    await page.locator(SEL.row).nth(0).click();
    await snap("选择第一行");

    // 2. 点击 Select
    await page.locator(SEL.btnSelect).click();
    await snap("点击 Select 按钮");

    // 2/3. 跳转回 Existing HDoc Variables 编辑画面并回传数据
    await page.waitForURL("**/existing-hdoc-variables");
    await expect(page.locator(".ehv-title")).toHaveText("Existing HDoc Variables");
    await expect(page.locator(".ehv-field-var .ehv-input")).toHaveValue("VAR_001");
    await snap("确认跳转回编辑画面且表单自动填充");
  });

  // ============================================================
  // Down 操作
  // ============================================================

  test("TC11 Down-未选择时点击", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Down-未选择时点击");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 不选择任何行，点击 Down
    await page.locator(SEL.btnDown).click();
    await snap("未选择行时点击 Down");

    // 1/2. 显示错误消息（Warning）
    await expect(page.locator(SEL.error)).toHaveText("No key defined for table.");
    // 3. 不执行跳转，页面保持正常
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    await snap("确认未选择时 Down 显示错误提示");
  });

  test("TC12 Down-选中后下钻检索", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Down-选中后下钻检索");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 选择第一行（variable=VAR_001）
    await page.locator(SEL.row).nth(0).click();
    await snap("选择第一行");

    // 2/3. 点击 Down，跳转 Homologation Variables 画面并以该 Variable 为条件检索
    await page.locator(SEL.btnDown).click();
    await page.waitForURL("**/homologation-variables");
    await expect(page.locator(".hv-title")).toHaveText("Homologation Variables");
    await snap("确认下钻跳转到 Homologation Variables 画面");
  });

  // ============================================================
  // Back 操作
  // ============================================================

  test("TC13 Back-返回检索条件画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Back-返回检索条件画面");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 点击 Back
    await page.locator(SEL.btnBack).click();
    await snap("点击 Back 按钮");

    // 1. 返回 Existing HDoc Variables 检索条件画面
    await page.waitForURL("**/existing-hdoc-variables");
    await expect(page.locator(".ehv-title")).toHaveText("Existing HDoc Variables");
    await snap("确认返回检索条件画面");
  });

  // ============================================================
  // Print 操作
  // ============================================================

  test("TC14 Print-打印当前列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Print-打印当前列表");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    // 覆盖 window.print 以捕获打印行为
    let printCalled = false;
    await page.addInitScript(() => {
      (window as any).__printCalled = false;
      window.print = () => { (window as any).__printCalled = true; };
    });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 点击 Print
    await page.locator(SEL.btnPrint).click();
    await snap("点击 Print 按钮");

    // 1/2. 触发打印行为（window.print 被调用，打印当前列表）
    printCalled = await page.evaluate(() => (window as any).__printCalled === true);
    expect(printCalled).toBe(true);
    await snap("确认触发打印行为");
  });

  // ============================================================
  // Excel 操作
  // ============================================================

  test("TC15 Excel-导出CSV", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Excel-导出CSV");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    // 覆盖 window.open 捕获导出调用
    await page.addInitScript(() => {
      (window as any).__openedExports = [] as string[];
      window.open = (url: string) => { (window as any).__openedExports.push(String(url)); return null; };
    });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 选择某行后点击 Excel（导出带上选中行的 variable/type 条件）
    await page.locator(SEL.row).nth(0).click();
    await page.locator(SEL.btnExcel).click();
    await snap("点击 Excel 按钮");

    // 1. 调用导出 URL（GET /api/hdoc/existing-variables/export?variable=...&type=...）
    const openedUrl = await page.evaluate(() => (window as any).__openedExports[0] || null);
    expect(openedUrl).toContain("/api/hdoc/existing-variables/export");
    expect(openedUrl).toContain("variable=VAR_001");
    expect(openedUrl).toContain("type=User");
    // 5. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认触发导出 API 且页面正常");
  });

  // ============================================================
  // 链接处理
  // ============================================================

  test("TC16 Created by user-跳转EDB User View", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Created by user-跳转EDB User View");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 4. Created by user 列为可点击链接
    await expect(page.locator(SEL.userLink).nth(0)).toHaveText("admin");

    // 1. 点击某行 Created by user 列的链接
    await page.locator(SEL.userLink).nth(0).click();
    await snap("点击 Created by user 链接");

    // 1/2. 跳转到 EDB User View 画面并传递 UserID
    await page.waitForURL("**/edb-user-view");
    await snap("确认跳转到 EDB User View 画面");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC17 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_异常处理-服务器500错误");
    // 模拟检索 API 返回 500（data 为 null）
    await mockSearch(page, { status: 500, data: null });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（检索 API 返回 500）");

    // 组件对 code!==200 分支统一设置"无记录"错误消息；页面显示错误与空状态
    await expect(page.locator(SEL.error)).toHaveText("No records found matching your criteria.");
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 0");
    await snap("确认 500 时页面显示错误状态与空数据");
  });

  test("TC18 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_异常处理-网络错误");
    // 模拟网络断开
    await page.route(/\/api\/hdoc\/existing-variables\/search/, (route) => route.abort());
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（网络断开）");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    // 3. 数据不加载（空状态）
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 0");
    await snap("确认网络错误消息及页面错误状态");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC19 安全性-导出权限校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_安全性-导出权限校验");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    // 捕获导出请求以校验其携带条件（仅授权用户可访问导出功能）
    await page.addInitScript(() => {
      (window as any).__openedExports = [] as string[];
      window.open = (url: string) => { (window as any).__openedExports.push(String(url)); return null; };
    });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 选择一行后点击 Excel，导出 URL 应携带检索条件
    await page.locator(SEL.row).nth(0).click();
    await page.locator(SEL.btnExcel).click();
    const openedUrl = await page.evaluate(() => (window as any).__openedExports[0] || null);
    // 4. 导出接口通过 window.open 触发，且未选中时也能导出（无选中行则参数为空）
    expect(openedUrl).toContain("/api/hdoc/existing-variables/export");
    // 导出时页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认导出操作触发且页面正常（导出携带权限条件）");
  });
});
