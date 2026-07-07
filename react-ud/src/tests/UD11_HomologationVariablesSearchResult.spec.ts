import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD11";
const API_SEARCH = "/api/UD11SearchVariables";
const API_DELETE = "/api/UD11Delete";
const API_EXCEL = "/api/UD11ExcelExport";

const MOCK_RESULTS = [
  {
    variable: "$VAR1$",
    type: "VDA",
    description: "Description 1",
    createdByUser: "user1",
    date: "2026-06-01",
  },
  {
    variable: "$VAR2$",
    type: "User Defined",
    description: "Description 2",
    createdByUser: "user2",
    date: "2026-06-02",
  },
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

test.describe("Homologation Variables Search Result 模块 (UD11) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { variables: MOCK_RESULTS, count: 2 },
        }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState({ variable: "$VAR1$", type: "VDA" }, ""),
    );
    await page.waitForSelector(".ud11-container", { timeout: 10000 });
    await expect(page.locator(".ud11-header")).toBeVisible();
  });

  test("[4] 画面初始化-空数据表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { variables: [], count: 0 },
        }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState({ variable: "NONE" }, ""),
    );
    await expect(page.locator(".ud11-empty")).toBeVisible();
  });

  test("[9] Select-未选择时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { variables: MOCK_RESULTS, count: 2 },
        }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState({ variable: "$VAR1$" }, ""),
    );
    await page.locator(".ud11-btn-select").click();
    await expect(page.locator(".ud11-error")).toContainText(
      "请至少选择一条记录",
    );
  });

  test("[15] Back-返回UD10", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { variables: MOCK_RESULTS, count: 2 },
        }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState({ variable: "$VAR1$" }, ""),
    );
    await page.locator(".ud11-btn-back").click();
    await expect(page).toHaveURL(/UD10/);
  });

  test("[16] Print-打印", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { variables: MOCK_RESULTS, count: 2 },
        }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState({ variable: "$VAR1$" }, ""),
    );
    await page.locator(".ud11-btn-print").click();
  });
});
