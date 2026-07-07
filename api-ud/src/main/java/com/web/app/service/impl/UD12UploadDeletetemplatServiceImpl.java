package com.web.app.service.impl;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD12UploadDeletetemplatMapper;
import com.web.app.service.UD12UploadDeletetemplatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UD12 上传删除模板服务实现类
 *
 * 功能说明：实现模板上传、删除及市场列表查询的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD12UploadDeletetemplatServiceImpl implements UD12UploadDeletetemplatService {

    @Autowired
    private UD12UploadDeletetemplatMapper ud12Mapper;

    @Value("${file.marketFolder}")
    private String uploadFolder;

    @Override
    public UD12UploadDeletetemplatResponse selectMarket() {
        log.info("开始UD12查询市场列表");
        try {
            List<MarketMaster> list = ud12Mapper.selectAllMarket();
            List<UD12UploadDeletetemplatResponse.MarketData> dataList = new ArrayList<>();
            if (list != null) {
                for (MarketMaster mm : list) {
                    dataList.add(new UD12UploadDeletetemplatResponse.MarketData(mm.getMarket()));
                }
            }
            log.info("UD12查询市场列表成功，共 {} 条", dataList.size());
            return UD12UploadDeletetemplatResponse.success("查询成功", dataList);
        } catch (Exception e) {
            log.error("UD12查询市场列表失败", e);
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse uploadFile(MultipartFile file, String market) {
        log.info("开始UD12上传文件, market: {}, fileName: {}", market, file.getOriginalFilename());
        try {
            String originalFilename = file.getOriginalFilename();

            // 构建上传目录路径
            String marketDir = uploadFolder + File.separator + market.trim();
            File directory = new File(marketDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // 保存文件
            String filePath = marketDir + File.separator + originalFilename;
            Path targetPath = Paths.get(filePath);
            Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // 构建响应数据
            String serverPath = "/hdoc/template/upload/" + market.trim() + "/" + originalFilename;
            UD12UploadDeletetemplatResponse.UploadFileData uploadData = new UD12UploadDeletetemplatResponse.UploadFileData(
                    originalFilename, market.trim(), serverPath);

            String msg = "TEMPLATE " + originalFilename + " WAS SUCESSFULLY UPLOADED TO MARKET " + market.trim();

            log.info("UD12上传文件成功, path: {}", serverPath);
            return UD12UploadDeletetemplatResponse.success(msg, uploadData);
        } catch (IOException e) {
            log.error("UD12上传文件IO异常", e);
            return UD12UploadDeletetemplatResponse.error(500, "文件上传失败，请稍后重试");
        } catch (Exception e) {
            log.error("UD12上传文件失败", e);
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse deleteFile(UD12UploadDeletetemplatRequest request) {
        log.info("开始UD12删除文件, market: {}, template: {}", request.getMarket(), request.getTemplate());
        try {
            // 构建文件路径
            String filePath = uploadFolder + File.separator + request.getMarket().trim()
                    + File.separator + request.getTemplate().trim();
            File file = new File(filePath);

            // 检查文件是否存在
            if (!file.exists()) {
                log.warn("UD12删除文件失败 - 文件不存在, path: {}", filePath);
                return UD12UploadDeletetemplatResponse.error(404, "文件不存在");
            }

            // 删除文件
            boolean deleted = file.delete();
            if (!deleted) {
                log.warn("UD12删除文件失败 - 文件删除操作失败, path: {}", filePath);
                return UD12UploadDeletetemplatResponse.error(500, "文件删除失败");
            }

            UD12UploadDeletetemplatResponse.DeleteFileData deleteData = new UD12UploadDeletetemplatResponse.DeleteFileData(
                    request.getTemplate().trim(), request.getMarket().trim());

            String msg = "TEMPLATE " + request.getTemplate().trim()
                    + " WAS SUCESSFULLY DELETE FROM MARKET " + request.getMarket().trim();

            log.info("UD12删除文件成功");
            return UD12UploadDeletetemplatResponse.success(msg, deleteData);
        } catch (Exception e) {
            log.error("UD12删除文件失败", e);
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse getTemplateList(String market) {
        log.info("开始UD12查询模板文件列表, market: {}", market);
        try {
            // 构建market文件夹路径
            String marketDirPath = uploadFolder + File.separator + market.trim();
            File marketDir = new File(marketDirPath);

            // 检查文件夹是否存在
            if (!marketDir.exists() || !marketDir.isDirectory()) {
                log.warn("UD12市场文件夹不存在: {}", marketDirPath);
                return UD12UploadDeletetemplatResponse.success("查询成功", new ArrayList<>());
            }

            // 获取文件夹下的所有文件名
            File[] files = marketDir.listFiles();
            List<String> fileNames = new ArrayList<>();
            if (files != null) {
                fileNames = Arrays.stream(files)
                        .filter(File::isFile)
                        .map(File::getName)
                        .sorted()
                        .collect(Collectors.toList());
            }

            log.info("UD12查询模板文件列表成功，共 {} 个文件", fileNames.size());
            return UD12UploadDeletetemplatResponse.success("查询成功", fileNames);
        } catch (Exception e) {
            log.error("UD12查询模板文件列表失败", e);
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
