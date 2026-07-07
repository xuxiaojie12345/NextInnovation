import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD03";
const LOGIN_URL = "/UD01";
const API_DOC_TYPES = "/api/UD03SelectHdocdocumentlistApi";

async function mockDocTypes(page: Page) {
  await page.route(API_DOC_TYPES, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: [{ doctype: "VIN-PLATE" }, { doctype: "CERTIFICATE" }],
      }),
    });
  });
}

async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Generate Homologation Document 模块 (UD03) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await mockDocTypes(page);
    // 先导航到登录页（无重定向），设置 localStorage，再跳转
    await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
    await seedSession(page);
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#chassis-series", { timeout: 10000 });
  });

  test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud03-header")).toBeVisible();
    await expect(page.locator(".ud03-header-logo")).toContainText("VOLVO");
    await expect(page.locator(".ud03-page-title")).toContainText(
      "Generate Homologation Document",
    );
  });

  test("[2] 画面初始化-Document Type下拉", async ({ page }: { page: Page }) => {
    await expect(page.locator("#document-type")).toBeVisible();
    await expect(page.locator("#chassis-series")).toBeVisible();
    await expect(page.locator("#chassis-no")).toBeVisible();
  });

  test("[5] Chassis series-半角英数字のみ", async ({
    page,
  }: {
    page: Page;
  }) => {
    const input = page.locator("#chassis-series");
    await input.fill("abc!@#日本語");
    await expect(input).toHaveValue("abc");
  });

  test("[6] Chassis series-MaxLength(5)", async ({ page }: { page: Page }) => {
    const input = page.locator("#chassis-series");
    await input.fill("ABCDEF");
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(5);
  });

  test("[7] Chassis no-半角数字のみ", async ({ page }: { page: Page }) => {
    const input = page.locator("#chassis-no");
    await input.fill("abc123!@#");
    await expect(input).toHaveValue("123");
  });

  test("[8] Chassis no-MaxLength(10)", async ({ page }: { page: Page }) => {
    const input = page.locator("#chassis-no");
    await input.fill("12345678901");
    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(10);
  });

  test("[9] Submit-Chassis系列为空", async ({ page }: { page: Page }) => {
    await page.locator("#chassis-no").fill("028321");
    await page.locator(".ud03-btn-submit").click();
    await expect(page.locator(".ud03-error")).toContainText(
      "Chassis series and chassis no are required",
    );
  });

  test("[10] Submit-Chassis编号为空", async ({ page }: { page: Page }) => {
    await page.locator("#chassis-series").fill("JPCT");
    await page.locator(".ud03-btn-submit").click();
    await expect(page.locator(".ud03-error")).toContainText(
      "Chassis series and chassis no are required",
    );
  });

  test("[12] Submit-两者为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud03-btn-submit").click();
    await expect(page.locator(".ud03-error")).toContainText(
      "Chassis series and chassis no are required",
    );
  });

  test("[15] Reset-清空表单", async ({ page }: { page: Page }) => {
    await page.locator("#chassis-series").fill("JPCT");
    await page.locator("#chassis-no").fill("028321");
    await page.locator(".ud03-btn-reset").click();
    await expect(page.locator("#chassis-series")).toHaveValue("");
    await expect(page.locator("#chassis-no")).toHaveValue("");
  });

  test("[18] 例外处理-会话过期", async ({ page }: { page: Page }) => {
    await page.goto("about:blank");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(URL);
    await page.waitForURL("**/UD01", { timeout: 10000 });
    await expect(page).toHaveURL(/UD01/);
  });
});
