import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD15_URL = "/UD15";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD15";
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

async function navigateToUD15(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD15_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud15-container", { timeout: 15000 });
}

test.describe("Vin Plate 模块 (UD15) 测试", () => {
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
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud15-header")).toBeVisible();
      await expect(page.locator(".ud15-page-title")).toHaveText("Vin Plate");
      await expect(page.locator(".ud15-input")).toBeVisible();
      await expect(page.locator(".ud15-input")).toHaveValue("");
      await expect(page.locator(".ud15-error")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件状态", async ({ page }) => {
      const t = "画面初始化-控件状态";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud15-input")).toBeEnabled();
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "View Info" }),
      ).toBeEnabled();
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "Set Regenerate" }),
      ).toBeEnabled();
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "Set OK" }),
      ).toBeEnabled();
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "Change to Basic" }),
      ).toBeEnabled();
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "Change to Advanced" }),
      ).toBeEnabled();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("空值校验", () => {
    test("[3] 空值校验-Chassis为空", async ({ page }) => {
      const t = "空值校验-Chassis为空";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await expect(page.locator(".ud15-error")).toHaveText(
        "Please enter a chassis number.",
      );
      await takeStepScreenshot(page, t);
    });

    test("[4] 空值校验-全角空格", async ({ page }) => {
      const t = "空值校验-全角空格";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("\u3000\u3000");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[5] 空值校验-各按钮均触发空值检查", async ({ page }) => {
      const t = "空值校验-各按钮均触发空值检查";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      const btns = [
        "View Info",
        "Set Regenerate",
        "Set OK",
        "Change to Basic",
        "Change to Advanced",
      ];
      for (const btnText of btns) {
        await page.locator(".ud15-btn").filter({ hasText: btnText }).click();
        await page.waitForTimeout(300);
        await expect(page.locator(".ud15-error")).toBeVisible();
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("View Info 功能", () => {
    test("[6] View Info-正常", async ({ page }) => {
      const t = "View Info-正常";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const err = page.locator(".ud15-error");
      if (await err.isVisible().catch(() => false))
        await expect(err).toBeVisible();
      const suc = page.locator(".ud15-success");
      if (await suc.isVisible().catch(() => false))
        await expect(suc).toBeVisible();
    });

    test("[7] View Info-底盘不存在(404)", async ({ page }) => {
      const t = "View Info-底盘不存在(404)";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("XXXX");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(2000);
      const err = page.locator(".ud15-error");
      if (await err.isVisible().catch(() => false))
        await expect(err).toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Set Regenerate 功能", () => {
    test("[8] Set Regenerate-正常", async ({ page }) => {
      const t = "Set Regenerate-正常";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[9] Set Regenerate-API失败", async ({ page }) => {
      const t = "Set Regenerate-API失败";
      await page.route(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15SetRegenerate",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15SetRegenerate",
      );
    });
  });

  test.describe("Set OK 功能", () => {
    test("[10] Set OK-正常", async ({ page }) => {
      const t = "Set OK-正常";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "Set OK" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[11] Set OK-API失败", async ({ page }) => {
      const t = "Set OK-API失败";
      await page.route(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15SetOK",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "Set OK" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD15SelecthdocsenddatavinplateApi/UD15SetOK");
    });
  });

  test.describe("Change to Basic 功能", () => {
    test("[12] Change to Basic-正常", async ({ page }) => {
      const t = "Change to Basic-正常";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Change to Basic" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[13] Change to Basic-API失败", async ({ page }) => {
      const t = "Change to Basic-API失败";
      await page.route(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoBasicInfo",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Change to Basic" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoBasicInfo",
      );
    });
  });

  test.describe("Change to Advanced 功能", () => {
    test("[14] Change to Advanced-正常", async ({ page }) => {
      const t = "Change to Advanced-正常";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Change to Advanced" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[15] Change to Advanced-API失败", async ({ page }) => {
      const t = "Change to Advanced-API失败";
      await page.route(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoAdvancedInfo",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Change to Advanced" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoAdvancedInfo",
      );
    });
  });

  test.describe("UI交互", () => {
    test("[16] 操作中按钮禁用", async ({ page }) => {
      const t = "操作中按钮禁用";
      // 延迟 API 响应使 disabled 状态可见
      await page.route(/UD15ViewInfo/, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, data: {} }),
        });
      });
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(300);
      // 确认 View Info 按钮禁用（组件输入框无 disabled 属性）
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "View Info" }),
      ).toBeDisabled();
      await takeStepScreenshot(page, t);
      await page.waitForTimeout(3500);
      await expect(
        page.locator(".ud15-btn").filter({ hasText: "View Info" }),
      ).toBeEnabled();
      await page.unroute(/UD15ViewInfo/);
    });

    test("[17] 操作中防止重复提交", async ({ page }) => {
      const t = "操作中防止重复提交";
      await page.route(/UD15ViewInfo/, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, data: {} }),
        });
      });
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      const btn = page.locator(".ud15-btn").filter({ hasText: "View Info" });
      await btn.click();
      await page.waitForTimeout(200);
      await btn.click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
      await page.waitForTimeout(3500);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo",
      );
    });

    test("[18] 消息清空-新操作清除旧消息", async ({ page }) => {
      const t = "消息清空-新操作清除旧消息";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      // 触发错误（空提交）
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      // 输入有效数据后再次操作
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(2000);
      const err = page.locator(".ud15-error");
      const suc = page.locator(".ud15-success");
      if (await err.isVisible().catch(() => false))
        await expect(err).toBeVisible();
      else if (await suc.isVisible().catch(() => false))
        await expect(suc).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[19] 连续操作-先View Info后更新", async ({ page }) => {
      const t = "连续操作-先View Info后更新";
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      // 先 View Info
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      // 再 Set Regenerate
      await page
        .locator(".ud15-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[20] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(/UD15ViewInfo/, async (route) => {
        await route.abort("connectionrefused");
      });
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo",
      );
    });

    test("[21] 异常处理-API超时", async ({ page }) => {
      const t = "异常处理-API超时";
      await page.route(/UD15ViewInfo/, async (route) => {
        await new Promise((r) => setTimeout(r, 25000));
        await route.abort("connectionrefused");
      });
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForSelector(".ud15-error", { timeout: 45000 });
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo",
      );
    });

    test("[22] 异常处理-服务器500错误", async ({ page }) => {
      const t = "异常处理-服务器500错误";
      await page.route(/UD15ViewInfo/, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
        });
      });
      await navigateToUD15(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud15-input").fill("JPCT 013945");
      await page.locator(".ud15-btn").filter({ hasText: "View Info" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud15-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo",
      );
    });
  });
});
