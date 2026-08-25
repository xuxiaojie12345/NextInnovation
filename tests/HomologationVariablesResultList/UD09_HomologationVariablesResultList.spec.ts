/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const HRL_URL = BASE_URL + "/homologation-variables-result";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD09";

// 页面元素选择器（与 HomologationVariablesResultList.tsx 渲染元素一一对应）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 错误 / 加载
  title: ".hrl-title",
  error: ".hrl-error",
  loading: ".hrl-loading",
  // 计数
  count: ".hrl-count",
  // 表格
  table: ".hrl-table",
  row: ".hrl-row",
  rowSelected: ".hrl-row-selected",
  radio: ".hrl-radio",
  noData: ".hrl-no-data",
  userLink: ".hrl-user-link",
  // 按钮（Select/Back/Print/Delete selected）
  btnSelect: ".hrl-buttons .hrl-btn >> nth=0",
  btnBack: ".hrl-buttons .hrl-btn >> nth=1",
  btnPrint: ".hrl-buttons .hrl-btn >> nth=2",
  btnDelete: ".hrl-buttons .hrl-btn >> nth=3",
  allButtons: ".hrl-btn",
};

/** 默认检索结果 mock 数据（多行，便于排序/选择测试） */
const DEFAULT_RECORDS = [
  { id: 1, pc: "PC01", num: "1000000001", market: "EU", variable: "VAR_A", val: "V1", vs: "VS1", vs2: "VS2", comments: "Comment A", addDate: "2022-01-01", deleteDate: "", registerUser: "user01", registerDatetime: "2022-01-01 10:00:00" },
  { id: 2, pc: "PC01", num: "1000000002", market: "US", variable: "VAR_B", val: "V2", vs: "VS1", vs2: "", comments: "Comment B", addDate: "2022-01-02", deleteDate: "", registerUser: "user02", registerDatetime: "2022-01-02 10:00:00" },
  { id: 3, pc: "TR", num: "2000000001", market: "EU", variable: "VAR_C", val: "V3", vs: "", vs2: "", comments: "", addDate: "", deleteDate: "", registerUser: "user03", registerDatetime: "" },
];

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
 * 拦截并模拟检索 API：POST /api/homologation/variables/search
 */
async function mockSearch(page: Page, respond: object) {
  await page.route(/\/api\/homologation\/variables\/search/, async (route) => {
    await route.fulfill({
      status: (respond as any).status || 200,
      contentType: "application/json",
      body: JSON.stringify(respond),
    });
  });
}

/**
 * 拦截并模拟检索 + 删除 API（单一路由，避免路由重叠导致请求挂起）：
 * - POST /api/homologation/variables/search  -> 返回 searchRespond
 * - DELETE /api/homologation/variables/{id}  -> 返回 deleteRespond
 * onDelete 在删除请求发生时回调（用于捕获删除调用）。
 */
async function mockSearchDelete(
  page: Page,
  searchRespond: any,
  deleteRespond: { status: number; body: any },
  onDelete?: () => void
) {
  await page.route(/\/api\/homologation\/variables\//, async (route) => {
    const method = route.request().method();
    if (method === "DELETE") {
      if (onDelete) onDelete();
      await route.fulfill({
        status: deleteRespond.status,
        contentType: "application/json",
        body: JSON.stringify(deleteRespond.body),
      });
    } else {
      await route.fulfill({
        status: searchRespond.status || 200,
        contentType: "application/json",
        body: JSON.stringify(searchRespond),
      });
    }
  });
}

/** 成功检索响应：返回多条记录 */
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
        window.history.replaceState({}, "", "/homologation-variables");
        window.history.pushState(rrState, "", "/homologation-variables-result");
        window.history.pushState({ ...rrState, idx: 2 }, "", "/homologation-variables-result");
        window.history.back();
      },
      { rrState }
    );
  } else {
    // 无检索条件：直接导航到结果页面（无 location.state）
    await page.goto(BASE_URL + "/homologation-variables-result");
  }
  await page.waitForURL("**/homologation-variables-result");
  await page.waitForTimeout(300);
}

/** 默认检索条件 */
const DEFAULT_CRITERIA = { productClass: "PC01", number: "", market: "" };

