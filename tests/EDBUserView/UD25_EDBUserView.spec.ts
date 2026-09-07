/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EUV_URL = BASE_URL + "/edb-user-view";
const SU_URL = BASE_URL + "/search-user";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD25";

// 页面元素选择器（与 EDBUserView.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".euv-title",
  error: ".euv-error",
  loading: ".euv-loading",
  form: ".euv-form",
  field: ".euv-field",
  label: ".euv-label",
  input: ".euv-input",
  clearBtn: ".euv-buttons button.euv-btn >> nth=0",
  backBtn: ".euv-buttons button.euv-btn >> nth=1",
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

/** 拦截 GET /api/ud25/getuserfromsaviynt */
async function mockUserInfo(page: Page, payload: any, opts: { delay?: number } = {}) {
  await page.route(/\/api\/ud25\/getuserfromsaviynt/, async (route) => {
    if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay));
    if (payload.abort) {
      route.abort();
    } else {
      route.fulfill({ status: payload.status || 200, contentType: "application/json", body: JSON.stringify(payload.body) });
    }
  });
}

/**
 * 通过真实用户流程进入 EDB User View 并携带 userId state：
 * 先访问 SearchUser，mock 搜索返回 userId，点击 user 链接带 state navigate。
 */
async function gotoEDBWithState(page: Page, uid: string) {
  // SearchUser 加载市场（静默失败无碍，这里 mock 保持干净）
  await page.route("**/api/ud19/getmarketlist", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) });
  });
  // SearchUser 搜索返回该 userId 的单条记录
  await page.route("**/api/ud19/searchusers", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { users: [{ userId: uid, userName: "Target User", market: "EU" }], count: 1 } }),
    });
  });
  await page.goto(SU_URL);
  await page.locator(".su-input").nth(0).fill(uid);
  await page.locator(".su-btn").click();
  await page.locator(".su-row").waitFor();
  // 点击 user 行 → navigate 到 EDB User View 带 state {userId: uid}
  await page.locator(".su-user-link").first().click();
  await expect(page).toHaveURL(/\/edb-user-view/);
}

/** 默认 Saviynt 用户信息 */
function userPayload(overrides: any = {}) {
  return {
    success: true,
    data: {
      userId: "user001",
      responsible: "John Doe",
      userPosition: "Manager",
      email: "john.doe@example.com",
      ...overrides,
    },
  };
}

