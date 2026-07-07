# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UD03_GenerateHomologationDocument.spec.ts >> Generate Homologation Document 模块 (UD03) 测试 >> [2] 画面初始化-Document Type下拉
- Location: src\tests\UD03_GenerateHomologationDocument.spec.ts:46:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#chassis-series') to be visible

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - complementary [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e9]: VOLVO
      - navigation [ref=e10]:
        - generic [ref=e11]:
          - heading "Generate" [level=2] [ref=e12]
          - list [ref=e13]:
            - listitem [ref=e14]:
              - button "»Generate Doc" [ref=e15] [cursor=pointer]
        - generic [ref=e16]:
          - heading "Admin" [level=2] [ref=e17]
          - list [ref=e18]:
            - listitem [ref=e19]:
              - button "»Update user defined variables (rules)" [ref=e20] [cursor=pointer]
            - listitem [ref=e21]:
              - button "»Existing HDoc variables" [ref=e22] [cursor=pointer]
            - listitem [ref=e23]:
              - button "»Upload/Delete template" [ref=e24] [cursor=pointer]
            - listitem [ref=e25]:
              - button "»Template Check" [ref=e26] [cursor=pointer]
            - listitem [ref=e27]:
              - button "»List Templates" [ref=e28] [cursor=pointer]
            - listitem [ref=e29]:
              - button "»VPPS Vin plate" [ref=e30] [cursor=pointer]
            - listitem [ref=e31]:
              - button "»AD/CA Change" [ref=e32] [cursor=pointer]
        - generic [ref=e33]:
          - heading "User Administration" [level=2] [ref=e34]
          - list [ref=e35]:
            - listitem [ref=e36]:
              - button "»HDoc User Administration" [ref=e37] [cursor=pointer]
            - listitem [ref=e38]:
              - button "»HDoc User Doc Administration" [ref=e39] [cursor=pointer]
            - listitem [ref=e40]:
              - button "»Search User" [ref=e41] [cursor=pointer]
        - generic [ref=e42]:
          - heading "Documentation" [level=2] [ref=e43]
          - list [ref=e44]:
            - listitem [ref=e45]:
              - button "»User Guide" [ref=e46] [cursor=pointer]
  - main [ref=e47]:
    - main [ref=e50]:
      - generic [ref=e51]:
        - heading "HDoc - Generate Homologation Document" [level=1] [ref=e52]
        - generic [ref=e53]:
          - generic [ref=e54]: Chassis series *
          - textbox "Chassis series *" [ref=e56]
        - generic [ref=e57]:
          - generic [ref=e58]: Chassis no *
          - textbox "Chassis no *" [ref=e60]
        - generic [ref=e61]:
          - generic [ref=e62]: Document type *
          - combobox "Document type *" [ref=e64] [cursor=pointer]:
            - option "-- Select --" [disabled] [selected]
            - option "123"
            - option "CERTIFICATE"
            - option "DIMENSION_PLATE"
            - option "TECHNICAL_SPEC"
        - generic [ref=e65]:
          - button "Submit" [ref=e66] [cursor=pointer]
          - button "Reset" [ref=e67] [cursor=pointer]
          - button "Help" [ref=e68] [cursor=pointer]
        - generic [ref=e69]:
          - text: "HDoc support:"
          - link "support.tpi@volvo.com" [ref=e70] [cursor=pointer]:
            - /url: mailto:support.tpi@volvo.com
