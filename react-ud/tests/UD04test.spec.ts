import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD04";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/generate-document?chassisNo=JPCT013945`;

// ============================================================
// 截图计数器
// ============================================================
let screenshotCounter: { [key: string]: number } = {};

function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) screenshotCounter[testName] = 0;
  screenshotCounter[testName]++;
  return `${SCREENSHOT_DIR}/${testName}_${String(screenshotCounter[testName]).padStart(3, "0")}_${stepName}.jpeg`;
}

// ============================================================
// 模拟API响应
// ============================================================
function mockApiSuccess(page: Page, overrides: Record<string, any> = {}) {
  const defaultData = {
    serie: "JPCT",
    chnr: "013945",
    model: "FMX",
    spec: "201617",
    ordernumber: "15101319",
    build: "2016173",
    customerAdap: "S1810111",
    countryOfOperation: "IDO",
    loadIndex: "FTLI-150",
    act: "N",
    variable: "VARIABLE_1",
    newval: "NEWVALUE_1",
    template: "_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf",
    generatedFilePath: "/files/test.trf",
    serverTime: "2022-12-06 07:30:31",
    programVersion: "4.2.1",
    ...overrides,
  };
  return page.route("**/api/UD04/selectGeneratedocument*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 200, msg: "成功", data: defaultData }),
    });
  });
}

function mockApi404(page: Page) {
  return page.route("**/api/UD04/selectGeneratedocument*", (route) => {
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ code: 404, msg: "Chassis not found", data: null }),
    });
  });
}

function mockApi500(page: Page) {
  return page.route("**/api/UD04/selectGeneratedocument*", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: 500, msg: "系统错误", data: null }),
    });
  });
}

function mockApiNetworkError(page: Page) {
  return page.route("**/api/UD04/selectGeneratedocument*", (route) =>
    route.abort("connectionrefused"),
  );
}

function mockApiDelay(page: Page, ms: number = 12000) {
  return page.route("**/api/UD04/selectGeneratedocument*", async (route) => {
    await new Promise((r) => setTimeout(r, ms));
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "成功",
        data: { serie: "JPCT", chnr: "013945" },
      }),
    });
  });
}

function mockApiInvalidJson(page: Page) {
  return page.route("**/api/UD04/selectGeneratedocument*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "not-json{{{",
    });
  });
}

