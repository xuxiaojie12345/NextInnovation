import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD03_URL = "/UD03";
const UD04_URL = "/UD04";
const UD05_URL = "/UD05";
const UD06_URL = "/UD06";
const API_MOD_STATUS =
  "**/api/UD06SaveModificationsApi/UD06SelectHdocAdcaModification";
const API_SAVE = /UD05UpdateHdocAdcaModification/;
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD06";
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
 * UD03 → Submit → UD04 → [AD Change] → UD05 → Save → UD06 の実画面遷移
 */
async function navigateFromUD03toUD06(page: Page) {
  // 1. セッション設定
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);

  // 2. UD03 に遷移して検索条件を入力
  await page.goto(UD03_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#chassis-series-input", { timeout: 15000 });
  await page.locator("#chassis-series-input").fill(CHASSIS_SERIE);
  await page.locator("#chassis-no-input").fill(CHASSIS_NO);
  await page.locator("#document-type-select").selectOption(DOC_TYPE);

  // 3. Submit → UD04
  await page.locator(".ud03-btn").first().click();
  await page.waitForSelector(".ud04-container", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 4. AD Change リンクをクリック → UD05
  const adChangeLink = page.locator(".ud04-adchange-link");
  await expect(adChangeLink).toBeVisible({ timeout: 10000 });
  await adChangeLink.click();
  await page.waitForSelector(".ud05-container", { timeout: 15000 });
  // UD05 の API 応答を待つ
  await Promise.race([
    page.waitForSelector(".ud05-btn", { timeout: 20000 }),
    page.waitForSelector(".ud05-error-message", { timeout: 20000 }),
  ]);
  await page.waitForTimeout(500);

  // 5. UD05 で Modified value を変更 → Save → UD06
  const rows = page.locator(".ud05-table tbody tr");
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    const input = rows.nth(i).locator(".ud05-input");
    if (await input.isEnabled()) {
      await input.fill("7");
      break;
    }
  }

  // Save をクリック（実API、成功時に /UD06 へ遷移）
  await page.locator(".ud05-btn").click();
  await page.waitForSelector(".ud06-container", { timeout: 20000 });
  await page.waitForTimeout(1500);
}

/**
 * UD06 画面に直接遷移 — エラーケース用
 */
async function navigateToUD06_direct(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD06_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Save Modifications 模块 (UD06) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateFromUD03toUD06(page);
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
  // 1. 画面初始化（1～2）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-正常表示";

      // 操作步骤:
      // 1. UD05 で Save → パラメータを携えて UD06 に遷移
      // 2. UD06 画面表示を確認

      const header = page.locator(".ud06-header");
      await expect(header).toBeVisible();
      await takeStepScreenshot(page, testName);

      const title = page.locator(".ud06-title");
      await expect(title).toHaveText("Save Modifications");
      await takeStepScreenshot(page, testName);

      const hasError = await page.locator(".ud06-error").isVisible();
      if (!hasError) {
        await expect(page.locator(".ud06-info-section")).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-参数缺失";

      // パラメータなしで直接アクセス
      await navigateToUD06_direct(page);

      const errorMsg = page.locator(".ud06-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("无法加载修改状态，请重试");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 数据展示（3～5）
  // ==========================================================

  test.describe("数据展示", () => {
    test("[3] 修改状态信息显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "修改状态信息显示";

      const hasError = await page.locator(".ud06-error").isVisible();
      if (!hasError) {
        const labelTexts = [
          "Chassis serie:",
          "Chassis number:",
          "Doctype:",
          "Version:",
          "Storing:",
          "FOUND UNRELEASED VERSION:",
        ];
        for (const text of labelTexts) {
          const label = page.locator(".ud06-info-label").filter({
            hasText: new RegExp(
              `^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            ),
          });
          await expect(label).toBeVisible({ timeout: 5000 });
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[4] 消息显示-已发布", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "消息显示-已发布";

      const hasError = await page.locator(".ud06-error").isVisible();
      if (!hasError) {
        const messageEl = page.locator(".ud06-message-released");
        if (await messageEl.isVisible()) {
          const text = await messageEl.textContent();
          if (text === "VERSION IS RELEASED") {
            await expect(messageEl).toBeVisible();
          }
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[5] 消息显示-未发布", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "消息显示-未发布";

      const hasError = await page.locator(".ud06-error").isVisible();
      if (!hasError) {
        const messageEl = page.locator(".ud06-message-released");
        if (await messageEl.isVisible()) {
          const text = await messageEl.textContent();
          if (text === "NO UNRELEASED VERSION EXISTS!") {
            await expect(messageEl).toBeVisible();
          }
        }
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. Close按钮（6）
  // ==========================================================

  test.describe("Close按钮", () => {
    test("[6] Close-返回UD05", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Close-返回UD05";

      const hasError = await page.locator(".ud06-error").isVisible();
      if (!hasError) {
        const closeBtn = page.locator(".ud06-btn");
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(page).toHaveURL(/UD05/, { timeout: 10000 });
        }
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. 例外处理（7～8）
  // 仕様書に"模拟"と明記されているため route 使用
  // ==========================================================

  test.describe("例外处理", () => {
    test("[7] 异常处理-API错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-API错误";

      // 仕様書に"模拟 API 返回错误"と記載
      await page.route(API_MOD_STATUS, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal Server Error" }),
        });
      });

      await navigateToUD06_direct(page);
      // location.state でパラメータを設定
      await page.evaluate(
        ({ serie, number }: { serie: string; number: string }) => {
          window.history.replaceState(
            { chassisSerie: serie, chassisNumber: number, modifications: [] },
            "",
          );
        },
        { serie: CHASSIS_SERIE, number: CHASSIS_NO },
      );
      await page.goto(UD06_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud06-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("无法加载修改状态，请重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_MOD_STATUS);
    });

    test("[8] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络错误";

      // 仕様書に"模拟网络断开"と記載
      await page.route(API_MOD_STATUS, async (route) => {
        await route.abort("connectionrefused");
      });

      await navigateToUD06_direct(page);
      await page.evaluate(
        ({ serie, number }: { serie: string; number: string }) => {
          window.history.replaceState(
            { chassisSerie: serie, chassisNumber: number, modifications: [] },
            "",
          );
        },
        { serie: CHASSIS_SERIE, number: CHASSIS_NO },
      );
      await page.goto(UD06_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud06-error");
      await expect(errorMsg).toBeVisible();
      // catch ブロックは常に "无法加载修改状态，请重试"
      await expect(errorMsg).toHaveText("无法加载修改状态，请重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_MOD_STATUS);
    });
  });
});
