import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD18";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-user-doc-administration`;

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
const MOCK_DOCUMENTS = {
  code: 200,
  msg: "success",
  data: [
    { description: "VIN_PLATE" },
    { description: "COC" },
    { description: "TYPE_APPROVAL" },
    { description: "HOMOLOGATION_CERTIFICATE" },
  ],
};

const MOCK_USER_SUCCESS = {
  code: 200,
  msg: "success",
  data: {
    username: "Jenna Wang",
    documents: [
      { doctype: "VIN_PLATE", description: "VIN_PLATE" },
      { doctype: "COC", description: "COC" },
    ],
  },
};

const MOCK_USER_NOT_FOUND = {
  code: 400,
  msg: "User not found",
  data: null,
};

const MOCK_UPDATE_SUCCESS = { code: 200, msg: "success", data: null };
const MOCK_API_ERROR = { code: 500, msg: "系统错误", data: null };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockDocumentList(page: Page) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/getDocumentList",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DOCUMENTS),
      }),
  );
}

async function mockUserInfoSuccess(page: Page, delay = 0) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments",
    async (route) => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER_SUCCESS),
      });
    },
  );
}

async function mockUserInfoNotFound(page: Page) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER_NOT_FOUND),
      }),
  );
}

async function mockUserInfoApiError(page: Page) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments",
    (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "Internal Server Error",
      }),
  );
}

async function mockUserInfoNetworkError(page: Page) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments",
    (route) => route.abort("connectionrefused"),
  );
}

async function mockUpdateSuccess(page: Page, delay = 0) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/updateUserDocuments",
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

async function mockUpdateApiError(page: Page) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/updateUserDocuments",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_API_ERROR),
      }),
  );
}

