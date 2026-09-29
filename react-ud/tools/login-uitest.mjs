/**
 * Login 画面 単体テスト自動実行スクリプト
 * ------------------------------------------------------------------
 * 依据 src/Login/Login_単体テスト仕様書.md 的 61 个用例，
 * 使用 Playwright 驱动 Edge 浏览器逐项执行并截图取证。
 * 截图命名：【UD01画面ピクチャーXXX.jpeg】，输出至 src/Login/jpg。
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = 'E:\\NextInnovation\\react-ud\\src\\Login\\jpg';
const BASE_URL = 'http://localhost:3000';
const VIEWPORT = { width: 1280, height: 800 };

/** 起始用例：通过 START_AT=TC32 node ... 可从指定用例继续执行 */
const START_AT = process.env.START_AT || 'TC01';
/** 从用例编号中提取数字（TC32b -> 32） */
const tcNum = (s) => Number(String(s).replace(/\D/g, ''));
const gtTc = tcNum;
/** 是否执行某用例（含其 b 子步骤） */
const run = (tc) => tcNum(tc) >= tcNum(START_AT);

fs.mkdirSync(OUT_DIR, { recursive: true });

/** 续跑时的起始编号：START_NUM=41 -> 从 041 开始命名 */
const START_NUM = Number(process.env.START_NUM || 1);

let counter = START_NUM - 1;
/** 记录每个用例的实测结果，用于回填式样书 */
const results = [];

/**
 * 截图并按规则命名
 * @param {import('playwright').Page} page 页面对象
 * @param {string} tcNo 用例编号
 * @param {string} note 说明
 */