```

# Test source

```ts
  1   | import { test, expect, Page, Route } from "@playwright/test";
  2   | 
  3   | const URL = "/UD03";
  4   | const API_DOC_TYPES = "/api/UD03SelectHdocdocumentlistApi";
  5   | 
  6   | async function mockDocTypes(page: Page) {
  7   |   await page.route(API_DOC_TYPES, async (route: Route) => {
  8   |     await route.fulfill({
  9   |       status: 200,
  10  |       contentType: "application/json",
  11  |       body: JSON.stringify({
  12  |         code: 200,
  13  |         msg: "success",
  14  |         data: [{ doctype: "VIN-PLATE" }, { doctype: "CERTIFICATE" }],
  15  |       }),
  16  |     });
  17  |   });
  18  | }
  19  | 
  20  | async function seedSession(page: Page) {
  21  |   await page.addInitScript(() => {
  22  |     window.localStorage.setItem(
  23  |       "user_info",
  24  |       JSON.stringify({ userId: "tester", name: "Test User" }),
  25  |     );
  26  |     window.localStorage.setItem("auth_token", "fake-token");
  27  |   });
  28  | }
  29  | 
  30  | test.describe("Generate Homologation Document 模块 (UD03) 测试", () => {
  31  |   test.beforeEach(async ({ page }: { page: Page }) => {
  32  |     await seedSession(page);
  33  |     await mockDocTypes(page);
  34  |     await page.goto(URL);
> 35  |     await page.waitForSelector("#chassis-series", { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  36  |   });
  37  | 
  38  |   test("[1] 画面初始化-全体布局", async ({ page }: { page: Page }) => {
  39  |     await expect(page.locator(".ud03-header")).toBeVisible();
  40  |     await expect(page.locator(".ud03-header-logo")).toContainText("VOLVO");
  41  |     await expect(page.locator(".ud03-page-title")).toContainText(
  42  |       "Generate Homologation Document",
  43  |     );
  44  |   });
  45  | 
  46  |   test("[2] 画面初始化-Document Type下拉", async ({ page }: { page: Page }) => {
  47  |     await expect(page.locator("#document-type")).toBeVisible();
  48  |     await expect(page.locator("#chassis-series")).toBeVisible();
  49  |     await expect(page.locator("#chassis-no")).toBeVisible();
  50  |   });
  51  | 
  52  |   test("[5] Chassis series-半角英数字のみ", async ({
  53  |     page,
  54  |   }: {
  55  |     page: Page;
  56  |   }) => {
  57  |     const input = page.locator("#chassis-series");
  58  |     await input.fill("abc!@#日本語");
  59  |     await expect(input).toHaveValue("abc");
  60  |   });
  61  | 
  62  |   test("[6] Chassis series-MaxLength(5)", async ({ page }: { page: Page }) => {
  63  |     const input = page.locator("#chassis-series");
  64  |     await input.fill("ABCDEF");
  65  |     const val = await input.inputValue();
  66  |     expect(val.length).toBeLessThanOrEqual(5);
  67  |   });
  68  | 
  69  |   test("[7] Chassis no-半角数字のみ", async ({ page }: { page: Page }) => {
  70  |     const input = page.locator("#chassis-no");
  71  |     await input.fill("abc123!@#");
  72  |     await expect(input).toHaveValue("123");
  73  |   });
  74  | 
  75  |   test("[8] Chassis no-MaxLength(10)", async ({ page }: { page: Page }) => {
  76  |     const input = page.locator("#chassis-no");
  77  |     await input.fill("12345678901");
  78  |     const val = await input.inputValue();
  79  |     expect(val.length).toBeLessThanOrEqual(10);
  80  |   });
  81  | 
  82  |   test("[9] Submit-Chassis系列为空", async ({ page }: { page: Page }) => {
  83  |     await page.locator("#chassis-no").fill("028321");
  84  |     await page.locator(".ud03-btn-submit").click();
  85  |     await expect(page.locator(".ud03-error")).toContainText(
  86  |       "Chassis series and chassis no are required",
  87  |     );
  88  |   });
  89  | 
  90  |   test("[10] Submit-Chassis编号为空", async ({ page }: { page: Page }) => {
  91  |     await page.locator("#chassis-series").fill("JPCT");
  92  |     await page.locator(".ud03-btn-submit").click();
  93  |     await expect(page.locator(".ud03-error")).toContainText(
  94  |       "Chassis series and chassis no are required",
  95  |     );
  96  |   });
  97  | 
  98  |   test("[12] Submit-两者为空", async ({ page }: { page: Page }) => {
  99  |     await page.locator(".ud03-btn-submit").click();
  100 |     await expect(page.locator(".ud03-error")).toContainText(
  101 |       "Chassis series and chassis no are required",
  102 |     );
  103 |   });
  104 | 
  105 |   test("[15] Reset-清空表单", async ({ page }: { page: Page }) => {
  106 |     await page.locator("#chassis-series").fill("JPCT");
  107 |     await page.locator("#chassis-no").fill("028321");
  108 |     await page.locator(".ud03-btn-reset").click();
  109 |     await expect(page.locator("#chassis-series")).toHaveValue("");
  110 |     await expect(page.locator("#chassis-no")).toHaveValue("");
  111 |   });
  112 | 
  113 |   test("[18] 例外处理-会话过期", async ({ page }: { page: Page }) => {
  114 |     await page.addInitScript(() => window.localStorage.clear());
  115 |     await page.goto(URL);
  116 |     await page.waitForURL("**/UD01", { timeout: 10000 });
  117 |     await expect(page).toHaveURL(/UD01/);
  118 |   });
  119 | });
  120 | 
```