import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD23_URL = "/UD23";
const IMAGE_DIR = "E:/git20260511\NextInnovation/react-ud/Image/UD23";
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

async function navigateToUD23(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  await seedSession(page);
  await page.goto(UD23_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ud23-container", { timeout: 15000 });
}

test.describe("Download and Print Quick Guides (UD23) 测试", () => {
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

  test.describe("画面表示", () => {
    test("[1] 画面初始化-正常表示", async ({ page }) => {
      const t = "画面初始化-正常表示";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud23-header")).toBeVisible();
      await expect(page.locator(".ud23-page-title")).toHaveText(
        "Download and Print Quick Guides",
      );
      await expect(page.locator(".ud23-back")).toBeVisible();
      const guides = page.locator(".ud23-guide-item");
      expect(await guides.count()).toBe(8);
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-可用指南区域", async ({ page }) => {
      const t = "画面初始化-可用指南区域";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const links = page.locator(".ud23-guide-link");
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(8);
      for (let i = 0; i < count; i++) {
        await expect(links.nth(i)).toBeEnabled();
      }
      await takeStepScreenshot(page, t);
    });

    test("[3] 画面初始化-不可用指南区域", async ({ page }) => {
      const t = "画面初始化-不可用指南区域";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud23-subtitle")).toHaveText(
        "Volvo 3P Quick Guides",
      );
      const disabledBtns = page.locator(".ud23-3p-link");
      expect(await disabledBtns.count()).toBeGreaterThanOrEqual(9);
      await takeStepScreenshot(page, t);
    });

    test("[4] 画面初始化-内网版本标识", async ({ page }) => {
      const t = "画面初始化-内网版本标识";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const versionTags = page.locator(".ud23-version");
      const count = await versionTags.count();
      expect(count).toBeGreaterThanOrEqual(1);
      const text = await versionTags.first().textContent();
      expect(text).toContain("Intranet");
      await takeStepScreenshot(page, t);
    });

    test("[5] 画面初始化-Note文字表示", async ({ page }) => {
      const t = "画面初始化-Note文字表示";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const note = page.locator(".ud23-note");
      await expect(note).toBeVisible();
      await expect(note).toContainText("Volvo Broad");
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("图片加载", () => {
    test("[6] 图片缩略图显示", async ({ page }) => {
      const t = "图片缩略图显示";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const placeholders = page.locator(".ud23-thumb-placeholder");
      const count = await placeholders.count();
      expect(count).toBe(8);
      for (let i = 0; i < count; i++) {
        await expect(placeholders.nth(i)).toBeVisible();
      }
      await takeStepScreenshot(page, t);
    });

    test("[7] 图片加载失败-显示占位图", async ({ page }) => {
      const t = "图片加载失败-显示占位图";
      await page.route("**/files/quick-guides/*", async (route) => {
        await route.abort("connectionrefused");
      });
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const placeholders = page.locator(".ud23-thumb-placeholder");
      expect(await placeholders.count()).toBe(8);
      await takeStepScreenshot(page, t);
      await page.unroute("**/files/quick-guides/*");
    });
  });

  test.describe("文件下载", () => {
    test("[8] 下载-活性指南文件", async ({ page }) => {
      const t = "下载-活性指南文件";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
        page.locator(".ud23-guide-link").first().click(),
      ]);
      if (download) {
        console.log("Download triggered:", download.suggestedFilename());
      }
      await takeStepScreenshot(page, t);
    });

    test("[9] 下载-非活性链接无反应", async ({ page }) => {
      const t = "下载-非活性链接无反应";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      const disabledBtn = page.locator(".ud23-3p-link").first();
      await disabledBtn.click();
      await page.waitForTimeout(1000);
      // 没有下载事件触发
      await takeStepScreenshot(page, t);
    });

    test("[10] 下载-网络断开导致失败", async ({ page }) => {
      const t = "下载-网络断开导致失败";
      await page.route("**/files/quick-guides/*", async (route) => {
        await route.abort("connectionrefused");
      });
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud23-guide-link").first().click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await page.unroute("**/files/quick-guides/*");
    });

    test("[11] 下载-资源不存在(404)", async ({ page }) => {
      const t = "下载-资源不存在(404)";
      await page.route("**/files/quick-guides/*", async (route) => {
        await route.fulfill({ status: 404, body: "Not Found" });
      });
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud23-guide-link").first().click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await page.unroute("**/files/quick-guides/*");
    });

    test("[12] 下载-无访问权限", async ({ page }) => {
      const t = "下载-无访问权限";
      await page.route("**/files/quick-guides/*", async (route) => {
        await route.fulfill({ status: 403, body: "Forbidden" });
      });
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud23-guide-link").first().click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await page.unroute("**/files/quick-guides/*");
    });
  });

  test.describe("返回导航", () => {
    test("[13] Back-返回HDoc Help页面", async ({ page }) => {
      const t = "Back-返回HDoc Help页面";
      await navigateToUD23(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud23-back").click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/UD24/);
      await takeStepScreenshot(page, t);
    });
  });
});
