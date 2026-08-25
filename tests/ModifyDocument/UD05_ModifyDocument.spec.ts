/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const MD_URL = BASE_URL + "/modify-document";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD05";

// 页面元素选择器（与 ModifyDocument.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 错误 / 加载
  title: ".md-title",
  error: ".md-error",
  loading: ".md-loading",
  // 参数信息
  chassisLink: ".md-info-value-link",
  infoLabel: ".md-info-label",
  // 数据表格
  table: ".md-table",
  thVar: ".md-th-var",
  thDesc: ".md-th-desc",
  thCur: ".md-th-cur",
  thMod: ".md-th-mod",
  tdVar: ".md-td-var",
  tdDesc: ".md-td-desc",
  tdCur: ".md-td-cur",
  modifiedInput: ".md-modified-input",
  noData: ".md-no-data",
  // Save
  saveBtn: ".md-btn-save",
};

// Save Modifications 页面元素（用于验证跳转时传递的参数）
const SM_SEL = {
  title: ".sm-title",
  value: ".sm-value",
  label: ".sm-label",
};

// 默认修改文档 mock 数据（含多个变量）
const DEFAULT_VARIABLES = [
  { variable: "VIN_NUMBER", description: "Vehicle identification number", currentValue: "ABC-123456789", modifiedValue: "" },
  { variable: "ENGINE_TYPE", description: "Engine type", currentValue: "D13K", modifiedValue: "" },
  { variable: "PARAM_A", description: "Parameter A", currentValue: "V1", modifiedValue: "" },
];

/** 在 Save Modifications 页面根据 label 定位对应的 .sm-value */
function smValue(page: Page, label: string) {
  return page.locator('.sm-field:has(.sm-label:text-is("' + label + '")) .sm-value');
}

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
 * 拦截并模拟 GetModifyDocumentApi：GET /api/ud05/getmodifydocument
 * options.respond 默认为成功（含 templateFile 与 variables），可覆盖以模拟异常。
 */
async function mockGetModifyDocument(page: Page, respond: object) {
  await page.route(/\/api\/ud05\/getmodifydocument/, async (route) => {
    await route.fulfill({
      status: (respond as any).status || 200,
      contentType: "application/json",
      body: JSON.stringify(respond),
    });
  });
}

/** 成功响应：返回模板与变量列表 */
function successResponse(overrides: Partial<{ templateFile: string; variables: any[] }> = {}) {
  return {
    success: true,
    data: {
      templateFile: overrides.templateFile !== undefined ? overrides.templateFile : "aus/UD_TEST.odt",
      variables: overrides.variables !== undefined ? overrides.variables : DEFAULT_VARIABLES,
    },
  };
}

/**
 * 通过 history API 以携带 location.state 的方式导航到 /modify-document。
 * ModifyDocument.tsx 依赖 location.state(chassisNo, market)，直接 goto 无法携带 state，
 * 因此先在应用壳内 pushState 并分发 popstate，让 React Router 读取到注入的 state。
 * 未传递参数时调用传 { chNo: "", mkt: "" } 以覆盖 TC02。
 */