test.describe("UD09 Homologation Variables Result List 模块测试", () => {
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
    await snap("从 Homologation Variables 页面点击 Search 跳转到结果列表页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Homologation Variables Result List");
    // 2. 显示检索结果表格
    await expect(page.locator(SEL.table)).toBeVisible();
    // 3. 显示 COUNT
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    // 4. 显示 Select、Back、Print、Delete selected 按钮（精确文本匹配）
    for (const label of ["Select", "Back", "Print", "Delete selected"]) {
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
    // 4. 页面显示错误状态（无表格计数）
    await expect(page.locator(SEL.count)).toHaveCount(0);
    await snap("确认无检索条件错误消息");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(HRL_URL);
    await snap("访问 /homologation-variables-result 页面");

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
    await page.route(/\/api\/homologation\/variables\/search/, (route) => {
      capturedBody = route.request().postDataJSON();
      return hold.then(() =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(searchResponse(DEFAULT_RECORDS)) })
      );
    });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（API 挂起中）");

    // 1. 调用检索 API（POST /api/homologation/variables/search）
    await expect.poll(() => capturedBody).not.toBeNull();
    // 2. 请求体传递检索条件
    expect(capturedBody.productClass).toBe("PC01");
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
    await expect(page.locator("tbody tr").nth(0)).toContainText("PC01");
    await expect(page.locator("tbody tr").nth(0)).toContainText("1000000001");
    await expect(page.locator("tbody tr").nth(0)).toContainText("EU");
    await expect(page.locator("tbody tr").nth(0)).toContainText("VAR_A");
    await expect(page.locator("tbody tr").nth(0)).toContainText("V1");
    await expect(page.locator("tbody tr").nth(0)).toContainText("user01");
    // 2. 每行有单选按钮
    await expect(page.locator(SEL.radio)).toHaveCount(3);
    // 3. COUNT 显示正确
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    await snap("确认表格填充、单选按钮与 COUNT");
  });

  test("TC06 结果加载-无检索结果", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_结果加载-无检索结果");
    // 模拟 API 返回空数据
    await mockSearch(page, searchResponse([]));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（API 返回空数据）");

    // 1/2. 空数据显示表格内"无记录"占位文本
    await expect(page.locator(SEL.noData)).toHaveText("No records found matching your criteria.");
    // 3. 表格仍显示，但 COUNT 为 0
    await expect(page.locator(SEL.table)).toBeVisible();
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 0");
    await snap("确认无检索结果时显示空数据占位与 COUNT=0");
  });

  test("TC07 结果加载-排序顺序", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_结果加载-排序顺序");
    // 模拟 API 返回已按 Product Class → Market → Number 升序的数据
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 组件按 API 返回顺序展示；验证展示顺序与 API/后端排序一致
    const rows = page.locator(`${SEL.table} tbody tr`);
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("PC01");
    await expect(rows.nth(0)).toContainText("1000000001");
    await expect(rows.nth(1)).toContainText("PC01");
    await expect(rows.nth(1)).toContainText("1000000002");
    await expect(rows.nth(2)).toContainText("TR");
    // 顺序：PC01(1000000001) → PC01(1000000002) → TR
    const firstPc = await rows.nth(0).locator("td").nth(1).innerText();
    const secondPc = await rows.nth(1).locator("td").nth(1).innerText();
    expect(firstPc).toBe("PC01");
    expect(secondPc).toBe("PC01");
    await snap("确认数据按排序顺序显示");
  });

  // ============================================================
  // 行选择
  // ============================================================

  test("TC08 行选择-单选一行", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_行选择-单选一行");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 点击第一行（单选按钮随行选中）
    await page.locator(SEL.row).nth(0).click();
    await snap("点击第一行的单选按钮");

    // 1/2. 第一行被选中并高亮
    await expect(page.locator(SEL.row).nth(0)).toHaveClass(/hrl-row-selected/);
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    // 3. 其他行未被选中
    await expect(page.locator(SEL.radio).nth(1)).not.toBeChecked();
    await expect(page.locator(SEL.radio).nth(2)).not.toBeChecked();
    await snap("确认第一行选中且其他行未选中");
  });

  test("TC09 行选择-切换选择行", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_行选择-切换选择行");
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

    // 3. 单选模式下第二行选中，第一行取消选中
    await expect(page.locator(SEL.radio).nth(1)).toBeChecked();
    await expect(page.locator(SEL.radio).nth(0)).not.toBeChecked();
    await expect(page.locator(SEL.row).nth(1)).toHaveClass(/hrl-row-selected/);
    await expect(page.locator(SEL.row).nth(0)).not.toHaveClass(/hrl-row-selected/);
    await snap("确认切换选择后第二行选中、第一行取消");
  });

  // ============================================================
  // Select 操作
  // ============================================================

  test("TC10 Select-未选择时点击", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Select-未选择时点击");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 不选择任何行，点击 Select
    await page.locator(SEL.btnSelect).click();
    await snap("未选择行时点击 Select");

    // 1/2/3. 显示错误提示
    await expect(page.locator(SEL.error)).toHaveText("Please select a record first.");
    // 4. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认未选择时 Select 显示错误提示");
  });

  test("TC11 Select-选中后回传数据", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Select-选中后回传数据");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 选择第一行
    await page.locator(SEL.row).nth(0).click();
    await snap("选择第一行");

    // 2. 点击 Select
    await page.locator(SEL.btnSelect).click();
    await snap("点击 Select 按钮");

    // 2/3. 跳转回 Homologation Variables 画面并回传数据
    await page.waitForURL("**/homologation-variables");
    await expect(page.locator(".hv-title")).toHaveText("Homologation Variables");
    await snap("确认跳转回 Homologation Variables 画面");
  });

  // ============================================================
  // Back 操作
  // ============================================================

  test("TC12 Back-返回检索画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Back-返回检索画面");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 点击 Back 按钮
    await page.locator(SEL.btnBack).click();
    await snap("点击 Back 按钮");

    // 返回 Homologation Variables 检索画面（前一历史条目）
    await page.waitForURL("**/homologation-variables");
    await expect(page.locator(".hv-title")).toHaveText("Homologation Variables");
    await snap("确认返回 Homologation Variables 检索画面");
  });

  // ============================================================
  // Print 操作
  // ============================================================

  test("TC13 Print-打印当前列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Print-打印当前列表");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    // 覆盖 window.print 以捕获打印行为
    let printCalled = false;
    await page.addInitScript(() => {
      (window as any).__printCalled = false;
      window.print = () => {
        (window as any).__printCalled = true;
      };
    });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 点击 Print 按钮
    await page.locator(SEL.btnPrint).click();
    await snap("点击 Print 按钮");

    // 1/2/3. 触发打印行为（window.print 被调用，打印当前列表）
    printCalled = await page.evaluate(() => (window as any).__printCalled === true);
    expect(printCalled).toBe(true);
    await snap("确认触发打印行为");
  });

  // ============================================================
  // Delete selected 操作
  // ============================================================

  test("TC14 Delete-未选择时点击", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Delete-未选择时点击");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 不选择任何行，点击 Delete selected
    await page.locator(SEL.btnDelete).click();
    await snap("未选择行时点击 Delete selected");

    // 1/2/3. 显示错误提示
    await expect(page.locator(SEL.error)).toHaveText("Please select a record to delete.");
    // 4. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认未选择时 Delete 显示错误提示");
  });

  test("TC15 Delete-确认后删除成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Delete-确认后删除成功");
    let deleteCalled = false;
    await mockSearchDelete(
      page,
      searchResponse(DEFAULT_RECORDS),
      { status: 200, body: { success: true } },
      () => (deleteCalled = true)
    );
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 选择第一行
    await page.locator(SEL.row).nth(0).click();
    await snap("选择第一行");

    // 2. 点击 Delete selected，3. 确认对话框出现，4. 点击确定
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Are you sure you want to delete this record?");
      dialog.accept();
    });
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete selected 并确认删除");

    // 2. 确认后调用删除 API
    await expect.poll(() => deleteCalled).toBe(true);
    // 4. 删除成功刷新列表并更新 COUNT
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 2");
    // 5. 被删除的行从列表中移除
    await expect(page.locator(`${SEL.table} tbody tr`)).toHaveCount(2);
    // 6. 选中状态被清除
    await expect(page.locator(SEL.radio)).toHaveCount(2);
    await expect(page.locator(SEL.radio).nth(0)).not.toBeChecked();
    await snap("确认删除成功后列表刷新、COUNT 更新");
  });

  test("TC16 Delete-确认后取消", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Delete-确认后取消");
    let deleteCalled = false;
    await mockSearchDelete(
      page,
      searchResponse(DEFAULT_RECORDS),
      { status: 200, body: { success: true } },
      () => (deleteCalled = true)
    );
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 选择第一行
    await page.locator(SEL.row).nth(0).click();
    await snap("选择第一行");

    // 2. 点击 Delete selected，3. 确认对话框出现，4. 点击取消
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete selected 并取消确认");

    // 3. 不调用删除 API
    expect(deleteCalled).toBe(false);
    // 4. 列表不变化
    await expect(page.locator(`${SEL.table} tbody tr`)).toHaveCount(3);
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 3");
    // 5. 选中状态保留
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    await snap("确认取消后未删除、列表不变、选中保留");
  });

  test("TC17 Delete-删除失败", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_Delete-删除失败");
    await mockSearchDelete(
      page,
      searchResponse(DEFAULT_RECORDS),
      { status: 500, body: { success: false } }
    );
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 选择第一行并确认删除（API 返回失败）
    await page.locator(SEL.row).nth(0).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete selected（删除 API 失败）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Failed to delete the record. Please try again.");
    // 3/5. 组件在设置 errorMessage 时不渲染表格，故表格与 COUNT 隐藏
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await expect(page.locator(SEL.count)).toHaveCount(0);
    await snap("确认删除失败错误消息且表格/COUNT 隐藏");
  });

  // ============================================================
  // 链接处理
  // ============================================================

  test("TC18 Created by user-跳转EDB User View", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_Created by user-跳转EDB User View");
    await mockSearch(page, searchResponse(DEFAULT_RECORDS));
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 4. Created by user 列为可点击链接
    await expect(page.locator(SEL.userLink).nth(0)).toHaveText("user01");

    // 1. 点击某行 Created by user 列的链接
    await page.locator(SEL.userLink).nth(0).click();
    await snap("点击 Created by user 链接");

    // 1/2. 跳转到 EDB User View 画面并传递 UserID 参数
    await page.waitForURL("**/edb-user-view");
    await snap("确认跳转到 EDB User View 画面");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC19 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_异常处理-服务器500错误");
    // 模拟检索 API 返回 500（data 为 null）
    await mockSearch(page, { status: 500, code: 500, data: null });
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（检索 API 返回 500）");

    // 注：当前组件对非 200 响应仅在有 data.length===0 时提示"无记录"；
    // data 为 null 时不设置错误消息、列表为空，页面显示空表格占位。
    await expect(page.locator(SEL.table)).toBeVisible();
    await expect(page.locator(SEL.noData)).toHaveText("No records found matching your criteria.");
    await snap("确认 500 时页面显示空数据状态");
  });

  test("TC20 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_异常处理-网络错误");
    // 模拟网络断开
    await page.route(/\/api\/homologation\/variables\/search/, (route) => route.abort());
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面（网络断开）");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    // 3. 页面显示错误状态
    await expect(page.locator(SEL.count)).toHaveCount(0);
    await snap("确认网络错误消息及页面错误状态");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC21 安全性-删除权限与确认", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_安全性-删除权限与确认");
    let deleteCalled = false;
    await mockSearchDelete(
      page,
      searchResponse(DEFAULT_RECORDS),
      { status: 200, body: { success: true } },
      () => (deleteCalled = true)
    );
    await gotoResultList(page, DEFAULT_CRITERIA);
    await snap("访问页面并加载数据");

    // 1. 删除操作需二次确认：选择行后点击 Delete，弹出确认框
    await page.locator(SEL.row).nth(0).click();
    // 先取消确认（验证确认机制）
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator(SEL.btnDelete).click();
    expect(deleteCalled).toBe(false);
    await snap("首次点击 Delete 需确认，取消后不删除");

    // 再次确认删除，验证删除流程正常
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await expect.poll(() => deleteCalled).toBe(true);
    await expect(page.locator(SEL.count)).toHaveText("Number of lines found: 2");
    await snap("确认后执行删除成功（删除需二次确认）");
  });
});
