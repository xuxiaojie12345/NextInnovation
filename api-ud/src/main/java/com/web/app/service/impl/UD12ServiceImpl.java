package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.UD12Mapper;
import com.web.app.service.UD12Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * UD12 Service Implementation
 * 实现市场列表获取、模板文件上传/删除业务逻辑
 */
@Service
public class UD12ServiceImpl implements UD12Service {

    @Autowired
    private UD12Mapper ud12Mapper;

    /**
     * 模板文件存储根目录
     */
    @Value("${template.upload.dir:/data/templates}")
    private String uploadDir;

    @Override
    public ApiResponse<?> getMarketList() {

        try {
            // 查询市场列表
            List<MarketMaster> marketList = ud12Mapper.selectMarketMaster();
            // 只返回 market 字段
            List<Map<String, String>> dataList = marketList.stream().map(m -> {
                Map<String, String> item = new HashMap<>();
                item.put("market", m.getMarket());
                return item;
            }).collect(Collectors.toList());

            return ApiResponse.success("获取市场列表成功", dataList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> getTemplateFiles(String marketCode) {

        try {
            if (marketCode == null || marketCode.trim().isEmpty()) {
                return ApiResponse.error(400, "市场代码不能为空");
            }

            // 构建市场文件夹路径
            File baseDir = new File(uploadDir);
            File marketDir = new File(baseDir, marketCode.trim());


            if (!marketDir.exists() || !marketDir.isDirectory()) {

                return ApiResponse.success("获取模板文件列表成功", new ArrayList<>());
            }

            // 获取文件夹下的所有文件
            File[] files = marketDir.listFiles(File::isFile);
            List<Map<String, String>> fileList = new ArrayList<>();
            if (files != null) {
                for (File f : files) {
                    Map<String, String> item = new HashMap<>();
                    item.put("fileName", f.getName());
                    item.put("filePath", f.getAbsolutePath());
                    fileList.add(item);
                }
            }

            return ApiResponse.success("获取模板文件列表成功", fileList);

        } catch (Exception e) {

            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> uploadFile(MultipartFile file, String market) {

        try {
            // 验证文件
            if (file == null || file.isEmpty()) {
                return ApiResponse.error(400, "请选择要上传的文件");
            }

            // 验证市场
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error(400, "市场代码不能为空");
            }

            // 验证文件类型
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                return ApiResponse.error(400, "文件名不能为空");
            }

            // 验证文件大小（50MB以内）
            if (file.getSize() > 50 * 1024 * 1024) {
                return ApiResponse.error(400, "文件大小不能超过50MB");
            }

            // 构建市场文件夹路径
            String marketTrimmed = market.trim();
            // 使用File类处理路径，兼容Windows UNC路径
            File baseDir = new File(uploadDir);
            File marketDir = new File(baseDir, marketTrimmed);

            // 确保目录存在
            if (!marketDir.exists()) {
                marketDir.mkdirs();
            }

            // 保存文件
            File targetFile = new File(marketDir, originalFilename);
            file.transferTo(targetFile);

            // 构建响应
            Map<String, Object> data = new HashMap<>();
            data.put("fileName", originalFilename);
            data.put("market", market.trim());
            data.put("success", true);
            data.put("message", "TEMPLATE " + originalFilename + " WAS SUCESSFULLY UPLOADED TO MARKET " + market.trim());

            return ApiResponse.success("上传成功", data);

        } catch (IOException e) {
            return ApiResponse.error(500, "文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> deleteFile(String market, String fileName) {

        try {
            // 验证参数
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error(400, "市场代码不能为空");
            }
            if (fileName == null || fileName.trim().isEmpty()) {
                return ApiResponse.error(400, "文件名不能为空");
            }

            // 构建文件路径
            File baseDir = new File(uploadDir);
            File marketDir = new File(baseDir, market.trim());
            File targetFile = new File(marketDir, fileName.trim());

            // 验证文件是否存在
            if (!targetFile.exists()) {
                return ApiResponse.error(400, "文件不存在");
            }

            if (!targetFile.isFile()) {
                return ApiResponse.error(400, "路径不是文件");
            }

            // 删除文件
            boolean deleted = targetFile.delete();
            if (!deleted) {
                return ApiResponse.error(500, "文件删除失败");
            }

            // 构建响应
            Map<String, Object> data = new HashMap<>();
            data.put("fileName", fileName.trim());
            data.put("market", market.trim());
            data.put("success", true);
            data.put("message", "TEMPLATE " + fileName.trim() + " WAS SUCESSFULLY DELETE FROM MARKET " + market.trim());

            return ApiResponse.success("删除成功", data);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public Resource downloadFile(String market, String fileName) {
        File file = new File(new File(uploadDir, market), fileName);
        if (!file.exists() || !file.isFile()) {
            return null;
        }
        return new FileSystemResource(file);
    }

    @Override
    public String getUploadDir() {
        return uploadDir;
    }
}
