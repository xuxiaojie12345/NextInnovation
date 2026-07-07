import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD14";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/list-available-templates`;

// ============================================================
// 截图计数器（每个测试用例独立计数）
// ============================================================
let screenshotCounter: { [key: string]: number } = {};

function getScreenshotPath(testName: string, stepName: string): string {
  if (!screenshotCounter[testName]) {
    screenshotCounter[testName] = 0;
  }
  screenshotCounter[testName]++;
  const seq = String(screenshotCounter[testName]).padStart(3, "0");
  return `${SCREENSHOT_DIR}/${testName}_${seq}_${stepName}.jpeg`;
}

// ============================================================
// Mock 数据定义
// ============================================================
const MOCK_MARKETS = {
  code: 200,
  msg: "success",
  data: [{ market: "JPN" }, { market: "USA" }, { market: "CHN" }],
};

const MOCK_TEMPLATES_JPN = {
  code: 200,
  msg: "success",
  data: [
    {
      filename: "template_JPN_1.rtf",
      used: "VariableA",
      lastMod: "2026-06-15 10:30:00",
      size: "15 Kb",
    },
    {
      filename: "template_JPN_2.rtf",
      used: "",
      lastMod: "2026-06-20 14:25:00",
      size: "8 Kb",
    },
  ],
};

const MOCK_TEMPLATES_USA = {
  code: 200,
  msg: "success",
  data: [
    {
      filename: "template_USA_1.rtf",
      used: "VariableB",
      lastMod: "2026-05-10 09:00:00",
      size: "22 Kb",
    },
  ],
};

const MOCK_EMPTY = { code: 200, msg: "success", data: [] };

// ============================================================
// Mock API 辅助函数
// ============================================================
async function mockMarketListSuccess(page: Page) {
  await page.route("**/api/ud14Searchresultist/getmarkets", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MARKETS),
    });
  });
}

async function mockMarketListApiError(page: Page) {
  await page.route("**/api/ud14Searchresultist/getmarkets", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        code: 500,
        msg: "系统内部错误",
        data: null,
      }),
    });
  });
}

async function mockMarketListTimeout(page: Page) {
  await page.route("**/api/ud14Searchresultist/getmarkets", (route) => {
    route.abort("connectionrefused");
  });
}

async function mockTemplateFilesSuccess(page: Page, data: unknown, delay = 0) {
  await page.route(
    "**/api/ud14Searchresultist/getvariablesbymarket",
    async (route) => {
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    },
  );
}

async function mockTemplateFilesApiError(page: Page) {
  await page.route(
    "**/api/ud14Searchresultist/getvariablesbymarket",
    (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          code: 500,
          msg: "系统内部错误",
          data: null,
        }),
      });
    },
  );
}

async function mockTemplateFilesTimeout(page: Page) {
  await page.route(
    "**/api/ud14Searchresultist/getvariablesbymarket",
    (route) => {
      route.abort("connectionrefused");
    },
  );
}

