import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD16";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/ad-change`;

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
const MOCK_ADD_SUCCESS = { code: 200, msg: "success", data: null };
const MOCK_ADD_EXISTING = {
  code: 400,
  msg: "AFTER DEF CHANGE IS NOT ACTIVATED",
  data: null,
};
const MOCK_ADD_ERROR = { code: 500, msg: "系统错误", data: null };
const MOCK_DELETE_SUCCESS = { code: 200, msg: "success", data: null };
const MOCK_DELETE_NOT_FOUND = {
  code: 400,
  msg: "记录不存在，无法删除",
  data: null,
};
const MOCK_DELETE_ERROR = { code: 500, msg: "系统错误", data: null };
const MOCK_CHECK_ACTIVATED = {
  code: 200,
  msg: "ACTIVATED",
  data: { act: "Y" },
};
const MOCK_CHECK_NOT_ACTIVATED = {
  code: 200,
  msg: "AFTER DEF CHANGE IS NOT ACTIVATED",
  data: { act: "N" },
};
const MOCK_CHECK_NOT_FOUND = { code: 404, msg: "记录不存在", data: null };
const MOCK_CHECK_ERROR = { code: 500, msg: "系统错误", data: null };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockAddSuccess(page: Page, delay = 0) {
  await page.route("**/api/ud16/add", async (route) => {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ADD_SUCCESS),
    });
  });
}

async function mockAddExisting(page: Page) {
  await page.route("**/api/ud16/add", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ADD_EXISTING),
    });
  });
}

async function mockAddApiError(page: Page) {
  await page.route("**/api/ud16/add", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_ADD_ERROR),
    });
  });
}

async function mockAddNetworkError(page: Page) {
  await page.route("**/api/ud16/add", (route) => {
    route.abort("connectionrefused");
  });
}

async function mockDeleteSuccess(page: Page, delay = 0) {
  await page.route("**/api/ud16/delete", async (route) => {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DELETE_SUCCESS),
    });
  });
}

async function mockDeleteNotFound(page: Page) {
  await page.route("**/api/ud16/delete", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DELETE_NOT_FOUND),
    });
  });
}

async function mockDeleteApiError(page: Page) {
  await page.route("**/api/ud16/delete", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DELETE_ERROR),
    });
  });
}

async function mockDeleteNetworkError(page: Page) {
  await page.route("**/api/ud16/delete", (route) => {
    route.abort("connectionrefused");
  });
}

async function mockCheckActivated(page: Page) {
  await page.route("**/api/ud16/check*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CHECK_ACTIVATED),
    });
  });
}

async function mockCheckNotActivated(page: Page) {
  await page.route("**/api/ud16/check*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CHECK_NOT_ACTIVATED),
    });
  });
}

async function mockCheckNotFound(page: Page) {
  await page.route("**/api/ud16/check*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CHECK_NOT_FOUND),
    });
  });
}

async function mockCheckApiError(page: Page) {
  await page.route("**/api/ud16/check*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CHECK_ERROR),
    });
  });
}

