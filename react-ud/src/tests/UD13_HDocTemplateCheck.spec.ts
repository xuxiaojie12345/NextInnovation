import { test, expect, Page, Route } from "@playwright/test";

const URL = "/UD13";

async function seedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

test.describe("HDoc Template Check 模块 (UD13) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedSession(page);
    await page.goto(URL);
    await page.waitForSelector(".ud13-container", { timeout: 10000 });
  });

  test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
    await expect(page.locator(".ud13-header")).toBeVisible();
    await expect(page.locator(".ud13-page-title")).toContainText(
      "HDoc Template Check",
    );
  });

  test("[2] 画面初始化-控件初期状态", async ({ page }: { page: Page }) => {
    await expect(page.locator("#ud13-file-input")).toBeVisible();
    await expect(page.locator(".ud13-btn-check")).toBeVisible();
    await expect(page.locator(".ud13-download-link")).toHaveCount(0);
    await expect(page.locator(".ud13-error")).toHaveCount(0);
  });

  test("[6] 空值校验-文件未选择", async ({ page }: { page: Page }) => {
    await page.locator(".ud13-btn-check").click();
    await expect(page.locator(".ud13-error")).toContainText(
      "ERROR: Unable to access file!",
    );
  });

  test("[10] 校验成功-含单个变量", async ({ page }: { page: Page }) => {
    // 选择文件后检查
    await page.locator("#ud13-file-input").setInputFiles({
      name: "template.rtf",
      mimeType: "text/rtf",
      buffer: Buffer.from("Content with $AXLE_CONF$ variable"),
    });
    await page.locator(".ud13-btn-check").click();
    await expect(page.locator(".ud13-success")).toBeVisible();
    await expect(page.locator(".ud13-download-link")).toBeVisible();
  });

  test("[15] 校验中按钮禁用", async ({ page }: { page: Page }) => {
    await page.locator("#ud13-file-input").setInputFiles({
      name: "template.rtf",
      mimeType: "text/rtf",
      buffer: Buffer.from("Content with $AXLE_CONF$ variable"),
    });
    await page.locator(".ud13-btn-check").click();
    await expect(page.locator(".ud13-btn-check")).toBeDisabled();
  });

  test("[20] 消息类型-Error样式", async ({ page }: { page: Page }) => {
    await page.locator(".ud13-btn-check").click();
    await expect(page.locator(".ud13-error")).toBeVisible();
  });
});
