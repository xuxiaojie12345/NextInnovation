/**
 * UD02_playwright.spec.ts
 * ---------------------------------------------------------------
 * Menu 模块（UD02）Playwright 自动化测试
 *
 * 测试式样书：プロンプトUD02_単体テスト仕様書.md
 * 参照画面　：src/Menu/Menu.tsx
 *
 * 说明：
 * - 仕様書记载的全部 20 个测试对象（测试观点）各对应一个 test 用例；
 * - 每执行一步（操作 / 确认）都会以 JPEG 截图保存；
 * - 截图以「测试观点名称为单元」从 001 开始循环命名；
 *   保存位置：src/Test/UD02/screenshots/<观点名称>/<观点名称>_001.jpeg ...
 * - 元素定位与 Menu.tsx 保持一致：
 *   左侧菜单项为 li.menu-item（内含 span.menu-arrow 与 span.menu-label），
 *   右侧为 .content-header > .content-title / .content-body，
 *   未实装画面显示占位 .content-placeholder（文本 [screen] 画面加载区域），
 *   Generate Doc 则加载真实画面 .generate-doc-container / .generate-doc-title。
 * - Generate Doc 画面会调用 UD03 接口，测试中统一 Mock 以避免网络噪音。
 *
 * 运行前提：
 *   1. 启动前端：npm start（默认 http://localhost:3000）
 *   2. 运行：npx playwright test UD02/UD02_playwright.spec.ts
 *   可用环境变量 BASE_URL 覆盖被测地址（默认 http://localhost:3000）。
 */
import { test, expect, Page, TestInfo } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/** 被测应用地址（默认本地前端 3000，可用 BASE_URL 覆盖） */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/** 与 Menu.tsx 保持一致的元素定位器 */
const SEL = {
  /** 整体布局：左侧固定菜单 + 右侧内容区 */
  layout: '.menu-layout',
  /** 左侧固定菜单区域 */
  sidebar: '.menu-sidebar',
  /** 右侧内容区域 */
  main: '.menu-main',
  /** 菜单分组标题（Generate / Admin / User Administration / Documentation） */
  sectionTitle: '.section-title',
  /** 菜单项（超链接） */
  menuItem: '.menu-item',
  /** 当前选中（高亮）的菜单项 */
  menuItemActive: '.menu-item.active',
  /** 菜单项文本 */
  menuLabel: '.menu-label',
  /** 菜单项箭头 */
  menuArrow: '.menu-arrow',
  /** 右侧内容区标题（显示当前菜单项名称） */
  contentTitle: '.content-title',
  /** 右侧内容区主体 */
  contentBody: '.content-body',
  /** 未实装画面的占位表示 */
  placeholder: '.content-placeholder',
  /** 错误消息 */
  errorMessage: '.error-message',
  /** Generate Doc 实际画面容器 */
  generateDocContainer: '.generate-doc-container',
  /** Generate Doc 实际画面标题 */
  generateDocTitle: '.generate-doc-title',
};

/** 菜单分组标题（Menu.tsx MENU_SECTIONS，顺序一致） */
const SECTION_TITLES = [
  'Generate',
  'Admin',
  'User Administration',
  'Documentation',
];

/** 菜单项与加载画面的映射（Menu.tsx MENU_SECTIONS，顺序一致） */
const MENU_ITEMS: { label: string; screen: string }[] = [
  { label: 'Generate Doc', screen: 'GenerateHomologationDocument' },
  { label: 'Update user defined variables (rules)', screen: 'HomologationVariables' },
  { label: 'Existing HDoc variables', screen: 'ExistingHDocVariables' },
  { label: 'Upload/Delete template', screen: 'HDocTemplateUpload&Delete' },
  { label: 'List available templates', screen: 'ListTemplates' },
  { label: 'VPPS Vin plate', screen: 'VinPlate' },
  { label: 'AD/CA Change', screen: 'ADChange' },
  { label: 'HDoc User Administration', screen: 'HDocUserAdmin' },
  { label: 'HDoc User Doc Administration', screen: 'HDocUserDocAdministration' },
  { label: 'Search User', screen: 'SearchHDocUser' },
  { label: 'User Guide', screen: 'HDocHelp' },
];

