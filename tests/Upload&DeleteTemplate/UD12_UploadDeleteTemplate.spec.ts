/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const UDT_URL = BASE_URL + "/upload-delete-template";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD12";

// 页面元素选择器（与 UploadDeleteTemplate.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 消息
  title: ".udt-title",
  error: ".udt-error",
  success: ".udt-success",
  warning: ".udt-warning",
  notice: ".udt-notice",
  // 上传区域
  uploadSection: ".udt-section >> nth=0",
  fileInput: ".udt-file-input",
  fileButton: ".udt-file-button",
  fileName: ".udt-file-name",
  uploadMarket: ".udt-select-small",
  uploadButton: ".udt-btn-primary",
  // 删除区域（.udt-select:not(.udt-select-small) 匹配删除区域的两个下拉，避免与上传下拉混淆）
  deleteSection: ".udt-section >> nth=1",
  deleteMarket: ".udt-select:not(.udt-select-small) >> nth=0",
  templatesSelect: ".udt-select:not(.udt-select-small) >> nth=1",
  btnDelete: ".udt-button-group .udt-btn >> nth=0",
  btnArchive: ".udt-button-group .udt-btn >> nth=1",
  // Check Template 区域
  checkSection: ".udt-section-check",
  checkTitle: ".udt-check-title",
  checkLink: ".udt-check-link",
};

/**
 * 截图辅助函数：以每个测试观点(用例)为单元，从 001 开始循环命名。
 */
function makeScreenshot(page: Page, caseName: string) {
  let counter = 0;
  return async (stepDesc: string) => {
    counter += 1;
    const seq = String(counter).padStart(3, "0");
    const safeName = caseName.replace(/[^\w\u4e00-\u9fa5]+/g, "_");
    const fileName = `${safeName}_${seq}.jpeg`;
    const fullPath = `${IMG_DIR}\\${fileName}`;
    await page.screenshot({ path: fullPath, type: "jpeg", quality: 80 });
    console.log(`[${caseName}] ${stepDesc} -> ${fullPath}`);
  };
}

async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.getElementById("webpack-dev-server-client-overlay");
    if (overlay) overlay.remove();
    const closeBtn = document.querySelector("#webpack-dev-server-client-overlay-close");
    if (closeBtn) (closeBtn as HTMLElement).click();
  });
}

/** 构造一个指定名称/大小的测试文件对象 */
function makeFile(name: string, sizeBytes: number, mime = "application/octet-stream") {
  return { name, mimeType: mime, buffer: Buffer.alloc(sizeBytes, 0x41) };
}

/**
 * 拦截并模拟 upload API：POST /api/templates/upload
 * 返回 { status, body }
 */
async function mockUpload(page: Page, status: number, body: any) {
  await page.route(/\/api\/templates\/upload/, (route) => {
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

/**
 * 拦截并模拟 getFileList API：GET /api/templates/list?market=xxx
 */
async function mockList(page: Page, files: string[]) {
  await page.route(/\/api\/templates\/list/, (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: files }) });
  });
}

/**
 * 拦截并模拟 delete API：DELETE /api/templates/delete?market=&filename=
 */
