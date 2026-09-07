/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const UG_URL = BASE_URL + "/user-guide";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD24";

// 页面元素选择器（与 UserGuide.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".ug-title",
  link: ".ug-link",
  linkRow: ".ug-link-row",
  checkbox: ".ug-checkbox",
  checkboxLabel: ".ug-checkbox-label",
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

test.describe("UD24 User Guide 模块测试", () => {
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
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("User Guide");
    // 2. 显示 5 个链接
    await expect(page.locator(SEL.link)).toHaveCount(5);
    await expect(page.locator(SEL.link).nth(0)).toHaveText("HDoc Quick Guide");
    await expect(page.locator(SEL.link).nth(1)).toHaveText("List of document types.");
    await expect(page.locator(SEL.link).nth(2)).toHaveText("Markets in HDoc");
    await expect(page.locator(SEL.link).nth(3)).toHaveText("HDoc - Market Document Setting");
    await expect(page.locator(SEL.link).nth(4)).toHaveText("Describation");
    // 4. Other Information 复选框显示
    await expect(page.locator(SEL.checkboxLabel)).toHaveText("Other Information");
    // 5. 复选框初始未选中
    await expect(page.locator(SEL.checkbox)).not.toBeChecked();
    await snap("确认标题、5 个链接与未选中复选框");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(UG_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  // ============================================================
  // 链接导航
  // ============================================================

  test("TC03 链接-HDoc Quick Guide", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_链接-HDoc Quick Guide");
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    await page.locator(SEL.link).nth(0).click();
    // 跳到 /download-and-print-quick-guides
    await expect(page).toHaveURL(/\/download-and-print-quick-guides/);
    await expect(page.locator(".dqg-title")).toHaveText("Download and Print Quick Guides");
    await snap("确认点击 HDoc Quick Guide 跳转到 Download and Print 页面");
  });

  test("TC04 链接-List of document types", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_链接-List of document types");
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    await page.locator(SEL.link).nth(1).click();
    // 跳转到 /document-types
    await expect(page).toHaveURL(/\/document-types/);
    await expect(page.locator(".dt-title")).toHaveText("Document Types");
    await snap("确认点击 List of document types 跳转到 Document Types 页面");
  });

  test("TC05 链接-Markets in HDoc", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_链接-Markets in HDoc");
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    await page.locator(SEL.link).nth(2).click();
    // 跳转到 /markets-in-hdoc
    await expect(page).toHaveURL(/\/markets-in-hdoc/);
    await expect(page.locator(".mih-title")).toHaveText("Markets in HDoc");
    await snap("确认点击 Markets in HDoc 跳转到 Markets in HDoc 页面");
  });

  test("TC06 链接-Market Document Setting", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_链接-Market Document Setting");
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    await page.locator(SEL.link).nth(3).click();
    // 跳转到 /market-document-settings-list
    await expect(page).toHaveURL(/\/market-document-settings-list/);
    await expect(page.locator(".mdsl-title")).toHaveText("Market Document Settings List");
    await snap("确认点击 HDoc - Market Document Setting 跳转");
  });

  test("TC07 链接-Describation", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_链接-Describation");
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    await page.locator(SEL.link).nth(4).click();
    // 跳转到 /search-user
    await expect(page).toHaveURL(/\/search-user/);
    await expect(page.locator(".su-title")).toHaveText("Search User");
    await snap("确认点击 Describation 跳转到 Search User 页面");
  });

  test("TC08 链接-样式与视觉反馈", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_链接-样式与视觉反馈");
    await page.goto(UG_URL);
    await snap("访问页面");

    // 所有链接可见且可点击（span cursor pointer 由 CSS 控制）
    await expect(page.locator(SEL.link)).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(SEL.link).nth(i)).toBeVisible();
    }
    // 悬停有视觉反馈（hover 不报错且仍可见）
    await page.locator(SEL.link).nth(0).hover();
    await expect(page.locator(SEL.link).nth(0)).toBeVisible();
    await snap("确认各链接可见且 hover 正常");
  });

  // ============================================================
  // Other Information 复选框
  // ============================================================

  test("TC09 复选框-初始状态", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_复选框-初始状态");
    await page.goto(UG_URL);
    await snap("访问 User Guide 页面");

    // 1. Other Information 复选框默认未选中
    await expect(page.locator(SEL.checkbox)).not.toBeChecked();
    // 2. 显示标签文本
    await expect(page.locator(SEL.checkboxLabel)).toHaveText("Other Information");
    await snap("确认 Other Information 复选框初始未选中");
  });

  test("TC10 复选框-切换选中状态", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_复选框-切换选中状态");
    await page.goto(UG_URL);
    await snap("访问页面");

    // 点击复选框选中
    await page.locator(SEL.checkbox).check();
    await expect(page.locator(SEL.checkbox)).toBeChecked();
    await snap("点击后复选框选中");

    // 再次点击取消选中
    await page.locator(SEL.checkbox).uncheck();
    await expect(page.locator(SEL.checkbox)).not.toBeChecked();
    await snap("再次点击后复选框取消选中");
  });

  // ============================================================
  // LOGOUT
  // ============================================================

  test("TC11 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_LOGOUT-登出");
    await page.goto(UG_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
