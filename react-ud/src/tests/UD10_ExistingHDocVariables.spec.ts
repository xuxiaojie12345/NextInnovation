import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD10";
const API_ADD = "/api/UD10Add";
const API_UPDATE = "/api/UD10Update";
const API_DELETE = "/api/UD10Delete";
const API_EXCEL = "/api/UD10Excel";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Existing HDoc Variables 模块 (UD10) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud10-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud10-header")).toBeVisible();
    await expect(page.locator(".ud10-title")).toContainText(
      "Existing HDoc Variables",
    );
  });

  test("[3] Add-Variable为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud10-btn-add").click();
    await expect(page.locator(".ud10-error")).toContainText("Variable");
  });

  test("[6] Add-正常新增", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud10-variable").fill("$NEW_VAR$");
    await page.locator(".ud10-btn-add").click();
    await expect(page.locator(".ud10-success")).toBeVisible({ timeout: 5000 });
  });

  test("[14] Clear-清空表单", async ({ page }: { page: Page }) => {
    await page.locator("#ud10-variable").fill("$VAR$");
    await page.locator(".ud10-btn-clear").click();
    await expect(page.locator("#ud10-variable")).toHaveValue("");
  });

  test("[15] Back-返回UD02", async ({ page }: { page: Page }) => {
    await page.locator(".ud10-btn-back").click();
    await expect(page).toHaveURL(/UD02/);
  });

  test("[18] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud10-variable").fill("$VAR$");
    await page.locator(".ud10-btn-add").click();
    await expect(page.locator(".ud10-error")).toBeVisible({ timeout: 10000 });
  });
});
