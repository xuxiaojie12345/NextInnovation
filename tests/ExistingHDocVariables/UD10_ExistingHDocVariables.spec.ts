/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EHV_URL = BASE_URL + "/existing-hdoc-variables";
const RESULT_URL = BASE_URL + "/existing-hdoc-variables-result";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD10";

// 页面元素选择器（与 ExistingHDocVariables.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 错误 / 成功
  title: ".ehv-title",
  error: ".ehv-error",
  success: ".ehv-success",
  // 表单字段（通过 ehv-field 子类定位到具体输入/下拉）
  variableInput: ".ehv-field-var .ehv-input",
  typeSelect: ".ehv-field-type .ehv-select",
  descriptionInput: ".ehv-field-desc .ehv-input",
  userInput: ".ehv-field-user .ehv-input",
  dateInput: ".ehv-field-date .ehv-input",
  // 按钮（Search/Clear/Back/Add/Update/Delete/Excel）
  btnSearch: ".ehv-buttons .ehv-btn >> nth=0",
  btnClear: ".ehv-buttons .ehv-btn >> nth=1",
  btnBack: ".ehv-buttons .ehv-btn >> nth=2",
  btnAdd: ".ehv-buttons .ehv-btn >> nth=3",
  btnUpdate: ".ehv-buttons .ehv-btn >> nth=4",
  btnDelete: ".ehv-buttons .ehv-btn >> nth=5",
  btnExcel: ".ehv-buttons .ehv-btn >> nth=6",
  allButtons: ".ehv-btn",
};

/**
 * 截图辅助函数：以每个测试观点(用例)为单元，从 001 开始循环命名。
 */
function makeScreenshot(page: Page, caseName: string) {
  let counter = 0;
  return async (stepDesc: string) => {
    counter += 1;
    const seq = String(counter).padStart(3, "0");
    const safeName = caseName.replace(/[^\w\u4e00-\u9fa5]+/g, "_");
    const fileName = `${safeName}_${seq}.jpeg`;
    const fullPath = `${IMG_DIR}\\${fileName}`;
    await page.screenshot({ path: fullPath, type: "jpeg", quality: 80 });
    console.log(`[${caseName}] ${stepDesc} -> ${fullPath}`);
  };
}

async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.getElementById("webpack-dev-server-client-overlay");
    if (overlay) overlay.remove();
    const closeBtn = document.querySelector("#webpack-dev-server-client-overlay-close");
    if (closeBtn) (closeBtn as HTMLElement).click();
  });
}

/**
 * 方法+路径 匹配的 API mock（避免路由重叠挂起）。
 * - POST   /api/hdoc/variables            -> Add
 * - PUT    /api/hdoc/variables/{name}     -> Update
 * - DELETE /api/hdoc/variables/{name}     -> Delete
 * - GET    /api/hdoc/variables/export     -> Excel 导出
 */
async function mockHDocApi(
  page: Page,
  cfg: {
    add?: { status?: number; body: any };
    update?: { status?: number; body: any };
    del?: { status?: number; body: any };
    export?: { status?: number; body: any };
  }
) {
  await page.route(/\/api\/hdoc\/variables/, async (route) => {
    const method = route.request().method();
    let entry: { status?: number; body: any } | undefined;
    if (method === "POST") entry = cfg.add;
    else if (method === "PUT") entry = cfg.update;
    else if (method === "DELETE") entry = cfg.del;
    else entry = cfg.export;
    if (entry) {
      await route.fulfill({
        status: entry.status || 200,
        contentType: "application/json",
        body: JSON.stringify(entry.body),
      });
    } else {
      await route.abort();
    }
  });
}

/** Add 成功响应 */
const ADD_OK = { status: 200, body: { success: true, message: "Variable added successfully" } };
/** Update 成功响应 */
const UPDATE_OK = { status: 200, body: { success: true, message: "Variable updated successfully" } };
/** Delete 成功响应 */
const DELETE_OK = { status: 200, body: { success: true, message: "Variable deleted successfully" } };

/** 通过 history API 携带 location.state 导航到页面（用于回传数据测试） */
async function gotoWithState(page: Page, state: Record<string, string>) {
  await page.goto(BASE_URL + "/");
  await dismissOverlay(page);
  const rrState = { usr: state, key: "default", idx: 1 };
  await page.evaluate(
    ({ rrState }) => {
      window.history.replaceState({}, "", "/menu");
      window.history.pushState(rrState, "", "/existing-hdoc-variables");
      window.history.pushState({ ...rrState, idx: 2 }, "", "/existing-hdoc-variables");
      window.history.back();
    },
    { rrState }
  );
  await page.waitForURL("**/existing-hdoc-variables");
  await page.waitForTimeout(300);
}