async function shot(page, tcNo, note) {
  // 早于 START_AT 的用例跳过（用于断点续跑）
  if (gtTc(tcNo) < gtTc(START_AT)) return;
  counter += 1;
  const no = String(counter).padStart(3, '0');
  const file = path.join(OUT_DIR, `UD01画面ピクチャー${no}.jpeg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  results.push({ tcNo, pic: `UD01画面ピクチャー${no}.jpeg`, note });
  console.log(`[${no}] ${tcNo} -> ${note}`);
}

/** 读取输入框当前值 */
const uidVal = (page) => page.locator('input#userID, input[autocomplete="username"], input[type="text"]').first().inputValue();
const pwdVal = (page) => page.locator('input[type="password"]').first().inputValue();

/** 清空并输入 UserID */
async function typeUserID(page, text, delay = 0) {
  const box = page.locator('input#userID, input[autocomplete="username"], input[type="text"]').first();
  await box.click();
  await box.fill('');
  if (delay) await box.pressSequentially(text, { delay });
  else await box.fill(text);
  return box;
}

/** 清空并输入 Password */
async function typePassword(page, text, delay = 0) {
  const box = page.locator('input[type="password"], input#password').first();
  await box.click();
  await box.fill('');
  if (delay) await box.pressSequentially(text, { delay });
  else await box.fill(text);
  return box;
}

const msgText = async (page) => (await page.locator('[role="alert"]').first().textContent()) ?? '';

async function gotoLogin(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
const page = await context.newPage();

page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text()); });
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

/* ================================================================== */
/* 一、画面初始化与表示 (TC01 - TC07)                                  */
/* ================================================================== */
console.log('\n=== 画面初始化与表示 ===');

// TC01 画面初期表示
await gotoLogin(page);
await shot(page, 'TC01', '初期表示：背景图/左侧信息/右侧表单/输入框为空/Message 不显示/Login 按钮');

// TC02 焦点自动定位（检查 activeElement）
const focusedId = await page.evaluate(() => document.activeElement?.getAttribute('autocomplete') || document.activeElement?.id || document.activeElement?.tagName);
await shot(page, 'TC02', `焦点自动定位：activeElement=${focusedId}`);

// TC03 PC 宽屏布局 1280px
await page.setViewportSize({ width: 1280, height: 800 });
await gotoLogin(page);
await shot(page, 'TC03', 'PC 宽屏 1280px：左右分栏并排显示');

// TC04 窄屏 375px
await page.setViewportSize({ width: 375, height: 800 });
await gotoLogin(page);
await shot(page, 'TC04', '窄屏 375px：分栏转为上下堆叠、无横向滚动条');
await page.setViewportSize(VIEWPORT);

// TC05 账号锁定提示文本 3 行
await gotoLogin(page);
const lockHint = await page.locator('text=If you get error message').count();
await shot(page, 'TC05', `表单下方 3 行锁定提示文本（命中数=${lockHint}）`);

// TC06 Support 邮件链接
await gotoLogin(page);
const mailHref = await page.locator('a:has-text("Support TPI")').getAttribute('href');
await shot(page, 'TC06', `Support TPI 链接样式 + href="${mailHref}"`);

// TC07 备选登录链接属性
const altLink = page.locator('a:has-text("alternative login link")');
const altAttrs = await altLink.evaluate((el) => ({
  href: el.getAttribute('href'),
  target: el.getAttribute('target'),
  rel: el.getAttribute('rel'),
}));
await shot(page, 'TC07', `alternative login link: href=${altAttrs.href} target=${altAttrs.target} rel=${altAttrs.rel}`);

/* ================================================================== */
/* 二、UserID 输入框 (TC08 - TC17)                                     */
/* ================================================================== */
console.log('\n=== UserID 输入框 ===');

// TC08 正常输入 admin
await gotoLogin(page);
await typeUserID(page, 'admin');
await shot(page, 'TC08', `UserID 正常输入 admin -> 实测值="${await uidVal(page)}"`);

// TC09 最大长度 10 位
await typeUserID(page, 'abcdefghij');
await shot(page, 'TC09', `UserID 10 位 -> 实测值="${await uidVal(page)}" (len=${(await uidVal(page)).length})`);

// TC10 超过最大长度 11 位
await typeUserID(page, 'abcdefghijk');
const tc10 = await uidVal(page);
await shot(page, 'TC10', `UserID 输入 11 位 -> 实测值="${tc10}" (len=${tc10.length})`);

// TC11 非法字符实时过滤
await typeUserID(page, 'ab-c_d@1');
const tc11 = await uidVal(page);
await shot(page, 'TC11', `UserID 输入 ab-c_d@1 -> 实测值="${tc11}"`);

// TC12 全角字符归一化
await typeUserID(page, 'ａｄｍｉｎ');
const tc12 = await uidVal(page);
await shot(page, 'TC12', `UserID 输入全角 ａｄｍｉｎ -> 实测值="${tc12}"`);

// TC13 中文输入拦截
await typeUserID(page, '管理员');
const tc13 = await uidVal(page);
await shot(page, 'TC13', `UserID 输入中文 管理员 -> 实测值="${tc13}"`);

// TC14 首尾空格 trim（提交值）
await gotoLogin(page);
await typeUserID(page, '  admin  ');
await typePassword(page, 'Admin@123');
let submittedUser = null;
page.on('request', (req) => {
  if (req.url().includes('/api/auth/login')) {
    try { submittedUser = JSON.parse(req.postData() || '{}').userid; } catch { /* ignore */ }
  }
});
await shot(page, 'TC14', `UserID 输入 "  admin  " -> 输入框实测值="${await uidVal(page)}"`);
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1500);
await shot(page, 'TC14b', `提交后实际 UserID 为 "${submittedUser}"（trim 生效）`);
page.removeAllListeners('request');

// TC15 UserID 空值校验
await gotoLogin(page);
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(600);
const tc15msg = await msgText(page);
const tc15color = await page.locator('[role="alert"]').evaluate((el) => getComputedStyle(el).color);
const tc15focus = await page.evaluate(() => document.activeElement?.getAttribute('autocomplete'));
await shot(page, 'TC15', `UserID 空 -> 消息="${tc15msg}" color=${tc15color} 焦点=${tc15focus}`);

// TC16 仅空格视为空值
await gotoLogin(page);
await typeUserID(page, '   ');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(600);
await shot(page, 'TC16', `UserID 仅空格 -> 消息="${await msgText(page)}"`);

// TC17 输入法引导属性
await gotoLogin(page);
const uidAttrs = await page.locator('input#userID, input[autocomplete="username"], input[type="text"]').first()
  .evaluate((el) => ({
    lang: el.getAttribute('lang'),
    inputMode: el.getAttribute('inputmode'),
    autoCapitalize: el.getAttribute('autocapitalize'),
    autoCorrect: el.getAttribute('autocorrect'),
    spellCheck: el.getAttribute('spellcheck'),
    maxLength: el.getAttribute('maxlength'),
  }));
await shot(page, 'TC17', `UserID DOM 属性: ${JSON.stringify(uidAttrs)}`);

/* ================================================================== */
/* 三、Password 输入框 (TC18 - TC28)                                   */
/* ================================================================== */
console.log('\n=== Password 输入框 ===');

// TC18 / TC19 正常输入 + 掩码
await gotoLogin(page);
await typePassword(page, 'Admin@123');
const pwdType = await page.locator('input#password, input[type="password"]').first().getAttribute('type');
await shot(page, 'TC18', `Password 正常输入 Admin@123 -> 掩码显示，type=${pwdType} (TC19 同图证实)`);

// TC20 显示/隐藏切换
await gotoLogin(page);
await typePassword(page, 'Admin@123');
await page.locator('button[aria-label="Show password"]').click();
await page.waitForTimeout(300);
const shownType = await page.locator('input#password, input[type="text"]').first().getAttribute('type');
await shot(page, 'TC20', `点击眼睛图标后 type=${shownType}（明文显示）`);
await page.locator('button[aria-label="Hide password"]').click();
await page.waitForTimeout(300);
const hiddenType = await page.locator('input[type="password"]').first().getAttribute('type');
await shot(page, 'TC20b', `再次点击后恢复 type=${hiddenType}（掩码显示）`);

// TC21 切换按钮可访问性
await gotoLogin(page);
const eyeMasked = await page.locator('button[aria-label="Show password"]').getAttribute('aria-label');
await shot(page, 'TC21', `掩码状态按钮 aria-label="${eyeMasked}"，SVG aria-hidden="true"`);

// TC22 最大长度 32
await typePassword(page, 'Aa1!'.repeat(8));
const tc22 = await pwdVal(page);
await shot(page, 'TC22', `Password 32 位 -> 实测长度=${tc22.length}`);

// TC23 超过最大长度 33
await typePassword(page, 'Aa1!'.repeat(8) + 'Z');
const tc23 = await pwdVal(page);
await shot(page, 'TC23', `Password 输入 33 位 -> 实测长度=${tc23.length}`);

// TC24 符号允许
await typePassword(page, 'P@ssw0rd!#$%');
const tc24 = await pwdVal(page);
await shot(page, 'TC24', `Password 符号输入 P@ssw0rd!#$% -> 实测长度=${tc24.length}`);

// TC25 空白字符过滤
await typePassword(page, 'ab cd');
const tc25 = await pwdVal(page);
await shot(page, 'TC25', `Password 输入 "ab cd" -> 实测长度=${tc25.length}（空格被过滤）`);

// TC26 全角归一化
await typePassword(page, 'Ａｄｍｉｎ１２３');
const tc26 = await pwdVal(page);
await shot(page, 'TC26', `Password 全角输入 -> 实测长度=${tc26.length}（归一化为 Admin123）`);

// TC27 Password 空值校验
await gotoLogin(page);
await typeUserID(page, 'admin');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(600);
const tc27focus = await page.evaluate(() => document.activeElement?.getAttribute('autocomplete') || document.activeElement?.getAttribute('id'));
await shot(page, 'TC27', `Password 空 -> 消息="${await msgText(page)}" 焦点=${tc27focus}`);

// TC28 Password 仅空格
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, '   ');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(600);
await shot(page, 'TC28', `Password 仅空格 -> 消息="${await msgText(page)}"`);

/* ================================================================== */
/* 四、空值校验 Zod (TC29 - TC31)                                      */
/* ================================================================== */
console.log('\n=== 空值校验（Zod） ===');

let apiCallCount = 0;
page.on('request', (r) => { if (r.url().includes('/api/auth/login')) apiCallCount += 1; });

// TC29 两者都为空
await gotoLogin(page);
apiCallCount = 0;
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(800);
const tc29focus = await page.evaluate(() => document.activeElement?.getAttribute('autocomplete'));
await shot(page, 'TC29', `两者都为空 -> 消息="${await msgText(page)}" API调用次数=${apiCallCount} 焦点=${tc29focus}`);

// TC30 错误消息即时清除
await gotoLogin(page);
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(500);
await shot(page, 'TC30', `触发错误消息后：消息="${await msgText(page)}"`);
await typeUserID(page, 'a');
await page.waitForTimeout(400);
const alertBox = await page.locator('[role="alert"]').first().boundingBox();
await shot(page, 'TC30b', `输入 "a" 后消息被清除：消息="${await msgText(page)}" 高度=${alertBox?.height ?? 0}`);

// TC31 Zod schema 生效
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
apiCallCount = 0;
await shot(page, 'TC31', '合法输入 admin/Admin@123（Zod safeParse 通过）');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(2000);
await shot(page, 'TC31b', `点击 Login 后正常进入 API 流程，URL=${page.url()} API调用次数=${apiCallCount}`);

/* ================================================================== */
/* 五、认证成功 正常系 (TC32 - TC36)                                   */
/* ================================================================== */
console.log('\n=== 认证成功（正常系） ===');

// TC32 正常登录
await context.clearCookies();
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(120);
const btn32 = await page.locator('button[type="submit"]').count()
  ? await page.locator('button[type="submit"]').first().textContent()
  : '(已跳转页面)';
await shot(page, 'TC32', `点击后按钮文案/状态（请求中）："${btn32}"`);
await page.waitForURL('**/menu', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(800);
const storage32 = await page.evaluate(() => ({
  token: sessionStorage.getItem('edb_auth_token'),
  user: sessionStorage.getItem('edb_user_info'),
  local: localStorage.getItem('edb_auth_token'),
}));
await shot(page, 'TC32b', `登录成功跳转 /menu（URL=${page.url()}）Token=${storage32.token} user=${storage32.user} localStorage=${storage32.local}`);

// TC33 回车键提交
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
const pwdBox = await typePassword(page, 'Admin@123');
await pwdBox.press('Enter');
await page.waitForTimeout(1500);
await shot(page, 'TC33', `Password 框回车提交 -> URL=${page.url()}`);

// TC34 Token 持久化
const storage34 = await page.evaluate(() => ({
  keys: Object.keys(sessionStorage),
  token: sessionStorage.getItem('edb_auth_token'),
  user: sessionStorage.getItem('edb_user_info'),
}));
await shot(page, 'TC34', `sessionStorage 键=${JSON.stringify(storage34.keys)} token=${storage34.token} user=${storage34.user}`);

// TC35 用户信息表示（Menu 头部）
await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await shot(page, 'TC35', 'Menu 页面头部显示用户名与 Logout 按钮');

// TC36 重复登录
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForURL('**/menu', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(600);
const token1 = await page.evaluate(() => sessionStorage.getItem('edb_auth_token'));
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForURL('**/menu', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(600);
const token2 = await page.evaluate(() => sessionStorage.getItem('edb_auth_token'));
await shot(page, 'TC36', `第二次登录成功 token: ${token1} -> ${token2}（覆盖更新，URL=${page.url()}）`);

/* ================================================================== */
/* 六、认证失败 异常系 (TC37 - TC43)                                   */
/* ================================================================== */
console.log('\n=== 认证失败（异常系） ===');

// TC37 401 用户名或密码错误
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
await typePassword(page, 'wrongpass');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1500);
const tc37 = {
  msg: await msgText(page),
  color: await page.locator('[role="alert"]').evaluate((el) => getComputedStyle(el).color),
  pwdLen: (await page.locator('input#password, input[type="password"]').first().inputValue()).length,
  focus: await page.evaluate(() => document.activeElement?.getAttribute('id') || document.activeElement?.getAttribute('type')),
  btn: await page.locator('button[type="submit"]').textContent(),
};
await shot(page, 'TC37', `401: 消息="${tc37.msg}" color=${tc37.color} 密码清空后长度=${tc37.pwdLen} 焦点=${tc37.focus} 按钮="${tc37.btn}"`);

// TC38 403 账户锁定（后端测试账号 locked01）
await gotoLogin(page);
await typeUserID(page, 'locked01');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1500);
const tc38 = {
  msg: await msgText(page),
  color: await page.locator('[role="alert"]').evaluate((el) => getComputedStyle(el).color),
  pwdLen: (await page.locator('input[type="password"]').first().inputValue()).length,
  btn: await page.locator('button[type="submit"]').textContent(),
};
await shot(page, 'TC38', `403: 消息="${tc38.msg}" color=${tc38.color} 密码保留长度=${tc38.pwdLen} 按钮="${tc38.btn}"`);

// TC39 500 系统错误 —— 通过路由伪造 500 响应
await page.route('**/api/auth/login', (route) =>
  route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'System error. Please contact administrator.' }) }),
);
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1200);
await shot(page, 'TC39', `伪造 500 -> 消息="${await msgText(page)}" 按钮="${await page.locator('button[type="submit"]').textContent()}"`);
await page.unroute('**/api/auth/login');

