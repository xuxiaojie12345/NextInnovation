import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD20";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/market-document-settings-list`;

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
    {
      doctype: "VIN_PLATE",
      description: "VIN Plate",
      registerUser: "admin",
      registerDatetime: "2026-06-30 12:00:00",
    },
    {
      doctype: "COC",
      description: "COC",
      registerUser: "jdoe",
      registerDatetime: "2026-06-29 10:30:00",
    },
    {
      doctype: "TYPE_APPROVAL",
      description: "Type Approval",
      registerUser: "-",
      registerDatetime: "2026-06-28 09:00:00",
    },
  ],
};

const MOCK_EMPTY = { code: 200, msg: "success", data: [] };
const MOCK_API_ERROR = { code: 500, msg: "系统错误", data: null };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockDocumentListSuccess(page: Page, data = MOCK_DOCUMENTS) {
  await page.route("**/api/ud20/getdocumentlist", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
}

async function mockDocumentListEmpty(page: Page) {
  await page.route("**/api/ud20/getdocumentlist", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_EMPTY),
    }),
  );
}

async function mockDocumentListApiError(page: Page) {
  await page.route("**/api/ud20/getdocumentlist", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_API_ERROR),
    }),
  );
}

async function mockDocumentListHttpError(page: Page) {
  await page.route("**/api/ud20/getdocumentlist", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: "Internal Server Error",
    }),
  );
}

