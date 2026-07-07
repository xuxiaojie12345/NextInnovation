import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD08";
const API_ADD = "/api/UD08Add";
const API_UPDATE = "/api/UD08Update";
const API_DELETE = "/api/UD08Delete";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Homologation Variables 模块 (UD08) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud08-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-下拉列表", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud08-header")).toBeVisible();
  });

  test("[4] Add-Product class为空", async ({ page }: { page: Page }) => {
    await page.locator(".ud08-btn-add").click();
    await expect(page.locator(".ud08-error")).toContainText("Product class");
  });

  test("[7] Number-数字输入限制", async ({ page }: { page: Page }) => {
    const input = page.locator("#ud08-number");
    await input.fill("abc123");
    await expect(input).toHaveValue("123");
  });

  test("[8] Add-正常新增", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, msg: "success" }),
      });
    });
    await page.locator("#ud08-number").fill("123");
    await page.locator(".ud08-btn-add").click();
    await expect(page.locator(".ud08-success")).toContainText("添加成功");
  });

  test("[17] Clear-清空表单", async ({ page }: { page: Page }) => {
    await page.locator("#ud08-number").fill("123");
    await page.locator(".ud08-btn-clear").click();
    await expect(page.locator("#ud08-number")).toHaveValue("");
  });

  test("[20] 异常处理-网络断开", async ({ page }: { page: Page }) => {
    await page.route(API_ADD, async (route: Route) => {
      await route.abort("connectionrefused");
    });
    await page.locator("#ud08-number").fill("123");
    await page.locator(".ud08-btn-add").click();
    await expect(page.locator(".ud08-error")).toBeVisible({ timeout: 10000 });
  });
});
