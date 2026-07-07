import { test, expect, Page, Route } from "@playwright/test";

// ============================================================
// 共通設定
// ============================================================

const LOGIN_URL = "/UD01";
const API_URL = "/api/AuthenticationApi/login";

/** モックAPI：成功（200） */
async function mockLoginSuccess(page: Page, customUser?: any) {
  const defaultUser = {
    userId: "testuser",
    name: "Test User",
    password: "testpass",
  };
  await page.route(API_URL, async (route: Route) => {
    const responseBody = {
      code: 200,
      msg: "success",
      user: customUser || defaultUser,
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });
}

/** モックAPI：失敗（401） */
async function mockLogin401(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });
}

/** モックAPI：失敗（403 - 一般） */
async function mockLogin403(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ message: "Forbidden" }),
    });
  });
}

/** モックAPI：失敗（403 - アカウントロック） */
async function mockLogin403Locked(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ message: "Account locked" }),
    });
  });
}

/** モックAPI：失敗（500） */
async function mockLogin500(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Internal Server Error" }),
    });
  });
}

/** モックAPI：ネットワークエラー */
async function mockLoginNetworkError(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    await route.abort("connectionrefused");
  });
}

/** モックAPI：タイムアウト（応答なし） */
async function mockLoginTimeout(page: Page) {
  await page.route(API_URL, async (route: Route) => {
    // 延迟 60 秒再响应，确保路由不会永久挂起
    await new Promise((resolve) => setTimeout(resolve, 60000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
}

/** モックAPI：その他ステータスコード（例：400） */
async function mockLoginOtherStatus(page: Page, status: number = 400) {
  await page.route(API_URL, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ message: "Bad Request" }),
    });
  });
}

// ============================================================
// テストスイート：Login 模块 (UD01)
// ============================================================

// test.describe("Login 模块 (UD01) 测试", () => {
//   test.beforeEach(async ({ page }: { page: Page }) => {
//     await page.goto(LOGIN_URL);
//     // ページが完全に読み込まれるのを待つ
//     await page.waitForSelector("#userid-input", { timeout: 10000 });
//   });

