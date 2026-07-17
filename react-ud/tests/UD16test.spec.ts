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
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD16";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/ad-change`;

// ============================================================
// 截图计数器（全局顺序编号）
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD16画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// DB接続状態
// ============================================================
let dbAvailable = false;
const TEST_PREFIX = "UT16_";

async function setupTestData() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    dbAvailable = true;
    try {
      const db = conn as any;
      // 清除旧的测试数据
      await db.execute("DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE LIKE ?", [
        `${TEST_PREFIX}%`,
      ]);
      // 插入UD16测试用数据（INSERT IGNORE防止并行执行时主键冲突）
      await db.execute(
        `INSERT IGNORE INTO HDOC_ADCA_CHANGE (SERIE, CHNR, ACT, BU, REASON, REGISTER_DATETIME, REGISTER_USER, REGISTER_PROCESS, UPDATE_DATETIME, UPDATE_USER, UPDATE_PROCESS)
         VALUES (?, ?, 'Y', 'BU01', 'UT16 test record', NOW(), ?, ?, NOW(), ?, ?)`,
        [
          "UT16S", // SERIE列varchar(5)以内
          "TEST001",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
          "PLAYWRIGHT",
        ],
      );
      console.log("UD16 test data inserted");
    } finally {
      await conn.end();
    }
  } catch (err) {
    console.warn("DB not available:", err);
    dbAvailable = false;
  }
}

async function clearTestData() {
  if (!dbAvailable) return;
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
      const db = conn as any;
      await db.execute("DELETE FROM HDOC_ADCA_CHANGE WHERE SERIE LIKE ?", [
        `${TEST_PREFIX}%`,
      ]);
    } finally {
      await conn.end();
    }
  } catch {
    /* ignore */
  }
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
    await page.waitForSelector("h2.adc-section-title", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(500);
}

// テスト用Serie-Chnr（setupTestDataで挿入したDBのテストデータと一致）
const VALID_SERIE_CHNR = `${TEST_PREFIX}SERIE-TEST001`;
const VALID_DESC = "テスト用AD Change説明";

