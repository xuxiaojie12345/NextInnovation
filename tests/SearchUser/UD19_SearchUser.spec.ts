/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SU_URL = BASE_URL + "/search-user";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD19";

// 页面元素选择器（与 SearchUser.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".su-title",
  error: ".su-error",
  inputUserid: ".su-input >> nth=0",
  inputUser: ".su-input >> nth=1",
  select: ".su-select",
  radio: ".su-radio",
  searchBtn: ".su-btn",
  count: ".su-count",
  table: ".su-table",
  row: ".su-row",
  userLink: ".su-user-link",
  noData: ".su-no-data",
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

/** 默认市场列表 */
const DEFAULT_MARKETS = [
  { market: "EU", description: "Europe" },
  { market: "US", description: "United States" },
];

/** 拦截 GET /api/ud19/getmarketlist */
async function mockMarkets(page: Page, markets: any[]) {
  await page.route("**/api/ud19/getmarketlist", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: markets }) });
  });
}

/** 拦截 POST /api/ud19/searchusers 并捕获请求体 */
async function mockSearch(page: Page, payload: any, opts: { body?: (b: any) => void } = {}) {
  await page.route("**/api/ud19/searchusers", (route) => {
    if (opts.body) opts.body(JSON.parse(route.request().postData() || "{}"));
    route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
  });
}

/** 构造用户记录 */
function userRecord(overrides: any = {}) {
  return { userId: "user001", userName: "John Doe", market: "EU", ...overrides };
}

