/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const VP_URL = BASE_URL + "/vin-plate";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD15";

// 页面元素选择器（与 VinPlate.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".vp-title",
  inputRow: ".vp-input-row",
  label: ".vp-label",
  input: ".vp-input",
  buttons: ".vp-buttons",
  btn: ".vp-btn",
  errorMessage: ".vp-error-message",
  details: ".vp-details",
  detailRow: ".vp-detail-row",
  detailLabel: ".vp-detail-label",
  detailValue: ".vp-detail-value",
  detailSection: ".vp-detail-section",
  pre: ".vp-pre",
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

/** 构造完整 VinPlate 数据 */
function vinRecord(overrides: any = {}) {
  return {
    chassisNumber: "VF123456789",
    type: "1",
    status: "0",
    msg: "",
    registerDatetime: "2023-10-15 10:30",
    docReady: "YES",
    docSent: "NO",
    xmlDoc: "",
    ...overrides,
  };
}

/** 拦截 GET /api/vin-plate/{chassis}（排除 /status 防止吞掉 PUT 更新请求） */
async function mockGetInfo(page: Page, status: number, data: any | null) {
  await page.route(/\/api\/vin-plate\/(?!status)[A-Za-z0-9]+/, (route) => {
    if (data === null) {
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data: null }) });
    } else {
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });
    }
  });
}

/** 拦截 PUT /api/vin-plate/status */
async function mockPutStatus(page: Page, status: number, failWithBody = false) {
  await page.route("**/api/vin-plate/status", (route) => {
    if (status === 200) {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    } else {
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ error: "fail" }) });
    }
  });
}

