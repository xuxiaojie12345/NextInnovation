import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD21";
const API_URL = "/api/UD21SelectMarkets";

const MOCK_MARKETS = [
  { market: "AUT", description: "Austria", weightsFromHdoc: true },
  { market: "BEL", description: "Belgium", weightsFromHdoc: false },
  { market: "CHN", description: "China", weightsFromHdoc: true },
];

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Markets in Hdoc 模块 (UD21) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_MARKETS }),
      });
    });
    await page.goto(URL);
    await page.waitForSelector(".ud21-container", { timeout: 10000 });
    await expect(page.locator(".ud21-header")).toBeVisible();
    await expect(page.locator(".ud21-table")).toBeVisible();
  });

  test("[3] 画面初始化-空数据表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: [] }),
      });
    });
    await page.goto(URL);
    await expect(page.locator(".ud21-empty")).toBeVisible();
  });

  test("[4] 表格表示-正常数据显示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_MARKETS }),
      });
    });
    await page.goto(URL);
    await expect(page.locator(".ud21-table")).toBeVisible();
  });

  test("[5] Weights from Hdoc-支持状态", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_MARKETS }),
      });
    });
    await page.goto(URL);
    await expect(page.locator(".ud21-weight-check")).toContainText("✓");
  });

  test("[9] 异常处理-服务器500错误", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error" }),
      });
    });
    await page.goto(URL);
    await expect(page.locator(".ud21-error")).toBeVisible({ timeout: 5000 });
  });

  test("[10] 异常处理-网络超时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(URL);
    await expect(page.locator(".ud21-loading")).toBeVisible();
  });
});
