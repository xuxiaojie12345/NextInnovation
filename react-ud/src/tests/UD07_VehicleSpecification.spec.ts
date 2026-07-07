import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD07";
const API_URL = "/api/UD07VehicleSpecificationApi/Select";

const MOCK_DATA = {
  chassisNo: "JPCT013945",
  model: "VOLVO FH",
  builtWeek: "2026-W27",
  productType: "TRUCK",
  vin: "YV2XXX...",
  engineNo: "D13K500",
  countryOfOperation: "JAPAN",
  symbols: [
    { symbol: "SYM1", description: "Symbol 1 description" },
    { symbol: "SYM2", description: "Symbol 2 description" },
  ],
  sNotes: ["S-Note content 1", "S-Note content 2"],
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

test.describe("Vehicle Specification 模块 (UD07) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_DATA }),
      });
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await page.waitForSelector(".ud07-header", { timeout: 10000 });
    await expect(page.locator(".ud07-header")).toBeVisible();
    await expect(page.locator(".ud07-title")).toContainText(
      "Vehicle Specification",
    );
    await expect(page.locator(".ud07-info-section")).toBeVisible();
  });

  test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await expect(page.locator(".ud07-error")).toContainText("无法加载数据");
  });

  test("[3] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await expect(page.locator(".ud07-loading")).toBeVisible();
  });

  test("[4] 基本信息显示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_DATA }),
      });
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await expect(page.locator(".ud07-info-section")).toBeVisible();
    await expect(page.locator(".ud07-info-value").first()).toBeVisible();
  });

  test("[5] Symbols显示及Tooltip", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_DATA }),
      });
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await expect(page.locator(".ud07-symbols-block")).toBeVisible();
  });

  test("[6] S-Notes显示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success", data: MOCK_DATA }),
      });
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await expect(page.locator(".ud07-snotes-section")).toBeVisible();
  });

  test("[8] 异常处理-底盘不存在(404)", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found" }),
      });
    });
    await page.goto(`${URL}?chassisNo=INVALID`);
    await expect(page.locator(".ud07-error")).toBeVisible({ timeout: 10000 });
  });

  test("[9] 异常处理-服务器500错误", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error" }),
      });
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await expect(page.locator(".ud07-error")).toBeVisible({ timeout: 10000 });
  });

  test("[10] 异常处理-网络超时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_URL, async () => {
      await new Promise(() => {});
    });
    await page.goto(`${URL}?chassisNo=JPCT013945`);
    await expect(page.locator(".ud07-loading")).toBeVisible();
  });
});
