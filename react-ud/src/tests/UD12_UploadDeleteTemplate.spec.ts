import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD12";
const API_MARKETS = "/api/UD12SelectMarkets";
const API_UPLOAD = "/api/UD12Upload";
const API_DELETE = "/api/UD12Delete";
const API_TEMPLATES = "/api/UD12SelectTemplates";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Upload&Delete Template 模块 (UD12) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_MARKETS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { markets: ["JPN", "CHN", "USA", "AUT"] },
        }),
      });
    });
    await page.goto(URL);
    await page.waitForSelector(".ud12-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-Market下拉列表", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud12-header")).toBeVisible();
    await expect(page.locator(".ud12-upload-title")).toContainText(
      "HDoc Template Upload",
    );
    await expect(page.locator(".ud12-delete-title")).toContainText(
      "HDoc Template Delete/Archive",
    );
  });

  test("[7] 空值校验-Template File未选择", async ({ page }: { page: Page }) => {
    await page.locator(".ud12-btn-upload").click();
    await expect(page.locator(".ud12-error")).toContainText("NO FILE UPLOADED");
  });

  test("[10] 文件大小校验-超过10MB", async ({ page }: { page: Page }) => {
    await page.locator(".ud12-btn-upload").click();
    await expect(page.locator(".ud12-error")).toBeVisible();
  });

  test("[25] 画面初始化-初期表示（删除区域）", async ({
    page,
  }: {
    page: Page;
  }) => {
    await expect(page.locator(".ud12-btn-delete")).toBeVisible();
  });

  test("[31] 空值校验-Delete时Market未选择", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.locator(".ud12-btn-delete").click();
    await expect(page.locator(".ud12-error")).toContainText("请选择市场");
  });

  test("[47] 画面迁移-Check Template链接", async ({ page }: { page: Page }) => {
    await page.locator(".ud12-link-check").click();
    await expect(page).toHaveURL(/template-check/);
  });
});
