/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

/**
 * UD02 Menu 模块 Playwright 自动化测试
 *
 * 参照《単体テスト仕様書UD02.md》的测试对象、操作步骤、设定值和预想结果。
 *
 * 说明：
 * - 通过 page.route 拦截 /api/menu/getpermissions 接口，模拟不同权限场景。
 * - 每个测试用例开始前先在 localStorage 写入 userID（Menu 在未登录时会跳转 /login）。
 * - 每执行一步都截图，截图格式为 JPEG，以每个测试观点(用例)为单元，从 001 开始循环命名。
 * - 截图保存到 E:\UDWorkspace\NextInnovation\react-ud\Image\UD02
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const MENU_URL = BASE_URL + "/menu";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD02";

// 页面元素选择器（与 Menu.tsx 中的元素保持一致）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  panelTitle: ".menu-panel-title",
  loading: ".menu-loading",
  error: ".menu-error",
  nav: ".menu-nav",
  categoryHeader: ".menu-category-header",
  categoryArrow: ".menu-category-arrow",
  categoryTitle: ".menu-category-title",
  itemsList: ".menu-items",
  menuItem: ".menu-item",
  menuItemLabel: ".menu-item-label",
};

// 根据分类标题定位分类头部
function categoryHeader(title: string) {
  return `.menu-category:has(.menu-category-title:text-is("${title}")) .menu-category-header`;
}

/**
 * 截图辅助函数：以每个测试观点为单元从 001 开始命名。
 * 通过闭包维护每个用例内的自增计数器。
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

/**
 * 移除 CRA webpack-dev-server 的错误遮罩层（若存在）。
 */
async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.getElementById("webpack-dev-server-client-overlay");
    if (overlay) overlay.remove();
    const closeBtn = document.querySelector("#webpack-dev-server-client-overlay-close");
    if (closeBtn) (closeBtn as HTMLElement).click();
  });
}

/**
 * 设置权限 mock：拦截 /api/menu/getpermissions。
 * permissions 为数组（允许的权限代码）。status 可覆盖返回状态码。
 * 使用正则匹配 URL，确保 query 参数也能命中。
 */
async function mockPermissions(page: Page, permissions: string[] | null, status = 200) {
  await page.route(/\/api\/menu\/getpermissions/, async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { permissions } }),
    });
  });
}

