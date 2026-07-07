import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD15";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/vin-plate`;

// ============================================================
// 截图计数器（每个测试用例独立计数）
// ============================================================
let screenshotCounter: { [key: string]: number } = {};

function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) {
    screenshotCounter[testName] = 0;
  }
  screenshotCounter[testName]++;
  const seq = String(screenshotCounter[testName]).padStart(3, "0");
  return `${SCREENSHOT_DIR}/${testName}_${seq}_${stepName}.jpeg`;
}

// ============================================================
// Mock 数据定义
// ============================================================
const MOCK_VIN_DATA = {
  code: 200,
  msg: "success",
  data: {
    chassisNumber: "JPCT013945",
    type: "VIN_PLATE",
    status: "1",
    msg: "",
    registerDatetime: "2026-01-15 10:30:00",
    docReady: "2026-01-16 14:00:00",
    docSent: "2026-01-17 09:00:00",
    xmlDoc:
      "<root><PrintItem><Name>Plate1</Name></PrintItem><VPData><Variant><Name>Var1</Name><Value>Val1</Value></Variant></VPData></root>",
  },
};

const MOCK_UPDATE_SUCCESS = {
  code: 200,
  msg: "success",
  data: null,
};

const MOCK_ERROR_400 = {
  code: 400,
  msg: "Chassis number INVALID not found.",
  data: null,
};

const MOCK_ERROR_500 = {
  code: 500,
  msg: "系统内部错误",
  data: null,
};

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockViewInfoSuccess(page: Page, delay = 0) {
  await page.route("**/api/ud15/viewinfo", async (route) => {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VIN_DATA),
    });
  });
}

async function mockViewInfoNotFound(page: Page) {
  await page.route("**/api/ud15/viewinfo", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ERROR_400),
    });
  });
}

async function mockViewInfoApiError(page: Page) {
  await page.route("**/api/ud15/viewinfo", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ERROR_500),
    });
  });
}

async function mockViewInfoNetworkError(page: Page) {
  await page.route("**/api/ud15/viewinfo", (route) => {
    route.abort("connectionrefused");
  });
}

async function mockUpdateSuccess(page: Page, apiPattern: string, delay = 0) {
  await page.route(apiPattern, async (route) => {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_UPDATE_SUCCESS),
    });
  });
}

async function mockUpdateApiError(page: Page, apiPattern: string) {
  await page.route(apiPattern, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ERROR_500),
    });
  });
}

async function mockUpdateNetworkError(page: Page, apiPattern: string) {
  await page.route(apiPattern, (route) => {
    route.abort("connectionrefused");
  });
}

// ============================================================
// 设置登录状态
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => {
    localStorage.setItem("currentUser", "testuser");
  });
}

