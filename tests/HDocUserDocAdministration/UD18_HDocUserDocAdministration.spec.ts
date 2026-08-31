/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const HDA_URL = BASE_URL + "/hdoc-user-doc-administration";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD18";

// 页面元素选择器（与 HDocUserDocAdministration.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".hda-title",
  error: ".hda-error",
  success: ".hda-success",
  input: ".hda-input",
  userInfoBtn: ".hda-userid-row button.hda-btn",
  userName: ".hda-user-name",
  docSection: ".hda-doc-section",
  docList: ".hda-doc-list",
  docItem: ".hda-doc-item",
  docCheckbox: ".hda-doc-checkbox",
  docText: ".hda-doc-text",
  docEmpty: ".hda-doc-empty",
  updateBtn: ".hda-buttons button.hda-btn",
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

/** 默认文档列表 */
const DEFAULT_DOCS = [
  { doctype: "COC", description: "Certificate of Conformity" },
  { doctype: "VDA", description: "Vehicle Data Sheet" },
  { doctype: "VIN_PLATE", description: "VIN Plate" },
];

/** 拦截 GET /api/ud18/getdocumentlist */
async function mockDocList(page: Page, docs: any[]) {
  await page.route("**/api/ud18/getdocumentlist", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: docs }) });
  });
}

/** 拦截 GET /api/ud18/checkuserexists */
async function mockCheckUser(page: Page, exists: boolean) {
  await page.route("**/api/ud18/checkuserexists*", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { exists } }) });
  });
}

/** 拦截 GET /api/ud18/getuserfromsaviynt */
async function mockUserFromSaviynt(page: Page, payload: any) {
  await page.route("**/api/ud18/getuserfromsaviynt*", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });
}

/** 拦截 GET /api/ud18/getuserpermissions */
async function mockUserPermissions(page: Page, docs: string[]) {
  await page.route("**/api/ud18/getuserpermissions*", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { documents: docs } }) });
  });
}

