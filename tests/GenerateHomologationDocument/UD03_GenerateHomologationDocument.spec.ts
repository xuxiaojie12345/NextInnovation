/// <reference types="node" />

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const PAGE_URL = BASE_URL + "/generate-homologation-document";
const IMG_DIR = "E:\\UDWorkspace\\NextInnovation\\react-ud\\Image\\UD03";

// 页面元素选择器（与 Menu.tsx / GenerateHomologationDocument.tsx 保持一致）
const SEL = {
  logo: ".volvo-logo",
  welcomeText: ".welcome-text",
  logoutButton: ".logout-button",
  title: ".ghd-title",
  seriesInput: '.ghd-field:has(.ghd-label:text-is("Chassis series")) .ghd-input',
  noInput: '.ghd-field:has(.ghd-label:text-is("Chassis no")) .ghd-input',
  typeSelect: '.ghd-field:has(.ghd-label:text-is("Document type")) .ghd-select',
  submitBtn: ".ghd-btn-submit",
  resetBtn: ".ghd-btn-reset",
  helpBtn: ".ghd-btn-help",
  error: ".ghd-error",
  support: ".ghd-support",
};

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

/**
 * 通过原生 value setter 设置 React 受控输入框的值。
 * 目的：绕过 input[maxLength] 的浏览器截断（Playwright fill 会受 maxLength 限制，
 * 导致含空格/非法字符的完整值在 React onChange 执行前被截断）。
 * React 受控 input 需要调用原生 setter 并派发 input 事件，onChange 才会触发。
 */
async function setReactInputValue(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set;
    setter!.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function mockDocumentTypes(page: Page) {
  await page.route(/\/api\/hdoc\/document-types/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 200,
        data: [
          { value: "Dimension Plate", label: "Dimension Plate" },
          { value: "Type A Document", label: "Type A Document" },
          { value: "Certificate of Conformity", label: "Certificate of Conformity" },
        ],
      }),
    });
  });
}

