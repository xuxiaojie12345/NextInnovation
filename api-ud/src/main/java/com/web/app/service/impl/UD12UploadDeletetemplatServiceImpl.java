package com.web.app.service.impl;

import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD12UploadDeletetemplatService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

/**
 * UD12_UploadDeletetemplat 服务实现类
 */
@Service
public class UD12UploadDeletetemplatServiceImpl implements UD12UploadDeletetemplatService {

    private static final Logger logger = LogManager.getLogger(UD12UploadDeletetemplatServiceImpl.class);

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Value("${app.template.upload.path:./templates}")
    private String uploadPath;

    @Override
    public List<Map<String, Object>> selectMarketMaster() {
        logger.info("查询市场列表");
        return marketMasterMapper.selectAllMarkets();
    }

    @Override
    public void uploadFile(String market, String fileName, byte[] fileContent) {
        logger.info("上传文件，market: {}, fileName: {}", market, fileName);
        try {
            Path marketDir = Paths.get(uploadPath, market);
            if (!Files.exists(marketDir)) {
                Files.createDirectories(marketDir);
            }
            Path targetPath = marketDir.resolve(fileName);
            Files.write(targetPath, fileContent);
            logger.info("文件上传成功: {}", targetPath);
        } catch (IOException e) {
            logger.error("文件上传失败", e);
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String market, String template) {
        logger.info("删除文件，market: {}, template: {}", market, template);
        try {
            Path targetPath = Paths.get(uploadPath, market, template);
            Files.deleteIfExists(targetPath);
            logger.info("文件删除成功: {}", targetPath);
        } catch (IOException e) {
            logger.error("文件删除失败", e);
            throw new RuntimeException("File delete failed: " + e.getMessage());
        }
    }
}