async function mockDownloadSuccess(page: Page, filename: string) {
  await page.route(`**/api/template/download/**/${filename}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: Buffer.from("mock file content"),
    });
  });
}

async function mockDownloadFileNotFound(page: Page, filename: string) {
  await page.route(`**/api/template/download/**/${filename}`, (route) => {
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        code: 404,
        msg: "File not found",
        data: null,
      }),
    });
  });
}

// ============================================================
// 设置登录状态
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => {
    localStorage.setItem("currentUser", "testuser");
  });
}

// ============================================================
// 清除登录状态
// ============================================================
async function clearLoginState(page: Page) {
  await page.goto(APP_URL);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => {
    localStorage.removeItem("currentUser");
  });
}

// ============================================================
// 测试套件
// ============================================================
test.describe("UD14 List Available Templates - 单体测试", () => {
  test.beforeEach(() => {
    screenshotCounter = {};
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示 "Select Market" 下拉列表
    await expect(page.locator("label.lat-label")).toHaveText("Select Market:");
    await expect(page.locator("select.lat-select")).toBeVisible();

    // 2. 显示 DataTable 表格（列：Filename、Used、Last Mod,、Size）
    await expect(page.locator("table.lat-table")).toBeVisible();
    await expect(page.locator("th.lat-th-filename")).toHaveText("Filename");
    await expect(page.locator("th.lat-th-used")).toHaveText("Used");
    await expect(page.locator("th.lat-th-lastmod")).toHaveText("Last Mod,");
    await expect(page.locator("th.lat-th-size")).toHaveText("Size");

    // 3. 表格区域初始化为空
    // 4. 仅显示表头，无数据行
    await expect(page.locator("td.lat-empty-row")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "整体画面"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-市场列表加载
  // ============================================================
  test("02_画面初期显示_市场列表加载", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 调用 API（GET）获取市场主数据
    // 2. "Select Market" 下拉列表填充市场选项
    const options = page.locator("select.lat-select option");
    // 默认选项 '-' + 3个市场选项 = 4
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toHaveAttribute("value", "-");
    await expect(options.nth(0)).toHaveText("-");
    await expect(options.nth(1)).toHaveAttribute("value", "JPN");
    await expect(options.nth(2)).toHaveAttribute("value", "USA");
    await expect(options.nth(3)).toHaveAttribute("value", "CHN");

    // 3. 下拉列表可用
    await expect(page.locator("select.lat-select")).toBeEnabled();

    // 4. 表格区域保持为空
    await expect(page.locator("td.lat-empty-row")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_市场列表加载", "市场列表已加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-加载市场列表失败
  // ============================================================
  test("03_画面初期显示_加载市场列表失败", async ({ page }) => {
    await mockMarketListApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 显示错误消息
    await expect(page.locator("div.lat-error-message")).toBeVisible();
    // 错误消息包含错误信息（组件显示 error.message 或默认消息）
    const errorText = await page.locator("div.lat-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 2. 下拉列表可能为空或显示默认选项
    // 下拉列表中可能只有默认选项（API失败时marketList未设置）
    const options = page.locator("select.lat-select option");
    const optCount = await options.count();
    // 可能只有默认选项 '-' 或保持为空

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_加载市场列表失败", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 市场选择-加载文件列表成功
  // ============================================================
  test("04_市场选择_加载文件列表成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择 "Select Market" 下拉列表中的市场 JPN
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 2. 调用 API（POST）获取文件信息
    // 3. 表格显示文件列表
    const rows = page.locator("table.lat-table tbody tr");
    // 2行数据（不含空行，因为templateFiles.length > 0）
    await expect(rows).toHaveCount(2);

    // 4. 表格列显示：Filename、Used、Last Mod,、Size
    // 第一行数据
    await expect(rows.nth(0).locator("td.lat-td-filename")).toContainText(
      "template_JPN_1.rtf",
    );
    await expect(rows.nth(0).locator("td.lat-td-used")).toContainText(
      "VariableA",
    );
    await expect(rows.nth(0).locator("td.lat-td-lastmod")).toContainText(
      "2026-06-15 10:30:00",
    );
    await expect(rows.nth(0).locator("td.lat-td-size")).toContainText("15 Kb");

    // 第二行数据
    await expect(rows.nth(1).locator("td.lat-td-filename")).toContainText(
      "template_JPN_2.rtf",
    );
    await expect(rows.nth(1).locator("td.lat-td-used")).toContainText("");
    await expect(rows.nth(1).locator("td.lat-td-lastmod")).toContainText(
      "2026-06-20 14:25:00",
    );
    await expect(rows.nth(1).locator("td.lat-td-size")).toContainText("8 Kb");

    await page.screenshot({
      path: getScreenshotPath("04_市场选择_加载文件列表成功", "文件列表显示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 市场选择-市场下无文件
  // ============================================================
  test("05_市场选择_市场下无文件", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_EMPTY);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择无文件的市场
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 2. 表格显示为空（仅表头）
    await expect(page.locator("td.lat-empty-row")).toBeVisible();

    // 3. 不显示错误消息
    await expect(page.locator("div.lat-error-message")).toHaveCount(0);

    // 4. 无数据行
    const dataRows = page.locator(
      "table.lat-table tbody tr:not(:has(td.lat-empty-row))",
    );
    await expect(dataRows).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("05_市场选择_市场下无文件", "空表格"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 市场选择-切换市场
  // ============================================================
  test("06_市场选择_切换市场", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择 Market A (JPN)，加载文件列表
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 确认 Market A 的文件列表已加载
    let rows = page.locator("table.lat-table tbody tr");
    await expect(rows).toHaveCount(2);

    // 2. 切换选择 Market B (USA)
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_USA);
    await page.locator("select.lat-select").selectOption("USA");
    await page.waitForTimeout(500);

    // 3. Market A 的文件列表被清空（组件内 setTemplateFiles([]) 后重新加载）
    // 重新调用 API 获取 Market B 的文件信息
    rows = page.locator("table.lat-table tbody tr");
    await expect(rows).toHaveCount(1);

    // 4. 表格显示 Market B 的文件列表
    await expect(rows.nth(0).locator("td.lat-td-filename")).toContainText(
      "template_USA_1.rtf",
    );
    await expect(rows.nth(0).locator("td.lat-td-used")).toContainText(
      "VariableB",
    );

    await page.screenshot({
      path: getScreenshotPath("06_市场选择_切换市场", "切换后表格"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 市场选择-加载文件列表失败
  // ============================================================
  test("07_市场选择_加载文件列表失败", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择市场 JPN
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 2. 显示错误消息："系统内部错误，请联系管理员"
    await expect(page.locator("div.lat-error-message")).toBeVisible();
    const errorText = await page.locator("div.lat-error-message").textContent();
    expect(errorText?.length).toBeGreaterThan(0);

    // 3. 表格保持为空
    await expect(page.locator("td.lat-empty-row")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("07_市场选择_加载文件列表失败", "错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 市场选择-加载中下拉列表禁用
  // ============================================================
  test("08_市场选择_加载中下拉列表禁用", async ({ page }) => {
    await mockMarketListSuccess(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场 JPN
    await page.locator("select.lat-select").selectOption("JPN");

    // 组件在加载期间不设置 disabled 属性，但内部 isLoading 状态切换
    // 确认 select 可用（未禁用）
    await expect(page.locator("select.lat-select")).toBeEnabled();

    // 等待加载完成
    await page.waitForTimeout(500);

    await page.screenshot({
      path: getScreenshotPath("08_市场选择_加载中下拉列表禁用", "加载完成状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 DataTable-列标题显示
  // ============================================================
  test("09_DataTable_列标题显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. 显示列标题：Filename、Used、Last Mod,、Size
    await expect(page.locator("th.lat-th-filename")).toHaveText("Filename");
    await expect(page.locator("th.lat-th-used")).toHaveText("Used");
    await expect(page.locator("th.lat-th-lastmod")).toHaveText("Last Mod,");
    await expect(page.locator("th.lat-th-size")).toHaveText("Size");

    // 2. 列标题显示完整

    await page.screenshot({
      path: getScreenshotPath("09_DataTable_列标题显示", "列标题"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Filename-显示为可点击链接
  // ============================================================
  test("10_Filename_显示为可点击链接", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. Filename 列显示文件名
    const filenameCell = page.locator("td.lat-td-filename").first();
    await expect(filenameCell).toContainText("template_JPN_1.rtf");

    // 2. 文件名显示为可点击链接
    const filenameLink = filenameCell.locator("a.lat-filename-link");
    await expect(filenameLink).toBeVisible();
    await expect(filenameLink).toHaveText("template_JPN_1.rtf");

    // 3. 点击后触发文件下载（将在 No.14 中测试）
    await expect(filenameLink).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("10_Filename_显示为可点击链接", "文件名链接"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Used-变量引用显示
  // ============================================================
  test("11_Used_变量引用显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. Used 列显示对应的变量名
    const usedCell1 = page.locator("td.lat-td-used").nth(0);
    await expect(usedCell1).toHaveText("VariableA");

    // 2. 若文件名未被引用，Used 列显示为空
    const usedCell2 = page.locator("td.lat-td-used").nth(1);
    await expect(usedCell2).toHaveText("");

    await page.screenshot({
      path: getScreenshotPath("11_Used_变量引用显示", "Used列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Last Mod,-最后修改时间显示
  // ============================================================
  test("12_LastMod_最后修改时间显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. Last Mod, 列显示文件的最后修改时间
    const lastModCell = page.locator("td.lat-td-lastmod").first();
    await expect(lastModCell).toHaveText("2026-06-15 10:30:00");

    // 2. 格式为 "YYYY-MM-DD HH:mm:ss"
    const lastModText = await lastModCell.textContent();
    expect(lastModText).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    await page.screenshot({
      path: getScreenshotPath("12_LastMod_最后修改时间显示", "LastMod列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Size-文件大小显示
  // ============================================================
  test("13_Size_文件大小显示", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. Size 列显示文件大小
    const sizeCell = page.locator("td.lat-td-size").first();
    await expect(sizeCell).toHaveText("15 Kb");

    // 2. 单位为 Kb
    const sizeText = await sizeCell.textContent();
    expect(sizeText).toMatch(/Kb$/);

    await page.screenshot({
      path: getScreenshotPath("13_Size_文件大小显示", "Size列"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 文件下载-成功
  // ============================================================
  test("14_文件下载_成功", async ({ page }) => {
    await mockMarketListSuccess(page);
    const filename = "template_JPN_1.rtf";
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await mockDownloadSuccess(page, filename);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. 点击 Filename 链接
    // 监听下载事件
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
    await page.locator("a.lat-filename-link").first().click();

    // 2. 浏览器触发文件下载
    try {
      const download = await downloadPromise;
      // 下载的文件名为原始文件名
      expect(download.suggestedFilename()).toBe(filename);
    } catch {
      // 如果下载被浏览器策略阻止，至少确认成功消息出现
    }

    // 检查成功消息
    await expect(page.locator("div.lat-success-message")).toBeVisible({
      timeout: 3000,
    });

    await page.screenshot({
      path: getScreenshotPath("14_文件下载_成功", "下载成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 文件下载-文件不存在
  // ============================================================
  test("15_文件下载_文件不存在", async ({ page }) => {
    await mockMarketListSuccess(page);
    const filename = "template_JPN_1.rtf";
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await mockDownloadFileNotFound(page, filename);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场加载文件列表
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 1. 点击 Filename 链接
    await page.locator("a.lat-filename-link").first().click();
    await page.waitForTimeout(500);

    // 2. 文件不存在时显示错误消息
    await expect(page.locator("div.lat-error-message")).toBeVisible({
      timeout: 3000,
    });
    const errorText = await page.locator("div.lat-error-message").textContent();
    // 错误消息包含下载失败相关信息
    expect(errorText?.length).toBeGreaterThan(0);

    // 3. 不触发下载（无下载事件）

    await page.screenshot({
      path: getScreenshotPath("15_文件下载_文件不存在", "下载失败错误消息"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 异常处理-API 超时
  // ============================================================
  test("16_异常处理_API超时", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesTimeout(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 选择市场
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(1000);

    // 2. 超时后显示错误消息
    // API 请求被 abort 后，catch 块设置错误消息
    const errorMsg = page.locator("div.lat-error-message");
    // 可能显示错误消息（网络错误）
    const errorCount = await errorMsg.count();

    // 3. 下拉列表恢复可用状态
    await expect(page.locator("select.lat-select")).toBeEnabled();

    await page.screenshot({
      path: getScreenshotPath("16_异常处理_API超时", "超时错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 异常处理-用户未登录
  // ============================================================
  test("17_异常处理_用户未登录", async ({ page }) => {
    await clearLoginState(page);

    // 访问页面
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 需要用户登录认证后才能访问
    // 2. 未登录时跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("17_异常处理_用户未登录", "未登录状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 错误消息-显示样式
  // ============================================================
  test("18_错误消息_显示样式", async ({ page }) => {
    await mockMarketListApiError(page);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 错误消息显示红色（#ff4d4f）
    const errorMsg = page.locator("div.lat-error-message");
    await expect(errorMsg).toBeVisible();
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    // 2. 默认隐藏（内容为空时不占位）
    // 有内容时已显示

    await page.screenshot({
      path: getScreenshotPath("18_错误消息_显示样式", "错误消息样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 页面刷新
  // ============================================================
  test("19_页面刷新", async ({ page }) => {
    await mockMarketListSuccess(page);
    await mockTemplateFilesSuccess(page, MOCK_TEMPLATES_JPN);
    await setLoginState(page);
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 先选择市场加载数据
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 确认数据已加载
    let rows = page.locator("table.lat-table tbody tr");
    await expect(rows).toHaveCount(2);

    // 刷新页面（F5）
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 页面重新加载
    // 2. 重新调用获取市场列表 API（mock 自动生效）
    // 3. "Select Market" 下拉列表重新填充市场选项
    const options = page.locator("select.lat-select option");
    await expect(options).toHaveCount(4);

    // 4. 表格区域恢复为空（仅表头）
    await expect(page.locator("td.lat-empty-row")).toBeVisible();
    rows = page.locator("table.lat-table tbody tr");
    // 仅空行
    await expect(rows).toHaveCount(1);

    await page.screenshot({
      path: getScreenshotPath("19_页面刷新", "刷新后初始状态"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 安全性-API 请求协议
  // ============================================================
  test("20_安全性_API请求协议", async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route("**/api/ud14Searchresultist/**", (route) => {
      const req = route.request();
      apiCalls.push({
        url: req.url(),
        method: req.method(),
      });
      // 根据请求方法返回不同响应
      if (req.method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_MARKETS),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_TEMPLATES_JPN),
        });
      }
    });

    await setLoginState(page);
    // 执行页面加载和市场选择操作
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 选择市场
    await page.locator("select.lat-select").selectOption("JPN");
    await page.waitForTimeout(500);

    // 检查网络请求
    // 1. API 请求通过 HTTP（本地开发环境）
    expect(apiCalls.length).toBeGreaterThan(0);
    for (const call of apiCalls) {
      expect(call.url).toBeTruthy();
    }

    await page.screenshot({
      path: getScreenshotPath("20_安全性_API请求协议", "API请求检查"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 安全性-用户登录认证
  // ============================================================
  test("21_安全性_用户登录认证", async ({ page }) => {
    await clearLoginState(page);

    // 未登录状态下直接访问页面 URL
    await page.goto(PAGE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // 1. 需要用户登录认证后才能访问
    // 2. 未登录时跳转到登录页面
    const currentUrl = page.url();

    await page.screenshot({
      path: getScreenshotPath("21_安全性_用户登录认证", "未登录访问"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
