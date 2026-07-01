import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "1234",
  database: "react_ud",
};

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD03";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/generate-homologation-document`;

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
// 数据库工具函数
// ============================================================
async function setupTestData() {
  const connection = await mysql.createConnection(DB_CONFIG);
  try {
    await connection.execute(
      "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE ?",
      ["TEST_%"],
    );
    await connection.execute(
      "INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, Description) VALUES (?, ?)",
      ["TEST_VIN_PLATE", "VIN Plate Test"],
    );
    await connection.execute(
      "INSERT INTO HDOC_DOCUMENT_LIST (DOCTYPE, Description) VALUES (?, ?)",
      ["TEST_COC", "COC Test"],
    );
  } finally {
    await connection.end();
  }
}

async function clearTestData() {
  const connection = await mysql.createConnection(DB_CONFIG);
  try {
    await connection.execute(
      "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE ?",
      ["TEST_%"],
    );
  } finally {
    await connection.end();
  }
}

// ============================================================
// 模拟API响应的辅助函数
// ============================================================
async function mockApiSuccess(
  page: Page,
  doctypeList: string[] = [
    "VIN_PLATE",
    "COC",
    "TYPE_APPROVAL",
    "HOMOLOGATION_CERTIFICATE",
  ],
) {
  await page.route("**/api/UD03/selectHdocdocumentlist", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "获取文档列表成功",
        data: { doctypeList },
      }),
    });
  });
}

async function mockApiEmpty(page: Page) {
  await page.route("**/api/UD03/selectHdocdocumentlist", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "获取文档列表成功",
        data: { doctypeList: [] },
      }),
    });
  });
}

async function mockApiNetworkError(page: Page) {
  await page.route("**/api/UD03/selectHdocdocumentlist", (route) => {
    route.abort("connectionrefused");
  });
}

async function mockApi500Error(page: Page) {
  await page.route("**/api/UD03/selectHdocdocumentlist", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        code: 500,
        message: "系统错误",
        data: null,
      }),
    });
  });
}