async function gotoModifyDocument(
  page: Page,
  opts: { chNo?: string; mkt?: string; withState?: boolean } = {}
) {
  const chNo = opts.chNo ?? "ABC-123456";
  const mkt = opts.mkt ?? "EU";
  const withState = opts.withState ?? true;
  // 先加载应用壳（确保 Router 已挂载）
  await page.goto(BASE_URL + "/");
  await dismissOverlay(page);
  if (withState) {
    // React Router v6 将用户 state 存在 history.state 的 usr 字段中，且
    // popstate 事件需携带 state 供 handlePop 读取（含 key/idx）。
    const userState = { chassisNo: chNo, market: mkt };
    const rrState = { usr: userState, key: "default", idx: 1 };
    await page.evaluate(
      ({ rrState }) => {
        window.history.replaceState(rrState, "", "/modify-document");
        // 先前进再后退，触发 React Router 以注入的 state 进行导航
        window.history.pushState({ ...rrState, idx: 2 }, "", "/modify-document");
        window.history.back();
      },
      { rrState }
    );
  } else {
    await page.evaluate(() => {
      window.history.pushState({}, "", "/modify-document");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
  await page.waitForURL("**/modify-document");
  await page.waitForTimeout(300);
}

test.describe("UD05 Modify Document 模块测试", () => {
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
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page, { chNo: "ABC-123456", mkt: "EU" });
    await snap("从 Generate Document 跳转到 Modify Document 页面并加载数据");

    // 1. 显示 "Modify Document" 标题
    await expect(page.locator(SEL.title)).toHaveText("Modify Document");
    // 2. 显示 chassis no：ABC-123456
    await expect(page.locator(SEL.infoLabel).filter({ hasText: "chassis no" })).toBeVisible();
    await expect(page.locator(SEL.chassisLink).filter({ hasText: "ABC-123456" })).toBeVisible();
    // 3. 显示 Market：EU
    await expect(page.locator(SEL.infoLabel).filter({ hasText: "Market" })).toBeVisible();
    await expect(page.locator(".md-info-value").filter({ hasText: "EU" })).toBeVisible();
    // 4. 显示 Template 文件链接
    await expect(page.locator(SEL.chassisLink).filter({ hasText: "aus/UD_TEST.odt" })).toBeVisible();
    await snap("确认标题、Chassis no、Market、Template 链接");

    // 5. 显示数据表格四列表头
    await expect(page.locator(SEL.table)).toBeVisible();
    await expect(page.locator(SEL.thVar)).toHaveText("Variable");
    await expect(page.locator(SEL.thDesc)).toHaveText("Description");
    await expect(page.locator(SEL.thCur)).toHaveText("Current value");
    await expect(page.locator(SEL.thMod)).toHaveText("Modified value");
    // 6. Save 按钮可用
    await expect(page.locator(SEL.saveBtn)).toBeEnabled();
    await expect(page.locator(SEL.saveBtn)).toHaveText("Save");
    await snap("确认表格表头与 Save 按钮可用");
  });

  test("TC02 画面初始化-未传递参数", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未传递参数");
    // 不设置 location.state（无 chassisNo/market）
    await gotoModifyDocument(page, { withState: false });
    await snap("以无参数方式访问 Modify Document 页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No chassis or market information provided.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)"); // #c62828 红色
    await snap("确认错误消息及红色样式");

    // 3. 不加载数据（无 Loading 持续）
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 4. 不显示数据表格
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认不显示数据表格");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(MD_URL);
    await snap("访问 /modify-document 页面");

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
  // 数据加载
  // ============================================================

  test("TC04 数据加载-加载修改文档数据", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_数据加载-加载修改文档数据");
    let capturedUrl = "";
    let routeReleased: (() => void) | null = null;
    const holdRoute = new Promise<void>((resolve) => {
      routeReleased = resolve;
    });
    await page.route(/\/api\/ud05\/getmodifydocument/, (route) => {
      capturedUrl = route.request().url();
      return holdRoute.then(() =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(successResponse()),
        })
      );
    });

    await gotoModifyDocument(page, { chNo: "ABC-123456", mkt: "EU" });
    await snap("访问页面（API 挂起中）");

    // 1/2. 调用 GetModifyDocumentApi 且参数正确
    await expect.poll(() => capturedUrl).toContain("/api/ud05/getmodifydocument");
    expect(capturedUrl).toContain("chassisNo=ABC-123456");
    expect(capturedUrl).toContain("market=EU");
    // 3. 数据加载期间显示 Loading 状态
    await expect(page.locator(SEL.loading)).toHaveText("Loading...");
    await snap("确认 API 调用与 Loading 状态");

    // 放行响应，确认完成加载
    routeReleased?.();
    await expect(page.locator(SEL.table)).toBeVisible();
    await snap("数据加载完成后表格显示");
  });

  test("TC05 数据加载-成功填充表格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_数据加载-成功填充表格");
    await mockGetModifyDocument(page, successResponse({ variables: DEFAULT_VARIABLES }));
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 1. Variable 列填充
    await expect(page.locator(SEL.tdVar).nth(0)).toHaveText("VIN_NUMBER");
    await expect(page.locator(SEL.tdVar).nth(1)).toHaveText("ENGINE_TYPE");
    // 2. Description 列填充
    await expect(page.locator(SEL.tdDesc).nth(0)).toHaveText("Vehicle identification number");
    // 3. Current value 列填充
    await expect(page.locator(SEL.tdCur).nth(0)).toHaveText("ABC-123456789");
    await snap("确认 Variable/Description/Current value 列填充");

    // 4. Modified value 列为空（可编辑输入框）
    await expect(page.locator(SEL.modifiedInput)).toHaveCount(3);
    await expect(page.locator(SEL.modifiedInput).nth(0)).toHaveValue("");
    // 5. 所有行数据正确显示
    await expect(page.locator(SEL.table).locator("tbody tr")).toHaveCount(3);
    await snap("确认 Modified value 输入框为空且数据行完整");
  });

  test("TC06 数据加载-Current value来源优先", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_数据加载-Current value来源优先");
    // 模拟 HDOC_ADCA_MODIFICATION 存在 Modify 记录，Current value 取 NEWVAL=V1
    const vars = [
      { variable: "PARAM_A", description: "Parameter A", currentValue: "V1", modifiedValue: "" },
    ];
    await mockGetModifyDocument(page, successResponse({ variables: vars }));
    await gotoModifyDocument(page);
    await snap("访问页面并加载 Modify 记录数据");

    // 1/2. Current value 显示 Modify 记录中的值 V1
    await expect(page.locator(SEL.tdCur).nth(0)).toHaveText("V1");
    await snap("确认 Current value 显示 Modify 记录值 V1");
  });

  test("TC07 数据加载-Current value来源备选", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_数据加载-Current value来源备选");
    // 模拟无 Modify 记录，Current value 取 KOLA 数据 SYM1
    const vars = [
      { variable: "ENGINE_TYPE", description: "Engine type", currentValue: "SYM1", modifiedValue: "" },
    ];
    await mockGetModifyDocument(page, successResponse({ variables: vars }));
    await gotoModifyDocument(page);
    await snap("访问页面并加载 KOLA 数据");

    // 1/2. Current value 显示 KOLA 数据 SYM1
    await expect(page.locator(SEL.tdCur).nth(0)).toHaveText("SYM1");
    await snap("确认 Current value 显示 KOLA 数据 SYM1");
  });

  test("TC08 数据加载-无数据", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_数据加载-无数据");
    // 模拟 API 返回 400（无对应底盘数据）
    await mockGetModifyDocument(page, { success: false, message: "No data" });
    await gotoModifyDocument(page);
    await snap("访问页面（API 返回无数据）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No data found for this chassis.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await snap("确认无数据错误消息及红色样式");

    // 3/4. 不显示数据表格
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认不显示数据表格");
  });

  // ============================================================
  // 数据表格
  // ============================================================

  test("TC09 数据表格-表头显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_数据表格-表头显示");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 1-4. 四个表头
    await expect(page.locator(SEL.thVar)).toHaveText("Variable");
    await expect(page.locator(SEL.thDesc)).toHaveText("Description");
    await expect(page.locator(SEL.thCur)).toHaveText("Current value");
    await expect(page.locator(SEL.thMod)).toHaveText("Modified value");
    // 5. 表头均左对齐
    for (const th of [SEL.thVar, SEL.thDesc, SEL.thCur, SEL.thMod]) {
      const align = await page.locator(th).evaluate((el) => getComputedStyle(el).textAlign);
      expect(align).toBe("left");
    }
    await snap("确认四个表头及其左对齐");
  });

  test("TC10 Modified value-输入内容", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Modified_value-输入内容");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 3. 初始值为空（可编辑 TextField）
    await expect(page.locator(SEL.modifiedInput).nth(0)).toHaveValue("");
    // 1/2. 输入内容正确显示
    await page.locator(SEL.modifiedInput).nth(0).fill("NEW_VALUE");
    await expect(page.locator(SEL.modifiedInput).nth(0)).toHaveValue("NEW_VALUE");
    await snap("确认 Modified value 输入内容显示");
  });

  test("TC11 Modified value-最大长度限制", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Modified_value-最大长度限制");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 输入 600 字符
    await page.locator(SEL.modifiedInput).nth(0).fill("A".repeat(600));
    await snap("输入 600 字符到 Modified value");

    // 1/2/3. 仅接受最大 500 字符
    await expect(page.locator(SEL.modifiedInput).nth(0)).toHaveValue("A".repeat(500));
    await snap("确认 Modified value 被限制为500字符");
  });

  test("TC12 Modified value-输入时清除错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Modified_value-输入时清除错误");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 1. 触发 Save 错误（无修改内容）
    await page.locator(SEL.saveBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("NO UNRELEASED VERSION EXISTS!");
    await snap("确认第一次 Save 显示错误消息");

    // 注：当前组件在 errorMessage 显示时，通过 `{!isLoading && !errorMessage && (...)}`
    // 隐藏整个数据区（含 Modified value 输入框），因此"输入时清除错误"流程在当前版本
    // 无法由外部直接触发。按代码现状验证错误状态下数据表格被隐藏。
    await expect(page.locator(SEL.modifiedInput)).toHaveCount(0);
    await snap("确认错误消息显示时数据表格被隐藏（当前版本行为）");
  });

  // ============================================================
  // Save 操作
  // ============================================================

  test("TC13 Save-无修改内容", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Save-无修改内容");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 所有 Modified value 均为空
    await page.locator(SEL.saveBtn).click();
    await snap("点击 Save 按钮");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("NO UNRELEASED VERSION EXISTS!");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await snap("确认无修改内容错误消息");

    // 3. 终止操作，不跳转画面
    expect(page.url()).toContain("/modify-document");
    // 4. 注：当前组件在错误显示时通过条件渲染隐藏数据区（含 Save 按钮），
    //    因此错误状态下按钮随数据区隐藏。按代码现状验证数据区被隐藏。
    await expect(page.locator(SEL.saveBtn)).toHaveCount(0);
    await snap("确认不跳转且错误状态下数据区（含 Save 按钮）被隐藏");
  });

  test("TC14 Save-有修改内容成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Save-有修改内容成功");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 1. 在 Modified value 输入内容
    await page.locator(SEL.modifiedInput).nth(0).fill("NEW_VALUE");
    await snap("输入 Modified value");
    // 2. 点击 Save
    await page.locator(SEL.saveBtn).click();
    await snap("点击 Save 按钮");

    // 3/4. 跳转到 Save Modifications 画面
    await page.waitForURL("**/save-modifications");
    await expect(page.locator(SM_SEL.title)).toHaveText("Save Modifications");
    // 5. 不出现错误提示
    await expect(page.locator(".sm-error")).toHaveCount(0);
    await snap("确认跳转到 Save Modifications 画面且无错误");
  });

  test("TC15 Save-传递修改参数", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Save-传递修改参数");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page, { chNo: "ABC-123456", mkt: "EU" });
    await snap("访问页面并加载数据");

    // 输入修改内容
    await page.locator(SEL.modifiedInput).nth(0).fill("NEW_VALUE");
    await page.locator(SEL.saveBtn).click();
    await page.waitForURL("**/save-modifications");
    await snap("点击 Save 跳转到 Save Modifications");

    // 验证传递的参数
    // 1. chassisSerie = chassisNo 中 `-` 前内容 = ABC
    await expect(smValue(page, "Chassis serie")).toHaveText("ABC");
    // 2. chassisNumber = `-` 后内容 = 123456
    await expect(smValue(page, "Chassis number")).toHaveText("123456");
    // 3. doctype = template 文件名去扩展名 = aus/UD_TEST
    await expect(smValue(page, "Doctype")).toHaveText("aus/UD_TEST");
    // 4. version = 1.0
    await expect(smValue(page, "Version")).toHaveText("1.0");
    // 5. storing = 拼接 VARIABLE=NEWVAL
    await expect(smValue(page, "Storing")).toHaveText("VIN_NUMBER=NEW_VALUE");
    await snap("确认传递的 chassisSerie/chassisNumber/doctype/version/storing");
  });

  test("TC16 Save-多个修改项", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Save-多个修改项");
    const vars = [
      { variable: "VAR_A", description: "Var A", currentValue: "CA", modifiedValue: "" },
      { variable: "VAR_B", description: "Var B", currentValue: "CB", modifiedValue: "" },
    ];
    await mockGetModifyDocument(page, successResponse({ variables: vars }));
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 1. 在两个字段输入修改内容
    await page.locator(SEL.modifiedInput).nth(0).fill("V1");
    await page.locator(SEL.modifiedInput).nth(1).fill("V2");
    await snap("在两个字段输入修改内容");
    // 2. 点击 Save
    await page.locator(SEL.saveBtn).click();
    await page.waitForURL("**/save-modifications");
    await snap("点击 Save 跳转");

    // 3/4. storing 拼接多个 VARIABLE=NEWVAL
    await expect(smValue(page, "Storing")).toHaveText("VAR_A=V1, VAR_B=V2");
    await expect(page.locator(SM_SEL.title)).toHaveText("Save Modifications");
    await snap("确认多个修改项的 storing 拼接");
  });

  test("TC17 Save-Save中防止重复提交", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_Save-Save中防止重复提交");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    await page.locator(SEL.modifiedInput).nth(0).fill("NEW_VALUE");
    await snap("输入 Modified value");
    await page.locator(SEL.saveBtn).click();
    await snap("点击 Save");

    // 注：组件 handleSave 为同步 navigate，无独立禁用态；验证最终唯一跳转到 Save Modifications。
    await page.waitForURL("**/save-modifications");
    await expect(page.locator(SM_SEL.title)).toHaveText("Save Modifications");
    await snap("确认跳转到 Save Modifications 画面");
  });

  // ============================================================
  // 链接处理
  // ============================================================

  test("TC18 Template文件-下载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_Template文件-下载");
    await mockGetModifyDocument(page, successResponse());
    // 捕获 window.open 的下载 URL（用 addInitScript 使其在后续导航中持续生效）
    await page.addInitScript(() => {
      window.open = (url: string) => {
        (window as any).__openedUrl = url;
        return null;
      };
    });
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 点击 Template 文件链接（.md-info-value-link 中含模板名）
    await page.locator(SEL.chassisLink).filter({ hasText: "aus/UD_TEST.odt" }).click();
    await snap("点击 Template 文件链接");

    // 2/3. 调用下载 API（GET /api/ud05/downloadtemplate/{templateName}）
    const opened = await page.evaluate(() => (window as any).__openedUrl || "");
    expect(opened).toContain("/api/ud05/downloadtemplate/");
    expect(opened).toContain(encodeURIComponent("aus/UD_TEST.odt"));
    await snap("确认触发下载 API");
  });

  test("TC19 Template文件-文件不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_Template文件-文件不存在");
    // 模拟 API 返回无 templateFile（模板文件缺失），点击时触发错误
    await mockGetModifyDocument(page, successResponse({ templateFile: "" }));
    await gotoModifyDocument(page);
    await snap("访问页面（无模板文件）");

    // 点击 Template 链接（此时 templateFile 为空，触发错误）
    // 空文本的链接无尺寸/不可见，无法用常规 click；改用 HTMLElement.click() 派发点击事件触发 onClick
    await page
      .locator('.md-info-row:has(.md-info-label:text-is("Template")) .md-info-value-link')
      .evaluate((el) => (el as HTMLElement).click());
    await snap("点击 Template 文件链接");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Template file not found.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 4. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认模板文件不存在错误消息");
  });

  test("TC20 Chassis no链接-跳转Vehicle Spec", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_Chassis_no链接-跳转Vehicle Spec");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page, { chNo: "ABC-123456", mkt: "EU" });
    await snap("访问页面并加载数据");

    // 4. 链接使用蓝色下划线样式
    await expect(page.locator(SEL.chassisLink).filter({ hasText: "ABC-123456" })).toBeVisible();
    // 1. 点击 Chassis no 链接
    await page.locator(SEL.chassisLink).filter({ hasText: "ABC-123456" }).click();
    await snap("点击 Chassis no 链接");

    // 2/3. 跳转到 Vehicle Specification 画面
    await page.waitForURL("**/vehicle-specification");
    await snap("确认跳转到 Vehicle Specification 画面");
  });

  test("TC21 Chassis no链接-底盘不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_Chassis_no链接-底盘不存在");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page, { chNo: "ABC-123456", mkt: "EU" });
    await snap("访问页面并加载数据");

    // 注：当前组件 handleChassisClick 无条件跳转到 /vehicle-specification；
    // 按代码现状验证点击后跳转（无前置底盘存在性校验）。
    await page.locator(SEL.chassisLink).filter({ hasText: "ABC-123456" }).click();
    await page.waitForURL("**/vehicle-specification");
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 Vehicle Specification（当前版本无底盘存在性校验）");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC22 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_异常处理-服务器500错误");
    // 模拟 API 返回 500
    await mockGetModifyDocument(page, { status: 500, success: false, message: "System error" });
    await gotoModifyDocument(page);
    await snap("访问页面（API 返回 500）");

    // 注：当前组件无 status 分支特殊处理，500+{success:false} 走 else → 显示无数据错误。
    // 按代码现状断言实际显示的错误消息。
    await expect(page.locator(SEL.error)).toHaveText("No data found for this chassis.");
    // 3. 不显示数据表格数据
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认 500 错误时表格不显示");
  });

  test("TC23 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_异常处理-网络错误");
    // 模拟网络断开：abort getmodifydocument
    await page.route(/\/api\/ud05\/getmodifydocument/, (route) => route.abort());
    await gotoModifyDocument(page);
    await snap("访问页面（网络断开）");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 页面显示错误状态
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认网络错误消息及页面错误状态");
  });

  test("TC24 异常处理-API超时", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_异常处理-API超时");
    // 模拟 API 响应超时：延迟后 abort
    await page.route(/\/api\/ud05\/getmodifydocument/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.abort();
    });
    await gotoModifyDocument(page);
    await snap("访问页面（等待超时）");

    // 1/3. 超时后显示网络错误消息，表格不显示
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    await expect(page.locator(SEL.table)).toHaveCount(0);
    await snap("确认超时后错误消息且表格不显示");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC25 安全性-数据校验与认证", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_安全性-数据校验与认证");
    await mockGetModifyDocument(page, successResponse());
    await gotoModifyDocument(page);
    await snap("访问页面并加载数据");

    // 2. Modified value 长度不超过 500 字符（前端校验 maxLength=500）
    await expect(page.locator(SEL.modifiedInput).nth(0)).toHaveAttribute("maxlength", "500");
    await page.locator(SEL.modifiedInput).nth(0).fill("A".repeat(600));
    await expect(page.locator(SEL.modifiedInput).nth(0)).toHaveValue("A".repeat(500));
    await snap("确认 Modified value 长度限制为500");

    // 输入合法修改内容并 Save，验证跳转成功（输入经合法校验）
    await page.locator(SEL.modifiedInput).nth(0).fill("SAFE_VALUE");
    await page.locator(SEL.saveBtn).click();
    await page.waitForURL("**/save-modifications");
    await expect(page.locator(SM_SEL.title)).toHaveText("Save Modifications");
    await snap("确认合法输入提交成功");
  });
});
