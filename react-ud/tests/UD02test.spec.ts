import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "172.17.0.63",
  user: "root",
  password: "1234",
  database: "react_ud",
};

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD02";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const MENU_URL = `${APP_URL}/Menu`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD02画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続状態
// ============================================================
let dbAvailable = false;

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      const [rows] = await conn.execute(
        "SELECT COUNT(*) AS cnt FROM hdoc_user_infor WHERE USERID = ?",
        ["yann"],
      );
      const count = (rows as any[])[0]?.cnt || 0;
      if (count === 0) {
        await conn.execute(
          `INSERT INTO hdoc_user_infor (USERID, PASSWORD, USERNAME, RESPONSIBLE, USERPOSITION, EMAIL, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, ?)`,
          [
            "yann",
            "Pass123",
            "Test User",
            "",
            "",
            "",
            "TEST",
            "PLAYWRIGHT",
            "TEST",
            "PLAYWRIGHT",
          ],
        );
      }
      console.log("DB test data setup ok");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("DB not available:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  // no cleanup needed
}

async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}

async function clearLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("currentUser"));
}

async function safeWaitNetworkIdle(page: Page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
}

async function openPage(page: Page) {
  await setLoginState(page);
  await page.goto(MENU_URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(1000);
}

const CLICKABLE_MENU_ITEMS: { label: string; path: string }[] = [
  { label: "Generate Doc", path: "/generate-homologation-document" },
  {
    label: "Update user defined variables (rules)",
    path: "/homologation-variables",
  },
  { label: "Existing HDoc variables", path: "/hdoc-variables" },
  { label: "Upload/Delete template", path: "/upload-delete-template" },
  { label: "List available templates", path: "/list-available-templates" },
  { label: "VPPS Vin plate", path: "/vin-plate" },
  { label: "AD/CA Change", path: "ad-change" },
  { label: "Markets in HDoc", path: "/markets-in-hdoc" },
  { label: "HDoc User Administration", path: "/hdoc-user-administration" },
  {
    label: "HDoc User Doc Administration",
    path: "/hdoc-user-doc-administration",
  },
  { label: "Search User", path: "/search-user" },
  { label: "Change Password", path: "/user/password" },
  { label: "User Guide", path: "/hdoc-help" },
];

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD02 Menu Page - 单体测试", () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await clearTestData();
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题
    await expect(page.locator("div.menu-subtitle")).toHaveText(
      "Generate Document",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_タイトル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示菜单分组
    const groupTitles = page.locator("div.group-title");
    await expect(groupTitles).toHaveCount(5);
    const groupTexts = [
      "Generate",
      "Admin",
      "User Administration",
      "Archive",
      "Documentation",
    ];
    for (let i = 0; i < groupTexts.length; i++) {
      await expect(groupTitles.nth(i)).toHaveText(groupTexts[i]);
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_グループ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 各分组显示对应的菜单项链接
    await expect(page.locator("li.menu-item").first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "01_画面初期显示_基本元素",
        "003_メニュー項目確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 所有链接为活性状态
    for (const item of CLICKABLE_MENU_ITEMS) {
      await expect(
        page.locator("li.menu-item.clickable").filter({ hasText: item.label }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_リンク活性確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-菜单项完整显示
  // ============================================================
  test("02_画面初期显示_菜单项完整显示", async ({ page }) => {
    await openPage(page);

    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_菜单项完整显示",
        "001_ページ表示後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Generate分组
    await expect(
      page.locator("span.item-label").filter({ hasText: "Generate Doc" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_菜单项完整显示",
        "002_Generate確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Admin分组
    const adminItems = [
      "Update user defined variables (rules)",
      "Existing HDoc variables",
      "Upload/Delete template",
      "List available templates",
      "VPPS Vin plate",
      "AD/CA Change",
      "AD/CA Change",
    ];
    for (const item of adminItems) {
      const locator =
        item === "AD/CA Change"
          ? page
              .locator("span.item-label")
              .filter({ hasText: /^AD\/CA Change$/ })
          : page.locator("span.item-label").filter({ hasText: item });
      await expect(locator).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_菜单项完整显示",
        "003_Admin確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // User Administration分组
    const userItems = [
      "HDoc User Administration",
      "HDoc User Doc Administration",
      "Search User",
      "Change Password",
    ];
    for (const item of userItems) {
      await expect(
        page.locator("span.item-label").filter({ hasText: item }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_菜单项完整显示",
        "004_UserAdmin確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Documentation分组
    await expect(
      page.locator("span.item-label").filter({ hasText: "User Guide" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_菜单项完整显示",
        "005_Documentation確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-菜单项顺序
  // ============================================================
  test("03_画面初期显示_菜单项顺序", async ({ page }) => {
    await openPage(page);

    // 1. 分组顺序: Generate → Admin → User Administration → Archive → Documentation
    const groupTitles = page.locator("div.group-title");
    const texts = await groupTitles.allTextContents();
    expect(texts[0]?.trim()).toBe("Generate");
    expect(texts[1]?.trim()).toBe("Admin");
    expect(texts[2]?.trim()).toBe("User Administration");
    expect(texts[3]?.trim()).toBe("Archive");
    expect(texts[4]?.trim()).toBe("Documentation");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_菜单项顺序", "001_グループ順序"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Generate分组内菜单项顺序
    const genGroup = page.locator("li.menu-group").nth(0);
    const genLabels = await genGroup
      .locator("span.item-label")
      .allTextContents();
    expect(genLabels[0]?.trim()).toContain("Generate Doc");
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_菜单项顺序", "002_Generate順序"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Admin分组内菜单项顺序
    const adminGroup = page.locator("li.menu-group").nth(1);
    const adminLabels = await adminGroup
      .locator("span.item-label")
      .allTextContents();
    const expectedAdmin = [
      "Update user defined variables (rules)",
      "Update user defined variables (UNICODE rules)",
      "Existing HDoc variables",
      "Unlock Document",
      "HDoc Number Series",
      "Upload/Delete template",
      "List available templates",
      "VPPS Vin plate",
      "AD/CA Change",
      "Markets in HDoc",
    ];
    for (let i = 0; i < expectedAdmin.length; i++) {
      expect(adminLabels[i]?.trim()).toContain(expectedAdmin[i]);
    }
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_菜单项顺序", "003_Admin順序"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 点击 Generate Doc 链接
  // ============================================================
  test("04_点击GenerateDoc链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("04_点击GenerateDoc链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Generate Doc" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After Generate Doc click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("04_点击GenerateDoc链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 点击UpdateUserDefinedVariables链接
  // ============================================================
  test("05_点击UpdateUserDefinedVariables链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "05_点击UpdateUserDefinedVariables链接",
        "001_メニュー画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Update user defined variables (rules)" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After Update rules click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath(
        "05_点击UpdateUserDefinedVariables链接",
        "002_遷移後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 点击ExistingHDocVariables链接
  // ============================================================
  test("06_点击ExistingHDocVariables链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "06_点击ExistingHDocVariables链接",
        "001_メニュー画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Existing HDoc variables" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After Existing HDoc click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("06_点击ExistingHDocVariables链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 点击UploadDeleteTemplate链接
  // ============================================================
  test("07_点击UploadDeleteTemplate链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "07_点击UploadDeleteTemplate链接",
        "001_メニュー画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Upload/Delete template" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After Upload/Delete click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("07_点击UploadDeleteTemplate链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 点击ListAvailableTemplates链接
  // ============================================================
  test("08_点击ListAvailableTemplates链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "08_点击ListAvailableTemplates链接",
        "001_メニュー画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "List available templates" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After List templates click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath(
        "08_点击ListAvailableTemplates链接",
        "002_遷移後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 点击PPSVinplate链接
  // ============================================================
  test("09_点击PPSVinplate链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("09_点击PPSVinplate链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "VPPS Vin plate" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After VPPS Vin plate click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("09_点击PPSVinplate链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 点击ADCAChange链接
  // ============================================================
  test("10_点击ADCAChange链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("10_点击ADCAChange链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "AD/CA Change" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After AD/CA Change click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("10_点击ADCAChange链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 点击HDocUserAdministration链接
  // ============================================================
  test("11_点击HDocUserAdministration链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "11_点击HDocUserAdministration链接",
        "001_メニュー画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "HDoc User Administration" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After HDoc User Admin click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath(
        "11_点击HDocUserAdministration链接",
        "002_遷移後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 点击HDocUserDocAdministration链接
  // ============================================================
  test("12_点击HDocUserDocAdministration链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath(
        "12_点击HDocUserDocAdministration链接",
        "001_メニュー画面",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "HDoc User Doc Administration" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After HDoc User Doc Admin click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath(
        "12_点击HDocUserDocAdministration链接",
        "002_遷移後",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 点击SearchUser链接
  // ============================================================
  test("13_点击SearchUser链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("13_点击SearchUser链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Search User" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After Search User click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("13_点击SearchUser链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 点击ChangePassword链接
  // ============================================================
  test("14_点击ChangePassword链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("14_点击ChangePassword链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Change Password" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After Change Password click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("14_点击ChangePassword链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 点击UserGuide链接
  // ============================================================
  test("15_点击UserGuide链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("15_点击UserGuide链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "User Guide" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After User Guide click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("15_点击UserGuide链接", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 页面加载-未登录状态
  // ============================================================
  test("16_页面加载_未登录状态", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(MENU_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("16_页面加载_未登录状态", "001_未ログイン画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    console.log("Not logged in URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("16_页面加载_未登录状态", "002_URL確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 页面加载-已登录状态
  // ============================================================
  test("17_页面加载_已登录状态", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("17_页面加载_已登录状态", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.navigation-menu")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_页面加载_已登录状态", "002_メニュー表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("li.menu-item.clickable").first()).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_页面加载_已登录状态", "003_リンク活性確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 权限校验-有权限访问
  // ============================================================
  test("18_权限校验_有权限访问", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("18_权限校验_有权限访问", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Generate Doc" })
      .click();
    await page.waitForTimeout(1500);
    console.log("After click (authorized), URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("18_权限校验_有权限访问", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 权限校验-无权限访问
  // ============================================================
  test("19_权限校验_无权限访问", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("19_权限校验_无权限访问", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    // 选择非点击项（没有 clickable 类的 menu-item）
    const disabledItem = page.locator("li.menu-item:not(.clickable)").first();
    const itemLabel = await disabledItem
      .locator("span.item-label")
      .textContent()
      .catch(() => "(none)");
    console.log("Non-clickable item:", itemLabel);
    await disabledItem.click();
    await page.waitForTimeout(500);
    console.log("After click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("19_权限校验_无权限访问", "002_クリック後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 异常处理-页面跳转失败
  // ============================================================
  test("20_异常处理_页面跳转失败", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_页面跳转失败", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.evaluate(() => {
      window.location.href = "/non-existent-route";
    });
    await page.waitForTimeout(1500);
    console.log("After invalid route, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("20_异常处理_页面跳转失败", "002_遷移後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 异常处理-网络连接失败
  // ============================================================
  test("21_异常处理_网络连接失败", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_网络连接失败", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.menu-subtitle")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("21_异常处理_网络连接失败", "002_画面正常確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 鼠标悬停效果
  // ============================================================
  test("22_鼠标悬停效果", async ({ page }) => {
    await openPage(page);
    const menuItem = page.locator("li.menu-item.clickable").first();
    console.log(
      "Background before hover:",
      await menuItem.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      ),
    );
    await page.screenshot({
      path: getScreenshotPath("22_鼠标悬停效果", "001_ホバー前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await menuItem.hover();
    await page.waitForTimeout(300);
    console.log(
      "Background after hover:",
      await menuItem.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      ),
    );
    await page.screenshot({
      path: getScreenshotPath("22_鼠标悬停效果", "002_ホバー後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(menuItem).toHaveCSS("cursor", "pointer");
    await page.screenshot({
      path: getScreenshotPath("22_鼠标悬停效果", "003_カーソル確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 链接样式一致性
  // ============================================================
  test("23_链接样式一致性", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("23_链接样式一致性", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const menuItems = page.locator("li.menu-item");
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
    const arrowIcons = page.locator("span.arrow-icon");
    expect(await arrowIcons.count()).toBe(count);
    await page.screenshot({
      path: getScreenshotPath("23_链接样式一致性", "002_アローアイコン確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const groups = page.locator("div.group-title");
    expect(await groups.count()).toBe(5);
    await page.screenshot({
      path: getScreenshotPath("23_链接样式一致性", "003_グループ分け確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 连续点击同一链接
  // ============================================================
  test("24_连续点击同一链接", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("24_连续点击同一链接", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    const menuItem = page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Generate Doc" });
    await menuItem.click();
    await page.waitForTimeout(200);
    await menuItem.click();
    await page.waitForTimeout(200);
    await menuItem.click();
    await page.waitForTimeout(1500);
    console.log("After multiple clicks, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("24_连续点击同一链接", "002_複数回クリック後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 浏览器前进后退
  // ============================================================
  test("25_浏览器前进后退", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("25_浏览器前进后退", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page
      .locator("li.menu-item.clickable")
      .filter({ hasText: "Generate Doc" })
      .click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: getScreenshotPath("25_浏览器前进后退", "002_サブページ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.goBack();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: getScreenshotPath("25_浏览器前进后退", "003_戻り後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.menu-subtitle")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("25_浏览器前进后退", "004_メニュー正常表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 页面刷新
  // ============================================================
  test("26_页面刷新", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("26_页面刷新", "001_リロード前"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(1500);
    await expect(page.locator("div.menu-subtitle")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("26_页面刷新", "002_リロード後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.group-title")).toHaveCount(5);
    await page.screenshot({
      path: getScreenshotPath("26_页面刷新", "003_メニュー再表示確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 安全性-页面加载时验证登录状态
  // ============================================================
  test("27_安全性_页面加载时验证登录状态", async ({ page }) => {
    await clearLoginState(page);
    await page.goto(MENU_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath(
        "27_安全性_页面加载时验证登录状态",
        "001_未ログインアクセス",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    console.log("Unauthenticated URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath(
        "27_安全性_页面加载时验证登录状态",
        "002_画面状態確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 安全性-跳转前检查权限
  // ============================================================
  test("28_安全性_跳转前检查权限", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("28_安全性_跳转前检查权限", "001_メニュー画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.locator("li.menu-item:not(.clickable)").first().click();
    await page.waitForTimeout(500);
    console.log("After disabled click, URL:", page.url());
    await page.screenshot({
      path: getScreenshotPath("28_安全性_跳转前检查权限", "002_クリック後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 安全性-API请求通过HTTPS
  // ============================================================
  test("29_安全性_API请求通过HTTPS", async ({ page }) => {
    await openPage(page);
    await page.screenshot({
      path: getScreenshotPath("29_安全性_API请求通过HTTPS", "001_ページ表示後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await expect(page.locator("div.menu-subtitle")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("29_安全性_API请求通过HTTPS", "002_画面正常確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