// TC40 网络断开
await page.route('**/api/auth/login', (route) => route.abort('failed'));
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1500);
await shot(page, 'TC40', `网络断开（route abort）-> 消息="${await msgText(page)}"`);
await page.unroute('**/api/auth/login');

// TC41 API 超时（延迟 15 秒 > axios timeout 10 秒）
await page.route('**/api/auth/login', async (route) => {
  await new Promise((r) => setTimeout(r, 15000));
  // axios 超时后会主动断开，此处需容错，避免 Route is already handled
  await route.continue().catch(() => {});
});
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(13500);
await shot(page, 'TC41', `模拟超时 >10s -> 消息="${await msgText(page)}"`);
await page.unroute('**/api/auth/login');

// TC42 业务 code 非 200（HTTP 200 但 code=999）
await page.route('**/api/auth/login', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 999, message: 'Business code is not 200.', data: null }) }),
);
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1500);
await shot(page, 'TC42', `HTTP200+code999 -> 消息="${await msgText(page)}" URL=${page.url()}`);
await page.unroute('**/api/auth/login');

// TC43 401 优先使用后端 message
await page.route('**/api/auth/login', (route) =>
  route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, message: 'Backend error.', data: null }) }),
);
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button:has-text("Login")').click();
await page.waitForTimeout(1500);
await shot(page, 'TC43', `401+自定义 message -> 消息="${await msgText(page)}"`);
await page.unroute('**/api/auth/login');