/** Generate Doc 画面的 DocumentType 取得 API（Mock 以避免网络错误消息） */
const DOC_TYPE_API = '**/api/GenerateDocument/UD03SelectHdocdocumentlist';

/** 去除文件名非法字符，得到安全目录/文件名 */
function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
}

/**
 * 创建截图器：以「测试观点名称」为单位，从 001 开始循环命名并保存 JPEG。
 * @param testInfo Playwright TestInfo（用于取观点名称）
 */
function createScreenshotter(testInfo: TestInfo) {
  const unit = sanitize(testInfo.title);
  const dir = path.join(__dirname, 'screenshots', unit);
  fs.mkdirSync(dir, { recursive: true });
  let counter = 0;
  return async function shot(page: Page) {
    counter += 1;
    const file = path.join(
      dir,
      `${unit}_${String(counter).padStart(3, '0')}.jpeg`,
    );
    await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  };
}

/** 打开 Menu 页面 */
async function openMenu(page: Page) {
  await page.goto(`${BASE_URL}/Menu`);
  await expect(page.locator(SEL.layout)).toBeVisible();
}

/** 取得指定名称的菜单项（li.menu-item，内含对应 menu-label） */
function menuItem(page: Page, label: string) {
  return page.locator(SEL.menuItem).filter({ hasText: label }).first();
}

/** 点击指定名称的菜单项 */
async function clickMenu(page: Page, label: string) {
  await menuItem(page, label).click();
}

/**
 * 验证未实装画面：右侧标题为菜单项名称，且显示 [screen] 占位画面。
 */
async function expectPlaceholderScreen(page: Page, label: string, screen: string) {
  await expect(page.locator(SEL.contentTitle)).toHaveText(label);
  await expect(page.locator(SEL.placeholder)).toHaveText(
    `[${screen}] 画面加载区域`,
  );
}

// 每个用例执行前，Mock Generate Doc 画面的 UD03 接口（返回空列表）
test.beforeEach(async ({ page }) => {
  await page.route(DOC_TYPE_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        data: { documentTypeList: [] },
        message: '',
      }),
    });
  });
});

/* =========================================================================
 * 一、画面初期表示
 * ========================================================================= */

test('01_画面初始化-菜单项目表示', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  // 步骤1：访问 Menu 页面
  await openMenu(page);
  await shot(page);

  // 步骤2：确认菜单区域的超链接显示（分组标题）
  await expect(page.locator(SEL.sectionTitle)).toHaveText(SECTION_TITLES);
  await shot(page);

  // 11 个超链接按式样顺序显示
  await expect(page.locator(SEL.menuItem)).toHaveCount(MENU_ITEMS.length);
  await expect(page.locator(SEL.menuLabel)).toHaveText(
    MENU_ITEMS.map((item) => item.label),
  );
  await shot(page);
});

test('02_画面初始化-超链接初期状态', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤2：确认各超链接的初期状态
  const count = await page.locator(SEL.menuItem).count();
  expect(count).toBe(MENU_ITEMS.length);

  // 1) 所有超链接均为活性状态（可见 + 手型指针 + 可点击）
  for (let i = 0; i < count; i += 1) {
    const item = page.locator(SEL.menuItem).nth(i);
    await expect(item).toBeVisible();
    const styles = await item.evaluate((el) => {
      const style = window.getComputedStyle(el as Element);
      return { cursor: style.cursor, pointerEvents: style.pointerEvents };
    });
    expect(styles.cursor).toBe('pointer');
    expect(styles.pointerEvents).not.toBe('none');
  }
  await shot(page);

  // 2) 文字均为左对齐（Chrome 下默认块级为 start，等价于左对齐）
  const alignments = await page.locator(SEL.menuItem).evaluateAll((els) =>
    els.map((el) => window.getComputedStyle(el).textAlign),
  );
  alignments.forEach((align) => {
    expect(['left', 'start']).toContain(align);
  });
  await shot(page);

  // 3) 不显示错误消息
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await shot(page);
});

test('03_画面初始化-画面布局', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤2：确认左右区域布局
  const sidebar = page.locator(SEL.sidebar);
  const main = page.locator(SEL.main);
  await expect(sidebar).toBeVisible();
  await expect(main).toBeVisible();

  const sidebarBox = await sidebar.boundingBox();
  const mainBox = await main.boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(mainBox).not.toBeNull();
  // 左侧为菜单区域，右侧为内容表示区域
  expect((sidebarBox as { x: number }).x).toBeLessThan(
    (mainBox as { x: number }).x,
  );
  await shot(page);
});