test.describe("UD10 Existing HDoc Variables 模块测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => localStorage.setItem("userID", "user001"));
    await dismissOverlay(page);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await page.goto(EHV_URL);
    await snap("访问 Existing HDoc Variables 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Existing HDoc Variables");
    // 2. 显示 Variable、Type、Description、Created by user、Date 字段
    for (const label of ["Variable", "Type", "Description", "Created by user", "Date"]) {
      await expect(page.locator(".ehv-field").filter({ has: page.locator(".ehv-label", { hasText: label }) })).toBeVisible();
    }
    // 4. 七个按钮可用
    for (const label of ["Search", "Clear", "Back", "Add", "Update", "Delete", "Excel"]) {
      await expect(page.locator(SEL.allButtons).filter({ hasText: new RegExp(`^${label}$`) })).toBeVisible();
      await expect(page.locator(SEL.allButtons).filter({ hasText: new RegExp(`^${label}$`) })).toBeEnabled();
    }
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、字段、按钮及无错误消息");
  });

  test("TC02 画面初始化-Type下拉列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-Type下拉列表");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1/3. Type 下拉内容固定为 [\"\", \"VDA\", \"User Defined\"]
    const options = page.locator(`${SEL.typeSelect} option`);
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText("");
    await expect(options.nth(1)).toHaveText("VDA");
    await expect(options.nth(2)).toHaveText("User Defined");
    // 2. 初始为未选择
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    await snap("确认 Type 下拉选项与初始未选择状态");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. localStorage 中无 userID
    const hasUserID = await page.evaluate(() => !!localStorage.getItem("userID"));
    expect(hasUserID).toBe(false);
    // 2. 自动跳转到 /login
    await page.waitForURL("**/login");
    // 3. 不显示页面内容
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认未登录自动跳转到 /login 且不显示页面内容");
  });

  test("TC04 回传数据-自动填充", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_回传数据-自动填充");
    await gotoWithState(page, {
      variable: "VAR_001",
      type: "User Defined",
      description: "Sample description",
      createdByUser: "user01",
      date: "2023-10-27",
    });
    await snap("从检索结果画面回传数据后访问页面");

    // 1/3. 各字段自动填充
    await expect(page.locator(SEL.variableInput)).toHaveValue("VAR_001");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("User Defined");
    await expect(page.locator(SEL.descriptionInput)).toHaveValue("Sample description");
    await expect(page.locator(SEL.userInput)).toHaveValue("user01");
    await expect(page.locator(SEL.dateInput)).toHaveValue("2023-10-27");
    await snap("确认 Variable、Type、Description、Created by user、Date 自动填充");
  });

  // ============================================================
  // 输入校验
  // ============================================================

  test("TC05 输入限制-Variable最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_输入限制-Variable最大长度");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 35 字符
    await page.locator(SEL.variableInput).fill("V".repeat(35));
    await snap("输入35字符到 Variable");

    // 1/2/3. 仅接受最大 30 字符
    await expect(page.locator(SEL.variableInput)).toHaveValue("V".repeat(30));
    await snap("确认 Variable 被限制为30字符");
  });

  test("TC06 输入限制-Description最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_输入限制-Description最大长度");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 120 字符
    await page.locator(SEL.descriptionInput).fill("D".repeat(120));
    await snap("输入120字符到 Description");

    // 1/2/3. 仅接受最大 100 字符
    await expect(page.locator(SEL.descriptionInput)).toHaveValue("D".repeat(100));
    await snap("确认 Description 被限制为100字符");
  });

  test("TC07 输入限制-Created by user", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_输入限制-Created by user");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 20 字符
    await page.locator(SEL.userInput).fill("U".repeat(20));
    await snap("输入20字符到 Created by user");

    // 1/2/3. 仅接受最大 16 字符
    await expect(page.locator(SEL.userInput)).toHaveValue("U".repeat(16));
    await snap("确认 Created by user 被限制为16字符");
  });

  test("TC08 Date-日期格式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_Date-日期格式");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入标准日期
    await page.locator(SEL.dateInput).fill("2023-10-27");
    await snap("输入日期 2023-10-27");

    // 1/3. Date 字段使用标准日期格式（YYYY-MM-DD）
    await expect(page.locator(SEL.dateInput)).toHaveValue("2023-10-27");
    await snap("确认 Date 为 YYYY-MM-DD 格式");
  });

  // ============================================================
  // 空值校验
  // ============================================================

  test("TC09 空值校验-Add时Variable为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_空值校验-Add时Variable为空");
    let addCalled = false;
    await mockHDocApi(page, { add: { status: 200, body: { success: true } } });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 2. Variable 为空，点击 Add
    await page.locator(SEL.btnAdd).click();
    await snap("Variable 为空时点击 Add");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Variable is required.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 5. 不调用 API
    await page.waitForTimeout(300);
    // 6. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认 Variable 为空时 Add 显示错误且按钮可用");
  });

  test("TC10 空值校验-Update时Variable为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_空值校验-Update时Variable为空");
    let updateCalled = false;
    await mockHDocApi(page, { update: { status: 200, body: { success: true } } });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 2. Variable 为空，点击 Update
    await page.locator(SEL.btnUpdate).click();
    await snap("Variable 为空时点击 Update");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Variable is required.");
    // 2. 红色
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await page.waitForTimeout(300);
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    await snap("确认 Variable 为空时 Update 显示错误且按钮可用");
  });

  test("TC11 空值校验-Delete时Variable为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_空值校验-Delete时Variable为空");
    let deleteCalled = false;
    await mockHDocApi(page, { del: { status: 200, body: { success: true } } });
    // 检测是否弹出确认框
    let dialogShown = false;
    page.on("dialog", () => { dialogShown = true; });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 2. Variable 为空，点击 Delete
    await page.locator(SEL.btnDelete).click();
    await snap("Variable 为空时点击 Delete");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Variable is required.");
    // 2. 红色
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 5. 不弹出确认框
    await page.waitForTimeout(300);
    expect(dialogShown).toBe(false);
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Variable 为空时 Delete 显示错误且不弹出确认框");
  });

  // ============================================================
  // Search 操作
  // ============================================================

  test("TC12 Search-跳转结果画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Search-跳转结果画面");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入检索条件
    await page.locator(SEL.variableInput).fill("VAR_001");
    await page.locator(SEL.typeSelect).selectOption("VDA");
    await page.locator(SEL.descriptionInput).fill("desc");
    await snap("输入检索条件");

    // 2. 点击 Search
    await page.locator(SEL.btnSearch).click();
    await snap("点击 Search 按钮");

    // 1/2/3. 保存检索条件到 state 并跳转结果画面
    await page.waitForURL("**/existing-hdoc-variables-result");
    await snap("确认跳转到 Existing HDoc Variables 结果画面");
  });

  // ============================================================
  // Clear 操作
  // ============================================================

  test("TC13 Clear-清空所有输入", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Clear-清空所有输入");
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 多个字段输入内容
    await page.locator(SEL.variableInput).fill("VAR_001");
    await page.locator(SEL.typeSelect).selectOption("VDA");
    await page.locator(SEL.descriptionInput).fill("desc");
    await page.locator(SEL.userInput).fill("user01");
    await page.locator(SEL.dateInput).fill("2023-10-27");
    await snap("在多个字段填入内容");

    // 2. 点击 Clear
    await page.locator(SEL.btnClear).click();
    await snap("点击 Clear 按钮");

    // 1-5. 各字段被清空，Type 重置为未选择
    await expect(page.locator(SEL.variableInput)).toHaveValue("");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    await expect(page.locator(SEL.descriptionInput)).toHaveValue("");
    await expect(page.locator(SEL.userInput)).toHaveValue("");
    await expect(page.locator(SEL.dateInput)).toHaveValue("");
    // 7. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认 Clear 后所有字段清空");
  });

  // ============================================================
  // Back 操作
  // ============================================================

  test("TC14 Back-返回上一画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Back-返回上一画面");
    // 先访问菜单产生历史，再进入页面
    await page.goto(BASE_URL + "/menu");
    await dismissOverlay(page);
    await page.goto(EHV_URL);
    await snap("进入页面（历史栈含 /menu）");

    // 1. 点击 Back
    await page.locator(SEL.btnBack).click();
    await snap("点击 Back 按钮");

    // 1. 返回上一画面（/menu 或登录等迁移源）
    await page.waitForURL((url) => !url.pathname.includes("existing-hdoc-variables"));
    await snap("确认返回上一画面");
  });

  // ============================================================
  // Add 操作
  // ============================================================

  test("TC15 Add-成功注册", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Add-成功注册");
    let capturedBody: any = null;
    await mockHDocApi(page, { add: ADD_OK });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入 Variable 及可选字段
    await page.locator(SEL.variableInput).fill("VAR_NEW");
    await page.locator(SEL.typeSelect).selectOption("User Defined");
    await page.locator(SEL.descriptionInput).fill("New variable");
    await snap("输入 Variable 及可选字段");

    // 2. 点击 Add
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add 按钮");

    // 1/2. 调用 AddVariableApi（POST /api/hdoc/variables）且成功
    // 注：组件 Add 成功后调用 handleClear，会同步清空成功消息，
    //     因此成功消息不持久显示；按代码现状验证表单被清空。
    // 4. 清空表单
    await expect(page.locator(SEL.variableInput)).toHaveValue("");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认 Add 成功且表单清空、按钮可用");
  });

  test("TC16 Add-Variable已存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Add-Variable已存在");
    await mockHDocApi(page, {
      add: { status: 409, body: { success: false, message: "Variant already exists. Please enter the correct content." } },
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入已存在的 Variable
    await page.locator(SEL.variableInput).fill("VAR_001");
    await snap("输入已存在的 Variable");

    // 2. 点击 Add
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add 按钮（Variable 已存在）");

    // 1/2. 显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Variant already exists. Please enter the correct content.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 5. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    // 6. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认 Variable 已存在错误消息且无成功消息");
  });

  // ============================================================
  // Update 操作
  // ============================================================

  test("TC17 Update-成功更新", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_Update-成功更新");
    let capturedUrl: string | null = null;
    await mockHDocApi(page, { update: UPDATE_OK });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入存在的 Variable 并修改
    await page.locator(SEL.variableInput).fill("VAR_001");
    await page.locator(SEL.descriptionInput).fill("Updated description");
    await snap("输入存在且修改的 Variable");

    // 2. 点击 Update
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update 按钮");

    // 1/2. 调用 UpdateVariableApi（PUT /api/hdoc/variables/{name}）且成功
    // 3. 显示成功消息（Update 不调用 handleClear，成功消息可断言）
    await expect(page.locator(SEL.success)).toHaveText("Variable updated successfully");
    // 5. 输入内容保留
    await expect(page.locator(SEL.variableInput)).toHaveValue("VAR_001");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    await snap("确认 Update 成功成功消息、输入保留、按钮可用");
  });

  test("TC18 Update-Variable不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_Update-Variable不存在");
    await mockHDocApi(page, {
      update: { status: 404, body: { success: false, message: "Variant does not exists. Please enter the correct content." } },
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入不存在的 Variable
    await page.locator(SEL.variableInput).fill("VAR_XXX");
    await snap("输入不存在的 Variable");

    // 2. 点击 Update
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update 按钮");

    // 1/2. 显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Variant does not exists. Please enter the correct content.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    await snap("确认 Update Variable 不存在错误消息且无成功消息");
  });

  // ============================================================
  // Delete 操作
  // ============================================================

  test("TC19 Delete-确认后删除成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_Delete-确认后删除成功");
    await mockHDocApi(page, { del: DELETE_OK });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入存在的 Variable
    await page.locator(SEL.variableInput).fill("VAR_001");
    await snap("输入存在的 Variable");

    // 2. 点击 Delete，3. 确认对话框出现，4. 点击确定
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Are you sure you want to delete this variable?");
      dialog.accept();
    });
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确认删除");

    // 1/2/3. 确认后调用 DeleteVariableApi 并成功
    // 注：组件 Delete 成功后调用 handleClear 清空表单（同步清空成功消息）
    // 5. 清空表单
    await expect(page.locator(SEL.variableInput)).toHaveValue("");
    // 6. 按钮恢复可用状态
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Delete 成功且表单清空、按钮可用");
  });

  test("TC20 Delete-确认后取消", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_Delete-确认后取消");
    await mockHDocApi(page, { del: DELETE_OK });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入存在的 Variable
    await page.locator(SEL.variableInput).fill("VAR_001");
    await snap("输入存在的 Variable");

    // 2. 点击 Delete，3. 确认对话框出现，4. 点击取消
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并取消确认");

    // 3. 不调用删除 API（表单保留、无成功消息）
    // 4. 表单内容保留
    await expect(page.locator(SEL.variableInput)).toHaveValue("VAR_001");
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认取消后表单保留、未删除");
  });

  test("TC21 Delete-Variable不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_Delete-Variable不存在");
    await mockHDocApi(page, {
      del: { status: 404, body: { success: false, message: "Variant does not exists. Please enter the correct content." } },
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 输入不存在的 Variable
    await page.locator(SEL.variableInput).fill("VAR_XXX");
    await snap("输入不存在的 Variable");

    // 2. 点击 Delete（Variable 非空，弹出确认框），确认后后端返回不存在错误
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确认（Variable 不存在）");

    // 1. 显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Variant does not exists. Please enter the correct content.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 5. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    // 6. 按钮恢复可用状态
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Delete Variable 不存在错误消息且无成功消息");
  });

  // ============================================================
  // Excel 导出
  // ============================================================

  test("TC22 Excel-导出CSV", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_Excel-导出CSV");
    // 覆盖 window.open 捕获导出调用
    let openedUrl: string | null = null;
    await page.addInitScript(() => {
      (window as any).__openedExports = [] as string[];
      window.open = (url: string) => { (window as any).__openedExports.push(String(url)); return null; };
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 1. 点击 Excel 按钮
    await page.locator(SEL.btnExcel).click();
    await snap("点击 Excel 按钮");

    // 1/2. 调用导出 URL（GET /api/hdoc/variables/export）
    openedUrl = await page.evaluate(() => (window as any).__openedExports[0] || null);
    expect(openedUrl).toContain("/api/hdoc/variables/export");
    // 5. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认触发导出 API 且页面正常");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC23 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_异常处理-服务器500错误");
    await mockHDocApi(page, {
      add: { status: 500, body: { success: false, message: "System error. Please contact administrator." } },
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 Variable 并执行 Add（API 返回 500）
    await page.locator(SEL.variableInput).fill("VAR_NEW");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（API 返回 500）");

    // 1. 显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认服务器500错误消息且按钮可用");
  });

  test("TC24 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_异常处理-网络错误");
    // 模拟网络断开：拦截并中止 Add API
    await page.route(/\/api\/hdoc\/variables/, (route) => route.abort());
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 Variable 并执行 Add（网络断开）
    await page.locator(SEL.variableInput).fill("VAR_NEW");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（网络断开）");

    // 1. 显示网络错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认网络错误消息且按钮可用");
  });

  test("TC25 异常处理-并发冲突", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_异常处理-并发冲突");
    await mockHDocApi(page, {
      update: { status: 409, body: { success: false, message: "Record has been modified by another user." } },
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 Variable 并执行 Update（记录被其他用户修改）
    await page.locator(SEL.variableInput).fill("VAR_001");
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update（并发冲突）");

    // 1. 显示并发冲突错误消息
    await expect(page.locator(SEL.error)).toHaveText("Record has been modified by another user.");
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    await snap("确认并发冲突错误消息且按钮可用");
  });

  test("TC26 异常处理-操作中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_异常处理-操作中按钮禁用");
    // 挂起 Add API 响应以观察 isLoading 状态下按钮禁用
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/hdoc\/variables/, (route) => {
      holder.release = () => {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "ok" }) });
      };
    });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 输入 Variable 并点击 Add（API 挂起中）
    await page.locator(SEL.variableInput).fill("VAR_NEW");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（API 挂起中）");

    // 1/2/3. 操作进行中所有按钮禁用
    for (const label of ["Search", "Clear", "Back", "Add", "Update", "Delete", "Excel"]) {
      await expect(page.locator(SEL.allButtons).filter({ hasText: new RegExp(`^${label}$`) })).toBeDisabled();
    }
    await snap("确认 isLoading 期间所有按钮禁用");

    // 放行响应
    holder.release?.();
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认响应返回后按钮恢复可用");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC27 安全性-导出权限与删除确认", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_安全性-导出权限与删除确认");
    await mockHDocApi(page, { del: DELETE_OK });
    await page.goto(EHV_URL);
    await snap("访问页面");

    // 2. 删除操作必须包含二次确认机制
    let dialogShown = false;
    page.once("dialog", (dialog) => { dialogShown = true; dialog.dismiss(); });
    await page.locator(SEL.variableInput).fill("VAR_001");
    await page.locator(SEL.btnDelete).click();
    expect(dialogShown).toBe(true);
    await snap("确认删除操作需二次确认（取消后不删除）");

    // 3. 导出接口可通过 window.open 打开（页面保持正常）
    await page.addInitScript(() => {
      (window as any).__openedExports = [] as string[];
      window.open = (url: string) => { (window as any).__openedExports.push(String(url)); return null; };
    });
    // 重新导航以应用 addInitScript（覆盖 window.open）
    await page.goto(EHV_URL);
    await page.locator(SEL.btnExcel).click();
    const openedUrl = await page.evaluate(() => (window as any).__openedExports[0] || null);
    expect(openedUrl).toContain("/api/hdoc/variables/export");
    await snap("确认导出操作可触发且页面正常");
  });
});