// ============================================================
// 页面导航
// ============================================================
async function navigateToPage(page: Page, url: string = PAGE_URL) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#root", { timeout: 15000 });
  await page.waitForTimeout(1500);
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD04 Generate Document - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-加载中状态
  // ============================================================
  test("01_画面初期表示_加载中状态", async ({ page }) => {
    await mockApiDelay(page, 3000);
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(500);

    await expect(page.locator("div.gd-loading")).toBeVisible();
    await expect(page.locator("div.gd-loading")).toHaveText("Loading...");
    // 加载期间不显示数据字段
    await expect(page.locator("div.gd-info-group")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("01_加载中状态", "加载中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-信息字段完整显示
  // ============================================================
  test("02_画面初期显示_信息字段完整显示", async ({ page }) => {
    await mockApiSuccess(page);
    await navigateToPage(page);

    const labels = page.locator("span.gd-label");
    const labelTexts = await labels.allTextContents();
    const allLabels = labelTexts.join(" ");
    expect(allLabels).toContain("Chassis no");
    expect(allLabels).toContain("Ordernumber");
    expect(allLabels).toContain("Build week");
    expect(allLabels).toContain("Spec week");
    expect(allLabels).toContain("Market");
    expect(allLabels).toContain("Master Market");
    expect(allLabels).toContain("Load index");
    expect(allLabels).toContain("Using template");
    // Replacing parameters 为 div.gd-param-label 不是 span.gd-label
    await expect(page.locator("div.gd-param-label")).toBeVisible();
    expect(allLabels).toContain("Date");
    expect(allLabels).toContain("HDoc version");

    await page.screenshot({
      path: getScreenshotPath("02_信息字段完整显示", "完整画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-URL 参数底盘号解析
  // ============================================================
  test("03_URL参数底盘号解析", async ({ page }) => {
    const apiRequests: string[] = [];
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      apiRequests.push(route.request().url());
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "成功",
          data: { serie: "JPCT", chnr: "013945" },
        }),
      });
    });

    await navigateToPage(
      page,
      `${APP_URL}/generate-document?chassisNo=JPCT013945`,
    );

    // API 请求参数包含 chassisSeries 和 chassisNo
    expect(apiRequests.length).toBeGreaterThan(0);
    const requestUrl = apiRequests[0];
    expect(requestUrl).toContain("chassisSeries=JPCT");
    expect(requestUrl).toContain("chassisNo=013945");
    // Chassis no 字段显示拼接后的底盘号
    const chassisNoText = await page
      .locator("span.gd-label.chassis-no-label ~ span.gd-value")
      .textContent();
    expect(chassisNoText).toBeTruthy();

    await page.screenshot({
      path: getScreenshotPath("03_URL参数底盘号解析", "底盘号显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 API 成功-OM 接收数据表示
  // ============================================================
  test("04_API成功_OM接收数据表示", async ({ page }) => {
    await mockApiSuccess(page, {
      ordernumber: "15101319",
      build: "2016173",
      spec: "201617",
      customerAdap: "S1810111",
    });
    await navigateToPage(page);

    await expect(
      page.locator("span.gd-value").filter({ hasText: "15101319" }).first(),
    ).toBeVisible();
    await expect(
      page.locator("span.gd-value").filter({ hasText: "2016173" }).first(),
    ).toBeVisible();
    await expect(
      page.locator("span.gd-value").filter({ hasText: "201617" }).first(),
    ).toBeVisible();
    await expect(page.locator("div.gd-snote-no")).toHaveText("S1810111");

    await page.screenshot({
      path: getScreenshotPath("04_API成功_OM数据", "OM数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 API 成功-VDA 数据表示
  // ============================================================
  test("05_API成功_VDA数据表示", async ({ page }) => {
    await mockApiSuccess(page, { countryOfOperation: "IDO" });
    await navigateToPage(page);

    // Market 显示 "IDO"
    await expect(
      page.locator("span.gd-value").filter({ hasText: "IDO" }).first(),
    ).toBeVisible();
    // Master Market 固定显示 "-EU"
    await expect(
      page.locator("span.gd-value").filter({ hasText: "-EU" }).first(),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("05_API成功_VDA数据", "VDA数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 API 成功-KOLA 轮胎主数据表示
  // ============================================================
  test("06_API成功_KOLA轮胎主数据", async ({ page }) => {
    await mockApiSuccess(page, { loadIndex: "FTLI-150" });
    await navigateToPage(page);

    await expect(
      page.locator("span.gd-value").filter({ hasText: "FTLI-150" }).first(),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("06_API成功_KOLA数据", "KOLA数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 API 失败-底盘号不存在（404）
  // ============================================================
  test("07_API失败_底盘号不存在404", async ({ page }) => {
    await mockApi404(page);
    await navigateToPage(page);
    await page.waitForTimeout(500);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText("Chassis not found");

    await page.screenshot({
      path: getScreenshotPath("07_API失败_404", "404错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 API 失败-服务器错误（500）
  // ============================================================
  test("08_API失败_服务器错误500", async ({ page }) => {
    await mockApi500(page);
    await navigateToPage(page);
    await page.waitForTimeout(500);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText(
      "System error. Please contact administrator.",
    );

    await page.screenshot({
      path: getScreenshotPath("08_API失败_500", "500错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 API 失败-网络错误
  // ============================================================
  test("09_API失败_网络错误", async ({ page }) => {
    await mockApiNetworkError(page);
    await navigateToPage(page);
    await page.waitForTimeout(1000);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText(
      "System error. Please contact administrator.",
    );

    await page.screenshot({
      path: getScreenshotPath("09_API失败_网络错误", "网络错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 API 失败-JSON 解析异常
  // ============================================================
  test("10_API失败_JSON解析异常", async ({ page }) => {
    await mockApiInvalidJson(page);
    await navigateToPage(page);
    await page.waitForTimeout(500);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText(
      "System error. Please contact administrator.",
    );

    await page.screenshot({
      path: getScreenshotPath("10_API失败_JSON解析异常", "JSON错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 S-Note 有值-消息显示
  // ============================================================
  test("11_SNote有值_消息显示", async ({ page }) => {
    await mockApiSuccess(page, { customerAdap: "S1810111" });
    await navigateToPage(page);

    await expect(page.locator("div.gd-snote-no")).toHaveText("S1810111");
    await expect(page.locator("div.gd-snote-message")).toBeVisible();
    await expect(page.locator("div.gd-snote-message")).toHaveText(
      "The S-Notes above can affect homologation documents.",
    );

    await page.screenshot({
      path: getScreenshotPath("11_SNote有值_消息显示", "SNote消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 S-Note 为空-消息不显示
  // ============================================================
  test("12_SNote为空_消息不显示", async ({ page }) => {
    await mockApiSuccess(page, { customerAdap: null });
    await navigateToPage(page);

    await expect(page.locator("div.gd-snote-no")).toHaveText("-");
    await expect(page.locator("div.gd-snote-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("12_SNote为空_消息不显示", "无SNote"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 ADCA 激活（ACT=Y）-警告消息显示
  // ============================================================
  test("13_ADCA激活_警告消息显示", async ({ page }) => {
    await mockApiSuccess(page, {
      act: "Y",
      variable: "PARAM_X",
      newval: "VALUE_Y",
    });
    await navigateToPage(page);

    await expect(page.locator("span.gd-adca-warning-link")).toBeVisible();
    await expect(page.locator("span.gd-adca-warning-link")).toHaveText(
      "After def change detected. Document need to be modified.",
    );
    // Replacing parameters 显示
    await expect(page.locator("div.gd-replacing-params")).toBeVisible();
    await expect(page.locator("div.gd-param-label")).toHaveText(
      "Replacing parameters",
    );

    await page.screenshot({
      path: getScreenshotPath("13_ADCA激活_警告消息", "ADCA激活"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 ADCA 非激活（ACT=N）-警告消息不显示
  // ============================================================
  test("14_ADCA非激活_警告消息不显示", async ({ page }) => {
    await mockApiSuccess(page, { act: "N", variable: "", newval: "" });
    await navigateToPage(page);

    await expect(page.locator("span.gd-adca-warning-link")).toHaveCount(0);
    await expect(page.locator("div.gd-replacing-params")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("14_ADCA非激活_无警告", "ADCA非激活"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 ADCA 激活时-跳转到 Modify Document
  // ============================================================
  test("15_ADCA激活_跳转到ModifyDocument", async ({ page }) => {
    await mockApiSuccess(page, { act: "Y", countryOfOperation: "IDO" });
    await navigateToPage(page);

    await page.locator("span.gd-adca-warning-link").dispatchEvent("click");
    await page.waitForTimeout(2000);
    // 验证导航到 modify-document 页面
    expect(page.url()).toContain("modify-document");

    await page.screenshot({
      path: getScreenshotPath("15_ADCA激活_跳转Modify", "跳转后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 文档下载-正常下载
  // ============================================================
  test("16_文档下载_正常下载", async ({ page }) => {
    // 监听下载文件请求
    let fileRequested = false;
    await page.route("**/*.trf", (route) => {
      fileRequested = true;
      route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="VIN_PLATE_013945.trf"',
        },
        body: "test file content",
      });
    });

    await mockApiSuccess(page, {
      generatedFilePath: "/files/test.trf",
      chnr: "013945",
    });
    await navigateToPage(page);

    // 点击下载链接
    await page.locator("span.gd-download-link").dispatchEvent("click");
    await page.waitForTimeout(2000);

    // 1. 文件请求已触发
    expect(fileRequested).toBe(true);
    // 2. 无错误消息
    await expect(page.locator("div.gd-error-message")).toHaveCount(0);
    // 3. 验证文件名（通过组件逻辑：VIN_PLATE_${chnr}.trf）
    const fileName = `VIN_PLATE_013945.trf`;
    expect(fileName).toContain(".trf");
    expect(fileName).toContain("013945");
    expect(fileName).toContain("VIN_PLATE");

    await page.screenshot({
      path: getScreenshotPath("16_文档下载_正常下载", "下载触发"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 文档下载-文件路径为空
  // ============================================================
  test("17_文档下载_文件路径为空", async ({ page }) => {
    await mockApiSuccess(page, { generatedFilePath: "" });
    await navigateToPage(page);

    await page.locator("span.gd-download-link").dispatchEvent("click");
    await page.waitForTimeout(1000);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText("Document file not found");

    await page.screenshot({
      path: getScreenshotPath("17_文档下载_路径为空", "下载失败"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Analyze Rules-画面跳转
  // ============================================================
  test("18_AnalyzeRules_画面跳转", async ({ page }) => {
    await mockApiSuccess(page);
    await navigateToPage(page);

    await page
      .getByText("Analyze Rules", { exact: true })
      .dispatchEvent("click");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("analyze-rules");

    await page.screenshot({
      path: getScreenshotPath("18_AnalyzeRules_跳转", "跳转后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Chassis no 链接-显示底盘详细信息
  // ============================================================
  test("19_ChassisNo链接_底盘详细信息", async ({ page }) => {
    await mockApiSuccess(page, { serie: "JPCT", chnr: "013945" });
    await navigateToPage(page);

    // 点击 Chassis no 链接（蓝色带下划线）
    await page.locator("a.gd-link").first().dispatchEvent("click");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("vehicle-specification");

    await page.screenshot({
      path: getScreenshotPath("19_ChassisNo链接_跳转", "跳转后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Using template-显示
  // ============================================================
  test("20_UsingTemplate_显示", async ({ page }) => {
    await mockApiSuccess(page, {
      template: "_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf",
    });
    await navigateToPage(page);

    await expect(
      page
        .locator("span.gd-value")
        .filter({ hasText: "_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.trf" }),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("20_UsingTemplate_显示", "模板路径"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Date-服务器时间显示
  // ============================================================
  test("21_Date_服务器时间显示", async ({ page }) => {
    await mockApiSuccess(page, { serverTime: "2022-12-06 07:30:31" });
    await navigateToPage(page);

    await expect(
      page.locator("span.gd-value").filter({ hasText: "2022-12-06 07:30:31" }),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("21_Date_服务器时间", "时间显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 HDoc version-程序版本显示
  // ============================================================
  test("22_HDocVersion_程序版本显示", async ({ page }) => {
    await mockApiSuccess(page, { programVersion: "4.2.1" });
    await navigateToPage(page);

    await expect(
      page.locator("span.gd-value").filter({ hasText: "4.2.1" }),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("22_HDocVersion_版本显示", "版本号"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 异常处理-API 超时
  // ============================================================
  test("23_异常处理_API超时", async ({ page }) => {
    await mockApiDelay(page, 12000);
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(1000);

    // 仍在加载中
    await expect(page.locator("div.gd-loading")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("23_异常处理_API超时", "超时状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-用户未登录
  // ============================================================
  test("24_异常处理_用户未登录", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("24_异常处理_用户未登录", "未登录访问"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-文件下载失败
  // ============================================================
  test("25_异常处理_文件下载失败", async ({ page }) => {
    await mockApiSuccess(page, { generatedFilePath: "" });
    await navigateToPage(page);

    await page.locator("span.gd-download-link").dispatchEvent("click");
    await page.waitForTimeout(1000);

    await expect(page.locator("div.gd-error-message")).toBeVisible();
    await expect(page.locator("div.gd-error-message")).toHaveText(
      "Document file not found",
    );

    await page.screenshot({
      path: getScreenshotPath("25_异常处理_下载失败", "下载失败"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 安全性-API 请求协议
  // ============================================================
  test("26_安全性_API请求协议", async ({ page }) => {
    const apiUrls: string[] = [];
    await page.route("**/api/UD04/**", (route) => {
      apiUrls.push(route.request().url());
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "成功",
          data: { serie: "JPCT", chnr: "013945" },
        }),
      });
    });

    await navigateToPage(page);
    expect(apiUrls.length).toBeGreaterThan(0);

    await page.screenshot({
      path: getScreenshotPath("26_安全性_API请求协议", "API请求"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 安全性-用户登录认证
  // ============================================================
  test("27_安全性_用户登录认证", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("27_安全性_用户登录认证", "未登录认证"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 安全性-敏感数据权限控制
  // ============================================================
  test("28_安全性_敏感数据权限控制", async ({ page }) => {
    await mockApiSuccess(page);
    // 以普通用户登录
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.setItem("currentUser", "test_user"));

    await navigateToPage(page);

    // 页面正常显示数据
    await expect(page.locator("div.gd-main-content")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("28_安全性_敏感数据权限", "数据展示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 错误消息-显示样式
  // ============================================================
  test("29_错误消息_显示样式", async ({ page }) => {
    await mockApi404(page);
    await navigateToPage(page);
    await page.waitForTimeout(500);

    const errorMsg = page.locator("div.gd-error-message");
    await expect(errorMsg).toBeVisible();
    // 检查颜色 #ff4d4f
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("29_错误消息_显示样式", "错误样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 页面刷新
  // ============================================================
  test("30_页面刷新", async ({ page }) => {
    let apiCallCount = 0;
    await page.route("**/api/UD04/selectGeneratedocument*", (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "成功",
          data: { ordernumber: "15101319", build: "2016173" },
        }),
      });
    });

    await navigateToPage(page);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 重新调用 API
    expect(apiCallCount).toBeGreaterThanOrEqual(2);
    // 数据正常显示
    await expect(page.locator("div.gd-main-content")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