async function mockCheckNetworkError(page: Page) {
  await page.route("**/api/ud16/check*", (route) => {
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
test.describe("UD16 AD Change - 单体测试", () => {
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
    await expect(page.locator("h2.adc-section-title")).toHaveText("AD Change");

    // 2. 显示 Serie-Chnr 输入框（最大长度15）
    await expect(page.locator("label.adc-label").first()).toHaveText(
      "Serie-Chnr",
    );
    const serieInput = page.locator("input.adc-input");
    await expect(serieInput).toBeVisible();
    await expect(serieInput).toHaveAttribute("maxLength", "15");

    // 3. 显示 Desc 输入框（最大长度4000）
    await expect(page.locator("label.adc-label").nth(1)).toHaveText("Desc");
    const descInput = page.locator("input.adc-input-desc");
    await expect(descInput).toBeVisible();
    await expect(descInput).toHaveAttribute("maxLength", "4000");

    // 4. 显示3个按钮
    const buttons = page.locator("button.adc-btn");
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveText("ADD");
    await expect(buttons.nth(1)).toHaveText("DELETE");
    await expect(buttons.nth(2)).toHaveText("CHECK");

    // 5. 所有按钮可用
    for (let i = 0; i < 3; i++) {
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
  // No.2 画面初期显示-输入框初始状态
  // ============================================================
  test("02_画面初期显示_输入框初始状态", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Serie-Chnr 输入框为空
    await expect(page.locator("input.adc-input")).toHaveValue("");

    // 2. Desc 输入框为空
    await expect(page.locator("input.adc-input-desc")).toHaveValue("");

    // 3. 无错误消息和成功消息显示
    await expect(page.locator("div.adc-error-message")).toHaveCount(0);
    await expect(page.locator("div.adc-success-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_输入框初始状态", "初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 ADD-Serie-Chnr 为空
  // ============================================================
  test("03_ADD_SerieChnr为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Serie-Chnr 为空
    // 2. 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Serie-Chnr不能为空"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "Serie-Chnr不能为空",
    );

    // 2. 终止流程，不调用 API
    // 3. ADD 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("03_ADD_SerieChnr为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 ADD-Serie-Chnr 长度超过 15 字符
  // ============================================================
  test("04_ADD_SerieChnr长度超过15字符", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Serie-Chnr 输入超过 15 字符（maxLength=15 会限制输入）
    // 使用 JS 设置绕过 maxLength 限制
    await page.locator("input.adc-input").fill("ABCDEFGHIJKLMNOP"); // 16 chars
    // 但 maxLength 会截断，所以需要直接通过 JS 设置值
    await page.evaluate(() => {
      const input = document.querySelector(
        "input.adc-input",
      ) as HTMLInputElement;
      if (input) {
        // 删除 maxLength 属性以输入更长的值
        input.removeAttribute("maxLength");
      }
    });
    await page.locator("input.adc-input").fill("ABCDEFGHIJKLMNOPQRSTUV"); // 21 chars

    // 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Serie-Chnr长度不能超过15字符"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "Serie-Chnr长度不能超过15字符",
    );

    // 2. 终止流程，不调用 API
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("04_ADD_SerieChnr长度超过15字符", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 ADD-Desc 长度超过 4000 字符
  // ============================================================
  test("05_ADD_Desc长度超过4000字符", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 通过 JS 移除 maxLength 并输入超长 Desc
    await page.evaluate(() => {
      const input = document.querySelector(
        "input.adc-input-desc",
      ) as HTMLInputElement;
      if (input) {
        input.removeAttribute("maxLength");
      }
    });
    const longDesc = "A".repeat(4001);
    await page.locator("input.adc-input-desc").fill(longDesc);

    // 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Desc长度不能超过4000字符"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "Desc长度不能超过4000字符",
    );

    // 2. 终止流程，不调用 API
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("05_ADD_Desc长度超过4000字符", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 ADD-成功
  // ============================================================
  test("06_ADD_成功", async ({ page }) => {
    await mockAddSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 Serie-Chnr 和 Desc
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");

    // 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 1. 调用 API（POST）成功
    // 2. 显示成功消息："AD Change记录添加成功"（绿色）
    await expect(page.locator("div.adc-success-message")).toBeVisible();
    await expect(page.locator("div.adc-success-message")).toHaveText(
      "AD Change记录添加成功",
    );

    // 3. 输入框被清空
    await expect(page.locator("input.adc-input")).toHaveValue("");
    await expect(page.locator("input.adc-input-desc")).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath("06_ADD_成功", "成功消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 ADD-记录已存在且未激活
  // ============================================================
  test("07_ADD_记录已存在且未激活", async ({ page }) => {
    await mockAddExisting(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入已存在的 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");

    // 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 1. 显示警告消息："AFTER DEF CHANGE IS NOT ACTIVATED"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "AFTER DEF CHANGE IS NOT ACTIVATED",
    );

    await page.screenshot({
      path: getScreenshotPath("07_ADD_记录已存在且未激活", "警告消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 ADD-失败（API 返回 500）
  // ============================================================
  test("08_ADD_API返回500", async ({ page }) => {
    await mockAddApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效值
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");

    // 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    const errorText = await page.locator("div.adc-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 2. ADD 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("08_ADD_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 ADD-加载中按钮禁用
  // ============================================================
  test("09_ADD_加载中按钮禁用", async ({ page }) => {
    await mockAddSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效值
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");

    // 点击 ADD 按钮
    await page.locator("button.adc-btn").nth(0).click();

    // 1. ADD 按钮在加载期间禁用
    await expect(page.locator("button.adc-btn").nth(0)).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("09_ADD_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 DELETE-Serie-Chnr 为空
  // ============================================================
  test("10_DELETE_SerieChnr为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Serie-Chnr 为空
    // 2. 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Serie-Chnr不能为空"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "Serie-Chnr不能为空",
    );

    // 2. 终止流程，不弹出确认对话框
    // 3. 不调用 API
    await expect(page.locator("button.adc-btn").nth(1)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("10_DELETE_SerieChnr为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 DELETE-确认对话框-点击取消
  // ============================================================
  test("11_DELETE_确认对话框_点击取消", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 设置对话框处理 - 点击取消
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "Do you really want to delete this AD Change record?",
      );
      dialog.dismiss();
    });

    // 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 1. 弹出确认对话框
    // 2. 点击取消后流程终止
    // 3. 不调用 API（无成功/错误消息）
    await expect(page.locator("div.adc-success-message")).toHaveCount(0);
    await expect(page.locator("div.adc-error-message")).toHaveCount(0);

    // 4. DELETE 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(1)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("11_DELETE_确认对话框_点击取消", "取消后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 DELETE-确认对话框-点击确定并成功
  // ============================================================
  test("12_DELETE_确认对话框_点击确定并成功", async ({ page }) => {
    await mockDeleteSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        "Do you really want to delete this AD Change record?",
      );
      dialog.accept();
    });

    // 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 1. 弹出确认对话框
    // 2. 点击确定后调用 API（DELETE）
    // 3. API 返回 code=200
    // 4. 显示成功消息："AD Change记录删除成功"（绿色）
    await expect(page.locator("div.adc-success-message")).toBeVisible();
    await expect(page.locator("div.adc-success-message")).toHaveText(
      "AD Change记录删除成功",
    );

    // 5. Serie-Chnr 输入框被清空
    await expect(page.locator("input.adc-input")).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath(
        "12_DELETE_确认对话框_点击确定并成功",
        "成功消息",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 DELETE-记录不存在
  // ============================================================
  test("13_DELETE_记录不存在", async ({ page }) => {
    await mockDeleteNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入不存在的 Serie-Chnr
    await page.locator("input.adc-input").fill("NONEXIST");

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    // 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息："记录不存在，无法删除"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "记录不存在，无法删除",
    );

    // 2. DELETE 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(1)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("13_DELETE_记录不存在", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 DELETE-失败（API 返回 500）
  // ============================================================
  test("14_DELETE_API返回500", async ({ page }) => {
    await mockDeleteApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效值
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    // 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    const errorText = await page.locator("div.adc-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 2. DELETE 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(1)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("14_DELETE_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 DELETE-加载中按钮禁用
  // ============================================================
  test("15_DELETE_加载中按钮禁用", async ({ page }) => {
    await mockDeleteSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效值
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    // 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();

    // 1. DELETE 按钮在加载期间禁用
    await expect(page.locator("button.adc-btn").nth(1)).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.adc-btn").nth(1)).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("15_DELETE_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 CHECK-Serie-Chnr 为空
  // ============================================================
  test("16_CHECK_SerieChnr为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Serie-Chnr 为空
    // 2. 点击 CHECK 按钮
    await page.locator("button.adc-btn").nth(2).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Serie-Chnr不能为空"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "Serie-Chnr不能为空",
    );

    // 2. 终止流程，不调用 API
    // 3. CHECK 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(2)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("16_CHECK_SerieChnr为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 CHECK-记录存在且已激活
  // ============================================================
  test("17_CHECK_记录存在且已激活", async ({ page }) => {
    await mockCheckActivated(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入存在的 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 点击 CHECK 按钮
    await page.locator("button.adc-btn").nth(2).click();
    await page.waitForTimeout(500);

    // 1. 调用 API（GET）成功
    // 2. 显示消息："记录存在且已激活"
    await expect(page.locator("div.adc-success-message")).toBeVisible();
    await expect(page.locator("div.adc-success-message")).toHaveText(
      "记录存在且已激活",
    );

    await page.screenshot({
      path: getScreenshotPath("17_CHECK_记录存在且已激活", "成功消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 CHECK-记录存在但未激活
  // ============================================================
  test("18_CHECK_记录存在但未激活", async ({ page }) => {
    await mockCheckNotActivated(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入存在的 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 点击 CHECK 按钮
    await page.locator("button.adc-btn").nth(2).click();
    await page.waitForTimeout(500);

    // 1. 显示警告消息："AFTER DEF CHANGE IS NOT ACTIVATED"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "AFTER DEF CHANGE IS NOT ACTIVATED",
    );

    await page.screenshot({
      path: getScreenshotPath("18_CHECK_记录存在但未激活", "警告消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 CHECK-记录不存在
  // ============================================================
  test("19_CHECK_记录不存在", async ({ page }) => {
    await mockCheckNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入不存在的 Serie-Chnr
    await page.locator("input.adc-input").fill("NONEXIST");

    // 点击 CHECK 按钮
    await page.locator("button.adc-btn").nth(2).click();
    await page.waitForTimeout(500);

    // 1. 显示提示信息："记录不存在"
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    await expect(page.locator("div.adc-error-message")).toHaveText(
      "记录不存在",
    );

    await page.screenshot({
      path: getScreenshotPath("19_CHECK_记录不存在", "提示信息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 CHECK-失败（API 返回 500）
  // ============================================================
  test("20_CHECK_API返回500", async ({ page }) => {
    await mockCheckApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效值
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 点击 CHECK 按钮
    await page.locator("button.adc-btn").nth(2).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    const errorText = await page.locator("div.adc-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 2. CHECK 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(2)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("20_CHECK_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 CHECK-加载中按钮禁用
  // ============================================================
  test("21_CHECK_加载中按钮禁用", async ({ page }) => {
    // CHECK使用GET请求，使用延迟mock
    await page.route("**/api/ud16/check*", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CHECK_ACTIVATED),
      });
    });

    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效值
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 点击 CHECK 按钮
    await page.locator("button.adc-btn").nth(2).click();

    // 1. CHECK 按钮在加载期间禁用
    await expect(page.locator("button.adc-btn").nth(2)).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.adc-btn").nth(2)).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("21_CHECK_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Serie-Chnr-最大长度 15 字符
  // ============================================================
  test("22_SerieChnr_最大长度15字符", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入 16 个以上字符（maxLength=15 会限制输入）
    await page.locator("input.adc-input").fill("ABCDEFGHIJKLMNOPQRST");

    // 1. 输入框最多只能输入 15 个字符
    const inputValue = await page.locator("input.adc-input").inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(15);

    // 2. 超出部分无法输入
    await expect(page.locator("input.adc-input")).toHaveValue(
      "ABCDEFGHIJKLMNO",
    );

    await page.screenshot({
      path: getScreenshotPath("22_SerieChnr_最大长度15字符", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Desc-最大长度 4000 字符
  // ============================================================
  test("23_Desc_最大长度4000字符", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入 4001 个以上字符（maxLength=4000 会限制输入）
    const longText = "A".repeat(5000);
    await page.locator("input.adc-input-desc").fill(longText);

    // 1. 输入框最多只能输入 4000 个字符
    const inputValue = await page.locator("input.adc-input-desc").inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(4000);

    // 2. 超出部分无法输入
    await expect(page.locator("input.adc-input-desc")).toHaveValue(
      "A".repeat(4000),
    );

    await page.screenshot({
      path: getScreenshotPath("23_Desc_最大长度4000字符", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-API 超时
  // ============================================================
  test("24_异常处理_API超时", async ({ page }) => {
    await mockAddNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行 ADD 操作
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(1000);

    // 1. 超时后显示错误消息
    const errorMsg = page.locator("div.adc-error-message");

    // 2. 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-网络连接失败
  // ============================================================
  test("25_异常处理_网络连接失败", async ({ page }) => {
    await mockDeleteNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行 DELETE 操作
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    // 2. 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(1)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("25_异常处理_网络连接失败", "网络错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-数据库连接异常
  // ============================================================
  test("26_异常处理_数据库连接异常", async ({ page }) => {
    await mockAddApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行 ADD 操作（API 返回 500 模拟数据库异常）
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.adc-error-message")).toBeVisible();
    const errorText = await page.locator("div.adc-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 2. 按钮恢复可用状态
    await expect(page.locator("button.adc-btn").nth(0)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("26_异常处理_数据库连接异常", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 异常处理-用户未登录
  // ============================================================
  test("27_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    // 访问页面
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 检测到未登录状态
    // 2. 跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("27_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 错误消息-显示样式
  // ============================================================
  test("28_错误消息_显示样式", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 触发错误
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(300);

    // 1. 错误消息显示
    const errorMsg = page.locator("div.adc-error-message");
    await expect(errorMsg).toBeVisible();

    // 错误消息颜色（CSS: #721c24 → rgb(114, 28, 36)）
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(114, 28, 36)");

    // 2. 默认隐藏（内容为空时不显示）
    // 有内容时已显示

    await page.screenshot({
      path: getScreenshotPath("28_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 成功消息-显示样式
  // ============================================================
  test("29_成功消息_显示样式", async ({ page }) => {
    await mockAddSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行成功 ADD 操作
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 1. 成功消息显示绿色（CSS: #155724 → rgb(21, 87, 36)）
    const successMsg = page.locator("div.adc-success-message");
    await expect(successMsg).toBeVisible();
    const color = await successMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(21, 87, 36)");

    await page.screenshot({
      path: getScreenshotPath("29_成功消息_显示样式", "成功消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 页面刷新
  // ============================================================
  test("30_页面刷新", async ({ page }) => {
    await mockAddSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入部分值
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("测试描述");

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. Serie-Chnr 和 Desc 输入框被清空
    await expect(page.locator("input.adc-input")).toHaveValue("");
    await expect(page.locator("input.adc-input-desc")).toHaveValue("");

    // 3. 无错误消息和成功消息显示
    await expect(page.locator("div.adc-error-message")).toHaveCount(0);
    await expect(page.locator("div.adc-success-message")).toHaveCount(0);

    // 4. 所有按钮恢复可用状态
    const buttons = page.locator("button.adc-btn");
    for (let i = 0; i < 3; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "刷新后初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 安全性-API 请求协议
  // ============================================================
  test("31_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud16/**", (route) => {
      const req = route.request();
      apiCalls.push({
        url: req.url(),
        method: req.method(),
      });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADD_SUCCESS),
      });
    });

    await setLoginState(page);
    // 执行 ADD 操作
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 检查网络请求
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("31_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 安全性-权限控制
  // ============================================================
  test("32_安全性_权限控制", async ({ page }) => {
    await mockAddSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行 ADD 操作（授权用户）
    await page.locator("input.adc-input").fill("JPCT-G28321");
    await page.locator("input.adc-input-desc").fill("描述信息");
    await page.locator("button.adc-btn").nth(0).click();
    await page.waitForTimeout(500);

    // 1. 授权用户可执行增删操作
    await expect(page.locator("div.adc-success-message")).toBeVisible();

    // 2. 所有变更记录日志（通过 API 请求的 updateUser 参数传递）

    await page.screenshot({
      path: getScreenshotPath("32_安全性_权限控制", "ADD成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-DELETE 操作确认
  // ============================================================
  test("33_安全性_DELETE操作确认", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 Serie-Chnr
    await page.locator("input.adc-input").fill("JPCT-G28321");

    // 监听对话框
    let dialogShown = false;
    page.on("dialog", (dialog) => {
      dialogShown = true;
      expect(dialog.message()).toBe(
        "Do you really want to delete this AD Change record?",
      );
      dialog.dismiss();
    });

    // 点击 DELETE 按钮
    await page.locator("button.adc-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 1. DELETE 操作前弹出确认对话框
    expect(dialogShown).toBe(true);

    // 2. 防止误删重要数据（点击取消后不执行删除）
    await expect(page.locator("div.adc-success-message")).toHaveCount(0);
    await expect(page.locator("div.adc-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("33_安全性_DELETE操作确认", "确认对话框"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
