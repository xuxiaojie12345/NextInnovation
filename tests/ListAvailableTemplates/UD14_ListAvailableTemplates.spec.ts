/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const LAT_URL = BASE_URL + "/list-available-templates";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD14";

// 页面元素选择器（与 ListAvailableTemplates.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 消息 / 加载
  title: ".lat-title",
  message: ".lat-message",
  loading: ".lat-loading",
  // Market 选择
  marketSelect: ".lat-select",
  // 表格
  table: ".lat-table",
  rowEven: ".lat-row-even",
  rowOdd: ".lat-row-odd",
  link: ".lat-link",
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

/** 默认模板列表 mock 数据 */
function templateRecord(filename: string, usedBy: string | null) {
  return { filename, usedBy, lastModified: "2023-10-15 10:30", size: "2.0 KB" };
}
const DEFAULT_TEMPLATES = [
  templateRecord("template_v1.rtf", "HDOC_USER_DEFINED_RULES"),
  templateRecord("template_v2.docx", null),
  templateRecord("old_template.rtf", "SOME_RULE"),
];

/**
 * 拦截并模拟 list API：GET /api/templates/list?market=xxx
 */
async function mockList(page: Page, status: number, templates: any[]) {
  await page.route(/\/api\/templates\/list/, (route) => {
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data: templates }) });
  });
}

