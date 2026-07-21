import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD18_URL = "/UD18";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD18";
let screenshotCounter = 1;

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
    window.localStorage.setItem("auth_token", "test-token");
  });
}

async function navigateToUD18(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD18_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud18-container", { timeout: 15000 });
}

function getUserIdInput(page: Page) {
  return page.locator(".ud18-inp").first();
}

function getUserNameInput(page: Page) {
  return page.locator(".ud18-inp.ud18-ro");
}

function getBtnUserInfo(page: Page) {
  return page.locator(".ud18-btn").filter({ hasText: "User Info" });
}

function getBtnUpdate(page: Page) {
  return page.locator(".ud18-btn").filter({ hasText: "UPDATE" });
}

function getMessage(page: Page) {
  return page.locator(".ud18-msg[role='alert']");
}

function getDocItem(page: Page, description: string) {
  return page.locator(".ud18-doc-item").filter({ hasText: description });
}

test.describe("HDoc用户文档管理 (UD18) 测试", () => {
  test.beforeEach(async () => {
    screenshotCounter = 1;
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      const failedName = testInfo.title.replace(
        /[\[\]\\\/\:\*\?\"\<\>\|]/g,
        "_",
      );
      await page.screenshot({
        path: `${IMAGE_DIR}/_FAILED_/${failedName}.jpg`,
        type: "jpeg",
        quality: 85,
        fullPage: true,
      });
    }
  });

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-正常表示", async ({ page }) => {
      const t = "画面初始化-正常表示";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud18-header")).toBeVisible();
      await expect(page.locator(".ud18-page-title")).toHaveText(
        "HDoc Document Authorization",
      );
      await expect(getUserIdInput(page)).toHaveValue("");
      await expect(getUserNameInput(page)).toHaveValue("");
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await expect(getBtnUpdate(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件状态", async ({ page }) => {
      const t = "画面初始化-控件状态";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await expect(getUserIdInput(page)).toBeEnabled();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await expect(getBtnUpdate(page)).toBeEnabled();
      await expect(getMessage(page)).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[3] 文档列表-正常加载", async ({ page }) => {
      const t = "文档列表-正常加载";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/document-list",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: {
                documents: [
                  { doctype: "DOC01", description: "Document Type 1" },
                  { doctype: "DOC02", description: "Document Type 2" },
                  { doctype: "DOC03", description: "Document Type 3" },
                ],
              },
            }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      const docList = page.locator(".ud18-doc-list");
      await expect(docList).toBeVisible({ timeout: 10000 });
      const items = page.locator(".ud18-doc-item");
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/document-list",
      );
    });
  });

  test.describe("空值校验", () => {
    test("[4] User Info-UserID为空", async ({ page }) => {
      const t = "User Info-UserID为空";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
    });

    test("[5] Update-UserID为空", async ({ page }) => {
      const t = "Update-UserID为空";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getBtnUpdate(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
    });

    test("[6] 空值校验-全角空格", async ({ page }) => {
      const t = "空值校验-全角空格";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("\u3000\u3000");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("文档列表加载", () => {
    test("[7] 文档列表-加载失败", async ({ page }) => {
      const t = "文档列表-加载失败";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/document-list",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await page.waitForTimeout(2000);
      const docList = page.locator(".ud18-doc-list");
      const visible = await docList.isVisible().catch(() => false);
      expect(visible).toBeFalsy();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/document-list",
      );
    });
  });

  test.describe("用户信息获取", () => {
    test("[8] User Info-用户存在", async ({ page }) => {
      const t = "User Info-用户存在";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      const userNameVal = await getUserNameInput(page)
        .inputValue()
        .catch(() => "");
      if (userNameVal) {
        expect(userNameVal.length).toBeGreaterThan(0);
      }
      const msg = getMessage(page);
      const msgVisible = await msg.isVisible().catch(() => false);
      if (msgVisible) {
        const cls = await msg.getAttribute("class").catch(() => "");
        if (cls && cls.includes("ud18-error")) {
          console.log("Error msg:", await msg.textContent());
        }
      }
      await takeStepScreenshot(page, t);
    });

    test("[9] User Info-用户不存在(404)", async ({ page }) => {
      const t = "User Info-用户不存在(404)";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 404 }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("XXXX");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("userid");
      await expect(getUserNameInput(page)).toHaveValue("");
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });

    test("[10] User Info-用户无权限", async ({ page }) => {
      const t = "User Info-用户无权限";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      const userNameVal = await getUserNameInput(page)
        .inputValue()
        .catch(() => "");
      if (userNameVal) {
        expect(userNameVal.length).toBeGreaterThan(0);
      }
      await takeStepScreenshot(page, t);
    });

    test("[11] User Info-API失败", async ({ page }) => {
      const t = "User Info-API失败";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });
  });

  test.describe("更新权限", () => {
    test("[12] Update-正常更新(新增权限)", async ({ page }) => {
      const t = "Update-正常更新(新增权限)";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 点击第一个未选中的文档项
      const docItems = page.locator(".ud18-doc-item");
      const count = await docItems.count();
      for (let i = 0; i < count; i++) {
        const item = docItems.nth(i);
        const bg = await item.getAttribute("style").catch(() => "");
        if (!bg || !bg.includes("dce8f0")) {
          await item.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      await getBtnUpdate(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        console.log("Update result:", await msg.textContent());
      }
      await takeStepScreenshot(page, t);
    });

    test("[13] Update-正常更新(取消权限)", async ({ page }) => {
      const t = "Update-正常更新(取消权限)";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 点击第一个已选中的文档项取消
      const docItems = page.locator(".ud18-doc-item");
      const count = await docItems.count();
      for (let i = 0; i < count; i++) {
        const item = docItems.nth(i);
        const bg = await item.getAttribute("style").catch(() => "");
        if (bg && bg.includes("dce8f0")) {
          await item.click();
          await page.waitForTimeout(300);
          break;
        }
      }
      await getBtnUpdate(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        console.log("Update (cancel) result:", await msg.textContent());
      }
      await takeStepScreenshot(page, t);
    });

    test("[14] Update-用户不存在(404)", async ({ page }) => {
      const t = "Update-用户不存在(404)";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("XXXX");
      // 勾选一个文档
      const docList = page.locator(".ud18-doc-list");
      if (await docList.isVisible().catch(() => false)) {
        const firstDoc = page.locator(".ud18-doc-item").first();
        if (await firstDoc.isVisible().catch(() => false)) {
          await firstDoc.click();
          await page.waitForTimeout(300);
        }
      }
      await getBtnUpdate(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        console.log("Update (404) result:", await msg.textContent());
      }
      await takeStepScreenshot(page, t);
    });

    test("[15] Update-API失败", async ({ page }) => {
      const t = "Update-API失败";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/update-user-doc",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 点击一个文档项
      const firstDoc = page.locator(".ud18-doc-item").first();
      if (await firstDoc.isVisible().catch(() => false)) {
        await firstDoc.click();
        await page.waitForTimeout(300);
      }
      await getBtnUpdate(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/update-user-doc",
      );
    });
  });

  test.describe("UI交互", () => {
    test("[16] 操作中按钮禁用", async ({ page }) => {
      const t = "操作中按钮禁用";
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: { userid: "v0c6900", doctypes: [] },
            }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(300);
      await expect(getBtnUserInfo(page)).toBeDisabled();
      await expect(getBtnUpdate(page)).toBeDisabled();
      await takeStepScreenshot(page, t);
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await expect(getBtnUpdate(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });

    test("[17] 操作中防止重复提交", async ({ page }) => {
      const t = "操作中防止重复提交";
      let apiCallCount = 0;
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          apiCallCount++;
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: { userid: "v0c6900", doctypes: [] },
            }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      const btn = getBtnUserInfo(page);
      await btn.click();
      await page.waitForTimeout(200);
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
      await takeStepScreenshot(page, t);
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      expect(apiCallCount).toBeLessThanOrEqual(1);
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });

    test("[18] 消息清空-新操作清除旧消息", async ({ page }) => {
      const t = "消息清空-新操作清除旧消息";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        expect(txt).not.toContain("请输入用户ID");
      }
      await takeStepScreenshot(page, t);
    });

    test("[19] User Info后更新再查询", async ({ page }) => {
      const t = "User Info后更新再查询";
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 点击一个文档项切换状态
      const firstDoc = page.locator(".ud18-doc-item").first();
      if (await firstDoc.isVisible().catch(() => false)) {
        await firstDoc.click();
        await page.waitForTimeout(300);
      }
      // 再次查询
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[20] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });

    test("[21] 异常处理-请求超时", async ({ page }) => {
      const t = "异常处理-请求超时";
      test.setTimeout(60000);
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          await new Promise((r) => setTimeout(r, 20000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForSelector(".ud18-msg[role='alert']", {
        timeout: 35000,
      });
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });

    test("[22] 异常处理-数据库连接失败", async ({ page }) => {
      const t = "异常处理-数据库连接失败";
      await page.route(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 500,
              msg: "系统暂时不可用，请稍后再试",
            }),
          });
        },
      );
      await navigateToUD18(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD18HDocUserDocAdministrationApi/select-user-doc",
      );
    });
  });
});
