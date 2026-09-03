/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const DQG_URL = BASE_URL + "/download-and-print-quick-guides";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD23";

// 页面元素选择器（与 DownloadAndPrintQuickGuides.tsx 渲染元素一一对应）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".dqg-title",
  error: ".dqg-error",
  link: ".dqg-link",
  downloadSection: ".dqg-download-section",
  checkbox: ".dqg-checkbox",
  guideTitle: ".dqg-guide-title",
  guideList: ".dqg-guide-list",
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

test.describe("UD23 Download and Print Quick Guides 模块测试", () => {
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
    await page.goto(DQG_URL);
    await snap("访问 Download and Print Quick Guides 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("Download and Print Quick Guides");
    // 2. 显示 Volvo 3P Quick Guides 下载链接
    await expect(page.locator(SEL.link)).toHaveText("Volvo 3P Quick Guides");
    // 3. 显示 To print do the following 复选框及说明
    await expect(page.locator(SEL.guideTitle).nth(0)).toHaveText("To print do the following");
    // 4. 显示 To fold do the following 复选框及说明
    await expect(page.locator(SEL.guideTitle).nth(1)).toHaveText("To fold do the following");
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、下载链接、两个说明复选框与无错误消息");
  });

  test("TC02 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(DQG_URL);
    await snap("清除 userID 并访问页面");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认跳转到 /login 且不显示页面内容");
  });

  test("TC03 画面初始化-复选框只读属性", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-复选框只读属性");
    await page.goto(DQG_URL);
    await snap("访问页面");

    // 1. To print 复选框为只读（readOnly + disabled）
    await expect(page.locator(SEL.checkbox).nth(0)).toBeDisabled();
    const ro1 = await page.locator(SEL.checkbox).nth(0).getAttribute("readonly");
    expect(ro1).not.toBeNull();
    // 2. To fold 复选框为只读
    await expect(page.locator(SEL.checkbox).nth(1)).toBeDisabled();
    const ro2 = await page.locator(SEL.checkbox).nth(1).getAttribute("readonly");
    expect(ro2).not.toBeNull();
    // 4. tabIndex=-1 不可聚焦
    const ti1 = await page.locator(SEL.checkbox).nth(0).getAttribute("tabindex");
    expect(ti1).toBe("-1");
    // 复选框无法编辑（disabled）
    await expect(page.locator(SEL.checkbox).nth(0)).not.toBeChecked();
    await snap("确认 To print / To fold 复选框为只读且不可编辑");
  });

  // ============================================================
  // 下载功能
  // ============================================================

  test("TC04 下载-点击Volvo 3P链接", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_下载-点击Volvo 3P链接");
    // 捕获 window.open 调用
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [];
      window.open = (url: string) => {
        (window as any).__openedDownloads.push(url);
        return null;
      };
    });
    await page.goto(DQG_URL);
    await page.reload();
    await snap("访问页面并加载 window.open 拦截");

    // 点击 Volvo 3P Quick Guides 链接
    await page.locator(SEL.link).click();
    // 2. 调用 window.open 打开下载 URL
    await page.waitForTimeout(200);
    const opened = await page.evaluate(() => (window as any).__openedDownloads);
    expect(opened).toContain("/api/ud23/downloadquickguide");
    await snap("确认点击链接触发 window.open 下载 URL");
  });

  test("TC05 下载-文件不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_下载-文件不存在");
    // 捕获 window.open；下载返回 404（当前实现不捕获错误）
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [];
      window.open = (url: string) => {
        (window as any).__openedDownloads.push(url);
        return null;
      };
    });
    await page.route("**/api/ud23/downloadquickguide", (route) => {
      route.fulfill({ status: 404, contentType: "text/plain", body: "File not found." });
    });
    await page.goto(DQG_URL);
    await page.reload();
    await snap("访问页面并设置 404 mock");

    await page.locator(SEL.link).click();
    // 4. 下载行为触发（window.open URL 仍被调用）
    await page.waitForTimeout(200);
    const opened = await page.evaluate(() => (window as any).__openedDownloads);
    expect(opened).toContain("/api/ud23/downloadquickguide");
    // 3. 页面不显示错误消息（当前实现通过 window.open 不捕获错误）
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认 404 时下载 URL 触发但页面无错误");
  });

  test("TC06 下载-链接样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_下载-链接样式");
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [];
      window.open = (url: string) => {
        (window as any).__openedDownloads.push(url);
        return null;
      };
    });
    await page.goto(DQG_URL);
    await page.reload();
    await snap("访问页面");

    // 下载链接可见且可点击
    const linkEl = page.locator(SEL.link);
    await expect(linkEl).toBeVisible();
    // 3. 点击时触发下载
    await linkEl.click();
    await page.waitForTimeout(200);
    const opened = await page.evaluate(() => (window as any).__openedDownloads);
    expect(opened).toContain("/api/ud23/downloadquickguide");
    await snap("确认下载链接可见且点击触发下载");
  });

  // ============================================================
  // 说明文本显示
  // ============================================================

  test("TC07 打印方法-说明文本", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_打印方法-说明文本");
    await page.goto(DQG_URL);
    await snap("访问页面");

    // 打印方法说明（第 0 个 guide-list）
    const list = page.locator(SEL.guideList).nth(0).locator("li");
    // 1. 显示 5 条打印步骤
    await expect(list).toHaveCount(5);
    // 4. 步骤顺序正确
    await expect(list.nth(0)).toHaveText("Open the downloaded Quick Guide file.");
    await expect(list.nth(1)).toHaveText('Select "File" menu and choose "Print".');
    await expect(list.nth(2)).toHaveText('Set the printer to "Actual size" (100%).');
    await expect(list.nth(3)).toHaveText("Select the color option suitable for your printer.");
    await expect(list.nth(4)).toHaveText('Click "Print" to print the document.');
    await snap("确认打印方法 5 条步骤正确");
  });

  test("TC08 折叠方法-说明文本", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_折叠方法-说明文本");
    await page.goto(DQG_URL);
    await snap("访问页面");

    // 折叠方法说明（第 1 个 guide-list）
    const list = page.locator(SEL.guideList).nth(1).locator("li");
    // 1. 显示 5 条折叠步骤
    await expect(list).toHaveCount(5);
    // 4. 步骤顺序正确
    await expect(list.nth(0)).toHaveText("Fold the printed page in half along the center line.");
    await expect(list.nth(1)).toHaveText("Align the edges neatly.");
    await expect(list.nth(2)).toHaveText("Fold the top edge down to the marked line.");
    await expect(list.nth(3)).toHaveText("Fold the bottom edge up to the marked line.");
    await expect(list.nth(4)).toHaveText("The guide should now fold into a compact booklet.");
    await snap("确认折叠方法 5 条步骤正确");
  });

  // ============================================================
  // LOGOUT
  // ============================================================

  test("TC09 LOGOUT-登出", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_LOGOUT-登出");
    await page.goto(DQG_URL);
    await snap("访问页面");

    await page.locator(SEL.logoutButton).click();
    const uid = await page.evaluate(() => localStorage.getItem("userID"));
    expect(uid).toBeNull();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认 Logout 后移除 userID 并跳转到 /login");
  });
});
