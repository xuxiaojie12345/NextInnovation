/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADC_URL = BASE_URL + "/ad-change";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD16";

// 页面元素选择器（与 ADChange.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".adc-title",
  error: ".adc-error",
  success: ".adc-success",
  input: ".adc-input",
  textarea: ".adc-textarea",
  btn: ".adc-btn",
  checkResult: ".adc-check-result",
  checkValue: ".adc-check-value",
  activeYes: ".adc-active-yes",
  activeNo: ".adc-active-no",
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

/** 构造 CHECK 结果数据 */
function checkRecord(overrides: any = {}) {
  return {
    serieChnr: "ABC-123456",
    desc: "This is a test",
    isActive: true,
    createdDate: "2023-10-15",
    createdBy: "user001",
    ...overrides,
  };
}

/** 拦截 POST /api/ud16/addadchange 并捕获请求体 */
async function mockAdd(page: Page, payload: any, opts: { callCount?: ()=>void } = {}) {
  await page.route("**/api/ud16/addadchange", (route) => {
    if (opts.callCount) opts.callCount();
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

/** 拦截 DELETE /api/ud16/deleteadchange 并捕获请求体 */
async function mockDelete(page: Page, payload: any, opts: { callCount?: ()=>void } = {}) {
  await page.route("**/api/ud16/deleteadchange", (route) => {
    if (opts.callCount) opts.callCount();
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

/** 拦截 GET /api/ud16/checkadchange 并捕获请求 */
async function mockCheck(page: Page, payload: any, opts: { callCount?: ()=>void } = {}) {
  await page.route(/\/api\/ud16\/checkadchange/, (route) => {
    if (opts.callCount) opts.callCount();
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

test.describe("UD16 AD Change 模块测试", () => {
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
    await page.goto(ADC_URL);
    await snap("访问 AD Change 页面");

    // 1. 显示 AD Change 标题
    await expect(page.locator(SEL.title)).toHaveText("AD Change");
    // 2. Serie-Chnr 输入框为空
    await expect(page.locator(SEL.input)).toHaveValue("");
    // 3. Desc 文本域为空
    await expect(page.locator(SEL.textarea)).toHaveValue("");
    // 4. ADD/DELETE/CHECK 三个按钮可用
    const btns = page.locator(SEL.btn);
    await expect(btns).toHaveCount(3);
    await expect(btns.nth(0)).toHaveText("ADD");
    await expect(btns.nth(1)).toHaveText("DELETE");
    await expect(btns.nth(2)).toHaveText("CHECK");
    for (let i = 0; i < 3; i++) {
      await expect(btns.nth(i)).toBeEnabled();
    }
    // 5. 不显示错误/成功消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await expect(page.locator(SEL.success)).toHaveCount(0);
    // 6. 不显示 Check Result 区域
    await expect(page.locator(SEL.checkResult)).toHaveCount(0);
    await snap("确认标题、空输入、三个可用按钮、无消息、无 Check Result");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(ADC_URL);
    await snap("清除 userID 并访问 AD Change 页面");

    // 自动跳转到 /login 页面
    await expect(page).toHaveURL(/\/login/);
    // 不显示页面内容（无标题）
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-登录用户显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-登录用户显示");
    await page.evaluate(() => localStorage.setItem("userID", "user001"));
    await page.goto(ADC_URL);
    await snap("设置 user001 并访问页面");

    // 1. 顶部显示 Welcome, user001
    await expect(page.locator(SEL.welcomeText)).toHaveText("Welcome, user001");
    // 2. 显示 VOLVO 标志
    await expect(page.locator(SEL.logo)).toHaveText("VOLVO");
    // 3. 显示 Logout 按钮
    await expect(page.locator(SEL.logoutButton)).toHaveText("Logout");
    // 4. 页面正常显示
    await expect(page.locator(SEL.title)).toHaveText("AD Change");
    await snap("确认 Welcome 文本、VOLVO 标志与 Logout 按钮");
  });

  // ============================================================
  // ADD 操作
  // ============================================================

  test("TC04 ADD-空值校验-Serie-Chnr为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_ADD-空值校验-Serie-Chnr为空");
    await page.goto(ADC_URL);
    await snap("访问页面");

    // 记录 API 是否被调用
    let addCalled = false;
    await mockAdd(page, { body: { success: true } }, { callCount: () => { addCalled = true; } });

    await page.locator(SEL.textarea).fill("test");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(addCalled).toBe(false);
    // 4. ADD 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    // 5. Desc 输入不提交（未清空）
    await expect(page.locator(SEL.textarea)).toHaveValue("test");
    await snap("确认空值校验错误消息显示且未调用 API");
  });

  test("TC05 ADD-空值校验-Serie-Chnr仅空格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_ADD-空值校验-Serie-Chnr仅空格");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let addCalled = false;
    await mockAdd(page, { body: { success: true } }, { callCount: () => { addCalled = true; } });

    await page.locator(SEL.input).fill("   ");
    await page.locator(SEL.textarea).fill("test");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1-2. trim 后判空，显示错误
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(addCalled).toBe(false);
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认仅空格输入触发空值校验且未调用 API");
  });

  test("TC06 ADD-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_ADD-成功");
    await page.goto(ADC_URL);
    await snap("访问页面");

    // 捕获 POST 请求体
    let postBody: any = null;
    await mockAdd(page, { body: { success: true } });
    await page.unroute("**/api/ud16/addadchange");
    await page.route("**/api/ud16/addadchange", (route) => {
      postBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("This is a test");
    // 3. 请求 body 正确
    await expect.poll(() => postBody).toBeNull();
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 点击后等待响应
    // 5. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("AD change record added successfully");
    // 3. 请求 body 正确
    await expect.poll(() => postBody).toEqual({ serieChnr: "ABC-123456", desc: "This is a test" });
    // 6. Serie-Chnr 清空
    await expect(page.locator(SEL.input)).toHaveValue("");
    // 7. Desc 清空
    await expect(page.locator(SEL.textarea)).toHaveValue("");
    // 8. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认 ADD 成功消息与表单清空");
  });

  test("TC07 ADD-成功-Desc为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_ADD-成功-Desc为空");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let postBody: any = null;
    await mockAdd(page, { body: { success: true } });
    await page.unroute("**/api/ud16/addadchange");
    await page.route("**/api/ud16/addadchange", (route) => {
      postBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.locator(SEL.input).fill("ABC-111");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("AD change record added successfully");
    // 3. 表单清空
    await expect(page.locator(SEL.input)).toHaveValue("");
    await expect(page.locator(SEL.textarea)).toHaveValue("");
    // 2/4. Desc 为空正常提交，按钮恢复可用
    await expect.poll(() => postBody).toEqual({ serieChnr: "ABC-111", desc: "" });
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认 Desc 为空时 ADD 成功");
  });

  test("TC08 ADD-记录未激活-Warning", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_ADD-记录未激活-Warning");
    await page.goto(ADC_URL);
    await snap("访问页面");

    await mockAdd(page, { body: { success: false, message: "AFTER DEF CHANGE IS NOT ACTIVATED" } });
    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("test");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("AFTER DEF CHANGE IS NOT ACTIVATED");
    // 3. 表单不清空
    await expect(page.locator(SEL.input)).toHaveValue("ABC-123456");
    await expect(page.locator(SEL.textarea)).toHaveValue("test");
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    // 5. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await snap("确认未激活错误消息显示且表单不清空");
  });

  test("TC09 ADD-其他错误-API返回错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_ADD-其他错误-API返回错误消息");
    await page.goto(ADC_URL);
    await snap("访问页面");

    await mockAdd(page, { body: { success: false, message: "DB Error" } });
    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("test");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("DB Error");
    // 3. 表单不清空
    await expect(page.locator(SEL.input)).toHaveValue("ABC-123456");
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await snap("确认 DB Error 错误消息显示");
  });

  test("TC10 ADD-异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_ADD-异常处理-网络错误");
    await page.route("**/api/ud16/addadchange", (route) => route.abort());
    await page.goto(ADC_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("test");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    // 4. 表单不清空
    await expect(page.locator(SEL.input)).toHaveValue("ABC-123456");
    await snap("确认 ADD 网络错误消息显示");
  });

  test("TC11 ADD-异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_ADD-异常处理-服务器500错误");
    // 组件对 500 也尝试 response.json()，若 body 为 JSON 则展示其后端消息
    await mockAdd(page, { status: 500, body: { success: false, message: "Server Error" } });
    await page.goto(ADC_URL);
    await snap("访问页面并设置 500 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("test");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1. 显示错误消息（取决于后端返回）
    await expect(page.locator(SEL.error)).toHaveText("Server Error");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    // 4. 表单不清空
    await expect(page.locator(SEL.input)).toHaveValue("ABC-123456");
    await snap("确认 500 错误消息显示");
  });

  // ============================================================
  // DELETE 操作
  // ============================================================

  test("TC12 DELETE-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_DELETE-空值校验");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let delCalled = false;
    await mockDelete(page, { body: { success: true } }, { callCount: () => { delCalled = true; } });

    await page.locator(SEL.btn).nth(1).click(); // DELETE
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required for delete operation.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(delCalled).toBe(false);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("确认 DELETE 空值校验错误消息");
  });

  test("TC13 DELETE-前端校验终止", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_DELETE-前端校验终止");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let delCalled = false;
    await mockDelete(page, { body: { success: true } }, { callCount: () => { delCalled = true; } });

    await page.locator(SEL.btn).nth(1).click(); // DELETE
    // 1-2. 前端拦截，不调用 DeleteADChangeApi
    await page.waitForTimeout(300);
    expect(delCalled).toBe(false);
    // 3. 显示错误消息并立即终止
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required for delete operation.");
    // 4. 无 checkResult 清空（无 check result）
    await expect(page.locator(SEL.checkResult)).toHaveCount(0);
    await snap("确认 DELETE 前端拦截且不调用 API");
  });

  test("TC14 DELETE-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_DELETE-成功");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let delBody: any = null;
    await mockDelete(page, { body: { success: true } });
    await page.unroute("**/api/ud16/deleteadchange");
    await page.route("**/api/ud16/deleteadchange", (route) => {
      delBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("some desc");
    await page.locator(SEL.btn).nth(1).click(); // DELETE
    // 4. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("AD change record deleted successfully");
    // 2. 请求 body 正确
    await expect.poll(() => delBody).toEqual({ serieChnr: "ABC-123456" });
    // 5. Serie-Chnr 清空
    await expect(page.locator(SEL.input)).toHaveValue("");
    // 6. Desc 清空
    await expect(page.locator(SEL.textarea)).toHaveValue("");
    // 7. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("确认 DELETE 成功消息与表单清空");
  });

  test("TC15 DELETE-记录不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_DELETE-记录不存在");
    await page.goto(ADC_URL);
    await snap("访问页面");

    await mockDelete(page, { body: { success: false, message: "Record does not exist." } });
    await page.locator(SEL.input).fill("XYZ-999999");
    await page.locator(SEL.btn).nth(1).click(); // DELETE
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Record does not exist.");
    // 3. 表单不清空
    await expect(page.locator(SEL.input)).toHaveValue("XYZ-999999");
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    // 5. 无成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await snap("确认 DELETE 记录不存在错误消息");
  });

  test("TC16 DELETE-异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_DELETE-异常处理-网络错误");
    await page.route("**/api/ud16/deleteadchange", (route) => route.abort());
    await page.goto(ADC_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.btn).nth(1).click(); // DELETE
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(1)).toBeEnabled();
    await snap("确认 DELETE 网络错误消息");
  });

  // ============================================================
  // CHECK 操作
  // ============================================================

  test("TC17 CHECK-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_CHECK-空值校验");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let checkCalled = false;
    await mockCheck(page, { body: { success: true, data: checkRecord() } }, { callCount: () => { checkCalled = true; } });

    await page.locator(SEL.btn).nth(2).click(); // CHECK
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required for check operation.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(checkCalled).toBe(false);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(2)).toBeEnabled();
    await snap("确认 CHECK 空值校验错误消息");
  });

  test("TC18 CHECK-单纯空格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_CHECK-单纯空格");
    await page.goto(ADC_URL);
    await snap("访问页面");

    // 捕获请求 URL，检验 trim + encodeURIComponent
    let requestUrl: string | null = null;
    await page.route(/\/api\/ud16\/checkadchange/, (route) => {
      requestUrl = route.request().url();
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: checkRecord({ serieChnr: "ABC-123" }) }) });
    });

    await page.locator(SEL.input).fill("   ABC-123   ");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    // 1-2. trim 后为 ABC-123，URL 使用 encodeURIComponent
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    await expect(page.locator(SEL.checkValue).nth(0)).toHaveText("ABC-123");
    // 4. 请求参数为 serieChnr=ABC-123
    await expect.poll(() => requestUrl).toContain("serieChnr=ABC-123");
    await page.waitForTimeout(100);
    expect(requestUrl).not.toContain(" ");
    await snap("确认 CHECK 去除首尾空格并正确编码请求参数");
  });

  test("TC19 CHECK-成功-激活记录", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_CHECK-成功-激活记录");
    await mockCheck(page, { body: { success: true, data: checkRecord() } });
    await page.goto(ADC_URL);
    await snap("访问页面并设置成功 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    // 2. 显示 Check Result 区域
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    // 3. Serie-Chnr 显示
    await expect(page.locator(SEL.checkValue).nth(0)).toHaveText("ABC-123456");
    // 4. Desc 显示
    await expect(page.locator(SEL.checkValue).nth(1)).toHaveText("This is a test");
    // 5. Active 显示 Yes（绿色高亮）
    await expect(page.locator(SEL.checkValue).nth(2)).toHaveText("Yes");
    await expect(page.locator(SEL.activeYes)).toHaveCount(1);
    // 6. Created Date / Created By 显示
    await expect(page.locator(SEL.checkValue).nth(3)).toHaveText("2023-10-15");
    await expect(page.locator(SEL.checkValue).nth(4)).toHaveText("user001");
    // 7. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("Record found successfully.");
    await snap("确认 CHECK 激活记录结果与成功消息");
  });

  test("TC20 CHECK-成功-未激活记录", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_CHECK-成功-未激活记录");
    await mockCheck(page, { body: { success: true, data: checkRecord({ isActive: false }) } });
    await page.goto(ADC_URL);
    await snap("访问页面并设置未激活 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    // 1. Active 显示 No（红色标记）
    await expect(page.locator(SEL.checkValue).nth(2)).toHaveText("No");
    await expect(page.locator(SEL.activeNo)).toHaveCount(1);
    // 2. 其余字段正确显示
    await expect(page.locator(SEL.checkValue).nth(0)).toHaveText("ABC-123456");
    await expect(page.locator(SEL.checkValue).nth(1)).toHaveText("This is a test");
    // 4. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("Record found successfully.");
    await snap("确认 CHECK 未激活记录 Active 显示 No");
  });

  test("TC21 CHECK-成功-Desc为空字段", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_CHECK-成功-Desc为空字段");
    await mockCheck(page, { body: { success: true, data: checkRecord({ desc: null, createdDate: null, createdBy: null }) } });
    await page.goto(ADC_URL);
    await snap("访问页面并设置空字段 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    // 1-3. 空值降级显示 "-"
    await expect(page.locator(SEL.checkValue).nth(1)).toHaveText("-");
    await expect(page.locator(SEL.checkValue).nth(3)).toHaveText("-");
    await expect(page.locator(SEL.checkValue).nth(4)).toHaveText("-");
    // 4. Active 正确显示
    await expect(page.locator(SEL.checkValue).nth(2)).toHaveText("Yes");
    await expect(page.locator(SEL.success)).toHaveText("Record found successfully.");
    await snap("确认 CHECK 空字段显示为 -");
  });

  test("TC22 CHECK-记录不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_CHECK-记录不存在");
    await mockCheck(page, { body: { success: false, message: "Record does not exist." } });
    await page.goto(ADC_URL);
    await snap("访问页面并设置不存在 mock");

    await page.locator(SEL.input).fill("NONEXIST");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Record does not exist.");
    // 3. 无 checkResult 显示
    await expect(page.locator(SEL.checkResult)).toHaveCount(0);
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(2)).toBeEnabled();
    // 5. 无成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await snap("确认 CHECK 记录不存在错误消息");
  });

  test("TC23 CHECK-结果清晰", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_CHECK-结果清晰");
    await page.goto(ADC_URL);
    await snap("访问页面");

    // 第一次查询返回另一条记录，以便验证旧结果被清除
    await mockCheck(page, { body: { success: true, data: checkRecord({ serieChnr: "FIRST" }) } });
    await page.locator(SEL.input).fill("FIRST");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    await expect(page.locator(SEL.checkValue).nth(0)).toHaveText("FIRST");
    await snap("第一次 CHECK 显示 FIRST 结果");

    // 第二次 CHECK 前 checkResult 被清空，然后显示新结果
    await mockCheck(page, { body: { success: true, data: checkRecord({ serieChnr: "SECOND" }) } });
    await page.locator(SEL.input).fill("SECOND");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    // 2-3. 显示新的查询结果，旧结果被清除
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    await expect(page.locator(SEL.checkValue).nth(0)).toHaveText("SECOND");
    await expect(page.locator(SEL.checkResult)).not.toContainText("FIRST");
    await snap("第二次 CHECK 显示 SECOND 结果（旧结果被清除）");
  });

  test("TC24 CHECK-异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_CHECK-异常处理-网络错误");
    await page.route(/\/api\/ud16\/checkadchange/, (route) => route.abort());
    await page.goto(ADC_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network connection failed. Please check your network settings.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.btn).nth(2)).toBeEnabled();
    // 4. 无 checkResult
    await expect(page.locator(SEL.checkResult)).toHaveCount(0);
    await snap("确认 CHECK 网络错误消息");
  });

  // ============================================================
  // 输入限制与 UI 交互
  // ============================================================

  test("TC25 输入限制-Serie-Chnr最大长度15", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_输入限制-Serie-Chnr最大长度15");
    await page.goto(ADC_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("12345678901234567890"); // 20 字符
    const value = await page.locator(SEL.input).inputValue();
    // 1-3. 最多保留 15 个字符
    expect(value.length).toBe(15);
    expect(value).toBe("123456789012345");
    // 4. maxLength=15 生效
    const maxLen = await page.locator(SEL.input).getAttribute("maxlength");
    expect(maxLen).toBe("15");
    await snap("确认 Serie-Chnr 输入限制为 15 个字符");
  });

  test("TC26 输入限制-Desc最大长度4000", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_输入限制-Desc最大长度4000");
    await page.goto(ADC_URL);
    await snap("访问页面");

    const longText = "a".repeat(5000);
    await page.locator(SEL.textarea).fill(longText);
    const value = await page.locator(SEL.textarea).inputValue();
    // 1-3. 最多保留 4000 个字符
    expect(value.length).toBe(4000);
    // 4. maxLength=4000
    const maxLen = await page.locator(SEL.textarea).getAttribute("maxlength");
    expect(maxLen).toBe("4000");
    await snap("确认 Desc 输入限制为 4000 个字符");
  });

  test("TC27 输入限制-Desc首尾空格去除", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_输入限制-Desc首尾空格去除");
    await page.goto(ADC_URL);
    await snap("访问页面");

    let postBody: any = null;
    await mockAdd(page, { body: { success: true } });
    await page.unroute("**/api/ud16/addadchange");
    await page.route("**/api/ud16/addadchange", (route) => {
      postBody = JSON.parse((route.request().postData() as string) || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.textarea).fill("   hello   ");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1-2. 提交时 Desc trim 后为 hello
    await expect(page.locator(SEL.success)).toHaveText("AD change record added successfully");
    await expect.poll(() => postBody).toEqual({ serieChnr: "ABC-123456", desc: "hello" });
    await snap("确认 Desc 提交时去除首尾空格");
  });

  test("TC28 消息清空-输入时清除错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC28_消息清空-输入时清除错误消息");
    await page.goto(ADC_URL);
    await snap("访问页面");

    // 触发错误消息
    await page.locator(SEL.btn).nth(0).click(); // ADD 空值
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required.");
    await snap("触发错误消息后截图");

    // 在 Serie-Chnr 输入框输入内容，错误消息被清除
    await page.locator(SEL.input).fill("ABC-123");
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("在 Serie-Chnr 输入内容后错误消息被清除");

    // 再次触发错误（清空输入框），在 Desc 输入时同样清除
    await page.locator(SEL.input).fill("");
    await page.locator(SEL.btn).nth(0).click(); // ADD 空值
    await expect(page.locator(SEL.error)).toHaveText("Serie-Chnr is required.");
    await page.locator(SEL.textarea).fill("hello");
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("在 Desc 输入内容后错误消息被清除");
  });

  test("TC29 按钮禁用-isLoading期间", async ({ page }) => {
    const snap = makeScreenshot(page, "TC29_按钮禁用-isLoading期间");
    // 拦截 ADD 并挂起
    await page.route("**/api/ud16/addadchange", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
    await page.goto(ADC_URL);
    await snap("访问页面并设置延迟 mock");

    await page.locator(SEL.input).fill("ABC-123456");
    const clickPromise = page.locator(SEL.btn).nth(0).click(); // ADD
    await page.waitForTimeout(300);
    // 1. 三个按钮全部禁用
    await expect(page.locator(SEL.btn).nth(0)).toBeDisabled();
    await expect(page.locator(SEL.btn).nth(1)).toBeDisabled();
    await expect(page.locator(SEL.btn).nth(2)).toBeDisabled();
    // 2. Serie-Chnr 输入框禁用
    await expect(page.locator(SEL.input)).toBeDisabled();
    // 3. Desc 文本域禁用
    await expect(page.locator(SEL.textarea)).toBeDisabled();
    await snap("确认 isLoading 期间按钮与输入控件全部禁用");

    await clickPromise;
    // 5. 操作完成后恢复可用
    await expect(page.locator(SEL.btn).nth(0)).toBeEnabled();
    await expect(page.locator(SEL.input)).toBeEnabled();
    await snap("API 响应后控件恢复可用");
  });

  test("TC30 操作后清空-CheckResult", async ({ page }) => {
    const snap = makeScreenshot(page, "TC30_操作后清空-CheckResult");
    await page.goto(ADC_URL);
    await snap("访问页面");

    // 先 CHECK 成功显示结果
    await mockCheck(page, { body: { success: true, data: checkRecord() } });
    await page.locator(SEL.input).fill("ABC-123456");
    await page.locator(SEL.btn).nth(2).click(); // CHECK
    await expect(page.locator(SEL.checkResult)).toBeVisible();
    await snap("CHECK 成功显示 Check Result 区域");

    // 执行 ADD 操作
    await mockAdd(page, { body: { success: true } });
    await page.locator(SEL.input).fill("ABC-999");
    await page.locator(SEL.btn).nth(0).click(); // ADD
    // 1-2. 执行 ADD 时 checkResult 被清空，区域消失
    await expect(page.locator(SEL.checkResult)).toHaveCount(0);
    await expect(page.locator(SEL.success)).toHaveText("AD change record added successfully");
    await snap("执行 ADD 后 Check Result 区域消失");
  });

  test("TC31 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC31_LOGOUT-登出");
    await page.goto(ADC_URL);
    await snap("访问 AD Change 页面");

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
