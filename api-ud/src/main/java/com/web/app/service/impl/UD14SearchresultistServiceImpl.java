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

    @Override
    public UD14SearchresultistResponse selectMarketMaster() {
        log.info("开始UD14查询市场列表");
        try {
            List<MarketMaster> list = ud14Mapper.selectAllMarket();
            List<UD14SearchresultistResponse.MarketData> dataList = new ArrayList<>();
            if (list != null) {
                for (MarketMaster mm : list) {
                    dataList.add(new UD14SearchresultistResponse.MarketData(mm.getMarket()));
                }
            }
            log.info("UD14查询市场列表成功，共 {} 条", dataList.size());
            return UD14SearchresultistResponse.success("查询成功", dataList);
        } catch (Exception e) {
            log.error("UD14查询市场列表失败", e);
            return UD14SearchresultistResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD14SearchresultistResponse selectUserDefinedRules(UD14SearchresultistRequest request) {
        log.info("开始UD14查询用户定义规则变量, market: {}", request.getMarket());
        try {
            if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                return UD14SearchresultistResponse.error(400, "市场参数不能为空");
            }

            List<String> variableList = ud14Mapper.selectVariableByMarket(request.getMarket().trim());

            if (variableList == null || variableList.isEmpty()) {
                log.warn("UD14查询用户定义规则变量 - 未找到数据, market: {}", request.getMarket());
                return UD14SearchresultistResponse.error(404, "可能有记录不存在");
            }

            List<UD14SearchresultistResponse.VariableData> dataList = new ArrayList<>();
            for (String var : variableList) {
                dataList.add(new UD14SearchresultistResponse.VariableData(var));
            }

            log.info("UD14查询用户定义规则变量成功，共 {} 条", dataList.size());
            return UD14SearchresultistResponse.success("查询成功", dataList);
        } catch (Exception e) {
            log.error("UD14查询用户定义规则变量失败", e);
            return UD14SearchresultistResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD14SearchresultistResponse getMarketFiles(UD14SearchresultistRequest request) {
        log.info("开始UD14查询市场文件列表, market: {}", request.getMarket());
        try {
            if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                return UD14SearchresultistResponse.error(400, "市场参数不能为空");
            }

            String market = request.getMarket().trim();
            // 构建market文件夹路径
            String marketDirPath = marketFolder + market;
            File marketDir = new File(marketDirPath);

            // 检查文件夹是否存在
            if (!marketDir.exists() || !marketDir.isDirectory()) {
                log.warn("UD14市场文件夹不存在: {}", marketDirPath);
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

            log.info("UD14查询市场文件列表成功，共 {} 个文件", fileDataList.size());
            return UD14SearchresultistResponse.success("查询成功", fileDataList);
        } catch (Exception e) {
            log.error("UD14查询市场文件列表失败", e);
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
