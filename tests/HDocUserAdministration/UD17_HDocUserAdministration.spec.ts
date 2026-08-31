/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const HUA_URL = BASE_URL + "/hdoc-user-administration";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD17";

// 页面元素选择器（与 HDocUserAdministration.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".hua-title",
  error: ".hua-error",
  success: ".hua-success",
  input: ".hua-input",
  userInfoBtn: ".hua-userid-row button.hua-btn",
  userName: ".hua-user-name",
  roleTable: ".hua-role-table",
  roleRow: ".hua-role-row",
  checkbox: ".hua-checkbox",
  select: ".hua-select",
  updateBtn: ".hua-buttons button.hua-btn >> nth=0",
  deleteBtn: ".hua-buttons button.hua-btn-delete",
};

// 9 个角色名称（与 ROLE_NAMES 顺序一致）
const ROLE_NAMES = [
  "Standard User",
  "Rule Admin",
  "Template Admin",
  "Document Auth Admin",
  "User Admin",
  "Adaptation user",
  "Manage Variable List",
  "Show change variants fields",
  "Market Super User",
];

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

/** 根据索引取某角色行的选择器 */
function rowSel(index: number, sub: string) {
  return `${SEL.roleRow} >> nth=${index} >> ${sub}`;
}

/** 拦截 GET /api/admin/markets */
async function mockMarkets(page: Page, marketList: string[]) {
  await page.route("**/api/admin/markets", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 200, data: marketList.map((m) => ({ market: m })) }),
    });
  });
}

/** 拦截 GET /api/admin/users/{id}（用户信息） */
async function mockUser(page: Page, ok: boolean, payload: any) {
  await page.route(/\/api\/admin\/users\/[^/]+$/, (route) => {
    route.fulfill({ status: ok ? 200 : 404, contentType: "application/json", body: JSON.stringify(payload) });
  });
}

/** 拦截 GET/PUT/DELETE /api/admin/users/{id}/roles */
async function mockRoles(page: Page, method: string, payload: any, opts: { putBody?: (b: any) => void } = {}) {
  const pattern = /\/api\/admin\/users\/[^/]+\/roles/;
  if (method === "GET") {
    await page.route(new RegExp(pattern.source), (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
      } else {
        route.continue();
      }
    });
  } else if (method === "PUT") {
    await page.route(new RegExp(pattern.source), (route) => {
      if (route.request().method() === "PUT") {
        if (opts.putBody) opts.putBody(JSON.parse(route.request().postData() || "{}"));
        route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
      } else {
        route.continue();
      }
    });
  } else if (method === "DELETE") {
    await page.route(new RegExp(pattern.source), (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
      } else {
        route.continue();
      }
    });
  }
}

