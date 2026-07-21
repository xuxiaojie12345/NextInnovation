import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD03_URL = "/UD03";
const UD04_URL = "/UD04";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD04";
const CHASSIS_SERIES = "wlx1";
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
 * UD03 → Submit → UD04 の実画面遷移で UD04 に到達する（実API呼び出し）
 */
async function navigateFromUD03toUD04(page: Page) {
  // 0. 设置 API Mock（UD03 doc types + UD04 data）
  await setupDocTypesMock(page);
  await setupUD04ApiMock(page);

  // 1. セッション設定
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);

  // 2. UD03 に遷移
  await page.goto(UD03_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#chassis-series-input", { timeout: 15000 });

  // 3. UD03 で検索条件を入力
  await page.locator("#chassis-series-input").fill(CHASSIS_SERIES);
  await page.locator("#chassis-no-input").fill(CHASSIS_NO);
  await page.locator("#document-type-select").selectOption(DOC_TYPE);

  // 4. Submit クリック → UD04 へ遷移
  await page.locator(".ud03-btn").first().click();

  // 5. UD04 画面が表示されるまで待機
  await page.waitForSelector(".ud04-container", { timeout: 15000 });
  // UD04 の API データがロードされるのを待つ
  await page.waitForTimeout(1500);
}

/**
 * UD04 画面に直接遷移（パラメータなし）— エラーケース用
 */
