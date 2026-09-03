/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const DT_URL = BASE_URL + "/document-types";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD22";

// 页面元素选择器（与 DocumentTypes.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".dt-title",
  error: ".dt-error",
  loading: ".dt-loading",
  table: ".dt-table",
  row: ".dt-row",
  td: ".dt-td",
  noData: ".dt-no-data",
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

/** 构造文档类型记录 */
function docTypeRecord(overrides: any = {}) {
  return { key: "COC", description: "Certificate of Conformity", ...overrides };
}

/** 默认文档类型列表 */
const DEFAULT_DOCTYPES = [
  docTypeRecord(),
  docTypeRecord({ key: "VDA", description: "Vehicle Data Sheet" }),
  docTypeRecord({ key: "VIN_PLATE", description: "VIN Plate" }),
];

/** 拦截 GET /api/ud22/getdocumenttypes */
async function mockDocTypes(page: Page, payload: any) {
  await page.route("**/api/ud22/getdocumenttypes", (route) => {
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

test.describe("UD22 Document Types 模块测试", () => {
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
    await mockDocTypes(page, { body: { success: true, data: DEFAULT_DOCTYPES } });
    await page.goto(DT_URL);
    await snap("访问 Document Types 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Document Types");
    // 2. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 3. 表格显示 Key / Description 两列
    await expect(page.locator(`${SEL.table} th`).nth(0)).toHaveText("Key");
    await expect(page.locator(`${SEL.table} th`).nth(1)).toHaveText("Description");
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、表格两列与无错误消息");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(DT_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-文档类型列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-文档类型列表加载");
    await mockDocTypes(page, { body: { success: true, data: DEFAULT_DOCTYPES } });
    await page.goto(DT_URL);
    await snap("访问页面并设置 list mock");

    // 2. 表格显示 3 行
    await expect(page.locator(SEL.row)).toHaveCount(3);
    // 3. Key 列显示 COC/VDA/VIN_PLATE
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(0)).toHaveText("COC");
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(0)).toHaveText("VDA");
    await expect(page.locator(SEL.row).nth(2).locator(SEL.td).nth(0)).toHaveText("VIN_PLATE");
    // 4. Description 列
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(1)).toHaveText("Certificate of Conformity");
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(1)).toHaveText("Vehicle Data Sheet");
    await expect(page.locator(SEL.row).nth(2).locator(SEL.td).nth(1)).toHaveText("VIN Plate");
    // 5. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认文档类型列表 3 行数据正确加载");
  });

  test("TC04 画面初始化-文档类型列表为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_画面初始化-文档类型列表为空");
    await mockDocTypes(page, { body: { success: true, data: [] } });
    await page.goto(DT_URL);
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
    await mockDocTypes(page, { body: { success: true, data: DEFAULT_DOCTYPES } });
    await page.goto(DT_URL);
    await snap("访问页面并加载数据");

    await expect(page.locator(SEL.row)).toHaveCount(3);
    // 1. Key 列显示文档类型代码
    await expect(page.locator(SEL.td).nth(0)).toHaveText("COC");
    // 2. Description 列
    await expect(page.locator(SEL.td).nth(1)).toHaveText("Certificate of Conformity");
    // 3. 各列数据正确对应
    await expect(page.locator(SEL.row).nth(2)).toContainText("VIN_PLATE");
    await expect(page.locator(SEL.row).nth(2)).toContainText("VIN Plate");
    await snap("确认各列数据正确显示");
  });

  test("TC06 表格显示-空字段降级", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_表格显示-空字段降级");
    const docs = [
      docTypeRecord({ description: "" }),
      docTypeRecord({ key: "VDA", description: "Vehicle Data Sheet" }),
    ];
    await mockDocTypes(page, { body: { success: true, data: docs } });
    await page.goto(DT_URL);
    await snap("访问页面并设置空字段数据");

    // 1. Description 为空的显示 "-"
    await expect(page.locator(SEL.row).nth(0).locator(SEL.td).nth(1)).toHaveText("-");
    // 正常行不受影响
    await expect(page.locator(SEL.row).nth(1).locator(SEL.td).nth(1)).toHaveText("Vehicle Data Sheet");
    await snap("确认空 description 降级显示 -");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC07 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_异常处理-网络错误");
    await page.route("**/api/ud22/getdocumenttypes", (route) => route.abort());
    await page.goto(DT_URL);
    await snap("访问页面并设置网络中断 mock");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 3. 表格无数据
    await expect(page.locator(SEL.noData)).toHaveText("No data found.");
    // 4. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("确认列表加载网络错误消息");
  });

  test("TC08 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_异常处理-服务器500错误");
    await mockDocTypes(page, { status: 500, body: { message: "System error" } });
    await page.goto(DT_URL);
    await snap("访问页面并设置 500 mock");

    // 组件对 500 也尝试 response.json()，非 success 则显示 message 或 "No data found."
    await expect(page.locator(SEL.error)).toHaveText("System error");
    // 3. 表格无数据
    await expect(page.locator(SEL.noData)).toHaveText("No data found.");
    await snap("确认列表加载 500 错误消息");
  });

  test("TC09 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_LOGOUT-登出");
    await mockDocTypes(page, { body: { success: true, data: DEFAULT_DOCTYPES } });
    await page.goto(DT_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
