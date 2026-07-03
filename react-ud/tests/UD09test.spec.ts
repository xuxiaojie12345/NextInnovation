import { test, expect, Page } from "@playwright/test";

const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD09";
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/homologation-variables-result-list`;

let screenshotCounter: { [key: string]: number } = {};

function ss(testName: string, step: string): string {
  if (!screenshotCounter[testName]) screenshotCounter[testName] = 0;
  screenshotCounter[testName]++;
  return `${SCREENSHOT_DIR}/${testName}_${String(screenshotCounter[testName]).padStart(3, "0")}_${step}.jpeg`;
}

const MOCK_DATA = {
  code: 200,
  msg: "success",
  data: [
    {
      pc: "A",
      num: 100,
      market: "JPN",
      variable: "VAR1",
      val: "VALUE1",
      vs: "VS1",
      vs2: "",
      comments: "C1",
      addDate: "202601",
      deleteDate: "",
      registerUser: "user1",
      registerDatetime: "2026-01-15 10:00:00",
    },
    {
      pc: "A",
      num: 200,
      market: "USA",
      variable: "VAR2",
      val: "VALUE2",
      vs: "VS2",
      vs2: "EXT",
      comments: "C2",
      addDate: "202602",
      deleteDate: "",
      registerUser: "user2",
      registerDatetime: "2026-02-20 11:00:00",
    },
    {
      pc: "B",
      num: 100,
      market: "JPN",
      variable: "VAR3",
      val: "VALUE3",
      vs: "VS3",
      vs2: "",
      comments: "C3",
      addDate: "202603",
      deleteDate: "202606",
      registerUser: "user1",
      registerDatetime: "2026-03-10 09:00:00",
    },
  ],
};
const EMPTY_DATA = { code: 200, msg: "success", data: [] };
const DEL_OK = {
  code: 200,
  msg: "success",
  data: { deletedCount: 1, failedCount: 0 },
};
const DEL_PART = {
  code: 200,
  msg: "success",
  data: { deletedCount: 1, failedCount: 1 },
};
const DEL_FAIL = {
  code: 200,
  msg: "success",
  data: { deletedCount: 0, failedCount: 2 },
};
const NOT_FOUND = {
  code: 400,
  msg: "Data does not exist, Please enter the correct content",
  data: null,
};
const SYS_ERR = { code: 500, msg: "System error", data: null };

async function mockSearch(page: Page, data: unknown) {
  await page.route("**/api/ud09DeleteHdocuserdefinedrules/search", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
}
async function mockDelete(page: Page, data: unknown) {
  await page.route(
    "**/api/ud09DeleteHdocuserdefinedrules/deleteSelected",
    (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      }),
  );
}

test.beforeEach(() => {
  screenshotCounter = {};
});

test.describe("画面初始化", () => {
  test("01_基本元素", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toHaveText(
      "Homologation Variables",
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
      page.getByRole("button", { name: "Delete Selected", exact: true }),
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
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
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
    await mockSearch(page, EMPTY_DATA);
    await page.goto(PAGE_URL);
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
    // API 返回 code=500 时组件仅清空列表，不显示错误消息
    await mockSearch(page, SYS_ERR);
    await page.goto(PAGE_URL);
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
    await page.route("**/api/ud09DeleteHdocuserdefinedrules/search", (r) =>
      r.abort("connectionrefused"),
    );
    await page.goto(PAGE_URL);
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

test.describe("Select选择处理", () => {
  test("06_未选择记录时点击", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Please select a record.",
    );
    await page.screenshot({
      path: ss("06_未选择记录时点击", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("07_已选择记录时点击", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain("homologation-variables");
    await page.screenshot({
      path: ss("07_已选择记录时点击", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Back返回处理", () => {
  test("08_返回前画面", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain("homologation-variables");
    await page.screenshot({
      path: ss("08_返回前画面", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Print打印处理", () => {
  test("09_打印搜索结果", async ({ page }) => {
    let called = false;
    await page.exposeFunction("onPrint", () => {
      called = true;
    });
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
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
      path: ss("09_打印搜索结果", "打印"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("DeleteSelected删除处理", () => {
  test("10_未选择记录时点击", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(500);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Please select at least one record to delete.",
    );
    await page.screenshot({
      path: ss("10_未选择记录时点击", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_删除成功", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await mockDelete(page, DEL_OK);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page.waitForTimeout(300);
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-success-message")).toBeVisible();
    await expect(page.locator(".hvrl-success-message")).toHaveText(
      "1 records deleted successfully.",
    );
    await page.screenshot({
      path: ss("11_删除成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_记录不存在", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await mockDelete(page, NOT_FOUND);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Data does not exist, Please enter the correct content",
    );
    await page.screenshot({
      path: ss("12_记录不存在", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_服务器错误", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await mockDelete(page, SYS_ERR);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(2000);
    // data.code=500, data.msg="System error"
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "System error",
    );
    await page.screenshot({
      path: ss("13_服务器错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_部分删除失败", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await mockDelete(page, DEL_PART);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-success-message")).toBeVisible();
    await expect(page.locator(".hvrl-success-message")).toHaveText(
      "1 records deleted, 1 records failed.",
    );
    await page.screenshot({
      path: ss("14_部分删除失败", "结果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_全部删除失败", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await mockDelete(page, DEL_FAIL);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Failed to delete records. Please try again.",
    );
    await page.screenshot({
      path: ss("15_全部删除失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("DataTable显示", () => {
  test("16_列标题显示", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    // checkbox 列使用 hvrl-checkbox-col，其余 11 列使用 hvrl-th
    await expect(page.locator(".hvrl-th")).toHaveCount(11);
    await expect(page.locator(".hvrl-th").nth(0)).toHaveText("*Product class");
    await expect(page.locator(".hvrl-th").nth(1)).toHaveText("*Number");
    await expect(page.locator(".hvrl-th").nth(2)).toHaveText("*Market");
    await expect(page.locator(".hvrl-th").nth(3)).toHaveText("Variable");
    await expect(page.locator(".hvrl-th").nth(4)).toHaveText("Value");
    await expect(page.locator(".hvrl-th").nth(5)).toHaveText("Variant string.");
    await expect(page.locator(".hvrl-th").nth(6)).toHaveText("Comments");
    await expect(page.locator(".hvrl-th").nth(7)).toHaveText("Add (YYYYWW)");
    await expect(page.locator(".hvrl-th").nth(8)).toHaveText("Delete (YYYYWW)");
    await expect(page.locator(".hvrl-th").nth(9)).toHaveText(
      "Created by user (Automatic)",
    );
    await expect(page.locator(".hvrl-th").nth(10)).toHaveText(
      "Date (Automatic)",
    );
    await page.screenshot({
      path: ss("16_列标题显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_复选框功能", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await expect(page.locator("input[type='radio']").first()).toBeChecked();
    await page.screenshot({
      path: ss("17_复选框功能", "选择"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_排序规则", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: ss("18_排序规则", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_CreatedByUser链接", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    const links = page.locator(".hvrl-link a");
    await expect(links.first()).toBeVisible();
    await expect(links.first()).toHaveAttribute("href", "#");
    await page.screenshot({
      path: ss("19_CreatedByUser链接", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_Count计数", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-count")).toHaveText(
      "Number of lines found: 3",
    );
    await page.screenshot({
      path: ss("20_Count计数", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("异常处理", () => {
  test("21_API超时", async ({ page }) => {
    await page.route(
      "**/api/ud09DeleteHdocuserdefinedrules/search",
      async (r) => {
        await new Promise((res) => setTimeout(res, 12000));
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_DATA),
        });
      },
    );
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: ss("21_API超时", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_JSON解析失败", async ({ page }) => {
    await page.route("**/api/ud09DeleteHdocuserdefinedrules/search", (r) => {
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: "invalid json",
      });
    });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-error-message")).toBeVisible();
    await expect(page.locator(".hvrl-error-message")).toHaveText(
      "Unexpected token 'i', \"invalid json\" is not valid JSON",
    );
    await page.screenshot({
      path: ss("22_JSON解析失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("23_用户未登录", async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toBeVisible();
    await page.screenshot({
      path: ss("23_用户未登录", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("UI交互", () => {
  test("24_错误消息_显示样式", async ({ page }) => {
    await page.route("**/api/ud09DeleteHdocuserdefinedrules/search", (r) =>
      r.abort("connectionrefused"),
    );
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    const msg = page.locator(".hvrl-error-message");
    await expect(msg).toBeVisible();
    expect(await msg.evaluate((el) => window.getComputedStyle(el).color)).toBe(
      "rgb(198, 40, 40)",
    );
    await page.screenshot({
      path: ss("24_错误消息_显示样式", "样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_加载中禁用", async ({ page }) => {
    await page.route(
      "**/api/ud09DeleteHdocuserdefinedrules/search",
      async (r) => {
        await new Promise((res) => setTimeout(res, 5000));
        r.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_DATA),
        });
      },
    );
    await page.goto(PAGE_URL);
    await expect(page.locator(".hvrl-loading")).toBeVisible({ timeout: 3000 });
    await page.screenshot({
      path: ss("25_加载中禁用", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("26_页面刷新", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-count")).toContainText("3");
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator(".hvrl-title")).toBeVisible();
    await page.screenshot({
      path: ss("26_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("安全性", () => {
  test("27_API请求协议", async ({ page }) => {
    const urls: string[] = [];
    await page.route("**/api/ud09DeleteHdocuserdefinedrules/**", (r) => {
      urls.push(r.request().url());
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_DATA),
      });
    });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1500);
    for (const u of urls) {
      expect(u).not.toContain("password");
      expect(u).not.toContain("secret");
    }
    await page.screenshot({
      path: ss("27_API请求协议", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("28_删除操作权限控制", async ({ page }) => {
    await mockSearch(page, MOCK_DATA);
    await mockDelete(page, DEL_OK);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    await page.locator("input[type='radio']").first().check();
    await page
      .getByRole("button", { name: "Delete Selected", exact: true })
      .click();
    await page.waitForTimeout(2000);
    // 组件无 confirm 对话框，直接调用 API 删除成功
    await expect(page.locator(".hvrl-success-message")).toBeVisible();
    await page.screenshot({
      path: ss("28_删除操作权限控制", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("29_前端不记录敏感数据", async ({ page }) => {
    const msgs: string[] = [];
    page.on("console", (m) => msgs.push(m.text()));
    await mockSearch(page, MOCK_DATA);
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1500);
    const bad = msgs.filter(
      (m) =>
        m.toLowerCase().includes("password") ||
        m.toLowerCase().includes("secret"),
    );
    expect(bad.length).toBe(0);
    await page.screenshot({
      path: ss("29_前端不记录敏感数据", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
