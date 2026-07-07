import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD24";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("User Guide 模块 (UD24) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud24-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud24-header")).toBeVisible();
    await expect(page.locator(".ud24-title")).toContainText("HDoc Help");
  });

  test("[3] HDoc Quick Guide 链接", async ({ page }: { page: Page }) => {
    await page
      .locator(".ud24-link")
      .filter({ hasText: "HDoc Quick Guide" })
      .click();
    await expect(page).toHaveURL(/UD23/);
  });

  test("[4] List of document types. 链接", async ({ page }: { page: Page }) => {
    await page
      .locator(".ud24-link")
      .filter({ hasText: "List of document types" })
      .click();
    await expect(page).toHaveURL(/UD22/);
  });

  test("[5] Markets in Hdoc 链接", async ({ page }: { page: Page }) => {
    await page
      .locator(".ud24-link")
      .filter({ hasText: "Markets in Hdoc" })
      .click();
    await expect(page).toHaveURL(/UD21/);
  });

  test("[6] Market Document Setting 链接", async ({ page }: { page: Page }) => {
    await page
      .locator(".ud24-link")
      .filter({ hasText: "Market Document Setting" })
      .click();
    await expect(page).toHaveURL(/UD20-1/);
  });

  test("[7] 会话验证-未登录", async ({ page }: { page: Page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto(URL);
    await page.waitForURL("**/UD01", { timeout: 10000 });
    await expect(page).toHaveURL(/UD01/);
  });
});