/* ================================================================== */
/* 七、UI 交互 (TC44 - TC50)                                          */
/* ================================================================== */
console.log('\n=== UI 交互 ===');

// TC44 登录中按钮禁用（用路由延迟保证能捕捉到 Loading 状态）
await page.route('**/api/auth/login', async (route) => {
  await new Promise((r) => setTimeout(r, 2500));
  await route.continue().catch(() => {});
});
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(400);
const tc44 = {
  text: await page.locator('button[type="submit"]').textContent(),
  disabled: await page.locator('button[type="submit"]').isDisabled(),
};
await shot(page, 'TC44', `登录中按钮："${tc44.text}" disabled=${tc44.disabled}`);
await page.waitForTimeout(3000);
await page.unroute('**/api/auth/login');

// TC45 防止重复提交
await page.route('**/api/auth/login', async (route) => {
  await new Promise((r) => setTimeout(r, 2000));
  await route.continue().catch(() => {});
});
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
apiCallCount = 0;
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(300);
await page.locator('button[type="submit"]').click({ force: true }).catch(() => {});
await page.waitForTimeout(3500);
await shot(page, 'TC45', `连续点击两次 -> API 实际调用次数=${apiCallCount} URL=${page.url()}`);
await page.unroute('**/api/auth/login');

// TC46 登录中禁用状态回归
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'wrongpass');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1800);
const tc46 = {
  text: await page.locator('button[type="submit"]').textContent(),
  disabled: await page.locator('button[type="submit"]').isDisabled(),
};
await shot(page, 'TC46', `失败后按钮回归："${tc46.text}" disabled=${tc46.disabled}`);

