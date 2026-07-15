package com.web.app.service.impl;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD14SearchresultistMapper;
import com.web.app.service.UD14SearchresultistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * UD14 搜索结果列表服务实现类
 *
 * 功能说明：实现市场列表和变量搜索的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD14SearchresultistServiceImpl implements UD14SearchresultistService {

    @Autowired
    private UD14SearchresultistMapper ud14Mapper;

    @Value("${file.marketFolder}")
    private String marketFolder;

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
    @Override
    public synchronized void authenticateIfNeeded() {
        if (authenticated)
            return;
        try {
            // 从 marketFolder 中提取 UNC 根路径
            String normalized = marketFolder.replace('\\', '/');
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
    public UD14SearchresultistResponse UD14SelectMarketmaster() {
        try {
            List<MarketMaster> list = ud14Mapper.selectAllMarket();
            List<UD14SearchresultistResponse.MarketData> dataList = new ArrayList<>();
            if (list != null) {
                for (MarketMaster mm : list) {
                    dataList.add(new UD14SearchresultistResponse.MarketData(mm.getMarket()));
                }
            }
            return UD14SearchresultistResponse.success("查询成功", dataList);
        } catch (Exception e) {
            return UD14SearchresultistResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD14SearchresultistResponse UD14SelectHdocuserdefinedrules(UD14SearchresultistRequest request) {
        try {
            if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                return UD14SearchresultistResponse.error(400, "市场参数不能为空");
            }

            List<String> variableList = ud14Mapper.selectVariableByMarket(request.getMarket().trim());

            if (variableList == null || variableList.isEmpty()) {
                return UD14SearchresultistResponse.error(404, "可能有记录不存在");
            }

            List<UD14SearchresultistResponse.VariableData> dataList = new ArrayList<>();
            for (String var : variableList) {
                dataList.add(new UD14SearchresultistResponse.VariableData(var));
            }

            return UD14SearchresultistResponse.success("查询成功", dataList);
        } catch (Exception e) {
            return UD14SearchresultistResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD14SearchresultistResponse getMarketFiles(UD14SearchresultistRequest request) {
        authenticateIfNeeded();
        try {
            if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                return UD14SearchresultistResponse.error(400, "市场参数不能为空");
            }

            String market = request.getMarket().trim();
            // 构建market文件夹路径
            String marketDirPath = marketFolder + File.separator + market;
            File marketDir = new File(marketDirPath);

            // 检查文件夹是否存在
            if (!marketDir.exists() || !marketDir.isDirectory()) {
                return UD14SearchresultistResponse.error(404, "Market文件夹不存在");
            }

            // 读取文件夹下的所有文件
            File[] files = marketDir.listFiles();
            List<UD14SearchresultistResponse.FileData> fileDataList = new ArrayList<>();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

            if (files != null) {
                for (File file : files) {
                    if (file.isFile()) {
                        String filename = file.getName();

                        // 根据市场和文件名查询HDOC_USER_DEFINED_RULES表
                        // SQL条件：MARKET = #{market} AND VAL = #{market}/{fileName}
                        String variable = ud14Mapper.selectVariableByMarketAndFile(market, filename);
                        boolean isUsed = (variable != null);

                        // 格式化文件大小
                        String size = formatFileSize(file.length());
                        // 格式化最后修改时间
                        String lastMod = sdf.format(new Date(file.lastModified()));

                        fileDataList.add(new UD14SearchresultistResponse.FileData(
                                filename, isUsed, variable, lastMod, size));
                    }
                }
            }

            return UD14SearchresultistResponse.success("查询成功", fileDataList);
        } catch (Exception e) {
            return UD14SearchresultistResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    /**
     * 格式化文件大小
     * 自动转换为B、KB、MB等单位
     *
     * @param bytes 文件字节数
     * @return 格式化后的大小字符串
     */
    private String formatFileSize(long bytes) {
        if (bytes <= 0)
            return "0 B";
        final String[] units = { "B", "KB", "MB", "GB" };
        int unitIndex = 0;
        double size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return String.format("%.1f %s", size, units[unitIndex]);
    }
}
