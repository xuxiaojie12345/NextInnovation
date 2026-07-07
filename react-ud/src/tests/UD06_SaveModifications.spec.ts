import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD06";
const API_URL = "/api/UD06SelectHdocAdcaModification";

const MOCK_STATUS = {
  doctype: "VIN-PLATE",
  version: "1.0",
  storing: "STORED",
  foundUnreleasedVersion: 1,
  message: "VERSION IS RELEASED",
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

test.describe("Save Modifications 模块 (UD06) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_STATUS }),
      });
    });
    await page.goto(`${URL}?chassisSerie=JPCT&chassisNumber=013945`);
    await page.waitForSelector(".ud06-header", { timeout: 10000 });
    await expect(page.locator(".ud06-header")).toBeVisible();
    await expect(page.locator(".ud06-title")).toContainText(
      "Save Modifications",
    );
  });

  test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await expect(page.locator(".ud06-error")).toContainText("无法加载修改状态");
  });

  test("[4] 消息显示-已发布", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { ...MOCK_STATUS, message: "VERSION IS RELEASED" },
        }),
      });
    });
    await page.goto(`${URL}?chassisSerie=JPCT&chassisNumber=013945`);
    await expect(page.locator(".ud06-message-success")).toContainText(
      "VERSION IS RELEASED",
    );
  });

  test("[6] Close-返回UD05", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_STATUS }),
      });
    });
    await page.goto(`${URL}?chassisSerie=JPCT&chassisNumber=013945`);
    await page.locator(".ud06-btn-close").click();
    await expect(page).toHaveURL(/UD05/);
  });

  test("[8] 异常处理-网络错误", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.goto(`${URL}?chassisSerie=JPCT&chassisNumber=013945`);
    await expect(page.locator(".ud06-error")).toBeVisible({ timeout: 10000 });
  });
});
