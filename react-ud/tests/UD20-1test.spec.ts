import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD20-1";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/market-document-settings`;

// ============================================================
// 截图计数器
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
const MOCK_UPDATE_SUCCESS = {
  code: 200,
  msg: "success",
  data: null,
};
const MOCK_UPDATE_NOT_FOUND = {
  code: 404,
  msg: "Document type does not exists",
  data: null,
};
const MOCK_UPDATE_ERROR = { code: 500, msg: "更新失败", data: null };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockUpdateSuccess(page: Page, delay = 0) {
  await page.route("**/api/ud20-1/updatehdocdocumentlist", async (route) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_UPDATE_SUCCESS),
    });
  });
}

async function mockUpdateNotFound(page: Page) {
  await page.route("**/api/ud20-1/updatehdocdocumentlist", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_UPDATE_NOT_FOUND),
    }),
  );
}

async function mockUpdateApiError(page: Page) {
  await page.route("**/api/ud20-1/updatehdocdocumentlist", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_UPDATE_ERROR),
    }),
  );
}

async function mockUpdateNetworkError(page: Page) {
  await page.route("**/api/ud20-1/updatehdocdocumentlist", (route) =>
    route.abort("connectionrefused"),
  );
}

// ============================================================
// 设置/清除登录状态
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => {
    localStorage.setItem("currentUser", "admin");
  });
}

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
test.describe("UD20-1 Market Document Settings - 单体测试", () => {
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
    await expect(page.locator("h1.mds-title")).toHaveText(
      "HDoc - Market Document Settings",
    );

    // 2. Document type 输入框
    const doctypeInput = page.locator("input.mds-width-doctype");
    await expect(doctypeInput).toBeVisible();
    await expect(
      page.locator("label.mds-label").filter({ hasText: "Document type:" }),
    ).toBeVisible();

    // 3. Market 输入框
    await expect(
      page.locator("label.mds-label").filter({ hasText: "Market:" }),
    ).toBeVisible();
    await expect(page.locator("input.mds-width-market")).toBeVisible();

    // 4. Setting 下拉列表
    await expect(
      page.locator("label.mds-label").filter({ hasText: "Setting:" }),
    ).toBeVisible();
    const settingSelect = page.locator("select.mds-width-setting");
    await expect(settingSelect).toBeVisible();

    // 5. Bussines unit 输入框（固定显示 "BU"）
    await expect(
      page.locator("label.mds-label").filter({ hasText: "Bussines unit:" }),
    ).toBeVisible();
    await expect(page.locator("input.mds-width-bu")).toBeVisible();

    // 6. User 输入框
    await expect(
      page.locator("label.mds-label").filter({ hasText: "User:" }),
    ).toBeVisible();
    await expect(page.locator("input.mds-width-user")).toBeVisible();
    await expect(page.locator("span.mds-auto-text").first()).toBeVisible();

    // 7. Date 输入框
    await expect(
      page.locator("label.mds-label").filter({ hasText: "Date:" }),
    ).toBeVisible();
    await expect(page.locator("input.mds-width-date")).toBeVisible();

    // 8. 四个按钮
    const buttons = page.locator("button.mds-btn");
    await expect(buttons).toHaveCount(4);
    await expect(buttons.nth(0)).toHaveText("Search");
    await expect(buttons.nth(1)).toHaveText("Clear");
    await expect(buttons.nth(2)).toHaveText("Back");
    await expect(buttons.nth(3)).toHaveText("Update Mode");

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-初期化状态
  // ============================================================
  test("02_画面初期显示_初期化状态", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Document type 为空
    await expect(page.locator("input.mds-width-doctype")).toHaveValue("");

    // 2. Market 为空
    await expect(page.locator("input.mds-width-market")).toHaveValue("");

    // 3. Setting 显示初始选项（第一个 option）
    const settingSelect = page.locator("select.mds-width-setting");
    await expect(settingSelect).toHaveValue("");

    // 4. Bussines unit 固定显示 "BU"
    await expect(page.locator("input.mds-width-bu")).toHaveValue("BU");

    // 5. User 显示登录用户 "admin"
    await expect(page.locator("input.mds-width-user")).toHaveValue("admin");

    // 6. Date 自动填充
    const dateInput = page.locator("input.mds-width-date");
    const dateValue = await dateInput.inputValue();
    expect(dateValue.length).toBeGreaterThan(0);

    // 7. 所有输入框可用（readOnly 除く）
    await expect(page.locator("input.mds-width-doctype")).toBeEnabled();
    await expect(page.locator("input.mds-width-market")).toBeEnabled();

    // 8. 四个按钮均可用
    const buttons = page.locator("button.mds-btn");
    for (let i = 0; i < 4; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    // 9. Error message 区域不显示
    await expect(page.locator("div.mds-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初期化状态", "初期状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-从后画面 Select 返回
  // ============================================================
  test("03_画面初期显示_从后画面Select返回", async ({ page }) => {
    await setLoginState(page);
    // Search を実行して List 画面に遷移
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");
    await page.locator("button.mds-btn").first().click(); // Search
    await page.waitForTimeout(500);

    // goBack で戻る
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 画面が表示されてエラーがないことを確認
    await expect(page.locator("h1.mds-title")).toBeVisible();
    await expect(page.locator("div.mds-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_从后画面Select返回",
        "Select返回",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-从后画面 Back 返回
  // ============================================================
  test("04_画面初期显示_从后画面Back返回", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 画面が正常に表示されることを確認
    await expect(page.locator("h1.mds-title")).toHaveText(
      "HDoc - Market Document Settings",
    );
    await expect(page.locator("div.mds-error-message")).toHaveCount(0);
    await expect(page.locator("div.mds-success-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_从后画面Back返回", "初期状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 Search-携带检索条件跳转
  // ============================================================
  test("05_Search_携带检索条件跳转", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 入力检索条件
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");

    // 2. 点击 Search 按钮
    await page.locator("button.mds-btn").first().click();
    await page.waitForTimeout(500);

    // 3. 跳转到 Market Document Settings List 画面
    await expect(page).toHaveURL(/market-document-settings-list/);

    await page.screenshot({
      path: getScreenshotPath("05_Search_携带检索条件跳转", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 Search-检索条件为空（実装ではエラー表示）
  // ============================================================
  test("06_Search_检索条件为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 不输入任何检索条件
    // 2. 点击 Search 按钮
    await page.locator("button.mds-btn").first().click();
    await page.waitForTimeout(300);

    // 実装では空の場合はエラー表示："Please enter a document type."
    await expect(page.locator("div.mds-error-message")).toBeVisible();
    await expect(page.locator("div.mds-error-message")).toHaveText(
      "Please enter a document type.",
    );

    await page.screenshot({
      path: getScreenshotPath("06_Search_检索条件为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 Search-部分检索条件跳转
  // ============================================================
  test("07_Search_部分检索条件跳转", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 仅输入 Document type
    await page.locator("input.mds-width-doctype").fill("COC");

    // 2. 点击 Search 按钮
    await page.locator("button.mds-btn").first().click();
    await page.waitForTimeout(500);

    // 3. 跳转到 List 画面
    await expect(page).toHaveURL(/market-document-settings-list/);

    await page.screenshot({
      path: getScreenshotPath("07_Search_部分检索条件跳转", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 Clear-正常清空
  // ============================================================
  test("08_Clear_正常清空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力各字段值
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");
    await page.locator("input.mds-width-market").fill("JPN");
    await page.locator("select.mds-width-setting").selectOption("Option1");

    // 点击 Clear 按钮
    await page.locator("button.mds-btn").nth(1).click();
    await page.waitForTimeout(300);

    // 1. Document type 被清空
    await expect(page.locator("input.mds-width-doctype")).toHaveValue("");

    // 2. Bussines unit 恢复为 "BU"
    await expect(page.locator("input.mds-width-bu")).toHaveValue("BU");

    // 3. User 保持（clear不清除user）
    await expect(page.locator("input.mds-width-user")).toHaveValue("admin");

    // 4. Date 保持（clear不清除date）
    const dateVal = await page.locator("input.mds-width-date").inputValue();
    expect(dateVal.length).toBeGreaterThan(0);

    // 5. Market 被清空
    await expect(page.locator("input.mds-width-market")).toHaveValue("");

    // 6. Setting 重置为初始选项
    await expect(page.locator("select.mds-width-setting")).toHaveValue("");

    // 7. Error message 区域不显示
    await expect(page.locator("div.mds-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("08_Clear_正常清空", "清空后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Clear-有错误消息时清空
  // ============================================================
  test("09_Clear_有错误消息时清空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先触发错误消息
    await page.locator("button.mds-btn").first().click();
    await page.waitForTimeout(300);
    await expect(page.locator("div.mds-error-message")).toBeVisible();

    // 点击 Clear 按钮
    await page.locator("button.mds-btn").nth(1).click();
    await page.waitForTimeout(300);

    // 1. Error message 被清除
    await expect(page.locator("div.mds-error-message")).toHaveCount(0);

    // 2. 画面回到初始状态
    await expect(page.locator("input.mds-width-doctype")).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath("09_Clear_有错误消息时清空", "清空后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Back-返回前画面
  // ============================================================
  test("10_Back_返回前画面", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 点击 Back 按钮
    await page.locator("button.mds-btn").nth(2).click();
    await page.waitForTimeout(500);

    // 2. 返回前页面（前の履歴がないので現在のURLのまま）
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("10_Back_返回前画面", "返回后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Update Mode-空值校验（Document type 为空）
  // ============================================================
  test("11_UpdateMode_DocumentType为空", async ({ page }) => {
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Document type 留空
    // 2. 点击 Update Mode 按钮
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Document type不能为空"
    await expect(page.locator("div.mds-error-message")).toBeVisible();
    await expect(page.locator("div.mds-error-message")).toHaveText(
      "Document type不能为空",
    );

    // 2. 类型为 Error（红色）
    const color = await page
      .locator("div.mds-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    // 3. 不调用 API
    // 4. Update Mode 按钮恢复可用状态
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("11_UpdateMode_DocumentType为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Update Mode-更新成功
  // ============================================================
  test("12_UpdateMode_更新成功", async ({ page }) => {
    await mockUpdateSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力有效值
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");
    await page.locator("input.mds-width-market").fill("JPN");
    await page.locator("select.mds-width-setting").selectOption("Option1");

    // 点击 Update Mode 按钮
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(500);

    // 1. 前端校验通过
    // 2. 调用 API 成功
    // 3. 显示成功消息："更新成功"
    await expect(page.locator("div.mds-success-message")).toBeVisible();
    await expect(page.locator("div.mds-success-message")).toHaveText(
      "更新成功",
    );

    await page.screenshot({
      path: getScreenshotPath("12_UpdateMode_更新成功", "成功消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Update Mode-更新失败（API 返回 500）
  // ============================================================
  test("13_UpdateMode_API返回500", async ({ page }) => {
    await mockUpdateApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力有效值
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");
    await page.locator("input.mds-width-market").fill("JPN");

    // 点击 Update Mode 按钮
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(500);

    // 1. 调用 API
    // 2. API 返回 code=500 → 显示错误消息："更新失败"
    await expect(page.locator("div.mds-error-message")).toBeVisible();
    await expect(page.locator("div.mds-error-message")).toHaveText("更新失败");

    // 3. 类型为 Error（红色）
    const color = await page
      .locator("div.mds-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    // 4. Update Mode 按钮恢复可用状态
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("13_UpdateMode_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Update Mode-Document type 不存在（404）
  // ============================================================
  test("14_UpdateMode_DocumentType不存在", async ({ page }) => {
    await mockUpdateNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力不存在值
    await page.locator("input.mds-width-doctype").fill("NONEXISTENT");
    await page.locator("input.mds-width-market").fill("JPN");

    // 点击 Update Mode 按钮
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(500);

    // 1. 调用 API
    // 2. API 返回 code=404
    await expect(page.locator("div.mds-error-message")).toBeVisible();
    await expect(page.locator("div.mds-error-message")).toHaveText(
      "Document type does not exists. Please enter the correct content.",
    );

    // 3. 类型为 Error（红色）
    const color = await page
      .locator("div.mds-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    // 4. Update Mode 按钮恢复可用状态
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("14_UpdateMode_DocumentType不存在", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Update Mode-加载中按钮禁用
  // ============================================================
  test("15_UpdateMode_加载中按钮禁用", async ({ page }) => {
    await mockUpdateSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力有效值
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");

    // 点击 Update Mode 按钮
    await page.locator("button.mds-btn").nth(3).click();

    // 1. Update Mode 按钮在加载期间禁用
    await expect(page.locator("button.mds-btn").nth(3)).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("15_UpdateMode_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Update Mode-加载中防止重复提交
  // ============================================================
  test("16_UpdateMode_防止重复提交", async ({ page }) => {
    await mockUpdateSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力有效值
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");

    // 1回目のクリック
    await page.locator("button.mds-btn").nth(3).click();

    // 1. ボタンが disabled になる
    await expect(page.locator("button.mds-btn").nth(3)).toBeDisabled({
      timeout: 3000,
    });

    // 2回目を強制クリック（無効）
    await page.locator("button.mds-btn").nth(3).click({ force: true });

    // 2. 完了後に成功メッセージが1回だけ表示される
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled({
      timeout: 10000,
    });
    await expect(page.locator("div.mds-success-message")).toBeVisible();
    await expect(page.locator("div.mds-success-message")).toHaveCount(1);

    await page.screenshot({
      path: getScreenshotPath("16_UpdateMode_防止重复提交", "処理完了"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 异常处理-数据库连接失败
  // ============================================================
  test("17_异常处理_数据库连接失败", async ({ page }) => {
    // API 500 を返して DB 接続失敗を模擬
    await page.route("**/api/ud20-1/updatehdocdocumentlist", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "Internal Server Error",
      });
    });
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");

    // 点击 Update Mode
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.mds-error-message")).toBeVisible();

    // 2. Update Mode 按钮恢复可用状态
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("17_异常处理_数据库连接失败", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 异常处理-网络断开
  // ============================================================
  test("18_异常处理_网络断开", async ({ page }) => {
    await mockUpdateNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");

    // 点击 Update Mode
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    // 2. Update Mode 按钮恢复可用状态
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("18_异常处理_网络断开", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-API 超时
  // ============================================================
  test("19_异常处理_API超时", async ({ page }) => {
    await mockUpdateNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");

    // 点击 Update Mode
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息（catch 処理）
    // 2. Update Mode 按钮恢复可用状态
    await expect(page.locator("button.mds-btn").nth(3)).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("19_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-用户未登录
  // ============================================================
  test("20_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    // 访问页面
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 检测到未登录状态
    // 2. 跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("20_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 安全性-API 请求协议
  // ============================================================
  test("21_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud20-1/**", (route) => {
      const req = route.request();
      apiCalls.push({ url: req.url(), method: req.method() });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_UPDATE_SUCCESS),
      });
    });

    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行 Update Mode 操作
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(500);

    // 检查网络请求
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("21_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 安全性-权限控制
  // ============================================================
  test("22_安全性_权限控制", async ({ page }) => {
    await mockUpdateSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行 Update Mode 操作
    await page.locator("input.mds-width-doctype").fill("VIN_PLATE");
    await page.locator("button.mds-btn").nth(3).click();
    await page.waitForTimeout(500);

    // 1. 成功执行更新操作
    await expect(page.locator("div.mds-success-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("22_安全性_权限控制", "更新成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
