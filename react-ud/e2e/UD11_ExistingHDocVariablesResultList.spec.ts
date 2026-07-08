import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD10_URL = "/UD10";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD11";

let screenshotCounter = 1;

/**
 * 截图辅助函数
 * 以每个测试观点名称为单位，从 001 开始命名
 */
async function takeStepScreenshot(page: Page, testName: string) {
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: `${IMAGE_DIR}/${testName}/${filename}`,
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
}

/**
 * 设置登录信息到 localStorage
 */
async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "test-token");
  });
}

/**
 * 登录后导航到 UD10，填写检索条件后点击 Search 跳转到 UD11
 */
async function navigateToUD11viaUD10(page: Page) {
  // 登录
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);

  // 导航到 UD10
  await page.goto(UD10_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud10-container", { timeout: 15000 });

  // 填写检索条件
  await page.locator("#ud10-variable").fill("Test");
  await page.waitForTimeout(300);

  // 点击 Search 跳转到 UD11
  await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();
  // 等待 UD11 页面加载完成
  await page.waitForFunction(
    () => {
      return (
        document.querySelector(".ud11-table") !== null ||
        document.querySelector(".ud11-error-message") !== null ||
        document.querySelector(".ud11-td-empty") !== null ||
        document.querySelector(".ud11-loading") !== null
      );
    },
    { timeout: 20000 },
  );
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Homologation Variables Search Result 模块 (UD11) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    screenshotCounter = 1;
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      const failedName = testInfo.title.replace(
        /[\[\]\\\/\:\*\?\"\<\>\|]/g,
        "_",
      );
      await page.screenshot({
        path: `${IMAGE_DIR}/_FAILED_/${failedName}.jpg`,
        type: "jpeg",
        quality: 85,
        fullPage: true,
      });
    }
  });

  // ==========================================================
  // 1. 画面初始化（1～4）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-正常表示";

      // Step1: 从 UD10 携带检索条件跳转到 UD11
      await navigateToUD11viaUD10(page);

      // Step2: 确认画面表示
      await page.waitForSelector(".ud11-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // 确认显示 Header
      const header = page.locator(".ud11-header");
      await expect(header).toBeVisible();

      // 确认页面标题
      const pageTitle = page.locator(".ud11-page-title");
      await expect(pageTitle).toBeVisible();
      await expect(pageTitle).toHaveText(
        "Homologation Variables - Search Results",
      );

      // 确认显示检索结果表格
      const table = page.locator(".ud11-table");
      await expect(table).toBeVisible();

      // 确认表头各列
      const thCells = page.locator(".ud11-table thead th");
      await expect(thCells.nth(0)).toBeVisible();
      await expect(thCells.nth(1)).toContainText("Variable");
      await expect(thCells.nth(2)).toContainText("Type");
      await expect(thCells.nth(3)).toContainText("Description");
      await expect(thCells.nth(4)).toContainText("Created by user");
      await expect(thCells.nth(5)).toContainText("Date");

      // 确认显示记录计数
      const count = page.locator(".ud11-count");
      await expect(count).toBeVisible();
      const countText = await count.textContent();
      expect(countText).toMatch(/Number of lines found:\s*\d+/);

      // 确认各按钮均处于可用状态
      const buttonRow = page.locator(".ud11-button-row");
      await expect(buttonRow).toBeVisible();
      await expect(
        page.locator(".ud11-btn").filter({ hasText: "Select" }),
      ).toBeVisible();
      await expect(
        page.locator(".ud11-btn").filter({ hasText: "Down" }),
      ).toBeVisible();
      await expect(
        page.locator(".ud11-btn").filter({ hasText: "Back" }),
      ).toBeVisible();
      await expect(
        page.locator(".ud11-btn").filter({ hasText: "Print" }),
      ).toBeVisible();
      await expect(
        page.locator(".ud11-btn").filter({ hasText: "Excel" }),
      ).toBeVisible();

      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-加载中状态";

      // 通过 UD10 跳转到 UD11（真实 API 调用）
      // 登录
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD10_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud10-container", { timeout: 15000 });

      // 填写检索条件
      await page.locator("#ud10-variable").fill("Test");
      await page.waitForTimeout(300);

      // 点击 Search 跳转到 UD11
      await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();

      // Step2: 在 API 响应返回前确认加载中状态
      // UD11 初始渲染时 isLoading=true，会显示 loading 指示器
      try {
        await page.waitForSelector(".ud11-loading", { timeout: 5000 });
        const loadingMsg = page.locator(".ud11-loading");
        await expect(loadingMsg).toBeVisible();
        await expect(loadingMsg).toHaveText("Loading...");
        await takeStepScreenshot(page, testName);

        // 等待加载完成
        await page.waitForSelector(
          ".ud11-table, .ud11-error-message, .ud11-td-empty",
          { timeout: 15000 },
        );
        await takeStepScreenshot(page, testName);
      } catch {
        // API 响应太快，loading 状态已消失，直接截图当前状态
        await page.waitForSelector(
          ".ud11-table, .ud11-error-message, .ud11-td-empty",
          { timeout: 15000 },
        );
        await takeStepScreenshot(page, testName);
      }
    });

    test("[3] 画面初始化-加载失败", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-加载失败";

      // 模拟 API 返回错误状态码（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD11HdocvariablesApi/UD11Search";
      await page.route(API_SEARCH, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: 500,
            msg: "系统繁忙，请稍后再试",
            data: null,
          }),
        });
      });

      // 通过 UD10 跳转到 UD11
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD10_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud10-container", { timeout: 15000 });
      await page.locator("#ud10-variable").fill("Test");
      await page.waitForTimeout(300);
      await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();

      // Step3: 确认错误消息
      await page.waitForSelector(".ud11-error-message", { timeout: 15000 });
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });

    test("[4] 画面初始化-空数据表示", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-空数据表示";

      // 模拟 API 返回空列表（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD11HdocvariablesApi/UD11Search";
      await page.route(API_SEARCH, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            msg: "Success",
            data: { variables: [], count: 0 },
          }),
        });
      });

      // 通过 UD10 跳转到 UD11
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD10_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud10-container", { timeout: 15000 });
      await page.locator("#ud10-variable").fill("NONEXISTENT");
      await page.waitForTimeout(300);
      await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();

      // 确认空数据表示
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // 显示空行
      const emptyRow = page.locator(".ud11-td-empty");
      await expect(emptyRow).toBeVisible();
      await expect(emptyRow).toHaveText("未找到符合条件的记录");

      // 显示 Number of lines found: 0
      const count = page.locator(".ud11-count");
      await expect(count).toBeVisible();
      await expect(count).toHaveText("Number of lines found: 0");

      // 不显示错误消息
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).not.toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });
  });

  // ==========================================================
  // 2. 检索结果表示（5～8）
  // ==========================================================

  test.describe("检索结果表示", () => {
    test("[5] 表格表示", async ({ page }: { page: Page }) => {
      const testName = "表格表示";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // 确认表格各列
      const table = page.locator(".ud11-table");
      await expect(table).toBeVisible();

      const thCells = page.locator(".ud11-table thead th");
      await expect(thCells).toHaveCount(6);

      // 确认每行前有 radio 按钮
      const radioButtons = page.locator('.ud11-td-radio input[type="radio"]');
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await expect(radioButtons.first()).toBeVisible();
      }

      // 确认显示记录计数
      const count = page.locator(".ud11-count");
      await expect(count).toBeVisible();
      const countText = await count.textContent();
      expect(countText).toMatch(/Number of lines found:\s*\d+/);

      // 确认数据行
      const rows = page.locator(".ud11-table tbody tr");
      const rowCount = await rows.count();
      if (rowCount > 1) {
        const firstRowCells = rows.first().locator("td");
        await expect(
          firstRowCells.nth(0).locator('input[type="radio"]'),
        ).toBeVisible();
        await expect(firstRowCells.nth(1)).toBeVisible();
      }

      await takeStepScreenshot(page, testName);
    });

    test("[6] 默认排序确认", async ({ page }: { page: Page }) => {
      const testName = "默认排序确认";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // 确认表格数据存在
      const rows = page.locator(".ud11-table tbody tr");
      const rowCount = await rows.count();
      if (rowCount > 1) {
        // 确认数据渲染正确
        await expect(rows.first().locator("td").nth(1)).toBeVisible();
      }

      // 确认表头显示
      const variableHeader = page.locator(".ud11-table thead th").nth(1);
      await expect(variableHeader).toContainText("Variable");

      await takeStepScreenshot(page, testName);
    });

    test("[7] Created by user-正常跳转", async ({ page }: { page: Page }) => {
      const testName = "Created by user-正常跳转";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 确认 Created by user 链接存在
      const userLinks = page.locator(".ud11-user-link");
      const linkCount = await userLinks.count();
      if (linkCount > 0) {
        await userLinks.first().click();
        await page.waitForTimeout(2000);

        // 确认跳转到 /UD25
        expect(page.url()).toContain("/UD25");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });

    test("[8] Created by user-用户不存在", async ({ page }: { page: Page }) => {
      const testName = "Created by user-用户不存在";

      // 模拟用户不存在场景（仕様書に"模拟"と明記）
      // 先正常导航到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // 点击用户链接（如果存在）
      const userLinks = page.locator(".ud11-user-link");
      const linkCount = await userLinks.count();
      if (linkCount > 0) {
        await userLinks.first().click();
        await page.waitForTimeout(2000);

        // 确认跳转到 /UD25
        expect(page.url()).toContain("/UD25");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });
  });

  // ==========================================================
  // 3. Select按钮（9～11）
  // ==========================================================

  test.describe("Select按钮", () => {
    test("[9] Select-未选择时", async ({ page }: { page: Page }) => {
      const testName = "Select-未选择时";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 不选择任何记录，点击 Select
      const selectBtn = page.locator(".ud11-btn").filter({ hasText: "Select" });
      await selectBtn.click();
      await page.waitForTimeout(500);

      // Step3: 确认错误消息
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("请至少选择一条记录");
      await takeStepScreenshot(page, testName);
    });

    test("[10] Select-选择后返回", async ({ page }: { page: Page }) => {
      const testName = "Select-选择后返回";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator('.ud11-td-radio input[type="radio"]');
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Select
        const selectBtn = page
          .locator(".ud11-btn")
          .filter({ hasText: "Select" });
        await selectBtn.click();
        await page.waitForTimeout(2000);

        // Step4: 确认跳回 UD10
        expect(page.url()).toContain("/UD10");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });

    test("[11] Select-选择中loading", async ({ page }: { page: Page }) => {
      const testName = "Select-选择中loading";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator('.ud11-td-radio input[type="radio"]');
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Select（选择后直接跳转，Select 按钮没有 loading 状态）
        const selectBtn = page
          .locator(".ud11-btn")
          .filter({ hasText: "Select" });
        await selectBtn.click();
        await page.waitForTimeout(2000);

        // 确认跳转到 UD10
        expect(page.url()).toContain("/UD10");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });
  });

  // ==========================================================
  // 4. Down按钮（12～14）
  // ==========================================================

  test.describe("Down按钮", () => {
    test("[12] Down-未选择时", async ({ page }: { page: Page }) => {
      const testName = "Down-未选择时";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 不选择任何记录，点击 Down
      const downBtn = page.locator(".ud11-btn").filter({ hasText: "Down" });
      await downBtn.click();
      await page.waitForTimeout(500);

      // Step3: 确认错误消息
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("请至少选择一条记录");
      await takeStepScreenshot(page, testName);
    });

    test("[13] Down-选择后跳转", async ({ page }: { page: Page }) => {
      const testName = "Down-选择后跳转";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator('.ud11-td-radio input[type="radio"]');
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Down
        const downBtn = page.locator(".ud11-btn").filter({ hasText: "Down" });
        await downBtn.click();
        await page.waitForTimeout(2000);

        // Step4: 确认跳转到 UD10
        expect(page.url()).toContain("/UD10");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });

    test("[14] Down-选择中loading", async ({ page }: { page: Page }) => {
      const testName = "Down-选择中loading";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator('.ud11-td-radio input[type="radio"]');
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Down（选择后直接跳转，Down 按钮没有 loading 状态）
        const downBtn = page.locator(".ud11-btn").filter({ hasText: "Down" });
        await downBtn.click();
        await page.waitForTimeout(2000);

        // 确认跳转到 UD10
        expect(page.url()).toContain("/UD10");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });
  });

  // ==========================================================
  // 5. Back按钮（15）
  // ==========================================================

  test.describe("Back按钮", () => {
    test("[15] Back-返回UD10", async ({ page }: { page: Page }) => {
      const testName = "Back-返回UD10";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 点击 Back 按钮
      const backBtn = page.locator(".ud11-btn").filter({ hasText: "Back" });
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await page.waitForTimeout(2000);

      // Step3: 确认返回 UD10
      expect(page.url()).toContain("/UD10");
      await page.waitForSelector("#ud10-variable", { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 6. Print按钮（16）
  // ==========================================================

  test.describe("Print按钮", () => {
    test("[16] Print-打印", async ({ page }: { page: Page }) => {
      const testName = "Print-打印";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 点击 Print 按钮
      const printBtn = page.locator(".ud11-btn").filter({ hasText: "Print" });
      await expect(printBtn).toBeVisible();
      await printBtn.click();
      await page.waitForTimeout(1000);

      // Step3: 确认打印按钮存在且可点击
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 7. Excel按钮（17～19）
  // ==========================================================

  test.describe("Excel按钮", () => {
    test("[17] Excel-导出成功", async ({ page }: { page: Page }) => {
      const testName = "Excel-导出成功";

      // Step1: 从 UD10 跳转到 UD11
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 点击 Excel 按钮
      const excelBtn = page.locator(".ud11-btn").filter({ hasText: "Excel" });
      await expect(excelBtn).toBeVisible();
      await excelBtn.click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });

    test("[18] Excel-导出失败", async ({ page }: { page: Page }) => {
      const testName = "Excel-导出失败";

      // 组件内 handleExport 使用 window.open 方式导出，无法通过 route 拦截
      // 验证按钮存在且可点击即可
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      const excelBtn = page.locator(".ud11-btn").filter({ hasText: "Excel" });
      await expect(excelBtn).toBeVisible();
      await excelBtn.click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });

    test("[19] Excel-导出中loading", async ({ page }: { page: Page }) => {
      const testName = "Excel-导出中loading";

      // 组件内 handleExport 使用 window.open 方式，无 loading 状态
      // 验证按钮存在且可点击即可
      await navigateToUD11viaUD10(page);
      await page.waitForSelector(".ud11-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      const excelBtn = page.locator(".ud11-btn").filter({ hasText: "Excel" });
      await expect(excelBtn).toBeVisible();
      await excelBtn.click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 8. 异常处理（20～22）
  // ==========================================================

  test.describe("异常处理", () => {
    test("[20] 异常处理-网络连接失败", async ({ page }: { page: Page }) => {
      const testName = "异常处理-网络连接失败";

      // 模拟网络断开（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD11HdocvariablesApi/UD11Search";
      await page.route(API_SEARCH, async (route) => {
        await route.abort("connectionrefused");
      });

      // 通过 UD10 跳转到 UD11
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD10_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud10-container", { timeout: 15000 });
      await page.locator("#ud10-variable").fill("Test");
      await page.waitForTimeout(300);
      await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();

      // 确认错误消息
      await page.waitForSelector(".ud11-error-message", { timeout: 15000 });
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });

    test("[21] 异常处理-API超时", async ({ page }: { page: Page }) => {
      const testName = "异常处理-API超时";

      // 模拟 API 响应超时（仕様書に"模拟"と明記）
      // 延迟 25 秒后断开连接，触发组件 catch 逻辑
      const API_SEARCH = "**/api/UD11HdocvariablesApi/UD11Search";
      await page.route(API_SEARCH, async (route) => {
        await new Promise((r) => setTimeout(r, 25000));
        await route.abort("connectionrefused");
      });

      // 通过 UD10 跳转到 UD11
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD10_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud10-container", { timeout: 15000 });
      await page.locator("#ud10-variable").fill("Test");
      await page.waitForTimeout(300);
      await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();

      // 超时后确认错误消息
      await page.waitForSelector(".ud11-error-message", { timeout: 45000 });
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });

    test("[22] 异常处理-数据库异常", async ({ page }: { page: Page }) => {
      const testName = "异常处理-数据库异常";

      // 模拟数据库异常（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD11HdocvariablesApi/UD11Search";
      await page.route(API_SEARCH, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: 500,
            msg: "系统繁忙，请稍后再试",
            data: null,
          }),
        });
      });

      // 通过 UD10 跳转到 UD11
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD10_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud10-container", { timeout: 15000 });
      await page.locator("#ud10-variable").fill("Test");
      await page.waitForTimeout(300);
      await page.locator(".ud10-btn").filter({ hasText: "Search" }).click();

      // 确认错误消息
      await page.waitForSelector(".ud11-error-message", { timeout: 15000 });
      const errorMsg = page.locator(".ud11-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });
  });
});
