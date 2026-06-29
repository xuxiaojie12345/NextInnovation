import { test, expect, Page } from '@playwright/test';

// 截图计数器
let screenshotCount = 0;

// 截图保存目录（相对于项目根目录）
const screenshotDir = './Image';

/**
 * 截图工具函数
 * @param page - Playwright Page 对象
 * @param description - 截图描述（用于日志）
 * @returns 截图文件路径
 */
async function takeScreenshot(page: Page, description: string): Promise<string> {
  screenshotCount++;
  const screenshotName = `Login${String(screenshotCount).padStart(2, '0')}.jpeg`;
  const screenshotPath = `${screenshotDir}/${screenshotName}`;
  
  await page.screenshot({ 
    path: screenshotPath, 
    type: 'jpeg', 
    quality: 90,
    fullPage: false 
  });
  
  console.log(`截图 ${screenshotCount}: ${description} -> ${screenshotName}`);
  return screenshotPath;
}

test.describe('Login 页面自动化测试', () => {
  test.beforeEach(async ({ page }) => {
    // 重置截图计数器
    screenshotCount = 0;
    
    // 访问登录页面
    await page.goto('/');
    await takeScreenshot(page, '打开登录页面');
  });

  test('TC01 - 验证登录页面初始状态', async ({ page }) => {
    // 步骤1: 验证页面标题
    await expect(page).toHaveTitle(/React App/);
    await takeScreenshot(page, 'TC01-步骤1: 验证页面标题');

    // 步骤2: 验证左侧标题显示
    const mainTitle = page.locator('h1').filter({ hasText: 'EDB Engineering Database' });
    await expect(mainTitle).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤2: 验证左侧主标题显示');

    // 步骤3: 验证副标题显示
    const subTitle = page.locator('h3').filter({ hasText: 'Use Outlook id and password' });
    await expect(subTitle).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤3: 验证副标题显示');

    // 步骤4: 验证支持信息文本显示
    const supportText = page.locator('h3').filter({ hasText: 'Support' });
    await expect(supportText).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤4: 验证支持信息文本显示');

    // 步骤5: 验证 UserID 输入框存在
    const userIDInput = page.locator('#userID');
    await expect(userIDInput).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤5: 验证UserID输入框存在');

    // 步骤6: 验证 Password 输入框存在
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤6: 验证Password输入框存在');

    // 步骤7: 验证 Login 按钮存在
    const loginButton = page.locator('button.login-button');
    await expect(loginButton).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤7: 验证Login按钮存在');

    // 步骤8: 验证账户锁定提示区域存在
    const hintSection = page.locator('.login-hint');
    await expect(hintSection).toBeVisible();
    await takeScreenshot(page, 'TC01-步骤8: 验证账户锁定提示区域存在');
  });

  test('TC02 - 验证空值提交显示警告消息', async ({ page }) => {
    // 步骤1: 点击 Login 按钮（不输入任何内容）
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC02-步骤1: 点击Login按钮（空值）');

    // 步骤2: 验证警告消息显示
    const warningMessage = page.locator('.message.warning');
    await expect(warningMessage).toBeVisible();
    await takeScreenshot(page, 'TC02-步骤2: 验证警告消息显示');

    // 步骤3: 验证警告消息内容
    await expect(warningMessage).toContainText('Username and password are required.');
    await takeScreenshot(page, 'TC02-步骤3: 验证警告消息内容');
  });

  test('TC03 - 验证仅输入 UserID 的校验', async ({ page }) => {
    // 步骤1: 在 UserID 输入框中输入有效值
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('testuser');
    await takeScreenshot(page, 'TC03-步骤1: 输入UserID');

    // 步骤2: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC03-步骤2: 点击Login按钮');

    // 步骤3: 验证警告消息显示
    const warningMessage = page.locator('.message.warning');
    await expect(warningMessage).toBeVisible();
    await takeScreenshot(page, 'TC03-步骤3: 验证警告消息显示');
  });

  test('TC04 - 验证仅输入 Password 的校验', async ({ page }) => {
    // 步骤1: 在 Password 输入框中输入有效值
    const passwordInput = page.locator('#password');
    await passwordInput.fill('password123');
    await takeScreenshot(page, 'TC04-步骤1: 输入Password');

    // 步骤2: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC04-步骤2: 点击Login按钮');

    // 步骤3: 验证警告消息显示
    const warningMessage = page.locator('.message.warning');
    await expect(warningMessage).toBeVisible();
    await takeScreenshot(page, 'TC04-步骤3: 验证警告消息显示');
  });

  test('TC05 - 验证 UserID 超过最大长度限制', async ({ page }) => {
    // 步骤1: 输入超过10个字符的 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('verylonguserid123');
    await takeScreenshot(page, 'TC05-步骤1: 输入超长UserID');

    // 步骤2: 验证输入框 maxLength 属性
    await expect(userIDInput).toHaveAttribute('maxlength', '10');
    await takeScreenshot(page, 'TC05-步骤2: 验证maxLength属性');

    // 步骤3: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC05-步骤3: 点击Login按钮');

    // 步骤4: 验证错误消息显示（Zod 校验）
    const errorMessage = page.locator('.field-error');
    await expect(errorMessage).toBeVisible();
    await takeScreenshot(page, 'TC05-步骤4: 验证错误消息显示');
  });

  test('TC06 - 验证 Password 超过最大长度限制', async ({ page }) => {
    // 步骤1: 输入有效的 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('testuser');
    await takeScreenshot(page, 'TC06-步骤1: 输入UserID');

    // 步骤2: 输入超过32个字符的 Password
    const passwordInput = page.locator('#password');
    await passwordInput.fill('a'.repeat(33));
    await takeScreenshot(page, 'TC06-步骤2: 输入超长Password');

    // 步骤3: 验证输入框 maxLength 属性
    await expect(passwordInput).toHaveAttribute('maxlength', '32');
    await takeScreenshot(page, 'TC06-步骤3: 验证maxLength属性');

    // 步骤4: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC06-步骤4: 点击Login按钮');

    // 步骤5: 验证错误消息显示（Zod 校验）
    const errorMessage = page.locator('.field-error');
    await expect(errorMessage).toBeVisible();
    await takeScreenshot(page, 'TC06-步骤5: 验证错误消息显示');
  });

  test('TC07 - 验证无效 UserID 格式校验', async ({ page }) => {
    // 步骤1: 输入包含特殊字符的 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('test@user#123');
    await takeScreenshot(page, 'TC07-步骤1: 输入含特殊字符的UserID');

    // 步骤2: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC07-步骤2: 点击Login按钮');

    // 步骤3: 验证错误消息显示
    const errorMessage = page.locator('.field-error');
    await expect(errorMessage).toBeVisible();
    await takeScreenshot(page, 'TC07-步骤3: 验证错误消息显示');

    // 步骤4: 验证错误消息内容
    await expect(errorMessage).toContainText('alphanumeric');
    await takeScreenshot(page, 'TC07-步骤4: 验证错误消息内容');
  });

  test('TC08 - 验证认证成功跳转', async ({ page }) => {
    // 注意：此测试需要后端服务运行且数据库中有测试用户
    // 假设数据库中已有用户: userID=testuser, password=testpass123

    // 步骤1: 输入有效的 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('testuser');
    await takeScreenshot(page, 'TC08-步骤1: 输入有效UserID');

    // 步骤2: 输入有效的 Password
    const passwordInput = page.locator('#password');
    await passwordInput.fill('testpass123');
    await takeScreenshot(page, 'TC08-步骤2: 输入有效Password');

    // 步骤3: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC08-步骤3: 点击Login按钮');

    // 步骤4: 验证按钮显示加载状态
    await expect(loginButton).toContainText('Logging in...');
    await takeScreenshot(page, 'TC08-步骤4: 验证加载状态');

    // 步骤5: 等待跳转到 Menu 页面
    await page.waitForURL('**/Menu', { timeout: 10000 });
    await takeScreenshot(page, 'TC08-步骤5: 验证跳转到Menu页面');

    // 步骤6: 验证 Menu 页面加载成功
    await expect(page).toHaveURL(/.*Menu/);
    await takeScreenshot(page, 'TC08-步骤6: 验证Menu页面URL');
  });

  test('TC09 - 验证认证失败显示错误消息', async ({ page }) => {
    // 步骤1: 输入无效的 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('invaliduser');
    await takeScreenshot(page, 'TC09-步骤1: 输入无效UserID');

    // 步骤2: 输入无效的 Password
    const passwordInput = page.locator('#password');
    await passwordInput.fill('wrongpassword');
    await takeScreenshot(page, 'TC09-步骤2: 输入无效Password');

    // 步骤3: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC09-步骤3: 点击Login按钮');

    // 步骤4: 验证错误消息显示
    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await takeScreenshot(page, 'TC09-步骤4: 验证错误消息显示');

    // 步骤5: 验证错误消息内容
    await expect(errorMessage).toContainText("We didn't recognize the username or password");
    await takeScreenshot(page, 'TC09-步骤5: 验证错误消息内容');
  });

  test('TC10 - 验证输入框禁用状态', async ({ page }) => {
    // 步骤1: 输入 UserID 和 Password
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('testuser');
    await takeScreenshot(page, 'TC10-步骤1: 输入UserID');

    const passwordInput = page.locator('#password');
    await passwordInput.fill('testpass123');
    await takeScreenshot(page, 'TC10-步骤2: 输入Password');

    // 步骤2: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC10-步骤3: 点击Login按钮');

    // 步骤3: 验证输入框被禁用
    await expect(userIDInput).toBeDisabled();
    await takeScreenshot(page, 'TC10-步骤4: 验证UserID输入框禁用');

    await expect(passwordInput).toBeDisabled();
    await takeScreenshot(page, 'TC10-步骤5: 验证Password输入框禁用');

    // 步骤4: 验证按钮被禁用
    await expect(loginButton).toBeDisabled();
    await takeScreenshot(page, 'TC10-步骤6: 验证Login按钮禁用');
  });

  test('TC11 - 验证 localStorage 存储用户信息', async ({ page }) => {
    // 步骤1: 输入有效的 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('testuser');
    await takeScreenshot(page, 'TC11-步骤1: 输入有效UserID');

    // 步骤2: 输入有效的 Password
    const passwordInput = page.locator('#password');
    await passwordInput.fill('testpass123');
    await takeScreenshot(page, 'TC11-步骤2: 输入有效Password');

    // 步骤3: 点击 Login 按钮
    const loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC11-步骤3: 点击Login按钮');

    // 步骤4: 等待跳转
    await page.waitForURL('**/Menu', { timeout: 10000 });
    await takeScreenshot(page, 'TC11-步骤4: 等待跳转');

    // 步骤5: 验证 localStorage 中存储了 userID
    const storedUserID = await page.evaluate(() => localStorage.getItem('userID'));
    expect(storedUserID).toBe('testuser');
    await takeScreenshot(page, 'TC11-步骤5: 验证localStorage存储userID');

    // 步骤6: 验证 localStorage 中存储了 token
    const storedToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(storedToken).toBeDefined();
    await takeScreenshot(page, 'TC11-步骤6: 验证localStorage存储token');
  });

  test('TC12 - 验证背景图片显示', async ({ page }) => {
    // 步骤1: 验证登录容器有背景图片
    const loginContainer = page.locator('.login-container');
    await expect(loginContainer).toBeVisible();
    await takeScreenshot(page, 'TC12-步骤1: 验证登录容器可见');

    // 步骤2: 验证背景图片样式应用
    const backgroundImage = await loginContainer.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(backgroundImage).toContain('url');
    await takeScreenshot(page, 'TC12-步骤2: 验证背景图片样式');
  });

  test('TC13 - 验证响应式布局', async ({ page }) => {
    // 步骤1: 设置小屏幕尺寸（移动端）
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, 'TC13-步骤1: 设置移动端视口');

    // 步骤2: 验证页面元素仍然可见
    const mainTitle = page.locator('h1').filter({ hasText: 'EDB Engineering Database' });
    await expect(mainTitle).toBeVisible();
    await takeScreenshot(page, 'TC13-步骤2: 验证移动端标题可见');

    const userIDInput = page.locator('#userID');
    await expect(userIDInput).toBeVisible();
    await takeScreenshot(page, 'TC13-步骤3: 验证移动端输入框可见');

    // 步骤3: 恢复桌面端尺寸
    await page.setViewportSize({ width: 1920, height: 1080 });
    await takeScreenshot(page, 'TC13-步骤4: 恢复桌面端视口');

    // 步骤4: 验证桌面端布局正常
    await expect(mainTitle).toBeVisible();
    await takeScreenshot(page, 'TC13-步骤5: 验证桌面端布局正常');
  });

  test('TC14 - 验证账户锁定提示信息内容', async ({ page }) => {
    // 步骤1: 验证第一条提示信息
    const firstHint = page.locator('.login-hint p').nth(0);
    await expect(firstHint).toContainText('Your account is locked');
    await takeScreenshot(page, 'TC14-步骤1: 验证第一条提示信息');

    // 步骤2: 验证第二条提示信息
    const secondHint = page.locator('.login-hint p').nth(1);
    await expect(secondHint).toContainText('alternative login link');
    await takeScreenshot(page, 'TC14-步骤2: 验证第二条提示信息');

    // 步骤3: 验证第三条提示信息
    const thirdHint = page.locator('.login-hint p').nth(2);
    await expect(thirdHint).toContainText('root cause');
    await takeScreenshot(page, 'TC14-步骤3: 验证第三条提示信息');
  });

  test('TC15 - 验证多次登录尝试', async ({ page }) => {
    // 第一次尝试 - 空值
    // 步骤1: 直接点击 Login 按钮
    let loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC15-步骤1: 第一次尝试-空值提交');

    // 步骤2: 验证警告消息
    await expect(page.locator('.message.warning')).toBeVisible();
    await takeScreenshot(page, 'TC15-步骤2: 验证第一次警告消息');

    // 第二次尝试 - 仅 UserID
    // 步骤3: 输入 UserID
    const userIDInput = page.locator('#userID');
    await userIDInput.fill('testuser');
    await takeScreenshot(page, 'TC15-步骤3: 第二次尝试-输入UserID');

    // 步骤4: 点击 Login 按钮
    loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC15-步骤4: 第二次尝试-点击Login');

    // 步骤5: 验证警告消息
    await expect(page.locator('.message.warning')).toBeVisible();
    await takeScreenshot(page, 'TC15-步骤5: 验证第二次警告消息');

    // 第三次尝试 - 完整输入但认证失败
    // 步骤6: 输入 Password
    const passwordInput = page.locator('#password');
    await passwordInput.fill('wrongpass');
    await takeScreenshot(page, 'TC15-步骤6: 第三次尝试-输入Password');

    // 步骤7: 点击 Login 按钮
    loginButton = page.locator('button.login-button');
    await loginButton.click();
    await takeScreenshot(page, 'TC15-步骤7: 第三次尝试-点击Login');

    // 步骤8: 验证错误消息
    await expect(page.locator('.message.error')).toBeVisible();
    await takeScreenshot(page, 'TC15-步骤8: 验证错误消息');
  });
});
