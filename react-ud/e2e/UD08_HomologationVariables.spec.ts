import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD08_URL = "/UD08";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD08";

let screenshotCounter = 1;

/**
 * 撮影前にディレクトリを確実に作成してからスクリーンショットを保存
 */
async function takeStepScreenshot(page: Page, testName: string) {
  const dir = path.join(IMAGE_DIR, testName);
  fs.mkdirSync(dir, { recursive: true });
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: path.join(dir, filename),
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
  // Mock 下拉列表 API，确保测试不依赖后端数据
  await page.route("**/UD08SelectProductclassmaster", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        data: [{ pc: "PC01", description: "Product Class 1" }],
      }),
    });
  });
  await page.route("**/UD08SelectMarketmaster", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        data: [{ market: "JP", marketDescription: "Japan" }],
      }),
    });
  });
  await page.route("**/UD08SelectHdocvariables", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        data: [{ variable: "VAR1", description: "Variable 1" }],
      }),
    });
  });
  await page.goto(UD08_URL, { waitUntil: "domcontentloaded" });
  // 等待 React 渲染完成
  await page.waitForLoadState("networkidle");
  // 等待 select 元素出现在 DOM 中
  await page.locator("#product-class-select").waitFor({
    state: "attached",
    timeout: 20000,
  });
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Homologation Variables 模块 (UD08) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToUD08(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.unroute();
    if (testInfo.status !== "passed") {
      const failedDir = path.join(IMAGE_DIR, "_FAILED_");
      fs.mkdirSync(failedDir, { recursive: true });
      const failedName = testInfo.title.replace(
        /[\[\]\\\/\:\*\?\"\<\>\|]/g,
        "_",
      );
      await page.screenshot({
        path: path.join(failedDir, `${failedName}.jpg`),
        type: "jpeg",
        quality: 85,
        fullPage: true,
      });
    }
  });

  // ==========================================================
  // 1. 画面初始化（1～11）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-下拉列表", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-下拉列表";
      await takeStepScreenshot(page, testName);

      const pcSelect = page.locator("#product-class-select");
      await expect(pcSelect).toBeVisible();
      const pcOptions = await pcSelect.locator("option").all();
      const pcValues: string[] = [];
      for (const opt of pcOptions) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") pcValues.push(val);
      }
      await expect(pcValues.length).toBeGreaterThan(0);
      await takeStepScreenshot(page, testName);

      const mktSelect = page.locator("#market-select");
      await expect(mktSelect).toBeVisible();
      const mktOptions = await mktSelect.locator("option").all();
      const mktValues: string[] = [];
      for (const opt of mktOptions) {
        const val = await opt.getAttribute("value");
        if (val && val !== "") mktValues.push(val);
      }
      await expect(mktValues.length).toBeGreaterThan(0);
      await takeStepScreenshot(page, testName);

      const requiredMarkers = page.locator(".ud08-required");
      await expect(requiredMarkers.count()).resolves.toBeGreaterThanOrEqual(3);
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-加载中状态", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-加载中状态";
      const API_PC =
        "**/api/UD08HomologationVariablesApi/UD08SelectProductclassmaster";
      await page.route(API_PC, async (route) => {
        // 确保 loading 状态在断言检查时仍然可见
        await new Promise((r) => setTimeout(r, 5000));
        // fallback 将请求传递给下一个匹配的路由处理（beforeEach 的 mock）
        await route.fallback();
      });
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD08_URL, { waitUntil: "domcontentloaded" });
      await takeStepScreenshot(page, testName);
      const loadingMsg = page.locator(".ud08-loading");
      await expect(loadingMsg).toBeVisible({ timeout: 3000 });
      await takeStepScreenshot(page, testName);
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
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD08_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);
      const errorMsg = page.locator(".ud08-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ALL);
    });

    test("[4] 画面初始化-各字段初期値（空）", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-各字段初期値（空）";
      await takeStepScreenshot(page, testName);
      await expect(page.locator("#product-class-select")).toHaveValue("");
      await expect(page.locator("#number-input")).toHaveValue("");
      await expect(page.locator("#market-select")).toHaveValue("");
      await expect(page.locator("#variable-input")).toHaveValue("");
      await expect(page.locator("#value-input")).toHaveValue("");
      await expect(page.locator("#variant-string1-input")).toHaveValue("");
      await expect(page.locator("#variant-string2-input")).toHaveValue("");
      await expect(page.locator("#comments-input")).toHaveValue("");
      await takeStepScreenshot(page, testName);
    });

    test('[5] 画面初始化-运算符初期値（"="）', async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-运算符初期値";
      const operators = page.locator(".ud08-operator");
      const count = await operators.count();
      await expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect(operators.nth(i)).toHaveValue("=");
      }
      await takeStepScreenshot(page, testName);
    });

    test("[6] 画面初始化-Product class 下拉选项", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Product class 下拉选项";
      const pcSelect = page.locator("#product-class-select");
      // select 的 value 应等于首选项的值
      await expect(pcSelect).toHaveValue("");
      const firstOpt = pcSelect.locator("option").nth(0);
      await expect(firstOpt).toHaveText("-- Select --");
      await takeStepScreenshot(page, testName);
    });

    test("[7] 画面初始化-Market 下拉选项", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Market 下拉选项";
      const mktSelect = page.locator("#market-select");
      const firstOpt = mktSelect.locator("option").nth(0);
      await expect(firstOpt).toHaveAttribute("value", "");
      await expect(firstOpt).toHaveText("-- Select --");
      await takeStepScreenshot(page, testName);
    });

    test("[8] 画面初始化-Created by user 初期値", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Created by user 初期値";
      const inputs = page.locator("input.ud08-input");
      // Created by user 是第3个短输入框, 通过 placeholder 定位
      const createdByInput = page.locator("input[maxlength='16']").first();
      await expect(createdByInput).not.toHaveValue("");
      await takeStepScreenshot(page, testName);
      const autoVal = page.locator(".ud08-auto-value");
      await expect(autoVal.first()).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[9] 画面初始化-Date 初期値", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Date 初期値";
      const dateInput = page.locator("input.ud08-input").last();
      await expect(dateInput).not.toHaveValue("");
      await takeStepScreenshot(page, testName);
      const autoVal = page.locator(".ud08-auto-value");
      const count = await autoVal.count();
      await expect(autoVal.nth(count - 1)).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[10] 画面初始化-Add 提示文字", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Add 提示文字";
      const addHint = page.locator(".ud08-auto-value").first();
      await expect(addHint).toBeVisible();
      await expect(addHint).toHaveText("YYYYWW");
      await takeStepScreenshot(page, testName);
    });

    test("[11] 画面初始化-Delete 提示文字", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Delete 提示文字";
      const delHint = page.locator(".ud08-auto-value").nth(1);
      await expect(delHint).toBeVisible();
      await expect(delHint).toHaveText("YYYYWW");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 字段属性校验（12～22）
  // ==========================================================

  test.describe("字段属性校验", () => {
    test("[12] Number-最大长度(10位)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Number-最大长度(10位)";
      const input = page.locator("#number-input");
      await input.fill("12345678901");
      await expect(input).toHaveValue("1234567890");
      await takeStepScreenshot(page, testName);
    });

    test("[13] Number-数字输入限制", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Number-数字输入限制";
      await page.locator("#number-input").fill("abc123def");
      await expect(page.locator("#number-input")).toHaveValue("123");
      await takeStepScreenshot(page, testName);
    });

    test("[14] Number-边界值（空值）", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Number-边界值（空值）";
      await page.locator("#number-input").fill("");
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[15] Variable-最大长度(20位)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Variable-最大长度(20位)";
      const input = page.locator("#variable-input");
      await input.fill("A".repeat(21));
      await expect(input).toHaveValue("A".repeat(20));
      await takeStepScreenshot(page, testName);
    });

    test("[16] Value-最大长度(200位)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Value-最大长度(200位)";
      const input = page.locator("#value-input");
      await input.fill("A".repeat(201));
      await expect(input).toHaveValue("A".repeat(200));
      await takeStepScreenshot(page, testName);
    });

    test("[17] Variant string.1-最大长度(100)", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Variant string.1-最大长度(100)";
      const input = page.locator("#variant-string1-input");
      await input.fill("A".repeat(101));
      await expect(input).toHaveValue("A".repeat(100));
      await takeStepScreenshot(page, testName);
    });

    test("[18] Variant string.2-最大长度(100)", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Variant string.2-最大长度(100)";
      const input = page.locator("#variant-string2-input");
      await input.fill("A".repeat(101));
      await expect(input).toHaveValue("A".repeat(100));
      await takeStepScreenshot(page, testName);
    });

    test("[19] Comments-最大长度(100)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Comments-最大长度(100)";
      const input = page.locator("#comments-input");
      await input.fill("A".repeat(101));
      await expect(input).toHaveValue("A".repeat(100));
      await takeStepScreenshot(page, testName);
    });

    test("[20] Add-最大长度(6位)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-最大长度(6位)";
      const input = page.locator("input[maxlength='6']").first();
      await input.fill("1234567");
      await expect(input).toHaveValue("123456");
      await takeStepScreenshot(page, testName);
    });

    test("[21] Delete-最大长度(6位)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Delete-最大长度(6位)";
      const input = page.locator("input[maxlength='6']").nth(1);
      await input.fill("1234567");
      await expect(input).toHaveValue("123456");
      await takeStepScreenshot(page, testName);
    });

    test("[22] Created by user-最大长度(16)", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Created by user-最大长度(16)";
      const input = page.locator("input[maxlength='16']").first();
      await input.fill("A".repeat(17));
      await expect(input).toHaveValue("A".repeat(16));
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 空值校验（23～25）
  // ==========================================================

  test.describe("空值校验", () => {
    test("[23] Add-Product class为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Product class为空";
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[24] Add-Number为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Number为空";
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[25] Add-Market为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Market为空";
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("123");
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. CRUD操作-Add（26～29）
  // ==========================================================

  test.describe("CRUD操作(Add)", () => {
    test("[26] Add-正常新增", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-正常新增";
      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "登录成功" }),
        });
      });
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[27] Add-主键冲突", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-主键冲突";
      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ code: 409, msg: "Primary key conflict" }),
        });
      });
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[28] Add-Variable不存在", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-Variable不存在";
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator("#variable-input").fill("NONEXISTENT_VAR");
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[29] Add-加载中按钮禁用", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Add-加载中按钮禁用";
      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: "{}",
        });
      });
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(500);
      await expect(
        page.locator(".ud08-btn").filter({ hasText: "Add" }),
      ).toBeDisabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });
  });

  // ==========================================================
  // 5. CRUD操作-Update（30～31）
  // ==========================================================

  test.describe("CRUD操作(Update)", () => {
    test("[30] Update-正常更新", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Update-正常更新";
      const API_UPDATE = "**/api/UD08HomologationVariablesApi/UD08Update";
      await page.route(API_UPDATE, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "更新成功" }),
        });
      });
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Update" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UPDATE);
    });

    test("[31] Update-记录不存在", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Update-记录不存在";
      const API_UPDATE = "**/api/UD08HomologationVariablesApi/UD08Update";
      await page.route(API_UPDATE, async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: "{}",
        });
      });
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("00000");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Update" }).click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UPDATE);
    });
  });

  // ==========================================================
  // 6. CRUD操作-Delete（32～33）
  // ==========================================================

  test.describe("CRUD操作(Delete)", () => {
    test("[32] Delete-正常删除", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Delete-正常删除";
      const API_DEL = "**/api/UD08HomologationVariablesApi/UD08Delete";
      await page.route(API_DEL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "删除成功" }),
        });
      });
      // 确认对话框需要接受才能继续删除操作
      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Delete" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
      await page.unroute(API_DEL);
    });

    test("[33] Delete-记录不存在", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Delete-记录不存在";
      const API_DEL = "**/api/UD08HomologationVariablesApi/UD08Delete";
      await page.route(API_DEL, async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: "{}",
        });
      });
      // 确认对话框需要接受才能继续删除操作
      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("00000");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Delete" }).click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_DEL);
    });
  });

  // ==========================================================
  // 7. Search与Clear（34～35）
  // ==========================================================

  test.describe("Search与Clear按钮", () => {
    test("[34] Search-跳转UD09", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Search-跳转UD09";
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("123");
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Search" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });

    test("[35] Clear-清空表单", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Clear-清空表单";
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("123");
      await page.locator("#market-select").selectOption({ index: 1 });
      await takeStepScreenshot(page, testName);
      await page.locator(".ud08-btn").filter({ hasText: "Clear" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator("#product-class-select")).toHaveValue("");
      await expect(page.locator("#number-input")).toHaveValue("");
      await expect(page.locator("#market-select")).toHaveValue("");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 8. UD09选择返回（36）
  // ==========================================================

  test.describe("UD09选择返回", () => {
    test("[36] UD09选择返回-数据回填", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UD09选择返回-数据回填";
      // 模拟从UD09返回携带数据
      const mockRecord = {
        productClass: "PC01",
        number: "12345",
        market: "JPN",
        variable: "TEST_VAR",
        value: "100",
        variantString: "VS1",
        comments: "test",
        addDate: "2026-01",
        deleteDate: "",
        createdByUser: "tester",
        date: "2026-07-17 12:00",
      };
      await page.evaluate((data) => {
        window.history.replaceState(
          { selectedRecords: [data] },
          document.title,
        );
      }, mockRecord);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector("#product-class-select", { timeout: 15000 });
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 9. 异常处理（37～39）
  // ==========================================================

  test.describe("异常处理", () => {
    test("[37] 异常处理-404错误", async ({ page }: { page: Page }) => {
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
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[38] 异常处理-网络断开", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络断开";
      const API_ADD = "**/api/UD08HomologationVariablesApi/UD08Add";
      await page.route(API_ADD, async (route) => {
        await route.abort("connectionrefused");
      });
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[39] 异常处理-数据库异常", async ({ page }: { page: Page }) => {
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
      await page.locator("#product-class-select").selectOption({ index: 1 });
      await page.locator("#number-input").fill("99999");
      await page.locator("#market-select").selectOption({ index: 1 });
      await page.locator(".ud08-btn").filter({ hasText: "Add" }).click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".ud08-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });
  });
});
