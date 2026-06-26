package com.web.app.service.impl;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD14SearchresultistMapper;
import com.web.app.service.UD14SearchresultistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
}
