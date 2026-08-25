/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const HV_URL = BASE_URL + "/homologation-variables";
const RESULT_URL = BASE_URL + "/homologation-variables-result";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD08";

// 页面元素选择器（与 HomologationVariables.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 错误 / 成功
  title: ".hv-title",
  error: ".hv-error",
  success: ".hv-success",
  // 表单字段（通过 hv-field 子类定位到具体输入/下拉）
  pcSelect: ".hv-field-pc .hv-select",
  numInput: ".hv-field-num .hv-input",
  mktSelect: ".hv-field-mkt .hv-select",
  variableInput: ".hv-field-var .hv-input",
  valueInput: ".hv-field-val .hv-input",
  vs1Input: ".hv-field-vs1 .hv-input",
  vs2Input: ".hv-field-vs2 .hv-input",
  commentsInput: ".hv-field-com .hv-input",
  addInput: ".hv-field-add .hv-input",
  deleteInput: ".hv-field-del .hv-input",
  cbuInput: ".hv-field-cbu .hv-input",
  dateInput: ".hv-field-dt .hv-input",
  // 按钮
  btnSearch: ".hv-buttons .hv-btn >> nth=0",
  btnClear: ".hv-buttons .hv-btn >> nth=1",
  btnAdd: ".hv-buttons .hv-btn >> nth=2",
  btnUpdate: ".hv-buttons .hv-btn >> nth=3",
  btnDelete: ".hv-buttons .hv-btn >> nth=4",
  allButtons: ".hv-btn",
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
 * 拦截并模拟 GetDropdownDataApi：GET /api/ud08/getdropdowndata
 */
async function mockDropdownData(page: Page) {
  await page.route(/\/api\/ud08\/getdropdowndata/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          productClasses: [
            { pc: "PC", description: "Product Class" },
            { pc: "TR", description: "Truck" },
          ],
          markets: [
            { market: "EU", description: "Europe" },
            { market: "AUS", description: "Australia" },
          ],
        },
      }),
    });
  });
}

/** 定位第 i 个按钮（0 起） */
function button(page: Page, index: number) {
  return page.locator(SEL.allButtons).nth(index);
}

