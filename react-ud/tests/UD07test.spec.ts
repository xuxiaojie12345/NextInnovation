import { test, expect, Page } from "@playwright/test";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD07";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";

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
// 模拟API响应的辅助函数
// ============================================================
const MOCK_VEHICLE_DATA = {
  code: 200,
  msg: "success",
  data: {
    vehicleInfo: {
      model: "IDO",
      builtWeek: "2016173",
      customerAdap: "S1810111",
      productType: "TRUCK",
      vin: "xxxxxxxxxxxxxxxxx",
      countryOfOperation: "IDO",
      familyId: "DPX123",
      variantId: "VAR001",
    },
    variantInfo: {
      list: [
        {
          symbol: "ABC12345",
          description: "Test Description 1",
          functionGroup: "0001",
        },
        {
          symbol: "DEF67890",
          description: "Test Description 2",
          functionGroup: "0002",
        },
      ],
    },
    engineNo: "ENG123456",
  },
};

const MOCK_VEHICLE_NO_VARIANTS = {
  code: 200,
  msg: "success",
  data: {
    vehicleInfo: {
      model: "IDO",
      builtWeek: "2016173",
      customerAdap: "S1810111",
      productType: "TRUCK",
      vin: "xxxxxxxxxxxxxxxxx",
      countryOfOperation: "IDO",
      familyId: "DPX123",
      variantId: "VAR001",
    },
    variantInfo: { list: [] },
    engineNo: "",
  },
};

const MOCK_VEHICLE_NO_SYMBOL = {
  code: 200,
  msg: "success",
  data: {
    vehicleInfo: {
      model: "IDO",
      builtWeek: "2016173",
      customerAdap: "S1810111",
      productType: "TRUCK",
      vin: "xxxxxxxxxxxxxxxxx",
      countryOfOperation: "IDO",
      familyId: "DPX123",
      variantId: "VAR001",
    },
    variantInfo: {
      list: [{ symbol: "ABC12345", description: "", functionGroup: "0001" }],
    },
    engineNo: "N/A",
  },
};

// ============================================================
// 导航辅助函数
// ============================================================
const PAGE_URL = `${APP_URL}/vehicle-specification`;

async function navigateToVS(page: Page, chassisNo?: string) {
  const url = chassisNo
    ? `${PAGE_URL}?chassisNo=${encodeURIComponent(chassisNo)}`
    : PAGE_URL;
  await page.goto(url);
  await page.waitForSelector(".vs-container");
}

async function mockApi(page: Page, status: number, data: unknown) {
  await page.route("**/api/UD07/vehicleSpecification*", (route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
}

// ============================================================
// 测试 Setup 和 Teardown
// ============================================================
test.beforeEach(() => {
  screenshotCounter = {};
});

// ============================================================
// 1. 画面初始化
// ============================================================
test.describe("画面初始化", () => {
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-title")).toHaveText(
      "VDA - Vehicle Specification:",
    );
    await expect(page.locator("text=Chassis no:")).toBeVisible();
    await expect(page.locator("text=Model:")).toBeVisible();
    await expect(page.locator("text=Built week:")).toBeVisible();
    await expect(page.locator("text=Product type:")).toBeVisible();
    await expect(page.locator("text=VIN:")).toBeVisible();
    await expect(page.locator("text=Engine no:")).toBeVisible();
    await expect(page.locator("text=Country of Operation:")).toBeVisible();
    // S-Note NO 值在 .vs-variant-item 中显示
    await expect(page.locator(".vs-variant-item")).toBeVisible();

    // 确认没有可编辑的输入框
    await expect(page.locator(".vs-container input")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_画面初期显示_URL参数解析", async ({ page }) => {
    let requestUrl = "";
    await page.route("**/api/UD07/vehicleSpecification*", (route) => {
      requestUrl = route.request().url();
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_VEHICLE_DATA),
      });
    });

    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    expect(requestUrl).toContain("chassisNo=JPCT013945");
    await expect(page.locator(".vs-value").first()).toContainText("JPCT013945");

    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_URL参数解析", "参数"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_画面初期显示_加载中状态", async ({ page }) => {
    // 使用延迟响应来捕获加载状态
    await page.route("**/api/UD07/vehicleSpecification*", (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_VEHICLE_DATA),
        });
      }, 3000);
    });

    // 不等待加载完成，立即检查加载状态
    await page.goto(`${PAGE_URL}?chassisNo=JPCT013945`);
    await page.waitForSelector(".vs-loading", { timeout: 2000 });

    await expect(page.locator(".vs-loading")).toBeVisible();
    await expect(page.locator(".vs-loading")).toHaveText("Loading...");

    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_加载中状态", "Loading"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 2. 空值校验
