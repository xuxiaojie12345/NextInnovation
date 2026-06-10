package com.web.app.service.impl;

import com.web.app.domain.entity.MarketMaster;
import com.web.app.dto.UploadDeleteTemplateRequest;
import com.web.app.dto.UploadDeleteTemplateResponse;
import com.web.app.mapper.MarketMapper;
import com.web.app.service.UploadDeleteTemplateService;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * 上传删除模板服务实现
 */
@Service
public class UploadDeleteTemplateServiceImpl implements UploadDeleteTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(UploadDeleteTemplateServiceImpl.class);

    // 文件上传服务器地址
    private static final String UPLOAD_BASE_PATH = "\\\\172.17.0.63\\hdoc\\template\\upload";

    // 最大文件大小：10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @Autowired
    private MarketMapper marketMapper;

    @Override
    public UploadDeleteTemplateResponse upload(UploadDeleteTemplateRequest request) {
        // 1. 参数校验
        if (request == null) {
            return UploadDeleteTemplateResponse.fail("请求参数不能为空");
        }

        String base64File = request.getTemplateFile();
        String fileName = request.getFileName();
        String market = request.getMarket();

        if (StringUtils.isBlank(base64File)) {
            return UploadDeleteTemplateResponse.fail("模板文件不能为空");
        }

        if (StringUtils.isBlank(market)) {
            return UploadDeleteTemplateResponse.fail("Market不能为空");
        }

        // 如果没有提供文件名，使用默认名称
        if (StringUtils.isBlank(fileName)) {
            fileName = "uploaded_file.xlsx";
        }

        // 2. Base64解码
        byte[] fileBytes;
        try {
            fileBytes = Base64.getDecoder().decode(base64File);
        } catch (IllegalArgumentException e) {
            logger.error("Base64解码失败: {}", e.getMessage());
            return UploadDeleteTemplateResponse.fail("文件格式错误");
        }

        // 3. 文件大小校验
        if (fileBytes.length > MAX_FILE_SIZE) {
            return UploadDeleteTemplateResponse.fail("文件大小不能超过10MB");
        }

        // 4. 构建上传路径
        String uploadDir = UPLOAD_BASE_PATH + File.separator + market;
        File directory = new File(uploadDir);

        // 如果目录不存在，创建目录
        if (!directory.exists()) {
            if (!directory.mkdirs()) {
                logger.error("创建目录失败: {}", uploadDir);
                return UploadDeleteTemplateResponse.fail("创建目录失败");
            }
        }

        // 5. 保存文件
        Path filePath = Paths.get(uploadDir, fileName);

        try {
            Files.write(filePath, fileBytes);
            logger.info("文件上传成功: market={}, fileName={}, size={}", market, fileName, fileBytes.length);
            return UploadDeleteTemplateResponse.uploadSuccess(fileName, market);
        } catch (IOException e) {
            logger.error("文件上传失败: {}", e.getMessage(), e);
            return UploadDeleteTemplateResponse.fail("文件上传失败: " + e.getMessage());
        }
    }

    @Override
    public UploadDeleteTemplateResponse delete(UploadDeleteTemplateRequest request) {
        // 1. 参数校验
        if (request == null) {
            return UploadDeleteTemplateResponse.fail("请求参数不能为空");
        }

        String market = request.getMarket();
        String templateName = request.getTemplateName();

        if (StringUtils.isBlank(market)) {
            return UploadDeleteTemplateResponse.fail("Market不能为空");
        }

        if (StringUtils.isBlank(templateName)) {
            return UploadDeleteTemplateResponse.fail("TemplateName不能为空");
        }

        // 2. 构建文件路径
        String uploadDir = UPLOAD_BASE_PATH + File.separator + market;
        File directory = new File(uploadDir);

        if (!directory.exists() || !directory.isDirectory()) {
            logger.warn("目录不存在: {}", uploadDir);
            return UploadDeleteTemplateResponse.fail("Market目录不存在");
        }

        // 3. 查找并删除符合条件的文件
        File[] files = directory.listFiles((dir, name) -> name.equals(templateName));

        if (files == null || files.length == 0) {
            logger.warn("未找到匹配的文件: market={}, templateName={}", market, templateName);
            return UploadDeleteTemplateResponse.fail("未找到匹配的模板文件");
        }

        int deletedCount = 0;
        for (File file : files) {
            if (file.delete()) {
                deletedCount++;
                logger.info("文件删除成功: {}", file.getAbsolutePath());
            } else {
                logger.error("文件删除失败: {}", file.getAbsolutePath());
            }
        }

        if (deletedCount > 0) {
            return UploadDeleteTemplateResponse.deleteSuccess(market, templateName);
        } else {
            return UploadDeleteTemplateResponse.fail("文件删除失败");
        }
    }

    @Override
    public UploadDeleteTemplateResponse getMarkets() {
        try {
            // 1. 从数据库查询所有Market名称
            List<MarketMaster> marketMasters = marketMapper.findAllMarkets();

            // 2. 提取Market名称列表
            List<String> markets = new ArrayList<>();
            if (marketMasters != null && !marketMasters.isEmpty()) {
                for (MarketMaster marketMaster : marketMasters) {
                    if (StringUtils.isNotBlank(marketMaster.getMarket())) {
                        markets.add(marketMaster.getMarket());
                    }
                }
            }

            logger.info("获取Market列表成功，共{}个", markets.size());
            return UploadDeleteTemplateResponse.getMarketsSuccess(markets);
        } catch (Exception e) {
            logger.error("获取Market列表失败: {}", e.getMessage(), e);
            return UploadDeleteTemplateResponse.fail("获取Market列表失败: " + e.getMessage());
        }
    }

    @Override
    public UploadDeleteTemplateResponse getTemplates(String market) {
        // 1. 参数校验
        if (StringUtils.isBlank(market)) {
            return UploadDeleteTemplateResponse.fail("Market不能为空");
        }

        try {
            // 2. 构建文件路径
            String uploadDir = UPLOAD_BASE_PATH + File.separator + market;
            File directory = new File(uploadDir);

            // 3. 检查目录是否存在
            if (!directory.exists() || !directory.isDirectory()) {
                logger.warn("目录不存在: {}", uploadDir);
                // 返回空列表而不是错误
                return UploadDeleteTemplateResponse.getTemplatesSuccess(market, new ArrayList<>());
            }

            // 4. 获取目录下所有文件名称
            File[] files = directory.listFiles();
            List<String> templateNames = new ArrayList<>();

            if (files != null) {
                for (File file : files) {
                    if (file.isFile()) {
                        templateNames.add(file.getName());
                    }
                }
            }

            logger.info("获取Market[{}]的模板列表成功，共{}个", market, templateNames.size());
            return UploadDeleteTemplateResponse.getTemplatesSuccess(market, templateNames);
        } catch (Exception e) {
            logger.error("获取模板列表失败: {}", e.getMessage(), e);
            return UploadDeleteTemplateResponse.fail("获取模板列表失败: " + e.getMessage());
        }
    }
}
