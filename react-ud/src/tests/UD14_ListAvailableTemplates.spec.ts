import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD14";
const API_URL = "/api/UD14SelectTemplates";

const MOCK_FILES = [
  {
    filename: "template_a.odt",
    used: true,
    lastModified: "2026-06-15 10:30",
    size: "317 Kb",
  },
  {
    filename: "template_b.odt",
    used: false,
    lastModified: "2026-05-20 14:00",
    size: "1.2 Mb",
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

test.describe("List Available Templates 模块 (UD14) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud14-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud14-header")).toBeVisible();
    await expect(page.locator(".ud14-title")).toContainText("List Templates");
  });

  test("[3] Market选择-加载文件列表", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_FILES }),
      });
    });
    await page.locator("#ud14-market").selectOption("AUT");
    await expect(page.locator(".ud14-table")).toBeVisible({ timeout: 5000 });
  });

  test("[4] Market选择-空数据表示", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: [] }),
      });
    });
    await page.locator("#ud14-market").selectOption("AUT");
    await expect(page.locator(".ud14-empty")).toBeVisible({ timeout: 5000 });
  });

  test("[9] Used列-使用中状态", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_FILES }),
      });
    });
    await page.locator("#ud14-market").selectOption("AUT");
    await expect(page.locator(".ud14-table")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".ud14-used-mark")).toContainText("✓");
  });

  test("[14] 异常处理-API错误", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error" }),
      });
    });
    await page.locator("#ud14-market").selectOption("AUT");
    await expect(page.locator(".ud14-error")).toBeVisible({ timeout: 5000 });
  });

  test("[15] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud14-market").selectOption("AUT");
    await expect(page.locator(".ud14-error")).toBeVisible({ timeout: 10000 });
  });
});