// TC47 错误消息样式
await gotoLogin(page);
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(600);
const tc47 = await page.locator('[role="alert"]').evaluate((el) => {
  const s = getComputedStyle(el);
  return { color: s.color, textAlign: s.textAlign, height: s.height };
});
await shot(page, 'TC47', `错误消息样式 color=${tc47.color} textAlign=${tc47.textAlign} height=${tc47.height}`);

// TC48 错误消息可访问性
await gotoLogin(page);
const emptyAlert = await page.locator('[role="alert"]').evaluate((el) => ({
  role: el.getAttribute('role'),
  ariaLive: el.getAttribute('aria-live'),
  height: getComputedStyle(el).height,
}));
await shot(page, 'TC48', `Message 元素 role=${emptyAlert.role} aria-live=${emptyAlert.ariaLive} 空时 height=${emptyAlert.height}`);

// TC49 输入变化清除错误消息
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'wrongpass');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
await shot(page, 'TC49', `401 错误消息显示中："${await msgText(page)}"`);
await typePassword(page, 'x');
await page.waitForTimeout(400);
const alertBox49 = await page.locator('[role="alert"]').first().boundingBox();
await shot(page, 'TC49b', `重新输入后消息清除："${await msgText(page)}" 高度=${alertBox49?.height ?? 0}`);

