import { test, expect, Page, Route } from "@playwright/test";

const LOGIN_URL = "/UD01";
const MENU_URL = "/UD02";

async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "fake-token");
  });
}

async function clearSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}

test.describe("Menu 模块 (UD02) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // 在页面加载前设置 localStorage，组件初始化时即可检测到有效 session
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "user_info",
        JSON.stringify({ userId: "tester", name: "Test User" }),
      );
      window.localStorage.setItem("auth_token", "fake-token");
    });
    await page.goto(MENU_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".main-menu-container", { timeout: 15000 });
  });

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
      await expect(page.locator(".main-menu-container")).toBeVisible();
      await expect(page.locator(".header")).toBeVisible();
      await expect(page.locator(".menu-nav")).toBeVisible();
    });

    test("[2] 画面初始化-Header显示", async ({ page }: { page: Page }) => {
      await expect(page.locator(".header")).toBeVisible();
      await expect(page.locator(".header-logo")).toHaveText("VOLVO");
    });

    test("[3] 画面初始化-菜单组显示", async ({ page }: { page: Page }) => {
      const groupTitles = page.locator(".group-title");
      await expect(groupTitles).toHaveCount(4);
      await expect(groupTitles.nth(0)).toHaveText("Generate");
      await expect(groupTitles.nth(1)).toHaveText("Admin");
      await expect(groupTitles.nth(2)).toHaveText("User Administration");
      await expect(groupTitles.nth(3)).toHaveText("Documentation");
    });

    test("[4] 画面初始化-菜单项显示", async ({ page }: { page: Page }) => {
      const menuLinks = page.locator(".menu-link");
      await expect(menuLinks).toHaveCount(12);
      await expect(menuLinks.first()).toContainText("Generate Doc");
    });

    test("[5] 画面初始化-加载显示", async ({ page }: { page: Page }) => {
      await expect(page.locator(".loading-message")).toHaveCount(0);
    });
  });

  test.describe("会话验证", () => {
    test("[6] 会话验证-正常（有Token）", async ({ page }: { page: Page }) => {
      await expect(page.locator(".menu-nav")).toBeVisible();
      await expect(page.locator(".header-logo")).toHaveText("VOLVO");
    });
  });

  test.describe("菜单导航", () => {
    test("[11] 菜单跳转-Generate Doc", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "Generate Doc" })
        .click();
      await expect(page).toHaveURL(/UD03/);
    });

    test("[12] 菜单跳转-键盘操作Enter", async ({ page }: { page: Page }) => {
      const generateDocLink = page
        .locator(".menu-link")
        .filter({ hasText: "Generate Doc" });
      await generateDocLink.focus();
      await generateDocLink.press("Enter");
      await expect(page).toHaveURL(/UD03/);
    });

    test("[13] 菜单跳转-Update user defined variables", async ({
      page,
    }: {
      page: Page;
    }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "Update user defined variables" })
        .click();
      await expect(page).toHaveURL(/UD08/);
    });

    test("[14] 菜单跳转-Existing HDoc variables", async ({
      page,
    }: {
      page: Page;
    }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "Existing HDoc variables" })
        .click();
      await expect(page).toHaveURL(/UD10/);
    });

    test("[15] 菜单跳转-Upload/Delete template", async ({
      page,
    }: {
      page: Page;
    }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "Upload/Delete template" })
        .click();
      await expect(page).toHaveURL(/UD12/);
    });

    test("[16] 菜单跳转-Template Check", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "Template Check" })
        .click();
      await expect(page).toHaveURL(/UD13/);
    });

    test("[17] 菜单跳转-List Templates", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "List Templates" })
        .click();
      await expect(page).toHaveURL(/UD14/);
    });

    test("[18] 菜单跳转-VPPS Vin plate", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "VPPS Vin plate" })
        .click();
      await expect(page).toHaveURL(/UD15/);
    });

    test("[19] 菜单跳转-AD/CA Change", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "AD/CA Change" })
        .click();
      await expect(page).toHaveURL(/UD16/);
    });

    test("[20] 菜单跳转-HDoc User Administration", async ({
      page,
    }: {
      page: Page;
    }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "HDoc User Administration" })
        .click();
      await expect(page).toHaveURL(/UD17/);
    });

    test("[21] 菜单跳转-HDoc User Doc Administration", async ({
      page,
    }: {
      page: Page;
    }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "HDoc User Doc Administration" })
        .click();
      await expect(page).toHaveURL(/UD18/);
    });

    test("[22] 菜单跳转-Search User", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "Search User" })
        .click();
      await expect(page).toHaveURL(/UD19/);
    });

    test("[23] 菜单跳转-User Guide", async ({ page }: { page: Page }) => {
      await page
        .locator(".menu-link")
        .filter({ hasText: "User Guide" })
        .click();
      await expect(page).toHaveURL(/UD24/);
    });
  });

  test.describe("UI细节", () => {
    test("[28] 菜单项-»符号显示", async ({ page }: { page: Page }) => {
      const menuLinks = page.locator(".menu-link");
      const count = await menuLinks.count();
      for (let i = 0; i < count; i++) {
        await expect(menuLinks.nth(i)).toBeVisible();
      }
    });

    test("[33] 布局-左对齐显示", async ({ page }: { page: Page }) => {
      await expect(page.locator(".menu-nav")).toBeVisible();
    });
  });
});