// ============================================================
test.describe("空值校验", () => {
  test("04_空值校验_Chassis编号为空", async ({ page }) => {
    await navigateToVS(page, "");
    await page.waitForTimeout(1000);

    await expect(page.locator(".vs-error-message")).toBeVisible();
    await expect(page.locator(".vs-error-message")).toHaveText(
      "未指定Chassis编号",
    );

    await page.screenshot({
      path: getScreenshotPath("04_空值校验_Chassis编号为空", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 3. API 数据获取
// ============================================================
test.describe("API数据获取", () => {
  test("05_API成功_车辆基本信息显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("Model:");
    await expect(page.locator(".vs-container")).toContainText("Built week:");
    await expect(page.locator(".vs-container")).toContainText("Product type:");
    await expect(page.locator(".vs-container")).toContainText("VIN:");
    await expect(page.locator(".vs-container")).toContainText(
      "Country of Operation:",
    );
    await expect(page.locator(".vs-container")).toContainText("S1810111");

    await page.screenshot({
      path: getScreenshotPath("05_API成功_车辆基本信息显示", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_API成功_EngineNo显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("ENG123456");

    await page.screenshot({
      path: getScreenshotPath("06_API成功_EngineNo显示", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("07_API成功_SYMBOL_STR显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // 确认 variantList 中的 symbol 被渲染
    const symbolElements = page.locator(".vs-symbol");
    await expect(symbolElements.first()).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("07_API成功_SYMBOL_STR显示", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("08_API成功_DESCRIPTION工具提示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // 悬停到第一个 symbol 上，确认 tooltip
    const firstSymbol = page.locator(".vs-symbol").first();
    await firstSymbol.hover();

    // tooltip 通过 title 属性实现
    await expect(firstSymbol).toHaveAttribute("title", "Test Description 1");

    await page.screenshot({
      path: getScreenshotPath("08_API成功_DESCRIPTION工具提示", "tooltip"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("09_API失败_变体信息未找到", async ({ page }) => {
    // variantList 为空、engineNo 为空时，组件显示 "N/A"
    await mockApi(page, 200, MOCK_VEHICLE_NO_VARIANTS);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // Engine no 显示 "N/A"（因为 data.data.engineNo 为空）
    await expect(page.locator(".vs-container")).toContainText("N/A");
    // symbol 区域应为空
    await expect(page.locator(".vs-symbol")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("09_API失败_变体信息未找到", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("10_API失败_Symbol信息未找到", async ({ page }) => {
    // engineNo 返回 "N/A" 表示未找到发动机符号信息
    const mockDataNoSymbol = {
      ...MOCK_VEHICLE_DATA,
      data: {
        ...MOCK_VEHICLE_DATA.data,
        engineNo: "N/A",
        variantInfo: { list: [] },
      },
    };
    await mockApi(page, 200, mockDataNoSymbol);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // Engine no 显示 "N/A"
    await expect(page.locator(".vs-container")).toContainText("N/A");

    await page.screenshot({
      path: getScreenshotPath("10_API失败_Symbol信息未找到", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_API失败_服务器错误500", async ({ page }) => {
    await mockApi(page, 500, { code: 500, msg: "System error" });
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-error-message")).toBeVisible();
    await expect(page.locator(".vs-error-message")).toHaveText(
      "HTTP error! status: 500",
    );

    await page.screenshot({
      path: getScreenshotPath("11_API失败_服务器错误500", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_API失败_网络错误", async ({ page }) => {
    // 模拟网络错误：阻断API请求
    await page.route("**/api/UD07/vehicleSpecification*", (route) => {
      route.abort("connectionrefused");
    });

    await page.goto(`${PAGE_URL}?chassisNo=JPCT013945`);
    await page.waitForTimeout(2000);

    // catch 块中 error instanceof Error 时显示 error.message
    await expect(page.locator(".vs-error-message")).toBeVisible();
    await expect(page.locator(".vs-error-message")).toHaveText(
      "Failed to fetch",
    );

    await page.screenshot({
      path: getScreenshotPath("12_API失败_网络错误", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 4. 信息显示
// ============================================================
test.describe("信息显示", () => {
  test("13_ChassisNo_完整显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("JPCT013945");

    await page.screenshot({
      path: getScreenshotPath("13_ChassisNo_完整显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_Model_显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("IDO");

    await page.screenshot({
      path: getScreenshotPath("14_Model_显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_BuiltWeek_显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("2016173");

    await page.screenshot({
      path: getScreenshotPath("15_BuiltWeek_显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_ProductType_显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("TRUCK");

    await page.screenshot({
      path: getScreenshotPath("16_ProductType_显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_VIN_显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText(
      "xxxxxxxxxxxxxxxxx",
    );

    await page.screenshot({
      path: getScreenshotPath("17_VIN_显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("18_CountryOfOperation_显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText(
      "Country of Operation:",
    );
    await expect(page.locator(".vs-container")).toContainText("IDO");

    await page.screenshot({
      path: getScreenshotPath("18_CountryOfOperation_显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("19_SNoteNO_显示", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    await expect(page.locator(".vs-container")).toContainText("S1810111");

    await page.screenshot({
      path: getScreenshotPath("19_SNoteNO_显示", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_SYMBOL_STR_字段为空时的显示", async ({ page }) => {
    // variantList 为空时，symbol 区域不显示内容
    const mockDataEmptySymbol = {
      ...MOCK_VEHICLE_DATA,
      data: {
        ...MOCK_VEHICLE_DATA.data,
        variantInfo: { list: [] },
      },
    };
    await mockApi(page, 200, mockDataEmptySymbol);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // symbol 区域应无子元素
    await expect(page.locator(".vs-symbol")).toHaveCount(0);

    await page.screenshot({
      path: getScreenshotPath("20_SYMBOL_STR_字段为空时的显示", "空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 5. 异常处理
// ============================================================
test.describe("异常处理", () => {
  test("21_异常处理_API调用失败", async ({ page }) => {
    // 模拟网络断开
    await page.route("**/api/UD07/vehicleSpecification*", (route) => {
      route.abort("connectionrefused");
    });

    await page.goto(`${PAGE_URL}?chassisNo=JPCT013945`);
    await page.waitForTimeout(2000);

    await expect(page.locator(".vs-error-message")).toBeVisible();
    await expect(page.locator(".vs-error-message")).toHaveText(
      "Failed to fetch",
    );

    await page.screenshot({
      path: getScreenshotPath("21_异常处理_API调用失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_异常处理_用户未登录", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());

    // 访问页面（VehicleSpecification 不检查登录状态，直接调用 API）
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await page.goto(`${PAGE_URL}?chassisNo=JPCT013945`);
    await page.waitForTimeout(1500);

    // 页面应正常加载显示数据
    await expect(page.locator(".vs-title")).toBeVisible();

    await page.screenshot({
      path: getScreenshotPath("22_异常处理_用户未登录", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 6. UI 交互
// ============================================================
test.describe("UI交互", () => {
  test("23_SYMBOL_STR_鼠标悬停显示Tooltip", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    const symbolElement = page.locator(".vs-symbol").first();
    await expect(symbolElement).toBeVisible();

    // 确认 title 属性存在（tooltip）
    const titleAttr = await symbolElement.getAttribute("title");
    expect(titleAttr).toBeTruthy();

    // 悬停
    await symbolElement.hover();

    await page.screenshot({
      path: getScreenshotPath("23_SYMBOL_STR_鼠标悬停显示Tooltip", "hover"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("24_SYMBOL_STR_无DESCRIPTION时不显示Tooltip", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_NO_SYMBOL);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    const symbolElement = page.locator(".vs-symbol").first();
    await expect(symbolElement).toBeVisible();

    // description 为空，title 应为空字符串
    const titleAttr = await symbolElement.getAttribute("title");
    expect(titleAttr).toBe("");

    await page.screenshot({
      path: getScreenshotPath(
        "24_SYMBOL_STR_无DESCRIPTION时不显示Tooltip",
        "表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("25_错误消息_显示样式", async ({ page }) => {
    // 触发错误
    await page.route("**/api/UD07/vehicleSpecification*", (route) => {
      route.abort("connectionrefused");
    });

    await page.goto(`${PAGE_URL}?chassisNo=JPCT013945`);
    await page.waitForTimeout(2000);

    const errorMsg = page.locator(".vs-error-message");
    await expect(errorMsg).toBeVisible();

    // 确认文字颜色为红色
    const color = await errorMsg.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(255, 77, 79)");

    await page.screenshot({
      path: getScreenshotPath("25_错误消息_显示样式", "样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("26_页面刷新", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // 确认数据已加载
    await expect(page.locator(".vs-container")).toContainText("IDO");

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(2000);

    // 刷新后应再次加载数据
    await expect(page.locator(".vs-container")).toContainText("IDO");

    await page.screenshot({
      path: getScreenshotPath("26_页面刷新", "刷新後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

// ============================================================
// 7. 安全性
// ============================================================
test.describe("安全性", () => {
  test("27_安全性_API请求协议", async ({ page }) => {
    // 确认API请求通过HTTP（开发环境）
    let requestProtocol = "";
    await page.route("**/api/UD07/vehicleSpecification*", (route) => {
      requestProtocol = route.request().url();
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_VEHICLE_DATA),
      });
    });

    await page.goto(`${PAGE_URL}?chassisNo=JPCT013945`);
    await page.waitForTimeout(1500);

    // 检查API请求中不包含敏感信息
    expect(requestProtocol).not.toContain("password");
    expect(requestProtocol).not.toContain("token");
    expect(requestProtocol).not.toContain("secret");

    await page.screenshot({
      path: getScreenshotPath("27_安全性_API请求协议", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("28_安全性_数据只读", async ({ page }) => {
    await mockApi(page, 200, MOCK_VEHICLE_DATA);
    await navigateToVS(page, "JPCT013945");
    await page.waitForTimeout(1500);

    // 确认没有输入框或可编辑控件
    const inputs = await page
      .locator(
        ".vs-container input, .vs-container textarea, .vs-container select",
      )
      .count();
    expect(inputs).toBe(0);

    await page.screenshot({
      path: getScreenshotPath("28_安全性_数据只读", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