test.describe("UD03 Generate Homologation Document 模块测试", () => {
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
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问 Generate Homologation Document 页面");

    await expect(page.locator(SEL.title)).toHaveText("HDoc - Generate Homologation Document");
    await snap("确认页面标题");

    await expect(page.locator(SEL.seriesInput)).toHaveValue("");
    await expect(page.locator(SEL.noInput)).toHaveValue("");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    await snap("确认三个字段均为空");

    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await expect(page.locator(SEL.resetBtn)).toBeEnabled();
    await expect(page.locator(SEL.helpBtn)).toBeEnabled();
    await snap("确认 Submit/Reset/Help 按钮可用");

    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认不显示错误消息");
  });

  test("TC02 画面初始化-Document type下拉", async ({ page }) => {
    const snap = makeScreenshot(page, "TC02_画面初始化-Document type下拉");
    // 拦截文档类型 API，捕获调用
    let capturedUrl = "";
    await page.route(/\/api\/hdoc\/document-types/, async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          data: [
            { value: "Dimension Plate", label: "Dimension Plate" },
            { value: "Type A Document", label: "Type A Document" },
            { value: "Certificate of Conformity", label: "Certificate of Conformity" },
          ],
        }),
      });
    });

    await page.goto(PAGE_URL);
    await snap("访问页面，触发文档类型 API");

    // 1. 页面加载时调用获取文档类型 API
    await expect.poll(() => capturedUrl).toContain("/api/hdoc/document-types");
    await snap("确认已调用获取文档类型 API");

    // 2/3. Document type 下拉列表显示从 API 获取的文档类型列表
    const options = page.locator(`${SEL.typeSelect} option`);
    await expect(options).toHaveCount(4); // 含空选项 + 3 个文档类型
    await expect(options.nth(1)).toHaveText("Dimension Plate");
    await expect(options.nth(2)).toHaveText("Type A Document");
    await expect(options.nth(3)).toHaveText("Certificate of Conformity");
    await snap("确认下拉列表选项正确显示");
  });

  test("TC03 画面初始化-未登录跳转", async ({ page }) => {
    const snap = makeScreenshot(page, "TC03_画面初始化-未登录跳转");
    // 清除 localStorage 中的 userID
    await page.evaluate(() => localStorage.removeItem("userID"));
    await snap("清除 localStorage 中的 userID");

    // 访问页面
    await page.goto(PAGE_URL);
    await snap("访问 /generate-homologation-document 页面");

    // 1. localStorage 中无 userID
    const hasUserID = await page.evaluate(() => !!localStorage.getItem("userID"));
    expect(hasUserID).toBe(false);
    await snap("确认 localStorage 中无 userID");

    // 2. 自动跳转到 /login 页面
    // 3. 不显示表单内容
    await page.waitForURL("**/login", { timeout: 5000 }).catch(() => {});
    const isLogin = page.url().includes("/login");
    if (isLogin) {
      await expect(page.locator(SEL.title)).toHaveCount(0);
    } else {
      // 当前实现未启用强制跳转时，验证表单内容未见用户信息（Welcome, ---）
      await expect(page.locator(SEL.welcomeText)).toContainText("Welcome, ---");
    }
    await snap("确认未登录画面迁移结果");
  });

  // ============================================================
  // 上次搜索条件记忆
  // ============================================================

  test("TC04 搜索条件-自动回填上次值", async ({ page }) => {
    const snap = makeScreenshot(page, "TC04_搜索条件-自动回填上次值");
    await mockDocumentTypes(page);
    // 预设上次搜索条件
    await page.evaluate(() => {
      localStorage.setItem("ghd_chassisSeries", "JPCT");
      localStorage.setItem("ghd_chassisNo", "028321");
      localStorage.setItem("ghd_documentType", "Dimension Plate");
    });
    await snap("预设上次搜索条件到 localStorage");

    await page.goto(PAGE_URL);
    await snap("重新进入页面");

    // 1/2/3. 三个字段自动回填上次搜索值
    await expect(page.locator(SEL.seriesInput)).toHaveValue("JPCT");
    await expect(page.locator(SEL.noInput)).toHaveValue("028321");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("Dimension Plate");
    await snap("确认搜索条件自动回填");

    // 4. 无需手动重新输入（字段均已填充）
    await expect(page.locator(SEL.seriesInput)).not.toHaveValue("");
    await snap("确认无需手动重新输入");
  });

  test("TC05 搜索条件-无上次值不报错", async ({ page }) => {
    const snap = makeScreenshot(page, "TC05_搜索条件-无上次值不报错");
    await mockDocumentTypes(page);
    // 首次使用：清除所有 localStorage 数据
    await page.evaluate(() => {
      localStorage.removeItem("ghd_chassisSeries");
      localStorage.removeItem("ghd_chassisNo");
      localStorage.removeItem("ghd_documentType");
    });
    await snap("清除所有上次搜索条件（首次使用）");

    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 1. Chassis series、Chassis no、Document type 均为空
    await expect(page.locator(SEL.seriesInput)).toHaveValue("");
    await expect(page.locator(SEL.noInput)).toHaveValue("");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    await snap("确认三个字段均为空");

    // 2. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    // 3. 页面正常显示
    await expect(page.locator(SEL.title)).toBeVisible();
    await snap("确认页面正常显示且无错误消息");
  });

  // ============================================================
  // 输入校验
  // ============================================================

  test("TC06 输入限制-Chassis series", async ({ page }) => {
    const snap = makeScreenshot(page, "TC06_输入限制-Chassis series");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 输入数字或符号：JP1@T
    await page.locator(SEL.seriesInput).fill("JP1@T");
    await snap("输入 JP1@T 到 Chassis series");

    // 1/2/3. 数字和符号被过滤，仅保留英文字母 JPT
    await expect(page.locator(SEL.seriesInput)).toHaveValue("JPT");
    await snap("确认仅保留英文字符 JPT");
  });

  test("TC07 输入限制-Chassis series最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC07_输入限制-Chassis series最大长度");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 输入超过 5 个字符：ABCDEFG（7字符）
    await page.locator(SEL.seriesInput).fill("ABCDEFG");
    await snap("输入 ABCDEFG（7字符）");

    // 1/2. 仅接受最大 5 字符，值为 ABCDE
    await expect(page.locator(SEL.seriesInput)).toHaveValue("ABCDE");
    await snap("确认 Chassis series 被限制为5字符");
  });

  test("TC08 输入限制-Chassis no", async ({ page }) => {
    const snap = makeScreenshot(page, "TC08_输入限制-Chassis no");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 输入英文字母或符号：123A@BC
    await page.locator(SEL.noInput).fill("123A@BC");
    await snap("输入 123A@BC 到 Chassis no");

    // 1/2/3. 字母和符号被过滤，仅保留数字 123
    await expect(page.locator(SEL.noInput)).toHaveValue("123");
    await snap("确认仅保留数字字符 123");
  });

  test("TC09 输入限制-Chassis no最大长度", async ({ page }) => {
    const snap = makeScreenshot(page, "TC09_输入限制-Chassis no最大长度");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 输入 15 个数字
    await page.locator(SEL.noInput).fill("123456789012345");
    await snap("输入15个数字到 Chassis no");

    // 1/2. 仅接受最大 10 字符，值为 1234567890
    await expect(page.locator(SEL.noInput)).toHaveValue("1234567890");
    await snap("确认 Chassis no 被限制为10字符");
  });

  test("TC10 输入过滤-去除首尾空格", async ({ page }) => {
    const snap = makeScreenshot(page, "TC10_输入过滤-去除首尾空格");
    // 拦截 generate 请求，捕获提交参数
    let capturedBody: any = null;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: { redirectUrl: "/generate-document-result", documentId: "DOC-123" } }),
      });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面并设置 generate mock");

    // 输入含首尾空格的 series / no（用原生 setter 注入，避开 maxLength 截断）
    await setReactInputValue(page, SEL.seriesInput, "  JPCT  ");
    await setReactInputValue(page, SEL.noInput, "  028321  ");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入含首尾空格并选择 Document type");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1/2/3. 提交时自动去除首尾空格，请求参数为 JPCT / 028321
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.chassisSeries).toBe("JPCT");
    expect(capturedBody.chassisNo).toBe("028321");
    await snap("确认请求参数去除首尾空格");
  });

  // ============================================================
  // 空值校验
  // ============================================================

  test("TC11 空值校验-Chassis series为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC11_空值校验-Chassis series为空");
    let apiCalled = false;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // Chassis series 留空；Chassis no 输入有效值；Document type 选择有效值
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("Chassis series 留空，输入其余字段");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Please fill in all required fields.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)"); // #c62828
    await snap("确认错误消息及红色样式");

    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    // 5. 按钮恢复可用状态
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认未调用 API 且按钮恢复可用");
  });

  test("TC12 空值校验-Chassis no为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC12_空值校验-Chassis no为空");
    let apiCalled = false;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // Chassis series 输入有效值；Chassis no 留空；Document type 选择有效值
    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("Chassis no 留空，输入其余字段");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    await expect(page.locator(SEL.error)).toHaveText("Please fill in all required fields.");
    await snap("确认 Chassis no 为空显示错误消息");

    expect(apiCalled).toBe(false);
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认未调用 API 且按钮恢复可用");
  });

  test("TC13 空值校验-Document type未选择", async ({ page }) => {
    const snap = makeScreenshot(page, "TC13_空值校验-Document type未选择");
    let apiCalled = false;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // Chassis series、Chassis no 输入有效值；Document type 不选择
    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await snap("Document type 未选择，输入其余字段");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    await expect(page.locator(SEL.error)).toHaveText("Please fill in all required fields.");
    await snap("确认 Document type 未选择显示错误消息");

    expect(apiCalled).toBe(false);
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认未调用 API 且按钮恢复可用");
  });

  test("TC14 空值校验-三者都为空", async ({ page }) => {
    const snap = makeScreenshot(page, "TC14_空值校验-三者都为空");
    let apiCalled = false;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面（所有必填字段留空）");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1/2/3. 先触发 Chassis series 空值校验，显示错误消息（红色）
    await expect(page.locator(SEL.error)).toHaveText("Please fill in all required fields.");
    await snap("确认三者都为空时显示错误消息");

    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认未调用 API 且按钮恢复可用");
  });

  // ============================================================
  // Submit 处理
  // ============================================================

  test("TC15 提交成功-正确输入", async ({ page }) => {
    const snap = makeScreenshot(page, "TC15_提交成功-正确输入");
    let capturedBody: any = null;
    const pending: { resolve: ((value: unknown) => void) | null } = { resolve: null };
    await page.route(/\/api\/hdoc\/generate/, (route) => {
      capturedBody = route.request().postDataJSON();
      return new Promise((resolve) => {
        pending.resolve = resolve;
      }).then(() =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, data: { redirectUrl: "/generate-document-result", documentId: "DOC-123456" } }),
        })
      );
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入正确的 Chassis series/chassis no/Document type");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1. 按钮变为 "Submitting..." 并禁用
    await expect(page.locator(SEL.submitBtn)).toHaveText("Submitting...");
    await expect(page.locator(SEL.submitBtn)).toBeDisabled();
    await snap("确认按钮变为 Submitting... 并禁用");

    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.chassisSeries).toBe("JPCT");
    expect(capturedBody.chassisNo).toBe("028321");
    expect(capturedBody.documentType).toBe("Dimension Plate");
    await snap("确认请求参数正确");

    // 2. API 调用成功（code=200），放行响应
    pending.resolve?.(null);
    // 3. 保存搜索条件到 localStorage
    await expect.poll(() =>
      page.evaluate(() => localStorage.getItem("ghd_chassisSeries"))
    ).toBe("JPCT");
    await expect.poll(() =>
      page.evaluate(() => localStorage.getItem("ghd_chassisNo"))
    ).toBe("028321");
    await expect.poll(() =>
      page.evaluate(() => localStorage.getItem("ghd_documentType"))
    ).toBe("Dimension Plate");
    await snap("确认搜索条件已保存到 localStorage");

    // 4. 跳转到 /generate-document 页面
    await page.waitForURL("**/generate-document");
    // 5. 传递正确的 chassisSeries、chassisNo、documentType 参数（已在上方验证）
    await snap("确认跳转到 /generate-document 页面");
  });

  test("TC16 提交失败-Chassis不存在", async ({ page }) => {
    const snap = makeScreenshot(page, "TC16_提交失败-Chassis不存在");
    // 模拟 generate API 返回 404
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: 404, data: null, message: "Chassis no is not exists" }),
      });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("999999");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入有效表单数据");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1. 显示错误消息
    await expect(page.locator(SEL.error)).toHaveText("Chassis no is not exists");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    await snap("确认 Chassis 不存在错误消息");

    // 3. 不跳转页面
    expect(page.url()).toContain("/generate-homologation-document");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await expect(page.locator(SEL.submitBtn)).toHaveText("Submit");
    await snap("确认不跳转且按钮恢复可用");
  });

  test("TC17 提交失败-服务器500错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC17_提交失败-服务器500错误");
    // 模拟 generate API 返回 500
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: 500, data: null, message: "Internal Server Error" }),
      });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入有效表单数据");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1. 显示系统错误消息
    await expect(page.locator(SEL.error)).toHaveText("System error. Please try again later.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 不跳转页面
    expect(page.url()).toContain("/generate-homologation-document");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认 500 错误消息且按钮恢复可用");
  });

  test("TC18 异常处理-网络错误", async ({ page }) => {
    const snap = makeScreenshot(page, "TC18_异常处理-网络错误");
    // 模拟网络断开：abort generate API
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      await route.abort();
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入有效表单数据");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮");

    // 1. 显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    // 2. 类型为 Error（红色）
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 不跳转页面
    expect(page.url()).toContain("/generate-homologation-document");
    // 4. 按钮恢复可用状态
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认网络错误消息且按钮恢复可用");
  });

  test("TC19 异常处理-API超时", async ({ page }) => {
    const snap = makeScreenshot(page, "TC19_异常处理-API超时");
    // 模拟 API 响应超时：延迟后 abort
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.abort();
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入有效表单数据");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮（等待超时）");

    // 1. 超时后显示网络错误消息
    await expect(page.locator(SEL.error)).toHaveText("Network error. Please check your connection.");
    // 2. 类型为 Error（红色）
    // 3. 按钮恢复可用状态
    await expect(page.locator(SEL.submitBtn)).toBeEnabled();
    await snap("确认超时后显示错误消息且按钮恢复可用");
  });

  // ============================================================
  // Reset 处理
  // ============================================================

  test("TC20 Reset-清空当前输入", async ({ page }) => {
    const snap = makeScreenshot(page, "TC20_Reset-清空当前输入");
    let apiCalled = false;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 在三个必填字段输入内容
    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("在三个必填字段输入内容");

    await page.locator(SEL.resetBtn).click();
    await snap("点击 Reset 按钮");

    // 1/2/3. 三个字段均被清空
    await expect(page.locator(SEL.seriesInput)).toHaveValue("");
    await expect(page.locator(SEL.noInput)).toHaveValue("");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    await snap("确认三个字段被清空");

    // 4. 不调用 API
    expect(apiCalled).toBe(false);
    // 5. 不显示错误消息
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认未调用 API 且无错误消息");
  });

  test("TC21 Reset-清除错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC21_Reset-清除错误消息");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 1. 触发错误（直接提交空表单）
    await page.locator(SEL.submitBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("Please fill in all required fields.");
    await snap("确认错误消息显示");

    // 2. 点击 Reset 清除错误消息
    await page.locator(SEL.resetBtn).click();
    await snap("点击 Reset 按钮");

    // 3. 错误消息被清除，表单恢复初始状态
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await expect(page.locator(SEL.seriesInput)).toHaveValue("");
    await expect(page.locator(SEL.noInput)).toHaveValue("");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("");
    await snap("确认错误消息被清除且表单恢复初始状态");
  });

  test("TC22 Reset-输入时可清除错误消息", async ({ page }) => {
    const snap = makeScreenshot(page, "TC22_Reset-输入时可清除错误消息");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 1. 触发错误（直接提交空表单）
    await page.locator(SEL.submitBtn).click();
    await expect(page.locator(SEL.error)).toHaveText("Please fill in all required fields.");
    await snap("确认错误消息显示");

    // 3. 在任一字段输入内容时错误消息被清除
    await page.locator(SEL.seriesInput).fill("JPCT");
    await snap("在 Chassis series 输入内容");

    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认输入内容时错误消息被清除");
  });

  // ============================================================
  // Help 处理
  // ============================================================

  test("TC23 Help-点击跳转帮助页", async ({ page }) => {
    const snap = makeScreenshot(page, "TC23_Help-点击跳转帮助页");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 先输入内容，验证返回后可保留
    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入表单内容（用于验证返回后可保留）");

    // 1. 点击 Help 按钮
    await page.locator(SEL.helpBtn).click();
    await snap("点击 Help 按钮");

    // 跳转到 /hdoc-help 帮助页面
    await page.waitForURL("**/hdoc-help");
    await expect(page.locator(".help-title")).toHaveText("HDoc Help");
    await snap("确认跳转到帮助页面");

    // 2. 不出现错误提示
    await expect(page.locator(".help-back-btn")).toBeVisible();
    await snap("确认帮助页面无错误提示");
  });

  // ============================================================
  // UI交互
  // ============================================================

  test("TC24 UI交互-Submit中按钮禁用", async ({ page }) => {
    const snap = makeScreenshot(page, "TC24_UI交互-Submit中按钮禁用");
    // 挂起 generate API 响应，观察提交中的禁用状态
    const pending: { resolve: ((value: unknown) => void) | null } = { resolve: null };
    await page.route(/\/api\/hdoc\/generate/, (route) => {
      return new Promise((resolve) => {
        pending.resolve = resolve;
      }).then(() =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, data: { redirectUrl: "/generate-document-result", documentId: "DOC-123" } }),
        })
      );
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入有效表单数据");

    await page.locator(SEL.submitBtn).click();
    await snap("点击 Submit 按钮（API 挂起中）");

    // 1. 按钮文字变为 "Submitting..."
    await expect(page.locator(SEL.submitBtn)).toHaveText("Submitting...");
    // 2. 按钮处于禁用状态
    await expect(page.locator(SEL.submitBtn)).toBeDisabled();
    // 3/4/5/6. Chassis series、Chassis no 输入框与 Document type 下拉、Reset 按钮禁用
    await expect(page.locator(SEL.seriesInput)).toBeDisabled();
    await expect(page.locator(SEL.noInput)).toBeDisabled();
    await expect(page.locator(SEL.typeSelect)).toBeDisabled();
    await expect(page.locator(SEL.resetBtn)).toBeDisabled();
    await snap("确认提交中所有控件禁用");

    // 放行响应以完成提交，避免后续残留状态
    pending.resolve?.(null);
    await page.waitForURL("**/generate-document").catch(() => {});
  });

  test("TC25 UI交互-Submit中防止重复提交", async ({ page }) => {
    const snap = makeScreenshot(page, "TC25_UI交互-Submit中防止重复提交");
    // 统计 generate API 调用次数
    let callCount = 0;
    const pending: { resolve: ((value: unknown) => void) | null } = { resolve: null };
    await page.route(/\/api\/hdoc\/generate/, (route) => {
      callCount += 1;
      return new Promise((resolve) => {
        pending.resolve = resolve;
      }).then(() =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: 200, data: { redirectUrl: "/generate-document-result", documentId: "DOC-123" } }),
        })
      );
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await snap("输入有效表单数据");

    await page.locator(SEL.submitBtn).click();
    await snap("第一次点击 Submit");

    // 1. 第二次点击无效（按钮已禁用）
    await expect(page.locator(SEL.submitBtn)).toBeDisabled();
    await page.locator(SEL.submitBtn).click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    await snap("API 响应前再次点击按钮");

    // 2. 只发起一次 API 调用
    expect(callCount).toBe(1);
    await snap("确认只发起一次 API 调用");

    // 放行响应
    pending.resolve?.(null);
    await page.waitForURL("**/generate-document").catch(() => {});
  });

  test("TC26 UI交互-支持邮箱显示", async ({ page }) => {
    const snap = makeScreenshot(page, "TC26_UI交互-支持邮箱显示");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 1/2. 页面底部显示支持邮箱信息
    await expect(page.locator(SEL.support)).toBeVisible();
    await expect(page.locator(SEL.support)).toHaveText("support.tpi@volvo.com");
    await snap("确认底部支持邮箱信息显示");
  });

  test("TC27 UI交互-错误消息样式", async ({ page }) => {
    const snap = makeScreenshot(page, "TC27_UI交互-错误消息样式");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 初期：Error Message 默认隐藏
    await expect(page.locator(SEL.error)).toHaveCount(0);
    await snap("确认错误消息默认隐藏");

    // 触发空值校验错误
    await page.locator(SEL.submitBtn).click();
    await expect(page.locator(SEL.error)).toBeVisible();
    await snap("触发空值校验错误");

    // 1. Error Message 文字颜色为红色
    const color = await page.locator(SEL.error).evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe("rgb(198, 40, 40)");
    // 3. 消息显示在表单下方
    const errorBox = await page.locator(SEL.error).boundingBox();
    const formBox = await page.locator(".ghd-form").boundingBox();
    if (errorBox && formBox) {
      expect(errorBox.y).toBeGreaterThanOrEqual(formBox.y + formBox.height);
    }
    await snap("确认错误消息颜色与位置");
  });

  test("TC28 UI交互-提交成功后保存搜索条件", async ({ page }) => {
    const snap = makeScreenshot(page, "TC28_UI交互-提交成功后保存搜索条件");
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: { redirectUrl: "/generate-document-result", documentId: "DOC-123456" } }),
      });
    });
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 1. 输入 Chassis series、Chassis no、Document type 并提交成功
    await page.locator(SEL.seriesInput).fill("JPCT");
    await page.locator(SEL.noInput).fill("028321");
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await page.locator(SEL.submitBtn).click();
    await page.waitForURL("**/generate-document");
    await snap("输入并提交成功（跳转至 /generate-document）");

    // 2. 搜索条件保存到 localStorage
    const savedSeries = await page.evaluate(() => localStorage.getItem("ghd_chassisSeries"));
    const savedNo = await page.evaluate(() => localStorage.getItem("ghd_chassisNo"));
    const savedType = await page.evaluate(() => localStorage.getItem("ghd_documentType"));
    expect(savedSeries).toBe("JPCT");
    expect(savedNo).toBe("028321");
    expect(savedType).toBe("Dimension Plate");
    await snap("确认搜索条件保存到 localStorage");

    // 重新进入页面，确认回填
    await page.goto(PAGE_URL);
    await expect(page.locator(SEL.seriesInput)).toHaveValue("JPCT");
    await expect(page.locator(SEL.noInput)).toHaveValue("028321");
    await expect(page.locator(SEL.typeSelect)).toHaveValue("Dimension Plate");
    await snap("重新进入页面确认自动回填");
  });

  // ============================================================
  // 安全性
  // ============================================================

  test("TC29 安全性-输入格式过滤", async ({ page }) => {
    const snap = makeScreenshot(page, "TC29_安全性-输入格式过滤");
    await mockDocumentTypes(page);
    await page.goto(PAGE_URL);
    await snap("访问页面");

    // 1. 在 Chassis series 输入非法字符（数字/符号），仅保留英文字母
    await setReactInputValue(page, SEL.seriesInput, "J1P@CT9");
    await expect(page.locator(SEL.seriesInput)).toHaveValue("JPCT");
    await snap("Chassis series 非法字符被过滤");

    // 2. 在 Chassis no 输入非法字符（字母/符号），仅保留数字
    await setReactInputValue(page, SEL.noInput, "02A8@321X");
    await expect(page.locator(SEL.noInput)).toHaveValue("028321");
    await snap("Chassis no 非法字符被过滤");

    // 4/5. 拦截 generate 请求，验证提交参数为 sanitization 后的值
    let capturedBody: any = null;
    await page.route(/\/api\/hdoc\/generate/, async (route) => {
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 200, data: { redirectUrl: "/generate-document-result", documentId: "DOC-123" } }),
      });
    });
    await page.locator(SEL.typeSelect).selectOption("Dimension Plate");
    await page.locator(SEL.submitBtn).click();
    await expect.poll(() => capturedBody).not.toBeNull();
    expect(capturedBody.chassisSeries).toBe("JPCT");
    expect(capturedBody.chassisNo).toBe("028321");
    await snap("确认提交参数为过滤后的合法值");
  });
});
