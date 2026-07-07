import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD20";
const API_URL = "/api/market-document-settings-list/document-list";

const MOCK_LIST = [
  {
    documentType: "VIN-PLATE",
    businessUnit: "BU",
    user: "admin",
    date: "2026-06-01",
  },
  {
    documentType: "CERTIFICATE",
    businessUnit: "BU",
    user: "user1",
    date: "2026-06-15",
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

test.describe("Market Document Settings List 模块 (UD20) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_LIST }),
      });
    });
    await page.goto(`${URL}?docType=VIN-PLATE`);
    await page.waitForSelector(".ud20-container", { timeout: 10000 });
    await expect(page.locator(".ud20-header")).toBeVisible();
    await expect(page.locator(".ud20-table")).toBeVisible();
  });

  test("[4] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(`${URL}?docType=VIN-PLATE`);
    await expect(page.locator(".ud20-loading")).toBeVisible();
  });

  test("[5] Select-未选择时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_LIST }),
      });
    });
    await page.goto(`${URL}?docType=VIN-PLATE`);
    await page.locator(".ud20-btn-select").click();
    await expect(page.locator(".ud20-error")).toContainText("No data found");
  });

  test("[8] Back-返回前页面", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_LIST }),
      });
    });
    await page.goto(`${URL}?docType=VIN-PLATE`);
    await page.locator(".ud20-btn-back").click();
    await expect(page).toHaveURL(/UD20-1/);
  });

  test("[9] Print-打开打印对话框", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_LIST }),
      });
    });
    await page.goto(`${URL}?docType=VIN-PLATE`);
    await page.locator(".ud20-btn-print").click();
  });

  test("[13] 异常处理-数据库连接失败", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.goto(`${URL}?docType=VIN-PLATE`);
    await expect(page.locator(".ud20-error")).toBeVisible({ timeout: 10000 });
  });
});
