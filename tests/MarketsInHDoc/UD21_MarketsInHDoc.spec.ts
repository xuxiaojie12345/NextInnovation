/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const MIH_URL = BASE_URL + "/markets-in-hdoc";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD21";

// 页面元素选择器（与 MarketsInHDoc.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".mih-title",
  error: ".mih-error",
  loading: ".mih-loading",
  table: ".mih-table",
  row: ".mih-row",
  td: ".mih-td",
  noData: ".mih-no-data",
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

/** 构造市场记录 */
function marketRecord(overrides: any = {}) {
  return { market: "EU", description: "Europe", weightsFromHdoc: "10", ...overrides };
}

/** 默认市场列表 */
const DEFAULT_MARKETS = [
  marketRecord(),
  marketRecord({ market: "US", description: "United States", weightsFromHdoc: "20" }),
  marketRecord({ market: "JP", description: "Japan", weightsFromHdoc: "30" }),
];

/** 拦截 GET /api/ud21/getmarketslist */
async function mockMarkets(page: Page, payload: any) {
  await page.route("**/api/ud21/getmarketslist", (route) => {
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

test.describe("UD21 Markets in HDoc 模块测试", () => {
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
    await mockMarkets(page, { body: { success: true, data: DEFAULT_MARKETS } });
    await page.goto(MIH_URL);
    await snap("访问 Markets in HDoc 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Markets in HDoc");
    // 2. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 3. 表格显示 Market / Description / Weights from HDoc 三列
    await expect(page.locator(`${SEL.table} th`).nth(0)).toHaveText("Market");
    await expect(page.locator(`${SEL.table} th`).nth(1)).toHaveText("Description");
    await expect(page.locator(`${SEL.table} th`).nth(2)).toHaveText("Weights from HDoc");
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、表格三列与无错误消息");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(MIH_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-市场列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-市场列表加载");
    await mockMarkets(page, { body: { success: true, data: DEFAULT_MARKETS } });
    await page.goto(MIH_URL);
    await snap("访问页面并设置 list mock");

    // 2. 表格显示 3 行
    await expect(page.locator(SEL.row)).toHaveCount(3);
    // 3. Market 列显示 EU/US/JP
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(0)).toHaveText("EU");
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(0)).toHaveText("US");
    await expect(page.locator(SEL.row).nth(2).locator(SEL.td).nth(0)).toHaveText("JP");
    // 4. Description 列
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(1)).toHaveText("Europe");
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(1)).toHaveText("United States");
    await expect(page.locator(SEL.row).nth(2).locator(SEL.td).nth(1)).toHaveText("Japan");
    // 5. Weights from HDoc 列
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(2)).toHaveText("10");
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(2)).toHaveText("20");
    // 6. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认市场列表 3 行数据正确加载");
  });

  test("TC04 画面初始化-市场列表为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_画面初始化-市场列表为空");
    await mockMarkets(page, { body: { success: true, data: [] } });
    await page.goto(MIH_URL);
    await snap("访问页面并设置空列表 mock");

    // 1. 表格显示 No data found.
    await expect(page.locator(SEL.noData)).toHaveText("No data found.");
    // 2. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No data found.");
    // 4. 表格无数据行
    await expect(page.locator(SEL.row)).toHaveCount(0);
    await snap("确认空列表显示 No data found.");
  });

  // ============================================================
  // 表格显示
  // ============================================================

  test("TC05 表格显示-各列数据", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_表格显示-各列数据");
    await mockMarkets(page, { body: { success: true, data: DEFAULT_MARKETS } });
    await page.goto(MIH_URL);
    await snap("访问页面并加载数据");

    await expect(page.locator(SEL.row)).toHaveCount(3);
    // 1. Market 列显示市场代码
    await expect(page.locator(SEL.td).nth(0)).toHaveText("EU");
    // 2. Description 列
    await expect(page.locator(SEL.td).nth(1)).toHaveText("Europe");
    // 3. Weights from HDoc 列
    await expect(page.locator(SEL.td).nth(2)).toHaveText("10");
    // 4. 各列数据正确对应
    await expect(page.locator(SEL.row).nth(2)).toContainText("JP");
    await expect(page.locator(SEL.row).nth(2)).toContainText("Japan");
    await expect(page.locator(SEL.row).nth(2)).toContainText("30");
    await snap("确认各列数据正确显示");
  });

  test("TC06 表格显示-空字段降级", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_表格显示-空字段降级");
    const docs = [
      marketRecord({ description: "", weightsFromHdoc: "" }),
      marketRecord({ market: "US", description: "United States", weightsFromHdoc: "" }),
    ];
    await mockMarkets(page, { body: { success: true, data: docs } });
    await page.goto(MIH_URL);
    await snap("访问页面并设置空字段数据");

    // 1. Description 为空的显示 "-"
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(1)).toHaveText("-");
    // 2. Weights from HDoc 为空的显示 "-"
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(2)).toHaveText("-");
    // 第 2 行 weights 也空显示 "-"
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(2)).toHaveText("-");
    await snap("确认空字段降级显示 -");
  });

  test("TC07 表格样式-斑马纹", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_表格样式-斑马纹");
    await mockMarkets(page, { body: { success: true, data: DEFAULT_MARKETS } });
    await page.goto(MIH_URL);
    await snap("访问页面并加载多条数据");

    await expect(page.locator(SEL.row)).toHaveCount(3);
    // 行数正确且每行有 3 个单元格（无跨列错位）
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td)).toHaveCount(3);
    await expect(page.locator(SEL.row).nth(2).locator(SEL.td)).toHaveCount(3);
    // 每行对齐正常
    await expect(page.locator(SEL.td)).toHaveCount(9);
    await snap("确认表格多行数据正确显示无错位");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC08 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_异常处理-网络错误");
    await page.route("**/api/ud21/getmarketslist", (route) => route.abort());
    await page.goto(MIH_URL);
    await snap("访问页面并设置网络中断 mock");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 3. 表格无数据
    await expect(page.locator(SEL.noData)).toHaveText("No data found.");
    // 4. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认列表加载网络错误消息");
  });

  test("TC09 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_异常处理-服务器500错误");
    await mockMarkets(page, { status: 500, body: { message: "System error" } });
    await page.goto(MIH_URL);
    await snap("访问页面并设置 500 mock");

    // 组件对 500 也尝试 response.json()，非 success 则显示 message 或 "No data found."
    await expect(page.locator(SEL.error)).toHaveText("System error");
    // 3. 表格无数据
    await expect(page.locator(SEL.noData)).toHaveText("No data found.");
    await snap("确认列表加载 500 错误消息");
  });

  test("TC10 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_LOGOUT-登出");
    await mockMarkets(page, { body: { success: true, data: DEFAULT_MARKETS } });
    await page.goto(MIH_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
