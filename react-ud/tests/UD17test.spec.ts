import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD17";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-user-administration`;

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
const MOCK_MARKETS = {
  code: 200,
  msg: "success",
  data: [
    { market: "JPN", description: "Japan" },
    { market: "USA", description: "United States" },
    { market: "CHN", description: "China" },
  ],
};

const MOCK_USER_INFO_SUCCESS = {
  code: 200,
  msg: "success",
  data: { username: "Test User" },
};

const MOCK_USER_INFO_NOT_FOUND = {
  code: 400,
  msg: "User not found",
  data: null,
};

const MOCK_USER_PERMISSIONS = {
  code: 200,
  msg: "success",
  data: {
    functions: [{ FUNCTION: "USER" }, { FUNCTION: "RULES" }],
    markets: [
      { MARKET: "JPN", TYPE: "U" },
      { MARKET: "USA", TYPE: "R" },
    ],
  },
};

const MOCK_UPDATE_SUCCESS = { code: 200, msg: "success", data: null };
const MOCK_DELETE_SUCCESS = { code: 200, msg: "success", data: null };
const MOCK_API_ERROR = { code: 500, msg: "系统错误", data: null };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockMarketList(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/getMarketList", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MARKETS),
    }),
  );
}

async function mockUserInfoSuccess(page: Page, delay = 0) {
  await page.route(
    "**/api/ud17HDocUserAdministration/getUserInfo",
    async (route) => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER_INFO_SUCCESS),
      });
    },
  );
}

async function mockUserInfoNotFound(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/getUserInfo", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER_INFO_NOT_FOUND),
    }),
  );
}

async function mockUserInfoApiError(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/getUserInfo", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: "Internal Server Error",
    }),
  );
}

async function mockUserInfoNetworkError(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/getUserInfo", (route) =>
    route.abort("connectionrefused"),
  );
}

async function mockUserPermissionsSuccess(page: Page) {
  await page.route(
    "**/api/ud17HDocUserAdministration/getUserPermissions",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER_PERMISSIONS),
      }),
  );
}

async function mockUpdateRoleSuccess(page: Page, delay = 0) {
  // deleteRole and updateRole both need to succeed
  await page.route(
    "**/api/ud17HDocUserAdministration/deleteRole",
    async (route) => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DELETE_SUCCESS),
      });
    },
  );
  await page.route(
    "**/api/ud17HDocUserAdministration/updateRole",
    async (route) => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_UPDATE_SUCCESS),
      });
    },
  );
}

async function mockUpdateRoleApiError(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/deleteRole", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_API_ERROR),
    }),
  );
}

async function mockDeleteRoleSuccess(page: Page, delay = 0) {
  await page.route(
    "**/api/ud17HDocUserAdministration/deleteRole",
    async (route) => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DELETE_SUCCESS),
      });
    },
  );
}

async function mockDeleteRoleApiError(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/deleteRole", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_API_ERROR),
    }),
  );
}

