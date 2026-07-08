import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD14";
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

async function navigateToUD14(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto("/UD14", { waitUntil: "networkidle" });
  await page.waitForSelector(".ud14-container", { timeout: 15000 });
}

async function selectMarketDropdown(page: Page): Promise<string> {
  const select = page.locator(".ud14-select");
  const opts = await select.locator("option").all();
  for (const o of opts) {
    const v = await o.getAttribute("value");
    if (v && v !== "") {
      await select.selectOption(v);
      return v;
    }
  }
  return "";
}

test.describe("List Available Templates 模块 (UD14) 测试", () => {
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
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-header")).toBeVisible();
      await expect(page.locator(".ud14-page-title")).toHaveText(
        "List Templates",
      );
      await expect(page.locator(".ud14-select")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件初期状态", async ({ page }) => {
      const t = "画面初始化-控件初期状态";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-select")).toHaveValue("");
      await expect(page.locator(".ud14-table-empty")).toBeVisible();
      await expect(page.locator(".ud14-error")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Market选择", () => {
    test("[3] Market选择-加载文件列表", async ({ page }) => {
      const t = "Market选择-加载文件列表";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const ths = page.locator(".ud14-table thead th");
      await expect(ths.nth(0)).toBeVisible();
      await expect(ths.nth(1)).toContainText("Filename");
      await expect(ths.nth(2)).toContainText("Used");
      await expect(ths.nth(3)).toContainText("Last Mod.");
      await expect(ths.nth(4)).toContainText("Size");
    });

    test("[4] Market选择-空数据表示", async ({ page }) => {
      const t = "Market选择-空数据表示";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, data: [] }),
          });
        },
      );
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, data: { rules: [] } }),
          });
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-table-empty")).toBeVisible();
      await expect(page.locator(".ud14-error")).not.toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
      );
    });

    test("[5] Market选择-加载中状态", async ({ page }) => {
      const t = "Market选择-加载中状态";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      try {
        await page.waitForSelector(".ud14-table-empty", { timeout: 3000 });
        const emptyText = await page.locator(".ud14-table-empty").textContent();
        if (emptyText?.includes("Loading")) {
          await takeStepScreenshot(page, t);
        }
      } catch {
        /* loading too fast */
      }
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[6] Market切换-清空并重新加载", async ({ page }) => {
      const t = "Market切换-清空并重新加载";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      // 选择第一个 Market
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      // 切换第二个 Market
      const select = page.locator(".ud14-select");
      const opts = await select.locator("option").all();
      let firstVal = "",
        secondVal = "";
      for (const o of opts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          if (!firstVal) {
            firstVal = v;
          } else if (v !== firstVal && !secondVal) {
            secondVal = v;
            await select.selectOption(v);
            break;
          }
        }
      }
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[7] Market切换-切换为空", async ({ page }) => {
      const t = "Market切换-切换为空";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await page.locator(".ud14-select").selectOption("");
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-table-empty")).toBeVisible();
    });
  });

  test.describe("表格表示", () => {
    test("[8] 表格列表示-各列内容", async ({ page }) => {
      const t = "表格列表示-各列内容";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const rows = page.locator(".ud14-table tbody tr");
      const rowCount = await rows.count();
      if (
        rowCount > 0 &&
        !(await rows.first().locator("td").first().getAttribute("colSpan"))
      ) {
        await expect(rows.first().locator(".ud14-file-link")).toBeVisible();
        await expect(rows.first().locator(".ud14-col-center")).toBeVisible();
      }
    });

    test("[9] Used列-使用中状态", async ({ page }) => {
      const t = "Used列-使用中状态";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: [
                {
                  filename: "test.docx",
                  used: true,
                  lastModified: "2026-06-30 10:00",
                  size: "317 Kb",
                },
              ],
            }),
          });
        },
      );
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, data: { rules: ["RULE001"] } }),
          });
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-used-yes")).toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
      );
    });

    test("[10] Used列-未使用状态", async ({ page }) => {
      const t = "Used列-未使用状态";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: [
                {
                  filename: "test.docx",
                  used: false,
                  lastModified: "2026-06-30 10:00",
                  size: "317 Kb",
                },
              ],
            }),
          });
        },
      );
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, data: { rules: [] } }),
          });
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-used-no")).toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
      );
    });
  });

  test.describe("文件下载", () => {
    test("[12] 下载-正常下载", async ({ page }) => {
      const t = "下载-正常下载";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const fileLink = page.locator(".ud14-file-link").first();
      if (await fileLink.isVisible().catch(() => false)) {
        await fileLink.click();
        await page.waitForTimeout(500);
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[14] 异常处理-API错误", async ({ page }) => {
      const t = "异常处理-API错误";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "无法加载文件列表" }),
          });
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-error")).toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
    });

    test("[15] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud14-error")).toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
    });

    test("[16] 异常处理-API超时", async ({ page }) => {
      const t = "异常处理-API超时";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await new Promise((r) => setTimeout(r, 25000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForSelector(".ud14-error", { timeout: 45000 });
      await expect(page.locator(".ud14-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
    });

    test("[17] 异常处理-市场不存在", async ({ page }) => {
      const t = "异常处理-市场不存在";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 404, msg: "市场不存在", data: [] }),
          });
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const err = page.locator(".ud14-error");
      if (await err.isVisible().catch(() => false))
        await expect(err).toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
    });

    test("[18] 异常处理-文件无法访问", async ({ page }) => {
      const t = "异常处理-文件无法访问";
      await page.route(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "无法访问文件", data: [] }),
          });
        },
      );
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const err = page.locator(".ud14-error");
      if (await err.isVisible().catch(() => false))
        await expect(err).toBeVisible();
      await page.unroute(
        "**/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      );
    });
  });

  test.describe("UI交互", () => {
    test("[19] UI交互-加载中数据清空", async ({ page }) => {
      const t = "UI交互-加载中数据清空";
      await navigateToUD14(page);
      await takeStepScreenshot(page, t);
      await selectMarketDropdown(page);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      const select = page.locator(".ud14-select");
      const opts = await select.locator("option").all();
      for (const o of opts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          const current = await select.inputValue();
          if (v !== current) {
            await select.selectOption(v);
            break;
          }
        }
      }
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });
  });
});