test.describe("UD25 EDB User View 模块测试", () => {
  // 每个用例需经过 SearchUser 中转导航携带 state，放宽超时避免冷启动 flaky
  test.describe.configure({ timeout: 60000 });

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
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await snap("通过 Search User 携带 userId 进入 EDB User View 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("EDB User View");
    // 2. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 3. Userid / Responsible / User Position / E-mail 四个字段只读
    await expect(page.locator(SEL.input)).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(SEL.input).nth(i)).toBeDisabled();
    }
    // 4. Clear 和 Back 按钮显示
    await expect(page.locator(SEL.clearBtn)).toHaveText("Clear");
    await expect(page.locator(SEL.backBtn)).toHaveText("Back");
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、四个只读字段与 Clear/Back 按钮");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(EUV_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 Userid参数-为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_Userid参数-为空");
    // 直接访问（无 state userId）
    await page.goto(EUV_URL);
    await snap("不带 userId 直接访问 EDB User View 页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("No user ID provided.");
    // 3. 不调用 API（无 getuserfromsaviynt 请求）
    // 4. 不加载用户数据
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 表单显示但字段为空（Loading=false 无数据）
    await expect(page.locator(SEL.form)).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(SEL.input).nth(i)).toHaveValue("");
    }
    await snap("确认无 userId 时显示错误且字段为空");
  });

  test("TC04 用户信息加载成功", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_用户信息加载成功");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("通过实际流程导航并等待加载完成");

    // 1. Userid 字段显示 user001
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("user001");
    // 2. Responsible 字段显示 John Doe
    await expect(page.locator(SEL.input).nth(1)).toHaveValue("John Doe");
    // 3. User Position 字段显示 Manager
    await expect(page.locator(SEL.input).nth(2)).toHaveValue("Manager");
    // 4. E-mail 字段显示
    await expect(page.locator(SEL.input).nth(3)).toHaveValue("john.doe@example.com");
    // 无错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认四个字段正确显示用户信息");
  });

  test("TC05 用户信息加载-用户不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_用户信息加载-用户不存在");
    // Saviynt 返回 success=false
    await mockUserInfo(page, { body: { success: false, message: "User not found in Saviynt system." } });
    await gotoEDBWithState(page, "user001");
    await snap("设置用户不存在 mock 并导航");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("User not found in Saviynt system.");
    // 4. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 字段保持为空
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("");
    await expect(page.locator(SEL.input).nth(3)).toHaveValue("");
    await snap("确认用户不存在错误消息且字段为空");
  });

  test("TC06 用户信息-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_用户信息-网络错误");
    // getuserfromsaviynt 网络中断
    await mockUserInfo(page, { abort: true });
    await gotoEDBWithState(page, "user001");
    await snap("设置网络中断 mock 并导航");

    // 1-2. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Failed to connect to Saviynt system.");
    // 4. Loading 结束
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    // 数据不加载
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("");
    await snap("确认用户信息网络错误消息");
  });

  // ============================================================
  // 表格字段显示
  // ============================================================

  test("TC07 字段-只读属性", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_字段-只读属性");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("导航并加载用户信息");

    // 4 个 input 都有 readOnly + disabled 属性
    for (let i = 0; i < 4; i++) {
      const input = page.locator(SEL.input).nth(i);
      await expect(input).toBeDisabled();
      const ro = await input.getAttribute("readonly");
      expect(ro).not.toBeNull();
    }
    // 字段只读展示（保留加载的数据）
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("user001");
    await expect(page.locator(SEL.input).nth(1)).toHaveValue("John Doe");
    await expect(page.locator(SEL.input).nth(2)).toHaveValue("Manager");
    await expect(page.locator(SEL.input).nth(3)).toHaveValue("john.doe@example.com");
    await snap("确认四个字段为只读且展示加载数据");
  });

  test("TC08 字段-空值降级", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_字段-空值降级");
    await mockUserInfo(page, { body: userPayload({ responsible: "", userPosition: "", email: "" }) });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("导航并加载空字段数据");

    // 空字段显示为空字符串
    await expect(page.locator(SEL.input).nth(1)).toHaveValue("");
    await expect(page.locator(SEL.input).nth(2)).toHaveValue("");
    await expect(page.locator(SEL.input).nth(3)).toHaveValue("");
    // Userid 仍有值
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("user001");
    // 不报错
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认空字段显示为空且页面正常");
  });

  test("TC09 字段-左对齐显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_字段-左对齐显示");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("导航并加载用户信息");

    // 4 个字段行都存在且标签正确
    await expect(page.locator(SEL.field)).toHaveCount(4);
    await expect(page.locator(SEL.label).nth(0)).toHaveText("Userid");
    await expect(page.locator(SEL.label).nth(1)).toHaveText("Responsible");
    await expect(page.locator(SEL.label).nth(2)).toHaveText("User Position");
    await expect(page.locator(SEL.label).nth(3)).toHaveText("E-mail");
    await expect(page.locator(SEL.form)).toBeVisible();
    await snap("确认字段与标签正确布局显示");
  });

  // ============================================================
  // Clear / Back 操作
  // ============================================================

  test("TC10 Clear-清空所有字段", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Clear-清空所有字段");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("user001");
    await snap("加载用户数据后点击 Clear 前");

    // 点击 Clear
    await page.locator(SEL.clearBtn).click();
    // 1-4. 所有字段清空
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(SEL.input).nth(i)).toHaveValue("");
    }
    // 5. 错误消息也被清除（原无错误则保持无不显示）
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认 Clear 清空所有字段");
  });

  test("TC11 Clear-当有错误消息时", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Clear-当有错误消息时");
    // 制造错误（success=false）
    await mockUserInfo(page, { body: { success: false, message: "User not found in Saviynt system." } });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.error)).toHaveText("User not found in Saviynt system.");
    await snap("页面显示错误消息后点击 Clear 前");

    // 点击 Clear
    await page.locator(SEL.clearBtn).click();
    // 1. 错误消息被清除
    await expect(page.locator(SEL.error)).toHaveCount(0);
    // 2. 所有字段显示为空
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(SEL.input).nth(i)).toHaveValue("");
    }
    await snap("确认 Clear 清除错误消息并清空字段");
  });

  test("TC12 Back-返回前画面", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Back-返回前画面");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("进入 EDB User View 页面（前页为 Search User）");

    // 点击 Back，navigate(-1) 返回前一页（Search User）
    await page.locator(SEL.backBtn).click();
    await expect(page).toHaveURL(/\/search-user/);
    await expect(page.locator(".su-title")).toHaveText("Search User");
    await snap("确认 Back 返回前画面 Search User");
  });

  test("TC13 按钮禁用-isLoading期间", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_按钮禁用-isLoading期间");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");

    // 数据加载完成后（非 isLoading）表单渲染，Clear/Back 按钮可用
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await expect(page.locator(SEL.form)).toBeVisible();
    await expect(page.locator(SEL.clearBtn)).toBeEnabled();
    await expect(page.locator(SEL.backBtn)).toBeEnabled();
    await expect(page.locator(SEL.input).nth(0)).toHaveValue("user001");
    await snap("确认加载完成后表单与 Clear/Back 按钮可用");
  });

  test("TC14 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_LOGOUT-登出");
    await mockUserInfo(page, { body: userPayload() });
    await gotoEDBWithState(page, "user001");
    await expect(page.locator(SEL.loading)).toHaveCount(0);
    await snap("访问 EDB User View 页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
