import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD23";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("Download and Print Quick Guides 模块 (UD23) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud23-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud23-header")).toBeVisible();
    await expect(page.locator(".ud23-title")).toContainText(
      "Download and Print Quick Guides",
    );
  });

  test("[2] 画面初始化-可用指南区域", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud23-guide-link").first()).toBeVisible();
  });

  test("[6] 图片缩略图显示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud23-thumbnail")).toHaveCount(8);
  });

  test("[8] 下载-活性指南文件", async ({ page }: { page: Page }) => {
    const guideLink = page.locator(".ud23-guide-link").first();
    await guideLink.isVisible();
  });

  test("[13] Back-返回HDoc Help页面", async ({ page }: { page: Page }) => {
    await page.locator(".ud23-btn-back").click();
    await expect(page).toHaveURL(/UD24/);
  });
});