/* =========================================================================
 * 二、超链接画面迁移（No.4〜No.14）
 * ========================================================================= */

test('04_超链接[Generate Doc]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤1：点击 [Generate Doc] 超链接
  await clickMenu(page, 'Generate Doc');
  await shot(page);

  // 步骤2：确认右侧画面加载 [GenerateHomologationDocument] 画面
  await expect(page.locator(SEL.contentTitle)).toHaveText('Generate Doc');
  await expect(page.locator(SEL.generateDocContainer)).toBeVisible();
  await expect(page.locator(SEL.generateDocTitle)).toHaveText(
    'HDoc - Generate Homologation Document',
  );
  await shot(page);
});

test('05_超链接[Update user defined variables (rules)]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'Update user defined variables (rules)');
  await shot(page);
  await expectPlaceholderScreen(
    page,
    'Update user defined variables (rules)',
    'HomologationVariables',
  );
  await shot(page);
});

test('06_超链接[Existing HDoc variables]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'Existing HDoc variables');
  await shot(page);
  await expectPlaceholderScreen(page, 'Existing HDoc variables', 'ExistingHDocVariables');
  await shot(page);
});

test('07_超链接[Upload/Delete template]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'Upload/Delete template');
  await shot(page);
  await expectPlaceholderScreen(page, 'Upload/Delete template', 'HDocTemplateUpload&Delete');
  await shot(page);
});

test('08_超链接[List available templates]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'List available templates');
  await shot(page);
  await expectPlaceholderScreen(page, 'List available templates', 'ListTemplates');
  await shot(page);
});

test('09_超链接[VPPS Vin plate]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'VPPS Vin plate');
  await shot(page);
  await expectPlaceholderScreen(page, 'VPPS Vin plate', 'VinPlate');
  await shot(page);
});

test('10_超链接[AD/CA Change]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'AD/CA Change');
  await shot(page);
  await expectPlaceholderScreen(page, 'AD/CA Change', 'ADChange');
  await shot(page);
});

test('11_超链接[HDoc User Administration]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'HDoc User Administration');
  await shot(page);
  await expectPlaceholderScreen(page, 'HDoc User Administration', 'HDocUserAdmin');
  await shot(page);
});

test('12_超链接[HDoc User Doc Administration]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'HDoc User Doc Administration');
  await shot(page);
  await expectPlaceholderScreen(
    page,
    'HDoc User Doc Administration',
    'HDocUserDocAdministration',
  );
  await shot(page);
});

test('13_超链接[Search User]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'Search User');
  await shot(page);
  await expectPlaceholderScreen(page, 'Search User', 'SearchHDocUser');
  await shot(page);
});

test('14_超链接[User Guide]-画面加载', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  await clickMenu(page, 'User Guide');
  await shot(page);
  await expectPlaceholderScreen(page, 'User Guide', 'HDocHelp');
  await shot(page);
});

/* =========================================================================
 * 三、画面切换行为
 * ========================================================================= */

test('15_画面切换-连续点击不同超链接', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤1/2：点击 [Generate Doc]，确认右侧画面加载
  await clickMenu(page, 'Generate Doc');
  await expect(page.locator(SEL.generateDocContainer)).toBeVisible();
  await shot(page);

  // 步骤3/4：点击 [User Guide]，确认右侧画面刷新为 [HDocHelp]
  await clickMenu(page, 'User Guide');
  await shot(page);
  await expectPlaceholderScreen(page, 'User Guide', 'HDocHelp');
  // 右侧仅表示最新点击的画面（前一个画面不再显示）
  await expect(page.locator(SEL.generateDocContainer)).toHaveCount(0);
  await shot(page);
});

test('16_画面切换-重复点击同一超链接', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤1：连续两次点击 [Existing HDoc variables]
  await clickMenu(page, 'Existing HDoc variables');
  await shot(page);
  await clickMenu(page, 'Existing HDoc variables');
  await shot(page);

  // 步骤2：确认结果（画面正常表示，不发生错误）
  await expectPlaceholderScreen(page, 'Existing HDoc variables', 'ExistingHDocVariables');
  await expect(page.locator(SEL.errorMessage)).toHaveCount(0);
  await shot(page);
});