test.describe("UD19 Search User 模块测试", () => {
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
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问 Search User 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Search User");
    // 2. Userid 输入框为空
    await expect(page.locator(SEL.inputUserid)).toHaveValue("");
    // 3. User 输入框为空
    await expect(page.locator(SEL.inputUser)).toHaveValue("");
    // 4. Market 下拉框为空选项
    await expect(page.locator(SEL.select)).toHaveValue("");
    // 5. 三个 Radio 未选中
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(SEL.radio).nth(i)).not.toBeChecked();
    }
    // 6. COUNT 显示 0
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 0");
    // 7. 结果表格显示 No results.
    await expect(page.locator(SEL.noData)).toHaveText("No results.");
    // 8. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、空输入、未选中 Radio、COUNT 0 与 No results.");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(SU_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-Market列表加载", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-Market列表加载");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面并设置 market mock");

    // 2. Market 下拉显示 "EU - Europe"、"US - United States"
    const options = page.locator(`${SEL.select} option`);
    await expect(options).toHaveCount(3); // 空 + 2 市场
    await expect(options.nth(1)).toHaveText("EU - Europe");
    await expect(options.nth(2)).toHaveText("US - United States");
    await expect(options.nth(1)).toHaveAttribute("value", "EU");
    await snap("确认 Market 下拉显示 code - description");
  });

  // ============================================================
  // 搜索条件输入
  // ============================================================

  test("TC04 输入限制-Userid最大长度10", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_输入限制-Userid最大长度10");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    await page.locator(SEL.inputUserid).fill("123456789012345"); // 15 字符
    const value = await page.locator(SEL.inputUserid).inputValue();
    expect(value.length).toBe(10);
    expect(value).toBe("1234567890");
    const maxLen = await page.locator(SEL.inputUserid).getAttribute("maxlength");
    expect(maxLen).toBe("10");
    await snap("确认 Userid 输入限制为 10 个字符");
  });

  test("TC05 输入限制-User最大长度32", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_输入限制-User最大长度32");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    await page.locator(SEL.inputUser).fill("a".repeat(40));
    const value = await page.locator(SEL.inputUser).inputValue();
    expect(value.length).toBe(32);
    const maxLen = await page.locator(SEL.inputUser).getAttribute("maxlength");
    expect(maxLen).toBe("32");
    await snap("确认 User 输入限制为 32 个字符");
  });

  test("TC06 Radio互斥-选择Not set", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_Radio互斥-选择Not set");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    // 点击 Not set Radio
    await page.locator(SEL.radio).nth(0).check();
    // 1. Not set Radio 选中
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    // 2. Rule、Template 未选中
    await expect(page.locator(SEL.radio).nth(1)).not.toBeChecked();
    await expect(page.locator(SEL.radio).nth(2)).not.toBeChecked();
    // 3. 再点击 Rule 时 Only Rule 选中
    await page.locator(SEL.radio).nth(1).check();
    await expect(page.locator(SEL.radio).nth(1)).toBeChecked();
    await expect(page.locator(SEL.radio).nth(0)).not.toBeChecked();
    await snap("确认 Radio 互斥逻辑正确");
  });

  test("TC07 Radio-切换逻辑", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_Radio-切换逻辑");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    // 选择 Rule Radio（选中）
    await page.locator(SEL.radio).nth(1).check();
    await expect(page.locator(SEL.radio).nth(1)).toBeChecked();
    await snap("选择 Rule 后选中");

    // 切换到 Not set Radio（允许重新选择其它权限类型）
    await page.locator(SEL.radio).nth(0).check();
    await expect(page.locator(SEL.radio).nth(0)).toBeChecked();
    // Rule 取消选中，互斥切换正确
    await expect(page.locator(SEL.radio).nth(1)).not.toBeChecked();
    await expect(page.locator(SEL.radio).nth(2)).not.toBeChecked();
    await snap("确认 Radio 互斥切换逻辑正确");
  });

  test("TC08 输入时清除消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_输入时清除消息");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    // 触发错误消息（同时输入 Userid 和 User）
    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.inputUser).fill("John");
    await page.locator(SEL.searchBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("Please enter either Userid or User, not both.");
    await snap("触发错误消息");

    // 在 Userid 输入框输入内容清除消息
    await page.locator(SEL.inputUserid).fill("user002");
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("在 Userid 输入后错误消息被清除");

    // 再次触发错误，切换 Radio 清除消息
    await page.locator(SEL.inputUser).fill("John2");
    await page.locator(SEL.searchBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("Please enter either Userid or User, not both.");
    await page.locator(SEL.radio).nth(0).check();
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("切换 Radio 后错误消息被清除");
  });

  // ============================================================
  // 搜索校验
  // ============================================================

  test("TC09 校验-同时输入Userid和User", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_校验-同时输入Userid和User");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let searchCalled = false;
    await mockSearch(page, { body: { success: true, data: { users: [], count: 0 } } }, { body: () => { searchCalled = true; } });

    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.inputUser).fill("John");
    await page.locator(SEL.searchBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please enter either Userid or User, not both.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    expect(searchCalled).toBe(false);
    await snap("确认同时输入 Userid 和 User 触发校验错误");
  });

  test("TC10 搜索-仅输入Userid", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_搜索-仅输入Userid");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let postBody: any = null;
    await mockSearch(page, { body: { success: true, data: { users: [userRecord()], count: 1 } } }, { body: (b) => { postBody = b; } });

    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.searchBtn).click();
    // 2. 请求 body 包含 userId
    await expect.poll(() => postBody).toMatchObject({ userId: "user001" });
    // 3. 结果表格显示对应用户
    await expect(page.locator(SEL.row)).toHaveCount(1);
    await expect(page.locator(SEL.userLink)).toHaveText("user001");
    // 4. COUNT 更新为 1
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 1");
    // 5. 无错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认仅输入 Userid 搜索成功");
  });

  test("TC11 搜索-仅输入User", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_搜索-仅输入User");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let postBody: any = null;
    await mockSearch(page, { body: { success: true, data: { users: [userRecord()], count: 1 } } }, { body: (b) => { postBody = b; } });

    await page.locator(SEL.inputUser).fill("John Doe");
    await page.locator(SEL.searchBtn).click();
    // 2. 请求 body 包含 userName
    await expect.poll(() => postBody).toMatchObject({ userName: "John Doe" });
    // 3. 结果表格显示对应用户
    await expect(page.locator(SEL.row)).toHaveCount(1);
    // 4. COUNT 更新为 1
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 1");
    await snap("确认仅输入 User 搜索成功");
  });

  test("TC12 搜索-选择Not set", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_搜索-选择Not set");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let postBody: any = null;
    const users = Array.from({ length: 5 }, (_, i) => userRecord({ userId: `user${i}`, userName: `User ${i}`, market: "EU" }));
    await mockSearch(page, { body: { success: true, data: { users, count: 5 } } }, { body: (b) => { postBody = b; } });

    await page.locator(SEL.radio).nth(0).check(); // Not set
    await page.locator(SEL.searchBtn).click();
    // 1. 请求 body 包含 permissionType:"notset"
    await expect.poll(() => postBody).toMatchObject({ permissionType: "notset" });
    // 3. 表格显示所有用户，COUNT 更新为 5
    await expect(page.locator(SEL.row)).toHaveCount(5);
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 5");
    await snap("确认选择 Not set 搜索返回 5 条");
  });

  test("TC13 搜索-选择Rule", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_搜索-选择Rule");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let postBody: any = null;
    const users = Array.from({ length: 3 }, (_, i) => userRecord({ userId: `rule${i}`, userName: `Rule User ${i}`, market: "EU" }));
    await mockSearch(page, { body: { success: true, data: { users, count: 3 } } }, { body: (b) => { postBody = b; } });

    await page.locator(SEL.radio).nth(1).check(); // Rule
    await page.locator(SEL.searchBtn).click();
    // 1. 请求 body 包含 permissionType:"rule"
    await expect.poll(() => postBody).toMatchObject({ permissionType: "rule" });
    // 3. COUNT 更新为 3
    await expect(page.locator(SEL.row)).toHaveCount(3);
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 3");
    await snap("确认选择 Rule 搜索返回 3 条");
  });

  test("TC14 搜索-选择Template", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_搜索-选择Template");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let postBody: any = null;
    const users = Array.from({ length: 2 }, (_, i) => userRecord({ userId: `tpl${i}`, userName: `Tpl User ${i}`, market: "EU" }));
    await mockSearch(page, { body: { success: true, data: { users, count: 2 } } }, { body: (b) => { postBody = b; } });

    await page.locator(SEL.radio).nth(2).check(); // Template
    await page.locator(SEL.searchBtn).click();
    // 1. 请求 body 包含 permissionType:"template"
    await expect.poll(() => postBody).toMatchObject({ permissionType: "template" });
    // 3. COUNT 更新为 2
    await expect(page.locator(SEL.row)).toHaveCount(2);
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 2");
    await snap("确认选择 Template 搜索返回 2 条");
  });

  test("TC15 搜索-组合Market条件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_搜索-组合Market条件");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    let postBody: any = null;
    await mockSearch(page, { body: { success: true, data: { users: [userRecord({ market: "EU" })], count: 1 } } }, { body: (b) => { postBody = b; } });

    await page.locator(SEL.select).selectOption("EU");
    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.searchBtn).click();
    // 1. 请求 body 包含 market 和 userId
    await expect.poll(() => postBody).toMatchObject({ market: "EU", userId: "user001" });
    // 2. 显示匹配用户
    await expect(page.locator(SEL.row)).toHaveCount(1);
    // 3. COUNT 正确更新
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 1");
    await snap("确认组合 Market 与 Userid 搜索");
  });

  test("TC16 搜索-无匹配用户", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_搜索-无匹配用户");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    // 返回 success=true 但 users 为空数组
    await mockSearch(page, { body: { success: true, data: { users: [], count: 0 } } });
    await page.locator(SEL.inputUserid).fill("nobody");
    await page.locator(SEL.searchBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No users found matching the search criteria.");
    // 3. 结果列表清空（显示 No results.）
    await expect(page.locator(SEL.noData)).toHaveText("No results.");
    // 4. COUNT 为 0
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 0");
    await snap("确认无匹配用户错误消息");
  });

  test("TC17 搜索-空结果count为0", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_搜索-空结果count为0");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    // 返回空 users 数组
    await mockSearch(page, { body: { success: true, data: { users: [], count: 0 } } });
    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.searchBtn).click();
    // 1. COUNT 显示 0
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 0");
    // 2. 结果表格显示 No results.
    await expect(page.locator(SEL.noData)).toHaveText("No results.");
    // 3. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No users found matching the search criteria.");
    await snap("确认空结果 COUNT 为 0 且显示 No results.");
  });

  test("TC18 搜索-多记录显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_搜索-多记录显示");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    const users = Array.from({ length: 5 }, (_, i) => userRecord({ userId: `user${i}`, userName: `User Name ${i}`, market: i % 2 === 0 ? "EU" : "US" }));
    await mockSearch(page, { body: { success: true, data: { users, count: 5 } } });
    await page.locator(SEL.inputUserid).fill("u");
    await page.locator(SEL.searchBtn).click();
    // 1. 结果表格显示 5 行
    await expect(page.locator(SEL.row)).toHaveCount(5);
    // 2. 每行显示 Userid、User、Market
    await expect(page.locator(SEL.row).nth(0)).toContainText("user0");
    await expect(page.locator(SEL.row).nth(0)).toContainText("User Name 0");
    await expect(page.locator(SEL.row).nth(0)).toContainText("EU");
    // 3. COUNT 显示 5
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 5");
    await snap("确认多记录搜索结果表格");
  });

  test("TC19 搜索-Count显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_搜索-Count显示");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    const users = Array.from({ length: 5 }, (_, i) => userRecord({ userId: `u${i}`, userName: `U ${i}`, market: "EU" }));
    await mockSearch(page, { body: { success: true, data: { users, count: 5 } } });
    await page.locator(SEL.inputUserid).fill("u");
    await page.locator(SEL.searchBtn).click();
    // 1. COUNT 标签显示 COUNT: 5
    await expect(page.locator(SEL.count)).toHaveText("COUNT: 5");
    // 3. 与实际结果数一致
    await expect(page.locator(SEL.row)).toHaveCount(5);
    await snap("确认 COUNT 标签显示 5");
  });

  // ============================================================
  // 结果跳转与异常
  // ============================================================

  test("TC20 结果-点击Userid跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_结果-点击Userid跳转");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    await mockSearch(page, { body: { success: true, data: { users: [userRecord({ userId: "user001" })], count: 1 } } });
    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.searchBtn).click();
    await expect(page.locator(SEL.row)).toHaveCount(1);

    // 点击 Userid 链接，跳转到 /edb-user-view
    await page.locator(SEL.userLink).first().click();
    await expect(page).toHaveURL(/\/edb-user-view/);
    await snap("确认点击 Userid 跳转到 EDB User View 页面");
  });

  test("TC21 异常处理-网络异常", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_异常处理-网络异常");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.route("**/api/ud19/searchusers", (route) => route.abort());
    await page.goto(SU_URL);
    await snap("访问页面并设置网络中断 mock");

    await page.locator(SEL.inputUserid).fill("user001");
    await page.locator(SEL.searchBtn).click();
    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Failed to connect to Saviynt system.");
    // 3. 结果清空
    await expect(page.locator(SEL.noData)).toHaveText("No results.");
    // 4. 按钮恢复可用
    await expect(page.locator(SEL.searchBtn)).toBeEnabled();
    await snap("确认搜索网络错误消息");
  });

  test("TC22 按钮禁用-isLoading期间", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_按钮禁用-isLoading期间");
    await mockMarkets(page, DEFAULT_MARKETS);
    // 挂起 search API 1.2 秒
    await page.route("**/api/ud19/searchusers", async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { users: [], count: 0 } }) });
    });
    await page.goto(SU_URL);
    await snap("访问页面并设置延迟 mock");

    await page.locator(SEL.inputUserid).fill("user001");
    const clickPromise = page.locator(SEL.searchBtn).click();
    await page.waitForTimeout(200);
    // 1. Search 按钮禁用
    await expect(page.locator(SEL.searchBtn)).toBeDisabled();
    // 2. Userid/User 输入框禁用
    await expect(page.locator(SEL.inputUserid)).toBeDisabled();
    await expect(page.locator(SEL.inputUser)).toBeDisabled();
    // 3. Market 下拉禁用
    await expect(page.locator(SEL.select)).toBeDisabled();
    // 4. 三个 Radio 禁用
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(SEL.radio).nth(i)).toBeDisabled();
    }
    await snap("确认 isLoading 期间所有控件禁用");

    await clickPromise;
    await expect(page.locator(SEL.searchBtn)).toBeEnabled();
    await snap("API 响应后控件恢复可用");
  });

  test("TC23 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_LOGOUT-登出");
    await mockMarkets(page, DEFAULT_MARKETS);
    await page.goto(SU_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});