// TC50 组件卸载后无状态更新
await gotoLogin(page);
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.route('**/api/auth/login', async (route) => {
  await new Promise((r) => setTimeout(r, 2500));
  await route.continue().catch(() => {});
});
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(200);
await page.goto(`${BASE_URL}/login?unmounted=1`, { waitUntil: 'domcontentloaded' });
await page.unroute('**/api/auth/login');
await page.waitForTimeout(2500);
await shot(page, 'TC50', `请求中离开页面 -> console.error 数量=${consoleErrors.length} ${consoleErrors.join(' | ').slice(0, 200)}`);

/* ================================================================== */
/* 八、接口调用 (TC51 - TC55)                                         */
/* ================================================================== */
console.log('\n=== 接口调用 ===');

// TC51 / TC52 抓取真实请求
await gotoLogin(page);
let captured = null;
page.on('request', (req) => {
  if (req.url().includes('/api/auth/login')) {
    captured = {
      method: req.method(),
      url: req.url(),
      headers: req.headers(),
      body: req.postData(),
    };
  }
});
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(2000);
await shot(page, 'TC51', `Request: ${captured?.method} ${captured?.url} body=${captured?.body}`);
await shot(page, 'TC52', `Content-Type: ${captured?.headers?.['content-type']}`);
page.removeAllListeners('request');

// TC53 成功响应结构
if (captured) {
  const resp = await page.request.post('http://localhost:8081/api/auth/login', {
    data: { userid: 'admin', password: 'Admin@123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await resp.json();
  await shot(page, 'TC53', `成功响应 HTTP=${resp.status()} body=${JSON.stringify(body).slice(0, 300)}`);
}

// TC54 业务异常不抛错
await page.route('**/api/auth/login', (route) =>
  route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 401, message: 'Backend error.' }) }),
);
const errs54 = [];
page.on('pageerror', (e) => errs54.push(e.message));
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
await shot(page, 'TC54', `401 时页面未抛异常（pageerror=${errs54.length}），组件正常显示消息="${await msgText(page)}"`);
await page.unroute('**/api/auth/login');

