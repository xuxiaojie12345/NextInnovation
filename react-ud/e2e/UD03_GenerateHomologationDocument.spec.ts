import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD03_URL = "/UD03";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD03";
const API_DOC_TYPES = "**/api/UD03SelectHdocdocumentlistApi/types";

/** スクリーンショット用カウンター（テストケースごとにリセット） */
let screenshotCounter = 1;

/**
 * テストケース内でステップごとにスクリーンショットを撮影
 * 命名: {testCaseName}/001.jpg の形式、テストごとに001から開始
 */
async function takeStepScreenshot(page: Page, testName: string) {
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: `${IMAGE_DIR}/${testName}/${filename}`,
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
}

/**
 * セッション情報を localStorage に設定（実際のログイン処理の代わり）
 * 実API呼び出しのために、認証済み状態を作る
 */
async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "test-token-12345");
  });
}

/**
 * UD03 画面に遷移し、画面が完全にロードされるまで待つ
 * 実APIを呼び出し、Document Type 下拉列表が取得されるのを待つ
 */
async function navigateToUD03(page: Page) {
  // 先にログイン画面へ遷移（同一オリジンであることを保証）
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  // セッションを設定
  await seedSession(page);
  // UD03 へ遷移（実APIを呼び出す）
  await page.goto(UD03_URL, { waitUntil: "networkidle" });
  // API 応答を待つために、フォームカードが表示されるまで待機
  await page.waitForSelector(".ud03-form-card", { timeout: 20000 });
}

// ============================================================
// テストスイート：Generate Homologation Document 模块 (UD03)
// ============================================================

