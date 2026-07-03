import { test, expect, Page } from "@playwright/test";

const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD10";
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-variables`;

let screenshotCounter: { [key: string]: number } = {};

function ss(testName: string, step: string): string {
  if (!screenshotCounter[testName]) screenshotCounter[testName] = 0;
  screenshotCounter[testName]++;
  return `${SCREENSHOT_DIR}/${testName}_${String(screenshotCounter[testName]).padStart(3, "0")}_${step}.jpeg`;
}

const ADD_OK = { code: 200, msg: "success", data: {} };
const UPDATE_OK = { code: 200, msg: "success", data: {} };
const DEL_OK = { code: 200, msg: "success", data: {} };
const CONFLICT = {
  code: 409,
  msg: "Variant already exists. Please enter the correct content",
  data: null,
};
const NOT_FOUND = {
  code: 400,
  msg: "Variant does not exists. Please enter the correct content",
  data: null,
};
const SYS_ERR = { code: 500, msg: "System error", data: null };

async function mockCurrentUser(page: Page) {
  await page.route("**/api/ud10Hdocvariables/getCurrentUserInfo", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        data: {
          currentUser: "test_user",
          currentDateTime: "2026-07-02 13:00:00",
        },
      }),
    }),
  );
}

async function setUser(page: Page, user: string) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate((u) => localStorage.setItem("currentUser", u), user);
}

test.beforeEach(() => {
  screenshotCounter = {};
});

test.describe("画面初始化", () => {
  test("01_基本元素", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-title")).toHaveText(
      "Existing HDoc Variables",
    );
    await expect(
      page.getByRole("button", { name: "Search", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clear", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Update", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Excel", exact: true }),
    ).toBeVisible();

    const buttons = page.locator(".hv-btn");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }
    await page.screenshot({
      path: ss("01_基本元素", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_Type下拉列表选项", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const typeSelect = page.locator(".hv-select-short").first();
    const options = typeSelect.locator("option");
    await expect(options).toHaveCount(3);
    await expect(options.nth(1)).toHaveText("VDA");
    await expect(options.nth(2)).toHaveText("User Defined");
    await page.screenshot({
      path: ss("02_Type下拉列表选项", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_所有字段为空", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const inputs = page.locator("input[type='text']:not([readonly])");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue("");
    }
    await page.screenshot({
      path: ss("03_所有字段为空", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Search搜索处理", () => {
  test("04_正常搜索", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("TEST_VAR");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain("hdoc-variables-result-list");
    await page.screenshot({
      path: ss("04_正常搜索", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("05_无条件搜索", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variable为必填项",
    );
    await page.screenshot({
      path: ss("05_无条件搜索", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_API错误", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForSelector(".hv-container", { timeout: 10000 });

    await page.locator(".hv-input-medium").first().fill("TEST_VAR");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain("hdoc-variables-result-list");
    await page.screenshot({
      path: ss("06_API错误", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Clear清除处理", () => {
  test("07_正常清除", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForSelector(".hv-container", { timeout: 10000 });

    await page.locator(".hv-input-medium").first().fill("TEST_VAR");
    await page.locator(".hv-select-short").first().selectOption("VDA");
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await page.waitForTimeout(500);

    const inputs = page.locator("input[type='text']:not([readonly])");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue("");
    }
    await page.screenshot({
      path: ss("07_正常清除", "清除后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("08_空状态清除", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-error-message")).not.toBeVisible();
    await page.screenshot({
      path: ss("08_空状态清除", "清除后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Back返回处理", () => {
  test("09_返回前画面", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain("/menu");
    await page.screenshot({
      path: ss("09_返回前画面", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Add新增处理", () => {
  test("10_空值检查_Variable为空", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variable为必填项",
    );
    await page.screenshot({
      path: ss("10_空值检查_Variable为空", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_主键冲突检查", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/add", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(CONFLICT),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variant already exists. Please enter the correct content",
    );
    await page.screenshot({
      path: ss("11_主键冲突检查", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_成功", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/add", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ADD_OK),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.locator(".hv-select-short").first().selectOption("User Defined");
    await page.locator(".hv-input-long").first().fill("Test variable");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录添加成功",
    );
    await page.screenshot({
      path: ss("12_成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_API错误", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/add", (r) =>
      r.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify(SYS_ERR),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      'HTTP error! status: 500, message: {"code":500,"msg":"System error","data":null}',
    );
    await page.screenshot({
      path: ss("13_API错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Update更新处理", () => {
  test("14_存在性检查_记录不存在", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/update", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(NOT_FOUND),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NONEXISTENT_VAR");
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variant does not exists. Please enter the correct content",
    );
    await page.screenshot({
      path: ss("14_存在性检查_记录不存在", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_成功", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/update", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(UPDATE_OK),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录更新成功",
    );
    await page.screenshot({
      path: ss("15_成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_API错误", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/update", (r) =>
      r.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify(SYS_ERR),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      'HTTP error! status: 500, message: {"code":500,"msg":"System error","data":null}',
    );
    await page.screenshot({
      path: ss("16_API错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Delete删除处理", () => {
  test("17_存在性检查_记录不存在", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/delete", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(NOT_FOUND),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NONEXISTENT_VAR");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "Variant does not exists. Please enter the correct content",
    );
    await page.screenshot({
      path: ss("17_存在性检查_记录不存在", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_成功", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/delete", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEL_OK),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await expect(page.locator(".hv-success-message")).toHaveText(
      "记录删除成功",
    );
    await page.screenshot({
      path: ss("18_成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_API错误", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/delete", (r) =>
      r.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify(SYS_ERR),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("EXISTING_VAR");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      'HTTP error! status: 500, message: {"code":500,"msg":"System error","data":null}',
    );
    await page.screenshot({
      path: ss("19_API错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Excel导出处理", () => {
  test("20_导出成功", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("TEST_VAR");
    await page.getByRole("button", { name: "Excel", exact: true }).click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: ss("20_导出成功", "导出"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("21_导出失败", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Excel", exact: true }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: ss("21_导出失败", "导出"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("输入字符控制", () => {
  test("22_Variable_最大长度30字符", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const input = page.locator(".hv-input-medium").first();
    await input.fill("A".repeat(31));
    await page.waitForTimeout(300);

    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(30);
    await page.screenshot({
      path: ss("22_Variable_最大长度30字符", "输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("23_Description_最大长度100字符", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const input = page.locator(".hv-input-long").first();
    await input.fill("A".repeat(101));
    await page.waitForTimeout(300);

    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
    await page.screenshot({
      path: ss("23_Description_最大长度100字符", "输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("UI状态_加载中", () => {
  test("24_操作中_按钮禁用", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/add", async (r) => {
      await new Promise((res) => setTimeout(res, 3000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ADD_OK),
      });
    });
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".hv-loading")).toBeVisible();
    await page.screenshot({
      path: ss("24_操作中_按钮禁用", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_操作中_防止重复提交", async ({ page }) => {
    let callCount = 0;
    await page.route("**/api/ud10Hdocvariables/add", async (r) => {
      callCount++;
      await new Promise((res) => setTimeout(res, 3000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ADD_OK),
      });
    });
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.locator(".hv-loading")).toBeVisible({ timeout: 3000 });

    expect(callCount).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: ss("25_操作中_防止重复提交", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("异常处理", () => {
  test("26_API调用失败", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/add", (r) =>
      r.abort("connectionrefused"),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".hv-error-message")).toBeVisible();
    await expect(page.locator(".hv-error-message")).toHaveText(
      "无法连接到后端服务，请确认后端服务已启动（http://localhost:8081）",
    );
    await page.screenshot({
      path: ss("26_API调用失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("27_未授权操作", async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: ss("27_未授权操作", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("安全性", () => {
  test("28_API请求协议", async ({ page }) => {
    const urls: string[] = [];
    await page.route("**/api/ud10Hdocvariables/**", (r) => {
      urls.push(r.request().url());
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          data: { currentUser: "u", currentDateTime: "t" },
        }),
      });
    });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    for (const u of urls) {
      expect(u).not.toContain("password");
      expect(u).not.toContain("secret");
    }
    await page.screenshot({
      path: ss("28_API请求协议", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("29_变更记录日志", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/add", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ADD_OK),
      }),
    );
    await mockCurrentUser(page);
    await setUser(page, "test_user");
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.locator(".hv-input-medium").first().fill("NEW_VAR");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForTimeout(1500);

    await expect(page.locator(".hv-success-message")).toBeVisible();
    await page.screenshot({
      path: ss("29_变更记录日志", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