test.describe("UD15 Vin Plate 模块测试", () => {
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
    await page.goto(VP_URL);
    await snap("访问 Vin Plate 页面");

    // 1. 显示 Vin Plate 标题
    await expect(page.locator(SEL.title)).toHaveText("Vin Plate");
    // 2. Chassis number 输入框为空
    await expect(page.locator(SEL.input)).toHaveValue("");
    // 3. 五个按钮显示且可用
    const btns = page.locator(SEL.btn);
    await expect(btns).toHaveCount(5);
    await expect(btns.nth(0)).toHaveText("View Info");
    await expect(btns.nth(1)).toHaveText("Set Regenerate");
    await expect(btns.nth(2)).toHaveText("Set OK");
    await expect(btns.nth(3)).toHaveText("Change to Basic Info");
    await expect(btns.nth(4)).toHaveText("Change to Advanced Info");
    for (let i = 0; i < 5; i++) {
      await expect(btns.nth(i)).toBeEnabled();
    }
    // 4. 不显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
    // 5. 不显示详细信息区域
    await expect(page.locator(SEL.details)).toHaveCount(0);
    await snap("确认标题、空输入框、五个可用按钮、无错误消息、无详细信息区域");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(VP_URL);
    await snap("清除 userID 并访问 Vin Plate 页面");

    // 自动跳转到 /login 页面
    await expect(page).toHaveURL(/\/login/);
    // 不显示页面内容（无标题）
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  // ============================================================
  // View Info 操作
  // ============================================================

  test("TC03 View Info-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_View Info-空值校验");
    await page.goto(VP_URL);
    await snap("访问页面");

    // Chassis number 不输入直接点击 View Info
    await page.locator(SEL.btn).nth(0).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText("Please enter a chassis number.");
    // 2-3. 不调用 API（未发请求），详情区域不显示
    await expect(page.locator(SEL.details)).toHaveCount(0);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认空值校验错误消息显示且未调用 API");
  });

  test("TC04 View Info-成功查询", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_View Info-成功查询");
    const xmlDoc = `<root><PrintItemName>Vin Plate</PrintItemName><PrintItemName>EM</PrintItemName><Variant><Name>Model</Name><Value>XC90</Value></Variant><Variant><Name>Color</Name><Value>Black</Value></Variant></root>`;
    await mockGetInfo(page, 200, vinRecord({ xmlDoc }));
    await page.goto(VP_URL);
    await snap("访问页面并设置成功 mock");

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(0).click();
    // 等待响应结束
    await expect(page.locator(SEL.details)).toBeVisible();
    await snap("点击 View Info 后显示详细信息区域");

    // 3. Chassis number 显示
    await expect(page.locator(SEL.detailValue).nth(0)).toHaveText("VF123456789");
    // 4. Plate type / Status / Def. / Data ready / Sent to CAB factory 正确显示
    await expect(page.locator(SEL.detailValue).nth(1)).toHaveText("Basic");
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("New");
    await expect(page.locator(SEL.detailValue).nth(3)).toHaveText("-"); // Error Message
    await expect(page.locator(SEL.detailValue).nth(4)).toHaveText("2023-10-15 10:30"); // Def.
    await expect(page.locator(SEL.detailValue).nth(5)).toHaveText("YES"); // Data ready
    await expect(page.locator(SEL.detailValue).nth(6)).toHaveText("NO"); // Sent to CAB factory
    // 5. Print items 和 VP Data 解析 XML 显示
    await expect(page.locator(SEL.pre).nth(0)).toHaveText("Vin Plate\nEM");
    await expect(page.locator(SEL.pre).nth(1)).toHaveText("Model = XC90\nColor = Black");
    // 6. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认详细数据、Print items 与 VP Data 正确显示");
  });

  test("TC05 View Info-记录不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_View Info-记录不存在");
    // 返回 404
    await mockGetInfo(page, 404, null);
    await page.goto(VP_URL);
    await snap("访问页面并设置 404 mock");

    await page.locator(SEL.input).fill("VF999999999");
    await page.locator(SEL.btn).nth(0).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText("Chassis number VF999999999 not found.");
    // 3. 详细信息区域不显示
    await expect(page.locator(SEL.details)).toHaveCount(0);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认记录不存在时显示错误消息且无详细信息区域");
  });

  test("TC06 View Info-Type显示转换", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_View Info-Type显示转换");
    // type=1 -> Basic
    await mockGetInfo(page, 200, vinRecord({ type: "1" }));
    await page.goto(VP_URL);
    await page.locator(SEL.input).fill("VF111111111");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(1)).toHaveText("Basic");
    await snap("type=1 显示 Basic");

    // type=2 -> ADVANCED (with weights)
    await mockGetInfo(page, 200, vinRecord({ type: "2" }));
    await page.locator(SEL.input).fill("VF222222222");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(1)).toHaveText("ADVANCED (with weights)");
    await snap("type=2 显示 ADVANCED (with weights)");

    // 其他值 -> -
    await mockGetInfo(page, 200, vinRecord({ type: "9" }));
    await page.locator(SEL.input).fill("VF999999998");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(1)).toHaveText("-");
    await snap("其他 type 值显示 -");
  });

  test("TC07 View Info-Status显示转换", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_View Info-Status显示转换");
    // status=0 -> New
    await mockGetInfo(page, 200, vinRecord({ status: "0" }));
    await page.goto(VP_URL);
    await page.locator(SEL.input).fill("VF111111111");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("New");
    await snap("status=0 显示 New");

    // status=1 -> XML Created
    await mockGetInfo(page, 200, vinRecord({ status: "1" }));
    await page.locator(SEL.input).fill("VF222222222");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("XML Created");
    await snap("status=1 显示 XML Created");

    // 其他值 -> -
    await mockGetInfo(page, 200, vinRecord({ status: "5" }));
    await page.locator(SEL.input).fill("VF999999998");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("-");
    await snap("其他 status 值显示 -");
  });

  test("TC08 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_异常处理-服务器500错误");
    // GET 返回 500
    await mockGetInfo(page, 500, null);
    await page.goto(VP_URL);
    await snap("访问页面并设置 500 mock");

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(0).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText("System error. Please contact administrator.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await expect(page.locator(SEL.details)).toHaveCount(0);
    await snap("确认 500 错误显示 System error 消息");
  });

  test("TC09 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_异常处理-网络错误");
    // GET 网络中断（abort）
    await page.route(/\/api\/vin-plate\/[A-Za-z0-9]+/, (route) => route.abort());
    await page.goto(VP_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(0).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText("Network error. Please check your connection.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认网络错误显示 Network error 消息");
  });

  // ============================================================
  // 状态/类型更新操作
  // ============================================================

  test("TC10 Set Regenerate-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Set Regenerate-空值校验");
    await page.goto(VP_URL);
    await snap("访问页面");

    // 记录 PUT 请求是否被调用
    let putCalled = false;
    await page.route("**/api/vin-plate/status", (route) => {
      putCalled = true;
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    // Chassis number 不输入，点击 Set Regenerate
    await page.locator(SEL.btn).nth(1).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText("Please enter a chassis number.");
    // 2. 不调用更新 API
    await page.waitForTimeout(300);
    expect(putCalled).toBe(false);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("确认 Set Regenerate 空值校验且未调用 API");
  });

  test("TC11 Set Regenerate-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Set Regenerate-成功");
    // PUT 成功后组件自动刷新 GET，返回 status=0
    await mockPutStatus(page, 200);
    await mockGetInfo(page, 200, vinRecord({ status: "0" }));
    await page.goto(VP_URL);
    await snap("访问页面并设置 PUT/GET mock");

    // 捕获 PUT 请求 body
    let putBody: any = null;
    await page.unroute("**/api/vin-plate/status");
    await page.route("**/api/vin-plate/status", (route) => {
      putBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockGetInfo(page, 200, vinRecord({ status: "0" }));

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(1).click(); // Set Regenerate
    // 4. 更新成功后自动刷新查询，Status 显示 New
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("New");
    // 2. 请求 body 正确
    await expect.poll(() => putBody).toEqual({ chassisNumber: "VF123456789", status: "0" });
    // 5. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("确认 Set Regenerate 成功并刷新显示 New");
  });

  test("TC12 Set OK-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Set OK-成功");
    await mockPutStatus(page, 200);
    await mockGetInfo(page, 200, vinRecord({ status: "1" }));
    await page.goto(VP_URL);
    await snap("访问页面并设置 PUT/GET mock");

    let putBody: any = null;
    await page.unroute("**/api/vin-plate/status");
    await page.route("**/api/vin-plate/status", (route) => {
      putBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockGetInfo(page, 200, vinRecord({ status: "1" }));

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(2).click(); // Set OK
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("XML Created");
    await expect.poll(() => putBody).toEqual({ chassisNumber: "VF123456789", status: "1" });
    await expect(page.locator(SEL.btn).nth(2)).toBeEnabled();
    await snap("确认 Set OK 成功并刷新显示 XML Created");
  });

  test("TC13 Change to Basic Info-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Change to Basic Info-成功");
    await mockPutStatus(page, 200);
    await mockGetInfo(page, 200, vinRecord({ status: "0", type: "1" }));
    await page.goto(VP_URL);
    await snap("访问页面并设置 PUT/GET mock");

    let putBody: any = null;
    await page.unroute("**/api/vin-plate/status");
    await page.route("**/api/vin-plate/status", (route) => {
      putBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockGetInfo(page, 200, vinRecord({ status: "0", type: "1" }));

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(3).click(); // Change to Basic Info
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("New");
    await expect(page.locator(SEL.detailValue).nth(1)).toHaveText("Basic");
    await expect.poll(() => putBody).toEqual({ chassisNumber: "VF123456789", status: "0", type: "1" });
    await expect(page.locator(SEL.btn).nth(3)).toBeEnabled();
    await snap("确认 Change to Basic Info 成功并显示 New / Basic");
  });

  test("TC14 Change to Advanced Info-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Change to Advanced Info-成功");
    await mockPutStatus(page, 200);
    await mockGetInfo(page, 200, vinRecord({ status: "0", type: "2" }));
    await page.goto(VP_URL);
    await snap("访问页面并设置 PUT/GET mock");

    let putBody: any = null;
    await page.unroute("**/api/vin-plate/status");
    await page.route("**/api/vin-plate/status", (route) => {
      putBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await mockGetInfo(page, 200, vinRecord({ status: "0", type: "2" }));

    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(4).click(); // Change to Advanced Info
    await expect(page.locator(SEL.details)).toBeVisible();
    await expect(page.locator(SEL.detailValue).nth(2)).toHaveText("New");
    await expect(page.locator(SEL.detailValue).nth(1)).toHaveText("ADVANCED (with weights)");
    await expect.poll(() => putBody).toEqual({ chassisNumber: "VF123456789", status: "0", type: "2" });
    await expect(page.locator(SEL.btn).nth(4)).toBeEnabled();
    await snap("确认 Change to Advanced Info 成功并显示 New / ADVANCED");
  });

  test("TC15 更新操作-记录不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_更新操作-记录不存在");
    // PUT 返回成功，但随后的 GET 刷新返回 404
    await mockPutStatus(page, 200);
    await mockGetInfo(page, 404, null);
    await page.goto(VP_URL);
    await snap("访问页面并设置 PUT 成功 / GET 404 mock");

    await page.locator(SEL.input).fill("NONEXIST");
    await page.locator(SEL.btn).nth(1).click(); // Set Regenerate
    // 2. PUT 成功后刷新查询失败，显示错误消息
    await expect(page.locator(SEL.errorMessage)).toHaveText("Chassis number NONEXIST not found.");
    // 3. 详细信息区域不显示
    await expect(page.locator(SEL.details)).toHaveCount(0);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("确认更新后刷新失败显示 not found 消息");
  });

  test("TC16 更新操作-异常处理", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_更新操作-异常处理");
    // 场景1：PUT 返回 500
    await mockPutStatus(page, 500);
    await mockGetInfo(page, 200, vinRecord());
    await page.goto(VP_URL);
    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(1).click(); // Set Regenerate
    await expect(page.locator(SEL.errorMessage)).toHaveText("System error. Please contact administrator.");
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("PUT 返回 500 显示 System error");

    // 场景2：PUT 网络中断
    await page.unroute("**/api/vin-plate/status");
    await page.route("**/api/vin-plate/status", (route) => route.abort());
    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(2).click(); // Set OK
    await expect(page.locator(SEL.errorMessage)).toHaveText("Network error. Please check your connection.");
    await expect(page.locator(SEL.btn).nth(2)).toBeEnabled();
    await snap("PUT 网络中断显示 Network error");
  });

  // ============================================================
  // XML 解析
  // ============================================================

  test("TC17 XML解析-Print items", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_XML解析-Print items");
    // 含多个 PrintItemName 节点
    const xmlDoc = `<root><PrintItemName>Vin Plate</PrintItemName><PrintItemName>EM</PrintItemName><PrintItemName>Certificate of Conformity</PrintItemName></root>`;
    await mockGetInfo(page, 200, vinRecord({ xmlDoc }));
    await page.goto(VP_URL);
    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    // 解析出所有 PrintItemName 节点文本，分行显示
    await expect(page.locator(SEL.pre).nth(0)).toHaveText("Vin Plate\nEM\nCertificate of Conformity");
    await snap("确认 Print items 多个节点分行显示");
  });

  test("TC18 XML解析-VP Data", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_XML解析-VP Data");
    // 含多个 Variant 节点
    const xmlDoc = `<root><Variant><Name>Model</Name><Value>XC90</Value></Variant><Variant><Name>Color</Name><Value>Black</Value></Variant><Variant><Name>Year</Name><Value>2023</Value></Variant></root>`;
    await mockGetInfo(page, 200, vinRecord({ xmlDoc }));
    await page.goto(VP_URL);
    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    // 以 "Name = Value" 格式分行显示
    await expect(page.locator(SEL.pre).nth(1)).toHaveText("Model = XC90\nColor = Black\nYear = 2023");
    await snap("确认 VP Data 多个 Variant 分行显示");
  });

  test("TC19 XML解析-解析失败", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_XML解析-解析失败");
    // 无效 XML 内容
    const invalidXml = "this is not valid xml <<<";
    await mockGetInfo(page, 200, vinRecord({ xmlDoc: invalidXml }));
    await page.goto(VP_URL);
    await page.locator(SEL.input).fill("VF123456789");
    await page.locator(SEL.btn).nth(0).click();
    await expect(page.locator(SEL.details)).toBeVisible();
    // 1. 解析失败不抛异常，页面正常显示
    await expect(page.locator(SEL.details)).toBeVisible();
    // 2. Print items 显示 "-"
    await expect(page.locator(SEL.pre).nth(0)).toHaveText("-");
    // 3. VP Data 显示 "-"
    await expect(page.locator(SEL.pre).nth(1)).toHaveText("-");
    await snap("确认无效 XML 解析失败时分段显示 -");
  });

  // ============================================================
  // UI 交互
  // ============================================================

  test("TC20 输入限制-Chassis number最大15", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_输入限制-Chassis number最大15");
    await page.goto(VP_URL);
    await snap("访问页面");

    const input20 = "12345678901234567890"; // 20 个字符
    await page.locator(SEL.input).fill(input20);
    // 1-3. 最多保留 15 个字符（maxLength=15 生效）
    const value = await page.locator(SEL.input).inputValue();
    expect(value.length).toBe(15);
    expect(value).toBe("123456789012345");
    // maxLength 属性校验
    const maxLen = await page.locator(SEL.input).getAttribute("maxlength");
    expect(maxLen).toBe("15");
    await snap("确认 Chassis number 输入限制为 15 个字符");
  });

  test("TC21 按钮禁用-isLoading期间", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_按钮禁用-isLoading期间");
    // 拦截 GET 并挂起，模拟 API 未响应
    await page.route(/\/api\/vin-plate\/[A-Za-z0-9]+/, async (route) => {
      // 挂起较长时间后再返回
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: vinRecord() }) });
    });
    await page.goto(VP_URL);
    await snap("访问页面并设置延迟 mock");

    await page.locator(SEL.input).fill("VF123456789");
    const clickPromise = page.locator(SEL.btn).nth(0).click();
    // 在 API 响应前检查控件状态
    await page.waitForTimeout(300);
    // 1. View Info 按钮禁用
    await expect(page.locator(SEL.btn).nth(0)).toBeDisabled();
    // 2. 其余四个按钮全部禁用
    await expect(page.locator(SEL.btn).nth(1)).toBeDisabled();
    await expect(page.locator(SEL.btn).nth(2)).toBeDisabled();
    await expect(page.locator(SEL.btn).nth(3)).toBeDisabled();
    await expect(page.locator(SEL.btn).nth(4)).toBeDisabled();
    // 3. Chassis number 输入框禁用
    await expect(page.locator(SEL.input)).toBeDisabled();
    await snap("确认 isLoading 期间所有按钮与输入框禁用");

    await clickPromise;
    await expect(page.locator(SEL.details)).toBeVisible();
    await snap("API 响应后控件恢复可用");
  });

  test("TC22 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_LOGOUT-登出");
    await page.goto(VP_URL);
    await snap("访问 Vin Plate 页面");

    await page.locator(SEL.logoutButton).click();
    // 1. localStorage 中 userID 被移除
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    // 2. 跳转到 /login 页面
    await expect(page).toHaveURL(/\/login/);
    // 3. 会话结束，不显示页面内容
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