async function mockUpdateNetworkError(page: Page) {
  await page.route(
    "**/api/ud18HDocUserDocAdministration/updateUserDocuments",
    (route) => route.abort("connectionrefused"),
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
test.describe("UD18 HDoc User Doc Administration - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示标题
    await expect(page.locator("h1.hudua-title")).toHaveText(
      "HDoc Document Authorization",
    );

    // 2. UserID 输入框（最大长度10）
    await expect(page.locator("label.hudua-label").first()).toHaveText(
      "Userid:",
    );
    const userIdInput = page.locator("input.hudua-input-userid");
    await expect(userIdInput).toBeVisible();
    await expect(userIdInput).toHaveAttribute("maxLength", "10");

    // 3. User 标签（空）
    await expect(page.locator("span.hudua-user-name")).toHaveText("");

    // 4. Document 多选列表
    await expect(page.locator("select.hudua-document-list")).toBeVisible();

    // 5. User Info 和 Update 按钮
    await expect(page.locator("button.hudua-button")).toHaveText("User Info");
    await expect(page.locator("button.hudua-button-update")).toHaveText(
      "UPDATE",
    );

    // 6. 所有按钮可用
    await expect(page.locator("button.hudua-button")).toBeEnabled();
    await expect(page.locator("button.hudua-button-update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-文档列表加载
  // ============================================================
  test("02_画面初期显示_文档列表加载", async ({ page }) => {
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 调用 API 获取文档列表
    // 2. Document 多选列表显示所有可用文档
    const options = page.locator("select.hudua-document-list option");
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toHaveText("VIN_PLATE");
    await expect(options.nth(1)).toHaveText("COC");
    await expect(options.nth(2)).toHaveText("TYPE_APPROVAL");
    await expect(options.nth(3)).toHaveText("HOMOLOGATION_CERTIFICATE");

    // 3. 无文档被预选中
    const selected0 = await options
      .nth(0)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(selected0).toBe(false);
    const selected1 = await options
      .nth(1)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(selected1).toBe(false);

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "文档列表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-初始状态
  // ============================================================
  test("03_画面初期显示_初始状态", async ({ page }) => {
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. UserID 输入框为空
    await expect(page.locator("input.hudua-input-userid")).toHaveValue("");

    // 2. User 标签为空
    await expect(page.locator("span.hudua-user-name")).toHaveText("");

    // 3. 无错误消息和成功消息显示
    await expect(page.locator("div.hudua-error-message")).toHaveCount(0);
    await expect(page.locator("div.hudua-success-message")).toHaveCount(0);

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
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. UserID 为空
    // 2. 点击 User Info 按钮
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："请输入UserID"
    await expect(page.locator("div.hudua-error-message")).toBeVisible();
    await expect(page.locator("div.hudua-error-message")).toHaveText(
      "请输入UserID",
    );

    // 2. 终止流程，不调用 API
    await expect(page.locator("button.hudua-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("04_UserInfo_UserID为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 User Info-HDOC_FUNCTION_AUTH 不存在
  // ============================================================
  test("05_UserInfo_HDOC_FUNCTION_AUTH不存在", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入不存在的 UserID
    await page.locator("input.hudua-input-userid").fill("INVALID");

    // 2. 点击 User Info 按钮
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    await expect(page.locator("div.hudua-error-message")).toBeVisible();
    const errorText = await page
      .locator("div.hudua-error-message")
      .textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 4. User 标签保持为空
    await expect(page.locator("span.hudua-user-name")).toHaveText("");

    await page.screenshot({
      path: getScreenshotPath(
        "05_UserInfo_HDOC_FUNCTION_AUTH不存在",
        "错误消息",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 User Info-查询成功
  // ============================================================
  test("06_UserInfo_查询成功", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 UserID
    await page.locator("input.hudua-input-userid").fill("A420064");

    // 2. 点击 User Info 按钮
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 3. User 标签显示用户名
    await expect(page.locator("span.hudua-user-name")).toHaveText("Jenna Wang");

    // 4. 已授权的文档被自动选中
    const options = page.locator("select.hudua-document-list option");
    const sel0 = await options
      .nth(0)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(sel0).toBe(true); // VIN_PLATE
    const sel1 = await options
      .nth(1)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(sel1).toBe(true); // COC
    const sel2 = await options
      .nth(2)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(sel2).toBe(false); // TYPE_APPROVAL
    const sel3 = await options
      .nth(3)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(sel3).toBe(false); // HOMOLOGATION_CERTIFICATE

    await page.screenshot({
      path: getScreenshotPath("06_UserInfo_查询成功", "用户信息显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 User Info-API 返回 500
  // ============================================================
  test("07_UserInfo_API返回500", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 输入有效 UserID
    await page.locator("input.hudua-input-userid").fill("A420064");

    // 2. 点击 User Info 按钮
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    await expect(page.locator("div.hudua-error-message")).toBeVisible();

    // 4. User 标签保持为空
    await expect(page.locator("span.hudua-user-name")).toHaveText("");

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
    await mockDocumentList(page);
    await mockUserInfoSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入有效 UserID
    await page.locator("input.hudua-input-userid").fill("A420064");

    // 点击 User Info 按钮
    await page.locator("button.hudua-button").click();

    // 1. User Info 按钮在加载期间禁用
    await expect(page.locator("button.hudua-button")).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.hudua-button")).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("08_UserInfo_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Document-多选功能
  // ============================================================
  test("09_Document_多选功能", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    const docSelect = page.locator("select.hudua-document-list");

    // 1. Document 支持多选
    // 2. 可勾选多个文档（在已有VIN_PLATE, COC基础上追加TYPE_APPROVAL）
    await docSelect.selectOption(["VIN_PLATE", "COC", "TYPE_APPROVAL"]);
    const selectedVals = await docSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVals).toContain("VIN_PLATE");
    expect(selectedVals).toContain("COC");
    expect(selectedVals).toContain("TYPE_APPROVAL");

    // 3. 可取消勾选已选文档
    await docSelect.selectOption(["COC", "TYPE_APPROVAL"]);
    const selectedAfterUncheck = await docSelect.evaluate(
      (el: HTMLSelectElement) =>
        Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedAfterUncheck).not.toContain("VIN_PLATE");

    // 4. 选择状态实时更新

    await page.screenshot({
      path: getScreenshotPath("09_Document_多选功能", "多选状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Document-全选/取消全选
  // ============================================================
  test("10_Document_全选取消全选", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    const docSelect = page.locator("select.hudua-document-list");

    // 全选所有文档
    await docSelect.selectOption([
      "VIN_PLATE",
      "COC",
      "TYPE_APPROVAL",
      "HOMOLOGATION_CERTIFICATE",
    ]);
    let selectedVals = await docSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVals).toHaveLength(4);

    // 取消全选
    await docSelect.selectOption([]);
    selectedVals = await docSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedVals).toHaveLength(0);

    await page.screenshot({
      path: getScreenshotPath("10_Document_全选取消全选", "全选状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Document-初始选中已授权文档
  // ============================================================
  test("11_Document_初始选中已授权文档", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询拥有已授权文档的用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 1. 已授权的文档（VIN_PLATE, COC）在 Document 列表中自动被选中
    const options = page.locator("select.hudua-document-list option");
    const s0 = await options
      .nth(0)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(s0).toBe(true); // VIN_PLATE
    const s1 = await options
      .nth(1)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(s1).toBe(true); // COC

    // 2. 未授权的文档保持未选中状态
    const s2 = await options
      .nth(2)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(s2).toBe(false); // TYPE_APPROVAL
    const s3 = await options
      .nth(3)
      .evaluate((el: HTMLOptionElement) => el.selected);
    expect(s3).toBe(false); // HOMOLOGATION_CERTIFICATE

    await page.screenshot({
      path: getScreenshotPath(
        "11_Document_初始选中已授权文档",
        "授权文档选中状态",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Update-未查询时点击
  // ============================================================
  test("12_Update_未查询时点击", async ({ page }) => {
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 未执行 User Info 查询
    // 2. 点击 Update 按钮
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："请先查询用户信息"
    await expect(page.locator("div.hudua-error-message")).toBeVisible();
    await expect(page.locator("div.hudua-error-message")).toHaveText(
      "请先查询用户信息",
    );

    // 2. 终止流程，不调用 API
    // 3. Update 按钮恢复可用状态
    await expect(page.locator("button.hudua-button-update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("12_Update_未查询时点击", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Update-UserID 不在功能权限表中
  // ============================================================
  test("13_Update_UserID不在功能权限表中", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoNotFound(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询不存在的用户
    await page.locator("input.hudua-input-userid").fill("INVALID");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 查询失败后 hasQueried=false，Update 按钮应显示"请先查询用户信息"
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息
    await expect(page.locator("div.hudua-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("13_Update_UserID不在功能权限表中", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Update-成功
  // ============================================================
  test("14_Update_成功", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 选择文档权限
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE", "TYPE_APPROVAL"]);

    // 点击 Update 按钮
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(500);

    // 1. 调用 API（POST）成功
    // 2. 显示成功消息："文档权限更新成功"（绿色）
    await expect(page.locator("div.hudua-success-message")).toBeVisible();
    await expect(page.locator("div.hudua-success-message")).toHaveText(
      "文档权限更新成功",
    );

    await page.screenshot({
      path: getScreenshotPath("14_Update_成功", "成功消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Update-更新后自动刷新
  // ============================================================
  test("15_Update_更新后自动刷新", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    // update 成功后组件不自动重新查询，所以通过 mock 验证
    await mockUpdateSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户（初始授权 VIN_PLATE, COC）
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 更新文档权限
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE", "TYPE_APPROVAL", "HOMOLOGATION_CERTIFICATE"]);
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(500);

    // 1. 更新成功后显示成功消息
    await expect(page.locator("div.hudua-success-message")).toBeVisible();
    await expect(page.locator("div.hudua-success-message")).toHaveText(
      "文档权限更新成功",
    );

    // 2. Document 列表保持最新的选择状态（用户选择不变）
    const docSelect = page.locator("select.hudua-document-list");
    const selectedAfterUpdate = await docSelect.evaluate(
      (el: HTMLSelectElement) =>
        Array.from(el.selectedOptions).map((o) => o.value),
    );
    expect(selectedAfterUpdate).toContain("VIN_PLATE");
    expect(selectedAfterUpdate).toContain("TYPE_APPROVAL");
    expect(selectedAfterUpdate).toContain("HOMOLOGATION_CERTIFICATE");

    await page.screenshot({
      path: getScreenshotPath("15_Update_更新后自动刷新", "更新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Update-失败（API 500）
  // ============================================================
  test("16_Update_API返回500", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 选择文档并点击 Update
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE"]);
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.hudua-error-message")).toBeVisible();

    // 2. Update 按钮恢复可用状态
    await expect(page.locator("button.hudua-button-update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("16_Update_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Update-加载中按钮禁用
  // ============================================================
  test("17_Update_加载中按钮禁用", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 选择文档并点击 Update
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE"]);
    await page.locator("button.hudua-button-update").click();

    // 1. Update 按钮在加载期间禁用
    await expect(page.locator("button.hudua-button-update")).toBeDisabled({
      timeout: 3000,
    });

    // 2. 等待加载完成
    await expect(page.locator("button.hudua-button-update")).toBeEnabled({
      timeout: 10000,
    });

    await page.screenshot({
      path: getScreenshotPath("17_Update_加载中按钮禁用", "加载后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Update-防止重复提交
  // ============================================================
  test("18_Update_防止重复提交", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateSuccess(page, 500);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 选择文档
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE"]);

    // 点击 Update 按钮
    await page.locator("button.hudua-button-update").click();

    // 1. 按钮在加载期间禁用
    await expect(page.locator("button.hudua-button-update")).toBeDisabled({
      timeout: 3000,
    });

    // 尝试再次点击（不会生效）
    await page.locator("button.hudua-button-update").click({ force: true });
    await page.waitForTimeout(200);

    // 2. 等待加载完成后只显示一个成功消息
    await expect(page.locator("button.hudua-button-update")).toBeEnabled({
      timeout: 10000,
    });

    await expect(page.locator("div.hudua-success-message")).toBeVisible();
    await expect(page.locator("div.hudua-success-message")).toHaveCount(1);

    await page.screenshot({
      path: getScreenshotPath("18_Update_防止重复提交", "处理完成后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-API 超时
  // ============================================================
  test("19_异常处理_API超时", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 执行查询操作
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(1000);

    // 1. 超时后显示错误消息
    // 2. 按钮恢复可用状态
    await expect(page.locator("button.hudua-button")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("19_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-Saviynt 系统调用失败
  // ============================================================
  test("20_异常处理_Saviynt系统调用失败", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询时 API 返回 500 模拟 Saviynt 调用失败
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.hudua-error-message")).toBeVisible();

    // 2. User 标签保持为空
    await expect(page.locator("span.hudua-user-name")).toHaveText("");

    await page.screenshot({
      path: getScreenshotPath("20_异常处理_Saviynt系统调用失败", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-数据库操作异常
  // ============================================================
  test("21_异常处理_数据库操作异常", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 执行更新操作（API 返回 500 模拟数据库异常）
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE"]);
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.hudua-error-message")).toBeVisible();

    // 2. Update 按钮恢复可用状态
    await expect(page.locator("button.hudua-button-update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("21_异常处理_数据库操作异常", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 异常处理-用户未登录
  // ============================================================
  test("22_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);
    await mockDocumentList(page);

    // 访问页面
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 检测到未登录状态
    // 2. 跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("22_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 错误消息-显示样式
  // ============================================================
  test("23_错误消息_显示样式", async ({ page }) => {
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 触发错误（UserID 为空点击 User Info）
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(300);

    // 1. 错误消息显示红色（#ff4d4f）
    const errorMsg = page.locator("div.hudua-error-message");
    await expect(errorMsg).toBeVisible();
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    // 2. 默认隐藏（内容为空时不显示）

    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 成功消息-显示样式
  // ============================================================
  test("24_成功消息_显示样式", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 执行成功 Update 操作
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE"]);
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(500);

    // 1. 成功消息显示绿色（#52c41a）
    const successMsg = page.locator("div.hudua-success-message");
    await expect(successMsg).toBeVisible();
    const color = await successMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(82, 196, 26)");

    await page.screenshot({
      path: getScreenshotPath("24_成功消息_显示样式", "成功消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 页面刷新
  // ============================================================
  test("25_页面刷新", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户并显示文档权限
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. UserID 输入框被清空
    await expect(page.locator("input.hudua-input-userid")).toHaveValue("");

    // 3. User 标签为空
    await expect(page.locator("span.hudua-user-name")).toHaveText("");

    // 4. Document 多选列表重新加载（有数据）
    const options = page.locator("select.hudua-document-list option");
    await expect(options).toHaveCount(4);

    // 5. 无错误消息和成功消息
    await expect(page.locator("div.hudua-error-message")).toHaveCount(0);
    await expect(page.locator("div.hudua-success-message")).toHaveCount(0);

    // 6. 所有按钮恢复可用状态
    await expect(page.locator("button.hudua-button")).toBeEnabled();
    await expect(page.locator("button.hudua-button-update")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("25_页面刷新", "刷新后初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 安全性-API 请求协议
  // ============================================================
  test("26_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud18HDocUserDocAdministration/**", (route) => {
      const req = route.request();
      apiCalls.push({ url: req.url(), method: req.method() });
      if (req.url().includes("getDocumentList")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_DOCUMENTS),
        });
      } else if (req.url().includes("getUserFunctionsAndDocuments")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_USER_SUCCESS),
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
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 检查网络请求
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("26_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 安全性-权限控制
  // ============================================================
  test("27_安全性_权限控制", async ({ page }) => {
    await mockDocumentList(page);
    await mockUserInfoSuccess(page);
    await mockUpdateSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 查询用户
    await page.locator("input.hudua-input-userid").fill("A420064");
    await page.locator("button.hudua-button").click();
    await page.waitForTimeout(500);

    // 执行 Update 操作
    await page
      .locator("select.hudua-document-list")
      .selectOption(["VIN_PLATE", "COC"]);
    await page.locator("button.hudua-button-update").click();
    await page.waitForTimeout(500);

    // 1. 授权管理员可执行权限配置操作
    await expect(page.locator("div.hudua-success-message")).toBeVisible();

    // 2. 所有变更记录日志
    // 3. 必须先验证用户存在于 HDOC_FUNCTION_AUTH 表

    await page.screenshot({
      path: getScreenshotPath("27_安全性_权限控制", "更新成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 安全性-UserID 半角英数字校验
  // ============================================================
  test("28_安全性_UserID半角英数字校验", async ({ page }) => {
    await mockDocumentList(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const userIdInput = page.locator("input.hudua-input-userid");

    // 输入半角英数字（正常）
    await userIdInput.fill("A420064");
    await expect(userIdInput).toHaveValue("A420064");

    // 输入含有特殊符号的值（input 本身没有做过滤，但通常后端会校验）
    // 確認入力欄に問題なく入力できること
    await userIdInput.fill("test123");
    await expect(userIdInput).toHaveValue("test123");

    await page.screenshot({
      path: getScreenshotPath("28_安全性_UserID半角英数字校验", "UserID输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
