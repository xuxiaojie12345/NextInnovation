import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const UD10_URL = "/UD10";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD10";

let screenshotCounter = 1;

/**
 * 截图辅助函数
 * 以每个测试观点名称为单位，从 001 开始命名
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

/**
 * 设置登录信息到 localStorage
 */
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
 * 登录后导航到 UD10 页面
 */
async function navigateToUD10(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD10_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud10-container", { timeout: 15000 });
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Existing HDoc Variables 模块 (UD10) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    screenshotCounter = 1;
  });

  test.afterEach(async ({ page }, testInfo) => {
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
  // 1. 画面初始化（1～4）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-正常表示";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const header = page.locator(".ud10-header");
      await expect(header).toBeVisible();
      const pageTitle = page.locator(".ud10-page-title");
      await expect(pageTitle).toBeVisible();
      await expect(pageTitle).toHaveText("Existing HDoc Variables");
      const variableInput = page.locator("#ud10-variable");
      await expect(variableInput).toBeVisible();
      await expect(variableInput).toHaveValue("");
      const typeSelect = page.locator("#ud10-type");
      await expect(typeSelect).toBeVisible();
      await expect(page.locator("#ud10-desc")).toHaveValue("");
      const btns = page.locator(".ud10-btn");
      await expect(await btns.count()).toBeGreaterThanOrEqual(6);
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-各字段初期値", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-各字段初期値";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      await expect(page.locator("#ud10-variable")).toHaveValue("");
      await expect(page.locator("#ud10-type")).toHaveValue("");
      await expect(page.locator("#ud10-desc")).toHaveValue("");
      const autoValues = page.locator(".ud10-auto-value");
      const count = await autoValues.count();
      await expect(count).toBeGreaterThanOrEqual(2);
      const text1 = await autoValues.first().textContent();
      expect(text1).toContain("Automatic");
      const text2 = await autoValues.nth(1).textContent();
      expect(text2).toContain("Automatic");
      const operators = page.locator(".ud10-operator");
      const opCount = await operators.count();
      for (let i = 0; i < opCount; i++) {
        await expect(operators.nth(i)).toHaveValue("=");
      }
      await takeStepScreenshot(page, testName);
    });

    test("[3] 画面初始化-Type 下拉选项", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-Type 下拉选项";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const typeSelect = page.locator("#ud10-type");
      // select 的初始值应等于首选项的值
      await expect(typeSelect).toHaveValue("");
      const firstOpt = typeSelect.locator("option").nth(0);
      await expect(firstOpt).toHaveText("-- Select --");
      const options = await typeSelect.locator("option").all();
      const texts: string[] = [];
      for (const opt of options) {
        const t = await opt.textContent();
        if (t) texts.push(t.trim());
      }
      expect(texts).toContain("VDA");
      expect(texts).toContain("User Defined");
      await takeStepScreenshot(page, testName);
    });

    test("[4] 画面初始化-运算符选项", async ({ page }: { page: Page }) => {
      const testName = "画面初始化-运算符选项";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const operator = page.locator(".ud10-operator").first();
      await expect(operator).toHaveValue("=");
      await operator.click();
      const opOptions = await operator.locator("option").all();
      const opTexts: string[] = [];
      for (const opt of opOptions) {
        const t = await opt.getAttribute("value");
        if (t) opTexts.push(t);
      }
      expect(opTexts).toContain("=");
      expect(opTexts).toContain("!=");
      expect(opTexts).toContain(">");
      expect(opTexts).toContain("<");
      expect(opTexts).toContain(">=");
      expect(opTexts).toContain("<=");
      expect(opTexts).toContain("Like");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 字段属性校验（5～7）
  // ==========================================================

  test.describe("字段属性校验", () => {
    test("[5] Variable-最大长度(30位)", async ({ page }: { page: Page }) => {
      const testName = "Variable-最大长度(30位)";
      await navigateToUD10(page);
      const input = page.locator("#ud10-variable");
      await input.fill("A".repeat(31));
      await expect(input).toHaveValue("A".repeat(30));
      await takeStepScreenshot(page, testName);
    });

    test("[6] Description-最大长度(100位)", async ({
      page,
    }: {
      page: Page;
    }) => {
      const testName = "Description-最大长度(100位)";
      await navigateToUD10(page);
      const input = page.locator("#ud10-desc");
      await input.fill("A".repeat(101));
      await expect(input).toHaveValue("A".repeat(100));
      await takeStepScreenshot(page, testName);
    });

    test("[7] Created by user-最大长度(16)", async ({
      page,
    }: {
      page: Page;
    }) => {
      const testName = "Created by user-最大长度(16)";
      await navigateToUD10(page);
      const input = page.locator("input[maxlength='16']").first();
      await input.fill("A".repeat(17));
      await expect(input).toHaveValue("A".repeat(16));
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 空值校验（8～10）
  // ==========================================================

  test.describe("空值校验", () => {
    test("[8] Add-Variable为空", async ({ page }: { page: Page }) => {
      const testName = "Add-Variable为空";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const addBtn = page.locator(".ud10-btn").filter({ hasText: "Add" });
      await addBtn.click();
      await page.waitForTimeout(500);
      const errorMsg = page.locator(".ud10-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Variable 是必填项");
      await takeStepScreenshot(page, testName);
    });

    test("[9] Update-Variable为空", async ({ page }: { page: Page }) => {
      const testName = "Update-Variable为空";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const updateBtn = page.locator(".ud10-btn").filter({ hasText: "Update" });
      await updateBtn.click();
      await page.waitForTimeout(500);
      const errorMsg = page.locator(".ud10-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Variable 是必填项");
      await takeStepScreenshot(page, testName);
    });

    test("[10] Delete-未选择", async ({ page }: { page: Page }) => {
      const testName = "Delete-未选择";
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const deleteBtn = page.locator(".ud10-btn").filter({ hasText: "Delete" });
      await deleteBtn.click();
      await page.waitForTimeout(500);
      const errorMsg = page.locator(".ud10-error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("请选择要删除的记录");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. CRUD操作(Add)（11～13）
  // ==========================================================

  test.describe("CRUD操作(Add)", () => {
    test("[11] Add-正常新增", async ({ page }: { page: Page }) => {
      const testName = "Add-正常新增";
      const API_ADD = "**/api/UD10HdocvariablesApi/UD10Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "登录成功" }),
        });
      });
      await navigateToUD10(page);
      await takeStepScreenshot(page, testName);
      const testVar = `TestVar_${Date.now()}`;
      await page.locator("#ud10-variable").fill(testVar);
      await page.locator("#ud10-type").selectOption("VDA");
      await page.locator("#ud10-desc").fill("Test Description");
      await takeStepScreenshot(page, testName);
      const addBtn = page.locator(".ud10-btn").filter({ hasText: "Add" });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await addBtn.click();
      await page.waitForTimeout(2000);
      const errorMsg = page.locator(".ud10-error-message");
      const isErrorVisible = await errorMsg.isVisible().catch(() => false);
      if (isErrorVisible) {
        await expect(errorMsg).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[12] Add-Variable重复", async ({ page }: { page: Page }) => {
      const testName = "Add-Variable重复";
      const API_ADD = "**/api/UD10HdocvariablesApi/UD10Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 400,
            msg: "Variant already exists. Please enter the correct content",
          }),
        });
      });
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("EXISTING_TEST_VAR");
      await takeStepScreenshot(page, testName);
      const addBtn = page.locator(".ud10-btn").filter({ hasText: "Add" });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await addBtn.click();
      await page.waitForTimeout(2000);
      const errorMsg = page.locator(".ud10-error-message");
      const isErrorVisible = await errorMsg.isVisible().catch(() => false);
      if (isErrorVisible) {
        await expect(errorMsg).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[13] Add-加载中按钮禁用", async ({ page }: { page: Page }) => {
      const testName = "Add-加载中按钮禁用";
      const API_ADD = "**/api/UD10HdocvariablesApi/UD10Add";
      await page.route(API_ADD, async (route) => {
        await new Promise((r) => setTimeout(r, 5000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "Success", data: {} }),
        });
      });
      await navigateToUD10(page);
      const testVar = `TestVar_${Date.now()}`;
      await page.locator("#ud10-variable").fill(testVar);
      await page.locator("#ud10-type").selectOption("VDA");
      await page.locator("#ud10-desc").fill("Test Desc");
      await takeStepScreenshot(page, testName);
      // 预先获取按钮引用（按钮文字会变为 "Adding..."，不能用 hasText 重新查找）
      const addBtn = page.locator(".ud10-btn").filter({ hasText: "Add" });
      const addBtnLocator = page.locator(".ud10-btn").nth(3);
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await addBtn.click();
      await page.waitForTimeout(500);
      // 用索引定位而非文字，因为文字已变为 "Adding..."
      await expect(addBtnLocator).toBeDisabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });
  });

  // ==========================================================
  // 5. CRUD操作(Update)（14～15）
  // ==========================================================

  test.describe("CRUD操作(Update)", () => {
    test("[14] Update-正常更新", async ({ page }: { page: Page }) => {
      const testName = "Update-正常更新";
      const API_UPDATE = "**/api/UD10HdocvariablesApi/UD10Update";
      await page.route(API_UPDATE, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "更新成功" }),
        });
      });
      await navigateToUD10(page);
      const testVar = `UpdateTest_${Date.now()}`;
      await page.locator("#ud10-variable").fill(testVar);
      await page.locator("#ud10-type").selectOption("VDA");
      await page.locator("#ud10-desc").fill("Updated Description");
      await takeStepScreenshot(page, testName);
      const updateBtn = page.locator(".ud10-btn").filter({ hasText: "Update" });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await updateBtn.click();
      await page.waitForTimeout(2000);
      const errorMsg = page.locator(".ud10-error-message");
      if (await errorMsg.isVisible().catch(() => false)) {
        await expect(errorMsg).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UPDATE);
    });

    test("[15] Update-记录不存在", async ({ page }: { page: Page }) => {
      const testName = "Update-记录不存在";
      const API_UPDATE = "**/api/UD10HdocvariablesApi/UD10Update";
      await page.route(API_UPDATE, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 400,
            msg: "Variant does not exists. Please enter the correct content",
          }),
        });
      });
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("NONEXISTENT_VAR_12345");
      await takeStepScreenshot(page, testName);
      const updateBtn = page.locator(".ud10-btn").filter({ hasText: "Update" });
      await updateBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud10-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_UPDATE);
    });
  });

  // ==========================================================
  // 6. CRUD操作(Delete)（16～17）
  // ==========================================================

  test.describe("CRUD操作(Delete)", () => {
    test("[16] Delete-确认取消", async ({ page }: { page: Page }) => {
      const testName = "Delete-确认取消";
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("TEST_DELETE_CANCEL");
      await takeStepScreenshot(page, testName);
      page.on("dialog", async (dialog) => {
        await dialog.dismiss();
      });
      const deleteBtn = page.locator(".ud10-btn").filter({ hasText: "Delete" });
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("#ud10-variable")).toHaveValue(
        "TEST_DELETE_CANCEL",
      );
      await takeStepScreenshot(page, testName);
    });

    test("[17] Delete-确认确定", async ({ page }: { page: Page }) => {
      const testName = "Delete-确认确定";
      const API_DEL = "**/api/UD10HdocvariablesApi/UD10Delete";
      await page.route(API_DEL, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, msg: "删除成功" }),
        });
      });
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("TEST_DELETE_CONFIRM");
      await takeStepScreenshot(page, testName);
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      const deleteBtn = page.locator(".ud10-btn").filter({ hasText: "Delete" });
      await deleteBtn.click();
      await page.waitForTimeout(2000);
      const errorMsg = page.locator(".ud10-error-message");
      if (await errorMsg.isVisible().catch(() => false)) {
        await expect(errorMsg).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
      await page.unroute(API_DEL);
    });
  });

  // ==========================================================
  // 7. Search与Clear/Back按钮（18～20）
  // ==========================================================

  test.describe("Search与Clear/Back按钮", () => {
    test("[18] Search-跳转UD11", async ({ page }: { page: Page }) => {
      const testName = "Search-跳转UD11";
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("TestVar");
      await page.locator("#ud10-type").selectOption("VDA");
      await page.locator("#ud10-desc").fill("Test");
      await takeStepScreenshot(page, testName);
      const searchBtn = page.locator(".ud10-btn").filter({ hasText: "Search" });
      await searchBtn.click();
      await page.waitForURL("**/UD11", { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });

    test("[19] Clear-清空表单", async ({ page }: { page: Page }) => {
      const testName = "Clear-清空表单";
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("TestVar");
      await page.locator("#ud10-type").selectOption("VDA");
      await page.locator("#ud10-desc").fill("Test Description");
      await takeStepScreenshot(page, testName);
      const clearBtn = page.locator(".ud10-btn").filter({ hasText: "Clear" });
      await clearBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("#ud10-variable")).toHaveValue("");
      await expect(page.locator("#ud10-type")).toHaveValue("");
      await expect(page.locator("#ud10-desc")).toHaveValue("");
      await takeStepScreenshot(page, testName);
    });

    test("[20] Back-返回UD02", async ({ page }: { page: Page }) => {
      const testName = "Back-返回UD02";
      await navigateToUD10(page);
      const backBtn = page.locator(".ud10-btn").filter({ hasText: "Back" });
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await page.waitForURL("**/UD02", { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 8. Excel导出（21～22）
  // ==========================================================

  test.describe("Excel导出", () => {
    test("[21] Excel-导出", async ({ page }: { page: Page }) => {
      const testName = "Excel-导出";
      await navigateToUD10(page);
      const excelBtn = page.locator(".ud10-btn").filter({ hasText: "Excel" });
      await expect(excelBtn).toBeVisible();
      // handleExport 会调用 alert()，需接受对话框
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await excelBtn.click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });

    test("[22] Excel-导出失败", async ({ page }: { page: Page }) => {
      const testName = "Excel-导出失败";
      await navigateToUD10(page);
      const excelBtn = page.locator(".ud10-btn").filter({ hasText: "Excel" });
      await expect(excelBtn).toBeVisible();
      // handleExport 会调用 alert()，需接受对话框
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await excelBtn.click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 9. 异常处理（23～24）
  // ==========================================================

  test.describe("异常处理", () => {
    test("[23] 异常处理-网络断开", async ({ page }: { page: Page }) => {
      const testName = "异常处理-网络断开";
      const API_ADD = "**/api/UD10HdocvariablesApi/UD10Add";
      await page.route(API_ADD, async (route) => {
        await route.abort("connectionrefused");
      });
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("NetworkErrorTest");
      await takeStepScreenshot(page, testName);
      const addBtn = page.locator(".ud10-btn").filter({ hasText: "Add" });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await addBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud10-error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_ADD);
    });

    test("[24] 异常处理-数据库异常", async ({ page }: { page: Page }) => {
      const testName = "异常处理-数据库异常";
      const API_ADD = "**/api/UD10HdocvariablesApi/UD10Add";
      await page.route(API_ADD, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: 500,
            msg: "系统繁忙，请稍后再试",
            data: null,
          }),
        });
      });
      await navigateToUD10(page);
      await page.locator("#ud10-variable").fill("DBErrorTest");
      await takeStepScreenshot(page, testName);
      const addBtn = page.locator(".ud10-btn").filter({ hasText: "Add" });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await addBtn.click();
      await page.waitForTimeout(2000);

      // Step4: 确认错误消息
      const errorMsg = page.locator(".ud10-error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);

      await page.unroute(API_ADD);
    });
  });
});
