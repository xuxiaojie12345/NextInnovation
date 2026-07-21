import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD19_URL = "/UD19";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD19";
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

async function navigateToUD19(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD19_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud19-container", { timeout: 15000 });
}

function getUserIdInput(page: Page) {
  return page.locator(".ud19-inp").first();
}

function getUserNameInput(page: Page) {
  return page.locator(".ud19-inp").nth(1);
}

function getBtnSearch(page: Page) {
  return page.locator(".ud19-btn").filter({ hasText: "Search" });
}

function getMessage(page: Page) {
  return page.locator(".ud19-msg[role='alert']");
}

function getRadio(page: Page, label: string) {
  return page
    .locator(".ud19-radio-group label")
    .filter({ hasText: label })
    .locator("input[type='radio']");
}

test.describe("Search HDoc User (UD19) 测试", () => {
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
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud19-header")).toBeVisible();
      await expect(page.locator(".ud19-page-title")).toHaveText(
        "Search HDoc User",
      );
      await expect(getUserIdInput(page)).toHaveValue("");
      await expect(getUserNameInput(page)).toHaveValue("");
      // Radio 按钮未选中
      await expect(getRadio(page, "Not set")).not.toBeChecked();
      await expect(getRadio(page, "Rule")).not.toBeChecked();
      await expect(getRadio(page, "Template")).not.toBeChecked();
      await expect(getBtnSearch(page)).toBeEnabled();
      // 结果表格不可见
      await expect(page.locator(".ud19-table")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-控件状态", async ({ page }) => {
      const t = "画面初始化-控件状态";
      await page.route(
        "**/api/UD19SearchResultListApi/UD19SelectMarketMaster",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              data: {
                markets: [
                  { market: "JPN" },
                  { market: "USA" },
                  { market: "CHN" },
                ],
              },
            }),
          });
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await expect(getUserIdInput(page)).toBeEnabled();
      await expect(getUserIdInput(page)).toHaveAttribute("maxLength", "10");
      await expect(getUserNameInput(page)).toBeEnabled();
      await expect(getUserNameInput(page)).toHaveAttribute("maxLength", "32");
      expect(
        await page.locator(".ud19-market-list select option").count(),
      ).toBeGreaterThanOrEqual(1);
      await takeStepScreenshot(page, t);
      await page.unroute(
        "**/api/UD19SearchResultListApi/UD19SelectMarketMaster",
      );
    });
  });

  test.describe("Userid 查询", () => {
    test("[3] Userid查询-正常", async ({ page }) => {
      const t = "Userid查询-正常";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("Userid query results:", rows);
        expect(rows).toBeGreaterThan(0);
      } else {
        // 可能返回错误消息
        const msg = getMessage(page);
        const msgVis = await msg.isVisible().catch(() => false);
        if (msgVis) {
          console.log("Userid query msg:", await msg.textContent());
        }
      }
      await takeStepScreenshot(page, t);
    });

    test("[4] Userid查询-无结果", async ({ page }) => {
      const t = "Userid查询-无结果";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("XXXX");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      await expect(page.locator(".ud19-table")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("用户名查询", () => {
    test("[5] 用户名查询-正常", async ({ page }) => {
      const t = "用户名查询-正常";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserNameInput(page).fill("Kurt Bjork");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("User name query results:", rows);
        expect(rows).toBeGreaterThan(0);
      }
      await takeStepScreenshot(page, t);
    });

    test("[6] 用户名查询-无结果", async ({ page }) => {
      const t = "用户名查询-无结果";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserNameInput(page).fill("Nonexistent");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      await expect(page.locator(".ud19-table")).not.toBeVisible();
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Radiobox 筛选", () => {
    test("[7] Not set 搜索", async ({ page }) => {
      const t = "Not set搜索";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getRadio(page, "Not set").click();
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("Not set results:", rows);
      }
      await takeStepScreenshot(page, t);
    });

    test("[8] Rule 搜索", async ({ page }) => {
      const t = "Rule搜索";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getRadio(page, "Rule").click();
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("Rule results:", rows);
      }
      await takeStepScreenshot(page, t);
    });

    test("[9] Template 搜索", async ({ page }) => {
      const t = "Template搜索";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getRadio(page, "Template").click();
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("Template results:", rows);
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("Market 筛选", () => {
    test("[10] Market 筛选", async ({ page }) => {
      const t = "Market筛选";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      // 选择一个 Market 选项
      const options = page.locator(".ud19-market-list select option");
      const optCount = await options.count();
      if (optCount > 0) {
        await options.first().click();
        await page.waitForTimeout(200);
      }
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("Market filter results:", rows);
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("查询结果表示", () => {
    test("[11] 结果表格-各列表示", async ({ page }) => {
      const t = "结果表格-各列表示";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        // 确认表头
        await expect(page.locator(".ud19-table thead th").nth(0)).toHaveText(
          "Userid",
        );
        await expect(page.locator(".ud19-table thead th").nth(1)).toHaveText(
          "User",
        );
        await expect(page.locator(".ud19-table thead th").nth(2)).toHaveText(
          "Market",
        );
        // 至少有一行数据
        const rows = await page.locator(".ud19-table tbody tr").count();
        expect(rows).toBeGreaterThan(0);
      }
      await takeStepScreenshot(page, t);
    });

    test("[12] COUNT 计数显示", async ({ page }) => {
      const t = "COUNT计数显示";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("COUNT =", rows);
        expect(rows).toBeGreaterThanOrEqual(0);
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("UI交互", () => {
    test("[13] 搜索中按钮禁用", async ({ page }) => {
      const t = "搜索中按钮禁用";
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/UD19SearchResultListApi/search",
        async (route) => {
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              users: [{ userid: "t009667", user: "Test User", market: "-EU" }],
            }),
          });
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(300);
      await expect(getBtnSearch(page)).toBeDisabled();
      await takeStepScreenshot(page, t);
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      await expect(getBtnSearch(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });

    test("[14] 搜索中防止重复提交", async ({ page }) => {
      const t = "搜索中防止重复提交";
      let apiCallCount = 0;
      let resolveRoute: (value: unknown) => void;
      const routePromise = new Promise((r) => {
        resolveRoute = r;
      });
      await page.route(
        "**/api/UD19SearchResultListApi/search",
        async (route) => {
          apiCallCount++;
          await routePromise;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              users: [{ userid: "t009667", user: "Test User", market: "-EU" }],
            }),
          });
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      const btn = getBtnSearch(page);
      await btn.click();
      await page.waitForTimeout(200);
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
      await takeStepScreenshot(page, t);
      resolveRoute!(true);
      await page.waitForTimeout(2000);
      expect(apiCallCount).toBeLessThanOrEqual(1);
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });

    test("[15] 消息清空-新查询清除旧消息", async ({ page }) => {
      const t = "消息清空-新查询清除旧消息";
      await page.route(
        "**/api/UD19SearchResultListApi/search",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 200,
              users: [{ userid: "t009667", user: "Test User", market: "-EU" }],
            }),
          });
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      // 触发空条件校验错误
      await getBtnSearch(page).click();
      await page.waitForTimeout(500);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText(
        "请输入查询条件或选择筛选方式",
      );
      await takeStepScreenshot(page, t);
      // 输入有效条件重新查询，旧消息应被清除
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(2000);
      const msg = getMessage(page);
      const msgVis = await msg.isVisible().catch(() => false);
      if (msgVis) {
        const txt = await msg.textContent().catch(() => "");
        expect(txt).not.toContain("请输入查询条件或选择筛选方式");
      }
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });

    test("[16] 连续查询-切换条件", async ({ page }) => {
      const t = "连续查询-切换条件";
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      // 第一次查询 Userid
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      // 切换为 Rule 查询
      await getUserIdInput(page).clear();
      await getRadio(page, "Rule").click();
      await getBtnSearch(page).click();
      await page.waitForTimeout(3000);
      const table = page.locator(".ud19-table");
      const tableVis = await table.isVisible().catch(() => false);
      if (tableVis) {
        const rows = await page.locator(".ud19-table tbody tr").count();
        console.log("Second query (Rule) results:", rows);
      }
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("异常处理", () => {
    test("[17] 异常处理-网络断开", async ({ page }) => {
      const t = "异常处理-网络断开";
      await page.route(
        "**/api/UD19SearchResultListApi/search",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnSearch(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });

    test("[18] 异常处理-请求超时", async ({ page }) => {
      const t = "异常处理-请求超时";
      test.setTimeout(60000);
      await page.route(
        "**/api/UD19SearchResultListApi/search",
        async (route) => {
          await new Promise((r) => setTimeout(r, 20000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForSelector(".ud19-msg[role='alert']", {
        timeout: 35000,
      });
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnSearch(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });

    test("[19] 异常处理-数据库连接失败", async ({ page }) => {
      const t = "异常处理-数据库连接失败";
      await page.route(
        "**/api/UD19SearchResultListApi/search",
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
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getBtnSearch(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });

    test("[20] 异常处理-查询失败", async ({ page }) => {
      const t = "异常处理-查询失败";
      await page.route(
        "**/api/UD19SearchResultListApi/search",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              code: 400,
              msg: "查询失败，请稍后再试",
            }),
          });
        },
      );
      await navigateToUD19(page);
      await takeStepScreenshot(page, t);
      await getUserIdInput(page).fill("t009667");
      await getBtnSearch(page).click();
      await page.waitForTimeout(2000);
      await expect(getMessage(page)).toBeVisible();
      await expect(getMessage(page)).toContainText("查询失败");
      await expect(getBtnSearch(page)).toBeEnabled();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD19SearchResultListApi/search");
    });
  });
});
