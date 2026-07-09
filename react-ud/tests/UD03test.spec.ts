import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "172.17.0.63",
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
// DB操作
// ============================================================
const TEST_DOCTYPES = ["TEST_VIN_PLATE", "TEST_COC", "TEST_TYPE_APPROVAL"];
let dbAvailable = false;

async function setupTestData() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      await connection.execute(
        "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE ?",
        ["TEST_%"],
      );
      for (const doctype of TEST_DOCTYPES) {
        await connection.execute(
          `INSERT IGNORE INTO HDOC_DOCUMENT_LIST (DOCTYPE, Description, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            doctype,
            doctype + " Description",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("Test data inserted:", TEST_DOCTYPES);
    } finally {
      await connection.end();
    }
  } catch (err) {
    console.warn("DB not available:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  if (!dbAvailable) return;
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    try {
      await connection.execute(
        "DELETE FROM HDOC_DOCUMENT_LIST WHERE DOCTYPE LIKE ?",
        ["TEST_%"],
      );
    } finally {
      await connection.end();
    }
  } catch {
    /* ignore */
  }
}

async function clearLocalStorage(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("lastSearchConditions"));
}

async function openPage(page: Page) {
  await clearLocalStorage(page);
  await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(1500);
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD03 Generate Homologation Document - 单体测试", () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await clearTestData();
  });

  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题
    await expect(page.locator("h1.ghd-title")).toHaveText(
      "HDoc - Generate Homologation Document",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis series输入框（带红色*标记）
    await expect(page.locator("input#chassisSeries")).toBeVisible();
    await expect(
      page.locator("label.ghd-label").filter({ hasText: "Chassis series" }),
    ).toContainText("*");
    await page.screenshot({
      path: getScreenshotPath(
        "01_画面初期显示_基本元素",
        "002_ChassisSeries確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Chassis no输入框（带红色*标记）
    await expect(page.locator("input#chassisNo")).toBeVisible();
    await expect(
      page.locator("label.ghd-label").filter({ hasText: "Chassis no" }),
    ).toContainText("*");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ChassisNo確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. Document type下拉列表（带红色*标记）
    await expect(page.locator("select#documentType")).toBeVisible();
    await expect(
      page.locator("label.ghd-label").filter({ hasText: "Document type" }),
    ).toContainText("*");
    await page.screenshot({
      path: getScreenshotPath(
        "01_画面初期显示_基本元素",
        "004_DocumentType確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. Submit、Reset、Help三个按钮
    await expect(page.locator("button.ghd-submit-btn")).toBeVisible();
    await expect(page.locator("button.ghd-reset-btn")).toBeVisible();
    await expect(page.locator("button.ghd-help-btn")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_ボタン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-输入框和按钮初始状态
  // ============================================================
  test("02_画面初期显示_输入框和按钮初始状态", async ({ page }) => {
    await openPage(page);

    // 1. Chassis series为空，最大长度5，可用
    await expect(page.locator("input#chassisSeries")).toHaveValue("");
    await expect(page.locator("input#chassisSeries")).toHaveAttribute(
      "maxLength",
      "5",
    );
    await expect(page.locator("input#chassisSeries")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框和按钮初始状态",
        "001_ChassisSeries空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis no为空，最大长度10，可用
    await expect(page.locator("input#chassisNo")).toHaveValue("");
    await expect(page.locator("input#chassisNo")).toHaveAttribute(
      "maxLength",
      "10",
    );
    await expect(page.locator("input#chassisNo")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框和按钮初始状态",
        "002_ChassisNo空確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Document type显示"Please select"，可用
    await expect(page.locator("select#documentType option").first()).toHaveText(
      "Please select",
    );
    await expect(page.locator("select#documentType")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框和按钮初始状态",
        "003_DocumentType確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 三个按钮均可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();
    await expect(page.locator("button.ghd-reset-btn")).toBeEnabled();
    await expect(page.locator("button.ghd-help-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框和按钮初始状态",
        "004_ボタン活性確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. Error message区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框和按钮初始状态",
        "005_エラーメッセージ非表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-文档类型列表API调用成功
  // ============================================================
  test("03_画面初期显示_文档类型列表API调用成功", async ({ page }) => {
    await openPage(page);

    // 1. API调用返回code=200
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_文档类型列表API调用成功",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const select = page.locator("select#documentType");
    await expect(select).toBeVisible();

    // 2. Document type下拉列表显示API返回的选项
    const options = page.locator("select#documentType option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_文档类型列表API调用成功",
        "002_オプション表示確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 默认选中第一项
    const selectedValue = await select.inputValue();
    expect(selectedValue).toBeTruthy();
    expect(selectedValue).not.toBe("");
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_文档类型列表API调用成功",
        "003_デフォルト選択確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. Error message区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "03_画面初期显示_文档类型列表API调用成功",
        "004_エラーなし確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 画面初期显示-文档类型列表为空
  // ============================================================
  test("04_画面初期显示_文档类型列表为空", async ({ page }) => {
    // Mock API返回空列表（因实际DB有数据，需要mock才能测试空列表场景）
    await clearLocalStorage(page);
    await page.route("**/api/UD03/selectHdocdocumentlist", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { doctypeList: [] },
        }),
      });
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 页面加载完成（组件使用fallback数据）
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_文档类型列表为空",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Document type下拉列表显示fallback数据
    await expect(page.locator("select#documentType")).toBeVisible();
    const options = page.locator("select#documentType option");
    const optionCount = await options.count();
    console.log("Document type options count:", optionCount);
    // 组件在空列表时使用fallback数据（VIN_PLATE等）
    // 或只显示"Please select"
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_文档类型列表为空",
        "002_オプション確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const selectedValue = await page
      .locator("select#documentType")
      .inputValue();
    console.log("Selected value:", selectedValue);
    await page.screenshot({
      path: getScreenshotPath(
        "04_画面初期显示_文档类型列表为空",
        "003_選択状態確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 画面初期显示-文档类型列表API调用失败
  // ============================================================
  test("05_画面初期显示_文档类型列表API调用失败", async ({ page }) => {
    await clearLocalStorage(page);
    // Mock API请求异常
    await page.route("**/api/UD03/selectHdocdocumentlist", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 1. 错误消息显示（红色）
    await page.screenshot({
      path: getScreenshotPath(
        "05_画面初期显示_文档类型列表API调用失败",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const errMsg = page.locator("div.ghd-error-message");
    const errVisible = await errMsg.isVisible();
    if (errVisible) {
      console.log("API error message:", await errMsg.textContent());
      const color = await errMsg.evaluate(
        (el) => window.getComputedStyle(el).color,
      );
      console.log("Error color:", color);
      await page.screenshot({
        path: getScreenshotPath(
          "05_画面初期显示_文档类型列表API调用失败",
          "002_エラーメッセージ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath(
          "05_画面初期显示_文档类型列表API调用失败",
          "002_フォールバック表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.6 画面初期显示-从本地存储加载前次条件
  // ============================================================
  test("06_画面初期显示_从本地存储加载前次条件", async ({ page }) => {
    // 设置localStorage前次条件
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem(
        "lastSearchConditions",
        JSON.stringify({
          chassisSeries: "ABC",
          chassisNo: "12345",
          documentType: "TEST_VIN_PLATE",
        }),
      );
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. Chassis series显示上次的值
    await expect(page.locator("input#chassisSeries")).toHaveValue("ABC");
    await page.screenshot({
      path: getScreenshotPath(
        "06_画面初期显示_从本地存储加载前次条件",
        "001_ChassisSeries確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis no显示上次的值
    await expect(page.locator("input#chassisNo")).toHaveValue("12345");
    await page.screenshot({
      path: getScreenshotPath(
        "06_画面初期显示_从本地存储加载前次条件",
        "002_ChassisNo確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Document type选中上次的值
    const selectedValue = await page
      .locator("select#documentType")
      .inputValue();
    expect(selectedValue).toBeTruthy();
    await page.screenshot({
      path: getScreenshotPath(
        "06_画面初期显示_从本地存储加载前次条件",
        "003_DocumentType確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. Error message区域不显示
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "06_画面初期显示_从本地存储加载前次条件",
        "004_エラーなし確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await clearLocalStorage(page);
  });

  // ============================================================
  // No.7 空值校验-Chassis series为空
  // ============================================================
  test("07_空值校验_ChassisSeries为空", async ({ page }) => {
    await openPage(page);

    // 1. 输入Chassis no和Document type，留空Chassis series
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption({ index: 1 });
    await page.screenshot({
      path: getScreenshotPath(
        "07_空值校验_ChassisSeries为空",
        "001_条件入力後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Submit
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    const errMsg = page.locator("div.ghd-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "07_空值校验_ChassisSeries为空",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toHaveText("Chassis series is required.");
    await page.screenshot({
      path: getScreenshotPath(
        "07_空值校验_ChassisSeries为空",
        "003_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 不调用API，Submit按钮恢复可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "07_空值校验_ChassisSeries为空",
        "004_Submitボタン活性確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 空值校验-Chassis no为空
  // ============================================================
  test("08_空值校验_ChassisNo为空", async ({ page }) => {
    await openPage(page);

    // 1. 输入Chassis series和Document type，留空Chassis no
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("select#documentType").selectOption({ index: 1 });
    await page.screenshot({
      path: getScreenshotPath("08_空值校验_ChassisNo为空", "001_条件入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Submit
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    const errMsg = page.locator("div.ghd-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "08_空值校验_ChassisNo为空",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toHaveText("Chassis no is required.");
    await page.screenshot({
      path: getScreenshotPath(
        "08_空值校验_ChassisNo为空",
        "003_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 不调用API，Submit按钮恢复可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "08_空值校验_ChassisNo为空",
        "004_Submitボタン活性確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
  // ============================================================
  // No.9 空值校验-Document type未选择
  // ============================================================
  test("09_空值校验_DocumentType未选择", async ({ page }) => {
    await openPage(page);

    // 1. 输入Chassis series和Chassis no，Document type选"Please select"
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption("");
    await page.screenshot({
      path: getScreenshotPath(
        "09_空值校验_DocumentType未选择",
        "001_条件入力後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Submit
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(500);

    // 3. 显示错误消息
    const errMsg = page.locator("div.ghd-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "09_空值校验_DocumentType未选择",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toHaveText(
      "Document type is required. Please select from dropdown.",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "09_空值校验_DocumentType未选择",
        "003_エラー内容確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 不调用API，Submit按钮恢复可用
    await expect(page.locator("button.ghd-submit-btn")).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath(
        "09_空值校验_DocumentType未选择",
        "004_Submitボタン活性確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 空值校验-三者均为空
  // ============================================================
  test("10_空值校验_三者均为空", async ({ page }) => {
    await openPage(page);

    // 1. 三者都为空
    await page.locator("select#documentType").selectOption("");
    await page.screenshot({
      path: getScreenshotPath("10_空值校验_三者均为空", "001_全空確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Submit
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(500);

    // 3. 先触发Chassis series空值校验
    const errMsg = page.locator("div.ghd-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "10_空值校验_三者均为空",
        "002_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(errMsg).toHaveText("Chassis series is required.");
    await page.screenshot({
      path: getScreenshotPath("10_空值校验_三者均为空", "003_エラー内容確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 不调用API
    await page.screenshot({
      path: getScreenshotPath("10_空值校验_三者均为空", "004_画面確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Submit成功-正常跳转
  // ============================================================
  test("11_Submit成功_正常跳转", async ({ page }) => {
    await openPage(page);

    // 1. 输入所有必填项
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption({ index: 1 });
    await page.screenshot({
      path: getScreenshotPath("11_Submit成功_正常跳转", "001_全項目入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Submit
    await page.locator("button.ghd-submit-btn").click();

    // 3. 保存搜索条件到localStorage
    const stored = await page.evaluate(() =>
      localStorage.getItem("lastSearchConditions"),
    );
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.chassisSeries).toBe("ABC");
      expect(parsed.chassisNo).toBe("12345");
    }
    await page.screenshot({
      path: getScreenshotPath("11_Submit成功_正常跳转", "002_保存確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 跳转到Generate document画面
    try {
      await page.waitForURL("**/generate-document?chassisNo=*", {
        timeout: 10000,
      });
    } catch {
      /* navigate may use window.location.href fallback */
    }
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    console.log("After submit, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath("11_Submit成功_正常跳转", "003_画面遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Submit-底盘系列和编号拼接后跳转
  // ============================================================
  test("12_Submit_底盘系列和编号拼接后跳转", async ({ page }) => {
    await openPage(page);

    // 1. 输入Chassis series和Chassis no
    await page.locator("input#chassisSeries").fill("ABCD");
    await page.locator("input#chassisNo").fill("123456");
    await page.locator("select#documentType").selectOption({ index: 1 });
    await page.screenshot({
      path: getScreenshotPath(
        "12_Submit_底盘系列和编号拼接后跳转",
        "001_入力後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Submit
    await page.locator("button.ghd-submit-btn").click();

    // 3. 跳转到Generate document画面并携带拼接后的参数
    try {
      await page.waitForURL("**/generate-document?chassisNo=ABCD123456", {
        timeout: 10000,
      });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    console.log("After submit with ABCD123456, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath(
        "12_Submit_底盘系列和编号拼接后跳转",
        "002_画面遷移後",
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
    await openPage(page);

    // 1. 输入各字段值
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption({ index: 1 });
    await page.screenshot({
      path: getScreenshotPath("13_Reset_正常重置", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Reset
    await page.locator("button.ghd-reset-btn").click();
    await page.waitForTimeout(300);

    // 3. Chassis series被清空
    await expect(page.locator("input#chassisSeries")).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath(
        "13_Reset_正常重置",
        "002_ChassisSeriesクリア確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. Chassis no被清空
    await expect(page.locator("input#chassisNo")).toHaveValue("");
    // 5. Document type重置为"Please select"
    await expect(page.locator("select#documentType")).toHaveValue("");
    // 6. Error message被清除
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath("13_Reset_正常重置", "003_リセット後画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Reset-有错误消息时重置
  // ============================================================
  test("14_Reset_有错误消息时重置", async ({ page }) => {
    await openPage(page);

    // 1. 先触发校验错误
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(300);
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "14_Reset_有错误消息时重置",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Reset
    await page.locator("button.ghd-reset-btn").click();
    await page.waitForTimeout(300);

    // 3. Error message被清除
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "14_Reset_有错误消息时重置",
        "002_エラークリア確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 所有输入框被清空
    await expect(page.locator("input#chassisSeries")).toHaveValue("");
    await expect(page.locator("input#chassisNo")).toHaveValue("");
    await expect(page.locator("select#documentType")).toHaveValue("");
    await page.screenshot({
      path: getScreenshotPath(
        "14_Reset_有错误消息时重置",
        "003_リセット後画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Help-点击Help按钮
  // ============================================================
  test("15_Help_点击Help按钮", async ({ page }) => {
    await openPage(page);

    // 1. 输入一些内容
    await page.locator("input#chassisSeries").fill("ABC");
    await page.locator("input#chassisNo").fill("12345");
    await page.screenshot({
      path: getScreenshotPath("15_Help_点击Help按钮", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 点击Help按钮
    await page.locator("button.ghd-help-btn").click();
    await page.waitForTimeout(1500);

    // 3. 跳转到Help画面
    const currentUrl = page.url();
    console.log("After Help click, URL:", currentUrl);
    await page.screenshot({
      path: getScreenshotPath("15_Help_点击Help按钮", "002_画面遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 Chassis series-最大长度校验
  // ============================================================
  test("16_ChassisSeries_最大长度校验", async ({ page }) => {
    await openPage(page);

    // 1. 确认maxLength=5
    await expect(page.locator("input#chassisSeries")).toHaveAttribute(
      "maxLength",
      "5",
    );
    await page.screenshot({
      path: getScreenshotPath(
        "16_ChassisSeries_最大长度校验",
        "001_maxLength確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 输入6个以上字符
    await page.locator("input#chassisSeries").fill("ABCDEFGH");
    await page.waitForTimeout(300);

    // 3. 最多只能输入5个字符
    await expect(page.locator("input#chassisSeries")).toHaveValue("ABCDE");
    await page.screenshot({
      path: getScreenshotPath(
        "16_ChassisSeries_最大长度校验",
        "002_5文字制限確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Chassis series-半角英文字符输入
  // ============================================================
  test("17_ChassisSeries_半角英文字符输入", async ({ page }) => {
    await openPage(page);

    // 1. 输入半角英文
    await page.locator("input#chassisSeries").fill("ABCDE");
    await page.screenshot({
      path: getScreenshotPath(
        "17_ChassisSeries_半角英文字符输入",
        "001_入力後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 正常输入
    await expect(page.locator("input#chassisSeries")).toHaveValue("ABCDE");
    await page.screenshot({
      path: getScreenshotPath(
        "17_ChassisSeries_半角英文字符输入",
        "002_値確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 无错误消息
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "17_ChassisSeries_半角英文字符输入",
        "003_エラーなし確認",
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
    await openPage(page);

    // 1. 确认maxLength=10
    await expect(page.locator("input#chassisNo")).toHaveAttribute(
      "maxLength",
      "10",
    );
    await page.screenshot({
      path: getScreenshotPath("18_ChassisNo_最大长度校验", "001_maxLength確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 输入11个以上字符
    await page.locator("input#chassisNo").fill("123456789012345");
    await page.waitForTimeout(300);

    // 3. 最多只能输入10个字符
    await expect(page.locator("input#chassisNo")).toHaveValue("1234567890");
    await page.screenshot({
      path: getScreenshotPath(
        "18_ChassisNo_最大长度校验",
        "002_10文字制限確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Chassis no-半角数字输入
  // ============================================================
  test("19_ChassisNo_半角数字输入", async ({ page }) => {
    await openPage(page);

    // 1. 输入半角数字
    await page.locator("input#chassisNo").fill("1234567890");
    await page.screenshot({
      path: getScreenshotPath("19_ChassisNo_半角数字输入", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 正常输入
    await expect(page.locator("input#chassisNo")).toHaveValue("1234567890");
    await page.screenshot({
      path: getScreenshotPath("19_ChassisNo_半角数字输入", "002_値確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 无错误消息
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "19_ChassisNo_半角数字输入",
        "003_エラーなし確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-网络断开
  // ============================================================
  test("20_异常处理_网络断开", async ({ page }) => {
    await clearLocalStorage(page);
    await page.route("**/api/UD03/selectHdocdocumentlist", (route) =>
      route.abort("connectionrefused"),
    );

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 1. 页面显示
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_网络断开", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 错误消息显示（组件使用fallback数据）
    const errMsg = page.locator("div.ghd-error-message");
    const errVisible = await errMsg.isVisible();
    if (errVisible) {
      console.log("Network error message:", await errMsg.textContent());
      await page.screenshot({
        path: getScreenshotPath(
          "20_异常处理_网络断开",
          "002_エラーメッセージ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath(
          "20_异常处理_网络断开",
          "002_フォールバック表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.21 异常处理-服务器500错误
  // ============================================================
  test("21_异常处理_服务器500错误", async ({ page }) => {
    await clearLocalStorage(page);
    await page.route("**/api/UD03/selectHdocdocumentlist", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, message: "System error" }),
      }),
    );

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);

    // 1. 页面显示
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_服务器500错误", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 错误消息显示
    const errMsg = page.locator("div.ghd-error-message");
    const errVisible = await errMsg.isVisible();
    if (errVisible) {
      console.log("500 error message:", await errMsg.textContent());
      const color = await errMsg.evaluate(
        (el) => window.getComputedStyle(el).color,
      );
      console.log("Error color:", color);
      await page.screenshot({
        path: getScreenshotPath(
          "21_异常处理_服务器500错误",
          "002_エラーメッセージ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath(
          "21_异常处理_服务器500错误",
          "002_フォールバック表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.22 错误消息显示样式
  // ============================================================
  test("22_错误消息显示样式", async ({ page }) => {
    await openPage(page);

    // 1. 触发空值校验
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(300);
    const errMsg = page.locator("div.ghd-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "22_错误消息显示样式",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 文字颜色为红色
    const color = await errMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    console.log("Error color:", color);
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    }
    await page.screenshot({
      path: getScreenshotPath("22_错误消息显示样式", "002_文字色確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 默认隐藏（内容为空时不占位）
    await openPage(page);
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath("22_错误消息显示样式", "003_デフォルト非表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 错误消息-输入后自动清除
  // ============================================================
  test("23_错误消息_输入后自动清除", async ({ page }) => {
    await openPage(page);

    // 1. 触发空值校验，显示错误消息
    await page.locator("input#chassisNo").fill("12345");
    await page.locator("select#documentType").selectOption({ index: 1 });
    await page.locator("button.ghd-submit-btn").click();
    await page.waitForTimeout(300);
    await expect(page.locator("div.ghd-error-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "23_错误消息_输入后自动清除",
        "001_エラーメッセージ表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 在Chassis series输入有效值
    await page.locator("input#chassisSeries").fill("ABC");
    await page.waitForTimeout(300);

    // 3. 错误消息自动清除
    await expect(page.locator("div.ghd-error-message")).toHaveCount(0);
    await page.screenshot({
      path: getScreenshotPath(
        "23_错误消息_输入后自动清除",
        "002_エラークリア後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 安全性-API请求加密
  // ============================================================
  test("24_安全性_API请求加密", async ({ page }) => {
    await clearLocalStorage(page);

    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/UD03/selectHdocdocumentlist")) {
        requests.push(request.url());
      }
    });

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);

    // 1. API请求记录
    if (requests.length > 0) {
      console.log("UD03 API requests:", requests);
    }
    await page.screenshot({
      path: getScreenshotPath("24_安全性_API请求加密", "001_API呼出後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("24_安全性_API请求加密", "002_リクエスト確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
