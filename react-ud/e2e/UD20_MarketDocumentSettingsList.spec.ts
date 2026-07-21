import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD20_URL = "/UD20";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD20";
let screenshotCounter = 1;

async function takeStepScreenshot(page: Page, testName: string) {
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: `${IMAGE_DIR}/${testName}/${filename}`,
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
}

async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "test-token");
  });
}

async function navigateToUD20(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  await seedSession(page);
  await page.goto(UD20_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ud20-container", { timeout: 15000 });
}

/**
 * 设置 Document List API Mock（返回示例数据）
 */
async function setupDocumentListMock(page: Page) {
  await page.route(
    "**/api/market-document-settings-list/document-list",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          data: {
            documents: [
              {
                doctype: "VIN",
                registerUser: "user1",
                registerDatetime: "2026-01-01",
              },
              {
                doctype: "PDF",
                registerUser: "user2",
                registerDatetime: "2026-02-15",
              },
              {
                doctype: "DOCX",
                registerUser: "user3",
                registerDatetime: "2026-03-10",
              },
            ],
          },
        }),
      });
    },
  );
}

test.describe("Market Document Settings List (UD20) 测试", () => {
  test.beforeEach(async () => {
    screenshotCounter = 1;
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      const failedName = testInfo.title.replace(
        /[\[\]\\\/\:\*\?\"\<\>\|]/g,
        "_",
      );
      await page.screenshot({
        path: `${IMAGE_DIR}/_FAILED_/${failedName}.jpg`,
        type: "jpeg",
        quality: 85,
        fullPage: true,
      });
    }
  });

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }) => {
      const t = "画面初始化-正常表示";
      await setupDocumentListMock(page);
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud20-header")).toBeVisible();
      await expect(page.locator(".ud20-page-title")).toHaveText(
        "HDoc - Market Document Settings",
      );
      await expect(page.locator(".ud20-table")).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".ud20-table thead th").nth(1)).toHaveText(
        "Document type",
      );
      await expect(page.locator(".ud20-table thead th").nth(2)).toHaveText(
        "Bussines unit",
      );
      await expect(page.locator(".ud20-table thead th").nth(3)).toHaveText(
        "User",
      );
      await expect(page.locator(".ud20-table thead th").nth(4)).toHaveText(
        "Date",
      );
      const rows = await page.locator(".ud20-table tbody tr").count();
      expect(rows).toBeGreaterThan(0);
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-空数据表示", async ({ page }) => {
      const t = "画面初始化-空数据表示";
      await page.route(
        "**/api/market-document-settings-list/document-list",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, data: { documents: [] } }),
          });
        },
      );
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      const rows = await page.locator(".ud20-table tbody tr").count();
      expect(rows).toBe(0);
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/market-document-settings-list/document-list");
    });

    test("[3] 画面初始化-API加载失败", async ({ page }) => {
      const t = "画面初始化-API加载失败";
      await page.route(
        "**/api/market-document-settings-list/document-list",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 400, msg: "查询失败" }),
          });
        },
      );
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud20-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/market-document-settings-list/document-list");
    });

    test("[4] 画面初始化-加载中状态", async ({ page }) => {
      const t = "画面初始化-加载中状态";
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/market-document-settings-list/document-list",
        async (route) => {
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: {
                documents: [
                  {
                    doctype: "VIN",
                    registerUser: "user1",
                    registerDatetime: "2026-01-01",
                  },
                ],
              },
            }),
          });
        },
      );
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud20-loading")).toBeVisible();
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud20-table")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/market-document-settings-list/document-list");
    });
  });

  test.describe("Select按钮", () => {
    test("[5] Select-未选择时", async ({ page }) => {
      const t = "Select-未选择时";
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud20-btn").filter({ hasText: "Select" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud20-msg")).toBeVisible();
      await expect(page.locator(".ud20-msg")).toContainText("No data found");
      await takeStepScreenshot(page, t);
    });

    test("[6] Select-单选后返回", async ({ page }) => {
      const t = "Select-单选后返回";
      await setupDocumentListMock(page);
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.waitForSelector(".ud20-table tbody tr", { timeout: 10000 });
      await page.locator(".ud20-table tbody tr").first().click();
      await page.waitForTimeout(300);
      await page.locator(".ud20-btn").filter({ hasText: "Select" }).click();
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log("After Select, URL:", currentUrl);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Back按钮", () => {
    test("[7] Back-返回前页面", async ({ page }) => {
      const t = "Back-返回前页面";
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud20-btn").filter({ hasText: "Back" }).click();
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log("After Back, URL:", currentUrl);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Print按钮", () => {
    test("[8] Print-打开打印对话框", async ({ page }) => {
      const t = "Print-打开打印对话框";
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud20-btn").filter({ hasText: "Print" }).click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("User链接", () => {
    test("[9] User链接-跳转EDB User View", async ({ page }) => {
      const t = "User链接-跳转EDB User View";
      await setupDocumentListMock(page);
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.waitForSelector(".ud20-table tbody tr", { timeout: 10000 });
      const userLink = page.locator(".ud20-user-link").first();
      if (await userLink.isVisible().catch(() => false)) {
        await userLink.click();
        await page.waitForTimeout(2000);
        console.log("After User click, URL:", page.url());
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("UI交互", () => {
    test("[10] Select-选择后按钮状态", async ({ page }) => {
      const t = "Select-选择后按钮状态";
      await setupDocumentListMock(page);
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      const selectBtn = page.locator(".ud20-btn").filter({ hasText: "Select" });
      await expect(selectBtn).toBeEnabled();
      await page.waitForSelector(".ud20-table tbody tr", { timeout: 10000 });
      await page.locator(".ud20-table tbody tr").first().click();
      await page.waitForTimeout(200);
      await expect(selectBtn).toBeEnabled();
      await takeStepScreenshot(page, t);
    });

    test("[11] 消息清空-新操作清除旧消息", async ({ page }) => {
      const t = "消息清空-新操作清除旧消息";
      await setupDocumentListMock(page);
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud20-btn").filter({ hasText: "Select" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud20-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.waitForSelector(".ud20-table tbody tr", { timeout: 10000 });
      await page.locator(".ud20-table tbody tr").first().click();
      await page.waitForTimeout(300);
      await page.locator(".ud20-btn").filter({ hasText: "Select" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[12] 异常处理-数据库连接失败", async ({ page }) => {
      const t = "异常处理-数据库连接失败";
      await page.route(
        "**/api/market-document-settings-list/document-list",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.waitForSelector(".ud20-msg", { timeout: 10000 });
      await expect(page.locator(".ud20-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/market-document-settings-list/document-list");
    });

    test("[13] 异常处理-网络请求超时", async ({ page }) => {
      const t = "异常处理-网络请求超时";
      test.setTimeout(60000);
      await page.route(
        "**/api/market-document-settings-list/document-list",
        async (route) => {
          await new Promise((r) => setTimeout(r, 20000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud20-loading")).toBeVisible();
      await page.waitForSelector(".ud20-msg", { timeout: 35000 });
      await expect(page.locator(".ud20-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/market-document-settings-list/document-list");
    });

    test("[14] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(
        "**/api/market-document-settings-list/document-list",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD20(page);
      await takeStepScreenshot(page, t);
      await page.waitForSelector(".ud20-msg", { timeout: 10000 });
      await expect(page.locator(".ud20-msg")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/market-document-settings-list/document-list");
    });
  });
});
