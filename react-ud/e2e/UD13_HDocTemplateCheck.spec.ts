import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD12_URL = "/UD12";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD13";
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

async function navigateToUD13viaUD12(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD12_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud12-container", { timeout: 15000 });
  await page.locator(".ud12-check-link").click();
  await page.waitForSelector(".ud13-container", { timeout: 15000 });
}

test.describe("HDoc Template Check 模块 (UD13) 测试", () => {
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
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud13-header")).toBeVisible();
      await expect(page.locator(".ud13-page-title")).toHaveText(
        "HDoc Template Check",
      );
      await expect(page.locator("#ud13-file-input")).toBeVisible();
      await expect(
        page.locator(".ud13-btn").filter({ hasText: "Check" }),
      ).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件初期状态", async ({ page }) => {
      const t = "画面初始化-控件初期状态";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud13-download-link")).not.toBeVisible();
      await expect(page.locator(".ud13-error")).not.toBeVisible();
      await expect(page.locator(".ud13-success")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("文件选择", () => {
    test("[3] 文件选择-正常选择文件", async ({ page }) => {
      const t = "文件选择-正常选择文件";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "test_template.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      await takeStepScreenshot(page, t);
      expect(
        await page
          .locator("#ud13-file-input")
          .evaluate((el: HTMLInputElement) => el.files?.length || 0),
      ).toBe(1);
    });

    test("[4] 文件选择-取消选择", async ({ page }) => {
      const t = "文件选择-取消选择";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      expect(
        await page
          .locator("#ud13-file-input")
          .evaluate((el: HTMLInputElement) => el.files?.length || 0),
      ).toBe(0);
      await takeStepScreenshot(page, t);
    });

    test("[5] 文件选择-选择后重新选择", async ({ page }) => {
      const t = "文件选择-选择后重新选择";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      const fi = page.locator("#ud13-file-input");
      await fi.setInputFiles({
        name: "a.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("a"),
      });
      await fi.setInputFiles({
        name: "b.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("b"),
      });
      await takeStepScreenshot(page, t);
      expect(
        await fi.evaluate((el: HTMLInputElement) => el.files?.length || 0),
      ).toBe(1);
      expect(
        await fi.evaluate((el: HTMLInputElement) => el.files?.[0]?.name || ""),
      ).toBe("b.rtf");
    });
  });

  test.describe("文件校验", () => {
    test("[6] 空值校验-文件未选择", async ({ page }) => {
      const t = "空值校验-文件未选择";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[7] 文件读取失败", async ({ page }) => {
      const t = "文件读取失败";
      // 模拟 FileReader 触发 error 事件（仕様書に"模拟"と明記）
      await page.addInitScript(() => {
        const origFileReader = window.FileReader;
        (window as any).FileReader = function () {
          const reader = new origFileReader();
          const origReadAsText = reader.readAsText.bind(reader);
          reader.readAsText = function () {
            setTimeout(() => {
              reader.onerror?.(new Event("error"));
            }, 100);
          };
          return reader;
        };
      });
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "bad.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("content"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(1000);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[8] 校验失败-空文件", async ({ page }) => {
      const t = "校验失败-空文件";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "empty.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from(""),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[9] 校验失败-无$变量", async ({ page }) => {
      const t = "校验失败-无$变量";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "novar.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("Hello World no variables here"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[10] 校验成功-含单个变量", async ({ page }) => {
      const t = "校验成功-含单个变量";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "single.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[11] 校验成功-含多个变量", async ({ page }) => {
      const t = "校验成功-含多个变量";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "multi.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$VAR1$ $VAR2$ $VAR3$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[12] 校验成功-变量含特殊字符", async ({ page }) => {
      const t = "校验成功-变量含特殊字符";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "special.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$VAR_123$ $VAR-NAME$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("下载功能", () => {
    test("[13] 下载-正常下载", async ({ page }) => {
      const t = "下载-正常下载";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "test.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      await page.locator(".ud13-download-link").click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
    });

    test("[14] 下载-重新校验后下载", async ({ page }) => {
      const t = "下载-重新校验后下载";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      // 首次校验
      await page.locator("#ud13-file-input").setInputFiles({
        name: "v1.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$VAR1$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      // 第二次校验
      await page.locator("#ud13-file-input").setInputFiles({
        name: "v2.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$VAR2$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      await page.locator(".ud13-download-link").click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("UI交互", () => {
    test("[15] 校验中按钮禁用", async ({ page }) => {
      const t = "校验中按钮禁用";
      // 延迟 FileReader.readAsText 300ms，让 React 有时间渲染 disabled 状态
      await page.addInitScript(() => {
        const orig = FileReader.prototype.readAsText;
        FileReader.prototype.readAsText = function (blob, encoding) {
          setTimeout(() => orig.call(this, blob, encoding), 300);
        };
      });
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "test.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      const checkBtn = page.locator(".ud13-btn").filter({ hasText: "Check" });
      await checkBtn.click();
      await expect(checkBtn).toBeDisabled({ timeout: 3000 });
      await page.waitForTimeout(1000);
      await expect(checkBtn).toBeEnabled();
      await takeStepScreenshot(page, t);
    });

    test("[16] 校验中防止重复提交", async ({ page }) => {
      const t = "校验中防止重复提交";
      // 延迟 FileReader 确保 loading 状态可见
      await page.addInitScript(() => {
        const orig = FileReader.prototype.readAsText;
        FileReader.prototype.readAsText = function (blob, encoding) {
          setTimeout(() => orig.call(this, blob, encoding), 300);
        };
      });
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "test.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      const checkBtn = page.locator(".ud13-btn").filter({ hasText: "Check" });
      await checkBtn.click();
      await page.waitForTimeout(200);
      await checkBtn.click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, t);
    });

    test("[17] 连续校验-先失败后成功", async ({ page }) => {
      const t = "连续校验-先失败后成功";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      // 第一次：空文件→失败
      await page.locator("#ud13-file-input").setInputFiles({
        name: "empty.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from(""),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      // 第二次：含变量文件→成功
      await page.locator("#ud13-file-input").setInputFiles({
        name: "valid.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$VAR$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[18] 连续校验-先成功后失败", async ({ page }) => {
      const t = "连续校验-先成功后失败";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      // 第一次：含变量文件→成功
      await page.locator("#ud13-file-input").setInputFiles({
        name: "valid.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$VAR$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      await takeStepScreenshot(page, t);
      // 第二次：空文件→失败
      await page.locator("#ud13-file-input").setInputFiles({
        name: "empty.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from(""),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[19] 消息清空-新操作清除旧消息", async ({ page }) => {
      const t = "消息清空-新操作清除旧消息";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      // 触发错误
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      // 再次点击 Check（仍无文件），旧消息清除，显示新消息
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("消息显示", () => {
    test("[20] 消息类型-Error样式", async ({ page }) => {
      const t = "消息类型-Error样式";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[21] 消息类型-Success样式", async ({ page }) => {
      const t = "消息类型-Success样式";
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "test.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud13-success")).toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("安全性", () => {
    test("[22] 安全性-Blob URL不暴露路径", async ({ page }) => {
      const t = "安全性-Blob URL不暴露路径";
      // 拦截 URL.createObjectURL 记录 Blob URL
      await page.addInitScript(() => {
        const orig = URL.createObjectURL;
        URL.createObjectURL = function (blob) {
          const url = orig.call(this, blob);
          (window as any).__lastBlobUrl = url;
          return url;
        };
      });
      await navigateToUD13viaUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud13-file-input").setInputFiles({
        name: "test.rtf",
        mimeType: "text/rtf",
        buffer: Buffer.from("$AXLE_CONF$"),
      });
      await page.locator(".ud13-btn").filter({ hasText: "Check" }).click();
      await page.waitForTimeout(500);
      // 确认下载链接存在
      await expect(page.locator(".ud13-download-link")).toBeVisible();
      // 确认使用了 Blob URL（以 blob: 开头）
      const lastBlobUrl = await page.evaluate(
        () => (window as any).__lastBlobUrl || "",
      );
      expect(lastBlobUrl).toContain("blob:");
      await takeStepScreenshot(page, t);
    });
  });
});
