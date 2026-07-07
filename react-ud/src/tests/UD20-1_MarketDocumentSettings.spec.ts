import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD20-1";
const API_UPDATE = "/api/ud20Marketdocumentsettingsapi/update";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Market Document Settings 模块 (UD20-1) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud20-1-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud20-1-header")).toBeVisible();
    await expect(page.locator(".ud20-1-title")).toContainText(
      "Market Document Settings",
    );
    await expect(page.locator("#ud20-1-doc-type")).toBeVisible();
  });

  test("[3] Search-携带参数跳转UD20", async ({ page }: { page: Page }) => {
    await page.locator("#ud20-1-doc-type").fill("VIN-PLATE");
    await page.locator(".ud20-1-btn-search").click();
    await expect(page).toHaveURL(/UD20/);
  });

  test("[5] Clear-清空所有输入", async ({ page }: { page: Page }) => {
    await page.locator("#ud20-1-doc-type").fill("VIN-PLATE");
    await page.locator(".ud20-1-btn-clear").click();
    await expect(page.locator("#ud20-1-doc-type")).toHaveValue("");
  });

  test("[6] Back-返回来源页面", async ({ page }: { page: Page }) => {
    await page.locator(".ud20-1-btn-back").click();
    await expect(page).toHaveURL(/UD02/);
  });

  test("[7] Update Mode-Document type为空", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.locator(".ud20-1-btn-update-mode").click();
    await expect(page.locator(".ud20-1-error")).toContainText("No data found");
  });

  test("[8] Update Mode-正常更新", async ({ page }: { page: Page }) => {
    await page.route(API_UPDATE, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud20-1-doc-type").fill("VIN-PLATE");
    await page.locator(".ud20-1-btn-update-mode").click();
    await expect(page.locator(".ud20-1-success")).toBeVisible({
      timeout: 5000,
    });
  });

  test("[15] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_UPDATE, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud20-1-doc-type").fill("VIN-PLATE");
    await page.locator(".ud20-1-btn-update-mode").click();
    await expect(page.locator(".ud20-1-error")).toBeVisible({ timeout: 10000 });
  });
});
