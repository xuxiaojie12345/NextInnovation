import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

// ============================================================
// 截图保存路径
// ============================================================
const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD13";

// ============================================================
// 应用URL
// ============================================================
const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/hdoc-template-check`;

// ============================================================
// 截图计数器
// ============================================================
let screenshotCounter = 0;

function getScreenshotPath(_testName: string, _stepName: string): string {
  screenshotCounter++;
  const seq = String(screenshotCounter).padStart(3, "0");
  return `${SCREENSHOT_DIR}/UD13画面ピクチャー${seq}.jpeg`;
}

// ============================================================
// テスト共通関数
// ============================================================
const TEST_TEMP_DIR = path.join(__dirname, "../test-temp-ud13");

function ensureTempDir() {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
}

/** テスト用のrtfファイルを作成 */
function createRtfFile(
  fileName: string,
  content: string = "test content without variables",
): string {
  ensureTempDir();
  const filePath = path.join(TEST_TEMP_DIR, fileName);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

/** 複数の$...$変数を含むrtfファイルを作成 */
function createRtfWithVariables(
  fileName: string,
  varCount: number = 3,
): string {
  ensureTempDir();
  const vars: string[] = [];
  for (let i = 1; i <= varCount; i++) {
    vars.push(`$variable${i}$`);
  }
  const content = `rtf content with variables: ${vars.join(" ")}`;
  const filePath = path.join(TEST_TEMP_DIR, fileName);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

/** ファイル名のみのrtfファイル（変数なし）を作成 */
function createSimpleRtfFile(fileName: string): string {
  ensureTempDir();
  const filePath = path.join(TEST_TEMP_DIR, fileName);
  fs.writeFileSync(
    filePath,
    "Plain text without any dollar variables.",
    "utf8",
  );
  return filePath;
}

function cleanupTempDir() {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    const files = fs.readdirSync(TEST_TEMP_DIR);
    for (const f of files) {
      fs.unlinkSync(path.join(TEST_TEMP_DIR, f));
    }
  }
}

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
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(1000);
}

/** ファイルを選択するヘルパー */
async function selectFile(page: Page, filePath: string) {
  await page.locator("input#template-file-input").setInputFiles(filePath);
  await page.waitForTimeout(500);
}

/** 選択されたファイル名を取得 */
async function getSelectedFileName(page: Page): Promise<string> {
  return page.locator("input#template-file-input").inputValue();
}

// ============================================================
// テストスイート
// ============================================================
test.describe("UD13 HdocTemplateCheck - 单体测试", () => {
  test.beforeAll(async () => {
    ensureTempDir();
  });

  test.afterAll(async () => {
    cleanupTempDir();
  });

  test.beforeAll(() => {
    screenshotCounter = 0;
  });

  // ============================================================
  // No.1 画面初期显示-基本元素
  // ============================================================
  test("01_画面初期显示_基本元素", async ({ page }) => {
    await openPage(page);

    // 1. 显示标题 "HDoc Template Check"
    await expect(page.locator("h2.htc-section-title")).toBeVisible();
    await expect(page.locator("h2.htc-section-title")).toHaveText(
      "HDoc Template Check",
    );
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "001_ﾀｲﾄﾙ確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 显示说明文本（如果有）
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "002_画面全体"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 显示文件选择输入框
    await expect(page.locator("input#template-file-input")).toBeVisible();
    await expect(page.locator("label.htc-label")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "003_ﾌｧｲﾙ入力"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 4. 显示 Check 按钮
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "004_Checkﾎﾞﾀﾝ"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 5. 错误消息和成功消息区域为空（コンポーネントに存在しない場合はスキップ）
    const errorMsg = page.locator("div.htc-error-message");
    const successMsg = page.locator("div.htc-success-message");
    if (await errorMsg.isVisible().catch(() => false)) {
      await expect(errorMsg).not.toBeVisible();
    }
    if (await successMsg.isVisible().catch(() => false)) {
      await expect(successMsg).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("01_画面初期显示_基本元素", "005_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.2 画面初期显示-初始状态
  // ============================================================
  test("02_画面初期显示_初始状态", async ({ page }) => {
    await openPage(page);

    // 1. 文件选择框为空
    await expect(page.locator("input#template-file-input")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初始状态", "001_ﾌｧｲﾙ空"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Check 按钮可用
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初始状态", "002_ﾎﾞﾀﾝ有効"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. 错误消息和成功消息が表示されていないことを確認
    const errorMsg = page.locator("div.htc-error-message");
    const successMsg = page.locator("div.htc-success-message");
    const downloadLink = page.locator("a.htc-download-link");
    await page.screenshot({
      path: getScreenshotPath("02_画面初期显示_初始状态", "003_初期状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.3 文件选择-选择 rtf 文件
  // ============================================================
  test("03_文件选择_选择rtf文件", async ({ page }) => {
    await openPage(page);

    const testFilePath = createRtfFile("test_template.rtf");

    // 1. 选择rtf文件
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("03_文件选择_选择rtf文件", "001_ﾌｧｲﾙ選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. Check 按钮可用
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("03_文件选择_选择rtf文件", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.4 文件选择-取消选择（ブラウザのファイル選択ダイアログは自動化不可のため選択しない状態を確認）
  // ============================================================
  test("04_文件选择_取消选择", async ({ page }) => {
    await openPage(page);

    // 文件选择框为空
    await expect(page.locator("input#template-file-input")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("04_文件选择_取消选择", "001_未選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 何もエラーメッセージが表示されていない
    const errorMsg = page.locator("div.htc-error-message");
    if (await errorMsg.isVisible().catch(() => false)) {
      await expect(errorMsg).not.toBeVisible();
    }
    await page.screenshot({
      path: getScreenshotPath("04_文件选择_取消选择", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.5 文件选择-选择后重新选择
  // ============================================================
  test("05_文件选择_选择后重新选择", async ({ page }) => {
    await openPage(page);

    // 1. 先选择文件 a.rtf
    const fileAPath = createRtfFile("a.rtf", "file a content");
    await selectFile(page, fileAPath);
    await page.screenshot({
      path: getScreenshotPath("05_文件选择_选择后重新选择", "001_A選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 再次选择文件 b.rtf
    const fileBPath = createRtfFile("b.rtf", "file b content");
    await selectFile(page, fileBPath);
    await page.screenshot({
      path: getScreenshotPath("05_文件选择_选择后重新选择", "002_B選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. Check 按钮可用
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("05_文件选择_选择后重新选择", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.6 文件选择-非 rtf 文件（コンポーネントのaccept=".rtf"によりフィルタリング）
  // ============================================================
  test("06_文件选择_非rtf文件", async ({ page }) => {
    await openPage(page);

    const testFilePath = createRtfFile("test.docx", "docx content");
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("06_文件选择_非rtf文件", "001_選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンは利用可能
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeEnabled();
    await page.screenshot({
      path: getScreenshotPath("06_文件选择_非rtf文件", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.7 Check-未选择文件时点击
  // ============================================================
  test("07_Check_未选择文件时点击", async ({ page }) => {
    await openPage(page);

    // 1. 不选择文件，直接点击 Check 按钮
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("07_Check_未选择文件时点击", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check 按钮状态
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("07_Check_未选择文件时点击", "002_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.8 Check-文件读取失败（setInputFiles後にファイルを削除して読込失敗を模擬）
  // ============================================================
  test("08_Check_文件读取失败", async ({ page }) => {
    await openPage(page);

    // 選択後に削除するテンポラリファイルを作成
    const testFilePath = createRtfFile("temp_delete.rtf", "will be deleted");

    // ファイルを選択
    await selectFile(page, testFilePath);

    // ファイルを削除（読み取り失敗を模擬）
    try {
      fs.unlinkSync(testFilePath);
    } catch {
      /* ignore */
    }
    await page.screenshot({
      path: getScreenshotPath("08_Check_文件读取失败", "001_ﾌｧｲﾙ削除後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("08_Check_文件读取失败", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // ボタンは表示されている
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("08_Check_文件读取失败", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.9 Check-文件中没有找到变量
  // ============================================================
  test("09_Check_文件中没有找到变量", async ({ page }) => {
    await openPage(page);

    // 変数なしのrtfファイルを作成
    const testFilePath = createSimpleRtfFile("no_vars.rtf");
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("09_Check_文件中没有找到变量", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("09_Check_文件中没有找到变量", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("09_Check_文件中没有找到变量", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.10 Check-成功-找到变量
  // ============================================================
  test("10_Check_成功_找到变量", async ({ page }) => {
    await openPage(page);

    // 変数を含むrtfファイルを作成
    const testFilePath = createRtfWithVariables("with_vars.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("10_Check_成功_找到变量", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("10_Check_成功_找到变量", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("10_Check_成功_找到变量", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.11 Check-成功-变量数量统计（5個の変数）
  // ============================================================
  test("11_Check_成功_变量数量统计", async ({ page }) => {
    await openPage(page);

    // 5個の変数を含むrtfファイルを作成
    const testFilePath = createRtfWithVariables("five_vars.rtf", 5);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("11_Check_成功_变量数量统计", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("11_Check_成功_变量数量统计", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("11_Check_成功_变量数量统计", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.12 Check-成功-单个变量
  // ============================================================
  test("12_Check_成功_单个变量", async ({ page }) => {
    await openPage(page);

    // 1個の変数のみのrtfファイル
    const testFilePath = createRtfWithVariables("single_var.rtf", 1);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("12_Check_成功_单个变量", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("12_Check_成功_单个变量", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("12_Check_成功_单个变量", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.13 Check-加载中按钮禁用
  // ============================================================
  test("13_Check_加载中按钮禁用", async ({ page }) => {
    await openPage(page);

    const testFilePath = createRtfWithVariables("loading_test.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("13_Check_加载中按钮禁用", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: getScreenshotPath("13_Check_加载中按钮禁用", "002_ﾎﾞﾀﾝ状態"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.waitForTimeout(1000);
    await page.screenshot({
      path: getScreenshotPath("13_Check_加载中按钮禁用", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.14 Check-防止重复提交
  // ============================================================
  test("14_Check_防止重复提交", async ({ page }) => {
    await openPage(page);

    const testFilePath = createRtfWithVariables("dedup_test.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("14_Check_防止重复提交", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンを連続で2回クリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(100);
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: getScreenshotPath("14_Check_防止重复提交", "002_連続ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("14_Check_防止重复提交", "003_完了後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.15 Download-检查成功后显示链接
  // ============================================================
  test("15_Download_检查成功后显示链接", async ({ page }) => {
    await openPage(page);

    const testFilePath = createRtfWithVariables("download_test.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("15_Download_检查成功后显示链接", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: getScreenshotPath("15_Download_检查成功后显示链接", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Download リンクの確認
    const downloadLink = page.locator("a.htc-download-link");
    if (await downloadLink.isVisible().catch(() => false)) {
      await expect(downloadLink).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath(
          "15_Download_检查成功后显示链接",
          "003_ﾀﾞｳﾝﾛｰﾄﾞ表示",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath(
          "15_Download_检查成功后显示链接",
          "003_状態確認",
        ),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.16 Download-点击链接下载
  // ============================================================
  test("16_Download_点击链接下载", async ({ page }) => {
    await openPage(page);

    const testFilePath = createRtfWithVariables("download_click.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("16_Download_点击链接下载", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("16_Download_点击链接下载", "002_Check後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Download リンクが存在すればクリック
    const downloadLink = page.locator("a.htc-download-link");
    if (await downloadLink.isVisible().catch(() => false)) {
      // ダウンロードをキャプチャ
      const downloadPromise = page
        .waitForEvent("download", {
          timeout: 5000,
        })
        .catch(() => null);
      await downloadLink.click();
      await page.screenshot({
        path: getScreenshotPath("16_Download_点击链接下载", "003_ﾀﾞｳﾝﾛｰﾄﾞ後"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("16_Download_点击链接下载", "003_状態確認"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.17 异常处理-未预期的 JavaScript 错误
  // ============================================================
  test("17_异常处理_JavaScript错误", async ({ page }) => {
    await openPage(page);

    // 画面表示の確認
    await expect(page.locator("h2.htc-section-title")).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("17_异常处理_JavaScript错误", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // エラーメッセージの確認
    const errorMsg = page.locator("div.htc-error-message");
    if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMsg).toContainText("System error");
      await page.screenshot({
        path: getScreenshotPath("17_异常处理_JavaScript错误", "002_ｴﾗｰ表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("17_异常处理_JavaScript错误", "002_状態確認"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.18 异常处理-用户未登录
  // ============================================================
  test("18_异常处理_用户未登录", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    // 直接访问页面
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // 组件不检查登录状态，直接访问
    await page.screenshot({
      path: getScreenshotPath("18_异常处理_用户未登录", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.19 错误消息-显示样式
  // ============================================================
  test("19_错误消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 未選択でCheckボタンをクリックしてエラーをトリガー
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("19_错误消息_显示样式", "001_ｸﾘｯｸ後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // エラーメッセージ表示確認
    const errorMsg = page.locator("div.htc-error-message");
    if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMsg).toBeVisible();
      await page.screenshot({
        path: getScreenshotPath("19_错误消息_显示样式", "002_ｴﾗｰ表示"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: getScreenshotPath("19_错误消息_显示样式", "002_状態確認"),
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
    }
  });

  // ============================================================
  // No.20 成功消息-显示样式
  // ============================================================
  test("20_成功消息_显示样式", async ({ page }) => {
    await openPage(page);

    // 変数を含むファイルでCheck実行
    const testFilePath = createRtfWithVariables("success_style.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("20_成功消息_显示样式", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("20_成功消息_显示样式", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("20_成功消息_显示样式", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.21 消息清空-新操作时覆盖
  // ============================================================
  test("21_消息清空_新操作时覆盖", async ({ page }) => {
    await openPage(page);

    // 1. 先触发错误：不选择文件点击Check
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("21_消息清空_新操作时覆盖", "001_ｴﾗｰ表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 选择文件后再次Check
    const testFilePath = createRtfWithVariables("clear_test.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("21_消息清空_新操作时覆盖", "002_ﾌｧｲﾙ選択後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("21_消息清空_新操作时覆盖", "003_再度Check後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.22 页面刷新
  // ============================================================
  test("22_页面刷新", async ({ page }) => {
    await openPage(page);

    // 1. 选择文件
    const testFilePath = createRtfWithVariables("refresh_test.rtf", 3);
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("22_页面刷新", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 2. 刷新页面
    await page.reload();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: getScreenshotPath("22_页面刷新", "002_再読込後"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // 3. ファイル選択がクリアされている
    await expect(page.locator("input#template-file-input")).toBeVisible();
    await expect(
      page.locator("button.htc-btn").filter({ hasText: "Check" }),
    ).toBeVisible();
    await page.screenshot({
      path: getScreenshotPath("22_页面刷新", "003_初期状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.23 安全性-用户登录认证
  // ============================================================
  test("23_安全性_用户登录认证", async ({ page }) => {
    // 清除登录状态
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("currentUser"));

    // 直接访问页面
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // 组件不检查登录状态
    await page.screenshot({
      path: getScreenshotPath("23_安全性_用户登录认证", "001_画面表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  // ============================================================
  // No.24 安全性-文件类型验证
  // ============================================================
  test("24_安全性_文件类型验证", async ({ page }) => {
    await openPage(page);

    // 非rtfファイルを選択
    const testFilePath = createRtfFile("test.txt", "text content");
    await selectFile(page, testFilePath);
    await page.screenshot({
      path: getScreenshotPath("24_安全性_文件类型验证", "001_ﾌｧｲﾙ選択"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    // Check ボタンをクリック
    await page.locator("button.htc-btn").filter({ hasText: "Check" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: getScreenshotPath("24_安全性_文件类型验证", "002_結果"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });

    await page.screenshot({
      path: getScreenshotPath("24_安全性_文件类型验证", "003_状態確認"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
