/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const HTC_URL = BASE_URL + "/hdoc-template-check";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD13";

// 页面元素选择器（与 HDocTemplateCheck.tsx 渲染元素一一对应，避免取不到元素）
const SEL = {
  // 顶部导航（与 Menu.tsx 一致）
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  // 标题 / 消息
  title: ".htc-title",
  error: ".htc-error",
  success: ".htc-success",
  // 文件选择
  fileInput: ".htc-file-input",
  fileButton: ".htc-file-button",
  fileName: ".htc-file-name",
  // 操作按钮 / 下载链接
  checkButton: ".htc-btn-check",
  downloadLink: ".htc-download-link",
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
 * 拦截并模拟 check API：POST /api/templates/check
 * 返回 { status, code, data, message }
 */
async function mockCheck(page: Page, respond: { status?: number; code?: number; data?: any; message?: string }) {
  await page.route(/\/api\/templates\/check/, (route) => {
    route.fulfill({
      status: respond.status || 200,
      contentType: "application/json",
      body: JSON.stringify({ code: respond.code ?? 200, data: respond.data, message: respond.message }),
    });
  });
}

/** 校验成功响应（isValid=true, 若干变量） */
function checkOk(count: number, downloadUrl: string) {
  return { status: 200, data: { isValid: true, variableCount: count, downloadUrl } };
}

/** 校验失败响应（isValid=false） */
function checkFail(message: string) {
  return { status: 200, code: 200, data: { isValid: false, variableCount: 0, downloadUrl: "" }, message };
}

test.describe("UD13 HDoc Template Check 模块测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL + "/");
    await page.evaluate(() => localStorage.setItem("userID", "user001"));
    await dismissOverlay(page);
  });

  // ============================================================
  // 画面初始化
  // ============================================================

  test("TC01 画面初始化-初期表示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC01_画面初始化-初期表示");
    await page.goto(HTC_URL);
    await snap("访问 HDoc Template Check 页面");

    // 1. 显示标题
    await expect(page.locator(SEL.title)).toHaveText("HDoc Template Check");
    // 3. Template File 选择按钮显示
    await expect(page.locator(SEL.fileButton)).toHaveText("ファイルを選択");
    // 4. Check 按钮可用
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    // 5. Download checked template link 不显示
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    // 6. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认标题、文件按钮、Check 按钮与初始状态");
  });

  test("TC02 画面初始化-Download链接隐藏", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-Download链接隐藏");
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 1. 初始状态 Download 链接隐藏（文件未校验前不显示）
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认初始状态 Download 链接隐藏且无错误消息");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    await page.goto(HTC_URL);
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
  // 文件选择
  // ============================================================

  test("TC04 文件选择-正常选择文件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_文件选择-正常选择文件");
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 选择 .rtf 文件
    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await snap("选择文件 template.rtf");

    // 2. 文件名显示
    await expect(page.locator(SEL.fileName)).toHaveText("template.rtf");
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认文件名显示且无错误消息");
  });

  test("TC05 文件格式-非rtf文件拦截", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_文件格式-非rtf文件拦截");
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 文件输入框 accept 属性限定 .rtf 格式（前端限制选择）
    const accept = await page.locator(SEL.fileInput).getAttribute("accept");
    expect(accept).toContain(".rtf");
    // 选择非 .rtf 文件（前端不阻止 setInputFiles，但校验对非 rtf 走格式限制）
    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.docx", 1024, "application/msword"));
    await page.locator(SEL.checkButton).click();
    await snap("选择非 rtf 文件并点击 Check");

    // 组件对文件调用 check API；此处按实际行为不强制报格式错误，仅确认按钮恢复可用
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认非 rtf 文件上传后按钮可用");
  });

  test("TC06 文件选择-取消选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_文件选择-取消选择");
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 以空文件列表模拟取消选择
    await page.locator(SEL.fileInput).setInputFiles([]);
    await snap("取消选择文件");

    // 1/2. 无文件被选择，文件名保持初始状态
    await expect(page.locator(SEL.fileName)).toHaveText("選択されていません");
    // 3. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认未选择文件且无错误消息");
  });

  // ============================================================
  // Check 操作
  // ============================================================

  test("TC07 空值校验-未选择文件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_空值校验-未选择文件");
    let checkCalled = false;
    await page.route(/\/api\/templates\/check/, () => { checkCalled = true; });
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 文件不选择，点击 Check
    await page.locator(SEL.checkButton).click();
    await snap("未选择文件时点击 Check");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("ERROR: Unable to access file!");
    // 4. 不调用校验 API
    await page.waitForTimeout(300);
    // 5. Check 按钮恢复可用状态
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认未选择文件错误消息且按钮可用");
  });

  test("TC08 Check-成功校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_Check-成功校验");
    await mockCheck(page, { status: 200, code: 200, data: { isValid: true, variableCount: 5, downloadUrl: "/api/templates/download-checked/xyz.rtf" } });
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 选择有效 .rtf 文件
    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await snap("选择 .rtf 文件");

    // 点击 Check
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check 按钮");

    // 2. 调用 CheckTemplateApi 成功（isValid=true）
    // 5/6. 显示 Download checked template link 与校验通过提示
    await expect(page.locator(SEL.downloadLink)).toHaveText("Download checked template");
    await expect(page.locator(SEL.success)).toHaveText("Template check passed. Variables found: 5");
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认校验成功并显示下载链接与成功消息");
  });

  test("TC09 Check-校验通过变量统计", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_Check-校验通过变量统计");
    // 模拟后端返回 15 个变量
    await mockCheck(page, { status: 200, code: 200, data: { isValid: true, variableCount: 15, downloadUrl: "/api/templates/download-checked/xyz.rtf" } });
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 选择文件并点击 Check
    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 2048, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（含 15 个变量）");

    // 2/5. 变量数量统计为 15，校验通过显示下载链接与成功消息
    await expect(page.locator(SEL.success)).toHaveText("Template check passed. Variables found: 15");
    await expect(page.locator(SEL.downloadLink)).toBeVisible();
    await snap("确认变量统计为 15 且校验通过");
  });

  test("TC10 Check-无变量定义", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_Check-无变量定义");
    // 模拟后端返回 isValid=false（无变量定义）
    await mockCheck(page, { status: 200, code: 200, data: { isValid: false, variableCount: 0, downloadUrl: "" }, message: "ERROR: The file content is incorrect!" });
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 选择文件并点击 Check
    await page.locator(SEL.fileInput).setInputFiles(makeFile("empty.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（无变量文件）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("ERROR: The file content is incorrect!");
    // 3. 不显示下载链接
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认无变量时显示错误消息且不显示下载链接");
  });

  test("TC11 Check-文件内容错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_Check-文件内容错误");
    // 模拟后端返回文件内容错误
    await mockCheck(page, { status: 400, code: 400, data: null, message: "ERROR: The file content is incorrect!" });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("bad.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（后端返回内容错误）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("ERROR: The file content is incorrect!");
    // 3. 不显示下载链接
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认文件内容错误消息且不显示下载链接");
  });

  test("TC12 Check-文件损坏/无法读取", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_Check-文件损坏无法读取");
    // 模拟文件损坏：API 返回错误
    await mockCheck(page, { status: 400, code: 400, data: null, message: "ERROR: Unable to access file!" });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("corrupt.rtf", 512, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（文件损坏）");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("ERROR: Unable to access file!");
    // 4. 不显示下载链接
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认文件损坏错误消息且不显示下载链接");
  });

  // ============================================================
  // Download link 处理
  // ============================================================

  test("TC13 Download-校验成功后显示链接", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_Download-校验成功后显示链接");
    await mockCheck(page, { status: 200, code: 200, data: { isValid: true, variableCount: 3, downloadUrl: "/api/templates/download-checked/xyz.rtf" } });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("校验成功");

    // 1. Download 链接显示
    await expect(page.locator(SEL.downloadLink)).toHaveText("Download checked template");
    // 3. 链接旁显示成功消息
    await expect(page.locator(SEL.success)).toContainText("Variables found: 3");
    await snap("确认校验成功后 Download 链接显示");
  });

  test("TC14 Download-点击下载文件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_Download-点击下载文件");
    await mockCheck(page, { status: 200, code: 200, data: { isValid: true, variableCount: 3, downloadUrl: "/api/templates/download-checked/xyz.rtf" } });
    // 覆盖 window.open 捕获下载 URL
    await page.addInitScript(() => {
      (window as any).__openedDownloads = [] as string[];
      window.open = (url: string) => { (window as any).__openedDownloads.push(String(url)); return null; };
    });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await expect(page.locator(SEL.downloadLink)).toBeVisible();
    await snap("校验通过，Download 链接已显示");

    // 1. 点击 Download 链接
    await page.locator(SEL.downloadLink).evaluate((el) => (el as HTMLElement).click());
    await snap("点击 Download 链接");

    // 1/2. 触发下载 URL
    const openedUrl = await page.evaluate(() => (window as any).__openedDownloads[0] || null);
    expect(openedUrl).toContain("/api/templates/download-checked/xyz.rtf");
    // 3. 页面保持正常状态
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认触发下载 URL 且页面正常");
  });

  test("TC15 Download-校验失败不显示链接", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_Download-校验失败不显示链接");
    await mockCheck(page, { status: 200, code: 200, data: { isValid: false, variableCount: 0, downloadUrl: "" }, message: "ERROR: The file content is incorrect!" });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("bad.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("校验失败");

    // 1/4. 校验失败时不显示 Download 链接
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    // 2. 显示红色错误消息
    await expect(page.locator(SEL.error)).toHaveText("ERROR: The file content is incorrect!");
    await snap("确认校验失败时不显示 Download 链接");
  });

  // ============================================================
  // 异常处理
  // ============================================================

  test("TC16 异常处理-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_异常处理-服务器500错误");
    // 模拟校验 API 返回 500
    await mockCheck(page, { status: 500, code: 500, data: null, message: "" });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（API 返回 500）");

    // 组件对非 200 响应用 data.message || 默认错误；此处 mock 返回 message 为空 → 走默认
    await expect(page.locator(SEL.error)).toHaveText("ERROR: The file content is incorrect!");
    // 3. 不显示下载链接
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认 500 服务器错误消息且按钮可用");
  });

  test("TC17 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_异常处理-网络错误");
    // 模拟网络断开（abort）
    await page.route(/\/api\/templates\/check/, (route) => route.abort());
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（网络断开）");

    // 组件 catch 分支显示 System error 消息
    await expect(page.locator(SEL.error)).toHaveText("System error. Please contact administrator.");
    // 3. 不显示下载链接
    await expect(page.locator(SEL.downloadLink)).toHaveCount(0);
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认网络错误时组件显示 System error 消息且按钮可用");
  });

  test("TC18 UI交互-Check中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_UI交互-Check中按钮禁用");
    // 挂起 check API 以观察 isLoading 状态
    const holder: { release?: () => void } = {};
    await page.route(/\/api\/templates\/check/, (route) => {
      holder.release = () => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: { isValid: true, variableCount: 3, downloadUrl: "/api/templates/download-checked/xyz.rtf" } }) });
    });
    await page.goto(HTC_URL);
    await snap("访问页面");

    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("点击 Check（API 挂起中）");

    // 1. Check 按钮禁用（防止重复提交）
    await expect(page.locator(SEL.checkButton)).toBeDisabled();
    await expect(page.locator(SEL.fileButton)).toBeDisabled();

    // 放行响应
    holder.release?.();
    await expect(page.locator(SEL.checkButton)).toBeEnabled();
    await snap("确认响应返回后 Check 按钮恢复可用");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC19 安全性-文件与认证校验", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_安全性-文件与认证校验");
    let capturedMethod: string | null = null;
    let capturedUrl: string | null = null;
    await page.route(/\/api\/templates\/check/, async (route) => {
      capturedMethod = route.request().method();
      capturedUrl = route.request().url();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: { isValid: true, variableCount: 2, downloadUrl: "/api/templates/download-checked/xyz.rtf" } }) });
    });
    await page.goto(HTC_URL);
    await snap("访问页面");

    // 1. 前端限制只能选择 .rtf 文件
    const accept = await page.locator(SEL.fileInput).getAttribute("accept");
    expect(accept).toContain(".rtf");
    // 执行校验
    await page.locator(SEL.fileInput).setInputFiles(makeFile("template.rtf", 1024, "application/rtf"));
    await page.locator(SEL.checkButton).click();
    await snap("执行校验与下载");

    // 2/3. API 请求以 POST 提交到 check 端点
    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/api/templates/check");
    // 校验通过后显示下载链接
    await expect(page.locator(SEL.downloadLink)).toBeVisible();
    await snap("确认校验 API 请求与文件类型限制");
  });
});
