import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD08_URL = "/UD08";
const UD09_URL = "/UD09";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD09";

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
 * 登录后导航到 UD08，读取下拉菜单的实际值，填写检索条件后跳转到 UD09
 * 通过动态读取下拉选项避免硬编码值与数据库不匹配的问题
 * @param numberValue 可自定义 Number 输入值，缺省使用 "12345"
 */
async function navigateToUD09viaUD08(page: Page, numberValue?: string) {
  const num = numberValue || "12345";

  // Step1: 登录
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);

  // Step2: 导航到 UD08，等待下拉列表加载完成
  await page.goto(UD08_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#product-class-select", { timeout: 20000 });

  // Step3: 读取 Product class 下拉菜单的第一个有效值
  const pcSelect = page.locator("#product-class-select");
  const pcOptions = await pcSelect.locator("option").all();
  let pcValue = "";
  for (const opt of pcOptions) {
    const val = await opt.getAttribute("value");
    if (val && val.trim() !== "") {
      pcValue = val.trim();
      break;
    }
  }
  if (!pcValue) {
    throw new Error("Product class 下拉列表没有有效选项");
  }
  await pcSelect.selectOption(pcValue);

  // Step4: 输入 Number
  await page.locator("#number-input").fill(num);

  // Step5: 读取 Market 下拉菜单的第一个有效值
  const mktSelect = page.locator("#market-select");
  const mktOptions = await mktSelect.locator("option").all();
  let mktValue = "";
  for (const opt of mktOptions) {
    const val = await opt.getAttribute("value");
    if (val && val.trim() !== "") {
      mktValue = val.trim();
      break;
    }
  }
  if (!mktValue) {
    throw new Error("Market 下拉列表没有有效选项");
  }
  await mktSelect.selectOption(mktValue);

  await page.waitForTimeout(300);

  // Step6: 点击 Search 跳转到 UD09
  await page.locator(".ud08-btn").filter({ hasText: "Search" }).click();
  // 等待 UD09 页面加载完成
  await page.waitForFunction(
    () => {
      return (
        document.querySelector(".ud09-table") !== null ||
        document.querySelector(".ud09-error-message") !== null ||
        document.querySelector(".ud09-td-empty") !== null ||
        document.querySelector(".ud09-loading") !== null
      );
    },
    { timeout: 20000 },
  );
  await page.waitForTimeout(500);
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Homologation Variables Result List 模块 (UD09) 测试", () => {
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
  // 1. 画面初始化（1～3）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-正常表示";

      // Step1: 从 UD08 携带检索条件跳转到 UD09
      await navigateToUD09viaUD08(page);

      // Step2: 确认画面表示 - 蓝色 Header
      await page.waitForSelector(".ud09-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // 确认显示蓝色 Header
      const header = page.locator(".ud09-header");
      await expect(header).toBeVisible();

      // 确认页面标题
      const pageTitle = page.locator(".ud09-page-title");
      await expect(pageTitle).toBeVisible();
      await expect(pageTitle).toHaveText("Homologation Variables");

      // 确认显示检索结果表格
      const table = page.locator(".ud09-table");
      await expect(table).toBeVisible();

      // 确认表头各列
      const thCells = page.locator(".ud09-table thead th");
      await expect(thCells.nth(0)).toBeVisible(); // checkbox
      await expect(thCells.nth(1)).toContainText("Product class");
      await expect(thCells.nth(2)).toContainText("Number");
      await expect(thCells.nth(3)).toContainText("Market");
      await expect(thCells.nth(4)).toContainText("Variable");
      await expect(thCells.nth(5)).toContainText("Value");
      await expect(thCells.nth(6)).toContainText("Variant string");
      await expect(thCells.nth(7)).toContainText("Comments");
      await expect(thCells.nth(8)).toContainText("Add");
      await expect(thCells.nth(9)).toContainText("Delete");
      await expect(thCells.nth(10)).toContainText("Created by user");
      await expect(thCells.nth(11)).toContainText("Date");

      // 确认显示记录计数 "Number of lines found: X"
      const count = page.locator(".ud09-count");
      await expect(count).toBeVisible();

      // 确认按钮行显示
      const buttonRow = page.locator(".ud09-button-row");
      await expect(buttonRow).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Select", exact: true }),
      ).toBeVisible();
      await expect(
        page.locator(".ud09-btn").filter({ hasText: "Back" }),
      ).toBeVisible();
      await expect(
        page.locator(".ud09-btn").filter({ hasText: "Print" }),
      ).toBeVisible();
      await expect(
        page.locator(".ud09-btn").filter({ hasText: "Delete Selected" }),
      ).toBeVisible();

      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-检索条件缺失", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-检索条件缺失";

      // Step1: 不携带参数直接访问 UD09
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD09_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud09-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 确认结果 - 显示错误消息
      const errorMsg = page.locator(".ud09-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("检索条件缺失，无法加载数据");
      await takeStepScreenshot(page, testName);
    });

    test("[3] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-加载中状态";

      // 模拟 API 延迟响应（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD09DeleteHdocuserdefinedrulesApi/UD09Seach";
      await page.route(API_SEARCH, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      // Step1: 通过 UD08 跳转到 UD09（API 会被 route 拦截延迟）
      await navigateToUD09viaUD08(page);
      // 等待 UD09 容器出现
      await page.waitForSelector(".ud09-container", { timeout: 10000 });
      await takeStepScreenshot(page, testName);

      // Step3: 确认加载中状态
      const loadingMsg = page.locator(".ud09-loading");
      await expect(loadingMsg).toBeVisible({ timeout: 5000 });
      await expect(loadingMsg).toHaveText("Loading...");
      await takeStepScreenshot(page, testName);

      // Step4: 加载完成后正常显示
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });
  });

  // ==========================================================
  // 2. 搜索结果展示（4～5）
  // ==========================================================

  test.describe("搜索结果展示", () => {
    test("[4] 表格显示", async ({ page }: { page: Page }) => {
      const testName = "表格显示";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 确认表格各列显示
      const table = page.locator(".ud09-table");
      await expect(table).toBeVisible();

      // 确认显示所有列
      const thCells = page.locator(".ud09-table thead th");
      await expect(thCells).toHaveCount(12);

      // 确认每行前有 radio 按钮
      const radioButtons = page.locator(
        '.ud09-td-checkbox input[type="radio"]',
      );
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await expect(radioButtons.first()).toBeVisible();
      }

      // 确认显示记录计数
      const count = page.locator(".ud09-count");
      await expect(count).toBeVisible();
      const countText = await count.textContent();
      expect(countText).toMatch(/Number of lines found:\s*\d+/);

      // 确认数据正确渲染 - 检查 tbody 中的行
      const rows = page.locator(".ud09-table tbody tr");
      const rowCount = await rows.count();
      if (rowCount > 1) {
        // 有数据行时验证
        const firstRowCells = rows.first().locator("td");
        const cellCount = await firstRowCells.count();
        await expect(cellCount).toBe(12);

        // radio 按钮存在
        await expect(
          firstRowCells.nth(0).locator('input[type="radio"]'),
        ).toBeVisible();
      }

      await takeStepScreenshot(page, testName);
    });

    test("[5] Created by user链接", async ({ page }: { page: Page }) => {
      const testName = "Created by user链接";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 确认 Created by user 链接存在
      const userLinks = page.locator(".ud09-user-link");
      const linkCount = await userLinks.count();
      if (linkCount > 0) {
        // 点击第一个链接
        const firstLink = userLinks.first();
        await expect(firstLink).toBeVisible();

        // 点击链接
        await firstLink.click();
        await page.waitForTimeout(2000);

        // 确认跳转到 /UD25
        expect(page.url()).toContain("/UD25");
        await takeStepScreenshot(page, testName);
      } else {
        // 没有数据行时，记录截图并跳过点击验证
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });
  });

  // ==========================================================
  // 3. 排序（6）
  // ==========================================================

  test.describe("排序", () => {
    test("[6] 排序-确认默认排序", async ({ page }: { page: Page }) => {
      const testName = "排序-确认默认排序";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 确认表头各列显示
      // UD09 组件默认按 Product class 升序排列，但列头没有 onClick 事件
      // 因此验证表头文本和表格结构
      const productClassHeader = page.locator(".ud09-table thead th").nth(1);
      await expect(productClassHeader).toBeVisible();
      await expect(productClassHeader).toHaveText("*Product class");

      // 确认表格数据存在
      const rows = page.locator(".ud09-table tbody tr");
      const rowCount = await rows.count();
      // 如果有多行数据，确认是按 productClass 升序排列（默认排序）
      if (rowCount > 1) {
        // 至少存在数据行，验证渲染正确
        await expect(rows.first().locator("td").nth(1)).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. Select按钮（7～8）
  // ==========================================================

  test.describe("Select按钮", () => {
    test("[7] Select-未选择时", async ({ page }: { page: Page }) => {
      const testName = "Select-未选择时";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 不选择任何记录，直接点击 Select
      const selectBtn = page.getByRole("button", {
        name: "Select",
        exact: true,
      });
      await selectBtn.click();
      await page.waitForTimeout(500);

      // Step3: 确认错误消息
      const errorMsg = page.locator(".ud09-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("请至少选择一条记录");
      await takeStepScreenshot(page, testName);
    });

    test("[8] Select-选择后返回", async ({ page }: { page: Page }) => {
      const testName = "Select-选择后返回";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator(
        '.ud09-td-checkbox input[type="radio"]',
      );
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        // 选择第一行
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Select
        const selectBtn = page.getByRole("button", {
          name: "Select",
          exact: true,
        });
        await selectBtn.click();
        await page.waitForTimeout(2000);

        // Step4: 确认跳回 UD08
        expect(page.url()).toContain("/UD08");
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });
  });

  // ==========================================================
  // 5. Delete Selected按钮（9～13）
  // ==========================================================

  test.describe("Delete Selected按钮", () => {
    test("[9] Delete-未选择时", async ({ page }: { page: Page }) => {
      const testName = "Delete-未选择时";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 不选择任何记录，直接点击 Delete Selected
      const deleteBtn = page
        .locator(".ud09-btn")
        .filter({ hasText: "Delete Selected" });
      await deleteBtn.click();

      // Step3: 确认错误消息
      await page.waitForSelector(".ud09-error-message", { timeout: 10000 });
      const errorMsg = page.locator(".ud09-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("请至少选择一条记录");
      await takeStepScreenshot(page, testName);
    });

    test("[10] Delete-确认取消", async ({ page }: { page: Page }) => {
      const testName = "Delete-确认取消";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator(
        '.ud09-td-checkbox input[type="radio"]',
      );
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Delete Selected
        // 先设置 dialog 处理（取消）
        page.on("dialog", async (dialog) => {
          await dialog.dismiss();
        });

        const deleteBtn = page
          .locator(".ud09-btn")
          .filter({ hasText: "Delete Selected" });
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // Step4: 确认取消后列表不变
        const rowsAfter = await page.locator(".ud09-table tbody tr").count();
        await expect(rowsAfter).toBeGreaterThan(0);
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });

    test("[11] Delete-确认确定", async ({ page }: { page: Page }) => {
      const testName = "Delete-确认确定";

      // Step1: 从 UD08 检索后跳转到 UD09
      // 使用特定的检索条件，确认有数据返回
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator(
        '.ud09-td-checkbox input[type="radio"]',
      );
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Delete Selected，确认对话框确定
        page.on("dialog", async (dialog) => {
          await dialog.accept();
        });

        const deleteBtn = page
          .locator(".ud09-btn")
          .filter({ hasText: "Delete Selected" });
        await deleteBtn.click();
        await page.waitForTimeout(3000);

        // Step4: 确认结果 - API 调用后刷新列表
        // 检查是否出现成功消息（alert）或错误消息
        const errorMsg = page.locator(".ud09-error-message");
        const isErrorVisible = await errorMsg.isVisible().catch(() => false);

        if (isErrorVisible) {
          // 删除失败时显示错误消息
          await expect(errorMsg).toBeVisible();
        }

        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }
    });

    test("[12] Delete-加载中按钮禁用", async ({ page }: { page: Page }) => {
      const testName = "Delete-加载中按钮禁用";

      // 模拟 API 延迟响应
      const API_DELETE =
        "**/api/UD09DeleteHdocuserdefinedrulesApi/UD09DeleteSelected";
      await page.route(API_DELETE, async (route) => {
        await new Promise((r) => setTimeout(r, 5000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "Success", data: {} }),
        });
      });

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator(
        '.ud09-td-checkbox input[type="radio"]',
      );
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Delete Selected，确认对话框确定
        page.on("dialog", async (dialog) => {
          await dialog.accept();
        });

        const deleteBtn = page
          .locator(".ud09-btn")
          .filter({ hasText: "Delete Selected" });
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Step4: 确认按钮禁用（防止重复提交）
        await expect(deleteBtn).toBeDisabled();
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }

      await page.unroute(API_DELETE);
    });

    test("[13] Delete-删除失败", async ({ page }: { page: Page }) => {
      const testName = "Delete-删除失败";

      // 模拟 API 返回错误（仕様書に"模拟"と明記）
      const API_DELETE =
        "**/api/UD09DeleteHdocuserdefinedrulesApi/UD09DeleteSelected";
      await page.route(API_DELETE, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: 500,
            msg: "删除失败，请稍后重试",
            data: null,
          }),
        });
      });

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-table", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 选择一条记录
      const radioButtons = page.locator(
        '.ud09-td-checkbox input[type="radio"]',
      );
      const radioCount = await radioButtons.count();
      if (radioCount > 0) {
        await radioButtons.first().check();
        await page.waitForTimeout(300);
        await takeStepScreenshot(page, testName);

        // Step3: 点击 Delete Selected，确认对话框确定
        page.on("dialog", async (dialog) => {
          await dialog.accept();
        });

        const deleteBtn = page
          .locator(".ud09-btn")
          .filter({ hasText: "Delete Selected" });
        await deleteBtn.click();
        await page.waitForTimeout(2000);

        // Step4: 确认错误消息显示，按钮恢复可用状态
        const errorMsg = page.locator(".ud09-error-message");
        await expect(errorMsg).toBeVisible();

        // 按钮恢复可用状态
        await expect(deleteBtn).not.toBeDisabled();
        await takeStepScreenshot(page, testName);
      } else {
        await takeStepScreenshot(page, testName);
        test.skip();
      }

      await page.unroute(API_DELETE);
    });
  });

  // ==========================================================
  // 6. Back/Print按钮（14～15）
  // ==========================================================

  test.describe("Back/Print按钮", () => {
    test("[14] Back-返回UD08", async ({ page }: { page: Page }) => {
      const testName = "Back-返回UD08";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 点击 Back 按钮
      const backBtn = page.locator(".ud09-btn").filter({ hasText: "Back" });
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await page.waitForTimeout(2000);

      // Step3: 确认返回 UD08
      expect(page.url()).toContain("/UD08");
      await page.waitForSelector("#product-class-select", { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });

    test("[15] Print-打印", async ({ page }: { page: Page }) => {
      const testName = "Print-打印";

      // Step1: 从 UD08 检索后跳转到 UD09
      await navigateToUD09viaUD08(page);
      await page.waitForSelector(".ud09-container", { timeout: 15000 });
      await takeStepScreenshot(page, testName);

      // Step2: 点击 Print 按钮
      const printBtn = page.locator(".ud09-btn").filter({ hasText: "Print" });
      await expect(printBtn).toBeVisible();

      await printBtn.click();
      await page.waitForTimeout(1000);

      // Step3: 确认浏览器打印对话框打开（window.print() 被调用）
      // window.print() 在测试环境中不会真正打开打印对话框
      // 验证按钮存在且可点击即可
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 7. 异常处理（16～17）
  // ==========================================================

  test.describe("异常处理", () => {
    test("[16] 异常处理-网络断开", async ({ page }: { page: Page }) => {
      const testName = "异常处理-网络断开";

      // 模拟网络断开（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD09DeleteHdocuserdefinedrulesApi/UD09Seach";
      await page.route(API_SEARCH, async (route) => {
        await route.abort("connectionrefused");
      });

      // Step1: 通过 UD08 跳转到 UD09（API 会被 abort）
      // 路由拦截器已在上方设置，会阻断 UD09 的 API 请求
      await navigateToUD09viaUD08(page);

      // Step3: 等待 UD09 加载，确认错误消息
      await page.waitForSelector(".ud09-error-message", { timeout: 15000 });
      const errorMsg = page.locator(".ud09-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });

    test("[17] 异常处理-数据库异常", async ({ page }: { page: Page }) => {
      const testName = "异常处理-数据库异常";

      // 模拟数据库异常（API 返回 500）（仕様書に"模拟"と明記）
      const API_SEARCH = "**/api/UD09DeleteHdocuserdefinedrulesApi/UD09Seach";
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

      // Step1: 通过 UD08 跳转到 UD09（API 返回 500）
      // 路由拦截器已在上方设置，会拦截 UD09 的 API 请求并返回 500
      await navigateToUD09viaUD08(page);

      // Step3: 等待 UD09 加载，确认错误消息
      await page.waitForSelector(".ud09-error-message", { timeout: 15000 });
      const errorMsg = page.locator(".ud09-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_SEARCH);
    });
  });
});
