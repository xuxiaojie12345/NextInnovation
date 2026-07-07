import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD19";
const API_SEARCH = "/api/ud19searchresultlistapi";

const MOCK_RESULTS = [
  { userid: "t009667", user: "Kurt Bjork", market: "-EU,1AD,1CZ" },
  { userid: "v0c6900", user: "John Doe", market: "-EU" },
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

test.describe("Search HDoc User 模块 (UD19) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud19-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud19-header")).toBeVisible();
    await expect(page.locator(".ud19-title")).toContainText("Search HDoc User");
    await expect(page.locator("#ud19-userid")).toBeVisible();
    await expect(page.locator("#ud19-user")).toBeVisible();
  });

  test("[3] 条件冲突-Userid+Rule", async ({ page }: { page: Page }) => {
    await page.locator("#ud19-userid").fill("t009667");
    await page.locator("#ud19-rule").check();
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-error")).toContainText(
      "请只选择一种查询方式",
    );
  });

  test("[6] 无查询条件", async ({ page }: { page: Page }) => {
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-error")).toContainText(
      "请只选择一种查询方式",
    );
  });

  test("[7] Userid查询-正常", async ({ page }: { page: Page }) => {
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_RESULTS }),
      });
    });
    await page.locator("#ud19-userid").fill("t009667");
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-table")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".ud19-count")).toContainText("2");
  });

  test("[8] Userid查询-无结果", async ({ page }: { page: Page }) => {
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: [] }),
      });
    });
    await page.locator("#ud19-userid").fill("XXXX");
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-count")).toContainText("0", {
      timeout: 5000,
    });
  });

  test("[12] Rule搜索", async ({ page }: { page: Page }) => {
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_RESULTS }),
      });
    });
    await page.locator("#ud19-rule").check();
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-table")).toBeVisible({ timeout: 5000 });
  });

  test("[17] 搜索中按钮禁用", async ({ page }: { page: Page }) => {
    await page.route(API_SEARCH, async () => {
      await new Promise(() => {});
    });
    await page.locator("#ud19-userid").fill("t009667");
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-btn-search")).toBeDisabled();
  });

  test("[21] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_SEARCH, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud19-userid").fill("t009667");
    await page.locator(".ud19-btn-search").click();
    await expect(page.locator(".ud19-error")).toBeVisible({ timeout: 10000 });
  });
});
