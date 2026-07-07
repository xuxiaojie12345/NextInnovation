import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD16";
const API_ADD = "/api/ud16inserthdocadcachange";
const API_DELETE = "/api/ud16updatehdocadcachange";
const API_CHECK = "/api/ud16selecthdocadcachange";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("AD Change 模块 (UD16) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud16-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud16-header")).toBeVisible();
    await expect(page.locator("#ud16-serie-chnr")).toBeVisible();
    await expect(page.locator("#ud16-desc")).toBeVisible();
  });

  test("[3] 空值校验-Serie-Chnr为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud16-btn-add").click();
    await expect(page.locator(".ud16-error")).toContainText("Serie-Chnr");
  });

  test("[6] ADD-正常新增", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud16-serie-chnr").fill("JPCT013945");
    await page.locator("#ud16-desc").fill("test description");
    await page.locator(".ud16-btn-add").click();
    await expect(page.locator(".ud16-success")).toBeVisible({ timeout: 5000 });
  });

  test("[11] DELETE-确认取消", async ({ page }: { page: Page }) => {
    await page.locator("#ud16-serie-chnr").fill("JPCT013945");
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.locator(".ud16-btn-delete").click();
  });

  test("[12] DELETE-正常删除", async ({ page }: { page: Page }) => {
    await page.route(API_DELETE, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud16-serie-chnr").fill("JPCT013945");
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator(".ud16-btn-delete").click();
    await expect(page.locator(".ud16-success")).toBeVisible({ timeout: 5000 });
  });

  test("[15] CHECK-激活状态", async ({ page }: { page: Page }) => {
    await page.route(API_CHECK, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          msg: "AFTER DEF CHANGE IS ACTIVATED",
        }),
      });
    });
    await page.locator("#ud16-serie-chnr").fill("JPCT013945");
    await page.locator(".ud16-btn-check").click();
    await expect(page.locator(".ud16-success")).toContainText("ACTIVATED", {
      timeout: 5000,
    });
  });

  test("[18] 操作中按钮禁用", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async () => {
      await new Promise(() => {});
    });
    await page.locator("#ud16-serie-chnr").fill("JPCT013945");
    await page.locator(".ud16-btn-add").click();
    await expect(page.locator(".ud16-btn-add")).toBeDisabled();
    await expect(page.locator("#ud16-serie-chnr")).toBeDisabled();
  });

  test("[22] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud16-serie-chnr").fill("JPCT013945");
    await page.locator(".ud16-btn-add").click();
    await expect(page.locator(".ud16-error")).toBeVisible({ timeout: 10000 });
  });
});