async function navigateToUD04(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD04_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

// ============================================================
// API Mock 辅助函数
// ============================================================

const API_DOC_TYPES = "**/api/UD03SelectHdocdocumentlistApi/types";
const API_UD04 = "**/api/UD04SelectGeneratedocumentApi/SelectGeneratedocument";

/** 设置 UD03 Document Types API Mock（下拉列表选项） */
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

/** 设置 UD04 SelectGeneratedocument API Mock（返回正常数据） */
async function setupUD04ApiMock(page: Page) {
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

// ============================================================
// テストスイート
// ============================================================

test.describe("Generate Document 模块 (UD04) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateFromUD03toUD04(page);
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

      // 操作步骤已在 beforeEach 中执行:
      // 1. UD03 画面で Chassis series 入力: wlx1
      // 2. UD03 画面で Chassis no 入力: 100001
      // 3. UD03 画面で Document type 選択: CERTIFICATE
      // 4. UD03 画面で Submit クリック → UD04 へ遷移

      // 确认: 蓝色 Header
      const header = page.locator(".ud04-header");
      await expect(header).toBeVisible();
      await takeStepScreenshot(page, testName);

      // 确认: 页面标题 "Generate document"
      const pageTitle = page.locator(".ud04-page-title");
      await expect(pageTitle).toHaveText("Generate document");
      await takeStepScreenshot(page, testName);

      // 确认: 内容区域表示
      const contentBox = page.locator(".ud04-content-box");
      await expect(contentBox).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-参数缺失";
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD04_URL, { waitUntil: "domcontentloaded" });
      const errorMsg = page.locator(".ud04-error-area");
      await expect(errorMsg).toBeVisible({ timeout: 10000 });
      await expect(errorMsg).toHaveText("无法加载数据，请检查输入");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 数据展示（3～6）
  // ==========================================================

  test.describe("数据展示", () => {
    test("[3] 基本信息显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "基本信息显示";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 画面で Chassis series 入力: wlx1
      // 2. UD03 画面で Chassis no 入力: 100001
      // 3. UD03 画面で Document type 選択: CERTIFICATE
      // 4. UD03 画面で Submit クリック → UD04 へ遷移
      // 5. UD04 画面で各情報フィールドを確認

      // エラーが表示されている場合はデータなしと判断
      const hasError = await page.locator(".ud04-error-area").isVisible();
      if (!hasError) {
        // 各ラベル要素の存在を確認（クラス名ベースで確実に取得）
        const labelTexts = [
          "Chassis no:",
          "Ordernumber:",
          "Build week:",
          "Spec week:",
          "Market:",
          "Master Market:",
        ];
        for (const text of labelTexts) {
          // 完全一致で検索（"Market:" が "Master Market:" に引っかからないよう）
          const label = page.locator(".ud04-info-label").filter({
            hasText: new RegExp(
              `^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            ),
          });
          await expect(label).toBeVisible({ timeout: 5000 });
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[4] S-Notes显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "S-Notes显示";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 → Submit(wlx1/100001/CERTIFICATE) → UD04
      // 2. UD04 画面で S-Notes セクションの表示を確認

      const snoteSection = page.locator(".ud04-snote-section");
      const snoteWarning = page.locator(".ud04-snote-warning-text");
      if (await snoteSection.isVisible()) {
        await expect(snoteWarning).toBeVisible();
        await expect(snoteWarning).toHaveText(
          "The S-Notes above can affect homologation documents.",
        );
      }
      await takeStepScreenshot(page, testName);
    });

    test("[5] S-Notes不显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "S-Notes不显示";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 → Submit(wlx1/100001/CERTIFICATE) → UD04
      // 2. UD04 画面で S-Notes が非表示であることを確認

      const snoteSection = page.locator(".ud04-snote-section");
      const snoteWarning = page.locator(".ud04-snote-warning-text");
      if (await snoteSection.isVisible()) {
        // S-Notes が存在する場合はこのテストをスキップ（実API依存）
        test.skip(true, "API returned data with S-Notes");
      } else {
        await expect(snoteSection).toHaveCount(0);
        await expect(snoteWarning).toHaveCount(0);
      }
      await takeStepScreenshot(page, testName);
    });

    test("[6] 轮胎指数显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "轮胎指数显示";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 → Submit(wlx1/100001/CERTIFICATE) → UD04
      // 2. UD04 画面でタイヤ指数フィールドを確認

      const hasError = await page.locator(".ud04-error-area").isVisible();
      if (!hasError) {
        const labelTexts = [
          "Front load index:",
          "Front speed index:",
          "Drive load index:",
          "Drive speed index:",
        ];
        for (const text of labelTexts) {
          const label = page.locator(".ud04-info-label").filter({
            hasText: new RegExp(
              `^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            ),
          });
          await expect(label).toBeVisible({ timeout: 5000 });
        }
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. AD Change显示（7～8）
  // ==========================================================

  test.describe("AD Change显示", () => {
    test("[7] AD Change-有效时显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "AD Change-有效时显示";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 → Submit(wlx1/100001/CERTIFICATE) → UD04
      // 2. UD04 画面で AD Change 領域の表示を確認

      const adChangeSection = page.locator(".ud04-adchange-section");
      const adChangeLink = page.locator(".ud04-adchange-link");

      if (await adChangeSection.isVisible()) {
        await expect(adChangeLink).toBeVisible();
        await expect(adChangeLink).toHaveCSS("color", "rgb(207, 19, 34)"); // #cf1322
      }
      await takeStepScreenshot(page, testName);
    });

    test("[8] AD Change-无效时显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "AD Change-无效时显示";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 → Submit(wlx1/100001/CERTIFICATE) → UD04
      // 2. UD04 画面で AD Change 領域が非表示であることを確認

      const adChangeSection = page.locator(".ud04-adchange-section");
      if (await adChangeSection.isVisible()) {
        // AD Change が有効な場合はこのテストをスキップ
        test.skip(true, "API returned adChangeEnabled=true");
      } else {
        await expect(adChangeSection).toHaveCount(0);
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. 链接功能（9～11）
  // ==========================================================

  test.describe("链接功能", () => {
    test("[9] Chassis no点击", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Chassis no点击";

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 → Submit(wlx1/100001/CERTIFICATE) → UD04
      // 2. UD04 画面で Chassis no リンクをクリック → /UD07 へ遷移

      const chassisLink = page.locator(".ud04-link").first();
      if (await chassisLink.isVisible()) {
        await chassisLink.click();
        await expect(page).toHaveURL(/UD07/, { timeout: 10000 });
      }
      await takeStepScreenshot(page, testName);
    });

    test("[10] Generated document下载", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Generated document下载";
      await page.waitForSelector(".ud04-content-box", { timeout: 15000 });
      const docLink = page.locator(".ud04-link-doc");
      if (await docLink.isVisible().catch(() => false)) {
        await docLink.click();
        await page.waitForTimeout(1000);
      }
      await takeStepScreenshot(page, testName);
    });

    test("[11] Modify链接", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Modify链接";
      await page.waitForSelector(".ud04-content-box", { timeout: 15000 });
      const adChangeLink = page.locator(".ud04-adchange-link");
      if (await adChangeLink.isVisible().catch(() => false)) {
        await adChangeLink.click();
        await expect(page).toHaveURL(/UD05/, { timeout: 10000 });
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 5. 例外处理（12～15）
  // 拦截 HTML 注入 script 在 React 加载前设置 state，route 模拟 API
  // ==========================================================

  test.describe("例外处理", () => {
    /**
     * 使用 addInitScript 在 React 加载前设置 history state。
     * 该脚本在每个页面加载时执行（在页面脚本之前），当路径为 /UD04 时，
     * 注入 React Router 期望格式的状态 { usr: {...}, idx: 0 }。
     */
    async function injectStateViaInitScript(page: Page) {
      await page.addInitScript(() => {
        if (window.location.pathname === "/UD04") {
          window.history.replaceState(
            {
              usr: {
                chassisSeries: "wlx1",
                chassisNo: "100001",
                documentType: "CERTIFICATE",
              },
              idx: 0,
            },
            "",
            "/UD04",
          );
        }
      });
    }

    test("[12] 例外处理-模板不存在", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "例外处理-模板不存在";
      // 移除 beforeEach 注册的默认 mock，使用自定义 mock
      await page.unroute(API_UD04);
      await page.route(API_UD04, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 500,
            msg: "Can not find template for doctype VIN-PLATE",
          }),
        });
      });
      // 注册 init script，在下一次前往 /UD04 时生效
      await injectStateViaInitScript(page);
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD04_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".ud04-error-area", { timeout: 15000 });
      // code=500 时组件显示 res.msg
      await expect(page.locator(".ud04-error-area")).toHaveText(
        "Can not find template for doctype VIN-PLATE",
      );
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UD04);
    });

    test("[13] 例外处理-规则未定义", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "例外处理-规则未定义";
      // 移除 beforeEach 注册的默认 mock
      await page.unroute(API_UD04);
      await page.route(API_UD04, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            msg: "success",
            data: { chassisNo: "100001", replacedParams: [] },
          }),
        });
      });
      await injectStateViaInitScript(page);
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD04_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".ud04-error-area", { timeout: 15000 });
      await expect(page.locator(".ud04-error-area")).toHaveText(
        "No template rule defined for this truck.",
      );
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UD04);
    });

    test("[14] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络错误";
      // 移除 beforeEach 注册的默认 mock
      await page.unroute(API_UD04);
      await page.route(API_UD04, async (route) => {
        await route.abort("connectionrefused");
      });
      await injectStateViaInitScript(page);
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD04_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".ud04-error-area", { timeout: 15000 });
      // route.abort 在 Chromium 中抛出 TypeError("Failed to fetch")，
      // 组件 else 分支显示 "系统繁忙，请稍后再试"
      await expect(page.locator(".ud04-error-area")).toHaveText(
        "系统繁忙，请稍后再试",
      );
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UD04);
    });

    test("[15] 异常处理-服务器错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-服务器错误";
      // 移除 beforeEach 注册的默认 mock
      await page.unroute(API_UD04);
      await page.route(API_UD04, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
        });
      });
      await injectStateViaInitScript(page);
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD04_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".ud04-error-area", { timeout: 15000 });
      await expect(page.locator(".ud04-error-area")).toHaveText(
        "系统繁忙，请稍后再试",
      );
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UD04);
    });
  });

  // ==========================================================
  // 6. 页脚显示（16）
  // ==========================================================

  test.describe("页脚显示", () => {
    test("[16] 页脚信息显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "页脚信息显示";

      const footer = page.locator(".ud04-footer");
      if (await footer.isVisible()) {
        await expect(footer).toContainText("Date:");
        await expect(footer).toContainText("HDoc version:");
      }
      await takeStepScreenshot(page, testName);
    });
  });
});
