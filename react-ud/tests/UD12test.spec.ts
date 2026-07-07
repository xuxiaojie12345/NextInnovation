import { test, expect, Page } from "@playwright/test";

const SCREENSHOT_DIR =
  "E:\\yanwenjing\\git\\NextInnovation\\react-ud\\src\\image\\test\\UD12";

const APP_URL = "http://localhost:3000";
const PAGE_URL = `${APP_URL}/upload-delete-template`;

let sc: { [key: string]: number } = {};
function ss(n: string, s: string): string {
  if (!sc[n]) sc[n] = 0;
  sc[n]++;
  return `${SCREENSHOT_DIR}/${n}_${String(sc[n]).padStart(3, "0")}_${s}.jpeg`;
}

const MOCK_MARKETS = {
  code: 200,
  msg: "success",
  data: [{ market: "JPN" }, { market: "USA" }, { market: "CHN" }],
};
const MOCK_TEMPLATES = {
  code: 200,
  msg: "success",
  data: [
    { fileName: "test.rtf", filePath: "/templates/JPN/test.rtf" },
    { fileName: "doc.docx", filePath: "/templates/JPN/doc.docx" },
  ],
};
const MOCK_TEMPLATES_CHN = {
  code: 200,
  msg: "success",
  data: [{ fileName: "chn_file.rtf", filePath: "/templates/CHN/chn_file.rtf" }],
};
const MOCK_EMPTY = { code: 200, msg: "success", data: [] };
const UPLOAD_OK = {
  code: 200,
  msg: "success",
  data: { message: "File uploaded successfully" },
};
const DEL_OK = {
  code: 200,
  msg: "success",
  data: { message: "TEMPLATE test.rtf WAS SUCESSFULLY DELETE FROM MARKET JPN" },
};

async function mockMarketList(p: Page) {
  await p.route("**/api/ud12UploadDeletetemplat/getMarketList", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_MARKETS),
    }),
  );
}
async function mockTemplateFiles(p: Page, data: unknown) {
  await p.route("**/api/template/files/**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
}
async function mockUpload(p: Page, status: number, data: unknown) {
  await p.route("**/api/template/upload", (r) =>
    r.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
}
async function mockDelete(p: Page, status: number, data: unknown) {
  await p.route("**/api/template/delete", (r) =>
    r.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    }),
  );
}

test.beforeEach(() => {
  sc = {};
});