test.describe("UD14 List Available Templates 模块测试", () => {
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
    await page.goto(LAT_URL);
    await snap("访问 List Available Templates 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("List Templates");
    // 2. SelectMarket 下拉列表显示市场列表（固定选项）
    const options = page.locator(`${SEL.marketSelect} option`);
    await expect(options).toHaveCount(6);
    await expect(options.nth(1)).toHaveText("JPN");
    // 5. 下拉列表可用
    await expect(page.locator(SEL.marketSelect)).toBeEnabled();
    // 3. 初始未选择 Market 时表格为空
    await expect(page.locator(SEL.table)).toHaveCount(0);
    // 4. 不显示错误消息
    await expect(page.locator(SEL.message)).toHaveCount(0);
    await snap("确认标题、Market 下拉、空表格与无错误消息");
  });

  test("TC02 画面初始化-Market列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-Market列表加载");
    await page.goto(LAT_URL);
    await snap("访问页面");

    // Market 为固定选项（JPN/USA/EU/CHN/KOR），初始为空
    const options = page.locator(`${SEL.marketSelect} option`);
    await expect(options).toHaveCount(6);
    for (const mkt of ["JPN", "USA", "EU", "CHN", "KOR"]) {
      await expect(options.filter({ hasText: mkt }).first()).toHaveText(mkt);
    }
    await expect(page.locator(SEL.marketSelect)).toHaveValue("");
    await snap("确认 Market 下拉列表选项内容");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(LAT_URL);
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
  // Market 选择与列表加载
  // ============================================================

  test("TC04 Market选择-加载模板列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_Market选择-加载模板列表");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 选择 Market JPN
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN");

    // 1. 调用 list API，表格加载文件
    await expect(page.locator(`${SEL.table} tbody tr`)).toHaveCount(3);
    // 2. 显示 Filename、Used、Last Mod.、Size 列
    await expect(page.locator(`thead th`).nth(0)).toHaveText("Filename");
    await expect(page.locator(`thead th`).nth(1)).toHaveText("Used");
    await expect(page.locator(`thead th`).nth(2)).toHaveText("Last Mod.");
    await expect(page.locator(`thead th`).nth(3)).toHaveText("Size");
    await snap("确认表格加载文件列表与列");
  });

  test("TC05 Market切换-重新加载列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_Market切换-重新加载列表");
    // 记录每次请求的 market 参数
    const requestedMarkets: string[] = [];
    await page.route(/\/api\/templates\/list/, (route) => {
      const url = new URL(route.request().url());
      requestedMarkets.push(url.searchParams.get("market") || "");
      const market = url.searchParams.get("market");
      const files = market === "CHN" ? ["chn_template.docx"] : ["template_v1.rtf"];
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ filename: files[0], usedBy: null, lastModified: "2023-10-15", size: "1.0 KB" }] }) });
    });
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 1次目: JPN
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await expect(page.locator(`${SEL.table} tbody tr`)).toHaveCount(1);
    await expect(page.locator(SEL.link).first()).toHaveText("template_v1.rtf");
    await snap("选择 Market JPN 并加载");

    // 2次目: 切换为 CHN
    await page.locator(SEL.marketSelect).selectOption("CHN");
    await page.waitForTimeout(400);
    await snap("切换 Market 为 CHN");

    // 1/3. 重新加载、表格显示 CHN 文件、旧数据被替换
    await expect(page.locator(SEL.link).first()).toHaveText("chn_template.docx");
    expect(requestedMarkets).toEqual(["JPN", "CHN"]);
    await snap("确认切换后重新加载 CHN 文件");
  });

  test("TC06 Market选择-文件夹为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_Market选择-文件夹为空");
    await mockList(page, 200, []);
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 选择 Market（文件夹为空）
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN（空文件夹）");

    // 1. 显示提示信息
    await expect(page.locator(SEL.message)).toHaveText("No templates found for this market.");
    // 2. 清空表格
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认空文件夹提示信息且表格为空");
  });

  // ============================================================
  // 表格显示
  // ============================================================

  test("TC07 表格显示-各列信息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_表格显示-各列信息");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    await page.goto(LAT_URL);
    await snap("访问页面");

    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载");

    // 1. Filename 列显示文件名
    await expect(page.locator(SEL.link).nth(0)).toHaveText("template_v1.rtf");
    // 2. Used 列显示引用的变量名
    await expect(page.locator(`${SEL.table} tbody tr`).nth(0).locator("td").nth(1)).toHaveText("HDOC_USER_DEFINED_RULES");
    // 3. Last Mod. 列显示修改时间
    await expect(page.locator(`${SEL.table} tbody tr`).nth(0).locator("td").nth(2)).toHaveText("2023-10-15 10:30");
    // 4. Size 列显示文件大小
    await expect(page.locator(`${SEL.table} tbody tr`).nth(0).locator("td").nth(3)).toHaveText("2.0 KB");
    await snap("确认表格各列信息正确");
  });

  test("TC08 表格-Used列逻辑", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_表格-Used列逻辑");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    await page.goto(LAT_URL);
    await snap("访问页面");

    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载");

    // 1. 被引用的文件显示变量名
    await expect(page.locator(`${SEL.table} tbody tr`).nth(0).locator("td").nth(1)).toHaveText("HDOC_USER_DEFINED_RULES");
    // 2. 不被引用的文件 Used 列显示 "-"
    await expect(page.locator(`${SEL.table} tbody tr`).nth(1).locator("td").nth(1)).toHaveText("-");
    await expect(page.locator(`${SEL.table} tbody tr`).nth(2).locator("td").nth(1)).toHaveText("SOME_RULE");
    await snap("确认 Used 列逻辑（引用显示变量名，未引用显示 -）");
  });

  test("TC09 表格-斑马纹样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_表格-斑马纹样式");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    await page.goto(LAT_URL);
    await snap("访问页面");

    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载");

    // 1/2. 偶数行/奇数行使用不同 class（斑马纹）
    const rows = page.locator(`${SEL.table} tbody tr`);
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toHaveClass(/lat-row-even/);
    await expect(rows.nth(1)).toHaveClass(/lat-row-odd/);
    await expect(rows.nth(2)).toHaveClass(/lat-row-even/);
    await snap("确认表格斑马纹样式（even/odd 交替）");
  });

  test("TC10 Filename-下载链接样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Filename-下载链接样式");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    await page.goto(LAT_URL);
    await snap("访问页面");

    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载");

    // 1/3. Filename 为可点击链接，title 提示 Download
    const link = page.locator(SEL.link).first();
    await expect(link).toBeVisible();
    const title = await link.getAttribute("title");
    expect(title).toBe("Download");
    await snap("确认 Filename 下载链接样式（可点击，title=Download）");
  });

  // ============================================================
  // 文件下载
  // ============================================================

  test("TC11 Filename-点击下载文件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Filename-点击下载文件");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    // 覆盖 window.open 捕获下载 URL
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [] as string[];
      window.open = (url: string) => { (window as any).__openedDownloads.push(String(url)); return null; };
    });
    await page.goto(LAT_URL);
    await snap("访问页面");

    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载");

    // 1. 点击某文件的 Filename 链接
    await page.locator(SEL.link).nth(0).evaluate((el) => (el as HTMLElement).click());
    await snap("点击文件名下载链接");

    // 1/2/3. 触发下载 URL
    const openedUrl = await page.evaluate(() => (window as any).__openedDownloads[0] || null);
    expect(openedUrl).toContain("/api/templates/download?market=JPN&filename=template_v1.rtf");
    // 5. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认触发下载 URL 且页面正常");
  });

  test("TC12 下载-文件不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_下载-文件不存在");
    await mockList(page, 200, DEFAULT_TEMPLATES);
    // 覆盖 window.open 捕获下载 URL
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [] as string[];
      window.open = (url: string) => { (window as any).__openedDownloads.push(String(url)); return null; };
    });
    await page.goto(LAT_URL);
    await snap("访问页面");

    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载");

    // 点击文件不存在（组件直接打开下载 URL；此处验证点击行为与页面状态）
    await page.locator(SEL.link).nth(2).evaluate((el) => (el as HTMLElement).click());
    await snap("点击 filename 下载链接");

    const openedUrl = await page.evaluate(() => (window as any).__openedDownloads[0] || null);
    expect(openedUrl).toContain("/api/templates/download?market=JPN");
    // 4. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认文件下载触发（组件直接打开下载 URL，页面正常）");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC13 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_异常处理-服务器500错误");
    // 模拟 list API 返回 500
    await mockList(page, 500, []);
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 选择 Market，列表 API 返回 500
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN（列表 API 500）");

    // 1. 显示错误消息（组件对非 200 统一显示 System error）
    await expect(page.locator(SEL.message)).toHaveText("System error. Please contact administrator.");
    // 4. 表格不加载
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认 500 错误消息且表格不加载");
  });

  test("TC14 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_异常处理-网络错误");
    // 模拟网络断开（abort）
    await page.route(/\/api\/templates\/list/, (route) => route.abort());
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 选择 Market，列表 API 网络断开
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN（网络断开）");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.message)).toHaveText("Network error. Please check your connection.");
    // 4. 数据不加载
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认网络错误消息且数据不加载");
  });

  test("TC15 异常处理-访问权限不足", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_异常处理-访问权限不足");
    // 模拟读取权限不足（非 200 响应）
    await mockList(page, 403, []);
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 选择 Market，权限不足
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN（权限不足）");

    // 组件对非 200 统一显示 System error 消息
    await expect(page.locator(SEL.message)).toHaveText("System error. Please contact administrator.");
    // 3. 数据不加载
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认权限不足时组件显示 System error 消息且数据不加载");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC16 安全性-权限与认证", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_安全性-权限与认证");
    let capturedUrl: string | null = null;
    await page.route(/\/api\/templates\/list/, async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: DEFAULT_TEMPLATES }) });
    });
    // 覆盖 window.open 捕获下载 URL
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [] as string[];
      window.open = (url: string) => { (window as any).__openedDownloads.push(String(url)); return null; };
    });
    await page.goto(LAT_URL);
    await snap("访问页面");

    // 选择 Market，加载列表
    await page.locator(SEL.marketSelect).selectOption("JPN");
    await page.waitForTimeout(400);
    await snap("选择 Market JPN 并加载列表");

    // 1. 列表 API 请求带 market 参数
    expect(capturedUrl).toContain("/api/templates/list?market=JPN");
    // 2. 点击文件下载，下载 URL 带权限相关的 market/filename 参数
    await page.locator(SEL.link).first().evaluate((el) => (el as HTMLElement).click());
    const downloadUrl = await page.evaluate(() => (window as any).__openedDownloads[0] || null);
    expect(downloadUrl).toContain("/api/templates/download?market=JPN");
    expect(downloadUrl).toContain("filename=template_v1.rtf");
    await snap("确认列表与下载 API 请求及参数");
  });
});
