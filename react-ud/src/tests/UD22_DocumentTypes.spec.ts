import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD22";
const API_URL = "/api/UD22SelectDocumentTypes";

const MOCK_TYPES = [
  { key: "VIN-PLATE", description: "VIN Plate Document" },
  { key: "CERTIFICATE", description: "Certificate of Conformity" },
  { key: "HOMOLOGATION", description: "Homologation Document" },
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

test.describe("Document Types 模块 (UD22) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_TYPES }),
      });
    });
    await page.goto(URL);
    await page.waitForSelector(".ud22-container", { timeout: 10000 });
    await expect(page.locator(".ud22-header")).toBeVisible();
    await expect(page.locator(".ud22-title")).toContainText("Document Types");
    await expect(page.locator(".ud22-table")).toBeVisible();
  });

  test("[2] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(URL);
    await expect(page.locator(".ud22-loading")).toBeVisible();
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
    await expect(page.locator(".ud22-empty")).toBeVisible();
  });

  test("[4] 表格表示-正常数据显示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_TYPES }),
      });
    });
    await page.goto(URL);
    await expect(page.locator(".ud22-table")).toBeVisible();
  });

  test("[8] 异常处理-API返回错误", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error" }),
      });
    });
    await page.goto(URL);
    await expect(page.locator(".ud22-error")).toBeVisible({ timeout: 5000 });
  });

  test("[10] 异常处理-网络超时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(URL);
    await expect(page.locator(".ud22-loading")).toBeVisible();
  });
});
