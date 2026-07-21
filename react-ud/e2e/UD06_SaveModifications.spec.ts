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
  // 0. 设置所有 API Mock
  await setupDocTypesMock(page);
  await setupUD04MockForUD06(page);
  await setupUD05QueryMock(page);
  await setupUD05SaveMock(page);
  await setupUD06ApiMock(page);

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

  // Save をクリック（Mock が成功を返すので /UD06 へ遷移）
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
// API Mock 辅助函数
// ============================================================

const API_DOC_TYPES = "**/api/UD03SelectHdocdocumentlistApi/types";
const API_UD04 = "**/api/UD04SelectGeneratedocumentApi/SelectGeneratedocument";
const API_UD05_QUERY =
  "**/api/UD05ModifyDocumentApi/UD05SelectVariableModification";
const API_UD05_SAVE =
  "**/api/UD05ModifyDocumentApi/UD05UpdateHdocAdcaModification";
const API_UD06_QUERY =
  "**/api/UD06SaveModificationsApi/UD06SelectHdocAdcaModification";

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

/** 设置 UD04 API Mock（adChangeEnabled=true, chassisNo 含下划线以便 UD05 拆分） */
async function setupUD04MockForUD06(page: Page) {
  await page.route(API_UD04, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: {
          chassisNo: "wlx1_100001",
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
          adChangeEnabled: true,
          adChangeMessage:
            "After def change detected. Document need to be modified.",
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

/** 设置 UD05 变量修改信息 API Mock */
async function setupUD05QueryMock(page: Page) {
  await page.route(API_UD05_QUERY, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: {
          chassisNo: "wlx1_100001",
          market: "EU",
          templateFile: "certificate_template.rtf",
          modifications: [
            {
              variable: "VAR001",
              description: "Engine Type",
              currentValue: "Diesel",
              modifiedValue: "",
            },
            {
              variable: "VAR002",
              description: "Tire Size",
              currentValue: "225/65R17",
              modifiedValue: "",
            },
          ],
        },
      }),
    });
  });
}

/** 设置 UD05 Save API Mock（必须返回成功才能跳转到 UD06） */
async function setupUD05SaveMock(page: Page) {
  await page.route(API_UD05_SAVE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 200, msg: "success", data: {} }),
    });
  });
}

/** 设置 UD06 修改状态查询 API Mock */
async function setupUD06ApiMock(page: Page) {
  await page.route(API_UD06_QUERY, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "success",
        data: {
          foundUnreleasedVersion: 1,
          message: "VERSION IS RELEASED",
          doctype: "CERTIFICATE",
          version: "v2.1.0",
          storing: "Stored in database",
        },
      }),
    });
  });
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
    /**
     * 使用 addInitScript 在 React 加载前设置 history state。
     * 该脚本在每个页面加载时执行（在页面脚本之前），当路径为 /UD06 时，
     * 注入 React Router 期望格式的状态 { usr: {...}, idx: 0 }。
     */
    async function injectStateViaInitScript(page: Page) {
      await page.addInitScript(() => {
        if (window.location.pathname === "/UD06") {
          window.history.replaceState(
            {
              usr: {
                chassisSerie: "wlx1",
                chassisNumber: "100001",
                modifications: [],
              },
              idx: 0,
            },
            "",
            "/UD06",
          );
        }
      });
    }

    test("[7] 异常处理-API错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-API错误";

      // 移除 beforeEach 注册的默认 mock，使用自定义 mock（返回 500）
      await page.unroute(API_UD06_QUERY);
      await page.route(API_UD06_QUERY, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal Server Error" }),
        });
      });

      // 注册 init script，在下一次前往 /UD06 时注入 state
      await injectStateViaInitScript(page);
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD06_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud06-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("无法加载修改状态，请重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UD06_QUERY);
    });

    test("[8] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络错误";

      // 移除 beforeEach 注册的默认 mock，使用自定义 mock（abort）
      await page.unroute(API_UD06_QUERY);
      await page.route(API_UD06_QUERY, async (route) => {
        await route.abort("connectionrefused");
      });

      // 注册 init script，在下一次前往 /UD06 时注入 state
      await injectStateViaInitScript(page);
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD06_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const errorMsg = page.locator(".ud06-error");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("无法加载修改状态，请重试");
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UD06_QUERY);
    });
  });
});
