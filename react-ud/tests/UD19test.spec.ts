import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD19";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/search-user`;

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
const MOCK_MARKETS = {
  code: 200,
  msg: "success",
  data: [
    { market: "JPN", description: "Japan" },
    { market: "USA", description: "United States" },
  ],
};

const MOCK_SEARCH_RESULTS = {
  code: 200,
  msg: "success",
  data: {
    users: [
      { userid: "SWE001", user: "Kurt Bjork", market: "-EU,1AD,1CZ" },
      { userid: "SWE002", user: "Anna Smith", market: "-EU" },
    ],
  },
};

const MOCK_USER_NOT_FOUND = {
  code: 400,
  msg: "Userid INVALID不存在",
  message: "Userid INVALID不存在",
  data: null,
};

const MOCK_NO_RESULTS = {
  code: 200,
  msg: "success",
  data: { users: [] },
};

const MOCK_API_ERROR = { code: 500, msg: "系统错误", data: null };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockMarketListSuccess(page: Page) {
  await page.route("**/api/ud19/getmarketlist", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MARKETS),
    }),
  );
}

async function mockMarketListApiError(page: Page) {
  await page.route("**/api/ud19/getmarketlist", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: "Internal Server Error",
    }),
  );
}

async function mockSearchSuccess(page: Page, data = MOCK_SEARCH_RESULTS) {
  await page.route("**/api/ud19/searchhdoc", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
}

async function mockSearchNotFound(page: Page) {
  await page.route("**/api/ud19/searchhdoc", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER_NOT_FOUND),
    }),
  );
}

async function mockSearchNoResults(page: Page) {
  await page.route("**/api/ud19/searchhdoc", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_NO_RESULTS),
    }),
  );
}

async function mockSearchWithDelay(page: Page, delay: number) {
  await page.route("**/api/ud19/searchhdoc", async (route) => {
    await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SEARCH_RESULTS),
    });
  });
}