test.describe("Generate Homologation Document 模块 (UD03) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToUD03(page);
  });

  // 测试失败时也截图
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
  // 1. 画面初始化（テストケース 1～4）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-全体布局";

      // 1. 蓝色 Header 区域（#003057，高度 48px）
      const header = page.locator(".ud03-header");
      await expect(header).toBeVisible();
      await takeStepScreenshot(page, testName);

      // 2. 页面标题
      const pageTitle = page.locator(".ud03-page-title");
      await expect(pageTitle).toHaveText(
        "HDoc - Generate Homologation Document",
      );
      await takeStepScreenshot(page, testName);

      // 3. 三个入力项目水平标签布局
      await expect(page.locator("#chassis-series-input")).toBeVisible();
      await expect(page.locator("#chassis-no-input")).toBeVisible();
      await expect(page.locator("#document-type-select")).toBeVisible();

      // 4. 三个浅蓝色按钮
      const buttons = page.locator(".ud03-btn");
      await expect(buttons).toHaveCount(3);
      await expect(buttons.nth(0)).toHaveText("Submit");
      await expect(buttons.nth(1)).toHaveText("Reset");
      await expect(buttons.nth(2)).toHaveText("Help");
      await takeStepScreenshot(page, testName);

      // 5. 支持邮箱常显于底部
      const supportMail = page.locator(".ud03-support-mail");
      await expect(supportMail).toBeVisible();
      await expect(supportMail).toContainText("support.tpi@volvo.com");
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-Loading状态", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Loading状态";

      // 新規ページで再度アクセスし、API応答前にLoading状態を確認
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);

      // API をインターセプトして応答を遅延させる
      await page.route(API_DOC_TYPES, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      // UD03 へ遷移（API応答が遅延するためLoading状態が見える）
      await page.goto(UD03_URL, { waitUntil: "domcontentloaded" });

      // Loading 表示を確認
      const loadingMsg = page.locator(".loading-message");
      await expect(loadingMsg).toBeVisible({ timeout: 3000 });
      await expect(loadingMsg).toHaveText("Loading...");
      await takeStepScreenshot(page, testName);

      // API応答後にフォームが表示されるのを待つ
      await page.waitForSelector(".ud03-form-card", { timeout: 20000 });
      await page.unroute(API_DOC_TYPES);
    });

    test("[3] 画面初始化-Document Type下拉", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Document Type下拉";

      // 実APIから取得したDocument Type下拉列表を確認
      const docTypeSelect = page.locator("#document-type-select");
      await expect(docTypeSelect).toBeVisible();

      // デフォルトで "-- Select --" が表示されていることを確認
      const defaultOption = docTypeSelect.locator("option[value='']");
      await expect(defaultOption).toHaveText("-- Select --");
      await takeStepScreenshot(page, testName);

      // 実APIから取得したオプションが存在することを確認
      const options = docTypeSelect.locator("option:not([value=''])");
      const optionCount = await options.count();
      // APIが返すデータに応じて1つ以上のオプションがあることを確認
      expect(optionCount).toBeGreaterThanOrEqual(1);
      await takeStepScreenshot(page, testName);
    });

    test("[4] 画面初始化-下拉列表加载失败", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-下拉列表加载失败";

      // 新規ページでAPIをモック（エラーを返す）
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);

      // API がエラーを返すようにインターセプト
      await page.route(API_DOC_TYPES, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      await page.goto(UD03_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud03-form-card", { timeout: 20000 });

      // 1. 错误消息表示
      const errorMsg = page.locator(".ud03-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "Failed to load document types. Please refresh.",
      );
      await takeStepScreenshot(page, testName);

      // 2. 下拉列表为空
      const docTypeSelect = page.locator("#document-type-select");
      const options = docTypeSelect.locator("option:not([value=''])");
      await expect(options).toHaveCount(0);
      await takeStepScreenshot(page, testName);

      // 3. フォームは操作可能
      await expect(page.locator("#chassis-series-input")).toBeEnabled();
      await expect(page.locator("#chassis-no-input")).toBeEnabled();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_DOC_TYPES);
    });
  });

  // ==========================================================
  // 2. 入力制限（テストケース 5～8）
  // ==========================================================

  test.describe("入力制限", () => {
    test("[5] Chassis series-半角英数字のみ", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Chassis series-半角英数字のみ";

      const input = page.locator("#chassis-series-input");
      await input.click();
      await input.fill("abc!@#日本語");
      await takeStepScreenshot(page, testName);

      // 符号和全角文字被自动过滤，只显示 abc
      await expect(input).toHaveValue("abc");
      await takeStepScreenshot(page, testName);

      // 无错误消息
      await expect(page.locator(".ud03-error-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[6] Chassis series-MaxLength(5)", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Chassis series-MaxLength(5)";

      const input = page.locator("#chassis-series-input");
      await input.click();
      await input.fill("ABCDEF");
      await takeStepScreenshot(page, testName);

      // HTML maxLength={5} 限制
      await expect(input).toHaveValue("ABCDE");
      await takeStepScreenshot(page, testName);
    });

    test("[7] Chassis no-半角数字のみ", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Chassis no-半角数字のみ";

      const input = page.locator("#chassis-no-input");
      await input.click();
      await input.fill("abc123!@#");
      await takeStepScreenshot(page, testName);

      // 英文字母和符号被自动过滤，只显示 123
      await expect(input).toHaveValue("123");
      await takeStepScreenshot(page, testName);

      // 无错误消息
      await expect(page.locator(".ud03-error-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[8] Chassis no-MaxLength(10)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Chassis no-MaxLength(10)";

      const input = page.locator("#chassis-no-input");
      await input.click();
      await input.fill("12345678901");
      await takeStepScreenshot(page, testName);

      // HTML maxLength={10} 限制
      await expect(input).toHaveValue("1234567890");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 空值校验（テストケース 9～13）
  // ==========================================================

  test.describe("空值校验", () => {
    test("[9] Submit-Chassis系列为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Submit-Chassis系列为空";

      // Chassis series 为空, Chassis no 输入有效值
      const chassisNoInput = page.locator("#chassis-no-input");
      await chassisNoInput.fill("028321");
      await takeStepScreenshot(page, testName);

      // 点击 Submit
      await page.locator(".ud03-btn").first().click();

      // 显示错误消息
      const errorMsg = page.locator(".ud03-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "Chassis series and chassis no are required.",
      );
      await takeStepScreenshot(page, testName);

      // 不跳转页面（仍在 UD03）
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[10] Submit-Chassis编号为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Submit-Chassis编号为空";

      // Chassis series 输入有效值, Chassis no 为空
      const chassisSeriesInput = page.locator("#chassis-series-input");
      await chassisSeriesInput.fill("JPCT");
      await takeStepScreenshot(page, testName);

      // 点击 Submit
      await page.locator(".ud03-btn").first().click();

      // 显示错误消息
      const errorMsg = page.locator(".ud03-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "Chassis series and chassis no are required.",
      );
      await takeStepScreenshot(page, testName);

      // 不跳转页面
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[11] Submit-Document Type未选择", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Submit-Document Type未选择";

      // 输入有效的 Chassis series/no
      await page.locator("#chassis-series-input").fill("JPCT");
      await page.locator("#chassis-no-input").fill("028321");
      await takeStepScreenshot(page, testName);

      // Document type 不选择（默认"-- Select --"）

      // 点击 Submit
      await page.locator(".ud03-btn").first().click();

      // 显示错误消息
      const errorMsg = page.locator(".ud03-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Please select a document type.");
      await takeStepScreenshot(page, testName);

      // 不跳转页面
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[12] Submit-两者为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Submit-两者为空";

      // Chassis series/no 均为空, 直接点击 Submit
      await page.locator(".ud03-btn").first().click();
      await takeStepScreenshot(page, testName);

      // 显示错误消息
      const errorMsg = page.locator(".ud03-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "Chassis series and chassis no are required.",
      );
      await takeStepScreenshot(page, testName);

      // 不跳转页面
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[13] Submit-错误后输入消去", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Submit-错误后输入消去";

      // 先触发空值校验显示错误
      await page.locator(".ud03-btn").first().click();
      const errorMsg = page.locator(".ud03-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      // 修改 Chassis series 输入框内容 → 错误消息自动清空
      await page.locator("#chassis-series-input").fill("JPCT");
      await takeStepScreenshot(page, testName);

      // 错误消息已清空
      await expect(errorMsg).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. Submit成功（テストケース 14～15）
  // ==========================================================

  test.describe("Submit成功", () => {
    test("[14] Submit-正常跳转", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Submit-正常跳转";

      // 输入有效的 Chassis series/no
      await page.locator("#chassis-series-input").fill("wlx1");
      await page.locator("#chassis-no-input").fill("100001");
      await takeStepScreenshot(page, testName);

      // 选择 Document type 为 CERTIFICATE
      const docTypeSelect = page.locator("#document-type-select");
      await docTypeSelect.selectOption("CERTIFICATE");
      await takeStepScreenshot(page, testName);

      // 点击 Submit
      await page.locator(".ud03-btn").first().click();

      // 检索条件保存到 localStorage
      const savedCriteria = await page.evaluate(() =>
        localStorage.getItem("ud03_last_criteria"),
      );
      expect(savedCriteria).not.toBeNull();
      if (savedCriteria) {
        const parsed = JSON.parse(savedCriteria);
        expect(parsed.chassisSeries).toBe("wlx1");
        expect(parsed.chassisNo).toBe("100001");
      }
      await takeStepScreenshot(page, testName);

      // 页面跳转到 /UD04
      await expect(page).toHaveURL(/UD04/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });

    test("[15] Submit-加载中按钮禁用", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Submit-加载中按钮禁用";

      // 入力前に現在の状態を確認
      await page.locator("#chassis-series-input").fill("JPCT");
      await page.locator("#chassis-no-input").fill("028321");

      // 选择 Document type 为 CERTIFICATE
      await page.locator("#document-type-select").selectOption("CERTIFICATE");

      // Submit ボタンをクリック
      await page.locator(".ud03-btn").first().click();

      // Submit 前の状態をスクリーンショット
      await takeStepScreenshot(page, testName);

      // ボタンが "Submitting..." に変わって disabled になるのを確認
      // （即座に navigate が呼ばれるため、ごく短時間しか表示されない可能性あり）
      const submitBtn = page.locator(".ud03-btn").first();
      await expect(page).toHaveURL(/UD04/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 5. Reset按钮（テストケース 16）
  // ==========================================================

  test.describe("Reset按钮", () => {
    test("[16] Reset-清空表单", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Reset-清空表单";

      // 输入各种值
      await page.locator("#chassis-series-input").fill("JPCT");
      await page.locator("#chassis-no-input").fill("028321");

      const docTypeSelect = page.locator("#document-type-select");
      const firstOption = docTypeSelect
        .locator("option:not([value=''])")
        .first();
      const optionValue = await firstOption.getAttribute("value");
      if (optionValue) {
        await docTypeSelect.selectOption(optionValue);
      }

      // 先に Submit ボタンをクリックしてエラーを出さずに localStorage に保存するために、
      // localStorage に直接書き込んでおく
      await page.evaluate(() => {
        localStorage.setItem(
          "ud03_last_criteria",
          JSON.stringify({
            chassisSeries: "JPCT",
            chassisNo: "028321",
            documentType: "VIN-PLATE",
          }),
        );
      });
      await takeStepScreenshot(page, testName);

      // 点击 Reset
      await page.locator(".ud03-btn").nth(1).click();
      await takeStepScreenshot(page, testName);

      // 1. Chassis series 被清空
      await expect(page.locator("#chassis-series-input")).toHaveValue("");
      // 2. Chassis no 被清空
      await expect(page.locator("#chassis-no-input")).toHaveValue("");
      // 3. Document type 重置为 "-- Select --"
      await expect(page.locator("#document-type-select")).toHaveValue("");
      // 4. 错误消息被清除（存在しないこと）
      await expect(page.locator(".ud03-error-message")).toHaveCount(0);
      // 5. localStorage 被清除
      const stored = await page.evaluate(() =>
        localStorage.getItem("ud03_last_criteria"),
      );
      expect(stored).toBeNull();
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 6. Help按钮（テストケース 17）
  // ==========================================================

  test.describe("Help按钮", () => {
    test("[17] Help-弹出帮助画面", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Help-弹出帮助画面";

      // 点击 Help 按钮（第三个）
      await page.locator(".ud03-btn").nth(2).click();
      await takeStepScreenshot(page, testName);

      // 页面跳转到 /UD24
      await expect(page).toHaveURL(/UD24/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 7. 例外处理（テストケース 18～19）
  // ==========================================================

  test.describe("例外处理", () => {
    test("[18] 例外处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "例外处理-网络错误";

      // 入力
      await page.locator("#chassis-series-input").fill("JPCT");
      await page.locator("#chassis-no-input").fill("028321");

      const docTypeSelect = page.locator("#document-type-select");
      const firstOption = docTypeSelect
        .locator("option:not([value=''])")
        .first();
      const optionValue = await firstOption.getAttribute("value");
      if (optionValue) {
        await docTypeSelect.selectOption(optionValue);
      }
      await takeStepScreenshot(page, testName);

      // Submit ボタンをクリック
      // 注: handleSubmit 内の try ブロックでは API 呼び出しがなく、
      // saveSearchCriteria（自前の try/catch あり）と navigate（クライアント側遷移）のみ実行されるため、
      // ネットワーク遮断の有無に関わらず /UD04 へ遷移する
      await page.locator(".ud03-btn").first().click();

      // ページが /UD04 へ遷移することを確認
      await expect(page).toHaveURL(/UD04/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });

    test("[19] 例外处理-会话过期", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "例外处理-会话过期";

      // 清空 localStorage（セッション削除）
      await page.evaluate(() => window.localStorage.clear());
      await takeStepScreenshot(page, testName);

      // 访问 UD03
      await page.goto(UD03_URL, { waitUntil: "networkidle" });

      // getCurrentUser() 返回 null → 自动重定向到 /UD01
      await expect(page).toHaveURL(/UD01/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 8. 安全性（テストケース 20～21）
  // ==========================================================

  test.describe("安全性", () => {
    test("[20] 安全性-无效Token", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-无效Token";

      // localStorage 设置无效/空 token
      await page.evaluate(() => {
        window.localStorage.setItem(
          "user_info",
          JSON.stringify({ userId: "tester", name: "Test User" }),
        );
        window.localStorage.setItem("auth_token", "");
      });
      await takeStepScreenshot(page, testName);

      // 访问 UD03
      await page.goto(UD03_URL, { waitUntil: "networkidle" });

      // auth_token 为空 → 自动重定向到 /UD01
      await expect(page).toHaveURL(/UD01/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });

    test("[21] 安全性-直接URL访问", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-直接URL访问";

      // 清除所有 localStorage
      await page.evaluate(() => window.localStorage.clear());
      await takeStepScreenshot(page, testName);

      // 直接访问 UD03 URL
      await page.goto(UD03_URL, { waitUntil: "networkidle" });

      // 无 user_info → 跳转到 /UD01
      await expect(page).toHaveURL(/UD01/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });
});
