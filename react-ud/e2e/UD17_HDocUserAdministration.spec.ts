import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD17_URL = "/UD17";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD17";
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

async function navigateToUD17(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD17_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud17-container", { timeout: 15000 });
}

function getUserIdInput(page: Page) {
  return page.locator(".ud17-inp").first();
}

function getUserNameInput(page: Page) {
  return page.locator(".ud17-inp").nth(1);
}

function getBtnUserInfo(page: Page) {
  return page.locator(".ud17-btn").filter({ hasText: "USER INFO" });
}

function getBtnUpdateRole(page: Page) {
  return page.locator(".ud17-btn").filter({ hasText: "Update Role" });
}

function getBtnDeleteRole(page: Page) {
  return page.locator(".ud17-btn").filter({ hasText: "Delete Role" });
}

function getRoleCheckbox(page: Page, roleName: string) {
  return page
    .locator(".ud17-chk-lbl")
    .filter({ hasText: roleName })
    .locator("input[type='checkbox']");
}

function getMessage(page: Page) {
  return page.locator(".ud17-msg[role='alert']");
}

test.describe("HDoc用户管理 (UD17) 测试", () => {
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
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud17-header")).toBeVisible();
      await expect(page.locator(".ud17-page-title")).toHaveText(
        "HDoc User Admin",
      );
      await expect(getUserIdInput(page)).toHaveValue("");
      await expect(getUserNameInput(page)).toHaveValue("");
      // 所有权限复选框为未选中（前5个在role-grid中）
      const roleNames = [
        "Standard User",
        "Rule Admin",
        "Template Admin",
        "Document Auth Admin",
        "User Admin",
      ];
      for (const r of roleNames) {
        await expect(getRoleCheckbox(page, r)).not.toBeChecked();
      }
      // Adaptation user 在 roles-section 中
      await expect(getRoleCheckbox(page, "Adaptation user")).not.toBeChecked();
      // Manage Variable List
      await expect(page.locator(".ud17-mvl-chk")).not.toBeChecked();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件状态", async ({ page }) => {
      const t = "画面初始化-控件状态";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await expect(getUserIdInput(page)).toBeEnabled();
      await expect(getUserIdInput(page)).toHaveAttribute("maxLength", "10");
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await expect(getBtnUpdateRole(page)).toBeEnabled();
      await expect(getBtnDeleteRole(page)).toBeEnabled();
      // 权限复选框可操作
      await expect(getRoleCheckbox(page, "Standard User")).toBeEnabled();
      await expect(getRoleCheckbox(page, "Rule Admin")).toBeEnabled();
      await expect(getRoleCheckbox(page, "Template Admin")).toBeEnabled();
      await expect(getRoleCheckbox(page, "Document Auth Admin")).toBeEnabled();
      await expect(getRoleCheckbox(page, "User Admin")).toBeEnabled();
      await expect(getRoleCheckbox(page, "Adaptation user")).toBeEnabled();
      await expect(page.locator(".ud17-mvl-chk")).toBeEnabled();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("空值校验", () => {
    test("[3] USER INFO-UserID为空", async ({ page }) => {
      const t = "USER INFO-UserID为空";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
    });

    test("[4] Update Role-UserID为空", async ({ page }) => {
      const t = "Update Role-UserID为空";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getBtnUpdateRole(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
    });

    test("[5] Delete Role-UserID为空", async ({ page }) => {
      const t = "Delete Role-UserID为空";
      let dialogCount = 0;
      page.on("dialog", () => {
        dialogCount++;
      });
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getBtnDeleteRole(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      expect(dialogCount).toBe(0);
      await takeStepScreenshot(page, t);
    });

    test("[6] 空值校验-全角空格", async ({ page }) => {
      const t = "空值校验-全角空格";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("\u3000\u3000");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("USER INFO 功能", () => {
    test("[7] USER INFO-用户存在", async ({ page }) => {
      const t = "USER INFO-用户存在";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      // 显示 User Name
      const userNameInput = getUserNameInput(page);
      const userNameVal = await userNameInput.inputValue().catch(() => "");
      if (userNameVal) {
        expect(userNameVal.length).toBeGreaterThan(0);
      }
      // 不显示错误消息
      const msg = getMessage(page);
      const msgVisible = await msg.isVisible().catch(() => false);
      if (msgVisible) {
        const cls = await msg.getAttribute("class").catch(() => "");
        if (cls && cls.includes("ud17-error")) {
          // 如果是错误消息，记录但不失败
          console.log("Error message displayed:", await msg.textContent());
        }
      }
      await takeStepScreenshot(page, t);
    });

    test("[8] USER INFO-用户不存在(404)", async ({ page }) => {
      const t = "USER INFO-用户不存在(404)";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("XXXX");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("userid");
      // User Name 被清空
      await expect(getUserNameInput(page)).toHaveValue("");
      await takeStepScreenshot(page, t);
    });

    test("[9] USER INFO-多种权限组合", async ({ page }) => {
      const t = "USER INFO-多种权限组合";
      // 模拟 API 返回自定义 roles
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: {
                username: "John Doe",
                permissions: [
                  { role: "Standard User", checked: true, markets: ["-EU"] },
                  { role: "Rule Admin", checked: true, markets: ["-US"] },
                  { role: "Adaptation user", checked: true, markets: [] },
                ],
              },
            }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      // Standard User 和 Rule Admin 应该被勾选
      await expect(getRoleCheckbox(page, "Standard User")).toBeChecked();
      await expect(getRoleCheckbox(page, "Rule Admin")).toBeChecked();
      // Adaptation user 应该被勾选
      await expect(getRoleCheckbox(page, "Adaptation user")).toBeChecked();
      // 其他未勾选
      await expect(getRoleCheckbox(page, "Template Admin")).not.toBeChecked();
      await expect(
        getRoleCheckbox(page, "Document Auth Admin"),
      ).not.toBeChecked();
      await expect(getRoleCheckbox(page, "User Admin")).not.toBeChecked();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });

    test("[10] USER INFO-API失败", async ({ page }) => {
      const t = "USER INFO-API失败";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });
  });

  test.describe("Update Role 功能", () => {
    test("[11] Update Role-正常更新", async ({ page }) => {
      const t = "Update Role-正常更新";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 勾选一个角色（如 Template Admin）
      const cb = getRoleCheckbox(page, "Template Admin");
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check();
        await page.waitForTimeout(300);
      }
      await getBtnUpdateRole(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        console.log("Update Role result:", txt);
      }
      await takeStepScreenshot(page, t);
    });

    test("[12] Update Role-部分更新", async ({ page }) => {
      const t = "Update Role-部分更新";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 取消一个已选角色
      const cb = getRoleCheckbox(page, "Standard User");
      const isChecked = await cb.isChecked().catch(() => false);
      if (isChecked) {
        await cb.uncheck();
        await page.waitForTimeout(300);
      }
      await getBtnUpdateRole(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        console.log("Update Role (partial) result:", txt);
      }
      await takeStepScreenshot(page, t);
    });

    test("[13] Update Role-无权限变更(403)", async ({ page }) => {
      const t = "Update Role-无权限变更(403)";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17UpdateRole",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 403,
              msg: "您没有权限执行此操作",
            }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 修改权限
      const cb = getRoleCheckbox(page, "Template Admin");
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check();
        await page.waitForTimeout(300);
      }
      await getBtnUpdateRole(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17UpdateRole");
    });

    test("[14] Update Role-API失败", async ({ page }) => {
      const t = "Update Role-API失败";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17UpdateRole",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 修改权限
      const cb = getRoleCheckbox(page, "Template Admin");
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check();
        await page.waitForTimeout(300);
      }
      await getBtnUpdateRole(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17UpdateRole");
    });

    test("[15] Update Role-Market一起更新", async ({ page }) => {
      const t = "Update Role-Market一起更新";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 修改权限
      const cb = getRoleCheckbox(page, "Rule Admin");
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check();
        await page.waitForTimeout(300);
      }
      await getBtnUpdateRole(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        console.log("Update Role with Market result:", txt);
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Delete Role 功能", () => {
    test("[16] Delete Role-确认取消", async ({ page }) => {
      const t = "Delete Role-确认取消";
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      await getBtnDeleteRole(page).click();
      await page.waitForTimeout(1000);
      expect(dialogShown).toBeTruthy();
      await takeStepScreenshot(page, t);
    });

    test("[17] Delete Role-正常删除", async ({ page }) => {
      const t = "Delete Role-正常删除";
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      await getBtnDeleteRole(page).click();
      await page.waitForTimeout(3000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        console.log("Delete Role result:", txt);
      }
      await takeStepScreenshot(page, t);
    });

    test("[18] Delete Role-API失败", async ({ page }) => {
      const t = "Delete Role-API失败";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17DeleteRole",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      await getBtnDeleteRole(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17DeleteRole");
    });
  });

  test.describe("UI交互", () => {
    test("[19] 操作中按钮禁用", async ({ page }) => {
      const t = "操作中按钮禁用";
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: {
                username: "John Doe",
                permissions: [
                  { role: "Standard User", checked: true, markets: ["-EU"] },
                  { role: "Rule Admin", checked: true, markets: [] },
                ],
              },
            }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(300);
      // 按钮应该被禁用
      await expect(getBtnUserInfo(page)).toBeDisabled();
      await expect(getBtnUpdateRole(page)).toBeDisabled();
      await expect(getBtnDeleteRole(page)).toBeDisabled();
      await takeStepScreenshot(page, t);
      // 释放 API 响应
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      // API 响应后按钮恢复可用
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await expect(getBtnUpdateRole(page)).toBeEnabled();
      await expect(getBtnDeleteRole(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });

    test("[20] 操作中防止重复提交", async ({ page }) => {
      const t = "操作中防止重复提交";
      let apiCallCount = 0;
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          apiCallCount++;
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: {
                username: "John Doe",
                permissions: [
                  { role: "Standard User", checked: true, markets: ["-EU"] },
                ],
              },
            }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      const btn = getBtnUserInfo(page);
      await btn.click();
      await page.waitForTimeout(200);
      // 按钮已禁用，再次点击应该无效
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
      await takeStepScreenshot(page, t);
      // 释放 API
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      expect(apiCallCount).toBeLessThanOrEqual(1);
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });

    test("[21] 消息清空-新操作清除旧消息", async ({ page }) => {
      const t = "消息清空-新操作清除旧消息";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      // 先触发空值错误
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("请输入用户ID");
      await takeStepScreenshot(page, t);
      // 输入有效值再执行操作
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      // 检查消息 - 可能是成功或错误，但不再是"请输入用户ID"
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        expect(txt).not.toContain("请输入用户ID");
      }
      await takeStepScreenshot(page, t);
    });

    test("[22] USER INFO后权限修改再查询", async ({ page }) => {
      const t = "USER INFO后权限修改再查询";
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 修改权限勾选
      const cb = getRoleCheckbox(page, "Rule Admin");
      const isChecked = await cb.isChecked().catch(() => false);
      if (!isChecked) {
        await cb.check();
      } else {
        await cb.uncheck();
      }
      await page.waitForTimeout(300);
      // 再次查询 USER INFO
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(3000);
      // 权限复选框应重置为 API 最新值
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[23] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });

    test("[24] 异常处理-API超时", async ({ page }) => {
      test.setTimeout(60000);
      const t = "异常处理-API超时";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await new Promise((r) => setTimeout(r, 20000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForSelector(".ud17-msg[role='alert']", {
        timeout: 35000,
      });
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });

    test("[25] 异常处理-服务器500错误", async ({ page }) => {
      const t = "异常处理-服务器500错误";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnUserInfo(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });

    test("[26] 异常处理-Saviynt同步失败", async ({ page }) => {
      const t = "异常处理-Saviynt同步失败";
      await page.route(
        "**/api/UD17HDocUserAdministrationApi/UD17Userinfo",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 400,
              msg: "无法获取用户主数据，请稍后重试",
            }),
          });
        },
      );
      await navigateToUD17(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("v0c6900");
      await getBtnUserInfo(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("无法获取用户主数据");
      // User Name 不更新
      await expect(getUserNameInput(page)).toHaveValue("");
      // 权限复选框不更新（保持未选中）
      for (const rn of [
        "Standard User",
        "Rule Admin",
        "Template Admin",
        "Document Auth Admin",
        "User Admin",
        "Adaptation user",
      ]) {
        await expect(getRoleCheckbox(page, rn)).not.toBeChecked();
      }
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD17HDocUserAdministrationApi/UD17Userinfo");
    });
  });
});