test.describe("画面初期化", () => {
  test("01_基本元素", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page.locator(".udt-section-title").first()).toHaveText(
      "HDoc Template Upload",
    );
    await expect(page.locator(".udt-section-title").nth(1)).toHaveText(
      "HDoc Template Delete/Archive",
    );
    await expect(
      page.getByRole("button", { name: "Upload file", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: ss("01_基本元素", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("02_市场列表加载", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    const selects = page.locator(".udt-select");
    await expect(selects.first().locator("option")).toHaveCount(4); // 请选择 + JPN + USA + CHN
    await page.screenshot({
      path: ss("02_市场列表加载", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("03_加载市场列表失败", async ({ page }) => {
    await page.route("**/api/ud12UploadDeletetemplat/getMarketList", (r) =>
      r.abort("connectionrefused"),
    );
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("03_加载市场列表失败", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Upload区域", () => {
  test("04_未选择文件时点击上传", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").first().selectOption("JPN");
    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await page.waitForTimeout(500);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await expect(page.locator(".udt-error-message")).toHaveText(
      "NO FILE UPLOADED",
    );
    await page.screenshot({
      path: ss("04_未选择文件时点击上传", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("05_上传成功", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await mockUpload(page, 200, UPLOAD_OK);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").first().selectOption("JPN");
    // 使用文件选择器
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("#template-file-input").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("test"),
    });
    await page.waitForTimeout(300);

    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-success-message")).toBeVisible();
    await page.screenshot({
      path: ss("05_上传成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("06_上传失败400", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await mockUpload(page, 400, {
      code: 400,
      message: "Invalid file type or size",
    });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").first().selectOption("JPN");
    const fc = page.waitForEvent("filechooser");
    await page.locator("#template-file-input").click();
    (await fc).setFiles({
      name: "bad.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("x"),
    });

    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("06_上传失败400", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("07_上传失败500", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await mockUpload(page, 500, { code: 500, msg: "System error" });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").first().selectOption("JPN");
    const fc = page.waitForEvent("filechooser");
    await page.locator("#template-file-input").click();
    (await fc).setFiles({
      name: "test.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("data"),
    });

    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("07_上传失败500", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("08_上传网络异常", async ({ page }) => {
    await page.route("**/api/template/upload", (r) =>
      r.abort("connectionrefused"),
    );
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").first().selectOption("JPN");
    const fc = page.waitForEvent("filechooser");
    await page.locator("#template-file-input").click();
    (await fc).setFiles({
      name: "test.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("x"),
    });

    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("08_上传网络异常", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("09_上传加载中按钮禁用", async ({ page }) => {
    await page.route("**/api/template/upload", async (r) => {
      await new Promise((r2) => setTimeout(r2, 3000));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(UPLOAD_OK),
      });
    });
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").first().selectOption("JPN");
    const fc = page.waitForEvent("filechooser");
    await page.locator("#template-file-input").click();
    (await fc).setFiles({
      name: "t.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from("x"),
    });

    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await expect(page.locator(".udt-loading")).toBeVisible({ timeout: 3000 });
    await page.screenshot({
      path: ss("09_上传加载中按钮禁用", "加载"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("Delete区域", () => {
  test("10_选择市场加载模板", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_TEMPLATES);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 选择删除区域的 Market
    await page.locator(".udt-select").nth(1).selectOption("JPN");
    await page.waitForTimeout(1500);

    const templateSelect = page.locator(".udt-select").nth(2);
    await expect(templateSelect.locator("option")).toHaveCount(3); // 请选择 + test.rtf + doc.docx
    await expect(templateSelect).toBeEnabled();
    await page.screenshot({
      path: ss("10_选择市场加载模板", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("11_切换Market清空模板", async ({ page }) => {
    let callCount = 0;
    await page.route("**/api/template/files/**", (r) => {
      callCount++;
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          callCount === 1 ? MOCK_TEMPLATES : MOCK_TEMPLATES_CHN,
        ),
      });
    });
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").nth(1).selectOption("JPN");
    await page.waitForTimeout(1000);
    await expect(
      page.locator(".udt-select").nth(2).locator("option"),
    ).toHaveCount(3);

    await page.locator(".udt-select").nth(1).selectOption("CHN");
    await page.waitForTimeout(1000);
    await expect(
      page.locator(".udt-select").nth(2).locator("option"),
    ).toHaveCount(2); // 请选择 + chn_file.rtf
    await page.screenshot({
      path: ss("11_切换Market清空模板", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("12_无模板文件", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_EMPTY);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").nth(1).selectOption("USA");
    await page.waitForTimeout(1000);

    const templateSelect = page.locator(".udt-select").nth(2);
    await expect(templateSelect.locator("option")).toHaveCount(1); // 只有请选择
    await page.screenshot({
      path: ss("12_无模板文件", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("13_未选择时点击Delete", async ({ page }) => {
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await expect(page.locator(".udt-error-message")).toHaveText(
      "Please select market and template.",
    );
    await page.screenshot({
      path: ss("13_未选择时点击Delete", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("14_删除确认取消", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_TEMPLATES);
    await mockDelete(page, 200, DEL_OK);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").nth(1).selectOption("JPN");
    await page.waitForTimeout(1000);
    await page.locator(".udt-select").nth(2).selectOption("test.rtf");

    page.on("dialog", (d) => {
      expect(d.message()).toContain("delete");
      d.dismiss();
    });
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(500);

    await expect(page.locator(".udt-success-message")).not.toBeVisible();
    await page.screenshot({
      path: ss("14_删除确认取消", "取消"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("15_删除确认成功", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_TEMPLATES);
    await mockDelete(page, 200, DEL_OK);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").nth(1).selectOption("JPN");
    await page.waitForTimeout(1000);
    await page.locator(".udt-select").nth(2).selectOption("test.rtf");

    page.on("dialog", (d) => {
      expect(d.message()).toContain("delete");
      d.accept();
    });
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-success-message")).toBeVisible();
    await page.screenshot({
      path: ss("15_删除确认成功", "成功"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("16_删除失败404", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_TEMPLATES);
    await mockDelete(page, 404, { code: 404, message: "File not found" });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").nth(1).selectOption("JPN");
    await page.waitForTimeout(1000);
    await page.locator(".udt-select").nth(2).selectOption("test.rtf");

    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("16_删除失败404", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("17_删除失败500", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_TEMPLATES);
    await mockDelete(page, 500, { code: 500, msg: "System error" });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.locator(".udt-select").nth(1).selectOption("JPN");
    await page.waitForTimeout(1000);
    await page.locator(".udt-select").nth(2).selectOption("test.rtf");

    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-error-message")).toBeVisible();
    await page.screenshot({
      path: ss("17_删除失败500", "错误"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("跳转检查页面", () => {
  test("18_CheckTemplate链接", async ({ page }) => {
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page.locator(".udt-subsection-title")).toHaveText(
      "Check your rtf template",
    );
    await expect(page.locator(".udt-link")).toBeVisible();
    await expect(page.locator(".udt-link")).toHaveText(
      "Check Template (Only for rtf files)",
    );

    await Promise.all([
      page
        .waitForURL("**/hdoc-template-check**", { timeout: 10000 })
        .catch(() => {}),
      page.locator(".udt-link").click(),
    ]);
    await page.screenshot({
      path: ss("18_CheckTemplate链接", "跳转"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("UI交互", () => {
  test("19_错误消息样式", async ({ page }) => {
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    await page.waitForTimeout(500);

    const msg = page.locator(".udt-error-message");
    await expect(msg).toBeVisible();
    await page.screenshot({
      path: ss("19_错误消息样式", "样式"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("20_页面刷新", async ({ page }) => {
    await mockMarketList(page);
    await mockTemplateFiles(page, MOCK_TEMPLATES);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page.locator(".udt-select").first()).toBeVisible();
    await page.reload();
    await page.waitForSelector(".udt-container", { timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page.locator(".udt-select").first()).toBeVisible();
    await page.screenshot({
      path: ss("20_页面刷新", "刷新后"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});

test.describe("安全性", () => {
  test("21_API请求协议", async ({ page }) => {
    const urls: string[] = [];
    await page.route("**/api/ud12UploadDeletetemplat/**", (r) => {
      urls.push(r.request().url());
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_MARKETS),
      });
    });
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(1500);

    for (const u of urls) {
      expect(u).not.toContain("password");
      expect(u).not.toContain("secret");
    }
    await page.screenshot({
      path: ss("21_API请求协议", "确认"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });

  test("22_用户登录认证", async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await mockMarketList(page);
    await page.goto(PAGE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(2000);

    await expect(page.locator(".udt-container")).toBeVisible();
    await page.screenshot({
      path: ss("22_用户登录认证", "表示"),
      type: "jpeg",
      quality: 80,
      fullPage: true,
    });
  });
});