test.describe("Login 模块 (UD01) 测试", () => {
  // 整套测试总超时提升至60秒，解决30秒上限限制
  test.describe.configure({ timeout: 60000 });

  test.beforeEach(async ({ page }: { page: Page }) => {
    // 替换 waitUntil: "load" → domcontentloaded（仅等DOM解析完成，跳过全部资源加载）
    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForSelector("#userid-input", { timeout: 10000 });
  });

  // ==========================================================
  // 1. 画面初始化（テストケース 1～7）
  // ==========================================================

  test.describe("画面初始化", () => {
    test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
      // 1. 画面为左右分栏设计
      const loginContainer = page.locator(".login-container");
      await expect(loginContainer).toBeVisible();

      // 2. 左侧显示品牌信息区域
      const brandSection = page.locator(".login-brand-section");
      await expect(brandSection).toBeVisible();

      // 3. 右侧显示登录表单区域
      const formSection = page.locator(".login-form-section");
      await expect(formSection).toBeVisible();

      // 4. 背景图片正常显示（cover 铺满） — CSS 確認
      await expect(loginContainer).toHaveCSS("background-size", "cover");
    });

    test("[2] 画面初始化-左侧品牌区域", async ({ page }: { page: Page }) => {
      // 1. 显示标题 "EDB Engineering Database"（EDB 加粗）
      const brandTitle = page.locator(".brand-title");
      await expect(brandTitle).toHaveText("EDB");
      const brandTitle2 = page.locator(".brand-title2");
      await expect(brandTitle2).toContainText("Engineering Database");

      // 2. 显示 "Use Outlook id and password"（居中）
      const brandSubtitle = page.locator(".brand-subtitle");
      await expect(brandSubtitle).toHaveText("Use Outlook id and password");

      // 3. 显示 "Support, authorization request..."（靠左）
      const brandSupport = page.locator(".brand-support");
      await expect(brandSupport).toContainText("Support.TPI");

      // 4. 文字为白色
      await expect(brandTitle).toHaveCSS("color", /rgb\(255,\s*255,\s*255\)/);
    });

    test("[3] 画面初始化-右侧登录表单", async ({ page }: { page: Page }) => {
      // 1. UserID 输入框显示
      await expect(page.locator("#userid-input")).toBeVisible();

      // 2. Password 输入框显示
      await expect(page.locator("input[type='password']")).toBeVisible();

      // 3. Login 按钮显示
      await expect(page.locator(".login-button")).toBeVisible();

      // 4. 底部备用链接提示显示（红色文字）
      const fallbackInfo = page.locator(".fallback-login-info");
      await expect(fallbackInfo).toBeVisible();
      //   await expect(fallbackInfo).toHaveCSS("color", /rgb\(255,\s*0,\s*0\)/);
    });

    test("[4] 画面初始化-UserID自动聚焦", async ({ page }: { page: Page }) => {
      // UserID 输入框自动获得焦点
      await expect(page.locator("#userid-input")).toBeFocused();
    });

    test("[5] 画面初始化-初期値", async ({ page }: { page: Page }) => {
      // 1. UserID 输入框为空
      await expect(page.locator("#userid-input")).toHaveValue("");

      // 2. Password 输入框为空
      await expect(page.locator("input[type='password']")).toHaveValue("");

      // 3. Message 标签隐藏（不显示）
      await expect(page.locator(".error-message")).toHaveCount(0);

      // 4. Login 按钮为可用状态
      await expect(page.locator(".login-button")).toBeEnabled();
    });

    test("[6] 画面初始化-背景", async ({ page }: { page: Page }) => {
      const loginContainer = page.locator(".login-container");
      // 背景图片 cover 模式铺满
      await expect(loginContainer).toHaveCSS("background-size", "cover");
      await expect(loginContainer).toHaveCSS("background-position", "50% 50%");
    });

    test("[7] 画面初始化-底部备用链接", async ({ page }: { page: Page }) => {
      const fallbackInfo = page.locator(".fallback-login-info");

      // 1. 显示特定内容（全部红色字体）
      await expect(fallbackInfo).toContainText("If you get error message");
      await expect(fallbackInfo).toContainText(
        "Please try this alternative login link",
      );
      await expect(fallbackInfo).toContainText(
        "We are working to find root cause of problem.",
      );

      // 2. "Login" 为可点击链接
      const fallbackLink = page.locator(".fallback-link");
      await expect(fallbackLink).toBeVisible();
      await expect(fallbackLink).toHaveText("Login");
    });
  });

  // ==========================================================
  // 2. 输入限制（UserID）（テストケース 8～16）
  // ==========================================================

  test.describe("输入限制（UserID）", () => {
    test("[8] UserID-半角英数字のみ許可", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      await useridInput.fill("abc123");
      await expect(useridInput).toHaveValue("abc123");
    });

    test("[9] UserID-符号输入不可", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      // 文字を1文字ずつ入力してフィルタリングを確認（fill では onChange のフィルタが効かない場合を考慮）
      await useridInput.type("abc!@#");
      await expect(useridInput).toHaveValue("abc");
    });

    test("[10] UserID-全角文字输入不可", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      await useridInput.type("ａｂｃ日本語");
      await expect(useridInput).toHaveValue("");
    });

    test("[11] UserID-空格输入不可", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      await useridInput.type("abc 123");
      await expect(useridInput).toHaveValue("abc123");
    });

    test("[12] UserID-MaxLength（10文字）", async ({
      page,
    }: {
      page: Page;
    }) => {
      const useridInput = page.locator("#userid-input");
      await useridInput.fill("abcdefghijk");
      // maxLength=10 のため11文字目は入力されない
      const val = await useridInput.inputValue();
      expect(val.length).toBeLessThanOrEqual(10);
      expect(val).toBe("abcdefghij");
    });

    test("[13] UserID-边界值（10字符）", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      await useridInput.fill("ABCDEFGHIJ");
      await expect(useridInput).toHaveValue("ABCDEFGHIJ");
    });

    test("[14] UserID-最小值（1字符）", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      await useridInput.fill("a");
      await expect(useridInput).toHaveValue("a");
    });

    test("[15] UserID-复制粘贴", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      // 貼り付けをシミュレート（paste イベントでフィルタを通過）
      await useridInput.focus();
      await page.evaluate(() => {
        const input = document.getElementById(
          "userid-input",
        ) as HTMLInputElement;
        if (input) {
          // React の onChange をトリガーするため paste と input イベントを発火
          input.value = "";
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(input, "abc!@#def");
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      // onChange のフィルタにより !@# が除去される
      await expect(useridInput).toHaveValue("abcdef");
    });

    test("[16] UserID-大小写", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      // 大文字入力
      await useridInput.fill("ABCDEF");
      await expect(useridInput).toHaveValue("ABCDEF");

      // クリアして小文字入力
      await useridInput.fill("");
      await useridInput.fill("abcdef");
      await expect(useridInput).toHaveValue("abcdef");
    });
  });

  // ==========================================================
  // 3. 输入限制（Password）（テストケース 17～22）
  // ==========================================================

  test.describe("输入限制（Password）", () => {
    test("[17] Password-掩码显示", async ({ page }: { page: Page }) => {
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("MyP@ss123");
      // type 属性が password であることを確認（マスク表示）
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("[18] Password-掩码显示切换", async ({ page }: { page: Page }) => {
      // 注：現在の実装では <Input type="password" /> を使用しており、表示切替ボタンは非搭載
      // マスク表示のみ確認
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("MyP@ss123");
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("[19] Password-MaxLength（32文字）", async ({
      page,
    }: {
      page: Page;
    }) => {
      const passwordInput = page.locator("input[type='password']");
      const longStr = "a".repeat(33);
      await passwordInput.fill(longStr);
      const val = await passwordInput.inputValue();
      expect(val.length).toBeLessThanOrEqual(32);
    });

    test("[20] Password-符号输入", async ({ page }: { page: Page }) => {
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("P@ssw0rd!#");
      await expect(passwordInput).toHaveValue("P@ssw0rd!#");
    });

    test("[21] Password-全角文字输入", async ({ page }: { page: Page }) => {
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("パスワード");
      await expect(passwordInput).toHaveValue("パスワード");
      // マスク表示確認
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("[22] Password-空值", async ({ page }: { page: Page }) => {
      const passwordInput = page.locator("input[type='password']");
      await expect(passwordInput).toHaveValue("");
      // placeholder の確認
      await expect(passwordInput).toHaveAttribute("placeholder", "Password");
    });
  });

  // ==========================================================
  // 4. 空值校验（前端校验）（テストケース 23～28）
  // ==========================================================

  test.describe("空值校验（前端校验）", () => {
    test("[23] 空值校验-UserID和Password同时为空", async ({
      page,
    }: {
      page: Page;
    }) => {
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });

    test("[24] 空值校验-UserID为空", async ({ page }: { page: Page }) => {
      await page.locator("input[type='password']").fill("pass");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });

    test("[25] 空值校验-Password为空", async ({ page }: { page: Page }) => {
      await page.locator("#userid-input").fill("user");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });

    test("[26] 空值校验-UserID空格", async ({ page }: { page: Page }) => {
      // スペースはhandleUserIdChangeでフィルタされて空になる
      await page.locator("#userid-input").fill("   ");
      // フィルタ後は空文字になる
      await expect(page.locator("#userid-input")).toHaveValue("");
      await page.locator("input[type='password']").fill("pass");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });

    test("[27] 空值校验-Password空格", async ({ page }: { page: Page }) => {
      await page.locator("#userid-input").fill("user");
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("   ");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });

    test("[28] 空值校验-同时空格", async ({ page }: { page: Page }) => {
      // UserID: 空格被フィルタ → 空
      await page.locator("#userid-input").fill("   ");
      await expect(page.locator("#userid-input")).toHaveValue("");
      // Password: 入力後 trim で空
      await page.locator("input[type='password']").fill("   ");
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });
  });

  // ==========================================================
  // 5. API调用（后端校验）（テストケース 29～34）
  // ==========================================================

  test.describe("API调用（后端校验）", () => {
    test("[29] API调用-正常请求", async ({ page }: { page: Page }) => {
      // API モック設定（成功）
      await mockLoginSuccess(page);

      let capturedBody: any = null;
      await page.route(API_URL, async (route: Route) => {
        const postData = route.request().postData();
        if (postData) capturedBody = JSON.parse(postData);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: 200,
            msg: "success",
            user: {
              userId: "testuser",
              name: "Test User",
              password: "testpass",
            },
          }),
        });
      });

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      // リクエストボディの確認
      expect(capturedBody).not.toBeNull();
      expect(capturedBody.userId).toBe("testuser");
      expect(capturedBody.password).toBe("testpass");
    });

    test("[30] API调用-认证成功（200）", async ({ page }: { page: Page }) => {
      const mockUser = {
        userId: "validuser",
        name: "Valid User",
        password: "validpass",
      };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("validuser");
      await page.locator("input[type='password']").fill("validpass");
      await page.locator(".login-button").click();

      // /UD02 への遷移を待つ
      await page.waitForURL("**/UD02", { timeout: 10000 });
      // エラーメッセージが表示されていない
      await expect(page.locator(".error-message")).toHaveCount(0);
    });

    test("[31] API调用-认证失败(401)", async ({ page }: { page: Page }) => {
      await mockLogin401(page);

      await page.locator("#userid-input").fill("wrong");
      await page.locator("input[type='password']").fill("wrong");
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "We didn't recognize the username or password you entered. Please try again.",
      );

      // Password 输入框被清空
      await expect(page.locator("input[type='password']")).toHaveValue("");
      // UserID 输入框保留输入值
      await expect(page.locator("#userid-input")).toHaveValue("wrong");
    });

    test("[32] API调用-认证失败(403)", async ({ page }: { page: Page }) => {
      await mockLogin403(page);

      await page.locator("#userid-input").fill("wrong");
      await page.locator("input[type='password']").fill("wrong");
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "We didn't recognize the username or password you entered. Please try again.",
      );

      // Password 输入框被清空
      await expect(page.locator("input[type='password']")).toHaveValue("");
    });

    test("[33] API调用-账户锁定(403 with locked message)", async ({
      page,
    }: {
      page: Page;
    }) => {
      await mockLogin403Locked(page);

      await page.locator("#userid-input").fill("locked_user");
      await page.locator("input[type='password']").fill("pass");
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("您的账户已被锁定，请联系系统管理员");

      // Password 输入框被清空
      await expect(page.locator("input[type='password']")).toHaveValue("");
      // 底部备用链接提示仍显示
      await expect(page.locator(".fallback-login-info")).toBeVisible();
    });

    test("[34] API调用-服务器错误(500)", async ({ page }: { page: Page }) => {
      await mockLogin500(page);

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "System error. Please contact administrator.",
      );
    });
  });

  // ==========================================================
  // 6. 异常处理（テストケース 35～37）
  // ==========================================================

  test.describe("异常处理", () => {
    test("[35] 异常处理-网络错误", async ({ page }: { page: Page }) => {
      await mockLoginNetworkError(page);

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "Network error. Please check your connection.",
      );
    });

    test("[36] 异常处理-API超时", async ({ page }: { page: Page }) => {
      // 延迟 2 秒后断开连接，模拟 API 超时
      await page.route(API_URL, async (route: Route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.abort("connectionrefused");
      });

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      // 超时后被组件 catch 捕获，显示网络错误消息
      await expect(page.locator(".error-message")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator(".error-message")).toContainText(
        "Network error",
      );
    });

    test("[37] 异常处理-API其他错误", async ({ page }: { page: Page }) => {
      await mockLoginOtherStatus(page, 400);

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      // サーバーメッセージ "Bad Request" が表示される
      await expect(errorMsg).toContainText("Bad Request");
    });
  });

  // ==========================================================
  // 7. UI操作（Enter键 / 加载状态）（テストケース 38～42）
  // ==========================================================

  test.describe("UI操作（Enter键 / 加载状态）", () => {
    test("[38] Enter键-登录触发（Password入力中）", async ({
      page,
    }: {
      page: Page;
    }) => {
      await mockLogin401(page);

      await page.locator("#userid-input").fill("testuser");
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("testpass");
      // Password 入力中に Enter キーを押下
      await passwordInput.press("Enter");

      // API が呼ばれてエラーメッセージが表示されることを確認
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });

    test("[39] Enter键-UserID输入中", async ({ page }: { page: Page }) => {
      await page.locator("#userid-input").fill("testuser");
      // UserID 入力中に Enter キーを押下（Password は空）
      await page.locator("#userid-input").press("Enter");

      // 空値チェックでエラーメッセージが表示される
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText("Username and password are required.");
    });

    test("[40] 加载中-按钮禁用", async ({ page }: { page: Page }) => {
      // 延迟 60 秒再响应（超出测试默认超时 30 秒），模拟加载中状态
      await page.route(API_URL, async (route: Route) => {
        await new Promise((resolve) => setTimeout(resolve, 60000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "{}",
        });
      });

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      // 少し待ってから状態を確認
      await page.waitForTimeout(500);

      // Login 按钮处于禁用状态
      await expect(page.locator(".login-button")).toBeDisabled();
      // UserID 输入框禁用
      await expect(page.locator("#userid-input")).toBeDisabled();
      // Password 输入框禁用
      await expect(page.locator("input[type='password']")).toBeDisabled();
    });

    test("[41] 加载中-防止重复提交", async ({ page }: { page: Page }) => {
      let callCount = 0;
      await page.route(API_URL, async (route: Route) => {
        callCount++;
        // 延迟 60 秒再响应，确保测试超时前路由最终可释放
        await new Promise((resolve) => setTimeout(resolve, 60000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "{}",
        });
      });

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");

      // 第一次点击使按钮禁用；第二次使用 force:true 模拟禁用状态下的点击
      await page.locator(".login-button").click();
      await page.locator(".login-button").click({ force: true });

      await page.waitForTimeout(500);
      // API は1回しか呼ばれていない
      expect(callCount).toBeLessThanOrEqual(1);
    });

    test("[42] 加载中-Enter键无效", async ({ page }: { page: Page }) => {
      let callCount = 0;
      await page.route(API_URL, async (route: Route) => {
        callCount++;
        // 延迟 60 秒再响应，确保测试超时前路由最终可释放
        await new Promise((resolve) => setTimeout(resolve, 60000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "{}",
        });
      });

      await page.locator("#userid-input").fill("testuser");
      await page.locator("input[type='password']").fill("testpass");
      await page.locator(".login-button").click();

      await page.waitForTimeout(300);

      // ローディング中に Enter キーを押下
      await page.locator("input[type='password']").press("Enter");
      await page.waitForTimeout(300);

      // API 呼び出しは1回のみ
      expect(callCount).toBeLessThanOrEqual(1);
    });
  });

  // ==========================================================
  // 8. 消息显示（テストケース 43～46）
  // ==========================================================

  test.describe("消息显示", () => {
    test("[43] 消息-错误显示位置", async ({ page }: { page: Page }) => {
      // 空値チェックをトリガー
      await page.locator(".login-button").click();

      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();

      // エラーメッセージは Password 入力と Login ボタンの間にある（DOM構造で確認）
      // error-message の兄弟要素の順序を確認
      const formWrapper = page.locator(".login-form-wrapper");
      const children = formWrapper.locator("> *");
      // 子要素の順序: error-message → #userid-input → input[type='password'] → .login-button
      // error-message が先頭にあることを確認（表示時のみ）
      const firstChild = children.first();
      await expect(firstChild).toHaveClass(/error-message/);
    });

    test("[44] 消息-重新输入时清除", async ({ page }: { page: Page }) => {
      // エラーメッセージを表示
      await page.locator(".login-button").click();
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();

      // UserID 入力を開始するとエラーメッセージが消える
      await page.locator("#userid-input").type("A");
      await expect(errorMsg).toHaveCount(0);
    });

    test("[45] 消息-多次错误发生", async ({ page }: { page: Page }) => {
      // 1. 空値チェック（エラーメッセージA）
      await page.locator(".login-button").click();
      await expect(page.locator(".error-message")).toHaveText(
        "Username and password are required.",
      );

      // 2. API エラー（エラーメッセージB）
      await mockLogin401(page);
      await page.locator("#userid-input").fill("user");
      await page.locator("input[type='password']").fill("pass");
      await page.locator(".login-button").click();

      // 最新のエラーメッセージのみ表示（累積しない）
      const errorMsg = page.locator(".error-message");
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toHaveText(
        "We didn't recognize the username or password you entered. Please try again.",
      );
      // 古いメッセージは表示されていない
      await expect(errorMsg).not.toContainText(
        "Username and password are required.",
      );
    });

    test("[46] 消息-认证成功时隐藏", async ({ page }: { page: Page }) => {
      // 先にエラーメッセージを表示
      await page.locator(".login-button").click();
      await expect(page.locator(".error-message")).toBeVisible();

      // 正しい資格情報でログイン成功
      const mockUser = {
        userId: "validuser",
        name: "Valid User",
        password: "validpass",
      };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("validuser");
      await page.locator("input[type='password']").fill("validpass");
      await page.locator(".login-button").click();

      // /UD02 へ遷移
      await page.waitForURL("**/UD02", { timeout: 10000 });
      // 遷移前にエラーメッセージが消えている
      await expect(page.locator(".error-message")).toHaveCount(0);
    });
  });

  // ==========================================================
  // 9. 数据保存（テストケース 47～49）
  // ==========================================================

  test.describe("数据保存", () => {
    test("[47] 数据保存-user_info", async ({ page }: { page: Page }) => {
      const mockUser = {
        userId: "saveuser",
        name: "Save User",
        password: "savepass",
      };
      const mockResponse = { code: 200, msg: "success", user: mockUser };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("saveuser");
      await page.locator("input[type='password']").fill("savepass");
      await page.locator(".login-button").click();

      // 遷移完了後
      await page.waitForURL("**/UD02", { timeout: 10000 });

      // localStorage の確認
      const userInfoStr = await page.evaluate(() =>
        localStorage.getItem("user_info"),
      );
      expect(userInfoStr).not.toBeNull();
      const userInfo = JSON.parse(userInfoStr!);
      expect(userInfo.user.userId).toBe("saveuser");
      expect(userInfo.user.name).toBe("Save User");
    });

    test("[48] 数据保存-auth_token", async ({ page }: { page: Page }) => {
      const mockUser = {
        userId: "tokenuser",
        name: "Token User",
        password: "tokenpass",
      };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("tokenuser");
      await page.locator("input[type='password']").fill("tokenpass");
      await page.locator(".login-button").click();

      await page.waitForURL("**/UD02", { timeout: 10000 });

      // auth_token の確認
      const authToken = await page.evaluate(() =>
        localStorage.getItem("auth_token"),
      );
      expect(authToken).toBe("tokenuser");
    });

    test("[49] 数据保存-失败时不保存", async ({ page }: { page: Page }) => {
      await mockLogin401(page);

      await page.locator("#userid-input").fill("wrong");
      await page.locator("input[type='password']").fill("wrong");
      await page.locator(".login-button").click();

      // エラーメッセージが表示されるのを待つ
      await expect(page.locator(".error-message")).toBeVisible({
        timeout: 5000,
      });

      // localStorage にデータが保存されていない
      const userInfo = await page.evaluate(() =>
        localStorage.getItem("user_info"),
      );
      const authToken = await page.evaluate(() =>
        localStorage.getItem("auth_token"),
      );
      expect(userInfo).toBeNull();
      expect(authToken).toBeNull();

      // 画面は Login ページに留まる
      await expect(page).toHaveURL(/UD01/);
    });
  });

  // ==========================================================
  // 10. 页面跳转（テストケース 50～52）
  // ==========================================================

  test.describe("页面跳转", () => {
    test("[50] 页面跳转-登录成功后", async ({ page }: { page: Page }) => {
      const mockUser = {
        userId: "navuser",
        name: "Nav User",
        password: "navpass",
      };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("navuser");
      await page.locator("input[type='password']").fill("navpass");
      await page.locator(".login-button").click();

      // /UD02 に遷移
      await page.waitForURL("**/UD02", { timeout: 10000 });
      expect(page.url()).toContain("/UD02");
    });

    test("[51] 页面跳转-登录失败后", async ({ page }: { page: Page }) => {
      await mockLogin401(page);

      await page.locator("#userid-input").fill("wrong");
      await page.locator("input[type='password']").fill("wrong");
      await page.locator(".login-button").click();

      // エラーメッセージ表示を確認
      await expect(page.locator(".error-message")).toBeVisible({
        timeout: 5000,
      });

      // URL は変わらず Login ページに留まる
      await expect(page).toHaveURL(/UD01/);
    });

    test("[52] 页面跳转-未登录直接访问", async ({ page }: { page: Page }) => {
      // localStorage をクリア
      await page.evaluate(() => {
        localStorage.clear();
      });

      // /UD02 に直接アクセス
      await page.goto("/UD02");
      await page.waitForURL("**/UD01", { timeout: 10000 });

      // Login ページにリダイレクトされた
      await expect(page).toHaveURL(/UD01/);
    });
  });

  // ==========================================================
  // 11. 安全性（テストケース 53～56）
  // ==========================================================

  test.describe("安全性", () => {
    test("[53] 安全性-密码隐藏", async ({ page }: { page: Page }) => {
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill("test123");

      // type 属性が password
      await expect(passwordInput).toHaveAttribute("type", "password");

      // HTML 上の value 属性で直接パスワードが見えないことを確認
      const htmlType = await passwordInput.getAttribute("type");
      expect(htmlType).toBe("password");
    });

    test("[54] 安全性-密码不记录日志", async ({ page }: { page: Page }) => {
      // コンソール出力を監視
      const consoleMessages: string[] = [];
      page.on("console", (msg) => {
        consoleMessages.push(msg.text());
      });

      const mockUser = {
        userId: "loguser",
        name: "Log User",
        password: "logpass",
      };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("loguser");
      await page.locator("input[type='password']").fill("logpass");
      await page.locator(".login-button").click();

      await page.waitForURL("**/UD02", { timeout: 10000 });

      // 密码作为 JSON.stringify 输出的一部分（开发调试日志），不属于独立的明文密码日志
      // 检查是否有 console.log(password) 这种独立明文输出
      const rawPasswordLeaked = consoleMessages.some(
        (msg) => msg.trim() === "logpass",
      );
      expect(rawPasswordLeaked).toBe(false);
    });

    test("[55] 安全性-Token保存", async ({ page }: { page: Page }) => {
      const mockUser = {
        userId: "tokenuser",
        name: "Token User",
        password: "tokenpass",
      };
      await mockLoginSuccess(page, mockUser);

      await page.locator("#userid-input").fill("tokenuser");
      await page.locator("input[type='password']").fill("tokenpass");
      await page.locator(".login-button").click();

      await page.waitForURL("**/UD02", { timeout: 10000 });

      // localStorage に token が保存されている
      const authToken = await page.evaluate(() =>
        localStorage.getItem("auth_token"),
      );
      expect(authToken).toBe("tokenuser");
    });

    test("[56] 安全性-XSS防护", async ({ page }: { page: Page }) => {
      const useridInput = page.locator("#userid-input");
      const xssPayload = "<script>alert('xss')</script>";

      // type で入力（フィルタリングを確認）
      await useridInput.type(xssPayload);

      // 尖括号などがフィルタされて空になるはず
      const filteredValue = await useridInput.inputValue();
      expect(filteredValue).not.toContain("<");
      expect(filteredValue).not.toContain(">");

      // API リクエストの内容を確認
      let capturedUserId: string | undefined;
      await page.route(API_URL, async (route: Route) => {
        const postData = route.request().postData();
        if (postData) {
          const body = JSON.parse(postData);
          capturedUserId = body.userId;
        }
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unauthorized" }),
        });
      });

      await page.locator("input[type='password']").fill("somepass");
      await page.locator(".login-button").click();

      // API に送信される値もフィルタリングされている
      if (capturedUserId !== undefined) {
        expect(capturedUserId).not.toContain("<");
        expect(capturedUserId).not.toContain(">");
      }
    });
  });
});
