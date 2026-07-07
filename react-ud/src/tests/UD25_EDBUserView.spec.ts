import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD25";
const API_URL = "/api/AuthenticationApi/login";

const MOCK_USER_DATA = {
  userid: "v0c6900",
  responsible: "Engineering",
  userPosition: "Engineer",
  email: "john.doe@volvo.com",
};

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("EDB User View 模块 (UD25) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: MOCK_USER_DATA,
        }),
      });
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await page.waitForSelector(".ud25-container", { timeout: 10000 });
    await expect(page.locator(".ud25-header")).toBeVisible();
    await expect(page.locator(".ud25-title")).toContainText("EDB User View");
  });

  test("[2] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await expect(page.locator(".ud25-loading")).toBeVisible();
  });

  test("[4] 用户信息-正常显示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: MOCK_USER_DATA,
        }),
      });
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await expect(page.locator(".ud25-userid")).toBeVisible();
    await expect(page.locator(".ud25-responsible")).toBeVisible();
    await expect(page.locator(".ud25-email")).toBeVisible();
  });

  test("[5] 用户信息-用户不存在(404)", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found" }),
      });
    });
    await page.goto(`${URL}?userid=INVALID`);
    await expect(page.locator(".ud25-error")).toContainText("用户不存在", {
      timeout: 10000,
    });
  });

  test("[6] Clear-清空", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: MOCK_USER_DATA,
        }),
      });
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await page.locator(".ud25-btn-clear").click();
  });

  test("[8] Back-返回", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: MOCK_USER_DATA,
        }),
      });
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await page.locator(".ud25-btn-back").click();
  });

  test("[9] 异常处理-网络超时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await expect(page.locator(".ud25-loading")).toBeVisible();
  });

  test("[11] 异常处理-服务器500错误", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error" }),
      });
    });
    await page.goto(`${URL}?userid=v0c6900`);
    await expect(page.locator(".ud25-error")).toBeVisible({ timeout: 10000 });
  });
});
