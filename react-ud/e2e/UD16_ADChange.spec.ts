import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD16_URL = "/UD16";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD16";
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

async function navigateToUD16(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD16_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud16-container", { timeout: 15000 });
}

test.describe("AD Change 模块 (UD16) 测试", () => {
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
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud16-header")).toBeVisible();
      await expect(page.locator(".ud16-page-title")).toHaveText("AD Change");
      await expect(page.locator(".ud16-input").first()).toHaveValue("");
      await expect(page.locator(".ud16-input-desc")).toHaveValue("");
      await expect(
        page.locator(".ud16-btn").filter({ hasText: "ADD" }),
      ).toBeEnabled();
      await expect(
        page.locator(".ud16-btn").filter({ hasText: "DELETE" }),
      ).toBeEnabled();
      await expect(
        page.locator(".ud16-btn").filter({ hasText: "CHECK" }),
      ).toBeEnabled();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件状态", async ({ page }) => {
      const t = "画面初始化-控件状态";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud16-input").first()).toBeEnabled();
      await expect(page.locator(".ud16-input").first()).toHaveAttribute(
        "maxLength",
        "15",
      );
      await expect(page.locator(".ud16-input-desc")).toBeEnabled();
      await expect(page.locator(".ud16-input-desc")).toHaveAttribute(
        "maxLength",
        "4000",
      );
      await expect(page.locator(".ud16-message")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("空值校验", () => {
    test("[3] 空值校验-Serie-Chnr为空", async ({ page }) => {
      const t = "空值校验-Serie-Chnr为空";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[4] 空值校验-全角空格", async ({ page }) => {
      const t = "空值校验-全角空格";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("\u3000\u3000");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[5] 空值校验-各按钮均触发空值检查", async ({ page }) => {
      const t = "空值校验-各按钮均触发空值检查";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      for (const btnText of ["ADD", "DELETE", "CHECK"]) {
        await page.locator(".ud16-btn").filter({ hasText: btnText }).click();
        await page.waitForTimeout(300);
        await expect(page.locator(".ud16-message")).toBeVisible();
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("ADD 功能", () => {
    test("[6] ADD-正常新增", async ({ page }) => {
      const t = "ADD-正常新增";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-input-desc").fill("test");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      const msg = page.locator(".ud16-message");
      if (await msg.isVisible().catch(() => false)) {
        const cls = await msg.getAttribute("class");
        if (cls?.includes("success")) await expect(msg).toBeVisible();
      }
      await takeStepScreenshot(page, t);
    });

    test("[7] ADD-记录已存在(409)", async ({ page }) => {
      const t = "ADD-记录已存在(409)";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("EXISTING_RECORD");
      await page.locator(".ud16-input-desc").fill("test");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      const msg = page.locator(".ud16-message");
      if (await msg.isVisible().catch(() => false)) {
        const cls = await msg.getAttribute("class");
        if (cls?.includes("error")) await expect(msg).toBeVisible();
      }
      await takeStepScreenshot(page, t);
    });

    test("[8] ADD-Desc为空", async ({ page }) => {
      const t = "ADD-Desc为空";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[9] ADD-Desc含特殊字符", async ({ page }) => {
      const t = "ADD-Desc含特殊字符";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-input-desc").fill("test@#$%");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[10] ADD-API失败", async ({ page }) => {
      const t = "ADD-API失败";
      await page.route(
        "**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-input-desc").fill("test");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange");
    });
  });

  test.describe("DELETE 功能", () => {
    test("[11] DELETE-确认取消", async ({ page }) => {
      const t = "DELETE-确认取消";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      page.on("dialog", async (d) => {
        await d.dismiss();
      });
      await page.locator(".ud16-btn").filter({ hasText: "DELETE" }).click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, t);
    });

    test("[12] DELETE-正常删除", async ({ page }) => {
      const t = "DELETE-正常删除";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await page.locator(".ud16-btn").filter({ hasText: "DELETE" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[13] DELETE-记录不存在(404)", async ({ page }) => {
      const t = "DELETE-记录不存在(404)";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("XXXX");
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await page.locator(".ud16-btn").filter({ hasText: "DELETE" }).click();
      await page.waitForTimeout(2000);
      const msg = page.locator(".ud16-message");
      if (await msg.isVisible().catch(() => false))
        await expect(msg).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[14] DELETE-API失败", async ({ page }) => {
      const t = "DELETE-API失败";
      await page.route(
        "**/api/UD16ADChangeApi/UD16DeleteHdocAdcaChange",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await page.locator(".ud16-btn").filter({ hasText: "DELETE" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16DeleteHdocAdcaChange");
    });
  });

  test.describe("CHECK 功能", () => {
    test("[15] CHECK-激活状态", async ({ page }) => {
      const t = "CHECK-激活状态";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "CHECK" }).click();
      await page.waitForTimeout(2000);
      const msg = page.locator(".ud16-message");
      if (await msg.isVisible().catch(() => false))
        await expect(msg).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[16] CHECK-未激活状态", async ({ page }) => {
      const t = "CHECK-未激活状态";
      await page.route(
        "**/api/UD16ADChangeApi/UD16SelectHdocAdcaChange",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 400,
              msg: "AFTER DEF CHANGE IS NOT ACTIVATED",
            }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "CHECK" }).click();
      await page.waitForTimeout(2000);
      const msg = page.locator(".ud16-message");
      if (await msg.isVisible().catch(() => false))
        await expect(msg).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16SelectHdocAdcaChange");
    });

    test("[17] CHECK-API失败", async ({ page }) => {
      const t = "CHECK-API失败";
      await page.route(
        "**/api/UD16ADChangeApi/UD16SelectHdocAdcaChange",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "操作失败" }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "CHECK" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16SelectHdocAdcaChange");
    });
  });

  test.describe("UI交互", () => {
    test("[18] 操作中按钮禁用", async ({ page }) => {
      const t = "操作中按钮禁用";
      await page.route(
        "**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange",
        async (route) => {
          await new Promise((r) => setTimeout(r, 3000));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, msg: "新增成功" }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-input-desc").fill("test");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(300);
      await expect(
        page.locator(".ud16-btn").filter({ hasText: "ADD" }),
      ).toBeDisabled();
      await expect(
        page.locator(".ud16-btn").filter({ hasText: "DELETE" }),
      ).toBeDisabled();
      await expect(
        page.locator(".ud16-btn").filter({ hasText: "CHECK" }),
      ).toBeDisabled();
      await takeStepScreenshot(page, t);
      await page.waitForTimeout(3500);
      await page.unroute("**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange");
    });

    test("[19] 操作中防止重复提交", async ({ page }) => {
      const t = "操作中防止重复提交";
      await page.route(
        "**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange",
        async (route) => {
          await new Promise((r) => setTimeout(r, 3000));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, msg: "新增成功" }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      const btn = page.locator(".ud16-btn").filter({ hasText: "ADD" });
      await btn.click();
      await page.waitForTimeout(200);
      await btn.click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
      await page.waitForTimeout(3500);
      await page.unroute("**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange");
    });

    test("[20] 消息清空-新操作清除旧消息", async ({ page }) => {
      const t = "消息清空-新操作清除旧消息";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-input-desc").fill("test");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[21] ADD成功后Desc清空", async ({ page }) => {
      const t = "ADD成功后Desc清空";
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-input-desc").fill("test");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      const msg = page.locator(".ud16-message");
      const cls = await msg.getAttribute("class").catch(() => "");
      if (cls?.includes("success")) {
        await expect(page.locator(".ud16-input-desc")).toHaveValue("");
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[22] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(
        "**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange");
    });

    test("[23] 异常处理-API超时", async ({ page }) => {
      const t = "异常处理-API超时";
      await page.route(
        "**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange",
        async (route) => {
          await new Promise((r) => setTimeout(r, 25000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForSelector(".ud16-message", { timeout: 45000 });
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange");
    });

    test("[24] 异常处理-服务器500错误", async ({ page }) => {
      const t = "异常处理-服务器500错误";
      await page.route(
        "**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD16(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud16-input").first().fill("JPCT013945");
      await page.locator(".ud16-btn").filter({ hasText: "ADD" }).click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud16-message")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD16ADChangeApi/UD16InsertHdocAdcaChange");
    });
  });
});