test('17_画面切换-左侧菜单固定', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  const before = await page.locator(SEL.sidebar).boundingBox();
  await shot(page);

  // 步骤1：点击超链接加载右侧画面（例：Upload/Delete template）
  await clickMenu(page, 'Upload/Delete template');
  await expectPlaceholderScreen(page, 'Upload/Delete template', 'HDocTemplateUpload&Delete');
  await shot(page);

  // 步骤2：确认左侧菜单区域状态（位置与尺寸不变）
  const after = await page.locator(SEL.sidebar).boundingBox();
  expect(after).not.toBeNull();
  expect(before).not.toBeNull();
  expect((after as { x: number }).x).toBe((before as { x: number }).x);
  expect((after as { width: number }).width).toBe((before as { width: number }).width);

  // 所有超链接仍处于可点击状态
  const count = await page.locator(SEL.menuItem).count();
  expect(count).toBe(MENU_ITEMS.length);
  for (let i = 0; i < count; i += 1) {
    await expect(page.locator(SEL.menuItem).nth(i)).toBeVisible();
  }
  await shot(page);
});

test('18_画面切换-各模块超链接可用', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤1/2：依次点击各模块下的超链接并确认结果
  // Generate 模块
  await clickMenu(page, 'Generate Doc');
  await expect(page.locator(SEL.generateDocContainer)).toBeVisible();
  await shot(page);

  // Admin 模块
  await clickMenu(page, 'Upload/Delete template');
  await expectPlaceholderScreen(page, 'Upload/Delete template', 'HDocTemplateUpload&Delete');
  await shot(page);

  // User Administration 模块
  await clickMenu(page, 'Search User');
  await expectPlaceholderScreen(page, 'Search User', 'SearchHDocUser');
  await shot(page);

  // Documentation 模块
  await clickMenu(page, 'User Guide');
  await expectPlaceholderScreen(page, 'User Guide', 'HDocHelp');
  await shot(page);
});

/* =========================================================================
 * 四、UI 表示
 * ========================================================================= */

test('19_UI表示-超链接样式', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 步骤2：确认菜单中超链接的文字样式（以蓝色等可点击表现，与普通文本可区分）
  const labelStyle = await page.locator(SEL.menuLabel).first().evaluate((el) => {
    const style = window.getComputedStyle(el as Element);
    return { color: style.color, cursor: style.cursor };
  });
  await shot(page);

  const m = labelStyle.color.match(/\d+/g);
  expect(m).not.toBeNull();
  const [r, g, b] = (m as string[]).map(Number);
  // 1) 蓝色系可点击表现（蓝通道强于红/绿通道）
  expect(b).toBeGreaterThan(r);
  expect(b).toBeGreaterThan(g);
  // 2) 与普通黑色文本可区分
  expect(labelStyle.color).not.toBe('rgb(0, 0, 0)');
  // 3) 鼠标指针为手型
  expect(labelStyle.cursor).toBe('pointer');
  await shot(page);
});

test('20_UI表示-鼠标悬停效果', async ({ page }, testInfo) => {
  const shot = createScreenshotter(testInfo);
  await openMenu(page);
  await shot(page);

  // 悬停对象选取未选中项（Search User），避免选中项高亮样式覆盖悬停样式
  const target = menuItem(page, 'Search User');
  const colorBefore = await target.evaluate(
    (el) => window.getComputedStyle(el as Element).backgroundColor,
  );
  await shot(page);

  // 步骤1：将鼠标悬停在超链接上
  await target.hover();
  await shot(page);

  // 步骤2：确认显示效果
  const stylesAfter = await target.evaluate((el) => {
    const style = window.getComputedStyle(el as Element);
    return { backgroundColor: style.backgroundColor, cursor: style.cursor };
  });
  // 1) 鼠标指针为手型
  expect(stylesAfter.cursor).toBe('pointer');
  // 2) 悬停时样式有变化（背景色高亮）
  expect(stylesAfter.backgroundColor).not.toBe(colorBefore);
  await shot(page);
});
