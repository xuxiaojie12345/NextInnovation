import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD15";
const API_VIEW_INFO = "/api/UD15ViewInfo";
const API_SET_REGENERATE = "/api/UD15SetRegenerate";
const API_SET_OK = "/api/UD15SetOK";
const API_CHANGE_BASIC = "/api/UD15ChangeBasic";
const API_CHANGE_ADVANCED = "/api/UD15ChangeAdvanced";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Vin Plate 模块 (UD15) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud15-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud15-header")).toBeVisible();
    await expect(page.locator(".ud15-title")).toContainText("Vin Plate");
    await expect(page.locator("#ud15-chassis")).toBeVisible();
  });

  test("[3] 空值校验-Chassis为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud15-btn-view-info").click();
    await expect(page.locator(".ud15-error")).toContainText(
      "Please enter a chassis number",
    );
  });

  test("[5] 空值校验-各按钮均触发空值检查", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.locator(".ud15-btn-set-regenerate").click();
    await expect(page.locator(".ud15-error")).toBeVisible();
    await page.locator(".ud15-btn-set-ok").click();
    await expect(page.locator(".ud15-error")).toBeVisible();
    await page.locator(".ud15-btn-change-basic").click();
    await expect(page.locator(".ud15-error")).toBeVisible();
    await page.locator(".ud15-btn-change-advanced").click();
    await expect(page.locator(".ud15-error")).toBeVisible();
  });

  test("[6] View Info-正常", async ({ page }: { page: Page }) => {
    await page.route(API_VIEW_INFO, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: {
            chassisNumber: "JPCT 013945",
            plateType: "TYPE_A",
            status: "Active",
          },
        }),
      });
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-view-info").click();
    await expect(page.locator(".ud15-info-section")).toBeVisible({
      timeout: 5000,
    });
  });

  test("[8] Set Regenerate-正常", async ({ page }: { page: Page }) => {
    await page.route(API_SET_REGENERATE, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-set-regenerate").click();
    await expect(page.locator(".ud15-success")).toBeVisible({ timeout: 5000 });
  });

  test("[10] Set OK-正常", async ({ page }: { page: Page }) => {
    await page.route(API_SET_OK, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-set-ok").click();
    await expect(page.locator(".ud15-success")).toBeVisible({ timeout: 5000 });
  });

  test("[12] Change to Basic-正常", async ({ page }: { page: Page }) => {
    await page.route(API_CHANGE_BASIC, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-change-basic").click();
    await expect(page.locator(".ud15-success")).toBeVisible({ timeout: 5000 });
  });

  test("[14] Change to Advanced-正常", async ({ page }: { page: Page }) => {
    await page.route(API_CHANGE_ADVANCED, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-change-advanced").click();
    await expect(page.locator(".ud15-success")).toBeVisible({ timeout: 5000 });
  });

  test("[16] 操作中按钮禁用", async ({ page }: { page: Page }) => {
    await page.route(API_VIEW_INFO, async () => {
      await new Promise(() => {});
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-view-info").click();
    await expect(page.locator(".ud15-btn-view-info")).toBeDisabled();
    await expect(page.locator("#ud15-chassis")).toBeDisabled();
  });

  test("[20] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_VIEW_INFO, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud15-chassis").fill("JPCT 013945");
    await page.locator(".ud15-btn-view-info").click();
    await expect(page.locator(".ud15-error")).toBeVisible({ timeout: 10000 });
  });
});