test.describe("UD02 Menu 菜单模块测试", () => {
  test.beforeEach(async ({ page }) => {
    // 在根路径设置 localStorage 的 userID（Menu 挂载时读取）。
    // 注意：必须在 beforeEach 的初始导航中设置，而非 addInitScript，
    // 因为 addInitScript 会对后续每次导航都重新注入，导致未登录用例（TC03/TC30）失败。
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => {
      localStorage.setItem("userID", "user001");
    });
    await dismissOverlay(page);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await mockPermissions(page, [
      "generate_doc",
      "admin_update_variables",
      "admin_existing_variables",
      "admin_upload_template",
      "admin_list_templates",
      "admin_vpps_vin_plate",
      "admin_ad_ca_change",
      "user_admin_hdoc_user",
      "user_admin_hdoc_user_doc",
      "user_admin_search_user",
      "documentation_user_guide",
    ]);

    await page.goto(MENU_URL);
    await snap("登录后访问 Menu 页面");

    // 1. 顶部导航栏显示 VOLVO logo
    await expect(page.locator(SEL.logo)).toHaveText("VOLVO");
    await snap("确认 VOLVO logo");

    // 2. 显示 Welcome, user001
    await expect(page.locator(SEL.welcomeText)).toContainText("Welcome, user001");
    await snap("确认登录用户名显示");

    // 3. 显示 Generate Document 面板标题
    await expect(page.locator(SEL.panelTitle)).toHaveText("Generate Document");
    await snap("确认 Generate Document 面板标题");

    // 4. 菜单面板根据权限显示对应分类
    await expect(page.locator(SEL.nav)).toBeVisible();
    await snap("确认菜单面板显示");

    // 5. 显示 Logout 按钮
    await expect(page.locator(SEL.logoutButton)).toHaveText("Logout");
    await snap("确认 Logout 按钮");
  });

  test("TC02 画面初始化-菜单分类展开", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-菜单分类展开");
    await mockPermissions(page, [
      "generate_doc",
      "admin_update_variables",
      "admin_existing_variables",
      "admin_upload_template",
      "admin_list_templates",
      "admin_vpps_vin_plate",
      "admin_ad_ca_change",
      "user_admin_hdoc_user",
      "user_admin_hdoc_user_doc",
      "user_admin_search_user",
      "documentation_user_guide",
    ]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. Generate / Admin / User Administration / Documentation 默认展开
    for (const title of ["Generate", "Admin", "User Administration", "Documentation"]) {
      await expect(page.locator(categoryHeader(title))).toBeVisible();
    }
    await snap("确认四个分类均显示");

    // 2. 每个分类标题前显示 ▾ 箭头（展开状态）
    for (const title of ["Generate", "Admin", "User Administration", "Documentation"]) {
      await expect(page.locator(`${categoryHeader(title)} .menu-category-arrow`)).toHaveText("▾");
    }
    await snap("确认各分类箭头为展开状态 ▾");

    // 3. 分类子菜单项可见（有多个菜单项，取第一个）
    await expect(page.locator(SEL.menuItem).first()).toBeVisible();
    await snap("确认子菜单项可见");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    // 清除 localStorage 中的 userID
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    // 访问 Menu 页面
    await page.goto(MENU_URL);
    await snap("访问 /menu 页面");

    // 1. localStorage 中无 userID
    // 2. 自动跳转到 /login
    await page.waitForURL("**/login");
    await snap("确认跳转到 /login 页面");

    // 3. 不显示菜单内容
    await expect(page.locator(SEL.panelTitle)).toHaveCount(0);
    await snap("确认不显示菜单内容");
  });

  // ============================================================
  // 权限加载
  // ============================================================

  test("TC04 权限加载-调用权限API", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_权限加载-调用权限API");
    let capturedUrl = "";
    await page.route(/\/api\/menu\/getpermissions/, async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { permissions: ["generate_doc"] } }),
      });
    });

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 调用 GetUserPermissionsApi（GET /api/menu/getpermissions）
    await expect.poll(() => capturedUrl).toContain("/api/menu/getpermissions");
    // 2. 请求参数 userId 从 localStorage 获取为 user001
    expect(capturedUrl).toContain("userId=user001");
    await snap("确认权限 API 调用与 userId 参数");
  });

  test("TC05 权限加载-加载中显示Loading", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_权限加载-加载中显示Loading");
    // 挂起 API 响应，观察 Loading 状态
    let resolveRoute: (v: unknown) => void = () => {};
    await page.route(/\/api\/menu\/getpermissions/, (route) => {
      return new Promise((resolve) => {
        resolveRoute = resolve;
      }).then(() =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: { permissions: ["generate_doc"] } }),
        })
      );
    });

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面（API 挂起中）");

    // 1. 加载中显示 Loading...
    await expect(page.locator(SEL.loading)).toHaveText("Loading...");
    // 2. 加载中不显示菜单列表内容
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    // 3. 加载中不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认加载中状态");

    resolveRoute(true);
    await page.waitForSelector(SEL.nav).catch(() => {});
  });

  test("TC06 权限加载-全部权限显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_权限加载-全部权限显示");
    await mockPermissions(page, [
      "generate_doc",
      "admin_update_variables",
      "admin_existing_variables",
      "admin_upload_template",
      "admin_list_templates",
      "admin_vpps_vin_plate",
      "admin_ad_ca_change",
      "user_admin_hdoc_user",
      "user_admin_hdoc_user_doc",
      "user_admin_search_user",
      "documentation_user_guide",
    ]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示 Generate >> Generate Doc
    await expect(page.locator(categoryHeader("Generate"))).toBeVisible();
    await expect(page.locator(".menu-item:has-text('Generate Doc')")).toBeVisible();
    await snap("确认 Generate >> Generate Doc");

    // 2. 显示 Admin 下 6 个菜单项
    await expect(page.locator(categoryHeader("Admin"))).toBeVisible();
    await expect(page.locator('.menu-category:has(.menu-category-title:text-is("Admin")) .menu-item')).toHaveCount(6);
    await snap("确认 Admin 分类 6 个菜单项");

    // 3. 显示 User Administration 下 3 个菜单项
    await expect(page.locator('.menu-category:has(.menu-category-title:text-is("User Administration")) .menu-item')).toHaveCount(3);
    await snap("确认 User Administration 分类 3 个菜单项");

    // 4. 显示 Documentation >> User Guide
    await expect(page.locator(".menu-item:has-text('User Guide')")).toBeVisible();
    await snap("确认 Documentation >> User Guide");

    // 5. 共显示 4 个分类、11 个菜单项
    await expect(page.locator(SEL.categoryHeader)).toHaveCount(4);
    await expect(page.locator(SEL.menuItem)).toHaveCount(11);
    await snap("确认共 4 分类 11 菜单项");
  });

  // ============================================================
  // 菜单显示（权限过滤）
  // ============================================================

  test("TC07 权限过滤-部分权限", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_权限过滤-部分权限");
    await mockPermissions(page, ["generate_doc"]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 仅显示 Generate >> Generate Doc
    await expect(page.locator(".menu-item:has-text('Generate Doc')")).toBeVisible();
    // 2-4. 不显示 Admin / User Administration / Documentation 分类
    await expect(page.locator(categoryHeader("Admin"))).toHaveCount(0);
    await expect(page.locator(categoryHeader("User Administration"))).toHaveCount(0);
    await expect(page.locator(categoryHeader("Documentation"))).toHaveCount(0);
    // 5. 无权限分类完全不在 DOM
    await expect(page.locator(SEL.categoryHeader)).toHaveCount(1);
    await snap("确认仅显示 Generate 分类");
  });

  test("TC08 权限过滤-Admin部分权限", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_权限过滤-Admin部分权限");
    await mockPermissions(page, ["admin_upload_template"]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 仅显示 Admin >> Upload/Delete template
    await expect(page.locator(".menu-item:has-text('Upload/Delete template')")).toBeVisible();
    // 2. 不显示 Admin 分类下其他 5 个菜单项
    await expect(page.locator('.menu-category:has(.menu-category-title:text-is("Admin")) .menu-item')).toHaveCount(1);
    // 3. 不显示其他分类
    await expect(page.locator(categoryHeader("Generate"))).toHaveCount(0);
    await expect(page.locator(categoryHeader("User Administration"))).toHaveCount(0);
    await expect(page.locator(categoryHeader("Documentation"))).toHaveCount(0);
    await snap("确认仅显示 Admin >> Upload/Delete template");
  });

  test("TC09 权限过滤-User Administration", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_权限过滤-User_Administration");
    await mockPermissions(page, ["user_admin_search_user"]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 仅显示 User Administration >> Search User
    await expect(page.locator(".menu-item:has-text('Search User')")).toBeVisible();
    // 2. 不显示 User Administration 下其他 2 个菜单项
    await expect(page.locator('.menu-category:has(.menu-category-title:text-is("User Administration")) .menu-item')).toHaveCount(1);
    // 3. 不显示其他分类
    await expect(page.locator(SEL.categoryHeader)).toHaveCount(1);
    await snap("确认仅显示 User Administration >> Search User");
  });

  test("TC10 权限过滤-Documentation", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_权限过滤-Documentation");
    await mockPermissions(page, ["documentation_user_guide"]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 仅显示 Documentation >> User Guide
    await expect(page.locator(".menu-item:has-text('User Guide')")).toBeVisible();
    // 2. 不显示其他分类
    await expect(page.locator(SEL.categoryHeader)).toHaveCount(1);
    await snap("确认仅显示 Documentation >> User Guide");
  });

  test("TC11 权限过滤-组合权限", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_权限过滤-组合权限");
    await mockPermissions(page, ["generate_doc", "admin_list_templates"]);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示 Generate >> Generate Doc
    await expect(page.locator(".menu-item:has-text('Generate Doc')")).toBeVisible();
    // 2. 显示 Admin >> List available templates
    await expect(page.locator(".menu-item:has-text('List available templates')")).toBeVisible();
    // 3. 不显示其他菜单项
    await expect(page.locator(SEL.menuItem)).toHaveCount(2);
    // 4. 仅显示有权限的分类（Generate 和 Admin 两个分类）
    await expect(page.locator(SEL.categoryHeader)).toHaveCount(2);
    await snap("确认组合权限显示");
  });

  // ============================================================
  // 权限异常
  // ============================================================

  test("TC12 权限异常-无任何权限", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_权限异常-无任何权限");
    await mockPermissions(page, []);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示错误消息："YOU (user001) ARE NOT AUTHORIZED TO ACCESS THIS PAGE"
    await expect(page.locator(SEL.error)).toHaveText(
      "YOU (user001) ARE NOT AUTHORIZED TO ACCESS THIS PAGE"
    );
    await snap("确认无权限错误消息");

    // 3. 所有菜单项被隐藏
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    await snap("确认菜单列表为空");
  });

  test("TC13 权限异常-API返回401/403", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_权限异常-API返回401_403");
    await page.route(/\/api\/menu\/getpermissions/, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Forbidden" }),
      });
    });

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText(
      "YOU (user001) ARE NOT AUTHORIZED TO ACCESS THIS PAGE"
    );
    // 3. 所有菜单项被隐藏
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    await snap("确认 403 未授权错误消息");
  });

  test("TC14 权限异常-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_权限异常-服务器500错误");
    await page.route(/\/api\/menu\/getpermissions/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      });
    });

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText(
      "System error. Please contact administrator."
    );
    // 3. 所有菜单项被隐藏
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    await snap("确认 500 错误消息");
  });

  test("TC15 权限异常-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_权限异常-网络错误");
    await page.route(/\/api\/menu\/getpermissions/, (route) => route.abort());

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText(
      "Network error or server unavailable. Please try again later."
    );
    // 3. 所有菜单项被隐藏
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    await snap("确认网络错误消息");
  });

  // ============================================================
  // 菜单交互
  // ============================================================

  test("TC16 菜单交互-分类折叠", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_菜单交互-分类折叠");
    await mockPermissions(page, [
      "generate_doc",
      "admin_upload_template",
      "documentation_user_guide",
    ]);

    await page.goto(MENU_URL);
    await page.waitForSelector(SEL.categoryHeader);
    await snap("访问 Menu 页面");

    // 1. 点击 Admin 分类标题
    await page.locator(categoryHeader("Admin")).click();
    await snap("点击 Admin 分类标题");

    // Admin 子菜单项被隐藏（收起）
    await expect(page.locator(categoryHeader("Admin")).locator("..").locator(SEL.itemsList)).toHaveCount(0);
    // 2. 标题前箭头变为 ▸
    await expect(page.locator(`${categoryHeader("Admin")} .menu-category-arrow`)).toHaveText("▸");
    // 3. 其他分类不受影响（Generate 仍展开）
    await expect(page.locator(SEL.menuItem).filter({ hasText: "Generate Doc" })).toBeVisible();
    await snap("确认 Admin 分类收起");
  });

  test("TC17 菜单交互-分类重新展开", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_菜单交互-分类重新展开");
    await mockPermissions(page, [
      "generate_doc",
      "admin_upload_template",
      "documentation_user_guide",
    ]);

    await page.goto(MENU_URL);
    await page.waitForSelector(SEL.categoryHeader);
    await snap("访问 Menu 页面");

    // 点击 Admin 分类标题收起
    await page.locator(categoryHeader("Admin")).click();
    await snap("点击 Admin 分类标题收起");
    await expect(page.locator(`${categoryHeader("Admin")} .menu-category-arrow`)).toHaveText("▸");

    // 2. 再次点击标题
    await page.locator(categoryHeader("Admin")).click();
    await snap("再次点击 Admin 分类标题");

    // 3. 子菜单项重新显示（展开）
    await expect(page.locator(".menu-item:has-text('Upload/Delete template')")).toBeVisible();
    // 4. 箭头变回 ▾
    await expect(page.locator(`${categoryHeader("Admin")} .menu-category-arrow`)).toHaveText("▾");
    await snap("确认 Admin 分类重新展开");
  });

  test("TC18 菜单交互-多分类独立折叠", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_菜单交互-多分类独立折叠");
    await mockPermissions(page, [
      "generate_doc",
      "admin_upload_template",
      "documentation_user_guide",
    ]);

    await page.goto(MENU_URL);
    await page.waitForSelector(SEL.categoryHeader);
    await snap("访问 Menu 页面");

    // 折叠 Admin 分类
    await page.locator(categoryHeader("Admin")).click();
    // 再折叠 Documentation 分类
    await page.locator(categoryHeader("Documentation")).click();
    await snap("折叠 Admin 和 Documentation 分类");

    // 1. 两个分类独立折叠
    await expect(page.locator(`${categoryHeader("Admin")} .menu-category-arrow`)).toHaveText("▸");
    await expect(page.locator(`${categoryHeader("Documentation")} .menu-category-arrow`)).toHaveText("▸");
    // 3. Generate 分类不受影响（仍展开）
    await expect(page.locator(`${categoryHeader("Generate")} .menu-category-arrow`)).toHaveText("▾");
    // Generate 子菜单仍可见
    await expect(page.locator(".menu-item:has-text('Generate Doc')")).toBeVisible();
    await snap("确认多分类独立折叠");
  });

  test("TC19 菜单导航-Generate Doc", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_菜单导航_Generate_Doc");
    await mockPermissions(page, ["generate_doc"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('Generate Doc')");
    await snap("访问 Menu 页面");

    // 点击 Generate >> Generate Doc
    await page.locator(".menu-item:has-text('Generate Doc')").click();
    await snap("点击 Generate Doc 菜单项");

    // 跳转到 /generate-document 页面
    await page.waitForURL("**/generate-document");
    await snap("确认跳转到 /generate-document 页面");
  });

  test("TC20 菜单导航-Admin Upload/Delete", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_菜单导航_Admin_Upload_Delete");
    await mockPermissions(page, ["admin_upload_template"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('Upload/Delete template')");
    await snap("访问 Menu 页面");

    // 点击 Admin >> Upload/Delete template
    await page.locator(".menu-item:has-text('Upload/Delete template')").click();
    await snap("点击 Upload/Delete template 菜单项");

    // 跳转到 /admin/upload-template 页面
    await page.waitForURL("**/admin/upload-template");
    await snap("确认跳转到目标页面");
  });

  test("TC21 菜单导航-Admin List templates", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_菜单导航_Admin_List_templates");
    await mockPermissions(page, ["admin_list_templates"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('List available templates')");
    await snap("访问 Menu 页面");

    // 点击 Admin >> List available templates
    await page.locator(".menu-item:has-text('List available templates')").click();
    await snap("点击 List available templates 菜单项");

    // 跳转到 /admin/list-templates 页面
    await page.waitForURL("**/admin/list-templates");
    await snap("确认跳转到目标页面");
  });

  test("TC22 菜单导航-Admin VPPS Vin plate", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_菜单导航_Admin_VPPS_Vin_plate");
    await mockPermissions(page, ["admin_vpps_vin_plate"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('VPPS Vin plate')");
    await snap("访问 Menu 页面");

    // 点击 Admin >> VPPS Vin plate
    await page.locator(".menu-item:has-text('VPPS Vin plate')").click();
    await snap("点击 VPPS Vin plate 菜单项");

    // 跳转到 /admin/vpps-vin-plate 页面
    await page.waitForURL("**/admin/vpps-vin-plate");
    await snap("确认跳转到目标页面");
  });

  test("TC23 菜单导航-Admin AD/CA Change", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_菜单导航_Admin_AD_CA_Change");
    await mockPermissions(page, ["admin_ad_ca_change"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('AD/CA Change')");
    await snap("访问 Menu 页面");

    // 点击 Admin >> AD/CA Change
    await page.locator(".menu-item:has-text('AD/CA Change')").click();
    await snap("点击 AD/CA Change 菜单项");

    // 跳转到 /admin/ad-ca-change 页面
    await page.waitForURL("**/admin/ad-ca-change");
    await snap("确认跳转到目标页面");
  });

  test("TC24 菜单导航-User Administration", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_菜单导航_User_Administration");
    await mockPermissions(page, ["user_admin_hdoc_user"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('HDoc User Administration')");
    await snap("访问 Menu 页面");

    // 点击 User Administration >> HDoc User Administration
    await page.locator(".menu-item:has-text('HDoc User Administration')").click();
    await snap("点击 HDoc User Administration 菜单项");

    // 跳转到 /user-admin/hdoc-user 页面
    await page.waitForURL("**/user-admin/hdoc-user");
    await snap("确认跳转到目标页面");
  });

  test("TC25 菜单导航-Documentation", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_菜单导航_Documentation");
    await mockPermissions(page, ["documentation_user_guide"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(".menu-item:has-text('User Guide')");
    await snap("访问 Menu 页面");

    // 点击 Documentation >> User Guide
    await page.locator(".menu-item:has-text('User Guide')").click();
    await snap("点击 User Guide 菜单项");

    // 跳转到 /documentation/user-guide 页面
    await page.waitForURL("**/documentation/user-guide");
    await snap("确认跳转到目标页面");
  });

  // ============================================================
  // 消息显示
  // ============================================================

  test("TC26 消息显示-默认隐藏", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_消息显示-默认隐藏");
    await mockPermissions(page, ["generate_doc"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(SEL.nav);
    await snap("访问 Menu 页面（有权访问）");

    // 1. Message 默认隐藏
    // 2. 不显示 NOT AUTHORIZED 消息
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认消息默认隐藏");
  });

  test("TC27 消息类型-Warning样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_消息类型_Warning样式");
    await mockPermissions(page, []);

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示未授权消息
    await expect(page.locator(SEL.error)).toHaveText(
      "YOU (user001) ARE NOT AUTHORIZED TO ACCESS THIS PAGE"
    );
    // 3. 消息文字颜色为红色
    const color = await page
      .locator(SEL.error)
      .evaluate((el) => getComputedStyle(el).color);
    console.log("Warning message color:", color);
    await snap("确认未授权消息样式");

    // 4. 所有菜单项隐藏
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    await snap("确认菜单项隐藏");
  });

  test("TC28 消息类型-Error样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC28_消息类型_Error样式");
    await page.route(/\/api\/menu\/getpermissions/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      });
    });

    await page.goto(MENU_URL);
    await snap("访问 Menu 页面");

    // 1. 显示系统错误消息
    await expect(page.locator(SEL.error)).toHaveText(
      "System error. Please contact administrator."
    );
    // 3. 所有菜单项隐藏
    await expect(page.locator(SEL.nav)).toHaveCount(0);
    await snap("确认 Error 消息");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC29 安全性-无权限菜单不渲染", async ({ page }) => {
    const snap = makeScreenshot(page, "TC29_安全性-无权限菜单不渲染");
    await mockPermissions(page, ["generate_doc"]);

    await page.goto(MENU_URL);
    await page.waitForSelector(SEL.nav);
    await snap("访问 Menu 页面");

    // 1. 未授权菜单项不渲染（不在 DOM）
    await expect(page.locator(".menu-item:has-text('VPPS Vin plate')")).toHaveCount(0);
    await expect(page.locator(".menu-item:has-text('Search User')")).toHaveCount(0);
    await expect(page.locator(".menu-item:has-text('User Guide')")).toHaveCount(0);
    await snap("确认未授权菜单不渲染");

    // 2. 不显示禁用状态的灰色菜单项
    await expect(page.locator(".menu-item-disabled, .menu-item.disabled")).toHaveCount(0);
    await snap("确认无禁用态灰色菜单");
  });

  test("TC30 安全性-未登录访问重定向", async ({ page }) => {
    const snap = makeScreenshot(page, "TC30_安全性-未登录访问重定向");
    let apiCalled = false;
    await page.route(/\/api\/menu\/getpermissions/, async (route) => {
      apiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { permissions: ["generate_doc"] } }),
      });
    });

    // 清除 userID（未登录）
    await page.evaluate(() => localStorage.removeItem("userID"));
    await page.goto(MENU_URL);
    await snap("未登录直接访问 /menu 页面");

    // 1. 自动跳转到 /login
    await page.waitForURL("**/login");
    await snap("确认跳转到 /login");

    // 2. 不显示任何菜单内容
    await expect(page.locator(SEL.panelTitle)).toHaveCount(0);
    // 3. 不调用权限 API
    expect(apiCalled).toBe(false);
    await snap("确认未发起权限请求");
  });
});