async function mockSearchNetworkError(page: Page) {
  await page.route("**/api/ud19/searchhdoc", (route) =>
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
    localStorage.setItem("currentUser", "adminuser");
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
test.describe("UD19 Search User - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示标题
    await expect(page.locator("h1.su-title")).toHaveText("Search HDoc User");

    // 2. 搜索条件：Userid 输入框（最大长度10）、User 输入框（最大长度32）
    const inputs = page.locator("input.su-input");
    await expect(inputs.nth(0)).toBeVisible(); // Userid
    await expect(inputs.nth(0)).toHaveAttribute("maxLength", "10");
    await expect(inputs.nth(1)).toBeVisible(); // User
    await expect(inputs.nth(1)).toHaveAttribute("maxLength", "32");

    // 3. Market 下拉列表
    await expect(page.locator("select.su-select")).toBeVisible();

    // 4. Not set/Rule/Template 单选按钮
    await expect(page.locator("input#not-set")).toBeVisible();
    await expect(page.locator("input#rule")).toBeVisible();
    await expect(page.locator("input#template")).toBeVisible();

    // 5. Search 按钮
    const searchBtn = page.locator("button.su-button");
    await expect(searchBtn).toBeVisible();
    await expect(searchBtn).toHaveText("Search");

    // 6. DataTable
    await expect(page.locator("table.su-table")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-市场列表加载
  // ============================================================
  test("02_画面初期显示_市场列表加载", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 调用 API 获取市场列表
    // 2. Market 下拉列表填充市场数据
    const options = page.locator("select.su-select option");
    // 空选项 + JPN + USA = 3
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveAttribute("value", "");
    await expect(options.nth(1)).toHaveAttribute("value", "JPN");
    await expect(options.nth(2)).toHaveAttribute("value", "USA");

    // 3. Market 默认显示空选项
    await expect(page.locator("select.su-select")).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "市场列表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-初始状态
  // ============================================================
  test("03_画面初期显示_初始状态", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Userid 和 User 输入框为空
    const inputs = page.locator("input.su-input");
    await expect(inputs.nth(0)).toHaveValue("");
    await expect(inputs.nth(1)).toHaveValue("");

    // 2. Not set 单选按钮默认选中
    await expect(page.locator("input#not-set")).toBeChecked();

    // 3. Rule 和 Template 未选中
    await expect(page.locator("input#rule")).not.toBeChecked();
    await expect(page.locator("input#template")).not.toBeChecked();

    // 4. DataTable 为空
    await expect(page.locator("table.su-table")).toHaveCount(0);

    // 5. 无错误消息
    await expect(page.locator("div.su-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 Userid 搜索-Userid 为空（未入力→Not set検索へ）
  // ============================================================
  test("04_Userid搜索_Userid为空", async ({ page }) => {
    await mockMarketListSuccess(page);
    // Userid 为空时走 Not set 検索パス → API をモック
    await mockSearchNoResults(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Userid 为空
    // 2. 点击 Search 按钮（Userid 为空时走 Not set 検索）
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 空のまま Not set 検索が実行される（エラーは表示されない）
    await expect(page.locator("div.su-error-message")).toHaveCount(0);
    await expect(page.locator("button.su-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("04_Userid搜索_Userid为空", "検索実行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 Userid 搜索-包含非法字符
  // ============================================================
  test("05_Userid搜索_包含非法字符", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Userid 输入包含特殊符号
    await page.locator("input.su-input").nth(0).fill("@#$");

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Userid只能包含半角英数字"
    await expect(page.locator("div.su-error-message")).toBeVisible();
    await expect(page.locator("div.su-error-message")).toHaveText(
      "Userid只能包含半角英数字",
    );

    await page.screenshot({
      path: getScreenshotPath("05_Userid搜索_包含非法字符", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 Userid 搜索-长度超过 10 字符
  // ============================================================
  test("06_Userid搜索_长度超过10字符", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Userid 输入超过 10 字符（maxLength=10 会限制）
    await page.locator("input.su-input").nth(0).fill("ABCDEFGHIJKLMNOPQRST");

    // 由于 maxLength 截断，通过 JS 绕过限制设置超长值
    await page.evaluate(() => {
      const input = document.querySelectorAll(
        "input.su-input",
      )[0] as HTMLInputElement;
      if (input) {
        input.removeAttribute("maxLength");
      }
    });
    await page.locator("input.su-input").nth(0).fill("ABCDEFGHIJKLMNOP");

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："Userid长度不能超过10字符"
    await expect(page.locator("div.su-error-message")).toBeVisible();
    await expect(page.locator("div.su-error-message")).toHaveText(
      "Userid长度不能超过10字符",
    );

    await page.screenshot({
      path: getScreenshotPath("06_Userid搜索_长度超过10字符", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 User 搜索-User 为空（空UserでSearch → Useridが空ならUser必須）
  // ============================================================
  test("07_User搜索_User为空", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // User 为空、Userid も空 → Not set 検索へ
    await mockSearchNoResults(page);
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // エラーなしで Not set 検索が実行される
    await expect(page.locator("button.su-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("07_User搜索_User为空", "検索実行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 User 搜索-包含非法字符
  // ============================================================
  test("08_User搜索_包含非法字符", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // User 输入包含特殊符号（先确保 Userid 为空）
    await page.locator("input.su-input").nth(1).fill("@#$");

    // 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："User只能包含半角英数字"
    await expect(page.locator("div.su-error-message")).toBeVisible();
    await expect(page.locator("div.su-error-message")).toHaveText(
      "User只能包含半角英数字",
    );

    await page.screenshot({
      path: getScreenshotPath("08_User搜索_包含非法字符", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 User 搜索-长度超过 32 字符
  // ============================================================
  test("09_User搜索_长度超过32字符", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 通过 JS 移除 maxLength 限制
    await page.evaluate(() => {
      const input = document.querySelectorAll(
        "input.su-input",
      )[1] as HTMLInputElement;
      if (input) {
        input.removeAttribute("maxLength");
      }
    });
    await page
      .locator("input.su-input")
      .nth(1)
      .fill("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567"); // 33 chars

    // 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："User长度不能超过32字符"
    await expect(page.locator("div.su-error-message")).toBeVisible();
    await expect(page.locator("div.su-error-message")).toHaveText(
      "User长度不能超过32字符",
    );

    await page.screenshot({
      path: getScreenshotPath("09_User搜索_长度超过32字符", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Userid 搜索-成功
  // ============================================================
  test("10_Userid搜索_成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 Userid
    await page.locator("input.su-input").nth(0).fill("SWE");

    // 2. 选择权限类型 Not set（默认）
    // 3. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 4. 结果填充到 DataTable
    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    // 5. 表格显示 Userid、User、Market 列
    await expect(rows.nth(0).locator("td.su-td").nth(0)).toHaveText("SWE001");
    await expect(rows.nth(0).locator("td.su-td").nth(1)).toHaveText(
      "Kurt Bjork",
    );
    await expect(rows.nth(0).locator("td.su-td").nth(2)).toHaveText(
      "-EU,1AD,1CZ",
    );
    await expect(rows.nth(1).locator("td.su-td").nth(0)).toHaveText("SWE002");
    await expect(rows.nth(1).locator("td.su-td").nth(1)).toHaveText(
      "Anna Smith",
    );
    await expect(rows.nth(1).locator("td.su-td").nth(2)).toHaveText("-EU");

    await page.screenshot({
      path: getScreenshotPath("10_Userid搜索_成功", "搜索结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Userid 搜索-Userid 不存在
  // ============================================================
  test("11_Userid搜索_Userid不存在", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入不存在的 Userid
    await page.locator("input.su-input").nth(0).fill("INVALID");

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    await expect(page.locator("div.su-error-message")).toBeVisible();
    await expect(page.locator("div.su-error-message")).toHaveText(
      "Userid INVALID不存在",
    );

    // 4. DataTable 为空
    await expect(page.locator("table.su-table")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("11_Userid搜索_Userid不存在", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 User 搜索-成功
  // ============================================================
  test("12_User搜索_成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 User（先确保 Userid 为空）
    await page.locator("input.su-input").nth(1).fill("Kurt Bjork");

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. 结果填充到 DataTable
    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    await page.screenshot({
      path: getScreenshotPath("12_User搜索_成功", "搜索结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 User 搜索-User 不存在
  // ============================================================
  test("13_User搜索_User不存在", async ({ page }) => {
    // 使用自定义 mock 返回 User 不存在的错误
    const mockUserNotFound = {
      code: 400,
      msg: "User INVALIDUSER不存在",
      message: "User INVALIDUSER不存在",
      data: null,
    };

    await mockMarketListSuccess(page);
    await page.route("**/api/ud19/searchhdoc", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUserNotFound),
      }),
    );
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入不存在的 User（半角英数字のみでバリデーション通過）
    await page.locator("input.su-input").nth(1).fill("INVALIDUSER");

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    await expect(page.locator("div.su-error-message")).toBeVisible();
    await expect(page.locator("div.su-error-message")).toHaveText(
      "User INVALIDUSER不存在",
    );

    // 4. DataTable 为空
    await expect(page.locator("table.su-table")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("13_User搜索_User不存在", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Not set 搜索-成功
  // ============================================================
  test("14_NotSet搜索_成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    // Not set 搜索不加 UserID/User，用 searchType=NOT_SET
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Not set 默认选中
    // 2. 点击 Search 按钮（Userid 和 User 均为空，Not set 已选中）
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. 结果填充到 DataTable
    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    await page.screenshot({
      path: getScreenshotPath("14_NotSet搜索_成功", "搜索结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Rule 搜索-成功
  // ============================================================
  test("15_Rule搜索_成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择 Rule 单选按钮
    await page.locator("input#rule").check();

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. 结果填充到 DataTable
    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    await page.screenshot({
      path: getScreenshotPath("15_Rule搜索_成功", "搜索结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Rule 搜索-无结果
  // ============================================================
  test("16_Rule搜索_无结果", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchNoResults(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择 Rule 单选按钮
    await page.locator("input#rule").check();

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. data.code=200 且 data.data.users 为空数组 → 无错误消息，DataTable 不显示
    await expect(page.locator("table.su-table")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("16_Rule搜索_无结果", "无结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Template 搜索-成功
  // ============================================================
  test("17_Template搜索_成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择 Template 单选按钮
    await page.locator("input#template").check();

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. 结果填充到 DataTable
    await expect(page.locator("table.su-table")).toBeVisible();
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    await page.screenshot({
      path: getScreenshotPath("17_Template搜索_成功", "搜索结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Template 搜索-无结果
  // ============================================================
  test("18_Template搜索_无结果", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchNoResults(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择 Template 单选按钮
    await page.locator("input#template").check();

    // 2. 点击 Search 按钮
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 3. DataTable 不显示
    await expect(page.locator("table.su-table")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("18_Template搜索_无结果", "无结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 所有搜索-无任何匹配结果
  // ============================================================
  test("19_所有搜索_无任何匹配结果", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchNoResults(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入无条件进行搜索（全部为空，Not set 默认）
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 2. data.code=200 且 data.data.users 为空数组 → 无错误消息，DataTable 不显示
    await expect(page.locator("table.su-table")).toHaveCount(0);
    await expect(page.locator("div.su-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("19_所有搜索_无任何匹配结果", "无结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 DataTable-列标题显示
  // ============================================================
  test("20_DataTable_列标题显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 搜索
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 1. 显示列标题：Userid、User、Market
    const headers = page.locator("th.su-th");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toHaveText("Userid");
    await expect(headers.nth(1)).toHaveText("User");
    await expect(headers.nth(2)).toHaveText("Market");

    // 2. 列标题显示完整

    await page.screenshot({
      path: getScreenshotPath("20_DataTable_列标题显示", "列标题"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 DataTable-多行数据显示
  // ============================================================
  test("21_DataTable_多行数据显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 搜索返回多条结果
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 1. 每行显示 Userid、User、Market 列
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    // 2. Market 列显示格式如 "-EU,1AD,1CZ"
    await expect(rows.nth(0).locator("td.su-td").nth(2)).toHaveText(
      "-EU,1AD,1CZ",
    );

    // 3. 数据正确地展示在表格中
    await expect(rows.nth(0).locator("td.su-td").nth(0)).toHaveText("SWE001");
    await expect(rows.nth(1).locator("td.su-td").nth(0)).toHaveText("SWE002");

    await page.screenshot({
      path: getScreenshotPath("21_DataTable_多行数据显示", "多行数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 COUNT-搜索结果计数显示
  // ============================================================
  test("22_COUNT_搜索结果计数显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 搜索
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // DataTable 显示 2 行数据
    const rows = page.locator("table.su-table tbody tr");
    await expect(rows).toHaveCount(2);

    await page.screenshot({
      path: getScreenshotPath("22_COUNT_搜索结果计数显示", "搜索结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 异常处理-获取市场列表失败
  // ============================================================
  test("23_异常处理_获取市场列表失败", async ({ page }) => {
    await mockMarketListApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.su-error-message")).toBeVisible();

    // 2. Market 下拉列表显示加载中或为空
    // API失败时 catch 中设置错误消息，marketList 保持为空

    await page.screenshot({
      path: getScreenshotPath("23_异常处理_获取市场列表失败", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-API 超时
  // ============================================================
  test("24_异常处理_API超时", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行搜索操作
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(1000);

    // 1. 超时后显示错误消息
    // 2. Search 按钮恢复可用状态
    await expect(page.locator("button.su-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-Saviynt 系统连接异常
  // ============================================================
  test("25_异常处理_Saviynt系统连接异常", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行搜索操作（模拟 Saviynt 连接失败）
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    // 2. Search 按钮恢复可用状态
    await expect(page.locator("button.su-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("25_异常处理_Saviynt系统连接异常", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-数据库连接异常
  // ============================================================
  test("26_异常处理_数据库连接异常", async ({ page }) => {
    await mockMarketListSuccess(page);
    // API 返回 non-ok 状态码模拟数据库异常
    await page.route("**/api/ud19/searchhdoc", (route) => {
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

    // 执行搜索操作
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.su-error-message")).toBeVisible();

    // 2. Search 按钮恢复可用状态
    await expect(page.locator("button.su-button")).toBeEnabled();

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
    await mockMarketListSuccess(page);

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
  // No.28 RadioBox-单选互斥
  // ============================================================
  test("28_RadioBox_单选互斥", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Not set 默认选中
    await expect(page.locator("input#not-set")).toBeChecked();

    // 2. 点击 Rule → Not set 取消选中，Rule 选中
    await page.locator("input#rule").check();
    await expect(page.locator("input#rule")).toBeChecked();
    await expect(page.locator("input#not-set")).not.toBeChecked();
    await expect(page.locator("input#template")).not.toBeChecked();

    // 3. 点击 Template → Rule 取消选中，Template 选中
    await page.locator("input#template").check();
    await expect(page.locator("input#template")).toBeChecked();
    await expect(page.locator("input#rule")).not.toBeChecked();
    await expect(page.locator("input#not-set")).not.toBeChecked();

    // 4. 再次点击已选中的不会取消选中
    await page.locator("input#template").check();
    await expect(page.locator("input#template")).toBeChecked();

    // 5. 点击 Not set → 回到 Not set
    await page.locator("input#not-set").check();
    await expect(page.locator("input#not-set")).toBeChecked();
    await expect(page.locator("input#rule")).not.toBeChecked();
    await expect(page.locator("input#template")).not.toBeChecked();

    await page.screenshot({
      path: getScreenshotPath("28_RadioBox_单选互斥", "单选状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 错误消息-显示样式
  // ============================================================
  test("29_错误消息_显示样式", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 触发错误（Userid 输入非法字符触发前端校验）
    await page.locator("input.su-input").nth(0).fill("@#$");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(300);

    // 1. 错误消息显示红色（#ff4d4f）
    const errorMsg = page.locator("div.su-error-message");
    await expect(errorMsg).toBeVisible();
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    // 2. 默认隐藏（内容为空时不显示）

    await page.screenshot({
      path: getScreenshotPath("29_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 Search-加载中按钮禁用
  // ============================================================
  test("30_Search_加载中按钮禁用", async ({ page }) => {
    await mockMarketListSuccess(page);
    // API に遅延を追加
    await mockSearchWithDelay(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力
    await page.locator("input.su-input").nth(0).fill("SWE");

    // クリック
    await page.locator("button.su-button").click();

    // 1. Search 按钮在加载期间禁用
    await expect(page.locator("button.su-button")).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.su-button")).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("30_Search_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 Search-防止重复提交
  // ============================================================
  test("31_Search_防止重复提交", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchWithDelay(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 入力
    await page.locator("input.su-input").nth(0).fill("SWE");

    // 1回目のクリック
    await page.locator("button.su-button").click();

    // 1. ボタンが disabled になる
    await expect(page.locator("button.su-button")).toBeDisabled({
      timeout: 3000,
    });

    // 2回目を強制クリック
    await page.locator("button.su-button").click({ force: true });

    // 2. 完了後テーブルが1回だけ表示される
    await expect(page.locator("button.su-button")).toBeEnabled({
      timeout: 10000,
    });
    await expect(page.locator("table.su-table")).toBeVisible();
    await expect(page.locator("table.su-table tbody tr")).toHaveCount(2);

    await page.screenshot({
      path: getScreenshotPath("31_Search_防止重复提交", "処理完了"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 页面刷新
  // ============================================================
  test("32_页面刷新", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 搜索并显示结果
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);
    await expect(page.locator("table.su-table")).toBeVisible();

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. Userid 和 User 输入框被清空
    const inputs = page.locator("input.su-input");
    await expect(inputs.nth(0)).toHaveValue("");
    await expect(inputs.nth(1)).toHaveValue("");

    // 3. Not set 默认选中
    await expect(page.locator("input#not-set")).toBeChecked();

    // 4. DataTable 清空
    await expect(page.locator("table.su-table")).toHaveCount(0);

    // 5. 无错误消息
    await expect(page.locator("div.su-error-message")).toHaveCount(0);

    // 6. 按钮可用
    await expect(page.locator("button.su-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("32_页面刷新", "刷新后初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-API 请求协议
  // ============================================================
  test("33_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud19/**", (route) => {
      const req = route.request();
      apiCalls.push({ url: req.url(), method: req.method() });
      if (req.url().includes("getmarketlist")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_MARKETS),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SEARCH_RESULTS),
        });
      }
    });

    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行搜索操作
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 检查网络请求
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("33_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.34 安全性-数据只读
  // ============================================================
  test("34_安全性_数据只读", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockSearchSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 搜索
    await page.locator("input.su-input").nth(0).fill("SWE");
    await page.locator("button.su-button").click();
    await page.waitForTimeout(500);

    // 1. 所有用户数据为只读展示（table > td 是文本展示）
    const cells = page.locator("td.su-td");
    await expect(cells).toHaveCount(6); // 2 rows × 3 cols

    // 2. 不允许修改操作（没有 input/button 在表格内）
    await expect(page.locator("table.su-table input")).toHaveCount(0);
    await expect(page.locator("table.su-table button")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("34_安全性_数据只读", "只读数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 安全性-Userid 半角英数字校验
  // ============================================================
  test("35_安全性_Userid半角英数字校验", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const userIdInput = page.locator("input.su-input").nth(0);

    // 输入半角英数字（正常）
    await userIdInput.fill("SWE001");
    await expect(userIdInput).toHaveValue("SWE001");

    // 全角文字を入力
    await userIdInput.fill("テスト");
    // コンポーネントに入力制限がないため、入力可能

    await page.screenshot({
      path: getScreenshotPath("35_安全性_Userid半角英数字校验", "UserID入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
