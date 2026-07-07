import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD09";
const API_SEARCH = "/api/UD09Search";
const API_DELETE = "/api/UD09Delete";

const MOCK_RESULTS = [
  {
    productClass: "CLASS1",
    number: 1,
    market: "JPN",
    variable: "$VAR1$",
    value: "A",
    createdByUser: "user1",
    date: "2026-06-01",
  },
  {
    productClass: "CLASS2",
    number: 2,
    market: "EU",
    variable: "$VAR2$",
    value: "B",
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

test.describe("Homologation Variables Result List 模块 (UD09) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_RESULTS }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState(
        { productClass: "CLASS1", number: "1", market: "JPN" },
        "",
      ),
    );
    await page.waitForSelector(".ud09-container", { timeout: 10000 });
    await expect(page.locator(".ud09-header")).toBeVisible();
  });

  test("[2] 画面初始化-检索条件缺失", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await expect(page.locator(".ud09-error")).toContainText("检索条件缺失");
  });

  test("[7] Select-未选择时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_RESULTS }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState(
        { productClass: "CLASS1", number: "1", market: "JPN" },
        "",
      ),
    );
    await page.locator(".ud09-btn-select").click();
    await expect(page.locator(".ud09-error")).toContainText(
      "请至少选择一条记录",
    );
  });

  test("[14] Back-返回UD08", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_SEARCH, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_RESULTS }),
      });
    });
    await page.goto(URL);
    await page.evaluate(() =>
      window.history.replaceState(
        { productClass: "CLASS1", number: "1", market: "JPN" },
        "",
      ),
    );
    await page.locator(".ud09-btn-back").click();
    await expect(page).toHaveURL(/UD08/);
  });
});