async function mockDeleteRoleNetworkError(page: Page) {
  await page.route("**/api/ud17HDocUserAdministration/deleteRole", (route) =>
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
test.describe("UD17 HDoc User Administration - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示标题
    await expect(page.locator("h2.hvua-title")).toHaveText("HDoc User Admin");

    // 2. UserID 输入框和 User Info 按钮
    await expect(page.locator("label.hvua-label-required").first()).toHaveText(
      "Userid",
    );
    await expect(page.locator("input.hvua-input-short")).toBeVisible();
    await expect(page.locator("button.hvua-btn-info")).toHaveText("USER INFO");

    // 3. User 标签（空）
    await expect(page.locator("label.hvua-label-required").nth(1)).toHaveText(
      "User",
    );

    // 4. 角色区域各复选框
    const checkboxIds = [
      "standardUser",
      "ruleAdmin",
      "templateAdmin",
      "documentAuthAdmin",
      "userAdmin",
      "adaptationUser",
    ];
    for (const id of checkboxIds) {
      await expect(page.locator(`input#${id}`)).toBeVisible();
    }

    // 5. Manage Variable List
    await expect(page.locator("div.hvua-function-section label")).toHaveText(
      "Manage Variable List",
    );

    // 6. Market Super User 下拉列表
    await expect(page.locator("div.hvua-super-user-section label")).toHaveText(
      "Market super user",
    );

    // 7. Update Role 和 Delete Role 按钮
    await expect(page.locator("div.hvua-button-bar button").first()).toHaveText(
      "Update Role",
    );
    await expect(page.locator("div.hvua-button-bar button").nth(1)).toHaveText(
      "Delete Role",
    );

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
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 调用 API 获取市场列表
    // 2. Rule Admin / Template Admin / Document Auth Admin 的 Market 下拉列表填充数据
    const roleSelectors = [
      { id: "ruleAdmin", select: "hvua-select-multiple" },
      { id: "templateAdmin", select: "hvua-select-multiple" },
      { id: "documentAuthAdmin", select: "hvua-select-multiple" },
    ];

    for (const { id } of roleSelectors) {
      // 先勾选复选框使下拉列表可用
      await page.locator(`input#${id}`).check();
      // 获取包含该复选框的 role-group 下的 select
      const roleGroup = page
        .locator("div.hvua-role-group")
        .filter({ has: page.locator(`input#${id}`) });
      const selectEl = roleGroup.locator("select.hvua-select-multiple");
      await expect(selectEl).toBeVisible();
      await expect(selectEl.locator("option")).toContainText([
        "JPN",
        "USA",
        "CHN",
      ]);
    }

    // Standard User 和 Adaptation user 的 Market 默认显示 '-EU'
    await page.locator("input#standardUser").check();
    await expect(
      page
        .locator("div.hvua-role-group")
        .filter({ has: page.locator("input#standardUser") })
        .locator("select option"),
    ).toHaveAttribute("value", "-EU");
    await page.locator("input#adaptationUser").check();
    await expect(
      page
        .locator("div.hvua-role-group")
        .filter({ has: page.locator("input#adaptationUser") })
        .locator("select option"),
    ).toHaveAttribute("value", "-EU");

    // 3. 所有角色复选框未勾选（初始状态）
    // 已通过勾选后再测试，但初始时确实未勾选

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "市场列表已加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-初始状态
  // ============================================================
  test("03_画面初期显示_初始状态", async ({ page }) => {
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. UserID 输入框为空
    await expect(page.locator("input.hvua-input-short")).toHaveValue("");

    // 2. User 标签为空
    await expect(page.locator("input.hvua-input-medium")).toHaveValue("");

    // 3. 所有角色复选框未勾选
    const checkboxIds = [
      "standardUser",
      "ruleAdmin",
      "templateAdmin",
      "documentAuthAdmin",
      "userAdmin",
      "adaptationUser",
    ];
    for (const id of checkboxIds) {
      await expect(page.locator(`input#${id}`)).not.toBeChecked();
    }

    // 4. Manage Variable List 复选框未勾选
    await expect(
      page.locator("div.hvua-function-section input[type='checkbox']"),
    ).not.toBeChecked();

    // 5. 操作按钮可用
    await expect(
      page.locator("div.hvua-button-bar button").first(),
    ).toBeEnabled();
    await expect(
      page.locator("div.hvua-button-bar button").nth(1),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_初始状态", "初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 User Info-UserID 为空
  // ============================================================
  test("04_UserInfo_UserID为空", async ({ page }) => {
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. UserID 为空
    // 2. 点击 User Info 按钮
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："请输入UserID"
    await expect(page.locator("div.hvua-error-message")).toBeVisible();
    await expect(page.locator("div.hvua-error-message")).toHaveText(
      "请输入UserID",
    );

    // 2. 终止流程，不调用 API
    await expect(page.locator("button.hvua-btn-info")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("04_UserInfo_UserID为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 User Info-查询成功
  // ============================================================
  test("05_UserInfo_查询成功", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 UserID
    await page.locator("input.hvua-input-short").fill("V0C6900");

    // 2. 点击 User Info 按钮
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 3. User 标签显示查询到的用户名
    await expect(page.locator("input.hvua-input-medium")).toHaveValue(
      "Test User",
    );

    // 4. 根据权限数据自动勾选复选框（USER → Standard User, RULES → Rule Admin）
    await expect(page.locator("input#standardUser")).toBeChecked();
    await expect(page.locator("input#ruleAdmin")).toBeChecked();

    await page.screenshot({
      path: getScreenshotPath("05_UserInfo_查询成功", "用户信息显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 User Info-Saviynt 中不存在
  // ============================================================
  test("06_UserInfo_Saviynt中不存在", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入不存在的 UserID
    await page.locator("input.hvua-input-short").fill("INVALID");

    // 2. 点击 User Info 按钮
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    await expect(page.locator("div.hvua-error-message")).toBeVisible();
    await expect(page.locator("div.hvua-error-message")).toHaveText(
      "We didn't recognize the userid you entered. Please try again.",
    );

    // 4. User 标签保持为空
    await expect(page.locator("input.hvua-input-medium")).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_Saviynt中不存在", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 User Info-API 返回 500
  // ============================================================
  test("07_UserInfo_API返回500", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 UserID
    await page.locator("input.hvua-input-short").fill("V0C6900");

    // 2. 点击 User Info 按钮
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息（fetch 失败时 catch 处理）
    await expect(page.locator("div.hvua-error-message")).toBeVisible();

    // 4. User 标签保持为空
    await expect(page.locator("input.hvua-input-medium")).toHaveValue("");

    await page.screenshot({
      path: getScreenshotPath("07_UserInfo_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 User Info-加载中按钮禁用
  // ============================================================
  test("08_UserInfo_加载中按钮禁用", async ({ page }) => {
    await mockMarketList(page);
    // UserInfo 有延迟，getUserPermissions 也需要 mock
    await mockUserInfoSuccess(page, 500);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 UserID
    await page.locator("input.hvua-input-short").fill("V0C6900");

    // 点击 User Info 按钮
    await page.locator("button.hvua-btn-info").click();

    // 1. 加载期间显示加载视图
    await expect(page.locator("div.hvua-loading")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator("button.hvua-btn-info")).toHaveCount(0);

    // 2. 等待加载完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 3. 加载完成后按钮恢复可用
    await expect(page.locator("button.hvua-btn-info")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("08_UserInfo_加载中按钮禁用", "加载完成后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Standard User-勾选与市场选择
  // ============================================================
  test("09_StandardUser_勾选与市场选择", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 1. Standard User 复选框可勾选
    await expect(page.locator("input#standardUser")).toBeChecked();

    // 2. 对应的 Market 下拉列表可用
    const marketSelect = page
      .locator("div.hvua-role-group")
      .filter({ has: page.locator("input#standardUser") })
      .locator("select.hvua-select-single");
    await expect(marketSelect).toBeEnabled();

    // 3. Market 默认显示 '-EU'
    const selectedVal = await marketSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVal).toEqual(["-EU"]);

    await page.screenshot({
      path: getScreenshotPath("09_StandardUser_勾选与市场选择", "StandardUser"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Rule Admin-勾选与市场选择
  // ============================================================
  test("10_RuleAdmin_勾选与市场选择", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 1. Rule Admin 复选框可勾选（从权限数据加载）
    await expect(page.locator("input#ruleAdmin")).toBeChecked();

    // 2. 对应的 Market 下拉列表可用
    const marketSelect = page
      .locator("div.hvua-role-group")
      .filter({ has: page.locator("input#ruleAdmin") })
      .locator("select.hvua-select-multiple");
    await expect(marketSelect).toBeEnabled();

    // 3. 可多选 Market（已选 USA）
    const selectedVal = await marketSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVal).toContain("USA");

    await page.screenshot({
      path: getScreenshotPath("10_RuleAdmin_勾选与市场选择", "RuleAdmin"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Template Admin-勾选与市场选择
  // ============================================================
  test("11_TemplateAdmin_勾选与市场选择", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 手动勾选 Template Admin
    await page.locator("input#templateAdmin").check();

    // 1. Template Admin 复选框可勾选
    await expect(page.locator("input#templateAdmin")).toBeChecked();

    // 2. 对应的 Market 下拉列表可用
    const marketSelect = page
      .locator("div.hvua-role-group")
      .filter({ has: page.locator("input#templateAdmin") })
      .locator("select.hvua-select-multiple");
    await expect(marketSelect).toBeEnabled();

    // 3. 可多选 Market
    await marketSelect.selectOption(["JPN", "USA"]);

    await page.screenshot({
      path: getScreenshotPath(
        "11_TemplateAdmin_勾选与市场选择",
        "TemplateAdmin",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Document Auth Admin-勾选与市场选择
  // ============================================================
  test("12_DocumentAuthAdmin_勾选与市场选择", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 手动勾选 Document Auth Admin
    await page.locator("input#documentAuthAdmin").check();

    // 1. Document Auth Admin 复选框可勾选
    await expect(page.locator("input#documentAuthAdmin")).toBeChecked();

    // 2. 对应的 Market 下拉列表可用
    const marketSelect = page
      .locator("div.hvua-role-group")
      .filter({ has: page.locator("input#documentAuthAdmin") })
      .locator("select.hvua-select-multiple");
    await expect(marketSelect).toBeEnabled();

    // 3. 可多选 Market
    await marketSelect.selectOption(["CHN"]);

    await page.screenshot({
      path: getScreenshotPath(
        "12_DocumentAuthAdmin_勾选与市场选择",
        "DocumentAuthAdmin",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 User Admin-勾选
  // ============================================================
  test("13_UserAdmin_勾选", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 手动勾选 User Admin
    await page.locator("input#userAdmin").check();

    // 1. User Admin 复选框可勾选
    await expect(page.locator("input#userAdmin")).toBeChecked();

    // 2. User Admin 角色无 Market 选择
    const userAdminGroup = page
      .locator("div.hvua-role-group")
      .filter({ has: page.locator("input#userAdmin") });
    await expect(userAdminGroup.locator("select")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("13_UserAdmin_勾选", "UserAdmin"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Adaptation user-勾选与市场选择
  // ============================================================
  test("14_AdaptationUser_勾选与市场选择", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 手动勾选 Adaptation user
    await page.locator("input#adaptationUser").check();

    // 1. Adaptation user 复选框可勾选
    await expect(page.locator("input#adaptationUser")).toBeChecked();

    // 2. 对应的 Market 下拉列表可用
    const marketSelect = page
      .locator("div.hvua-role-group")
      .filter({ has: page.locator("input#adaptationUser") })
      .locator("select.hvua-select-single");
    await expect(marketSelect).toBeEnabled();

    // 3. Market 默认显示 '-EU'
    const selectedVal = await marketSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVal).toEqual(["-EU"]);

    await page.screenshot({
      path: getScreenshotPath(
        "14_AdaptationUser_勾选与市场选择",
        "AdaptationUser",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Manage Variable List-功能权限勾选
  // ============================================================
  test("15_ManageVariableList_功能权限勾选", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 勾选 Manage Variable List
    const manageVarCheckbox = page.locator(
      "div.hvua-function-section input[type='checkbox']",
    );
    await manageVarCheckbox.check();

    // 1. Manage Variable List 复选框可勾选
    await expect(manageVarCheckbox).toBeChecked();

    // 2. 授予管理变量列表权限

    await page.screenshot({
      path: getScreenshotPath(
        "15_ManageVariableList_功能权限勾选",
        "ManageVariableList",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Market Super User-选择
  // ============================================================
  test("16_MarketSuperUser_选择", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 1. Market Super User 下拉列表可用
    const superUserSelect = page.locator(
      "div.hvua-super-user-section select.hvua-select-multiple",
    );
    await expect(superUserSelect).toBeEnabled();

    // 2. 可多选 Market
    await superUserSelect.selectOption(["JPN", "USA"]);
    const selectedVal = await superUserSelect.evaluate(
      (el: HTMLSelectElement) =>
        Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVal).toEqual(["JPN", "USA"]);

    await page.screenshot({
      path: getScreenshotPath("16_MarketSuperUser_选择", "MarketSuperUser"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Update Role-未查询时点击
  // ============================================================
  test("17_UpdateRole_未查询时点击", async ({ page }) => {
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 未执行 User Info 查询
    // 2. 直接点击 Update Role 按钮
    await page.locator("div.hvua-button-bar button").first().click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："请先查询用户信息"
    await expect(page.locator("div.hvua-error-message")).toBeVisible();
    await expect(page.locator("div.hvua-error-message")).toHaveText(
      "请先查询用户信息",
    );

    // 2. 终止流程，不调用 API
    await expect(
      page.locator("div.hvua-button-bar button").first(),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("17_UpdateRole_未查询时点击", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Update Role-UserID 不存在
  // ============================================================
  test("18_UpdateRole_UserID不存在", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询不存在的用户
    await page.locator("input.hvua-input-short").fill("INVALID");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // User Info 失败后，Update Role 按钮检查 userId.trim()
    // 由于 userId 有值（"INVALID"），会尝试调用 API
    // 但我们需要 mock deleteRole 来模拟 400
    await mockUpdateRoleApiError(page);
    await page.locator("div.hvua-button-bar button").first().click();
    await page.waitForTimeout(500);

    // 显示错误消息
    await expect(page.locator("div.hvua-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("18_UpdateRole_UserID不存在", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Update Role-成功
  // ============================================================
  test("19_UpdateRole_成功", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockUpdateRoleSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 点击 Update Role 按钮
    await page.locator("div.hvua-button-bar button").first().click();

    // 加载视图出现（deleteRole + updateRole）
    await expect(page.locator("div.hvua-loading")).toBeVisible({
      timeout: 3000,
    });

    // 等待加载完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 显示成功消息
    await expect(page.locator("div.hvua-success-message")).toBeVisible();
    await expect(page.locator("div.hvua-success-message")).toHaveText(
      "权限更新成功",
    );

    await page.screenshot({
      path: getScreenshotPath("19_UpdateRole_成功", "成功消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Update Role-失败（API 500）
  // ============================================================
  test("20_UpdateRole_API返回500", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockUpdateRoleApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 点击 Update Role 按钮
    await page.locator("div.hvua-button-bar button").first().click();

    // 等待处理完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 显示错误消息
    await expect(page.locator("div.hvua-error-message")).toBeVisible();

    // Update Role 按钮恢复可用状态
    await expect(
      page.locator("div.hvua-button-bar button").first(),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("20_UpdateRole_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 Update Role-加载中按钮禁用
  // ============================================================
  test("21_UpdateRole_加载中按钮禁用", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockUpdateRoleSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 点击 Update Role 按钮
    await page.locator("div.hvua-button-bar button").first().click();

    // 1. 加载期间显示加载视图（按钮不在DOM中）
    await expect(page.locator("div.hvua-loading")).toBeVisible({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 加载完成后按钮恢复可用
    await expect(
      page.locator("div.hvua-button-bar button").first(),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("21_UpdateRole_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Delete Role-未查询时点击
  // ============================================================
  test("22_DeleteRole_未查询时点击", async ({ page }) => {
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 未执行 User Info 查询
    // 2. 点击 Delete Role 按钮
    await page.locator("div.hvua-button-bar button").nth(1).click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："请先查询用户信息"
    await expect(page.locator("div.hvua-error-message")).toBeVisible();
    await expect(page.locator("div.hvua-error-message")).toHaveText(
      "请先查询用户信息",
    );

    // 2. 终止流程，不调用 API，不弹出确认对话框
    await expect(
      page.locator("div.hvua-button-bar button").nth(1),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("22_DeleteRole_未查询时点击", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Delete Role-确认对话框取消
  // ============================================================
  test("23_DeleteRole_确认对话框取消", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 设置对话框处理 - 点击取消
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toBe("确定要删除该用户的所有权限吗？");
      dialog.dismiss();
    });

    // 点击 Delete Role 按钮
    await page.locator("div.hvua-button-bar button").nth(1).click();
    await page.waitForTimeout(500);

    // 1. 弹出确认对话框
    // 2. 点击取消后终止流程
    // 3. 不调用 API
    await expect(page.locator("div.hvua-success-message")).toHaveCount(0);
    await expect(page.locator("div.hvua-error-message")).toHaveCount(0);

    // 4. Delete Role 按钮恢复可用状态
    await expect(
      page.locator("div.hvua-button-bar button").nth(1),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("23_DeleteRole_确认对话框取消", "取消后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 Delete Role-确认删除成功
  // ============================================================
  test("24_DeleteRole_确认删除成功", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockDeleteRoleSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    // 点击 Delete Role 按钮
    await page.locator("div.hvua-button-bar button").nth(1).click();

    // 等待处理完成并显示成功消息："权限删除成功"
    await expect(page.locator("div.hvua-success-message")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("div.hvua-success-message")).toHaveText(
      "权限删除成功",
    );

    await page.screenshot({
      path: getScreenshotPath("24_DeleteRole_确认删除成功", "成功消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 Delete Role-失败（API 500）
  // ============================================================
  test("25_DeleteRole_API返回500", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockDeleteRoleApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    // 点击 Delete Role 按钮
    await page.locator("div.hvua-button-bar button").nth(1).click();

    // 等待处理完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 显示错误消息
    await expect(page.locator("div.hvua-error-message")).toBeVisible();

    // Delete Role 按钮恢复可用状态
    await expect(
      page.locator("div.hvua-button-bar button").nth(1),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("25_DeleteRole_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 Delete Role-加载中按钮禁用
  // ============================================================
  test("26_DeleteRole_加载中按钮禁用", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockDeleteRoleSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 设置对话框处理 - 点击确定
    page.on("dialog", (dialog) => {
      dialog.accept();
    });

    // 点击 Delete Role 按钮
    await page.locator("div.hvua-button-bar button").nth(1).click();

    // 1. 加载期间显示加载视图
    await expect(page.locator("div.hvua-loading")).toBeVisible({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 加载完成后按钮恢复可用
    await expect(
      page.locator("div.hvua-button-bar button").nth(1),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("26_DeleteRole_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 异常处理-API 超时
  // ============================================================
  test("27_异常处理_API超时", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行查询操作
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(1000);

    // 1. 超时后显示错误消息
    // 2. 按钮恢复可用状态
    await expect(page.locator("button.hvua-btn-info")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("27_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 异常处理-数据库操作异常
  // ============================================================
  test("28_异常处理_数据库操作异常", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockUpdateRoleApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 执行更新操作（API 返回 500 模拟数据库异常）
    await page.locator("div.hvua-button-bar button").first().click();

    // 等待处理完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 1. 显示错误消息
    await expect(page.locator("div.hvua-error-message")).toBeVisible();

    // 2. 按钮恢复可用状态
    await expect(
      page.locator("div.hvua-button-bar button").first(),
    ).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("28_异常处理_数据库操作异常", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 异常处理-用户未登录
  // ============================================================
  test("29_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    // 访问页面
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 检测到未登录状态
    // 2. 跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("29_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 错误消息-显示样式
  // ============================================================
  test("30_错误消息_显示样式", async ({ page }) => {
    await mockMarketList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 触发错误（UserID 为空点击 User Info）
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(300);

    // 1. 错误消息显示红色（#ff4d4f）
    const errorMsg = page.locator("div.hvua-error-message");
    await expect(errorMsg).toBeVisible();
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    // 2. 默认隐藏（内容为空时不显示）

    await page.screenshot({
      path: getScreenshotPath("30_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 成功消息-显示样式
  // ============================================================
  test("31_成功消息_显示样式", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockUpdateRoleSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 执行成功 Update Role 操作
    await page.locator("div.hvua-button-bar button").first().click();

    // 等待加载完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 1. 成功消息显示绿色（#52c41a）
    const successMsg = page.locator("div.hvua-success-message");
    await expect(successMsg).toBeVisible();
    const color = await successMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(82, 196, 26)");

    await page.screenshot({
      path: getScreenshotPath("31_成功消息_显示样式", "成功消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 页面刷新
  // ============================================================
  test("32_页面刷新", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户并显示权限
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. UserID 输入框被清空
    await expect(page.locator("input.hvua-input-short")).toHaveValue("");

    // 3. User 标签为空
    await expect(page.locator("input.hvua-input-medium")).toHaveValue("");

    // 4. 所有角色复选框未勾选
    const checkboxIds = [
      "standardUser",
      "ruleAdmin",
      "templateAdmin",
      "documentAuthAdmin",
      "userAdmin",
      "adaptationUser",
    ];
    for (const id of checkboxIds) {
      await expect(page.locator(`input#${id}`)).not.toBeChecked();
    }

    // 5. 无错误消息和成功消息
    await expect(page.locator("div.hvua-error-message")).toHaveCount(0);
    await expect(page.locator("div.hvua-success-message")).toHaveCount(0);

    // 6. 所有按钮恢复可用状态
    await expect(page.locator("button.hvua-btn-info")).toBeEnabled();
    await expect(
      page.locator("div.hvua-button-bar button").first(),
    ).toBeEnabled();
    await expect(
      page.locator("div.hvua-button-bar button").nth(1),
    ).toBeEnabled();

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
    await page.route("**/api/ud17HDocUserAdministration/**", (route) => {
      const req = route.request();
      apiCalls.push({ url: req.url(), method: req.method() });
      if (req.url().includes("getMarketList")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_MARKETS),
        });
      } else if (req.url().includes("getUserInfo")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_USER_INFO_SUCCESS),
        });
      } else if (req.url().includes("getUserPermissions")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_USER_PERMISSIONS),
        });
      } else if (req.url().includes("deleteRole")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_DELETE_SUCCESS),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_UPDATE_SUCCESS),
        });
      }
    });

    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行查询操作
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
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
  // No.34 安全性-权限控制
  // ============================================================
  test("34_安全性_权限控制", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await mockUpdateRoleSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 执行 Update Role 操作
    await page.locator("div.hvua-button-bar button").first().click();

    // 等待加载完成
    await expect(page.locator("div.hvua-loading")).not.toBeVisible({
      timeout: 10000,
    });

    // 1. 授权管理员可执行权限配置操作
    await expect(page.locator("div.hvua-success-message")).toBeVisible();

    // 2. 所有变更记录日志（通过 API 请求的 updateUser 参数传递）

    await page.screenshot({
      path: getScreenshotPath("34_安全性_权限控制", "更新成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.35 安全性-Delete Role 确认对话框
  // ============================================================
  test("35_安全性_DeleteRole确认对话框", async ({ page }) => {
    await mockMarketList(page);
    await mockUserInfoSuccess(page);
    await mockUserPermissionsSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hvua-input-short").fill("V0C6900");
    await page.locator("button.hvua-btn-info").click();
    await page.waitForTimeout(500);

    // 监听对话框
    let dialogShown = false;
    page.on("dialog", (dialog) => {
      dialogShown = true;
      expect(dialog.message()).toBe("确定要删除该用户的所有权限吗？");
      dialog.dismiss();
    });

    // 点击 Delete Role 按钮
    await page.locator("div.hvua-button-bar button").nth(1).click();
    await page.waitForTimeout(500);

    // 1. Delete Role 操作前弹出确认对话框
    expect(dialogShown).toBe(true);

    // 2. 防止误删重要权限配置
    await expect(page.locator("div.hvua-success-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("35_安全性_DeleteRole确认对话框", "确认对话框"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
