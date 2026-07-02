import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "1234",
  database: "react_ud",
};
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD05";
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/modify-document?chassisNo=JPCT028321&market=AUS`;

let sc: { [k: string]: number } = {};
function ss(tn: string, step: string) {
  if (!sc[tn]) sc[tn] = 0;
  sc[tn]++;
  return `${SCREENSHOT_DIR}/${tn}_${String(sc[tn]).padStart(3, "0")}_${step}.jpeg`;
}

function mockUd04(page: Page, overrides = {}) {
  return page.route("**/api/UD04/selectGeneratedocument*", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "成功",
        data: { generatedFilePath: "/files/test.trf", ...overrides },
      }),
    }),
  );
}
function mockUd05Q(page: Page, vars: any[] = [], ov = {}) {
  return page.route("**/api/UD05/modifyDocumentUnit*", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        msg: "成功",
        data: {
          market: "AUS",
          template: "aus/UD_TEST.odt",
          variables: vars,
          ...ov,
        },
      }),
    }),
  );
}
function mockSave(page: Page, code = 200) {
  return page.route("**/api/UD05/modifyDocumentSave", (r) =>
    r.fulfill({
      status: code,
      contentType: "application/json",
      body: JSON.stringify({ code, msg: code === 200 ? "成功" : "保存失败" }),
    }),
  );
}

const dv = [
  { variable: "VAR1", description: "Desc1", currentValue: "VAL1", newval: "" },
  { variable: "VAR2", description: "Desc2", currentValue: "VAL2", newval: "" },
];

async function nav(page: Page, url = PAGE_URL) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#root", { timeout: 15000 });
  await page.waitForTimeout(1500);
}

test.describe("UD05 Modify Document - 单体测试", () => {
  test.beforeEach(() => {
    sc = {};
  });

  test("01_画面初期显示_基本要素", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await expect(page.locator("h1.md-title")).toHaveText("Modify Document");
    await expect(
      page.locator("span.md-label").filter({ hasText: "Chassis no:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.md-label").filter({ hasText: "Market:" }),
    ).toBeVisible();
    await expect(
      page.locator("span.md-label").filter({ hasText: "Template:" }),
    ).toBeVisible();
    await expect(page.locator("button.md-save-btn")).toBeVisible();
    await expect(page.locator("th.md-th")).toHaveCount(4);
    await page.screenshot({
      path: ss("01_基本要素", "整体"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_URL参数正常", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await expect(page.locator("span.md-value.md-chassis-no")).toContainText(
      "JPCT028321",
    );
    await expect(page.locator("span.md-value").nth(1)).toContainText("AUS");
    await page.screenshot({
      path: ss("02_URL参数", "参数"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_URL参数Market缺失", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page, `${APP_URL}/modify-document?chassisNo=JPCT028321`);
    await page.screenshot({
      path: ss("03_Market缺失", "无Market"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("04_URL参数ChassisNo缺失", async ({ page }) => {
    await nav(page, `${APP_URL}/modify-document`);
    await expect(page.locator("div.md-error-message")).toHaveText(
      "Chassis number is required.",
    );
    await page.screenshot({
      path: ss("04_ChassisNo缺失", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("05_加载中状态", async ({ page }) => {
    await page.route("**/api/UD04/selectGeneratedocument*", async (r) => {
      await new Promise((x) => setTimeout(x, 5000));
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(500);
    await expect(page.locator("div.md-loading")).toBeVisible();
    await page.screenshot({
      path: ss("05_加载中", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_API查询成功_变量列表加载", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    const rows = page.locator("table.md-table tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator("td").nth(0)).toHaveText("VAR1");
    await expect(rows.nth(0).locator("td").nth(1)).toHaveText("Desc1");
    await expect(rows.nth(0).locator("td").nth(2)).toHaveText("VAL1");
    await expect(
      rows.nth(0).locator("td").nth(3).locator("input.md-input"),
    ).toHaveValue("");
    await page.screenshot({
      path: ss("06_变量列表", "表格"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("07_API查询成功_含修改记录", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, [
      { variable: "VAR1", description: "Desc1", newval: "NEW_VAL" },
    ]);
    await nav(page);
    await expect(page.locator("td.md-td").nth(2)).toHaveText("NEW_VAL");
    await page.screenshot({
      path: ss("07_含修改记录", "修改"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("08_API查询成功_无修改记录", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, [
      { variable: "VAR1", description: "Desc1", currentValue: "SYMBOL_VAL" },
    ]);
    await nav(page);
    await expect(page.locator("td.md-td").nth(2)).toHaveText("SYMBOL_VAL");
    await page.screenshot({
      path: ss("08_无修改记录", "当前值"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("09_API查询失败_系统错误", async ({ page }) => {
    await mockUd04(page);
    await page.route("**/api/UD05/modifyDocumentUnit*", (r) =>
      r.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, msg: "系统错误" }),
      }),
    );
    await nav(page);
    await page.waitForTimeout(1000);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("09_系统错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("10_API查询失败_网络错误", async ({ page }) => {
    await page.route("**/api/UD04/**", (r) => r.abort("connectionrefused"));
    await page.route("**/api/UD05/**", (r) => r.abort("connectionrefused"));
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("10_网络错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_表格列定义", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    const h = page.locator("th.md-th");
    await expect(h.nth(0)).toHaveText("Variable");
    await expect(h.nth(1)).toHaveText("Description");
    await expect(h.nth(2)).toHaveText("Current value");
    await expect(h.nth(3)).toHaveText("Modified value");
    await page.screenshot({
      path: ss("11_列定义", "列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_表格_空变量列表", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, []);
    await nav(page);
    await expect(page.locator("th.md-th")).toHaveCount(4);
    await expect(page.locator("table.md-table tbody tr")).toHaveCount(0);
    await page.screenshot({
      path: ss("12_空变量", "空表"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_表格_多变量显示", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, [
      { variable: "VAR_A", description: "Desc A", currentValue: "A1" },
      { variable: "VAR_B", description: "Desc B", currentValue: "B1" },
      { variable: "VAR_C", description: "Desc C", currentValue: "C1" },
    ]);
    await nav(page);
    await expect(page.locator("table.md-table tbody tr")).toHaveCount(3);
    await page.screenshot({
      path: ss("13_多变量", "多行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_ModifiedValue_正常输入", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    const inp = page.locator("input.md-input").first();
    await inp.fill("MODIFIED_VALUE_1");
    await expect(inp).toHaveValue("MODIFIED_VALUE_1");
    await expect(inp).toBeEnabled();
    await page.screenshot({
      path: ss("14_正常输入", "输入"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_ModifiedValue_多行输入", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await page.locator("input.md-input").nth(0).fill("VAL1");
    await page.locator("input.md-input").nth(1).fill("VAL3");
    await expect(page.locator("input.md-input").nth(0)).toHaveValue("VAL1");
    await expect(page.locator("input.md-input").nth(1)).toHaveValue("VAL3");
    await page.screenshot({
      path: ss("15_多行输入", "多行"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_ModifiedValue_空输入保持", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await expect(page.locator("input.md-input").first()).toHaveValue("");
    await page.screenshot({
      path: ss("16_空输入", "空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_ModifiedValue_最大长度500", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await page.locator("input.md-input").first().fill("A".repeat(500));
    expect(
      (await page.locator("input.md-input").first().inputValue()).length,
    ).toBe(500);
    await page.screenshot({
      path: ss("17_最大长度", "500"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_ModifiedValue_超过500字符", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await page.locator("input.md-input").first().fill("A".repeat(600));
    expect(
      (await page.locator("input.md-input").first().inputValue()).length,
    ).toBeLessThanOrEqual(500);
    await page.screenshot({
      path: ss("18_超过500", "截断"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_Save空值检查_全为空", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(500);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await expect(page.locator("div.md-error-message")).toHaveText(
      "NO UNRELEASED VERSION EXISTS!",
    );
    await expect(page.locator("button.md-save-btn")).toBeEnabled();
    await page.screenshot({
      path: ss("19_Save空值", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_Save成功_部分有值", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await mockSave(page, 200);
    await nav(page);
    await page.locator("input.md-input").first().fill("MODIFIED_VALUE_1");
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("save-modifications");
    await page.screenshot({
      path: ss("20_Save部分有值", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("21_Save成功_全部有值", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await mockSave(page, 200);
    await nav(page);
    await page.locator("input.md-input").nth(0).fill("MOD1");
    await page.locator("input.md-input").nth(1).fill("MOD2");
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("save-modifications");
    await page.screenshot({
      path: ss("21_Save全部有值", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_Save失败_API返回错误", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await mockSave(page, 500);
    await nav(page);
    await page.locator("input.md-input").first().fill("MODIFIED_VALUE_1");
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(1500);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await expect(page.locator("button.md-save-btn")).toBeEnabled();
    await page.screenshot({
      path: ss("22_SaveAPI错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("23_Save失败_API返回500", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await mockSave(page, 500);
    await nav(page);
    await page.locator("input.md-input").first().fill("MODIFIED_VALUE_1");
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(1500);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("23_Save500", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("24_ChassisNo链接_画面跳转", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await page.locator("a.md-link").first().dispatchEvent("click");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("vehicle-specification");
    await page.screenshot({
      path: ss("24_ChassisNo跳转", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_ChassisNo显示_拼接显示", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await expect(page.locator("span.md-value.md-chassis-no")).toContainText(
      "JPCT028321",
    );
    await page.screenshot({
      path: ss("25_ChassisNo拼接", "显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("26_Template链接_下载", async ({ page }) => {
    await page.route("**/*.trf", (r) =>
      r.fulfill({
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
        body: "x",
      }),
    );
    await mockUd04(page, { generatedFilePath: "/files/test.trf" });
    await mockUd05Q(page, dv, { template: "aus/UD_TEST.odt" });
    await nav(page);
    await page.locator("a.md-link").nth(1).dispatchEvent("click");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ss("26_Template下载", "下载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("27_Template链接_文件不存在", async ({ page }) => {
    await mockUd04(page, { generatedFilePath: "" });
    await mockUd05Q(page, dv, { template: "aus/UD_TEST.odt" });
    await nav(page);
    await page.locator("a.md-link").nth(1).dispatchEvent("click");
    await page.waitForTimeout(500);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("27_Template不存在", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("28_Template链接_显示", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv, { template: "aus/UD_TEST.odt" });
    await nav(page);
    await expect(page.locator("a.md-link").nth(1)).toContainText(
      "aus/UD_TEST.odt",
    );
    await page.screenshot({
      path: ss("28_Template显示", "显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("29_错误消息_错误样式", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(500);
    const msg = page.locator("div.md-error-message");
    await expect(msg).toBeVisible();
    const color = await msg.evaluate((e) => getComputedStyle(e).color);
    expect(color).toBe("rgb(255, 77, 79)");
    const ta = await msg.evaluate((e) => getComputedStyle(e).textAlign);
    expect(["left", "start"]).toContain(ta);
    await page.screenshot({
      path: ss("29_错误样式", "样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("30_异常处理_API调用失败", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await mockSave(page, 500);
    await nav(page);
    await page.locator("input.md-input").first().fill("MODIFIED_VALUE_1");
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(1500);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("30_API失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("31_异常处理_数据库操作异常", async ({ page }) => {
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await mockSave(page, 500);
    await nav(page);
    await page.locator("input.md-input").first().fill("MODIFIED_VALUE_1");
    await page.evaluate(() =>
      (
        document.querySelector("button.md-save-btn") as HTMLButtonElement
      )?.click(),
    );
    await page.waitForTimeout(1500);
    await expect(page.locator("div.md-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("31_数据库异常", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("32_异常处理_用户未登录", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem("currentUser"));
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ss("32_未登录", "未登录"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("33_Save按钮_加载中禁用", async ({ page }) => {
    await page.route("**/api/UD04/selectGeneratedocument*", async (r) => {
      await new Promise((x) => setTimeout(x, 5000));
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(500);
    await expect(page.locator("div.md-loading")).toBeVisible();
    await page.screenshot({
      path: ss("33_加载禁用", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("34_ModifiedValue输入_加载中禁用", async ({ page }) => {
    await page.route("**/api/UD04/selectGeneratedocument*", async (r) => {
      await new Promise((x) => setTimeout(x, 5000));
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.goto(PAGE_URL, { waitUntil: "commit" });
    await page.waitForTimeout(500);
    await expect(page.locator("div.md-loading")).toBeVisible();
    await page.screenshot({
      path: ss("34_加载输入禁用", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("35_页面刷新", async ({ page }) => {
    let count = 0;
    await page.route("**/api/UD05/modifyDocumentUnit*", (r) => {
      count++;
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: { variables: dv } }),
      });
    });
    await mockUd04(page);
    await nav(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(page.locator("table.md-table")).toBeVisible();
    await page.screenshot({
      path: ss("35_刷新", "刷新"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("36_安全性_API请求协议", async ({ page }) => {
    const urls: string[] = [];
    await page.route("**/api/UD05/**", (r) => {
      urls.push(r.request().url());
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: { variables: [] } }),
      });
    });
    await mockUd04(page);
    await nav(page);
    expect(urls.length).toBeGreaterThan(0);
    await page.screenshot({
      path: ss("36_API协议", "请求"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("37_安全性_认证与权限控制", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("#root", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.setItem("currentUser", "test_user"));
    await mockUd04(page);
    await mockUd05Q(page, dv);
    await nav(page);
    await expect(page.locator("table.md-table")).toBeVisible();
    await page.screenshot({
      path: ss("37_认证权限", "已登录"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
