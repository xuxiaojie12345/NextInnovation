import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD05";
const API_LOAD = "/api/UD05SelectVariableModification";
const API_SAVE = "/api/UD05UpdateVariableModification";

const MOCK_MODS = {
  chassisNo: "JPCT_013945",
  market: "JPN",
  templateFile: "template.odt",
  modifications: [
    {
      variable: "$VAR1$",
      description: "Description 1",
      currentValue: "A",
      modifiedValue: "",
    },
    {
      variable: "$VAR2$",
      description: "Description 2",
      currentValue: "",
      modifiedValue: "",
    },
  ],
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

async function mockLoadSuccess(page: Page) {
  await page.route(API_LOAD, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 200, msg: "success", data: MOCK_MODS }),
    });
  });
}

test.describe("Modify Document 模块 (UD05) 测试", () => {
  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await mockLoadSuccess(page);
    await page.goto(`${URL}?chassisNo=JPCT_013945`);
    await page.waitForSelector(".ud05-header", { timeout: 10000 });
    await expect(page.locator(".ud05-header")).toBeVisible();
    await expect(page.locator(".ud05-title")).toContainText("Modify Document");
  });

  test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await expect(page.locator(".ud05-error")).toContainText("无法加载数据");
  });

  test("[3] 修改列表表示", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await mockLoadSuccess(page);
    await page.goto(`${URL}?chassisNo=JPCT_013945`);
    await expect(page.locator(".ud05-table")).toBeVisible();
  });

  test("[7] Save-无变更时", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await mockLoadSuccess(page);
    await page.goto(`${URL}?chassisNo=JPCT_013945`);
    await page.locator(".ud05-btn-save").click();
    await expect(page.locator(".ud05-error")).toContainText(
      "NO UNRELEASED VERSION EXISTS!",
    );
  });

  test("[11] 异常处理-网络错误", async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.route(API_LOAD, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.goto(`${URL}?chassisNo=JPCT_013945`);
    await expect(page.locator(".ud05-error")).toBeVisible({ timeout: 10000 });
  });
});
