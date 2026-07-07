import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD04";
const API_URL = "/api/UD04SelectGeneratedocument";

const MOCK_VIN_DATA = {
  chassisNo: "JPCT013945",
  ordernumber: "ORD12345",
  buildWeek: "2026-W27",
  specWeek: "2026-W26",
  market: "JPN",
  masterMarket: "JP",
  snotes: ["S-Note 1", "S-Note 2"],
  snotemessage: "The S-Notes above can affect homologation documents.",
  frontLoadIndex: "95",
  frontSpeedIndex: "H",
  driveLoadIndex: "100",
  driveSpeedIndex: "V",
  adChangeEnabled: true,
  adChangeMessage: "AD Change available",
  templateName: "VIN-PLATE_TEMPLATE",
  replacedParams: ["$PARAM1$", "$PARAM2$"],
  generatedFileUrl: "/downloads/VIN_Plate_JPCT013945.rtf",
  date: "2026-07-01",
  hdocVersion: "4.2.1",
};

async function mockApiSuccess(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 200, msg: "success", data: MOCK_VIN_DATA }),
    });
  });
}

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Generate Document 模块 (UD04) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await mockApiSuccess(page);
    await page.goto(
      `${URL}?chassisSeries=JPCT&chassisNo=013945&documentType=VIN-PLATE`,
    );
    await page.waitForSelector(".ud04-header", { timeout: 10000 });
    await expect(page.locator(".ud04-header")).toBeVisible();
    await expect(page.locator(".ud04-header-logo")).toContainText("VOLVO");
    await expect(page.locator(".ud04-title")).toContainText(
      "Generate document",
    );
  });

  test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
    await page.goto(URL);
    await expect(page.locator(".ud04-error")).toContainText("无法加载数据");
  });

  test("[3] 基本信息显示", async ({ page }: { page: Page }) => {
    await mockApiSuccess(page);
    await page.goto(
      `${URL}?chassisSeries=JPCT&chassisNo=013945&documentType=VIN-PLATE`,
    );
    await expect(page.locator(".ud04-info-section")).toBeVisible();
  });

  test("[4] S-Notes显示", async ({ page }: { page: Page }) => {
    await mockApiSuccess(page);
    await page.goto(
      `${URL}?chassisSeries=JPCT&chassisNo=013945&documentType=VIN-PLATE`,
    );
    await expect(page.locator(".ud04-snotes-section")).toBeVisible();
  });

  test("[8] AD Change-无效时显示", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "success",
          data: { ...MOCK_VIN_DATA, adChangeEnabled: false },
        }),
      });
    });
    await page.goto(
      `${URL}?chassisSeries=JPCT&chassisNo=013945&documentType=VIN-PLATE`,
    );
    await expect(page.locator(".ud04-adchange-section")).toHaveCount(0);
  });

  test("[14] 异常处理-网络错误", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.goto(
      `${URL}?chassisSeries=JPCT&chassisNo=013945&documentType=VIN-PLATE`,
    );
    await expect(page.locator(".ud04-error")).toBeVisible({ timeout: 10000 });
  });

  test("[15] 异常处理-服务器错误", async ({ page }: { page: Page }) => {
    await page.route(API_URL, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error" }),
      });
    });
    await page.goto(
      `${URL}?chassisSeries=JPCT&chassisNo=013945&documentType=VIN-PLATE`,
    );
    await expect(page.locator(".ud04-error")).toBeVisible({ timeout: 10000 });
  });
});