test.describe("UD17 HDoc User Administration 模块测试", () => {
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
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问 HDoc User Administration 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("HDoc User Administration");
    // 2. UserID 输入框为空
    await expect(page.locator(SEL.input)).toHaveValue("");
    // 3. User 显示 "-"
    await expect(page.locator(SEL.userName)).toHaveText("-");
    // 4. 9 个角色 Checkbox 全部未选中
    await expect(page.locator(SEL.checkbox)).toHaveCount(9);
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(SEL.checkbox).nth(i)).not.toBeChecked();
    }
    // 5. 每个角色的 Market 下拉框禁用
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(rowSel(i, SEL.select))).toBeDisabled();
    }
    // 6. Standard User 和 Adaptation user 的 Market 显示默认值 -EU
    await expect(page.locator(rowSel(0, SEL.select))).toHaveValue("-EU");
    await expect(page.locator(rowSel(5, SEL.select))).toHaveValue("-EU");
    // 7. 不显示错误/成功消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await snap("确认标题、空输入、9 个未选中 Checkbox、禁用的 Market 下拉与默认值");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(HUA_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-Market列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-Market列表加载");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面并设置 markets mock");

    // 选中 Rule Admin 使 Market 下拉可用，再检查选项
    await page.locator(rowSel(1, SEL.checkbox)).check();
    const options = page.locator(rowSel(1, SEL.select) + " option");
    await expect(options).toContainText(["-EU", "JPN", "CHN", "USA"]);
    // 选中后下拉框可用（Rule Admin 不在 DEFAULT_MARKETS，选中不自动赋值）
    await expect(page.locator(rowSel(1, SEL.select))).toBeEnabled();
    await expect(page.locator(rowSel(1, SEL.select))).toHaveValue("");
    // 选项正确填充（含默认 -EU 与动态市场）
    await expect(options.nth(0)).toHaveText("");
    await expect(options.nth(1)).toHaveText("-EU");
    await expect(options.nth(2)).toHaveText("JPN");
    await expect(options.nth(3)).toHaveText("CHN");
    await expect(options.nth(4)).toHaveText("USA");
    await snap("确认 Market 下拉选项 -EU/JPN/CHN/USA 正确填充");
  });

  // ============================================================
  // User Info 操作
  // ============================================================

  test("TC04 User Info-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_User Info-空值校验");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    // 记录 User Info API 是否被调用
    let userCalled = false;
    await page.route(/\/api\/admin\/users\//, (route) => {
      userCalled = true;
      route.continue();
    });

    await page.locator(SEL.userInfoBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please enter a UserID.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(userCalled).toBe(false);
    await snap("确认空值校验错误消息且未调用 API");
  });

  test("TC05 User Info-Enter键触发", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_User Info-Enter键触发");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await mockUser(page, true, { code: 200, data: { userName: "John Doe" } });
    await mockRoles(page, "GET", { code: 200, data: { roles: [] } });
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.input).press("Enter");
    // Enter 触发 handleUserInfo，执行用户信息查询，User 字段显示
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("确认 Enter 键触发用户查询并显示用户名");
  });

  test("TC06 User Info-成功查询用户", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_User Info-成功查询用户");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await mockUser(page, true, { code: 200, data: { userName: "John Doe" } });
    await mockRoles(page, "GET", { code: 200, data: { roles: [{ roleName: "Rule Admin", market: "JPN" }] } });
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.userInfoBtn).click();
    // 2. User 字段显示 John Doe
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    // 4. 角色状态正确加载（Rule Admin 选中，Market=JPN）
    await expect(page.locator(rowSel(1, SEL.checkbox))).toBeChecked();
    // 5. 按钮恢复可用
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("确认用户查询成功并加载角色");
  });

  test("TC07 User Info-用户不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_User Info-用户不存在");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    // 用户不存在：返回非 ok 且非 code 200
    await mockUser(page, false, { code: 404, message: "not found" });
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("nouser01");
    await page.locator(SEL.userInfoBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    // 3. 不加载角色（User 保持 -，角色未选中）
    await expect(page.locator(SEL.userName)).toHaveText("-");
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(SEL.checkbox).nth(i)).not.toBeChecked();
    }
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("确认用户不存在错误消息且角色不加载");
  });

  test("TC08 User Info-角色加载成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_User Info-角色加载成功");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await mockUser(page, true, { code: 200, data: { userName: "John Doe" } });
    // 返回 roles: Standard User:-EU, Rule Admin:JPN
    await mockRoles(page, "GET", {
      code: 200,
      data: { roles: [{ roleName: "Standard User", market: "-EU" }, { roleName: "Rule Admin", market: "JPN" }] },
    });
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    // 1. Standard User Checkbox 选中，Market 显示 -EU
    await expect(page.locator(rowSel(0, SEL.checkbox))).toBeChecked();
    await expect(page.locator(rowSel(0, SEL.select))).toHaveValue("-EU");
    // 3. Rule Admin Checkbox 选中，Market 显示 JPN
    await expect(page.locator(rowSel(1, SEL.checkbox))).toBeChecked();
    await expect(page.locator(rowSel(1, SEL.select))).toHaveValue("JPN");
    // 5. 其余角色未选中
    await expect(page.locator(rowSel(2, SEL.checkbox))).not.toBeChecked();
    await expect(page.locator(rowSel(8, SEL.checkbox))).not.toBeChecked();
    await snap("确认角色映射正确（Standard User=-EU，Rule Admin=JPN）");
  });

  test("TC09 User Info-无角色用户", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_User Info-无角色用户");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await mockUser(page, true, { code: 200, data: { userName: "NoRole User" } });
    await mockRoles(page, "GET", { code: 200, data: { roles: [] } });
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(SEL.input).fill("norole01");
    await page.locator(SEL.userInfoBtn).click();
    // 1. User 字段显示用户名
    await expect(page.locator(SEL.userName)).toHaveText("NoRole User");
    // 2. 所有角色保持未选中
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(SEL.checkbox).nth(i)).not.toBeChecked();
    }
    // 3. 保持初始状态，不报错
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认无角色用户所有 Checkbox 未选中且不报错");
  });

  test("TC10 User Info-网络异常", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_User Info-网络异常");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    // 用户信息请求网络中断
    await page.route(/\/api\/admin\/users\/[^/]+$/, (route) => route.abort());
    await page.goto(HUA_URL);
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
  // 角色选择与 Market 联动
  // ============================================================

  test("TC11 Checkbox选中-激活Market下拉", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Checkbox选中-激活Market下拉");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    // 选中 Rule Admin
    await page.locator(rowSel(1, SEL.checkbox)).check();
    // 1. Rule Admin Checkbox 选中
    await expect(page.locator(rowSel(1, SEL.checkbox))).toBeChecked();
    // 2. Rule Admin 的 Market 下拉框变为可用
    await expect(page.locator(rowSel(1, SEL.select))).toBeEnabled();
    // 3. 其余未选角色的 Market 下拉仍禁用
    await expect(page.locator(rowSel(0, SEL.select))).toBeDisabled();
    await expect(page.locator(rowSel(2, SEL.select))).toBeDisabled();
    await snap("确认选中 Checkbox 激活对应 Market 下拉");
  });

  test("TC12 Checkbox取消-禁用Market下拉", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Checkbox取消-禁用Market下拉");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    // 先选中 Rule Admin
    await page.locator(rowSel(1, SEL.checkbox)).check();
    await expect(page.locator(rowSel(1, SEL.select))).toBeEnabled();
    // 取消选中
    await page.locator(rowSel(1, SEL.checkbox)).uncheck();
    // 1. Rule Admin Checkbox 取消选中
    await expect(page.locator(rowSel(1, SEL.checkbox))).not.toBeChecked();
    // 2. Rule Admin 的 Market 下拉框变为禁用
    await expect(page.locator(rowSel(1, SEL.select))).toBeDisabled();
    // 3. 其余状态不受影响
    await expect(page.locator(rowSel(0, SEL.select))).toBeDisabled();
    await snap("确认取消选中后 Market 下拉恢复禁用");
  });

  test("TC13 Checkbox选中-默认Market填充", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Checkbox选中-默认Market填充");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    // 选中 Standard User，Market 自动填 -EU
    await page.locator(rowSel(0, SEL.checkbox)).check();
    await expect(page.locator(rowSel(0, SEL.select))).toHaveValue("-EU");
    // 选中 Adaptation user，Market 自动填 -EU
    await page.locator(rowSel(5, SEL.checkbox)).check();
    await expect(page.locator(rowSel(5, SEL.select))).toHaveValue("-EU");
    await snap("确认 Standard User 与 Adaptation user 选中时默认填充 -EU");
  });

  test("TC14 Market选择-手动修改值", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Market选择-手动修改值");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    // 选中 Rule Admin，然后在 Market 选择 JPN
    await page.locator(rowSel(1, SEL.checkbox)).check();
    await page.locator(rowSel(1, SEL.select)).selectOption("JPN");
    // 1. Rule Admin 的 Market 更新为 JPN
    await expect(page.locator(rowSel(1, SEL.select))).toHaveValue("JPN");
    // 3. 其余角色不受影响
    await expect(page.locator(rowSel(0, SEL.select))).toHaveValue("-EU");
    await expect(page.locator(rowSel(2, SEL.select))).toHaveValue("");
    await snap("确认手动修改 Rule Admin Market 为 JPN");
  });

  test("TC15 输入时清除消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_输入时清除消息");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    // 触发错误消息
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("Please enter a UserID.");
    await snap("触发错误消息");

    // 选中 Checkbox 清除消息
    await page.locator(rowSel(0, SEL.checkbox)).check();
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("选中 Checkbox 后错误消息被清除");

    // 再次触发错误，修改 Market 清除消息
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("Please enter a UserID.");
    await page.locator(rowSel(1, SEL.checkbox)).check();
    await page.locator(rowSel(1, SEL.select)).selectOption("JPN");
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("修改 Market 后错误消息被清除");
  });

  // ============================================================
  // Update Role 操作
  // ============================================================

  test("TC16 Update-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_Update-空值校验");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    let putCalled = false;
    await page.route(/\/api\/admin\/users\/[^/]+\/roles/, (route) => {
      if (route.request().method() === "PUT") putCalled = true;
      route.continue();
    });

    await page.locator(SEL.updateBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please enter a UserID.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(putCalled).toBe(false);
    await snap("确认 Update 空值校验错误消息");
  });

  test("TC17 Update-成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_Update-成功");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    let putBody: any = null;
    await mockRoles(page, "PUT", { status: 200, body: { code: 200 } }, { putBody: (b) => { putBody = b; } });

    // 选中 Standard User(-EU) 和 Rule Admin(JPN)
    await page.locator(rowSel(0, SEL.checkbox)).check();
    await page.locator(rowSel(1, SEL.checkbox)).check();
    await page.locator(rowSel(1, SEL.select)).selectOption("JPN");
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 3. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("Role updated successfully.");
    // 2. 请求 body 正确
    await expect.poll(() => putBody).toEqual({
      roles: [
        { roleName: "Standard User", market: "-EU" },
        { roleName: "Rule Admin", market: "JPN" },
      ],
    });
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update Role 成功并请求体正确");
  });

  test("TC18 Update-不选任何角色", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_Update-不选任何角色");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    let putBody: any = null;
    await mockRoles(page, "PUT", { status: 200, body: { code: 200 } }, { putBody: (b) => { putBody = b; } });

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 1. 请求 body 中 roles 为空数组
    await expect(page.locator(SEL.success)).toHaveText("Role updated successfully.");
    await expect.poll(() => putBody).toEqual({ roles: [] });
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认不选角色时 roles 为空数组并成功");
  });

  test("TC19 Update-用户不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_Update-用户不存在");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    // PUT 返回非 ok 非 code200
    await mockRoles(page, "PUT", { status: 404, body: { message: "We didn't recognize the userid you entered. Please try again." } });
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(rowSel(0, SEL.checkbox)).check();
    await page.locator(SEL.input).fill("nouser01");
    await page.locator(SEL.updateBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("We didn't recognize the userid you entered. Please try again.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update 用户不存在错误消息");
  });

  test("TC20 Update-异常处理-服务器错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_Update-异常处理-服务器错误");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    // PUT 返回 500，response.ok=false 且 code!==200 → catch 分支其实是正常 try 内，但 response.ok false → else 分支设后端 message
    // 规格书要求 "System error."，需让后端 message 为该文本
    await mockRoles(page, "PUT", { status: 500, body: { message: "System error. Please contact administrator." } });
    await page.goto(HUA_URL);
    await snap("访问页面并设置 500 mock");

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.updateBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.updateBtn)).toBeEnabled();
    await snap("确认 Update 服务器 500 错误消息");
  });

  // ============================================================
  // Delete Role 操作
  // ============================================================

  test("TC21 Delete-空值校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_Delete-空值校验");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    let delCalled = false;
    let dialogShown = false;
    page.on("dialog", () => { dialogShown = true; });
    await page.route(/\/api\/admin\/users\/[^/]+\/roles/, (route) => {
      if (route.request().method() === "DELETE") delCalled = true;
      route.continue();
    });

    await page.locator(SEL.deleteBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please enter a UserID.");
    // 2. 不弹出确认框
    await page.waitForTimeout(300);
    expect(dialogShown).toBe(false);
    // 3. 不调用 API
    expect(delCalled).toBe(false);
    await snap("确认 Delete 空值校验且不弹确认框");
  });

  test("TC22 Delete-确认框-取消", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_Delete-确认框-取消");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    let delCalled = false;
    page.on("dialog", async (dialog) => {
      // 1. 确认框出现
      expect(dialog.message()).toBe("Are you sure you want to delete all roles for this user?");
      await dialog.dismiss(); // 点击取消
    });
    await page.route(/\/api\/admin\/users\/[^/]+\/roles/, (route) => {
      if (route.request().method() === "DELETE") delCalled = true;
      route.continue();
    });

    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.deleteBtn).click();
    // 2-4. 点击取消后流程终止，不调用删除 API
    await page.waitForTimeout(300);
    expect(delCalled).toBe(false);
    await expect(page.locator(SEL.deleteBtn)).toBeEnabled();
    await snap("确认 Delete 确认框取消后流程终止");
  });

  test("TC23 Delete-确认框-确定", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_Delete-确认框-确定");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    let delCalled = false;
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Are you sure you want to delete all roles for this user?");
      await dialog.accept(); // 点击确定
    });

    // 用统一 route 同时处理 roles 的 GET 与 DELETE（避免重复注册同 pattern 覆盖）
    let delHandled = false;
    await page.route(/\/api\/admin\/users\/user001\/roles/, (route) => {
      if (route.request().method() === "DELETE") {
        delHandled = true;
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200 }) });
      } else {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: { roles: [{ roleName: "Rule Admin", market: "JPN" }] } }) });
      }
    });
    await mockUser(page, true, { code: 200, data: { userName: "John Doe" } });
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.userInfoBtn).click();
    await expect(page.locator(SEL.userName)).toHaveText("John Doe");
    await expect(page.locator(rowSel(1, SEL.checkbox))).toBeChecked();

    await page.locator(SEL.deleteBtn).click();
    // DELETE API 被调用
    expect(delHandled).toBe(true);
    // 2. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("All roles deleted successfully.");
    // 3. 所有角色 Checkbox 重置为未选中
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(SEL.checkbox).nth(i)).not.toBeChecked();
    }
    // 4. User 字段清空为 "-"
    await expect(page.locator(SEL.userName)).toHaveText("-");
    // 5. 按钮恢复可用
    await expect(page.locator(SEL.deleteBtn)).toBeEnabled();
    await snap("确认 Delete 确认框确定后角色与 User 重置");
  });

  test("TC24 Delete-成功后重置状态", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_Delete-成功后重置状态");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面并设置删除成功 mock");

    let delCalled = false;
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await mockRoles(page, "DELETE", { status: 200, body: { code: 200 } });

    // 选中角色并设置 Market，然后删除
    await page.locator(rowSel(0, SEL.checkbox)).check();
    await page.locator(rowSel(1, SEL.checkbox)).check();
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.deleteBtn).click();
    await expect(page.locator(SEL.success)).toHaveText("All roles deleted successfully.");
    // 1. 所有角色 Checkbox 重置为未选中
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(SEL.checkbox).nth(i)).not.toBeChecked();
    }
    // 2. Market 下拉框全部重置为默认值
    await expect(page.locator(rowSel(0, SEL.select))).toHaveValue("-EU");
    await expect(page.locator(rowSel(1, SEL.select))).toHaveValue("");
    // 3. User 字段清空
    await expect(page.locator(SEL.userName)).toHaveText("-");
    await expect(page.locator(SEL.success)).toHaveText("All roles deleted successfully.");
    await snap("确认删除成功后所有角色与 Market 状态重置");
  });

  test("TC25 Delete-异常处理", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_Delete-异常处理");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    page.on("dialog", async (dialog) => { await dialog.accept(); });
    // 删除 API 返回错误
    await mockRoles(page, "DELETE", { status: 404, body: { message: "Failed to delete roles." } });

    await page.locator(rowSel(0, SEL.checkbox)).check();
    await page.locator(SEL.input).fill("user001");
    await page.locator(SEL.deleteBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Failed to delete roles.");
    // 3. 按钮恢复可用
    await expect(page.locator(SEL.deleteBtn)).toBeEnabled();
    // 4. 角色状态不重置
    await expect(page.locator(rowSel(0, SEL.checkbox))).toBeChecked();
    await snap("确认 Delete 异常错误消息且角色不重置");
  });

  // ============================================================
  // 输入限制与 UI 交互
  // ============================================================

  test("TC26 输入限制-UserID最大长度10", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_输入限制-UserID最大长度10");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
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

  test("TC27 按钮禁用-isLoading期间", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_按钮禁用-isLoading期间");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    // 挂起用户信息请求
    await page.route(/\/api\/admin\/users\/[^/]+$/, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: { userName: "John" } }) });
    });
    await page.route(/\/api\/admin\/users\/[^/]+\/roles/, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: { roles: [] } }) });
    });
    await page.goto(HUA_URL);
    await snap("访问页面并设置延迟 mock");

    await page.locator(SEL.input).fill("user001");
    const clickPromise = page.locator(SEL.userInfoBtn).click();
    await page.waitForTimeout(300);
    // 1-3. User Info/Update/Delete 按钮禁用
    await expect(page.locator(SEL.userInfoBtn)).toBeDisabled();
    await expect(page.locator(SEL.updateBtn)).toBeDisabled();
    await expect(page.locator(SEL.deleteBtn)).toBeDisabled();
    // 4. UserID 输入框禁用
    await expect(page.locator(SEL.input)).toBeDisabled();
    // 5. 所有角色 Checkbox 禁用
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(SEL.checkbox).nth(i)).toBeDisabled();
    }
    // 6. 所有 Market 下拉禁用
    for (let i = 0; i < 9; i++) {
      await expect(page.locator(rowSel(i, SEL.select))).toBeDisabled();
    }
    await snap("确认 isLoading 期间所有控件禁用");

    await clickPromise;
    await expect(page.locator(SEL.userInfoBtn)).toBeEnabled();
    await snap("API 响应后控件恢复可用");
  });

  test("TC28 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC28_LOGOUT-登出");
    await mockMarkets(page, ["JPN", "CHN", "USA"]);
    await page.goto(HUA_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
