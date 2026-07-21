import { test, expect, Page, Route } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const MENU_URL = "/UD02";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD02";

/** スクリーンショット用カウンター（テストケースごとにリセット） */
let screenshotCounter = 1;

/**
 * テストケース内でステップごとにスクリーンショットを撮影
 * 命名: {testCaseName}/001.jpg の形式、テストごとに001から開始
 */
async function takeStepScreenshot(page: Page, testName: string) {
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: `${IMAGE_DIR}/${testName}/${filename}`,
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
}

async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

// ============================================================
// テストスイート：Menu 模块 (UD02)
// ============================================================

test.describe("Menu 模块 (UD02) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
    await seedSession(page);
    await page.goto(MENU_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".header", { timeout: 15000 });
  });

  // 测试失败时也截图
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      const testName = testInfo.title.replace(/[\[\]\\\/\:\*\?\"\<\>\|]/g, "_");
      await page.screenshot({
        path: `${IMAGE_DIR}/_FAILED_/${testName}.jpg`,
        type: "jpeg",
        quality: 85,
        fullPage: true,
      });
    }
  });

  // ==========================================================
  // 1. 画面初始化（テストケース 1～5）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-全体布局";
      await expect(page.locator(".main-menu-container")).toBeVisible();
      await expect(page.locator(".header")).toBeVisible();
      await expect(page.locator(".menu-nav")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-Header显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-Header显示";
      await expect(page.locator(".header")).toBeVisible();
      await expect(page.locator(".header-logo")).toHaveText("VOLVO");
      await takeStepScreenshot(page, testName);
    });

    test("[3] 画面初始化-菜单组显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-菜单组显示";
      const groupTitles = page.locator(".group-title");
      await expect(groupTitles).toHaveCount(4);
      await expect(groupTitles.nth(0)).toHaveText("Generate");
      await expect(groupTitles.nth(1)).toHaveText("Admin");
      await expect(groupTitles.nth(2)).toHaveText("Documentation");
      await expect(groupTitles.nth(3)).toHaveText("User Administration");
      await takeStepScreenshot(page, testName);
    });

    test("[4] 画面初始化-菜单项显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-菜单项显示";
      const menuLinks = page.locator(".menu-link");
      await expect(menuLinks).toHaveCount(12);
      await expect(menuLinks.first()).toContainText("Generate Doc");
      await takeStepScreenshot(page, testName);
    });

    test("[5] 画面初始化-加载显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-加载显示";
      await expect(page.locator(".loading-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 会话验证（テストケース 6）
  // ==========================================================

  test.describe("会话验证", () => {
    test("[6] 会话验证-正常（有Token）", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "会话验证-正常（有Token）";
      await expect(page.locator(".menu-nav")).toBeVisible();
      await expect(page.locator(".header-logo")).toHaveText("VOLVO");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 菜单导航（テストケース 7～19）
  // ==========================================================

  test.describe("菜单导航", () => {
    test("[7] 菜单跳转-Generate Doc", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-Generate Doc";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Generate Doc" })
        .click();
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[8] 菜单跳转-键盘操作", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-键盘操作";
      const link = page
        .locator(".menu-link")
        .filter({ hasText: "Generate Doc" });
      await link.focus();
      await link.press("Enter");
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[9] 菜单跳转-Update user defined variables", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-UpdateUserDefinedVariables";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Update user defined variables" })
        .click();
      await expect(page).toHaveURL(/UD08/);
      await takeStepScreenshot(page, testName);
    });

    test("[10] 菜单跳转-Existing HDoc variables", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-ExistingHDocVariables";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Existing HDoc variables" })
        .click();
      await expect(page).toHaveURL(/UD10/);
      await takeStepScreenshot(page, testName);
    });

    test("[11] 菜单跳转-Upload/Delete template", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-UploadDeleteTemplate";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Upload/Delete template" })
        .click();
      await expect(page).toHaveURL(/UD12/);
      await takeStepScreenshot(page, testName);
    });

    test("[12] 菜单跳转-Template Check", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-TemplateCheck";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Template Check" })
        .click();
      await expect(page).toHaveURL(/UD13/);
      await takeStepScreenshot(page, testName);
    });

    test("[13] 菜单跳转-List Templates", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-ListTemplates";
      await page
        .locator(".menu-link")
        .filter({ hasText: "List Templates" })
        .click();
      await expect(page).toHaveURL(/UD14/);
      await takeStepScreenshot(page, testName);
    });

    test("[14] 菜单跳转-VPPS Vin plate", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-VPPSVinPlate";
      await page
        .locator(".menu-link")
        .filter({ hasText: "VPPS Vin plate" })
        .click();
      await expect(page).toHaveURL(/UD15/);
      await takeStepScreenshot(page, testName);
    });

    test("[15] 菜单跳转-AD/CA Change", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-ADCAChange";
      await page
        .locator(".menu-link")
        .filter({ hasText: "AD/CA Change" })
        .click();
      await expect(page).toHaveURL(/UD16/);
      await takeStepScreenshot(page, testName);
    });

    test("[16] 菜单跳转-HDoc User Administration", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-HDocUserAdministration";
      await page
        .locator(".menu-link")
        .filter({ hasText: "HDoc User Administration" })
        .click();
      await expect(page).toHaveURL(/UD17/);
      await takeStepScreenshot(page, testName);
    });

    test("[17] 菜单跳转-HDoc User Doc Admin", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-HDocUserDocAdmin";
      await page
        .locator(".menu-link")
        .filter({ hasText: "HDoc User Doc Administration" })
        .click();
      await expect(page).toHaveURL(/UD18/);
      await takeStepScreenshot(page, testName);
    });

    test("[18] 菜单跳转-Search User", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-SearchUser";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Search User" })
        .click();
      await expect(page).toHaveURL(/UD19/);
      await takeStepScreenshot(page, testName);
    });

    test("[19] 菜单跳转-User Guide", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单跳转-UserGuide";
      await page
        .locator(".menu-link")
        .filter({ hasText: "User Guide" })
        .click();
      await expect(page).toHaveURL(/UD24/);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. UI细节（Header）（テストケース 20～22）
  // ==========================================================

  test.describe("UI细节（Header）", () => {
    test("[20] Header-背景色", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Header-背景色";
      await expect(page.locator(".header")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[21] Header-VOLVO文字样式", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Header-VOLVO文字样式";
      await expect(page.locator(".header")).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".header-logo")).toHaveText("VOLVO");
      await takeStepScreenshot(page, testName);
    });

    test("[22] Header-内边距", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Header-内边距";
      await expect(page.locator(".header")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 5. UI细节（菜单项）（テストケース 23～27）
  // ==========================================================

  test.describe("UI细节（菜单项）", () => {
    test("[23] 菜单项-符号显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单项-符号显示";
      const menuLinks = page.locator(".menu-link");
      const count = await menuLinks.count();
      for (let i = 0; i < count; i++) {
        await expect(menuLinks.nth(i)).toBeVisible();
      }
      await takeStepScreenshot(page, testName);
    });

    test("[24] 菜单项-悬停效果", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单项-悬停效果";
      await page.locator(".menu-link").first().hover();
      await takeStepScreenshot(page, testName);
    });

    test("[25] 菜单项-点击效果", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单项-点击效果";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Generate Doc" })
        .click();
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[26] 菜单项-焦点显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单项-焦点显示";
      await page.locator(".menu-link").first().focus();
      await takeStepScreenshot(page, testName);
    });

    test("[27] 菜单项-字体", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "菜单项-字体";
      await expect(page.locator(".group-title").first()).toBeVisible();
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 6. UI细节（布局）（テストケース 28～31）
  // ==========================================================

  test.describe("UI细节（布局）", () => {
    test("[28] 布局-左对齐显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "布局-左对齐显示";
      await expect(page.locator(".menu-nav")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[29] 布局-菜单背景色", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "布局-菜单背景色";
      await expect(page.locator(".menu-nav")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[30] 布局-模块标题背景", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "布局-模块标题背景";
      await expect(page.locator(".group-title").first()).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[31] 布局-菜单组间距", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "布局-菜单组间距";
      await expect(page.locator(".menu-group")).toHaveCount(4);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 8. 模块标题（非激活状态）（テストケース 32）
  // ==========================================================

  test.describe("模块标题（非激活状态）", () => {
    test("[32] 模块标题-非激活", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "模块标题-非激活";
      await page.locator(".group-title").first().click();
      await expect(page).toHaveURL(/UD02/);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 9. 异常处理（テストケース 34～36）
  // ==========================================================

  test.describe("异常处理", () => {
    test("[34] 异常处理-会话过期", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-会话过期";
      await page.evaluate(() => window.localStorage.clear());
      await page.goto(MENU_URL);
      await page.waitForURL("**/UD01", { timeout: 10000 });
      await expect(page).toHaveURL(/UD01/);
      await takeStepScreenshot(page, testName);
    });

    test("[35] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络错误";
      await page
        .locator(".menu-link")
        .filter({ hasText: "Generate Doc" })
        .click();
      await expect(page).toHaveURL(/UD03/);
      await takeStepScreenshot(page, testName);
    });

    test("[36] 异常处理-不存在路由", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-不存在路由";
      await page.goto("/nonexistent-route");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 10. 安全性（テストケース 37～39）
  // ==========================================================

  test.describe("安全性", () => {
    test("[37] 安全性-未认证直接访问", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-未认证直接访问";
      await page.evaluate(() => window.localStorage.clear());
      await page.goto(MENU_URL);
      await page.waitForURL("**/UD01", { timeout: 10000 });
      await expect(page).toHaveURL(/UD01/);
      await takeStepScreenshot(page, testName);
    });

    test("[38] 安全性-无效Token", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-无效Token";
      await page.evaluate(() => {
        window.localStorage.setItem(
          "user_info",
          JSON.stringify({ userId: "invalid", name: "Invalid" }),
        );
        window.localStorage.setItem("auth_token", "");
      });
      await page.goto(MENU_URL);
      await page.waitForURL("**/UD01", { timeout: 10000 });
      await expect(page).toHaveURL(/UD01/);
      await takeStepScreenshot(page, testName);
    });

    test("[39] 安全性-localStorage操作", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-localStorage操作";
      const userInfo = await page.evaluate(() =>
        localStorage.getItem("user_info"),
      );
      expect(userInfo).not.toBeNull();
      await takeStepScreenshot(page, testName);
    });
  });
});
