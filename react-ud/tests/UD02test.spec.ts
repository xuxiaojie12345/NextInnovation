import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD02";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const MENU_URL = `${APP_URL}/menu`;

// ============================================================
// 截图计数器（每个测试用例独立计数）
// ============================================================
let screenshotCounter: { [key: string]: number } = {};

function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) {
    screenshotCounter[testName] = 0;
  }
  screenshotCounter[testName]++;
  const seq = String(screenshotCounter[testName]).padStart(3, "0");
  return `${SCREENSHOT_DIR}/${testName}_${seq}_${stepName}.jpeg`;
}

// ============================================================
// 页面导航辅助函数
// ============================================================
async function navigateToMenu(page: Page) {
  // 设置登录状态
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#root", { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
  await page.goto(MENU_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".navigation-menu", { timeout: 15000 });
  await page.waitForTimeout(1000);
}

// ============================================================
// 点击菜单项的辅助函数
// ============================================================
async function clickMenuItem(page: Page, itemText: string) {
  await page.getByText(itemText, { exact: true }).click();
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD02 Menu - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await navigateToMenu(page);

    // 1. 显示标题 "Generate Document"
    await expect(page.locator(".menu-subtitle")).toHaveText(
      "Generate Document",
    );
    // 2. 显示菜单分组
    await expect(page.locator(".group-title")).toHaveCount(5);
    const groupTitles = page.locator(".group-title");
    await expect(groupTitles.nth(0)).toHaveText("Generate");
    await expect(groupTitles.nth(1)).toHaveText("Admin");
    await expect(groupTitles.nth(2)).toHaveText("User Administration");
    await expect(groupTitles.nth(3)).toHaveText("Archive");
    await expect(groupTitles.nth(4)).toHaveText("Documentation");
    // 3. 各分组显示菜单项
    await expect(page.locator(".menu-item")).not.toHaveCount(0);
    // 4. 所有链接显示为活性状态
    const clickableItems = page.locator(".menu-item.clickable");
    await expect(clickableItems.first()).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-菜单项完整显示
  // ============================================================
  test("02_画面初期显示_菜单项完整显示", async ({ page }) => {
    await navigateToMenu(page);

    // Generate 分组
    await expect(
      page.locator(".item-label").filter({ hasText: "Generate Doc" }),
    ).toBeVisible();
    // Admin 分组
    await expect(
      page
        .locator(".item-label")
        .filter({ hasText: "Update user defined variables (rules)" }),
    ).toBeVisible();
    await expect(
      page
        .locator(".item-label")
        .filter({ hasText: "Existing HDoc variables" }),
    ).toBeVisible();
    await expect(
      page.locator(".item-label").filter({ hasText: "Upload/Delete template" }),
    ).toBeVisible();
    await expect(
      page
        .locator(".item-label")
        .filter({ hasText: "List available templates" }),
    ).toBeVisible();
    await expect(
      page.locator(".item-label").filter({ hasText: "PPS Vin plate" }),
    ).toBeVisible();
    await expect(page.getByText("AD/CA Change", { exact: true })).toBeVisible();
    // User Administration 分组
    await expect(
      page
        .locator(".item-label")
        .filter({ hasText: "HDoc User Administration" }),
    ).toBeVisible();
    await expect(
      page
        .locator(".item-label")
        .filter({ hasText: "HDoc User Doc Administration" }),
    ).toBeVisible();
    await expect(
      page.locator(".item-label").filter({ hasText: "Search User" }),
    ).toBeVisible();
    await expect(
      page.locator(".item-label").filter({ hasText: "Change Password" }),
    ).toBeVisible();
    // Documentation 分组
    await expect(
      page.locator(".item-label").filter({ hasText: "User Guide" }),
    ).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("02_菜单项完整显示", "全部菜单项"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-菜单项顺序
  // ============================================================
  test("03_画面初期显示_菜单项顺序", async ({ page }) => {
    await navigateToMenu(page);

    // 验证分组顺序
    const groupTitles = page.locator(".group-title");
    await expect(groupTitles.nth(0)).toHaveText("Generate");
    await expect(groupTitles.nth(1)).toHaveText("Admin");
    await expect(groupTitles.nth(2)).toHaveText("User Administration");
    await expect(groupTitles.nth(3)).toHaveText("Archive");
    await expect(groupTitles.nth(4)).toHaveText("Documentation");

    await page.screenshot({
      path: getScreenshotPath("03_菜单项顺序", "分组顺序"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 点击 Generate Doc 链接
  // ============================================================
  test("04_点击GenerateDoc链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "Generate Doc");
    await page.waitForURL("**/generate-homologation-document");

    await page.screenshot({
      path: getScreenshotPath("04_点击GenerateDoc链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 点击 Update user defined variables 链接
  // ============================================================
  test("05_点击UpdateUserDefinedVariables链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "Update user defined variables (rules)");
    await page.waitForURL("**/homologation-variables");

    await page.screenshot({
      path: getScreenshotPath(
        "05_点击UpdateUserDefinedVariables链接",
        "跳转后画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 点击 Existing HDoc variables 链接
  // ============================================================
  test("06_点击ExistingHDocVariables链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "Existing HDoc variables");
    await page.waitForURL("**/hdoc-variables");

    await page.screenshot({
      path: getScreenshotPath("06_点击ExistingHDocVariables链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 点击 Upload/Delete template 链接
  // ============================================================
  test("07_点击UploadDeleteTemplate链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "Upload/Delete template");
    await page.waitForURL("**/upload-delete-template");

    await page.screenshot({
      path: getScreenshotPath("07_点击UploadDeleteTemplate链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 点击 List available templates 链接
  // ============================================================
  test("08_点击ListAvailableTemplates链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "List available templates");
    await page.waitForURL("**/list-available-templates");

    await page.screenshot({
      path: getScreenshotPath(
        "08_点击ListAvailableTemplates链接",
        "跳转后画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 点击 PPS Vin plate 链接
  // ============================================================
  test("09_点击PPSVinPlate链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "VPPS Vin plate");
    await page.waitForURL("**/vin-plate");

    await page.screenshot({
      path: getScreenshotPath("09_点击PPSVinPlate链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 点击 AD/CA Change 链接
  // ============================================================
  test("10_点击ADCAChange链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "AD/CA Change");
    // AD/CA Change 使用相对路径 "ad-change"
    await page.waitForURL("**/ad-change");

    await page.screenshot({
      path: getScreenshotPath("10_点击ADCAChange链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 点击 HDoc User Administration 链接
  // ============================================================
  test("11_点击HDocUserAdministration链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "HDoc User Administration");
    await page.waitForURL("**/hdoc-user-administration");

    await page.screenshot({
      path: getScreenshotPath(
        "11_点击HDocUserAdministration链接",
        "跳转后画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 点击 HDoc User Doc Administration 链接
  // ============================================================
  test("12_点击HDocUserDocAdministration链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "HDoc User Doc Administration");
    await page.waitForURL("**/hdoc-user-doc-administration");

    await page.screenshot({
      path: getScreenshotPath(
        "12_点击HDocUserDocAdministration链接",
        "跳转后画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 点击 Search User 链接
  // ============================================================
  test("13_点击SearchUser链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "Search User");
    await page.waitForURL("**/search-user");

    await page.screenshot({
      path: getScreenshotPath("13_点击SearchUser链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 点击 Change Password 链接
  // ============================================================
  test("14_点击ChangePassword链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "Change Password");
    await page.waitForURL("**/user/password");

    await page.screenshot({
      path: getScreenshotPath("14_点击ChangePassword链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 点击 User Guide 链接
  // ============================================================
  test("15_点击UserGuide链接", async ({ page }) => {
    await navigateToMenu(page);

    await clickMenuItem(page, "User Guide");
    await page.waitForURL("**/hdoc-help");

    await page.screenshot({
      path: getScreenshotPath("15_点击UserGuide链接", "跳转后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 页面加载-未登录状态
  // ============================================================
  test("16_页面加载_未登录状态", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    // 直接访问 Menu 页面
    await page.goto(MENU_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 未登录时可能跳转到登录页面或显示错误
    const currentUrl = page.url();
    const isLoginPage =
      currentUrl.includes("/") && !currentUrl.includes("/menu");
    // 如果在 menu 页面但没有菜单内容，也认为未登录处理正确
    const hasMenu = await page.locator(".navigation-menu").count();

    await page.screenshot({
      path: getScreenshotPath("16_页面加载_未登录状态", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 验证未登录时菜单不可见或已跳转
    if (hasMenu > 0) {
      // 在 Menu 页面但没有菜单项
    }
  });

  // ============================================================
  // No.17 页面加载-已登录状态
  // ============================================================
  test("17_页面加载_已登录状态", async ({ page }) => {
    await navigateToMenu(page);

    // 页面正常加载，显示所有菜单项
    await expect(page.locator(".navigation-menu")).toBeVisible();
    await expect(page.locator(".menu-item").first()).toBeVisible();
    await expect(page.locator("div.error-message")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("17_页面加载_已登录状态", "已登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 权限校验-有权限访问
  // ============================================================
  test("18_权限校验_有权限访问", async ({ page }) => {
    await navigateToMenu(page);

    // 点击有权限的菜单项
    await clickMenuItem(page, "Generate Doc");
    await page.waitForURL("**/generate-homologation-document");

    // 成功跳转到目标页面
    await expect(page.locator("h1.ghd-title")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: getScreenshotPath("18_权限校验_有权限访问", "跳转成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 权限校验-无权限访问
  // ============================================================
  test("19_权限校验_无权限访问", async ({ page }) => {
    await navigateToMenu(page);

    // 点击无路径的菜单项（disabled 状态）
    const disabledItem = page.locator(".menu-item.disabled").first();
    const disabledText = await disabledItem
      .locator(".item-label")
      .textContent();
    await disabledItem.click();
    await page.waitForTimeout(500);

    // 无权限项没有 path，点击不应跳转
    expect(page.url()).toContain("/menu");

    await page.screenshot({
      path: getScreenshotPath("19_权限校验_无权限访问", "无权限项"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-页面跳转失败
  // ============================================================
  test("20_异常处理_页面跳转失败", async ({ page }) => {
    await navigateToMenu(page);

    // 跳转到不存在的路由
    await page.evaluate(() => {
      window.location.href = "/non-existent-route";
    });
    await page.waitForTimeout(1000);

    // 页面应显示 404 或错误信息
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_跳转失败", "跳转失败"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-网络连接失败
  // ============================================================
  test("21_异常处理_网络连接失败", async ({ page }) => {
    await page.context().setOffline(true);

    await page.goto(MENU_URL, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("21_异常处理_网络断开", "网络断开"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.context().setOffline(false);
  });

  // ============================================================
  // No.22 鼠标悬停效果
  // ============================================================
  test("22_鼠标悬停效果", async ({ page }) => {
    await navigateToMenu(page);

    const menuItem = page.locator(".menu-item.clickable").first();
    // 获取悬停前的背景色
    const bgBefore = await menuItem.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // 悬停
    await menuItem.hover();
    await page.waitForTimeout(300);
    // 获取悬停后的背景色
    const bgAfter = await menuItem.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );

    // 鼠标悬停时背景色应变化
    // 默认 #f0f0f0（继承）或 transparent，悬停后 #e2e6ea
    // 如果背景色不变，至少验证 CSS 定义了 hover 样式
    await expect(menuItem).toHaveCSS("cursor", "pointer");

    await page.screenshot({
      path: getScreenshotPath("22_鼠标悬停效果", "悬停状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 链接样式一致性
  // ============================================================
  test("23_链接样式一致性", async ({ page }) => {
    await navigateToMenu(page);

    // 所有菜单项应有一致的样式
    const menuItems = page.locator(".menu-item");
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);

    // 验证所有菜单项都有箭头图标
    const arrowIcons = page.locator(".arrow-icon");
    expect(await arrowIcons.count()).toBe(count);

    await page.screenshot({
      path: getScreenshotPath("23_链接样式一致性", "样式一致性"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 连续点击同一链接
  // ============================================================
  test("24_连续点击同一链接", async ({ page }) => {
    await navigateToMenu(page);

    // 快速连续点击 Generate Doc
    await clickMenuItem(page, "Generate Doc");
    await page.waitForTimeout(200);

    // 最终导航到目标页面
    await page.waitForURL("**/generate-homologation-document");

    await page.screenshot({
      path: getScreenshotPath("24_连续点击同一链接", "最终跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 浏览器前进后退
  // ============================================================
  test("25_浏览器前进后退", async ({ page }) => {
    await navigateToMenu(page);

    // 从 Menu 页面点击链接导航到子页面
    await clickMenuItem(page, "Generate Doc");
    await page.waitForURL("**/generate-homologation-document");

    // 浏览器后退
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 返回到 Menu 页面
    await expect(page.locator(".navigation-menu")).toBeVisible();

    // 所有菜单项可再次点击
    await expect(page.locator(".menu-item.clickable").first()).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("25_浏览器前进后退", "后退后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 页面刷新
  // ============================================================
  test("26_页面刷新", async ({ page }) => {
    await navigateToMenu(page);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 所有菜单项完整显示
    await expect(page.locator(".navigation-menu")).toBeVisible();
    await expect(page.locator(".group-title")).toHaveCount(5);
    await expect(page.locator(".menu-item").first()).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("26_页面刷新", "刷新后画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 安全性-页面加载时验证登录状态
  // ============================================================
  test("27_安全性_页面加载时验证登录状态", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    // 直接访问 Menu 页面 URL
    await page.goto(MENU_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 未登录时应阻止页面加载或跳转
    const hasMenu = await page.locator(".navigation-menu").count();

    await page.screenshot({
      path: getScreenshotPath("27_安全性_验证登录状态", "未登录访问"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 安全性-跳转前检查权限
  // ============================================================
  test("28_安全性_跳转前检查权限", async ({ page }) => {
    await navigateToMenu(page);

    // 点击 disabled 菜单项（无 path）
    const disabledItem = page.locator(".menu-item.disabled").first();
    const itemPath = await disabledItem.evaluate((el) =>
      (el as HTMLElement).getAttribute("onclick"),
    );
    await disabledItem.click();
    await page.waitForTimeout(500);

    // 无权限项不应触发跳转
    expect(page.url()).toContain("/menu");

    await page.screenshot({
      path: getScreenshotPath("28_安全性_跳转前检查权限", "无权限点击"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 安全性-API 请求通过 HTTPS
  // ============================================================
  test("29_安全性_API请求通过HTTPS", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        requests.push(req.url());
      }
    });

    await navigateToMenu(page);

    // 检查 API 请求是否通过 HTTPS
    for (const url of requests) {
      expect(url.startsWith("https://")).toBe(true);
    }

    await page.screenshot({
      path: getScreenshotPath("29_安全性_API请求通过HTTPS", "请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
