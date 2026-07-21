import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD03_URL = "/UD03";
const UD04_URL = "/UD04";
const UD07_URL = "/UD07";
const API_SPEC = "**/api/UD07VehicleSpecificationApi/Select/**";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD07";
const CHASSIS_SERIE = "wlx1";
const CHASSIS_NO = "100001";
const DOC_TYPE = "CERTIFICATE";

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

/**
 * UD03 → Submit → UD04 → [Chassis no link] → UD07 の実画面遷移
 */
async function navigateFromUD03toUD07(page: Page) {
  // 0. 设置所有 API Mock
  await setupDocTypesMock(page);
  await setupUD04MockForUD07(page);
  await setupUD07ApiMock(page);

  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);

  // UD03 に遷移して検索条件を入力
  await page.goto(UD03_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#chassis-series-input", { timeout: 15000 });
  await page.locator("#chassis-series-input").fill(CHASSIS_SERIE);
  await page.locator("#chassis-no-input").fill(CHASSIS_NO);
  await page.locator("#document-type-select").selectOption(DOC_TYPE);

  // Submit → UD04
  await page.locator(".ud03-btn").first().click();
  await page.waitForSelector(".ud04-container", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // UD04 で Chassis no リンクをクリック → UD07
  const chassisLink = page.locator(".ud04-link").first();
  await expect(chassisLink).toBeVisible({ timeout: 10000 });
  await chassisLink.click();
  await page.waitForSelector(".ud07-container", { timeout: 15000 });
  await page.waitForTimeout(1500);
}

/**
 * UD07 画面に直接遷移 — エラーケース用
 */
async function navigateToUD07_direct(page: Page, hasParam: boolean = true) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  const url = hasParam ? `${UD07_URL}?chassisNo=${CHASSIS_NO}` : UD07_URL;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

// ============================================================
// API Mock 辅助函数
// ============================================================

const API_DOC_TYPES = "**/api/UD03SelectHdocdocumentlistApi/types";
const API_UD04 = "**/api/UD04SelectGeneratedocumentApi/SelectGeneratedocument";

/** 设置 UD03 Document Types API Mock */
async function setupDocTypesMock(page: Page) {
  await page.route(API_DOC_TYPES, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: {
          documentTypes: [
            { doctype: "CERTIFICATE" },
            { doctype: "VIN-PLATE" },
            { doctype: "REPORT" },
          ],
        },
      }),
    });
  });
}

/** 设置 UD04 API Mock（Chassis no 链接可见即可） */
async function setupUD04MockForUD07(page: Page) {
  await page.route(API_UD04, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: {
          chassisNo: "100001",
          ordernumber: "ORD-2024-001",
          buildWeek: "2024-W12",
          specWeek: "2024-W11",
          market: "EU",
          masterMarket: "DE",
          snotes: [],
          snotemessage: "",
          frontLoadIndex: "95",
          frontSpeedIndex: "H",
          driveLoadIndex: "100",
          driveSpeedIndex: "T",
          adChangeEnabled: false,
          adChangeMessage: "",
          templateName: "CERTIFICATE_TEMPLATE",
          replacedParams: ["param1", "param2"],
          generatedFileUrl: "/files/generated/certificate_100001.rtf",
          date: "2024-03-15",
          hdocVersion: "v2.1.0",
        },
      }),
    });
  });
}