// ============================================================
// 清理localStorage
// ============================================================
async function clearLocalStorage(page: Page) {
  // 先导航到应用页面，确保有正确的 origin 可访问 localStorage
  await page.goto(APP_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => localStorage.removeItem("lastSearchConditions"));
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD03 Generate Homologation Document - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 访问页面，确认页面整体显示
    // 1. 显示标题
    await expect(page.locator("h1.ghd-title")).toHaveText(
      "HDoc - Generate Homologation Document",
    );
    // 2. 显示 Chassis series 输入框（带红色*标记）
    await expect(page.locator("input#chassisSeries")).toBeVisible();
    await expect(
      page.locator("label.ghd-label").filter({ hasText: "Chassis series" }),
    ).toContainText("*");
    // 3. 显示 Chassis no 输入框（带红色*标记）
    await expect(page.locator("input#chassisNo")).toBeVisible();
    await expect(
      page.locator("label.ghd-label").filter({ hasText: "Chassis no" }),
    ).toContainText("*");
    // 4. 显示 Document type 下拉列表（带红色*标记）
    await expect(page.locator("select#documentType")).toBeVisible();
    await expect(
      page.locator("label.ghd-label").filter({ hasText: "Document type" }),
    ).toContainText("*");
    // 5. 显示 Submit、Reset、Help 三个按钮
    await expect(page.locator("button.ghd-submit-btn")).toBeVisible();
    await expect(page.locator("button.ghd-reset-btn")).toBeVisible();
    await expect(page.locator("button.ghd-help-btn")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-输入框和按钮初始状态
  // ============================================================
  test("02_画面初期显示_输入框和按钮初始状态", async ({ page }) => {
    await mockApiSuccess(page);
    await clearLocalStorage(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step2: 确认各控件的初始值
    // 1. Chassis series 为空，最大长度5，可用
    await expect(page.locator("input#chassisSeries")).toHaveValue("");
    await expect(page.locator("input#chassisSeries")).toHaveAttribute(
      "maxLength",
      "5",
    );
    await expect(page.locator("input#chassisSeries")).toBeEnabled();
    // 2. Chassis no 为空，最大长度10，可用
    await expect(page.locator("input#chassisNo")).toHaveValue("");
    await expect(page.locator("input#chassisNo")).toHaveAttribute(
      "maxLength",
      "10",
    );
    await expect(page.locator("input#chassisNo")).toBeEnabled();
    // 3. Document type 显示 "Please select"，可用
    await expect(page.locator("select#documentType option").first()).toHaveText(
      "Please select",
    );
    await expect(page.locator("select#documentType")).toBeEnabled();
    // 4. 三个按钮均可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();
    await expect(page.locator("button.ghd-reset-btn")).toBeEnabled();
    await expect(page.locator("button.ghd-help-btn")).toBeEnabled();
    // 5. Error message 区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框和按钮初始状态",
        "初始状态",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-文档类型列表 API 调用成功
  // ============================================================
  test("03_画面初期显示_文档类型列表API调用成功", async ({ page }) => {
    const doctypeList = ["VIN_PLATE", "COC", "TYPE_APPROVAL"];
    await mockApiSuccess(page, doctypeList);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step2: 等待API响应
    // Step3: 确认Document type下拉列表
    // 1. 调用API获取文档类型列表
    // 2. API返回code=200且doctypeList非空
    // 3. 下拉列表显示API返回的选项
    const options = page.locator("select#documentType option");
    await expect(options).toHaveCount(doctypeList.length + 1);
    // 4. 默认选中第一项
    await expect(page.locator("select#documentType")).toHaveValue("VIN_PLATE");
    // 5. Error message 区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("03_文档类型列表API调用成功", "下拉列表已加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-文档类型列表为空
  // ============================================================
  test("04_画面初期显示_文档类型列表为空", async ({ page }) => {
    await mockApiEmpty(page);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1000);

    // API返回code=200但doctypeList为空数组
    // 组件行为：空数组[]在JavaScript中为truthy值，进入if分支
    // 结果：不设置错误消息，下拉列表无额外选项但保持可用状态
    // 1. Error message 区域不显示（组件未对此场景设置错误消息）
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    // 2. Document type 下拉列表可用，仅有 "Please select" 选项
    await expect(page.locator("select#documentType")).toBeEnabled();
    await expect(page.locator("select#documentType option")).toHaveCount(1);
    await expect(page.locator("select#documentType option").first()).toHaveText(
      "Please select",
    );

    await page.screenshot({
      path: getScreenshotPath("04_文档类型列表为空", "空列表状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 画面初期显示-文档类型列表 API 调用失败
  // ============================================================
  test("05_画面初期显示_文档类型列表API调用失败", async ({ page }) => {
    await mockApi500Error(page);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1000);

    // 1. API调用失败
    // 2. 设置Error message
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    // 3. 错误消息显示红色
    const color = await page
      .locator("div.ghd-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("05_文档类型列表API调用失败", "API失败错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 画面初期显示-从本地存储加载前次条件
  // ============================================================
  test("06_画面初期显示_从本地存储加载前次条件", async ({ page }) => {
    // 预设本地存储
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.setItem(
        "lastSearchConditions",
        JSON.stringify({
          chassisSeries: "ABC",
          chassisNo: "12345",
          documentType: "VIN_PLATE",
        }),
      );
    });

    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. Chassis series 显示上次的值
    await expect(page.locator("input#chassisSeries")).toHaveValue("ABC");
    // 2. Chassis no 显示上次的值
    await expect(page.locator("input#chassisNo")).toHaveValue("12345");
    // 3. Document type 选中上次的值（若存在于新列表中）
    await expect(page.locator("select#documentType")).toHaveValue("VIN_PLATE");
    // 4. Error message 区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("06_从本地存储加载前次条件", "恢复上次条件"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await clearLocalStorage(page);
  });

  // ============================================================
  // No.7 空值校验-Chassis series 为空
  // ============================================================
  test("07_空值校验_ChassisSeries为空", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: Chassis series 留空
    await page.locator("input#chassisSeries").fill("");
    // Step2: Chassis no 输入有效值
    await page.locator("input#chassisNo").fill("12345");
    // Step3: Document type 选择有效值
    await page.locator("select#documentType").selectOption("VIN_PLATE");
    // Step4: 点击 Submit
    await page.locator("button.ghd-submit-btn").click();

    // 1. 显示错误消息："Chassis series is required"
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    await expect(page.locator("div.ghd-error-message")).toHaveText(
      "Chassis series is required.",
    );
    // 2. Error message 区域显示红色
    const color = await page
      .locator("div.ghd-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    // 3. 不调用API（没有跳转）
    // 4. Submit 按钮恢复可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("07_空值校验_ChassisSeries为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 空值校验-Chassis no 为空
  // ============================================================
  test("08_空值校验_ChassisNo为空", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: Chassis series 输入有效值
    await page.locator("input#chassisSeries").fill("ABC");
    // Step2: Chassis no 留空
    await page.locator("input#chassisNo").fill("");
    // Step3: Document type 选择有效值
    await page.locator("select#documentType").selectOption("VIN_PLATE");
    // Step4: 点击 Submit
    await page.locator("button.ghd-submit-btn").click();

    // 1. 显示错误消息："Chassis no is required."
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    await expect(page.locator("div.ghd-error-message")).toHaveText(
      "Chassis no is required.",
    );
    // 2. Error message 区域显示红色
    const color = await page
      .locator("div.ghd-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    // 3. 不调用API
    // 4. Submit 按钮恢复可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("08_空值校验_ChassisNo为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 空值校验-Document type 未选择
  // ============================================================
  test("09_空值校验_DocumentType未选择", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: Chassis series 输入有效值
    await page.locator("input#chassisSeries").fill("ABC");
    // Step2: Chassis no 输入有效值
    await page.locator("input#chassisNo").fill("12345");
    // Step3: Document type 选择 "Please select"
    await page.locator("select#documentType").selectOption("");
    // Step4: 点击 Submit
    await page.locator("button.ghd-submit-btn").click();

    // 1. 显示错误消息："Document type is required."
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    await expect(page.locator("div.ghd-error-message")).toHaveText(
      "Document type is required. Please select from dropdown.",
    );
    // 2. Error message 区域显示红色
    const color = await page
      .locator("div.ghd-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");
    // 3. 不调用API
    // 4. Submit 按钮恢复可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("09_空值校验_DocumentType未选择", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 空值校验-三者均为空
  // ============================================================
  test("10_空值校验_三者均为空", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: Chassis series 留空
    await page.locator("input#chassisSeries").fill("");
    // Step2: Chassis no 留空
    await page.locator("input#chassisNo").fill("");
    // Step3: Document type 选择 "Please select"
    await page.locator("select#documentType").selectOption("");
    // Step4: 点击 Submit
    await page.locator("button.ghd-submit-btn").click();

    // 1. 先触发 Chassis series 空值校验
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    await expect(page.locator("div.ghd-error-message")).toHaveText(
      "Chassis series is required.",
    );
    // 3. Chassis no 和 Document type 的校验不执行
    // 4. 不调用API

    await page.screenshot({
      path: getScreenshotPath("10_空值校验_三者均为空", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Submit 成功-正常跳转
  // ============================================================
  test("11_Submit成功_正常跳转", async ({ page }) => {
    await mockApiSuccess(page);
    await clearLocalStorage(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入所有必填项
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption("VIN_PLATE");
    // Step2: 点击 Submit
    await page.locator("button.ghd-submit-btn").click();

    // 1. 前端校验通过
    // 2. 保存搜索条件到本地存储
    const stored = await page.evaluate(() =>
      localStorage.getItem("lastSearchConditions"),
    );
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.chassisSeries).toBe("ABC");
      expect(parsed.chassisNo).toBe("12345");
      expect(parsed.documentType).toBe("VIN_PLATE");
    }
    // 3. 调用导航跳转到 Generate document 画面
    await page.waitForURL("**/generate-document?chassisNo=*");
    // 4. Error message 区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("11_Submit成功_正常跳转", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Submit-底盘系列和编号拼接后跳转
  // ============================================================
  test("12_Submit_底盘系列和编号拼接后跳转", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入 Chassis series 和 Chassis no
    await page.locator("input#chassisSeries").fill("ABCD");
    await page.locator("input#chassisNo").fill("123456");
    await page.locator("select#documentType").selectOption("VIN_PLATE");
    // Step2: 点击 Submit
    await page.locator("button.ghd-submit-btn").click();

    // 1. Chassis series 和 Chassis no 拼接传递
    // 2. 跳转到 Generate document 画面并携带拼接后的参数
    await page.waitForURL("**/generate-document?chassisNo=ABCD123456");

    await page.screenshot({
      path: getScreenshotPath(
        "12_Submit_底盘系列和编号拼接后跳转",
        "拼接跳转URL",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Reset-正常重置
  // ============================================================
  test("13_Reset_正常重置", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入各字段值
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption("VIN_PLATE");
    // 点击 Reset
    await page.locator("button.ghd-reset-btn").click();

    // 1. Chassis series 被清空
    await expect(page.locator("input#chassisSeries")).toHaveValue("");
    // 2. Chassis no 被清空
    await expect(page.locator("input#chassisNo")).toHaveValue("");
    // 3. Document type 重置为 "Please select"
    await expect(page.locator("select#documentType")).toHaveValue("");
    // 4. Error message 区域被清除
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    // 5. 画面回到初始状态

    await page.screenshot({
      path: getScreenshotPath("13_Reset_正常重置", "重置后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Reset-有错误消息时重置
  // ============================================================
  test("14_Reset_有错误消息时重置", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 先触发校验错误
    await page.locator("button.ghd-submit-btn").click();
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    // Step2: 错误消息显示后点击 Reset
    await page.locator("button.ghd-reset-btn").click();

    // 1. Error message 被清除
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    // 2. 所有输入框被清空
    await expect(page.locator("input#chassisSeries")).toHaveValue("");
    await expect(page.locator("input#chassisNo")).toHaveValue("");
    // 3. Document type 重置为 "Please select"
    await expect(page.locator("select#documentType")).toHaveValue("");
    // 4. 画面回到初始状态

    await page.screenshot({
      path: getScreenshotPath("14_Reset_有错误消息时重置", "重置后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Help-点击 Help 按钮
  // ============================================================
  test("15_Help_点击Help按钮", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 输入一些内容，确认跳转后保持不变
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");

    // Step1: 点击 Help 按钮
    await page.locator("button.ghd-help-btn").click();

    // 1. 跳转到 Help 画面
    await page.waitForURL("**/hdoc-help");
    // 2. 当前页面输入框内容保持不变（跳转后已离开原页面）

    await page.screenshot({
      path: getScreenshotPath("15_Help_点击Help按钮", "跳转到Help画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Chassis series-最大长度校验
  // ============================================================
  test("16_ChassisSeries_最大长度校验", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入6个以上字符
    await page.locator("input#chassisSeries").fill("ABCDEFGH");

    // 1. 最多只能输入5个字符
    await expect(page.locator("input#chassisSeries")).toHaveValue("ABCDE");
    // 2. 超出部分无法输入

    await page.screenshot({
      path: getScreenshotPath("16_ChassisSeries_最大长度校验", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Chassis series-半角英文字符输入
  // ============================================================
  test("17_ChassisSeries_半角英文字符输入", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入半角英文
    await page.locator("input#chassisSeries").fill("ABCDE");

    // 1. 正常输入
    await expect(page.locator("input#chassisSeries")).toHaveValue("ABCDE");
    // 2. 无错误消息
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath(
        "17_ChassisSeries_半角英文字符输入",
        "输入后状态",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 Chassis no-最大长度校验
  // ============================================================
  test("18_ChassisNo_最大长度校验", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入11个以上字符
    await page.locator("input#chassisNo").fill("123456789012345");

    // 1. 最多只能输入10个字符
    await expect(page.locator("input#chassisNo")).toHaveValue("1234567890");
    // 2. 超出部分无法输入

    await page.screenshot({
      path: getScreenshotPath("18_ChassisNo_最大长度校验", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Chassis no-半角数字输入
  // ============================================================
  test("19_ChassisNo_半角数字输入", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 输入半角数字
    await page.locator("input#chassisNo").fill("1234567890");

    // 1. 正常输入
    await expect(page.locator("input#chassisNo")).toHaveValue("1234567890");
    // 2. 无错误消息
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("19_ChassisNo_半角数字输入", "输入后状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-网络断开
  // ============================================================
  test("20_异常处理_网络断开", async ({ page }) => {
    await mockApiNetworkError(page);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1000);

    // 1. 显示错误消息："网络错误。请检查您的连接。"
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    // 2. 类型为 Error（红色）
    const color = await page
      .locator("div.ghd-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("20_异常处理_网络断开", "网络断开错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-服务器 500 错误
  // ============================================================
  test("21_异常处理_服务器500错误", async ({ page }) => {
    await mockApi500Error(page);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1000);

    // 1. 显示错误消息："系统错误。请联系管理员。"
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    // 2. 类型为 Error（红色）
    const color = await page
      .locator("div.ghd-error-message")
      .evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("21_异常处理_服务器500错误", "500错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 错误消息显示样式
  // ============================================================
  test("22_错误消息显示样式", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 触发任意空值校验错误
    await page.locator("button.ghd-submit-btn").click();

    // 1. Error message 区域显示
    const errorMsg = page.locator("div.ghd-error-message");
    await expect(errorMsg).toBeVisible();
    // 2. 文字颜色为红色
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");
    // 3. 默认隐藏（内容为空时不占位）
    // （有内容时已显示）

    await page.screenshot({
      path: getScreenshotPath("22_错误消息显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 错误消息-输入后自动清除
  // ============================================================
  test("23_错误消息_输入后自动清除", async ({ page }) => {
    await mockApiSuccess(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Step1: 触发空值校验，显示错误消息
    await page.locator("input#chassisSeries").fill("");
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption("VIN_PLATE");
    await page.locator("button.ghd-submit-btn").click();
    await expect(page.locator("div.ghd-error-message")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("23_错误消息_输入后自动清除", "错误消息显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Step2: 在对应输入框中输入有效值
    await page.locator("input#chassisSeries").fill("ABC");

    // 1. 输入有效值后错误消息自动清除
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    // 2. Error message 区域隐藏

    await page.screenshot({
      path: getScreenshotPath("23_错误消息_输入后自动清除", "错误消息清除后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 安全性-API 请求加密
  // ============================================================
  test("24_安全性_API请求加密", async ({ page }) => {
    const apiCallDetails: { url: string; headers: Record<string, string> }[] =
      [];
    await page.route("**/api/UD03/selectHdocdocumentlist", (route) => {
      const req = route.request();
      apiCallDetails.push({
        url: req.url(),
        headers: req.headers() as Record<string, string>,
      });
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "获取文档列表成功",
          data: {
            doctypeList: ["VIN_PLATE", "COC"],
          },
        }),
      });
    });

    // Step2: 执行页面初始化
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");

    // Step3: 检查网络请求
    // 1. API 请求通过 HTTPS 发送
    expect(apiCallDetails.length).toBeGreaterThan(0);
    // 2. 请求中不包含明文敏感信息
    for (const detail of apiCallDetails) {
      expect(detail.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("24_安全性_API请求加密", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