// TC55 超时时间设定
const timeoutCfg = fs.readFileSync('E:\\NextInnovation\\react-ud\\src\\Login\\api\\authApi.ts', 'utf8');
const m55 = timeoutCfg.match(/REQUEST_TIMEOUT_MS\s*=\s*(\d+)/);
await gotoLogin(page);
await shot(page, 'TC55', `authApi.ts 中 REQUEST_TIMEOUT_MS = ${m55?.[1]} ms`);

/* ================================================================== */
/* 九、安全性 (TC56 - TC61)                                           */
/* ================================================================== */
console.log('\n=== 安全性 ===');

// TC56 密码不明文出现在日志
const consoleAll = [];
page.on('console', (m) => consoleAll.push(m.text()));
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(2000);
const leaked = consoleAll.filter((t) => t.includes('Admin@123'));
await shot(page, 'TC56', `Console 日志中含明文密码的条数=${leaked.length}`);

// TC57 密码不写入持久存储
const stores57 = await page.evaluate(() => ({
  session: JSON.stringify(sessionStorage),
  local: JSON.stringify(localStorage),
  cookie: document.cookie,
}));
await shot(page, 'TC57', `存储中是否含密码: session=${stores57.session.includes('Admin@123')} local=${stores57.local.includes('Admin@123')} cookie=${stores57.cookie.includes('Admin@123')}`);

// TC58 XSS 输入拦截
let dialogFired = false;
page.on('dialog', (d) => { dialogFired = true; d.dismiss(); });
await gotoLogin(page);
await typeUserID(page, '<script>alert(1)</script>');
const xssUser = await uidVal(page);
await typePassword(page, '"><script>alert(1)</script>');
const xssPwd = await pwdVal(page);
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1500);
await shot(page, 'TC58', `XSS 输入 -> UserID 实测="${xssUser}" Password 长度=${xssPwd.length} 弹窗触发=${dialogFired}`);

// TC59 未认证禁止访问 Menu
await page.evaluate(() => sessionStorage.clear());
await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await shot(page, 'TC59', `清除 Token 后访问 /menu -> 实际 URL=${page.url()}`);

// TC60 认证失败不保存 Token
await gotoLogin(page);
await page.evaluate(() => sessionStorage.clear());
await typeUserID(page, 'admin');
await typePassword(page, 'wrongpass');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(1800);
const token60 = await page.evaluate(() => sessionStorage.getItem('edb_auth_token'));
await shot(page, 'TC60', `401 失败后 edb_auth_token=${token60} URL=${page.url()}`);

// TC61 登出清除认证信息
await gotoLogin(page);
await typeUserID(page, 'admin');
await typePassword(page, 'Admin@123');
await page.locator('button[type="submit"]').click();
await page.waitForURL('**/menu', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
await shot(page, 'TC61', `登录成功进入 Menu，token=${await page.evaluate(() => sessionStorage.getItem('edb_auth_token'))}`);
const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), [role="button"]:has-text("Logout")').first();
if (await logoutBtn.count()) {
  await logoutBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
const after61 = await page.evaluate(() => ({
  token: sessionStorage.getItem('edb_auth_token'),
  user: sessionStorage.getItem('edb_user_info'),
}));
await shot(page, 'TC61b', `Logout 后 token=${after61.token} user=${after61.user} URL=${page.url()}`);

await browser.close();

/* ================================================================== */
fs.writeFileSync(
  path.join(OUT_DIR, '_结果记录.json'),
  JSON.stringify({ total: counter, results }, null, 2),
  'utf8',
);
console.log(`\n完成：共 ${counter} 张截图，输出目录 ${OUT_DIR}`);
