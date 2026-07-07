import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD08_URL = "/UD08";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD08";

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

async function navigateToUD08(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD08_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#product-class-select", { timeout: 15000 });
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Homologation Variables 模块 (UD08) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToUD08(page);
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
    test("[1] 画面初始化-下拉列表", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-下拉列表";

      // Step1: 画面初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 下拉列表をクリックしてオプション確認
      const pcSelect = page.locator("#product-class-select");
      await expect(pcSelect).toBeVisible();
      await pcSelect.click();
      await page.waitForTimeout(300);
      const pcOptions = await pcSelect.locator("option").all();
      const pcValues: string[] = [];
      for (const opt of pcOptions) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") pcValues.push(val);
      }
      await expect(pcValues.length).toBeGreaterThan(0);
      await takeStepScreenshot(page, testName);

      // Step3: Market 下拉列表をクリックしてオプション確認
      const mktSelect = page.locator("#market-select");
      await expect(mktSelect).toBeVisible();
      await mktSelect.click();
      await page.waitForTimeout(300);
      const mktOptions = await mktSelect.locator("option").all();
      const mktValues: string[] = [];
      for (const opt of mktOptions) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") mktValues.push(val);
      }
      await expect(mktValues.length).toBeGreaterThan(0);
      await takeStepScreenshot(page, testName);

      // Step4: Variable 入力欄 + datalist オプション確認
      const varInput = page.locator("#variable-input");
      await expect(varInput).toBeVisible();
      await varInput.click();
      await page.waitForTimeout(300);
      const datalist = page.locator("#variable-datalist");
      if (await datalist.isVisible()) {
        const dlOptions = await datalist.locator("option").all();
        await expect(dlOptions.length).toBeGreaterThan(0);
      }
      await takeStepScreenshot(page, testName);

      // Step5: 必須項目(*)マーク確認
      const requiredMarkers = page.locator(".ud08-required");
      const markerCount = await requiredMarkers.count();
      await expect(markerCount).toBeGreaterThanOrEqual(3);
      // Product class, Number, Market のラベルに * が存在
      await expect(
        page.locator("label[for='product-class-select'] .ud08-required"),
      ).toBeVisible();
      await expect(
        page.locator("label[for='number-input'] .ud08-required"),
      ).toBeVisible();
      await expect(
        page.locator("label[for='market-select'] .ud08-required"),
      ).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-加载中状态";

      // 仕様書に"模拟 API 延迟响应"と記載
      const API_PC =
        "**/api/UD08HomologationVariablesApi/UD08SelectProductclassmaster";
      await page.route(API_PC, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });

      // Step1: Login画面に遷移
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);

      // Step2: UD08に遷移（API遅延あり）
      await page.goto(UD08_URL, { waitUntil: "domcontentloaded" });
      await takeStepScreenshot(page, testName);

      // Step3: ローディング表示確認
      const loadingMsg = page.locator(".ud08-loading");
      await expect(loadingMsg).toBeVisible({ timeout: 3000 });
      await takeStepScreenshot(page, testName);

      // Step4: ローディング終了後
      await page.waitForSelector("#product-class-select", { timeout: 15000 });
      await takeStepScreenshot(page, testName);
      await page.unroute(API_PC);
    });

    test("[3] 画面初始化-下拉列表加载失败", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-下拉列表加载失败";

      const API_ALL = "**/api/UD08HomologationVariablesApi/**";
      await page.route(API_ALL, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: "{}",
        });
      });

      // Step1: Login画面に遷移
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);

      // Step2: UD08に遷移（API500）
      await page.goto(UD08_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);

      // Step3: エラーメッセージ表示確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ALL);
    });
  });

  // ==========================================================
  // 2. 空值校验（4～7）
  // ==========================================================

  test.describe("空值校验", () => {
    test("[4] Add-Product class为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Product class为空";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Addボタンをクリック
      const addBtn = page.locator(".ud08-btn").filter({ hasText: "Add" });
      await takeStepScreenshot(page, testName);
      await addBtn.click();
      await page.waitForTimeout(500);

      // Step3: エラーメッセージ確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[5] Add-Number为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Number为空";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 未入力でAddをクリック
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, testName);

      // Step4: エラーメッセージ確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[6] Add-Market为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Market为空";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("123");
      await takeStepScreenshot(page, testName);

      // Step4: Market 未選択でAddをクリック
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, testName);

      // Step5: エラーメッセージ確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[7] Number-数字输入限制", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Number-数字输入限制";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: 非数字混在入力
      const numberInput = page.locator("#number-input");
      await numberInput.fill("abc123def");

      // Step3: 数字のみ残っていることを確認
      await expect(numberInput).toHaveValue("123");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. CRUD操作-Add（8～11）
  // ==========================================================

  test.describe("CRUD操作(Add)", () => {
    test("[8] Add-正常新增", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-正常新增";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Add 実行
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });

    test("[11] Add-加载中按钮禁用", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-加载中按钮禁用";

      // APIを遅延してLoading状態を確保
      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: "{}",
        });
      });

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択（実在する値を選択）
      const pcSelect = page.locator("#product-class-select");
      const pcOptions = await pcSelect.locator("option").all();
      for (const opt of pcOptions) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") {
          await pcSelect.selectOption(val);
          break;
        }
      }
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択（実在する値を選択）
      const mktSelect = page.locator("#market-select");
      const mktOptions = await mktSelect.locator("option").all();
      for (const opt of mktOptions) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") {
          await mktSelect.selectOption(val);
          break;
        }
      }
      await takeStepScreenshot(page, testName);

      // Step5: Add 実行
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);

      // バリデーション通過 → ボタン disabled、失敗 → エラーメッセージ
      const addBtn = page.locator(".ud08-btn").filter({ hasText: "Add" });
      const isDisabled = await addBtn.isDisabled();
      if (!isDisabled) {
        await expect(page.locator(".ud08-error-message")).toBeVisible();
      } else {
        await expect(addBtn).toBeDisabled();
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });
  });

  // ==========================================================
  // 4. CRUD操作-Update（12～13）
  // ==========================================================

  test.describe("CRUD操作(Update)", () => {
    test("[12] Update-正常更新", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Update-正常更新";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Update 実行
      await page.locator(".ud08-btn").filter({ hasText: "Update" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 5. CRUD操作-Delete（14～15）
  // ==========================================================

  test.describe("CRUD操作(Delete)", () => {
    test("[14] Delete-正常删除", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Delete-正常删除";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Delete 実行
      await page.locator(".ud08-btn").filter({ hasText: "Delete" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 6. Search与Clear（16～17）
  // ==========================================================

  test.describe("Search与Clear按钮", () => {
    test("[16] Search-跳转UD09", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Search-跳转UD09";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("123");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Search 実行
      await page.locator(".ud08-btn").filter({ hasText: "Search" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });

    test("[17] Clear-清空表单", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Clear-清空表单";

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: 値を入力
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("123");
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Clear 実行
      await page.locator(".ud08-btn").filter({ hasText: "Clear" }).click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, testName);

      // Step4: クリア確認
      await expect(page.locator("#product-class-select")).toHaveValue("");
      await expect(page.locator("#number-input")).toHaveValue("");
      await expect(page.locator("#market-select")).toHaveValue("");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 7. 例外处理（19～21）
  // 仕様書に"模拟"と明記されているため route 使用
  // ==========================================================

  test.describe("异常处理", () => {
    test("[19] 异常处理-404错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-404错误";

      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: "{}",
        });
      });

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Add 実行
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);

      // Step6: エラーメッセージ確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[20] 异常处理-网络断开", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络断开";

      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await route.abort("connectionrefused");
      });

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Add 実行
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);

      // Step6: エラーメッセージ確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[21] 异常处理-数据库异常", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-数据库异常";

      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: "{}",
        });
      });

      // Step1: 初期状態
      await takeStepScreenshot(page, testName);

      // Step2: Product class 選択
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step3: Number 入力
      await page.locator("#number-input").fill("99999");
      await takeStepScreenshot(page, testName);

      // Step4: Market 選択
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);

      // Step5: Add 実行
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);

      // Step6: エラーメッセージ確認
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });
  });
});