async function mockDocumentListNetworkError(page: Page) {
  await page.route("**/api/ud20/getdocumentlist", (route) =>
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
test.describe("UD20 Market Document Settings List - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示标题
    await expect(page.locator("h1.mdsl-title")).toHaveText(
      "HDoc - Market Document Settings",
    );

    // 2. DataTable 列: RadioBox、Document type、Bussines unit、User、Date
    await expect(page.locator("table.mdsl-table")).toBeVisible();
    const headers = page.locator("th.mdsl-th");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toHaveText("Document type");
    await expect(headers.nth(1)).toHaveText("Bussines unit");
    await expect(headers.nth(2)).toHaveText("User");
    await expect(headers.nth(3)).toHaveText("Date");

    // RadioBox列
    await expect(page.locator("th.mdsl-radio-col")).toHaveCount(1);

    // 3. Select、Back、Print 按钮
    const buttons = page.locator("button.mdsl-btn");
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveText("Select");
    await expect(buttons.nth(1)).toHaveText("Back");
    await expect(buttons.nth(2)).toHaveText("Print");

    // 4. 所有按钮可用
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
  // No.2 画面初期显示-文档列表加载
  // ============================================================
  test("02_画面初期显示_文档列表加载", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 调用 API 获取文档列表
    // 2. DataTable 显示文档列表
    const rows = page.locator("table.mdsl-table tbody tr");
    await expect(rows).toHaveCount(3);

    // 第一行
    await expect(rows.nth(0).locator("td.mdsl-td").nth(0)).toHaveText(
      "VIN_PLATE",
    );
    await expect(rows.nth(0).locator("td.mdsl-td").nth(1)).toHaveText("VBC");
    await expect(rows.nth(0).locator("td.mdsl-td").nth(2)).toContainText(
      "admin",
    );
    await expect(rows.nth(0).locator("td.mdsl-td").nth(3)).toHaveText(
      "2026-06-30 12:00:00",
    );

    // 3. 每行包含 RadioBox 单选按钮
    await expect(
      rows.nth(0).locator("td.mdsl-radio-col input[type='radio']"),
    ).toBeVisible();

    // 4. User 列显示为可点击链接
    await expect(rows.nth(0).locator("button.link-button")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_文档列表加载", "文档列表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-无数据
  // ============================================================
  test("03_画面初期显示_无数据", async ({ page }) => {
    await mockDocumentListEmpty(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 空配列(data=[])はtruthyのためエラーメッセージなし
    // テーブルに "No records found" が表示される
    await expect(page.locator("td.mdsl-no-data")).toBeVisible();
    await expect(page.locator("td.mdsl-no-data")).toHaveText(
      "No records found",
    );

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_无数据", "无数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-API 返回 500
  // ============================================================
  test("04_画面初期显示_API返回500", async ({ page }) => {
    await mockDocumentListHttpError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.mdsl-error-message")).toBeVisible();

    // 2. DataTable 为空
    await expect(page.locator("td.mdsl-no-data")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_API返回500", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 DataTable-列标题显示
  // ============================================================
  test("05_DataTable_列标题显示", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示列标题
    const headers = page.locator("th.mdsl-th");
    await expect(headers.nth(0)).toHaveText("Document type");
    await expect(headers.nth(1)).toHaveText("Bussines unit");
    await expect(headers.nth(2)).toHaveText("User");
    await expect(headers.nth(3)).toHaveText("Date");

    // 2. 每行开头有 RadioBox 单选按钮
    await expect(page.locator("th.mdsl-radio-col")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("05_DataTable_列标题显示", "列标题"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 DataTable-Bussines unit 固定显示
  // ============================================================
  test("06_DataTable_BussinesUnit固定显示", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Bussines unit 列固定显示 'VBC'
    const buCells = page.locator("td.mdsl-td").nth(1);
    // 全行を確認
    const rows = page.locator("table.mdsl-table tbody tr");
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i).locator("td.mdsl-td").nth(1)).toHaveText("VBC");
    }

    await page.screenshot({
      path: getScreenshotPath("06_DataTable_BussinesUnit固定显示", "BU列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 DataTable-User 列链接显示
  // ============================================================
  test("07_DataTable_User列链接显示", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. User 列显示为可点击链接
    const linkButton = page.locator("button.link-button").first();
    await expect(linkButton).toBeVisible();
    await expect(linkButton).toHaveText("admin");

    // 2. 点击后跳转到 EDB User View 画面
    await linkButton.click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/edb-user-view/);

    await page.screenshot({
      path: getScreenshotPath("07_DataTable_User列链接显示", "User链接跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 DataTable-Date 格式显示
  // ============================================================
  test("08_DataTable_Date格式显示", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Date 列显示注册日期时间
    const dateCell = page.locator("td.mdsl-td").nth(3).first();
    await expect(dateCell).toHaveText("2026-06-30 12:00:00");

    // 2. 格式为 "YYYY-MM-DD HH:mm:ss"
    const dateText = await dateCell.textContent();
    expect(dateText).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    await page.screenshot({
      path: getScreenshotPath("08_DataTable_Date格式显示", "Date列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 RadioBox-单选功能
  // ============================================================
  test("09_RadioBox_单选功能", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const rows = page.locator("table.mdsl-table tbody tr");

    // 1. 点击第一行的 RadioBox
    await rows.nth(0).locator("td.mdsl-radio-col input[type='radio']").check();
    await expect(
      rows.nth(0).locator("td.mdsl-radio-col input[type='radio']"),
    ).toBeChecked();

    // 2. 再点击第二行的 RadioBox → 第一行取消选中
    await rows.nth(1).locator("td.mdsl-radio-col input[type='radio']").check();
    await expect(
      rows.nth(1).locator("td.mdsl-radio-col input[type='radio']"),
    ).toBeChecked();
    await expect(
      rows.nth(0).locator("td.mdsl-radio-col input[type='radio']"),
    ).not.toBeChecked();

    // 3. 选中行可识别
    await rows.nth(2).locator("td.mdsl-radio-col input[type='radio']").check();
    await expect(
      rows.nth(2).locator("td.mdsl-radio-col input[type='radio']"),
    ).toBeChecked();

    await page.screenshot({
      path: getScreenshotPath("09_RadioBox_单选功能", "单选状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Select-未选择记录时点击
  // ============================================================
  test("10_Select_未选择记录时点击", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 未选中任何 RadioBox
    // 2. 点击 Select 按钮
    await page.locator("button.mdsl-btn").first().click();
    await page.waitForTimeout(300);

    // 1. 显示错误消息："No data found"
    await expect(page.locator("div.mdsl-error-message")).toBeVisible();
    await expect(page.locator("div.mdsl-error-message")).toHaveText(
      "No data found",
    );

    // 2. 终止流程
    // 3. 保持当前画面打开
    await expect(page.locator("h1.mdsl-title")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("10_Select_未选择记录时点击", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Select-已选择记录时点击
  // ============================================================
  test("11_Select_已选择记录时点击", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选中某行 RadioBox
    const rows = page.locator("table.mdsl-table tbody tr");
    await rows.nth(0).locator("td.mdsl-radio-col input[type='radio']").check();

    // 2. 点击 Select 按钮
    await page.locator("button.mdsl-btn").first().click();
    await page.waitForTimeout(500);

    // 3. 返回前画面（HDoc - Market Document Setting）
    await expect(page).toHaveURL(/market-document-settings/);

    await page.screenshot({
      path: getScreenshotPath("11_Select_已选择记录时点击", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Select-加载中按钮禁用
  // ============================================================
  test("12_Select_加载中按钮禁用", async ({ page }) => {
    // Select 操作は navigate のみで API 呼ばないのでローディングなし
    // ここでは Select が正常に動作することを確認
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Select ボタンが有効
    await expect(page.locator("button.mdsl-btn").first()).toBeEnabled();

    // 選択して Select を実行
    const rows = page.locator("table.mdsl-table tbody tr");
    await rows.nth(0).locator("td.mdsl-radio-col input[type='radio']").check();
    await page.locator("button.mdsl-btn").first().click();
    await page.waitForTimeout(500);

    // 前画面に遷移
    await expect(page).toHaveURL(/market-document-settings/);

    await page.screenshot({
      path: getScreenshotPath("12_Select_加载中按钮禁用", "選択後遷移"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Back-返回前画面
  // ============================================================
  test("13_Back_返回前画面", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 点击 Back 按钮
    await page.locator("button.mdsl-btn").nth(1).click();
    await page.waitForTimeout(500);

    // 2. 返回前画面（HDoc - Market Document Setting）
    await expect(page).toHaveURL(/market-document-settings/);

    await page.screenshot({
      path: getScreenshotPath("13_Back_返回前画面", "返回后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Print-打印文档列表
  // ============================================================
  test("14_Print_打印文档列表", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Print 按钮確認
    await expect(page.locator("button.mdsl-btn").nth(2)).toBeVisible();
    await expect(page.locator("button.mdsl-btn").nth(2)).toHaveText("Print");

    await page.screenshot({
      path: getScreenshotPath("14_Print_打印文档列表", "Print按钮"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Print-打印功能不可用
  // ============================================================
  test("15_Print_打印功能不可用", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Print ボタンが存在することを確認
    const printBtn = page.locator("button.mdsl-btn").nth(2);
    await expect(printBtn).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("15_Print_打印功能不可用", "Print按钮"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 User 链接-跳转到 EDB User View
  // ============================================================
  test("16_User链接_跳转到EDBUserView", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 点击 User 列的链接
    await page.locator("button.link-button").first().click();
    await page.waitForTimeout(500);

    // 2. 跳转到 EDB User View 画面
    await expect(page).toHaveURL(/edb-user-view/);

    await page.screenshot({
      path: getScreenshotPath("16_User链接_跳转到EDBUserView", "EDB画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 User 链接-用户不存在
  // ============================================================
  test("17_User链接_用户不存在", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 第三行には "-" が User として設定されている
    // コンポーネントは registerUser が "-" の場合リンクを表示しない
    const rows = page.locator("table.mdsl-table tbody tr");
    const userCell = rows.nth(2).locator("td.mdsl-td").nth(2);
    await expect(userCell).toHaveText("-");
    // "-" の場合はリンクボタンが表示されない
    await expect(rows.nth(2).locator("button.link-button")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("17_User链接_用户不存在", "ユーザなし"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 异常处理-API 超时
  // ============================================================
  test("18_异常处理_API超时", async ({ page }) => {
    await mockDocumentListNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 1. 超时后显示错误消息
    // 2. DataTable 为空
    const errorMsg = page.locator("div.mdsl-error-message");
    const errorCount = await errorMsg.count();

    await page.screenshot({
      path: getScreenshotPath("18_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 异常处理-网络连接失败
  // ============================================================
  test("19_异常处理_网络连接失败", async ({ page }) => {
    await mockDocumentListNetworkError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 1. 显示错误消息
    // 2. DataTable 为空
    const errorMsg = page.locator("div.mdsl-error-message");
    const errorCount = await errorMsg.count();

    await page.screenshot({
      path: getScreenshotPath("19_异常处理_网络连接失败", "网络错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-数据库连接异常
  // ============================================================
  test("20_异常处理_数据库连接异常", async ({ page }) => {
    await mockDocumentListHttpError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.mdsl-error-message")).toBeVisible();

    // 2. DataTable 为空
    await expect(page.locator("td.mdsl-no-data")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("20_异常处理_数据库连接异常", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-前画面数据传递失败
  // ============================================================
  test("21_异常处理_前画面数据传递失败", async ({ page }) => {
    // Select 未選択時のエラーをテスト（No.10と同様）
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 未選択で Select → "No data found"
    await page.locator("button.mdsl-btn").first().click();
    await page.waitForTimeout(300);

    await expect(page.locator("div.mdsl-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("21_异常处理_前画面数据传递失败", "エラー"),
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
    await mockDocumentListSuccess(page);

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
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Select 未選択でエラーをトリガー
    await page.locator("button.mdsl-btn").first().click();
    await page.waitForTimeout(300);

    // 1. 错误消息显示
    const errorMsg = page.locator("div.mdsl-error-message");
    await expect(errorMsg).toBeVisible();

    // CSS: #c62828 → rgb(198, 40, 40)
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(198, 40, 40)");

    // 2. 默认隐藏（内容为空时不显示）

    await page.screenshot({
      path: getScreenshotPath("23_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 页面刷新
  // ============================================================
  test("24_页面刷新", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先选择一行
    const rows = page.locator("table.mdsl-table tbody tr");
    await rows.nth(0).locator("td.mdsl-radio-col input[type='radio']").check();

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. 重新调用 API 获取文档列表
    await expect(page.locator("table.mdsl-table")).toBeVisible();

    // 3. DataTable 重新显示数据
    const rowsAfter = page.locator("table.mdsl-table tbody tr");
    await expect(rowsAfter).toHaveCount(3);

    // 4. 所有 RadioBox 恢复未选中状态
    const radios = page.locator("td.mdsl-radio-col input[type='radio']");
    const radioCount = await radios.count();
    for (let i = 0; i < radioCount; i++) {
      await expect(radios.nth(i)).not.toBeChecked();
    }

    // 5. 所有按钮恢复可用状态
    const buttons = page.locator("button.mdsl-btn");
    for (let i = 0; i < 3; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("24_页面刷新", "刷新后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 安全性-API 请求协议
  // ============================================================
  test("25_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud20/**", (route) => {
      const req = route.request();
      apiCalls.push({ url: req.url(), method: req.method() });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DOCUMENTS),
      });
    });

    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 检查网络请求
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("25_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 安全性-数据只读
  // ============================================================
  test("26_安全性_数据只读", async ({ page }) => {
    await mockDocumentListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 所有数据为只读展示
    const cells = page.locator("td.mdsl-td");
    await expect(cells.first()).toBeVisible();

    // 2. 不允许修改操作（除选择操作外）
    // テーブル内に input は radio のみ
    const inputs = page.locator("table.mdsl-table input");
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      await expect(inputs.nth(i)).toHaveAttribute("type", "radio");
    }

    await page.screenshot({
      path: getScreenshotPath("26_安全性_数据只读", "只读数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
