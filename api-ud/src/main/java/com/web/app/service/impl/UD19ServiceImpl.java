package com.web.app.service.impl;

import com.web.app.domain.UD19Request;
import com.web.app.mapper.UD19Mapper;
import com.web.app.service.UD19Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UD19ServiceImpl implements UD19Service {

    private static final Logger logger = LoggerFactory.getLogger(UD19ServiceImpl.class);

    @Autowired
    private UD19Mapper ud19Mapper;

    @Override
    public Map<String, Object> searchUser(UD19Request request) {
        switch (request.getOperation()) {
            case "GET_MARKET_LIST":
                return handleGetMarketList();
            case "SEARCH_USER":
                return handleSearchUser(request);
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
    }

    private Map<String, Object> handleGetMarketList() {
        List<Map<String, String>> markets = ud19Mapper.selectAllMarkets();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("markets", markets);
        result.put("count", markets.size());
        return result;
    }

    private Map<String, Object> handleSearchUser(UD19Request request) {
        List<Map<String, Object>> results;
        String userId = request.getUserid();
        String user = request.getUser();
        String market = request.getMarket();
        String type = request.getType();

        // 所有条件独立传入，由 MyBatis 动态 SQL 组合过滤
        results = ud19Mapper.searchUsers(userId, user, market, type);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("results", results != null ? results : new ArrayList<>());
        result.put("count", results != null ? results.size() : 0);
        return result;
    }
}
