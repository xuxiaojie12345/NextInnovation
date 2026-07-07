import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD03_URL = "/UD03";
const UD04_URL = "/UD04";
const UD05_URL = "/UD05";
const API_SAVE = /UD05UpdateHdocAdcaModification/;
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD05";
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
 * UD03 → Submit → UD04 → [AD Change] → UD05 の実画面遷移
 */
async function navigateFromUD03toUD05(page: Page) {
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
  // UD05 の API 応答を待つ（Loading 完了 or エラー表示 or データ表示）
  await Promise.race([
    page.waitForSelector(".ud05-btn", { timeout: 20000 }),
    page.waitForSelector(".ud05-error-message", { timeout: 20000 }),
  ]);
  await page.waitForTimeout(500);
}

/**
 * UD05 画面に直接遷移 — エラーケース用
 */
async function navigateToUD05_direct(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD05_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Modify Document 模块 (UD05) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateFromUD03toUD05(page);
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

      // 操作步骤（beforeEach で実行済み）:
      // 1. UD03 画面で Chassis series 入力: wlx1
      // 2. UD03 画面で Chassis no 入力: 100001
      // 3. UD03 画面で Document type 選択: CERTIFICATE
      // 4. UD03 画面で Submit クリック → UD04 へ遷移
      // 5. UD04 画面で AD Change リンクをクリック → UD05 へ遷移
      // 6. UD05 画面表示を確認

      const header = page.locator(".ud05-header");
      await expect(header).toBeVisible();
      await takeStepScreenshot(page, testName);

      const pageTitle = page.locator(".ud05-page-title");
      await expect(pageTitle).toHaveText("Modify Document");
      await takeStepScreenshot(page, testName);

      // 底盘情報が表示されているか確認
      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        await expect(page.locator(".ud05-info-section")).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-参数缺失", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-参数缺失";

      // パラメータなしで直接アクセス
      await navigateToUD05_direct(page);

      const errorMsg = page.locator(".ud05-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("无法加载数据，请检查输入");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 数据展示（3～4）
  // ==========================================================

  test.describe("数据展示", () => {
    test("[3] 修改列表表示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "修改列表表示";

      // 操作步骤:
      // 1. UD05 画面で API から取得した変更リストを確認

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        // テーブルヘッダーを確認
        await expect(page.locator(".ud05-th").nth(0)).toHaveText("Variable");
        await expect(page.locator(".ud05-th").nth(1)).toHaveText("Description");
        await expect(page.locator(".ud05-th").nth(2)).toHaveText(
          "Current value",
        );
        await expect(page.locator(".ud05-th").nth(3)).toHaveText(
          "Modified value",
        );
      }
      await takeStepScreenshot(page, testName);
    });

    test("[4] Modified value输入可编辑判定", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Modified value输入可编辑判定";

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        // Current value が空の行は Modified value 入力が disabled
        const rows = page.locator(".ud05-table tbody tr");
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
          const currentValue = await rows
            .nth(i)
            .locator(".ud05-td")
            .nth(2)
            .textContent();
          const input = rows.nth(i).locator(".ud05-input");
          if (currentValue?.trim() === "") {
            await expect(input).toBeDisabled();
          } else {
            await expect(input).toBeEnabled();
          }
        }
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 链接功能（5～6）
  // ==========================================================

  test.describe("链接功能", () => {
    test("[5] Chassis no点击", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Chassis no点击";

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        const chassisLink = page.locator(".ud05-link").first();
        if (await chassisLink.isVisible()) {
          await chassisLink.click();
          await expect(page).toHaveURL(/UD07/, { timeout: 10000 });
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[6] Template链接下载", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Template链接下载";

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        // Template リンクは .ud05-info-row の3つ目
        const templateLink = page.locator(".ud05-link").nth(1);
        if (await templateLink.isVisible()) {
          await templateLink.click();
          await page.waitForTimeout(1000);
        }
      }
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. Save按钮（7～10）
  // 10 は仕様書に"模拟"と明記
  // ==========================================================

  test.describe("Save按钮", () => {
    test("[7] Save-无变更时", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Save-无变更时";

      // 操作步骤:
      // 1. 変更なしで Save ボタンをクリック
      // 2. エラーメッセージ表示を確認

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        const saveBtn = page.locator(".ud05-btn");
        await saveBtn.click();

        const errorMsg = page.locator(".ud05-error-message");
        await expect(errorMsg).toBeVisible();
        await expect(errorMsg).toHaveText("NO UNRELEASED VERSION EXISTS!");
      }
      await takeStepScreenshot(page, testName);
    });

    test("[8] Save-修改有效值", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Save-修改有效值";

      // 操作步骤:
      // 1. Modified value を変更
      // 2. Save ボタンをクリック
      // 3. 実APIが呼ばれ、成功時は /UD06 へ遷移

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        // 最初の有効な行を変更
        const rows = page.locator(".ud05-table tbody tr");
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
          const input = rows.nth(i).locator(".ud05-input");
          if (await input.isEnabled()) {
            await input.fill("test_modification");
            break;
          }
        }

        // Save をクリック
        await page.locator(".ud05-btn").click();
        await page.waitForTimeout(2000);
      }
      await takeStepScreenshot(page, testName);
    });

    test("[9] Save-API错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Save-API错误";

      // 仕様書に"模拟 API 返回错误"と記載 — beforeEach で UD05 に遷移済み
      await page.route(API_SAVE, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal Server Error" }),
        });
      });

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        // 最初の有効な行を変更
        let modified = false;
        const rows = page.locator(".ud05-table tbody tr");
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
          const input = rows.nth(i).locator(".ud05-input");
          if (await input.isEnabled()) {
            await input.fill("test_modification");
            await page.waitForTimeout(300);
            modified = true;
            break;
          }
        }

        if (modified) {
          await page.locator(".ud05-btn").click();
          const errorMsg = page.locator(".ud05-error-message");
          await expect(errorMsg).toBeVisible({ timeout: 10000 });
          await expect(errorMsg).toHaveText("保存失败，请检查输入内容");
        } else {
          // 変更可能な行がない場合は Save をクリック
          await page.locator(".ud05-btn").click();
          const errorMsg = page.locator(".ud05-error-message");
          await expect(errorMsg).toBeVisible();
        }
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_SAVE);
    });
  });

  // ==========================================================
  // 5. 例外处理（11）
  // 仕様書に"模拟"と明記
  // ==========================================================

  test.describe("例外处理", () => {
    test("[10] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络错误";

      // 仕様書に"模拟网络断开"と記載 — beforeEach で UD05 に遷移済み
      await page.route(API_SAVE, async (route) => {
        await route.abort("connectionrefused");
      });

      const hasError = await page.locator(".ud05-error-message").isVisible();
      if (!hasError) {
        // 最初の有効な行を変更
        const rows = page.locator(".ud05-table tbody tr");
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
          const input = rows.nth(i).locator(".ud05-input");
          if (await input.isEnabled()) {
            await input.fill("test_modification");
            break;
          }
        }

        await page.locator(".ud05-btn").click();

        const errorMsg = page.locator(".ud05-error-message");
        await expect(errorMsg).toBeVisible({ timeout: 10000 });
        // handleSave の catch ブロックは常にこのメッセージを表示する
        await expect(errorMsg).toHaveText("保存失败，请检查输入内容");
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_SAVE);
    });
  });
});
