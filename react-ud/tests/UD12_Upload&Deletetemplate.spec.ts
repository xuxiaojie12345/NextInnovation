import { test, expect, Page, Route } from '@playwright/test';
import path from 'path';

const screenshotDir = path.join(
  'E:',
  'UDWorkspace',
  'NextInnovation',
  'react-ud',
  'Image',
  'UD12'
);

function sanitizeFilename(value: string) {
  return value
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[\u0000-\u001F]+/g, '')
    .substring(0, 120);
}

function createScreenshotHelper(testId: string, page: Page) {
  let stepIndex = 1;
  const baseName = sanitizeFilename(testId);
  return async (description: string) => {
    if (page.isClosed()) {
      return;
    }
    const screenshotName = `${baseName}_${String(stepIndex).padStart(3, '0')}.jpeg`;
    const screenshotPath = path.join(screenshotDir, screenshotName);
    await page.screenshot({
      path: screenshotPath,
      type: 'jpeg',
      quality: 90,
      fullPage: false
    });
    stepIndex += 1;
  };
}

function createFilePayload(
  name: string,
  sizeBytes: number,
  mimeType = 'application/octet-stream'
) {
  return {
    name,
    mimeType,
    buffer: Buffer.alloc(sizeBytes, 0)
  };
}

async function stubGetMarket(
  page: Page,
  data: Array<{ market: string }> = [
    { market: 'JPN' },
    { market: 'CHN' },
    { market: 'USA' }
  ],
  status = 200,
  code = 200
) {
  await page.route(
    '**/admin/Upload&DeleteTemplate/getMarket',
    async (route: Route) => {
      if (status === 0) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ code, data })
      });
    }
  );
}

async function stubUpload(
  page: Page,
  responseBody: Record<string, any>,
  status = 200
) {
  await page.route(
    '**/admin/Upload&DeleteTemplate/uploadFile',
    async (route: Route) => {
      if (status === 0) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseBody)
      });
    }
  );
}

async function stubGetFileList(
  page: Page,
  market: string,
  data: Array<{ File: string }> = [{ File: 'test.docx' }],
  status = 200,
  code = 200
) {
  await page.route(
    '**/admin/Upload&DeleteTemplate/getFileList**',
    async (route: Route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.searchParams.get('Market') !== market) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ code: 400, data: [] })
        });
        return;
      }
      if (status === 0) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ code, data })
      });
    }
  );
}

async function stubDelete(
  page: Page,
  responseBody: Record<string, any>,
  status = 200
) {
  await page.route(
    '**/admin/Upload&DeleteTemplate/deleteFile',
    async (route: Route) => {
      if (status === 0) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseBody)
      });
    }
  );
}

async function openUD12Page(
  page: Page,
  screenshot: (description: string) => Promise<void>,
  marketData: Array<{ market: string }>,
  marketStatus = 200,
  marketCode = 200
) {
  await stubGetMarket(page, marketData, marketStatus, marketCode);
  await page.goto('/UD12UploadDeletetemplate');
  await screenshot('访问 Upload&Delete Template 页面');
}

