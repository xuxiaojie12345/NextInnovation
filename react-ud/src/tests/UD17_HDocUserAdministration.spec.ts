import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD17";
const API_USER_INFO = "/api/ud17userinfo";
const API_UPDATE_ROLE = "/api/ud17updaterole";
const API_DELETE_ROLE = "/api/ud17deleterole";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("HDoc User Administration 模块 (UD17) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud17-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud17-header")).toBeVisible();
    await expect(page.locator(".ud17-title")).toContainText("HDoc User Admin");
    await expect(page.locator("#ud17-userid")).toBeVisible();
  });

  test("[3] USER INFO-UserID为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud17-btn-user-info").click();
    await expect(page.locator(".ud17-error")).toContainText("请输入用户 ID");
  });

  test("[7] USER INFO-用户存在", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            userName: "John Doe",
            roles: ["Standard User", "Rule Admin"],
            market: "-EU",
          },
        }),
      });
    });
    await page.locator("#ud17-userid").fill("v0c6900");
    await page.locator(".ud17-btn-user-info").click();
    await expect(page.locator(".ud17-user-name")).toContainText("John Doe", {
      timeout: 5000,
    });
  });

  test("[8] USER INFO-用户不存在(404)", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found" }),
      });
    });
    await page.locator("#ud17-userid").fill("XXXX");
    await page.locator(".ud17-btn-user-info").click();
    await expect(page.locator(".ud17-error")).toContainText(
      "We didn't recognize",
      { timeout: 5000 },
    );
  });

  test("[11] Update Role-正常更新", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            userName: "John Doe",
            roles: ["Standard User"],
            market: "-EU",
          },
        }),
      });
    });
    await page.route(API_UPDATE_ROLE, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud17-userid").fill("v0c6900");
    await page.locator(".ud17-btn-user-info").click();
    await page.waitForTimeout(500);
    await page.locator(".ud17-btn-update-role").click();
    await expect(page.locator(".ud17-success")).toBeVisible({ timeout: 5000 });
  });

  test("[16] Delete Role-确认取消", async ({ page }: { page: Page }) => {
    await page.locator("#ud17-userid").fill("v0c6900");
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.locator(".ud17-btn-delete-role").click();
  });

  test("[23] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud17-userid").fill("v0c6900");
    await page.locator(".ud17-btn-user-info").click();
    await expect(page.locator(".ud17-error")).toBeVisible({ timeout: 10000 });
  });
});