test.describe("UD18 HDoc User Doc Administration 模块测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => localStorage.setItem("userID", "admin001"));
    await dismissOverlay(page);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问 HDoc User Doc Administration 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("HDoc User Doc Administration");
    // 2. UserID 输入框为空
    await expect(page.locator(SEL.input)).toHaveValue("");
    // 3. User 显示 "-"
    await expect(page.locator(SEL.userName)).toHaveText("-");
    // 4. Document 列表显示从 API 获取的文档
    await expect(page.locator(SEL.docItem)).toHaveCount(3);
    await expect(page.locator(SEL.docText).nth(0)).toHaveText("Certificate of Conformity");
    await expect(page.locator(SEL.docText).nth(1)).toHaveText("Vehicle Data Sheet");
    await expect(page.locator(SEL.docText).nth(2)).toHaveText("VIN Plate");
    // 5. 所有文档 Checkbox 未选中
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(SEL.docCheckbox).nth(i)).not.toBeChecked();
    }
    // 6. 不显示错误/成功消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await snap("确认标题、空输入、文档列表与未选中 Checkbox");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(HDA_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-文档列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-文档列表加载");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面并设置文档列表 mock");

    // 1. Document 列表显示文档描述
    await expect(page.locator(SEL.docItem)).toHaveCount(3);
    // 2. 显示描述（Certificate of Conformity 等）
    await expect(page.locator(SEL.docText).nth(0)).toHaveText("Certificate of Conformity");
    await expect(page.locator(SEL.docText).nth(1)).toHaveText("Vehicle Data Sheet");
    await expect(page.locator(SEL.docText).nth(2)).toHaveText("VIN Plate");
    // 3. 每个文档对应 Checkbox
    await expect(page.locator(SEL.docCheckbox)).toHaveCount(3);
    await snap("确认文档列表正确填充");
  });

  test("TC04 画面初始化-文档列表为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_画面初始化-文档列表为空");
    await mockDocList(page, []);
    await page.goto(HDA_URL);
    await snap("访问页面并设置空文档列表 mock");

    // 1. 显示 No documents available.
    await expect(page.locator(SEL.docEmpty)).toHaveText("No documents available.");
    // 2. 不显示文档 Checkbox
    await expect(page.locator(SEL.docCheckbox)).toHaveCount(0);
    // 3. 页面正常显示
    await expect(page.locator(SEL.title)).toHaveText("HDoc User Doc Administration");
    await snap("确认空文档列表显示 No documents available.");
  });

  // ============================================================
  // User Info 操作
  // ============================================================

  test("TC05 User Info-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_User Info-空值校验");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    // 记录 User Info API 是否被调用
    let checkCalled = false;
    await page.route("**/api/ud18/checkuserexists*", (route) => {
      checkCalled = true;
      route.continue();
    });

    await page.locator(SEL.userInfoBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("User ID is required.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(checkCalled).toBe(false);
    await snap("确认空值校验错误消息且未调用 API");
  });

  test("TC06 User Info-Enter键触发", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_User Info-Enter键触发");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    await mockUserFromSaviynt(page, { success: true, data: { userName: "John Doe" } });
    await mockUserPermissions(page, []);
    await page.goto(HDA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.input).press("Enter");
    // Enter 触发 handleUserInfo，执行用户信息查询
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("确认 Enter 键触发用户查询并显示用户名");
  });

  test("TC07 User Info-用户不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_User Info-用户不存在");
    await mockDocList(page, DEFAULT_DOCS);
    // checkuserexists 返回 exists=false
    await mockCheckUser(page, false);
    await page.goto(HDA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("nouser01");
    await page.locator(SEL.userInfoBtn).click();
    // 2. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    // 4. 不显示用户名
    await expect(page.locator(SEL.userName)).toHaveText("-");
    // 6. 按钮恢复可用
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("确认用户不存在错误消息且不加载");
  });

  test("TC08 User Info-成功查询用户", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_User Info-成功查询用户");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    await mockUserFromSaviynt(page, { success: true, data: { userName: "John Doe" } });
    await mockUserPermissions(page, ["COC"]);
    await page.goto(HDA_URL);
    await snap("访问页面并设置各 API mock");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.userInfoBtn).click();
    // 3. User 字段显示 John Doe
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    // 5. COC Checkbox 自动选中
    await expect(page.locator(SEL.docCheckbox).nth(0)).toBeChecked();
    // 6. 按钮恢复可用
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("确认用户查询成功并自动勾选 COC");
  });

  test("TC09 User Info-权限自动勾选", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_User Info-权限自动勾选");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    await mockUserFromSaviynt(page, { success: true, data: { userName: "John Doe" } });
    // 用户权限 [COC, VDA]
    await mockUserPermissions(page, ["COC", "VDA"]);
    await page.goto(HDA_URL);
    await snap("访问页面并设置权限 mock");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    // 1. COC Checkbox 被选中
    await expect(page.locator(SEL.docCheckbox).nth(0)).toBeChecked();
    // 2. VDA Checkbox 被选中
    await expect(page.locator(SEL.docCheckbox).nth(1)).toBeChecked();
    // 3. 其余文档 Checkbox 未选中
    await expect(page.locator(SEL.docCheckbox).nth(2)).not.toBeChecked();
    await snap("确认 COC/VDA 权限自动勾选");
  });

  test("TC10 User Info-无权限用户", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_User Info-无权限用户");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    await mockUserFromSaviynt(page, { success: true, data: { userName: "NoPerm User" } });
    await mockUserPermissions(page, []);
    await page.goto(HDA_URL);
    await snap("访问页面并设置空权限 mock");

    await page.locator(SEL.input).fill("noperm01");
    await page.locator(SEL.userInfoBtn).click();
    // 1. User 字段显示用户名
    await expect(page.locator(SEL.userName)).toHaveText("NoPerm User");
    // 2. 所有文档 Checkbox 未选中
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(SEL.docCheckbox).nth(i)).not.toBeChecked();
    }
    // 3. 不报错
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认无权限用户所有 Checkbox 未选中且不报错");
  });

  test("TC11 User Info-网络异常", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_User Info-网络异常");
    await mockDocList(page, DEFAULT_DOCS);
    // checkuserexists 请求网络中断
    await page.route("**/api/ud18/checkuserexists*", (route) => route.abort());
    await page.goto(HDA_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.userInfoBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Failed to connect to Saviynt system.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    // 4. 数据不加载
    await expect(page.locator(SEL.userName)).toHaveText("-");
    await snap("确认用户信息网络错误消息");
  });

  // ============================================================
  // 文档权限选择
  // ============================================================

  test("TC12 文档选择-勾选文档", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_文档选择-勾选文档");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    // 勾选 COC
    await page.locator(SEL.docCheckbox).nth(0).check();
    // 1. COC Checkbox 变为选中
    await expect(page.locator(SEL.docCheckbox).nth(0)).toBeChecked();
    // 3. 其余文档不受影响
    await expect(page.locator(SEL.docCheckbox).nth(1)).not.toBeChecked();
    await expect(page.locator(SEL.docCheckbox).nth(2)).not.toBeChecked();
    await snap("确认勾选 COC 生效");
  });

  test("TC13 文档选择-取消勾选", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_文档选择-取消勾选");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    // 先勾选 COC
    await page.locator(SEL.docCheckbox).nth(0).check();
    await expect(page.locator(SEL.docCheckbox).nth(0)).toBeChecked();
    // 取消勾选
    await page.locator(SEL.docCheckbox).nth(0).uncheck();
    // 1. COC Checkbox 取消选中
    await expect(page.locator(SEL.docCheckbox).nth(0)).not.toBeChecked();
    // 3. 其余文档不受影响
    await expect(page.locator(SEL.docCheckbox).nth(1)).not.toBeChecked();
    await snap("确认取消勾选 COC 生效");
  });

  test("TC14 文档选择-多选", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_文档选择-多选");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    // 依次勾选 COC、VDA、VIN_PLATE
    await page.locator(SEL.docCheckbox).nth(0).check();
    await page.locator(SEL.docCheckbox).nth(1).check();
    await page.locator(SEL.docCheckbox).nth(2).check();
    // 1. 三个文档 Checkbox 均变为选中
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(SEL.docCheckbox).nth(i)).toBeChecked();
    }
    await snap("确认三个文档全部选中");
  });

  test("TC15 输入时清除消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_输入时清除消息");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    // 触发错误消息
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("User ID is required.");
    await snap("触发错误消息");

    // 勾选文档清除消息
    await page.locator(SEL.docCheckbox).nth(0).check();
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("勾选文档后错误消息被清除");

    // 再次触发错误，取消勾选清除消息
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("User ID is required.");
    await page.locator(SEL.docCheckbox).nth(0).uncheck();
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("取消勾选文档后错误消息被清除");
  });

  // ============================================================
  // Update 操作
  // ============================================================

  test("TC16 Update-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Update-空值校验");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    let checkCalled = false;
    await page.route("**/api/ud18/checkuserexists*", (route) => {
      checkCalled = true;
      route.continue();
    });

    await page.locator(SEL.updateBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("User ID is required.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(checkCalled).toBe(false);
    await snap("确认 Update 空值校验错误消息");
  });

  test("TC17 Update-成功更新权限", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_Update-成功更新权限");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    await page.goto(HDA_URL);
    await snap("访问页面");

    let putBody: any = null;
    await page.route("**/api/ud18/updateuserdocpermissions", (route) => {
      putBody = JSON.parse(route.request().postData() || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    // 勾选 COC、VDA
    await page.locator(SEL.docCheckbox).nth(0).check();
    await page.locator(SEL.docCheckbox).nth(1).check();
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 4. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("User document permissions updated successfully.");
    // 3. 请求 body 正确
    await expect.poll(() => putBody).toEqual({ userId: "user001", documents: ["COC", "VDA"] });
    // 5. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update 成功并请求体正确");
  });

  test("TC18 Update-用户不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_Update-用户不存在");
    await mockDocList(page, DEFAULT_DOCS);
    // checkuserexists 返回 exists=false
    await mockCheckUser(page, false);
    await page.goto(HDA_URL);
    await snap("访问页面并设置用户不存在 mock");

    let updateCalled = false;
    await page.route("**/api/ud18/updateuserdocpermissions", (route) => {
      updateCalled = true;
      route.continue();
    });

    await page.locator(SEL.docCheckbox).nth(0).check();
    await page.locator(SEL.input).fill("nouser01");
    await page.locator(SEL.updateBtn).click();
    // 2. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    // 4. 不调用更新 API
    await page.waitForTimeout(300);
    expect(updateCalled).toBe(false);
    // 5. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update 用户不存在错误消息且不调用更新 API");
  });

  test("TC19 Update-不勾选任何文档", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_Update-不勾选任何文档");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    await page.goto(HDA_URL);
    await snap("访问页面");

    let putBody: any = null;
    await page.route("**/api/ud18/updateuserdocpermissions", (route) => {
      putBody = JSON.parse(route.request().postData() || "{}");
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 1. 请求 body 中 documents 为空数组
    await expect(page.locator(SEL.success)).toHaveText("User document permissions updated successfully.");
    await expect.poll(() => putBody).toEqual({ userId: "user001", documents: [] });
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认不勾选文档时 documents 为空数组并成功");
  });

  test("TC20 Update-异常处理-服务器错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_Update-异常处理-服务器错误");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    // 更新 API 返回 500，body 非 JSON 使 response.json() 抛错进入 catch
    await page.route("**/api/ud18/updateuserdocpermissions", (route) => {
      route.fulfill({ status: 500, contentType: "text/plain", body: "Internal Server Error" });
    });
    await page.goto(HDA_URL);
    await snap("访问页面并设置 500 mock");

    await page.locator(SEL.docCheckbox).nth(0).check();
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update 服务器 500 错误消息");
  });

  test("TC21 Update-异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_Update-异常处理-网络错误");
    await mockDocList(page, DEFAULT_DOCS);
    await mockCheckUser(page, true);
    // 更新 API 网络中断
    await page.route("**/api/ud18/updateuserdocpermissions", (route) => route.abort());
    await page.goto(HDA_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.docCheckbox).nth(0).check();
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update 网络错误消息");
  });

  // ============================================================
  // 输入限制与 UI 交互
  // ============================================================

  test("TC22 输入限制-UserID最大长度10", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_输入限制-UserID最大长度10");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("123456789012345"); // 15 字符
    const value = await page.locator(SEL.input).inputValue();
    // 1-3. 最多保留 10 个字符
    expect(value.length).toBe(10);
    expect(value).toBe("1234567890");
    // 4. maxLength=10
    const maxLen = await page.locator(SEL.input).getAttribute("maxlength");
    expect(maxLen).toBe("10");
    await snap("确认 UserID 输入限制为 10 个字符");
  });

  test("TC23 UserID首尾空格去除", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_UserID首尾空格去除");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    // 捕获 checkuserexists 请求 URL
    let checkUrl: string | null = null;
    await page.route("**/api/ud18/checkuserexists*", (route) => {
      checkUrl = route.request().url();
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { exists: true } }) });
    });
    await mockUserFromSaviynt(page, { success: true, data: { userName: "user001" } });
    await mockUserPermissions(page, []);

    await page.locator(SEL.input).fill("   user001   ");
    await page.locator(SEL.userInfoBtn).click();
    // 1-3. trim 后为 user001，URL 使用 encodeURIComponent
    await expect(page.locator(SEL.userName)).toHaveText("user001");
    await expect.poll(() => checkUrl).toContain("userId=user001");
    await snap("确认 UserID trim 后正确编码请求参数");
  });

  test("TC24 按钮禁用-isLoading期间", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_按钮禁用-isLoading期间");
    await mockDocList(page, DEFAULT_DOCS);
    // 挂起 checkuserexists 请求（串行调用，缩短延迟以在断言超时内完成）
    await page.route("**/api/ud18/checkuserexists*", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { exists: true } }) });
    });
    await page.route("**/api/ud18/getuserfromsaviynt*", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { userName: "John" } }) });
    });
    await page.route("**/api/ud18/getuserpermissions*", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { documents: [] } }) });
    });
    await page.goto(HDA_URL);
    await snap("访问页面并设置延迟 mock");

    await page.locator(SEL.input).fill("user001");
    const clickPromise = page.locator(SEL.userInfoBtn).click();
    await page.waitForTimeout(300);
    // 1. User Info 按钮禁用
    await expect(page.locator(SEL.userInfoBtn)).toBeDisabled();
    // 2. Update 按钮禁用
    await expect(page.locator(SEL.updateBtn)).toBeDisabled();
    // 3. UserID 输入框禁用
    await expect(page.locator(SEL.input)).toBeDisabled();
    // 4. 所有文档 Checkbox 禁用
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(SEL.docCheckbox).nth(i)).toBeDisabled();
    }
    await snap("确认 isLoading 期间所有控件禁用");

    await clickPromise;
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("API 响应后控件恢复可用");
  });

  test("TC25 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_LOGOUT-登出");
    await mockDocList(page, DEFAULT_DOCS);
    await page.goto(HDA_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
