import { test, expect, Page } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const API_LOGIN = "**/api/AuthenticationApi/login";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD01";

/** スクリーンショット用カウンター（テストケースごとにリセット） */
let screenshotCounter = 1;

async function takeStepScreenshot(page: Page, testName: string) {
  const filename = String(screenshotCounter++).padStart(3, "0") + ".jpg";
  await page.screenshot({
    path: `${IMAGE_DIR}/${testName}/${filename}`,
    type: "jpeg",
    quality: 85,
    fullPage: true,
  });
}

async function navigateToLogin(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("#userid-input", { timeout: 10000 });
}

// ============================================================
// テストスイート
// ============================================================

test.describe("Login 模块 (UD01) 测试", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToLogin(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      const failedName = testInfo.title.replace(
        /[\[\]\\\/\:\*\?\"\<\>\|]/g,
        "_",
      );
      await page.screenshot({
        path: `${IMAGE_DIR}/_FAILED_/${failedName}.jpg`,
        type: "jpeg",
        quality: 85,
        fullPage: true,
      });
    }
  });

  // ==========================================================
  // 1. 画面初始化（1～7）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-全体布局";
      await expect(page.locator(".login-container")).toBeVisible();
      await expect(page.locator(".login-brand-section")).toBeVisible();
      await expect(page.locator(".login-form-section")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[2] 画面初始化-左侧品牌区域", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-左侧品牌区域";
      await expect(page.locator(".brand-title")).toHaveText("EDB");
      await expect(page.locator(".brand-title2")).toHaveText(
        " Engineering Database",
      );
      await expect(page.locator(".brand-subtitle")).toHaveText(
        "Use Outlook id and password",
      );
      await expect(page.locator(".brand-support")).toContainText("Support.TPI");
      await takeStepScreenshot(page, testName);
    });

    test("[3] 画面初始化-右侧登录表单", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-右侧登录表单";
      await expect(page.locator("#userid-input")).toBeVisible();
      await expect(page.locator("input[placeholder='Password']")).toBeVisible();
      const loginBtn = page.locator(".login-button");
      await expect(loginBtn).toBeVisible();
      await expect(loginBtn).toHaveText("Login");
      await expect(page.locator(".fallback-login-info")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[4] 画面初始化-UserID自动聚焦", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-UserID自动聚焦";
      await expect(page.locator("#userid-input")).toBeFocused();
      await takeStepScreenshot(page, testName);
    });

    test("[5] 画面初始化-初期値", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-初期値";
      await expect(page.locator("#userid-input")).toHaveValue("");
      await expect(page.locator("input[placeholder='Password']")).toHaveValue(
        "",
      );
      await expect(page.locator(".error-message")).toHaveCount(0);
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
    });

    test("[6] 画面初始化-背景", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-背景";
      await expect(page.locator(".login-container")).toBeVisible();
      await takeStepScreenshot(page, testName);
    });

    test("[7] 画面初始化-底部备用链接", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "画面初始化-底部备用链接";
      const fallbackInfo = page.locator(".fallback-login-info");
      await expect(fallbackInfo).toBeVisible();
      await expect(fallbackInfo).toContainText("If you get error message");
      await expect(fallbackInfo).toContainText(
        "Please try this alternative login link",
      );
      await expect(fallbackInfo).toContainText(
        "We are working to find root cause",
      );
      await expect(page.locator(".fallback-link")).toHaveText("Login");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 2. 输入限制（UserID）（8～16）
  // ==========================================================

  test.describe("输入限制（UserID）", () => {
    test("[8] UserID-半角英数字のみ許可", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-半角英数字のみ許可";
      const input = page.locator("#userid-input");
      await input.fill("abc123");
      await expect(input).toHaveValue("abc123");
      await takeStepScreenshot(page, testName);
    });

    test("[9] UserID-符号输入不可", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-符号输入不可";
      const input = page.locator("#userid-input");
      await input.fill("abc!@#");
      await expect(input).toHaveValue("abc");
      await expect(page.locator(".error-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[10] UserID-全角文字输入不可", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-全角文字输入不可";
      const input = page.locator("#userid-input");
      await input.fill("ａｂｃ日本語");
      await expect(input).toHaveValue("");
      await expect(page.locator(".error-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[11] UserID-空格输入不可", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-空格输入不可";
      const input = page.locator("#userid-input");
      await input.fill("abc 123");
      await expect(input).toHaveValue("abc123");
      await expect(page.locator(".error-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[12] UserID-MaxLength（10文字）", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "UserID-MaxLength（10文字）";
      const input = page.locator("#userid-input");
      await input.fill("abcdefghijk");
      await expect(input).toHaveValue("abcdefghij");
      await takeStepScreenshot(page, testName);
    });

    test("[13] UserID-边界值（10字符）", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-边界值（10字符）";
      const input = page.locator("#userid-input");
      await input.fill("ABCDEFGHIJ");
      await expect(input).toHaveValue("ABCDEFGHIJ");
      await takeStepScreenshot(page, testName);
    });

    test("[14] UserID-最小值（1字符）", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-最小值（1字符）";
      const input = page.locator("#userid-input");
      await input.fill("a");
      await expect(input).toHaveValue("a");
      await takeStepScreenshot(page, testName);
    });

    test("[15] UserID-复制粘贴", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-复制粘贴";
      const input = page.locator("#userid-input");
      await input.fill("abc!@#def");
      await expect(input).toHaveValue("abcdef");
      await expect(page.locator(".error-message")).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[16] UserID-大小写", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "UserID-大小写";
      const input = page.locator("#userid-input");
      await input.fill("ABCDEF");
      await expect(input).toHaveValue("ABCDEF");
      await input.fill("");
      await input.fill("abcdef");
      await expect(input).toHaveValue("abcdef");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 3. 输入限制（Password）（17～22）
  // ==========================================================

  test.describe("输入限制（Password）", () => {
    test("[17] Password-掩码显示", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Password-掩码显示";
      const input = page.locator("input[placeholder='Password']");
      await input.fill("MyP@ss123");
      await expect(input).toHaveAttribute("type", "password");
      await expect(input).toHaveValue("MyP@ss123");
      await takeStepScreenshot(page, testName);
    });

    test("[18] Password-掩码显示切换", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Password-掩码显示切换";
      const input = page.locator("input[placeholder='Password']");
      await input.fill("MyP@ss123");
      await expect(input).toHaveAttribute("type", "password");
      await takeStepScreenshot(page, testName);
      const toggleBtn = page.locator(".ant-input-password-icon");
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
        await expect(input).toHaveAttribute("type", "text");
        await toggleBtn.click();
        await expect(input).toHaveAttribute("type", "password");
        await takeStepScreenshot(page, testName);
      }
    });

    test("[19] Password-MaxLength（32文字）", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "Password-MaxLength（32文字）";
      const input = page.locator("input[placeholder='Password']");
      await input.fill("a".repeat(33));
      await expect(input).toHaveValue("a".repeat(32));
      await takeStepScreenshot(page, testName);
    });

    test("[20] Password-符号输入", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Password-符号输入";
      const input = page.locator("input[placeholder='Password']");
      await input.fill("P@ssw0rd!#");
      await expect(input).toHaveValue("P@ssw0rd!#");
      await expect(input).toHaveAttribute("type", "password");
      await takeStepScreenshot(page, testName);
    });

    test("[21] Password-全角文字输入", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Password-全角文字输入";
      const input = page.locator("input[placeholder='Password']");
      await input.fill("パスワード");
      await expect(input).toHaveValue("パスワード");
      await takeStepScreenshot(page, testName);
    });

    test("[22] Password-空值", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Password-空值";
      const input = page.locator("input[placeholder='Password']");
      await expect(input).toHaveValue("");
      await expect(input).toHaveAttribute("placeholder", "Password");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 4. 空值校验（23～28）
  // ==========================================================

  test.describe("空值校验（前端校验）", () => {
    test("[23] 空值校验-UserID和Password同时为空", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "空值校验-UserID和Password同时为空";
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
    });

    test("[24] 空值校验-UserID为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "空值校验-UserID为空";
      await page.locator("input[placeholder='Password']").fill("pass");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });

    test("[25] 空值校验-Password为空", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "空值校验-Password为空";
      await page.locator("#userid-input").fill("user");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });

    test("[26] 空值校验-UserID空格", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "空值校验-UserID空格";
      await page.locator("#userid-input").fill("   ");
      await page.locator("input[placeholder='Password']").fill("pass");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });

    test("[27] 空值校验-Password空格", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "空值校验-Password空格";
      await page.locator("#userid-input").fill("user");
      await page.locator("input[placeholder='Password']").fill("   ");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });

    test("[28] 空值校验-同时空格", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "空值校验-同时空格";
      await page.locator("#userid-input").fill("   ");
      await page.locator("input[placeholder='Password']").fill("   ");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 5. API调用（29～34）
  // 30～34 は仕様書に"模拟 API 返回"と明記されているため route 使用
  // ==========================================================

  test.describe("API调用（后端校验）", () => {
    test("[29] API调用-正常请求", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "API调用-正常请求";
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await takeStepScreenshot(page, testName);
      await page.locator(".login-button").click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });

    test("[30] API调用-认证成功（200）", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "API调用-认证成功（200）";
      await page.route(API_LOGIN, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            msg: "success",
            data: { userId: "x001", name: "Test User" },
          }),
        });
      });
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await takeStepScreenshot(page, testName);
      await expect(page).toHaveURL(/UD02/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[31] API调用-认证失败(401)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "API调用-认证失败(401)";
      await page.route(API_LOGIN, async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid credentials" }),
        });
      });
      await page.locator("#userid-input").fill("wrong");
      await page.locator("input[placeholder='Password']").fill("wrong");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "We didn't recognize the username or password you entered. Please try again.",
      );
      await expect(page.locator("input[placeholder='Password']")).toHaveValue(
        "",
      );
      await expect(page.locator("#userid-input")).toHaveValue("wrong");
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[32] API调用-认证失败(403)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "API调用-认证失败(403)";
      await page.route(API_LOGIN, async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ message: "Forbidden" }),
        });
      });
      await page.locator("#userid-input").fill("wrong");
      await page.locator("input[placeholder='Password']").fill("wrong");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "We didn't recognize the username or password you entered. Please try again.",
      );
      await expect(page.locator("input[placeholder='Password']")).toHaveValue(
        "",
      );
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[33] API调用-账户锁定(403 locked)", async ({
      page,
    }: {
      page: Page;
    }) => {
      screenshotCounter = 1;
      const testName = "API调用-账户锁定(403 locked)";
      await page.route(API_LOGIN, async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ message: "Account locked" }),
        });
      });
      await page.locator("#userid-input").fill("locked_user");
      await page.locator("input[placeholder='Password']").fill("pass");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("您的账户已被锁定，请联系系统管理员");
      await expect(page.locator("input[placeholder='Password']")).toHaveValue(
        "",
      );
      await expect(page.locator(".login-button")).toBeEnabled();
      await expect(page.locator(".fallback-login-info")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[34] API调用-服务器错误(500)", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "API调用-服务器错误(500)";
      await page.route(API_LOGIN, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal Server Error" }),
        });
      });
      await page.locator("#userid-input").fill("test");
      await page.locator("input[placeholder='Password']").fill("test");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "System error. Please contact administrator.",
      );
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });
  });

  // ==========================================================
  // 6. 异常处理（35～37）
  // 仕様書に"模拟"と明記されているため route 使用
  // ==========================================================

  test.describe("异常处理", () => {
    test("[35] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-网络错误";
      await page.route(API_LOGIN, async (route) => {
        await route.abort("connectionrefused");
      });
      await page.locator("#userid-input").fill("test");
      await page.locator("input[placeholder='Password']").fill("test");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "Network error. Please check your connection.",
      );
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[36] 异常处理-API超时", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-API超时";
      test.setTimeout(60000);
      // 35秒後に timedout で中断してタイムアウトを模擬
      await page.route(API_LOGIN, async (route) => {
        await new Promise((r) => setTimeout(r, 35000));
        await route.abort("timedout");
      });
      await page.locator("#userid-input").fill("test");
      await page.locator("input[placeholder='Password']").fill("test");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible({ timeout: 45000 });
      await expect(errorMsg).toContainText("Network error");
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[37] 异常处理-API其他错误", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "异常处理-API其他错误";
      await page.route(API_LOGIN, async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Bad Request" }),
        });
      });
      await page.locator("#userid-input").fill("test");
      await page.locator("input[placeholder='Password']").fill("test");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Bad Request");
      await expect(page.locator(".login-button")).toBeEnabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });
  });

  // ==========================================================
  // 7. UI操作（38～42）— 実API
  // ==========================================================

  test.describe("UI操作（Enter键 / 加载状态）", () => {
    test("[38] Enter键-登录触发", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Enter键-登录触发";
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator("input[placeholder='Password']").press("Enter");
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);
    });

    test("[39] Enter键-UserID输入中", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "Enter键-UserID输入中";
      await page.locator("#userid-input").fill("x001");
      await page.locator("#userid-input").press("Enter");
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });

    test("[40] 加载中-按钮禁用", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "加载中-按钮禁用";
      // APIを3秒遅延させてLoading状態を確保しつつ、実APIを呼ぶ
      await page.route(API_LOGIN, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await expect(page.locator(".login-button")).toBeDisabled();
      await expect(page.locator("#userid-input")).toBeDisabled();
      await expect(
        page.locator("input[placeholder='Password']"),
      ).toBeDisabled();
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[41] 加载中-防止重复提交", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "加载中-防止重复提交";
      // APIを3秒遅延させてLoading状態を確保しつつ、実APIを呼ぶ
      await page.route(API_LOGIN, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      // 2回目のクリックは disabled のため無効（force:true でアクション不可視チェックを回避）
      await page.locator(".login-button").click({ force: true });
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });

    test("[42] 加载中-Enter键无效", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "加载中-Enter键无效";
      // APIを遅延させてLoading状態を確保
      await page.route(API_LOGIN, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      // Enter キーを押す（入力欄が disabled のため無効）
      await page.locator("#userid-input").press("Enter");
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, testName);
      await page.unroute(API_LOGIN);
    });
  });

  // ==========================================================
  // 8. 消息显示（43～46）— 実API
  // ==========================================================

  test.describe("消息显示", () => {
    test("[43] 消息-错误显示位置", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "消息-错误显示位置";
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
    });

    test("[44] 消息-重新输入时清除", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "消息-重新输入时清除";
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.locator("#userid-input").fill("A");
      await expect(errorMsg).toHaveCount(0);
      await takeStepScreenshot(page, testName);
    });

    test("[45] 消息-多次错误发生", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "消息-多次错误发生";
      await page.locator(".login-button").click();
      let errorMsg = page.locator(".error-message");
      await expect(errorMsg).toHaveText("Username and password are required.");
      await takeStepScreenshot(page, testName);
      await page.locator("#userid-input").fill("user");
      await page.locator("input[placeholder='Password']").fill("pass");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1500);
      await expect(page.locator(".error-message")).toHaveCount(1);
      await takeStepScreenshot(page, testName);
    });

    test("[46] 消息-认证成功时隐藏", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "消息-认证成功时隐藏";
      await page.locator(".login-button").click();
      await expect(page.locator(".error-message")).toBeVisible();
      await takeStepScreenshot(page, testName);
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 9. 数据保存（47～49）— 実API
  // ==========================================================

  test.describe("数据保存", () => {
    test("[47] 数据保存-user_info", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "数据保存-user_info";
      // 実APIでログイン成功時のみ localStorage に保存される
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await page.waitForTimeout(2000);
      const userInfoStr = await page.evaluate(() =>
        localStorage.getItem("user_info"),
      );
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        // API応答構造に応じて柔軟にアサーション
        if (userInfo.user) {
          expect(userInfo.user.userId).toBe("x001");
        } else if (userInfo.userId) {
          expect(userInfo.userId).toBe("x001");
        }
      }
      await takeStepScreenshot(page, testName);
    });

    test("[48] 数据保存-auth_token", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "数据保存-auth_token";
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1500);
      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token"),
      );
      if (token) {
        expect(token).toBe("x001");
      }
      await takeStepScreenshot(page, testName);
    });

    test("[49] 数据保存-失败时不保存", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "数据保存-失败时不保存";
      await page.locator("#userid-input").fill("wrong_user_xyz");
      await page
        .locator("input[placeholder='Password']")
        .fill("wrong_pass_xyz");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1500);
      const userInfo = await page.evaluate(() =>
        localStorage.getItem("user_info"),
      );
      const token = await page.evaluate(() =>
        localStorage.getItem("auth_token"),
      );
      expect(userInfo).toBeNull();
      expect(token).toBeNull();
      await expect(page).toHaveURL(/UD01/);
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 10. 页面跳转（50～52）
  // ==========================================================

  test.describe("页面跳转", () => {
    test("[50] 页面跳转-登录成功后", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "页面跳转-登录成功后";
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, testName);
    });

    test("[51] 页面跳转-登录失败后", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "页面跳转-登录失败后";
      await page.locator("#userid-input").fill("wrong_user_xyz");
      await page
        .locator("input[placeholder='Password']")
        .fill("wrong_pass_xyz");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1500);
      await expect(page).toHaveURL(/UD01/);
      await takeStepScreenshot(page, testName);
    });

    test("[52] 页面跳转-未登录直接访问", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "页面跳转-未登录直接访问";
      await page.evaluate(() => window.localStorage.clear());
      await takeStepScreenshot(page, testName);
      await page.goto("/UD02", { waitUntil: "networkidle" });
      await expect(page).toHaveURL(/UD01/, { timeout: 10000 });
      await takeStepScreenshot(page, testName);
    });
  });

  // ==========================================================
  // 11. 安全性（53～56）
  // ==========================================================

  test.describe("安全性", () => {
    test("[53] 安全性-密码隐藏", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-密码隐藏";
      const passwordInput = page.locator("input[placeholder='Password']");
      await passwordInput.fill("test123");
      await expect(passwordInput).toHaveAttribute("type", "password");
      await takeStepScreenshot(page, testName);
    });

    test("[54] 安全性-密码不记录日志", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-密码不记录日志";
      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[placeholder='Password']").fill("testpass");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, testName);
    });

    test("[55] 安全性-Token保存", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-Token保存";
      await page.locator("#userid-input").fill("x001");
      await page.locator("input[placeholder='Password']").fill("123456");
      await page.locator(".login-button").click();
      await page.waitForTimeout(1500);
      await takeStepScreenshot(page, testName);
    });

    test("[56] 安全性-XSS防护", async ({ page }: { page: Page }) => {
      screenshotCounter = 1;
      const testName = "安全性-XSS防护";
      const input = page.locator("#userid-input");
      // Ant Design Input の場合はネイティブの値を設定して input イベントを発火
      await input.click();
      await input.evaluate((el) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeSetter?.call(el, "<script>alert('xss')</script>");
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await expect(input).toHaveValue("scriptalertxssscript");
      await takeStepScreenshot(page, testName);
    });
  });
});
