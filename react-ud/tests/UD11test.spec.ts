import { test, expect, Page } from "@playwright/test";

const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD11";
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-variables-result-list`;

let sc: { [key: string]: number } = {};
function ss(n: string, s: string): string {
  if (!sc[n]) sc[n] = 0;
  sc[n]++;
  return `${SCREENSHOT_DIR}/${n}_${String(sc[n]).padStart(3, "0")}_${s}.jpeg`;
}

const MOCK = {
  code: 200,
  msg: "success",
  data: [
    {
      variable: "FTLI",
      type: "VDA",
      description: "Fuel Tank Level Indicator",
      createdByUser: "user1",
      date: "2026-01-15 10:00:00",
    },
    {
      variable: "ABS",
      type: "User Defined",
      description: "ABS Config",
      createdByUser: "user2",
      date: "2026-02-20 11:00:00",
    },
    {
      variable: "VIN",
      type: "VDA",
      description: "VIN Plate",
      createdByUser: "user1",
      date: "2026-03-10 09:00:00",
    },
  ],
};
const EMPTY = { code: 200, msg: "success", data: [] };
const ERR = { code: 500, msg: "System error", data: null };

async function mockSearch(p: Page, d: unknown) {
  await p.route("**/api/ud10Hdocvariables/search", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(d),
    }),
  );
}

async function goto(p: Page) {
  await p
    .goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 30000 })
    .catch(() => {});
  await p
    .waitForSelector(".hvrl-container", { timeout: 15000 })
    .catch(() => {});
  await p.waitForTimeout(1000);
}

function waitContainer(p: Page) {
  return p
    .waitForSelector(".hvrl-container", { timeout: 15000 })
    .catch(() => {});
}

test.beforeEach(() => {
  sc = {};
});

test.describe("画面初期化", () => {
  test("01_基本元素", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toHaveText(
      "Existing HDoc Variables",
    );
    await expect(
      page.getByRole("button", { name: "Select", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Back", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Print", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Down", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Excel", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".hvrl-count")).toBeVisible();
    await page.screenshot({
      path: ss("01_基本元素", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_搜索结果加载", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-table")).toBeVisible();
    await expect(page.locator(".hvrl-count")).toContainText("3");
    await page.screenshot({
      path: ss("02_搜索结果加载", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_无匹配数据", async ({ page }) => {
    await mockSearch(page, EMPTY);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-no-data")).toBeVisible();
    await expect(page.locator(".hvrl-no-data")).toHaveText("No records found");
    await expect(page.locator(".hvrl-count")).toHaveText(
      "Number of lines found: 0",
    );
    await page.screenshot({
      path: ss("03_无匹配数据", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("04_服务器错误", async ({ page }) => {
    await mockSearch(page, ERR);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-no-data")).toBeVisible();
    await expect(page.locator(".hvrl-count")).toHaveText(
      "Number of lines found: 0",
    );
    await page.screenshot({
      path: ss("04_服务器错误", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("05_网络异常", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/search", (r) =>
      r.abort("connectionrefused"),
    );
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Failed to fetch",
    );
    await page.screenshot({
      path: ss("05_网络异常", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Select选择", () => {
  test("06_未选择时点击", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Please select a record.",
    );
    await page.screenshot({
      path: ss("06_未选择时点击", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("07_已选择时点击", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    // 监听导航，点击 Select 后应跳转到前画面
    await Promise.all([
      page.waitForURL("**/hdoc-variables**", { timeout: 10000 }),
      page.getByRole("button", { name: "Select", exact: true }).click(),
    ]);
    expect(page.url()).toContain("hdoc-variables");
    await page.screenshot({
      path: ss("07_已选择时点击", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Down跳转", () => {
  test("08_未选择时点击Down", async ({ page }) => {
    await mockSearch(page, EMPTY);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Down", exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "No data to export.",
    );
    await page.screenshot({
      path: ss("08_未选择时点击Down", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("09_有数据时点击Down", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Down", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ss("09_有数据时点击Down", "导出"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Back返回", () => {
  test("10_返回前画面", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await Promise.all([
      page.waitForURL("**/hdoc-variables**", { timeout: 10000 }),
      page.getByRole("button", { name: "Back", exact: true }).click(),
    ]);
    expect(page.url()).toContain("hdoc-variables");
    await page.screenshot({
      path: ss("10_返回前画面", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Print打印", () => {
  test("11_打印搜索结果", async ({ page }) => {
    let called = false;
    await page.exposeFunction("onPrint", () => {
      called = true;
    });
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const w = window;
      w.print = () => {
        (w as any).onPrint?.();
      };
    });
    await page.getByRole("button", { name: "Print", exact: true }).click();
    await page.waitForTimeout(500);
    expect(called).toBeTruthy();
    await page.screenshot({
      path: ss("11_打印搜索结果", "打印"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Excel导出", () => {
  test("12_导出成功", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Excel", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ss("12_导出成功", "导出"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_导出失败_无数据", async ({ page }) => {
    await mockSearch(page, EMPTY);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Excel", exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "No data to export.",
    );
    await page.screenshot({
      path: ss("13_导出失败_无数据", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("DataTable", () => {
  test("14_列标题", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-th")).toHaveCount(5);
    await expect(page.locator(".hvrl-th").nth(0)).toHaveText("*Variable");
    await expect(page.locator(".hvrl-th").nth(1)).toHaveText("Type");
    await expect(page.locator(".hvrl-th").nth(2)).toHaveText("Description");
    await expect(page.locator(".hvrl-th").nth(3)).toHaveText(
      "Created by user(Automatic)",
    );
    await expect(page.locator(".hvrl-th").nth(4)).toHaveText("Date(Automatic)");
    await page.screenshot({
      path: ss("14_列标题", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_单选功能", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await expect(page.locator("input[type='radio']").first()).toBeChecked();
    await page.screenshot({
      path: ss("15_单选功能", "选择"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_CreatedByUser链接", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    const links = page.locator(".hvrl-link a");
    await expect(links.first()).toBeVisible();
    await expect(links.first()).toHaveAttribute("href", "#");
    await page.screenshot({
      path: ss("16_CreatedByUser链接", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_Count计数", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-count")).toHaveText(
      "Number of lines found: 3",
    );
    await page.screenshot({
      path: ss("17_Count计数", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("异常处理", () => {
  test("18_API超时", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/search", async (r) => {
      await new Promise((r2) => setTimeout(r2, 12000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK),
      });
    });
    await goto(page);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: ss("18_API超时", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_JSON解析失败", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/search", (r) => {
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: "invalid json",
      });
    });
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Unexpected token 'i', \"invalid json\" is not valid JSON",
    );
    await page.screenshot({
      path: ss("19_JSON解析失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_用户未登录", async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toBeVisible();
    await page.screenshot({
      path: ss("20_用户未登录", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("UI交互", () => {
  test("21_加载中禁用", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/search", async (r) => {
      await new Promise((r2) => setTimeout(r2, 5000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK),
      });
    });
    await goto(page);
    await expect(page.locator(".hvrl-loading")).toBeVisible({ timeout: 3000 });
    await page.screenshot({
      path: ss("21_加载中禁用", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_错误消息样式", async ({ page }) => {
    await page.route("**/api/ud10Hdocvariables/search", (r) =>
      r.abort("connectionrefused"),
    );
    await goto(page);
    await page.waitForTimeout(2000);
    const msg = page.locator(".hvrl-error-message");
    await expect(msg).toBeVisible();
    expect(await msg.evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(198, 40, 40)",
    );
    await page.screenshot({
      path: ss("22_错误消息样式", "样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("23_页面刷新", async ({ page }) => {
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-count")).toContainText("3");
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toBeVisible();
    await page.screenshot({
      path: ss("23_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("安全性", () => {
  test("24_API请求协议", async ({ page }) => {
    const urls: string[] = [];
    await page.route("**/api/ud10Hdocvariables/**", (r) => {
      urls.push(r.request().url());
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK),
      });
    });
    await goto(page);
    await page.waitForTimeout(1500);
    for (const u of urls) {
      expect(u).not.toContain("password");
      expect(u).not.toContain("secret");
    }
    await page.screenshot({
      path: ss("24_API请求协议", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_用户登录认证", async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockSearch(page, MOCK);
    await goto(page);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toBeVisible();
    await page.screenshot({
      path: ss("25_用户登录认证", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
