package com.web.app.service.impl;

import com.web.app.exception.BusinessException;
import com.web.app.dto.response.TemplateFileInfoResponse;
import com.web.app.service.FileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FileServiceImpl implements FileService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /** 上传根目录（绝对路径），基于后端启动工作目录解析，避免 transferTo 相对路径解析到 Tomcat 临时目录 */
    private Path baseDir() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public void uploadFile(MultipartFile file, String market) {
        if (file.isEmpty()) {
            throw new BusinessException(400, "File is empty");
        }
        try {
            Path marketDir = baseDir().resolve(market);
            if (!Files.exists(marketDir)) {
                Files.createDirectories(marketDir);
            }
            // 路径遍历防护：拒绝含 .. 的文件名
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
            if (filename.contains("..")) {
                throw new BusinessException(400, "File name is not allowed.");
            }
            Path targetPath = marketDir.resolve(filename).normalize();
            file.transferTo(targetPath.toFile());
        } catch (IOException e) {
            throw new BusinessException(500, "File upload failed: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String market, String fileName) {
        try {
            if (fileName != null && fileName.contains("..")) {
                throw new BusinessException(400, "File name is not allowed.");
            }
            Path targetPath = baseDir().resolve(market).resolve(fileName == null ? "" : fileName).normalize();
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            throw new BusinessException(500, "File deletion failed: " + e.getMessage());
        }
    }

    @Override
    public List<String> getTemplatesByMarket(String market) {
        Path marketDir = baseDir().resolve(market);
        if (!Files.exists(marketDir) || !Files.isDirectory(marketDir)) {
            return new ArrayList<>();
        }
        try (Stream<Path> stream = Files.list(marketDir)) {
            return stream
                .filter(Files::isRegularFile)
                .map(p -> p.getFileName().toString())
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new BusinessException(500, "Failed to list templates: " + e.getMessage());
        }
    }

    /**
     * UD14：列出 Market 文件夹下的模板文件并组装展示信息（filename/used/lastMod/size）。
     * @param market 市场（对应 uploads/{market}）
     * @param variables HDOC_USER_DEFINED_RULES 的 VARIABLE 列表，用于判断 Used
     */
    @Override
    public List<TemplateFileInfoResponse> getTemplateFileInfos(String market, List<String> variables) {
        Set<String> varSet = new HashSet<>();
        if (variables != null) {
            variables.forEach(v -> { if (v != null) varSet.add(v.toUpperCase(Locale.ROOT)); });
        }
        Path marketDir = baseDir().resolve(market);
        if (!Files.exists(marketDir) || !Files.isDirectory(marketDir)) {
            return new ArrayList<>();
        }
        List<TemplateFileInfoResponse> result = new ArrayList<>();
        try (Stream<Path> stream = Files.list(marketDir)) {
            List<Path> files = stream.filter(Files::isRegularFile).sorted(Comparator.comparing(p -> p.getFileName().toString()))
                .collect(Collectors.toList());
            for (Path p : files) {
                String filename = p.getFileName().toString();
                TemplateFileInfoResponse info = new TemplateFileInfoResponse();
                info.setFilename(filename);
                info.setUsed(computeUsed(filename, varSet));
                info.setLastMod(formatLastMod(p));
                info.setSize(formatFileSize(p));
                result.add(info);
            }
        } catch (IOException e) {
            throw new BusinessException(500, "Failed to list template files: " + e.getMessage());
        }
        return result;
    }

    /** 文件名 -> 变量候选：去扩展名、转大写、_ 与英文句点转连字符；在 varSet 中存在则用，否则 "-" */
    private String computeUsed(String filename, Set<String> varSet) {
        String base = filename;
        int dot = base.lastIndexOf('.');
        if (dot > 0) {
            base = base.substring(0, dot);
        }
        String candidate = base.toUpperCase(Locale.ROOT).replace('_', '-').replace('.', '-');
        return varSet.contains(candidate) ? candidate : "-";
    }

    /** 文件修改时间，格式化 yyyy-MM-dd HH:mm:ss */
    private String formatLastMod(Path p) {
        try {
            Date date = new Date(Files.getLastModifiedTime(p).toMillis());
            return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.ROOT).format(date);
        } catch (IOException e) {
            return "";
        }
    }

    /** 文件大小：<1KB -> "N Bytes"；1KB~1MB -> "N KB"；>=1MB -> "N MB"（两位小数） */
    private String formatFileSize(Path p) {
        long size;
        try {
            size = Files.size(p);
        } catch (IOException e) {
            size = 0;
        }
        if (size < 1024) {
            return size + " Bytes";
        } else if (size < 1024L * 1024) {
            return String.format(Locale.ROOT, "%.2f KB", size / 1024.0);
        } else {
            return String.format(Locale.ROOT, "%.2f MB", size / (1024.0 * 1024.0));
        }
    }
}