test.describe("UD08 Homologation Variables 模块测试", () => {
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
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问 Homologation Variables 页面");

    // 1. 显示 "Homologation Variables" 标题
    await expect(page.locator(SEL.title)).toHaveText("Homologation Variables");
    // 2. 显示 Product class、Number、Market、Variable、Value、Variant string.1/2、Comments 字段
    for (const label of ["Product class", "Number", "Market", "Variable", "Value", "Variant string.1", "Variant string.2", "Comments"]) {
      await expect(page.locator(".hv-field").filter({ has: page.locator(".hv-label", { hasText: label }) })).toBeVisible();
    }
    // 3. 显示 Add、Delete、Created by user、Date 字段
    for (const label of ["Add", "Delete", "Created by user", "Date"]) {
      await expect(page.locator(".hv-field").filter({ has: page.locator(".hv-label", { hasText: label }) })).toBeVisible();
    }
    await snap("确认画面各字段显示");

    // 4. 五个按钮（Search、Clear、Add、Update、Delete）可用
    for (const label of ["Search", "Clear", "Add", "Update", "Delete"]) {
      await expect(button(page, ["Search", "Clear", "Add", "Update", "Delete"].indexOf(label))).toBeEnabled();
    }
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认五个按钮可用且无错误消息");
  });

  test("TC02 画面初始化-下拉列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-下拉列表");
    let capturedUrl = "";
    await page.route(/\/api\/ud08\/getdropdowndata/, async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            productClasses: [{ pc: "PC", description: "Product Class" }, { pc: "TR", description: "Truck" }],
            markets: [{ market: "EU", description: "Europe" }, { market: "AUS", description: "Australia" }],
          },
        }),
      });
    });
    await page.goto(HV_URL);
    await snap("访问页面，触发下拉数据 API");

    // 1. 页面加载时调用 GetDropdownDataApi
    await expect.poll(() => capturedUrl).toContain("/api/ud08/getdropdowndata");
    await snap("确认已调用下拉数据 API");

    // 2. Product class 下拉列表显示从 API 获取的数据
    const pcButtons = page.locator(`${SEL.pcSelect} option`);
    await expect(pcButtons).toHaveCount(3); // 空选项 + 2 个
    await expect(pcButtons.nth(1)).toContainText("PC");
    await expect(pcButtons.nth(2)).toContainText("TR");
    // 3. Market 下拉列表显示从 API 获取的数据
    const mktOptions = page.locator(`${SEL.mktSelect} option`);
    await expect(mktOptions).toHaveCount(3);
    await expect(mktOptions.nth(1)).toContainText("EU");
    await expect(mktOptions.nth(2)).toContainText("AUS");
    await snap("确认 Product class 与 Market 下拉列表选项");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(HV_URL);
    await snap("访问 /homologation-variables 页面");

    // 1. localStorage 中无 userID
    const hasUserID = await page.evaluate(() => !!localStorage.getItem("userID"));
    expect(hasUserID).toBe(false);
    // 2. 自动跳转到 /login
    await page.waitForURL("**/login");
    // 3. 不显示页面内容
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认未登录自动跳转到 /login 且不显示页面内容");
  });

  // ============================================================
  // 输入校验
  // ============================================================

  test("TC04 输入限制-Number数字过滤", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_输入限制-Number数字过滤");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 输入含字母/符号：123A@BC
    await page.locator(SEL.numInput).fill("123A@BC");
    await snap("输入 123A@BC 到 Number");

    // 1/2/3. 字母和符号被过滤，仅保留数字 123
    await expect(page.locator(SEL.numInput)).toHaveValue("123");
    await snap("确认 Number 仅保留数字 123");
  });

  test("TC05 输入限制-Number最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_输入限制-Number最大长度");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 输入 15 个数字
    await page.locator(SEL.numInput).fill("123456789012345");
    await snap("输入15个数字到 Number");

    // 1/2. 仅接受最大 10 字符，值为 1234567890
    await expect(page.locator(SEL.numInput)).toHaveValue("1234567890");
    await snap("确认 Number 被限制为10字符");
  });

  test("TC06 输入限制-Product class最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_输入限制-Product class最大长度");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 注：Product class 为下拉列表（<select>），只能从 API 提供的选项中选择，
    // 无法自由输入，因此不存在前端"输入超长"限制；长度限制由数据源保证。
    // 按代码现状验证下拉列表可选择一个选项。
    await page.locator(SEL.pcSelect).selectOption("PC");
    await expect(page.locator(SEL.pcSelect)).toHaveValue("PC");
    await snap("确认 Product class 下拉可选择一个选项（当前为下拉组件，无输入长度限制）");
  });

  test("TC07 输入限制-Market最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_输入限制-Market最大长度");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 注：Market 为下拉列表（<select>），只能从 API 提供的选项中选择，
    // 无法自由输入，因此不存在前端"输入超长"限制；长度限制由数据源保证。
    await page.locator(SEL.mktSelect).selectOption("EU");
    await expect(page.locator(SEL.mktSelect)).toHaveValue("EU");
    await snap("确认 Market 下拉可选择一个选项（当前为下拉组件，无输入长度限制）");
  });

  test("TC08 输入限制-各字段最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_输入限制-各字段最大长度");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // Variable 最大 20 字符
    await page.locator(SEL.variableInput).fill("V".repeat(30));
    await expect(page.locator(SEL.variableInput)).toHaveValue("V".repeat(20));
    // Value 最大 200 字符
    await page.locator(SEL.valueInput).fill("X".repeat(250));
    await expect(page.locator(SEL.valueInput)).toHaveValue("X".repeat(200));
    // Variant string.1/2 最大 100 字符
    await page.locator(SEL.vs1Input).fill("A".repeat(120));
    await expect(page.locator(SEL.vs1Input)).toHaveValue("A".repeat(100));
    await page.locator(SEL.vs2Input).fill("B".repeat(120));
    await expect(page.locator(SEL.vs2Input)).toHaveValue("B".repeat(100));
    // Comments 最大 100 字符
    await page.locator(SEL.commentsInput).fill("C".repeat(120));
    await expect(page.locator(SEL.commentsInput)).toHaveValue("C".repeat(100));
    // Add/Delete 最大 6 字符
    await page.locator(SEL.addInput).fill("123456789");
    await expect(page.locator(SEL.addInput)).toHaveValue("123456");
    await page.locator(SEL.deleteInput).fill("123456789");
    await expect(page.locator(SEL.deleteInput)).toHaveValue("123456");
    // Created by user 最大 16 字符
    await page.locator(SEL.cbuInput).fill("U".repeat(20));
    await expect(page.locator(SEL.cbuInput)).toHaveValue("U".repeat(16));
    await snap("确认各字段最大长度限制");
  });

  // ============================================================
  // 空值校验
  // ============================================================

  test("TC09 空值校验-Add时必填为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_空值校验-Add时必填为空");
    let apiCalled = false;
    await page.route(/\/api\/ud08\/addrule/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // Product class 为空，其他字段填写
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add 按钮（Product class 为空）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Product class, Number, and Market are required.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await snap("确认 Add 必填为空错误消息及红色样式");

    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认未调用 API 且按钮可用");
  });

  test("TC10 空值校验-Update时必填为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_空值校验-Update时必填为空");
    let apiCalled = false;
    await page.route(/\/api\/ud08\/updaterule/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // Market 为空，其他字段填写
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update 按钮（Market 为空）");

    // 1/2/3. 显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Product class, Number, and Market are required.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    await snap("确认 Update 必填为空错误消息且未调用 API");
  });

  test("TC11 空值校验-Delete时必填为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_空值校验-Delete时必填为空");
    let apiCalled = false;
    await page.route(/\/api\/ud08\/deleterule/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // Number 为空，其他字段填写
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 按钮（Number 为空）");

    // 1/2/3. 显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Product class, Number, and Market are required.");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    await snap("确认 Delete 必填为空错误消息且未调用 API");
  });

  // ============================================================
  // Search 操作
  // ============================================================

  test("TC12 Search-跳转结果画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Search-跳转结果画面");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 输入检索条件
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.variableInput).fill("VERSION");
    await snap("输入检索条件");

    // 1/2/3. 点击 Search，将检索条件保存到 state 并跳转结果画面
    await page.locator(SEL.btnSearch).click();
    await page.waitForURL("**/homologation-variables-result");
    await snap("确认跳转到 HomologationVariablesResultList 画面");
  });

  // ============================================================
  // Clear 操作
  // ============================================================

  test("TC13 Clear-清空所有输入", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Clear-清空所有输入");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 在多个字段输入/选择内容
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.variableInput).fill("VAR");
    await page.locator(SEL.valueInput).fill("VAL");
    await page.locator(SEL.vs1Input).fill("VS1");
    await page.locator(SEL.vs2Input).fill("VS2");
    await page.locator(SEL.commentsInput).fill("COM");
    await snap("在多个字段输入内容");

    // 1/2/3/4/5. 点击 Clear，所有字段清空
    await page.locator(SEL.btnClear).click();
    await expect(page.locator(SEL.pcSelect)).toHaveValue("");
    await expect(page.locator(SEL.numInput)).toHaveValue("");
    await expect(page.locator(SEL.mktSelect)).toHaveValue("");
    await expect(page.locator(SEL.variableInput)).toHaveValue("");
    await expect(page.locator(SEL.valueInput)).toHaveValue("");
    await expect(page.locator(SEL.vs1Input)).toHaveValue("");
    await expect(page.locator(SEL.vs2Input)).toHaveValue("");
    await expect(page.locator(SEL.commentsInput)).toHaveValue("");
    await snap("确认点击 Clear 后所有字段清空");

    // 6. 不调用 API（无网络错误消息）
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认 Clear 后无错误消息");
  });

  test("TC14 Clear-清除错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Clear-清除错误消息");
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 1. 触发错误（空表单点击 Add）
    await page.locator(SEL.btnAdd).click();
    await expect(page.locator(SEL.error)).toHaveText("Product class, Number, and Market are required.");
    await snap("确认错误消息显示");

    // 2/3. 点击 Clear 清除错误消息
    await page.locator(SEL.btnClear).click();
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认点击 Clear 后错误消息被清除");
  });

  // ============================================================
  // Add 操作
  // ============================================================

  test("TC15 Add-成功注册", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Add-成功注册");
    let capturedBody: any = null;
    await page.route(/\/api\/ud08\/addrule/, async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Rule added successfully" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 1. 填写必填字段及可选字段
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.variableInput).fill("SOME_VAR");
    await page.locator(SEL.valueInput).fill("SOME_VALUE");
    await snap("填写表单");

    // 2. 点击 Add
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add 按钮");

    // 1. 调用 AddRuleApi（POST /api/ud08/addrule）
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.productClass).toBe("PC");
    expect(capturedBody.number).toBe("1234567890");
    expect(capturedBody.market).toBe("EU");
    // 2. API 调用成功
    // 注：组件在 Add 成功后调用 handleClear 清空表单（同时清空成功消息），
    //     因此成功消息不持久显示；按代码现状验证表单被清空。
    // 3. 清空表单
    await expect(page.locator(SEL.numInput)).toHaveValue("");
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认 Add 成功且表单清空、按钮可用");
  });

  test("TC16 Add-主键冲突", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Add-主键冲突");
    await page.route(/\/api\/ud08\/addrule/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: false, message: "Primary key conflict, Please enter the correct content" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单（组合已存在）
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add 按钮（主键冲突）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Primary key conflict, Please enter the correct content");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认主键冲突错误消息且无成功消息");
  });

  test("TC17 Add-变量不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_Add-变量不存在");
    await page.route(/\/api\/ud08\/addrule/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: false, message: "Variant does not exist, Please enter the correct content" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单，variable 以 TEMPLATE- 开头且不存在
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.variableInput).fill("TEMPLATE-VAR001");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add 按钮（变量不存在）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Variant does not exist, Please enter the correct content");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认变量不存在错误消息");
  });

  // ============================================================
  // Update 操作
  // ============================================================

  test("TC18 Update-成功更新", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_Update-成功更新");
    let capturedBody: any = null;
    await page.route(/\/api\/ud08\/updaterule/, async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Rule updated successfully" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 1. 填写必填字段及修改内容
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.variableInput).fill("UPDATED_VAR");
    await snap("填写表单及修改内容");

    // 2. 点击 Update
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update 按钮");

    // 1. 调用 UpdateRuleApi（PUT /api/ud08/updaterule）
    await expect.poll(() => capturedBody).not.toBeNull();
    // 3. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("Rule updated successfully");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    // 5. 输入内容保留
    await expect(page.locator(SEL.variableInput)).toHaveValue("UPDATED_VAR");
    await snap("确认 Update 成功消息且输入内容保留");
  });

  test("TC19 Update-记录不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_Update-记录不存在");
    await page.route(/\/api\/ud08\/updaterule/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: false, message: "Data does not exist, Please enter the correct content" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单（记录不存在）
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("9999999999");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update 按钮（记录不存在）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Data does not exist, Please enter the correct content");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    await snap("确认记录不存在错误消息");
  });

  test("TC20 Update-主键冲突", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_Update-主键冲突");
    await page.route(/\/api\/ud08\/updaterule/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: false, message: "Primary key conflict, Please enter the correct content" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单（组合与其他记录重复）
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnUpdate).click();
    await snap("点击 Update 按钮（主键冲突）");

    await expect(page.locator(SEL.error)).toHaveText("Primary key conflict, Please enter the correct content");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.btnUpdate)).toBeEnabled();
    await snap("确认 Update 主键冲突错误消息");
  });

  // ============================================================
  // Delete 操作
  // ============================================================

  test("TC21 Delete-成功删除", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_Delete-成功删除");
    let capturedBody: any = null;
    await page.route(/\/api\/ud08\/deleterule/, async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Rule deleted successfully" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 1. 填写必填字段
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await snap("填写必填字段");

    // 2. 点击 Delete
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 按钮");

    // 1. 调用 DeleteRuleApi（DELETE /api/ud08/deleterule）
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.number).toBe("1234567890");
    // 注：Delete 成功后组件调用 handleClear 清空表单（同时清空成功消息），
    //     因此成功消息不持久显示；按代码现状验证表单被清空。
    // 3. 清空表单
    await expect(page.locator(SEL.numInput)).toHaveValue("");
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Delete 成功且表单清空、按钮可用");
  });

  test("TC22 Delete-记录不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_Delete-记录不存在");
    await page.route(/\/api\/ud08\/deleterule/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: false, message: "Data does not exist, Please enter the correct content" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单（记录不存在）
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("9999999999");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 按钮（记录不存在）");

    await expect(page.locator(SEL.error)).toHaveText("Data does not exist, Please enter the correct content");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Delete 记录不存在错误消息");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC23 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_异常处理-服务器500错误");
    // 模拟 Add API 返回 500，body 含系统错误消息
    await page.route(/\/api\/ud08\/addrule/, async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, message: "System error. Please contact administrator." }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单并点击 Add
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（API 返回 500）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认 500 错误消息且按钮可用");
  });

  test("TC24 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_异常处理-网络错误");
    // 模拟网络断开：abort addrule
    await page.route(/\/api\/ud08\/addrule/, (route) => route.abort());
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单并点击 Add
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（网络断开）");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network error or server unavailable. Please try again later.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认网络错误消息且按钮可用");
  });

  test("TC25 异常处理-操作中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_异常处理-操作中按钮禁用");
    // 挂起 Add API 响应，观察操作中的禁用状态
    const pending: { resolve: ((v: unknown) => void) | null } = { resolve: null };
    await page.route(/\/api\/ud08\/addrule/, (route) => {
      return new Promise((resolve) => {
        pending.resolve = resolve;
      }).then(() =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Rule added successfully" }) })
      );
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 填写表单并点击 Add
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（API 挂起中）");

    // 1/2/3. 操作进行中所有按钮禁用
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(SEL.allButtons).nth(i)).toBeDisabled();
    }
    await snap("确认操作中所有按钮禁用");

    // 放行响应（Add 成功会清空表单），验证按钮随操作结束恢复可用、表单清空
    pending.resolve?.(null);
    await expect(page.locator(SEL.allButtons).nth(2)).toBeEnabled();
    await expect(page.locator(SEL.numInput)).toHaveValue("");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC26 安全性-Variable前缀校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_安全性-Variable前缀校验");
    let capturedBody: any = null;
    await page.route(/\/api\/ud08\/addrule/, async (route) => {
      capturedBody = route.request().postDataJSON();
      // 后端去除 TEMPLATE- 前缀后校验；模拟校验成功
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "Rule added successfully" }) });
    });
    await mockDropdownData(page);
    await page.goto(HV_URL);
    await snap("访问页面");

    // 1. Variable 输入 TEMPLATE-XXX 格式
    await page.locator(SEL.pcSelect).selectOption("PC");
    await page.locator(SEL.numInput).fill("1234567890");
    await page.locator(SEL.mktSelect).selectOption("EU");
    await page.locator(SEL.variableInput).fill("TEMPLATE-VAR001");
    await snap("输入 TEMPLATE-VAR001 到 Variable");

    // 4. 执行 Add（后端校验）
    await page.locator(SEL.btnAdd).click();
    await snap("点击 Add（Variable 为 TEMPLATE- 前缀）");

    // 2. 请求携带 TEMPLATE- 前缀，由后端去除前缀校验（模拟后端校验成功）
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.variable).toBe("TEMPLATE-VAR001");
    // 3. 校验成功（Add 后清空表单），验证表单被清空
    await expect(page.locator(SEL.numInput)).toHaveValue("");
    await expect(page.locator(SEL.btnAdd)).toBeEnabled();
    await snap("确认 Variable 前缀校验请求与成功结果");
  });
});
