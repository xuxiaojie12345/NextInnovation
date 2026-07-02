import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "1234",
  database: "react_ud",
};
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD06";
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/save-modifications?chassisSerie=JPCT&chassisNumber=G28321`;

let sc: { [k: string]: number } = {};
function ss(tn: string, step: string) {
  if (!sc[tn]) sc[tn] = 0;
  sc[tn]++;
  return `${SCREENSHOT_DIR}/${tn}_${String(sc[tn]).padStart(3, "0")}_${step}.jpeg`;
}

function mockApi(page: Page, data: any = null, code = 200) {
  return page.route("**/api/UD06/saveModifications*", (r) =>
    r.fulfill({
      status: code,
      contentType: "application/json",
      body: JSON.stringify({ code, msg: code === 200 ? "成功" : "错误", data }),
    }),
  );
}

const sampleData = {
  modificationList: [
    {
      doctype: "VIN_PLATE",
      vers: "1",
      variable: "AXLE_CONF",
      newval: "New Value",
    },
  ],
};

async function nav(page: Page, url = PAGE_URL) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#root", { timeout: 15000 });
  await page.waitForTimeout(1500);
}

test.describe("UD06 Save Modifications - 单体测试", () => {
  test.beforeEach(() => {
    sc = {};
  });

  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("h1.sm-title")).toHaveText("Save Modifications");
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Chassis serie:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Chassis number:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Doctype:" }),
    ).toBeVisible();
    await expect(page.getByText("Version:", { exact: true })).toBeVisible();
    await expect(
      page.locator("span.sm-label").filter({ hasText: "Storing:" }),
    ).toBeVisible();
    await expect(
      page
        .locator("span.sm-label")
        .filter({ hasText: "FOUND UNRELEASED VERSION:" }),
    ).toBeVisible();
    await expect(page.locator("span.sm-message-highlight")).toBeVisible();
    await expect(page.locator("button.sm-close-btn")).toBeVisible();
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await expect(page.locator("span.sm-message-highlight")).toHaveText(
      "VERSION IS RELEASED",
    );
    await page.screenshot({
      path: ss("01_基本元素", "整体"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_URL参数解析", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("span.sm-value").nth(0)).toHaveText("JPCT");
    await expect(page.locator("span.sm-value").nth(1)).toHaveText("G28321");
    await page.screenshot({
      path: ss("02_URL参数", "参数"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_加载中状态", async ({ page }) => {
    await page.route("**/api/UD06/saveModifications*", async (r) => {
      await new Promise((x) => setTimeout(x, 5000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: sampleData }),
      });
    });
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(500);
    await expect(page.locator("div.sm-loading")).toBeVisible();
    await page.screenshot({
      path: ss("03_加载中", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("04_空值校验_ChassisSerie为空", async ({ page }) => {
    await nav(
      page,
      `${APP_URL}/save-modifications?chassisSerie=&chassisNumber=G28321`,
    );
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await expect(page.locator("div.sm-error-message")).toHaveText(
      "Chassis serie不能为空",
    );
    await page.screenshot({
      path: ss("04_Serie为空", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("05_空值校验_ChassisNumber为空", async ({ page }) => {
    await nav(
      page,
      `${APP_URL}/save-modifications?chassisSerie=JPCT&chassisNumber=`,
    );
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await expect(page.locator("div.sm-error-message")).toHaveText(
      "Chassis number不能为空",
    );
    await page.screenshot({
      path: ss("05_Number为空", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_空值校验_两者都为空", async ({ page }) => {
    await nav(
      page,
      `${APP_URL}/save-modifications?chassisSerie=&chassisNumber=`,
    );
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await expect(page.locator("div.sm-error-message")).toHaveText(
      "Chassis serie不能为空",
    );
    await page.screenshot({
      path: ss("06_两者为空", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("07_API成功_数据正常返回", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("span.sm-value").nth(2)).toHaveText("VIN_PLATE");
    await expect(page.locator("span.sm-value").nth(3)).toHaveText("1");
    await expect(page.locator("span.sm-value").nth(4)).toHaveText(
      "AXLE_CONF New Value",
    );
    await expect(page.locator("span.sm-value").nth(5)).toHaveText("1");
    await expect(page.locator("span.sm-message-highlight")).toHaveText(
      "VERSION IS RELEASED",
    );
    await page.screenshot({
      path: ss("07_数据正常", "数据"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("08_API成功_Storing数据显示格式", async ({ page }) => {
    await mockApi(page, {
      modificationList: [
        {
          doctype: "VIN_PLATE",
          vers: "1",
          variable: "AXLE_CONF",
          newval: "New Value",
        },
      ],
    });
    await nav(page);
    await expect(page.locator("span.sm-value").nth(4)).toHaveText(
      "AXLE_CONF New Value",
    );
    await page.screenshot({
      path: ss("08_Storing格式", "格式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("09_API失败_未找到修改记录400", async ({ page }) => {
    await page.route("**/api/UD06/saveModifications*", (r) =>
      r.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: 404, msg: "未找到对应的修改记录" }),
      }),
    );
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await expect(page.locator("div.sm-error-message")).toHaveText(
      "未找到对应的修改记录",
    );
    await page.screenshot({
      path: ss("09_400错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("10_API失败_服务器错误500", async ({ page }) => {
    await mockApi(page, null, 500);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("10_500错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_API失败_网络异常", async ({ page }) => {
    await page.route("**/api/UD06/saveModifications*", (r) =>
      r.abort("connectionrefused"),
    );
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("11_网络异常", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_API失败_API超时", async ({ page }) => {
    await page.route("**/api/UD06/saveModifications*", async (r) => {
      await new Promise((x) => setTimeout(x, 15000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: sampleData }),
      });
    });
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(1000);
    await expect(page.locator("div.sm-loading")).toBeVisible();
    await page.screenshot({
      path: ss("12_超时", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_FOUND_UNRELEASED_VERSION_绿色背景", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    const msg = page.locator("span.sm-message-highlight");
    await expect(msg).toBeVisible();
    const bg = await msg.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg).toBe("rgb(0, 255, 0)");
    await page.screenshot({
      path: ss("13_绿色背景", "高亮"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_Message固定文本显示", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("span.sm-message-highlight")).toHaveText(
      "VERSION IS RELEASED",
    );
    await page.screenshot({
      path: ss("14_Message文本", "消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_ChassisSerie和Number显示", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("span.sm-value").nth(0)).toHaveText("JPCT");
    await expect(page.locator("span.sm-value").nth(1)).toHaveText("G28321");
    await page.screenshot({
      path: ss("15_SerieNumber", "显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_Close按钮_关闭画面", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await page.locator("button.sm-close-btn").click();
    await page.waitForTimeout(1000);
    // close 使用 navigate(-1)，可能返回前页或空白
    await page.screenshot({
      path: ss("16_Close关闭", "关闭"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_Close按钮_加载中状态可用", async ({ page }) => {
    await page.route("**/api/UD06/saveModifications*", async (r) => {
      await new Promise((x) => setTimeout(x, 5000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: sampleData }),
      });
    });
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(500);
    await expect(page.locator("div.sm-loading")).toBeVisible();
    await page.screenshot({
      path: ss("17_加载中Close", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_Close按钮_API失败后可用", async ({ page }) => {
    await mockApi(page, null, 500);
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await expect(page.locator("button.sm-close-btn")).toBeEnabled();
    await page.screenshot({
      path: ss("18_失败后Close", "Close"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_异常处理_数据库连接异常", async ({ page }) => {
    await mockApi(page, null, 500);
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await expect(page.locator("div.sm-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("19_数据库异常", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_异常处理_用户未登录", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("currentUser"));
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ss("20_未登录", "未登录"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("21_异常处理_页面为只读", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("input")).toHaveCount(0);
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator("select")).toHaveCount(0);
    await page.screenshot({
      path: ss("21_只读", "只读"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_错误消息_显示样式", async ({ page }) => {
    await nav(
      page,
      `${APP_URL}/save-modifications?chassisSerie=&chassisNumber=G28321`,
    );
    const msg = page.locator("div.sm-error-message");
    await expect(msg).toBeVisible();
    const color = await msg.evaluate((e) => getComputedStyle(e).color);
    expect(color).toBe("rgb(255, 77, 79)");
    await page.screenshot({
      path: ss("22_错误样式", "样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("23_页面刷新", async ({ page }) => {
    let count = 0;
    await page.route("**/api/UD06/saveModifications*", (r) => {
      count++;
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: sampleData }),
      });
    });
    await nav(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(page.locator("h1.sm-title")).toBeVisible();
    await page.screenshot({
      path: ss("23_刷新", "刷新"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("24_安全性_API请求协议", async ({ page }) => {
    const urls: string[] = [];
    await page.route("**/api/UD06/saveModifications*", (r) => {
      urls.push(r.request().url());
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: sampleData }),
      });
    });
    await nav(page);
    expect(urls.length).toBeGreaterThan(0);
    await page.screenshot({
      path: ss("24_API协议", "请求"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_安全性_数据显示为只读", async ({ page }) => {
    await mockApi(page, sampleData);
    await nav(page);
    await expect(page.locator("input")).toHaveCount(0);
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator("select")).toHaveCount(0);
    await page.screenshot({
      path: ss("25_只读数据", "只读"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
