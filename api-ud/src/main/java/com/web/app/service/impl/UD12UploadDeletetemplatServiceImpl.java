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

    @Value("${file.fileServerUsername}")
    private String fileServerUsername;

    @Value("${file.fileServerPassword}")
    private String fileServerPassword;

    /** 认证是否已成功的标记 */
    private boolean authenticated = false;

    /**
     * 认证文件服务器共享路径（懒加载，首次操作时调用）
     * 通过 net use 建立 UNC 路径的认证会话
     */
    private synchronized void authenticateIfNeeded() {
        if (authenticated)
            return;
        try {
            // 从 uploadFolder 中提取 UNC 根路径
            String normalized = uploadFolder.replace('\\', '/');
            String[] parts = normalized.split("/");
            String serverShare = "\\\\" + parts[2] + "\\" + parts[3];

            // 先尝试断开已有连接
            new ProcessBuilder("cmd.exe", "/c", "net use " + serverShare + " /delete /y")
                    .start().waitFor();

            // 建立新的认证连接
            Process process = new ProcessBuilder("cmd.exe", "/c",
                    "net use " + serverShare + " " + fileServerPassword + " /user:" + fileServerUsername)
                    .start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                authenticated = true;
            }
        } catch (Exception e) {
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse UD12SelectMarket() {
        try {
            List<MarketMaster> list = ud12Mapper.selectAllMarket();
            List<UD12UploadDeletetemplatResponse.MarketData> dataList = new ArrayList<>();
            if (list != null) {
                for (MarketMaster mm : list) {
                    dataList.add(new UD12UploadDeletetemplatResponse.MarketData(mm.getMarket()));
                }
            }
            return UD12UploadDeletetemplatResponse.success("查询成功", dataList);
        } catch (Exception e) {
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse UD12UploadFlie(MultipartFile file, String market) {
        authenticateIfNeeded();
        try {
            String originalFilename = file.getOriginalFilename();

            // 构建上传目录路径
            String marketDir = uploadFolder + File.separator + market.trim();
            File directory = new File(marketDir);
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                if (!created) {
                    return UD12UploadDeletetemplatResponse.error(500,
                            "无法创建目录，请确认服务器共享路径可访问: " + marketDir);
                }
            }
            // 确认目录有写权限
            if (!directory.canWrite()) {
                return UD12UploadDeletetemplatResponse.error(500,
                        "目录无写入权限，请检查共享路径权限: " + marketDir);
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

            return UD12UploadDeletetemplatResponse.success(msg, uploadData);
        } catch (IOException e) {
            return UD12UploadDeletetemplatResponse.error(500, "文件上传失败，请稍后重试");
        } catch (Exception e) {
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse UD12DeleteFlie(UD12UploadDeletetemplatRequest request) {
        authenticateIfNeeded();
        try {
            // 构建文件路径
            String filePath = uploadFolder + File.separator + request.getMarket().trim()
                    + File.separator + request.getTemplate().trim();
            File file = new File(filePath);

            // 检查文件是否存在
            if (!file.exists()) {
                return UD12UploadDeletetemplatResponse.error(404, "文件不存在");
            }

            // 删除文件
            boolean deleted = file.delete();
            if (!deleted) {
                return UD12UploadDeletetemplatResponse.error(500, "文件删除失败");
            }

            UD12UploadDeletetemplatResponse.DeleteFileData deleteData = new UD12UploadDeletetemplatResponse.DeleteFileData(
                    request.getTemplate().trim(), request.getMarket().trim());

            String msg = "TEMPLATE " + request.getTemplate().trim()
                    + " WAS SUCESSFULLY DELETE FROM MARKET " + request.getMarket().trim();

            return UD12UploadDeletetemplatResponse.success(msg, deleteData);
        } catch (Exception e) {
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD12UploadDeletetemplatResponse getTemplateList(String market) {
        authenticateIfNeeded();
        try {
            // 构建market文件夹路径
            String marketDirPath = uploadFolder + File.separator + market.trim();
            File marketDir = new File(marketDirPath);

            // 检查文件夹是否存在
            if (!marketDir.exists() || !marketDir.isDirectory()) {
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

            return UD12UploadDeletetemplatResponse.success("查询成功", fileNames);
        } catch (Exception e) {
            return UD12UploadDeletetemplatResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
