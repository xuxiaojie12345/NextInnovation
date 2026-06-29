package com.web.app.service.impl;

import com.web.app.dto.UD12UploadDeleteTemplateResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD12UploadDeleteTemplateMapper;
import com.web.app.service.UD12UploadDeleteTemplateService;
import com.web.app.tool.SvnUtil;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * UD12 Upload&Delete Template 业务逻辑实现
 * 
 * 核心逻辑：
 * - getMarkets：从数据库 MARKET_MASTER 获取市场列表
 * - uploadFile：通过 SVN 工具类将文件上传到指定 Market 文件夹
 * - getFileList：通过 SVN 工具类获取指定 Market 下的所有文件
 * - deleteFile：通过 SVN 工具类删除指定 Market 下的文件
 */
@Service
public class UD12UploadDeleteTemplateServiceImpl implements UD12UploadDeleteTemplateService {

    private static final Logger logger = LogManager.getLogger(UD12UploadDeleteTemplateServiceImpl.class);

    @Autowired
    private UD12UploadDeleteTemplateMapper ud12UploadDeleteTemplateMapper;

    @Autowired
    private SvnUtil svnUtil;

    @Override
    public UD12UploadDeleteTemplateResponse getMarkets() {
        try {
            // 从数据库获取市场列表
            List<MarketMaster> marketMasters = ud12UploadDeleteTemplateMapper.getAllMarkets();

            // 转换为前端所需的格式：data 数组包含 market 字段
            List<Map<String, Object>> marketList = new ArrayList<>();
            for (MarketMaster mm : marketMasters) {
                Map<String, Object> item = new HashMap<>();
                item.put("market", mm.getMarket());
                marketList.add(item);
            }

            return UD12UploadDeleteTemplateResponse.success(marketList);
        } catch (Exception e) {
            logger.error("Failed to load markets: {}", e.getMessage());
            return UD12UploadDeleteTemplateResponse.fail("Failed to load markets");
        }
    }

    @Override
    public UD12UploadDeleteTemplateResponse uploadFile(MultipartFile file, String market) {
        // 参数校验
        if (file == null || file.isEmpty()) {
            return UD12UploadDeleteTemplateResponse.fail("NO FILE UPLOADED");
        }
        if (market == null || market.trim().isEmpty()) {
            return UD12UploadDeleteTemplateResponse.fail("Please select a market");
        }

        // 文件大小校验（前端已校验，后端做二次校验）
        long maxSize = 10 * 1024 * 1024L; // 10MB
        if (file.getSize() > maxSize) {
            return UD12UploadDeleteTemplateResponse.fail("The file exceeds 10MB, please select again");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                originalFilename = "unknown_file";
            }

            // 通过 SVN 工具类上传文件
            svnUtil.uploadFile(market.trim(), file.getInputStream(), originalFilename);

            logger.info("File uploaded successfully: {} to market {}", originalFilename, market);
            return UD12UploadDeleteTemplateResponse.success("success", null);
        } catch (Exception e) {
            logger.error("Failed to upload file to market {}: {}", market, e.getMessage());
            return UD12UploadDeleteTemplateResponse.fail("File upload faile");
        }
    }

    @Override
    public UD12UploadDeleteTemplateResponse getFileList(String market) {
        // 参数校验
        if (market == null || market.trim().isEmpty()) {
            return UD12UploadDeleteTemplateResponse.fail("Market is required");
        }

        try {
            // 通过 SVN 工具类获取文件列表
            List<String> files = svnUtil.listFiles(market.trim());

            // 转换为前端所需格式
            List<Map<String, Object>> fileList = new ArrayList<>();
            for (String fileName : files) {
                Map<String, Object> item = new HashMap<>();
                item.put("File", fileName);
                fileList.add(item);
            }

            return UD12UploadDeleteTemplateResponse.success(fileList);
        } catch (Exception e) {
            logger.error("Failed to load file list for market {}: {}", market, e.getMessage());
            return UD12UploadDeleteTemplateResponse.fail("Failed to load templates");
        }
    }

    @Override
    public UD12UploadDeleteTemplateResponse deleteFile(String templateFile, String market) {
        // 参数校验
        if (market == null || market.trim().isEmpty()) {
            return UD12UploadDeleteTemplateResponse.fail("Please select a market");
        }
        if (templateFile == null || templateFile.trim().isEmpty()) {
            return UD12UploadDeleteTemplateResponse.fail("Please select a template file");
        }

        try {
            // 通过 SVN 工具类删除文件
            svnUtil.deleteFile(market.trim(), templateFile.trim());

            logger.info("File deleted successfully: {} from market {}", templateFile, market);
            return UD12UploadDeleteTemplateResponse.success("success", null);
        } catch (Exception e) {
            logger.error("Failed to delete file {} from market {}: {}", templateFile, market, e.getMessage());

            // 根据异常类型返回不同消息
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains("File not found")) {
                return UD12UploadDeleteTemplateResponse.fail("Failed to delete file: File not found");
            }
            return UD12UploadDeleteTemplateResponse.fail("File delete faile");
        }
    }
}
