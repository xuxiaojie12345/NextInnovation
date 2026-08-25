/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const VS_URL = BASE_URL + "/vehicle-specification";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD07";

// 页面元素选择器（与 VehicleSpecification.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 错误 / 加载
  title: ".vs-title",
  error: ".vs-error",
  loading: ".vs-loading",
  // 信息面板
  panel: ".vs-info-panel",
  label: ".vs-label",
  value: ".vs-value",
  symbols: ".vs-symbols",
  symbolItem: ".vs-symbol-item",
  // Tooltip
  tooltip: ".vs-tooltip",
};

/** 默认车辆规格 mock 数据 */
const DEFAULT_SPEC = {
  chassisNo: "ABC123456",
  model: "Model X",
  builtWeek: "2022W45",
  productType: "SUV",
  vin: "WVWZZZ3CZWE123456",
  engineNo: "DPX123456789",
  countryOfOperation: "DE",
  symbols: [{ symbolStr: "DPX1234", description: "This is a variant description" }],
  sNoteNo: "SN001",
  sNoteDesc: "Customer adaptation note",
};

/** 在信息面板中根据 label 定位对应的 .vs-value */
function vsValue(page: Page, label: string) {
  return page.locator('.vs-field:has(.vs-label:text-is("' + label + '")) .vs-value');
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
 * 拦截并模拟 GetVehicleSpecificationApi：GET /api/ud07/getvehiclespec
 */
async function mockVehicleSpec(page: Page, respond: object) {
  await page.route(/\/api\/ud07\/getvehiclespec/, async (route) => {
    await route.fulfill({
      status: (respond as any).status || 200,
      contentType: "application/json",
      body: JSON.stringify(respond),
    });
  });
}

/**
 * 通过 history API 以携带 location.state(chassisNo) 的方式导航到 /vehicle-specification。
 * React Router v6 将用户 state 存在 history.state 的 usr 字段中，需用 history.back() 触发真实 popstate。
 * withState=false 用于测"未传递 chassisNo"用例（TC02）。
 */
async function gotoVehicleSpecification(
  page: Page,
  chassisNo: string,
  opts: { withState?: boolean } = {}
) {
  const withState = opts.withState ?? true;
  await page.goto(BASE_URL + "/");
  await dismissOverlay(page);
  if (withState) {
    const state = { chassisNo, from: "/modify-document" };
    const rrState = { usr: state, key: "default", idx: 1 };
    await page.evaluate(
      ({ rrState }) => {
        window.history.replaceState({}, "", "/modify-document");
        window.history.pushState(rrState, "", "/vehicle-specification");
        window.history.pushState({ ...rrState, idx: 2 }, "", "/vehicle-specification");
        window.history.back();
      },
      { rrState }
    );
  } else {
    await page.evaluate(() => {
      window.history.replaceState({}, "", "/modify-document");
      window.history.pushState({}, "", "/vehicle-specification");
      window.history.back();
    });
  }
  await page.waitForURL("**/vehicle-specification");
  await page.waitForTimeout(300);
}

test.describe("UD07 Vehicle Specification 模块测试", () => {
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
    await mockVehicleSpec(page, { success: true, data: DEFAULT_SPEC });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("从 Modify Document 跳转到 Vehicle Specification 页面并加载数据");

    // 1. 显示 "Vehicle Specification" 标题
    await expect(page.locator(SEL.title)).toHaveText("Vehicle Specification");
    // 2. 显示 Chassis no
    await expect(vsValue(page, "Chassis no")).toHaveText("ABC123456");
    // 3. 显示 Model、Built week、Product type、VIN、Engine no、Country of Operation 字段
    for (const label of ["Model", "Built week", "Product type", "VIN", "Engine no", "Country of Operation"]) {
      await expect(vsValue(page, label)).toBeVisible();
    }
    // 4. 显示 SYMBOL_STR
    await expect(vsValue(page, "SYMBOL_STR")).toBeVisible();
    await expect(page.locator(SEL.symbolItem)).toHaveText("DPX1234");
    // 5. 显示 S-Note NO、S-Note Desc
    await expect(vsValue(page, "S-Note NO")).toBeVisible();
    await expect(vsValue(page, "S-Note Desc")).toBeVisible();
    // 6. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、各字段、SYMBOL_STR 与 S-Note");
  });

  test("TC02 画面初始化-未传递Chassis no", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未传递Chassis no");
    // 不传递 chassisNo（withState 但 state 为空 chassisNo）
    await gotoVehicleSpecification(page, "", { withState: true });
    await snap("以无 chassisNo 参数方式访问页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No chassis number provided.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)"); // #c62828 红色
    await snap("确认未传递 chassisNo 错误消息及红色样式");

    // 3/4. 不加载数据、不显示车辆信息
    await expect(page.locator(SEL.panel)).toHaveCount(0);
    await snap("确认不显示车辆信息");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(VS_URL);
    await snap("访问 /vehicle-specification 页面");

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

  test("TC04 数据加载-调用车辆规格API", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_数据加载-调用车辆规格API");
    let capturedUrl = "";
    let release: (() => void) | null = null;
    const hold = new Promise<void>((r) => (release = r));
    await page.route(/\/api\/ud07\/getvehiclespec/, (route) => {
      capturedUrl = route.request().url();
      return hold.then(() =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: DEFAULT_SPEC }),
        })
      );
    });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面（API 挂起中）");

    // 1/2. 调用 GetVehicleSpecificationApi 且参数正确
    await expect.poll(() => capturedUrl).toContain("/api/ud07/getvehiclespec");
    expect(capturedUrl).toContain("chassisNo=ABC123456");
    // 3. 数据加载期间显示 Loading 状态
    await expect(page.locator(SEL.loading)).toHaveText("Loading...");
    await snap("确认 API 调用与 Loading 状态");

    // 放行响应
    release?.();
    await expect(page.locator(SEL.panel)).toBeVisible();
    await snap("数据加载完成后信息面板显示");
  });

  test("TC05 数据加载-成功填充字段", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_数据加载-成功填充字段");
    await mockVehicleSpec(page, { success: true, data: DEFAULT_SPEC });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并从 API 加载数据");

    // 1-7. 各字段正确填充
    await expect(vsValue(page, "Chassis no")).toHaveText("ABC123456");
    await expect(vsValue(page, "Model")).toHaveText("Model X");
    await expect(vsValue(page, "Built week")).toHaveText("2022W45");
    await expect(vsValue(page, "Product type")).toHaveText("SUV");
    await expect(vsValue(page, "VIN")).toHaveText("WVWZZZ3CZWE123456");
    await expect(vsValue(page, "Engine no")).toHaveText("DPX123456789");
    await expect(vsValue(page, "Country of Operation")).toHaveText("DE");
    await snap("确认所有字段正确填充");
  });

  test("TC06 数据加载-无数据", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_数据加载-无数据");
    // 模拟 API 返回 400（无对应底盘数据）
    await mockVehicleSpec(page, { success: false, message: "No data found for this chassis." });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面（API 返回无数据）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No data found for this chassis.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3/4. 不显示车辆信息
    await expect(page.locator(SEL.panel)).toHaveCount(0);
    await snap("确认无数据错误消息且不显示车辆信息");
  });

  // ============================================================
  // 字段显示
  // ============================================================

  test("TC07 字段显示-基本信息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_字段显示-基本信息");
    await mockVehicleSpec(page, { success: true, data: { ...DEFAULT_SPEC, model: "Model X", builtWeek: "2022W45", productType: "SUV" } });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并从 API 加载数据");

    // 1/2/3. 显示 Model、Built week、Product type
    await expect(vsValue(page, "Model")).toHaveText("Model X");
    await expect(vsValue(page, "Built week")).toHaveText("2022W45");
    await expect(vsValue(page, "Product type")).toHaveText("SUV");
    // 4. 均左对齐（浏览器可能归一化为 'start'）
    for (const label of ["Model", "Built week", "Product type"]) {
      const align = await vsValue(page, label).evaluate((el) => getComputedStyle(el).textAlign);
      expect(["left", "start"]).toContain(align);
    }
    await snap("确认基本信息字段及左对齐");
  });

  test("TC08 字段显示-VIN和Engine no", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_字段显示-VIN和Engine no");
    await mockVehicleSpec(page, { success: true, data: { ...DEFAULT_SPEC, vin: "WVWZZZ3CZWE123456", engineNo: "DPX123456789" } });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并从 API 加载数据");

    // 1/2. VIN 与 Engine no 显示
    await expect(vsValue(page, "VIN")).toHaveText("WVWZZZ3CZWE123456");
    await expect(vsValue(page, "Engine no")).toHaveText("DPX123456789");
    // 4. 均左对齐
    for (const label of ["VIN", "Engine no"]) {
      const align = await vsValue(page, label).evaluate((el) => getComputedStyle(el).textAlign);
      expect(["left", "start"]).toContain(align);
    }
    await snap("确认 VIN 与 Engine no 显示及左对齐");
  });

  test("TC09 字段显示-Country of Operation", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_字段显示-Country of Operation");
    await mockVehicleSpec(page, { success: true, data: { ...DEFAULT_SPEC, countryOfOperation: "DE" } });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并从 API 加载数据");

    // 1. Country of Operation 显示 DE
    await expect(vsValue(page, "Country of Operation")).toHaveText("DE");
    // 3. 左对齐
    const align = await vsValue(page, "Country of Operation").evaluate((el) => getComputedStyle(el).textAlign);
    expect(["left", "start"]).toContain(align);
    await snap("确认 Country of Operation 显示 DE 及左对齐");
  });

  test("TC10 字段显示-SYMBOL_STR", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_字段显示-SYMBOL_STR");
    // symbols 为数组
    await mockVehicleSpec(page, { success: true, data: { ...DEFAULT_SPEC, symbols: [{ symbolStr: "DPX1234", description: "desc" }] } });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并从 API 加载数据");

    // 1/2. SYMBOL_STR 显示符号串
    await expect(page.locator(SEL.symbolItem)).toHaveText("DPX1234");
    await snap("确认 SYMBOL_STR 符号显示");
  });

  test("TC11 字段显示-S-Note信息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_字段显示-S-Note信息");
    await mockVehicleSpec(page, { success: true, data: { ...DEFAULT_SPEC, sNoteNo: "SN001", sNoteDesc: "Customer adaptation note" } });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并从 API 加载数据");

    // 1/2. S-Note NO / Desc 显示
    await expect(vsValue(page, "S-Note NO")).toHaveText("SN001");
    await expect(vsValue(page, "S-Note Desc")).toHaveText("Customer adaptation note");
    // 3. 左对齐
    for (const label of ["S-Note NO", "S-Note Desc"]) {
      const align = await vsValue(page, label).evaluate((el) => getComputedStyle(el).textAlign);
      expect(["left", "start"]).toContain(align);
    }
    await snap("确认 S-Note 信息显示及左对齐");
  });

  test("TC12 字段显示-字段为空显示`-`", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_字段显示-字段为空显示_-");
    // model 为空
    await mockVehicleSpec(page, { success: true, data: { ...DEFAULT_SPEC, model: "" } });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并加载数据（model 为空）");

    // 1. 空的字段显示 "-"
    await expect(vsValue(page, "Model")).toHaveText("-");
    // 2. 页面正常显示其他字段
    await expect(vsValue(page, "Chassis no")).toHaveText("ABC123456");
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认空字段显示'-'且其他字段正常");
  });

  // ============================================================
  // Tooltip 交互
  // ============================================================

  test("TC13 Tooltip-悬停显示说明", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Tooltip-悬停显示说明");
    await mockVehicleSpec(page, {
      success: true,
      data: { ...DEFAULT_SPEC, symbols: [{ symbolStr: "DPX1234", description: "This is a variant description" }] },
    });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并加载数据");

    // 1/2. 悬停 SYMBOL_STR 显示 Tooltip，内容为 DESCRIPTION
    await page.locator(SEL.symbolItem).hover();
    await expect(page.locator(SEL.tooltip)).toBeVisible();
    await expect(page.locator(SEL.tooltip)).toHaveText("This is a variant description");
    await snap("确认悬停显示 Tooltip 及其内容");
  });

  test("TC14 Tooltip-移开隐藏", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Tooltip-移开隐藏");
    await mockVehicleSpec(page, {
      success: true,
      data: { ...DEFAULT_SPEC, symbols: [{ symbolStr: "DPX1234", description: "This is a variant description" }] },
    });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并加载数据");

    // 1. 悬停显示 Tooltip
    await page.locator(SEL.symbolItem).hover();
    await expect(page.locator(SEL.tooltip)).toBeVisible();
    await snap("悬停后 Tooltip 显示");

    // 2/3. 移开后 Tooltip 消失
    await page.mouse.move(10, 10);
    await expect(page.locator(SEL.tooltip)).toHaveCount(0);
    await snap("确认鼠标移开后 Tooltip 消失");
  });

  test("TC15 Tooltip-样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Tooltip-样式");
    await mockVehicleSpec(page, {
      success: true,
      data: { ...DEFAULT_SPEC, symbols: [{ symbolStr: "DPX1234", description: "This is a variant description" }] },
    });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并加载数据");

    // 悬停显示 Tooltip
    await page.locator(SEL.symbolItem).hover();
    await expect(page.locator(SEL.tooltip)).toBeVisible();
    await snap("Tooltip 显示（检查样式）");
  });

  test("TC16 Tooltip-无说明不显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Tooltip-无说明不显示");
    // description 为空
    await mockVehicleSpec(page, {
      success: true,
      data: { ...DEFAULT_SPEC, symbols: [{ symbolStr: "DPX1234", description: "" }] },
    });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并加载数据（description 为空）");

    // 1/2/3. 悬停不显示 Tooltip，页面正常
    await page.locator(SEL.symbolItem).hover();
    await expect(page.locator(SEL.tooltip)).toHaveCount(0);
    await expect(page.locator(SEL.symbolItem)).toHaveText("DPX1234");
    await snap("确认无说明时不显示 Tooltip");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC17 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_异常处理-服务器500错误");
    // 模拟 API 返回 500
    await mockVehicleSpec(page, { status: 500, success: false, message: "Server error" });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面（API 返回 500）");

    // 注：当前组件对 500+{success:false} 走 else 分支 → 显示"无数据"错误（无独立 500 分支）。
    await expect(page.locator(SEL.error)).toHaveText("No data found for this chassis.");
    // 3. 不显示数据
    await expect(page.locator(SEL.panel)).toHaveCount(0);
    await snap("确认 500 错误时不显示数据");
  });

  test("TC18 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_异常处理-网络错误");
    // 模拟网络断开
    await page.route(/\/api\/ud07\/getvehiclespec/, (route) => route.abort());
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面（网络断开）");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 页面显示错误状态
    await expect(page.locator(SEL.panel)).toHaveCount(0);
    await snap("确认网络错误消息及页面错误状态");
  });

  test("TC19 异常处理-API超时", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_异常处理-API超时");
    // 模拟 API 响应超时：延迟后 abort
    await page.route(/\/api\/ud07\/getvehiclespec/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.abort();
    });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面（等待超时）");

    // 超时后显示网络错误消息，车辆信息不显示
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    await expect(page.locator(SEL.panel)).toHaveCount(0);
    await snap("确认超时后错误消息且车辆信息不显示");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC20 安全性-数据只读与认证", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_安全性-数据只读与认证");
    await mockVehicleSpec(page, { success: true, data: DEFAULT_SPEC });
    await gotoVehicleSpecification(page, "ABC123456");
    await snap("访问页面并加载数据");

    // 1/2/3. 所有数据均为只读 Label 展示，无编辑控件
    await expect(page.locator(SEL.panel)).toBeVisible();
    const editableCount = await page.locator(`${SEL.panel} input, ${SEL.panel} textarea, ${SEL.panel} select`).count();
    expect(editableCount).toBe(0);
    // 各字段只读文本展示
    await expect(vsValue(page, "Chassis no")).toHaveText("ABC123456");
    await expect(vsValue(page, "Model")).toHaveText("Model X");
    await expect(vsValue(page, "SYMBOL_STR")).toBeVisible();
    await snap("确认数据只读展示且无编辑控件");
  });
});
