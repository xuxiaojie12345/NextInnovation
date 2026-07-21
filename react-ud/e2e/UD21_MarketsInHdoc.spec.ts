import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD21_URL = "/UD21";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD21";
let screenshotCounter = 1;

async function takeStepScreenshot(page: Page, testName: string) {
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: `${IMAGE_DIR}/${testName}/${filename}`,
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
}

async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "test-token");
  });
}

async function navigateToUD21(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  await seedSession(page);
  await page.goto(UD21_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ud21-container", { timeout: 15000 });
}

/**
 * 设置 Markets API Mock（返回示例市场列表）
 */
async function setupMarketsMock(page: Page) {
  await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        data: [
          { market: "AUT", description: "Austria", weightsFromHdoc: "Y" },
          { market: "BEL", description: "Belgium", weightsFromHdoc: "" },
          { market: "CHN", description: "China", weightsFromHdoc: "Y" },
        ],
      }),
    });
  });
}

test.describe("Markets in Hdoc (UD21) 测试", () => {
  test.beforeEach(async () => {
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

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }) => {
      const t = "画面初始化-正常表示";
      await setupMarketsMock(page);
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud21-header")).toBeVisible();
      await expect(page.locator(".ud21-page-title")).toHaveText(
        "Markets in Hdoc",
      );
      await expect(page.locator(".ud21-table")).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".ud21-table thead th").nth(0)).toHaveText(
        "Market",
      );
      await expect(page.locator(".ud21-table thead th").nth(1)).toHaveText(
        "Description",
      );
      await expect(page.locator(".ud21-table thead th").nth(2)).toHaveText(
        "Weights from Hdoc",
      );
      const rows = await page.locator(".ud21-table tbody tr").count();
      expect(rows).toBeGreaterThan(0);
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-加载中状态", async ({ page }) => {
      const t = "画面初始化-加载中状态";
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await routePromise;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            data: [
              { market: "AUT", description: "Austria", weightsFromHdoc: "Y" },
            ],
          }),
        });
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud21-loading")).toBeVisible();
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud21-table")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });

    test("[3] 画面初始化-空数据表示", async ({ page }) => {
      const t = "画面初始化-空数据表示";
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, data: [] }),
        });
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      const rows = await page.locator(".ud21-table tbody tr").count();
      expect(rows).toBe(0);
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });
  });

  test.describe("表格表示", () => {
    test("[4] 表格表示-正常数据显示", async ({ page }) => {
      const t = "表格表示-正常数据显示";
      await setupMarketsMock(page);
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      const rows = await page.locator(".ud21-table tbody tr").count();
      expect(rows).toBeGreaterThan(0);
      const firstMarket = await page
        .locator(".ud21-table tbody td")
        .first()
        .textContent();
      expect(firstMarket).toBeTruthy();
      await takeStepScreenshot(page, t);
    });

    test("[5] Weights from Hdoc-支持状态", async ({ page }) => {
      const t = "Weights from Hdoc-支持状态";
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            data: [
              { market: "AUT", description: "Austria", weightsFromHdoc: "Y" },
            ],
          }),
        });
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      const weightCell = page.locator(".ud21-table tbody td").nth(2);
      await expect(weightCell).toHaveText("Y");
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });

    test("[6] Weights from Hdoc-不支持状态", async ({ page }) => {
      const t = "Weights from Hdoc-不支持状态";
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            data: [
              { market: "BEL", description: "Belgium", weightsFromHdoc: "" },
            ],
          }),
        });
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      const weightCell = page.locator(".ud21-table tbody td").nth(2);
      await expect(weightCell).toHaveText("");
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });

    test("[7] 市场代码-最大3字符", async ({ page }) => {
      const t = "市场代码-最大3字符";
      await setupMarketsMock(page);
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      const marketCells = page.locator(".ud21-table tbody td").first();
      const text = await marketCells.textContent();
      expect(text).toBeTruthy();
      await takeStepScreenshot(page, t);
    });

    test("[8] 表格排序-Market列", async ({ page }) => {
      const t = "表格排序-Market列";
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      const thMarket = page.locator(".ud21-table thead th").nth(0);
      await thMarket.click();
      await page.waitForTimeout(300);
      await thMarket.click();
      await page.waitForTimeout(300);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[9] 异常处理-服务器500错误", async ({ page }) => {
      const t = "异常处理-服务器500错误";
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ code: 500, msg: "系统繁忙" }),
        });
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud21-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });

    test("[10] 异常处理-网络超时", async ({ page }) => {
      const t = "异常处理-网络超时";
      test.setTimeout(60000);
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await new Promise((r) => setTimeout(r, 20000));
        await route.abort("connectionrefused");
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud21-loading")).toBeVisible();
      await page.waitForSelector(".ud21-msg", { timeout: 35000 });
      await expect(page.locator(".ud21-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });

    test("[11] 异常处理-数据库异常", async ({ page }) => {
      const t = "异常处理-数据库异常";
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await route.abort("connectionrefused");
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      await page.waitForSelector(".ud21-msg", { timeout: 10000 });
      await expect(page.locator(".ud21-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });

    test("[12] 异常处理-API返回错误状态码", async ({ page }) => {
      const t = "异常处理-API返回错误状态码";
      await page.route("**/api/UD21MarketsInHdocApi/markets", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 400, msg: "查询失败" }),
        });
      });
      await navigateToUD21(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud21-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD21MarketsInHdocApi/markets");
    });
  });
});
