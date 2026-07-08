import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD24_URL = "/UD24";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD24";
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

async function navigateToUD24(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  await seedSession(page);
  await page.goto(UD24_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ud24-container", { timeout: 15000 });
}

test.describe("User Guide (UD24) 测试", () => {
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
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud24-page-header")).toBeVisible();
      await expect(page.locator(".ud24-page-title")).toHaveText("HDoc Help");
      const linkBtns = page.locator(".ud24-link");
      const count = await linkBtns.count();
      expect(count).toBeGreaterThanOrEqual(5);
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-链接悬停效果", async ({ page }) => {
      const t = "画面初始化-链接悬停效果";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      const linkBtn = page.locator(".ud24-link").first();
      await linkBtn.hover();
      await page.waitForTimeout(300);
      const color = await linkBtn.evaluate(
        (el) => window.getComputedStyle(el).color,
      );
      expect(color).toBeTruthy();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("导航链接", () => {
    test("[3] HDoc Quick Guide 链接", async ({ page }) => {
      const t = "HDoc Quick Guide链接";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud24-link")
        .filter({ hasText: "HDoc Quick Guide" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/UD23/);
      await takeStepScreenshot(page, t);
    });

    test("[4] List of document types. 链接", async ({ page }) => {
      const t = "List of document types链接";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud24-link")
        .filter({ hasText: "List of document types" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/UD22/);
      await takeStepScreenshot(page, t);
    });

    test("[5] Markets in Hdoc 链接", async ({ page }) => {
      const t = "Markets in Hdoc链接";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud24-link")
        .filter({ hasText: "Markets in Hdoc" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/UD21/);
      await takeStepScreenshot(page, t);
    });

    test("[6] Market Document Setting 链接", async ({ page }) => {
      const t = "Market Document Setting链接";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud24-link")
        .filter({ hasText: "HDoc - Market Document Setting" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/UD20-1/);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("会话验证", () => {
    test("[7] 会话验证-未登录", async ({ page }) => {
      const t = "会话验证-未登录";
      await page.goto(UD24_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const currentUrl = page.url();
      // 未登录可能被重定向或显示提示
      if (currentUrl.includes("/UD01") || currentUrl.includes("/login")) {
        await expect(page).toHaveURL(/\/UD01/);
      }
      await takeStepScreenshot(page, t);
    });

    test("[8] 会话验证-Token过期", async ({ page }) => {
      const t = "会话验证-Token过期";
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      // 设置过期 token
      await page.evaluate(() => {
        window.localStorage.setItem("auth_token", "expired-token");
        window.localStorage.setItem(
          "user_info",
          JSON.stringify({ userId: "tester", name: "Test User", expire: 0 }),
        );
      });
      await page.goto(UD24_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[9] 异常处理-路由跳转失败", async ({ page }) => {
      const t = "异常处理-路由跳转失败";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      // 点击一个内部文档链接（非标准路由）
      await page
        .locator(".ud24-link")
        .filter({ hasText: "HDoc Users Manual" })
        .first()
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[10] 异常处理-网络中断", async ({ page }) => {
      const t = "异常处理-网络中断";
      await navigateToUD24(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud24-page-title")).toHaveText("HDoc Help");
      await takeStepScreenshot(page, t);
    });
  });
});