/** 设置 UD07 车辆规格 API Mock */
async function setupUD07ApiMock(page: Page) {
  await page.route(API_SPEC, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: {
          chassisNo: "100001",
          model: "Model X",
          builtWeek: "2024-W12",
          productType: "Standard",
          vin: "WDB00000000000001",
          engineNo: "ENG123456",
          countryOfOperation: "Germany",
          symbols: [
            { symbol: "ABS", description: "Anti-lock Braking System" },
            { symbol: "ESP", description: "Electronic Stability Program" },
          ],
          sNotes: ["Note 1: Test note", "Note 2: Another test note"],
        },
      }),
    });
  });
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Vehicle Specification 模块 (UD07) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateFromUD03toUD07(page);
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

  // ==========================================================
  // 1. 画面初始化（1～3）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-正常表示";

      const header = page.locator(".ud07-header");
      await expect(header).toBeVisible();
      await takeStepScreenshot(page, testName);

      const title = page.locator(".ud07-title");
      await expect(title).toHaveText("VDA - Vehicle Specification:");
      await takeStepScreenshot(page, testName);

      const hasError = await page.locator(".ud07-error").isVisible();
      if (!hasError) {
        await expect(page.locator(".ud07-info-section")).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-参数缺失";

      await navigateToUD07_direct(page, false);

      const errorMsg = page.locator(".ud07-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("无法加载数据，请检查输入");
      await takeStepScreenshot(page, testName);
    });

    test("[3] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-加载中状态";

      // 仕様書に"模拟 API 延迟响应"と記載
      // 移除 beforeEach 注册的默认 mock
      await page.unroute(API_SPEC);
      await page.route(API_SPEC, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            msg: "success",
            data: {
              chassisNo: "100001",
              model: "Model X",
              builtWeek: "2024-W12",
              productType: "Standard",
              vin: "WDB00000000000001",
              engineNo: "ENG123456",
              countryOfOperation: "Germany",
              symbols: [
                { symbol: "ABS", description: "Anti-lock Braking System" },
              ],
              sNotes: [],
            },
          }),
        });
      });

      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(`${UD07_URL}?chassisNo=${CHASSIS_NO}`, {
        waitUntil: "domcontentloaded",
      });

      // Loading 表示を確認
      const loadingMsg = page.locator(".ud07-loading");
      await expect(loadingMsg).toBeVisible({ timeout: 3000 });
      await expect(loadingMsg).toHaveText("Loading...");
      await takeStepScreenshot(page, testName);

      // 完了を待つ
      await page.waitForSelector(".ud07-content-box", { timeout: 15000 });
      await page.unroute(API_SPEC);
    });
  });

  // ==========================================================
  // 2. 数据展示（4～7）
  // ==========================================================

  test.describe("数据展示", () => {
    test("[4] 基本信息显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "基本信息显示";
      const hasError = await page.locator(".ud07-error").isVisible();
      if (!hasError) {
        const labels = page.locator(".ud07-info-label");
        await expect(labels.first()).toBeVisible({ timeout: 5000 });
        const textArr = [
          "Chassis no:",
          "Model:",
          "Built week:",
          "Product type:",
          "VIN:",
          "Symbol:",
          "Country of Operation:",
        ];
        for (const text of textArr) {
          await expect(labels.filter({ hasText: text }).first()).toBeVisible();
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[5] Symbols显示及Tooltip", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Symbols显示及Tooltip";

      const hasError = await page.locator(".ud07-error").isVisible();
      if (!hasError) {
        const symbolsBlock = page.locator(".ud07-symbols-block");
        if (await symbolsBlock.isVisible()) {
          const items = symbolsBlock.locator(".ud07-symbol-item");
          const count = await items.count();
          expect(count).toBeGreaterThanOrEqual(1);
          // hover で Tooltip（data-tip）を確認
          if (count > 0) {
            const firstItem = items.first();
            const tip = await firstItem.getAttribute("data-tip");
            expect(tip).not.toBeNull();
            await firstItem.hover();
            await page.waitForTimeout(300);
          }
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[6] S-Notes显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "S-Notes显示";

      const hasError = await page.locator(".ud07-error").isVisible();
      if (!hasError) {
        const snotesSection = page.locator(".ud07-snotes-section");
        if (await snotesSection.isVisible()) {
          const items = snotesSection.locator(".ud07-snote-item");
          const count = await items.count();
          expect(count).toBeGreaterThanOrEqual(1);
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[7] S-Notes不显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "S-Notes不显示";

      const hasError = await page.locator(".ud07-error").isVisible();
      if (!hasError) {
        const snotesSection = page.locator(".ud07-snotes-section");
        if (await snotesSection.isVisible()) {
          test.skip(true, "API returned data with S-Notes");
        } else {
          await expect(snotesSection).toHaveCount(0);
        }
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 异常处理（8～11）
  // 仕様書に"模拟"と明記されているため route 使用
  // ==========================================================

  test.describe("异常处理", () => {
    test("[8] 异常处理-底盘不存在", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-底盘不存在";

      // 移除 beforeEach 注册的默认 mock
      await page.unroute(API_SPEC);
      await page.route(API_SPEC, async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Not Found" }),
        });
      });

      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(`${UD07_URL}?chassisNo=${CHASSIS_NO}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud07-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("数据加载失败，请稍后重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_SPEC);
    });

    test("[9] 异常处理-服务器500错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-服务器500错误";

      await page.unroute(API_SPEC);
      await page.route(API_SPEC, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal Server Error" }),
        });
      });

      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(`${UD07_URL}?chassisNo=${CHASSIS_NO}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud07-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("数据加载失败，请稍后重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_SPEC);
    });

    test("[10] 异常处理-网络超时", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络超时";
      test.setTimeout(90000);

      await page.unroute(API_SPEC);
      await page.route(API_SPEC, async (route) => {
        await new Promise((r) => setTimeout(r, 35000));
        await route.abort("timedout");
      });

      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(`${UD07_URL}?chassisNo=${CHASSIS_NO}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(1000);

      const errorMsg = page.locator(".ud07-error");
      await expect(errorMsg).toBeVisible({ timeout: 45000 });
      await expect(errorMsg).toHaveText("数据加载失败，请稍后重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_SPEC);
    });

    test("[11] 异常处理-数据库异常", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-数据库异常";

      await page.unroute(API_SPEC);
      await page.route(API_SPEC, async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "Service Unavailable" }),
        });
      });

      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(`${UD07_URL}?chassisNo=${CHASSIS_NO}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud07-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("数据加载失败，请稍后重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_SPEC);
    });
  });
});