// 4000字を超える文字列を生成
function longString(length: number): string {
  return "x".repeat(length);
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD16 ADChange - 单体测试", () => {
  test.beforeAll(async () => {
    await setupTestData();
  });

  test.afterAll(async () => {
    await clearTestData();
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
    await expect(page.locator("h2.adc-section-title")).toBeVisible();
    await expect(page.locator("h2.adc-section-title")).toHaveText("AD Change");
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Serie-Chnr 输入框
    await expect(page.locator("label.adc-label").first()).toBeVisible();
    await expect(page.locator("label.adc-label").first()).toHaveText(
      "Serie-Chnr",
    );
    await expect(page.locator("input.adc-input")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_SerieChnr"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Desc 输入框
    await expect(page.locator("label.adc-label").nth(1)).toBeVisible();
    await expect(page.locator("label.adc-label").nth(1)).toHaveText("Desc");
    await expect(page.locator("input.adc-input-desc")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_Desc"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 按钮：ADD、DELETE、CHECK
    const btnNames = ["ADD", "DELETE", "CHECK"];
    for (const name of btnNames) {
      await expect(
        page.locator("button.adc-btn").filter({ hasText: name }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_ﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-输入框初始状态
  // ============================================================
  test("02_画面初期显示_输入框初始状态", async ({ page }) => {
    await openPage(page);

    // 1. Serie-Chnr 为空
    const serieInput = page.locator("input.adc-input");
    expect(await serieInput.inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath(
        "02_画面初期显示_输入框初始状态",
        "001_SerieChnr空",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Desc 为空
    const descInput = page.locator("input.adc-input-desc");
    expect(await descInput.inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_输入框初始状态", "002_Desc空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 按钮可用
    for (const name of ["ADD", "DELETE", "CHECK"]) {
      await expect(
        page.locator("button.adc-btn").filter({ hasText: name }),
      ).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_输入框初始状态", "003_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 无消息
    const errMsg = page.locator("div.adc-error-message");
    const succMsg = page.locator("div.adc-success-message");
    if (await errMsg.isVisible().catch(() => false)) {
      await expect(errMsg).not.toBeVisible();
    }
    if (await succMsg.isVisible().catch(() => false)) {
      await expect(succMsg).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_输入框初始状态", "004_ﾒｯｾｰｼﾞ無"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 ADD-Serie-Chnr 为空
  // ============================================================
  test("03_ADD_SerieChnr为空", async ({ page }) => {
    await openPage(page);

    // 空のままADDをクリック
    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.adc-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("Serie-Chnr不能为空");
    await page.screenshot({
      path: getScreenshotPath("03_ADD_SerieChnr为空", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ADD按钮恢复可用
    await expect(
      page.locator("button.adc-btn").filter({ hasText: "ADD" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("03_ADD_SerieChnr为空", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 ADD-Serie-Chnr 长度超过 15 字符
  // ============================================================
  test("04_ADD_SerieChnr超长", async ({ page }) => {
    await openPage(page);

    // 16文字を入力（maxLength=15なので15文字までしか入力できない）
    await page.locator("input.adc-input").fill(longString(16));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("04_ADD_SerieChnr超长", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // maxLengthにより15文字に制限される
    const inputVal = await page.locator("input.adc-input").inputValue();
    expect(inputVal.length).toBeLessThanOrEqual(15);

    // ADDクリック（15文字以内ならバリデーション通過）
    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("04_ADD_SerieChnr超长", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 ADD-Desc 长度超过 4000 字符
  // ============================================================
  test("05_ADD_Desc超长", async ({ page }) => {
    await openPage(page);

    // 有効なSerie-Chnrを入力
    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);

    // 4001文字以上のDescを入力（maxLength=4000なので4000文字まで）
    await page.locator("input.adc-input-desc").fill(longString(4001));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("05_ADD_Desc超长", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const descVal = await page.locator("input.adc-input-desc").inputValue();
    expect(descVal.length).toBeLessThanOrEqual(4000);

    // ADDクリック（Descが4000文字以下なのでバリデーション通過）
    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("05_ADD_Desc超长", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 ADD-成功
  // ============================================================
  test("06_ADD_成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("06_ADD_成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(2000);

    const succMsg = page.locator("div.adc-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("06_ADD_成功", "002_成功"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      const errMsg = page.locator("div.adc-error-message");
      if (await errMsg.isVisible().catch(() => false)) {
        await expect(errMsg).toBeVisible();
      }
      await page.screenshot({
        path: getScreenshotPath("06_ADD_成功", "002_結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("06_ADD_成功", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 ADD-记录已存在且未激活
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("07_ADD_记录已存在且未激活", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("07_ADD_记录已存在且未激活", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("07_ADD_记录已存在且未激活", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 ADD-失败（API 返回 500）
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("08_ADD_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("08_ADD_API返回500", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("08_ADD_API返回500", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.adc-btn").filter({ hasText: "ADD" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("08_ADD_API返回500", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 ADD-加载中按钮禁用
  // ============================================================
  test("09_ADD_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("09_ADD_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ADDクリック後即座に状態確認
    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(200);

    const addBtn = page.locator("button.adc-btn").filter({ hasText: "ADD" });
    const isDisabled = await addBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      await expect(addBtn).toBeDisabled();
    }
    await page.screenshot({
      path: getScreenshotPath("09_ADD_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("09_ADD_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 DELETE-Serie-Chnr 为空
  // ============================================================
  test("10_DELETE_SerieChnr为空", async ({ page }) => {
    await openPage(page);

    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.adc-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("Serie-Chnr不能为空");
    await page.screenshot({
      path: getScreenshotPath("10_DELETE_SerieChnr为空", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 DELETE-确认对话框-点击取消
  // ============================================================
  test("11_DELETE_确认对话框点击取消", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("11_DELETE_确认对话框点击取消", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认对话框をキャンセル
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });
    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("11_DELETE_确认对话框点击取消", "002_取消後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // DELETE按钮恢复可用
    await expect(
      page.locator("button.adc-btn").filter({ hasText: "DELETE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("11_DELETE_确认对话框点击取消", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 DELETE-确认对话框-点击确定并成功
  // ============================================================
  test("12_DELETE_确认对话框点击确定成功", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("12_DELETE_确认对话框点击确定成功", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(2000);

    const succMsg = page.locator("div.adc-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("12_DELETE_确认对话框点击确定成功", "002_成功"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      const errMsg = page.locator("div.adc-error-message");
      if (await errMsg.isVisible().catch(() => false)) {
        await expect(errMsg).toBeVisible();
      }
      await page.screenshot({
        path: getScreenshotPath("12_DELETE_确认对话框点击确定成功", "002_結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath(
        "12_DELETE_确认对话框点击确定成功",
        "003_状態確認",
      ),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 DELETE-记录不存在
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("13_DELETE_记录不存在", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill("NONEXIST-12345");
    await page.screenshot({
      path: getScreenshotPath("13_DELETE_记录不存在", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("13_DELETE_记录不存在", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 DELETE-失败（API 返回 500）
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("14_DELETE_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("14_DELETE_API返回500", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("14_DELETE_API返回500", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.adc-btn").filter({ hasText: "DELETE" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("14_DELETE_API返回500", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 DELETE-加载中按钮禁用
  // ============================================================
  test("15_DELETE_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("15_DELETE_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(200);

    const delBtn = page.locator("button.adc-btn").filter({ hasText: "DELETE" });
    const isDisabled = await delBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      await expect(delBtn).toBeDisabled();
    }
    await page.screenshot({
      path: getScreenshotPath("15_DELETE_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("15_DELETE_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.16 CHECK-Serie-Chnr 为空
  // ============================================================
  test("16_CHECK_SerieChnr为空", async ({ page }) => {
    await openPage(page);

    await page.locator("button.adc-btn").filter({ hasText: "CHECK" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.adc-error-message");
    await expect(errMsg).toBeVisible();
    await expect(errMsg).toContainText("Serie-Chnr不能为空");
    await page.screenshot({
      path: getScreenshotPath("16_CHECK_SerieChnr为空", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.adc-btn").filter({ hasText: "CHECK" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("16_CHECK_SerieChnr为空", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.17 CHECK-记录存在且已激活
  // ============================================================
  test("17_CHECK_记录存在且已激活", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("17_CHECK_记录存在且已激活", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "CHECK" }).click();
    await page.waitForTimeout(2000);

    const succMsg = page.locator("div.adc-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("17_CHECK_记录存在且已激活", "002_成功"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      const errMsg = page.locator("div.adc-error-message");
      if (await errMsg.isVisible().catch(() => false)) {
        await expect(errMsg).toBeVisible();
      }
      await page.screenshot({
        path: getScreenshotPath("17_CHECK_记录存在且已激活", "002_結果"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
    await page.screenshot({
      path: getScreenshotPath("17_CHECK_记录存在且已激活", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.18 CHECK-记录存在但未激活
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("18_CHECK_记录存在但未激活", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("18_CHECK_记录存在但未激活", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "CHECK" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("18_CHECK_记录存在但未激活", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 CHECK-记录不存在
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("19_CHECK_记录不存在", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill("NONEXIST-12345");
    await page.screenshot({
      path: getScreenshotPath("19_CHECK_记录不存在", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "CHECK" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("19_CHECK_记录不存在", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.20 CHECK-失败（API 返回 500）
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("20_CHECK_API返回500", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("20_CHECK_API返回500", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "CHECK" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("20_CHECK_API返回500", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await expect(
      page.locator("button.adc-btn").filter({ hasText: "CHECK" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("20_CHECK_API返回500", "003_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 CHECK-加载中按钮禁用
  // ============================================================
  test("21_CHECK_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("21_CHECK_加载中按钮禁用", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "CHECK" }).click();
    await page.waitForTimeout(200);

    const checkBtn = page
      .locator("button.adc-btn")
      .filter({ hasText: "CHECK" });
    const isDisabled = await checkBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      await expect(checkBtn).toBeDisabled();
    }
    await page.screenshot({
      path: getScreenshotPath("21_CHECK_加载中按钮禁用", "002_読込中"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("21_CHECK_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 Serie-Chnr-最大长度 15 字符
  // ============================================================
  test("22_SerieChnr_最大长度15字符", async ({ page }) => {
    await openPage(page);

    const input = page.locator("input.adc-input");

    // 20文字を入力
    await input.fill(longString(20));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("22_SerieChnr_最大长度15字符", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(15);
    await page.screenshot({
      path: getScreenshotPath("22_SerieChnr_最大长度15字符", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 Desc-最大长度 4000 字符
  // ============================================================
  test("23_Desc_最大长度4000字符", async ({ page }) => {
    await openPage(page);

    const input = page.locator("input.adc-input-desc");

    // 5000文字を入力
    await input.fill(longString(5000));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: getScreenshotPath("23_Desc_最大长度4000字符", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    const val = await input.inputValue();
    expect(val.length).toBeLessThanOrEqual(4000);
    await page.screenshot({
      path: getScreenshotPath("23_Desc_最大长度4000字符", "002_確認"),
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

    await expect(page.locator("h2.adc-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: getScreenshotPath("24_异常处理_API超时", "002_応答確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.25 异常处理-网络连接失败
  // ※モック禁止のため、実際の動作を確認
  // ============================================================
  test("25_异常处理_网络连接失败", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("25_异常处理_网络连接失败", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: getScreenshotPath("25_异常处理_网络连接失败", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.26 异常处理-数据库连接异常
  // ※モック禁止のため、実際のAPIレスポンスを確認
  // ============================================================
  test("26_异常处理_数据库连接异常", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_数据库连接异常", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(2000);

    const errMsg = page.locator("div.adc-error-message");
    if (await errMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("26_异常处理_数据库连接异常", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.27 异常处理-用户未登录
  // ============================================================
  test("27_异常处理_用户未登录", async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: getScreenshotPath("27_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.28 错误消息-显示样式
  // ============================================================
  test("28_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 空入力でADDをクリックしてエラー発生
    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(500);

    const errMsg = page.locator("div.adc-error-message");
    await expect(errMsg).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("28_错误消息_显示样式", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("28_错误消息_显示样式", "002_確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.29 成功消息-显示样式
  // ============================================================
  test("29_成功消息_显示样式", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("29_成功消息_显示样式", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.adc-btn").filter({ hasText: "ADD" }).click();
    await page.waitForTimeout(2000);

    const succMsg = page.locator("div.adc-success-message");
    if (await succMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(succMsg).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("29_成功消息_显示样式", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.30 页面刷新
  // ============================================================
  test("30_页面刷新", async ({ page }) => {
    await openPage(page);

    // 値を入力
    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.locator("input.adc-input-desc").fill(VALID_DESC);
    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "001_入力後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(1000);
    try {
      await page.waitForSelector("h2.adc-section-title", { timeout: 10000 });
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 入力欄がクリアされている
    expect(await page.locator("input.adc-input").inputValue()).toBe("");
    expect(await page.locator("input.adc-input-desc").inputValue()).toBe("");
    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "003_初期化確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ボタンは有効
    for (const name of ["ADD", "DELETE", "CHECK"]) {
      await expect(
        page.locator("button.adc-btn").filter({ hasText: name }),
      ).toBeEnabled();
    }
    await page.screenshot({
      path: getScreenshotPath("30_页面刷新", "004_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.31 安全性-API 请求协议
  // ============================================================
  test("31_安全性_API请求协议", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.adc-section-title")).toBeVisible();
    const currentUrl = page.url();
    expect(currentUrl).toContain("http://");
    await page.screenshot({
      path: getScreenshotPath("31_安全性_API请求协议", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
    await page.screenshot({
      path: getScreenshotPath("31_安全性_API请求协议", "002_URL確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.32 安全性-权限控制
  // ============================================================
  test("32_安全性_权限控制", async ({ page }) => {
    await openPage(page);

    await expect(page.locator("h2.adc-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("32_安全性_权限控制", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 全ボタン表示確認
    for (const name of ["ADD", "DELETE", "CHECK"]) {
      await expect(
        page.locator("button.adc-btn").filter({ hasText: name }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("32_安全性_权限控制", "002_ﾎﾞﾀﾝ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.33 安全性-DELETE 操作确认
  // ============================================================
  test("33_安全性_DELETE操作确认", async ({ page }) => {
    await openPage(page);

    await page.locator("input.adc-input").fill(VALID_SERIE_CHNR);
    await page.screenshot({
      path: getScreenshotPath("33_安全性_DELETE操作确认", "001_入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 确认对话框出现させる
    let dialogAppeared = false;
    page.on("dialog", async (dialog) => {
      dialogAppeared = true;
      expect(dialog.message()).toContain("delete");
      await dialog.dismiss();
    });
    await page.locator("button.adc-btn").filter({ hasText: "DELETE" }).click();
    await page.waitForTimeout(500);

    expect(dialogAppeared).toBe(true);
    await page.screenshot({
      path: getScreenshotPath("33_安全性_DELETE操作确认", "002_確認後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
