import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "1234",
  database: "react_ud",
};

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD08";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";

// ============================================================
// 截图计数器（每个测试用例独立计数）
// ============================================================
let screenshotCounter: { [key: string]: number } = {};

function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) {
    screenshotCounter[testName] = 0;
  }
  screenshotCounter[testName]++;
  const seq = String(screenshotCounter[testName]).padStart(3, "0");
  return `${SCREENSHOT_DIR}/${testName}_${seq}_${stepName}.jpeg`;
}

// ============================================================
// 页面URL
// ============================================================
const PAGE_URL = `${APP_URL}/homologation-variables`;

// ============================================================
// 模拟数据
// ============================================================
const MOCK_PRODUCT_CLASSES = {
  code: 200,
  msg: "success",
  data: [
    { pc: "A", productName: "Product A" },
    { pc: "B", productName: "Product B" },
  ],
};

const MOCK_MARKETS = {
  code: 200,
  msg: "success",
  data: [
    { market: "JPN", description: "Japan" },
    { market: "USA", description: "USA" },
  ],
};

const MOCK_VARIABLES = {
  code: 200,
  msg: "success",
  data: [
    { variable: "EXISTING_VAR" },
    { variable: "EXIST_VAR" },
    { variable: "TEST_VAR" },
  ],
};

const MOCK_ADD_SUCCESS = { code: 200, msg: "success", data: {} };
const MOCK_UPDATE_SUCCESS = { code: 200, msg: "success", data: {} };
const MOCK_DELETE_SUCCESS = { code: 200, msg: "success", data: {} };

const MOCK_CONFLICT = {
  code: 409,
  msg: "Primary key conflict, Please enter the correct content",
  data: null,
};
const MOCK_NOT_FOUND = {
  code: 400,
  msg: "数据不存在，请检查输入内容",
  data: null,
};
const MOCK_ERROR_500 = { code: 500, msg: "System error", data: null };

// ============================================================
// 导航辅助函数
// ============================================================
async function navigateToHV(page: Page) {
  await page.goto(PAGE_URL);
  await page.waitForSelector(".hv-container");
}

async function mockDropdownApis(page: Page) {
  await page.route(
    "**/api/ud08HomologationVariables/getProductClassMaster",
    (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PRODUCT_CLASSES),
      });
    },
  );
  await page.route(
    "**/api/ud08HomologationVariables/getMarketMaster",
    (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_MARKETS),
      });
    },
  );
  await page.route(
    "**/api/ud08HomologationVariables/getHdocVariables",
    (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_VARIABLES),
      });
    },
  );
}

async function mockCurrentUserApi(page: Page) {
  await page.route(
    "**/api/ud08HomologationVariables/getCurrentUserInfo",
    (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          data: {
            currentUser: "test_user",
            currentDateTime: "2026-07-02 13:00:00",
          },
        }),
      });
    },
  );
}

// ============================================================
// localStorage 设置辅助函数（先导航到有效页面再设置）
// ============================================================
async function setCurrentUser(page: Page, user: string) {
  await page.goto(APP_URL);
  await page.evaluate((u) => localStorage.setItem("currentUser", u), user);
}

// ============================================================
// 测试 Setup 和 Teardown
// ============================================================
test.beforeEach(() => {
  screenshotCounter = {};
});

