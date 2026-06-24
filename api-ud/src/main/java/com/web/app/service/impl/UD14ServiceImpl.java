package com.web.app.service.impl;

import com.web.app.mapper.UD14Mapper;
import com.web.app.service.UD14Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * UD14SearchresultistApi 服务实现类
 * 对应全体APIのプロンプト.txt 【UD14SearchresultistApi】
 */
@Service
public class UD14ServiceImpl implements UD14Service {

    private static final Logger logger = LoggerFactory.getLogger(UD14ServiceImpl.class);

    @Autowired
    private UD14Mapper ud14Mapper;

    @Override
    public Map<String, Object> selectMarketMaster() {
        List<Map<String, String>> markets = ud14Mapper.selectAllMarketMaster().stream()
                .map(m -> {
                    Map<String, String> map = new LinkedHashMap<>();
                    map.put("market", m.getMarket());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("markets", markets);
        result.put("totalCount", markets.size());
        return result;
    }

    @Override
    public Map<String, Object> selectHdocUserDefinedRules(String market) {
        List<Map<String, Object>> fileList = new ArrayList<>();

        // 返回固定值 deepseek01.txt~deepseek10.txt（对应文档 4.9）
        for (int i = 1; i <= 10; i++) {
            String fileName = "deepseek" + String.format("%02d", i) + ".txt";
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("filename", fileName);
            item.put("lastModified", "2024-01-01 12:00");
            item.put("size", (100 + i) + " Kb");
            item.put("downloadUrl", "/download/templates/" + market + "/" + fileName);

            // 查询该文件是否被引用
            int refCount = ud14Mapper.countByMarketAndFileName(market, market + "/" + fileName);
            item.put("used", refCount > 0 ? "TEMPLATE-VIN-PLATE" : "");

            fileList.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("files", fileList);
        result.put("totalCount", fileList.size());
        return result;
    }
}
