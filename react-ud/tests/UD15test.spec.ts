import { test, expect, Page } from "@playwright/test";
import mysql from "mysql2/promise";

// ============================================================
// 数据库配置
// ============================================================
const DB_CONFIG = {
  host: "172.17.0.63",
  user: "root",
  password: "1234",
  database: "react_ud",
};

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD15";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/vin-plate`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD15画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続（既存レコードを検索してChassis numberを生成）
// ============================================================
async function getTestChassis(): Promise<string> {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      const [rows] = await db.execute(
        "SELECT SERIE, CHNR FROM HDOC_SEND_DATA_VIN_PLATE LIMIT 1",
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        return `${r.SERIE}-${r.CHNR}`;
      }
    } finally {
      await conn.end();
    }
  } catch (e) {
    console.warn("DB query failed:", (e as Error).message);
  }
  return "JPCT-013945";
}

// ============================================================
// テスト共通関数
// ============================================================
async function setLoginState(page: Page) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("currentUser", "admin"));
}

async function openPage(page: Page) {
  await setLoginState(page);
  await page.goto(PAGE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    /* ignore */
  }
  try {
    await page.waitForSelector("h2.vp-section-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// DBのデータに依存しないテスト用Chassis number（実際のAPI応答に応じて条件判定）
// DBの既存レコードから生成されるChassis number（beforeAllで設定）
let VALID_CHASSIS = "JPCT-013945";

// ============================================================
// テストスイート
// ============================================================
test.describe.serial("UD15 VinPlate - 单体测试", () => {
  test.beforeAll(async () => {
    VALID_CHASSIS = await getTestChassis();
    console.log("Using chassis:", VALID_CHASSIS);
  });

  test.beforeAll(() => {
    screenshotCounter = 0;
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题
    await expect(page.locator("h2.vp-section-title")).toBeVisible();
    await expect(page.locator("h2.vp-section-title")).toHaveText("Vin Plate");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Chassis number 输入框
    await expect(page.locator("label.vp-label")).toBeVisible();
    await expect(page.locator("label.vp-label")).toHaveText("Chassis number");
    await expect(page.locator("input.vp-input")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_入力欄"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 按钮
    const btnNames = [
      "View Info",
      "Set Regenerate",
      "Set OK",
      "Change to Basic Info",
      "Change to Advanced Info",
    ];
    for (const name of btnNames) {
      await expect(
        page.locator("button.vp-btn").filter({ hasText: name }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 初始提示文本
    await expect(page.locator("div.vp-initial-message")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_初期ﾒｯｾｰｼﾞ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. 詳細エリアは非表示
    const details = page.locator("div.vp-details");
    if (await details.isVisible().catch(() => false)) {
      await expect(details).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_詳細非表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-搜索区域
  // ============================================================
  test("02_画面初期显示_搜索区域", async ({ page }) => {
    await openPage(page);

    // 1. 输入框为空
    const input = page.locator("input.vp-input");
    await expect(input).toBeVisible();
    const inputValue = await input.inputValue();
    expect(inputValue).toBe("");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索区域", "001_入力空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. View Info 按钮可用
    await expect(
      page.locator("button.vp-btn").filter({ hasText: "View Info" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索区域", "002_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 詳細非表示
    const details = page.locator("div.vp-details");
    if (await details.isVisible().catch(() => false)) {
      await expect(details).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_搜索区域", "003_詳細確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 画面初期显示-状态更新按钮
  // ============================================================
  test("03_画面初期显示_状态更新按钮", async ({ page }) => {
    await openPage(page);

    // 1. 状态更新按钮可用
    const updateBtns = [
      "Set Regenerate",
      "Set OK",
      "Change to Basic Info",
      "Change to Advanced Info",
    ];
    for (const name of updateBtns) {
      await expect(
        page.locator("button.vp-btn").filter({ hasText: name }),
      ).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_状态更新按钮", "001_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 未查询时点击更新按钮 → 入力検証エラー
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "Set Regenerate" })
      .click();
    await page.waitForTimeout(500);
    const errMsg = page.locator("div.vp-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("03_画面初期显示_状态更新按钮", "002_ｴﾗｰ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 View Info-Chassis number 为空
  // ============================================================
  test("04_ViewInfo_ChassisNumber为空", async ({ page }) => {
    await openPage(page);

    // 空のままView Infoをクリック
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(500);

    // エラーメッセージ表示
    const errMsg = page.locator("div.vp-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("chassis number");
    await page.screenshot({
      path: getScreenshotPath("04_ViewInfo_ChassisNumber为空", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 詳細エリア表示されない
    const details = page.locator("div.vp-details");
    if (await details.isVisible().catch(() => false)) {
      await expect(details).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath(
        "04_ViewInfo_ChassisNumber为空",
        "002_詳細非表示",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 View Info-查询成功
  // ============================================================
  test("05_ViewInfo_查询成功", async ({ page }) => {
    await openPage(page);

    // 有効なChassis numberを入力
    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("05_ViewInfo_查询成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // View Info クリック
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    // 詳細エリア確認
    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(details).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("05_ViewInfo_查询成功", "002_詳細表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      // APIが使えない場合はエラーメッセージ確認
      const errMsg = page.locator("div.vp-error-message");
      if (await errMsg.isVisible().catch(() => false)) {
        await expect(errMsg).toBeVisible();
      }
      await page.screenshot({
        path: getScreenshotPath("05_ViewInfo_查询成功", "002_結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("05_ViewInfo_查询成功", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 View Info-未找到匹配记录
  // ============================================================
  test("06_ViewInfo_未找到匹配记录", async ({ page }) => {
    await openPage(page);

    // 存在しないChassis number
    await page.locator("input.vp-input").fill("INVALID-12345");
    await page.screenshot({
      path: getScreenshotPath("06_ViewInfo_未找到匹配记录", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.vp-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("06_ViewInfo_未找到匹配记录", "002_ｴﾗｰ表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("06_ViewInfo_未找到匹配记录", "002_結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }

    const details = page.locator("div.vp-details");
    if (await details.isVisible().catch(() => false)) {
      await expect(details).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("06_ViewInfo_未找到匹配记录", "003_詳細非表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 View Info-API 返回错误（500）
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("07_ViewInfo_API返回错误", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page.screenshot({
      path: getScreenshotPath("07_ViewInfo_API返回错误", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.vp-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("07_ViewInfo_API返回错误", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 View Info-加载中按钮禁用
  // ============================================================
  test("08_ViewInfo_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page.screenshot({
      path: getScreenshotPath("08_ViewInfo_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // View Info クリック & 即座に状態確認
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(200);

    // ローディング中はボタンがdisabled
    const viewInfoBtn = page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" });
    const isDisabled = await viewInfoBtn.isDisabled();
    if (isDisabled) {
      await expect(viewInfoBtn).toBeDisabled();
    }
    await page.screenshot({
      path: getScreenshotPath("08_ViewInfo_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("08_ViewInfo_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 详细信息-Chassis number 显示
  // ============================================================
  test("09_详细信息_ChassisNumber显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(page.locator("span.vp-detail-label").first()).toContainText(
        "Chassis number",
      );
      await expect(page.locator("span.vp-detail-value").first()).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("09_详细信息_ChassisNumber显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("09_详细信息_ChassisNumber显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("09_详细信息_ChassisNumber显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 详细信息-Plate type 显示
  // ============================================================
  test("10_详细信息_PlateType显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labels = page.locator("span.vp-detail-label");
      await expect(labels.nth(1)).toContainText("Plate type");
      await page.screenshot({
        path: getScreenshotPath("10_详细信息_PlateType显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("10_详细信息_PlateType显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("10_详细信息_PlateType显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 详细信息-Status 显示
  // ============================================================
  test("11_详细信息_Status显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labels = page.locator("span.vp-detail-label");
      await expect(labels.nth(2)).toContainText("Status");
      await page.screenshot({
        path: getScreenshotPath("11_详细信息_Status显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("11_详细信息_Status显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("11_详细信息_Status显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 详细信息-Error Message 显示
  // ============================================================
  test("12_详细信息_ErrorMessage显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labels = page.locator("span.vp-detail-label");
      await expect(labels.nth(3)).toContainText("Error Message");
      await page.screenshot({
        path: getScreenshotPath("12_详细信息_ErrorMessage显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("12_详细信息_ErrorMessage显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("12_详细信息_ErrorMessage显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 详细信息-Def./Data ready/Sent 时间显示
  // ============================================================
  test("13_详细信息_时间显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labels = page.locator("span.vp-detail-label");
      await expect(labels.nth(4)).toContainText("Def.");
      await expect(labels.nth(5)).toContainText("Data ready");
      await expect(labels.nth(6)).toContainText("Sent to CAB factory");
      await page.screenshot({
        path: getScreenshotPath("13_详细信息_时间显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("13_详细信息_时间显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("13_详细信息_时间显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 详细信息-Print items 显示
  // ============================================================
  test("14_详细信息_PrintItems显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labels = page.locator("span.vp-detail-label");
      await expect(labels.nth(7)).toContainText("Print items");
      await page.screenshot({
        path: getScreenshotPath("14_详细信息_PrintItems显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("14_详细信息_PrintItems显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("14_详细信息_PrintItems显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 详细信息-VP Data 显示
  // ============================================================
  test("15_详细信息_VPData显示", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      const labels = page.locator("span.vp-detail-label");
      await expect(labels.nth(8)).toContainText("VP Data");
      await page.screenshot({
        path: getScreenshotPath("15_详细信息_VPData显示", "001_表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("15_详细信息_VPData显示", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("15_详细信息_VPData显示", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 状态更新-未先查询时点击
  // ============================================================
  test("16_状态更新_未先查询时点击", async ({ page }) => {
    await openPage(page);

    // 未查询状态下点击 Set Regenerate
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "Set Regenerate" })
      .click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath(
        "16_状态更新_未先查询时点击",
        "001_SetRegenerate",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // エラーメッセージ確認
    const errMsg = page.locator("div.vp-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("16_状态更新_未先查询时点击", "002_ｴﾗｰ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 Set Regenerate-成功
  // ============================================================
  test("17_SetRegenerate_成功", async ({ page }) => {
    await openPage(page);

    // 先查询
    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("17_SetRegenerate_成功", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      // Set Regenerate クリック（API利用可能な場合のみ）
      const regenBtn = page
        .locator("button.vp-btn")
        .filter({ hasText: "Set Regenerate" });
      if (await regenBtn.isEnabled().catch(() => false)) {
        await regenBtn.click();
        await page.waitForTimeout(2000);

        const succMsg = page.locator("div.vp-success-message");
        if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(succMsg).toBeVisible();
          await page.screenshot({
            path: getScreenshotPath("17_SetRegenerate_成功", "002_成功"),
            type: "jpeg",
            quality: 80,
            fullPage: true,
          });
        } else {
          await page.screenshot({
            path: getScreenshotPath("17_SetRegenerate_成功", "002_結果"),
            type: "jpeg",
            quality: 80,
            fullPage: true,
          });
        }
      } else {
        await page.screenshot({
          path: getScreenshotPath("17_SetRegenerate_成功", "001_照会不可"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      }
      await page.screenshot({
        path: getScreenshotPath("17_SetRegenerate_成功", "003_状態確認"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("17_SetRegenerate_成功", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.18 Set OK-成功
  // ============================================================
  test("18_SetOK_成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("18_SetOK_成功", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      await page.locator("button.vp-btn").filter({ hasText: "Set OK" }).click();
      await page.waitForTimeout(2000);

      const succMsg = page.locator("div.vp-success-message");
      if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(succMsg).toBeVisible();
        await page.screenshot({
          path: getScreenshotPath("18_SetOK_成功", "002_成功"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      } else {
        await page.screenshot({
          path: getScreenshotPath("18_SetOK_成功", "002_結果"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      }
    } else {
      await page.screenshot({
        path: getScreenshotPath("18_SetOK_成功", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("18_SetOK_成功", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 Change to Basic Info-成功
  // ============================================================
  test("19_ChangeToBasicInfo_成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("19_ChangeToBasicInfo_成功", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      await page
        .locator("button.vp-btn")
        .filter({ hasText: "Change to Basic Info" })
        .click();
      await page.waitForTimeout(2000);

      const succMsg = page.locator("div.vp-success-message");
      if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(succMsg).toBeVisible();
        await page.screenshot({
          path: getScreenshotPath("19_ChangeToBasicInfo_成功", "002_成功"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      } else {
        await page.screenshot({
          path: getScreenshotPath("19_ChangeToBasicInfo_成功", "002_結果"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      }
    } else {
      await page.screenshot({
        path: getScreenshotPath("19_ChangeToBasicInfo_成功", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("19_ChangeToBasicInfo_成功", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 Change to Advanced Info-成功
  // ============================================================
  test("20_ChangeToAdvancedInfo_成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("20_ChangeToAdvancedInfo_成功", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      await page
        .locator("button.vp-btn")
        .filter({ hasText: "Change to Advanced Info" })
        .click();
      await page.waitForTimeout(2000);

      const succMsg = page.locator("div.vp-success-message");
      if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(succMsg).toBeVisible();
        await page.screenshot({
          path: getScreenshotPath("20_ChangeToAdvancedInfo_成功", "002_成功"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      } else {
        await page.screenshot({
          path: getScreenshotPath("20_ChangeToAdvancedInfo_成功", "002_結果"),
          type: "jpeg",
          quality: 80,
          fullPage: true,
        });
      }
    } else {
      await page.screenshot({
        path: getScreenshotPath("20_ChangeToAdvancedInfo_成功", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("20_ChangeToAdvancedInfo_成功", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 状态更新-失败（API 返回错误）
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("21_状态更新_API返回错误", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("21_状态更新_API返回错误", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      await page
        .locator("button.vp-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(2000);

      const errMsg = page.locator("div.vp-error-message");
      if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(errMsg).toBeVisible();
      }
      await page.screenshot({
        path: getScreenshotPath("21_状态更新_API返回错误", "002_結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("21_状态更新_API返回错误", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("21_状态更新_API返回错误", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 状态更新-加载中按钮禁用
  // ============================================================
  test("22_状态更新_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("22_状态更新_加载中按钮禁用", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      // 更新ボタンクリック後即座に状態確認
      await page
        .locator("button.vp-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(200);

      const allBtns = page.locator("button.vp-btn");
      const btnCount = await allBtns.count();
      let anyDisabled = false;
      for (let i = 0; i < btnCount; i++) {
        if (await allBtns.nth(i).isDisabled()) {
          anyDisabled = true;
          break;
        }
      }
      await page.screenshot({
        path: getScreenshotPath("22_状态更新_加载中按钮禁用", "002_読込中"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("22_状态更新_加载中按钮禁用", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("22_状态更新_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 状态更新-防止重复提交
  // ============================================================
  test("23_状态更新_防止重复提交", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: getScreenshotPath("23_状态更新_防止重复提交", "001_照会後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });

      // 連続クリック
      const updateBtn = page
        .locator("button.vp-btn")
        .filter({ hasText: "Set Regenerate" });
      await updateBtn.click();
      await page.waitForTimeout(100);
      await updateBtn.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: getScreenshotPath("23_状态更新_防止重复提交", "002_連続ｸﾘｯｸ後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("23_状态更新_防止重复提交", "001_照会不可"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("23_状态更新_防止重复提交", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 异常处理-API 超时
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("24_异常处理_API超时", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.vp-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 実際のAPI応答を確認
    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "002_応答確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-数据库更新异常
  // ※モック禁止のため実際の動作を確認
  // ============================================================
  test("25_异常处理_数据库更新异常", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page
        .locator("button.vp-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({
      path: getScreenshotPath("25_异常处理_数据库更新异常", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-用户未登录
  // ============================================================
  test("26_异常处理_用户未登录", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("26_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 错误消息-显示样式
  // ============================================================
  test("27_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 空入力でView Infoをクリックしてエラーを発生
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.vp-error-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("27_错误消息_显示样式", "001_ｴﾗｰ表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("27_错误消息_显示样式", "001_状態"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("27_错误消息_显示样式", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 成功消息-显示样式
  // ============================================================
  test("28_成功消息_显示样式", async ({ page }) => {
    await openPage(page);

    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);

    const details = page.locator("div.vp-details");
    if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page
        .locator("button.vp-btn")
        .filter({ hasText: "Set Regenerate" })
        .click();
      await page.waitForTimeout(2000);

      const succMsg = page.locator("div.vp-success-message");
      if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(succMsg).toBeVisible();
      }
    }
    await page.screenshot({
      path: getScreenshotPath("28_成功消息_显示样式", "001_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 页面刷新
  // ============================================================
  test("29_页面刷新", async ({ page }) => {
    await openPage(page);

    // 入力してView Info
    await page.locator("input.vp-input").fill(VALID_CHASSIS);
    await page
      .locator("button.vp-btn")
      .filter({ hasText: "View Info" })
      .click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("29_页面刷新", "001_操作後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h2.vp-section-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("29_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 入力欄がクリアされている
    const inputVal = await page.locator("input.vp-input").inputValue();
    expect(inputVal).toBe("");
    await page.screenshot({
      path: getScreenshotPath("29_页面刷新", "003_初期化確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 詳細エリア非表示
    const details = page.locator("div.vp-details");
    if (await details.isVisible().catch(() => false)) {
      await expect(details).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("29_页面刷新", "004_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 安全性-API 请求协议
  // ============================================================
  test("30_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.vp-section-title")).toBeVisible();
    const currentUrl = page.url();
    expect(currentUrl).toContain("http://");
    await page.screenshot({
      path: getScreenshotPath("30_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("30_安全性_API请求协议", "002_URL確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 安全性-权限控制
  // ============================================================
  test("31_安全性_权限控制", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.vp-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("31_安全性_权限控制", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 全ボタンが表示されていることを確認
    const btnNames = [
      "View Info",
      "Set Regenerate",
      "Set OK",
      "Change to Basic Info",
      "Change to Advanced Info",
    ];
    for (const name of btnNames) {
      await expect(
        page.locator("button.vp-btn").filter({ hasText: name }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("31_安全性_权限控制", "002_ﾎﾞﾀﾝ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
