import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD18";
const API_DOC_LIST = "/api/ud20selecthdocdocumentlist";
const API_USER_INFO = "/api/ud18userinfo";
const API_UPDATE = "/api/updateuserdoc";

const MOCK_DOCS = [
  { docType: "VIN-PLATE", description: "VIN Plate Document" },
  { docType: "CERTIFICATE", description: "Certificate Document" },
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

test.describe("HDoc User Doc Administration 模块 (UD18) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_DOC_LIST, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_DOCS }),
      });
    });
    await page.goto(URL);
    await page.waitForSelector(".ud18-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud18-header")).toBeVisible();
    await expect(page.locator(".ud18-title")).toContainText(
      "HDoc Document Authorization",
    );
    await expect(page.locator("#ud18-userid")).toBeVisible();
  });

  test("[3] User Info-UserID为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud18-btn-user-info").click();
    await expect(page.locator(".ud18-error")).toContainText("请输入用户ID");
  });

  test("[6] 文档列表-正常加载", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud18-doc-list")).toBeVisible();
  });

  test("[8] User Info-用户存在", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { userName: "John Doe", docs: ["VIN-PLATE"] },
        }),
      });
    });
    await page.locator("#ud18-userid").fill("v0c6900");
    await page.locator(".ud18-btn-user-info").click();
    await expect(page.locator(".ud18-user-name")).toBeVisible({
      timeout: 5000,
    });
  });

  test("[9] User Info-用户不存在(404)", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found" }),
      });
    });
    await page.locator("#ud18-userid").fill("XXXX");
    await page.locator(".ud18-btn-user-info").click();
    await expect(page.locator(".ud18-error")).toContainText(
      "We didn't recognize",
      { timeout: 5000 },
    );
  });

  test("[12] Update-正常更新", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { userName: "John Doe", docs: [] },
        }),
      });
    });
    await page.route(API_UPDATE, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud18-userid").fill("v0c6900");
    await page.locator(".ud18-btn-user-info").click();
    await page.waitForTimeout(500);
    await page.locator(".ud18-btn-update").click();
    await expect(page.locator(".ud18-success")).toBeVisible({ timeout: 5000 });
  });

  test("[20] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_USER_INFO, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud18-userid").fill("v0c6900");
    await page.locator(".ud18-btn-user-info").click();
    await expect(page.locator(".ud18-error")).toBeVisible({ timeout: 10000 });
  });
});