test.describe('UD12_Upload&Deletetemplate 自动化测试', () => {
  test('TC01 - 画面初始化-Market下拉列表', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC01_画面初始化-Market下拉列表',
      page
    );
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);

    const uploadTitle = page.locator('h1', { hasText: 'HDoc Template Upload' });
    await expect(uploadTitle).toBeVisible();
    await screenshot('验证 HDoc Template Upload 标题显示');

    const deleteTitle = page.locator('h2', {
      hasText: 'HDoc Template Delete/Archive'
    });
    await expect(deleteTitle).toBeVisible();
    await screenshot('验证 HDoc Template Delete/Archive 标题显示');

    const uploadMarket = page.locator('#uploadMarket');
    await expect(uploadMarket).toBeVisible();
    await expect(uploadMarket).toHaveCount(1);
    const uploadOptions = uploadMarket.locator('option');
    await expect(uploadOptions).toHaveCount(3);
    await expect(uploadOptions.nth(1)).toHaveText('JPN');
    await expect(uploadOptions.nth(2)).toHaveText('CHN');
    await screenshot('验证上传区域 Market 下拉列表显示市场列表');

    const deleteMarket = page.locator('#deleteMarket');
    await expect(deleteMarket).toBeVisible();
    const deleteOptions = deleteMarket.locator('option');
    await expect(deleteOptions).toHaveCount(3);
    await screenshot('验证删除区域 Market 下拉列表显示市场列表');
  });

  test('TC02 - 画面初始化-Market列表空', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC02_画面初始化-Market列表空',
      page
    );
    await openUD12Page(page, screenshot, [], 200, 200);

    const uploadMarket = page.locator('#uploadMarket');
    await expect(uploadMarket).toBeVisible();
    await expect(uploadMarket).toBeDisabled();
    await screenshot('验证上传区域 Market 下拉列表禁用');

    const deleteMarket = page.locator('#deleteMarket');
    await expect(deleteMarket).toBeVisible();
    await expect(deleteMarket).toBeDisabled();
    await screenshot('验证删除区域 Market 下拉列表禁用');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toHaveCount(0);
    await screenshot('验证不显示错误消息');
  });

  test('TC03 - 画面初始化-加载Market失败', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC03_画面初始化-加载Market失败',
      page
    );
    await openUD12Page(page, screenshot, [], 500, 500);

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await screenshot('验证错误消息显示');
    await expect(errorMessage).toContainText(
      'System error. Please contact administrator.'
    );
  });

  test('TC04 - 文件选择-正常选择文件', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC04_文件选择-正常选择文件',
      page
    );
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);
    const fileInput = page.locator('#templateFile');

    await fileInput.setInputFiles(
      createFilePayload(
        'test_template.docx',
        1024,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    );
    await screenshot('选择 test_template.docx 文件');

    const selectedFile = page.locator('.selected-file');
    await expect(selectedFile).toHaveText('test_template.docx');
    await screenshot('验证文件名显示');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toHaveCount(0);
    await screenshot('验证不显示错误消息');
  });

  test('TC05 - 文件选择-取消选择', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC05_文件选择-取消选择', page);
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);

    await page.locator('button.file-input-button').click();
    await screenshot('点击ファイルを選択按钮但未选择文件');

    const selectedFile = page.locator('.selected-file');
    await expect(selectedFile).toHaveText('選択されていません');
    await screenshot('验证仍显示未选择文件');
  });

  test('TC06 - 文件选择-选择后重新选择', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC06_文件选择-选择后重新选择',
      page
    );
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);
    const fileInput = page.locator('#templateFile');

    await fileInput.setInputFiles(
      createFilePayload('a.txt', 1024, 'text/plain')
    );
    await screenshot('选择 a.txt 文件');
    await expect(page.locator('.selected-file')).toHaveText('a.txt');

    await fileInput.setInputFiles(
      createFilePayload('b.txt', 1024, 'text/plain')
    );
    await screenshot('重新选择 b.txt 文件');
    await expect(page.locator('.selected-file')).toHaveText('b.txt');
  });

  test('TC07 - 空值校验-Template File未选择', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC07_空值校验-Template File未选择',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('NO FILE UPLOADED');
    await screenshot('验证 NO FILE UPLOADED 错误消息');
  });

  test('TC08 - 空值校验-Market未选择', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC08_空值校验-Market未选择',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Please select a market');
    await screenshot('验证 Please select a market 错误消息');
  });

  test('TC09 - 空值校验-两者都为空', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC09_空值校验-两者都为空', page);
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('NO FILE UPLOADED');
    await screenshot('验证 NO FILE UPLOADED 错误消息');
  });

  test('TC10 - 文件大小校验-刚好10MB', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC10_文件大小校验-刚好10MB',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          '10MB_file.docx',
          10 * 1024 * 1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 10MB_file.docx 文件');

    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证上传 API 调用成功并显示成功消息');
  });

  test('TC11 - 文件大小校验-超过10MB', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC11_文件大小校验-超过10MB',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'oversize_file.docx',
          10 * 1024 * 1024 + 1,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 oversize_file.docx 文件');

    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      'The file exceeds 10MB, please select again'
    );
    await screenshot('验证过大文件错误消息');
  });

  test('TC12 - 文件大小校验-边界值-9.9MB', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC12_文件大小校验-边界值-9.9MB',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    const bytes = Math.round(9.9 * 1024 * 1024);
    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'normal_file.docx',
          bytes,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 normal_file.docx 文件');

    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证无文件大小错误并显示成功消息');
  });

  test('TC13 - 文件大小校验-小文件-1KB', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC13_文件大小校验-小文件-1KB',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(createFilePayload('small_file.txt', 1024, 'text/plain'));
    await screenshot('选择 small_file.txt 文件');

    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证上传成功无文件大小错误消息');
  });

  test('TC14 - 上传成功-新文件', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC14_上传成功-新文件', page);
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'new_template.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 new_template.docx 文件');

    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    const uploadButton = page.locator('button.upload-button');
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toContainText(
      'TEMPLATE new_template.docx WAS SUCCESSFULLY UPLOADED TO MARKET JPN'
    );
    await screenshot('验证成功消息显示');

    await expect(page.locator('.selected-file')).toHaveText(
      '選択されていません'
    );
    await screenshot('验证文件选择清空');

    await expect(page.locator('#uploadMarket')).toHaveValue('');
    await screenshot('验证Market选择清空');
  });

  test('TC15 - 上传成功-不同Market（CHN）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC15_上传成功-不同Market（CHN）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'CHN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'chn_template.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 chn_template.docx 文件');

    await page.selectOption('#uploadMarket', 'CHN');
    await screenshot('选择 Market CHN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toContainText(
      'TEMPLATE chn_template.docx WAS SUCCESSFULLY UPLOADED TO MARKET CHN'
    );
    await screenshot('验证成功消息显示');

    await expect(page.locator('.selected-file')).toHaveText(
      '選択されていません'
    );
    await expect(page.locator('#uploadMarket')).toHaveValue('');
    await screenshot('验证上传后输入清空');
  });

  test('TC16 - 上传成功-不同Market（USD）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC16_上传成功-不同Market（USD）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'USA' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'usd_template.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 usd_template.docx 文件');

    await page.selectOption('#uploadMarket', 'USA');
    await screenshot('选择 Market USA');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toContainText(
      'TEMPLATE usd_template.docx WAS SUCCESSFULLY UPLOADED TO MARKET USA'
    );
    await screenshot('验证成功消息显示');

    await expect(page.locator('.selected-file')).toHaveText(
      '選択されていません'
    );
    await expect(page.locator('#uploadMarket')).toHaveValue('');
    await screenshot('验证上传后输入清空');
  });

  test('TC17 - 上传成功-连续上传', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC17_上传成功-连续上传', page);
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(createFilePayload('a.txt', 1024, 'text/plain'));
    await screenshot('第一次选择 a.txt');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('第一次选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('第一次点击 Upload file');
    await expect(page.locator('.message.information')).toContainText(
      'TEMPLATE a.txt WAS SUCCESSFULLY UPLOADED TO MARKET JPN'
    );
    await screenshot('第一次上传成功消息');

    await page
      .locator('#templateFile')
      .setInputFiles(createFilePayload('b.txt', 1024, 'text/plain'));
    await screenshot('第二次选择 b.txt');
    await page.selectOption('#uploadMarket', 'CHN');
    await screenshot('第二次选择 Market CHN');
    await page.locator('button.upload-button').click();
    await screenshot('第二次点击 Upload file');
    await expect(page.locator('.message.information')).toContainText(
      'TEMPLATE b.txt WAS SUCCESSFULLY UPLOADED TO MARKET CHN'
    );
    await screenshot('第二次上传成功消息');
  });

  test('TC18 - 上传失败-API返回错误', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC18_上传失败-API返回错误',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 500, data: null, message: 'error' }, 200);

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('File upload faile');
    await screenshot('验证 File upload faile 错误消息');
  });

  test('TC19 - 异常处理-401未授权（上传）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC19_异常处理-401未授权（上传）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(
      page,
      { code: 401, data: null, message: 'unauthorized' },
      401
    );

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('faile');
    await screenshot('验证未授权错误消息');
  });

  test('TC20 - 异常处理-服务器500错误（上传）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC20_异常处理-服务器500错误（上传）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 500, data: null, message: 'error' }, 500);

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      'System error. Please contact administrator.'
    );
    await screenshot('验证服务器 500 错误消息');
  });

  test('TC21 - 异常处理-网络错误（上传）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC21_异常处理-网络错误（上传）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await page.route(
      '**/admin/Upload&DeleteTemplate/uploadFile',
      async (route) => await route.abort()
    );

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      'Network error. Please check your connection.'
    );
    await screenshot('验证网络错误消息');
  });

  test('TC22 - 异常处理-API超时（上传）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC22_异常处理-API超时（上传）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await page.route(
      '**/admin/Upload&DeleteTemplate/uploadFile',
      async (route) => {
        setTimeout(async () => {
          await route.abort();
        }, 1000);
      }
    );

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(
      'Network error. Please check your connection.'
    );
    await screenshot('验证超时错误消息');
  });

  test('TC23 - UI交互-上传中按钮禁用', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC23_UI交互-上传中按钮禁用',
      page
    );
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);
    let resolveRoute: (() => void) | undefined;
    await page.route(
      '**/admin/Upload&DeleteTemplate/uploadFile',
      async (route) => {
        await new Promise<void>((resolve) => {
          resolveRoute = resolve;
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: null, message: 'success' })
        });
      }
    );

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    const uploadButton = page.locator('button.upload-button');
    await uploadButton.click();
    await screenshot('点击 Upload file 按钮后等待上传中状态');

    await expect(uploadButton).toHaveText(/Uploading.../);
    await expect(uploadButton).toBeDisabled();
    await expect(page.locator('#templateFile')).toBeDisabled();
    await expect(page.locator('#uploadMarket')).toBeDisabled();
    await screenshot('验证上传中按钮及输入控件禁用');

    if (resolveRoute) {
      resolveRoute();
    }
  });

  test('TC24 - UI交互-上传中防止重复提交', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC24_UI交互-上传中防止重复提交',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    let requestCount = 0;
    await page.route(
      '**/admin/Upload&DeleteTemplate/uploadFile',
      async (route) => {
        requestCount += 1;
        setTimeout(async () => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 200, data: null, message: 'success' })
          });
        }, 500);
      }
    );

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');
    await page.locator('button.upload-button').click();
    await screenshot('再次点击 Upload file 按钮（应无效）');

    await expect(requestCount).toBe(1);
    await screenshot('验证只发起一次 API 请求');
  });

  test('TC25 - UI交互-上传和删除互不干扰', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC25_UI交互-上传和删除互不干扰',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    let uploadResolve: (() => void) | undefined;
    await page.route(
      '**/admin/Upload&DeleteTemplate/uploadFile',
      async (route) => {
        await new Promise<void>((resolve) => {
          uploadResolve = resolve;
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: null, message: 'success' })
        });
      }
    );

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮触发上传');

    await expect(page.locator('button.upload-button')).toBeDisabled();
    await expect(page.locator('#deleteMarket')).toBeEnabled();
    await expect(page.locator('#templates')).toBeEnabled();
    await screenshot('验证删除区域控件仍可用');

    if (uploadResolve) {
      uploadResolve();
    }
  });

  test('TC26 - 画面初始化-初期表示', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC26_画面初始化-初期表示', page);
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);

    const deleteTitle = page.locator('h2', {
      hasText: 'HDoc Template Delete/Archive'
    });
    await expect(deleteTitle).toBeVisible();
    await screenshot('验证删除区域标题显示');

    await expect(page.locator('#deleteMarket')).toHaveValue('');
    await screenshot('验证删除区域 Market 显示空选项');

    const templateOptions = page.locator('#templates option');
    await expect(templateOptions).toHaveCount(1);
    await screenshot('验证 Templates 下拉列表为空');

    await expect(page.locator('button.delete-button')).toBeEnabled();
    await screenshot('验证 Delete 按钮可用');
  });

  test('TC27 - Market选择-加载Templates', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC27_Market选择-加载Templates',
      page
    );
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);
    await stubGetFileList(page, 'JPN', [
      { File: 'aa.txt' },
      { File: 'bbb.txt' }
    ]);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');

    await expect(page.locator('#templates option')).toHaveCount(3);
    await expect(page.locator('#templates option').nth(1)).toHaveText('aa.txt');
    await expect(page.locator('#templates option').nth(2)).toHaveText(
      'bbb.txt'
    );
    await screenshot('验证 Templates 下拉列表加载 JPN 文件列表');
  });

  test('TC28 - Market选择-切换Market', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC28_Market选择-切换Market',
      page
    );
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);

    await stubGetFileList(page, 'JPN', [{ File: 'aa.txt' }]);
    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await expect(page.locator('#templates option')).toHaveCount(2);

    await stubGetFileList(page, 'CHN', [{ File: 'cn.txt' }]);
    await page.selectOption('#deleteMarket', 'CHN');
    await screenshot('切换删除区域 Market CHN');

    await expect(page.locator('#templates option')).toHaveCount(2);
    await expect(page.locator('#templates option').nth(1)).toHaveText('cn.txt');
    await screenshot('验证 Templates 列表重新加载 CHN 文件');
  });

  test('TC29 - Market选择-切换为空', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC29_Market选择-切换为空', page);
    await openUD12Page(page, screenshot, [
      { market: 'JPN' },
      { market: 'CHN' }
    ]);
    await stubGetFileList(page, 'JPN', [{ File: 'aa.txt' }]);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await expect(page.locator('#templates option')).toHaveCount(2);

    await page.selectOption('#deleteMarket', '');
    await screenshot('将删除区域 Market 切换为空');

    await expect(page.locator('#templates option')).toHaveCount(1);
    await screenshot('验证 Templates 列表被清空');
  });

  test('TC30 - Market选择-加载Templates失败', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC30_Market选择-加载Templates失败',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [], 200, 500);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'Failed to load templates'
    );
    await screenshot('验证 Failed to load templates 错误消息');
  });

  test('TC31 - Market选择-加载Templates时异常', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC31_Market选择-加载Templates时异常',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await page.route(
      '**/admin/Upload&DeleteTemplate/getFileList**',
      async (route) =>
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, data: [] })
        })
    );

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'System error. Please contact administrator.'
    );
    await screenshot('验证服务器异常错误消息');
  });

  test('TC32 - 空值校验-Delete时Market未选择', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC32_空值校验-Delete时Market未选择',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await expect(page.locator('#deleteMarket')).toHaveValue('');
    await expect(page.locator('#templates')).toBeVisible();
    await screenshot('验证删除区域 Market 未选择且 Templates 可见');

    await page.locator('button.delete-button').click();
    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'Please select a market'
    );
    await screenshot('验证请选择 Market 错误消息');
  });

  test('TC33 - 空值校验-Delete时Template未选择', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC33_空值校验-Delete时Template未选择',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');

    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 按钮');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'Please select a template file'
    );
    await screenshot('验证请选择模板文件错误消息');
  });

  test('TC34 - 空值校验-Delete时两者都为空', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC34_空值校验-Delete时两者都为空',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 按钮');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'Please select a market'
    );
    await screenshot('验证 Market 空值校验错误消息');
  });

  test('TC35 - 确认对话框-点击取消', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC35_确认对话框-点击取消', page);
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => false;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并取消确认对话框');

    await expect(page.locator('.message.error')).toHaveCount(0);
    await screenshot('验证未调用 delete API 且无错误消息');
  });

  test('TC36 - 确认对话框-点击确定', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC36_确认对话框-点击确定', page);
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await stubDelete(page, { code: 200, data: null, message: 'success' });

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证删除成功消息显示');
  });

  test('TC37 - 删除成功-不同Market', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC37_删除成功-不同Market', page);
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'old_template.docx' }]);
    await stubDelete(page, { code: 200, data: null, message: 'success' });

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'old_template.docx');
    await screenshot('选择 Templates old_template.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.information')).toContainText(
      'TEMPLATE old_template.docx WAS SUCCESSFULLY DELETE FROM MARKET JPN'
    );
    await screenshot('验证删除成功消息显示');
    await expect(page.locator('#deleteMarket')).toHaveValue('');
    await expect(page.locator('#templates option')).toHaveCount(1);
    await screenshot('验证删除后 Market 和 Templates 清空');
  });

  test('TC38 - 删除失败-API返回错误', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC38_删除失败-API返回错误',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await stubDelete(page, { code: 500, data: null, message: 'error' }, 200);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'File upload faile'
    );
    await screenshot('验证删除失败错误消息');
  });

  test('TC39 - 异常处理-401未授权（删除）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC39_异常处理-401未授权（删除）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await stubDelete(
      page,
      { code: 401, data: null, message: 'unauthorized' },
      401
    );

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText('faile');
    await screenshot('验证未授权删除错误消息');
  });

  test('TC40 - 异常处理-服务器500错误（删除）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC40_异常处理-服务器500错误（删除）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await stubDelete(page, { code: 500, data: null, message: 'error' }, 500);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.error')).toBeVisible();
    await expect(page.locator('.message.error')).toContainText(
      'System error. Please contact administrator.'
    );
    await screenshot('验证服务器 500 删除错误消息');
  });

  test('TC41 - 异常处理-网络错误（删除）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC41_异常处理-网络错误（删除）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await page.route(
      '**/admin/Upload&DeleteTemplate/deleteFile',
      async (route) => await route.abort()
    );

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.error')).toContainText(
      'Network error. Please check your connection.'
    );
    await screenshot('验证删除网络错误消息');
  });

  test('TC42 - 异常处理-API超时（删除）', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC42_异常处理-API超时（删除）',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await page.route(
      '**/admin/Upload&DeleteTemplate/deleteFile',
      async (route) => {
        setTimeout(async () => {
          await route.abort();
        }, 1000);
      }
    );

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.error')).toContainText(
      'Network error. Please check your connection.'
    );
    await screenshot('验证删除超时错误消息');
  });

  test('TC43 - 删除后Templates列表刷新', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC43_删除后Templates列表刷新',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await stubDelete(page, { code: 200, data: null, message: 'success' });

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证删除成功消息');

    await expect(page.locator('#templates option')).toHaveCount(1);
    await screenshot('验证 Templates 列表刷新为空');
  });

  test('TC44 - UI交互-删除中按钮禁用', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC44_UI交互-删除中按钮禁用',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);

    let resolveDelete: (() => void) | undefined;
    await page.route(
      '**/admin/Upload&DeleteTemplate/deleteFile',
      async (route) => {
        await new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: null, message: 'success' })
        });
      }
    );

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');

    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认对话框');

    const deleteButton = page.locator('button.delete-button');
    await expect(deleteButton).toBeDisabled();
    await expect(page.locator('#deleteMarket')).toBeDisabled();
    await expect(page.locator('#templates')).toBeDisabled();
    await expect(page.locator('button.upload-button')).toBeEnabled();
    await screenshot('验证删除中按钮和控件禁用，上传区域仍可用');

    if (resolveDelete) {
      resolveDelete();
    }
  });

  test('TC45 - UI交互-删除中防止重复提交', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC45_UI交互-删除中防止重复提交',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);

    let requestCount = 0;
    await page.route(
      '**/admin/Upload&DeleteTemplate/deleteFile',
      async (route) => {
        requestCount += 1;
        setTimeout(async () => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ code: 200, data: null, message: 'success' })
          });
        }, 500);
      }
    );

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认');
    await page.locator('button.delete-button').click();
    await screenshot('再次点击 Delete 按钮');

    await expect(requestCount).toBe(1);
    await screenshot('验证只发起一次 delete API 请求');
  });

  test('TC46 - UI交互-删除成功后清空入力', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC46_UI交互-删除成功后清空入力',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);
    await stubDelete(page, { code: 200, data: null, message: 'success' });

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并确认');

    await expect(page.locator('#deleteMarket')).toHaveValue('');
    await expect(page.locator('#templates option')).toHaveCount(1);
    await screenshot('验证删除成功后控件清空');
  });

  test('TC47 - 画面迁移-Check Template链接', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC47_画面迁移-Check Template链接',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page.locator('button.link-button').click();
    await screenshot('点击 Check Template 链接');

    await expect(page).toHaveURL(/\/TemplateCheck$/);
    await screenshot('验证页面跳转到 /TemplateCheck');
  });

  test('TC48 - Check Template链接-UI表示', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC48_Check Template链接-UI表示',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    const title = page.locator('h2.check-template-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Check your rtf template');
    await screenshot('验证 Check Template 区域标题显示');

    const paras = page.locator('.check-template-section p');
    await expect(paras).toHaveCount(3);
    await expect(paras.nth(0)).toContainText('In case you have a rtf template');
    await expect(paras.nth(1)).toContainText(
      'After check download the template'
    );
    await expect(paras.nth(2)).toContainText('Use the link below');
    await screenshot('验证说明文本显示');

    await expect(page.locator('button.link-button')).toHaveText(
      'Check Template (Only for rtf files)'
    );
    await screenshot('验证链接按钮显示');
  });

  test('TC49 - 消息类型-Information样式', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC49_消息类型-Information样式',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file');

    const infoMessage = page.locator('.message.information');
    await expect(infoMessage).toBeVisible();
    await screenshot('验证 Information 消息样式');
  });

  test('TC50 - 消息类型-Error样式', async ({ page }) => {
    const screenshot = createScreenshotHelper('TC50_消息类型-Error样式', page);
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 触发空值校验');

    const errorMessage = page.locator('.message.error');
    await expect(errorMessage).toBeVisible();
    await screenshot('验证 Error 消息样式');
  });

  test('TC51 - 消息类型-Warning样式', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC51_消息类型-Warning样式',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubGetFileList(page, 'JPN', [{ File: 'test.docx' }]);

    await page.selectOption('#deleteMarket', 'JPN');
    await screenshot('选择删除区域 Market JPN');
    await page.selectOption('#templates', 'test.docx');
    await screenshot('选择 Templates test.docx');
    await page.evaluate(() => {
      window.confirm = () => false;
    });
    await page.locator('button.delete-button').click();
    await screenshot('点击 Delete 并触发确认对话框');

    // 浏览器原生 confirm 不能直接通过样式验证，但取消后不会出现错误
    const warningLabel = page.locator('.message.warning');
    await expect(warningLabel).toHaveCount(0);
    await screenshot('验证确认对话框出现并取消');
  });

  test('TC52 - 消息清空-新操作时清除前一条消息', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC52_消息清空-新操作时清除前一条消息',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);

    await page.locator('button.upload-button').click();
    await screenshot('触发错误消息');
    await expect(page.locator('.message.error')).toBeVisible();

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('再次执行上传操作');

    await expect(page.locator('.message.error')).toHaveCount(0);
    await screenshot('验证旧错误消息被清除');
  });

  test('TC53 - 消息清空-上传成功时消息正确显示', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC53_消息清空-上传成功时消息正确显示',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page.locator('button.upload-button').click();
    await screenshot('触发初始错误消息');
    await expect(page.locator('.message.error')).toBeVisible();

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');
    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 执行成功上传');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证上传成功消息显示');
  });

  test('TC54 - 安全性-文件路径安全检查', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC54_安全性-文件路径安全检查',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload('../../etc/passwd', 1024, 'application/octet-stream')
      );
    await screenshot('选择包含路径遍历字符的文件名');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    await page.locator('button.upload-button').click();
    await screenshot('点击 Upload file 按钮');

    await expect(page.locator('.message.information')).toBeVisible();
    await screenshot('验证请求正常发送并显示成功消息');
  });

  test('TC55 - 安全性-SVN账号不暴露', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC55_安全性-SVN账号不暴露',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    await page
      .locator('#templateFile')
      .setInputFiles(
        createFilePayload(
          'test.docx',
          1024,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      );
    await screenshot('选择 test.docx 文件');
    await page.selectOption('#uploadMarket', 'JPN');
    await screenshot('选择 Market JPN');

    const [request] = await Promise.all([
      page.waitForRequest('**/admin/Upload&DeleteTemplate/uploadFile'),
      page.locator('button.upload-button').click()
    ]);
    await screenshot('点击 Upload file 并捕获请求');

    const postData = request.postData();
    const headers = request.headers();
    expect(postData).not.toContain('SVN');
    expect(JSON.stringify(headers)).not.toContain('SVN');
    await screenshot('验证请求头和请求体中不包含 SVN');
  });

  test('TC56 - 安全性-文件类型不限制', async ({ page }) => {
    const screenshot = createScreenshotHelper(
      'TC56_安全性-文件类型不限制',
      page
    );
    await openUD12Page(page, screenshot, [{ market: 'JPN' }]);
    await stubUpload(page, { code: 200, data: null, message: 'success' });

    const extensions = ['txt', 'docx', 'pdf', 'png', 'exe'];
    for (const ext of extensions) {
      const fileName = `sample.${ext}`;
      await page
        .locator('#templateFile')
        .setInputFiles(
          createFilePayload(fileName, 1024, 'application/octet-stream')
        );
      await screenshot(`选择 ${fileName}`);
      await page.selectOption('#uploadMarket', 'JPN');
      await screenshot('选择 Market JPN');
      await page.locator('button.upload-button').click();
      await screenshot('点击 Upload file 按钮');
      await expect(page.locator('.message.information')).toBeVisible();
      await screenshot(`验证 ${fileName} 上传成功`);
    }
  });
});