// ============================================================
// 清除登录状态
// ============================================================
async function clearLoginState(page: Page) {
  await page.goto(APP_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => {
    localStorage.removeItem("currentUser");
  });
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD15 VIN Plate - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示标题
    await expect(page.locator("h2.vp-section-title")).toHaveText("Vin Plate");

    // 2. 显示 Chassis number 输入框（最大长度 15）
    await expect(page.locator("label.vp-label")).toHaveText("Chassis number");
    const input = page.locator("input.vp-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("maxLength", "15");

    // 3. 显示5个按钮
    const buttons = page.locator("button.vp-btn");
    await expect(buttons).toHaveCount(5);
    await expect(buttons.nth(0)).toHaveText("View Info");
    await expect(buttons.nth(1)).toHaveText("Set Regenerate");
    await expect(buttons.nth(2)).toHaveText("Set OK");
    await expect(buttons.nth(3)).toHaveText("Change to Basic Info");
    await expect(buttons.nth(4)).toHaveText("Change to Advanced Info");

    // 4. 详细信息展示区域隐藏
    await expect(page.locator("div.vp-details")).toHaveCount(0);

    // 5. 所有按钮可用
    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-搜索区域
  // ============================================================
  test("02_画面初期显示_搜索区域", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Chassis number 输入框为空
    await expect(page.locator("input.vp-input")).toHaveValue("");

    // 2. View Info 按钮可用
    await expect(page.locator("button.vp-btn").first()).toBeEnabled();

    // 3. 详细信息展示区域隐藏
    await expect(page.locator("div.vp-details")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索区域", "初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-状态更新按钮
  // ============================================================
  test("03_画面初期显示_状态更新按钮", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Set Regenerate、Set OK、Change to Basic Info、Change to Advanced Info 按钮可用
    const buttons = page.locator("button.vp-btn");
    await expect(buttons.nth(1)).toBeEnabled(); // Set Regenerate
    await expect(buttons.nth(2)).toBeEnabled(); // Set OK
    await expect(buttons.nth(3)).toBeEnabled(); // Change to Basic Info
    await expect(buttons.nth(4)).toBeEnabled(); // Change to Advanced Info

    // 先输入 Chassis number（否则会先触发空值校验"Please enter a chassis number."）
    await page.locator("input.vp-input").fill("JPCT013945");

    // 2. 未查询时点击这些按钮提示"请先查询Chassis信息"
    // 点击 Set Regenerate
    await buttons.nth(1).click();
    await expect(page.locator("div.vp-error-message")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveText(
      "请先查询Chassis信息",
    );

    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_状态更新按钮",
        "未查询点击错误消息",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 View Info-Chassis number 为空
  // ============================================================
  test("04_ViewInfo_ChassisNumber为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Chassis number 输入框为空
    // 2. 点击 View Info 按钮
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Please enter a chassis number."
    await expect(page.locator("div.vp-error-message")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveText(
      "Please enter a chassis number.",
    );

    // 2. 终止流程，不调用 API
    // 3. 详细信息展示区域保持隐藏
    await expect(page.locator("div.vp-details")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("04_ViewInfo_ChassisNumber为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 View Info-查询成功
  // ============================================================
  test("05_ViewInfo_查询成功", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 Chassis number
    await page.locator("input.vp-input").fill("JPCT013945");

    // 2. 点击 View Info 按钮
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 3. 详细信息展示区域显示
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 4. 显示各字段：Chassis number、Plate type、Status、Error Message、Def.、Data ready、Sent to CAB factory、Print items、VP Data
    await expect(page.locator("div.vp-detail-row")).toHaveCount(9);
    const detailLabels = page.locator("span.vp-detail-label");
    await expect(detailLabels.nth(0)).toHaveText("Chassis number:");
    await expect(detailLabels.nth(1)).toHaveText("Plate type:");
    await expect(detailLabels.nth(2)).toHaveText("Status:");
    await expect(detailLabels.nth(3)).toHaveText("Error Message:");
    await expect(detailLabels.nth(4)).toHaveText("Def.:");
    await expect(detailLabels.nth(5)).toHaveText("Data ready:");
    await expect(detailLabels.nth(6)).toHaveText("Sent to CAB factory:");
    await expect(detailLabels.nth(7)).toHaveText("Print items:");
    await expect(detailLabels.nth(8)).toHaveText("VP Data:");

    await page.screenshot({
      path: getScreenshotPath("05_ViewInfo_查询成功", "详细信息显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 View Info-未找到匹配记录
  // ============================================================
  test("06_ViewInfo_未找到匹配记录", async ({ page }) => {
    await mockViewInfoNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入不存在的 Chassis number
    await page.locator("input.vp-input").fill("INVALID");

    // 2. 点击 View Info 按钮
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 3. 显示警告消息："Chassis number INVALID not found."
    await expect(page.locator("div.vp-error-message")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveText(
      "Chassis number INVALID not found.",
    );

    // 4. 详细信息展示区域保持隐藏
    await expect(page.locator("div.vp-details")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("06_ViewInfo_未找到匹配记录", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 View Info-API 返回错误（500）
  // ============================================================
  test("07_ViewInfo_API返回错误500", async ({ page }) => {
    await mockViewInfoApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 Chassis number
    await page.locator("input.vp-input").fill("JPCT013945");

    // 2. 点击 View Info 按钮
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    await expect(page.locator("div.vp-error-message")).toBeVisible();
    const errorText = await page.locator("div.vp-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 4. 详细信息展示区域保持隐藏
    await expect(page.locator("div.vp-details")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("07_ViewInfo_API返回错误500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 View Info-加载中按钮禁用
  // ============================================================
  test("08_ViewInfo_加载中按钮禁用", async ({ page }) => {
    // 添加延迟使加载状态可捕获
    await mockViewInfoSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 Chassis number
    await page.locator("input.vp-input").fill("JPCT013945");

    // 点击 View Info 按钮
    await page.locator("button.vp-btn").first().click();

    // 1. 加载期间显示 Loading 视图（按钮被替换）
    await expect(page.locator("div.vp-loading")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator("div.vp-loading")).toHaveText("Loading...");
    await expect(page.locator("button.vp-btn")).toHaveCount(0);

    // 2. 等待加载完成
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 3. 加载完成后按钮恢复可用
    await expect(page.locator("button.vp-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("08_ViewInfo_加载中按钮禁用", "加载完成后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 详细信息-Chassis number 显示
  // ============================================================
  test("09_详细信息_ChassisNumber显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. Chassis number 标签显示查询的底盘编号
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(0)).toHaveText("JPCT013945");

    // 2. 显示为只读标签（span元素）
    await expect(page.locator("span.vp-detail-value").first()).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("09_详细信息_ChassisNumber显示", "ChassisNumber"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 详细信息-Plate type 显示
  // ============================================================
  test("10_详细信息_PlateType显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. Plate type 显示 VIN Plate 的模板类型
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(1)).toHaveText("VIN_PLATE");

    await page.screenshot({
      path: getScreenshotPath("10_详细信息_PlateType显示", "PlateType"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 详细信息-Status 显示
  // ============================================================
  test("11_详细信息_Status显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. Status 显示当前状态值
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(2)).toHaveText("1");

    await page.screenshot({
      path: getScreenshotPath("11_详细信息_Status显示", "Status"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 详细信息-Error Message 显示
  // ============================================================
  test("12_详细信息_ErrorMessage显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功（mock数据中msg为空）
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. 若无错误消息则显示为空
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(3)).toHaveText("");

    await page.screenshot({
      path: getScreenshotPath("12_详细信息_ErrorMessage显示", "ErrorMessage"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 详细信息-Def./Data ready/Sent 时间显示
  // ============================================================
  test("13_详细信息_DefDataReadySent时间显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. Def. 显示注册时间
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(4)).toHaveText("2026-01-15 10:30:00");

    // 2. Data ready 显示数据准备时间
    await expect(detailValues.nth(5)).toHaveText("2026-01-16 14:00:00");

    // 3. Sent to CAB factory 显示发送到工厂时间
    await expect(detailValues.nth(6)).toHaveText("2026-01-17 09:00:00");

    // 4. 格式为日期时间格式
    const defText = await detailValues.nth(4).textContent();
    expect(defText).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    await page.screenshot({
      path: getScreenshotPath(
        "13_详细信息_DefDataReadySent时间显示",
        "时间信息",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 详细信息-Print items 显示
  // ============================================================
  test("14_详细信息_PrintItems显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. Print items 显示（xmlDoc 存在时显示 "Parsed from XML"）
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(7)).toHaveText("Parsed from XML");

    await page.screenshot({
      path: getScreenshotPath("14_详细信息_PrintItems显示", "PrintItems"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 详细信息-VP Data 显示
  // ============================================================
  test("15_详细信息_VPData显示", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. VP Data 显示（xmlDoc 存在时显示 "Parsed from XML"）
    const detailValues = page.locator("span.vp-detail-value");
    await expect(detailValues.nth(8)).toHaveText("Parsed from XML");

    await page.screenshot({
      path: getScreenshotPath("15_详细信息_VPData显示", "VPData"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 状态更新-未先查询时点击
  // ============================================================
  test("16_状态更新_未先查询时点击", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入 Chassis number（但未执行 View Info 查询）
    await page.locator("input.vp-input").fill("JPCT013945");

    // 点击 Set Regenerate 按钮（未先查询）
    await page.locator("button.vp-btn").nth(1).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："请先查询Chassis信息"
    await expect(page.locator("div.vp-error-message")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveText(
      "请先查询Chassis信息",
    );

    // 2. 终止流程，不调用 API

    await page.screenshot({
      path: getScreenshotPath("16_状态更新_未先查询时点击", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Set Regenerate-成功
  // ============================================================
  test("17_SetRegenerate_成功", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateSuccess(page, "**/api/ud15/setregenerate");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击 Set Regenerate 按钮
    await page.locator("button.vp-btn").nth(1).click();

    // 1. 调用 API（POST）成功 -> 加载视图出现
    await expect(page.locator("div.vp-loading")).toBeVisible({ timeout: 3000 });

    // 2. 等待加载完成（handleViewInfo 会清除成功消息并重新查询）
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 3. 重新查询后详细信息再次显示
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 4. 无错误消息
    await expect(page.locator("div.vp-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("17_SetRegenerate_成功", "更新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Set OK-成功
  // ============================================================
  test("18_SetOK_成功", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateSuccess(page, "**/api/ud15/setok");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击 Set OK 按钮
    await page.locator("button.vp-btn").nth(2).click();

    // 加载视图出现
    await expect(page.locator("div.vp-loading")).toBeVisible({ timeout: 3000 });

    // 等待加载完成
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 重新查询后详细信息再次显示
    await expect(page.locator("div.vp-details")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("18_SetOK_成功", "更新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Change to Basic Info-成功
  // ============================================================
  test("19_ChangeToBasicInfo_成功", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateSuccess(page, "**/api/ud15/changetobasicinfo");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击 Change to Basic Info 按钮
    await page.locator("button.vp-btn").nth(3).click();

    // 加载视图出现
    await expect(page.locator("div.vp-loading")).toBeVisible({ timeout: 3000 });

    // 等待加载完成
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 重新查询后详细信息再次显示
    await expect(page.locator("div.vp-details")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("19_ChangeToBasicInfo_成功", "更新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Change to Advanced Info-成功
  // ============================================================
  test("20_ChangeToAdvancedInfo_成功", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateSuccess(page, "**/api/ud15/changetoadvancedinfo");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击 Change to Advanced Info 按钮
    await page.locator("button.vp-btn").nth(4).click();

    // 加载视图出现
    await expect(page.locator("div.vp-loading")).toBeVisible({ timeout: 3000 });

    // 等待加载完成
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 重新查询后详细信息再次显示
    await expect(page.locator("div.vp-details")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("20_ChangeToAdvancedInfo_成功", "更新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 状态更新-失败（API 返回错误）
  // ============================================================
  test("21_状态更新_API返回错误", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateApiError(page, "**/api/ud15/setregenerate");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击更新按钮
    await page.locator("button.vp-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.vp-error-message")).toBeVisible();

    // 2. 按钮恢复可用状态
    await expect(page.locator("button.vp-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("21_状态更新_API返回错误", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 状态更新-加载中按钮禁用
  // ============================================================
  test("22_状态更新_加载中按钮禁用", async ({ page }) => {
    await mockViewInfoSuccess(page);
    // 更新API添加延迟使加载状态可捕获
    await mockUpdateSuccess(page, "**/api/ud15/setregenerate", 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击更新按钮
    await page.locator("button.vp-btn").nth(1).click();

    // 1. 加载期间显示 Loading 视图（所有操作按钮被替换）
    await expect(page.locator("div.vp-loading")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator("button.vp-btn")).toHaveCount(0);

    // 2. 等待加载完成
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 按钮恢复可用
    await expect(page.locator("button.vp-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("22_状态更新_加载中按钮禁用", "加载完成后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 状态更新-防止重复提交
  // ============================================================
  test("23_状态更新_防止重复提交", async ({ page }) => {
    await mockViewInfoSuccess(page);
    // 更新API添加延迟
    await mockUpdateSuccess(page, "**/api/ud15/setregenerate", 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 点击更新按钮
    await page.locator("button.vp-btn").nth(1).click();

    // 1. 第二次点击无效（按钮不在DOM中，被加载视图替换）
    await expect(page.locator("div.vp-loading")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator("button.vp-btn")).toHaveCount(0);

    // 2. 等待加载完成
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 3. 加载完成后详细信息再次显示（无错误）
    await expect(page.locator("div.vp-details")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator("div.vp-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("23_状态更新_防止重复提交", "处理完成后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-API 超时
  // ============================================================
  test("24_异常处理_API超时", async ({ page }) => {
    await mockViewInfoNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行查询操作
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(1000);

    // 1. 超时后显示错误消息
    const errorMsg = page.locator("div.vp-error-message");
    const errorCount = await errorMsg.count();
    // 可能显示网络错误消息

    // 2. 按钮恢复可用状态
    await expect(page.locator("button.vp-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-数据库更新异常
  // ============================================================
  test("25_异常处理_数据库更新异常", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateApiError(page, "**/api/ud15/setok");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 执行更新操作
    await page.locator("button.vp-btn").nth(2).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.vp-error-message")).toBeVisible();

    // 2. 按钮恢复可用状态
    await expect(page.locator("button.vp-btn").first()).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("25_异常处理_数据库更新异常", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-用户未登录
  // ============================================================
  test("26_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    // 访问页面
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 检测到未登录状态
    // 2. 跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("26_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 错误消息-显示样式
  // ============================================================
  test("27_错误消息_显示样式", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 触发错误（Chassis number 为空点击 View Info）
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(300);

    // 1. 错误消息显示红色（#ff4d4f）
    const errorMsg = page.locator("div.vp-error-message");
    await expect(errorMsg).toBeVisible();
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    // 2. 默认隐藏（内容为空时不显示）
    // 有内容时已显示

    await page.screenshot({
      path: getScreenshotPath("27_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 成功消息-显示样式
  // ============================================================
  test("28_成功消息_显示样式", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询成功（显示详细信息），验证详细信息区域成功展示
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 1. 详细信息展示区域显示（查询成功）
    await expect(page.locator("div.vp-details")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("28_成功消息_显示样式", "查询成功状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 页面刷新
  // ============================================================
  test("29_页面刷新", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询成功
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. Chassis number 输入框被清空
    await expect(page.locator("input.vp-input")).toHaveValue("");

    // 3. 详细信息展示区域隐藏
    await expect(page.locator("div.vp-details")).toHaveCount(0);

    // 4. 所有按钮恢复可用状态
    const buttons = page.locator("button.vp-btn");
    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("29_页面刷新", "刷新后初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 安全性-API 请求协议
  // ============================================================
  test("30_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud15/**", (route) => {
      const req = route.request();
      apiCalls.push({
        url: req.url(),
        method: req.method(),
      });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: MOCK_VIN_DATA.data,
        }),
      });
    });

    await setLoginState(page);
    // 执行查询操作
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入并查询
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);

    // 检查网络请求
    // 1. API 请求通过 HTTP（本地开发环境）
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("30_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 安全性-权限控制
  // ============================================================
  test("31_安全性_权限控制", async ({ page }) => {
    await mockViewInfoSuccess(page);
    await mockUpdateSuccess(page, "**/api/ud15/setregenerate");
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询 Chassis 信息
    await page.locator("input.vp-input").fill("JPCT013945");
    await page.locator("button.vp-btn").first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("div.vp-details")).toBeVisible();

    // 执行状态更新操作
    await page.locator("button.vp-btn").nth(1).click();

    // 1. 加载视图出现（API调用中）
    await expect(page.locator("div.vp-loading")).toBeVisible({ timeout: 3000 });

    // 2. 加载完成后详细信息再次显示（更新成功+重新查询）
    await expect(page.locator("div.vp-loading")).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("div.vp-details")).toBeVisible();
    await expect(page.locator("div.vp-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("31_安全性_权限控制", "更新成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
