package com.web.app.service.impl;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD19SearchResultListMapper;
import com.web.app.service.UD19SearchResultListService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * UD19 用户搜索结果列表服务实现类
 *
 * 功能说明：实现市场列表查询和用户搜索的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD19SearchResultListServiceImpl implements UD19SearchResultListService {

    @Autowired
    private UD19SearchResultListMapper ud19Mapper;

    @Override
    public UD19SearchResultListResponse getMarket() {
        try {
            List<MarketMaster> list = ud19Mapper.selectAllMarket();
            List<UD19SearchResultListResponse.MarketData> dataList = new ArrayList<>();
            if (list != null) {
                for (MarketMaster mm : list) {
                    dataList.add(new UD19SearchResultListResponse.MarketData(
                            mm.getMarket(), mm.getDescription()));
                }
            }
            return UD19SearchResultListResponse.success("查询成功", dataList);
        } catch (Exception e) {
            return UD19SearchResultListResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD19SearchResultListResponse search(UD19SearchResultListRequest request) {
        try {
            List<UD19SearchResultListResponse.UserData> userList = ud19Mapper.searchUsers(
                    request.getUserId(),
                    request.getUsername(),
                    request.getMarket(),
                    request.getType());

            if (userList == null || userList.isEmpty()) {
                return UD19SearchResultListResponse.error(404, "未找到匹配的用户");
            }

            UD19SearchResultListResponse.SearchResultData resultData = new UD19SearchResultListResponse.SearchResultData();
            resultData.setCount(userList.size());
            resultData.setDatatable(userList);

            return UD19SearchResultListResponse.success("查询成功", resultData);
        } catch (Exception e) {
            return UD19SearchResultListResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
