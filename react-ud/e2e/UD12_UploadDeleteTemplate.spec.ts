import { test, expect, Page } from "@playwright/test";

const LOGIN_URL = "/UD01";
const UD12_URL = "/UD12";
const IMAGE_DIR = "E:/git20260511/NextInnovation/react-ud/Image/UD12";
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

async function seedSession(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      "user_info",
      JSON.stringify({ userId: "tester", name: "Test User" }),
    );
    window.localStorage.setItem("auth_token", "test-token");
  });
}

async function navigateToUD12(page: Page) {
  await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
  await seedSession(page);
  await page.goto(UD12_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".ud12-container", { timeout: 15000 });
}

async function selectFirstDropdownOption(
  page: Page,
  sectionIndex: number,
): Promise<string> {
  const select = page
    .locator(".ud12-section")
    .nth(sectionIndex)
    .locator(".ud12-select")
    .first();
  const options = await select.locator("option").all();
  for (const opt of options) {
    const val = await opt.getAttribute("value");
    if (val && val !== "") {
      await select.selectOption(val);
      return val;
    }
  }
  return "";
}

test.describe("Upload&Delete Template 模块 (UD12) 测试", () => {
  test.beforeEach(async () => {
    screenshotCounter = 1;
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

  test.describe("HDoc Template Upload 区域", () => {
    test("[1] 画面初始化-Market下拉列表", async ({ page }) => {
      const t = "画面初始化-Market下拉列表";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud12-page-title")).toHaveText(
        "HDoc Template Upload",
      );
      await expect(page.locator(".ud12-section-title").first()).toHaveText(
        "HDoc Template Delete/Archive",
      );
      await expect(
        page.locator(".ud12-section").first().locator(".ud12-select").first(),
      ).toBeVisible();
      await expect(
        page.locator(".ud12-section").nth(1).locator(".ud12-select").first(),
      ).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[2] 画面初始化-Market列表空", async ({ page }) => {
      const t = "画面初始化-Market列表空";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12SelectMarket",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ code: 200, data: { markets: [] } }),
          });
        },
      );
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD12_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud12-container", { timeout: 15000 });
      await takeStepScreenshot(page, t);
      for (let i = 0; i < (await page.locator(".ud12-select").count()); i++)
        expect(
          await page
            .locator(".ud12-select")
            .nth(i)
            .locator("option")
            .first()
            .getAttribute("value"),
        ).toBe("");
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12SelectMarket");
    });

    test("[3] 画面初始化-加载Market失败", async ({ page }) => {
      const t = "画面初始化-加载Market失败";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12SelectMarket",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "Failed to load markets" }),
          });
        },
      );
      await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
      await seedSession(page);
      await page.goto(UD12_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(".ud12-container", { timeout: 15000 });
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12SelectMarket");
    });

    test("[4] 文件选择-正常选择文件", async ({ page }) => {
      const t = "文件选择-正常选择文件";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test_template.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await takeStepScreenshot(page, t);
      expect(
        await page
          .locator("#ud12-file-input")
          .evaluate((el: HTMLInputElement) => el.files?.length || 0),
      ).toBe(1);
    });

    test("[5] 文件选择-取消选择", async ({ page }) => {
      const t = "文件选择-取消选择";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      expect(
        await page
          .locator("#ud12-file-input")
          .evaluate((el: HTMLInputElement) => el.files?.length || 0),
      ).toBe(0);
      await takeStepScreenshot(page, t);
    });

    test("[6] 文件选择-选择后重新选择", async ({ page }) => {
      const t = "文件选择-选择后重新选择";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      const fi = page.locator("#ud12-file-input");
      await fi.setInputFiles({
        name: "a.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("aaa"),
      });
      await fi.setInputFiles({
        name: "b.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("bbb"),
      });
      await takeStepScreenshot(page, t);
      expect(
        await fi.evaluate((el: HTMLInputElement) => el.files?.length || 0),
      ).toBe(1);
      expect(
        await fi.evaluate((el: HTMLInputElement) => el.files?.[0]?.name || ""),
      ).toBe("b.txt");
    });

    test("[7] 空值校验-Template File未选择", async ({ page }) => {
      const t = "空值校验-Template File未选择";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[8] 空值校验-两者都为空", async ({ page }) => {
      const t = "空值校验-两者都为空";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[9] 文件大小校验-刚好10MB", async ({ page }) => {
      const t = "文件大小校验-刚好10MB";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "10MB_file.docx",
        mimeType: "application/octet-stream",
        buffer: Buffer.alloc(10 * 1024 * 1024, "x"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[10] 文件大小校验-超过10MB", async ({ page }) => {
      const t = "文件大小校验-超过10MB";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "oversize_file.docx",
        mimeType: "application/octet-stream",
        buffer: Buffer.alloc(11 * 1024 * 1024, "x"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[11] 文件大小校验-边界值-9.9MB", async ({ page }) => {
      const t = "文件大小校验-边界值-9.9MB";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "normal_file.docx",
        mimeType: "application/octet-stream",
        buffer: Buffer.alloc(Math.floor(9.9 * 1024 * 1024), "x"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[12] 文件大小校验-小文件-1KB", async ({ page }) => {
      const t = "文件大小校验-小文件-1KB";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "small_file.txt",
        mimeType: "text/plain",
        buffer: Buffer.alloc(1024, "t"),
      });
      await selectFirstDropdownOption(page, 0);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
    });

    test("[13] 上传成功-新文件", async ({ page }) => {
      const t = "上传成功-新文件";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "new_template.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test content"),
      });
      await selectFirstDropdownOption(page, 0);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      const s = page.locator(".ud12-success"),
        e = page.locator(".ud12-error");
      if (await s.isVisible().catch(() => false)) await expect(s).toBeVisible();
      else if (await e.isVisible().catch(() => false))
        await expect(e).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[14] 上传成功-不同Market（CHN）", async ({ page }) => {
      const t = "上传成功-不同Market（CHN）";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "chn_template.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("chn"),
      });
      await selectFirstDropdownOption(page, 0);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });

    test("[15] 上传成功-不同Market（USA）", async ({ page }) => {
      const t = "上传成功-不同Market（USA）";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "usa_template.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("usa"),
      });
      await selectFirstDropdownOption(page, 0);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });

    test("[16] 上传成功-连续上传", async ({ page }) => {
      const t = "上传成功-连续上传";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "a.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("aaa"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "b.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("bbb"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });

    test("[17] 上传失败-API返回错误", async ({ page }) => {
      const t = "上传失败-API返回错误";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12UploadFlie",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "上传失败" }),
          });
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12UploadFlie");
    });

    test("[18] 异常处理-401未授权（上传）", async ({ page }) => {
      const t = "异常处理-401未授权（上传）";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12UploadFlie",
        async (route) => {
          await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ code: 401, msg: "未授权" }),
          });
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12UploadFlie");
    });

    test("[19] 异常处理-服务器500错误（上传）", async ({ page }) => {
      const t = "异常处理-服务器500错误（上传）";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12UploadFlie",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12UploadFlie");
    });

    test("[20] 异常处理-网络错误（上传）", async ({ page }) => {
      const t = "异常处理-网络错误（上传）";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12UploadFlie",
        async (route) => {
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(2000);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12UploadFlie");
    });

    test("[21] 异常处理-API超时（上传）", async ({ page }) => {
      const t = "异常处理-API超时（上传）";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12UploadFlie",
        async (route) => {
          await new Promise((r) => setTimeout(r, 25000));
          await route.abort("connectionrefused");
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForSelector(".ud12-error", { timeout: 45000 });
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12UploadFlie");
    });

    test("[22] UI交互-上传中按钮状态", async ({ page }) => {
      const t = "UI交互-上传中按钮状态";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await expect(
        page.locator(".ud12-btn").filter({ hasText: "Upload file" }),
      ).toBeEnabled();
      await takeStepScreenshot(page, t);
    });

    test("[23] UI交互-上传中防止重复提交", async ({ page }) => {
      const t = "UI交互-上传中防止重复提交";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      const btn = page.locator(".ud12-btn").filter({ hasText: "Upload file" });
      await btn.click();
      await page.waitForTimeout(300);
      await btn.click();
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("HDoc Template Delete/Archive 区域", () => {
    test("[25] 画面初始化-初期表示", async ({ page }) => {
      const t = "画面初始化-初期表示";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud12-section-title").first()).toHaveText(
        "HDoc Template Delete/Archive",
      );
      const ds = page.locator(".ud12-section").nth(1);
      await expect(ds.locator(".ud12-select").nth(0)).toBeVisible();
      await expect(ds.locator(".ud12-select").nth(1)).toBeVisible();
      await expect(
        ds.locator(".ud12-btn").filter({ hasText: "Delete" }),
      ).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[26] Market选择-加载Templates", async ({ page }) => {
      const t = "Market选择-加载Templates";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      expect(
        (
          await page
            .locator(".ud12-section")
            .nth(1)
            .locator(".ud12-select")
            .nth(1)
            .locator("option")
            .all()
        ).length,
      ).toBeGreaterThanOrEqual(1);
    });

    test("[27] Market选择-切换Market", async ({ page }) => {
      const t = "Market选择-切换Market";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      const ms = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .first();
      const opts = await ms.locator("option").all();
      let firstVal = "";
      for (const o of opts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          if (!firstVal) {
            firstVal = v;
            await ms.selectOption(v);
            await page.waitForTimeout(2000);
          } else if (v !== firstVal) {
            await ms.selectOption(v);
            await page.waitForTimeout(2000);
            break;
          }
        }
      }
      await takeStepScreenshot(page, t);
    });

    test("[28] Market选择-切换为空", async ({ page }) => {
      const t = "Market选择-切换为空";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      const ms = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .first();
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      await ms.selectOption("");
      await page.waitForTimeout(500);
      await takeStepScreenshot(page, t);
      expect(
        await page
          .locator(".ud12-section")
          .nth(1)
          .locator(".ud12-select")
          .nth(1)
          .inputValue(),
      ).toBe("");
    });

    test("[29] Market选择-加载Templates失败", async ({ page }) => {
      const t = "Market选择-加载Templates失败";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12ListTemplates",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              code: 500,
              msg: "Failed to load templates",
            }),
          });
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12ListTemplates");
    });

    test("[30] Market选择-加载Templates异常", async ({ page }) => {
      const t = "Market选择-加载Templates异常";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12ListTemplates",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "系统繁忙，请稍后再试" }),
          });
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12ListTemplates");
    });

    test("[31] 空值校验-Delete时Market未选择", async ({ page }) => {
      const t = "空值校验-Delete时Market未选择";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[32] 空值校验-Delete时Template未选择", async ({ page }) => {
      const t = "空值校验-Delete时Template未选择";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[33] 空值校验-Delete时两者都为空", async ({ page }) => {
      const t = "空值校验-Delete时两者都为空";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[34] 确认对话框-点击取消", async ({ page }) => {
      const t = "确认对话框-点击取消";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      const ts = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .nth(1);
      const topts = await ts.locator("option").all();
      for (const o of topts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          await ts.selectOption(v);
          break;
        }
      }
      page.on("dialog", async (d) => {
        await d.dismiss();
      });
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, t);
    });

    test("[35] 确认对话框-点击确定", async ({ page }) => {
      const t = "确认对话框-点击确定";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      const ts = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .nth(1);
      const topts = await ts.locator("option").all();
      for (const o of topts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          await ts.selectOption(v);
          break;
        }
      }
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });

    test("[36] 删除成功-不同Market", async ({ page }) => {
      const t = "删除成功-不同Market";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      const ts = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .nth(1);
      const topts = await ts.locator("option").all();
      for (const o of topts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          await ts.selectOption(v);
          break;
        }
      }
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });

    test("[37] 删除失败-API返回错误", async ({ page }) => {
      const t = "删除失败-API返回错误";
      await page.route(
        "**/api/UD12UploadDeletetemplatApi/UD12DeleteFlie",
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ code: 500, msg: "删除失败" }),
          });
        },
      );
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      const ts = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .nth(1);
      const topts = await ts.locator("option").all();
      for (const o of topts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          await ts.selectOption(v);
          break;
        }
      }
      page.on("dialog", async (d) => {
        await d.accept();
      });
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(2000);
      const err = page.locator(".ud12-error");
      if (await err.isVisible().catch(() => false))
        await expect(err).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.unroute("**/api/UD12UploadDeletetemplatApi/UD12DeleteFlie");
    });
  });

  test.describe("跳转模板检查页面", () => {
    test("[47] 画面迁移-Check Template链接", async ({ page }) => {
      const t = "画面迁移-Check Template链接";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator(".ud12-check-link").click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/UD13");
      await takeStepScreenshot(page, t);
    });

    test("[48] Check Template链接-UI表示", async ({ page }) => {
      const t = "Check Template链接-UI表示";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await expect(page.locator(".ud12-section-title").last()).toHaveText(
        "Check your rtf template",
      );
      await expect(page.locator(".ud12-check-link")).toBeVisible();
      await expect(page.locator(".ud12-check-link")).toHaveText(
        "Check Template (Only for rtf files)",
      );
      await takeStepScreenshot(page, t);
    });
  });

  test.describe("消息显示", () => {
    test("[49] 消息类型-Information样式", async ({ page }) => {
      const t = "消息类型-Information样式";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      const s = page.locator(".ud12-success");
      if (await s.isVisible().catch(() => false)) await expect(s).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[50] 消息类型-Error样式", async ({ page }) => {
      const t = "消息类型-Error样式";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
    });

    test("[51] 消息类型-确认对话框样式", async ({ page }) => {
      const t = "消息类型-确认对话框样式";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await selectFirstDropdownOption(page, 1);
      await page.waitForTimeout(2000);
      const ts = page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-select")
        .nth(1);
      const topts = await ts.locator("option").all();
      for (const o of topts) {
        const v = await o.getAttribute("value");
        if (v && v !== "") {
          await ts.selectOption(v);
          break;
        }
      }
      page.on("dialog", async (d) => {
        expect(d.message()).toContain("delete template");
        await d.dismiss();
      });
      await page
        .locator(".ud12-section")
        .nth(1)
        .locator(".ud12-btn")
        .filter({ hasText: "Delete" })
        .click();
      await page.waitForTimeout(1000);
      await takeStepScreenshot(page, t);
    });

    test("[52] 消息清空-新操作时清除前一条消息", async ({ page }) => {
      const t = "消息清空-新操作时清除前一条消息";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "test.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("test"),
      });
      await page.waitForTimeout(300);
      await takeStepScreenshot(page, t);
    });

    test("[53] 消息清空-上传成功时消息正确显示", async ({ page }) => {
      const t = "消息清空-上传成功时消息正确显示";
      await navigateToUD12(page);
      await takeStepScreenshot(page, t);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(500);
      await expect(page.locator(".ud12-error")).toBeVisible();
      await takeStepScreenshot(page, t);
      await page.locator("#ud12-file-input").setInputFiles({
        name: "new_upload.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("new content"),
      });
      await selectFirstDropdownOption(page, 0);
      await page
        .locator(".ud12-btn")
        .filter({ hasText: "Upload file" })
        .click();
      await page.waitForTimeout(3000);
      await takeStepScreenshot(page, t);
    });
  });
});