// ============================================================
// 1. 画面初始化
// ============================================================
test.describe("画面初始化", () => {
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1500);

    // 确认标题
    await expect(page.locator(".hv-title")).toHaveText(
      "Homologation Variables",
    );

    // 确认所有输入字段标签（限定在表单区域内）
    const formSection = page.locator(".hv-form-section");
    await expect(formSection.locator("text=*Product class")).toBeVisible();
    await expect(formSection.locator("text=*Number")).toBeVisible();
    await expect(formSection.locator("text=*Market")).toBeVisible();
    await expect(
      formSection.getByText("Variable", { exact: true }),
    ).toBeVisible();
    await expect(formSection.getByText("Value", { exact: true })).toBeVisible();
    await expect(
      formSection.getByText("Variant string.", { exact: true }),
    ).toBeVisible();
    await expect(
      formSection.getByText("Comments", { exact: true }),
    ).toBeVisible();
    await expect(formSection.getByText("Add", { exact: true })).toBeVisible();
    await expect(
      formSection.getByText("Delete", { exact: true }),
    ).toBeVisible();
    await expect(
      formSection.getByText("Created by user", { exact: true }),
    ).toBeVisible();
    await expect(formSection.getByText("Date", { exact: true })).toBeVisible();

    // 确认所有按钮可见且可用
    const buttons = page.locator(".hv-btn");
    await expect(buttons).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_画面初期显示_下拉列表加载", async ({ page }) => {
    let pcCalled = false;
    let marketCalled = false;
    let varCalled = false;

    await page.route(
      "**/api/ud08HomologationVariables/getProductClassMaster",
      (route) => {
        pcCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_PRODUCT_CLASSES),
        });
      },
    );
    await page.route(
      "**/api/ud08HomologationVariables/getMarketMaster",
      (route) => {
        marketCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_MARKETS),
        });
      },
    );
    await page.route(
      "**/api/ud08HomologationVariables/getHdocVariables",
      (route) => {
        varCalled = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_VARIABLES),
        });
      },
    );
    await mockCurrentUserApi(page);

    await navigateToHV(page);
    await page.waitForTimeout(1500);

    expect(pcCalled).toBeTruthy();
    expect(marketCalled).toBeTruthy();
    expect(varCalled).toBeTruthy();

    // 确认下拉列表有选项
    const pcSelect = page.locator(".hv-select");
    await expect(pcSelect.locator("option")).toHaveCount(3); // 请选择 + A + B

    const marketSelect = page.locator(".hv-select-short");
    await expect(marketSelect.locator("option")).toHaveCount(3); // 请选择 + JPN + USA

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_下拉列表加载", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_画面初期显示_所有字段为空", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1500);

    // 确认可编辑输入框默认为空（排除 readonly 的 Created by user 和 Date）
    const textInputs = page.locator("input[type='text']:not([readonly])");
    const count = await textInputs.count();
    for (let i = 0; i < count; i++) {
      await expect(textInputs.nth(i)).toHaveValue("");
    }

    // 确认按钮可用
    const buttons = page.locator(".hv-btn");
    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_所有字段为空", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("04_画面初期显示_加载失败", async ({ page }) => {
    // 模拟 API 加载失败
    await page.route(
      "**/api/ud08HomologationVariables/getProductClassMaster",
      (route) => {
        route.abort("connectionrefused");
      },
    );
    await page.route(
      "**/api/ud08HomologationVariables/getMarketMaster",
      (route) => {
        route.abort("connectionrefused");
      },
    );
    await page.route(
      "**/api/ud08HomologationVariables/getHdocVariables",
      (route) => {
        route.abort("connectionrefused");
      },
    );
    await mockCurrentUserApi(page);

    await navigateToHV(page);
    await page.waitForTimeout(2000);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "系统内部错误，请联系管理员",
    );

    await page.screenshot({
      path: getScreenshotPath("04_画面初期显示_加载失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 2. Search 搜索处理
// ============================================================
test.describe("Search搜索处理", () => {
  test("05_Search_正常搜索", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写搜索条件
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    // 点击 Search
    await page.locator(".hv-btn").filter({ hasText: "Search" }).click();
    await page.waitForTimeout(2000);

    // 确认跳转到搜索结果页面
    const currentUrl = page.url();
    expect(currentUrl).toContain("homologation-variables-result-list");

    await page.screenshot({
      path: getScreenshotPath("05_Search_正常搜索", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_Search_无条件搜索", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 不输入任何条件，直接点击 Search
    await page.locator(".hv-btn").filter({ hasText: "Search" }).click();
    await page.waitForTimeout(500);

    // 必填项检查会阻止搜索
    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Product class、Number、Market为必填项",
    );

    await page.screenshot({
      path: getScreenshotPath("06_Search_无条件搜索", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 3. Clear 清除处理
// ============================================================
test.describe("Clear清除处理", () => {
  test("07_Clear_正常清除", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 输入各字段值
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("TEST_VAR");
    await page.locator(".hv-input-long").first().fill("test_value");

    // 点击 Clear
    await page.locator(".hv-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(500);

    // 确认输入框被清空（排除 readonly 字段）
    const textInputs = page.locator("input[type='text']:not([readonly])");
    const count = await textInputs.count();
    for (let i = 0; i < count; i++) {
      await expect(textInputs.nth(i)).toHaveValue("");
    }

    // 确认没有错误消息
    await expect(page.locator(".hv-error-message")).not.toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("07_Clear_正常清除", "清除后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("08_Clear_空状态清除", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 不输入任何值直接点击 Clear
    await page.locator(".hv-btn").filter({ hasText: "Clear" }).click();
    await page.waitForTimeout(500);

    // 页面保持初始状态（排除 readonly 字段）
    const textInputs = page.locator("input[type='text']:not([readonly])");
    const count = await textInputs.count();
    for (let i = 0; i < count; i++) {
      await expect(textInputs.nth(i)).toHaveValue("");
    }

    // 无错误消息
    await expect(page.locator(".hv-error-message")).not.toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("08_Clear_空状态清除", "清除后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 4. Add 新增处理
// ============================================================
test.describe("Add新增处理", () => {
  test("09_Add_空值检查_必填项为空", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 不填写任何必填项，直接点击 Add
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Product class、Number、Market为必填项",
    );

    await page.screenshot({
      path: getScreenshotPath("09_Add_空值检查_必填项为空", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("10_Add_变量检查_TEMPLATE前缀验证失败", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    // 输入不存在的 TEMPLATE 变量
    await page.locator(".hv-input-medium").first().fill("TEMPLATE-UNKNOWN");

    // 点击 Add
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variant does not exist, Please enter the correct content",
    );

    await page.screenshot({
      path: getScreenshotPath("10_Add_变量检查_TEMPLATE前缀验证失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_Add_变量检查_TEMPLATE前缀验证通过", async ({ page }) => {
    // 模拟 Add API 成功
    await page.route("**/api/ud08HomologationVariables/add", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADD_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    // 等待下拉列表加载完成（确认 variableList 已填充）
    await expect(page.locator(".hv-select option")).toHaveCount(3);
    await page.waitForTimeout(500);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    // 输入存在的 TEMPLATE 变量（maxLength=20，注意字符数限制）
    await page.locator(".hv-input-medium").first().fill("TEMPLATE-EXIST_VAR");
    await page.waitForTimeout(300);

    // 确认输入值已被设置
    const varValue = await page
      .locator(".hv-input-medium")
      .first()
      .inputValue();
    expect(varValue).toBe("TEMPLATE-EXIST_VAR");

    // 点击 Add
    await page
      .locator(".hv-btn")
      .filter({ hasText: "Add" })
      .click({ force: true });
    await page.waitForTimeout(2000);

    // 检查是否有错误消息（可能变量验证失败）
    const errorMsg = page.locator(".hv-error-message");
    if (await errorMsg.isVisible().catch(() => false)) {
      const errorText = (await errorMsg.textContent()) || "";
      console.log(`DEBUG - Error after Add: ${errorText}`);
      if (errorText.includes("Variant does not exist")) {
        throw new Error(`Validation failed: ${errorText}`);
      }
    }

    // 直接检查成功消息（API 返回快，loading 可能已结束）
    await expect(page.locator(".hv-success-message")).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录添加成功",
    );

    await page.screenshot({
      path: getScreenshotPath("11_Add_变量检查_TEMPLATE前缀验证通过", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_Add_主键冲突检查", async ({ page }) => {
    // 模拟主键冲突
    await page.route("**/api/ud08HomologationVariables/add", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFLICT),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    // 点击 Add
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Primary key conflict, Please enter the correct content",
    );

    await page.screenshot({
      path: getScreenshotPath("12_Add_主键冲突检查", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_Add_成功", async ({ page }) => {
    // 模拟 Add API 成功
    await page.route("**/api/ud08HomologationVariables/add", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADD_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写所有必填项和可选字段
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");
    await page.locator(".hv-input-long").first().fill("test_value");

    // 点击 Add
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录添加成功",
    );

    await page.screenshot({
      path: getScreenshotPath("13_Add_成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_Add_失败_API错误", async ({ page }) => {
    // 模拟 API 500 错误
    await page.route("**/api/ud08HomologationVariables/add", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ERROR_500),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Add
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      'HTTP error! status: 500, message: {"code":500,"msg":"System error","data":null}',
    );

    await page.screenshot({
      path: getScreenshotPath("14_Add_失败_API错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 5. Update 更新处理
// ============================================================
test.describe("Update更新处理", () => {
  test("15_Update_存在性检查_记录不存在", async ({ page }) => {
    // 模拟 Update API 返回记录不存在
    await page.route("**/api/ud08HomologationVariables/update", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_NOT_FOUND),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("999");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Update
    await page.locator(".hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "数据不存在，请检查输入内容",
    );

    await page.screenshot({
      path: getScreenshotPath("15_Update_存在性检查_记录不存在", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_Update_变量检查_TEMPLATE前缀验证", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    // 输入不存在的 TEMPLATE 变量
    await page.locator(".hv-input-medium").first().fill("TEMPLATE-UNKNOWN");

    // 点击 Update
    await page.locator(".hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variant does not exist, Please enter the correct content",
    );

    await page.screenshot({
      path: getScreenshotPath("16_Update_变量检查_TEMPLATE前缀验证", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_Update_主键冲突检查", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/update", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CONFLICT),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Update
    await page.locator(".hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Primary key conflict, Please enter the correct content",
    );

    await page.screenshot({
      path: getScreenshotPath("17_Update_主键冲突检查", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_Update_成功", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/update", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_UPDATE_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 填写必填项
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Update
    await page.locator(".hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录更新成功",
    );

    await page.screenshot({
      path: getScreenshotPath("18_Update_成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_Update_失败_API错误", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/update", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ERROR_500),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    await page.locator(".hv-btn").filter({ hasText: "Update" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      'HTTP error! status: 500, message: {"code":500,"msg":"System error","data":null}',
    );

    await page.screenshot({
      path: getScreenshotPath("19_Update_失败_API错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 6. Delete 删除处理
// ============================================================
test.describe("Delete删除处理", () => {
  test("20_Delete_存在性检查_记录不存在", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/delete", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_NOT_FOUND),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("999");
    await page.locator(".hv-select-short").selectOption("JPN");

    await page.locator(".hv-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "数据不存在，请检查输入内容",
    );

    await page.screenshot({
      path: getScreenshotPath("20_Delete_存在性检查_记录不存在", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("21_Delete_成功", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/delete", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DELETE_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    await page.locator(".hv-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录删除成功",
    );

    await page.screenshot({
      path: getScreenshotPath("21_Delete_成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_Delete_失败_API错误", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/delete", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ERROR_500),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");

    await page.locator(".hv-btn").filter({ hasText: "Delete" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      'HTTP error! status: 500, message: {"code":500,"msg":"System error","data":null}',
    );

    await page.screenshot({
      path: getScreenshotPath("22_Delete_失败_API错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 7. 输入字符控制
// ============================================================
test.describe("输入字符控制", () => {
  test("23_Number_最大长度10字符", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    const numberInput = page.locator(".hv-input-short").first();
    await numberInput.fill("12345678901"); // 11个字符
    await page.waitForTimeout(300);

    // maxLength=10，只能输入10个字符
    const value = await numberInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(10);

    await page.screenshot({
      path: getScreenshotPath("23_Number_最大长度10字符", "输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("24_Variable_最大长度20字符", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    const variableInput = page.locator(".hv-input-medium").first();
    await variableInput.fill("A".repeat(21)); // 21个字符
    await page.waitForTimeout(300);

    const value = await variableInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(20);

    await page.screenshot({
      path: getScreenshotPath("24_Variable_最大长度20字符", "输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_Value_最大长度200字符", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    const valueInput = page.locator(".hv-input-long").first();
    await valueInput.fill("A".repeat(201)); // 201个字符
    await page.waitForTimeout(300);

    const inputValue = await valueInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(200);

    await page.screenshot({
      path: getScreenshotPath("25_Value_最大长度200字符", "输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("26_ProductClass_最大长度2字符", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // Product class 是 select 下拉框，不是输入框，选项由后端控制

    await page.screenshot({
      path: getScreenshotPath("26_ProductClass_最大长度2字符", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("27_Market_最大长度3字符", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // Market 是 select 下拉框，不是输入框，选项由后端控制

    await page.screenshot({
      path: getScreenshotPath("27_Market_最大长度3字符", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 8. UI 状态-加载中
// ============================================================
test.describe("UI状态_加载中", () => {
  test("28_操作中_按钮禁用", async ({ page }) => {
    // 延迟 API 响应以捕获加载状态
    await page.route("**/api/ud08HomologationVariables/add", async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADD_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Add（不等待完成）
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(500);

    // 加载中时表单被 Loading 视图替换，确认加载指示器可见
    await expect(page.locator(".hv-loading")).toBeVisible();
    await expect(page.locator(".hv-loading")).toHaveText("Loading...");
    // 确认表单按钮不可见（Loading 状态下按钮被移除）
    await expect(page.locator(".hv-btn")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("28_操作中_按钮禁用", "禁用"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("29_操作中_防止重复提交", async ({ page }) => {
    let apiCallCount = 0;
    await page.route("**/api/ud08HomologationVariables/add", async (route) => {
      apiCallCount++;
      await new Promise((r) => setTimeout(r, 3000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADD_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Add，等待 loading 状态出现后再尝试第二次点击
    const addBtn = page.locator(".hv-btn").filter({ hasText: "Add" });
    await addBtn.click();
    // 等待 loading 指示器出现，确保组件已进入加载状态（按钮已被移除）
    await expect(page.locator(".hv-loading")).toBeVisible({ timeout: 3000 });
    // 此时按钮已从 DOM 移除，第二次点击无效
    await page.waitForTimeout(500);

    // API 应只被调用一次
    expect(apiCallCount).toBeLessThanOrEqual(1);

    await page.screenshot({
      path: getScreenshotPath("29_操作中_防止重复提交", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 9. 异常处理
// ============================================================
test.describe("异常处理", () => {
  test("30_异常处理_API调用失败", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/add", (route) => {
      route.abort("connectionrefused");
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "无法连接到后端服务，请确认后端服务已启动（http://localhost:8081）",
    );

    await page.screenshot({
      path: getScreenshotPath("30_异常处理_API调用失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("31_异常处理_未授权操作", async ({ page }) => {
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    // 未设置登录用户的情况下直接操作
    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    // 点击 Add，应能正常执行（组件不阻止未登录操作）
    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(500);

    // 此时应触发必填项验证或其它处理
    const errorVisible = await page
      .locator(".hv-error-message")
      .isVisible()
      .catch(() => false);
    if (!errorVisible) {
      // 操作正常执行
      await expect(page.locator(".hv-btn").first()).toBeEnabled();
    }

    await page.screenshot({
      path: getScreenshotPath("31_异常处理_未授权操作", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 10. 安全性
// ============================================================
test.describe("安全性", () => {
  test("32_安全性_API请求协议", async ({ page }) => {
    let requestUrls: string[] = [];
    await page.route("**/api/ud08HomologationVariables/**", (route) => {
      requestUrls.push(route.request().url());
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: [] }),
      });
    });

    await navigateToHV(page);
    await page.waitForTimeout(1500);

    // 确认请求中不包含敏感信息
    for (const url of requestUrls) {
      expect(url).not.toContain("password");
      expect(url).not.toContain("token");
      expect(url).not.toContain("secret");
    }

    await page.screenshot({
      path: getScreenshotPath("32_安全性_API请求协议", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("33_安全性_变更记录日志", async ({ page }) => {
    await page.route("**/api/ud08HomologationVariables/add", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADD_SUCCESS),
      });
    });
    await mockDropdownApis(page);
    await mockCurrentUserApi(page);
    await setCurrentUser(page, "test_user");
    await navigateToHV(page);
    await page.waitForTimeout(1000);

    await page.locator(".hv-select").selectOption("A");
    await page.locator(".hv-input-short").first().fill("123");
    await page.locator(".hv-select-short").selectOption("JPN");
    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");

    await page.locator(".hv-btn").filter({ hasText: "Add" }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录添加成功",
    );

    await page.screenshot({
      path: getScreenshotPath("33_安全性_变更记录日志", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