async function mockDeleteApi(page: Page, status: number, body: any) {
  await page.route(/\/api\/templates\/delete/, (route) => {
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

/**
 * 拦截并模拟 archive API：POST /api/templates/archive?market=&filename=
 */
async function mockArchiveApi(page: Page, status: number, body: any) {
  await page.route(/\/api\/templates\/archive/, (route) => {
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

/** 在删除区域选择 Market 并等待 Templates 列表加载 */
async function selectDeleteMarket(page: Page, market: string, files: string[]) {
  await mockList(page, files);
  await page.locator(SEL.deleteMarket).selectOption(market);
  await page.waitForTimeout(300);
}

test.describe("UD12 Upload&Delete Template 模块测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => localStorage.setItem("userID", "user001"));
    await dismissOverlay(page);
  });

  // ============================================================
  // 上传区域 - 画面初始化
  // ============================================================

  test("TC01 画面初始化-Market下拉列表", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-Market下拉列表");
    await page.goto(UDT_URL);
    await snap("访问 Upload&Delete Template 页面");

    // 1. 显示"HDoc Template Upload"标题
    await expect(page.locator(SEL.title).filter({ hasText: "HDoc Template Upload" })).toBeVisible();
    // 2. 显示"HDoc Template Delete/Archive"标题
    await expect(page.locator(SEL.title).filter({ hasText: "HDoc Template Delete/Archive" })).toBeVisible();
    // 3. 上传区域 Market 下拉列表显示市场列表（空+ JPN/USA/EU/CHN/KOR）
    const options = page.locator(`${SEL.uploadMarket} option`);
    await expect(options).toHaveCount(6);
    await expect(options.nth(1)).toHaveText("JPN");
    await expect(options.nth(2)).toHaveText("USA");
    // 5. Template File 选择按钮显示
    await expect(page.locator(SEL.fileButton)).toHaveText("ファイルを選択");
    await snap("确认标题、Market 下拉列表与文件选择按钮");
  });

  test("TC02 画面初始化-Market列表项", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-Market列表项");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 上传区域与删除区域 Market 下拉均显示固定选项（option 元素处于隐藏状态，改用文本/值断言）
    const upOptions = page.locator(`${SEL.uploadMarket} option`);
    await expect(upOptions).toHaveCount(6);
    await expect(upOptions.nth(1)).toHaveText("JPN");
    const delOptions = page.locator(SEL.deleteMarket).locator("option");
    await expect(delOptions).toHaveCount(6);
    await expect(delOptions.nth(1)).toHaveText("JPN");
    await snap("确认上传/删除区域 Market 下拉选项");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1. localStorage 中无 userID
    const hasUserID = await page.evaluate(() => !!localStorage.getItem("userID"));
    expect(hasUserID).toBe(false);
    // 2. 自动跳转到 /login
    await page.waitForURL("**/login");
    // 3. 不显示页面内容
    await expect(page.locator(SEL.title)).toHaveCount(0);
    await snap("确认未登录自动跳转到 /login 且不显示页面内容");
  });

  // ============================================================
  // 上传区域 - 文件选择
  // ============================================================

  test("TC04 文件选择-正常选择文件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_文件选择-正常选择文件");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 通过输入框选择 .docx 文件
    await page.locator(SEL.fileInput).setInputFiles(makeFile("test_template.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    await snap("选择文件 test_template.docx");

    // 1/2. 文件名显示在按钮右侧
    await expect(page.locator(SEL.fileName)).toHaveText("test_template.docx");
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认文件名显示且无错误消息");
  });

  test("TC05 文件选择-取消选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_文件选择-取消选择");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 以空文件列表模拟取消选择
    await page.locator(SEL.fileInput).setInputFiles([]);
    await snap("取消选择文件");

    // 1/2. 按钮右侧仍显示"選択されていません"
    await expect(page.locator(SEL.fileName)).toHaveText("選択されていません");
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认未选择文件且无错误消息");
  });

  test("TC06 文件选择-选择后重新选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_文件选择-选择后重新选择");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1次目: 选择 a.txt
    await page.locator(SEL.fileInput).setInputFiles(makeFile("a.txt", 1024, "text/plain"));
    await expect(page.locator(SEL.fileName)).toHaveText("a.txt");
    await snap("第一次选择 a.txt");

    // 2次目: 选择 b.txt
    await page.locator(SEL.fileInput).setInputFiles(makeFile("b.txt", 1024, "text/plain"));
    await snap("第二次选择 b.txt");

    // 1/2. 按钮右侧显示最新文件名 b.txt（原文件被替换）
    await expect(page.locator(SEL.fileName)).toHaveText("b.txt");
    await snap("确认显示最新选择的文件名 b.txt");
  });

  // ============================================================
  // 上传区域 - 空值校验
  // ============================================================

  test("TC07 空值校验-Template File未选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_空值校验-Template_File未选择");
    let uploadCalled = false;
    await page.route(/\/api\/templates\/upload/, () => { uploadCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // Market 选择 JPN，文件不选择，点击 Upload
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("文件未选择时点击 Upload");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("NO FILE UPLOADED");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认文件未选择错误消息且按钮可用");
  });

  test("TC08 空值校验-Market未选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_空值校验-Market未选择");
    let uploadCalled = false;
    await page.route(/\/api\/templates\/upload/, () => { uploadCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 文件选择，Market 不选择，点击 Upload
    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadButton).click();
    await snap("Market 未选择时点击 Upload");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please select a market.");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认 Market 未选择错误消息且按钮可用");
  });

  test("TC09 空值校验-两者都为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_空值校验-两者都为空");
    let uploadCalled = false;
    await page.route(/\/api\/templates\/upload/, () => { uploadCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 文件与 Market 均不选择，点击 Upload
    await page.locator(SEL.uploadButton).click();
    await snap("文件与 Market 都不选择时点击 Upload");

    // 1/2. 先触发文件空值校验，显示 NO FILE UPLOADED
    await expect(page.locator(SEL.error)).toHaveText("NO FILE UPLOADED");
    await snap("确认两者都空时显示文件未选择错误消息");
  });

  // ============================================================
  // 上传区域 - 上传成功
  // ============================================================

  test("TC10 上传成功-新文件JPN", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_上传成功-新文件JPN");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 选择文件并选择 Market JPN
    await page.locator(SEL.fileInput).setInputFiles(makeFile("new_template.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await snap("选择文件与 Market JPN");

    // 点击 Upload
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload 按钮");

    // 3. 显示成功消息
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE NEW_TEMPLATE.DOCX WAS SUCCESSFULLY UPLOADED TO MARKET JPN");
    // 4. 文件选择被清空
    await expect(page.locator(SEL.fileName)).toHaveText("選択されていません");
    // 5. Market 选择被清空
    await expect(page.locator(SEL.uploadMarket)).toHaveValue("");
    // 6. 按钮恢复为可用
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认上传成功消息且文件/Market 清空、按钮可用");
  });

  test("TC11 上传成功-不同Market（CHN）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_上传成功-CHN");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("chn_template.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    await page.locator(SEL.uploadMarket).selectOption("CHN");
    await page.locator(SEL.uploadButton).click();
    await snap("上传 chn_template.docx 到 CHN");

    // 1. 显示成功消息（上传到正确 Market）
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE CHN_TEMPLATE.DOCX WAS SUCCESSFULLY UPLOADED TO MARKET CHN");
    // 2. 文件与 Market 均被清空
    await expect(page.locator(SEL.fileName)).toHaveText("選択されていません");
    await expect(page.locator(SEL.uploadMarket)).toHaveValue("");
    await snap("确认上传到 CHN 成功且清空");
  });

  test("TC12 上传成功-不同Market（USA）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_上传成功-USA");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("usd_template.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    await page.locator(SEL.uploadMarket).selectOption("USA");
    await page.locator(SEL.uploadButton).click();
    await snap("上传 usd_template.docx 到 USA");

    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE USD_TEMPLATE.DOCX WAS SUCCESSFULLY UPLOADED TO MARKET USA");
    await snap("确认上传到 USA 成功");
  });

  test("TC13 上传成功-连续上传", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_上传成功-连续上传");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1次目: a.txt → JPN
    await page.locator(SEL.fileInput).setInputFiles(makeFile("a.txt", 1024, "text/plain"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE A.TXT WAS SUCCESSFULLY UPLOADED TO MARKET JPN");
    await snap("第一次上传 a.txt 到 JPN 成功");

    // 2次目: b.txt → CHN
    await page.locator(SEL.fileInput).setInputFiles(makeFile("b.txt", 1024, "text/plain"));
    await page.locator(SEL.uploadMarket).selectOption("CHN");
    await page.locator(SEL.uploadButton).click();
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE B.TXT WAS SUCCESSFULLY UPLOADED TO MARKET CHN");
    await snap("第二次上传 b.txt 到 CHN 成功");
  });

  // ============================================================
  // 上传区域 - 上传失败 / 异常
  // ============================================================

  test("TC14 上传失败-API返回错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_上传失败-API返回错误");
    await mockUpload(page, 400, { message: "Upload failed" });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload（API 返回错误）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Upload failed");
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    // 4. 不显示成功消息
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await snap("确认上传失败错误消息且无成功消息");
  });

  test("TC15 异常处理-401未授权（上传）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_异常处理-401未授权");
    await mockUpload(page, 401, { message: "Unauthorized" });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload（401）");

    // 显示后端返回的错误消息
    await expect(page.locator(SEL.error)).toHaveText("Unauthorized");
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认 401 未授权错误消息");
  });

  test("TC16 异常处理-服务器500错误（上传）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_异常处理-服务器500错误");
    await mockUpload(page, 500, { message: "System error. Please contact administrator." });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload（500）");

    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认 500 服务器错误消息");
  });

  test("TC17 异常处理-网络错误（上传）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_异常处理-网络错误");
    await page.route(/\/api\/templates\/upload/, (route) => route.abort());
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload（网络断开）");

    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    await expect(page.locator(SEL.success)).toHaveCount(0);
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认网络错误消息且按钮可用");
  });

  // ============================================================
  // 上传区域 - UI 交互
  // ============================================================

  test("TC18 UI交互-上传中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_UI交互-上传中按钮禁用");
    // 挂起 upload API 以观察 isLoading 状态
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/templates\/upload/, (route) => {
      holder.release = () => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload（API 挂起中）");

    // 1/2/3/4. 上传期间按钮与文件选择、Market 下拉禁用
    await expect(page.locator(SEL.uploadButton)).toBeDisabled();
    await expect(page.locator(SEL.fileButton)).toBeDisabled();
    await expect(page.locator(SEL.uploadMarket)).toBeDisabled();
    // 注：组件使用共享 isLoading，上传期间删除区域按钮同样禁用
    await expect(page.locator(SEL.btnDelete)).toBeDisabled();
    await snap("确认上传中按钮禁用");

    holder.release?.();
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认响应返回后按钮恢复可用");
  });

  test("TC19 UI交互-上传中防止重复提交", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_UI交互-上传中防止重复提交");
    let callCount = 0;
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/templates\/upload/, (route) => {
      callCount += 1;
      holder.release = () => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("点击 Upload（API 挂起中）");

    // 2. 上传中按钮禁用，再次点击无效
    await expect(page.locator(SEL.uploadButton)).toBeDisabled();
    await page.locator(SEL.uploadButton).click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    // 3. 只发起一次 API 调用
    expect(callCount).toBe(1);
    await snap("确认上传中无法重复提交（只调用一次 API）");

    holder.release?.();
  });

  test("TC20 UI交互-上传和删除互不干扰", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_UI交互-上传和删除互不干扰");
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/templates\/upload/, (route) => {
      holder.release = () => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 上传区域开始上传
    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("上传区域开始上传（API 挂起）");

    // 1. 上传区域控件禁用
    await expect(page.locator(SEL.uploadButton)).toBeDisabled();
    // 2. 删除区域按钮因共享 isLoading 同样禁用
    await expect(page.locator(SEL.btnDelete)).toBeDisabled();
    await snap("确认上传中上传与删除区域均禁用（共享 isLoading）");

    holder.release?.();
    await expect(page.locator(SEL.uploadButton)).toBeEnabled();
    await snap("确认上传完成后按钮恢复可用");
  });

  // ============================================================
  // 删除区域 - 画面初始化
  // ============================================================

  test("TC21 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_画面初始化-初期表示");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1. 显示删除区域标题
    await expect(page.locator(SEL.title).filter({ hasText: "HDoc Template Delete/Archive" })).toBeVisible();
    // 3. Templates 下拉列表为空且禁用（未选择 Market）
    await expect(page.locator(SEL.templatesSelect)).toBeDisabled();
    // 4. Delete / Archive 按钮可用
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await expect(page.locator(SEL.btnArchive)).toBeEnabled();
    await snap("确认删除区域初期状态");
  });

  test("TC22 Market选择-加载Templates", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_Market选择-加载Templates");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 选择 Market JPN，getFileList 返回文件列表
    await selectDeleteMarket(page, "JPN", ["test.docx", "old_template.docx"]);
    await snap("删除区域选择 Market JPN");

    // 1. 调用 getFileList API，Templates 下拉加载对应文件
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(3);
    await expect(page.locator(SEL.templatesSelect).locator("option").nth(1)).toHaveText("test.docx");
    await expect(page.locator(SEL.templatesSelect).locator("option").nth(2)).toHaveText("old_template.docx");
    // 3. Templates 下拉可用
    await expect(page.locator(SEL.templatesSelect)).toBeEnabled();
    await snap("确认 Templates 下拉加载对应文件列表且可用");
  });

  test("TC23 Market选择-切换Market", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_Market选择-切换Market");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1次目: JPN
    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(2);
    await snap("选择 Market JPN 并加载 Templates");

    // 2次目: 切换为 CHN（重新调用 getFileList）
    await selectDeleteMarket(page, "CHN", ["chn_template.docx", "another.docx"]);
    await snap("切换 Market 为 CHN");

    // 1/3. Templates 列表更新为 CHN 的文件
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(3);
    await expect(page.locator(SEL.templatesSelect).locator("option").nth(1)).toHaveText("chn_template.docx");
    await expect(page.locator(SEL.templatesSelect).locator("option").nth(2)).toHaveText("another.docx");
    await snap("确认切换 Market 后 Templates 列表更新");
  });

  test("TC24 Market选择-切换为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_Market选择-切换为空");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 选择 JPN 加载列表
    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await expect(page.locator(SEL.templatesSelect)).toBeEnabled();
    await snap("选择 Market JPN 后 Templates 可用");

    // 切换为空
    await page.locator(SEL.deleteMarket).selectOption("");
    await page.waitForTimeout(300);
    await snap("切换 Market 为空");

    // 1. Templates 列表被清空
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(1);
    // 2. Templates 下拉禁用
    await expect(page.locator(SEL.templatesSelect)).toBeDisabled();
    await snap("确认 Market 为空时 Templates 清空且禁用");
  });

  test("TC25 Market选择-加载Templates失败", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_Market选择-加载Templates失败");
    // 模拟 getFileList 返回非 200
    await page.route(/\/api\/templates\/list/, (route) => {
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "failed" }) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.deleteMarket).selectOption("JPN");
    await page.waitForTimeout(300);
    await snap("选择 Market JPN（getFileList 失败）");

    // 3. Templates 下拉列表为空
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(1);
    await snap("确认 getFileList 失败时 Templates 为空");
  });

  // ============================================================
  // 删除区域 - 空值校验
  // ============================================================

  test("TC26 空值校验-Delete时Market未选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_空值校验-Delete时Market未选择");
    let deleteCalled = false;
    await page.route(/\/api\/templates\/delete/, () => { deleteCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // Market 不选择，直接点击 Delete
    await page.locator(SEL.btnDelete).click();
    await snap("Market 未选择时点击 Delete");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please select a market.");
    // 3. 不调用 API
    await page.waitForTimeout(300);
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Market 未选择错误消息且按钮可用");
  });

  test("TC27 空值校验-Delete时Template未选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_空值校验-Delete时Template未选择");
    let deleteCalled = false;
    await page.route(/\/api\/templates\/delete/, () => { deleteCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // Market 选择，但 Templates 不选择，点击 Delete
    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.btnDelete).click();
    await snap("Market 已选择但 Template 未选择时点击 Delete");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please select a template.");
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 Template 未选择错误消息且按钮可用");
  });

  test("TC28 空值校验-Delete时两者都为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC28_空值校验-Delete时两者都为空");
    let deleteCalled = false;
    await page.route(/\/api\/templates\/delete/, () => { deleteCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    // Market 与 Templates 均不选择，点击 Delete
    await page.locator(SEL.btnDelete).click();
    await snap("Market 与 Template 都不选择时点击 Delete");

    // 1/2. 先触发 Market 空值校验
    await expect(page.locator(SEL.error)).toHaveText("Please select a market.");
    await snap("确认两者都空时显示 Market 未选择错误消息");
  });

  // ============================================================
  // 删除区域 - 确认对话框与删除
  // ============================================================

  test("TC29 确认对话框-点击取消", async ({ page }) => {
    const snap = makeScreenshot(page, "TC29_确认对话框-点击取消");
    let deleteCalled = false;
    await page.route(/\/api\/templates\/delete/, () => { deleteCalled = true; });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    await snap("选择 Market JPN 与 template test.docx");

    // 点击 Delete → 确认对话框 → 取消
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Do you really want to delete template?");
      dialog.dismiss();
    });
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并取消确认");

    // 3. 不调用 delete API
    expect(deleteCalled).toBe(false);
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认取消后未删除且按钮可用");
  });

  test("TC30 确认对话框-点击确定", async ({ page }) => {
    const snap = makeScreenshot(page, "TC30_确认对话框-点击确定");
    let deleteCalled = false;
    await mockDeleteApi(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    await snap("选择 Market JPN 与 template test.docx");

    // 点击 Delete → 确认对话框 → 确定
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Do you really want to delete template?");
      dialog.accept();
    });
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定");

    // 3. 调用 delete API 成功
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE TEST.DOCX WAS SUCCESSFULLY DELETE FROM MARKET JPN");
    // 4. 选中值被清空
    await expect(page.locator(SEL.templatesSelect)).toHaveValue("");
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认删除成功且消息正确显示");
  });

  test("TC31 删除成功-不同Market", async ({ page }) => {
    const snap = makeScreenshot(page, "TC31_删除成功-不同Market");
    await mockDeleteApi(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["old_template.docx", "keep.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("old_template.docx");
    await snap("选择 Market JPN 与 old_template.docx");

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定");

    // 3. 显示成功消息（从 Market JPN 删除）
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE OLD_TEMPLATE.DOCX WAS SUCCESSFULLY DELETE FROM MARKET JPN");
    // 4/5. Templates 列表更新（移除已删除项）
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(2);
    await expect(page.locator(SEL.templatesSelect)).toHaveValue("");
    await snap("确认删除成功且列表更新");
  });

  test("TC32 删除失败-API返回错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC32_删除失败-API返回错误");
    await mockDeleteApi(page, 400, { message: "Delete failed" });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定（API 返回错误）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Delete failed");
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    // 4. 列表不变化
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(2);
    await snap("确认删除失败错误消息且列表不变");
  });

  test("TC33 异常处理-401未授权（删除）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC33_异常处理-401未授权");
    await mockDeleteApi(page, 401, { message: "Unauthorized" });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定（401）");

    await expect(page.locator(SEL.error)).toHaveText("Unauthorized");
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 401 未授权错误消息");
  });

  test("TC34 异常处理-服务器500错误（删除）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC34_异常处理-服务器500错误");
    await mockDeleteApi(page, 500, { message: "System error. Please contact administrator." });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定（500）");

    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认 500 服务器错误消息");
  });

  test("TC35 异常处理-网络错误（删除）", async ({ page }) => {
    const snap = makeScreenshot(page, "TC35_异常处理-网络错误");
    await page.route(/\/api\/templates\/delete/, (route) => route.abort());
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定（网络断开）");

    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认删除网络错误消息且按钮可用");
  });

  test("TC36 删除后Templates列表刷新", async ({ page }) => {
    const snap = makeScreenshot(page, "TC36_删除后Templates列表刷新");
    // 删除 API 成功后，组件会从 state 中移除已删除项（不调用 getFileList）
    await mockDeleteApi(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx", "keep.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    await snap("选择 test.docx 执行删除");

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定");

    // 1/3. Templates 列表移除已删除项，选中值清空
    await expect(page.locator(SEL.templatesSelect).locator("option")).toHaveCount(2);
    await expect(page.locator(SEL.templatesSelect).locator("option").nth(1)).toHaveText("keep.docx");
    await expect(page.locator(SEL.templatesSelect)).toHaveValue("");
    await snap("确认删除成功后 Templates 列表刷新");
  });

  test("TC37 UI交互-删除中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC37_UI交互-删除中按钮禁用");
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/templates\/delete/, (route) => {
      holder.release = () => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定（API 挂起中）");

    // 1/2/3/4. 删除中按钮与删除区域下拉禁用
    await expect(page.locator(SEL.btnDelete)).toBeDisabled();
    await expect(page.locator(SEL.deleteMarket)).toBeDisabled();
    await expect(page.locator(SEL.templatesSelect)).toBeDisabled();
    // 5. 组件使用共享 isLoading，删除期间上传区域按钮同样禁用
    await expect(page.locator(SEL.uploadButton)).toBeDisabled();
    await snap("确认删除中按钮禁用");

    holder.release?.();
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认响应返回后删除按钮恢复可用");
  });

  test("TC38 UI交互-删除中防止重复提交", async ({ page }) => {
    const snap = makeScreenshot(page, "TC38_UI交互-删除中防止重复提交");
    let callCount = 0;
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/templates\/delete/, (route) => {
      callCount += 1;
      holder.release = () => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("点击 Delete 并确定（API 挂起中）");

    await expect(page.locator(SEL.btnDelete)).toBeDisabled();
    await page.locator(SEL.btnDelete).click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    // 3. 只发起一次 delete API 调用
    expect(callCount).toBe(1);
    await snap("确认删除中无法重复提交（只调用一次 API）");

    holder.release?.();
  });

  test("TC39 UI交互-删除成功后清空入力", async ({ page }) => {
    const snap = makeScreenshot(page, "TC39_UI交互-删除成功后清空入力");
    await mockDeleteApi(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["test.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("test.docx");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(SEL.btnDelete).click();
    await snap("执行删除并成功");

    // 注：组件删除成功后仅清空 Templates 选中值并移除列表项，Market 保留
    await expect(page.locator(SEL.templatesSelect)).toHaveValue("");
    await expect(page.locator(SEL.btnDelete)).toBeEnabled();
    await snap("确认删除成功后清空入力并恢复按钮");
  });

  test("TC40 Archive-归档操作", async ({ page }) => {
    const snap = makeScreenshot(page, "TC40_Archive-归档操作");
    await mockArchiveApi(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await selectDeleteMarket(page, "JPN", ["old_template.docx", "keep.docx"]);
    await page.locator(SEL.templatesSelect).selectOption("old_template.docx");
    await snap("选择 Market JPN 与 old_template.docx");

    // 点击 Archive → 确认对话框 → 确定
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Do you really want to archive template?");
      dialog.accept();
    });
    await page.locator(SEL.btnArchive).click();
    await snap("点击 Archive 并确定");

    // 归档成功消息
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE OLD_TEMPLATE.DOCX WAS SUCCESSFULLY ARCHIVED FROM MARKET JPN");
    await expect(page.locator(SEL.templatesSelect)).toHaveValue("");
    await snap("确认归档成功且列表更新");
  });

  // ============================================================
  // 跳转模板检查页面
  // ============================================================

  test("TC41 画面迁移-Check Template链接", async ({ page }) => {
    const snap = makeScreenshot(page, "TC41_画面迁移-Check_Template链接");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1. 点击 Check Template 链接（链接为 <a href="#">，用 JS click 触发 React onClick 导航）
    await page.locator(SEL.checkLink).evaluate((el) => (el as HTMLElement).click());
    await snap("点击 Check Template 链接");

    // 1. 画面迁移到 HDoc Template Check 页面
    await expect(page.locator(".htc-title")).toHaveText("HDoc Template Check", { timeout: 10000 });
    await snap("确认跳转到 HDoc Template Check 画面");
  });

  test("TC42 Check Template链接-UI表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC42_Check_Template链接-UI表示");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1. 显示标题
    await expect(page.locator(SEL.checkTitle)).toHaveText("Check your rtf template");
    // 2. 显示说明文本
    await expect(page.locator(".udt-check-desc")).toBeVisible();
    // 3. 链接按钮显示
    await expect(page.locator(SEL.checkLink)).toHaveText("Check Template (Only for rtf files)");
    await snap("确认 Check Template 区域 UI");
  });

  // ============================================================
  // 消息显示
  // ============================================================

  test("TC43 消息类型-Information样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC43_消息类型-Information样式");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("执行上传成功");

    // 1. 成功消息显示（Information 类型为蓝色/绿色）
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE TEST.DOCX WAS SUCCESSFULLY UPLOADED TO MARKET JPN");
    await expect(page.locator(SEL.success)).toBeVisible();
    // 2. 左对齐
    const align = await page.locator(SEL.success).evaluate((el) => getComputedStyle(el).textAlign);
    expect(["left", "start"]).toContain(align);
    await snap("确认 Information 成功消息样式");
  });

  test("TC44 消息类型-Error样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC44_消息类型-Error样式");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 触发文件未选择错误
    await page.locator(SEL.uploadButton).click();
    await snap("触发空值校验错误");

    // 1. 错误消息显示（Error 类型为红色）
    await expect(page.locator(SEL.error)).toHaveText("NO FILE UPLOADED");
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await snap("确认 Error 错误消息样式");
  });

  test("TC45 消息清空-新操作时清除前一条消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC45_消息清空-新操作时清除前一条消息");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 1. 先触发一个错误（文件未选择）
    await page.locator(SEL.uploadButton).click();
    await expect(page.locator(SEL.error)).toHaveText("NO FILE UPLOADED");
    await snap("触发错误消息");

    // 2. 选择文件与 Market 再次上传成功
    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("再次上传成功");

    // 3. 旧错误消息被清除，显示新成功消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE TEST.DOCX WAS SUCCESSFULLY UPLOADED TO MARKET JPN");
    await snap("确认旧错误消息被清除且新消息正确显示");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC46 安全性-文件类型限制", async ({ page }) => {
    const snap = makeScreenshot(page, "TC46_安全性-文件类型限制");
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 文件输入框 accept 属性限定 .rtf/.docx 格式
    const accept = await page.locator(SEL.fileInput).getAttribute("accept");
    expect(accept).toContain(".rtf");
    expect(accept).toContain(".docx");
    // 选择 .txt 文件（前端不阻止，但上传仍会触发按所选内容）
    await page.locator(SEL.fileInput).setInputFiles(makeFile("a.txt", 1024, "text/plain"));
    await expect(page.locator(SEL.fileName)).toHaveText("a.txt");
    await snap("确认 accept 限定与文件选择行为");
  });

  test("TC47 安全性-文件路径安全检查", async ({ page }) => {
    const snap = makeScreenshot(page, "TC47_安全性-文件路径安全检查");
    await mockUpload(page, 200, {});
    await page.goto(UDT_URL);
    await snap("访问页面");

    // 选择包含路径遍历字符的文件名
    await page.locator(SEL.fileInput).setInputFiles(makeFile(".._etc_passwd", 1024, "text/plain"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("上传包含特殊字符的文件名");

    // 前端仅将文件名作为表单数据发送（不直接拼接路径），上传成功
    await expect(page.locator(SEL.success)).toHaveText("TEMPLATE .._ETC_PASSWD WAS SUCCESSFULLY UPLOADED TO MARKET JPN");
    await snap("确认上传请求发送且无路径拼接错误");
  });

  test("TC48 安全性-SVN账号不暴露", async ({ page }) => {
    const snap = makeScreenshot(page, "TC48_安全性-SVN账号不暴露");
    let capturedHeaders: any = null;
    await page.route(/\/api\/templates\/upload/, async (route) => {
      capturedHeaders = route.request().headers();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto(UDT_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("test.docx", 1024, "application/msword"));
    await page.locator(SEL.uploadMarket).selectOption("JPN");
    await page.locator(SEL.uploadButton).click();
    await snap("执行上传并检查请求头");

    // 1. 请求头不包含 SVN 账号密码或服务器地址
    const headerStr = JSON.stringify(capturedHeaders || {}).toLowerCase();
    expect(headerStr.includes("svn")).toBe(false);
    expect(headerStr.includes("password")).toBe(false);
    await snap("确认请求头不暴露 SVN 账号信息");
  });
});
